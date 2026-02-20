import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations/:id/messages — Load conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Verify the conversation belongs to this user
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('athlete_id', profile.id)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(Number(searchParams.get('limit') || '50'), 100);
    const offset = Number(searchParams.get('offset') || '0');

    const { data: messages, error } = await supabase
      .from('messages')
      .select(
        'id, role, content, feedback, created_at, rag_chunks_used, tokens_in, tokens_out, latency_ms, suggested_actions'
      )
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: messages ?? [] });
  } catch (err) {
    console.error('GET /api/conversations/[id]/messages error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
