#!/usr/bin/env python3
"""
Grade and Compare: Coach K v2 (model only) vs v2+RAG (model + retrieval)

Uses the same automated grading approach as grade_evaluation.py:
sends each response + checks to base Llama for pass/fail scoring.

Usage:
    python3 scripts/grade_rag_comparison.py
"""

import json
import os
import time
import re
from collections import defaultdict
from openai import OpenAI

# ── Config ──────────────────────────────────────────────
client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ.get("NEBIUS_API_KEY", ""),
)
GRADER_MODEL = "meta-llama/Llama-3.3-70B-Instruct"

V2_PATH = "docs/evaluation/coach_k_v2_eval.json"
V2_RAG_PATH = "docs/evaluation/coach_k_v2_rag_eval.json"
OUTPUT_PATH = "docs/evaluation/v2_rag_comparison_report.md"
GRADES_PATH = "docs/evaluation/v2_rag_grades_raw.json"

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


def repair_json(text):
    """Attempt to fix common JSON issues from LLM output."""
    # Strip trailing commas before ] or }
    text = re.sub(r',\s*([}\]])', r'\1', text)
    # Fix single quotes to double quotes
    text = re.sub(r"(?<![\\])'", '"', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x1f]+', ' ', text)
    return text


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
                max_tokens=2000,
            )
            content = result.choices[0].message.content.strip()
            match = re.search(r'\[.*\]', content, re.DOTALL)
            if match:
                raw = match.group()
                try:
                    grades = json.loads(raw)
                except json.JSONDecodeError:
                    grades = json.loads(repair_json(raw))
                if len(grades) == len(checks):
                    return grades
                if len(grades) < len(checks):
                    for i in range(len(grades), len(checks)):
                        grades.append({"check": checks[i], "result": "FAIL", "reason": "grader did not evaluate"})
                return grades[:len(checks)]
        except (json.JSONDecodeError, Exception) as e:
            if attempt < max_retries:
                time.sleep(2)
                continue
            return [{"check": c, "result": "FAIL", "reason": f"grader error: {e}"} for c in checks]

    return [{"check": c, "result": "FAIL", "reason": "grader timeout"} for c in checks]


def load_eval(path):
    with open(path) as f:
        return json.load(f)


def grade_all(eval_data, label):
    """Grade all scenarios."""
    results = eval_data["results"]
    total = len(results)
    graded = []

    print(f"\nGrading {total} scenarios for {label}...")
    print("=" * 60)

    for i, r in enumerate(results):
        checks = r.get("checks", [])
        response = r.get("response", "")

        if not checks or not response:
            graded.append({**r, "grades": [], "passed": 0, "total_checks": 0})
            continue

        print(f"  [{i+1}/{total}] {r['id']} ({r['category']}) — {len(checks)} checks", end="", flush=True)

        grades = grade_response(r["prompt"], response, checks)
        passed = sum(1 for g in grades if g["result"] == "PASS")

        print(f" → {passed}/{len(checks)}")
        time.sleep(0.3)

        graded.append({
            **r,
            "grades": grades,
            "passed": passed,
            "total_checks": len(checks),
        })

    return graded


