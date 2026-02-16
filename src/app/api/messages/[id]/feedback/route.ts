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
