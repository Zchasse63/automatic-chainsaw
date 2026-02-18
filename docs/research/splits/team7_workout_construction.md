# Team 7 — Workout Construction Rules & Equipment Substitutions

## Status: ⬜ Not started
## Priority: 🟡 High (fills critical gap — AI coach can't generate workouts without this)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a programming design expert building the workout generation engine for an AI-powered Hyrox coach. The coach needs to CREATE new workouts on the fly — not just retrieve pre-written ones. To do this, it needs the RULES and PRINCIPLES for building effective workouts.

## 1. Workout Format Construction Rules

### EMOM (Every Minute on the Minute)
- When to use EMOM format (what training goals does it serve?)
- Time domain guidelines: 8-min EMOM vs 16-min vs 24-min — when to use each
- Work:rest ratio: how much work should fit in each minute (30-40 sec work?)
- Movement count: 1 movement per minute vs 2-3 movement couplets
- Movement pairing rules: what pairs well in an EMOM? (push+pull? upper+lower?)
- Rep scheme design: how to set reps so work fits the minute
- Progression: how to make an EMOM harder over weeks (add reps? add load? reduce rest?)
- 3 example EMOMs with full prescriptions and the reasoning behind each design choice

### AMRAP (As Many Rounds As Possible)
- When to use AMRAP format
- Time domain guidelines: 5-min AMRAP vs 12-min vs 20-min — purposes of each
- Movement count: 2-movement couplet vs 3-movement triplet vs 4+ chipper-style
- Rep scheme design: how to balance movements so no single one is the bottleneck
- Scoring: how to set target scores by fitness level
- Progression: how to make an AMRAP harder
- 3 example AMRAPs with full prescriptions and design reasoning

### For Time / Task Priority
- When to use For Time format
- How to estimate appropriate total volume (not too short, not too long)
- Time cap setting: how to set time caps by fitness level
- Movement ordering: which movements go first vs last and why
- "Chipper" style: one-pass-through vs repeated rounds — when to use each
- Progression methods
- 3 example For Time workouts with full prescriptions

### Intervals (Work:Rest)
- When to use structured interval format
- Work:rest ratios by energy system target:
  - Phosphagen/alactic: 10-15 sec work, 1:3-1:5 rest ratio
  - Glycolytic: 30-90 sec work, 1:1-1:2 rest
  - Oxidative: 2-5 min work, 1:0.5-1:1 rest
- Number of intervals: how many sets for each system
- Movement selection by energy system
- Progression: increase work, decrease rest, add sets
- 3 example interval sessions with full prescriptions

### Tabata
- Classic 20:10 x 8 format and when it's appropriate
- Modified Tabata formats (:30/:15, :40/:20) and their uses
- Movement selection: what works in Tabata, what doesn't
- 2 example Tabata sessions with full prescriptions

## 2. Movement Pairing Principles

Create a comprehensive reference for how to combine movements in workouts:

### Push/Pull Pairing
- Upper body push + upper body pull (e.g., push-ups + pull-ups)
- When to use this vs avoid it

### Upper/Lower Alternating
- Upper body movement + lower body movement
- Benefit: local muscular recovery while maintaining systemic output

### Hyrox Station Simulation Pairing
- Which gym movements simulate which Hyrox stations
- Table format: Station | Primary Simulator | Secondary Alternatives
- Example: SkiErg → actual SkiErg, OR battle ropes, OR banded pull-downs

### Movement Complexity Sequencing
- When to put technical movements first (fresh) vs last (fatigued)
- How to sequence movements to avoid grip fatigue stacking
- How to avoid lower back fatigue stacking (e.g., deadlifts before rows = bad pairing)

### Create a Movement Selection Matrix
Table format: Movement | Primary Muscles | Hyrox Station Transfer | Complexity Level | Fatigue Type (local vs systemic) | Good Pairs With

Include at least 30 common training movements in this matrix.

## 3. Equipment Substitution Guide

For athletes who don't have access to Hyrox-specific equipment:

### SkiErg Alternatives
- No SkiErg: what machines or movements replicate the stimulus?
- Ranked alternatives with explanation of what each captures and misses

### Rowing Alternatives
- No rower: alternatives that replicate the full-body pull + leg drive

### Sled Push Alternatives
- No sled: what replicates heavy horizontal pushing under load?
- Consider: heavy prowler, wall pushes, loaded bear crawls, etc.

### Sled Pull Alternatives
- No sled: what replicates heavy hand-over-hand pulling?
- Consider: heavy rope pulls, seated cable rows, band-resisted pulls

### Burpee Broad Jump Alternatives
- Training at home with limited space: what captures the same stimulus?

### Farmers Carry Alternatives
- No heavy kettlebells: what works? Dumbbells, trap bar, loaded backpack?

### Sandbag Lunge Alternatives
- No sandbag: front-loaded alternatives (goblet walks, barbell lunges, etc.)

### Wall Ball Alternatives
- No wall ball target: thrusters? Front squats + push press? What captures the same metabolic demand?

For EACH substitution, explain: what % of the original stimulus it captures, and what's lost.

## 4. Scaling & Modification Framework

### Scaling by Fitness Level
- Beginner modifications for each workout format
- How to reduce complexity without losing training intent
- Rep scheme scaling: what % of prescribed reps for beginners?

### Scaling by Available Time
- How to cut a 45-min workout to 30 min: what to prioritize
- How to cut to 20 min: minimum effective dose
- Rules for preserving workout intent when compressing

### Scaling for Injuries/Limitations
- Upper body limitations: how to modify upper-body-heavy workouts
- Lower body limitations: what to substitute for squats, lunges, running
- Grip limitations: alternatives for farmers carry, sled pull, rowing
- Cardio limitations (asthma, returning from illness): intensity modifications

IMPORTANT OUTPUT REQUIREMENTS:
- Length: At minimum 5,000 words. This is the AI coach's workout generation engine.
- Format: Use markdown tables extensively, especially for the movement selection matrix and equipment substitution guide.
- Every example workout must be FULLY PRESCRIBED: movements, reps, sets, rest, time caps, scaling options.
- The movement selection matrix (30+ movements) is the MOST IMPORTANT deliverable — make it comprehensive.
- Cite sources: programming textbooks (NSCA, ACSM), CrossFit programming methodology, coaches.
```
