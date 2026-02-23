import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/seed
 *
 * Populates the currently-authenticated user's account with 30 days of
 * realistic Hyrox training data so every page renders with full fidelity.
 *
 * Idempotent — safe to call multiple times (upserts daily_metrics,
 * skips workout_logs if any exist).
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  }

  // ── Ensure athlete profile exists ──────────────────────────────────────
  let { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!profile) {
    const { data: newProfile, error: profileErr } = await supabase
      .from('athlete_profiles')
      .insert({
        user_id: user.id,
        display_name: user.email?.split('@')[0] ?? 'Test Athlete',
        date_of_birth: '1990-06-15',
        sex: 'male',
        weight_kg: 82,
        height_cm: 180,
        hyrox_division: 'Open Men',
        hyrox_race_count: 2,
        training_history: {
          experience: 'intermediate',
          run_mpw: 35,
          strength_days: 4,
        },
        current_phase: 'Build Phase 2',
        race_date: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        goal_time_minutes: 75,
        weekly_availability_hours: 10,
        equipment_available: ['barbell', 'dumbbells', 'ski_erg', 'rower', 'sled', 'wall_balls'],
        injuries_limitations: [],
      })
      .select('id')
      .single();

    if (profileErr) {
      return NextResponse.json({ error: `Profile: ${profileErr.message}` }, { status: 500 });
    }
    profile = newProfile;
  } else {
    // Update profile with race date + phase if missing
    await supabase
      .from('athlete_profiles')
      .update({
        race_date: new Date(Date.now() + 63 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        goal_time_minutes: 75,
        current_phase: 'Build Phase 2',
        hyrox_division: 'Open Men',
      })
      .eq('id', profile.id);
  }

  const athleteId = profile!.id;

  // ── Seed daily_metrics (30 days) ───────────────────────────────────────
  const dailyMetrics = [];
  const baseHRV = 68;
  const baseRHR = 57;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay(); // 0=Sun
    const isRest = dow === 0 || dow === 6;

    const noise = Math.sin(i * 0.5) * 8 + Math.cos(i * 0.3) * 5;
    const hrv = Math.round(baseHRV + noise + (isRest ? 6 : 0));
    const rhr = Math.round(baseRHR - noise * 0.4 + (isRest ? -2 : 0));
    const sleep = Math.round((7 + Math.sin(i * 0.4) * 1.2 + (isRest ? 0.8 : 0)) * 10) / 10;
    const stress = Math.round(Math.max(10, Math.min(90, 45 + noise * 2)));
    const recovery = Math.round(Math.max(25, Math.min(95, 65 + noise + (isRest ? 10 : -5))));
    const readiness = Math.round(Math.max(20, Math.min(95, 60 + noise * 0.8 + (isRest ? 12 : -3))));

    dailyMetrics.push({
      user_id: user.id,
      date: dateStr,
      hrv_ms: hrv,
      rhr_bpm: rhr,
      sleep_hours: sleep,
      stress_score: stress,
      recovery_score: recovery,
      readiness_score: readiness,
      source: 'seed',
    });
  }

  const { error: metricsErr } = await supabase
    .from('daily_metrics')
    .upsert(dailyMetrics, { onConflict: 'user_id,date' });

  if (metricsErr) {
    return NextResponse.json({ error: `Metrics: ${metricsErr.message}` }, { status: 500 });
  }

  // ── Seed workout_logs (last 30 days, ~5/week) ─────────────────────────
  const { data: existingWorkouts } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('athlete_id', athleteId)
    .limit(1);

  const sessionTypes = ['running', 'hiit', 'strength', 'running', 'hyrox_sim'] as const;
  const sessionLabels: Record<string, string> = {
    running: 'Tempo Run 8km',
    hiit: 'EMOM Sled Intervals',
    strength: 'Upper Body Strength',
    hyrox_sim: 'Full Hyrox Simulation',
  };

  const workoutIds: string[] = [];

  if (!existingWorkouts?.length) {
    const workouts = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dow = d.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends

      const dateStr = d.toISOString().split('T')[0];
      const typeIdx = i % sessionTypes.length;
      const sessionType = sessionTypes[typeIdx];
      const duration = sessionType === 'hyrox_sim' ? 80 : sessionType === 'running' ? 55 : 45;
      const rpe = sessionType === 'hyrox_sim' ? 9 : sessionType === 'hiit' ? 8 : 7;
      const volumeKg = sessionType === 'strength' ? 2800 + Math.round(Math.random() * 500) : null;
      const distanceKm = sessionType === 'running' ? 8 + Math.round(Math.random() * 4) : sessionType === 'hyrox_sim' ? 8 : null;
      const load = Math.round(duration * rpe * 0.12);

      workouts.push({
        athlete_id: athleteId,
        date: dateStr,
        session_type: sessionType,
        duration_minutes: duration,
        rpe_post: rpe + (Math.random() > 0.5 ? 0.5 : 0),
        notes: sessionLabels[sessionType] ?? null,
        completion_status: sessionType === 'hyrox_sim' && i < 10 ? 'pr' : 'completed',
        total_volume_kg: volumeKg,
        total_distance_km: distanceKm,
        training_load: load,
      });
    }

    const { data: insertedWorkouts, error: workoutErr } = await supabase
      .from('workout_logs')
      .insert(workouts)
      .select('id');

    if (workoutErr) {
      return NextResponse.json({ error: `Workouts: ${workoutErr.message}` }, { status: 500 });
    }
    if (insertedWorkouts) {
      workoutIds.push(...insertedWorkouts.map((w) => w.id));
    }
  }

  // ── Seed workout_sets for recent workouts ──────────────────────────────
  if (workoutIds.length > 0) {
    const sets = [];
    const exerciseTemplates = [
      { name: 'Ski Erg', category: 'Ski Erg', distance_meters: 1000, duration_seconds: 252 },
      { name: 'Sled Push', category: 'Sled', distance_meters: 50, duration_seconds: 100 },
      { name: 'Sled Pull', category: 'Sled', distance_meters: 50, duration_seconds: 115 },
      { name: 'Burpee Broad Jump', category: 'Burpees', distance_meters: 80, duration_seconds: 210 },
      { name: 'Row Erg', category: 'Rowing', distance_meters: 1000, duration_seconds: 238 },
      { name: 'Farmers Carry', category: 'Farmers', distance_meters: 200, duration_seconds: 80 },
      { name: 'Sandbag Lunges', category: 'Sandbag', distance_meters: 100, duration_seconds: 160 },
      { name: 'Wall Balls', category: 'Wall Balls', reps: 100, duration_seconds: 195 },
    ];

    // Add sets for last 3 workouts only to keep it manageable
    for (const wid of workoutIds.slice(-3)) {
      for (let s = 0; s < exerciseTemplates.length; s++) {
        const tmpl = exerciseTemplates[s];
        sets.push({
          workout_log_id: wid,
          exercise_name: tmpl.name,
          exercise_category: tmpl.category,
          set_number: s + 1,
          reps: tmpl.reps ?? null,
          distance_meters: tmpl.distance_meters ?? null,
          duration_seconds: tmpl.duration_seconds ? tmpl.duration_seconds + Math.round((Math.random() - 0.5) * 20) : null,
          status: 'done',
          rpe: 7 + Math.floor(Math.random() * 3),
        });
      }
    }

    if (sets.length > 0) {
      await supabase.from('workout_sets').insert(sets);
    }
  }

  // ── Seed personal_records ──────────────────────────────────────────────
  const { data: existingPRs } = await supabase
    .from('personal_records')
    .select('id')
    .eq('athlete_id', athleteId)
    .limit(1);

  if (!existingPRs?.length) {
    const prs = [
      { record_type: 'station', exercise_name: 'Ski Erg 1km', value: 252, value_unit: 'seconds', date_achieved: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Row Erg 1km', value: 238, value_unit: 'seconds', date_achieved: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Sled Push 50m', value: 100, value_unit: 'seconds', date_achieved: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Sled Pull 50m', value: 115, value_unit: 'seconds', date_achieved: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Wall Balls 100', value: 195, value_unit: 'seconds', date_achieved: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Farmers Carry 200m', value: 80, value_unit: 'seconds', date_achieved: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Sandbag Lunges 100m', value: 160, value_unit: 'seconds', date_achieved: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'station', exercise_name: 'Burpee Broad Jump 80m', value: 210, value_unit: 'seconds', date_achieved: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'race', exercise_name: 'Hyrox Total', value: 78.5, value_unit: 'minutes', date_achieved: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
      { record_type: 'run', exercise_name: '5K Run', value: 21.3, value_unit: 'minutes', date_achieved: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    ];

    await supabase
      .from('personal_records')
      .insert(prs.map((pr) => ({ ...pr, athlete_id: athleteId })));
  }

  // ── Seed benchmark_tests ───────────────────────────────────────────────
  const { data: existingBenchmarks } = await supabase
    .from('benchmark_tests')
    .select('id')
    .eq('athlete_id', athleteId)
    .limit(1);

  if (!existingBenchmarks?.length) {
    const stationBenchmarks = [
      { test_type: 'station_time', station_name: 'Ski Erg', results: { time_seconds: 252, distance_m: 1000 } },
      { test_type: 'station_time', station_name: 'Sled Push', results: { time_seconds: 100, distance_m: 50 } },
      { test_type: 'station_time', station_name: 'Sled Pull', results: { time_seconds: 115, distance_m: 50 } },
      { test_type: 'station_time', station_name: 'Burpee Broad Jump', results: { time_seconds: 210, distance_m: 80 } },
      { test_type: 'station_time', station_name: 'Row Erg', results: { time_seconds: 238, distance_m: 1000 } },
      { test_type: 'station_time', station_name: 'Farmers Carry', results: { time_seconds: 80, distance_m: 200 } },
      { test_type: 'station_time', station_name: 'Sandbag Lunges', results: { time_seconds: 160, distance_m: 100 } },
      { test_type: 'station_time', station_name: 'Wall Balls', results: { time_seconds: 195, reps: 100 } },
    ];

    await supabase
      .from('benchmark_tests')
      .insert(stationBenchmarks.map((b) => ({
        ...b,
        athlete_id: athleteId,
        test_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })));
  }

  return NextResponse.json({
    success: true,
    athleteId,
    seeded: {
      dailyMetrics: dailyMetrics.length,
      workouts: workoutIds.length,
      personalRecords: existingPRs?.length ? 'skipped (already exist)' : 10,
      benchmarks: existingBenchmarks?.length ? 'skipped (already exist)' : 8,
    },
  });
}
