import { generateObject } from 'ai';
import { BASE_LLAMA_MODEL } from '@/lib/ai/nebius';
import { TrainingPlanSchema } from '@/lib/coach/training-plan-schema';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

const EXTRACTION_PROMPT = `You are a JSON extraction engine. Given a training plan written in natural language by a Hyrox coach, extract it into structured JSON.

Rules:
- day_of_week: 0=Monday, 1=Tuesday, 2=Wednesday, 3=Thursday, 4=Friday, 5=Saturday, 6=Sunday
- Include rest days with is_rest_day: true
- For multi-week plans with repeating templates, expand at least the first 4 weeks explicitly
- If the plan says "4 sessions per week", fill in rest days for the other 3 days
- session_type must be one of: run, hiit, strength, simulation, recovery, station_practice, general`;

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
    const { object: plan } = await generateObject({
      model: BASE_LLAMA_MODEL,
      schema: TrainingPlanSchema,
      system: EXTRACTION_PROMPT,
      prompt: `Extract the training plan from this coaching response:\n\n${messageContent}`,
      temperature: 0.1,
    });

    return NextResponse.json({ plan });
  } catch (err) {
    console.error('Plan extraction error:', err);
    const message =
      err instanceof Error ? err.message : 'Failed to extract training plan';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
