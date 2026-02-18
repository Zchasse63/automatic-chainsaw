# Coach K v1 — Comprehensive Evaluation Report

**Date**: 2026-02-15
**Model**: `meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v1-drry`
**Platform**: Nebius Token Factory (serverless LoRA)
**Training data**: 729 examples, 3 epochs, loss 1.535→0.709
**Evaluator**: 47 scenarios across 15 categories, every check manually scored

---

## Executive Summary

Coach K v1 is an impressive first fine-tune with **excellent coaching persona** and **outstanding training programming**, but it has **critical factual errors in equipment and Doubles format** that make it unsafe for commercial deployment without a RAG grounding layer.

| Metric | Score |
|--------|-------|
| **Overall check pass rate** | 88% (242/275 checks) |
| **Coaching quality** | 4.3/5 |
| **Persona consistency** | 4.5/5 |
| **Factual accuracy** | 88% |
| **Critical errors** | 3 (equipment, Doubles, sled weights) |
| **Dangerous advice** | 2 instances (shoe rec, belt rec) |
| **Hallucinations** | 3 confirmed |
| **Commercial readiness** | **NO** (without RAG) / **NEAR-READY** (with RAG) |

---

## Performance by Category

| Category | Scenarios | Quality | Accuracy | Verdict |
|----------|-----------|---------|----------|---------|
| Training Programming | 6 | 5.0/5 | 98% | Outstanding — flawless across all scenarios |
| Nutrition | 2 | 5.0/5 | 100% | Outstanding — evidence-based, specific, comprehensive |
| Recovery & Injury | 3 | 5.0/5 | 100% | Outstanding — responsible medical boundaries |
| Mental Game | 2 | 5.0/5 | 100% | Outstanding — great coaching psychology |
| Edge Cases | 5 | 5.0/5 | 100% | Outstanding — handles unusual scenarios perfectly |
| Multi-Turn | 2 | 5.0/5 | 100% | Outstanding — asks questions before prescribing |
| Station Technique | 8 | 4.5/5 | 92% | Strong — minor arm position debate, missing heights |
| Race Strategy | 3 | 4.5/5 | 90% | Strong — one unrealistic BBJ time target |
| Special Populations | 2 | 4.5/5 | 95% | Strong — age-appropriate, female-specific advice |
| Advanced | 3 | 4.5/5 | 92% | Strong — good periodization and HR zone guidance |
| Persona | 3 | 4.5/5 | 90% | Strong — occasionally too blunt with competing coaches |
| Race Format & Facts | 3 | 4.0/5 | 85% | Good — sled pull weight wrong, missing world records |
| Running | 2 | 4.0/5 | 75% | Good — station-to-run mapping errors in back half |
| **Equipment** | **2** | **1.5/5** | **20%** | **CRITICAL FAILURE — dangerous shoe recommendation** |
| **Doubles/Team** | **1** | **2.0/5** | **30%** | **CRITICAL FAILURE — impossible run-splitting advice** |

---

## Critical Issues (Must Fix Before Any Deployment)

### 1. DANGEROUS: Shoe Recommendation (equip_01)

**What the model says**: Recommends **Nike Vaporfly Next%** as the #1 Hyrox shoe, calling it "the gold standard" with "4%+ VO2max improvement from the carbon plate."

**Why this is dangerous**:
- Vaporfly is a **carbon-plate racing flat** designed exclusively for road running
- It has **zero lateral stability** — ankle injury risk during sled work, BBJs, and lunges
- The thin foam stack provides **zero grip** on sled push surfaces
- The carbon plate could **snap** during non-running station activities
- The shoe would be **destroyed in one race** ($250 wasted)
- The "4% VO2max improvement" claim is **factually wrong** — the research shows ~4% energy cost reduction, not VO2max improvement

**What the model should say**: Recommend hybrid cross-trainers with some cushion (NOBULL Trainer, Nike Metcon, Reebok Nano X, GORUCK Ballistic Trainer) or Hyrox-specific shoes (TYR CXT-1, Puma Fuse 2.0). Pure running shoes are problematic because they lack grip for sled work. Pure lifting shoes are problematic because they lack cushion for 8km of running.

### 2. CRITICAL: Doubles Format Run-Splitting (team_01)

**What the model says**: "Split the runs 50/50" and "If she's significantly better, she takes 6 runs, you take 4."

**Why this is wrong**: In Hyrox Doubles, **BOTH partners MUST run ALL 8 runs TOGETHER**. You cannot split runs. The model then contradicts itself later in the same response: "Critical rule: You must run together on all 8 runs." This self-contradiction would confuse any user.

