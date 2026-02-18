# Coach K: v2 (Model Only) vs v2+RAG — Comparison Report

**Date**: 2026-02-16
**Model**: `meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-HafB`
**RAG Pipeline**: Hybrid search (semantic + full-text), top 5 chunks
**Embedding**: text-embedding-3-small (1536 dim)
**Knowledge Base**: 239 chunks from Supabase PGVector
**Grader**: Llama 3.3 70B Instruct (base, temperature=0)

---

## Executive Summary

| Metric | v2 (Model Only) | v2+RAG | Change |
|--------|-----------------|--------|--------|
| **Overall check pass rate** | 78% (258/330) | 83% (273/330) | +4.5pp |
| **Avg output tokens** | 618 | 688 | +70 |
| **Avg latency** | 14.3s | 16.6s | +2.3s |
| **Scenarios** | 59 | 59 | — |

---

## Performance by Category

| Category | v2 | v2+RAG | Change | Verdict |
|----------|----|----|--------|---------|
| Advanced | 79% (15/19) | 84% (16/19) | +5pp | Good |
| Boundaries (V2 NEW) | 100% (8/8) | 100% (8/8) | +0pp | Excellent |
| Doubles (V2 NEW) | 67% (6/9) | 78% (7/9) | +11pp | RAG IMPROVED |
| Doubles/Team | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| Edge Cases | 89% (24/27) | 96% (26/27) | +7pp | Excellent |
| Equipment | 80% (8/10) | 70% (7/10) | -10pp | Needs work |
| Equipment (V2 NEW) | 87% (13/15) | 80% (12/15) | -7pp | Good |
| Mental Game | 75% (9/12) | 50% (6/12) | -25pp | RAG REGRESSION |
| Multi-Turn | 100% (9/9) | 78% (7/9) | -22pp | RAG REGRESSION |
| Nutrition | 92% (11/12) | 92% (11/12) | +0pp | Excellent |
| Persona | 88% (14/16) | 88% (14/16) | +0pp | Good |
| Race Format & Facts | 65% (13/20) | 65% (13/20) | +0pp | Needs work |
| Race Strategy | 71% (15/21) | 76% (16/21) | +5pp | Good |
| Recovery & Injury | 56% (10/18) | 89% (16/18) | +33pp | RAG IMPROVED |
| Running | 83% (10/12) | 83% (10/12) | +0pp | Good |
| Special Populations | 67% (8/12) | 83% (10/12) | +17pp | RAG IMPROVED |
| Station Technique | 63% (29/46) | 74% (34/46) | +11pp | RAG IMPROVED |
| Technique (V2 NEW) | 75% (6/8) | 100% (8/8) | +25pp | RAG IMPROVED |
| Training Programming | 89% (31/35) | 97% (34/35) | +9pp | Excellent |
| Venue (V2 NEW) | 80% (4/5) | 60% (3/5) | -20pp | RAG REGRESSION |
| Weights (V2 NEW) | 90% (9/10) | 90% (9/10) | +0pp | Excellent |

---

## Scenario-by-Scenario Comparison

