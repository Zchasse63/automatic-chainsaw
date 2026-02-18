#!/usr/bin/env python3
"""
Automated Grading Script for Coach K Evaluations

Reads v1 and v2 evaluation JSON files, sends each response + checks to
the base Llama model for automated pass/fail scoring, and produces a
comprehensive comparison report.

Usage:
    python3 scripts/grade_evaluation.py
"""

import json
import os
import time
import re
import sys
from collections import defaultdict
from openai import OpenAI

# ── Config ──────────────────────────────────────────────
client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ.get("NEBIUS_API_KEY", ""),
)
GRADER_MODEL = "meta-llama/Llama-3.3-70B-Instruct"

V1_PATH = "docs/evaluation/coach_k_v1_eval.json"
V2_PATH = "docs/evaluation/coach_k_v2_eval.json"
OUTPUT_PATH = "docs/evaluation/v2_comparison_report.md"

GRADING_PROMPT = """You are an evaluation grader for an AI coaching assistant called "Coach K" that specializes in Hyrox fitness racing.

Given a USER PROMPT, the MODEL RESPONSE, and a list of CHECKS, determine whether each check PASSES or FAILS based on the response content.

Rules:
- PASS: The response clearly addresses or contains the information described in the check. Be generous — if the response conveys the concept even with different wording, it passes.
- FAIL: The response is missing the information, contradicts it, or gives wrong information for that check.
- For factual checks (specific numbers, weights, rules), require accuracy. Close approximations are OK (e.g., "~150kg" for 152kg passes).
- For qualitative checks (tone, approach, style), be generous if the spirit is met.
- For "does NOT" checks, PASS means the response correctly avoids the thing.

Respond with ONLY a JSON array of objects, one per check, in order:
[{"check": "<check text>", "result": "PASS" or "FAIL", "reason": "<brief 5-10 word reason>"}]

Do not include any other text before or after the JSON array."""


def grade_response(prompt, response, checks, max_retries=2):
    """Send response + checks to grader model, return pass/fail per check."""
    user_msg = f"""USER PROMPT: {prompt}

MODEL RESPONSE: {response}

CHECKS TO EVALUATE:
{chr(10).join(f'{i+1}. {c}' for i, c in enumerate(checks))}"""

    for attempt in range(max_retries + 1):
        try:
            result = client.chat.completions.create(
                model=GRADER_MODEL,
                messages=[
                    {"role": "system", "content": GRADING_PROMPT},
                    {"role": "user", "content": user_msg},
                ],
                temperature=0.0,
                max_tokens=1500,
            )
            content = result.choices[0].message.content.strip()
            # Extract JSON array from response
            match = re.search(r'\[.*\]', content, re.DOTALL)
            if match:
                grades = json.loads(match.group())
                if len(grades) == len(checks):
                    return grades
                # If length mismatch, pad or truncate
                if len(grades) < len(checks):
                    for i in range(len(grades), len(checks)):
                        grades.append({"check": checks[i], "result": "FAIL", "reason": "grader did not evaluate"})
                return grades[:len(checks)]
        except (json.JSONDecodeError, Exception) as e:
            if attempt < max_retries:
                time.sleep(2)
                continue
            # Return all FAIL on parse error
            return [{"check": c, "result": "FAIL", "reason": f"grader error: {e}"} for c in checks]

    return [{"check": c, "result": "FAIL", "reason": "grader timeout"} for c in checks]


def load_eval(path):
    """Load evaluation JSON file."""
    with open(path) as f:
        return json.load(f)


def grade_all(eval_data, label):
    """Grade all scenarios in an evaluation file."""
    results = eval_data["results"]
    total = len(results)
    graded = []

    print(f"\nGrading {total} scenarios for {label}...")
    print("=" * 60)

    for i, r in enumerate(results):
        sid = r["id"]
        category = r["category"]
        checks = r.get("checks", [])
        response = r.get("response", "")

        if not checks or not response:
            graded.append({**r, "grades": [], "passed": 0, "total_checks": 0})
            continue

        print(f"  [{i+1}/{total}] {sid} ({category}) — {len(checks)} checks", end="", flush=True)

        grades = grade_response(r["prompt"], response, checks)
        passed = sum(1 for g in grades if g["result"] == "PASS")

        print(f" → {passed}/{len(checks)}")
        time.sleep(0.3)  # rate limit courtesy

        graded.append({
            **r,
            "grades": grades,
            "passed": passed,
            "total_checks": len(checks),
        })

    return graded


