
'use server';

/**
 * @fileOverview A flow to transcribe audio files into text using AssemblyAI.
 *
 * - transcribeAudio - A function that handles the audio transcription process.
 * - TranscribeAudioInput - The input type for the transcribeAudio function.
 * - TranscribeAudioOutput - The return type for the transcribeAudio function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import axios from 'axios';
import { config } from '@/lib/config';

const TranscribeAudioInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "The recorded interview session audio, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type TranscribeAudioInput = z.infer<typeof TranscribeAudioInputSchema>;

const TranscribeAudioOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text of the audio.'),
});
export type TranscribeAudioOutput = z.infer<typeof TranscribeAudioOutputSchema>;

export async function transcribeAudio(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
  return transcribeAudioWithAssemblyAI(input);
}


async function transcribeAudioWithAssemblyAI(
  input: TranscribeAudioInput
): Promise<TranscribeAudioOutput> {
  if (!config.assemblyAiApiKey) {
    throw new Error('AssemblyAI API key is not configured.');
  }

  try {
    // 1. Upload the audio file
    const uploadResponse = await axios.post(
      'https://api.assemblyai.com/v2/upload',
      Buffer.from(input.audioDataUri.split(',')[1], 'base64'),
      {
        headers: {
          'authorization': config.assemblyAiApiKey,
          'Content-Type': 'application/octet-stream',
        },
      }
    );

    const audio_url = uploadResponse.data.upload_url;

    // 2. Submit the transcription job
    const transcriptResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url },
      { headers: { authorization: config.assemblyAiApiKey } }
    );

    const transcriptId = transcriptResponse.data.id;

    // 3. Poll for the transcription result
    while (true) {
      const pollResponse = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptId}`,
        { headers: { authorization: config.assemblyAiApiKey } }
      );
      const transcriptData = pollResponse.data;

      if (transcriptData.status === 'failed') {
        throw new Error(`Transcription failed: ${transcriptData.error}`);
      }
      
      if (transcriptData.status === 'completed') {
        return { transcription: transcriptData.text || '' };
      }
      
      // Wait for 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error('Error with AssemblyAI transcription:', error);
    if (axios.isAxiosError(error)) {
        throw new Error(`AssemblyAI API error: ${error.response?.data?.error || error.message}`);
    }
    throw new Error('Failed to transcribe audio with AssemblyAI.');
  }
}
