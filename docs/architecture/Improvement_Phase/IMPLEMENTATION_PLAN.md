# Hyrox AI Coach — Detailed Implementation Plan

> **Context**: This plan operationalizes the Master Implementation Plan (Improvement_Plan_21726.md) into concrete, file-level implementation steps. Every change is mapped to specific files, specific functions, and specific breaking change risks.

---

## Phase 1: AI SDK Migration (Week 1)

The single highest-leverage change. Replaces ~400 lines of custom SSE streaming code with AI SDK v6's `streamText` + `useChat`, and unlocks tool calling.

### 1.1 Install missing packages

```bash
bun add @ai-sdk/openai-compatible
```

We already have `ai@^6.0.86` and `@ai-sdk/openai@^3.0.29`. The `@ai-sdk/openai` package supports `createOpenAI({ baseURL })` which works for Nebius's OpenAI-compatible endpoint.

### 1.2 Create Nebius provider (`src/lib/ai/nebius.ts` — NEW)

```ts
import { createOpenAI } from '@ai-sdk/openai';

export const nebius = createOpenAI({
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY!,
  compatibility: 'compatible', // disables OpenAI-specific features
});

export const COACH_K_MODEL = nebius(process.env.NEBIUS_MODEL!);
export const BASE_LLAMA_MODEL = nebius('meta-llama/Llama-3.3-70B-Instruct');
```

**Why a separate file**: Centralizes the provider. Both `chat/route.ts` and `training-plans/extract/route.ts` currently create their own `new OpenAI()` clients — this deduplicates.

**Breaking change risk**: NONE — new file, nothing imports it yet.

### 1.3 Create tool definitions (`src/lib/ai/tools.ts` — NEW)

Define all 10 coaching tools using Zod schemas + `execute` functions. Each tool receives `athleteId` via closure (injected in the route handler).

```ts
import { tool } from 'ai';
import { z } from 'zod';

export function createCoachingTools(athleteId: string, supabase: SupabaseClient) {
  return {
    search_knowledge_base: tool({
      description: 'Search the Hyrox training knowledge base for relevant information',
      inputSchema: z.object({ query: z.string().describe('The search query') }),
      execute: async ({ query }) => {
        // Reuse existing embedQuery + searchChunks logic
      },
    }),
    create_workout_log: tool({ ... }),
    get_today_workout: tool({ ... }),
    get_training_plan: tool({ ... }),
    update_training_plan_day: tool({ ... }),
    log_benchmark: tool({ ... }),
    get_athlete_stats: tool({ ... }),
    set_goal: tool({ ... }),
    get_progress_summary: tool({ ... }),
    calculate_race_pacing: tool({ ... }),
  };
}
```

**Key design decision**: The `search_knowledge_base` tool replaces the current pre-fetch RAG approach. Currently, *every* message triggers an embedding + search even for casual messages like "thanks" or "what time is my race?". Making RAG a tool means the model decides when knowledge retrieval is needed. The improvement plan estimates ~40% of messages actually need RAG.

**Breaking change risk**: NONE — new file.

### 1.4 Rewrite chat API route (`src/app/api/chat/route.ts` — MODIFY)

**Current state**: 121 lines. Creates conversation, runs `runCoachingPipeline()`, returns SSE stream with custom `data: {token}` events.

**New state**: Uses `streamText()` → `toDataStreamResponse()`. The AI SDK's data stream protocol replaces the custom SSE format.

```ts
import { streamText, UIMessage } from 'ai';
import { COACH_K_MODEL } from '@/lib/ai/nebius';
import { createCoachingTools } from '@/lib/ai/tools';
import { SYSTEM_PROMPT_TEMPLATE } from '@/lib/coach/system-prompt';

export async function POST(request: Request) {
  // Auth + conversation creation stays the same
  const { messages, conversationId } = await request.json();

  // Build system prompt (frozen) + athlete profile message
  const systemMessages = [SYSTEM_PROMPT_TEMPLATE, athleteProfileMessage].filter(Boolean);

  const result = streamText({
    model: COACH_K_MODEL,
    system: systemMessages.join('\n\n'),
    messages, // AI SDK UIMessage[] from useChat
    tools: createCoachingTools(athleteId, supabase),
    temperature: 0.7,
    maxOutputTokens: 1200,
    stopWhen: stepCountIs(3), // Allow up to 3 tool-calling steps
    onFinish: async ({ text, usage, toolCalls }) => {
      // Persist messages to DB (replaces inline logging in pipeline.ts)
    },
  });

  return result.toDataStreamResponse({
    headers: { 'X-Conversation-Id': convId },
  });
}
```

