import { createOpenAI } from '@ai-sdk/openai';

export const nebius = createOpenAI({
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY!,
});

// Use .chat() to force Chat Completions API — Nebius doesn't support OpenAI Responses API
export const COACH_K_MODEL = nebius.chat(process.env.NEBIUS_MODEL!);
export const BASE_LLAMA_MODEL = nebius.chat('meta-llama/Llama-3.3-70B-Instruct');