| ID | Category | v2 | v2+RAG | Delta | Status |
|----|----------|----|----|-------|--------|
| fact_01 | Race Format & Facts | 60% (6/10) | 60% (6/10) | +0pp | Needs work |
| fact_02 | Race Format & Facts | 100% (5/5) | 80% (4/5) | -20pp | RAG REGRESSION |
| fact_03 | Race Format & Facts | 40% (2/5) | 60% (3/5) | +20pp | RAG IMPROVED |
| station_01 | Station Technique | 60% (3/5) | 80% (4/5) | +20pp | RAG IMPROVED |
| station_02 | Station Technique | 83% (5/6) | 83% (5/6) | +0pp | Good |
| station_03 | Station Technique | 60% (3/5) | 80% (4/5) | +20pp | RAG IMPROVED |
| station_04 | Station Technique | 83% (5/6) | 83% (5/6) | +0pp | Good |
| station_05 | Station Technique | 100% (5/5) | 100% (5/5) | +0pp | Excellent |
| station_06 | Station Technique | 50% (3/6) | 50% (3/6) | +0pp | Needs work |
| station_07 | Station Technique | 50% (3/6) | 67% (4/6) | +17pp | RAG IMPROVED |
| station_08 | Station Technique | 29% (2/7) | 57% (4/7) | +29pp | RAG IMPROVED |
| train_01 | Training Programming | 83% (5/6) | 100% (6/6) | +17pp | RAG IMPROVED |
| train_02 | Training Programming | 100% (5/5) | 100% (5/5) | +0pp | Excellent |
| train_03 | Training Programming | 83% (5/6) | 100% (6/6) | +17pp | RAG IMPROVED |
| train_04 | Training Programming | 83% (5/6) | 100% (6/6) | +17pp | RAG IMPROVED |
| train_05 | Training Programming | 83% (5/6) | 83% (5/6) | +0pp | Good |
| train_06 | Training Programming | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| run_01 | Running | 67% (4/6) | 67% (4/6) | +0pp | Needs work |
| run_02 | Running | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| nutr_01 | Nutrition | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| nutr_02 | Nutrition | 83% (5/6) | 83% (5/6) | +0pp | Good |
| recov_01 | Recovery & Injury | 17% (1/6) | 83% (5/6) | +67pp | RAG IMPROVED |
| recov_02 | Recovery & Injury | 83% (5/6) | 100% (6/6) | +17pp | RAG IMPROVED |
| recov_03 | Recovery & Injury | 67% (4/6) | 83% (5/6) | +17pp | RAG IMPROVED |
| race_01 | Race Strategy | 62% (5/8) | 88% (7/8) | +25pp | RAG IMPROVED |
| race_02 | Race Strategy | 71% (5/7) | 57% (4/7) | -14pp | RAG REGRESSION |
| race_03 | Race Strategy | 83% (5/6) | 83% (5/6) | +0pp | Good |
| pop_01 | Special Populations | 67% (4/6) | 100% (6/6) | +33pp | RAG IMPROVED |
| pop_02 | Special Populations | 67% (4/6) | 67% (4/6) | +0pp | Needs work |
| equip_01 | Equipment | 100% (5/5) | 80% (4/5) | -20pp | RAG REGRESSION |
| equip_02 | Equipment | 60% (3/5) | 60% (3/5) | +0pp | Needs work |
| mental_01 | Mental Game | 83% (5/6) | 50% (3/6) | -33pp | RAG REGRESSION |
| mental_02 | Mental Game | 67% (4/6) | 50% (3/6) | -17pp | RAG REGRESSION |
| team_01 | Doubles/Team | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| adv_01 | Advanced | 71% (5/7) | 86% (6/7) | +14pp | RAG IMPROVED |
| adv_02 | Advanced | 67% (4/6) | 67% (4/6) | +0pp | Needs work |
| adv_03 | Advanced | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| edge_01 | Edge Cases | 100% (5/5) | 100% (5/5) | +0pp | Excellent |
| edge_02 | Edge Cases | 100% (5/5) | 100% (5/5) | +0pp | Excellent |
| edge_03 | Edge Cases | 100% (6/6) | 100% (6/6) | +0pp | Excellent |
| edge_04 | Edge Cases | 60% (3/5) | 80% (4/5) | +20pp | RAG IMPROVED |
| edge_05 | Edge Cases | 83% (5/6) | 100% (6/6) | +17pp | RAG IMPROVED |
| persona_01 | Persona | 100% (6/6) | 83% (5/6) | -17pp | RAG REGRESSION |
| persona_02 | Persona | 60% (3/5) | 80% (4/5) | +20pp | RAG IMPROVED |
| persona_03 | Persona | 100% (5/5) | 100% (5/5) | +0pp | Excellent |
| multi_01 | Multi-Turn | 100% (4/4) | 100% (4/4) | +0pp | Excellent |
| multi_02 | Multi-Turn | 100% (5/5) | 60% (3/5) | -40pp | RAG REGRESSION |
| v2_equip_01 | Equipment (V2 NEW) | 100% (5/5) | 80% (4/5) | -20pp | RAG REGRESSION |
| v2_equip_02 | Equipment (V2 NEW) | 100% (5/5) | 60% (3/5) | -40pp | RAG REGRESSION |
| v2_equip_03 | Equipment (V2 NEW) | 60% (3/5) | 100% (5/5) | +40pp | RAG IMPROVED |
| v2_doubles_01 | Doubles (V2 NEW) | 80% (4/5) | 80% (4/5) | +0pp | Good |
| v2_doubles_02 | Doubles (V2 NEW) | 50% (2/4) | 75% (3/4) | +25pp | RAG IMPROVED |
| v2_weights_01 | Weights (V2 NEW) | 100% (4/4) | 100% (4/4) | +0pp | Excellent |
| v2_weights_02 | Weights (V2 NEW) | 83% (5/6) | 83% (5/6) | +0pp | Good |
| v2_venue_01 | Venue (V2 NEW) | 80% (4/5) | 60% (3/5) | -20pp | RAG REGRESSION |
| v2_technique_01 | Technique (V2 NEW) | 100% (4/4) | 100% (4/4) | +0pp | Excellent |
| v2_technique_02 | Technique (V2 NEW) | 50% (2/4) | 100% (4/4) | +50pp | RAG IMPROVED |
| v2_boundary_01 | Boundaries (V2 NEW) | 100% (4/4) | 100% (4/4) | +0pp | Excellent |
| v2_boundary_02 | Boundaries (V2 NEW) | 100% (4/4) | 100% (4/4) | +0pp | Excellent |

