import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations/:id/messages — Load conversation history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
}
