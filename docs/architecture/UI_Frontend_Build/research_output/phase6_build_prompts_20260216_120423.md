# Research Output: Claude Code Build Prompts for Hyrox AI Coach
## Generated: 2026-02-16T12:04:23.706484
## Preset: advanced-deep-research
## Model: anthropic/claude-opus-4-6
## Cost: $2.1757
## Research steps: 6 searches, 2 URL fetches
## Output length: 52582 chars, 6284 words

---

Now I have enough information to create comprehensive build prompts. Let me compile everything into the deliverables.

---

# Phase 6 Deliverables: Claude Code Build Prompts — Hyrox AI Coach

---

## Deliverable 1: Build Sequence Checklist

```
# Hyrox AI Coach — Build Sequence Checklist

- [ ] Prompt 1:  Project Scaffold & Configuration      _(creates project, installs deps, sets up structure)_
- [ ] Prompt 2:  Database Migration & Seed Data          _(creates tables, RLS, seeds reference data)_
- [ ] Prompt 3:  Authentication & Profile Flow            _(auth pages, middleware, onboarding)_
- [ ] Prompt 4:  AI Coaching Chat — Core Pipeline          _(RAG, embeddings, streaming API)_
- [ ] Prompt 5:  AI Coach Chat — Frontend UI               _(chat interface, SSE, conversation mgmt)_
- [ ] Prompt 6:  Dashboard                                 _(home screen, bento grid, stats)_
- [ ] Prompt 7:  Workout Logging                           _(logger, timer, calendar, PR detection)_
- [ ] Prompt 8:  Training Plans                            _(plan view, week/day cards, completion)_
- [ ] Prompt 9:  Performance & Analytics                   _(charts, PR board, station breakdown)_
- [ ] Prompt 10: Race Hub                                  _(race results, splits, comparison)_
- [ ] Prompt 11: Goals, Achievements & Profile             _(goals, badges, settings)_
- [ ] Prompt 12: Polish, Testing & Deployment              _(nav, animations, responsive, Vercel)_

## Status Key
- [ ] Not started
- [~] In progress
- [x] Complete
- [!] Needs re-run (dependency changed)
```

---

## Deliverable 2: Dependency Map

```
# Hyrox AI Coach — Prompt Dependency Map

Prompt 1: Scaffold
├── No dependencies (first prompt)
│
Prompt 2: Database
├── Depends on: Prompt 1 (project must exist, Supabase client utils)
│
Prompt 3: Auth & Profile
├── Depends on: Prompt 1 (project structure, Supabase clients)
├── Depends on: Prompt 2 (athlete_profiles table, RLS policies)
│
Prompt 4: Chat API
├── Depends on: Prompt 1 (project structure, env vars, openai SDK)
├── Depends on: Prompt 2 (conversations, messages, knowledge_chunks tables)
├── Depends on: Prompt 3 (auth middleware, user session extraction)
│
Prompt 5: Chat UI
├── Depends on: Prompt 1 (Kokonut UI components)
├── Depends on: Prompt 3 (auth context)
├── Depends on: Prompt 4 (POST /api/chat, conversation CRUD endpoints)
│
Prompt 6: Dashboard
├── Depends on: Prompt 1 (Kokonut UI, @number-flow/react)
├── Depends on: Prompt 2 (all data tables)
├── Depends on: Prompt 3 (auth, profile)
│
Prompt 7: Workout Logging
├── Depends on: Prompt 1 (components, canvas-confetti)
├── Depends on: Prompt 2 (workout_sessions, exercises, personal_records tables)
├── Depends on: Prompt 3 (auth)
│
Prompt 8: Training Plans
├── Depends on: Prompt 2 (training_plans, plan_weeks, plan_days tables)
├── Depends on: Prompt 3 (auth)
├── Soft depends on: Prompt 7 (links to workout logger)
│
Prompt 9: Performance & Analytics
├── Depends on: Prompt 1 (recharts, @tanstack/react-table)
├── Depends on: Prompt 2 (benchmarks, personal_records tables)
├── Depends on: Prompt 3 (auth)
├── Soft depends on: Prompt 7 (workout data to chart)
│
Prompt 10: Race Hub
├── Depends on: Prompt 2 (race_results, race_splits tables)
├── Depends on: Prompt 3 (auth)
├── Soft depends on: Prompt 4 (chat integration for analysis)
│
Prompt 11: Goals, Achievements & Profile
├── Depends on: Prompt 2 (goals, achievements tables)
├── Depends on: Prompt 3 (auth, profile)
│
Prompt 12: Polish & Deployment
├── Depends on: ALL previous prompts (full integration pass)

## Re-run Cascade Rules
- If Prompt 1 changes → Re-run ALL subsequent prompts
- If Prompt 2 changes → Re-run Prompts 3-12
- If Prompt 3 changes → Re-run Prompts 4-12
- If Prompt 4 changes → Re-run Prompt 5, possibly 10
- If Prompts 5-11 change → Only affects Prompt 12
```

---

## Deliverable 3: The 12 Build Prompts

---

### PROMPT 1: Project Scaffold & Configuration

````markdown
# Claude Code Build Prompt — Prompt 1: Project Scaffold & Configuration

## Context Header

You are building the **Hyrox AI Coach**, a full-featured training application for Hyrox athletes.

**Tech Stack:**
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Components**: Kokonut UI + Kokonut UI Pro + shadcn/ui + Recharts + TanStack Table
- **Backend**: Next.js API routes + Supabase (PostgreSQL, Auth, PGVector)
- **AI**: Fine-tuned Llama 3.3 70B on Nebius (OpenAI-compatible API) + RAG via PGVector
- **Deployment**: Vercel

**Project path**: `/Users/zach/Desktop/hyrox-ai-coach/`

**DO NOT:**
- Modify any `knowledge_chunks` table or existing RPC functions (they already exist in production)
- Use OpenAI for coaching LLM calls (Nebius only; OpenAI is used only for embeddings)
- Create a `tailwind.config.js` file (Tailwind v4 uses CSS-first configuration via `@theme` in the CSS file)

---

## Task: Initialize the project, install all dependencies, configure everything

### Step 1: Create the Next.js Project

