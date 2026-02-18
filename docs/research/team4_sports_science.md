# Team 4 — Sports Science: Aerobic Engine & Performance Physiology

## Status: ⬜ Not started
## Priority: 🟡 High
## Dependencies: None (can start immediately)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a research analyst specializing in exercise physiology and endurance
coaching science. You're building a knowledge base for an AI Hyrox coach
that needs to make scientifically grounded training decisions.

### Key Figures to Research

**Chris Hinshaw** — Aerobic Capacity
- Founder of Aerobic Capacity programming
- Has coached 35+ CrossFit Games champions
- Known for: interval design, aerobic base building, pacing science
- Research his interval protocols, his philosophy on "the aerobic engine,"
  and how he programs for athletes who need both power and endurance

**Andy Galpin, PhD** — Exercise Physiology & Human Performance
- Professor of Kinesiology, known for bridging science and practice
- Huberman Lab podcast series on fitness was landmark content
- Known for: energy systems, adaptation science, training volume/intensity
  frameworks, recovery science, hydration, and periodization
- Research his frameworks for:
  - Energy system development (phosphagen, glycolytic, oxidative)
  - How to train each system and why it matters for Hyrox
  - His "9 adaptations of exercise" framework
  - Volume landmarks and recovery capacity
  - His views on concurrent training (strength + endurance)

### Additional Scientific Frameworks to Document

1. **Energy Systems for Hyrox**
   - How the 3 energy systems interact during a 60-90 min Hyrox race
   - Which stations are primarily glycolytic vs. oxidative
   - How to train each system with specific protocols
   - The "interference effect" and how to manage concurrent training

2. **Aerobic Base Development**
   - Zone 2 training: what it is, why it matters, how much is enough
   - MAF method and its applicability
   - How to build an aerobic base while maintaining strength
   - Lactate threshold training for Hyrox pacing

3. **Interval Training Science**
   - Tabata, Norwegian 4x4, 30/30, long intervals, short intervals
   - Which interval protocols target which adaptations
   - How to periodize interval training leading into a race
   - Chris Hinshaw's specific interval prescriptions

4. **Concurrent Training Research**
   - The latest science on training strength and endurance simultaneously
   - Molecular interference (AMPK vs. mTOR pathways)
   - Practical recommendations: session ordering, nutrition timing, recovery
   - How elite hybrid athletes manage this

5. **Recovery & Adaptation Science**
   - Sleep requirements for hybrid athletes
   - Nutrition periodization (fueling for training vs. race day)
   - HRV, readiness metrics, and autoregulation
   - Overtraining markers and how to monitor

6. **Testing & Benchmarking**
   - Key performance tests for Hyrox readiness
   - VO2max targets, lactate threshold benchmarks
   - Strength-to-bodyweight ratios that matter
   - How to track progress without over-testing

For each concept, provide:
- The scientific principle in plain language
- Why it matters specifically for Hyrox
- Practical application (how to implement in training)
- Specific protocols with sets, reps, durations, rest periods
- Citations or source references where possible

IMPORTANT OUTPUT REQUIREMENTS:
- Length: This must be a LONG, EXHAUSTIVE document — at minimum 4,000-6,000 words. Do not summarize. This is the scientific backbone of the AI coach.
- Format: Use structured markdown with H2/H3 headers, markdown tables for protocols and benchmarks, and bullet lists for practical applications.
- Every protocol must be fully prescribed: intervals (work:rest, sets, intensity), zone training (HR ranges, RPE, duration), strength targets (% 1RM, sets x reps).
- Tables are critical: Use markdown tables for energy system comparisons, interval protocol parameters, testing benchmarks, and adaptation timelines.
- Cite sources: Reference Galpin, Hinshaw, specific studies, or podcast episodes by name inline. Distinguish between peer-reviewed science and practitioner opinion.
- This content will be chunked and embedded into a vector database for semantic search, so write in natural language that matches queries like "how should I train my aerobic base for Hyrox" or "give me a Chris Hinshaw style interval workout."
```

---

## Expected Output
Save raw Perplexity output to: `docs/research/completed/team4_sports_science.md`
