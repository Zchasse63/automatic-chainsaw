# Team 1a — Hyrox Event Format & Competitive Benchmarking

## Status: ⬜ Not started
## Priority: 🔴 Critical path
## Parent: Team 1 (split due to output token limits)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a research analyst building a knowledge base for an AI-powered Hyrox coach.

Your task is to produce a comprehensive reference document covering TWO topics:

## 1. Hyrox Event Format (Complete Reference)

- Exact race structure: 8 x 1km runs + 8 functional workout stations
- Station order with EXACT distances, weights, and reps for EACH division:
  - Men's Open
  - Women's Open
  - Men's Pro
  - Women's Pro
  Present this as a detailed markdown table.
- Transition zone rules and penalties
- Equipment specifications (sled weights, sandbag weights, wall ball weights, SkiErg/rower models)
- Course layout (indoor venue, running track outside, stations inside)
- Wave start system and timing
- Doubles format differences
- Any recent rule changes for the 2025/26 season

## 2. Competitive Benchmarking

- Current world record times for Men and Women in EVERY division (Open, Pro, Doubles, Relay)
  Present as a markdown table with: Division | Record Holder | Time | Date | Location
- Age group world records for the major divisions
- Breakdown of where race time is spent:
  - Total running time vs total station time vs transition time
  - Which stations take the longest for most athletes
  - What percentage of total time is running vs working
- Performance tiers — what separates different finish times:
  - Sub-60 min (elite)
  - 60-75 min (competitive)
  - 75-90 min (solid recreational)
  - 90+ min (beginner)
  For each tier, describe typical running pace, station times, and fitness characteristics.
- Which stations are the biggest "time sinks" for recreational athletes vs elite athletes

IMPORTANT OUTPUT REQUIREMENTS:
- Length: At minimum 3,000 words. Be exhaustive. Every detail matters for the AI coach.
- Format: Use structured markdown with H2/H3 headers and EXTENSIVE use of markdown tables.
- Tables are critical: Station weights/reps by division, world records, performance tier comparisons.
- Be specific: Include actual numbers, times, weights — not generalities.
- Cite sources: Reference the official Hyrox rulebook, roxlyfe.com, hybridfitnessmedia.com, or other sources by name.
- This content will be chunked and embedded into a vector database for semantic search.
```
