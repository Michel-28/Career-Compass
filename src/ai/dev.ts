import { config } from 'dotenv';
config();

import '@/ai/flows/generate-improvement-feedback.ts';
import '@/ai/flows/question-generator.ts';
import '@/ai/flows/personalized-learning-plan.ts';
import '@/ai/flows/answer-evaluator.ts';