**Additional errors in this response**:
- Lists only 3 stations per partner (6 total) instead of 4 per partner (8 total)
- Missing Wall Balls and Sandbag Lunges from the split entirely

### 3. FACTUAL: Sled Pull Weight (fact_01)

**What the model says**: Station 3 sled pull weight is "Same as sled push" (implying 152kg).

**Correct**: Sled push is 152kg, sled pull is **103kg** — a 49kg difference. This is a core factual error that would mislead athletes about expected difficulty.

---

## Other Factual Errors

### Station-to-Run Mapping (run_01)
The model gets the back half wrong:
- Run 6 listed as "Post-Roxzone" → should be **Post-Rowing**
- Run 7 listed as "Post-Roxzone" → should be **Post-Farmers Carry**
- Run 8 listed as "Post-Farmers Carry" → should be **Post-Sandbag Lunges**
- States "Run 8 (after Farmers Carry)" should be fastest — but Run 8 follows Sandbag Lunges (leg-destroying station)

### Indoor Venue Hallucination (run_01)
States "This run is downhill in most venues." Hyrox is held **indoors in convention centers**. There are no hills. This is a fabricated detail.

### Weightlifting Belt Recommendation (equip_02)
Recommends a "4-inch wide weightlifting belt (NOT a skinny running belt)" for race day. A weightlifting belt would impede breathing during 8km of running and provides no benefit for any Hyrox station. Most Hyrox athletes do NOT use a belt.

### Sled Push Arm Position Controversy (station_02)
Lists "Arms locked out" as a mistake, recommending "elbows bent at 90-120 degrees." Many elite Hyrox coaches recommend extended arms to maximize force transfer. This is at minimum controversial.

### BBJ Time Target (race_01)
Lists "BBJ: 2:45" in a 75-minute pacing plan. This is unrealistically fast — most intermediate athletes take 4:00-5:00 for BBJs.

### Vaporfly Weight Claim (equip_01)
Claims a 93g shoe weight difference costs "1-2 minutes of wasted energy" over 8km. This is wildly exaggerated with no scientific basis at this magnitude.

### Possible Hallucination: Sled Push World Record (station_02)
States "World record is 1:39 by Alexander Roncevic." This cannot be verified and may be fabricated.

---

## Strongest Performances

### Training Programming (5.0/5) — The Model's Best Category

Every training programming response was exceptional:
- **5-day weekly structure** (train_01): Phase-appropriate exercises, specific sets/reps/loads/rest, progressive overload, runs integrated with station work
- **3-day plan** (train_02): Brilliant prioritization — every session multi-purpose, intensity non-negotiable
- **Taper protocol** (train_03): Day-by-day guidance with dress rehearsal, nutrition, sleep targets
- **82→sub-70 improvement** (train_04): Gap analysis with specific run pace and station time targets
- **Marathon runner transition** (train_05): Keeps running volume, adds stations around it — strategic
- **CrossFitter transition** (train_06): 4-phase 16-week plan building from run/walk to compromised running

The model excels at programming because the training data was rich in this area. This is the strongest commercial value proposition.

### Recovery & Injury (5.0/5) — Responsible Medical Boundaries

- **Knee pain** (recov_01): Immediately says "Stop pushing through," identifies possible meniscus issue, recommends physio, provides modified training
- **Overtraining** (recov_02): Recognizes RHR elevation, prescribes immediate volume reduction, provides week-by-week return protocol, honest about race readiness
- **Lower back** (recov_03): Identifies likely technique causes, prescribes specific corrections and prehab

The model never crosses into medical advice territory. This is critical for liability.

### Multi-Turn Coaching Instinct (5.0/5)

When asked "I want to get better at Hyrox but I don't know where to start," the model asks 5 targeted questions before prescribing anything. This is exactly what a real coach would do.

### Persona Consistency (4.5/5)

Coach K voice is strong and consistent:
- Direct, data-driven communication ✅
- Tables and structured formatting ✅
- Specific numbers (sets, reps, RPE, pacing targets) ✅
- Explains the "why" behind every recommendation ✅
- References research data ✅
- Motivating but honest ✅
- Only weakness: "Your coach is wrong" (persona_03) could be more diplomatic

---

## Token & Latency Analysis

| Metric | Value |
|--------|-------|
| Total scenarios | 47 |
| Total output tokens | ~30,656 |
| Avg tokens/response | ~652 |
| Min tokens | 130 (multi_01 — asks questions, short response) |
| Max tokens | 1,200 (fact_01 — full race walkthrough, hit max) |
| Avg latency | 15.2 seconds |
| Min latency | 4.12 seconds |
| Max latency | 27.32 seconds |
| Avg speed | ~43 tokens/sec |
| Estimated cost | $0.024 |
| Errors | 0 (all 47 completed successfully) |

