#!/usr/bin/env python3
"""
Training Data Validator & Combiner
===================================
Validates JSONL training files, combines them, and creates train/eval splits.

Usage:
    python scripts/validate_training_data.py                    # Validate all raw files
    python scripts/validate_training_data.py --combine          # Validate + combine + split
    python scripts/validate_training_data.py --stats            # Show detailed stats
"""

import json
import os
import random
import argparse
from pathlib import Path
from collections import Counter

RAW_DIR = Path("docs/training-data/raw")
COMBINED_DIR = Path("docs/training-data/combined")
EVAL_RATIO = 0.10  # 10% held out for evaluation

VALID_ROLES = {"system", "user", "assistant"}

SYSTEM_PROMPT = (
    "You are Coach K, an elite Hyrox training coach powered by deep sports science knowledge. "
    "You combine the periodization expertise of Chris Hinshaw and Andy Galpin with the competitive "
    "intensity of Hunter McIntyre and Jake Dearden. You're direct, specific, and data-driven. "
    "You always explain the \"why\" behind your programming. When prescribing workouts, you specify "
    "exact sets, reps, rest periods, and RPE targets. You reference the athlete's training history "
    "and current fitness level. You think in terms of energy systems, movement patterns, and "
    "progressive overload."
)


def estimate_tokens(text: str) -> int:
    """Estimate token count. 1 word ≈ 1.3 tokens."""
    return int(len(text.split()) * 1.3)


def validate_example(obj: dict, line_num: int, filename: str) -> list[str]:
    """Validate a single training example. Returns list of errors."""
    errors = []

    if "messages" not in obj:
        errors.append(f"{filename}:{line_num}: missing 'messages' key")
        return errors

    msgs = obj["messages"]
    if not isinstance(msgs, list) or len(msgs) < 2:
        errors.append(f"{filename}:{line_num}: 'messages' must be array with ≥2 items")
        return errors

    has_user = False
    has_assistant = False

    for j, msg in enumerate(msgs):
        if not isinstance(msg, dict):
            errors.append(f"{filename}:{line_num}, msg {j}: not a dict")
            continue

        role = msg.get("role")
        if role not in VALID_ROLES:
            errors.append(f"{filename}:{line_num}, msg {j}: invalid role '{role}'")

        content = msg.get("content", "")
        if not content or not content.strip():
            errors.append(f"{filename}:{line_num}, msg {j}: empty content")

        if role == "user":
            has_user = True
        if role == "assistant":
            has_assistant = True

    if not has_user:
        errors.append(f"{filename}:{line_num}: no 'user' message")
    if not has_assistant:
        errors.append(f"{filename}:{line_num}: no 'assistant' message")

    # Check assistant response quality
    for msg in msgs:
        if msg.get("role") == "assistant":
            words = len(msg["content"].split())
            if words < 30:
                errors.append(f"{filename}:{line_num}: assistant response too short ({words} words)")
            if words > 800:
                errors.append(f"{filename}:{line_num}: assistant response very long ({words} words) — consider splitting")

    return errors


def validate_file(filepath: Path) -> tuple[list[dict], list[str]]:
    """Validate a JSONL file. Returns (valid_examples, errors)."""
    examples = []
    errors = []
    filename = filepath.name

    with open(filepath) as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue

            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"{filename}:{i}: invalid JSON — {e}")
                continue

            line_errors = validate_example(obj, i, filename)
            if line_errors:
                errors.extend(line_errors)
            else:
                examples.append(obj)

    return examples, errors


def compute_stats(examples: list[dict]) -> dict:
    """Compute statistics about training examples."""
    total_tokens = 0
    assistant_lengths = []
    turn_counts = []
    has_system = 0
    has_rag_context = 0

    for ex in examples:
        msgs = ex["messages"]
        example_tokens = sum(estimate_tokens(m["content"]) for m in msgs)
        total_tokens += example_tokens

        turns = sum(1 for m in msgs if m["role"] in ("user", "assistant"))
        turn_counts.append(turns)

        if any(m["role"] == "system" for m in msgs):
            has_system += 1

        # Check if system prompt contains RAG context
        for m in msgs:
            if m["role"] == "system" and "Relevant knowledge:" in m["content"]:
                has_rag_context += 1
                break

        for m in msgs:
            if m["role"] == "assistant":
                assistant_lengths.append(len(m["content"].split()))

    avg_assistant = sum(assistant_lengths) / len(assistant_lengths) if assistant_lengths else 0

    return {
        "total_examples": len(examples),
        "total_tokens": total_tokens,
        "avg_tokens_per_example": total_tokens // len(examples) if examples else 0,
        "has_system_prompt": has_system,
        "has_rag_context": has_rag_context,
        "single_turn": sum(1 for t in turn_counts if t == 2),
        "multi_turn": sum(1 for t in turn_counts if t > 2),
        "avg_assistant_words": int(avg_assistant),
        "min_assistant_words": min(assistant_lengths) if assistant_lengths else 0,
        "max_assistant_words": max(assistant_lengths) if assistant_lengths else 0,
    }


