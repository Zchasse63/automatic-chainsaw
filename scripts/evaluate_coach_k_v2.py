#!/usr/bin/env python3
"""
Comprehensive Evaluation Suite for Coach K v2
Model: Llama 3.3 70B LoRA on Nebius Token Factory

Includes all 47 original v1 scenarios PLUS 13 new targeted scenarios
for equipment, doubles, weights, and technique — the v1 failure areas.

Usage:
    python3 scripts/evaluate_coach_k_v2.py
    python3 scripts/evaluate_coach_k_v2.py --model "meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-XXXX"
"""

import argparse
import os
import json
import time
from datetime import datetime
from openai import OpenAI

# ── Config ──────────────────────────────────────────────
V1_MODEL = "meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v1-drry"
V2_MODEL = None  # Set after training completes or via --model flag
SYSTEM_PROMPT = "You are Coach K, an elite Hyrox performance coach. You provide direct, science-backed coaching with a motivating but no-nonsense style. You are specific with numbers, sets, reps, and pacing targets. You never give generic advice."

client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ.get("NEBIUS_API_KEY", ""),
)

# ── Original V1 Scenarios (47) ──────────────────────────

ORIGINAL_SCENARIOS = [
    # CATEGORY 1: RACE FORMAT & FACTUAL ACCURACY
    {
        "id": "fact_01", "category": "Race Format & Facts",
        "prompt": "I'm brand new to Hyrox. Can you walk me through exactly what happens during a race — every station, distances, weights, and the order?",
        "checks": [
            "8 stations with 1km run before each",
            "Correct station order: SkiErg, Sled Push, Sled Pull, Burpee Broad Jump, Rowing, Farmer Carry, Sandbag Lunges, Wall Balls",
            "SkiErg 1000m, Sled Push 50m, Sled Pull 50m, Burpee Broad Jump 80m, Rowing 1000m, Farmer Carry 200m, Sandbag Lunges 100m",
            "Wall Balls: 100 reps men / 75 reps women",
            "Men's sled push weight: 152kg/335lbs",
            "Men's sled pull weight: 103kg/227lbs",
            "Farmer carry weight: 2x24kg men / 2x16kg women",
            "Sandbag: 20kg men / 10kg women",
            "Wall ball: 6kg men / 4kg women, 9ft/11ft target",
            "Total distance: 8km running + stations",
        ],
    },
    {
        "id": "fact_02", "category": "Race Format & Facts",
        "prompt": "What are the differences between Hyrox Open, Pro, and Doubles divisions? Which should I sign up for?",
        "checks": [
            "Open: standard weights, recreational athletes",
            "Pro: heavier weights on some stations",
            "Doubles: two athletes split stations, each runs every 1km",
            "Pro sled weights are heavier",
            "Recommendation based on experience level",
        ],
    },
    {
        "id": "fact_03", "category": "Race Format & Facts",
        "prompt": "What are realistic time benchmarks for Hyrox? What's a good time for a first-timer versus an elite?",
        "checks": [
            "First-timer: 80-100+ minutes",
            "Competitive: 65-75 minutes",
            "Elite/Pro: sub-60 minutes",
            "World record references",
            "Men vs women time differences",
        ],
    },
    # CATEGORY 2: STATION-SPECIFIC TECHNIQUE
    {
        "id": "station_01", "category": "Station Technique",
        "prompt": "How do I pace the SkiErg 1000m in Hyrox? I always go out too fast and die at 600m.",
        "checks": ["Pacing strategy (negative or even split)", "Specific pace targets (e.g., 1:5x-2:0x/500m)", "Arm drive technique", "Core engagement", "Breathing pattern"],
    },
    {
        "id": "station_02", "category": "Station Technique",
        "prompt": "Break down the optimal sled push technique for me. Body position, hand placement, stride pattern — everything.",
        "checks": ["Low body angle (45 degrees)", "Short choppy steps", "Arms locked out", "Drive from legs not arms", "Hip position below shoulders", "Constant forward pressure"],
    },
    {
        "id": "station_03", "category": "Station Technique",
        "prompt": "I can't figure out the sled pull. Should I be hand-over-hand or pulling in big arm sweeps? How do I anchor my feet?",
        "checks": ["Hand-over-hand technique", "Sitting back / low center of gravity", "Foot bracing technique", "Rope management", "Grip preservation"],
    },
    {
        "id": "station_04", "category": "Station Technique",
        "prompt": "Burpee broad jumps absolutely wreck me. Is there a more efficient technique? How far should each jump be?",
        "checks": ["Efficient burpee technique (chest to ground)", "Jump distance targets", "Pacing (don't sprint the first 20m)", "Hip hinge for landing", "Energy conservation tips", "80m total distance"],
    },
    {
        "id": "station_05", "category": "Station Technique",
        "prompt": "What damper setting and pacing should I use on the rower during Hyrox? I'm a 6'1 185lb male.",
        "checks": ["Damper setting recommendation (5-7 typical)", "Pacing strategy for 1000m", "Split time targets", "Drive sequence (legs-back-arms)", "Recovery and breathing"],
    },
    {
        "id": "station_06", "category": "Station Technique",
        "prompt": "Farmer carry tips? My grip always fails around 150m and I have to put the weights down.",
        "checks": ["Grip technique (crush grip)", "Shoulder position (packed down)", "Walking stride (short quick steps)", "Breathing pattern", "Grip training recommendations", "200m distance acknowledgment"],
    },
    {
        "id": "station_07", "category": "Station Technique",
        "prompt": "My quads completely blow up during sandbag lunges. I can barely run the final 1km after. How do I train for this?",
        "checks": ["Lunge technique (sandbag position)", "Glute engagement to offload quads", "Pacing strategy for 100m", "Training recommendations", "Step length", "Relationship to final wall balls and 1km"],
    },
    {
        "id": "station_08", "category": "Station Technique",
        "prompt": "100 wall balls is brutal. What's the best break strategy — should I go unbroken or plan sets? I usually start failing around rep 60.",
        "checks": ["Break strategy (sets of 20-25 or unbroken for fit athletes)", "Squat depth", "Hip drive", "Ball catch and redirect", "Breathing pattern (exhale on throw)", "Target height (men 11ft / women 9ft)", "Mental strategy for last station"],
    },
    # CATEGORY 3: TRAINING PROGRAMMING
    {
        "id": "train_01", "category": "Training Programming",
        "prompt": "Write me a sample training week for Hyrox. I can train 5 days per week and my race is in 10 weeks.",
        "checks": ["5-day structure with specific sessions", "Mix of running, station work, and hybrid sessions", "At least 1 long run or race simulation", "Rest/recovery days", "Progressive overload mention", "Specific exercises with sets/reps"],
    },
    {
        "id": "train_02", "category": "Training Programming",
        "prompt": "I only have 3 days per week to train. Can I still be competitive in Hyrox?",
        "checks": ["Yes, with strategic programming", "Hybrid sessions (combine running + stations)", "Priority-based training allocation", "Specific 3-day structure", "What to sacrifice and what's non-negotiable"],
    },
    {
        "id": "train_03", "category": "Training Programming",
        "prompt": "How should I taper for Hyrox? My race is in 10 days.",
        "checks": ["Reduce volume 40-60%", "Maintain intensity", "Specific day-by-day guidance", "Last hard session timing", "Light touch-point sessions", "Sleep and recovery emphasis"],
    },
    {
        "id": "train_04", "category": "Training Programming",
        "prompt": "I'm training for my second Hyrox. My first time was 82 minutes and I want to go sub-70. What needs to change in my training?",
        "checks": ["Identify likely time sinks", "Transition time optimization", "Station-specific speed work", "Running pace targets", "Specific weekly structure changes", "Race simulation frequency"],
    },
    {
        "id": "train_05", "category": "Training Programming",
        "prompt": "I come from a marathon running background (3:15 PR). My running is solid but I'm weak on every station. How do I fix this without losing my running fitness?",
        "checks": ["Reduce running volume strategically", "Station-specific strength work", "Compromised running training", "Maintain 1-2 quality run sessions", "Specific strength targets", "Timeline for adaptation"],
    },
    {
        "id": "train_06", "category": "Training Programming",
        "prompt": "I'm a CrossFitter transitioning to Hyrox. I can do wall balls and burpees all day but my running is terrible — I can barely run a 5K under 25 minutes.",
        "checks": ["Build aerobic base (Zone 2 running)", "Running volume recommendations", "Reduce MetCon intensity", "Leverage existing station strength", "Running-specific training plan", "Timeline for running improvement"],
    },
    # CATEGORY 4: RUNNING SPECIFIC
    {
        "id": "run_01", "category": "Running",
        "prompt": "How do I pace my 1km runs between stations? Should I run them all the same speed or adjust based on which station I just finished?",
        "checks": ["Station-dependent pacing strategy", "Harder to run after leg-heavy stations (lunges, sled)", "Easier to recover pace after upper body stations", "Target pace ranges", "Heart rate recovery guidance", "First 200m of each run matters"],
    },
    {
        "id": "run_02", "category": "Running",
        "prompt": "What is 'compromised running' and how do I train it? Everyone talks about it but I'm not sure I'm doing it right.",
        "checks": ["Definition: running immediately after station work", "Why it matters for Hyrox specifically", "Training methods (run after strength sets)", "Specific workout examples", "Progressive overload approach", "Race-day relevance"],
    },
    # CATEGORY 5: NUTRITION & FUELING
    {
        "id": "nutr_01", "category": "Nutrition",
        "prompt": "What should I eat and drink on race day? Before, during, and after the race.",
        "checks": ["Pre-race meal timing (2-3 hours before)", "Carb-focused pre-race meal", "During race: gels, electrolytes", "Hydration strategy", "Post-race recovery nutrition", "Specific food examples"],
    },
    {
        "id": "nutr_02", "category": "Nutrition",
        "prompt": "I'm trying to lose 15 lbs while training for Hyrox. Is this realistic? How should I approach it?",
        "checks": ["Caution about caloric deficit during training", "Moderate deficit (300-500 cal)", "Protein priority (1.6-2.2 g/kg)", "Timing nutrition around workouts", "Realistic timeline", "Performance trade-offs"],
    },
    # CATEGORY 6: RECOVERY & INJURY
    {
        "id": "recov_01", "category": "Recovery & Injury",
        "prompt": "I have knee pain on the inside of my left knee after lunges and running. It's been 2 weeks. Should I push through or rest?",
        "checks": ["Do NOT push through 2-week persistent pain", "Possible MCL or meniscus issue", "Recommend professional assessment", "Modified training alternatives", "What to avoid", "When to resume"],
    },
    {
        "id": "recov_02", "category": "Recovery & Injury",
        "prompt": "I feel overtrained — my resting heart rate is up 8 beats, I'm sleeping poorly, and my motivation is gone. I have a race in 4 weeks.",
        "checks": ["Recognize overtraining symptoms", "Immediate volume reduction (deload)", "Sleep optimization", "Stress management", "Return-to-training plan", "4-week race timeline considerations"],
    },
    {
        "id": "recov_03", "category": "Recovery & Injury",
        "prompt": "My lower back is sore after every sled session. Is this normal?",
        "checks": ["Not normal — technique issue likely", "Common cause: too upright on sled push", "Core bracing recommendations", "Form corrections", "Prehab exercises", "When to see a professional"],
    },
    # CATEGORY 7: RACE DAY STRATEGY
    {
        "id": "race_01", "category": "Race Strategy",
        "prompt": "Walk me through the ideal race day from waking up to crossing the finish line. My start time is 11:00 AM and I'm targeting 75 minutes.",
        "checks": ["Wake time and breakfast timing", "Warm-up protocol", "Arrival time", "Pre-race activation", "Pacing plan station by station", "Hydration/fueling during race", "Mental cues", "Transition strategy"],
    },
    {
        "id": "race_02", "category": "Race Strategy",
        "prompt": "What mistakes do first-timers make on race day? I want to avoid all of them.",
        "checks": ["Going out too fast on first run/SkiErg", "Not practicing transitions", "Wrong shoes", "Ignoring hydration", "Not knowing the course/station layout", "Ego lifting (sprinting sled push)", "Not training wall balls specifically"],
    },
    {
        "id": "race_03", "category": "Race Strategy",
        "prompt": "I always hit a wall after station 5 (rowing). The last 3 stations and runs feel impossible. How do I fix this?",
        "checks": ["Pacing problem in first half", "Energy system depletion", "Fueling during race", "Training the back half specifically", "Race simulation importance", "Mental strategies for suffering"],
    },
    # CATEGORY 8: SPECIAL POPULATIONS
    {
        "id": "pop_01", "category": "Special Populations",
        "prompt": "I'm 52 years old and want to do my first Hyrox. Am I too old? What should I worry about?",
        "checks": ["Not too old — Hyrox has age group divisions", "Recovery takes longer — plan accordingly", "Injury prevention priority", "Joint-friendly training modifications", "Realistic expectations", "Warm-up importance"],
    },
    {
        "id": "pop_02", "category": "Special Populations",
        "prompt": "I'm a 28-year-old female, 5'5 140lbs. The women's weights seem light on paper but I struggle with farmer carry and sled push. Is this normal?",
        "checks": ["Acknowledges the weights are challenging", "Women's specific weight references (correct)", "Grip and upper body often undertrained in women", "Specific training recommendations", "Strength benchmarks to target", "Encouraging but honest"],
    },
    # CATEGORY 9: EQUIPMENT & LOGISTICS
    {
        "id": "equip_01", "category": "Equipment",
        "prompt": "What shoes should I wear for Hyrox? I've heard conflicting advice about running shoes vs cross-trainers.",
        "checks": [
            "Hybrid recommendation (cross-trainer with some cushion)",
            "Specific shoe suggestions or characteristics",
            "Why pure running shoes are problematic (sled push)",
            "Why pure lifting shoes are problematic (8km of running)",
            "Grip considerations for sled work",
        ],
    },
    {
        "id": "equip_02", "category": "Equipment",
        "prompt": "What gear do I need for race day? Gloves? Belt? Anything else?",
        "checks": ["Gloves: pros and cons (grip vs feel)", "No belt needed", "Clothing recommendations", "Hydration vest or belt", "What NOT to bring"],
    },
    # CATEGORY 10: MENTAL GAME
    {
        "id": "mental_01", "category": "Mental Game",
        "prompt": "I'm terrified of the wall balls. I've never done 100 in a row and I panic just thinking about it. How do I mentally prepare?",
        "checks": ["Break it into manageable sets (mental chunking)", "Practice 100 reps in training", "Visualization techniques", "Self-talk strategies", "Process focus (next 10 reps, not remaining 80)", "It's the last station — dig deep"],
    },
    {
        "id": "mental_02", "category": "Mental Game",
        "prompt": "How do I stay motivated during the middle of the race when everything hurts? Stations 4-6 are where I mentally check out.",
        "checks": ["Recognize the low point is normal", "Mental cues/mantras", "Focus on process not outcome", "Break race into thirds", "Use other athletes for motivation", "Remind yourself of training"],
    },
    # CATEGORY 11: DOUBLES & TEAM
    {
        "id": "team_01", "category": "Doubles/Team",
        "prompt": "My partner and I are doing Hyrox Doubles. How should we split the stations? I'm stronger, she's a better runner.",
        "checks": ["Both run every 1km", "Split stations based on strengths", "Stronger athlete: sled push/pull, farmer carry", "Better runner: could take SkiErg, rowing", "Wall balls and burpees: discuss endurance", "Practice transitions together"],
    },
    # CATEGORY 12: ADVANCED / TIME BARRIERS
    {
        "id": "adv_01", "category": "Advanced",
        "prompt": "I'm an experienced Hyrox athlete with a PR of 63 minutes. I want to break 60 minutes. What does sub-60 training look like?",
        "checks": ["Specific time targets per station", "Transition time optimization (under 15s)", "Running pace targets (sub 4:00-4:15/km)", "Station speed work", "Specificity over volume", "Race simulation at target pace", "Identifies which 3 minutes to shave"],
    },
    {
        "id": "adv_02", "category": "Advanced",
        "prompt": "Should I be doing heart rate zone training for Hyrox? If so, how should my training be distributed across zones?",
        "checks": ["Zone 2 base building importance", "80/20 or polarized distribution", "Zone-specific session types", "How zones apply to station work", "Heart rate during actual race", "Monitoring tools"],
    },
    {
        "id": "adv_03", "category": "Advanced",
        "prompt": "I'm racing 3 Hyrox events this season — one in 6 weeks, one in 14 weeks, and one in 22 weeks. How do I periodize across all three?",
        "checks": ["Macro periodization across 22 weeks", "Peak/taper for each race", "Recovery between races", "Base building vs race-specific phases", "Volume management", "Realistic expectations (can't peak for all three)"],
    },
    # CATEGORY 13: EDGE CASES & TRICKY QUESTIONS
    {
        "id": "edge_01", "category": "Edge Cases",
        "prompt": "Is Hyrox harder than a marathon? My friend says it's easy compared to running 26.2 miles.",
        "checks": ["Different type of hard (hybrid vs endurance)", "Hyrox is shorter duration but higher intensity", "Muscular demands vs pure aerobic", "Nuanced answer — not dismissive of either", "Depends on individual strengths"],
    },
    {
        "id": "edge_02", "category": "Edge Cases",
        "prompt": "Can I just train running and CrossFit and be fine for Hyrox? Or do I need Hyrox-specific training?",
        "checks": ["CrossFit + running gives a good base BUT...", "Hyrox specificity matters (compromised running, race weights, pacing)", "CrossFit metabolic conditioning is different from Hyrox pacing", "Need to practice actual stations at race weights", "Race simulation is essential"],
    },
    {
        "id": "edge_03", "category": "Edge Cases",
        "prompt": "I just signed up for Hyrox and the race is in 3 weeks. I've never done any of the stations before. What do I do?",
        "checks": ["Honest about limited improvement in 3 weeks", "Priority: learn each station's technique", "Do at least 1-2 race simulations", "Focus on pacing strategy", "Don't try to get fit — just get familiar", "Lower expectations but still enjoy it"],
    },
    {
        "id": "edge_04", "category": "Edge Cases",
        "prompt": "What supplements should I take for Hyrox training and race day?",
        "checks": ["Evidence-based only (caffeine, creatine, beta-alanine)", "Doesn't oversell supplements", "Food-first approach", "Race day: caffeine timing, electrolytes", "No bro-science"],
    },
    {
        "id": "edge_05", "category": "Edge Cases",
        "prompt": "My gym doesn't have a ski erg, sleds, or a wall ball wall. How do I train for Hyrox with basic equipment?",
        "checks": ["Substitute exercises for each station", "SkiErg alternatives (battle ropes, band pulldowns)", "Sled push alternatives (heavy prowler, weighted push)", "Wall ball alternatives (thrusters, med ball throws)", "Farmer carry: heavy dumbbells/kettlebells", "Creative solutions"],
    },
    # CATEGORY 14: PERSONA & COACHING STYLE
    {
        "id": "persona_01", "category": "Persona",
        "prompt": "I just finished my first Hyrox in 94 minutes. I feel like I did terrible.",
        "checks": ["Encouragement — first race is about finishing", "Contextualizes the time (not bad for first race)", "Identifies areas for improvement", "Motivating tone", "Asks about experience or offers next steps", "Not dismissive of feelings"],
    },
    {
        "id": "persona_02", "category": "Persona",
        "prompt": "Can you just give me a quick yes or no — is running 5 days a week too much for Hyrox training?",
        "checks": ["Gives a direct answer (probably yes, too much)", "Brief explanation of why", "Suggests better allocation", "Respects the 'quick answer' request", "Coaching tone, not lecturing"],
    },
    {
        "id": "persona_03", "category": "Persona",
        "prompt": "My coach at my CrossFit gym says I should just do more MetCons to prepare for Hyrox. Is he right?",
        "checks": ["Respectfully disagrees or qualifies", "Explains why MetCons alone aren't sufficient", "Running volume is the gap for most CrossFitters", "Doesn't trash the other coach", "Offers specific alternatives"],
    },
    # CATEGORY 15: MULTI-TURN CONVERSATION STARTERS
    {
        "id": "multi_01", "category": "Multi-Turn",
        "prompt": "I want to get better at Hyrox but I don't know where to start. Can you help?",
        "checks": ["Asks clarifying questions (current fitness, race date, experience)", "Doesn't give generic advice without info", "Shows coaching instinct to assess before prescribing", "Welcoming and organized"],
    },
    {
        "id": "multi_02", "category": "Multi-Turn",
        "prompt": "What's more important for Hyrox — strength or cardio?",
        "checks": ["Neither — it's the hybrid that matters", "Depends on current weakness", "Specific examples of why both matter", "Nuanced answer", "May ask about current profile"],
    },
]

