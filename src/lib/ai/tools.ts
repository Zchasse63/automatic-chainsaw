import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { retrieveKnowledge } from './rag';
import { computeReadinessScore } from './readiness';

export function createCoachingTools(athleteId: string, userId: string, supabase: SupabaseClient) {
  return {
    search_knowledge_base: tool({
      description:
        'Search the knowledge base for a DIFFERENT query than the user\'s message. Relevant knowledge for the user\'s current question is already provided in context. Only use this tool if you need additional information on a different or more specific topic.',
      inputSchema: z.object({
        query: z.string().describe('The search query — must be different from the user\'s original question'),
      }),
      execute: async ({ query }) => {
        const result = await retrieveKnowledge(query, supabase);
        if (result.chunks.length === 0) {
          return { chunks: [], message: 'No relevant knowledge found.' };
        }
        return {
          chunks: result.formatted.split('\n\n---\n\n'),
          chunkIds: result.chunkIds,
        };
      },
    }),

    create_workout_log: tool({
      description: 'Log a completed workout for the athlete.',
      inputSchema: z.object({
        date: z.string().describe('Workout date YYYY-MM-DD'),
        session_type: z.enum(['run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'general']),
        duration_minutes: z.number().optional().describe('Duration in minutes'),
        rpe_post: z.number().min(1).max(10).optional().describe('RPE 1-10'),
        notes: z.string().optional(),
        total_volume_kg: z.number().optional().describe('Total weight volume in kg (sum of all sets: weight x reps)'),
        total_distance_km: z.number().optional().describe('Total distance in km'),
        training_load: z.number().min(0).max(1000).optional().describe('Training load score 0-1000 (duration x RPE)'),
      }),
      execute: async ({ date, session_type, duration_minutes, rpe_post, notes, total_volume_kg, total_distance_km, training_load }) => {
        const { data, error } = await supabase
          .from('workout_logs')
          .insert({
            athlete_id: athleteId,
            date,
            session_type,
            duration_minutes: duration_minutes ?? null,
            rpe_post: rpe_post ?? null,
            notes: notes ?? null,
            total_volume_kg: total_volume_kg ?? null,
            total_distance_km: total_distance_km ?? null,
            training_load: training_load ?? null,
            completion_status: 'completed',
          })
          .select('id, date, session_type, duration_minutes, rpe_post, total_volume_kg, total_distance_km, training_load')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, workout: data };
      },
    }),

    get_today_workout: tool({
      description: "Get the athlete's scheduled workout for today from their active training plan.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const { data: plan } = await supabase
            .from('training_plans')
            .select('id, start_date, duration_weeks')
            .eq('athlete_id', athleteId)
            .eq('status', 'active')
            .limit(1)
            .single();
          if (!plan?.start_date) return { workout: null, message: 'No active training plan.' };

          const now = new Date();
          const todayDow = (now.getDay() + 6) % 7;
          const startDate = new Date(plan.start_date);
          const diffDays = Math.floor((now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
          const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);

          const { data: weeks } = await supabase
            .from('training_plan_weeks')
            .select('id, week_number, training_plan_days(*)')
            .eq('training_plan_id', plan.id)
            .eq('week_number', currentWeek)
            .single();

          if (!weeks) return { workout: null, message: `No data for week ${currentWeek}.` };

          const todayDay = (weeks.training_plan_days as Array<Record<string, unknown>>)?.find(
            (d) => d.day_of_week === todayDow
          );
          if (!todayDay) return { workout: null, message: 'No workout scheduled today.' };
          return { workout: todayDay, week: currentWeek };
        } catch {
          return { error: true, message: 'Unable to fetch today workout. Please try again.' };
        }
      },
    }),

    get_training_plan: tool({
      description: "Get the athlete's active training plan overview with all weeks and days.",
      inputSchema: z.object({
        week_number: z.number().optional().describe('Specific week number to fetch'),
      }),
      execute: async ({ week_number }) => {
        try {
          const { data: plan } = await supabase
            .from('training_plans')
            .select('id, plan_name, goal, start_date, duration_weeks, status')
            .eq('athlete_id', athleteId)
            .eq('status', 'active')
            .limit(1)
            .single();
          if (!plan) return { plan: null, message: 'No active training plan.' };

          let weeksQuery = supabase
            .from('training_plan_weeks')
            .select('week_number, focus, training_plan_days(day_of_week, session_type, workout_title, workout_description, estimated_duration_minutes, is_rest_day, is_completed)')
            .eq('training_plan_id', plan.id)
            .order('week_number', { ascending: true });

          if (week_number) weeksQuery = weeksQuery.eq('week_number', week_number);

          const { data: weeks } = await weeksQuery;
          return { plan: { ...plan, weeks: weeks ?? [] } };
        } catch {
          return { error: true, message: 'Unable to fetch training plan. Please try again.' };
        }
      },
    }),

    update_training_plan_day: tool({
      description: 'Update a specific day in the training plan (modify workout, mark complete, etc).',
      inputSchema: z.object({
        day_id: z.string().describe('The training_plan_day ID'),
        workout_title: z.string().optional(),
        workout_description: z.string().optional(),
        session_type: z.enum(['run', 'hiit', 'strength', 'simulation', 'recovery', 'station_practice', 'general']).optional(),
        is_completed: z.boolean().optional(),
      }),
      execute: async ({ day_id, ...updates }) => {
        const updateData: Record<string, unknown> = {};
        if (updates.workout_title !== undefined) updateData.workout_title = updates.workout_title;
        if (updates.workout_description !== undefined) updateData.workout_description = updates.workout_description;
        if (updates.session_type !== undefined) updateData.session_type = updates.session_type;
        if (updates.is_completed !== undefined) updateData.is_completed = updates.is_completed;

        const { data, error } = await supabase
          .from('training_plan_days')
          .update(updateData)
          .eq('id', day_id)
          .select('id, day_of_week, workout_title, session_type, is_completed')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, day: data };
      },
    }),

    log_benchmark: tool({
      description: 'Log a benchmark test result (station time, 1K run time, etc).',
      inputSchema: z.object({
        test_type: z.string().describe('Type of benchmark (e.g., "station_time", "1k_run", "5k_run")'),
        station_id: z.string().optional().describe('Station ID if station-specific'),
        results: z.record(z.string(), z.unknown()).describe('Results object with value and unit'),
        notes: z.string().optional(),
      }),
      execute: async ({ test_type, station_id, results, notes }) => {
        const testDate = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('benchmark_tests')
          .insert({
            athlete_id: athleteId,
            test_type,
            station_id: station_id ?? null,
            results,
            notes: notes ?? null,
            test_date: testDate,
          })
          .select('id, test_type, results, test_date')
          .single();
        if (error) return { success: false, error: error.message };

        // Extract numeric value from results for PR comparison
        const newValue = typeof results.value === 'number' ? results.value
          : typeof results.time === 'number' ? results.time
          : Object.values(results).find((v) => typeof v === 'number') as number | undefined;
        const valueUnit = typeof results.unit === 'string' ? results.unit
          : typeof results.value_unit === 'string' ? results.value_unit
          : 'seconds';

        // Map test_type to a valid personal_records record_type enum value
        const recordTypeMap: Record<string, string> = {
          station_time: 'station_time',
          exercise_weight: 'exercise_weight',
          exercise_reps: 'exercise_reps',
          running_pace: 'running_pace',
          race_time: 'race_time',
          '1k_run': 'running_pace',
          '5k_run': 'running_pace',
          '10k_run': 'running_pace',
          half_marathon: 'race_time',
          marathon: 'race_time',
        };
        const mappedRecordType = recordTypeMap[test_type] ?? (station_id ? 'station_time' : 'running_pace');

        let is_pr = false;
        if (newValue !== undefined) {
          // Query existing PR for this mapped record_type (and station_id if applicable)
          let prQuery = supabase
            .from('personal_records')
            .select('id, value, value_unit')
            .eq('athlete_id', athleteId)
            .eq('record_type', mappedRecordType);
          if (station_id) prQuery = prQuery.eq('station_id', station_id);
          else prQuery = prQuery.eq('exercise_name', test_type);
          const { data: existingPR } = await prQuery.maybeSingle();

          // Direction: lower=better for time/pace, higher=better for weight/reps
          const lowerIsBetter = ['station_time', 'running_pace', 'race_time'].includes(mappedRecordType);
          const isBetter = !existingPR || (lowerIsBetter ? newValue < existingPR.value : newValue > existingPR.value);
          if (isBetter) {
            is_pr = true;
            if (existingPR) {
              // Update existing record (no unique constraint, so update by id)
              await supabase
                .from('personal_records')
                .update({
                  value: newValue,
                  value_unit: valueUnit,
                  date_achieved: testDate,
                  previous_value: existingPR.value,
                })
                .eq('id', existingPR.id);
            } else {
              // Insert new PR record
              await supabase.from('personal_records').insert({
                athlete_id: athleteId,
                record_type: mappedRecordType,
                station_id: station_id ?? null,
                exercise_name: test_type,
                value: newValue,
                value_unit: valueUnit,
                date_achieved: testDate,
                previous_value: null,
              });
            }
          }
        }

        return { success: true, benchmark: data, is_pr };
      },
    }),

    get_athlete_stats: tool({
      description: "Get the athlete's profile, recent training stats, streak, and PRs.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const { data: profile } = await supabase
            .from('athlete_profiles')
            .select('*')
            .eq('id', athleteId)
            .single();

          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          const { data: recentWorkouts } = await supabase
            .from('workout_logs')
            .select('id, duration_minutes, rpe_post, session_type, date')
            .eq('athlete_id', athleteId)
            .is('deleted_at', null)
            .gte('date', weekAgo);

          const workouts = recentWorkouts?.length ?? 0;
          const totalMinutes = recentWorkouts?.reduce((s, w) => s + (w.duration_minutes ?? 0), 0) ?? 0;
          const avgRpe = workouts > 0
            ? Math.round(((recentWorkouts?.reduce((s, w) => s + (w.rpe_post ?? 0), 0) ?? 0) / workouts) * 10) / 10
            : null;

          const { data: prs } = await supabase
            .from('personal_records')
            .select('record_type, exercise_name, value, value_unit, date_achieved')
            .eq('athlete_id', athleteId)
            .order('date_achieved', { ascending: false })
            .limit(5);

          return {
            profile: profile ? {
              display_name: profile.display_name,
              hyrox_division: profile.hyrox_division,
              race_date: profile.race_date,
              goal_time_minutes: profile.goal_time_minutes,
              current_phase: profile.current_phase,
            } : null,
            weeklyStats: { workouts, totalMinutes, avgRpe },
            recentPRs: prs ?? [],
          };
        } catch {
          return { error: true, message: 'Unable to fetch athlete stats. Please try again.' };
        }
      },
    }),

    set_goal: tool({
      description: 'Set or create a new training goal for the athlete.',
      inputSchema: z.object({
        title: z.string().describe('Goal title'),
        description: z.string().optional(),
        goal_type: z.enum(['race_time', 'station_time', 'fitness', 'custom']).optional(),
        target_value: z.number().optional(),
        target_date: z.string().optional().describe('Target date YYYY-MM-DD'),
      }),
      execute: async ({ title, description, goal_type, target_value, target_date }) => {
        const { data, error } = await supabase
          .from('goals')
          .insert({
            athlete_id: athleteId,
            title,
            description: description ?? null,
            goal_type: goal_type ?? 'custom',
            target_value: target_value ?? null,
            current_value: 0,
            target_date: target_date ?? null,
            status: 'active',
          })
          .select('id, title, target_value, target_date, status')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, goal: data };
      },
    }),

    get_progress_summary: tool({
      description: "Get the athlete's progress summary including plan adherence, workout trends, and goals.",
      inputSchema: z.object({
        days: z.number().optional().describe('Number of days to look back (default 30)'),
      }),
      execute: async ({ days = 30 }) => {
        try {
          const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const { data: workouts } = await supabase
            .from('workout_logs')
            .select('date, session_type, duration_minutes, rpe_post')
            .eq('athlete_id', athleteId)
            .is('deleted_at', null)
            .gte('date', since)
            .order('date', { ascending: true });

          const { data: goals } = await supabase
            .from('goals')
            .select('title, target_value, current_value, status')
            .eq('athlete_id', athleteId)
            .eq('status', 'active');

          const { data: plan } = await supabase
            .from('training_plans')
            .select('id, plan_name')
            .eq('athlete_id', athleteId)
            .eq('status', 'active')
            .limit(1)
            .single();

          let adherencePct: number | null = null;
          if (plan) {
            const { data: allDays } = await supabase
              .from('training_plan_weeks')
              .select('training_plan_days(id, is_completed, is_rest_day)')
              .eq('training_plan_id', plan.id);

            const planDays = allDays?.flatMap((w) => (w.training_plan_days as Array<Record<string, unknown>>) ?? []) ?? [];
            const nonRest = planDays.filter((d) => !d.is_rest_day);
            const completed = nonRest.filter((d) => d.is_completed);
            adherencePct = nonRest.length > 0 ? Math.round((completed.length / nonRest.length) * 100) : null;
          }

          const totalWorkouts = workouts?.length ?? 0;
          const totalMinutes = workouts?.reduce((s, w) => s + (w.duration_minutes ?? 0), 0) ?? 0;
          const byType: Record<string, number> = {};
          for (const w of workouts ?? []) {
            byType[w.session_type] = (byType[w.session_type] || 0) + 1;
          }

          return {
            period: `Last ${days} days`,
            totalWorkouts,
            totalHours: Math.round((totalMinutes / 60) * 10) / 10,
            workoutsByType: byType,
            planAdherencePct: adherencePct,
            activeGoals: goals ?? [],
          };
        } catch {
          return { error: true, message: 'Unable to fetch progress summary. Please try again.' };
        }
      },
    }),

    calculate_race_pacing: tool({
      description: 'Calculate race pacing breakdown for a target Hyrox finish time.',
      inputSchema: z.object({
        target_minutes: z.number().describe('Target total race time in minutes'),
        fitness_level: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      }),
      execute: async ({ target_minutes, fitness_level = 'intermediate' }) => {
        const totalRunKm = 8;
        const stations = [
          'SkiErg 1000m', 'Sled Push 50m', 'Sled Pull 50m', 'Burpee Broad Jump 80m',
          'Rowing 1000m', 'Farmers Carry 200m', 'Sandbag Lunges 100m', 'Wall Balls 100 reps',
        ];

        // Pacing splits based on fitness level
        const runPct = fitness_level === 'beginner' ? 0.52 : fitness_level === 'advanced' ? 0.46 : 0.48;
        const stationPct = 1 - runPct - 0.04; // 4% transitions
        const transitionMin = target_minutes * 0.04;

        const totalRunMin = target_minutes * runPct;
        const runPacePerKm = totalRunMin / totalRunKm;
        const totalStationMin = target_minutes * stationPct;
        const avgStationMin = totalStationMin / 8;

        return {
          target_minutes,
          fitness_level,
          run_splits: {
            total_run_minutes: Math.round(totalRunMin * 10) / 10,
            pace_per_km: `${Math.floor(runPacePerKm)}:${String(Math.round((runPacePerKm % 1) * 60)).padStart(2, '0')}/km`,
            segments: Array.from({ length: 8 }, (_, i) => ({
              segment: `Run ${i + 1} (1km)`,
              target_minutes: Math.round(runPacePerKm * 10) / 10,
            })),
          },
          station_splits: stations.map((name) => ({
            station: name,
            target_minutes: Math.round(avgStationMin * 10) / 10,
          })),
          transition_minutes: Math.round(transitionMin * 10) / 10,
        };
      },
    }),

    // ── New tools (v2) ──────────────────────────────────────────────

    get_exercise_details: tool({
      description:
        'Look up exercise technique details from the exercise library. Returns description, muscle groups, equipment needed, difficulty, and optional Hyrox station link. Use when the athlete asks how to perform an exercise or needs technique cues.',
      inputSchema: z.object({
        exercise_name: z
          .string()
          .describe('Exercise name or partial name to search for (e.g. "wall ball", "sled push", "burpee")'),
      }),
      execute: async ({ exercise_name }) => {
        try {
          // Use ilike for fuzzy-ish matching
          const { data: exercises } = await supabase
            .from('exercise_library')
            .select(
              'name, category, subcategory, description, muscle_groups, equipment_needed, difficulty, hyrox_station_id'
            )
            .ilike('name', `%${exercise_name}%`)
            .eq('is_active', true)
            .limit(5);

          if (!exercises || exercises.length === 0) {
            return { exercises: [], message: `No exercises found matching "${exercise_name}".` };
          }

          // Enrich with station name if linked
          const stationIds = exercises
            .map((e) => e.hyrox_station_id)
            .filter(Boolean) as string[];

          let stationMap: Record<string, string> = {};
          if (stationIds.length > 0) {
            const { data: stations } = await supabase
              .from('hyrox_stations')
              .select('id, station_name')
              .in('id', stationIds);
            stationMap = Object.fromEntries(
              (stations ?? []).map((s) => [s.id, s.station_name])
            );
          }

          return {
            exercises: exercises.map((e) => ({
              name: e.name,
              category: e.category,
              subcategory: e.subcategory,
              description: e.description,
              muscle_groups: e.muscle_groups,
              equipment_needed: e.equipment_needed,
              difficulty: e.difficulty,
              hyrox_station: e.hyrox_station_id ? stationMap[e.hyrox_station_id] ?? null : null,
            })),
          };
        } catch {
          return { error: true, message: 'Unable to fetch exercise details.' };
        }
      },
    }),

    compare_to_benchmark: tool({
      description:
        "Compare the athlete's benchmark or PR to Hyrox skill-level benchmarks. Shows where they fall relative to beginner/intermediate/advanced/elite ranges for a station or run segment. Use when the athlete asks how they compare, what level they're at, or what time to aim for.",
      inputSchema: z.object({
        station_name: z
          .string()
          .optional()
          .describe('Hyrox station name (e.g. "SkiErg", "Sled Push"). Omit for run segments.'),
        segment_type: z
          .enum(['station', 'run', 'transition'])
          .describe('Type of segment to compare'),
        athlete_time_seconds: z
          .number()
          .describe("The athlete's time in seconds for this segment"),
      }),
      execute: async ({ station_name, segment_type, athlete_time_seconds }) => {
        try {
          // Resolve station_id if station_name provided
          let stationId: string | null = null;
          if (station_name) {
            const { data: station } = await supabase
              .from('hyrox_stations')
              .select('id, station_name')
              .ilike('station_name', `%${station_name}%`)
              .limit(1)
              .single();
            if (station) stationId = station.id;
          }

          // Determine gender from athlete profile
          const { data: profile } = await supabase
            .from('athlete_profiles')
            .select('sex')
            .eq('id', athleteId)
            .single();
          const gender = profile?.sex === 'female' ? 'female' : 'male';

          // Fetch all benchmark levels for this segment + gender
          let benchQuery = supabase
            .from('skill_level_benchmarks')
            .select('skill_level, min_seconds, max_seconds, median_seconds, notes')
            .eq('segment_type', segment_type)
            .eq('gender', gender);

          if (stationId) benchQuery = benchQuery.eq('station_id', stationId);
          else benchQuery = benchQuery.is('station_id', null);

          const { data: benchmarks } = await benchQuery;

          if (!benchmarks || benchmarks.length === 0) {
            return { benchmarks: [], message: 'No benchmarks found for this segment.' };
          }

          // Determine athlete's level
          const levelOrder = ['elite', 'advanced', 'intermediate', 'beginner'];
          let athleteLevel = 'below beginner';
          for (const level of levelOrder) {
            const b = benchmarks.find((bm) => bm.skill_level === level);
            if (b && athlete_time_seconds <= Number(b.max_seconds)) {
              athleteLevel = level;
              break; // First match is the best (most elite) tier
            }
          }

          // Format comparison
          const formatted = benchmarks.map((b) => ({
            level: b.skill_level,
            range: `${Number(b.min_seconds)}s – ${Number(b.max_seconds)}s`,
            median: b.median_seconds ? `${Number(b.median_seconds)}s` : null,
          }));

          // Find next target
          let nextTarget: { level: string; target_seconds: number } | null = null;
          const currentIdx = levelOrder.indexOf(athleteLevel);
          if (currentIdx > 0) {
            const nextLevel = levelOrder[currentIdx - 1];
            const nextBenchmark = benchmarks.find((b) => b.skill_level === nextLevel);
            if (nextBenchmark) {
              nextTarget = {
                level: nextLevel,
                target_seconds: Number(nextBenchmark.max_seconds),
              };
            }
          }

          return {
            segment: station_name ?? segment_type,
            athlete_time_seconds,
            athlete_level: athleteLevel,
            benchmarks: formatted,
            next_target: nextTarget,
            gap_seconds: nextTarget
              ? Math.round(athlete_time_seconds - nextTarget.target_seconds)
              : 0,
          };
        } catch {
          return { error: true, message: 'Unable to compare benchmarks.' };
        }
      },
    }),

    get_race_results: tool({
      description:
        "Get the athlete's past Hyrox race results with detailed split times for each run and station segment. Use when the athlete asks about past race performance, wants to identify weak stations, or wants to track race-over-race improvement.",
      inputSchema: z.object({
        limit: z.number().optional().describe('Number of recent races to return (default 3)'),
      }),
      execute: async ({ limit = 3 }) => {
        try {
          const { data: races } = await supabase
            .from('race_results')
            .select(
              'id, race_date, race_name, location, division, format, total_time_seconds, is_simulation, conditions, notes'
            )
            .eq('athlete_id', athleteId)
            .order('race_date', { ascending: false })
            .limit(limit);

          if (!races || races.length === 0) {
            return { races: [], message: 'No race results found.' };
          }

          // Fetch splits for all races in one query
          const raceIds = races.map((r) => r.id);
          const { data: splits } = await supabase
            .from('race_splits')
            .select(
              'race_result_id, split_number, split_type, station_id, time_seconds, transition_time_seconds, heart_rate_avg, notes'
            )
            .in('race_result_id', raceIds)
            .order('split_number', { ascending: true });

          // Fetch station names for context
          const { data: stations } = await supabase
            .from('hyrox_stations')
            .select('id, station_name, station_number');

          const stationMap = Object.fromEntries(
            (stations ?? []).map((s) => [s.id, s.station_name])
          );

          // Attach splits to each race
          const raceResults = races.map((race) => {
            const raceSplits = (splits ?? [])
              .filter((s) => s.race_result_id === race.id)
              .map((s) => ({
                split_number: s.split_number,
                type: s.split_type,
                station: s.station_id ? stationMap[s.station_id] ?? null : null,
                time_seconds: Number(s.time_seconds),
                time_formatted: formatSeconds(Number(s.time_seconds)),
                transition_seconds: s.transition_time_seconds
                  ? Number(s.transition_time_seconds)
                  : null,
              }));

            // Identify slowest station and slowest run
            const stationSplits = raceSplits.filter((s) => s.type === 'station');
            const runSplits = raceSplits.filter((s) => s.type === 'run');
            const slowestStation = stationSplits.length
              ? stationSplits.reduce((a, b) => (a.time_seconds > b.time_seconds ? a : b))
              : null;
            const slowestRun = runSplits.length
              ? runSplits.reduce((a, b) => (a.time_seconds > b.time_seconds ? a : b))
              : null;

            return {
              race_date: race.race_date,
              race_name: race.race_name,
              location: race.location,
              division: race.division,
              format: race.format,
              total_time: formatSeconds(Number(race.total_time_seconds)),
              total_seconds: Number(race.total_time_seconds),
              is_simulation: race.is_simulation,
              splits: raceSplits,
              analysis: {
                slowest_station: slowestStation
                  ? { name: slowestStation.station, time: slowestStation.time_formatted }
                  : null,
                slowest_run: slowestRun
                  ? { segment: `Run ${slowestRun.split_number}`, time: slowestRun.time_formatted }
                  : null,
                total_run_time: formatSeconds(
                  runSplits.reduce((s, r) => s + r.time_seconds, 0)
                ),
                total_station_time: formatSeconds(
                  stationSplits.reduce((s, r) => s + r.time_seconds, 0)
                ),
              },
            };
          });

          return { races: raceResults };
        } catch {
          return { error: true, message: 'Unable to fetch race results.' };
        }
      },
    }),

    // ── New tools (v3 — UI redesign integration) ─────────────────────

    get_daily_metrics: tool({
      description:
        "Get the athlete's daily biometric data — HRV, resting heart rate, sleep, stress, recovery, and readiness scores. Use this to assess recovery status before recommending training intensity.",
      inputSchema: z.object({
        days: z.number().optional().describe('Number of days to look back (default 7, max 30)'),
      }),
      execute: async ({ days = 7 }) => {
        try {
          const lookback = Math.min(days, 30);
          const since = new Date(Date.now() - lookback * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0];

          const { data: metrics } = await supabase
            .from('daily_metrics')
            .select('date, hrv_ms, rhr_bpm, sleep_hours, stress_score, recovery_score, readiness_score, source')
            .eq('user_id', userId)
            .gte('date', since)
            .order('date', { ascending: false });

          if (!metrics || metrics.length === 0) {
            return { metrics: [], message: 'No biometric data recorded yet.' };
          }

          // Compute averages for the period
          const withHrv = metrics.filter((m) => m.hrv_ms != null);
          const withRhr = metrics.filter((m) => m.rhr_bpm != null);
          const withSleep = metrics.filter((m) => m.sleep_hours != null);

          return {
            metrics,
            averages: {
              hrv_ms: withHrv.length > 0
                ? Math.round(withHrv.reduce((s, m) => s + m.hrv_ms!, 0) / withHrv.length)
                : null,
              rhr_bpm: withRhr.length > 0
                ? Math.round(withRhr.reduce((s, m) => s + m.rhr_bpm!, 0) / withRhr.length)
                : null,
              sleep_hours: withSleep.length > 0
                ? Math.round((withSleep.reduce((s, m) => s + Number(m.sleep_hours!), 0) / withSleep.length) * 10) / 10
                : null,
            },
          };
        } catch {
          return { error: true, message: 'Unable to fetch daily metrics.' };
        }
      },
    }),

    log_daily_metrics: tool({
      description:
        "Log the athlete's daily biometric data (HRV, resting heart rate, sleep, stress, etc). Upserts — calling with the same date updates the existing entry.",
      inputSchema: z.object({
        date: z.string().describe('Date YYYY-MM-DD'),
        hrv_ms: z.number().optional().describe('Heart rate variability in milliseconds'),
        rhr_bpm: z.number().optional().describe('Resting heart rate in bpm'),
        sleep_hours: z.number().optional().describe('Sleep duration in hours (e.g. 7.5)'),
        stress_score: z.number().min(0).max(100).optional().describe('Stress score 0-100'),
        recovery_score: z.number().min(0).max(100).optional().describe('Recovery score 0-100'),
        readiness_score: z.number().min(0).max(100).optional().describe('Readiness score 0-100'),
        notes: z.string().optional(),
        source: z.enum(['manual', 'whoop', 'garmin', 'oura', 'apple_watch']).optional(),
      }),
      execute: async ({ date, hrv_ms, rhr_bpm, sleep_hours, stress_score, recovery_score, readiness_score, notes, source }) => {
        const { data, error } = await supabase
          .from('daily_metrics')
          .upsert(
            {
              user_id: userId,
              date,
              hrv_ms: hrv_ms ?? null,
              rhr_bpm: rhr_bpm ?? null,
              sleep_hours: sleep_hours ?? null,
              stress_score: stress_score ?? null,
              recovery_score: recovery_score ?? null,
              readiness_score: readiness_score ?? null,
              notes: notes ?? null,
              source: source ?? 'manual',
            },
            { onConflict: 'user_id,date' },
          )
          .select('date, hrv_ms, rhr_bpm, sleep_hours, recovery_score, readiness_score')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, metric: data };
      },
    }),

    get_workout_sets: tool({
      description:
        "Get the individual sets logged for a specific workout — reps, weight, distance, pace, RPE per set. Use when the athlete asks about their performance on specific exercises within a workout or wants set-level analysis.",
      inputSchema: z.object({
        workout_log_id: z.string().describe('The workout log ID to fetch sets for'),
      }),
      execute: async ({ workout_log_id }) => {
        try {
          // Verify ownership via athlete_id
          const { data: workout } = await supabase
            .from('workout_logs')
            .select('id')
            .eq('id', workout_log_id)
            .eq('athlete_id', athleteId)
            .is('deleted_at', null)
            .single();

          if (!workout) {
            return { sets: [], message: 'Workout not found.' };
          }

          const { data: sets } = await supabase
            .from('workout_sets')
            .select('exercise_name, exercise_category, set_number, reps, weight_kg, distance_meters, duration_seconds, pace, status, rpe, notes')
            .eq('workout_log_id', workout_log_id)
            .order('exercise_name')
            .order('set_number', { ascending: true });

          return { sets: sets ?? [] };
        } catch {
          return { error: true, message: 'Unable to fetch workout sets.' };
        }
      },
    }),

    get_readiness_score: tool({
      description:
        "Get the athlete's race readiness score (0-100) with 7 weighted components: consistency, volume, run fitness, station prep, plan adherence, recovery, and race-specific training. Identifies the weakest area. Use when the athlete asks 'am I ready?' or 'how is my preparation going?'",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          return await computeReadinessScore(athleteId, supabase);
        } catch {
          return { error: true, message: 'Unable to compute readiness score.' };
        }
      },
    }),

    get_benchmark_history: tool({
      description:
        "Get the athlete's historical benchmark test results. Optionally filter by test type or station. Use when the athlete asks about their progress on a specific benchmark or wants to see improvement over time.",
      inputSchema: z.object({
        test_type: z.string().optional().describe('Filter by test type (e.g. "station_time", "1k_run", "5k_run")'),
        station_id: z.string().optional().describe('Filter by Hyrox station ID'),
        limit: z.number().optional().describe('Number of results to return (default 10)'),
      }),
      execute: async ({ test_type, station_id, limit = 10 }) => {
        try {
          let query = supabase
            .from('benchmark_tests')
            .select('id, test_type, station_id, results, notes, test_date')
            .eq('athlete_id', athleteId)
            .order('test_date', { ascending: false })
            .limit(Math.min(limit, 50));

          if (test_type) query = query.eq('test_type', test_type);
          if (station_id) query = query.eq('station_id', station_id);

          const { data: benchmarks } = await query;

          if (!benchmarks || benchmarks.length === 0) {
            return { benchmarks: [], message: 'No benchmark tests recorded yet.' };
          }

          return { benchmarks };
        } catch {
          return { error: true, message: 'Unable to fetch benchmark history.' };
        }
      },
    }),

    get_achievements: tool({
      description:
        "Get the athlete's earned achievements and available achievement definitions. Shows unlocked status, category, tier, and when each was earned. Use to celebrate milestones or motivate the athlete.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const [defsResult, earnedResult] = await Promise.all([
            supabase
              .from('achievement_definitions')
              .select('id, name, description, icon_name, category, tier')
              .order('category')
              .order('tier'),
            supabase
              .from('athlete_achievements')
              .select('achievement_id, earned_at')
              .eq('athlete_id', athleteId),
          ]);

          const definitions = defsResult.data ?? [];
          const earned = earnedResult.data ?? [];
          const earnedMap = new Map(earned.map((e) => [e.achievement_id, e.earned_at]));

          const achievements = definitions.map((def) => ({
            name: def.name,
            description: def.description,
            category: def.category,
            tier: def.tier,
            is_unlocked: earnedMap.has(def.id),
            unlocked_at: earnedMap.get(def.id) ?? null,
          }));

          const unlockedCount = achievements.filter((a) => a.is_unlocked).length;

          return {
            achievements,
            summary: { total: achievements.length, unlocked: unlockedCount },
          };
        } catch {
          return { error: true, message: 'Unable to fetch achievements.' };
        }
      },
    }),

    get_station_details: tool({
      description:
        "Get detailed Hyrox station information including coaching tips, common mistakes, and weights by division. Use when coaching technique for a specific station or when the athlete asks about station-specific details like 'how heavy is the sled?'",
      inputSchema: z.object({
        station_name: z.string().optional().describe('Station name to search for (e.g. "Sled Push", "Wall Balls"). Omit to get all 8 stations.'),
      }),
      execute: async ({ station_name }) => {
        try {
          let query = supabase
            .from('hyrox_stations')
            .select('station_number, station_name, description, distance_or_reps, exercise_type, muscles_worked, tips, common_mistakes, weights_by_division')
            .order('station_number', { ascending: true });

          if (station_name) {
            query = query.ilike('station_name', `%${station_name}%`);
          }

          const { data: stations } = await query;

          if (!stations || stations.length === 0) {
            return { stations: [], message: station_name ? `No station found matching "${station_name}".` : 'No station data available.' };
          }

          return { stations };
        } catch {
          return { error: true, message: 'Unable to fetch station details.' };
        }
      },
    }),
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}
