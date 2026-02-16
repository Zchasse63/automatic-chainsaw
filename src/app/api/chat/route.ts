import { createClient } from '@/lib/supabase/server';
import { runCoachingPipeline } from '@/lib/coach/pipeline';
import { NextResponse } from 'next/server';

export const maxDuration = 60; // Allow up to 60s for cold starts

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { message: string; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }

  const { message, conversationId } = body;

  if (!message?.trim()) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 400 }
    );
  }

  // Get or create conversation
  let convId = conversationId;

  if (!convId) {
    // Get athlete profile ID
    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found. Complete onboarding first.' },
        { status: 400 }
      );
    }

    // Create new conversation
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .insert({
        athlete_id: profile.id,
        title: message.slice(0, 100),
      })
      .select('id')
      .single();

    if (convError) {
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      );
    }

    convId = conv.id;
  }

  // Run the coaching pipeline
  try {
    const { stream } = await runCoachingPipeline(
      message.trim(),
      convId,
      user.id
    );

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'X-Conversation-Id': convId,
      },
    });
  } catch (err) {
    console.error('Pipeline error:', err);

    // Handle Nebius-specific errors
    const error = err as { status?: number; message?: string };

    if (error.status === 503) {
      return NextResponse.json(
        {
          error: 'Coach K is warming up. Please try again in a few seconds.',
          retryable: true,
        },
        { status: 503 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please wait a moment.',
          retryable: true,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Coach K is temporarily unavailable. Please try again.' },
      { status: 500 }
    );
  }
}
