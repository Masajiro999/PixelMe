"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { UploadCloud, Download, Share2, Palette, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cropFaces } from '@/ai/flows/crop-faces';
import { generatePixelArt } from '@/ai/flows/generate-pixel-art';
import { useToast } from "@/hooks/use-toast";

type LoadingStep = 'idle' | 'cropping' | 'pixelating';

export function PixelMeClient() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [pixelArt, setPixelArt] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<LoadingStep>('idle');
  const [error, setError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setOriginalImage(result);
        setCroppedImage(null);
        setPixelArt(null);
        setError(null);
        setLoadingStep('cropping');
      };
      reader.readAsDataURL(file);
    }
  };
  
  const processImage = useCallback(async () => {
    if (loadingStep === 'cropping' && originalImage) {
      try {
        const { croppedPhotoDataUri } = await cropFaces({ photoDataUri: originalImage });
        setCroppedImage(croppedPhotoDataUri);
        setLoadingStep('pixelating');
      } catch (e) {
        console.error(e);
        setError('We could not process this image. Please try another photo with a clear subject.');
        setLoadingStep('idle');
      }
    } else if (loadingStep === 'pixelating' && croppedImage) {
      try {
        const { pixelArtDataUri } = await generatePixelArt({ photoDataUri: croppedImage });
        setPixelArt(pixelArtDataUri);
        setLoadingStep('idle');
      } catch (e) {
        console.error(e);
        setError('The pixel art generation failed. This can happen sometimes. Please try again.');
        setLoadingStep('idle');
      }
    }
  }, [originalImage, croppedImage, loadingStep]);

  useEffect(() => {
    if (loadingStep !== 'idle') {
      processImage();
    }
  }, [loadingStep, processImage]);

  const handleDownload = () => {
    if (!pixelArt) return;
    const link = document.createElement('a');
    link.href = pixelArt;
    link.download = 'pixel-me.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (!pixelArt || !navigator.share) return;
    setIsSharing(true);
    try {
      const response = await fetch(pixelArt);
      const blob = await response.blob();
      const file = new File([blob], 'pixel-me.png', { type: 'image/png' });
      
      await navigator.share({
        title: 'My Pixel Art Portrait',
        text: 'I created this with the PixelMe app!',
        files: [file],
      });
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
          variant: "destructive",
          title: "Sharing Failed",
          description: "An error occurred while trying to share the image.",
      });
    } finally {
        setIsSharing(false);
    }
  };

  const handleReset = () => {
    setOriginalImage(null);
    setCroppedImage(null);
    setPixelArt(null);
    setError(null);
    setLoadingStep('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const renderContent = () => {
    if (loadingStep !== 'idle') {
      const progressValue = loadingStep === 'cropping' ? 33 : 66;
      const loadingText = loadingStep === 'cropping' 
        ? "Isolating subject..."
        : "Creating your pixel portrait...";
        
      return (
        <div className="flex flex-col items-center justify-center text-center p-8 space-y-6 min-h-[300px]">
          <div className="relative w-48 h-48">
            <div className="absolute inset-0 border-4 border-dashed border-primary/30 rounded-full animate-spin"></div>
            {originalImage && <Image src={originalImage} alt="Processing" layout="fill" objectFit="cover" className="rounded-full p-2" />}
          </div>
          <Progress value={progressValue} className="w-full max-w-sm" />
          <p className="text-muted-foreground animate-pulse font-semibold">{loadingText}</p>
        </div>
      );
    }

    if (error) {
       return (
        <CardContent className="flex flex-col items-center p-8 min-h-[300px] justify-center">
          <Alert variant="destructive" className="mb-6 max-w-sm">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Oops! Something went wrong.</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleReset}><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
        </CardContent>
       );
    }
    
    if (pixelArt) {
      return (
        <CardContent className="flex flex-col items-center p-4 md:p-8">
          <div className="mb-6 bg-white p-2 rounded-lg shadow-inner" style={{ imageRendering: 'pixelated' }}>
            <Image src={pixelArt} alt="Generated Pixel Art" width={256} height={256} className="rounded-md" unoptimized />
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>
            {isClient && navigator.share && <Button onClick={handleShare} variant="secondary" disabled={isSharing}><Share2 className="mr-2 h-4 w-4" /> Share</Button>}
            <Button onClick={handleReset} variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Start Over</Button>
          </div>
        </CardContent>
      );
    }

    return (
      <CardContent className="flex flex-col items-center justify-center text-center p-8 md:p-12 min-h-[300px]">
        <div 
          onClick={handleFileSelect}
          className="w-full max-w-md cursor-pointer rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent transition-colors p-10 flex flex-col items-center space-y-4"
        >
          <UploadCloud className="h-16 w-16 text-primary" />
          <p className="font-semibold text-foreground text-lg">Click or drag to upload a photo</p>
          <p className="text-sm text-muted-foreground">We'll turn your selfie into a cute pixel art portrait!</p>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp"
          className="hidden"
        />
      </CardContent>
    );
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl shadow-primary/10 overflow-hidden rounded-2xl">
      <CardHeader className="text-center bg-card border-b p-6">
        <div className="flex justify-center items-center gap-3">
            <Palette className="h-8 w-8 text-primary" />
            <CardTitle className="text-4xl font-headline font-bold">PixelMe</CardTitle>
        </div>
        <CardDescription className="text-base">Transform your selfie into a cute pixel art portrait</CardDescription>
      </CardHeader>
      {renderContent()}
    </Card>
  );
}
