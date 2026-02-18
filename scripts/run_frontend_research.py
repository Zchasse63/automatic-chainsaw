#!/usr/bin/env python3
"""
Frontend Build Phase Research Runner
=====================================
Runs phases 2-6 planning docs through Perplexity advanced-deep-research.
Saves outputs to docs/architecture/UI_Frontend_Build/research_output/

Usage:
    python3 scripts/run_frontend_research.py --phase 2
    python3 scripts/run_frontend_research.py --phase all
    python3 scripts/run_frontend_research.py --phase 2 --dry-run
"""

import os
import sys
import json
import argparse
import time
import requests
from pathlib import Path
from datetime import datetime

API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
BASE_URL = "https://api.perplexity.ai"
PRESET = "advanced-deep-research"
MAX_RETRIES = 3
RETRY_DELAY = 10

PROJECT_ROOT = Path(__file__).parent.parent
INPUT_DIR = PROJECT_ROOT / "docs" / "architecture" / "UI_Frontend_Build"
OUTPUT_DIR = INPUT_DIR / "research_output"
RAW_DIR = OUTPUT_DIR / "raw_json"

PHASES = {
    "2": {
        "file": "phase2-database-schema.md",
        "name": "phase2_database_schema",
        "description": "Database Schema Design for Hyrox AI Coach",
    },
    "3": {
        "file": "phase3-seed-data.md",
        "name": "phase3_seed_data",
        "description": "Seed Data & Reference Tables for Hyrox AI Coach",
    },
    "4": {
        "file": "phase4-api-architecture.md",
        "name": "phase4_api_architecture",
        "description": "API & Data Flow Architecture for Hyrox AI Coach",
    },
    "5": {
        "file": "phase5-frontend-specs.md",
        "name": "phase5_frontend_specs",
        "description": "Screen-by-Screen Frontend Specs for Hyrox AI Coach",
    },
    "6": {
        "file": "phase6-build-prompts.md",
        "name": "phase6_build_prompts",
        "description": "Claude Code Build Prompts for Hyrox AI Coach",
    },
}