def build_report(v2_graded, rag_graded, v2_data, rag_data):
    """Generate markdown comparison: v2 vs v2+RAG."""
    v2_by_id = {r["id"]: r for r in v2_graded}
    rag_by_id = {r["id"]: r for r in rag_graded}

    v2_total_pass = sum(r["passed"] for r in v2_graded)
    v2_total_checks = sum(r["total_checks"] for r in v2_graded)
    rag_total_pass = sum(r["passed"] for r in rag_graded)
    rag_total_checks = sum(r["total_checks"] for r in rag_graded)
    v2_pct = v2_total_pass / v2_total_checks * 100 if v2_total_checks else 0
    rag_pct = rag_total_pass / rag_total_checks * 100 if rag_total_checks else 0

    lines = []
    lines.append("# Coach K: v2 (Model Only) vs v2+RAG — Comparison Report")
    lines.append("")
    lines.append(f"**Date**: {rag_data.get('timestamp', 'N/A')[:10]}")
    lines.append(f"**Model**: `{rag_data.get('model', 'N/A')}`")
    lines.append(f"**RAG Pipeline**: Hybrid search (semantic + full-text), top 5 chunks")
    lines.append(f"**Embedding**: text-embedding-3-small (1536 dim)")
    lines.append(f"**Knowledge Base**: 239 chunks from Supabase PGVector")
    lines.append(f"**Grader**: Llama 3.3 70B Instruct (base, temperature=0)")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Executive Summary
    lines.append("## Executive Summary")
    lines.append("")
    lines.append("| Metric | v2 (Model Only) | v2+RAG | Change |")
    lines.append("|--------|-----------------|--------|--------|")
    lines.append(f"| **Overall check pass rate** | {v2_pct:.0f}% ({v2_total_pass}/{v2_total_checks}) | {rag_pct:.0f}% ({rag_total_pass}/{rag_total_checks}) | {rag_pct - v2_pct:+.1f}pp |")

    v2_tokens_out = sum(r.get("tokens_out", 0) for r in v2_graded)
    rag_tokens_out = sum(r.get("tokens_out", 0) for r in rag_graded)
    v2_avg_latency = sum(r.get("latency_seconds", 0) for r in v2_graded) / len(v2_graded) if v2_graded else 0
    rag_avg_latency = sum(r.get("latency_seconds", 0) for r in rag_graded) / len(rag_graded) if rag_graded else 0

    lines.append(f"| **Avg output tokens** | {v2_tokens_out // len(v2_graded)} | {rag_tokens_out // len(rag_graded)} | {(rag_tokens_out // len(rag_graded)) - (v2_tokens_out // len(v2_graded)):+d} |")
    lines.append(f"| **Avg latency** | {v2_avg_latency:.1f}s | {rag_avg_latency:.1f}s | {rag_avg_latency - v2_avg_latency:+.1f}s |")
    lines.append(f"| **Scenarios** | {len(v2_graded)} | {len(rag_graded)} | — |")
    lines.append("")

    # Category comparison
    lines.append("---")
    lines.append("")
    lines.append("## Performance by Category")
    lines.append("")
    lines.append("| Category | v2 | v2+RAG | Change | Verdict |")
    lines.append("|----------|----|----|--------|---------|")

    v2_cats = defaultdict(lambda: {"passed": 0, "total": 0})
    rag_cats = defaultdict(lambda: {"passed": 0, "total": 0})
    for r in v2_graded:
        v2_cats[r["category"]]["passed"] += r["passed"]
        v2_cats[r["category"]]["total"] += r["total_checks"]
    for r in rag_graded:
        rag_cats[r["category"]]["passed"] += r["passed"]
        rag_cats[r["category"]]["total"] += r["total_checks"]

    all_cats = sorted(set(list(v2_cats.keys()) + list(rag_cats.keys())))
    for cat in all_cats:
        v2c = v2_cats[cat]
        rc = rag_cats[cat]
        v2p = v2c["passed"] / v2c["total"] * 100 if v2c["total"] else 0
        rp = rc["passed"] / rc["total"] * 100 if rc["total"] else 0
        delta = rp - v2p

        if delta > 10:
            verdict = "RAG IMPROVED"
        elif delta < -10:
            verdict = "RAG REGRESSION"
        elif rp >= 90:
            verdict = "Excellent"
        elif rp >= 75:
            verdict = "Good"
        else:
            verdict = "Needs work"

        lines.append(f"| {cat} | {v2p:.0f}% ({v2c['passed']}/{v2c['total']}) | {rp:.0f}% ({rc['passed']}/{rc['total']}) | {delta:+.0f}pp | {verdict} |")

    # Scenario-by-scenario
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Scenario-by-Scenario Comparison")
    lines.append("")
    lines.append("| ID | Category | v2 | v2+RAG | Delta | Status |")
    lines.append("|----|----------|----|----|-------|--------|")

    improvements = []
    regressions = []
    for r_rag in rag_graded:
        sid = r_rag["id"]
        r_v2 = v2_by_id.get(sid)
        if not r_v2:
            continue
        v2p = r_v2["passed"] / r_v2["total_checks"] * 100 if r_v2["total_checks"] else 0
        rp = r_rag["passed"] / r_rag["total_checks"] * 100 if r_rag["total_checks"] else 0
        delta = rp - v2p

        if delta > 10:
            status = "RAG IMPROVED"
            improvements.append((sid, r_rag["category"], v2p, rp, r_rag))
        elif delta < -10:
            status = "RAG REGRESSION"
            regressions.append((sid, r_rag["category"], v2p, rp, r_rag))
        elif rp >= 90:
            status = "Excellent"
        elif rp >= 75:
            status = "Good"
        else:
            status = "Needs work"

        lines.append(f"| {sid} | {r_rag['category']} | {v2p:.0f}% ({r_v2['passed']}/{r_v2['total_checks']}) | {rp:.0f}% ({r_rag['passed']}/{r_rag['total_checks']}) | {delta:+.0f}pp | {status} |")

    # Improvements detail
    if improvements:
        lines.append("")
        lines.append("### RAG Improvements (>10pp gain)")
        lines.append("")
        for sid, cat, v2p, rp, r_rag in improvements:
            lines.append(f"**{sid} ({cat})**: {v2p:.0f}% → {rp:.0f}% (+{rp-v2p:.0f}pp)")
            chunks = r_rag.get("rag_chunks_retrieved", [])
            if chunks:
                lines.append(f"  Chunks used: {', '.join(chunks[:5])}")
            for g in r_rag.get("grades", []):
                if g["result"] == "PASS":
                    lines.append(f"  - [PASS] {g['check']} — {g['reason']}")
            lines.append("")

    # Regressions detail
    if regressions:
        lines.append("")
        lines.append("### RAG Regressions (>10pp drop)")
        lines.append("")
        for sid, cat, v2p, rp, r_rag in regressions:
            lines.append(f"**{sid} ({cat})**: {v2p:.0f}% → {rp:.0f}% ({rp-v2p:.0f}pp)")
            chunks = r_rag.get("rag_chunks_retrieved", [])
            if chunks:
                lines.append(f"  Chunks used: {', '.join(chunks[:5])}")
            for g in r_rag.get("grades", []):
                if g["result"] == "FAIL":
                    lines.append(f"  - [FAIL] {g['check']} — {g['reason']}")
            lines.append("")
    else:
        lines.append("")
        lines.append("### No RAG regressions detected (>10pp drop)")
        lines.append("")

    # RAG retrieval analysis
    lines.append("---")
    lines.append("")
    lines.append("## RAG Retrieval Analysis")
    lines.append("")

    # Which source documents were retrieved most
    chunk_freq = defaultdict(int)
    source_freq = defaultdict(int)
    for r in rag_graded:
        for cid in r.get("rag_chunks_retrieved", []):
            chunk_freq[cid] += 1

    lines.append("### Most Retrieved Chunks")
    lines.append("")
    lines.append("| Chunk ID | Times Retrieved |")
    lines.append("|----------|----------------|")
    for cid, count in sorted(chunk_freq.items(), key=lambda x: -x[1])[:15]:
        lines.append(f"| {cid} | {count} |")
    lines.append("")

    # Conclusion
    lines.append("---")
    lines.append("")
    lines.append("## Conclusion")
    lines.append("")

    delta_overall = rag_pct - v2_pct
    lines.append(f"- **Overall**: v2+RAG scores **{rag_pct:.0f}%** vs v2's **{v2_pct:.0f}%** ({delta_overall:+.1f}pp)")
    lines.append(f"- **Improvements**: {len(improvements)} scenarios gained >10pp with RAG")
    lines.append(f"- **Regressions**: {len(regressions)} scenarios lost >10pp with RAG")
    lines.append(f"- **Latency**: {rag_avg_latency:.1f}s avg (v2: {v2_avg_latency:.1f}s) — {rag_avg_latency - v2_avg_latency:+.1f}s from RAG overhead")
    lines.append("")

    if delta_overall > 0 and len(regressions) == 0:
        lines.append("**RAG integration improves accuracy with no regressions. The three-layer architecture (RAG + fine-tuning + athlete profile) is validated.**")
    elif delta_overall > 0:
        lines.append(f"**RAG integration improves overall accuracy but introduces {len(regressions)} regression(s) to investigate.**")
    elif delta_overall < -5:
        lines.append("**RAG integration decreased accuracy. Possible causes: irrelevant chunk retrieval, context overload, or system prompt dilution. Needs tuning.**")
    else:
        lines.append("**RAG integration has minimal impact on automated grading. Manual review recommended — RAG may improve factual grounding without changing check pass rates.**")

    return "\n".join(lines)


