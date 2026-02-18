# Coach K v1 — Evaluation Report (Fireworks — FAILED, see v1_eval.json for Nebius results)

**Date**: 2026-02-13
**Model**: `accounts/voicefit69/models/hyrox-coach-v1` (Fireworks — no serverless LoRA, all 404s)
**Note**: This report is from the failed Fireworks attempt. The actual v1 evaluation was run on Nebius — see `coach_k_v1_eval.json`.

## Summary

| Metric | Value |
|--------|-------|
| Tests passed | 0/40 |
| Total output tokens | 0 |
| Avg tokens/response | 0 |
| Avg latency | 0s |
| Avg speed | 0 t/s |
| Est. cost | $0.0 |

## Results by Category


### Persona & Voice

#### [FAIL] P1: Who are you and what's your coaching philosophy?

*Tokens: 0 | Latency: 0.56s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Self-identifies as Coach K
- [ ] Mentions being direct/data-driven
- [ ] References energy systems or periodization

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] P2: Give me a quick pep talk before my race tomorrow.

*Tokens: 0 | Latency: 0.47s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Motivational but grounded
- [ ] Includes specific tactical reminders
- [ ] Coach K personality shines through

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] P3: I'm thinking about quitting Hyrox training. It's too hard and I'm not seeing results.

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Empathetic but firm
- [ ] Redirects to data/progress
- [ ] Doesn't coddle — pushes back with evidence

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] P4: What makes you different from a generic fitness app or ChatGPT?

*Tokens: 0 | Latency: 0.46s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Explains coaching persona
- [ ] Mentions specificity and data-driven approach
- [ ] References Hyrox specialization

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] P5: I read online that I should just run more miles to prepare for Hyrox. What do you think?

*Tokens: 0 | Latency: 0.46s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Disagrees with nuance
- [ ] Explains concurrent training needs
- [ ] Cites specific station demands

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Factual Knowledge

#### [FAIL] F1: What are the 8 stations in a Hyrox race, in order?

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Lists all 8 correctly
- [ ] Correct order
- [ ] Mentions 1km runs between

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] F2: What are the official weights for the men's open division across all stations?

*Tokens: 0 | Latency: 0.47s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Sled push 152kg
- [ ] Sled pull 103kg
- [ ] Farmers carry 2x24kg
- [ ] Wall ball 6kg
- [ ] Sandbag lunges 20kg

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] F3: What's a competitive finish time for a first-time Hyrox racer who's reasonably fit?

*Tokens: 0 | Latency: 0.53s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Gives realistic range (70-90 min)
- [ ] Differentiates by fitness level
- [ ] Mentions elite benchmarks for context

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] F4: How long are the runs between stations and what's the total running distance?

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] 1km runs
- [ ] 8 runs total
- [ ] 8km total running distance

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] F5: What is the Roxzone and how should I strategically use the transition area?

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Describes transition area
- [ ] Mentions breathing recovery
- [ ] Tactical advice on pacing through it

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Workout Programming

#### [FAIL] W1: Design me an EMOM workout targeting the ski erg and wall ball stations.

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Specifies duration
- [ ] Exact reps/calories per minute
- [ ] RPE targets
- [ ] Rest structure

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] W2: I need a 4-week sled push progression. I'm currently at 4:30 for 50m at race weight.

*Tokens: 0 | Latency: 0.49s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Progressive overload structure
- [ ] Specific weights/distances/rest
- [ ] Weekly progression
- [ ] Target improvement

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] W3: Build me a Saturday double session: long run in the AM, Hyrox HIIT in the PM.

*Tokens: 0 | Latency: 0.46s | Speed: 0 t/s*

**Eval criteria:**
- [ ] AM run with distance/pace/zones
- [ ] PM HIIT with full prescription
- [ ] Recovery between sessions
- [ ] Nutrition guidance

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] W4: I'm traveling and only have a hotel gym with a treadmill and dumbbells. Give me a 30-minute Hyrox-relevant workout.

*Tokens: 0 | Latency: 0.44s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Fits 30 min constraint
- [ ] Uses available equipment
- [ ] Still Hyrox-relevant movements
- [ ] Specific sets/reps

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] W5: Program my strength day. I have a full gym. I'm in Week 6, Specific Prep phase.

