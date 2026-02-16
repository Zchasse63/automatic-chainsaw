-- ============================================
-- Hyrox AI Coach — Seed Data
-- Migration: 20250216000001_seed_data
-- ============================================
-- Sources: Official HYROX rulebooks (2024/25 & 2025/26 seasons),
-- HyroxDataLab (700K+ race analysis), RoxLyfe world records database,
-- verified expert coaching sources (TheProgrm, RMR Training, Centr).

-- ============================================
-- 1. Hyrox Stations (8 rows with fixed UUIDs)
-- ============================================

INSERT INTO hyrox_stations (id, station_number, station_name, exercise_type, distance_or_reps, weights_by_division, description, tips, common_mistakes, muscles_worked) VALUES

-- Station 1: SkiErg
('00000000-0000-0000-0000-000000000001', 1, 'SkiErg', 'cardio_machine', '1000m',
 '{"open_women_kg": null, "open_men_kg": null, "pro_women_kg": null, "pro_men_kg": null, "notes": "Bodyweight exercise on Concept2 SkiErg — no external load"}',
 'Pull handles from overhead to thighs in a powerful double-pole motion on a Concept2 SkiErg for 1,000 meters. Stand with feet shoulder-width apart, hinge at the hips, and drive the handles down using lats, core, and triceps.',
 '["Initiate the pull with your lats, not your arms — think about driving elbows back", "Hinge at the hips on each stroke to engage your core and generate power from your bodyweight", "Find a sustainable pace early — going out too hard leads to massive fade after 500m", "Keep a slight bend in your knees throughout to maintain stability", "Exhale forcefully on each pull to maintain rhythm and core bracing"]',
 '["Standing too upright — reduces power output by 20-30% vs proper hip hinge", "Arms-only pulling — leads to early bicep/forearm fatigue", "Starting too fast — the first 200m feels easy but sets up a painful back half", "Gripping too tightly — causes forearm pump; use a relaxed hook grip", "Not using body weight — should feel like you are falling into each stroke"]',
 ARRAY['latissimus_dorsi', 'triceps', 'core', 'shoulders', 'hip_flexors']),

-- Station 2: Sled Push
('00000000-0000-0000-0000-000000000002', 2, 'Sled Push', 'weighted_push', '50m',
 '{"open_women_kg": 102, "open_men_kg": 152, "pro_women_kg": 152, "pro_men_kg": 202, "doubles_women_kg": 102, "doubles_men_kg": 152, "doubles_mixed_kg": 152, "notes": "Weights include sled frame (~30-52kg). 50m divided into 4 x 12.5m lanes with turns."}',
 'Push a weighted sled 50 meters across turf, divided into 4 lanes of 12.5m each with 180-degree turns. Drive from a low position with arms extended, legs powering each stride. The sled sits on HYROX × Centr Perform Turf.',
 '["Keep your body at a 45-degree angle — the lower you push, the more force transfers horizontally", "Drive with short, powerful steps rather than long strides — think sprinter start position", "Keep arms fully extended and locked — bending elbows wastes energy", "Breathe in a rhythm: exhale on each push step, inhale between", "Slow down slightly before turns to maintain control — time lost in a bad turn exceeds time saved sprinting"]',
 '["Standing too upright — shifts force vertically instead of horizontally into the sled", "Looking up — breaks spinal alignment; keep eyes on the ground 2-3 feet ahead", "Taking huge steps — short choppy steps maintain better ground contact", "Resting at turns — keep moving through transitions", "Death grip on handles — wastes forearm energy; firm but relaxed grip"]',
 ARRAY['quadriceps', 'glutes', 'calves', 'core', 'shoulders']),

-- Station 3: Sled Pull
('00000000-0000-0000-0000-000000000003', 3, 'Sled Pull', 'weighted_pull', '50m',
 '{"open_women_kg": 78, "open_men_kg": 103, "pro_women_kg": 103, "pro_men_kg": 153, "doubles_women_kg": 78, "doubles_men_kg": 103, "doubles_mixed_kg": 103, "notes": "Weights include sled frame. Hand-over-hand rope pull while stationary. Pull weight is lighter than push due to upper-body-dominant movement."}',
 'Pull a weighted sled 50 meters using a rope in a hand-over-hand motion while standing stationary. Sit back into a low squat position, brace your core, and pull the rope alternating hands. The sled travels toward you across 4 lanes of 12.5m.',
 '["Sit deep into a low squat and lean back — your body weight does the pulling, not just your arms", "Use a hand-over-hand rhythm: reach far forward, grab, pull to hip, release, reach again", "Pull the rope to your hip each time, not just to your chest — full range = fewer total pulls", "Keep your core braced throughout — your legs and core anchor the pull", "Find a rhythm and stick to it — consistent tempo beats alternating fast/slow"]',
 '["Standing upright while pulling — eliminates the mechanical advantage of bodyweight", "Pulling with arms only — leads to rapid bicep and forearm burnout", "Short pulls — not reaching far enough forward or pulling to full extension", "Letting rope pile up — kick excess rope behind you to prevent tangles", "Not resetting position between lanes — take 2 seconds to re-anchor your stance"]',
 ARRAY['biceps', 'forearms', 'latissimus_dorsi', 'core', 'quadriceps']),

-- Station 4: Burpee Broad Jumps
('00000000-0000-0000-0000-000000000004', 4, 'Burpee Broad Jumps', 'bodyweight', '80m',
 '{"open_women_kg": null, "open_men_kg": null, "pro_women_kg": null, "pro_men_kg": null, "notes": "Bodyweight exercise. 80m total distance. Full burpee (chest to ground) followed by a standing broad jump forward. Distance is measured from takeoff to landing of the jump."}',
 'Perform a burpee (chest touches ground) then immediately broad jump forward as far as possible. Repeat for 80 meters total. This is the most metabolically demanding station — heart rate peaks here for most athletes.',
 '["Chest MUST touch the ground on every rep — partial burpees get no-repped", "On the broad jump, swing arms aggressively and jump at ~45 degrees for max distance", "Bigger jumps = fewer total reps. Each extra 30cm per jump saves 2-3 reps over 80m", "Pace yourself — this station destroys athletes who go all-out from the start", "Land softly and flow immediately into the next burpee — minimize transition time"]',
 '["Not getting chest fully to ground — leads to no-reps and wasted energy", "Jumping vertically instead of forward — wastes energy without covering distance", "Going too fast at the start — this station rewards consistent pacing over speed", "Standing fully upright between burpee and jump — unnecessary; go straight from standing into the jump", "Holding breath — breathe on every rep: exhale on the way down, inhale standing up"]',
 ARRAY['full_body', 'chest', 'quadriceps', 'hip_flexors', 'shoulders', 'core']),