```bash
cd /Users/zach/Desktop/
npx create-next-app@16 hyrox-ai-coach --typescript --tailwind --eslint --app --src-dir --import-alias="@/*" --turbopack --use-npm
cd hyrox-ai-coach
```

### Step 2: Install All Dependencies

Run these install commands in sequence:

```bash
# Core UI & Animation
npm install motion @number-flow/react canvas-confetti react-markdown remark-gfm lucide-react

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# AI / LLM
npm install openai

# Charts & Tables
npm install recharts react-is @tanstack/react-table

# UI Utilities
npm install sonner react-day-picker date-fns clsx tailwind-merge class-variance-authority

# Dev dependencies
npm install -D @types/canvas-confetti
```

### Step 3: Initialize shadcn/ui

```bash
npx shadcn@latest init
```

When prompted, choose:
- Style: Default
- Base color: Neutral
- CSS variables: Yes

After initialization, modify `components.json` to add the Kokonut UI registry. The file should look like this:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "kokonutui": {
      "url": "https://kokonutui.com/r"
    }
  }
}
```

### Step 4: Install shadcn/ui Base Components

```bash
npx shadcn@latest add button card dialog dropdown-menu input label select separator sheet skeleton slider switch tabs textarea toast toggle tooltip avatar badge breadcrumb calendar checkbox collapsible command form popover progress radio-group scroll-area table sonner drawer
```

### Step 5: Install Kokonut UI Components

```bash
npx shadcn@latest add kokonutui/ai-input-01
npx shadcn@latest add kokonutui/ai-state-loading-01
npx shadcn@latest add kokonutui/ai-text-loading
npx shadcn@latest add kokonutui/ai-voice-01
npx shadcn@latest add kokonutui/bento-grid-01
npx shadcn@latest add kokonutui/smooth-drawer-01
npx shadcn@latest add kokonutui/smooth-tab-01
npx shadcn@latest add kokonutui/dynamic-text-01
npx shadcn@latest add kokonutui/morphic-navbar-01
npx shadcn@latest add kokonutui/animated-list-01
```

> **Note**: If any Kokonut component fails to install via CLI, create the component file manually at the expected path and copy the code from https://kokonutui.com/docs. The key components we need are AI Input, AI State Loading, AI Text Loading, Bento Grid, Smooth Drawer, Smooth Tab, Dynamic Text, Morphic Navbar, and Animated List.

### Step 6: Configure Tailwind CSS v4

Tailwind v4 uses CSS-first configuration. **Do NOT create a `tailwind.config.js` file.** Edit `src/app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* Brand Colors */
  --color-hyrox-yellow: #FFD700;
  --color-hyrox-black: #0A0A0A;
  --color-hyrox-dark: #1A1A1A;
  --color-hyrox-gray: #2A2A2A;
  --color-hyrox-light: #F5F5F5;

  /* Coach K Accent */
  --color-coach-blue: #3B82F6;
  --color-coach-green: #10B981;

  /* Performance Colors */
  --color-perf-excellent: #22C55E;
  --color-perf-good: #84CC16;
  --color-perf-average: #EAB308;
  --color-perf-below: #F97316;
  --color-perf-poor: #EF4444;

  /* Station Colors (for radar chart etc) */
  --color-station-ski: #3B82F6;
  --color-station-sled-push: #EF4444;
  --color-station-sled-pull: #F97316;
  --color-station-burpee: #EAB308;
  --color-station-row: #22C55E;
  --color-station-farmers: #8B5CF6;
  --color-station-lunges: #EC4899;
  --color-station-wall-balls: #06B6D4;

  /* Fonts */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  /* Spacing Scale Overrides (optional) */
  --radius-lg: 0.75rem;
  --radius-md: 0.5rem;
  --radius-sm: 0.25rem;
}

/* Dark mode as default for athletic app */
@variant dark (&:where(.dark, .dark *));

