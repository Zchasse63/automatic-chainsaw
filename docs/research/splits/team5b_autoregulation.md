# Team 5b — Autoregulation Decision Trees & Adaptive Programming

## Status: ⬜ Not started
## Priority: 🔴 Critical (fills biggest gap in Team 5 output)
## Parent: Team 5 (original output missing autoregulation decision trees)
## Research method: Perplexity API → preset="advanced-deep-research"

---

## Prompt for Perplexity

```
You are a training program designer building the adaptive intelligence layer for an AI-powered Hyrox coach. The coach already has a 16-week periodization plan with HIIT workouts and simulation sessions. What's MISSING is the decision-making logic that allows the AI to ADAPT the plan in real time based on athlete feedback.

Your task is to create a comprehensive autoregulation and adaptive programming framework.

## 1. RPE-Based Session Modification Rules

Create a complete decision tree for modifying training sessions based on athlete-reported RPE (1-10 scale):

### Pre-Session Readiness Check
- How to assess readiness: questions the AI should ask before each session
- Readiness score framework (1-10) based on: sleep quality, soreness, motivation, stress, nutrition
- Modification tiers:
  - Readiness 8-10: Execute session as planned
  - Readiness 6-7: Modify (specify HOW — reduce volume? intensity? swap session type?)
  - Readiness 4-5: Significant modification (what changes?)
  - Readiness 1-3: Replace with recovery session (specify what)

### During-Session RPE Monitoring
- After warm-up RPE check: if warm-up feels RPE 7+ when it should be 4-5, what adjustments?
- Mid-session RPE check: rules for when to cut a session short
- Post-session RPE: how to log and use for future planning

### Cross-Session Adaptation Rules
Create at least 15 specific if/then rules:
- "If RPE > 8 on 2 consecutive HIIT sessions → reduce next HIIT volume by 25% and add 1 Zone 2 run"
- "If RPE < 5 on 3 consecutive sessions → increase intensity by 5-10% or add volume"
- "If athlete reports RPE 9+ on easy runs → investigate: overtraining, poor sleep, or illness"
- Continue with 12+ more rules covering: strength sessions, running, HIIT, simulations, deload triggers

## 2. Missed Session Recovery Logic

Athletes miss sessions. The AI coach needs rules for how to recover:
- Miss 1 session in a week: what to do (skip it? compress?)
- Miss 2 sessions: restructure the week — which sessions are priority?
- Miss 3+ sessions (illness/travel): how to re-enter training
- Miss a full week: modified return protocol
- Which session types are "must-do" vs "nice-to-have" in each training phase
- Priority hierarchy by phase:
  - General Prep: running > HIIT > strength
  - Specific Prep: HIIT > running > strength
  - Competition Prep: simulation > HIIT > running > strength
  - Taper: short intense > easy running > everything else

## 3. Time-Constrained Session Modifications

Athletes often have less time than planned. Rules for compression:
- 60-minute session compressed to 45 minutes: what to cut?
- 60-minute session compressed to 30 minutes: minimum effective dose
- 60-minute session compressed to 15 minutes: "emergency minimum" protocol
- Rules by session type:
  - Running: cut warm-up/cool-down, keep main set intensity
  - HIIT: reduce rounds/sets, keep movement selection and intensity
  - Strength: reduce accessories, keep main lifts
  - Simulation: convert to half-sim with key stations only

## 4. Performance-Based Plan Adjustments

The AI coach needs to adjust the 16-week plan based on benchmark test results:
- If running pace improves >5% at monthly test → advance to next phase's running intensity
- If station time stagnates for 4+ weeks → add targeted supplemental work
- If simulation time is >15% off goal pace → reassess goal, adjust training emphasis
- If one station is disproportionately slow → create station-specific intervention block
- Create a "weakness identification matrix": how to compare an athlete's station times to their tier norms and identify which stations need extra work

## 5. Environmental & Lifestyle Adaptation

- High stress week at work: reduce training volume by what %?
- Poor sleep (<6 hours): specific session modifications
- Traveling (limited equipment): travel workout protocols
- Hot weather training: heat acclimatization adjustments
- Altitude training considerations (if applicable)
- Coming back from minor illness: return-to-training protocol

## 6. Communication Templates

How should the AI coach communicate adaptations to the athlete?
- "I noticed your RPE has been elevated this week. Here's what I'm adjusting and why..."
- "You missed Tuesday's session. Here's how I've restructured your week..."
- "Your sled push time hasn't improved in 3 weeks. I'm adding targeted work..."
- Provide 10+ template responses for common adaptation scenarios

IMPORTANT OUTPUT REQUIREMENTS:
- Length: At minimum 4,000 words. This is the AI coach's decision-making brain.
- Format: Use markdown tables for decision trees. Use "IF → THEN" format for all rules.
- Every rule must be SPECIFIC and QUANTIFIED — no vague "adjust accordingly."
- Include at least 30 total decision rules across all sections.
- This document will be directly embedded as the AI coach's autoregulation logic.
- Cite sports science research supporting autoregulation approaches (RPE research, HRV studies, etc.).
```
