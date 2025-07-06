'use server';

/**
 * @fileOverview An AI agent that crops faces from an image.
 *
 * - cropFaces - A function that handles the face cropping process.
 * - CropFacesInput - The input type for the cropFaces function.
 * - CropFacesOutput - The return type for the cropFaces function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CropFacesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CropFacesInput = z.infer<typeof CropFacesInputSchema>;

const CropFacesOutputSchema = z.object({
  croppedPhotoDataUri: z
    .string()
    .describe("A photo of the cropped face, as a data URI."),
});
export type CropFacesOutput = z.infer<typeof CropFacesOutputSchema>;

export async function cropFaces(input: CropFacesInput): Promise<CropFacesOutput> {
  return cropFacesFlow(input);
}

const cropFacesFlow = ai.defineFlow(
  {
    name: 'cropFacesFlow',
    inputSchema: CropFacesInputSchema,
    outputSchema: CropFacesOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: 'You are an AI image processing expert. Identify the primary face in the image, then crop the image to show only the face with a 1:1 aspect ratio. Return only the cropped image without any other modifications.' },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (!media || !media.url) {
        throw new Error("Failed to crop face from image.");
    }

    return { croppedPhotoDataUri: media.url };
  }
);
