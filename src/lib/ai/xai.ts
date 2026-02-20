import { createXai } from '@ai-sdk/xai';

if (!process.env.XAI_API_KEY) throw new Error('XAI_API_KEY environment variable is required');

const xai = createXai({
  apiKey: process.env.XAI_API_KEY,
});

// Grok 4.1 Fast with reasoning — thinks before responding for better quality
// Used for both coaching chat and plan extraction
export const COACH_K_MODEL = xai('grok-4-1-fast-reasoning');
export const EXTRACTION_MODEL = xai('grok-4-1-fast-reasoning');
