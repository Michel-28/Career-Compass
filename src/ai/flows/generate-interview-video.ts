'use server';

/**
 * @fileOverview A flow for generating a video of an AI interviewer asking a question.
 *
 * - generateInterviewVideo - A function that handles the video generation process.
 * - GenerateInterviewVideoInput - The input type for the generateInterviewVideo function.
 * - GenerateInterviewVideoOutput - The return type for the generateInterviewVideo function.
 */

import { ai } from '@/ai/genkit';
import { googleAI } from '@genkit-ai/googleai';
import { z } from 'genkit';
import { MediaPart } from 'genkit';

const GenerateInterviewVideoInputSchema = z.object({
  question: z.string().describe('The interview question to be asked in the video.'),
});
export type GenerateInterviewVideoInput = z.infer<typeof GenerateInterviewVideoInputSchema>;

const GenerateInterviewVideoOutputSchema = z.object({
  videoUrl: z.string().describe("The generated video as a data URI."),
});
export type GenerateInterviewVideoOutput = z.infer<typeof GenerateInterviewVideoOutputSchema>;

async function downloadVideoAsDataURI(video: MediaPart): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    // Add API key before fetching the video.
    const videoDownloadResponse = await fetch(
      `${video.media!.url}&key=${process.env.GEMINI_API_KEY}`
    );
    if (
      !videoDownloadResponse ||
      videoDownloadResponse.status !== 200 ||
      !videoDownloadResponse.body
    ) {
      throw new Error('Failed to fetch video');
    }
    
    const videoBuffer = await videoDownloadResponse.arrayBuffer();
    const base64 = Buffer.from(videoBuffer).toString('base64');
    const contentType = video.media?.contentType || 'video/mp4';

    return `data:${contentType};base64,${base64}`;
}


export async function generateInterviewVideo(input: GenerateInterviewVideoInput): Promise<GenerateInterviewVideoOutput> {
  return generateInterviewVideoFlow(input);
}

const generateInterviewVideoFlow = ai.defineFlow(
  {
    name: 'generateInterviewVideoFlow',
    inputSchema: GenerateInterviewVideoInputSchema,
    outputSchema: GenerateInterviewVideoOutputSchema,
  },
  async ({ question }) => {
    let { operation } = await ai.generate({
      model: googleAI.model('veo-2.0-generate-001'),
      prompt: `A professional and friendly AI interviewer in a modern, well-lit office setting looking directly at the camera. The interviewer is asking the following question: "${question}"`,
      config: {
        durationSeconds: 8,
        aspectRatio: '16:9',
        personGeneration: 'allow_adult',
      },
    });

    if (!operation) {
      throw new Error('Expected the model to return an operation');
    }

    // Wait until the operation completes.
    while (!operation.done) {
      operation = await ai.checkOperation(operation);
      // Sleep for 5 seconds before checking again.
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    if (operation.error) {
      throw new Error('Failed to generate video: ' + operation.error.message);
    }

    const video = operation.output?.message?.content.find((p) => !!p.media);
    if (!video) {
      throw new Error('Failed to find the generated video');
    }
    
    const videoDataUri = await downloadVideoAsDataURI(video);

    return { videoUrl: videoDataUri };
  }
);
