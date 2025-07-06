'use server';

/**
 * @fileOverview An AI agent that prepares an image for pixel art generation by isolating the subject and removing the background.
 *
 * - cropFaces - A function that handles the image preparation process.
 * - CropFacesInput - The input type for the cropFaces function.
 * - CropFacesOutput - The return type for the cropFaces function.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import {z} from 'genkit';

const CropFacesInputSchema = z.object({
  apiKey: z.string().describe('The Google AI API Key.'),
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
    .describe("A photo of the prepared image, as a data URI."),
});
export type CropFacesOutput = z.infer<typeof CropFacesOutputSchema>;

export async function cropFaces(input: CropFacesInput): Promise<CropFacesOutput> {
  const ai = genkit({ plugins: [googleAI({ apiKey: input.apiKey })] });

  const { media } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-preview-image-generation',
    prompt: [
      { media: { url: input.photoDataUri } },
      { text: 'You are an AI image processing expert. Your task is to prepare an image for use as a portrait. First, identify the primary person in the image. Then, remove the background, making it transparent. Finally, ensure the image has a 1:1 aspect ratio by adding transparent padding as needed, but do not crop the original image content. Center the resulting subject within the square frame. Return only the resulting image.' },
    ],
    config: {
      responseModalities: ['TEXT', 'IMAGE'],
    },
  });

  if (!media || !media.url) {
      throw new Error("Failed to process the image.");
  }

  return { croppedPhotoDataUri: media.url };
}