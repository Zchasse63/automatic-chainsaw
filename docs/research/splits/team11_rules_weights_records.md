# Team 11 — Hyrox Official Rules, Weights & World Records

## Status: Not started
## Priority: CRITICAL (v1 model got sled weights wrong, hallucinated venue details)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a Hyrox rules and data specialist building a verified fact database for an AI-powered Hyrox coach. The coach's v1 model made factual errors about sled weights, station order, venue details, and world records. This research must provide 100% accurate, verifiable data.

## CRITICAL ERRORS TO FIX
1. Model said sled pull weight is "same as sled push" — WRONG (push is heavier than pull)
2. Model said "Run 8 is after Farmers Carry" — WRONG (Run 8 is after Sandbag Lunges)
3. Model said "This run is downhill in most venues" — WRONG (all Hyrox races are indoors, flat)
4. Model claimed "World record 1:39 by Alexander Roncevic" for sled push — cannot verify

## 1. Complete Weight Tables

### CRITICAL: Provide exact weights for EVERY station in EVERY division

Format as a clear table. For each station, list the weight for:
- Open Men (individual)
- Open Women (individual)
- Pro Men (individual)
- Pro Women (individual)
- Doubles Men
- Doubles Women
- Doubles Mixed
- Relay (if different)

Stations that use weights:
1. **Sled Push** — What is the total sled weight? (sled + added weight)
2. **Sled Pull** — What is the total sled weight? (MUST BE DIFFERENT from sled push!)
3. **Farmer's Carry** — Weight per hand? Total weight?
4. **Sandbag Lunges** — Sandbag weight?
5. **Wall Balls** — Ball weight? Target height?
6. **SkiErg** — Distance (1000m for all?)
7. **Rowing** — Distance (1000m for all?)
8. **Burpee Broad Jumps** — Distance (80m for all?)

### Sled Push vs Sled Pull Weight Difference
- Explicitly state: sled push weight ≠ sled pull weight
- Provide the exact difference for each division
- Why are they different? (sled pull is lighter because the pulling motion is harder)

## 2. Station Order & Run Mapping

### The Exact Sequence
List the COMPLETE race sequence in order:
- Run 1 → Station 1 (name) → Run 2 → Station 2 (name) → ... → Run 8 → Station 8 (name) → Finish Run

### Station-to-Run Mapping
For EACH of the 8 runs, state:
- Which station precedes it
- Which station follows it
- How the preceding station typically affects running (e.g., "Run 7 follows Farmer's Carry — forearms are fatigued but legs are relatively fresh")

### The Correct Station Order (verify each):
1. SkiErg (1000m)
2. Sled Push (50m)
3. Sled Pull (50m)
4. Burpee Broad Jumps (80m)
5. Rowing (1000m)
6. Farmer's Carry (200m)
7. Sandbag Lunges (100m)
8. Wall Balls (100 reps)

Is this order correct for 2024/2025 and 2025/2026 seasons? Has it ever changed?

## 3. Venue Details

### Indoor/Outdoor
- ALL Hyrox races are held INDOORS — confirm this
- Typical venue types: convention centers, exhibition halls, arenas
- Running surface: what surface do athletes run on? (artificial turf? rubber? concrete?)
- Is the course FLAT? (answer should be YES — no hills, no elevation changes)
- Are there turns on the running course? How tight?
- Typical venue temperature and conditions

### Course Layout
- Is the running course a loop or out-and-back?
- How many laps per 1km run section?
- Where are the station areas relative to the running course?
- Spectator areas — can spectators see the whole race?

## 4. World Records & Benchmarks

### Verified World Records
For each of these, provide: Name, Time, Date, Event Location (or state "cannot verify")
- Men's Individual (Open)
- Men's Individual (Pro)
- Women's Individual (Open)
- Women's Individual (Pro)
- Men's Doubles
- Women's Doubles
- Mixed Doubles

### Realistic Time Benchmarks
What are realistic finishing times for each level?
- Complete beginner / first-timer
- Recreational fitness (works out 3-4x/week)
- Intermediate competitor (2nd or 3rd Hyrox)
- Competitive / age group podium
- Elite / Pro division
- World class

### Station Time Benchmarks
For an intermediate male athlete (~75-80 minute finish), provide realistic times for each station:
- SkiErg 1000m
- Sled Push 50m
- Sled Pull 50m
- Burpee Broad Jumps 80m
- Rowing 1000m
- Farmer's Carry 200m
- Sandbag Lunges 100m
- Wall Balls 100 reps
- Average 1km run split

## 5. Official Rules & Penalties

### General Rules
- What equipment can athletes bring?
- What is prohibited?
- Are headphones allowed?
- Timing chip/bib placement rules

### Station Rules
- Sled push: must the sled cross a line? What if it stops moving?
- Sled pull: hand-over-hand required? Can you walk back to the sled?
- Wall balls: what counts as a valid rep? (ball must hit target line)
- Burpee broad jumps: what counts as a valid rep? Chest must touch floor?
- Farmer's carry: can you put the weights down and rest? Penalty?
- Sandbag lunges: knee must touch ground?

### Penalties
- What happens if you miss reps at a station?
- What happens if the sled doesn't cross the finish line?
- DQ conditions — what can get you disqualified?

### 2025/2026 Rule Changes
- Have any rules changed for the current season?
- Any weight changes?
- Any station format changes?

Provide ONLY verified, sourced information. Include the source (Hyrox official website, rulebook, race manual) for every major claim. If data cannot be verified, clearly state "UNVERIFIED" next to it.
```