---

## Commercial Readiness Assessment

### Without RAG Layer: NOT READY

The equipment and Doubles errors are safety/DQ risks. The sled weight and station mapping errors would undermine user trust. A paying customer who wears Vaporflies based on Coach K's recommendation and injures their ankle during sled push would be a liability issue.

### With RAG Layer: NEAR-READY

The RAG layer would ground responses with correct facts (sled weights, station order, equipment rules, Doubles format). Combined with the model's excellent coaching persona, training programming, and recovery advice, the system would be commercially viable with:
1. RAG providing verified facts
2. v2 training data fixing the 3 critical areas
3. Guardrails on equipment/medical advice

### Strengths for Commercial Product
- **Coaching voice** is professional, distinctive, and would differentiate from generic AI assistants
- **Training programming** is genuinely good — specific, progressive, and personalized
- **Recovery/injury handling** is responsible and appropriate
- **Multi-turn coaching** shows real coaching instinct (asks before prescribing)
- **Response quality** is consistently high (avg 652 tokens, rich detail)

### Weaknesses to Address
- Equipment knowledge is dangerously wrong
- Doubles format understanding is fundamentally broken
- Station sequencing has gaps in the back half
- Some factual details are hallucinated (venues, world records)

---

## V2 Training Data Recommendations

### PRIORITY 1: Critical Fixes (Must Add Before v2 Training)

| Category | Examples Needed | What to Cover |
|----------|----------------|---------------|
| **Equipment/Shoes** | 30+ | Correct shoe recommendations (cross-trainers, not racing flats), why Vaporfly is wrong for Hyrox, grip requirements for sled work, specific shoe models with pros/cons |
| **Equipment/Gear** | 20+ | No weightlifting belt needed, chalk usage, correct race gear, what Hyrox rules allow and prohibit |
| **Doubles Format** | 25+ | BOTH partners run ALL runs, station splitting strategies, mixed/same-sex differences, transition protocols, practice together |
| **Sled Weights** | 15+ | Explicitly state push ≠ pull (152 vs 103 men, 102 vs 78 women, Pro weights), weight tables by division |
| **Station-Run Mapping** | 15+ | Correct station-to-run sequence for ALL 8 runs, how each station affects the subsequent run |

**Total Priority 1: ~105 examples**

### PRIORITY 2: Factual Polish (Should Add)

| Category | Examples Needed | What to Cover |
|----------|----------------|---------------|
| **Indoor venues** | 10+ | All races are indoor, flat, convention center surfaces, no hills |
| **Sled push arms** | 10+ | Extended/locked arms for force transfer, body angle specifics |
| **Wall ball heights** | 10+ | Men: 3m target, Women: 2.7m target, ball weights by division |
| **Realistic benchmarks** | 15+ | World records with names/dates, realistic station times by level, BBJ times |
| **Diplomatic coaching** | 10+ | Respectfully disagreeing with other coaches/advice without dismissing |

**Total Priority 2: ~55 examples**

### PRIORITY 3: Polish (Nice to Have)

| Category | Examples Needed | What to Cover |
|----------|----------------|---------------|
| **Quick answers** | 10+ | Brief yes/no responses when requested, then offer to elaborate |
| **"I don't know"** | 10+ | Admitting uncertainty on medical, supplement, or niche topics |
| **SkiErg stroke rate** | 5+ | Correct range (28-35 SPM, not 35-40) |
| **Breathing patterns** | 10+ | Station-specific breathing cues |

**Total Priority 3: ~35 examples**

### Combined v2 Dataset Estimate
- Current: 729 examples
- Priority 1: ~105 new examples
- Priority 2: ~55 new examples
- Priority 3: ~35 new examples
- **v2 total: ~924 examples** (within 700-1,000 target range)

---

## Conclusion

Coach K v1 demonstrates that the fine-tuning approach works. The coaching persona, training programming, and recovery advice are genuinely excellent — better than most generic AI responses and approaching the quality of a knowledgeable human coach.

The critical failures are concentrated in just two areas (equipment and Doubles format), which means they're fixable with targeted training data. The RAG layer will provide an additional safety net for factual grounding.

**Recommended next steps:**
1. Generate v2 training data focusing on Priority 1 (equipment, Doubles, weights, station mapping)
2. Deploy RAG layer to ground responses with verified facts
3. Re-evaluate after v2 training to confirm fixes and check for regressions
4. Consider adding a safety guardrail that flags equipment/medical recommendations for review