**CRITICAL BREAKING CHANGES**:

1. **Message format changes**: The request body changes from `{ message: string, conversationId }` to `{ messages: UIMessage[], conversationId }`. The client sends the full message history instead of just the new message. The server no longer fetches history from DB — it's in the request.

2. **Response format changes**: The response changes from custom `data: {"token":"..."}` SSE events to AI SDK's data stream protocol (`0:"text"\n`, `9:{"toolCallId":"..."}`, etc.). The client MUST switch to `useChat` to parse this.

3. **RAG context injection changes**: Currently, RAG context is pre-fetched and injected into the system prompt template via `{context}`. With tool-based RAG, the `{context}` placeholder is no longer populated upfront. Instead, the `search_knowledge_base` tool returns chunks as a tool result, and the model incorporates them in its next response.

   **Risk mitigation**: Keep the system prompt template's `{context}` section but change it to instruct the model: "Use the search_knowledge_base tool to find relevant Hyrox knowledge when needed. Don't search for casual/scheduling questions."

4. **Training plan detection**: Currently uses a heuristic (`looksLikeTrainingPlan()`) to set `suggested_actions` on saved messages. With tools, training plan generation becomes an explicit tool call (`create_training_plan` or `generateObject`), making the heuristic unnecessary.

### 1.5 Rewrite coach page to use `useChat` (`src/app/(app)/coach/page.tsx` — MODIFY)

**Current state**: 383 lines. Manual `fetch('/api/chat')` with SSE reader, local message state, streaming accumulation, cold start timer, feedback handler.

**New state**: `useChat()` replaces all streaming/state logic. ~150 lines removed.

```ts
import { useChat } from '@ai-sdk/react';

export default function CoachPage() {
  const { messages, status, sendMessage, stop, setMessages } = useChat({
    id: activeConversationId || undefined,
    onFinish: (message) => {
      // Refresh conversation list, update coach store
    },
    onError: (error) => {
      // Handle 503 (cold start), 429 (rate limit)
    },
  });

  // Render using message.parts instead of message.content
  {messages.map(msg => (
    <ChatMessage key={msg.id} message={msg} />
  ))}
}
```

**CRITICAL BREAKING CHANGES**:

1. **`ChatMessage` component must change**: Currently takes `{ role, content, feedback, isStreaming, suggestedActions }`. Must change to accept a `UIMessage` and iterate over `message.parts` to render:
   - Text parts → markdown
   - Tool invocation parts → inline tool result cards
   - Tool result parts → rendered data

2. **`ChatInput` component**: Currently calls `onSend(string)`. Must change to call `sendMessage({ text })` from `useChat`. The `disabled` and `loading` props change to derive from `status !== 'ready'`.

3. **Conversation history sync**: Currently, `useMessages(conversationId)` fetches from DB and syncs to `localMessages`. With `useChat`, messages live in the hook. We need to seed `useChat` with initial messages loaded from DB when switching conversations (via `setMessages()`).

4. **Cold start detection**: Currently uses a 5-second timer. With `useChat`, the status goes `'submitted'` → `'streaming'`. Cold start is the gap between these two states. Can detect with a timer on `status === 'submitted'`.

5. **Message persistence**: Currently the server persists both user and assistant messages. With `useChat`, the server receives the full message array. We need to decide: persist on every exchange (current approach) or persist on conversation close. **Recommendation**: Keep persisting on every exchange in the `onFinish` callback of `streamText`.

### 1.6 Update `ChatMessage` component (`src/components/coach/chat-message.tsx` — MODIFY)

Must render `message.parts` array instead of raw `content` string:

```tsx
function ChatMessage({ message }: { message: UIMessage }) {
  return (
    <div>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case 'text':
            return <MarkdownRenderer key={i} content={part.text} />;
          case 'tool-invocation':
            return <ToolResultCard key={i} toolName={part.toolInvocation.toolName} result={part.toolInvocation.result} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```

