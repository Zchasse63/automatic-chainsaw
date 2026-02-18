# Team 5 — Periodization & 16-Week Race Prep Blueprint

## Status: ⬜ Blocked (needs Teams 1-4 output)
## Priority: 🔴 Critical path
## Dependencies: Teams 1, 2, 3, 4 completed research
## Research method: Perplexity API → preset="advanced-deep-research" + context from Teams 1-4

---

## Instructions

This task should be run AFTER Teams 1-4 have completed their research. Feed the completed research as context alongside this prompt. If Perplexity's context window can't hold all 4 team outputs, summarize each team's output into key findings first, then run this prompt with the summaries.

## Prompt for Perplexity

```
You are a training program designer building a 16-week Hyrox preparation plan.
You have access to research from other teams (which will be provided as context).

### Athlete Profile
- Male
- Currently runs 35–40 miles per week
- Currently does 4–5 strength training sessions per week
- Goal: transition 2–3 strength sessions to HIIT/hybrid Hyrox-specific work
- Target race: Hyrox on June 6, 2025
- Training start: ~mid-February 2025

### Your Task

1. **Periodization Model**
   - Design a macro-level periodization structure for 16 weeks
   - Phase breakdown: General Prep → Specific Prep → Competition → Taper
   - What changes week to week in terms of volume, intensity, specificity
   - How running volume evolves across the 16 weeks
   - How strength/HIIT balance shifts

2. **Weekly Templates (one per phase)**
   - For each phase, create a sample weekly template showing:
     - Day-by-day schedule
     - Session type (run, HIIT, strength, Hyrox simulation, recovery)
     - Estimated duration
     - Key focus/intent of each session
   - Must preserve 35-40 mpw running base
   - Must include 2-3 Hyrox-specific HIIT sessions
   - Must retain 1-2 pure strength sessions

3. **HIIT Session Library**
   - Design 15-20 different HIIT workouts using formats like:
     - EMOM (Every Minute on the Minute)
     - AMRAP (As Many Rounds/Reps As Possible)
     - For Time
     - Interval formats (work:rest ratios)
     - Tabata
     - Chipper-style
   - Each workout should target specific Hyrox stations or energy systems
   - Include scaling options and target times/scores

4. **Hyrox Simulation Workouts**
   - Design 4-6 full or partial Hyrox simulation workouts
   - When in the 16-week plan to deploy them
   - How to use them as both training AND benchmarking tools

5. **Progressive Overload Strategy**
   - How to progress running (speed work, tempo, intervals)
   - How to progress station-specific work (heavier sleds, more reps, etc.)
   - How to progress HIIT complexity and density
   - Deload week structure and frequency

6. **Taper Protocol**
   - Final 10-14 day taper strategy
   - What to cut, what to maintain
   - Race week schedule
   - Race day warm-up protocol

7. **Testing & Checkpoint Schedule**
   - When to test what (time trials, station benchmarks, simulations)
   - Key metrics to track weekly
   - Decision points: "if X, then adjust Y"

IMPORTANT OUTPUT REQUIREMENTS:
- Length: This must be the LONGEST document — at minimum 5,000-8,000 words. This is the core programming engine for the AI coach. Do not summarize anything.
- Format: Use structured markdown with H2/H3 headers and EXTENSIVE use of markdown tables.
- Weekly templates MUST be in table format: Day | Session Type | Duration | Key Focus | Example Workout
- Every workout must be fully prescribed: movements, sets x reps @ intensity (RPE or %1RM), rest periods, time caps.
- HIIT session library: Each of the 15-20 workouts needs complete prescriptions, not just descriptions.
- Decision trees for autoregulation: "If athlete reports RPE > 8 on Tuesday intervals, then reduce Thursday volume by X%"
- Be extremely specific and actionable — an AI coach will use this to generate real training plans for real athletes.
```

---

## Expected Output
Save raw Perplexity output to: `docs/research/completed/team5_periodization_blueprint.md`