-- Station 5: Rowing
('00000000-0000-0000-0000-000000000005', 5, 'Rowing', 'cardio_machine', '1000m',
 '{"open_women_kg": null, "open_men_kg": null, "pro_women_kg": null, "pro_men_kg": null, "notes": "Bodyweight exercise on Concept2 rower — no external load. 1000m distance."}',
 'Row 1,000 meters on a Concept2 rowing machine. Drive with legs first, then lean back, then pull with arms. The stroke sequence is legs-back-arms on the drive, arms-back-legs on the recovery. Damper setting typically 4-6.',
 '["Drive with legs FIRST — 60% of power comes from the leg drive", "Lean back to about 1 oclock position at the finish of each stroke", "Set damper to 4-6 — higher is NOT harder, it changes the feel. Most elite rowers use 4-5", "Aim for stroke rate of 26-30 for a 1000m piece — too high wastes energy", "Negative split: row the second 500m slightly faster than the first"]',
 '["Arms pulling before legs are finished — breaks the power chain and loses 20%+ power", "Damper set to 10 — common mistake; higher damper ≠ more resistance, it just changes stroke feel", "Hunching forward — rounds the back and reduces power transfer from legs", "Rushing the recovery — the slide back should be slower than the drive", "Death grip on handle — relaxed grip with fingers hooked prevents forearm fatigue"]',
 ARRAY['quadriceps', 'glutes', 'hamstrings', 'latissimus_dorsi', 'biceps', 'core']),

-- Station 6: Farmers Carry
('00000000-0000-0000-0000-000000000006', 6, 'Farmers Carry', 'weighted_carry', '200m',
 '{"open_women_kg": 16, "open_men_kg": 24, "pro_women_kg": 24, "pro_men_kg": 32, "doubles_women_kg": 16, "doubles_men_kg": 24, "doubles_mixed_kg": 24, "notes": "Weight is per hand (two kettlebells). Open Women = 2x16kg, Open Men = 2x24kg, Pro Men = 2x32kg. 200m course with turns."}',
 'Carry two kettlebells (one in each hand) for 200 meters. Walk briskly with an upright posture, shoulders packed, and core braced. Do not run. The course includes turns — slow down slightly at turns to maintain control and grip.',
 '["Pack your shoulders DOWN and BACK — do not let the weight pull your shoulders forward", "Walk at a fast, controlled pace — running risks dropping weights and getting penalized", "Grip the handles in the center for balance — off-center grip causes the bells to swing", "Breathe with your belly, not your chest — diaphragmatic breathing maintains core brace", "If grip is failing, squeeze harder for 3 seconds then relax slightly — resets the forearms"]',
 '["Running — increases risk of dropping weights and burns grip faster due to impact forces", "Rounded shoulders — collapses posture and makes the carry feel 30% harder", "Holding breath — leads to lightheadedness; maintain steady breathing throughout", "Gripping at the end of the handle — causes kettlebell to wobble and drain grip strength", "Not training grip endurance — this station is almost entirely limited by grip, not legs"]',
 ARRAY['forearms', 'trapezius', 'core', 'shoulders', 'quadriceps']),

-- Station 7: Sandbag Lunges
('00000000-0000-0000-0000-000000000007', 7, 'Sandbag Lunges', 'weighted_lunge', '100m',
 '{"open_women_kg": 10, "open_men_kg": 20, "pro_women_kg": 20, "pro_men_kg": 30, "doubles_women_kg": 10, "doubles_men_kg": 20, "doubles_mixed_kg": 20, "notes": "Sandbag carried on shoulders or in front. Walking lunges — back knee must touch or nearly touch the ground on each rep."}',
 'Perform walking lunges for 100 meters with a sandbag on your shoulders. Each lunge must show the back knee touching or nearly touching the ground. This is the most quad-destroying station and directly precedes the final 1km run.',
 '["Keep the sandbag high on your shoulders/upper back — not draped on your neck", "Take moderate stride lengths — too long extends time under tension, too short adds total reps", "Drive up through the front heel, not the toe — saves your knees and uses glutes more", "Stay upright through the torso — leaning forward shifts load to lower back", "This is station 7 of 8 — pace conservatively; you still have Wall Balls and a 1km run"]',
 '["Leaning too far forward — shifts load to lower back instead of legs", "Short/shallow lunges — knees must get close to the ground; partial reps may get no-repped", "Sandbag slipping down to neck — reposition at turns, not mid-lane", "Going too fast early — quads will completely lock up for the final run", "Not breathing — exhale on the drive up from each lunge, inhale on the way down"]',
 ARRAY['quadriceps', 'glutes', 'hamstrings', 'core', 'calves']),