**Breaking change risk**: HIGH — complete rewrite of the component interface. Props change from individual fields to a single `UIMessage` object.

### 1.7 Update `ChatInput` component (`src/components/coach/chat-input.tsx` — MODIFY)

Minimal change: replace `onSend: (message: string) => void` with `onSend: (text: string) => void`. The parent calls `sendMessage({ text })` instead of the custom handler. Quick actions stay the same.

**Breaking change risk**: LOW — just a prop rename.

### 1.8 Deprecate `pipeline.ts` (`src/lib/coach/pipeline.ts` — ARCHIVE/DELETE)

The entire file (364 lines) is replaced by `src/lib/ai/nebius.ts` + `src/lib/ai/tools.ts` + the rewritten route handler. The helper functions (`embedQuery`, `searchChunks`, `formatChunks`) move into the `search_knowledge_base` tool.

**What to preserve**:
- `embedQuery()` → moves to `src/lib/ai/tools.ts` (used by search_knowledge_base tool)
- `searchChunks()` → moves to `src/lib/ai/tools.ts`
- `formatChunks()` → moves to `src/lib/ai/tools.ts`
- `buildAthleteProfileMessage()` → moves to `src/lib/ai/athlete-context.ts` (used by route handler)
- `looksLikeTrainingPlan()` → DELETE (replaced by tool-based plan generation)

**Breaking change risk**: MEDIUM — nothing else imports from pipeline.ts, but the migration must be complete in one pass. Can't partially migrate.

### 1.9 Update `training-plans/extract/route.ts` — MODIFY

Replace `new OpenAI()` with the shared `BASE_LLAMA_MODEL` provider:

```ts
import { generateObject } from 'ai';
import { BASE_LLAMA_MODEL } from '@/lib/ai/nebius';
import { TrainingPlanSchema } from '@/lib/coach/training-plan-schema';

const result = await generateObject({
  model: BASE_LLAMA_MODEL,
  schema: TrainingPlanSchema,
  system: EXTRACTION_PROMPT,
  prompt: `Extract the training plan from: ${messageContent}`,
  temperature: 0.1,
});
```

**Benefit**: `generateObject` with Zod schema replaces manual JSON parsing + cleanup + validation. The AI SDK handles markdown code fence removal, JSON repair, and schema validation automatically.

**Breaking change risk**: LOW — same input/output contract, just better implementation.

### 1.10 System prompt adjustment

The frozen system prompt at `src/lib/coach/system-prompt.ts` has a `{context}` placeholder. With tool-based RAG, this needs to change:

**Current**:
```
## Retrieved Knowledge
{context}
Use this to ground your response...
```

**New**:
```
## Knowledge Base Access
You have access to a search_knowledge_base tool that searches the Hyrox training knowledge base. Use it when you need specific data, protocols, benchmarks, or training science to answer the athlete's question. Don't search for casual conversation, scheduling, or motivational messages.
```

**CRITICAL CONSTRAINT**: The improvement plan says "System prompt stays frozen" and CLAUDE.md says "Do not modify the system prompt without re-running the 59-scenario evaluation suite." This is a necessary modification for tool-based RAG. **We must re-run the eval suite after this change.** Budget 1-2 hours for eval + any prompt adjustments.

### Phase 1 Migration Order (to avoid broken states):

1. Create `src/lib/ai/nebius.ts` (no dependencies)
2. Create `src/lib/ai/tools.ts` (depends on nebius.ts)
3. Create `src/lib/ai/athlete-context.ts` (extract from pipeline.ts)
4. Rewrite `src/app/api/chat/route.ts` (depends on above)
5. Rewrite `src/app/(app)/coach/page.tsx` + `ChatMessage` + `ChatInput` (client-side, must match server)
6. Update `training-plans/extract/route.ts` (independent)
7. Modify system prompt
8. Test end-to-end
9. Re-run eval suite
10. Delete `pipeline.ts`

**Files touched**: 7 modified, 3 new, 1 deleted
**Estimated breaking period**: Steps 4-5 must ship together. The app will be broken between server change and client change.

---

## Phase 2: Tool Result UI Components (Week 1-2)

