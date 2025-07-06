'use server';

/**
 * @fileOverview Transforms a cropped image into a 128x128 pixel art portrait in a 'chibi' anime style with pastel colors.
 *
 * - generatePixelArt - A function that handles the pixel art generation process.
 * - GeneratePixelArtInput - The input type for the generatePixelArt function.
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
        text: `Convert this photo into a pixel art anime-style girl taking a selfie. Use chibi-like proportions with big sparkling eyes, soft rounded facial features, and smooth shoulder-length hair with subtle shading. Outfit should be a cute pajama top with colorful plus-sign patterns. Include a smartphone in her hand as she's taking a selfie. Use soft pastel tones and clean pixelated edges. Background should be minimal or white. Add a small floating heart near the face for a cute effect. Maintain a wholesome and cheerful vibe.`,
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
