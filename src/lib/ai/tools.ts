import { tool } from 'ai';
import { z } from 'zod';
import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function embedQuery(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export function createCoachingTools(athleteId: string, supabase: SupabaseClient) {
  return {
    search_knowledge_base: tool({
      description:
        'Search the Hyrox training knowledge base for relevant information about training science, station techniques, race strategy, benchmarks, and protocols.',
      inputSchema: z.object({
        query: z.string().describe('The search query'),
      }),
      execute: async ({ query }) => {
        try {
          const embedding = await embedQuery(query);
          const { data, error } = await supabase.rpc('hybrid_search_chunks', {
            query_text: query,
            query_embedding: JSON.stringify(embedding),
            match_count: 5,
            full_text_weight: 1.0,
            semantic_weight: 1.0,
            rrf_k: 50,
          });
          if (error || !data || data.length === 0) {
            return { chunks: [], message: 'No relevant knowledge found.' };
          }
          const chunks = (data as Array<{ id: string; content: string; section: string; source_name: string }>).map(
            (c, i) => `### Source ${i + 1}: ${c.source_name}\n**Section**: ${c.section}\n\n${c.content}`
          );
          return { chunks, chunkIds: data.map((c: { id: string }) => c.id) };
        } catch {
          return { chunks: [], message: 'Knowledge base search failed.' };
        }
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
      }),
      execute: async ({ date, session_type, duration_minutes, rpe_post, notes }) => {
        const { data, error } = await supabase
          .from('workout_logs')
          .insert({
            athlete_id: athleteId,
            date,
            session_type,
            duration_minutes: duration_minutes ?? null,
            rpe_post: rpe_post ?? null,
            notes: notes ?? null,
            completion_status: 'completed',
          })
          .select('id, date, session_type, duration_minutes, rpe_post')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, workout: data };
      },
    }),

    get_today_workout: tool({
      description: "Get the athlete's scheduled workout for today from their active training plan.",
      inputSchema: z.object({}),
      execute: async () => {
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
      },
    }),

    create_training_plan: tool({
      description:
        'Create a complete training plan with weeks and daily workouts. Use this when the athlete asks for a new training plan. Include all weeks and days in a single call. Any existing active plan will be paused.',
      inputSchema: z.object({
        plan_name: z.string().describe('Name of the training plan'),
        goal: z.string().optional().describe('Goal for the plan'),
        start_date: z.string().describe('Plan start date YYYY-MM-DD'),
        duration_weeks: z.number().describe('Total number of weeks'),
        weeks: z
          .array(
            z.object({
              week_number: z.number(),
              focus: z.string().optional().describe('Weekly focus/theme'),
              days: z.array(
                z.object({
                  day_of_week: z
                    .number()
                    .min(0)
                    .max(6)
                    .describe('0=Monday, 1=Tuesday, ... 6=Sunday'),
                  session_type: z.enum([
                    'run',
                    'hiit',
                    'strength',
                    'simulation',
                    'recovery',
                    'station_practice',
                    'general',
                  ]),
                  workout_title: z.string(),
                  workout_description: z.string().optional(),
                  estimated_duration_minutes: z.number().optional(),
                  is_rest_day: z.boolean(),
                }),
              ),
            }),
          )
          .describe('Array of weeks, each containing an array of 7 days'),
      }),
      execute: async ({ plan_name, goal, start_date, duration_weeks, weeks }) => {
        // Deactivate any existing active plans
        await supabase
          .from('training_plans')
          .update({ status: 'paused' })
          .eq('athlete_id', athleteId)
          .eq('status', 'active');

        // Create the plan
        const { data: plan, error: planError } = await supabase
          .from('training_plans')
          .insert({
            athlete_id: athleteId,
            plan_name,
            goal: goal ?? null,
            start_date,
            duration_weeks,
            status: 'active',
          })
          .select('id')
          .single();

        if (planError || !plan) {
          return { success: false, error: planError?.message ?? 'Failed to create plan' };
        }

        // Create weeks and days
        let totalDays = 0;
        for (const week of weeks) {
          const { data: weekRow, error: weekError } = await supabase
            .from('training_plan_weeks')
            .insert({
              training_plan_id: plan.id,
              week_number: week.week_number,
              focus: week.focus ?? null,
            })
            .select('id')
            .single();

          if (weekError || !weekRow) continue;

          const dayRows = week.days.map((day) => ({
            training_plan_week_id: weekRow.id,
            day_of_week: day.day_of_week,
            session_type: day.is_rest_day ? null : day.session_type,
            workout_title: day.is_rest_day ? 'Rest Day' : day.workout_title,
            workout_description: day.workout_description ?? null,
            estimated_duration_minutes: day.estimated_duration_minutes ?? null,
            is_rest_day: day.is_rest_day,
            is_completed: false,
          }));

          const { error: daysError } = await supabase
            .from('training_plan_days')
            .insert(dayRows);

          if (!daysError) totalDays += dayRows.length;
        }

        return {
          success: true,
          plan: { id: plan.id, plan_name, goal, start_date, duration_weeks },
          summary: `Created ${weeks.length}-week plan with ${totalDays} training days`,
        };
      },
    }),

    get_training_plan: tool({
      description: "Get the athlete's active training plan overview with all weeks and days.",
      inputSchema: z.object({
        week_number: z.number().optional().describe('Specific week number to fetch'),
      }),
      execute: async ({ week_number }) => {
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
        const { data, error } = await supabase
          .from('benchmark_tests')
          .insert({
            athlete_id: athleteId,
            test_type,
            station_id: station_id ?? null,
            results,
            notes: notes ?? null,
            test_date: new Date().toISOString().split('T')[0],
          })
          .select('id, test_type, results, test_date')
          .single();
        if (error) return { success: false, error: error.message };
        return { success: true, benchmark: data };
      },
    }),

    get_athlete_stats: tool({
      description: "Get the athlete's profile, recent training stats, streak, and PRs.",
      inputSchema: z.object({}),
      execute: async () => {
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
  };
}