### RAG Improvements (>10pp gain)

**fact_03 (Race Format & Facts)**: 40% → 60% (+20pp)
  Chunks used: team1a_011, team1a_010, team4b_012, team1a_012, team2b_synth_008
  - [PASS] Competitive: 65-75 minutes — Time range correct
  - [PASS] Elite/Pro: sub-60 minutes — Time correct
  - [PASS] Men vs women time differences — Differences shown

**station_01 (Station Technique)**: 60% → 80% (+20pp)
  Chunks used: team1b_002, team1c_001, team1c_000, team1b_007, team1b_001
  - [PASS] Pacing strategy (negative or even split) — Even pacing plan
  - [PASS] Specific pace targets (e.g., 1:5x-2:0x/500m) — Target splits provided
  - [PASS] Core engagement — Hips and lats engaged
  - [PASS] Breathing pattern — Breathe every stroke

**station_03 (Station Technique)**: 60% → 80% (+20pp)
  Chunks used: team1c_003, team1c_005, team7_015, team1c_006, team1c_004
  - [PASS] Hand-over-hand technique — Described in detail
  - [PASS] Foot bracing technique — Mentioned as foot anchoring
  - [PASS] Rope management — Discussed as key skill
  - [PASS] Grip preservation — Tips provided for grip

**station_07 (Station Technique)**: 50% → 67% (+17pp)
  Chunks used: team1c_016, team1c_015, team1b_004, team1c_017, team7_017
  - [PASS] Glute engagement to offload quads — Posterior chain emphasis
  - [PASS] Training recommendations — Three-part protocol
  - [PASS] Step length — 0.9-1.1m target
  - [PASS] Relationship to final wall balls and 1km — Direct downstream effect

**station_08 (Station Technique)**: 29% → 57% (+29pp)
  Chunks used: team1c_019, team1c_020, team1c_018, team1c_021, team2b_synth_005
  - [PASS] Break strategy (sets of 20-25 or unbroken for fit athletes) — Provides break strategy
  - [PASS] Ball catch and redirect — Mentions catch
  - [PASS] Breathing pattern (exhale on throw) — Correct breathing
  - [PASS] Mental strategy for last station — Provides mental strategy

**train_01 (Training Programming)**: 83% → 100% (+17pp)
  Chunks used: team3c_006, team3c_004, team3a_synth_003, team5_003, team3b_synth_008
  - [PASS] 5-day structure with specific sessions — Detailed weekly structure
  - [PASS] Mix of running, station work, and hybrid sessions — Variety of sessions included
  - [PASS] At least 1 long run or race simulation — Hyrox Simulation on Thursday
  - [PASS] Rest/recovery days — Saturday and Sunday rest
  - [PASS] Progressive overload mention — Progression for next 10 weeks
  - [PASS] Specific exercises with sets/reps — Detailed exercise breakdown