/* Base styles */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 0 0% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 3.9%;
    --primary: 48 100% 50%;
    --primary-foreground: 0 0% 4%;
    --secondary: 0 0% 96.1%;
    --secondary-foreground: 0 0% 9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --accent: 0 0% 96.1%;
    --accent-foreground: 0 0% 9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 89.8%;
    --input: 0 0% 89.8%;
    --ring: 48 100% 50%;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }

  .dark {
    --background: 0 0% 4%;
    --foreground: 0 0% 98%;
    --card: 0 0% 7%;
    --card-foreground: 0 0% 98%;
    --popover: 0 0% 7%;
    --popover-foreground: 0 0% 98%;
    --primary: 48 100% 50%;
    --primary-foreground: 0 0% 4%;
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 98%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 64%;
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --border: 0 0% 15%;
    --input: 0 0% 15%;
    --ring: 48 100% 50%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Step 7: Configure TypeScript (strict mode)

Ensure `tsconfig.json` has:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "incremental": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### Step 8: Create Project Directory Structure

Create the following directories and placeholder files. Every directory should have at least one file (even if just an empty file or a simple export) so the structure is established.

```
src/
├── app/
│   ├── globals.css                    (already exists — edited above)
│   ├── layout.tsx                     (root layout)
│   ├── page.tsx                       (landing / redirect to dashboard)
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx                 (authenticated app shell with nav)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── coach/
│   │   │   └── page.tsx
│   │   ├── workouts/
│   │   │   ├── page.tsx               (workout history / calendar)
│   │   │   └── log/
│   │   │       └── page.tsx           (workout logger)
│   │   ├── plans/
│   │   │   └── page.tsx
│   │   ├── performance/
│   │   │   └── page.tsx
│   │   ├── races/
│   │   │   └── page.tsx
│   │   ├── goals/
│   │   │   └── page.tsx
│   │   └── profile/
│   │       └── page.tsx
│   ├── onboarding/
│   │   └── page.tsx
│   └── api/
│       ├── chat/
│       │   └── route.ts
│       ├── conversations/
│       │   └── route.ts
│       ├── profile/
│       │   └── route.ts
│       ├── workouts/
│       │   └── route.ts
│       ├── plans/
│       │   └── route.ts
│       ├── benchmarks/
│       │   └── route.ts
│       ├── races/
│       │   └── route.ts
│       ├── goals/
│       │   └── route.ts
│       ├── achievements/
│       │   └── route.ts
│       └── dashboard/
│           └── route.ts
├── components/
│   ├── ui/                            (shadcn components — auto-populated)
│   ├── coach/                         (chat-specific components)
│   │   └── .gitkeep
│   ├── dashboard/                     (dashboard-specific components)
│   │   └── .gitkeep
│   ├── workouts/                      (workout-specific components)
│   │   └── .gitkeep
│   ├── plans/                         (training plan components)
│   │   └── .gitkeep
│   ├── performance/                   (analytics components)
│   │   └── .gitkeep
│   ├── races/                         (race hub components)
│   │   └── .gitkeep
│   ├── shared/                        (shared/reusable components)
│   │   └── .gitkeep
│   └── layout/                        (navigation, shell, etc.)
│       └── .gitkeep
├── lib/
│   ├── utils.ts                       (already exists from shadcn — cn utility)
│   ├── supabase/
│   │   ├── client.ts                  (browser client)
│   │   ├── server.ts                  (server client)
│   │   └── middleware.ts              (middleware helper)
│   ├── ai/
│   │   ├── coaching-pipeline.ts       (RAG pipeline)
│   │   ├── embeddings.ts             (OpenAI embedding calls)
│   │   ├── system-prompt.ts           (Coach K system prompt)
│   │   └── context-formatter.ts       (format RAG context)
│   └── constants.ts                   (app constants — station names, etc.)
├── hooks/
│   ├── use-auth.ts
│   └── use-chat.ts
├── types/
│   ├── database.ts                    (Supabase DB types)
│   ├── chat.ts                        (chat-related types)
│   └── index.ts                       (shared types)
└── middleware.ts                       (Next.js middleware for auth)
```

### Step 9: Create Environment Variable Template

Create `.env.local.example` at the project root (NOT inside `src/`):

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Nebius AI (Coaching LLM - OpenAI-compatible)
NEBIUS_API_KEY=your_nebius_api_key
NEBIUS_BASE_URL=https://api.studio.nebius.com/v1/
NEBIUS_MODEL=meta-llama/Llama-3.3-70B-Instruct

# OpenAI (Embeddings ONLY - NOT for coaching)
OPENAI_API_KEY=your_openai_api_key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Important**: The project already has a `.env.local` file with real API keys. Do NOT overwrite it. Only create `.env.local.example` as a template reference.

### Step 10: Create Supabase Client Utilities

**File: `src/lib/supabase/client.ts`**
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File: `src/lib/supabase/server.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  )
}
```

**File: `src/lib/supabase/middleware.ts`**
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do NOT run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very
  // hard to debug issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    // No user — redirect to login
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
```

**File: `src/middleware.ts`** (Next.js middleware at src root)
```typescript
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### Step 11: Create Root Layout

**File: `src/app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Hyrox AI Coach',
  description: 'Your intelligent training partner for Hyrox racing',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Step 12: Create Placeholder Pages

For every page.tsx created in the directory structure, add a simple placeholder:

**File: `src/app/page.tsx`**
```typescript
import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/dashboard')
}
```

**File: `src/app/(auth)/layout.tsx`**
```typescript
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  )
}
```

**File: `src/app/(app)/layout.tsx`**
```typescript
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
```

For ALL other page.tsx files (`login`, `signup`, `dashboard`, `coach`, `workouts`, `workouts/log`, `plans`, `performance`, `races`, `goals`, `profile`, `onboarding`), create this pattern:

```typescript
export default function PageName() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Page Name</h1>
      <p className="text-muted-foreground">Coming soon...</p>
    </div>
  )
}
```

Replace "PageName" and "Page Name" with the appropriate name for each route.

For ALL API route.ts files, create this pattern:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ message: 'Not implemented yet' }, { status: 501 })
}
```

### Step 13: Create Utility Constants

**File: `src/lib/constants.ts`**
```typescript
export const HYROX_STATIONS = [
  { id: 'ski_erg', name: 'Ski Erg', order: 1, unit: 'meters', defaultDistance: 1000 },
  { id: 'sled_push', name: 'Sled Push', order: 2, unit: 'meters', defaultDistance: 50 },
  { id: 'sled_pull', name: 'Sled Pull', order: 3, unit: 'meters', defaultDistance: 50 },
  { id: 'burpee_broad_jump', name: 'Burpee Broad Jump', order: 4, unit: 'meters', defaultDistance: 80 },
  { id: 'rowing', name: 'Rowing', order: 5, unit: 'meters', defaultDistance: 1000 },
  { id: 'farmers_carry', name: "Farmer's Carry", order: 6, unit: 'meters', defaultDistance: 200 },
  { id: 'lunges', name: 'Lunges', order: 7, unit: 'meters', defaultDistance: 100 },
  { id: 'wall_balls', name: 'Wall Balls', order: 8, unit: 'reps', defaultReps: 100 },
] as const

export const HYROX_DIVISIONS = [
  'Men Open', 'Women Open',
  'Men Pro', 'Women Pro',
  'Men Doubles', 'Women Doubles', 'Mixed Doubles',
  'Men 40+', 'Women 40+',
] as const

export const RPE_LABELS: Record<number, string> = {
  1: 'Very Light',
  2: 'Light',
  3: 'Light-Moderate',
  4: 'Moderate',
  5: 'Moderate-Hard',
  6: 'Hard',
  7: 'Very Hard',
  8: 'Extremely Hard',
  9: 'Near Max',
  10: 'Max Effort',
}

export const APP_NAME = 'Hyrox AI Coach'
export const COACH_NAME = 'Coach K'
```

### Step 14: Create Types Placeholder

**File: `src/types/index.ts`**
```typescript
export type HyroxStation = {
  id: string
  name: string
  order: number
  unit: 'meters' | 'reps'
  defaultDistance?: number
  defaultReps?: number
}

export type HyroxDivision = string

export type SessionType = 'full_hyrox' | 'station_practice' | 'running' | 'strength' | 'hybrid' | 'recovery'
```

