// src/lib/config.ts
import "server-only";

/**
 * This file is for securely handling and exporting environment variables 
 * for use in server-side code (like Genkit flows).
 * The "server-only" package ensures this module is never accidentally
 * imported into a client-side component.
 */

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  languageToolApiKey: process.env.LANGUAGETOOL_API_KEY,
  assemblyAiApiKey: process.env.ASSEMBLYAI_API_KEY,
  deepgramApiKey: process.env.DEEPGRAM_API_KEY,
};

// You can add validation here to ensure keys are present during startup
if (process.env.NODE_ENV !== 'development') {
    if (!config.openaiApiKey) {
        console.warn("Missing OPENAI_API_KEY. OpenAI-based features will fail.");
    }
    if (!config.languageToolApiKey) {
        console.warn("Missing LANGUAGETOOL_API_KEY. Grammar features may fail.");
    }
    // Add more checks as you integrate each service
}
