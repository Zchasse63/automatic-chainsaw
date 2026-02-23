import type { SupabaseClient } from '@supabase/supabase-js';
import { createKnowledgeTools } from './knowledge';
import { createWorkoutTools } from './workout';
import { createTrainingPlanTools } from './training-plan';
import { createAthleteTools } from './athlete';

export function createCoachingTools(athleteId: string, userId: string, supabase: SupabaseClient) {
  return {
    ...createKnowledgeTools(supabase),
    ...createWorkoutTools(athleteId, userId, supabase),
    ...createTrainingPlanTools(athleteId, supabase),
    ...createAthleteTools(athleteId, supabase),
  };
}
