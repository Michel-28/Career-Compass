
// src/ai/flows/question-generator.ts
'use server';
/**
 * @fileOverview A flow for generating interview questions based on a resume, job role, and a selected interview round.
 *
 * - generateInterviewQuestions - A function that generates interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInterviewQuestionsInputSchema = z.object({
  resume: z
    .string()
    .describe('The user resume as a string.'),
  jobRole: z.string().describe('The job role for which to generate questions.'),
  interviewRound: z.enum(['aptitude', 'group-discussion', 'hr']).describe("The selected interview round type."),
});
export type GenerateInterviewQuestionsInput = z.infer<
  typeof GenerateInterviewQuestionsInputSchema
>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  questions: z.array(z.string()).describe('An array of interview questions.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<
  typeof GenerateInterviewQuestionsOutputSchema
>;

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsInput
): Promise<GenerateInterviewQuestionsOutput> {
  return generateInterviewQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInterviewQuestionsPrompt',
  input: {schema: GenerateInterviewQuestionsInputSchema},
  output: {schema: GenerateInterviewQuestionsOutputSchema},
  prompt: `You are an expert interview question generator.

  Your task is to generate a list of relevant interview questions based on the user's resume, their target job role, and the specific interview round they are preparing for.

  Resume:
  {{{resume}}}

  Job Role:
  {{{jobRole}}}

  Interview Round: {{{interviewRound}}}

  Instructions based on the interview round:
  {{#if (eq interviewRound "aptitude")}}
  Generate 10 aptitude questions. These should test logical reasoning, quantitative aptitude, and problem-solving skills. They should be relevant to the job role but not require technical coding.
  {{/if}}
  {{#if (eq interviewRound "group-discussion")}}
  Generate 1 discussion topic. This should be a thought-provoking statement or question related to technology, workplace dynamics, or society that the candidate can discuss. Example topics include "Is AI a Threat or Opportunity?" or "Remote Work vs Onsite Work". Frame it as the topic for the group discussion.
  {{/if}}
  {{#if (eq interviewRound "hr")}}
  Generate 7 HR round questions. These should assess personality, behavior, situational responses, and cultural fit. Use the candidate's resume to ask at least one specific question about their past experiences or projects.
  {{/if}}

  Questions:`,
  // This is a workaround for handlebars not supporting complex expressions.
  // We are providing a custom helper to check for equality.
  // This can be removed once handlebars supports this natively.
  // See: https://github.com/handlebars-lang/handlebars.js/issues/1654
  helpers: {
    eq: (a: any, b: any) => a === b,
  },
});

const generateInterviewQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInterviewQuestionsFlow',
    inputSchema: GenerateInterviewQuestionsInputSchema,
    outputSchema: GenerateInterviewQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
