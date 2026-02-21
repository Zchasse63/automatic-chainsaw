import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { checkAndAwardAchievements } from '@/lib/achievements';
import { createLogger } from '@/lib/logger';

export async function GET() {
  try {
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
      return NextResponse.json({ achievements: [] });
    }

    // Get all achievement definitions
    const { data: definitions } = await supabase
      .from('achievement_definitions')
      .select('id, name, description, icon_name, category, tier')
      .order('category')
      .order('tier');

    // Get athlete's earned achievements
    const { data: earned } = await supabase
      .from('athlete_achievements')
      .select('achievement_id, earned_at')
      .eq('athlete_id', profile.id);

    const earnedMap = new Map(
      (earned ?? []).map((e) => [e.achievement_id, e.earned_at])
    );

    const achievements = (definitions ?? []).map((def) => ({
      id: def.id,
      name: def.name,
      description: def.description,
      icon_name: def.icon_name,
      category: def.category,
      tier: def.tier,
      is_unlocked: earnedMap.has(def.id),
      unlocked_at: earnedMap.get(def.id) ?? null,
    }));

    return NextResponse.json({ achievements });
  } catch (err) {
    createLogger({}).error('GET /api/achievements failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
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
      return NextResponse.json({ newAchievements: [] });
    }

    const newAchievements = await checkAndAwardAchievements(profile.id, supabase, 'workout');

    return NextResponse.json({ newAchievements });
  } catch (err) {
    createLogger({}).error('POST /api/achievements failed', { error: String(err) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
