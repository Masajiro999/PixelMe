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

const prompt = ai.definePrompt({
  name: 'cropFacesPrompt',
  input: {schema: CropFacesInputSchema},
  output: {schema: CropFacesOutputSchema},
  prompt: `You are an AI image processing expert. You will identify the face in the image, crop it, and return the cropped image as a data URI.

  The original image is here: {{media url=photoDataUri}}

  Return only the data URI of the cropped image.
  `,
});

const cropFacesFlow = ai.defineFlow(
  {
    name: 'cropFacesFlow',
    inputSchema: CropFacesInputSchema,
    outputSchema: CropFacesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
