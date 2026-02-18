#!/usr/bin/env python3
"""Combine all raw JSONL training files into shuffled train/eval split."""

import json
import os
import random
import glob

RAW_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs', 'training-data', 'raw')
COMBINED_DIR = os.path.join(os.path.dirname(__file__), '..', 'docs', 'training-data', 'combined')
SEED = 42
EVAL_RATIO = 0.10

def load_all_examples():
    """Load and validate all JSONL files from raw directory."""
    examples = []
    file_stats = {}

    for filepath in sorted(glob.glob(os.path.join(RAW_DIR, '*.jsonl'))):
        basename = os.path.basename(filepath)
        count = 0
        with open(filepath) as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                    if 'messages' not in obj:
                        print(f"  WARNING: {basename}:{line_num} - missing 'messages' key")
                        continue
                    msgs = obj['messages']
                    if len(msgs) < 2:
                        print(f"  WARNING: {basename}:{line_num} - fewer than 2 messages")
                        continue
                    # Tag with source for tracking
                    obj['_source'] = basename
                    examples.append(obj)
                    count += 1
                except json.JSONDecodeError as e:
                    print(f"  ERROR: {basename}:{line_num} - invalid JSON: {e}")

        file_stats[basename] = count
        print(f"  {basename}: {count} examples")

    return examples, file_stats


def estimate_tokens(text):
    """Rough token estimate: ~4 chars per token for English."""
    return len(text) // 4


def compute_stats(examples):
    """Compute token statistics for the dataset."""
    token_counts = []
    for ex in examples:
        total_text = ""
        for msg in ex['messages']:
            total_text += msg.get('content', '')
        token_counts.append(estimate_tokens(total_text))

    return {
        'count': len(token_counts),
        'total_tokens': sum(token_counts),
        'avg_tokens': sum(token_counts) // len(token_counts) if token_counts else 0,
        'min_tokens': min(token_counts) if token_counts else 0,
        'max_tokens': max(token_counts) if token_counts else 0,
    }


def main():
    print("=" * 60)
    print("Combining JSONL training data")
    print("=" * 60)

    # Load all examples
    print(f"\nLoading from: {os.path.abspath(RAW_DIR)}")
    examples, file_stats = load_all_examples()
    print(f"\nTotal loaded: {len(examples)} examples from {len(file_stats)} files")

    # Shuffle deterministically
    random.seed(SEED)
    random.shuffle(examples)

    # Split
    eval_count = max(1, int(len(examples) * EVAL_RATIO))
    eval_examples = examples[:eval_count]
    train_examples = examples[eval_count:]

    print(f"\nSplit: {len(train_examples)} train / {len(eval_examples)} eval ({EVAL_RATIO*100:.0f}%)")

    # Remove _source tag before writing
    def clean(ex):
        ex_copy = {k: v for k, v in ex.items() if k != '_source'}
        return ex_copy

    # Write train.jsonl
    os.makedirs(COMBINED_DIR, exist_ok=True)
    train_path = os.path.join(COMBINED_DIR, 'train.jsonl')
    with open(train_path, 'w') as f:
        for ex in train_examples:
            f.write(json.dumps(clean(ex), ensure_ascii=False) + '\n')

    # Write eval.jsonl
    eval_path = os.path.join(COMBINED_DIR, 'eval.jsonl')
    with open(eval_path, 'w') as f:
        for ex in eval_examples:
            f.write(json.dumps(clean(ex), ensure_ascii=False) + '\n')

    # Also write all.jsonl (for Nebius fine-tuning)
    all_path = os.path.join(COMBINED_DIR, 'all.jsonl')
    with open(all_path, 'w') as f:
        for ex in examples:
            f.write(json.dumps(clean(ex), ensure_ascii=False) + '\n')

    # Stats
    train_stats = compute_stats(train_examples)
    eval_stats = compute_stats(eval_examples)
    all_stats = compute_stats(examples)

    print(f"\n{'=' * 60}")
    print(f"DATASET STATISTICS")
    print(f"{'=' * 60}")
    print(f"{'':20s} {'Train':>10s} {'Eval':>10s} {'Total':>10s}")
    print(f"{'-' * 50}")
    print(f"{'Examples':20s} {train_stats['count']:10d} {eval_stats['count']:10d} {all_stats['count']:10d}")
    print(f"{'Total tokens (est)':20s} {train_stats['total_tokens']:10,d} {eval_stats['total_tokens']:10,d} {all_stats['total_tokens']:10,d}")
    print(f"{'Avg tokens/example':20s} {train_stats['avg_tokens']:10d} {eval_stats['avg_tokens']:10d} {all_stats['avg_tokens']:10d}")
    print(f"{'Min tokens':20s} {train_stats['min_tokens']:10d} {eval_stats['min_tokens']:10d} {all_stats['min_tokens']:10d}")
    print(f"{'Max tokens':20s} {train_stats['max_tokens']:10d} {eval_stats['max_tokens']:10d} {all_stats['max_tokens']:10d}")

    # Cost estimate
    training_tokens = all_stats['total_tokens'] * 3  # 3 epochs
    cost_per_m = 2.80  # $2.80 per 1M tokens for Llama 3.3 70B on Nebius
    estimated_cost = max(2.00, (training_tokens / 1_000_000) * cost_per_m)

    print(f"\n{'=' * 60}")
    print(f"COST ESTIMATE (Nebius LoRA SFT)")
    print(f"{'=' * 60}")
    print(f"Dataset tokens:     {all_stats['total_tokens']:,}")
    print(f"Epochs:             3")
    print(f"Training tokens:    {training_tokens:,}")
    print(f"Rate:               $2.80 / 1M tokens (Llama 3.3 70B)")
    print(f"Estimated cost:     ${estimated_cost:.2f}")
    print(f"Minimum charge:     $2.00")

    # File sizes
    train_size = os.path.getsize(train_path)
    eval_size = os.path.getsize(eval_path)
    all_size = os.path.getsize(all_path)

    print(f"\nFiles written:")
    print(f"  {train_path} ({train_size:,} bytes)")
    print(f"  {eval_path} ({eval_size:,} bytes)")
    print(f"  {all_path} ({all_size:,} bytes)")

    # Verify eval has representation from different sources
    eval_sources = {}
    for ex in eval_examples:
        src = ex.get('_source', 'unknown')
        eval_sources[src] = eval_sources.get(src, 0) + 1

    print(f"\nEval set source distribution:")
    for src, cnt in sorted(eval_sources.items()):
        print(f"  {src}: {cnt}")


if __name__ == '__main__':
    main()