**File: `src/types/database.ts`**
```typescript
// Will be populated with full Supabase types after database migration (Prompt 2)
export type Database = Record<string, never>
```

**File: `src/types/chat.ts`**
```typescript
export type Message = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  created_at: string
  token_count?: number
  feedback?: 'positive' | 'negative' | null
}

export type Conversation = {
  id: string
  user_id: string
  title: string
  created_at: string
  updated_at: string
}

export type ChatRequest = {
  message: string
  conversation_id?: string
}

export type StreamChunk = {
  type: 'token' | 'done' | 'error'
  content?: string
  conversation_id?: string
  message_id?: string
  error?: string
}
```

---

## Acceptance Criteria

1. `npm run dev` runs successfully with no errors
2. All dependencies are installed (check `package.json`)
3. The directory structure matches the layout above
4. `src/app/globals.css` uses Tailwind v4 `@theme` syntax (no `tailwind.config.js` exists)
5. `.env.local.example` exists with all env var placeholders
6. Supabase client utilities exist at `src/lib/supabase/{client,server,middleware}.ts`
7. `src/middleware.ts` exists and handles auth redirects
8. All placeholder pages render without errors
9. shadcn/ui components are installed in `src/components/ui/`
10. TypeScript compiles cleanly with `npx tsc --noEmit`
````

---

### PROMPT 2: Database Migration & Seed Data

````markdown
# Claude Code Build Prompt — Prompt 2: Database Migration & Seed Data

## Context Header

You are building the **Hyrox AI Coach**, a full-featured training application for Hyrox athletes.

**Tech Stack:**
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Backend**: Next.js API routes + Supabase (PostgreSQL, Auth, PGVector)
- **AI**: Fine-tuned Llama 3.3 70B on Nebius + RAG via PGVector

**Project path**: `/Users/zach/Desktop/hyrox-ai-coach/`

**What was built in Prompt 1:**
- Next.js 16 project initialized with all dependencies
- Supabase client utilities at `src/lib/supabase/{client,server,middleware}.ts`
- Directory structure established
- Environment variables configured

**DO NOT:**
- Modify the `knowledge_chunks` table or any existing RPC functions (they already exist and contain production data)
- Drop or alter any existing tables — this migration should be additive
- Include any API keys or secrets in migration files

---

## Task: Create the complete SQL migration and seed data

### Step 1: Create Migration Directory

```bash
mkdir -p supabase/migrations
```

### Step 2: Create Migration File

**File: `supabase/migrations/001_initial_schema.sql`**

