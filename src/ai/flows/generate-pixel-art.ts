'use server';

/**
 * @fileOverview Transforms a cropped image into a 128x128 pixel art portrait in a 'chibi' anime style with pastel colors.
 *
 * - generatePixelArt - A function that handles the pixel art generation process.
 * - GeneratePixelArtInput - The input type for the generatePixelArt function.
 * - GeneratePixelArtOutput - The return type for the generatePixelArt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const GeneratePixelArtInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A cropped photo of a person's face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GeneratePixelArtInput = z.infer<typeof GeneratePixelArtInputSchema>;

const GeneratePixelArtOutputSchema = z.object({
  pixelArtDataUri: z
    .string()
    .describe('The generated pixel art as a data URI.'),
});
export type GeneratePixelArtOutput = z.infer<typeof GeneratePixelArtOutputSchema>;

export async function generatePixelArt(input: GeneratePixelArtInput): Promise<GeneratePixelArtOutput> {
  return generatePixelArtFlow(input);
}

const generatePixelArtPrompt = ai.definePrompt({
  name: 'generatePixelArtPrompt',
  input: {schema: GeneratePixelArtInputSchema},
  output: {schema: GeneratePixelArtOutputSchema},
  prompt: [
    {media: {url: '{{{photoDataUri}}}'}},
    {
      text: `Create a cute anime-style pixel art portrait of a young person, based on the provided image. Chibi proportions, big sparkling eyes, soft pastel color palette, smooth pixel shading, detailed hair, with expressive face. 128x128 resolution, retro 16-bit game character style, front-facing. Background simple or transparent.`,
    },
  ],
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
    responseModalities: ['TEXT', 'IMAGE'],
  },
});

const generatePixelArtFlow = ai.defineFlow(
  {
    name: 'generatePixelArtFlow',
    inputSchema: GeneratePixelArtInputSchema,
    outputSchema: GeneratePixelArtOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        {media: {url: input.photoDataUri}},
        {
          text: `Create a cute anime-style pixel art portrait of a young person, based on the provided image. Chibi proportions, big sparkling eyes, soft pastel color palette, smooth pixel shading, detailed hair, with expressive face. 128x128 resolution, retro 16-bit game character style, front-facing. Background simple or transparent.`,
        },
      ],
      config: {
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_ONLY_HIGH',
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE',
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_LOW_AND_ABOVE',
          },
        ],
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    return {pixelArtDataUri: media.url!};
  }
);