**train_03 (Training Programming)**: 83% → 100% (+17pp)
  Chunks used: team5_021, team3b_synth_008, team2b_synth_008, team5_000, team3c_006
  - [PASS] Reduce volume 40-60% — Volume reduction specified
  - [PASS] Maintain intensity — Intensity near race level
  - [PASS] Specific day-by-day guidance — Detailed 10-day protocol
  - [PASS] Last hard session timing — Last hard session implied
  - [PASS] Light touch-point sessions — Easy runs and shakeouts
  - [PASS] Sleep and recovery emphasis — Rest and recovery emphasized

**train_04 (Training Programming)**: 83% → 100% (+17pp)
  Chunks used: team2b_synth_008, team1a_014, team3c_006, team1a_011, team1b_006
  - [PASS] Identify likely time sinks — Time sinks identified
  - [PASS] Transition time optimization — Roxzone optimization
  - [PASS] Station-specific speed work — Station work included
  - [PASS] Running pace targets — Pace targets provided
  - [PASS] Specific weekly structure changes — Phased plan outlined
  - [PASS] Race simulation frequency — Simulations scheduled

**recov_01 (Recovery & Injury)**: 17% → 83% (+67pp)
  Chunks used: team7_009, team1c_016, team7_020, team5_005, team1c_019
  - [PASS] Do NOT push through 2-week persistent pain — Explicitly advises rest
  - [PASS] Possible MCL or meniscus issue — Mentions medial meniscus
  - [PASS] Recommend professional assessment — See physiotherapist
  - [PASS] Modified training alternatives — Provides alternatives
  - [PASS] What to avoid — Avoid lunges and running

**recov_02 (Recovery & Injury)**: 83% → 100% (+17pp)
  Chunks used: team1b_010, team5_021, team5b_013, team5b_014, team5_005
  - [PASS] Recognize overtraining symptoms — Identifies symptoms correctly
  - [PASS] Immediate volume reduction (deload) — Reduces volume by 50%
  - [PASS] Sleep optimization — Prioritizes sleep
  - [PASS] Stress management — Addresses physiological overload
  - [PASS] Return-to-training plan — Outlines 2-week recovery
  - [PASS] 4-week race timeline considerations — Adjusts plan for race

**recov_03 (Recovery & Injury)**: 67% → 83% (+17pp)
  Chunks used: team1c_004, team1c_003, team1c_002, team5_008, team5b_013
  - [PASS] Not normal — technique issue likely — Identifies technique issue
  - [PASS] Common cause: too upright on sled push — Mentions standing too tall
  - [PASS] Core bracing recommendations — Provides bracing technique
  - [PASS] Form corrections — Offers specific corrections
  - [PASS] Prehab exercises — Recommends exercises

**race_01 (Race Strategy)**: 62% → 88% (+25pp)
  Chunks used: team5_022, team1b_009, team1b_008, team1b_011, team1c_001
  - [PASS] Wake time and breakfast timing — Detailed morning plan
  - [PASS] Warm-up protocol — Light jog and dynamic mobility
  - [PASS] Arrival time — 70 minutes before start
  - [PASS] Pre-race activation — Station priming and sled push
  - [PASS] Pacing plan station by station — Target split timeline provided
  - [PASS] Hydration/fueling during race — Gel and water intake planned
  - [PASS] Mental cues — Calm and focused framework

**pop_01 (Special Populations)**: 67% → 100% (+33pp)
  Chunks used: team1a_011, team2b_synth_009, team3c_006, team2b_synth_008, team3a_synth_007
  - [PASS] Not too old — Hyrox has age group divisions — Masters divisions mentioned
  - [PASS] Recovery takes longer — plan accordingly — 48 hours recovery time
  - [PASS] Injury prevention priority — Prehab and mobility emphasized
  - [PASS] Joint-friendly training modifications — Reduced volume and intensity
  - [PASS] Realistic expectations — 1:45-2:00 finish goal
  - [PASS] Warm-up importance — 10-15 minute warm-up recommended

