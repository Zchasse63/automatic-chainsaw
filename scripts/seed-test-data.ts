import { createClient } from '@supabase/supabase-js';

/**
 * Standalone seed script — creates a test user + populates 30 days of
 * realistic Hyrox training data. Uses service_role key to bypass RLS.
 *
 * Usage: bun run scripts/seed-test-data.ts
 */

const SUPABASE_URL = 'https://txwkfaygckwxddxjlsun.supabase.co';
const SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4d2tmYXlnY2t3eGRkeGpsc3VuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTIyNzYwMSwiZXhwIjoyMDg2ODAzNjAxfQ.z3I8kGPdyF__yAooDQhiGxI7nVYvaRagDstC_2d2_Gk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = 'test@hyrox-coach.dev';
const TEST_PASSWORD = 'testpass123!';

async function main() {
  console.log('🏋️ Hyrox AI Coach — Seed Script\n');

  // ── 1. Create or find test user ─────────────────────────────────────
  let userId: string;

  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users?.find((u) => u.email === TEST_EMAIL);

  if (existing) {
    userId = existing.id;
    console.log(`✓ Found existing test user: ${TEST_EMAIL} (${userId})`);
  } else {
    const { data: newUser, error: createErr } =
      await supabase.auth.admin.createUser({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        email_confirm: true,
      });
    if (createErr || !newUser.user) {
      console.error('✗ Failed to create user:', createErr?.message);
      process.exit(1);
    }
    userId = newUser.user.id;
    console.log(`✓ Created test user: ${TEST_EMAIL} (${userId})`);
  }

  // ── 2. Ensure athlete profile ──────────────────────────────────────
  let { data: profile } = await supabase
    .from('athlete_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (!profile) {
    const { data: newProfile, error: profileErr } = await supabase
      .from('athlete_profiles')
      .insert({
        user_id: userId,
        display_name: 'Test Athlete',
        date_of_birth: '1990-06-15',
        sex: 'male',
        weight_kg: 82,
        height_cm: 180,
        hyrox_division: 'open',
        hyrox_race_count: 2,
        training_history: {
          experience: 'intermediate',
          run_mpw: 35,
          strength_days: 4,
        },
        current_phase: 'specific_prep',
        race_date: new Date(Date.now() + 63 * 86400000)
          .toISOString()
          .split('T')[0],
        goal_time_minutes: 75,
        weekly_availability_hours: 10,
        equipment_available: [
          'barbell',
          'dumbbells',
          'ski_erg',
          'rower',
          'sled',
          'wall_balls',
        ],
        injuries_limitations: [],
      })
      .select('id')
      .single();

    if (profileErr) {
      console.error('✗ Profile error:', profileErr.message);
      process.exit(1);
    }
    profile = newProfile;
    console.log('✓ Created athlete profile');
  } else {
    await supabase
      .from('athlete_profiles')
      .update({
        race_date: new Date(Date.now() + 63 * 86400000)
          .toISOString()
          .split('T')[0],
        goal_time_minutes: 75,
        current_phase: 'specific_prep',
        hyrox_division: 'open',
      })
      .eq('id', profile.id);
    console.log('✓ Updated athlete profile');
  }

  const athleteId = profile!.id;

  // ── 3. Seed daily_metrics (30 days) ────────────────────────────────
  const dailyMetrics = [];
  const baseHRV = 68;
  const baseRHR = 57;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0];
    const dow = d.getDay();
    const isRest = dow === 0 || dow === 6;

    const noise = Math.sin(i * 0.5) * 8 + Math.cos(i * 0.3) * 5;
    const hrv = Math.round(baseHRV + noise + (isRest ? 6 : 0));
    const rhr = Math.round(baseRHR - noise * 0.4 + (isRest ? -2 : 0));
    const sleep =
      Math.round((7 + Math.sin(i * 0.4) * 1.2 + (isRest ? 0.8 : 0)) * 10) /
      10;
    const stress = Math.round(
      Math.max(10, Math.min(90, 45 + noise * 2))
    );
    const recovery = Math.round(
      Math.max(25, Math.min(95, 65 + noise + (isRest ? 10 : -5)))
    );
    const readiness = Math.round(
      Math.max(20, Math.min(95, 60 + noise * 0.8 + (isRest ? 12 : -3)))
    );

    dailyMetrics.push({
      user_id: userId,
      date: dateStr,
      hrv_ms: hrv,
      rhr_bpm: rhr,
      sleep_hours: sleep,
      stress_score: stress,
      recovery_score: recovery,
      readiness_score: readiness,
      source: 'manual',
    });
  }

  const { error: metricsErr } = await supabase
    .from('daily_metrics')
    .upsert(dailyMetrics, { onConflict: 'user_id,date' });

  if (metricsErr) {
    console.error('✗ Metrics error:', metricsErr.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${dailyMetrics.length} daily metrics`);

  // ── 4. Seed workout_logs (~22 workouts over 30 days) ───────────────
  // Clear existing workouts for this athlete to avoid duplicates
  await supabase.from('workout_sets').delete().eq('workout_log_id',
    // Delete sets for this athlete's workouts
    supabase.from('workout_logs').select('id').eq('athlete_id', athleteId)
  );
  await supabase.from('workout_logs').delete().eq('athlete_id', athleteId);

  const sessionTypes = [
    'run',
    'hiit',
    'strength',
    'run',
    'simulation',
  ] as const;
  const sessionLabels: Record<string, string> = {
    run: 'Tempo Run 8km',
    hiit: 'EMOM Sled Intervals',
    strength: 'Upper Body Strength',
    simulation: 'Full Hyrox Simulation',
  };

  const workouts = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    const dateStr = d.toISOString().split('T')[0];
    const typeIdx = i % sessionTypes.length;
    const sessionType = sessionTypes[typeIdx];
    const duration =
      sessionType === 'simulation' ? 80 : sessionType === 'run' ? 55 : 45;
    const rpe =
      sessionType === 'simulation' ? 9 : sessionType === 'hiit' ? 8 : 7;
    const volumeKg =
      sessionType === 'strength'
        ? 2800 + Math.round(Math.random() * 500)
        : null;
    const distanceKm =
      sessionType === 'run'
        ? 8 + Math.round(Math.random() * 4)
        : sessionType === 'simulation'
          ? 8
          : null;
    const load = Math.round(duration * rpe * 0.12);

    workouts.push({
      athlete_id: athleteId,
      date: dateStr,
      session_type: sessionType,
      duration_minutes: duration,
      rpe_post: rpe,
      notes: sessionLabels[sessionType] ?? null,
      completion_status: 'completed',
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
    console.error('✗ Workouts error:', workoutErr.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${insertedWorkouts?.length ?? 0} workouts`);

  // ── 5. Seed workout_sets for last 3 workouts ──────────────────────
  const workoutIds = insertedWorkouts?.map((w) => w.id) ?? [];
  if (workoutIds.length > 0) {
    const sets = [];
    const exerciseTemplates = [
      { name: 'Ski Erg', category: 'Ski Erg', distance_meters: 1000, duration_seconds: 252 },
      { name: 'Sled Push', category: 'Sled Push', distance_meters: 50, duration_seconds: 100 },
      { name: 'Sled Pull', category: 'Sled Pull', distance_meters: 50, duration_seconds: 115 },
      { name: 'Burpee Broad Jump', category: 'Burpee Broad Jump', distance_meters: 80, duration_seconds: 210 },
      { name: 'Row Erg', category: 'Rowing', distance_meters: 1000, duration_seconds: 238 },
      { name: 'Farmers Carry', category: 'Farmers Carry', distance_meters: 200, duration_seconds: 80 },
      { name: 'Sandbag Lunges', category: 'Sandbag Lunges', distance_meters: 100, duration_seconds: 160 },
      { name: 'Wall Balls', category: 'Wall Balls', reps: 100, duration_seconds: 195 },
    ];

    for (const wid of workoutIds.slice(-3)) {
      for (let s = 0; s < exerciseTemplates.length; s++) {
        const tmpl = exerciseTemplates[s];
        sets.push({
          workout_log_id: wid,
          exercise_name: tmpl.name,
          exercise_category: tmpl.category,
          set_number: s + 1,
          reps: (tmpl as Record<string, unknown>).reps ?? null,
          distance_meters: tmpl.distance_meters ?? null,
          duration_seconds: tmpl.duration_seconds
            ? tmpl.duration_seconds + Math.round((Math.random() - 0.5) * 20)
            : null,
          status: 'done',
          rpe: 7 + Math.floor(Math.random() * 3),
        });
      }
    }

    const { error: setsErr } = await supabase.from('workout_sets').insert(sets);
    if (setsErr) console.warn('⚠ Sets warning:', setsErr.message);
    else console.log(`✓ Seeded ${sets.length} workout sets`);
  }

  // ── 6. Seed personal_records ───────────────────────────────────────
  await supabase.from('personal_records').delete().eq('athlete_id', athleteId);

  const prs = [
    { record_type: 'station_time', exercise_name: 'Ski Erg 1km', value: 252, value_unit: 'seconds', date_achieved: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Row Erg 1km', value: 238, value_unit: 'seconds', date_achieved: new Date(Date.now() - 8 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Sled Push 50m', value: 100, value_unit: 'seconds', date_achieved: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Sled Pull 50m', value: 115, value_unit: 'seconds', date_achieved: new Date(Date.now() - 12 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Wall Balls 100', value: 195, value_unit: 'seconds', date_achieved: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Farmers Carry 200m', value: 80, value_unit: 'seconds', date_achieved: new Date(Date.now() - 15 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Sandbag Lunges 100m', value: 160, value_unit: 'seconds', date_achieved: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0] },
    { record_type: 'station_time', exercise_name: 'Burpee Broad Jump 80m', value: 210, value_unit: 'seconds', date_achieved: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0] },
    { record_type: 'race_time', exercise_name: 'Hyrox Total', value: 4710, value_unit: 'seconds', date_achieved: new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0] },
    { record_type: 'running_pace', exercise_name: '5K Run', value: 4.26, value_unit: 'min_per_km', date_achieved: new Date(Date.now() - 18 * 86400000).toISOString().split('T')[0] },
  ];

  const { error: prErr } = await supabase
    .from('personal_records')
    .insert(prs.map((pr) => ({ ...pr, athlete_id: athleteId })));

  if (prErr) console.warn('⚠ PRs warning:', prErr.message);
  else console.log(`✓ Seeded ${prs.length} personal records`);

  // ── 7. Seed benchmark_tests ────────────────────────────────────────
  await supabase.from('benchmark_tests').delete().eq('athlete_id', athleteId);

  // Station UUIDs from hyrox_stations table
  const benchmarks = [
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000001', results: { time_seconds: 252, distance_m: 1000 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000002', results: { time_seconds: 100, distance_m: 50 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000003', results: { time_seconds: 115, distance_m: 50 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000004', results: { time_seconds: 210, distance_m: 80 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000005', results: { time_seconds: 238, distance_m: 1000 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000006', results: { time_seconds: 80, distance_m: 200 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000007', results: { time_seconds: 160, distance_m: 100 } },
    { test_type: 'station_time', station_id: '00000000-0000-0000-0000-000000000008', results: { time_seconds: 195, reps: 100 } },
  ];

  const { error: benchErr } = await supabase
    .from('benchmark_tests')
    .insert(
      benchmarks.map((b) => ({
        ...b,
        athlete_id: athleteId,
        test_date: new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0],
      }))
    );

  if (benchErr) console.warn('⚠ Benchmarks warning:', benchErr.message);
  else console.log(`✓ Seeded ${benchmarks.length} benchmark tests`);

  // ── Done ───────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log(`\n📧 Login credentials:`);
  console.log(`   Email:    ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log(`\n🔗 Open http://localhost:3000/login to sign in`);
}

main().catch(console.error);
