import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TrainingPlanSchema } from '@/lib/coach/training-plan-schema';

const nebius = new OpenAI({
  baseURL: 'https://api.tokenfactory.nebius.com/v1/',
  apiKey: process.env.NEBIUS_API_KEY!,
});

const EXTRACTION_PROMPT = `You are a JSON extraction engine. Given a training plan written in natural language by a Hyrox coach, extract it into structured JSON.

Output ONLY valid JSON matching this schema (no markdown, no explanation):

{
  "plan_name": "string — short name for the plan",
  "goal": "string — the athlete's goal",
  "duration_weeks": number,
  "difficulty": "beginner | intermediate | advanced",
  "weeks": [
    {
      "week_number": 1,
      "focus": "string — what this week emphasizes",
      "days": [
        {
          "day_of_week": 0,  // 0=Monday, 1=Tuesday, ..., 6=Sunday
          "session_type": "run | hiit | strength | simulation | recovery | station_practice | general",
          "workout_title": "string — short title",
          "workout_description": "string — full workout details",
          "estimated_duration_minutes": number,
          "is_rest_day": false
        }
      ]
    }
  ]
}

Rules:
- day_of_week: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
- Include rest days with is_rest_day: true
- For multi-week plans with repeating templates, expand at least the first 4 weeks explicitly
- If the plan says "4 sessions per week", fill in rest days for the other 3 days
- session_type must be one of: run, hiit, strength, simulation, recovery, station_practice, general
- Output ONLY the JSON object, nothing else`;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { messageContent } = await request.json();

  if (!messageContent || typeof messageContent !== 'string') {
    return NextResponse.json(
      { error: 'messageContent is required' },
      { status: 400 }
    );
  }

  try {
    // Use base Llama model for structured extraction (not fine-tuned)
    const completion = await nebius.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        {
          role: 'user',
          content: `Extract the training plan from this coaching response:\n\n${messageContent}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 4000,
    });

    const rawJson = completion.choices[0]?.message?.content?.trim();
    if (!rawJson) {
      return NextResponse.json(
        { error: 'No response from extraction model' },
        { status: 500 }
      );
    }

    // Clean up potential markdown code fences
    const cleaned = rawJson
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    const validated = TrainingPlanSchema.parse(parsed);

    return NextResponse.json({ plan: validated });
  } catch (err) {
    console.error('Plan extraction error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to extract training plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