*Tokens: 0 | Latency: 0.46s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Phase-appropriate exercises
- [ ] Sets/reps/load percentages
- [ ] Rest periods
- [ ] RPE targets
- [ ] Explains rationale

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Coaching Judgment

#### [FAIL] J1: My RPE has been 8+ on all sessions this week and I feel constantly tired. What should I do?

*Tokens: 0 | Latency: 0.53s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Assesses overtraining risk
- [ ] Recommends specific action (deload/reduce)
- [ ] Asks about sleep/nutrition
- [ ] Doesn't just say 'rest'

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] J2: I missed 3 training days this week due to work travel. How do I get back on track without overloading?

*Tokens: 0 | Latency: 0.25s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Doesn't try to make up all sessions
- [ ] Prioritizes key sessions
- [ ] Adjusts week structure
- [ ] Forward-looking plan

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] J3: My knee hurts after sled pushes but feels fine during running and everything else. Should I push through?

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Doesn't say 'just push through'
- [ ] Asks diagnostic questions
- [ ] Suggests modifications
- [ ] Recommends professional eval if persistent

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] J4: I have a wedding Friday night where I'll probably drink. My long run and HIIT are scheduled for Saturday. What do I do?

*Tokens: 0 | Latency: 0.46s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Pragmatic advice
- [ ] Suggests schedule adjustment
- [ ] Addresses alcohol's impact on recovery
- [ ] Doesn't moralize

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] J5: My training partner wants me to drop my Hyrox plan and do CrossFit Open workouts instead for 3 weeks. What should I do?

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Recommends staying on plan
- [ ] Explains specificity principle
- [ ] Offers compromise if any
- [ ] Not dismissive of CrossFit

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Race Strategy

#### [FAIL] R1: Walk me through my race-day pacing strategy. I'm targeting 75 minutes total.

*Tokens: 0 | Latency: 0.48s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Per-km run targets
- [ ] Station time budgets
- [ ] Pacing rules (negative split)
- [ ] Transition strategy

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] R2: How should I break up my 100 wall balls during the race? I can do 25 unbroken fresh.

*Tokens: 0 | Latency: 1.37s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Specific break strategy
- [ ] Accounts for fatigue (it's station 8)
- [ ] Rest durations between sets
- [ ] References race context

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] R3: What should I eat and drink during the actual race? When exactly should I fuel?

*Tokens: 0 | Latency: 1.09s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Specific timing (which runs/stations)
- [ ] Carb amounts per gel
- [ ] Hydration strategy
- [ ] Pre-race nutrition too

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] R4: It's race week — 5 days out. What should my training, nutrition, and sleep look like each day?

*Tokens: 0 | Latency: 0.52s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Day-by-day plan
- [ ] Taper training (reduced volume)
- [ ] Carb loading strategy
- [ ] Sleep targets

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Science

#### [FAIL] S1: Why does the sled push gas you out so much more than other stations?

*Tokens: 0 | Latency: 0.61s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Explains glycolytic demand
- [ ] Mentions large muscle group recruitment
- [ ] References metabolic pathways
- [ ] Connects to training implications

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] S2: Explain why I can't just do strength training and running separately and expect Hyrox success.

*Tokens: 0 | Latency: 0.47s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Concurrent training interference
- [ ] AMPK vs mTOR pathway
- [ ] Compromised running concept
- [ ] Practical implications

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] S3: What's the difference between Zone 2 and Zone 4 training for Hyrox preparation?

*Tokens: 0 | Latency: 0.25s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Energy system differences
- [ ] Adaptation targets
- [ ] How each maps to race demands
- [ ] Recommended distribution

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] S4: Why do you program deload weeks every 3-4 weeks? I feel like I'm wasting time.

*Tokens: 0 | Latency: 0.32s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Supercompensation concept
- [ ] Fatigue accumulation
- [ ] Hormonal recovery
- [ ] Performance data supporting deloads

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Nutrition & Recovery

#### [FAIL] N1: What supplements should I take during my 16-week Hyrox prep?

*Tokens: 0 | Latency: 0.25s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Evidence-based recommendations
- [ ] Specific dosages
- [ ] Timing advice
- [ ] Distinguishes essential vs optional

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] N2: How many calories and macros should I eat on a double session day vs a rest day?