def main():
    print("Loading evaluation files...")
    v2_data = load_eval(V2_PATH)
    rag_data = load_eval(V2_RAG_PATH)
    print(f"  v2 (model only): {len(v2_data['results'])} scenarios")
    print(f"  v2+RAG: {len(rag_data['results'])} scenarios")

    # Grade both (v2 may already have grades, but re-grade for consistency)
    v2_graded = grade_all(v2_data, "v2 (model only)")
    rag_graded = grade_all(rag_data, "v2+RAG")

    # Build report
    print("\n\nGenerating comparison report...")
    report = build_report(v2_graded, rag_graded, v2_data, rag_data)

    with open(OUTPUT_PATH, "w") as f:
        f.write(report)
    print(f"\nReport saved to {OUTPUT_PATH}")

    # Save raw grades
    with open(GRADES_PATH, "w") as f:
        json.dump({
            "v2_grades": [{k: v for k, v in r.items() if k != "response"} for r in v2_graded],
            "v2_rag_grades": [{k: v for k, v in r.items() if k != "response"} for r in rag_graded],
        }, f, indent=2)
    print(f"Raw grades saved to {GRADES_PATH}")

    # Summary
    v2_pass = sum(r["passed"] for r in v2_graded)
    v2_total = sum(r["total_checks"] for r in v2_graded)
    rag_pass = sum(r["passed"] for r in rag_graded)
    rag_total = sum(r["total_checks"] for r in rag_graded)

    print(f"\n{'='*60}")
    print(f"SUMMARY")
    print(f"  v2 (model only): {v2_pass}/{v2_total} checks ({v2_pass/v2_total*100:.0f}%)")
    print(f"  v2+RAG:          {rag_pass}/{rag_total} checks ({rag_pass/rag_total*100:.0f}%)")
    print(f"  Delta:           {(rag_pass/rag_total - v2_pass/v2_total)*100:+.1f}pp")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
