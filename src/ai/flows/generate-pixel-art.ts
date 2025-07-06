'use server';

/**
 * @fileOverview Transforms a cropped image into a 128x128 pixel art portrait in a 'chibi' anime style with pastel colors.
 *
 * - generatePixelArt - A function that handles the pixel art generation process.
 * - GeneratePixelArtInput - The input type for the generatePixelart function.
 * - GeneratePixelArtOutput - The return type for the generatePixelArt function.
 */

import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';

const GeneratePixelArtInputSchema = z.object({
  apiKey: z.string().describe('The Google AI API Key.'),
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
export type GeneratePixelArtOutput = z.infer<
  typeof GeneratePixelArtOutputSchema
>;

export async function generatePixelArt(
  input: GeneratePixelArtInput
): Promise<GeneratePixelArtOutput> {
  const ai = genkit({ plugins: [googleAI({ apiKey: input.apiKey })] });

  const { media } = await ai.generate({
    model: 'googleai/gemini-2.0-flash-preview-image-generation',
    prompt: [
      { media: { url: input.photoDataUri } },
      {
        text: `You are a pixel art expert. Convert the provided image into a pixel art portrait.
- Style: The style should be clean and reminiscent of 16-bit video games.
- Colors: Use a limited, harmonious color palette.
- Details: Simplify complex details into the pixel art style naturally.
- Composition: Preserve the subject and overall composition of the original image. Do not add new elements.
- Background: The background must be transparent.
- Final Output: The result must be a pixelated image, not a smooth illustration.`,
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

  return { pixelArtDataUri: media.url! };
}
