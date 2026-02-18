# Team 3 — Training Programs & Fitness Camps

## Status: ⬜ Not started
## Priority: 🟡 High
## Dependencies: None (can start immediately)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a research analyst evaluating commercial and community training programs
for their applicability to Hyrox race preparation. This research will power an
AI coaching system.

### Programs to Research

**Primary (Hyrox-adjacent or directly applicable):**
- PRVN (Proven Training by Kara Saunders & Mat Fraser)
- HWPO (Hard Work Pays Off — Mat Fraser's program)
- BPN (Bare Performance Nutrition — training content/community)
- CompTrain (Ben Bergeron's competitive programming)
- Persist (Functional Bodybuilding by Marcus Filly)
- Hybrid Training programs (Nick Bare's approach)

**Secondary (methodology extraction):**
- CrossFit mainsite / CrossFit.com programming principles
- Hyrox official training app/programs (if they exist)
- Freeletics or similar HIIT-focused platforms
- Running-specific programs that complement hybrid training (80/20 Running, etc.)

For EACH program, document:

1. **Program Overview**
   - Creator/origin story
   - Target audience
   - Core philosophy in 2-3 sentences
   - Cost and accessibility

2. **Programming Structure**
   - Weekly template / training split
   - Session length and format
   - How they program conditioning vs. strength vs. skill
   - Use of EMOM, AMRAP, intervals, time caps, and other formats
   - Progression model (linear, undulating, block, conjugate, etc.)

3. **Hyrox Applicability Analysis**
   - Which elements transfer directly to Hyrox prep?
   - What's missing for a Hyrox athlete?
   - How would you modify this program for someone 16 weeks out from Hyrox?
   - Strengths and weaknesses for hybrid endurance-strength demands

4. **Sample Workouts**
   - 3-5 example workouts that are representative of the program
   - Annotate which Hyrox stations or energy systems each targets

5. **Key Programming Principles to Extract**
   - What are the "rules" this program follows?
   - What can we steal for our AI coach's programming logic?
   - Rep schemes, rest protocols, intensity prescriptions

6. **Community & Results**
   - Notable athletes who follow this program
   - Any published results or testimonials specific to Hyrox or hybrid events

IMPORTANT OUTPUT REQUIREMENTS:
- Length: This must be a LONG, EXHAUSTIVE document — at minimum 3,000-5,000 words. Do not summarize. Each program deserves a full profile.
- Format: Use structured markdown with H2 for each program, H3 for subsections, and markdown tables throughout.
- Include a comparison matrix table at the end showing: focus area, session frequency, conditioning style, strength methodology, and Hyrox readiness score (1-10 with justification).
- Sample workouts must be fully prescribed: movements, reps, sets, rest periods, time caps — not just names.
- This content will be chunked and embedded into a vector database for semantic search, so write in natural language that matches queries like "what EMOM formats does HWPO use" or "which program is best for sled training."
- Be specific about what makes each program transferable (or not) to Hyrox. Vague praise is useless for an AI coach.
```

---

## Expected Output
Save raw Perplexity output to: `docs/research/completed/team3_training_programs.md`