### 2.1 Tool result card components (`src/components/coach/tool-cards/` — NEW directory)

Each coaching tool needs a visual card that renders inline in the chat:

| Tool | Card Component | Visual Description |
|------|---------------|-------------------|
| `search_knowledge_base` | None (invisible) | Context feeds the response, no UI |
| `create_workout_log` | `WorkoutLoggedCard` | Checkmark, session type, duration, RPE |
| `get_today_workout` | `TodayWorkoutCard` | Exercise list with targets, "Start" button |
| `get_training_plan` | `TrainingPlanCard` | Collapsible weekly view (reuse existing plan-review-modal pattern) |
| `update_training_plan_day` | `DayUpdatedCard` | Before/after comparison |
| `log_benchmark` | `BenchmarkCard` | Result + trophy icon if PR, comparison |
| `get_athlete_stats` | `StatsCard` | Compact summary with key numbers |
| `set_goal` | `GoalCard` | Target + current + progress bar |
| `get_progress_summary` | `ProgressCard` | Multi-section with adherence %, trends |
| `calculate_race_pacing` | `PacingCard` | Table with run/station/transition breakdown |

**Design pattern**: All cards use `bg-surface-2 border border-border-default rounded-lg p-4` with a tool-specific Lucide icon in the top-left and `font-display` labels. Content uses `font-mono` for numeric data.

**Breaking change risk**: NONE — all new components.

### 2.2 Tool card router (`src/components/coach/tool-result-renderer.tsx` — NEW)

```tsx
function ToolResultRenderer({ toolName, result }: { toolName: string; result: unknown }) {
  switch (toolName) {
    case 'create_workout_log': return <WorkoutLoggedCard data={result} />;
    case 'get_today_workout': return <TodayWorkoutCard data={result} />;
    // ...
    default: return null;
  }
}
```

### 2.3 Update `TrainingPlanCard` component — MODIFY

Currently (`training-plan-card.tsx`) is triggered by `suggestedActions.type === 'training_plan'` heuristic. With AI SDK tools, plan creation becomes an explicit tool interaction. This component should be adapted to render as a tool result card, triggered by a `create_training_plan` tool invocation, or by the model using `generateObject` with the plan schema.

**Breaking change risk**: MEDIUM — changes trigger mechanism from heuristic to tool-based.

---

## Phase 3: Workout Experience (Weeks 3-5)

### 3.1 New route: `/training/workout/[id]` — NEW

Full workout execution page. This is the "whiteboard view."

**File**: `src/app/(app)/training/workout/[id]/page.tsx`

**Data flow**:
- Receives `planDayId` from URL params
- Fetches full workout details from `training_plan_days` via existing API
- Renders all sections as scrollable cards
- "Start Workout" button begins session timer

**Routing change**: Currently, "Log Workout" links go to `/training/log?planDayId=xxx`. The new flow:
1. `/training/workout/[dayId]` — Read workout, start timer, execute
2. After completion → inline logging per section
3. On submit → POST to `/api/workouts`

This preserves the existing `/training/log` route for manual workout logging (no plan context).

### 3.2 Workout timer Web Worker (`src/lib/workout-timer.worker.ts` — NEW)

```ts
// Web Worker for accurate background timing
let startTime: number;
let elapsed: number = 0;

self.onmessage = (e) => {
  if (e.data.type === 'start') {
    startTime = Date.now() - (e.data.elapsed || 0);
    tick();
  }
  if (e.data.type === 'stop') { /* ... */ }
};

function tick() {
  elapsed = Date.now() - startTime;
  self.postMessage({ type: 'tick', elapsed });
  setTimeout(tick, 100); // 10fps updates
}
```

**Crash recovery**: Timer state (startTime, elapsed) persists to `localStorage` on every tick. On mount, the workout page checks localStorage for an active timer and resumes.

**Next.js config change**: Need to enable Web Worker support. In `next.config.ts`:
```ts
webpack: (config) => {
  config.module.rules.push({
    test: /\.worker\.ts$/,
    use: { loader: 'worker-loader' },
  });
  return config;
}
```

**Alternative (simpler)**: Use `new Worker(new URL('./timer.worker.ts', import.meta.url))` which Next.js 16 supports natively without config changes.

