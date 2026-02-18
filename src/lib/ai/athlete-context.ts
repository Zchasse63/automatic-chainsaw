interface AthleteProfile {
  display_name: string | null;
  date_of_birth: string | null;
  sex: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  hyrox_division: string | null;
  hyrox_race_count: number | null;
  training_history: Record<string, unknown> | null;
  current_phase: string | null;
  race_date: string | null;
  goal_time_minutes: number | null;
  weekly_availability_hours: number | null;
  equipment_available: string[] | null;
  injuries_limitations: string[] | null;
}

export function buildAthleteProfileMessage(
  profile: AthleteProfile
): string | null {
  const parts: string[] = [];

  if (profile.display_name) parts.push(`Name: ${profile.display_name}`);

  if (profile.date_of_birth) {
    const age = Math.floor(
      (Date.now() - new Date(profile.date_of_birth).getTime()) /
        (365.25 * 24 * 60 * 60 * 1000)
    );
    parts.push(`${age}yo`);
  }

  if (profile.sex) parts.push(profile.sex);
  if (profile.weight_kg) parts.push(`${profile.weight_kg}kg`);
  if (profile.height_cm) parts.push(`${profile.height_cm}cm`);

  if (profile.hyrox_division)
    parts.push(`Division: ${profile.hyrox_division}`);
  if (profile.hyrox_race_count !== null)
    parts.push(`${profile.hyrox_race_count} Hyrox races completed`);

  const history = profile.training_history as Record<string, unknown> | null;
  if (history) {
    if (history.experience) parts.push(`Experience: ${history.experience}`);
    if (history.run_mpw) parts.push(`runs ${history.run_mpw}mi/week`);
    if (history.strength_days)
      parts.push(`${history.strength_days} strength days/week`);
  }

  if (profile.weekly_availability_hours)
    parts.push(`${profile.weekly_availability_hours}h/week available`);

  if (profile.race_date) {
    const daysUntil = Math.ceil(
      (new Date(profile.race_date).getTime() - Date.now()) /
        (24 * 60 * 60 * 1000)
    );
    if (daysUntil > 0) {
      parts.push(`race in ${daysUntil} days`);
    } else {
      parts.push('race date has passed');
    }
  }

  if (profile.goal_time_minutes)
    parts.push(`goal: ${profile.goal_time_minutes} min`);

  if (profile.current_phase)
    parts.push(`phase: ${profile.current_phase.replace(/_/g, ' ')}`);

  if (profile.equipment_available && profile.equipment_available.length > 0)
    parts.push(`equipment: ${profile.equipment_available.join(', ')}`);

  if (profile.injuries_limitations && profile.injuries_limitations.length > 0)
    parts.push(
      `injuries/limitations: ${profile.injuries_limitations.join(', ')}`
    );

  if (parts.length === 0) return null;

  return `Athlete profile: ${parts.join(', ')}`;
}
