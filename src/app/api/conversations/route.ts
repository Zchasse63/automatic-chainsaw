import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations — List user's conversations
export async function GET(request: NextRequest) {
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
    return NextResponse.json({ conversations: [] });
  }

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(Number(searchParams.get('limit') || '20'), 50);
  const offset = Number(searchParams.get('offset') || '0');

  const { data: conversations, error } = await supabase
    .from('conversations')
    .select('id, title, started_at, updated_at')
    .eq('athlete_id', profile.id)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversations: conversations ?? [] });
}

// POST /api/conversations — Create new conversation
export async function POST(request: Request) {
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
    return NextResponse.json(
      { error: 'Profile not found' },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const title = body.title || 'New Conversation';

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      athlete_id: profile.id,
      title,
    })
    .select('id, title, started_at, updated_at')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ conversation }, { status: 201 });
}
