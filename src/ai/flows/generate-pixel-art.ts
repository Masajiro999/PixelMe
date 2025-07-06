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
        text: `You are an expert pixel art converter. Your single most important task is to convert the provided image into a high-quality pixel art representation, in the style of a classic Famicom (8-bit) video game.

**CRITICAL INSTRUCTIONS (MUST BE FOLLOWED):**

1.  **PIXEL ART CONVERSION (ABSOLUTE REQUIREMENT):** The final output **MUST** be clean, stylized pixel art. It must look like it was created for a retro video game. This is the highest priority. Do not return a smooth, illustrated, or photorealistic image. It **MUST** be pixelated.

2.  **PRESERVE SILHOUETTE:** Strictly adhere to the silhouette, pose, and composition of the original input image. **DO NOT** change the person's pose, proportions, or add/remove major elements. The goal is to transform the *style*, not the *subject*.

3.  **STYLE & AESTHETICS:**
    *   **Style:** Famicom-style / 8-bit retro anime aesthetic.
    *   **Outline:** Apply subtle anti-aliasing *only to the outermost silhouette line* to make it appear smoother. The internal details of the character must remain sharp, blocky, and without anti-aliasing.
    *   **Color:** Use a soft, limited pastel color palette suitable for the 8-bit anime style.
    *   **Details:** Simplify details from the original photo (like clothing and hair) into the pixel art style.
    *   **Background:** The background **MUST** be transparent.

**NEGATIVE PROMPTS:** no realism, no photorealism, no smooth gradients (except for the silhouette anti-aliasing), no harsh shadows, no text, no artifacts, no extra objects, do not change the pose.`,
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
