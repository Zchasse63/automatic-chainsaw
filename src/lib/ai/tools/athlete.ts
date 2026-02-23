import { tool } from 'ai';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { computeReadinessScore } from '../readiness';

function formatSeconds(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function createAthleteTools(athleteId: string, supabase: SupabaseClient) {
  return {
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

        const newValue = typeof results.value === 'number' ? results.value
          : typeof results.time === 'number' ? results.time
          : Object.values(results).find((v) => typeof v === 'number') as number | undefined;
        const valueUnit = typeof results.unit === 'string' ? results.unit
          : typeof results.value_unit === 'string' ? results.value_unit
          : 'seconds';

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
          let prQuery = supabase
            .from('personal_records')
            .select('id, value, value_unit')
            .eq('athlete_id', athleteId)
            .eq('record_type', mappedRecordType);
          if (station_id) prQuery = prQuery.eq('station_id', station_id);
          else prQuery = prQuery.eq('exercise_name', test_type);
          const { data: existingPR } = await prQuery.maybeSingle();

          const lowerIsBetter = ['station_time', 'running_pace', 'race_time'].includes(mappedRecordType);
          const isBetter = !existingPR || (lowerIsBetter ? newValue < existingPR.value : newValue > existingPR.value);
          if (isBetter) {
            is_pr = true;
            if (existingPR) {
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

        const runPct = fitness_level === 'beginner' ? 0.52 : fitness_level === 'advanced' ? 0.46 : 0.48;
        const stationPct = 1 - runPct - 0.04;
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

    get_exercise_details: tool({
      description:
        'Look up exercise technique details from the exercise library.',
      inputSchema: z.object({
        exercise_name: z.string().describe('Exercise name or partial name to search for'),
      }),
      execute: async ({ exercise_name }) => {
        try {
          const { data: exercises } = await supabase
            .from('exercise_library')
            .select('name, category, subcategory, description, muscle_groups, equipment_needed, difficulty, hyrox_station_id')
            .ilike('name', `%${exercise_name}%`)
            .eq('is_active', true)
            .limit(5);

          if (!exercises || exercises.length === 0) {
            return { exercises: [], message: `No exercises found matching "${exercise_name}".` };
          }

          const stationIds = exercises.map((e) => e.hyrox_station_id).filter(Boolean) as string[];
          let stationMap: Record<string, string> = {};
          if (stationIds.length > 0) {
            const { data: stations } = await supabase
              .from('hyrox_stations')
              .select('id, station_name')
              .in('id', stationIds);
            stationMap = Object.fromEntries((stations ?? []).map((s) => [s.id, s.station_name]));
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
      description: "Compare the athlete's benchmark or PR to Hyrox skill-level benchmarks.",
      inputSchema: z.object({
        station_name: z.string().optional().describe('Hyrox station name'),
        segment_type: z.enum(['station', 'run', 'transition']).describe('Type of segment to compare'),
        athlete_time_seconds: z.number().describe("The athlete's time in seconds"),
      }),
      execute: async ({ station_name, segment_type, athlete_time_seconds }) => {
        try {
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

          const { data: profile } = await supabase
            .from('athlete_profiles')
            .select('sex')
            .eq('id', athleteId)
            .single();
          const gender = profile?.sex === 'female' ? 'female' : 'male';

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

          const levelOrder = ['elite', 'advanced', 'intermediate', 'beginner'];
          let athleteLevel = 'below beginner';
          for (const level of levelOrder) {
            const b = benchmarks.find((bm) => bm.skill_level === level);
            if (b && athlete_time_seconds <= Number(b.max_seconds)) {
              athleteLevel = level;
              break;
            }
          }

          const formatted = benchmarks.map((b) => ({
            level: b.skill_level,
            range: `${Number(b.min_seconds)}s – ${Number(b.max_seconds)}s`,
            median: b.median_seconds ? `${Number(b.median_seconds)}s` : null,
          }));

          let nextTarget: { level: string; target_seconds: number } | null = null;
          const currentIdx = levelOrder.indexOf(athleteLevel);
          if (currentIdx > 0) {
            const nextLevel = levelOrder[currentIdx - 1];
            const nextBenchmark = benchmarks.find((b) => b.skill_level === nextLevel);
            if (nextBenchmark) {
              nextTarget = { level: nextLevel, target_seconds: Number(nextBenchmark.max_seconds) };
            }
          }

          return {
            segment: station_name ?? segment_type,
            athlete_time_seconds,
            athlete_level: athleteLevel,
            benchmarks: formatted,
            next_target: nextTarget,
            gap_seconds: nextTarget ? Math.round(athlete_time_seconds - nextTarget.target_seconds) : 0,
          };
        } catch {
          return { error: true, message: 'Unable to compare benchmarks.' };
        }
      },
    }),

    get_race_results: tool({
      description: "Get the athlete's past Hyrox race results with detailed split times.",
      inputSchema: z.object({
        limit: z.number().optional().describe('Number of recent races to return (default 3)'),
      }),
      execute: async ({ limit = 3 }) => {
        try {
          const { data: races } = await supabase
            .from('race_results')
            .select('id, race_date, race_name, location, division, format, total_time_seconds, is_simulation, conditions, notes')
            .eq('athlete_id', athleteId)
            .order('race_date', { ascending: false })
            .limit(limit);

          if (!races || races.length === 0) {
            return { races: [], message: 'No race results found.' };
          }

          const raceIds = races.map((r) => r.id);
          const { data: splits } = await supabase
            .from('race_splits')
            .select('race_result_id, split_number, split_type, station_id, time_seconds, transition_time_seconds, heart_rate_avg, notes')
            .in('race_result_id', raceIds)
            .order('split_number', { ascending: true });

          const { data: stations } = await supabase
            .from('hyrox_stations')
            .select('id, station_name, station_number');

          const stationMap = Object.fromEntries((stations ?? []).map((s) => [s.id, s.station_name]));

          const raceResults = races.map((race) => {
            const raceSplits = (splits ?? [])
              .filter((s) => s.race_result_id === race.id)
              .map((s) => ({
                split_number: s.split_number,
                type: s.split_type,
                station: s.station_id ? stationMap[s.station_id] ?? null : null,
                time_seconds: Number(s.time_seconds),
                time_formatted: formatSeconds(Number(s.time_seconds)),
                transition_seconds: s.transition_time_seconds ? Number(s.transition_time_seconds) : null,
              }));

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
                slowest_station: slowestStation ? { name: slowestStation.station, time: slowestStation.time_formatted } : null,
                slowest_run: slowestRun ? { segment: `Run ${slowestRun.split_number}`, time: slowestRun.time_formatted } : null,
                total_run_time: formatSeconds(runSplits.reduce((s, r) => s + r.time_seconds, 0)),
                total_station_time: formatSeconds(stationSplits.reduce((s, r) => s + r.time_seconds, 0)),
              },
            };
          });

          return { races: raceResults };
        } catch {
          return { error: true, message: 'Unable to fetch race results.' };
        }
      },
    }),

    get_readiness_score: tool({
      description: "Get the athlete's race readiness score (0-100) with 7 weighted components.",
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
      description: "Get the athlete's historical benchmark test results.",
      inputSchema: z.object({
        test_type: z.string().optional().describe('Filter by test type'),
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
      description: "Get the athlete's earned achievements and available achievement definitions.",
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

          return {
            achievements,
            summary: { total: achievements.length, unlocked: achievements.filter((a) => a.is_unlocked).length },
          };
        } catch {
          return { error: true, message: 'Unable to fetch achievements.' };
        }
      },
    }),

    get_station_details: tool({
      description: "Get detailed Hyrox station information including coaching tips, common mistakes, and weights by division.",
      inputSchema: z.object({
        station_name: z.string().optional().describe('Station name to search for. Omit to get all 8 stations.'),
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