```sql
-- ============================================================
-- Hyrox AI Coach — Initial Schema Migration
-- ============================================================
-- This migration creates all application tables.
-- It does NOT touch the knowledge_chunks table or existing RPC functions.
-- ============================================================

-- Enable required extensions (pgvector should already be enabled for knowledge_chunks)
CREATE EXTENSION IF NOT EXISTS "pgvector" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- ============================================================
-- 1. ATHLETE PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.athlete_profiles (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  age INTEGER CHECK (age >= 13 AND age <= 100),
  gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
  height_cm NUMERIC(5,1),
  weight_kg NUMERIC(5,1),
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'elite')),
  hyrox_division TEXT CHECK (hyrox_division IN (
    'Men Open', 'Women Open', 'Men Pro', 'Women Pro',
    'Men Doubles', 'Women Doubles', 'Mixed Doubles',
    'Men 40+', 'Women 40+'
  )),
  target_race_date DATE,
  target_race_location TEXT,
  target_finish_time_seconds INTEGER,
  injuries_limitations TEXT,
  fitness_background TEXT,
  weekly_training_days INTEGER DEFAULT 4 CHECK (weekly_training_days >= 1 AND weekly_training_days <= 7),
  preferred_units TEXT DEFAULT 'metric' CHECK (preferred_units IN ('metric', 'imperial')),
  timezone TEXT DEFAULT 'UTC',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- 2. HYROX STATIONS (reference data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hyrox_stations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  station_order INTEGER NOT NULL UNIQUE CHECK (station_order >= 1 AND station_order <= 8),
  default_distance_meters INTEGER,
  default_reps INTEGER,
  equipment TEXT[],
  muscle_groups TEXT[],
  description TEXT,
  tips TEXT[]
);

-- ============================================================
-- 3. EXERCISES (reference data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'hyrox_station', 'running', 'strength', 'conditioning',
    'mobility', 'warmup', 'cooldown'
  )),
  station_id UUID REFERENCES public.hyrox_stations(id),
  muscle_groups TEXT[],
  equipment TEXT[],
  description TEXT,
  video_url TEXT,
  is_compound BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. CONVERSATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  summary TEXT,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  token_count INTEGER,
  embedding_tokens INTEGER,
  model_used TEXT,
  rag_context_ids UUID[],
  feedback TEXT CHECK (feedback IN ('positive', 'negative')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. TRAINING PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.training_plans (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'draft')),
  total_weeks INTEGER NOT NULL,
  created_by TEXT DEFAULT 'user' CHECK (created_by IN ('user', 'coach_k')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. PLAN WEEKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_weeks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  plan_id UUID NOT NULL REFERENCES public.training_plans(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  theme TEXT,
  notes TEXT,
  UNIQUE(plan_id, week_number)
);

-- ============================================================
-- 8. PLAN DAYS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plan_days (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  week_id UUID NOT NULL REFERENCES public.plan_weeks(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  session_type TEXT NOT NULL CHECK (session_type IN (
    'full_hyrox', 'station_practice', 'running', 'strength',
    'hybrid', 'recovery', 'rest'
  )),
  title TEXT NOT NULL,
  description TEXT,
  estimated_duration_minutes INTEGER,
  exercises JSONB DEFAULT '[]'::jsonb,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  workout_session_id UUID,
  UNIQUE(week_id, day_of_week)
);

-- ============================================================
-- 9. WORKOUT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_sessions (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_day_id UUID REFERENCES public.plan_days(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL CHECK (session_type IN (
    'full_hyrox', 'station_practice', 'running', 'strength',
    'hybrid', 'recovery'
  )),
  title TEXT,
  notes TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  calories_estimated INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 10. WORKOUT EXERCISES (details within a session)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.workout_exercises (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  station_id UUID REFERENCES public.hyrox_stations(id),
  exercise_order INTEGER NOT NULL DEFAULT 0,
  sets INTEGER,
  reps INTEGER,
  weight_kg NUMERIC(6,2),
  distance_meters NUMERIC(8,1),
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 11. PERSONAL RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.personal_records (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  station_id UUID REFERENCES public.hyrox_stations(id),
  record_type TEXT NOT NULL CHECK (record_type IN (
    'time', 'weight', 'distance', 'reps', 'pace'
  )),
  value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  achieved_at DATE NOT NULL DEFAULT CURRENT_DATE,
  workout_session_id UUID REFERENCES public.workout_sessions(id) ON DELETE SET NULL,
  previous_value NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. BENCHMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.benchmarks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.hyrox_stations(id),
  benchmark_type TEXT NOT NULL CHECK (benchmark_type IN (
    'station_time', 'run_split', 'total_time', '1rm',
    'max_reps', 'vo2max', 'pace'
  )),
  value NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  recorded_at DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'race', 'workout', 'coach_k')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 13. RACE RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.race_results (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_name TEXT NOT NULL,
  race_location TEXT,
  race_date DATE NOT NULL,
  division TEXT,
  total_time_seconds INTEGER NOT NULL,
  overall_place INTEGER,
  division_place INTEGER,
  total_participants INTEGER,
  notes TEXT,
  conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 14. RACE SPLITS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.race_splits (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  race_result_id UUID NOT NULL REFERENCES public.race_results(id) ON DELETE CASCADE,
  station_id UUID REFERENCES public.hyrox_stations(id),
  split_type TEXT NOT NULL CHECK (split_type IN ('run', 'station', 'transition')),
  split_order INTEGER NOT NULL,
  time_seconds INTEGER NOT NULL,
  notes TEXT,
  UNIQUE(race_result_id, split_order)
);

-- ============================================================
-- 15. GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK (goal_type IN (
    'race_time', 'station_time', 'strength', 'consistency',
    'weight', 'custom'
  )),
  target_value NUMERIC(10,2),
  target_unit TEXT,
  current_value NUMERIC(10,2),
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 16. ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb,
  UNIQUE(user_id, achievement_type)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_athlete_profiles_user_id ON public.athlete_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_training_plans_user_id ON public.training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_training_plans_status ON public.training_plans(status);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON public.workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON public.workout_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_session_id ON public.workout_exercises(session_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_id ON public.personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_user_id ON public.benchmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_station_id ON public.benchmarks(station_id);
CREATE INDEX IF NOT EXISTS idx_race_results_user_id ON public.race_results(user_id);
CREATE INDEX IF NOT EXISTS idx_race_splits_race_result_id ON public.race_splits(race_result_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON public.achievements(user_id);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER set_updated_at_athlete_profiles
  BEFORE UPDATE ON public.athlete_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_conversations
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_training_plans
  BEFORE UPDATE ON public.training_plans
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_workout_sessions
  BEFORE UPDATE ON public.workout_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_race_results
  BEFORE UPDATE ON public.race_results
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_goals
  BEFORE UPDATE ON public.goals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.athlete_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
-- hyrox_stations and exercises are public reference data (no RLS needed)

-- Athlete Profiles: users can only see/edit their own
CREATE POLICY "Users can view own profile" ON public.athlete_profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.athlete_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.athlete_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.athlete_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Conversations: users can only see/edit their own
CREATE POLICY "Users can view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Messages: users can access messages in their own conversations
CREATE POLICY "Users can view messages in own conversations" ON public.messages
  FOR SELECT USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert messages in own conversations" ON public.messages
  FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update messages in own conversations" ON public.messages
  FOR UPDATE USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
  );

-- Training Plans: users can only see/edit their own
CREATE POLICY "Users can view own plans" ON public.training_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.training_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.training_plans
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.training_plans
  FOR DELETE USING (auth.uid() = user_id);

-- Plan Weeks: via plan ownership
CREATE POLICY "Users can view own plan weeks" ON public.plan_weeks
  FOR SELECT USING (
    plan_id IN (SELECT id FROM public.training_plans WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own plan weeks" ON public.plan_weeks
  FOR INSERT WITH CHECK (
    plan_id IN (SELECT id FROM public.training_plans WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own plan weeks" ON public.plan_weeks
  FOR UPDATE USING (
    plan_id IN (SELECT id FROM public.training_plans WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own plan weeks" ON public.plan_weeks
  FOR DELETE USING (
    plan_id IN (SELECT id FROM public.training_plans WHERE user_id = auth.uid())
  );

-- Plan Days: via week → plan ownership
CREATE POLICY "Users can view own plan days" ON public.plan_days
  FOR SELECT USING (
    week_id IN (
      SELECT pw.id FROM public.plan_weeks pw
      JOIN public.training_plans tp ON pw.plan_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own plan days" ON public.plan_days
  FOR INSERT WITH CHECK (
    week_id IN (
      SELECT pw.id FROM public.plan_weeks pw
      JOIN public.training_plans tp ON pw.plan_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own plan days" ON public.plan_days
  FOR UPDATE USING (
    week_id IN (
      SELECT pw.id FROM public.plan_weeks pw
      JOIN public.training_plans tp ON pw.plan_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own plan days" ON public.plan_days
  FOR DELETE USING (
    week_id IN (
      SELECT pw.id FROM public.plan_weeks pw
      JOIN public.training_plans tp ON pw.plan_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

-- Workout Sessions: users can only see/edit their own
CREATE POLICY "Users can view own workouts" ON public.workout_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own workouts" ON public.workout_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workouts" ON public.workout_sessions
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workouts" ON public.workout_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Workout Exercises: via session ownership
CREATE POLICY "Users can view own workout exercises" ON public.workout_exercises
  FOR SELECT USING (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own workout exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own workout exercises" ON public.workout_exercises
  FOR UPDATE USING (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own workout exercises" ON public.workout_exercises
  FOR DELETE USING (
    session_id IN (SELECT id FROM public.workout_sessions WHERE user_id = auth.uid())
  );

-- Personal Records, Benchmarks, Race Results, Goals, Achievements: users own their own
-- (Following same pattern)
CREATE POLICY "Users can CRUD own personal_records" ON public.personal_records
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own benchmarks" ON public.benchmarks
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own race_results" ON public.race_results
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own race_splits" ON public.race_splits
  FOR SELECT USING (
    race_result_id IN (SELECT id FROM public.race_results WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own race_splits" ON public.race_splits
  FOR INSERT WITH CHECK (
    race_result_id IN (SELECT id FROM public.race_results WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can update own race_splits" ON public.race_splits
  FOR UPDATE USING (
    race_result_id IN (SELECT id FROM public.race_results WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can delete own race_splits" ON public.race_splits
  FOR DELETE USING (
    race_result_id IN (SELECT id FROM public.race_results WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can CRUD own goals" ON public.goals
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own achievements" ON public.achievements
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Public read access for reference tables
ALTER TABLE public.hyrox_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read stations" ON public.hyrox_stations
  FOR SELECT USING (true);

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read exercises" ON public.exercises
  FOR SELECT USING (true);
```