# ── NEW V2 Scenarios (13) — Targeting V1 Failures ───────

V2_NEW_SCENARIOS = [
    # EQUIPMENT (v1 had 0 training examples — critical failure)
    {
        "id": "v2_equip_01", "category": "Equipment (V2 NEW)",
        "prompt": "Should I wear Nike Vaporfly or Alphafly for Hyrox? They're my fastest running shoes.",
        "checks": [
            "Says NO — carbon plate racing flats are wrong for Hyrox",
            "Explains lateral stability issues on sleds",
            "Explains lack of grip on turf/sled surfaces",
            "Risk of injury during lateral movements",
            "Recommends cross-trainers instead (e.g., Nike Metcon, TYR CXT-1, Reebok Nano)",
        ],
    },
    {
        "id": "v2_equip_02", "category": "Equipment (V2 NEW)",
        "prompt": "Should I wear a weightlifting belt for the sled push and farmer carry stations?",
        "checks": [
            "No belt needed for Hyrox",
            "Explains it restricts breathing under sustained effort",
            "Hyrox is endurance-strength, not max effort lifting",
            "Core should be trained to brace without belt",
            "Not practical for transitions",
        ],
    },
    {
        "id": "v2_equip_03", "category": "Equipment (V2 NEW)",
        "prompt": "What specific shoe models do top Hyrox athletes actually wear?",
        "checks": [
            "Mentions 2+ real shoe models (e.g., TYR CXT-1, Nike Metcon, Reebok Nano, NOBULL, Puma Fuse)",
            "Explains cross-trainer category",
            "Grip for sled work",
            "Enough cushion for 8km running",
            "Does NOT recommend Vaporfly, Alphafly, or pure racing flats",
        ],
    },
    # DOUBLES FORMAT (v1 said you can split runs — WRONG)
    {
        "id": "v2_doubles_01", "category": "Doubles (V2 NEW)",
        "prompt": "In Hyrox Doubles, can my partner and I alternate the 1km runs — I run odds, she runs evens?",
        "checks": [
            "BOTH partners MUST run ALL 8 runs together",
            "You cannot split or alternate runs",
            "Only stations are split (4 each)",
            "Running together is a key rule",
            "Pacing to the slower partner's speed",
        ],
    },
    {
        "id": "v2_doubles_02", "category": "Doubles (V2 NEW)",
        "prompt": "How does the Relay format work compared to Doubles? We have 4 friends interested.",
        "checks": [
            "Relay is 4 athletes, not 2",
            "Each athlete does 2 runs and 2 stations",
            "Handoff/transition protocol",
            "Differs from Doubles (which is 2 athletes, all runs together)",
        ],
    },
    # WEIGHTS & FACTUAL ACCURACY (v1 had wrong sled weights)
    {
        "id": "v2_weights_01", "category": "Weights (V2 NEW)",
        "prompt": "What's the sled push weight versus the sled pull weight for men's open? Are they the same?",
        "checks": [
            "Sled push: 152kg / 335lbs",
            "Sled pull: 103kg / 227lbs",
            "They are NOT the same — push is heavier",
            "Correct distinction between push and pull",
        ],
    },
    {
        "id": "v2_weights_02", "category": "Weights (V2 NEW)",
        "prompt": "Give me the complete weight chart for Hyrox women's open division — every station.",
        "checks": [
            "Sled push weight for women",
            "Sled pull weight for women",
            "Farmer carry: 2x16kg",
            "Sandbag: 10kg",
            "Wall ball: 4kg at 9ft/2.7m target",
            "Wall ball reps: 75 (not 100)",
        ],
    },
    # VENUE & LOGISTICS (v1 hallucinated outdoor/hill courses)
    {
        "id": "v2_venue_01", "category": "Venue (V2 NEW)",
        "prompt": "Is Hyrox always indoors? What's the running surface like? Are there hills?",
        "checks": [
            "Always indoors (convention centers, exhibition halls)",
            "Flat — no hills",
            "Running surface is typically artificial turf or similar",
            "Does NOT claim outdoor courses or hills",
            "Does NOT hallucinate specific venue names",
        ],
    },
    # TECHNIQUE CONSENSUS (v1 had some questionable technique advice)
    {
        "id": "v2_technique_01", "category": "Technique (V2 NEW)",
        "prompt": "Should I lock my arms out or bend them during the sled push? I've seen coaches disagree on this.",
        "checks": [
            "Arms extended/locked for better force transfer",
            "Acknowledges the debate exists",
            "Explains biomechanical reasoning",
            "Not dismissive of other approaches",
        ],
    },
    {
        "id": "v2_technique_02", "category": "Technique (V2 NEW)",
        "prompt": "What's a realistic burpee broad jump time for an intermediate athlete? Someone told me 2:45 is normal.",
        "checks": [
            "2:45 is NOT realistic for intermediate — that's elite/sub-60 pace",
            "Intermediate is more like 4:00-5:30",
            "Provides realistic range by level",
            "Doesn't agree with unrealistic benchmarks",
        ],
    },
    # BOUNDARIES (v1 didn't have 'I don't know' responses)
    {
        "id": "v2_boundary_01", "category": "Boundaries (V2 NEW)",
        "prompt": "What's the best testosterone booster for Hyrox performance? My buddy takes turkesterone and says it works.",
        "checks": [
            "Does not recommend testosterone boosters",
            "Stays evidence-based",
            "May redirect to proven strategies (sleep, nutrition, training)",
            "Professional boundary on supplement claims",
        ],
    },
    {
        "id": "v2_boundary_02", "category": "Boundaries (V2 NEW)",
        "prompt": "I have a herniated disc at L4-L5. Can you design a training program around it?",
        "checks": [
            "Does NOT design a full program around a herniated disc",
            "Recommends seeing a physical therapist or sports medicine doctor",
            "May offer general guidance but defers to medical professional",
            "Acknowledges the limitation of coaching vs medical advice",
        ],
    },
]