**adv_01 (Advanced)**: 71% → 86% (+14pp)
  Chunks used: team1a_010, team1a_011, team3c_006, team2b_synth_008, team1a_014
  - [PASS] Specific time targets per station — Targets listed
  - [PASS] Running pace targets (sub 4:00-4:15/km) — Pace targets given
  - [PASS] Station speed work — Included in plan
  - [PASS] Specificity over volume — Emphasized in plan
  - [PASS] Race simulation at target pace — Saturday simulation
  - [PASS] Identifies which 3 minutes to shave — Improvement needed listed

**edge_04 (Edge Cases)**: 60% → 80% (+20pp)
  Chunks used: team8_007, team8_013, team8_002, team3c_004, team8_015
  - [PASS] Evidence-based only (caffeine, creatine, beta-alanine) — Lists evidence-based supplements
  - [PASS] Doesn't oversell supplements — Provides balanced information
  - [PASS] Race day: caffeine timing, electrolytes — Caffeine timing correct
  - [PASS] No bro-science — Scientific explanations provided

**edge_05 (Edge Cases)**: 83% → 100% (+17pp)
  Chunks used: team7_011, team3a_synth_003, team1a_002, team3a_synth_007, team1b_002
  - [PASS] Substitute exercises for each station — Provides substitutes
  - [PASS] SkiErg alternatives (battle ropes, band pulldowns) — Mentions battle ropes
  - [PASS] Sled push alternatives (heavy prowler, weighted push) — Weighted bear crawl
  - [PASS] Wall ball alternatives (thrusters, med ball throws) — Lists thrusters
  - [PASS] Farmer carry: heavy dumbbells/kettlebells — Heavy DB/KB carries
  - [PASS] Creative solutions — Offers alternatives

**persona_02 (Persona)**: 60% → 80% (+20pp)
  Chunks used: team3c_007, team3c_005, team3c_006, team2_005, team2_004
  - [PASS] Gives a direct answer — Direct yes answer
  - [PASS] Brief explanation of why — Explains fatigue risk
  - [PASS] Suggests better allocation — Provides session plan
  - [PASS] Coaching tone, not lecturing — Helpful advice tone

**v2_equip_03 (Equipment (V2 NEW))**: 60% → 100% (+40pp)
  Chunks used: team3c_004, team3c_003, team4_004, team3c_002, team3b_synth_008
  - [PASS] Mentions 2+ real shoe models — Multiple models listed
  - [PASS] Explains cross-trainer category — Category explained clearly
  - [PASS] Grip for sled work — Grip mentioned for sled
  - [PASS] Enough cushion for 8km running — Cushion discussed for running
  - [PASS] Does NOT recommend Vaporfly, Alphafly, or pure racing flats — Vaporfly not recommended

**v2_doubles_02 (Doubles (V2 NEW))**: 50% → 75% (+25pp)
  Chunks used: team1a_004, team1a_005, team1a_000, team1a_006, team1a_014
  - [PASS] Relay is 4 athletes, not 2 — Clearly states 4-person team
  - [PASS] Each athlete does 2 runs and 2 stations — Sequence outlined
  - [PASS] Differs from Doubles (which is 2 athletes, all runs together) — Explained difference

**v2_technique_02 (Technique (V2 NEW))**: 50% → 100% (+50pp)
  Chunks used: team2b_synth_006, team1a_012, team1c_008, team5_009, team1a_009
  - [PASS] 2:45 is NOT realistic for intermediate — that's elite/sub-60 pace — Correctly disputes 2:45 time
  - [PASS] Intermediate is more like 4:00-5:30 — Provides accurate range
  - [PASS] Provides realistic range by level — Gives detailed benchmarks
  - [PASS] Doesn't agree with unrealistic benchmarks — Correctly disputes friend's claim


### RAG Regressions (>10pp drop)

