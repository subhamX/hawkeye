import { google } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';

// Initialize Google Gemini model
export const gemini = google('gemini-1.5-flash');

// Helper function for generating text with Gemini
export async function generateAIText(prompt: string) {
  const { text } = await generateText({
    model: gemini,
    prompt,
  });
  
  return text;
}

// Helper function for generating structured objects with Gemini
export async function generateAIObject<T>(
  prompt: string,
  schema: any
): Promise<T> {
  const { object } = await generateObject({
    model: gemini,
    prompt,
    schema,
  });
  
  return object as T;
}