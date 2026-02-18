# Team 1 — Hyrox Event Deep Dive & Benchmarking

## Status: ⬜ Not started
## Priority: 🔴 Critical path
## Dependencies: None (can start immediately)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a research analyst building a knowledge base for an AI-powered Hyrox coach.

Your task is to produce a comprehensive reference document covering:

1. **Hyrox Event Format**
   - Exact structure: 8 x 1km runs + 8 functional workout stations
   - Station order, distances, weights, and reps for each division (Open, Pro, Elite)
   - Transition zone rules, penalties, equipment specs

2. **Competitive Benchmarking**
   - World record times (Men/Women, each division)
   - Breakdown of where time is spent: running vs stations vs transitions
   - What separates a 60-min finisher from a 75-min finisher from a 90-min finisher
   - Which stations are the biggest "time sinks" for most athletes

3. **Pacing Strategy**
   - Optimal pacing for 1km segments (negative split? even split?)
   - Heart rate zone management across the race
   - Station-specific pacing (e.g., SkiErg pace, sled push strategy, wall balls tempo)
   - When to push vs. conserve

4. **Common Mistakes & Race Execution**
   - Most common training and race-day errors
   - Nutrition/hydration during the event
   - Warm-up protocols
   - Mental models used by top competitors

5. **Station-by-Station Tactical Breakdown**
   For each of the 8 stations (SkiErg, Sled Push, Sled Pull, Burpee Broad Jumps,
   Rowing, Farmers Carry, Sandbag Lunges, Wall Balls):
   - Optimal technique and form cues
   - Common efficiency mistakes
   - Training benchmarks (e.g., "you should be able to do X in Y time")
   - Muscle groups taxed and how they carry over to the next run

IMPORTANT OUTPUT REQUIREMENTS:
- Length: This must be a LONG, EXHAUSTIVE reference document — at minimum 3,000-5,000 words. Do not summarize. Expand every section fully.
- Format: Use structured markdown with H2/H3 headers, markdown tables for all benchmarks and comparisons, and bullet lists for tactical details.
- Tables are critical: Use markdown tables for station weights/reps by division, world record breakdowns, time comparisons, and pacing targets.
- This content will be chunked and embedded into a vector database for semantic search, so write in natural language that matches coaching queries like "how should I pace my sled push" or "what heart rate should I target on run 5."
- Be specific: Include actual numbers, times, weights, paces, heart rate zones — not vague generalities.
- Cite sources: When referencing a specific claim, athlete quote, or study, include the source name inline.
```

---

## Expected Output
Save raw Perplexity output to: `docs/research/completed/team1_hyrox_event_analysis.md`
