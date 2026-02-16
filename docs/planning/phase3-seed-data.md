# Phase 3: Seed Data & Reference Tables — Hyrox AI Coach

> **Role**: You are a sports data researcher and database engineer. Your job is to produce production-ready seed data SQL for the Hyrox AI Coach application's reference tables. This data must exist before the app is usable — athletes need comparison targets, exercise definitions, and station specs from day one. You are in research/planning mode — produce SQL INSERT statements and documentation, do NOT execute anything.

---

## Project Context

The Hyrox AI Coach is a training application for Hyrox athletes. The database schema (designed in Phase 2) includes several reference tables that need to be populated with accurate, real-world Hyrox data before the application launches.

**Hyrox race format**: 8 rounds of 1km run → workout station, performed in a fixed order. The race combines endurance running with functional fitness stations.

---

## What This Phase Covers

You need to produce seed data for these reference tables (their schemas come from Phase 2):

### 1. `hyrox_stations` — The 8 Hyrox Workout Stations

Research and populate the complete, accurate data for all 8 stations. This is the core reference data for the entire app.

**Station order and specifications:**

| # | Station | Distance/Reps | Notes |
|---|---------|--------------|-------|
| 1 | SkiErg | 1,000m | Concept2 SkiErg |
| 2 | Sled Push | 50m | Weight varies by division |
| 3 | Sled Pull | 50m | Weight varies by division |
| 4 | Burpee Broad Jumps | 80m | Bodyweight |
| 5 | Rowing | 1,000m | Concept2 rower |
| 6 | Farmers Carry | 200m | Weight varies by division |
| 7 | Sandbag Lunges | 100m | Weight varies by division |
| 8 | Wall Balls | 100 reps (men) / 75 reps (women) | Weight/height varies |

**Weight specifications to research and include per division:**
- Open Men / Open Women
- Pro Men / Pro Women
- Doubles Men / Doubles Women / Doubles Mixed
- Age groups if different from Open

Known starting points (verify these):
- Sled Push: Open Men 152kg / Open Women 102kg
- Sled Pull: Open Men 103kg / Open Women 78kg
- Farmers Carry, Sandbag Lunges, Wall Balls: Research correct weights per division
- Wall Balls: Research ball weight AND target height per division

**For each station, include:**
- Station number, name, exercise type
- Distance or rep count
- All weight specifications by division and gender
- Brief description of the movement
- 3-5 technique tips (as JSONB array)
- Common mistakes (as JSONB array)
- Muscles primarily worked

### 2. Benchmark Times by Skill Level

Research and produce benchmark/target times for each station AND for running segments, broken down by skill level. These are what athletes compare themselves against in the Performance & Analytics screen.

**Skill levels to cover:**
- Elite / Pro (sub-60 min total)
- Advanced / Competitive (60-75 min total)
- Intermediate (75-90 min total)
- Beginner / Recreational (90-110+ min total)

**For each skill level, provide benchmarks for:**
- Each of the 8 stations (target time in seconds)
- 1km running pace (target time per km)
- Transition time targets (between stations)
- Total race time range

**Separate benchmarks for men and women where relevant.**

Research sources to consider:
- Official Hyrox race results and published statistics
- Hyrox World Championship times
- Community data from Hyrox social media, forums, and athlete blogs
- Published training guides from Hyrox-certified coaches
- Race result databases (if publicly available)

### 3. Exercise Library

Populate a comprehensive exercise library covering all movement categories relevant to Hyrox training. This feeds the Training Plan and Workout Logger screens.

**Categories to cover:**

**Station-Specific Exercises** (linked to hyrox_stations via FK):
- SkiErg drills and progressions
- Sled push/pull technique work and substitutes
- Burpee broad jump variations and progressions
- Rowing drills and progressions
- Farmers carry variations
- Lunge variations (sandbag and general)
- Wall ball variations and progressions

**Running:**
- Easy/recovery runs, tempo runs, intervals, hill repeats, long runs
- Hyrox-specific run formats (e.g., 8x1km with station work between)

