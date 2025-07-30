/**
 * @fileOverview Initializes and aiconfigures the Genkit AI instance.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
// import {openAI} from 'genkit-plugin-openai';
import {config} from '@/lib/config';

export const ai = genkit({
  plugins: [
    googleAI(), // Automatically uses the GEMINI_API_KEY from .env
    // openAI({apiKey: config.openaiApiKey}), // Uses the key from our config file
  ],
});