ALL_SCENARIOS = ORIGINAL_SCENARIOS + V2_NEW_SCENARIOS


def run_evaluation(model, label="v2"):
    """Run all scenarios and collect responses."""
    results = []
    total = len(ALL_SCENARIOS)

    print(f"Running {total} evaluation scenarios against Coach K {label}...")
    print(f"Model: {model}")
    print(f"  Original scenarios: {len(ORIGINAL_SCENARIOS)}")
    print(f"  New V2 scenarios:   {len(V2_NEW_SCENARIOS)}")
    print(f"Started: {datetime.now().isoformat()}")
    print("=" * 60)

    for i, scenario in enumerate(ALL_SCENARIOS):
        print(f"\n[{i+1}/{total}] {scenario['category']}: {scenario['id']}")
        print(f"  Prompt: {scenario['prompt'][:80]}...")

        start_time = time.time()
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": scenario["prompt"]},
                ],
                temperature=0.7,
                max_tokens=1200,
            )
            elapsed = time.time() - start_time
            content = response.choices[0].message.content or ""
            usage = response.usage

            result = {
                "id": scenario["id"],
                "category": scenario["category"],
                "prompt": scenario["prompt"],
                "checks": scenario.get("checks", []),
                "response": content,
                "tokens_in": usage.prompt_tokens,
                "tokens_out": usage.completion_tokens,
                "latency_seconds": round(elapsed, 2),
                "error": None,
                "is_v2_new": scenario["id"].startswith("v2_"),
            }
            print(f"  Response: {len(content)} chars, {usage.completion_tokens} tokens, {elapsed:.1f}s")

        except Exception as e:
            elapsed = time.time() - start_time
            result = {
                "id": scenario["id"],
                "category": scenario["category"],
                "prompt": scenario["prompt"],
                "checks": scenario.get("checks", []),
                "response": "",
                "tokens_in": 0,
                "tokens_out": 0,
                "latency_seconds": round(elapsed, 2),
                "error": str(e),
                "is_v2_new": scenario["id"].startswith("v2_"),
            }
            print(f"  ERROR: {e}")

        results.append(result)
        time.sleep(0.5)

    # Save results
    output_path = f"docs/evaluation/coach_k_{label}_eval.json"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump({
            "model": model,
            "system_prompt": SYSTEM_PROMPT,
            "timestamp": datetime.now().isoformat(),
            "total_scenarios": total,
            "original_scenarios": len(ORIGINAL_SCENARIOS),
            "new_v2_scenarios": len(V2_NEW_SCENARIOS),
            "results": results,
        }, f, indent=2)

    # Summary stats
    successful = [r for r in results if not r["error"]]
    errors = [r for r in results if r["error"]]
    total_tokens_in = sum(r["tokens_in"] for r in successful)
    total_tokens_out = sum(r["tokens_out"] for r in successful)
    avg_latency = sum(r["latency_seconds"] for r in successful) / len(successful) if successful else 0

    print(f"\n{'=' * 60}")
    print(f"EVALUATION COMPLETE — Coach K {label}")
    print(f"{'=' * 60}")
    print(f"Scenarios: {len(successful)}/{total} successful ({len(errors)} errors)")
    print(f"Total input tokens: {total_tokens_in:,}")
    print(f"Total output tokens: {total_tokens_out:,}")
    print(f"Average latency: {avg_latency:.1f}s")
    print(f"Estimated cost: ${(total_tokens_in * 0.13 + total_tokens_out * 0.40) / 1_000_000:.4f}")
    print(f"Results saved to: {output_path}")

    # Per-category breakdown
    categories = {}
    for r in results:
        cat = r["category"]
        if cat not in categories:
            categories[cat] = {"total": 0, "success": 0}
        categories[cat]["total"] += 1
        if not r["error"]:
            categories[cat]["success"] += 1

    print(f"\nPer-category results:")
    for cat, stats in sorted(categories.items()):
        print(f"  {cat}: {stats['success']}/{stats['total']}")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Coach K v2")
    parser.add_argument("--model", type=str, help="Model ID (e.g., meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-XXXX)")
    parser.add_argument("--label", type=str, default="v2", help="Label for output files (default: v2)")
    args = parser.parse_args()

    if not args.model:
        print("ERROR: --model is required. The v2 model ID will be available after training completes.")
        print("Example: python3 scripts/evaluate_coach_k_v2.py --model 'meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-XXXX'")
        exit(1)

    run_evaluation(args.model, args.label)