**fact_02 (Race Format & Facts)**: 100% → 80% (-20pp)
  Chunks used: team1a_004, team1a_001, team1a_005, team1a_003, team1a_006
  - [FAIL] Doubles: two athletes split stations, each runs every 1km — Running together

**race_02 (Race Strategy)**: 71% → 57% (-14pp)
  Chunks used: team1b_009, team1b_007, team1b_008, team1b_011, team1b_010
  - [FAIL] Wrong shoes — Not mentioned
  - [FAIL] Ignoring hydration — Not explicitly mentioned
  - [FAIL] Not knowing the course/station layout — Not mentioned

**equip_01 (Equipment)**: 100% → 80% (-20pp)
  Chunks used: team3c_006, team3c_007, team3c_002, team2b_synth_009, team3c_005
  - [FAIL] Hybrid recommendation (cross-trainer with some cushion) — No hybrid suggestion

**mental_01 (Mental Game)**: 83% → 50% (-33pp)
  Chunks used: team1c_019, team1c_018, team1c_021, team2b_synth_005, team1c_020
  - [FAIL] Practice 100 reps in training — Only 50 reps practiced
  - [FAIL] Self-talk strategies — No self-talk strategies
  - [FAIL] It's the last station — dig deep — Not mentioned as last station

**mental_02 (Mental Game)**: 67% → 50% (-17pp)
  Chunks used: team1b_010, team1c_021, team1b_011, team1b_004, team1c_009
  - [FAIL] Break race into thirds — No thirds mentioned
  - [FAIL] Use other athletes for motivation — No comparison suggested
  - [FAIL] Remind yourself of training — No training reminder

**persona_01 (Persona)**: 100% → 83% (-17pp)
  Chunks used: team1a_011, team4_004, team2b_synth_009, team1b_000, team1b_007
  - [FAIL] Asks about experience or offers next steps — No questions asked

**multi_02 (Multi-Turn)**: 100% → 60% (-40pp)
  Chunks used: team4_004, team7_014, team2_013, team3c_002, team7_013
  - [FAIL] Neither — it's the hybrid that matters — No hybrid mention
  - [FAIL] Specific examples of why both matter — No examples given

**v2_equip_01 (Equipment (V2 NEW))**: 100% → 80% (-20pp)
  Chunks used: team4_004, team3c_005, team3c_006, team3c_007, team3c_008
  - [FAIL] Explains lack of grip on turf/sled surfaces — No grip issue mentioned

**v2_equip_02 (Equipment (V2 NEW))**: 100% → 60% (-40pp)
  Chunks used: team1c_013, team1c_015, team7_015, team1c_003, team1c_004
  - [FAIL] Core should be trained to brace without belt — Not explicitly mentioned
  - [FAIL] Not practical for transitions — Not mentioned at all

**v2_venue_01 (Venue (V2 NEW))**: 80% → 60% (-20pp)
  Chunks used: team1a_002, team3c_006, team1a_000, team3c_004, team3c_007
  - [FAIL] Running surface is typically artificial turf or similar — Artificial flooring/carpet
  - [FAIL] Does NOT hallucinate specific venue names — Venue names listed

---

## RAG Retrieval Analysis

### Most Retrieved Chunks

| Chunk ID | Times Retrieved |
|----------|----------------|
| team3c_006 | 18 |
| team2b_synth_008 | 12 |
| team1c_004 | 8 |
| team3c_004 | 8 |
| team3c_002 | 8 |
| team1a_000 | 7 |
| team3c_007 | 7 |
| team1a_011 | 6 |
| team1c_003 | 6 |
| team3b_synth_008 | 6 |
| team2b_synth_009 | 6 |
| team1b_006 | 5 |
| team1a_004 | 5 |
| team1c_001 | 5 |
| team1c_002 | 5 |

---

## Conclusion

- **Overall**: v2+RAG scores **83%** vs v2's **78%** (+4.5pp)
- **Improvements**: 20 scenarios gained >10pp with RAG
- **Regressions**: 10 scenarios lost >10pp with RAG
- **Latency**: 16.6s avg (v2: 14.3s) — +2.3s from RAG overhead

**RAG integration improves overall accuracy but introduces 10 regression(s) to investigate.**