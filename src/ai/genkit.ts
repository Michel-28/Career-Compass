/**
 * @fileOverview Initializes and configures the Genkit AI instance.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(), // Defaults to the 'v1' stable API version
  ],
});