### 3.3 Per-section logging component (`src/components/training/section-logger.tsx` — NEW)

Each workout section card expands to accept:
- Completion status (done/skipped/modified)
- Actual time or reps
- RPE (1-10) with color-coded slider
- Free-text notes

**Autosave**: Every field change triggers a debounced write to localStorage, plus an immediate Supabase upsert for the section data (stored in `workout_logs.completed_workout` JSONB).

### 3.4 RPE slider component (`src/components/training/rpe-slider.tsx` — NEW)

Uses shadcn's Slider primitive with dynamic color:
- 1-3: `text-semantic-success` (green)
- 4-6: `text-hyrox-yellow`
- 7-8: `text-station-burpee` (orange)
- 9-10: `text-semantic-error` (red)

### 3.5 Workout summary screen (`src/components/training/workout-summary.tsx` — NEW)

Post-completion view showing:
- Total duration (from timer)
- Average RPE across sections
- Any PRs detected (compare to `personal_records`)
- Planned vs actual comparison

### 3.6 New API route for section-level autosave

**Option A**: Extend existing `PUT /api/workouts/:id` to accept partial updates (current behavior)
**Option B**: New `PATCH /api/workouts/:id/sections` endpoint for granular saves

**Recommendation**: Option A — the existing PUT already accepts partial data and the `completed_workout` JSONB field can store section-level data.

---

## Phase 4: Dashboard Enhancements (Weeks 6-8)

### 4.1 Expandable stat cards

Convert each dashboard stat card (streak, RPE, workouts, hours) from static display to expandable cards that reveal charts on tap.

**Component**: `src/components/dashboard/expandable-stat-card.tsx` — NEW

Uses `motion` for expand/collapse animation + `Recharts` for the embedded chart.

### 4.2 Streak heatmap

GitHub-style contribution graph showing 90 days of training. Each cell colored by session volume or RPE.

**Data**: New API endpoint `GET /api/dashboard/streak-heatmap?days=90` returning `[{ date, workoutCount, totalMinutes, avgRpe }]`

### 4.3 Performance charts with Recharts

- **RPE trend**: Line chart, 30 days, with moving average
- **Weekly volume**: Stacked bar chart by session type, 8 weeks
- **Station trends**: Sparklines per station from benchmark data

**Key dependency**: `recharts@3.7.0` is already installed.

### 4.4 Race readiness score

SVG ring component with 7-component weighted score. API endpoint computes the score server-side.

**New**: `GET /api/dashboard/readiness` → `{ score: number, components: {...}, weakest: string }`

---

## Phase 5: Calendar & Plan Polish (Weeks 3-4)

### 5.1 Month view toggle

Add a month view to the training page that shows color-coded dots per day. Uses `react-day-picker` (already installed) styled with B0 tokens.

### 5.2 Drag-and-drop improvements

The existing `week-calendar.tsx` + `@dnd-kit` setup works. Polish needed:
- Visual feedback on valid drop targets
- Prevent dragging completed workouts
- Auto-scroll on drag near edges

### 5.3 Chat-to-workout scheduling

When Coach K suggests a workout via tool, add a "Schedule This" button that:
1. Opens a date picker (default: next available training day)
2. Writes to `training_plan_days` via existing API
3. Invalidates `['training-plans']` React Query cache
4. Shows success toast

---

## Phase 6: Remaining Features (Weeks 6-12)

### 6.1 Benchmark entry UI

New page/modal for logging benchmark tests. Station selector → time input → auto PR detection.

### 6.2 Race results entry

Form capturing 8 running splits + 8 station splits + transition times. Renders as waterfall chart.

### 6.3 Achievement system

Backend: trigger checks on workout log, benchmark log, plan adherence.
Frontend: Trophy case grid, confetti on unlock, toast notifications.

### 6.4 Message feedback

Wire existing thumbs up/down UI (already in ChatMessage) to POST `/api/messages/:id/feedback`. Currently the UI exists but is connected — verify it's working post-migration.

### 6.5 Performance page migration to React Query

Currently uses `useEffect`/`fetch`. Convert to `useQuery` hooks matching the existing patterns in `use-workouts.ts` and `use-dashboard.ts`.

### 6.6 Profile enhancement

Add division badge, race history count, PR highlights to profile page. "Race card" concept from improvement plan.