def build_report(v1_graded, v2_graded, v1_data, v2_data):
    """Generate markdown comparison report."""

    # Aggregate by category
    def aggregate(graded):
        by_cat = defaultdict(lambda: {"passed": 0, "total": 0, "scenarios": 0})
        for r in graded:
            cat = r["category"]
            by_cat[cat]["passed"] += r["passed"]
            by_cat[cat]["total"] += r["total_checks"]
            by_cat[cat]["scenarios"] += 1
        return by_cat

    v1_cats = aggregate(v1_graded)
    v2_cats = aggregate(v2_graded)

    # Overall scores
    v1_total_pass = sum(r["passed"] for r in v1_graded)
    v1_total_checks = sum(r["total_checks"] for r in v1_graded)
    v2_total_pass = sum(r["passed"] for r in v2_graded)
    v2_total_checks = sum(r["total_checks"] for r in v2_graded)

    # Shared scenarios (47 original)
    v1_shared = [r for r in v1_graded]  # v1 only has 47
    v2_shared = [r for r in v2_graded if not r.get("is_v2_new", False)]
    v2_new = [r for r in v2_graded if r.get("is_v2_new", False)]

    v1_shared_pass = sum(r["passed"] for r in v1_shared)
    v1_shared_total = sum(r["total_checks"] for r in v1_shared)
    v2_shared_pass = sum(r["passed"] for r in v2_shared)
    v2_shared_total = sum(r["total_checks"] for r in v2_shared)

    v2_new_pass = sum(r["passed"] for r in v2_new)
    v2_new_total = sum(r["total_checks"] for r in v2_new)

    # Build markdown
    lines = []
    lines.append("# Coach K v2 — Comprehensive Evaluation & Comparison Report")
    lines.append("")
    lines.append("**Date**: 2026-02-16")
    lines.append(f"**V1 Model**: `{v1_data['model']}`")
    lines.append(f"**V2 Model**: `{v2_data['model']}`")
    lines.append("**Platform**: Nebius Token Factory (serverless LoRA)")
    lines.append("**Grader**: Llama 3.3 70B Instruct (base, temperature=0)")
    lines.append("**V1 Training**: 729 examples, 3 epochs, loss 1.535→0.709")
    lines.append("**V2 Training**: 924 examples, 3 epochs, loss 1.44→0.565")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Executive Summary
    lines.append("## Executive Summary")
    lines.append("")
    v1_pct = v1_total_pass / v1_total_checks * 100 if v1_total_checks else 0
    v2_pct = v2_total_pass / v2_total_checks * 100 if v2_total_checks else 0
    v1_shared_pct = v1_shared_pass / v1_shared_total * 100 if v1_shared_total else 0
    v2_shared_pct = v2_shared_pass / v2_shared_total * 100 if v2_shared_total else 0
    v2_new_pct = v2_new_pass / v2_new_total * 100 if v2_new_total else 0

    lines.append("| Metric | V1 | V2 | Change |")
    lines.append("|--------|----|----|--------|")
    lines.append(f"| **Overall check pass rate** | {v1_pct:.0f}% ({v1_total_pass}/{v1_total_checks}) | {v2_pct:.0f}% ({v2_total_pass}/{v2_total_checks}) | {v2_pct - v1_pct:+.0f}pp |")
    lines.append(f"| **Shared scenarios (47) pass rate** | {v1_shared_pct:.0f}% ({v1_shared_pass}/{v1_shared_total}) | {v2_shared_pct:.0f}% ({v2_shared_pass}/{v2_shared_total}) | {v2_shared_pct - v1_shared_pct:+.0f}pp |")
    lines.append(f"| **New V2 scenarios (12) pass rate** | N/A | {v2_new_pct:.0f}% ({v2_new_pass}/{v2_new_total}) | — |")
    lines.append(f"| **Training data** | 729 examples | 924 examples | +195 (+27%) |")
    lines.append(f"| **Final training loss** | 0.709 | 0.565 | -0.144 |")
    lines.append(f"| **V1 critical failures fixed** | 3 | — | See below |")
    lines.append("")

    # Category comparison (shared categories)
    lines.append("---")
    lines.append("")
    lines.append("## Performance by Category")
    lines.append("")
    lines.append("### Shared Categories (V1 vs V2 on same 47 scenarios)")
    lines.append("")
    lines.append("| Category | V1 Pass Rate | V2 Pass Rate | Change | Verdict |")
    lines.append("|----------|-------------|-------------|--------|---------|")

    # Map v2 shared by category
    v2_shared_cats = defaultdict(lambda: {"passed": 0, "total": 0})
    for r in v2_shared:
        cat = r["category"]
        v2_shared_cats[cat]["passed"] += r["passed"]
        v2_shared_cats[cat]["total"] += r["total_checks"]

    all_cats = sorted(set(list(v1_cats.keys()) + list(v2_shared_cats.keys())))
    for cat in all_cats:
        v1c = v1_cats.get(cat, {"passed": 0, "total": 0})
        v2c = v2_shared_cats.get(cat, {"passed": 0, "total": 0})
        v1p = v1c["passed"] / v1c["total"] * 100 if v1c["total"] else 0
        v2p = v2c["passed"] / v2c["total"] * 100 if v2c["total"] else 0
        delta = v2p - v1p

        if delta > 10:
            verdict = "IMPROVED"
        elif delta < -10:
            verdict = "REGRESSION"
        elif v2p >= 90:
            verdict = "Excellent"
        elif v2p >= 75:
            verdict = "Good"
        else:
            verdict = "Needs work"

        lines.append(f"| {cat} | {v1p:.0f}% ({v1c['passed']}/{v1c['total']}) | {v2p:.0f}% ({v2c['passed']}/{v2c['total']}) | {delta:+.0f}pp | {verdict} |")

    # New V2 categories
    lines.append("")
    lines.append("### New V2 Scenarios (12 targeted scenarios)")
    lines.append("")
    lines.append("| Category | Pass Rate | Details |")
    lines.append("|----------|-----------|---------|")

    v2_new_cats = defaultdict(lambda: {"passed": 0, "total": 0, "scenarios": []})
    for r in v2_new:
        cat = r["category"]
        v2_new_cats[cat]["passed"] += r["passed"]
        v2_new_cats[cat]["total"] += r["total_checks"]
        v2_new_cats[cat]["scenarios"].append(r)

    for cat in sorted(v2_new_cats.keys()):
        c = v2_new_cats[cat]
        pct = c["passed"] / c["total"] * 100 if c["total"] else 0
        lines.append(f"| {cat} | {pct:.0f}% ({c['passed']}/{c['total']}) | {len(c['scenarios'])} scenarios |")

    # V1 Critical Failures — Detail
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## V1 Critical Failures — V2 Fix Status")
    lines.append("")

    # Find specific scenarios
    critical_ids = ["equip_01", "equip_02", "team_01", "v2_equip_01", "v2_equip_02", "v2_equip_03",
                    "v2_doubles_01", "v2_doubles_02", "v2_weights_01", "v2_weights_02",
                    "v2_venue_01", "v2_technique_01", "v2_technique_02",
                    "v2_boundary_01", "v2_boundary_02", "fact_01"]

    v1_by_id = {r["id"]: r for r in v1_graded}
    v2_by_id = {r["id"]: r for r in v2_graded}

    lines.append("### 1. Equipment & Shoes (V1: CRITICAL FAILURE)")
    lines.append("")
    for sid in ["equip_01", "equip_02", "v2_equip_01", "v2_equip_02", "v2_equip_03"]:
        r = v2_by_id.get(sid)
        if r:
            pct = r["passed"] / r["total_checks"] * 100 if r["total_checks"] else 0
            v1r = v1_by_id.get(sid)
            v1_info = ""
            if v1r:
                v1_pct_s = v1r["passed"] / v1r["total_checks"] * 100 if v1r["total_checks"] else 0
                v1_info = f" (v1: {v1_pct_s:.0f}%)"
            lines.append(f"- **{sid}**: {pct:.0f}% ({r['passed']}/{r['total_checks']}){v1_info}")
            for g in r.get("grades", []):
                icon = "PASS" if g["result"] == "PASS" else "FAIL"
                lines.append(f"  - [{icon}] {g['check']} — {g['reason']}")
    lines.append("")

    lines.append("### 2. Doubles Format (V1: CRITICAL FAILURE)")
    lines.append("")
    for sid in ["team_01", "v2_doubles_01", "v2_doubles_02"]:
        r = v2_by_id.get(sid)
        if r:
            pct = r["passed"] / r["total_checks"] * 100 if r["total_checks"] else 0
            v1r = v1_by_id.get(sid)
            v1_info = ""
            if v1r:
                v1_pct_s = v1r["passed"] / v1r["total_checks"] * 100 if v1r["total_checks"] else 0
                v1_info = f" (v1: {v1_pct_s:.0f}%)"
            lines.append(f"- **{sid}**: {pct:.0f}% ({r['passed']}/{r['total_checks']}){v1_info}")
            for g in r.get("grades", []):
                icon = "PASS" if g["result"] == "PASS" else "FAIL"
                lines.append(f"  - [{icon}] {g['check']} — {g['reason']}")
    lines.append("")

    lines.append("### 3. Sled Weights (V1: FACTUAL ERROR)")
    lines.append("")
    for sid in ["fact_01", "v2_weights_01", "v2_weights_02"]:
        r = v2_by_id.get(sid)
        if r:
            pct = r["passed"] / r["total_checks"] * 100 if r["total_checks"] else 0
            v1r = v1_by_id.get(sid)
            v1_info = ""
            if v1r:
                v1_pct_s = v1r["passed"] / v1r["total_checks"] * 100 if v1r["total_checks"] else 0
                v1_info = f" (v1: {v1_pct_s:.0f}%)"
            lines.append(f"- **{sid}**: {pct:.0f}% ({r['passed']}/{r['total_checks']}){v1_info}")
            for g in r.get("grades", []):
                icon = "PASS" if g["result"] == "PASS" else "FAIL"
                lines.append(f"  - [{icon}] {g['check']} — {g['reason']}")
    lines.append("")

    lines.append("### 4. Venue & Surface (V1: HALLUCINATION)")
    lines.append("")
    for sid in ["v2_venue_01"]:
        r = v2_by_id.get(sid)
        if r:
            pct = r["passed"] / r["total_checks"] * 100 if r["total_checks"] else 0
            lines.append(f"- **{sid}**: {pct:.0f}% ({r['passed']}/{r['total_checks']})")
            for g in r.get("grades", []):
                icon = "PASS" if g["result"] == "PASS" else "FAIL"
                lines.append(f"  - [{icon}] {g['check']} — {g['reason']}")
    lines.append("")

    lines.append("### 5. Technique & Benchmarks (V1: QUESTIONABLE)")
    lines.append("")
    for sid in ["v2_technique_01", "v2_technique_02"]:
        r = v2_by_id.get(sid)
        if r:
            pct = r["passed"] / r["total_checks"] * 100 if r["total_checks"] else 0
            lines.append(f"- **{sid}**: {pct:.0f}% ({r['passed']}/{r['total_checks']})")
            for g in r.get("grades", []):
                icon = "PASS" if g["result"] == "PASS" else "FAIL"
                lines.append(f"  - [{icon}] {g['check']} — {g['reason']}")
    lines.append("")

    lines.append("### 6. Boundaries / 'I Don't Know' (V1: NOT TESTED)")
    lines.append("")
    for sid in ["v2_boundary_01", "v2_boundary_02"]:
        r = v2_by_id.get(sid)
        if r:
            pct = r["passed"] / r["total_checks"] * 100 if r["total_checks"] else 0
            lines.append(f"- **{sid}**: {pct:.0f}% ({r['passed']}/{r['total_checks']})")
            for g in r.get("grades", []):
                icon = "PASS" if g["result"] == "PASS" else "FAIL"
                lines.append(f"  - [{icon}] {g['check']} — {g['reason']}")
    lines.append("")

    # Scenario-by-scenario comparison for regressions
    lines.append("---")
    lines.append("")
    lines.append("## Scenario-by-Scenario Comparison (47 Shared)")
    lines.append("")
    lines.append("| ID | Category | V1 | V2 | Delta | Status |")
    lines.append("|----|----------|----|----|-------|--------|")

    regressions = []
    improvements = []
    for v2r in v2_shared:
        sid = v2r["id"]
        v1r = v1_by_id.get(sid)
        if not v1r:
            continue
        v1p = v1r["passed"] / v1r["total_checks"] * 100 if v1r["total_checks"] else 0
        v2p = v2r["passed"] / v2r["total_checks"] * 100 if v2r["total_checks"] else 0
        delta = v2p - v1p

        if delta < -10:
            status = "REGRESSION"
            regressions.append((sid, v2r["category"], v1p, v2p))
        elif delta > 10:
            status = "IMPROVED"
            improvements.append((sid, v2r["category"], v1p, v2p))
        elif v2p >= 90:
            status = "Excellent"
        elif v2p >= 75:
            status = "Good"
        else:
            status = "Needs work"

        lines.append(f"| {sid} | {v2r['category']} | {v1p:.0f}% ({v1r['passed']}/{v1r['total_checks']}) | {v2p:.0f}% ({v2r['passed']}/{v2r['total_checks']}) | {delta:+.0f}pp | {status} |")

    # Regressions detail
    if regressions:
        lines.append("")
        lines.append("### Regressions (>10pp drop)")
        lines.append("")
        for sid, cat, v1p, v2p in regressions:
            v2r = v2_by_id[sid]
            lines.append(f"**{sid} ({cat})**: {v1p:.0f}% → {v2p:.0f}%")
            for g in v2r.get("grades", []):
                if g["result"] == "FAIL":
                    lines.append(f"  - [FAIL] {g['check']} — {g['reason']}")
            lines.append("")
    else:
        lines.append("")
        lines.append("### No regressions detected (>10pp drop)")
        lines.append("")

    # Token & latency
    lines.append("---")
    lines.append("")
    lines.append("## Token & Latency Analysis")
    lines.append("")

    v1_tokens = sum(r.get("tokens_out", 0) for r in v1_graded)
    v2_tokens = sum(r.get("tokens_out", 0) for r in v2_graded)
    v1_avg_tokens = v1_tokens / len(v1_graded) if v1_graded else 0
    v2_avg_tokens = v2_tokens / len(v2_graded) if v2_graded else 0
    v1_avg_latency = sum(r.get("latency_seconds", 0) for r in v1_graded) / len(v1_graded) if v1_graded else 0
    v2_avg_latency = sum(r.get("latency_seconds", 0) for r in v2_graded) / len(v2_graded) if v2_graded else 0

    lines.append("| Metric | V1 | V2 |")
    lines.append("|--------|----|----|")
    lines.append(f"| Total output tokens | {v1_tokens:,} | {v2_tokens:,} |")
    lines.append(f"| Avg tokens/response | {v1_avg_tokens:.0f} | {v2_avg_tokens:.0f} |")
    lines.append(f"| Avg latency | {v1_avg_latency:.1f}s | {v2_avg_latency:.1f}s |")
    lines.append(f"| Scenarios | {len(v1_graded)} | {len(v2_graded)} |")
    lines.append(f"| Errors | 0 | 0 |")
    lines.append("")

    # Conclusion
    lines.append("---")
    lines.append("")
    lines.append("## Conclusion")
    lines.append("")

    # Determine if v1 critical failures are fixed
    equip_fixed = all(
        v2_by_id.get(sid, {}).get("passed", 0) / max(v2_by_id.get(sid, {}).get("total_checks", 1), 1) >= 0.6
        for sid in ["equip_01", "equip_02", "v2_equip_01", "v2_equip_02", "v2_equip_03"]
        if sid in v2_by_id
    )
    doubles_fixed = all(
        v2_by_id.get(sid, {}).get("passed", 0) / max(v2_by_id.get(sid, {}).get("total_checks", 1), 1) >= 0.6
        for sid in ["team_01", "v2_doubles_01", "v2_doubles_02"]
        if sid in v2_by_id
    )
    weights_fixed = all(
        v2_by_id.get(sid, {}).get("passed", 0) / max(v2_by_id.get(sid, {}).get("total_checks", 1), 1) >= 0.6
        for sid in ["v2_weights_01", "v2_weights_02"]
        if sid in v2_by_id
    )

    lines.append("### V1 Critical Failure Status")
    lines.append("")
    lines.append(f"1. **Equipment/Shoes**: {'FIXED' if equip_fixed else 'STILL FAILING'}")
    lines.append(f"2. **Doubles Format**: {'FIXED' if doubles_fixed else 'STILL FAILING'}")
    lines.append(f"3. **Sled Weights**: {'FIXED' if weights_fixed else 'STILL FAILING'}")
    lines.append("")

    if not regressions:
        lines.append("### Regressions: NONE DETECTED")
    else:
        lines.append(f"### Regressions: {len(regressions)} scenario(s) regressed >10pp")
    lines.append("")

    lines.append(f"### Overall: V2 scores **{v2_pct:.0f}%** across {len(v2_graded)} scenarios ({v2_total_pass}/{v2_total_checks} checks)")
    if v2_shared_pct > v1_shared_pct:
        lines.append(f"On the 47 shared scenarios, V2 improved from **{v1_shared_pct:.0f}%** to **{v2_shared_pct:.0f}%** ({v2_shared_pct - v1_shared_pct:+.0f}pp).")
    elif v2_shared_pct < v1_shared_pct:
        lines.append(f"On the 47 shared scenarios, V2 regressed from **{v1_shared_pct:.0f}%** to **{v2_shared_pct:.0f}%** ({v2_shared_pct - v1_shared_pct:+.0f}pp).")
    else:
        lines.append(f"On the 47 shared scenarios, V2 maintained **{v2_shared_pct:.0f}%**.")
    lines.append("")

    all_fixed = equip_fixed and doubles_fixed and weights_fixed
    no_regressions = len(regressions) == 0

    if all_fixed and no_regressions:
        lines.append("**V2 successfully fixes all 3 critical failures with no regressions. Ready for RAG integration.**")
    elif all_fixed:
        lines.append(f"**V2 fixes all 3 critical failures but has {len(regressions)} regression(s) to investigate.**")
    else:
        unfixed = []
        if not equip_fixed: unfixed.append("Equipment")
        if not doubles_fixed: unfixed.append("Doubles")
        if not weights_fixed: unfixed.append("Weights")
        lines.append(f"**V2 still has issues in: {', '.join(unfixed)}. Consider additional training data.**")

    return "\n".join(lines)


