import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/messages/:id/feedback — Submit thumbs up/down
export async function POST(
  request: Request,
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

  const { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Verify the message belongs to a conversation owned by the user
  const { data: message } = await supabase
    .from('messages')
    .select('id, conversation_id')
    .eq('id', id)
    .single();

  if (!message || !message.conversation_id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id')
    .eq('id', message.conversation_id)
    .eq('athlete_id', profile.id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const feedback = body.feedback as string;

  if (!['positive', 'negative', null].includes(feedback)) {
    return NextResponse.json(
      { error: 'Feedback must be "positive", "negative", or null' },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from('messages')
    .update({ feedback })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
