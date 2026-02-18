#!/usr/bin/env python3
"""
Perplexity Agentic Research Runner
===================================
Runs research tasks through Perplexity's advanced-deep-research preset.

Usage:
    python scripts/perplexity_research.py --task team1
    python scripts/perplexity_research.py --task team2 --preset deep-research
    python scripts/perplexity_research.py --prompt "Your custom research query"
    python scripts/perplexity_research.py --task team5 --context docs/research/completed/team1_*.md docs/research/completed/team2_*.md

Prerequisites:
    - PERPLEXITY_API_KEY environment variable set (or uses default)
    - pip install requests
"""

import os
import sys
import json
import glob
import argparse
import time
import requests
from pathlib import Path
from datetime import datetime

# Configuration
API_KEY = os.environ.get("PERPLEXITY_API_KEY", "")
BASE_URL = "https://api.perplexity.ai"
DEFAULT_PRESET = "advanced-deep-research"  # Uses Claude Opus 4.6, 10 max steps
MAX_RETRIES = 3
RETRY_DELAY = 10  # seconds

# Research task files mapping (includes split sub-tasks)
TASK_FILES = {
    "team1": "docs/research/team1_hyrox_event_deep_dive.md",
    "team1a": "docs/research/splits/team1a_event_format_benchmarks.md",
    "team1b": "docs/research/splits/team1b_pacing_race_execution.md",
    "team1c": "docs/research/splits/team1c_station_breakdown.md",
    "team2": "docs/research/team2_elite_athletes.md",
    "team3": "docs/research/team3_training_programs.md",
    "team3a": "docs/research/splits/team3a_prvn_hwpo_comptrain.md",
    "team3b": "docs/research/splits/team3b_persist_hybrid_bpn.md",
    "team3c": "docs/research/splits/team3c_crossfit_hyrox_running.md",
    "team4": "docs/research/team4_sports_science.md",
    "team5": "docs/research/team5_periodization_blueprint.md",
    "team6": "docs/research/team6_engineering.md",
    "team2b": "docs/research/splits/team2b_elite_completion.md",
    "team4b": "docs/research/splits/team4b_recovery_testing.md",
    "team5b": "docs/research/splits/team5b_autoregulation.md",
    "team7": "docs/research/splits/team7_workout_construction.md",
    "team8": "docs/research/splits/team8_nutrition_recovery.md",
    "team9": "docs/research/splits/team9_equipment_footwear.md",
    "team10": "docs/research/splits/team10_doubles_relay.md",
    "team11": "docs/research/splits/team11_rules_weights_records.md",
    "team12": "docs/research/splits/team12_technique_benchmarks.md",
}

OUTPUT_DIR = Path("docs/research/completed")
RAW_DIR = Path("docs/research/completed/raw_json")


def extract_prompt_from_task_file(task_file: str) -> str:
    """Extract the prompt content from between ``` markers in a task file."""
    with open(task_file, "r") as f:
        content = f.read()

    lines = content.split("\n")
    in_prompt = False
    prompt_lines = []

    for line in lines:
        if line.strip() == "```" and not in_prompt and any(
            "Prompt for Perplexity" in l for l in lines[: lines.index(line)]
        ):
            in_prompt = True
            continue
        elif line.strip() == "```" and in_prompt:
            break
        elif in_prompt:
            prompt_lines.append(line)

    return "\n".join(prompt_lines).strip()


def load_context_files(context_patterns: list) -> str:
    """Load and concatenate context files from glob patterns (for Team 5)."""
    context_parts = []
    for pattern in context_patterns:
        matched = sorted(glob.glob(pattern))
        if not matched:
            print(f"  Warning: No files matched pattern: {pattern}")
            continue
        # Use the most recent file for each pattern
        filepath = matched[-1]
        with open(filepath, "r") as f:
            text = f.read()
        # Strip the metadata headers and original prompt sections to save tokens
        # Keep only the research content between the first --- and the Sources/Original Prompt sections
        lines = text.split("\n")
        content_lines = []
        in_content = False
        for line in lines:
            if line.strip() == "---" and not in_content:
                in_content = True
                continue
            if in_content and (line.startswith("## Sources") or line.startswith("## Original Prompt")):
                break
            if in_content:
                content_lines.append(line)
        clean_text = "\n".join(content_lines).strip()
        context_parts.append(f"### Context from: {Path(filepath).stem}\n\n{clean_text}")
        print(f"  Loaded context: {filepath} ({len(clean_text)} chars)")

    return "\n\n---\n\n".join(context_parts)