### Step 3: Create Seed Data File

**File: `supabase/seed.sql`**

```sql
-- ============================================================
-- SEED DATA: Hyrox Stations
-- ============================================================
INSERT INTO public.hyrox_stations (name, slug, station_order, default_distance_meters, default_reps, equipment, muscle_groups, description, tips) VALUES
('Ski Erg', 'ski_erg', 1, 1000, NULL,
  ARRAY['SkiErg machine'],
  ARRAY['lats', 'triceps', 'core', 'shoulders'],
  '1000m on the SkiErg. Focus on a powerful pull using lats and triceps.',
  ARRAY['Use your whole body, not just arms', 'Lean forward slightly at the catch', 'Pull the handles to hip height', 'Pace yourself — aim for consistent splits']
),
('Sled Push', 'sled_push', 2, 50, NULL,
  ARRAY['Push sled'],
  ARRAY['quads', 'glutes', 'calves', 'core'],
  '50m sled push. Low body position and driving through the legs.',
  ARRAY['Keep arms extended and locked', 'Drive with your legs, not your back', 'Take short powerful steps', 'Keep your hips low']
),
('Sled Pull', 'sled_pull', 3, 50, NULL,
  ARRAY['Pull sled', 'rope'],
  ARRAY['back', 'biceps', 'forearms', 'core'],
  '50m sled pull using a rope. Hand-over-hand technique.',
  ARRAY['Sit back and use your bodyweight', 'Hand over hand — find a rhythm', 'Keep tension on the rope at all times', 'Lean back, dont stand upright']
),
('Burpee Broad Jump', 'burpee_broad_jump', 4, 80, NULL,
  ARRAY['none'],
  ARRAY['full_body', 'quads', 'chest', 'shoulders'],
  '80m of burpee broad jumps. Full burpee followed by a forward jump.',
  ARRAY['Jump forward, not up', 'Minimize time on the ground', 'Keep a steady rhythm', 'Land softly to protect joints']
),
('Rowing', 'rowing', 5, 1000, NULL,
  ARRAY['Rowing machine (Concept2)'],
  ARRAY['back', 'legs', 'biceps', 'core'],
  '1000m on the rowing machine. Full-body movement with emphasis on legs.',
  ARRAY['Drive with legs first, then lean back, then pull arms', 'Maintain a 1:2 drive-to-recovery ratio', 'Keep damper at 5-7 for Hyrox', 'Focus on power per stroke, not stroke rate']
),
('Farmers Carry', 'farmers_carry', 6, 200, NULL,
  ARRAY['Kettlebells or dumbbells'],
  ARRAY['grip', 'traps', 'core', 'shoulders'],
  '200m farmers carry with kettlebells (24kg men / 16kg women).',
  ARRAY['Squeeze the handles hard', 'Keep shoulders back and down', 'Take quick short steps', 'Breathe steadily — dont hold your breath']
),
('Lunges', 'lunges', 7, 100, NULL,
  ARRAY['Sandbag (optional)'],
  ARRAY['quads', 'glutes', 'hamstrings', 'core'],
  '100m of walking lunges (sandbag in Pro division).',
  ARRAY['Step forward, not too wide', 'Keep front knee over ankle', 'Drive up through the front heel', 'Maintain an upright torso']
),
('Wall Balls', 'wall_balls', 8, NULL, 100,
  ARRAY['Medicine ball', 'wall target'],
  ARRAY['quads', 'glutes', 'shoulders', 'core'],
  '100 wall ball shots to target height (3m men / 2.7m women, 6kg/4kg ball).',
  ARRAY['Catch and throw in one fluid motion', 'Use your legs to drive the ball up', 'Keep elbows high on the catch', 'Break into sets if needed — 25/25/25/25']
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- SEED DATA: Exercises
-- ============================================================
INSERT INTO public.exercises (name, slug, category, station_id, muscle_groups, equipment,

---

## Sources

- [Next.js 16](https://nextjs.org/blog/next-16)
- [Kokonut UI - Open Source Components](https://kokonutui.com)
- [Tailwind CSS v4.0](https://tailwindcss.com/blog/tailwindcss-v4)
- [Next.js by Vercel - The React Framework](https://nextjs.org/blog)
- [Kokonut UI: Tailwind CSS Components for React & Next.js](https://allshadcn.com/components/kokonut-UI/)
- [Upgrade guide - Getting started - Tailwind CSS](https://tailwindcss.com/docs/upgrade-guide)
- [Releases · vercel/next.js - GitHub](https://github.com/vercel/next.js/releases)
- [Kokonut UI - Free React Nextjs Template - shadcn.io](https://www.shadcn.io/template/kokonut-labs-kokonutui)
- [Tailwind CSS v4 Full Course 2025 | Master Tailwind in One Hour](https://www.youtube.com/watch?v=6biMWgD6_JY)
- [Next.js - endoflife.date](https://endoflife.date/nextjs)
- [Components - shadcn/ui](https://ui.shadcn.com/docs/components)
- [The NEW CSS-first configuration with Tailwind CSS v4 (No more tailwind.config.js)](https://www.youtube.com/watch?v=bupetqS1SMU)
- [Next.js - Wikipedia](https://en.wikipedia.org/wiki/Next.js)
- [Kokonut UI - Shadcn Templates](https://shadcntemplates.com/theme/kokonut-labs-kokonutui)
- [A First Look at Setting Up Tailwind CSS v4.0](https://bryananthonio.com/blog/configuring-tailwind-css-v4/)
- [Docs](https://kokonutui.com/docs)
- [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [number-flow/react](https://www.npmjs.com/package/@number-flow/react)
- [Getting Started - Shadcn UI](https://ui.shadcn.com/docs/registry/getting-started)
- [Server-Side Rendering | Supabase Docs](https://supabase.com/docs/guides/auth/server-side)
- [NumberFlow for React - An animated number component](https://number-flow.barvian.me)
- [Getting Started - shadcn/ui](https://v3.shadcn.com/docs/registry/getting-started)
- [Nextjs example SSR doesnt work. · Issue #1735 · supabase/supabase](https://github.com/supabase/supabase/issues/1735)
- [barvian/number-flow: An animated number component for ...](https://github.com/barvian/number-flow)
- [Docs - How to use CLI - Shadcn Studio](https://shadcnstudio.com/docs/getting-started/how-to-use-shadcn-cli)
- [Thats the way! How to: Supabase SSR Auth in Nextjs 14](https://www.youtube.com/watch?v=yLJIrvYapA0)
- [@number-flow/react - npm package](https://intel.aikido.dev/packages/npm/@number-flow/react)
- [Kokonut UI | shadcnregistry](https://shadcnregistry.com/kokonut-ui)
- [Supabase, Server-side rendering and Next.js](https://www.supaboost.dev/blog/supabase-server-side-rendering-nextjs)
- [number-flow/react - A CDN for npm and GitHub](https://www.jsdelivr.com/package/npm/@number-flow/react)
- [recharts](https://www.npmjs.com/package/recharts)
- [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- [Framer Motion](https://www.npmjs.com/package/framer-motion)
- [272 Versions](https://www.npmjs.com/package/recharts?activeTab=versions)
- [Canvas-confetti NPM | npm.io](https://npm.io/package/canvas-confetti)
- [Motion & Framer Motion upgrade guide](https://motion.dev/docs/react-upgrade-guide)
- [Releases · recharts/recharts](https://github.com/recharts/recharts/releases)
- [npm:canvas-confetti](https://www.skypack.dev/view/canvas-confetti)
- [Motion — JavaScript & React animation library](https://motion.dev)
- [Recharts NPM](https://npm.io/package/recharts)
- [canvas-confetti 1.9.3 on npm - Libraries.io](https://libraries.io/npm/canvas-confetti)
- [1304 Versions](https://www.npmjs.com/package/framer-motion?activeTab=versions)
- [recharts/recharts: Redefined chart library built with React ...](https://github.com/recharts/recharts)
- [react-canvas-confetti - NPM](https://www.npmjs.com/package/react-canvas-confetti)
- [framer-motion - Yarn 1](https://classic.yarnpkg.com/en/package/framer-motion)
- [CLI: create-next-app](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Migrating to V8 Guide | TanStack Table Docs](https://tanstack.com/table/latest/docs/guide/migrating)
- [emilkowalski/sonner: An opinionated toast component for ...](https://github.com/emilkowalski/sonner)
- [Linter Options](https://nextjs.org/docs/pages/api-reference/cli/create-next-app)
- [Installation | TanStack Table Docs](https://tanstack.com/table/latest/docs/installation)
- [sonner](https://www.npmjs.com/package/sonner)
- [create-next-app - Next.js 16 日本語ドキュメント](https://nextjsjp.org/docs/app/api-reference/cli/create-next-app)
- [A complete guide to TanStack Table (formerly React Table)](https://blog.logrocket.com/tanstack-table-formerly-react-table/)
- [64 Versions](https://www.npmjs.com/package/sonner?activeTab=versions)
- [Create a new Next.js 16 application - Sanity](https://www.sanity.io/learn/course/content-driven-web-application-foundations/create-a-new-next-js-application)
- [Releases · TanStack/table - GitHub](https://github.com/TanStack/table/releases)
- [Releases 36](https://github.com/emilkowalski/sonner/releases)
- [Next.js Create Next App - GeeksforGeeks](https://www.geeksforgeeks.org/nextjs/next-js-create-next-app/)
- [tanstack/react-table](https://www.npmjs.com/package/@tanstack/react-table)
- [Examples](https://ui.shadcn.com/docs/components/sonner)
- [react-day-picker](https://www.npmjs.com/package/react-day-picker)
- [openai](https://www.npmjs.com/package/openai)
- [react-markdown](https://www.npmjs.com/package/react-markdown)
- [React DayPicker: Date Picker Component for React](https://daypicker.dev)
- [Releases · openai/openai-node](https://github.com/openai/openai-node/releases)
- [GitHub - remarkjs/react-markdown: Markdown component for React](https://github.com/remarkjs/react-markdown)
- [8.10.1](https://daypicker.dev/v8)
- [Codex changelog](https://developers.openai.com/codex/changelog/)
- [react-markdown](https://www.npmjs.com/package/react-markdown/v/6.0.3?activeTab=versions)
- [react-datepicker - npm](https://www.npmjs.com/package/react-datepicker)
- [311 Versions](https://www.npmjs.com/package/openai?activeTab=versions)
- [react-markdown - npm.io](https://npm.io/package/react-markdown)
- [Releases · gpbl/react-day-picker](https://github.com/gpbl/react-day-picker/releases)
- [Developer changelog](https://developers.openai.com/changelog/)
- [React-markdown-v8.0.3 NPM](https://npm.io/package/react-markdown-v8.0.3)
- [Next.js - Shadcn UI](https://ui.shadcn.com/docs/installation/next)
- [Quickstart - Nebius Token Factory documentation](https://docs.tokenfactory.nebius.com/quickstart)
- [Specific Usage Cases](https://supabase.com/docs/guides/database/extensions/pgvector)
- [SHADCN UI in Next.js | Full Setup & TOP SECRETS Developers Don’t Tell You 🚀🔥](https://www.youtube.com/watch?v=7TqsIx_UnFI)
- [Introduction - Nebius Token Factory documentation](https://docs.tokenfactory.nebius.com/api-reference/introduction)
- [Storing OpenAI embeddings in Postgres with pgvector](https://supabase.com/blog/openai-embeddings-postgres-vector)
- [init - Shadcn UI](https://ui.shadcn.com/docs/cli)
- [How to Connect AI Model to Your App With Nebius - 2025 | Nebius AI Tutorial](https://www.youtube.com/watch?v=NZ9c2E9nkzI)
- [Generate OpenAI embeddings](https://cookbook.openai.com/examples/vector_databases/supabase/semantic-search)
- [Using shadcn/ui with NextJs 15 and React 19](https://www.youtube.com/watch?v=kol1ogbjxqo)
- [Nebius AI Cloud API - GitHub](https://github.com/nebius/api)
- [Supabase Postgres Vector DB Crash Course](https://www.youtube.com/watch?v=cyPZsbO5i5U)
- [Install shadcn/ui Next.js](https://www.shadcn.io/ui/installation/nextjs)
- [Nebius AI Studio - LiteLLM Docs](https://docs.litellm.ai/docs/providers/nebius)
- [Similarity search with pgvector and Supabase | Swizec Teller](https://swizec.com/blog/similarity-search-with-pgvector-and-supabase/)

---

## Original Prompt

```
# Phase 6: Claude Code Build Prompts — Hyrox AI Coach