def run_research(prompt: str, phase_name: str) -> dict:
    """Run a research query with retry logic."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "preset": PRESET,
        "input": prompt,
        "max_output_tokens": 16384,
    }

    print(f"\n{'='*60}")
    print(f"Running research: {phase_name}")
    print(f"Preset: {PRESET}")
    print(f"Prompt length: {len(prompt)} chars ({len(prompt.split())} words)")
    print(f"{'='*60}\n")

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            start = time.time()
            response = requests.post(
                f"{BASE_URL}/v1/responses",
                headers=headers,
                json=payload,
                timeout=600,
            )
            elapsed = time.time() - start

            if response.status_code == 200:
                result = response.json()
                cost = result.get("usage", {}).get("cost", {})
                print(f"Completed in {elapsed:.1f}s")
                print(f"Model: {result.get('model', 'unknown')}")
                print(f"Status: {result.get('status', 'unknown')}")
                if cost:
                    print(f"Cost: ${cost.get('total_cost', 0):.4f}")
                return result

            print(f"Attempt {attempt}/{MAX_RETRIES}: HTTP {response.status_code}")
            print(f"Response: {response.text[:500]}")

            if response.status_code in (429, 500, 502, 503, 504):
                if attempt < MAX_RETRIES:
                    wait = RETRY_DELAY * attempt
                    print(f"Retrying in {wait}s...")
                    time.sleep(wait)
                    continue

            response.raise_for_status()

        except requests.exceptions.Timeout:
            print(f"Attempt {attempt}/{MAX_RETRIES}: Timed out after 600s")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise
        except requests.exceptions.ConnectionError as e:
            print(f"Attempt {attempt}/{MAX_RETRIES}: Connection error: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise

    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts")


def extract_output_text(result: dict) -> tuple:
    """Extract text content and sources from Perplexity response."""
    output_text = ""
    sources = []

    if not isinstance(result, dict) or "output" not in result:
        return json.dumps(result, indent=2), []

    for item in result["output"]:
        if not isinstance(item, dict):
            if isinstance(item, str):
                output_text += item
            continue

        if item.get("type") == "message":
            for content_block in item.get("content", item.get("text", [])):
                if isinstance(content_block, dict) and content_block.get("type") == "output_text":
                    output_text += content_block.get("text", "")
                elif isinstance(content_block, str):
                    output_text += content_block

        elif "results" in item:
            for r in item["results"]:
                if isinstance(r, dict) and "url" in r:
                    sources.append(f"- [{r.get('title', r['url'])}]({r['url']})")

        elif "contents" in item:
            for c in item["contents"]:
                if isinstance(c, dict) and "url" in c:
                    sources.append(f"- [{c.get('title', c['url'])}]({c['url']})")

    if not output_text:
        output_text = json.dumps(result, indent=2)

    return output_text, sources


def save_output(phase_key: str, result: dict, raw_prompt: str):
    """Save research output to the UI_Frontend_Build/research_output directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    phase = PHASES[phase_key]
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"{phase['name']}_{timestamp}.md"
    raw_file = RAW_DIR / f"{phase['name']}_{timestamp}.json"

    with open(raw_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Raw JSON saved to: {raw_file}")

    output_text, sources = extract_output_text(result)

    usage = result.get("usage", {})
    cost = usage.get("cost", {})
    model = result.get("model", "unknown")
    tool_details = usage.get("tool_calls_details", {})

    with open(output_file, "w") as f:
        f.write(f"# Research Output: {phase['description']}\n")
        f.write(f"## Generated: {datetime.now().isoformat()}\n")
        f.write(f"## Preset: {PRESET}\n")
        f.write(f"## Model: {model}\n")
        if cost:
            f.write(f"## Cost: ${cost.get('total_cost', 0):.4f}\n")
        if tool_details:
            searches = tool_details.get("search_web", {}).get("invocation", 0)
            fetches = tool_details.get("fetch_url", {}).get("invocation", 0)
            f.write(f"## Research steps: {searches} searches, {fetches} URL fetches\n")
        f.write(f"## Output length: {len(output_text)} chars, {len(output_text.split())} words\n")
        f.write("\n---\n\n")
        f.write(output_text)
        if sources:
            f.write("\n\n---\n\n## Sources\n\n")
            f.write("\n".join(dict.fromkeys(sources)))
        f.write("\n\n---\n\n")
        f.write(f"## Original Prompt\n\n```\n{raw_prompt[:5000]}\n```\n")

    print(f"Output saved to: {output_file}")
    print(f"Output length: {len(output_text)} chars ({len(output_text.split())} words)")
    return output_file


def main():
    parser = argparse.ArgumentParser(description="Run Perplexity deep research for frontend build phases")
    parser.add_argument("--phase", required=True, help="Phase number (2-6) or 'all'")
    parser.add_argument("--dry-run", action="store_true", help="Print prompt without running")
    args = parser.parse_args()

    if args.phase == "all":
        phases_to_run = ["2", "3", "4", "5", "6"]
    else:
        phases_to_run = [args.phase]

    for phase_key in phases_to_run:
        if phase_key not in PHASES:
            print(f"Error: Unknown phase {phase_key}. Valid: 2, 3, 4, 5, 6, all")
            sys.exit(1)

    total_cost = 0.0
    for phase_key in phases_to_run:
        phase = PHASES[phase_key]
        input_file = INPUT_DIR / phase["file"]

        if not input_file.exists():
            print(f"Error: Input file not found: {input_file}")
            sys.exit(1)

        prompt = input_file.read_text()

        if args.dry_run:
            print(f"\n[DRY RUN] Phase {phase_key}: {phase['description']}")
            print(f"  File: {input_file}")
            print(f"  Prompt: {len(prompt)} chars, {len(prompt.split())} words")
            print(f"  First 200 chars: {prompt[:200]}...")
            continue

        print(f"\n{'#'*60}")
        print(f"# PHASE {phase_key}: {phase['description']}")
        print(f"{'#'*60}")

        result = run_research(prompt, phase["description"])
        output_file = save_output(phase_key, result, prompt)

        cost = result.get("usage", {}).get("cost", {}).get("total_cost", 0)
        total_cost += cost

        print(f"\nPhase {phase_key} complete. Output: {output_file}")

        if len(phases_to_run) > 1 and phase_key != phases_to_run[-1]:
            print("Waiting 5s before next phase...")
            time.sleep(5)

    if not args.dry_run:
        print(f"\n{'='*60}")
        print(f"ALL PHASES COMPLETE")
        print(f"Total cost: ${total_cost:.4f}")
        print(f"Output directory: {OUTPUT_DIR}")
        print(f"{'='*60}")


if __name__ == "__main__":
    main()
