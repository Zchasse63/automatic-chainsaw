#!/usr/bin/env python3
"""
Comprehensive evaluation suite for Coach K v1 (fine-tuned Llama 3.3 70B LoRA on Nebius).

Runs 43 test prompts across 10 categories, plus 3 base-model comparisons.
Logs all results to JSON and generates a markdown report.
"""

import json
import os
import time
import datetime
import requests

# ─── Config ──────────────────────────────────────────────────────────────────
NEBIUS_API_KEY = os.environ.get("NEBIUS_API_KEY", "")
FINETUNED_MODEL = "meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v1-drry"
BASE_MODEL = "meta-llama/Llama-3.3-70B-Instruct"
INFERENCE_URL = "https://api.tokenfactory.nebius.com/v1/chat/completions"

SYSTEM_PROMPT = (
    'You are Coach K, an elite Hyrox training coach powered by deep sports science knowledge. '
    'You combine the periodization expertise of Chris Hinshaw and Andy Galpin with the competitive '
    'intensity of Hunter McIntyre and Jake Dearden. You\'re direct, specific, and data-driven. '
    'You always explain the "why" behind your programming. When prescribing workouts, you specify '
    'exact sets, reps, rest periods, and RPE targets. You reference the athlete\'s training history '
    'and current fitness level. You think in terms of energy systems, movement patterns, and '
    'progressive overload.'
)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs', 'evaluation')

# ─── Test Suite ──────────────────────────────────────────────────────────────