**Strength:**
- Compound lifts relevant to Hyrox (squats, deadlifts, overhead press, rows)
- Single-leg work (Bulgarian split squats, step-ups)
- Grip/carry work (dead hangs, farmer carries, sandbag work)
- Core/stability

**Conditioning/HIIT:**
- EMOM, AMRAP, Tabata formats
- Circuit training templates
- Hyrox simulation workouts

**Recovery/Mobility:**
- Foam rolling, stretching, yoga flows
- Active recovery sessions

**For each exercise, include:**
- Name, category, subcategory
- Description (how to perform it)
- Primary muscle groups (text array)
- Equipment needed (text array)
- Difficulty level (beginner/intermediate/advanced)
- hyrox_station_id FK (if station-specific, null otherwise)
- is_active: true

**Target**: 80-120 exercises covering the full training spectrum. Prioritize quality and Hyrox-relevance over volume.

### 4. Achievement Definitions

Design and populate the gamification achievements that athletes can earn. These should motivate consistent training and milestone celebration.

**Achievement categories:**

**Getting Started:**
- First profile completed
- First AI coaching conversation
- First workout logged
- First benchmark test completed
- First race result entered

**Training Consistency:**
- 7-day training streak
- 30-day training streak
- 100 workouts logged
- Trained all 8 station types

**Performance Milestones:**
- New personal record (any station or exercise)
- Sub-90 minute Hyrox (men) / Sub-100 minute Hyrox (women)
- Sub-75 minute Hyrox / Sub-85 minute Hyrox
- Sub-60 minute Hyrox / Sub-70 minute Hyrox (elite)
- Completed a full Hyrox simulation in training
- All 8 stations benchmarked

**Racing:**
- First official Hyrox race completed
- Race PR (beat previous race time)
- Completed races in 2+ different cities
- Moved up a division (Open → Pro)

**For each achievement, include:**
- Name, description, category
- Icon name (from Lucide React icon library — the app uses Lucide)
- Criteria as JSONB (machine-readable conditions for checking unlock status)
- Rarity/tier (common/uncommon/rare/epic/legendary)

### 5. Default Training Plan Templates (Optional but Recommended)

If time allows, create 2-3 template training plans that can be assigned to new athletes as starting points:

- **8-Week Beginner Hyrox Plan** — For first-time Hyrox athletes with general fitness background
- **12-Week Competitive Hyrox Plan** — For intermediate athletes targeting sub-80 minutes
- **6-Week Hyrox Taper/Peak Plan** — For athletes 6 weeks out from race day

These would be stored as training_plans with is_ai_generated=false, with associated weeks and days.

---

## Research Guidelines

- **Accuracy is critical** — Athletes will compare their times against these benchmarks. Wrong data erodes trust immediately.
- **Verify weights** — Hyrox occasionally updates weight standards. Check the most current (2024-2025) specifications from hyrox.com.
- **Benchmark times should be realistic ranges**, not single numbers. Use JSONB to store min/max/median where appropriate.
- **Exercise descriptions should be concise but complete** — enough for an athlete to understand the movement without a video.
- **Cite sources** where possible, especially for benchmark times.

---

## Deliverables

### Deliverable 1: `002_seed_data.sql`
A single SQL file with all INSERT statements, ordered by table dependency:
1. hyrox_stations (8 rows)
2. exercise_library (80-120 rows)
3. achievement_definitions (20-30 rows)
4. benchmark data (however you structure it — could be a separate benchmarks table or JSONB within stations)

### Deliverable 2: Benchmark Reference Document
A human-readable markdown document summarizing:
- All benchmark times in a clear table format (athletes and coaches will reference this)
- Weight specifications per division in a clear table
- Sources used for the data
- Any data points that need verification or are estimated

### Deliverable 3: Exercise Library Catalog
A markdown document listing all exercises with their categories, station mappings, and difficulty levels — serves as a quick reference for the training plan feature.
