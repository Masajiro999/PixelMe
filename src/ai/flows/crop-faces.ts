'use server';

/**
 * @fileOverview An AI agent that prepares an image for pixel art generation by isolating the subject and removing the background.
 *
 * - cropFaces - A function that handles the image preparation process.
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
    .describe("A photo of the prepared image, as a data URI."),
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
        { text: 'You are an AI image processing expert. Identify the primary person in the image. Your task is to isolate this person. First, remove the background, making it transparent. Then, crop the image to frame the entire person (from head to toe if visible). Ensure the final image has a 1:1 aspect ratio by adding transparent padding if necessary, and center the person within this square frame. Return only the resulting image.' },
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
);
