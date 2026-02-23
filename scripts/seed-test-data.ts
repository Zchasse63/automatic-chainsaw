import { createClient } from '@supabase/supabase-js';

/**
 * Standalone seed script — creates a test user + populates 30 days of
 * realistic Hyrox training data including a full training plan.
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

/** Format a Date to YYYY-MM-DD using local timezone (avoids UTC date shift) */
function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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

  const raceDate = new Date(Date.now() + 63 * 86400000);

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
        race_date: toLocalDateStr(raceDate),
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
        race_date: toLocalDateStr(raceDate),
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
    const dateStr = toLocalDateStr(d);
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
  const { data: existingLogs } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('athlete_id', athleteId);
  if (existingLogs && existingLogs.length > 0) {
    await supabase
      .from('workout_sets')
      .delete()
      .in('workout_log_id', existingLogs.map((r) => r.id));
  }
  await supabase.from('workout_logs').delete().eq('athlete_id', athleteId);

  // Weekly session rotation based on day of week
  // Mon=1, Tue=2, Wed=3, Thu=4, Fri=5 (JS getDay convention)
  const daySessionMap: Record<number, string> = {
    1: 'run',           // Monday: easy/tempo run
    2: 'hiit',          // Tuesday: HIIT/EMOM
    3: 'strength',      // Wednesday: strength
    4: 'run',           // Thursday: interval run
    5: 'simulation',    // Friday: Hyrox sim or station practice
  };

  const sessionLabels: Record<string, string[]> = {
    run: ['Tempo Run 8km', 'Interval Run 6x800m', 'Easy Run 10km', 'Threshold Run 5km'],
    hiit: ['EMOM Sled Intervals', 'Tabata Wall Balls', 'AMRAP Station Circuit', 'Ski Erg Intervals'],
    strength: ['Upper Body Strength', 'Lower Body Power', 'Full Body Functional', 'Push/Pull Session'],
    simulation: ['Full Hyrox Simulation', 'Half Sim (4 Stations)', 'Station Practice: Sled', 'Station Practice: Carry + Lunges'],
    station_practice: ['Ski Erg + Row Technique', 'Sled Push/Pull Drills', 'Wall Ball Endurance', 'Farmers Carry Progression'],
    recovery: ['Recovery Jog + Stretch', 'Active Recovery Session'],
  };

  const workouts = [];
  let workoutCounter = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dow = d.getDay(); // 0=Sun, 1=Mon..6=Sat
    if (dow === 0 || dow === 6) continue; // Skip weekends

    const dateStr = toLocalDateStr(d);

    // Get session type from day-of-week mapping
    let sessionType = daySessionMap[dow] ?? 'run';

    // Every 3rd week, swap Friday to station_practice instead of simulation
    const weekNum = Math.floor(i / 7);
    if (dow === 5 && weekNum % 3 === 0) {
      sessionType = 'station_practice';
    }

    const duration =
      sessionType === 'simulation' ? 80 :
      sessionType === 'run' ? 45 + Math.round(Math.random() * 15) :
      sessionType === 'hiit' ? 35 + Math.round(Math.random() * 10) :
      sessionType === 'station_practice' ? 50 + Math.round(Math.random() * 10) :
      40 + Math.round(Math.random() * 15);

    const rpe =
      sessionType === 'simulation' ? 9 :
      sessionType === 'hiit' ? 7 + Math.round(Math.random()) :
      sessionType === 'station_practice' ? 7 :
      sessionType === 'run' ? 6 + Math.round(Math.random()) :
      7;

    const volumeKg =
      sessionType === 'strength'
        ? 2800 + Math.round(Math.random() * 500)
        : null;
    const distanceKm =
      sessionType === 'run'
        ? 6 + Math.round(Math.random() * 6)
        : sessionType === 'simulation'
          ? 8
          : null;
    const load = Math.round(duration * rpe * 0.12);

    const labels = sessionLabels[sessionType] ?? ['Workout'];
    const label = labels[workoutCounter % labels.length];

    workouts.push({
      athlete_id: athleteId,
      date: dateStr,
      session_type: sessionType,
      duration_minutes: duration,
      rpe_post: rpe,
      notes: label,
      completion_status: 'completed',
      total_volume_kg: volumeKg,
      total_distance_km: distanceKm,
      training_load: load,
    });

    workoutCounter++;
  }

  const { data: insertedWorkouts, error: workoutErr } = await supabase
    .from('workout_logs')
    .insert(workouts)
    .select('id');

  if (workoutErr) {
    console.error('✗ Workouts error:', workoutErr.message);
    process.exit(1);
  }
  console.log(`✓ Seeded ${insertedWorkouts?.length ?? 0} workouts across the last 30 days`);

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
    { record_type: 'station_time', exercise_name: 'Ski Erg 1km', value: 252, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 5 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Row Erg 1km', value: 238, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 8 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Sled Push 50m', value: 100, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 12 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Sled Pull 50m', value: 115, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 12 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Wall Balls 100', value: 195, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 3 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Farmers Carry 200m', value: 80, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 15 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Sandbag Lunges 100m', value: 160, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 7 * 86400000)) },
    { record_type: 'station_time', exercise_name: 'Burpee Broad Jump 80m', value: 210, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 10 * 86400000)) },
    { record_type: 'race_time', exercise_name: 'Hyrox Total', value: 4710, value_unit: 'seconds', date_achieved: toLocalDateStr(new Date(Date.now() - 20 * 86400000)) },
    { record_type: 'running_pace', exercise_name: '5K Run', value: 4.26, value_unit: 'min_per_km', date_achieved: toLocalDateStr(new Date(Date.now() - 18 * 86400000)) },
  ];

  const { error: prErr } = await supabase
    .from('personal_records')
    .insert(prs.map((pr) => ({ ...pr, athlete_id: athleteId })));

  if (prErr) console.warn('⚠ PRs warning:', prErr.message);
  else console.log(`✓ Seeded ${prs.length} personal records`);

  // ── 7. Seed benchmark_tests ────────────────────────────────────────
  await supabase.from('benchmark_tests').delete().eq('athlete_id', athleteId);

  // Station UUIDs from hyrox_stations table (seeded in migration)
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
        test_date: toLocalDateStr(new Date(Date.now() - 14 * 86400000)),
      }))
    );

  if (benchErr) console.warn('⚠ Benchmarks warning:', benchErr.message);
  else console.log(`✓ Seeded ${benchmarks.length} benchmark tests`);

  // ── 8. Seed training plan (4-week block) ───────────────────────────
  // Clean up any existing plans for this athlete
  const { data: existingPlans } = await supabase
    .from('training_plans')
    .select('id')
    .eq('athlete_id', athleteId);

  if (existingPlans && existingPlans.length > 0) {
    for (const plan of existingPlans) {
      const { data: weeks } = await supabase
        .from('training_plan_weeks')
        .select('id')
        .eq('training_plan_id', plan.id);
      if (weeks) {
        for (const week of weeks) {
          await supabase.from('training_plan_days').delete().eq('training_plan_week_id', week.id);
        }
        await supabase.from('training_plan_weeks').delete().eq('training_plan_id', plan.id);
      }
      await supabase.from('training_plans').delete().eq('id', plan.id);
    }
    console.log('✓ Cleaned up existing training plans');
  }

  // Create a 4-week training plan starting 2 weeks ago (aligned to Monday)
  const planStart = new Date(Date.now() - 14 * 86400000);
  const planStartDow = planStart.getDay();
  const planStartMonday = new Date(planStart);
  planStartMonday.setDate(planStart.getDate() - ((planStartDow + 6) % 7));

  const planEnd = new Date(planStartMonday);
  planEnd.setDate(planStartMonday.getDate() + 28 - 1);

  const { data: newPlan, error: planErr } = await supabase
    .from('training_plans')
    .insert({
      athlete_id: athleteId,
      plan_name: 'Hyrox Specific Prep Block',
      start_date: toLocalDateStr(planStartMonday),
      end_date: toLocalDateStr(planEnd),
      duration_weeks: 4,
      status: 'active',
      difficulty: 'intermediate',
      goal: 'Build Hyrox-specific fitness with balanced running and station work',
      is_ai_generated: true,
    })
    .select('id')
    .single();

  if (planErr || !newPlan) {
    console.error('✗ Training plan error:', planErr?.message);
    process.exit(1);
  }
  console.log(`✓ Created training plan: Hyrox Specific Prep Block`);

  // Weekly templates — day_of_week: 0=Mon, 1=Tue, ..., 6=Sun
  const weeklyTemplates = [
    {
      focus: 'Base Building',
      target_volume_hours: 8,
      days: [
        { day_of_week: 0, session_type: 'run', workout_title: 'Easy Aerobic Run', workout_description: '8km easy pace with strides', estimated_duration_minutes: 50, is_rest_day: false },
        { day_of_week: 1, session_type: 'hiit', workout_title: 'EMOM Station Circuit', workout_description: '20min EMOM: ski erg, wall balls, burpee broad jumps', estimated_duration_minutes: 40, is_rest_day: false },
        { day_of_week: 2, session_type: 'strength', workout_title: 'Upper Body Power', workout_description: 'Bench press, rows, overhead press — 4x6 heavy', estimated_duration_minutes: 50, is_rest_day: false },
        { day_of_week: 3, session_type: 'run', workout_title: 'Tempo Run', workout_description: '6km at threshold pace', estimated_duration_minutes: 45, is_rest_day: false },
        { day_of_week: 4, session_type: 'simulation', workout_title: 'Half Hyrox Sim', workout_description: '4 stations + 4x1km run segments', estimated_duration_minutes: 65, is_rest_day: false },
        { day_of_week: 5, session_type: 'recovery', workout_title: 'Active Recovery', workout_description: 'Light jog, foam rolling, mobility', estimated_duration_minutes: 30, is_rest_day: false },
        { day_of_week: 6, session_type: null, workout_title: 'Rest Day', workout_description: 'Full rest — sleep and nutrition focus', estimated_duration_minutes: null, is_rest_day: true },
      ],
    },
    {
      focus: 'Intensity Build',
      target_volume_hours: 9,
      days: [
        { day_of_week: 0, session_type: 'run', workout_title: 'Interval Run', workout_description: '6x800m at 5K pace, 90s recovery', estimated_duration_minutes: 55, is_rest_day: false },
        { day_of_week: 1, session_type: 'station_practice', workout_title: 'Sled Push/Pull Focus', workout_description: 'Technique work + 6x50m push, 6x50m pull', estimated_duration_minutes: 45, is_rest_day: false },
        { day_of_week: 2, session_type: 'strength', workout_title: 'Lower Body Strength', workout_description: 'Squats, lunges, deadlift — 5x5 progressive', estimated_duration_minutes: 55, is_rest_day: false },
        { day_of_week: 3, session_type: 'run', workout_title: 'Threshold Intervals', workout_description: '3x2km at race pace, 2min rest', estimated_duration_minutes: 50, is_rest_day: false },
        { day_of_week: 4, session_type: 'hiit', workout_title: 'Tabata Station Blitz', workout_description: '8 rounds: 20s max effort, 10s rest — rotate stations', estimated_duration_minutes: 40, is_rest_day: false },
        { day_of_week: 5, session_type: 'recovery', workout_title: 'Recovery Jog + Mobility', workout_description: '5km easy, 20min stretching', estimated_duration_minutes: 35, is_rest_day: false },
        { day_of_week: 6, session_type: null, workout_title: 'Rest Day', workout_description: 'Full rest', estimated_duration_minutes: null, is_rest_day: true },
      ],
    },
    {
      focus: 'Race Simulation',
      target_volume_hours: 10,
      days: [
        { day_of_week: 0, session_type: 'run', workout_title: 'Long Run', workout_description: '12km steady state at easy pace', estimated_duration_minutes: 65, is_rest_day: false },
        { day_of_week: 1, session_type: 'hiit', workout_title: 'AMRAP Hyrox Circuit', workout_description: '25min AMRAP: ski erg, sled push, wall balls, run 400m', estimated_duration_minutes: 45, is_rest_day: false },
        { day_of_week: 2, session_type: 'strength', workout_title: 'Full Body Functional', workout_description: 'Farmers carry, lunges, deadlift, overhead press — circuit', estimated_duration_minutes: 50, is_rest_day: false },
        { day_of_week: 3, session_type: 'run', workout_title: 'Race Pace Run', workout_description: '8km at Hyrox target run pace', estimated_duration_minutes: 50, is_rest_day: false },
        { day_of_week: 4, session_type: 'simulation', workout_title: 'Full Hyrox Simulation', workout_description: 'All 8 stations + 8x1km runs — full race simulation', estimated_duration_minutes: 85, is_rest_day: false },
        { day_of_week: 5, session_type: 'recovery', workout_title: 'Active Recovery', workout_description: 'Easy swim or walk, foam rolling', estimated_duration_minutes: 30, is_rest_day: false },
        { day_of_week: 6, session_type: null, workout_title: 'Rest Day', workout_description: 'Full rest — focus on sleep', estimated_duration_minutes: null, is_rest_day: true },
      ],
    },
    {
      focus: 'Taper & Peak',
      target_volume_hours: 7,
      days: [
        { day_of_week: 0, session_type: 'run', workout_title: 'Easy Shakeout Run', workout_description: '6km easy with 4 strides', estimated_duration_minutes: 40, is_rest_day: false },
        { day_of_week: 1, session_type: 'station_practice', workout_title: 'Station Technique Refresh', workout_description: 'Light technique work — all 8 stations, no intensity', estimated_duration_minutes: 35, is_rest_day: false },
        { day_of_week: 2, session_type: 'strength', workout_title: 'Maintenance Strength', workout_description: 'Light full body — 3x8 moderate weight', estimated_duration_minutes: 35, is_rest_day: false },
        { day_of_week: 3, session_type: 'run', workout_title: 'Pre-Race Intervals', workout_description: '4x400m fast with 2min recovery', estimated_duration_minutes: 35, is_rest_day: false },
        { day_of_week: 4, session_type: 'recovery', workout_title: 'Light Movement', workout_description: 'Easy 3km jog + dynamic stretching', estimated_duration_minutes: 25, is_rest_day: false },
        { day_of_week: 5, session_type: null, workout_title: 'Rest Day', workout_description: 'Complete rest before race week', estimated_duration_minutes: null, is_rest_day: true },
        { day_of_week: 6, session_type: null, workout_title: 'Rest Day', workout_description: 'Full rest', estimated_duration_minutes: null, is_rest_day: true },
      ],
    },
  ];

  let totalDaysCreated = 0;
  let completedDays = 0;

  for (let w = 0; w < 4; w++) {
    const template = weeklyTemplates[w];
    const { data: week, error: weekErr } = await supabase
      .from('training_plan_weeks')
      .insert({
        training_plan_id: newPlan.id,
        week_number: w + 1,
        focus: template.focus,
        target_volume_hours: template.target_volume_hours,
      })
      .select('id')
      .single();

    if (weekErr || !week) {
      console.error(`✗ Week ${w + 1} error:`, weekErr?.message);
      continue;
    }

    // Determine which days should be marked as completed (past non-rest days)
    const weekStartDate = new Date(planStartMonday);
    weekStartDate.setDate(planStartMonday.getDate() + w * 7);
    const now = new Date();

    const days = template.days.map((day) => {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + day.day_of_week);
      const isInPast = dayDate < now;
      const isCompleted = isInPast && !day.is_rest_day;
      if (isCompleted) completedDays++;

      return {
        training_plan_week_id: week.id,
        day_of_week: day.day_of_week,
        session_type: day.session_type,
        workout_title: day.workout_title,
        workout_description: day.workout_description,
        estimated_duration_minutes: day.estimated_duration_minutes,
        is_rest_day: day.is_rest_day ?? false,
        is_completed: isCompleted,
      };
    });

    const { error: daysErr } = await supabase
      .from('training_plan_days')
      .insert(days);

    if (daysErr) {
      console.error(`✗ Week ${w + 1} days error:`, daysErr.message);
    } else {
      totalDaysCreated += days.length;
    }
  }

  console.log(`✓ Seeded 4 weeks × 7 days = ${totalDaysCreated} training plan days (${completedDays} completed)`);

  // ── Done ───────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!');
  console.log(`\n📧 Login credentials:`);
  console.log(`   Email:    ${TEST_EMAIL}`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log(`\n🔗 Open http://localhost:3000/login to sign in`);
}

main().catch(console.error);