-- Station 8: Wall Balls
('00000000-0000-0000-0000-000000000008', 8, 'Wall Balls', 'weighted_throw', '100 reps',
 '{"open_women_kg": 4, "open_men_kg": 6, "pro_women_kg": 6, "pro_men_kg": 9, "doubles_women_kg": 4, "doubles_men_kg": 6, "doubles_mixed_kg": 6, "target_height_women_m": 2.70, "target_height_men_m": 3.00, "reps_all_divisions": 100, "notes": "100 reps for all divisions (updated Sep 2024). Ball must hit target line. Open Women 4kg/2.70m, Open Men 6kg/3.00m, Pro Women 6kg/2.70m, Pro Men 9kg/3.00m."}',
 'Perform 100 wall ball shots: squat with a medicine ball, then explosively stand and throw the ball to hit a target line on the wall. Catch the ball on the way down and immediately descend into the next squat. The ball must visibly hit or cross the target line.',
 '["Full depth squat on every rep — hip crease below knee. Partial squats get no-repped", "Use your legs to launch the ball, not your arms — it is a squat-throw, not a push-press", "Catch the ball as high as possible and absorb it into your next squat in one fluid motion", "Break it into sets if needed: 25-25-25-25 or 30-25-25-20 with short rests", "Stand close to the wall (~arm length away) — too far back makes every throw harder"]',
 '["Partial squats — hip crease must go below the knee or the rep does not count", "Throwing with arms instead of legs — exhausts shoulders and triceps rapidly", "Standing too far from wall — increases the horizontal distance the ball must travel", "Not hitting the target line — reps below the line do not count", "Not resting strategically — better to take 5-second planned breaks than to hit total failure"]',
 ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps', 'core']);


-- ============================================
-- 2. Exercise Library (~90 exercises)
-- ============================================

-- Station-Specific Exercises
INSERT INTO exercise_library (name, category, subcategory, description, muscle_groups, equipment_needed, difficulty, hyrox_station_id) VALUES

-- SkiErg exercises
('SkiErg Intervals', 'station_specific', 'ski_erg', 'Alternate between hard and easy efforts on the SkiErg. Example: 10 x 100m hard with 30s rest, or 5 x 250m at race pace with 1 min rest.', ARRAY['lats', 'triceps', 'core'], ARRAY['skierg'], 'intermediate', '00000000-0000-0000-0000-000000000001'),
('SkiErg Steady State', 'station_specific', 'ski_erg', 'Continuous SkiErg at moderate pace (60-70% effort) for 10-20 minutes. Focus on consistent stroke rate and technique.', ARRAY['lats', 'triceps', 'core'], ARRAY['skierg'], 'beginner', '00000000-0000-0000-0000-000000000001'),
('SkiErg Power Pulls', 'station_specific', 'ski_erg', 'Max effort single pulls with full reset between reps. Focus on hip hinge, lat engagement, and explosive power generation. 5 sets of 5 reps.', ARRAY['lats', 'triceps', 'core', 'shoulders'], ARRAY['skierg'], 'advanced', '00000000-0000-0000-0000-000000000001'),

-- Sled Push exercises
('Sled Push Practice', 'station_specific', 'sled_push', 'Practice sled push technique at race weight. Focus on body angle, foot placement, and arm position. 4-6 x 25m with full recovery.', ARRAY['quads', 'glutes', 'calves', 'core'], ARRAY['sled', 'turf'], 'intermediate', '00000000-0000-0000-0000-000000000002'),
('Heavy Sled Push', 'station_specific', 'sled_push', 'Sled push at 110-130% of race weight for short distances (10-25m). Builds raw pushing strength. 5 x 12.5m with 2 min rest.', ARRAY['quads', 'glutes', 'calves', 'core'], ARRAY['sled', 'turf'], 'advanced', '00000000-0000-0000-0000-000000000002'),
('Sled Push Sprint', 'station_specific', 'sled_push', 'Push sled at 70-80% race weight as fast as possible for 50m (full race distance). Time each rep and aim for consistency. 3-4 reps with 3 min rest.', ARRAY['quads', 'glutes', 'calves', 'core'], ARRAY['sled', 'turf'], 'advanced', '00000000-0000-0000-0000-000000000002'),

-- Sled Pull exercises
('Sled Pull Hand-Over-Hand', 'station_specific', 'sled_pull', 'Practice the race movement: sit into a low squat and pull the sled using a hand-over-hand rope technique. Focus on rhythm and full arm extension. 4-6 x 25m.', ARRAY['biceps', 'forearms', 'lats', 'core'], ARRAY['sled', 'rope', 'turf'], 'intermediate', '00000000-0000-0000-0000-000000000003'),
('Heavy Sled Pull', 'station_specific', 'sled_pull', 'Sled pull at 110-130% race weight for short distances. Builds grip strength and pulling endurance. 5 x 12.5m with 2 min rest.', ARRAY['biceps', 'forearms', 'lats', 'core'], ARRAY['sled', 'rope', 'turf'], 'advanced', '00000000-0000-0000-0000-000000000003'),

-- Burpee Broad Jump exercises
('Burpee Broad Jump Practice', 'station_specific', 'burpee_broad_jump', 'Full burpee (chest to ground) into standing broad jump. Practice race movement with focus on jump distance and pacing. 4 x 20m.', ARRAY['full_body', 'chest', 'quads'], ARRAY['none'], 'intermediate', '00000000-0000-0000-0000-000000000004'),
('Standing Broad Jumps', 'station_specific', 'burpee_broad_jump', 'Broad jump only (no burpee component). Focus on maximizing distance per jump with proper arm swing and landing. 4 x 10 jumps.', ARRAY['quads', 'glutes', 'calves'], ARRAY['none'], 'beginner', '00000000-0000-0000-0000-000000000004'),
('Burpee Broad Jump Intervals', 'station_specific', 'burpee_broad_jump', 'Timed sets of BBJs: 60s on, 30s rest x 6 rounds. Count total distance covered per round. Target consistent output across all rounds.', ARRAY['full_body', 'chest', 'quads'], ARRAY['none'], 'advanced', '00000000-0000-0000-0000-000000000004'),

-- Rowing exercises
('Rowing Intervals', 'station_specific', 'rowing', 'Alternate hard and easy efforts on the Concept2 rower. Example: 8 x 250m hard with 30s rest, or 4 x 500m at race pace with 1 min rest.', ARRAY['quads', 'glutes', 'lats', 'biceps', 'core'], ARRAY['rower'], 'intermediate', '00000000-0000-0000-0000-000000000005'),
('Rowing Technique Drills', 'station_specific', 'rowing', 'Pause drills at each phase of the stroke (catch, drive, finish, recovery). Row 500m with pauses at each position to ingrain proper sequencing.', ARRAY['quads', 'glutes', 'lats', 'biceps', 'core'], ARRAY['rower'], 'beginner', '00000000-0000-0000-0000-000000000005'),
('Rowing 1K Time Trial', 'station_specific', 'rowing', 'All-out 1000m row for time. Warm up thoroughly, then row at maximum sustainable effort. Record time and splits for benchmarking.', ARRAY['quads', 'glutes', 'lats', 'biceps', 'core'], ARRAY['rower'], 'advanced', '00000000-0000-0000-0000-000000000005'),

-- Farmers Carry exercises
('Farmers Carry Practice', 'station_specific', 'farmers_carry', 'Carry kettlebells at race weight for 200m. Focus on posture (shoulders packed, core braced) and a fast walking pace. Time each attempt.', ARRAY['forearms', 'traps', 'core', 'shoulders'], ARRAY['kettlebells'], 'intermediate', '00000000-0000-0000-0000-000000000006'),
('Heavy Farmers Carry', 'station_specific', 'farmers_carry', 'Carry kettlebells at 120-150% race weight for 50-100m. Builds grip endurance beyond race demands. 4 x 50m with 2 min rest.', ARRAY['forearms', 'traps', 'core', 'shoulders'], ARRAY['kettlebells'], 'advanced', '00000000-0000-0000-0000-000000000006'),
('Dead Hangs', 'station_specific', 'farmers_carry', 'Hang from a pull-up bar with straight arms for max time. Builds the grip endurance critical for Farmers Carry. 3-5 sets to near-failure.', ARRAY['forearms', 'lats', 'shoulders'], ARRAY['pull_up_bar'], 'beginner', '00000000-0000-0000-0000-000000000006'),

-- Sandbag Lunge exercises
('Sandbag Lunges Practice', 'station_specific', 'sandbag_lunge', 'Walking lunges with sandbag on shoulders at race weight for 100m. Focus on knee depth, upright torso, and consistent stride length.', ARRAY['quads', 'glutes', 'hamstrings', 'core'], ARRAY['sandbag'], 'intermediate', '00000000-0000-0000-0000-000000000007'),
('Weighted Walking Lunges', 'station_specific', 'sandbag_lunge', 'Walking lunges with dumbbells at sides or barbell on back. Substitute for sandbag lunges when no sandbag available. 4 x 25m.', ARRAY['quads', 'glutes', 'hamstrings', 'core'], ARRAY['dumbbells'], 'intermediate', '00000000-0000-0000-0000-000000000007'),
('Reverse Lunges', 'station_specific', 'sandbag_lunge', 'Step backward into a lunge, lowering back knee toward ground. Easier on knees than forward lunges. 3 x 12 per leg.', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['none'], 'beginner', '00000000-0000-0000-0000-000000000007'),

-- Wall Ball exercises
('Wall Ball Practice', 'station_specific', 'wall_ball', 'Perform wall balls at race weight and target height. Focus on full squat depth, explosive hip drive, and catching high. 5 x 20 reps with 1 min rest.', ARRAY['quads', 'glutes', 'shoulders', 'triceps'], ARRAY['medicine_ball', 'wall_target'], 'intermediate', '00000000-0000-0000-0000-000000000008'),
('Wall Ball Endurance Set', 'station_specific', 'wall_ball', 'Unbroken 50 or 100 wall balls at race weight. Practice pacing for the full race set of 100 reps. Time the set.', ARRAY['quads', 'glutes', 'shoulders', 'triceps'], ARRAY['medicine_ball', 'wall_target'], 'advanced', '00000000-0000-0000-0000-000000000008'),
('Thrusters', 'station_specific', 'wall_ball', 'Front squat into overhead press with barbell or dumbbells. Mimics wall ball movement pattern without the wall. 4 x 12 reps.', ARRAY['quads', 'glutes', 'shoulders', 'triceps'], ARRAY['barbell'], 'intermediate', '00000000-0000-0000-0000-000000000008');

-- Running exercises
INSERT INTO exercise_library (name, category, subcategory, description, muscle_groups, equipment_needed, difficulty) VALUES
('Easy Run', 'running', 'base', 'Conversational pace run at 60-70% max heart rate. The foundation of aerobic fitness. Should feel comfortable and sustainable.', ARRAY['quads', 'hamstrings', 'calves', 'glutes'], ARRAY['running_shoes'], 'beginner'),
('Recovery Run', 'running', 'base', 'Very easy pace run (slower than easy run) after hard sessions. Promotes blood flow and recovery without adding training stress. 20-30 minutes.', ARRAY['quads', 'hamstrings', 'calves', 'glutes'], ARRAY['running_shoes'], 'beginner'),
('Tempo Run', 'running', 'threshold', 'Sustained effort at lactate threshold pace (~80-85% max HR). Should feel comfortably hard — can speak in short phrases only. 20-40 minutes.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'intermediate'),
('Threshold Intervals', 'running', 'threshold', 'Intervals at or slightly above lactate threshold pace. Example: 4 x 8 min at threshold with 2 min easy jog recovery.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'advanced'),
('1km Intervals', 'running', 'intervals', 'Run 1km repeats at target Hyrox race pace or slightly faster. 6-8 x 1km with 90s standing rest. Simulates the race run segments.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'intermediate'),
('400m Intervals', 'running', 'speed', 'Short fast repeats for speed development. 8-12 x 400m at 5K pace or faster with equal rest. Builds VO2max and running economy.', ARRAY['quads', 'hamstrings', 'calves', 'glutes'], ARRAY['running_shoes'], 'advanced'),
('800m Intervals', 'running', 'speed', 'Medium-distance repeats. 6-8 x 800m at slightly faster than Hyrox race pace with 2 min rest. Develops speed endurance.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'intermediate'),
('Long Run', 'running', 'endurance', 'Extended easy-pace run for aerobic base building. 60-90+ minutes at conversational pace. The single most important run for Hyrox preparation.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'intermediate'),
('Hill Repeats', 'running', 'strength', 'Run hard uphill for 60-90 seconds, jog down to recover. 6-10 repeats. Builds leg strength and power specific to running.', ARRAY['quads', 'glutes', 'calves', 'hamstrings'], ARRAY['running_shoes'], 'intermediate'),
('Hyrox Simulation Run', 'running', 'race_specific', '8 x 1km at target race pace with station work between each km. The gold standard Hyrox-specific run workout. Simulates actual race demands.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'advanced'),
('Fartlek Run', 'running', 'mixed', 'Unstructured speed play within a continuous run. Alternate between fast and easy efforts based on feel. 30-45 minutes total.', ARRAY['quads', 'hamstrings', 'calves', 'glutes'], ARRAY['running_shoes'], 'beginner'),
('Progression Run', 'running', 'threshold', 'Start easy and gradually increase pace every 10-15 minutes until finishing at tempo or threshold pace. Teaches pacing discipline.', ARRAY['quads', 'hamstrings', 'calves', 'glutes', 'core'], ARRAY['running_shoes'], 'intermediate');

-- Strength exercises
INSERT INTO exercise_library (name, category, subcategory, description, muscle_groups, equipment_needed, difficulty) VALUES
('Back Squat', 'strength', 'lower_body', 'Barbell on upper back, squat to parallel or below. The king of lower body exercises for building quad and glute strength essential to Hyrox.', ARRAY['quads', 'glutes', 'hamstrings', 'core'], ARRAY['barbell', 'squat_rack'], 'intermediate'),
('Front Squat', 'strength', 'lower_body', 'Barbell in front rack position, squat to parallel or below. More quad-dominant than back squat and mimics the upright torso position of wall balls.', ARRAY['quads', 'glutes', 'core'], ARRAY['barbell', 'squat_rack'], 'advanced'),
('Goblet Squat', 'strength', 'lower_body', 'Hold a kettlebell or dumbbell at chest height and squat. Excellent for learning squat mechanics and building base strength.', ARRAY['quads', 'glutes', 'core'], ARRAY['kettlebell'], 'beginner'),
('Bulgarian Split Squat', 'strength', 'lower_body', 'Rear foot elevated on bench, lunge down on front leg. Builds single-leg strength crucial for running and lunges. 3 x 10 per leg.', ARRAY['quads', 'glutes', 'hamstrings'], ARRAY['dumbbells', 'bench'], 'intermediate'),
('Step-Ups', 'strength', 'lower_body', 'Step up onto a box or bench with one leg, drive to full extension. Mimics running and lunge mechanics. Alternate legs or do all one side.', ARRAY['quads', 'glutes', 'calves'], ARRAY['box', 'dumbbells'], 'beginner'),
('Deadlift', 'strength', 'lower_body', 'Lift barbell from floor to hip height with a flat back. Builds posterior chain strength for sled work and running power.', ARRAY['hamstrings', 'glutes', 'lower_back', 'core', 'forearms'], ARRAY['barbell'], 'intermediate'),
('Romanian Deadlift', 'strength', 'lower_body', 'Hinge at hips with slight knee bend, lowering barbell along shins. Targets hamstrings and glutes. Essential for running economy.', ARRAY['hamstrings', 'glutes', 'lower_back'], ARRAY['barbell'], 'intermediate'),
('Single-Leg Deadlift', 'strength', 'lower_body', 'Balance on one leg while hinging forward. Builds single-leg stability and hamstring strength. 3 x 10 per leg.', ARRAY['hamstrings', 'glutes', 'core'], ARRAY['dumbbell'], 'intermediate'),
('Hip Thrust', 'strength', 'lower_body', 'Upper back on bench, barbell across hips, drive hips to full extension. The best glute isolation exercise for running power.', ARRAY['glutes', 'hamstrings', 'core'], ARRAY['barbell', 'bench'], 'intermediate'),
('Calf Raises', 'strength', 'lower_body', 'Rise up onto toes with bodyweight or added weight. Standing or seated. Builds calf endurance for 8km of running.', ARRAY['calves'], ARRAY['none'], 'beginner'),
('Overhead Press', 'strength', 'upper_body', 'Press barbell or dumbbells from shoulder height to overhead. Builds shoulder strength for SkiErg and wall balls.', ARRAY['shoulders', 'triceps', 'core'], ARRAY['barbell'], 'intermediate'),
('Bench Press', 'strength', 'upper_body', 'Press barbell from chest to full extension while lying on bench. Builds pushing strength relevant to sled push.', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['barbell', 'bench'], 'intermediate'),
('Barbell Row', 'strength', 'upper_body', 'Hinge forward, pull barbell from hanging position to lower chest. Builds back strength for sled pull and rowing.', ARRAY['lats', 'biceps', 'rear_delts', 'core'], ARRAY['barbell'], 'intermediate'),
('Pull-Ups', 'strength', 'upper_body', 'Hang from bar, pull chin above bar. Builds lat and grip strength for SkiErg and sled pull. Use bands for assistance if needed.', ARRAY['lats', 'biceps', 'forearms', 'core'], ARRAY['pull_up_bar'], 'intermediate'),
('Dumbbell Row', 'strength', 'upper_body', 'Single-arm row with knee on bench. Builds unilateral back strength and grip endurance.', ARRAY['lats', 'biceps', 'forearms'], ARRAY['dumbbell', 'bench'], 'beginner'),
('Lat Pulldown', 'strength', 'upper_body', 'Pull cable bar from overhead to upper chest. Builds lat strength for SkiErg and sled pull. Good substitute for pull-ups.', ARRAY['lats', 'biceps', 'forearms'], ARRAY['cable_machine'], 'beginner'),
('Plank', 'strength', 'core', 'Hold a straight-body position on forearms and toes. Builds the core stability needed for every Hyrox station. Hold for 30-90 seconds.', ARRAY['core', 'shoulders'], ARRAY['none'], 'beginner'),
('Pallof Press', 'strength', 'core', 'Anti-rotation hold with cable or band. Press handles away from chest and resist rotation. Builds functional core stability.', ARRAY['core', 'obliques'], ARRAY['cable_machine'], 'intermediate'),
('Hanging Leg Raises', 'strength', 'core', 'Hang from pull-up bar and raise legs to 90 degrees or higher. Builds hip flexor and lower ab strength.', ARRAY['core', 'hip_flexors'], ARRAY['pull_up_bar'], 'advanced'),
('Farmers Walk (Gym)', 'strength', 'grip', 'Walk with heavy dumbbells or kettlebells for distance or time. Builds grip endurance and core stability. Use heavier weight than race weight.', ARRAY['forearms', 'traps', 'core'], ARRAY['dumbbells'], 'beginner'),
('Sandbag Carry', 'strength', 'grip', 'Carry a sandbag in various positions (bear hug, shoulder, zercher) for distance. Builds functional strength for Hyrox stations.', ARRAY['core', 'forearms', 'shoulders', 'quads'], ARRAY['sandbag'], 'intermediate');

-- Conditioning exercises
INSERT INTO exercise_library (name, category, subcategory, description, muscle_groups, equipment_needed, difficulty) VALUES
('EMOM Workout', 'conditioning', 'emom', 'Every Minute On the Minute: perform a set number of reps at the top of each minute, rest the remainder. Example: 20 min EMOM alternating wall balls and burpees.', ARRAY['full_body'], ARRAY['varies'], 'intermediate'),
('AMRAP Workout', 'conditioning', 'amrap', 'As Many Rounds As Possible in a set time. Cycle through exercises continuously. Example: 15 min AMRAP of 10 KB swings + 10 box jumps + 200m run.', ARRAY['full_body'], ARRAY['varies'], 'intermediate'),
('Tabata Intervals', 'conditioning', 'tabata', '20 seconds max effort, 10 seconds rest x 8 rounds (4 minutes total). Can use any exercise. Extreme metabolic conditioning.', ARRAY['full_body'], ARRAY['varies'], 'advanced'),
('Hyrox Full Simulation', 'conditioning', 'race_specific', 'Complete mock Hyrox race: 8 x 1km runs with all 8 station exercises between runs at race weights and distances. The ultimate race prep workout.', ARRAY['full_body'], ARRAY['all_hyrox_equipment'], 'advanced'),
('Hyrox Half Simulation', 'conditioning', 'race_specific', 'Half-distance simulation: 4 x 1km runs with 4 station exercises. Covers the first or second half of the race. Good for midweek race prep.', ARRAY['full_body'], ARRAY['all_hyrox_equipment'], 'intermediate'),
('Circuit Training', 'conditioning', 'circuit', 'Rotate through 5-8 exercises with minimal rest between stations. 3-4 rounds. Example: push-ups, squats, rows, lunges, burpees, plank.', ARRAY['full_body'], ARRAY['varies'], 'beginner'),
('Assault Bike Intervals', 'conditioning', 'bike', 'Hard intervals on assault/echo bike. Example: 10 x 20 cal hard with 40s rest. Builds aerobic capacity without running impact.', ARRAY['quads', 'glutes', 'core'], ARRAY['assault_bike'], 'intermediate'),
('Kettlebell Swings', 'conditioning', 'kettlebell', 'Hip hinge and explosively swing kettlebell to shoulder height. 5 x 20 reps. Builds hip power for sled work and running.', ARRAY['glutes', 'hamstrings', 'core', 'shoulders'], ARRAY['kettlebell'], 'beginner'),
('Box Jumps', 'conditioning', 'plyometric', 'Jump onto a box or platform from standing. Step down to reset. Builds explosive leg power. 4 x 10 reps.', ARRAY['quads', 'glutes', 'calves'], ARRAY['plyo_box'], 'intermediate'),
('Burpees', 'conditioning', 'bodyweight', 'Drop to ground (chest touches), push up, jump with hands overhead. The classic full-body conditioning exercise. Sets of 10-20.', ARRAY['full_body'], ARRAY['none'], 'beginner'),
('Battle Rope Intervals', 'conditioning', 'upper_body', 'Alternate arm waves, slams, or circles with heavy ropes. 30s work / 30s rest x 8-10 rounds. Builds upper body endurance.', ARRAY['shoulders', 'core', 'forearms'], ARRAY['battle_ropes'], 'intermediate'),
('Med Ball Slams', 'conditioning', 'power', 'Lift medicine ball overhead and slam to ground with maximum force. Builds explosive power and full-body coordination. 4 x 12.', ARRAY['core', 'lats', 'shoulders'], ARRAY['medicine_ball'], 'beginner'),
('Jump Rope', 'conditioning', 'cardio', 'Continuous skipping for time or intervals. Builds calf endurance, coordination, and aerobic base without heavy impact. 5-15 minutes.', ARRAY['calves', 'shoulders', 'core'], ARRAY['jump_rope'], 'beginner');

-- Recovery & Mobility exercises
INSERT INTO exercise_library (name, category, subcategory, description, muscle_groups, equipment_needed, difficulty) VALUES
('Foam Rolling — Lower Body', 'recovery', 'soft_tissue', 'Roll quads, hamstrings, glutes, calves, and IT bands for 60-90 seconds per area. Reduces muscle tension and promotes recovery.', ARRAY['quads', 'hamstrings', 'glutes', 'calves'], ARRAY['foam_roller'], 'beginner'),
('Foam Rolling — Upper Body', 'recovery', 'soft_tissue', 'Roll lats, thoracic spine, shoulders, and pecs for 60-90 seconds per area. Addresses upper body tension from SkiErg and sled work.', ARRAY['lats', 'thoracic_spine', 'shoulders'], ARRAY['foam_roller'], 'beginner'),
('Hip Mobility Flow', 'mobility', 'lower_body', '10-minute hip mobility routine: 90/90 switches, hip circles, pigeon stretch, frog stretch, Cossack squats. Essential for squat depth and running.', ARRAY['hip_flexors', 'glutes', 'adductors'], ARRAY['none'], 'beginner'),
('Ankle Mobility Drills', 'mobility', 'lower_body', 'Banded ankle dorsiflexion, wall ankle stretches, and calf raises with full range. Improves squat depth and reduces shin splint risk.', ARRAY['calves', 'ankles'], ARRAY['resistance_band'], 'beginner'),
('Thoracic Spine Mobility', 'mobility', 'upper_body', 'Cat-cow, thread the needle, foam roller thoracic extensions, and open book rotations. Improves overhead position for SkiErg and wall balls.', ARRAY['thoracic_spine', 'shoulders'], ARRAY['foam_roller'], 'beginner'),
('Active Recovery Walk', 'recovery', 'active', '20-40 minute easy walk. Promotes blood flow and recovery without adding training stress. Ideal for rest days.', ARRAY['full_body'], ARRAY['none'], 'beginner'),
('Yoga Flow — Athlete', 'recovery', 'yoga', '30-minute yoga sequence targeting common tightness in Hyrox athletes: hip flexors, hamstrings, shoulders, thoracic spine. Sun salutations to cool-down.', ARRAY['full_body'], ARRAY['yoga_mat'], 'beginner'),
('Static Stretching Routine', 'recovery', 'stretching', '15-minute post-workout static stretching: hamstrings, quads, hip flexors, calves, lats, chest. Hold each stretch 30-60 seconds.', ARRAY['full_body'], ARRAY['none'], 'beginner'),
('Cool-Down Protocol', 'recovery', 'cool_down', '10-minute structured cool-down: 5 min easy walk/jog, 5 min static stretching. Helps transition from training to recovery state.', ARRAY['full_body'], ARRAY['none'], 'beginner');


-- ============================================
-- 3. Achievement Definitions (23 achievements)
-- ============================================

INSERT INTO achievement_definitions (name, description, icon_name, category, criteria, tier) VALUES

-- Getting Started (5)
('Profile Complete', 'Completed your athlete profile with all key information', 'user-check', 'getting_started',
 '{"type": "profile_complete", "condition": "profile_complete = true"}', 'common'),

('First Conversation', 'Had your first coaching conversation with Coach K', 'message-circle', 'getting_started',
 '{"type": "conversation_count", "condition": "count >= 1"}', 'common'),

('First Workout', 'Logged your first workout in the training log', 'dumbbell', 'getting_started',
 '{"type": "workout_count", "condition": "count >= 1"}', 'common'),

('First Benchmark', 'Completed your first benchmark test to establish a baseline', 'target', 'getting_started',
 '{"type": "benchmark_count", "condition": "count >= 1"}', 'common'),

('First Race', 'Entered your first official Hyrox race result', 'flag', 'getting_started',
 '{"type": "race_count", "condition": "count >= 1"}', 'common'),

-- Consistency (5)
('Week Warrior', 'Maintained a 7-day training streak — consistency is king', 'flame', 'consistency',
 '{"type": "training_streak", "condition": "streak_days >= 7"}', 'uncommon'),

('Monthly Machine', 'Maintained a 30-day training streak — you are a machine', 'zap', 'consistency',
 '{"type": "training_streak", "condition": "streak_days >= 30"}', 'rare'),

('Century Club', 'Logged 100 total workouts — dedication pays off', 'trophy', 'consistency',
 '{"type": "workout_count", "condition": "count >= 100"}', 'rare'),

('Station Master', 'Trained all 8 Hyrox station types at least once', 'layout-grid', 'consistency',
 '{"type": "unique_stations_trained", "condition": "count >= 8"}', 'uncommon'),

('Half Century', 'Logged 50 total workouts — building a solid foundation', 'star', 'consistency',
 '{"type": "workout_count", "condition": "count >= 50"}', 'uncommon'),

-- Performance (8)
('New PR', 'Set a new personal record in any exercise or station', 'trending-up', 'performance',
 '{"type": "pr_set", "condition": "any_new_pr = true"}', 'common'),

('Sub-90 Club', 'Completed a Hyrox race in under 90 minutes (men) or 100 minutes (women)', 'clock', 'performance',
 '{"type": "race_time", "condition": "total_time_minutes < 90", "condition_female": "total_time_minutes < 100"}', 'uncommon'),

('Sub-75 Club', 'Completed a Hyrox race in under 75 minutes (men) or 85 minutes (women)', 'timer', 'performance',
 '{"type": "race_time", "condition": "total_time_minutes < 75", "condition_female": "total_time_minutes < 85"}', 'rare'),

('Elite Status', 'Completed a Hyrox race in under 60 minutes (men) or 70 minutes (women)', 'crown', 'performance',
 '{"type": "race_time", "condition": "total_time_minutes < 60", "condition_female": "total_time_minutes < 70"}', 'legendary'),

('Simulation Complete', 'Completed a full 8-station Hyrox simulation workout in training', 'check-circle-2', 'performance',
 '{"type": "simulation_complete", "condition": "is_simulation = true"}', 'uncommon'),

('Full Baseline', 'Benchmarked all 8 Hyrox stations — you know your numbers', 'bar-chart-3', 'performance',
 '{"type": "stations_benchmarked", "condition": "count >= 8"}', 'uncommon'),

('PR Streak', 'Set 5 or more personal records in a single month', 'rocket', 'performance',
 '{"type": "monthly_prs", "condition": "count >= 5"}', 'rare'),

('All-Around Improvement', 'Improved your time on all 8 Hyrox stations from previous benchmarks', 'award', 'performance',
 '{"type": "all_stations_improved", "condition": "improved_count >= 8"}', 'epic'),

-- Racing (5)
('Race Day Debut', 'Completed your first official Hyrox race — you are a Hyrox athlete', 'medal', 'racing',
 '{"type": "official_race_count", "condition": "count >= 1"}', 'uncommon'),

('Race PR', 'Beat your previous best official Hyrox race time', 'chevrons-up', 'racing',
 '{"type": "race_pr", "condition": "beat_previous = true"}', 'uncommon'),

('Globe Trotter', 'Completed Hyrox races in 2 or more different cities', 'map-pin', 'racing',
 '{"type": "unique_race_cities", "condition": "count >= 2"}', 'rare'),

('Division Up', 'Moved up from Open to Pro division — elite territory', 'arrow-up-circle', 'racing',
 '{"type": "division_change", "condition": "from_open_to_pro = true"}', 'epic'),

('Race Veteran', 'Completed 5 or more official Hyrox races', 'shield', 'racing',
 '{"type": "official_race_count", "condition": "count >= 5"}', 'rare');


-- ============================================
-- 4. Skill Level Benchmarks
-- ============================================
-- All times in seconds. Data from HyroxDataLab (700K+ races),
-- verified coaching sources, and official race result distributions.

-- Men's Station Benchmarks
INSERT INTO skill_level_benchmarks (station_id, segment_type, skill_level, gender, min_seconds, max_seconds, median_seconds, notes) VALUES

-- SkiErg (Station 1) — Men
('00000000-0000-0000-0000-000000000001', 'station', 'elite', 'male', 210, 260, 235, 'Sub-4:00 is world class; 3:30-4:20 range for elite'),
('00000000-0000-0000-0000-000000000001', 'station', 'advanced', 'male', 250, 290, 270, '4:10-4:50 typical for sub-75 min finishers'),
('00000000-0000-0000-0000-000000000001', 'station', 'intermediate', 'male', 280, 340, 310, '4:40-5:40 range for 75-90 min finishers'),
('00000000-0000-0000-0000-000000000001', 'station', 'beginner', 'male', 330, 420, 375, '5:30-7:00 for first-timers and 90+ min finishers'),

-- Sled Push (Station 2) — Men
('00000000-0000-0000-0000-000000000002', 'station', 'elite', 'male', 150, 210, 180, 'Sub-3:00 requires serious leg strength; highly weight-dependent'),
('00000000-0000-0000-0000-000000000002', 'station', 'advanced', 'male', 190, 250, 220, '3:10-4:10 for competitive Open division'),
('00000000-0000-0000-0000-000000000002', 'station', 'intermediate', 'male', 230, 320, 275, '3:50-5:20 — most variable station by body weight'),
('00000000-0000-0000-0000-000000000002', 'station', 'beginner', 'male', 300, 480, 390, '5:00-8:00 — can be extremely slow for lighter athletes'),

-- Sled Pull (Station 3) — Men
('00000000-0000-0000-0000-000000000003', 'station', 'elite', 'male', 200, 277, 240, 'Rope technique matters more than raw strength'),
('00000000-0000-0000-0000-000000000003', 'station', 'advanced', 'male', 260, 330, 295, '4:20-5:30 for sub-75 finishers'),
('00000000-0000-0000-0000-000000000003', 'station', 'intermediate', 'male', 310, 400, 355, '5:10-6:40 for intermediate athletes'),
('00000000-0000-0000-0000-000000000003', 'station', 'beginner', 'male', 380, 540, 460, '6:20-9:00 — grip is the limiting factor'),

-- Burpee Broad Jumps (Station 4) — Men
('00000000-0000-0000-0000-000000000004', 'station', 'elite', 'male', 220, 277, 250, 'Jump distance is key — 2m+ per jump saves huge time'),
('00000000-0000-0000-0000-000000000004', 'station', 'advanced', 'male', 260, 330, 295, '4:20-5:30 — most metabolically demanding station'),
('00000000-0000-0000-0000-000000000004', 'station', 'intermediate', 'male', 310, 400, 355, '5:10-6:40 — pacing is critical'),
('00000000-0000-0000-0000-000000000004', 'station', 'beginner', 'male', 380, 510, 445, '6:20-8:30 — many beginners hit the wall here'),

-- Rowing (Station 5) — Men
('00000000-0000-0000-0000-000000000005', 'station', 'elite', 'male', 220, 270, 245, '3:40-4:30 — technique efficiency is everything'),
('00000000-0000-0000-0000-000000000005', 'station', 'advanced', 'male', 260, 300, 280, '4:20-5:00 for experienced rowers'),
('00000000-0000-0000-0000-000000000005', 'station', 'intermediate', 'male', 290, 350, 320, '4:50-5:50 — form deteriorates with fatigue'),
('00000000-0000-0000-0000-000000000005', 'station', 'beginner', 'male', 340, 420, 380, '5:40-7:00 for beginner rowers'),

-- Farmers Carry (Station 6) — Men
('00000000-0000-0000-0000-000000000006', 'station', 'elite', 'male', 95, 119, 107, 'Sub-2:00 requires strong grip and fast walking pace'),
('00000000-0000-0000-0000-000000000006', 'station', 'advanced', 'male', 110, 140, 125, '1:50-2:20 — grip is rarely the issue at this level'),
('00000000-0000-0000-0000-000000000006', 'station', 'intermediate', 'male', 130, 170, 150, '2:10-2:50 for intermediate athletes'),
('00000000-0000-0000-0000-000000000006', 'station', 'beginner', 'male', 160, 230, 195, '2:40-3:50 — grip failure causes stops'),

-- Sandbag Lunges (Station 7) — Men
('00000000-0000-0000-0000-000000000007', 'station', 'elite', 'male', 210, 264, 237, 'Quad endurance from prior stations is the real limiter'),
('00000000-0000-0000-0000-000000000007', 'station', 'advanced', 'male', 250, 310, 280, '4:10-5:10 for competitive athletes'),
('00000000-0000-0000-0000-000000000007', 'station', 'intermediate', 'male', 300, 380, 340, '5:00-6:20 — quads are destroyed by this point'),
('00000000-0000-0000-0000-000000000007', 'station', 'beginner', 'male', 360, 510, 435, '6:00-8:30 — many athletes walk between lunges'),

-- Wall Balls (Station 8) — Men
('00000000-0000-0000-0000-000000000008', 'station', 'elite', 'male', 300, 364, 332, '5:00-6:04 — leg fatigue from lunges makes this brutal'),
('00000000-0000-0000-0000-000000000008', 'station', 'advanced', 'male', 350, 420, 385, '5:50-7:00 for sub-75 finishers'),
('00000000-0000-0000-0000-000000000008', 'station', 'intermediate', 'male', 400, 500, 450, '6:40-8:20 — break strategy is key'),
('00000000-0000-0000-0000-000000000008', 'station', 'beginner', 'male', 480, 660, 570, '8:00-11:00 — frequent breaks needed'),

-- Women's Station Benchmarks (approx 15-20% longer than men at same skill level)

-- SkiErg (Station 1) — Women
('00000000-0000-0000-0000-000000000001', 'station', 'elite', 'female', 240, 300, 270, 'Sub-4:30 is elite; lighter weight helps some'),
('00000000-0000-0000-0000-000000000001', 'station', 'advanced', 'female', 290, 340, 315, '4:50-5:40 for competitive women'),
('00000000-0000-0000-0000-000000000001', 'station', 'intermediate', 'female', 330, 400, 365, '5:30-6:40 for intermediate'),
('00000000-0000-0000-0000-000000000001', 'station', 'beginner', 'female', 390, 500, 445, '6:30-8:20 for beginners'),

-- Sled Push (Station 2) — Women
('00000000-0000-0000-0000-000000000002', 'station', 'elite', 'female', 170, 240, 205, 'Lighter sled but lighter body weight — evens out'),
('00000000-0000-0000-0000-000000000002', 'station', 'advanced', 'female', 220, 300, 260, '3:40-5:00 for competitive women'),
('00000000-0000-0000-0000-000000000002', 'station', 'intermediate', 'female', 280, 380, 330, '4:40-6:20 for intermediate'),
('00000000-0000-0000-0000-000000000002', 'station', 'beginner', 'female', 360, 540, 450, '6:00-9:00 — can be very tough for lighter women'),

-- Sled Pull (Station 3) — Women
('00000000-0000-0000-0000-000000000003', 'station', 'elite', 'female', 230, 320, 275, 'Grip and technique are extra critical'),
('00000000-0000-0000-0000-000000000003', 'station', 'advanced', 'female', 300, 390, 345, '5:00-6:30'),
('00000000-0000-0000-0000-000000000003', 'station', 'intermediate', 'female', 370, 470, 420, '6:10-7:50'),
('00000000-0000-0000-0000-000000000003', 'station', 'beginner', 'female', 450, 630, 540, '7:30-10:30 — grip endurance is the main limiter'),

-- Burpee Broad Jumps (Station 4) — Women
('00000000-0000-0000-0000-000000000004', 'station', 'elite', 'female', 250, 320, 285, 'Shorter jump distance increases total rep count'),
('00000000-0000-0000-0000-000000000004', 'station', 'advanced', 'female', 300, 390, 345, '5:00-6:30'),
('00000000-0000-0000-0000-000000000004', 'station', 'intermediate', 'female', 370, 470, 420, '6:10-7:50'),
('00000000-0000-0000-0000-000000000004', 'station', 'beginner', 'female', 450, 600, 525, '7:30-10:00'),

-- Rowing (Station 5) — Women
('00000000-0000-0000-0000-000000000005', 'station', 'elite', 'female', 250, 310, 280, 'Technique matters more with less muscle mass'),
('00000000-0000-0000-0000-000000000005', 'station', 'advanced', 'female', 300, 360, 330, '5:00-6:00'),
('00000000-0000-0000-0000-000000000005', 'station', 'intermediate', 'female', 350, 420, 385, '5:50-7:00'),
('00000000-0000-0000-0000-000000000005', 'station', 'beginner', 'female', 400, 510, 455, '6:40-8:30'),

-- Farmers Carry (Station 6) — Women
('00000000-0000-0000-0000-000000000006', 'station', 'elite', 'female', 105, 140, 122, 'Lighter bells but grip is still the limiter'),
('00000000-0000-0000-0000-000000000006', 'station', 'advanced', 'female', 130, 170, 150, '2:10-2:50'),
('00000000-0000-0000-0000-000000000006', 'station', 'intermediate', 'female', 160, 210, 185, '2:40-3:30'),
('00000000-0000-0000-0000-000000000006', 'station', 'beginner', 'female', 200, 280, 240, '3:20-4:40'),

-- Sandbag Lunges (Station 7) — Women
('00000000-0000-0000-0000-000000000007', 'station', 'elite', 'female', 240, 310, 275, 'Lighter sandbag but still 100m of lunges'),
('00000000-0000-0000-0000-000000000007', 'station', 'advanced', 'female', 290, 370, 330, '4:50-6:10'),
('00000000-0000-0000-0000-000000000007', 'station', 'intermediate', 'female', 350, 450, 400, '5:50-7:30'),
('00000000-0000-0000-0000-000000000007', 'station', 'beginner', 'female', 430, 600, 515, '7:10-10:00'),

-- Wall Balls (Station 8) — Women
('00000000-0000-0000-0000-000000000008', 'station', 'elite', 'female', 330, 420, 375, '5:30-7:00 with lighter ball'),
('00000000-0000-0000-0000-000000000008', 'station', 'advanced', 'female', 400, 500, 450, '6:40-8:20'),
('00000000-0000-0000-0000-000000000008', 'station', 'intermediate', 'female', 480, 600, 540, '8:00-10:00'),
('00000000-0000-0000-0000-000000000008', 'station', 'beginner', 'female', 570, 780, 675, '9:30-13:00');

-- Run Segment Benchmarks (per 1km, no station_id)
INSERT INTO skill_level_benchmarks (station_id, segment_type, skill_level, gender, min_seconds, max_seconds, median_seconds, notes) VALUES
(NULL, 'run', 'elite', 'male', 205, 230, 218, '3:25-3:50/km — world class maintains sub-3:40 across all 8 runs'),
(NULL, 'run', 'advanced', 'male', 250, 280, 265, '4:10-4:40/km — strong runners hold 4:20 average'),
(NULL, 'run', 'intermediate', 'male', 285, 330, 308, '4:45-5:30/km — typical for 75-90 min finishers'),
(NULL, 'run', 'beginner', 'male', 330, 390, 360, '5:30-6:30/km — expect significant slowdown on runs 7-8'),
(NULL, 'run', 'elite', 'female', 220, 250, 235, '3:40-4:10/km — elite women hold sub-4:00 average'),
(NULL, 'run', 'advanced', 'female', 270, 310, 290, '4:30-5:10/km'),
(NULL, 'run', 'intermediate', 'female', 315, 360, 338, '5:15-6:00/km'),
(NULL, 'run', 'beginner', 'female', 360, 440, 400, '6:00-7:20/km');

-- Transition Benchmarks (per transition, no station_id)
INSERT INTO skill_level_benchmarks (station_id, segment_type, skill_level, gender, min_seconds, max_seconds, median_seconds, notes) VALUES
(NULL, 'transition', 'elite', 'male', 25, 40, 32, '~4-5 min total for 8 transitions; minimal time in Roxzone'),
(NULL, 'transition', 'advanced', 'male', 35, 50, 42, '~5-6:30 total'),
(NULL, 'transition', 'intermediate', 'male', 50, 70, 60, '~7-9 min total; some walking in Roxzone'),
(NULL, 'transition', 'beginner', 'male', 65, 100, 82, '~9-13 min total; significant walking/recovery'),
(NULL, 'transition', 'elite', 'female', 28, 42, 35, '~4-5:30 total'),
(NULL, 'transition', 'advanced', 'female', 38, 55, 46, '~5-7 min total'),
(NULL, 'transition', 'intermediate', 'female', 55, 75, 65, '~7:20-10 min total'),
(NULL, 'transition', 'beginner', 'female', 70, 110, 90, '~9:20-14:40 total');