---

## Technical Debt & Optimizations

### T.1 React Compiler

Add to `next.config.ts`:
```ts
experimental: {
  reactCompiler: true,
}
```

Eliminates need for manual `useMemo`/`useCallback`. Must test thoroughly — the compiler can break components with side effects in render.

### T.2 RLS policy optimization

Add B-tree indexes on columns referenced in RLS policies:
```sql
CREATE INDEX idx_conversations_athlete_id ON conversations(athlete_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_workout_logs_athlete_id ON workout_logs(athlete_id);
CREATE INDEX idx_training_plan_days_week_id ON training_plan_days(training_plan_week_id);
```

Wrap `auth.uid()` in subselect for plan caching:
```sql
-- Before:
auth.uid() = user_id
-- After:
(SELECT auth.uid()) = user_id
```

### T.3 Supabase Realtime

Subscribe to `postgres_changes` on key tables. Invalidate React Query caches on change.

### T.4 Font loading

Currently fonts are defined in CSS but not loaded via `next/font/google`. Add to root layout:
```ts
import { Barlow_Condensed, IBM_Plex_Sans, JetBrains_Mono } from 'next/font/google';
```

---

## Risk Matrix

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| System prompt change breaks eval scores | HIGH | MEDIUM | Re-run 59-scenario eval immediately after change |
| Nebius model doesn't support AI SDK tool calling format | HIGH | LOW | Test with a simple tool call first before full migration |
| useChat message persistence differs from current approach | MEDIUM | MEDIUM | Keep server-side persistence in onFinish callback |
| Cold start latency increases with tool calling (multiple round trips) | MEDIUM | MEDIUM | Set `stopWhen: stepCountIs(3)` to limit tool-calling depth |
| Web Worker timer doesn't work on all mobile browsers | MEDIUM | LOW | Fallback to `requestAnimationFrame` + `Date.now()` |
| React Compiler breaks existing components | LOW | MEDIUM | Enable incrementally, test each page |

---

## File Change Summary

### New Files (13)
- `src/lib/ai/nebius.ts` — Provider setup
- `src/lib/ai/tools.ts` — 10 coaching tool definitions
- `src/lib/ai/athlete-context.ts` — Athlete profile formatting
- `src/components/coach/tool-cards/*.tsx` — 9 tool result card components
- `src/components/coach/tool-result-renderer.tsx` — Tool card router
- `src/components/training/rpe-slider.tsx` — RPE input
- `src/components/training/section-logger.tsx` — Per-section workout logging
- `src/components/training/workout-summary.tsx` — Post-workout screen
- `src/lib/workout-timer.worker.ts` — Web Worker timer
- `src/app/(app)/training/workout/[id]/page.tsx` — Workout execution page

### Modified Files (8)
- `src/app/api/chat/route.ts` — Rewrite for streamText
- `src/app/(app)/coach/page.tsx` — Rewrite for useChat
- `src/components/coach/chat-message.tsx` — Render parts, not content
- `src/components/coach/chat-input.tsx` — Adapt to useChat sendMessage
- `src/components/coach/training-plan-card.tsx` — Tool-based triggers
- `src/app/api/training-plans/extract/route.ts` — Use generateObject
- `src/lib/coach/system-prompt.ts` — RAG → tool instructions
- `next.config.ts` — React Compiler (optional)

### Deleted Files (1)
- `src/lib/coach/pipeline.ts` — Replaced by ai/ modules

### Database Changes
- New indexes on RLS-referenced columns
- No new tables in Phase 1-3 (all schemas exist)

---

## Implementation Priority Order

1. **Phase 1 (AI SDK Migration)** — Everything depends on this. Ship as one atomic change.
2. **Phase 2 (Tool Result Cards)** — Makes tools visible. Ship alongside or immediately after Phase 1.
3. **Phase 5 (Calendar Polish)** — Low risk, high user value, can ship in parallel.
4. **Phase 3 (Workout Experience)** — The biggest user-facing feature. Ship after AI SDK is stable.
5. **Phase 4 (Dashboard)** — Visual polish, ship after core features work.
6. **Phase 6 (Remaining)** — Ship incrementally.
7. **Technical Debt** — Ship as maintenance alongside feature work.
