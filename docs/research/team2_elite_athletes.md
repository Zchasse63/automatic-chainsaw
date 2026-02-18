# Team 2 — Elite Hyrox Athletes: Training Methods & Philosophy

## Status: ⬜ Not started
## Priority: 🔴 Critical path
## Dependencies: None (can start immediately)
## Research method: Perplexity API → preset="advanced-deep-research"
## Note: This is a large research task. Consider splitting into 2 Perplexity calls (Tier 1 + Tier 2).

---

## Prompt for Perplexity

```
You are a research analyst studying the training methods of elite Hyrox athletes
to build an AI coaching knowledge base.

Research the following athletes in depth. For EACH athlete, document:

### Athletes to Research

**Tier 1 — Elite Hyrox Specialists:**
- Hunter McIntyre (multiple Hyrox world champion, "King of Hyrox")
- Jake Dearden (Elite UK Hyrox competitor)
- Dan Churchill (chef/athlete, Hyrox competitor and content creator)

**Tier 2 — CrossFit Legends Crossing Into Hyrox/Endurance:**
- Jason Khalipa (CrossFit Games champion, known for "AMRAP mentality")
- Rich Froning (winningest CrossFit athlete ever, team/individual)

For each athlete, research and document:

1. **Training Philosophy & Identity**
   - Core training beliefs and principles
   - How they describe their own approach
   - What makes their method unique vs. others

2. **Weekly Training Structure**
   - Typical weekly split (how many sessions, what type)
   - How they balance running/cardio vs. strength vs. skill work
   - Volume and intensity distribution
   - Do they follow a specific program or self-program?

3. **Session Design Patterns**
   - Favorite workout formats (EMOM, AMRAP, intervals, time trials, etc.)
   - Example workouts they've shared publicly
   - How they structure warm-ups and cooldowns
   - Use of Hyrox-specific simulation workouts

4. **Hyrox-Specific Preparation**
   - How they train for each station
   - Sled work programming
   - SkiErg/Rower interval strategies
   - Wall ball endurance protocols
   - How they integrate running with station work

5. **Periodization & Peaking**
   - How they structure a training block leading into a race
   - Taper strategy
   - Off-season vs. competition-season differences
   - How far out they start Hyrox-specific prep

6. **Recovery & Lifestyle**
   - Recovery modalities used
   - Nutrition approach (general philosophy)
   - Sleep priorities
   - Supplement protocols if publicly shared

7. **Unique/Differentiating Methods**
   - What do they do that NOBODY else does?
   - Any unconventional training tools or techniques
   - Mental performance strategies

**Special focus for Hunter McIntyre**: He has been the most vocal and documented
Hyrox athlete. Dig into his podcast appearances, YouTube content, and any
published training guides or programs he's released.

**Special focus for Khalipa & Froning**: Their CrossFit background gives them a
unique hybrid fitness perspective. Focus on how their general physical
preparedness (GPP) approach translates to Hyrox demands, and any specific
Hyrox content they've produced.

IMPORTANT OUTPUT REQUIREMENTS:
- Length: This must be a LONG, EXHAUSTIVE document — at minimum 4,000-6,000 words total across all athlete profiles. Do not summarize. Each athlete should get a full, detailed profile.
- Format: Use structured markdown with H2 for each athlete, H3 for subsections, markdown tables for weekly schedules and training splits.
- Include direct quotes where available, with source attribution inline (e.g., podcast name, YouTube video title).
- Be specific: Include actual workout prescriptions, rep schemes, paces, loads, session durations — not vague descriptions.
- This content will be chunked and embedded into a vector database for semantic search, so write in natural language that matches queries like "how does Hunter McIntyre train for sled push" or "what does Rich Froning's weekly training look like."
- If information for a specific athlete/subsection is genuinely unavailable, say so explicitly rather than fabricating details.
```

---

## Expected Output
Save raw Perplexity output to: `docs/research/completed/team2_elite_athletes.md`