def extract_output_text(result: dict) -> tuple:
    """Extract text content and sources from Perplexity's Responses API format.

    Returns (output_text, sources_list).
    """
    output_text = ""
    sources = []

    if not isinstance(result, dict) or "output" not in result:
        return json.dumps(result, indent=2), []

    for item in result["output"]:
        if not isinstance(item, dict):
            if isinstance(item, str):
                output_text += item
            continue

        # Main text response
        if item.get("type") == "message":
            for content_block in item.get("content", item.get("text", [])):
                if isinstance(content_block, dict) and content_block.get("type") == "output_text":
                    output_text += content_block.get("text", "")
                elif isinstance(content_block, str):
                    output_text += content_block

        # Search result sources
        elif "results" in item:
            for r in item["results"]:
                if isinstance(r, dict) and "url" in r:
                    sources.append(f"- [{r.get('title', r['url'])}]({r['url']})")

        # Fetched URL sources
        elif "contents" in item:
            for c in item["contents"]:
                if isinstance(c, dict) and "url" in c:
                    sources.append(f"- [{c.get('title', c['url'])}]({c['url']})")

    if not output_text:
        output_text = json.dumps(result, indent=2)

    return output_text, sources


def run_research(prompt: str, preset: str = DEFAULT_PRESET, max_output_tokens: int = 16384) -> dict:
    """Run a research query with retry logic."""
    if not API_KEY:
        raise ValueError(
            "PERPLEXITY_API_KEY environment variable not set. "
            "Get your key at https://www.perplexity.ai/settings/api"
        )

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "preset": preset,
        "input": prompt,
        "max_output_tokens": max_output_tokens,
    }

    print(f"\n{'='*60}")
    print(f"Running research with preset: {preset}")
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
            print(f"Attempt {attempt}/{MAX_RETRIES}: Request timed out after 600s")
            if attempt < MAX_RETRIES:
                wait = RETRY_DELAY * attempt
                print(f"Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise

        except requests.exceptions.ConnectionError as e:
            print(f"Attempt {attempt}/{MAX_RETRIES}: Connection error: {e}")
            if attempt < MAX_RETRIES:
                wait = RETRY_DELAY * attempt
                print(f"Retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise

    raise RuntimeError(f"Failed after {MAX_RETRIES} attempts")


def save_output(task_name: str, result: dict, raw_prompt: str, preset: str = DEFAULT_PRESET):
    """Save research output (markdown + raw JSON) to the completed directory."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_file = OUTPUT_DIR / f"{task_name}_{timestamp}.md"
    raw_file = RAW_DIR / f"{task_name}_{timestamp}.json"

    # Save raw JSON response (for re-extraction or debugging)
    with open(raw_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"Raw JSON saved to: {raw_file}")

    # Extract text and sources
    output_text, sources = extract_output_text(result)

    # Extract usage/cost info
    usage = result.get("usage", {})
    cost = usage.get("cost", {})
    model = result.get("model", "unknown")
    tool_details = usage.get("tool_calls_details", {})

    with open(output_file, "w") as f:
        f.write(f"# Research Output: {task_name}\n")
        f.write(f"## Generated: {datetime.now().isoformat()}\n")
        f.write(f"## Preset: {preset}\n")
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
        f.write(f"## Original Prompt\n\n```\n{raw_prompt}\n```\n")

    print(f"Output saved to: {output_file}")
    print(f"Output length: {len(output_text)} chars ({len(output_text.split())} words)")

    return output_file


def extract_raw_content(json_path: str) -> str:
    """Extract all search snippets and fetched URL content from a raw JSON response.

    Used for re-synthesis when the API returns empty output_text but has rich research data.
    """
    with open(json_path, "r") as f:
        data = json.load(f)

    sections = []

    for item in data.get("output", []):
        if not isinstance(item, dict):
            continue

        # Search results
        if item.get("type") == "search_results":
            queries = item.get("queries", [])
            if queries:
                sections.append(f"### Search Queries: {', '.join(queries)}\n")
            for r in item.get("results", []):
                if isinstance(r, dict):
                    title = r.get("title", "")
                    url = r.get("url", "")
                    snippet = r.get("snippet", "").strip()
                    if snippet:
                        sections.append(f"**Source: [{title}]({url})**\n{snippet}\n")

        # Fetched URL content
        elif item.get("type") == "fetch_url_results":
            for c in item.get("contents", []):
                if isinstance(c, dict):
                    title = c.get("title", "")
                    url = c.get("url", "")
                    snippet = c.get("snippet", "").strip()
                    if snippet:
                        sections.append(f"**Fetched: [{title}]({url})**\n{snippet}\n")

    return "\n---\n\n".join(sections)


def main():
    parser = argparse.ArgumentParser(description="Run Perplexity deep research tasks")
    parser.add_argument(
        "--task",
        choices=list(TASK_FILES.keys()),
        help="Research task to run (team1-team6)",
    )
    parser.add_argument(
        "--prompt",
        type=str,
        help="Custom research prompt (overrides --task)",
    )
    parser.add_argument(
        "--preset",
        type=str,
        default=DEFAULT_PRESET,
        choices=["fast-search", "pro-search", "deep-research", "advanced-deep-research"],
        help=f"Perplexity preset to use (default: {DEFAULT_PRESET})",
    )
    parser.add_argument(
        "--context",
        nargs="+",
        help="Glob patterns for context files to prepend (for Team 5). Example: docs/research/completed/team1_*.md",
    )
    parser.add_argument(
        "--synthesize-from",
        type=str,
        help="Path to raw JSON from a failed run. Extracts fetched content and re-runs as synthesis prompt.",
    )
    parser.add_argument(
        "--max-output-tokens",
        type=int,
        default=16384,
        help="Max output tokens for the response (default: 16384, Perplexity default is 8192)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the prompt without running it",
    )

    args = parser.parse_args()

    if not args.task and not args.prompt:
        parser.print_help()
        print("\nAvailable tasks:")
        for task, file in TASK_FILES.items():
            print(f"  {task}: {file}")
        sys.exit(1)

    # Get the prompt
    if args.prompt:
        prompt = args.prompt
        task_name = "custom_research"
    else:
        task_file = TASK_FILES[args.task]
        if not Path(task_file).exists():
            print(f"Error: Task file not found: {task_file}")
            sys.exit(1)
        prompt = extract_prompt_from_task_file(task_file)
        task_name = args.task

    # Synthesis mode: extract content from failed run and prepend to prompt
    if args.synthesize_from:
        json_path = args.synthesize_from
        if not Path(json_path).exists():
            print(f"Error: Raw JSON file not found: {json_path}")
            sys.exit(1)
        print(f"Extracting research data from: {json_path}")
        raw_content = extract_raw_content(json_path)
        print(f"Extracted {len(raw_content)} chars of research data")
        prompt = (
            f"You have already completed extensive web research on this topic. "
            f"Below is ALL the research data you gathered from web searches and URL fetches. "
            f"Your job is to SYNTHESIZE this data into a comprehensive, well-structured analysis. "
            f"Do NOT search for additional information — everything you need is provided below.\n\n"
            f"{'='*60}\n"
            f"RESEARCH DATA GATHERED:\n"
            f"{'='*60}\n\n"
            f"{raw_content}\n\n"
            f"{'='*60}\n"
            f"ANALYSIS REQUIREMENTS:\n"
            f"{'='*60}\n\n"
            f"{prompt}"
        )
        task_name = f"{task_name}_synth"
        print(f"Synthesis prompt built: {len(prompt)} chars ({len(prompt.split())} words)\n")

    # Prepend context if provided (for Team 5 which needs Teams 1-4 output)
    if args.context:
        print("Loading context files...")
        context_text = load_context_files(args.context)
        if context_text:
            prompt = (
                f"CONTEXT FROM PRIOR RESEARCH (use this as background knowledge):\n\n"
                f"{context_text}\n\n"
                f"{'='*60}\n\n"
                f"YOUR RESEARCH TASK:\n\n"
                f"{prompt}"
            )
            print(f"Context prepended: {len(context_text)} chars added to prompt\n")

    if args.dry_run:
        print(f"Task: {task_name}")
        print(f"Preset: {args.preset}")
        print(f"Prompt ({len(prompt)} chars, {len(prompt.split())} words):")
        print(f"{'='*40}")
        print(prompt[:2000])
        if len(prompt) > 2000:
            print(f"\n... ({len(prompt) - 2000} more chars)")
        print(f"{'='*40}")
        return

    # Run the research
    result = run_research(prompt, preset=args.preset, max_output_tokens=args.max_output_tokens)

    # Save output
    output_file = save_output(task_name, result, prompt, preset=args.preset)

    print(f"\nDone! Review output at: {output_file}")


if __name__ == "__main__":
    main()
