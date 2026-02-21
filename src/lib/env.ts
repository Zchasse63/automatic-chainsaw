import { z } from 'zod';

/**
 * Validated environment variables.
 *
 * Server-side variables are checked lazily on first access so the module
 * can be imported during the Next.js build (where runtime secrets may not
 * exist).  Client-side `NEXT_PUBLIC_*` variables are validated eagerly
 * because they are inlined at build time and must always be present.
 */

// ---------- public (inlined at build) ----------
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const publicResult = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

if (!publicResult.success) {
  console.error('❌ Missing or invalid public env vars:', publicResult.error.flatten().fieldErrors);
  throw new Error('Missing required NEXT_PUBLIC_* environment variables. Check .env.local');
}

export const publicEnv = publicResult.data;

// ---------- server (lazy — only validated when accessed) ----------
const serverSchema = z.object({
  XAI_API_KEY: z.string().min(1, 'XAI_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

let _serverEnv: z.infer<typeof serverSchema> | null = null;

export function getServerEnv() {
  if (_serverEnv) return _serverEnv;

  const result = serverSchema.safeParse({
    XAI_API_KEY: process.env.XAI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (!result.success) {
    console.error('❌ Missing or invalid server env vars:', result.error.flatten().fieldErrors);
    throw new Error('Missing required server environment variables. Check .env.local');
  }

  _serverEnv = result.data;
  return _serverEnv;
}