TESTS = [
    # Category 1: Persona & Voice (5)
    {"id": "P1", "category": "Persona & Voice", "prompt": "Who are you and what's your coaching philosophy?",
     "eval_criteria": ["Self-identifies as Coach K", "Mentions being direct/data-driven", "References energy systems or periodization"]},
    {"id": "P2", "category": "Persona & Voice", "prompt": "Give me a quick pep talk before my race tomorrow.",
     "eval_criteria": ["Motivational but grounded", "Includes specific tactical reminders", "Coach K personality shines through"]},
    {"id": "P3", "category": "Persona & Voice", "prompt": "I'm thinking about quitting Hyrox training. It's too hard and I'm not seeing results.",
     "eval_criteria": ["Empathetic but firm", "Redirects to data/progress", "Doesn't coddle — pushes back with evidence"]},
    {"id": "P4", "category": "Persona & Voice", "prompt": "What makes you different from a generic fitness app or ChatGPT?",
     "eval_criteria": ["Explains coaching persona", "Mentions specificity and data-driven approach", "References Hyrox specialization"]},
    {"id": "P5", "category": "Persona & Voice", "prompt": "I read online that I should just run more miles to prepare for Hyrox. What do you think?",
     "eval_criteria": ["Disagrees with nuance", "Explains concurrent training needs", "Cites specific station demands"]},

    # Category 2: Factual Hyrox Knowledge (5)
    {"id": "F1", "category": "Factual Knowledge", "prompt": "What are the 8 stations in a Hyrox race, in order?",
     "eval_criteria": ["Lists all 8 correctly", "Correct order", "Mentions 1km runs between"]},
    {"id": "F2", "category": "Factual Knowledge", "prompt": "What are the official weights for the men's open division across all stations?",
     "eval_criteria": ["Sled push 152kg", "Sled pull 103kg", "Farmers carry 2x24kg", "Wall ball 6kg", "Sandbag lunges 20kg"]},
    {"id": "F3", "category": "Factual Knowledge", "prompt": "What's a competitive finish time for a first-time Hyrox racer who's reasonably fit?",
     "eval_criteria": ["Gives realistic range (70-90 min)", "Differentiates by fitness level", "Mentions elite benchmarks for context"]},
    {"id": "F4", "category": "Factual Knowledge", "prompt": "How long are the runs between stations and what's the total running distance?",
     "eval_criteria": ["1km runs", "8 runs total", "8km total running distance"]},
    {"id": "F5", "category": "Factual Knowledge", "prompt": "What is the Roxzone and how should I strategically use the transition area?",
     "eval_criteria": ["Describes transition area", "Mentions breathing recovery", "Tactical advice on pacing through it"]},

    # Category 3: Workout Programming (5)
    {"id": "W1", "category": "Workout Programming", "prompt": "Design me an EMOM workout targeting the ski erg and wall ball stations.",
     "eval_criteria": ["Specifies duration", "Exact reps/calories per minute", "RPE targets", "Rest structure"]},
    {"id": "W2", "category": "Workout Programming", "prompt": "I need a 4-week sled push progression. I'm currently at 4:30 for 50m at race weight.",
     "eval_criteria": ["Progressive overload structure", "Specific weights/distances/rest", "Weekly progression", "Target improvement"]},
    {"id": "W3", "category": "Workout Programming", "prompt": "Build me a Saturday double session: long run in the AM, Hyrox HIIT in the PM.",
     "eval_criteria": ["AM run with distance/pace/zones", "PM HIIT with full prescription", "Recovery between sessions", "Nutrition guidance"]},
    {"id": "W4", "category": "Workout Programming", "prompt": "I'm traveling and only have a hotel gym with a treadmill and dumbbells. Give me a 30-minute Hyrox-relevant workout.",
     "eval_criteria": ["Fits 30 min constraint", "Uses available equipment", "Still Hyrox-relevant movements", "Specific sets/reps"]},
    {"id": "W5", "category": "Workout Programming", "prompt": "Program my strength day. I have a full gym. I'm in Week 6, Specific Prep phase.",
     "eval_criteria": ["Phase-appropriate exercises", "Sets/reps/load percentages", "Rest periods", "RPE targets", "Explains rationale"]},

    # Category 4: Coaching Judgment (5)
    {"id": "J1", "category": "Coaching Judgment", "prompt": "My RPE has been 8+ on all sessions this week and I feel constantly tired. What should I do?",
     "eval_criteria": ["Assesses overtraining risk", "Recommends specific action (deload/reduce)", "Asks about sleep/nutrition", "Doesn't just say 'rest'"]},
    {"id": "J2", "category": "Coaching Judgment", "prompt": "I missed 3 training days this week due to work travel. How do I get back on track without overloading?",
     "eval_criteria": ["Doesn't try to make up all sessions", "Prioritizes key sessions", "Adjusts week structure", "Forward-looking plan"]},
    {"id": "J3", "category": "Coaching Judgment", "prompt": "My knee hurts after sled pushes but feels fine during running and everything else. Should I push through?",
     "eval_criteria": ["Doesn't say 'just push through'", "Asks diagnostic questions", "Suggests modifications", "Recommends professional eval if persistent"]},
    {"id": "J4", "category": "Coaching Judgment", "prompt": "I have a wedding Friday night where I'll probably drink. My long run and HIIT are scheduled for Saturday. What do I do?",
     "eval_criteria": ["Pragmatic advice", "Suggests schedule adjustment", "Addresses alcohol's impact on recovery", "Doesn't moralize"]},
    {"id": "J5", "category": "Coaching Judgment", "prompt": "My training partner wants me to drop my Hyrox plan and do CrossFit Open workouts instead for 3 weeks. What should I do?",
     "eval_criteria": ["Recommends staying on plan", "Explains specificity principle", "Offers compromise if any", "Not dismissive of CrossFit"]},

    # Category 5: Race Strategy (4)
    {"id": "R1", "category": "Race Strategy", "prompt": "Walk me through my race-day pacing strategy. I'm targeting 75 minutes total.",
     "eval_criteria": ["Per-km run targets", "Station time budgets", "Pacing rules (negative split)", "Transition strategy"]},
    {"id": "R2", "category": "Race Strategy", "prompt": "How should I break up my 100 wall balls during the race? I can do 25 unbroken fresh.",
     "eval_criteria": ["Specific break strategy", "Accounts for fatigue (it's station 8)", "Rest durations between sets", "References race context"]},
    {"id": "R3", "category": "Race Strategy", "prompt": "What should I eat and drink during the actual race? When exactly should I fuel?",
     "eval_criteria": ["Specific timing (which runs/stations)", "Carb amounts per gel", "Hydration strategy", "Pre-race nutrition too"]},
    {"id": "R4", "category": "Race Strategy", "prompt": "It's race week — 5 days out. What should my training, nutrition, and sleep look like each day?",
     "eval_criteria": ["Day-by-day plan", "Taper training (reduced volume)", "Carb loading strategy", "Sleep targets"]},

    # Category 6: Science Explanation (4)
    {"id": "S1", "category": "Science", "prompt": "Why does the sled push gas you out so much more than other stations?",
     "eval_criteria": ["Explains glycolytic demand", "Mentions large muscle group recruitment", "References metabolic pathways", "Connects to training implications"]},
    {"id": "S2", "category": "Science", "prompt": "Explain why I can't just do strength training and running separately and expect Hyrox success.",
     "eval_criteria": ["Concurrent training interference", "AMPK vs mTOR pathway", "Compromised running concept", "Practical implications"]},
    {"id": "S3", "category": "Science", "prompt": "What's the difference between Zone 2 and Zone 4 training for Hyrox preparation?",
     "eval_criteria": ["Energy system differences", "Adaptation targets", "How each maps to race demands", "Recommended distribution"]},
    {"id": "S4", "category": "Science", "prompt": "Why do you program deload weeks every 3-4 weeks? I feel like I'm wasting time.",
     "eval_criteria": ["Supercompensation concept", "Fatigue accumulation", "Hormonal recovery", "Performance data supporting deloads"]},

    # Category 7: Nutrition & Recovery (4)
    {"id": "N1", "category": "Nutrition & Recovery", "prompt": "What supplements should I take during my 16-week Hyrox prep?",
     "eval_criteria": ["Evidence-based recommendations", "Specific dosages", "Timing advice", "Distinguishes essential vs optional"]},
    {"id": "N2", "category": "Nutrition & Recovery", "prompt": "How many calories and macros should I eat on a double session day vs a rest day?",
     "eval_criteria": ["Specific calorie ranges", "Macro breakdowns (g/kg)", "Differences between training/rest", "Timing guidance"]},
    {"id": "N3", "category": "Nutrition & Recovery", "prompt": "I only sleep 6 hours most nights because of work. How much is this hurting my training?",
     "eval_criteria": ["Quantifies performance impact", "Specific sleep recommendations", "Practical tips for improvement", "Cites recovery mechanisms"]},
    {"id": "N4", "category": "Nutrition & Recovery", "prompt": "Should I use ice baths after my HIIT sessions? I've heard conflicting info.",
     "eval_criteria": ["Nuanced answer (depends on context)", "Differentiates adaptation vs recovery", "When to use vs avoid", "Practical recommendation"]},

    # Category 8: Cross-Domain Integration (4)
    {"id": "X1", "category": "Cross-Domain", "prompt": "I have 12 weeks until Hyrox and I run 35 miles per week. How should I structure my entire training approach?",
     "eval_criteria": ["Periodization phases", "Weekly structure", "How to convert strength to HIIT", "Maintains run volume", "Mentions nutrition"]},
    {"id": "X2", "category": "Cross-Domain", "prompt": "My sled push time is 4:30 and my 1km runs average 5:45. What's my biggest weakness and how do I fix it?",
     "eval_criteria": ["Identifies sled push as priority", "Specific training prescription", "Addresses running too", "Sets improvement targets"]},
    {"id": "X3", "category": "Cross-Domain", "prompt": "Design a complete training week for Week 10 of my plan — Competition Prep phase. Include training, nutrition, and recovery for every day.",
     "eval_criteria": ["7-day plan", "Session details per day", "Nutrition per day", "Recovery protocols", "Phase-appropriate intensity"]},
    {"id": "X4", "category": "Cross-Domain", "prompt": "My 5K time is 22 minutes and I can deadlift 1.5x bodyweight. What Hyrox finish time should I target and what are my priorities?",
     "eval_criteria": ["Realistic time prediction", "Identifies strengths/weaknesses from data", "Priority stack", "Specific targets"]},

    # Category 9: Edge Cases (4)
    {"id": "E1", "category": "Edge Cases", "prompt": "What's the best diet for losing 20 pounds? I don't care about Hyrox right now.",
     "eval_criteria": ["Stays in lane or redirects to Hyrox context", "Doesn't give generic diet advice", "Professional boundary"]},
    {"id": "E2", "category": "Edge Cases", "prompt": "I think I tore my ACL during training yesterday. My knee is swollen and unstable. What should I do?",
     "eval_criteria": ["Immediately refers to medical professional", "Does NOT prescribe treatment", "Empathetic but clear"]},
    {"id": "E3", "category": "Edge Cases", "prompt": "I've never exercised before in my life. Can I complete a Hyrox race in 8 weeks?",
     "eval_criteria": ["Honest about timeline", "Doesn't overpromise", "Offers realistic alternative", "Still encouraging"]},
    {"id": "E4", "category": "Edge Cases", "prompt": "My partner and I want to do Hyrox Doubles. How should our training differ from singles prep?",
     "eval_criteria": ["Understands doubles format", "Station splitting strategy", "Partner synchronization", "Training adjustments"]},
]