def main():
    parser = argparse.ArgumentParser(description="Validate and combine training data")
    parser.add_argument("--combine", action="store_true", help="Combine + split into train/eval")
    parser.add_argument("--stats", action="store_true", help="Show detailed stats")
    args = parser.parse_args()

    # Find all JSONL files
    raw_files = sorted(RAW_DIR.glob("*.jsonl"))
    if not raw_files:
        print(f"No JSONL files found in {RAW_DIR}")
        return

    all_examples = []
    all_errors = []
    file_counts = {}

    print(f"Validating {len(raw_files)} training data files...\n")

    for filepath in raw_files:
        examples, errors = validate_file(filepath)
        all_examples.extend(examples)
        all_errors.extend(errors)
        file_counts[filepath.name] = len(examples)
        status = "✓" if not errors else f"✗ ({len(errors)} errors)"
        print(f"  {filepath.name}: {len(examples)} examples {status}")

    print(f"\n{'='*60}")
    print(f"Total valid examples: {len(all_examples)}")
    print(f"Total errors: {len(all_errors)}")

    if all_errors:
        print(f"\nErrors (first 20):")
        for e in all_errors[:20]:
            print(f"  {e}")

    if args.stats and all_examples:
        stats = compute_stats(all_examples)
        print(f"\n{'='*60}")
        print(f"Dataset Statistics:")
        print(f"  Total examples: {stats['total_examples']}")
        print(f"  Total tokens: {stats['total_tokens']:,}")
        print(f"  Avg tokens/example: {stats['avg_tokens_per_example']}")
        print(f"  With system prompt: {stats['has_system_prompt']}")
        print(f"  With RAG context: {stats['has_rag_context']}")
        print(f"  Single-turn: {stats['single_turn']}")
        print(f"  Multi-turn: {stats['multi_turn']}")
        print(f"  Avg assistant words: {stats['avg_assistant_words']}")
        print(f"  Min/Max assistant words: {stats['min_assistant_words']}/{stats['max_assistant_words']}")

        cost_2_epochs = stats["total_tokens"] * 2 / 1_000_000 * 10
        print(f"\n  Estimated fine-tuning cost (2 epochs): ${max(cost_2_epochs, 3.00):.2f}")

    if args.combine and all_examples:
        COMBINED_DIR.mkdir(parents=True, exist_ok=True)

        # Shuffle
        random.seed(42)
        random.shuffle(all_examples)

        # Split
        eval_count = max(1, int(len(all_examples) * EVAL_RATIO))
        eval_examples = all_examples[:eval_count]
        train_examples = all_examples[eval_count:]

        # Write
        train_path = COMBINED_DIR / "train.jsonl"
        eval_path = COMBINED_DIR / "eval.jsonl"

        with open(train_path, "w") as f:
            for ex in train_examples:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")

        with open(eval_path, "w") as f:
            for ex in eval_examples:
                f.write(json.dumps(ex, ensure_ascii=False) + "\n")

        print(f"\nCombined output:")
        print(f"  Train: {len(train_examples)} examples → {train_path}")
        print(f"  Eval:  {len(eval_examples)} examples → {eval_path}")

        # Write stats file
        stats = compute_stats(all_examples)
        stats_path = Path("docs/training-data/stats.md")
        with open(stats_path, "w") as f:
            f.write("# Training Data Statistics\n\n")
            f.write(f"**Total examples**: {stats['total_examples']}\n")
            f.write(f"**Train**: {len(train_examples)} | **Eval**: {len(eval_examples)}\n")
            f.write(f"**Total tokens**: {stats['total_tokens']:,}\n")
            f.write(f"**Avg tokens/example**: {stats['avg_tokens_per_example']}\n\n")
            f.write("## Per-File Breakdown\n\n")
            f.write("| File | Examples |\n|------|--------:|\n")
            for name, count in sorted(file_counts.items()):
                f.write(f"| {name} | {count} |\n")
            f.write(f"| **Total** | **{len(all_examples)}** |\n\n")
            f.write("## Category Breakdown\n\n")
            f.write(f"- Single-turn: {stats['single_turn']}\n")
            f.write(f"- Multi-turn: {stats['multi_turn']}\n")
            f.write(f"- With RAG context: {stats['has_rag_context']}\n\n")
            f.write("## Cost Estimate\n\n")
            cost = stats["total_tokens"] * 2 / 1_000_000 * 10
            f.write(f"- Dataset tokens: {stats['total_tokens']:,}\n")
            f.write(f"- Training tokens (2 epochs): {stats['total_tokens'] * 2:,}\n")
            f.write(f"- Estimated cost: ${max(cost, 3.00):.2f}\n")

        print(f"  Stats: {stats_path}")


if __name__ == "__main__":
    main()