> **Role**: You are a prompt engineer creating the sequenced build prompts that will be fed to Claude Code to implement the Hyrox AI Coach application. Each prompt must be self-contained with all necessary context, because Claude Code starts fresh each session. Your job is to take the outputs from Phases 1-5 and convert them into actionable, unambiguous build instructions. You are in planning mode — produce the prompt documents, not the code itself.

---

## Project Context (include in every prompt as context header)

The Hyrox AI Coach is a full-featured training application for Hyrox athletes built with:
- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4
- **Components**: Kokonut UI + Kokonut UI Pro + shadcn/ui + Recharts + TanStack Table
- **Backend**: Next.js API routes + Supabase (PostgreSQL, Auth, PGVector)
- **AI**: Fine-tuned Llama 3.3 70B on Nebius (OpenAI-compatible API) + RAG via PGVector
- **Deployment**: Vercel

The project lives at `/Users/zach/Desktop/hyrox-ai-coach/`.

---

## Build Sequence

The prompts should follow this build order. Each prompt depends on the outputs of previous prompts. Design them so Claude Code can execute them sequentially with clear handoff points.

### Prompt 1: Project Scaffold & Configuration
**What it does**: Initialize the Next.js project, install all dependencies, configure Tailwind, set up project structure, configure environment variables, set up Supabase client utilities.