# Comparison tests (run on BOTH fine-tuned and base model)
COMPARISON_TESTS = [
    {"id": "C1", "category": "Comparison", "prompt": "I only have 30 minutes today instead of 60. What should I do with my HIIT session?"},
    {"id": "C2", "category": "Comparison", "prompt": "How should I structure my training week with 16 weeks until Hyrox?"},
    {"id": "C3", "category": "Comparison", "prompt": "Explain the physiological demands of a Hyrox race and how they should inform training."},
]


def call_model(model, system_prompt, user_prompt, temperature=0.7, max_tokens=1024):
    """Call Nebius inference API and return response + metadata."""
    headers = {
        "Authorization": f"Bearer {NEBIUS_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    start = time.time()
    try:
        resp = requests.post(INFERENCE_URL, headers=headers, json=payload, timeout=120)
        elapsed = time.time() - start
        resp.raise_for_status()
        data = resp.json()

        content = data["choices"][0]["message"]["content"]
        usage = data.get("usage", {})

        return {
            "success": True,
            "content": content,
            "input_tokens": usage.get("prompt_tokens", 0),
            "output_tokens": usage.get("completion_tokens", 0),
            "total_tokens": usage.get("total_tokens", 0),
            "latency_seconds": round(elapsed, 2),
            "tokens_per_second": round(usage.get("completion_tokens", 0) / elapsed, 1) if elapsed > 0 else 0,
        }
    except Exception as e:
        elapsed = time.time() - start
        return {
            "success": False,
            "content": f"ERROR: {str(e)}",
            "input_tokens": 0,
            "output_tokens": 0,
            "total_tokens": 0,
            "latency_seconds": round(elapsed, 2),
            "tokens_per_second": 0,
        }


def run_tests():
    """Run the full test suite."""
    results = {
        "metadata": {
            "model": FINETUNED_MODEL,
            "base_model": BASE_MODEL,
            "system_prompt": SYSTEM_PROMPT,
            "timestamp": datetime.datetime.now().isoformat(),
            "total_tests": len(TESTS) + len(COMPARISON_TESTS) * 2,
        },
        "finetuned_results": [],
        "comparison_results": [],
        "summary": {},
    }

    total_tests = len(TESTS) + len(COMPARISON_TESTS)
    current = 0

    # ─── Run main test suite against fine-tuned model ────────────────────
    print(f"\n{'='*70}")
    print(f"COACH K v1 — COMPREHENSIVE EVALUATION SUITE")
    print(f"{'='*70}")
    print(f"Model: {FINETUNED_MODEL}")
    print(f"Tests: {len(TESTS)} main + {len(COMPARISON_TESTS)} comparison = {total_tests} total prompts")
    print(f"Started: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*70}\n")

    for test in TESTS:
        current += 1
        print(f"[{current}/{total_tests}] {test['category']} — {test['id']}: {test['prompt'][:60]}...")

        result = call_model(FINETUNED_MODEL, SYSTEM_PROMPT, test["prompt"])

        entry = {
            "test_id": test["id"],
            "category": test["category"],
            "prompt": test["prompt"],
            "eval_criteria": test.get("eval_criteria", []),
            "model": FINETUNED_MODEL,
            **result,
        }
        results["finetuned_results"].append(entry)

        status = "OK" if result["success"] else "FAIL"
        print(f"  {status} | {result['output_tokens']} tokens | {result['latency_seconds']}s | {result['tokens_per_second']} t/s")

        # Brief pause to avoid rate limits
        time.sleep(1)

    # ─── Run comparison tests against BOTH models ────────────────────────
    print(f"\n{'='*70}")
    print(f"COMPARISON TESTS: Fine-tuned vs Base Model")
    print(f"{'='*70}\n")

    for test in COMPARISON_TESTS:
        current += 1
        print(f"[{current}/{total_tests}] Comparison — {test['id']}: {test['prompt'][:60]}...")

        # Fine-tuned
        ft_result = call_model(FINETUNED_MODEL, SYSTEM_PROMPT, test["prompt"])
        print(f"  Fine-tuned: {ft_result['output_tokens']} tokens | {ft_result['latency_seconds']}s")
        time.sleep(1)

        # Base model
        base_result = call_model(BASE_MODEL, SYSTEM_PROMPT, test["prompt"])
        print(f"  Base model: {base_result['output_tokens']} tokens | {base_result['latency_seconds']}s")
        time.sleep(1)

        results["comparison_results"].append({
            "test_id": test["id"],
            "prompt": test["prompt"],
            "finetuned": {"model": FINETUNED_MODEL, **ft_result},
            "base": {"model": BASE_MODEL, **base_result},
        })

    # ─── Compute summary stats ───────────────────────────────────────────
    ft_results = results["finetuned_results"]
    successful = [r for r in ft_results if r["success"]]
    failed = [r for r in ft_results if not r["success"]]

    category_stats = {}
    for r in ft_results:
        cat = r["category"]
        if cat not in category_stats:
            category_stats[cat] = {"count": 0, "success": 0, "total_tokens": 0, "total_latency": 0}
        category_stats[cat]["count"] += 1
        if r["success"]:
            category_stats[cat]["success"] += 1
            category_stats[cat]["total_tokens"] += r["output_tokens"]
            category_stats[cat]["total_latency"] += r["latency_seconds"]

    total_output_tokens = sum(r["output_tokens"] for r in successful)
    total_input_tokens = sum(r["input_tokens"] for r in successful)
    total_latency = sum(r["latency_seconds"] for r in successful)

    results["summary"] = {
        "total_tests": len(ft_results),
        "successful": len(successful),
        "failed": len(failed),
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "avg_output_tokens": total_output_tokens // len(successful) if successful else 0,
        "avg_latency_seconds": round(total_latency / len(successful), 2) if successful else 0,
        "avg_tokens_per_second": round(total_output_tokens / total_latency, 1) if total_latency > 0 else 0,
        "estimated_cost": round(
            (total_input_tokens / 1_000_000) * 0.13 + (total_output_tokens / 1_000_000) * 0.40, 4
        ),
        "category_stats": category_stats,
    }

    # ─── Print summary ───────────────────────────────────────────────────
    print(f"\n{'='*70}")
    print(f"SUMMARY")
    print(f"{'='*70}")
    print(f"Tests: {len(successful)}/{len(ft_results)} successful")
    print(f"Total output tokens: {total_output_tokens:,}")
    print(f"Avg tokens/response: {results['summary']['avg_output_tokens']}")
    print(f"Avg latency: {results['summary']['avg_latency_seconds']}s")
    print(f"Avg speed: {results['summary']['avg_tokens_per_second']} t/s")
    print(f"Estimated cost: ${results['summary']['estimated_cost']}")
    print(f"Finished: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    return results


def save_results(results):
    """Save raw JSON and generate markdown report."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Save raw JSON
    json_path = os.path.join(OUTPUT_DIR, "v1_test_results.json")
    with open(json_path, "w") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"\nRaw results: {json_path}")

    # Generate markdown report
    md_lines = []
    md_lines.append("# Coach K v1 — Evaluation Report\n")
    md_lines.append(f"**Date**: {results['metadata']['timestamp'][:10]}")
    md_lines.append(f"**Model**: `{results['metadata']['model']}`")
    md_lines.append(f"**Base**: `{results['metadata']['base_model']}`\n")

    s = results["summary"]
    md_lines.append("## Summary\n")
    md_lines.append(f"| Metric | Value |")
    md_lines.append(f"|--------|-------|")
    md_lines.append(f"| Tests passed | {s['successful']}/{s['total_tests']} |")
    md_lines.append(f"| Total output tokens | {s['total_output_tokens']:,} |")
    md_lines.append(f"| Avg tokens/response | {s['avg_output_tokens']} |")
    md_lines.append(f"| Avg latency | {s['avg_latency_seconds']}s |")
    md_lines.append(f"| Avg speed | {s['avg_tokens_per_second']} t/s |")
    md_lines.append(f"| Est. cost | ${s['estimated_cost']} |")
    md_lines.append("")

    # Per-category results
    md_lines.append("## Results by Category\n")
    current_category = None
    for r in results["finetuned_results"]:
        if r["category"] != current_category:
            current_category = r["category"]
            md_lines.append(f"\n### {current_category}\n")

        status = "PASS" if r["success"] else "FAIL"
        md_lines.append(f"#### [{status}] {r['test_id']}: {r['prompt']}\n")
        md_lines.append(f"*Tokens: {r['output_tokens']} | Latency: {r['latency_seconds']}s | Speed: {r['tokens_per_second']} t/s*\n")

        if r.get("eval_criteria"):
            md_lines.append("**Eval criteria:**")
            for c in r["eval_criteria"]:
                md_lines.append(f"- [ ] {c}")
            md_lines.append("")

        md_lines.append("**Response:**\n")
        md_lines.append(f"```\n{r['content'][:3000]}\n```\n")

    # Comparison section
    md_lines.append("\n## Base Model Comparison\n")
    for comp in results["comparison_results"]:
        md_lines.append(f"### {comp['test_id']}: {comp['prompt']}\n")

        md_lines.append(f"**Fine-tuned** ({comp['finetuned']['output_tokens']} tokens, {comp['finetuned']['latency_seconds']}s):\n")
        md_lines.append(f"```\n{comp['finetuned']['content'][:2000]}\n```\n")

        md_lines.append(f"**Base Llama 3.3 70B** ({comp['base']['output_tokens']} tokens, {comp['base']['latency_seconds']}s):\n")
        md_lines.append(f"```\n{comp['base']['content'][:2000]}\n```\n")

    md_path = os.path.join(OUTPUT_DIR, "v1_test_report.md")
    with open(md_path, "w") as f:
        f.write("\n".join(md_lines))
    print(f"Report: {md_path}")


if __name__ == "__main__":
    results = run_tests()
    save_results(results)