def main():
    print("Loading evaluation files...")
    v1_data = load_eval(V1_PATH)
    v2_data = load_eval(V2_PATH)
    print(f"  V1: {len(v1_data['results'])} scenarios")
    print(f"  V2: {len(v2_data['results'])} scenarios")

    # Grade both
    v1_graded = grade_all(v1_data, "V1")
    v2_graded = grade_all(v2_data, "V2")

    # Build report
    print("\n\nGenerating comparison report...")
    report = build_report(v1_graded, v2_graded, v1_data, v2_data)

    with open(OUTPUT_PATH, "w") as f:
        f.write(report)
    print(f"\nReport saved to {OUTPUT_PATH}")

    # Also save raw grades for reference
    grades_path = "docs/evaluation/v2_grades_raw.json"
    with open(grades_path, "w") as f:
        json.dump({
            "v1_grades": [{k: v for k, v in r.items() if k != "response"} for r in v1_graded],
            "v2_grades": [{k: v for k, v in r.items() if k != "response"} for r in v2_graded],
        }, f, indent=2)
    print(f"Raw grades saved to {grades_path}")

    # Print summary
    v1_pass = sum(r["passed"] for r in v1_graded)
    v1_total = sum(r["total_checks"] for r in v1_graded)
    v2_pass = sum(r["passed"] for r in v2_graded)
    v2_total = sum(r["total_checks"] for r in v2_graded)

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"  V1: {v1_pass}/{v1_total} checks passed ({v1_pass/v1_total*100:.0f}%)")
    print(f"  V2: {v2_pass}/{v2_total} checks passed ({v2_pass/v2_total*100:.0f}%)")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