**Should include**:
- Exact `npx create-next-app` command with correct flags
- All `npm install` commands for every dependency:
  - Kokonut UI (shadcn CLI registry setup)
  - shadcn/ui components to install
  - `openai` SDK, `@supabase/supabase-js`, `@supabase/ssr`
  - Recharts, TanStack Table, sonner, react-day-picker
  - Motion (framer-motion successor)
  - Any other deps from Phase 4/5
- Tailwind CSS v4 configuration (Kokonut-compatible)
- TypeScript strict config
- Project directory structure (from Phase 5 route map)
- Environment variable setup (.env.local template)
- Supabase client utilities (server client, client client, middleware client)
- ESLint/Biome config
- The Kokonut `.cursorrules` conventions (if applicable)

**Acceptance criteria**: `npm run dev` works. All dependencies installed. Project structure matches the route map from Phase 5.

### Prompt 2: Database Migration & Seed Data
**What it does**: Execute the complete SQL migration against Supabase, then seed reference data.

**Should include**:
- The complete SQL migration file from Phase 2
- The seed data SQL from Phase 3
- Instructions for how to run it (Supabase SQL editor, or `supabase db push`, or migration files)
- Verification queries to confirm tables exist with correct schemas
- Verification that RLS policies are active
- Verification that seed data is populated (station count, exercise count, etc.)
- Reminder: DO NOT modify `knowledge_chunks` table or existing RPC functions

**Acceptance criteria**: All tables created. RLS policies active. Reference data seeded. `knowledge_chunks` untouched.

### Prompt 3: Authentication & Profile Flow
**What it does**: Implement Supabase Auth with Next.js middleware, login/signup pages, and the onboarding flow.

**Should include**:
- Supabase Auth configuration (providers to enable)
- Next.js middleware for route protection
- Auth pages using Kokonut Pro Login components
- Onboarding multi-step form (from Phase 5 Screen 1 spec)
- Profile CRUD API routes (from Phase 4)
- Auto-redirect logic: auth → check profile exists → onboarding or dashboard
- Auth context/hooks for client components

**Acceptance criteria**: User can sign up, complete onboarding, and be redirected to dashboard. Profile data persists in Supabase.

### Prompt 4: AI Coaching Chat — Core Pipeline
**What it does**: Implement the complete coaching pipeline (the most critical feature). This is the RAG → embed → search → prompt → stream → log flow.

**Should include**:
- The complete coaching pipeline from the handoff doc (all 9 steps, exact code)
- The system prompt (exact text — DO NOT modify)
- The `POST /api/chat` endpoint with SSE streaming
- Conversation CRUD endpoints
- Message feedback endpoint
- Context formatting function
- Athlete profile injection function
- Error handling for Nebius (cold start, 503, 429, 500, timeout)
- Error handling for OpenAI embeddings (fallback to no-RAG)
- Token usage logging

**Should NOT include** (yet): The frontend chat UI. This prompt builds the API layer only.

**Acceptance criteria**: Can hit `POST /api/chat` with a curl/Postman request and get a streaming Coach K response. Response is grounded in RAG context. Token counts logged to messages table. Smoke test passes (sled push technique, herniated disc refusal, clarifying questions for vague requests).

### Prompt 5: AI Coach Chat — Frontend UI
**What it does**: Build the complete chat interface using Kokonut AI components.

**Should include
```
