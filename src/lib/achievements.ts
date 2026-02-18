import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/database';

type AchievementCriteria = {
  type: string;
  threshold?: number;
  [key: string]: Json | undefined;
};

export async function checkAndAwardAchievements(
  athleteId: string,
  supabase: SupabaseClient,
  trigger: 'workout' | 'benchmark' | 'plan_completion'
): Promise<string[]> {
  try {
    const [{ data: definitions }, { data: earned }] = await Promise.all([
      supabase.from('achievement_definitions').select('id, name, description, criteria'),
      supabase
        .from('athlete_achievements')
        .select('achievement_id')
        .eq('athlete_id', athleteId),
    ]);

    if (!definitions || definitions.length === 0) return [];

    const earnedIds = new Set((earned ?? []).map((e) => e.achievement_id));
    const unearned = definitions.filter((d) => !earnedIds.has(d.id));
    if (unearned.length === 0) return [];

    // Fetch counts needed for criteria evaluation
    const [workoutCountRes, benchmarkCountRes, prCountRes, streakRes] = await Promise.all([
      supabase
        .from('workout_logs')
        .select('date', { count: 'exact', head: false })
        .eq('athlete_id', athleteId)
        .is('deleted_at', null)
        .order('date', { ascending: false }),
      supabase
        .from('benchmark_tests')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', athleteId),
      supabase
        .from('personal_records')
        .select('id', { count: 'exact', head: true })
        .eq('athlete_id', athleteId),
      supabase
        .from('workout_logs')
        .select('date')
        .eq('athlete_id', athleteId)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(100),
    ]);

    const workoutCount = workoutCountRes.count ?? workoutCountRes.data?.length ?? 0;
    const benchmarkCount = benchmarkCountRes.count ?? 0;
    const prCount = prCountRes.count ?? 0;
    const recentDates = (streakRes.data ?? []).map((r) => r.date as string);

    function calcStreak(dates: string[]): number {
      if (dates.length === 0) return 0;
      const unique = [...new Set(dates)].sort((a, b) => (a > b ? -1 : 1));
      let streak = 1;
      for (let i = 0; i < unique.length - 1; i++) {
        const curr = new Date(unique[i]);
        const next = new Date(unique[i + 1]);
        const diffDays = Math.round((curr.getTime() - next.getTime()) / 86400000);
        if (diffDays === 1) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    }

    const currentStreak = calcStreak(recentDates);

    function meetsSimpleCriteria(criteria: AchievementCriteria): boolean {
      const { type, threshold = 1 } = criteria;
      switch (type) {
        case 'workout_count':
          return workoutCount >= threshold;
        case 'benchmark_count':
          return benchmarkCount >= threshold;
        case 'personal_record_count':
          return prCount >= threshold;
        case 'streak_days':
          return currentStreak >= threshold;
        default:
          return false;
      }
    }

    const newlyEarned: string[] = [];

    for (const def of unearned) {
      const criteria = def.criteria as AchievementCriteria | null;
      if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) continue;

      const qualifies = meetsSimpleCriteria(criteria);
      if (!qualifies) continue;

      const { error } = await supabase.from('athlete_achievements').insert({
        athlete_id: athleteId,
        achievement_id: def.id,
        earned_at: new Date().toISOString(),
      });

      if (!error) {
        newlyEarned.push(def.name);
      }
    }

    return newlyEarned;
  } catch {
    return [];
  }
}