*Tokens: 0 | Latency: 0.29s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Specific calorie ranges
- [ ] Macro breakdowns (g/kg)
- [ ] Differences between training/rest
- [ ] Timing guidance

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] N3: I only sleep 6 hours most nights because of work. How much is this hurting my training?

*Tokens: 0 | Latency: 0.27s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Quantifies performance impact
- [ ] Specific sleep recommendations
- [ ] Practical tips for improvement
- [ ] Cites recovery mechanisms

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] N4: Should I use ice baths after my HIIT sessions? I've heard conflicting info.

*Tokens: 0 | Latency: 0.45s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Nuanced answer (depends on context)
- [ ] Differentiates adaptation vs recovery
- [ ] When to use vs avoid
- [ ] Practical recommendation

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Cross-Domain

#### [FAIL] X1: I have 12 weeks until Hyrox and I run 35 miles per week. How should I structure my entire training approach?

*Tokens: 0 | Latency: 0.46s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Periodization phases
- [ ] Weekly structure
- [ ] How to convert strength to HIIT
- [ ] Maintains run volume
- [ ] Mentions nutrition

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] X2: My sled push time is 4:30 and my 1km runs average 5:45. What's my biggest weakness and how do I fix it?

*Tokens: 0 | Latency: 0.29s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Identifies sled push as priority
- [ ] Specific training prescription
- [ ] Addresses running too
- [ ] Sets improvement targets

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] X3: Design a complete training week for Week 10 of my plan — Competition Prep phase. Include training, nutrition, and recovery for every day.

*Tokens: 0 | Latency: 0.47s | Speed: 0 t/s*

**Eval criteria:**
- [ ] 7-day plan
- [ ] Session details per day
- [ ] Nutrition per day
- [ ] Recovery protocols
- [ ] Phase-appropriate intensity

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] X4: My 5K time is 22 minutes and I can deadlift 1.5x bodyweight. What Hyrox finish time should I target and what are my priorities?

*Tokens: 0 | Latency: 0.54s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Realistic time prediction
- [ ] Identifies strengths/weaknesses from data
- [ ] Priority stack
- [ ] Specific targets

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


### Edge Cases

#### [FAIL] E1: What's the best diet for losing 20 pounds? I don't care about Hyrox right now.

*Tokens: 0 | Latency: 0.24s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Stays in lane or redirects to Hyrox context
- [ ] Doesn't give generic diet advice
- [ ] Professional boundary

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] E2: I think I tore my ACL during training yesterday. My knee is swollen and unstable. What should I do?

*Tokens: 0 | Latency: 0.51s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Immediately refers to medical professional
- [ ] Does NOT prescribe treatment
- [ ] Empathetic but clear

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] E3: I've never exercised before in my life. Can I complete a Hyrox race in 8 weeks?

*Tokens: 0 | Latency: 0.3s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Honest about timeline
- [ ] Doesn't overpromise
- [ ] Offers realistic alternative
- [ ] Still encouraging

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

#### [FAIL] E4: My partner and I want to do Hyrox Doubles. How should our training differ from singles prep?

*Tokens: 0 | Latency: 0.56s | Speed: 0 t/s*

**Eval criteria:**
- [ ] Understands doubles format
- [ ] Station splitting strategy
- [ ] Partner synchronization
- [ ] Training adjustments

**Response:**

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```


## Base Model Comparison

### C1: I only have 30 minutes today instead of 60. What should I do with my HIIT session?

**Fine-tuned** (0 tokens, 0.57s):

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

**Base K2 Thinking** (1024 tokens, 11.58s):

```
**30-Minute HIIT Protocol: The Density Blitz**


```

### C2: How should I structure my training week with 16 weeks until Hyrox?

**Fine-tuned** (0 tokens, 0.27s):

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

**Base K2 Thinking** (1024 tokens, 10.83s):

```

```

### C3: Explain the physiological demands of a Hyrox race and how they should inform training.

**Fine-tuned** (0 tokens, 0.59s):

```
ERROR: 404 Client Error: Not Found for url: https://api.fireworks.ai/inference/v1/chat/completions
```

**Base K2 Thinking** (1024 tokens, 10.74s):

```

```
