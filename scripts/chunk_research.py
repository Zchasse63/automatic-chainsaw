#!/usr/bin/env python3
"""
Research Document Chunker
=========================
Splits research outputs into semantically coherent chunks for RAG embedding.

Chunking strategy:
  1. Strip metadata headers (lines 1-7) and everything after "## Original Prompt" or "## Sources"
  2. Split on ## headers as primary boundaries
  3. If a chunk exceeds MAX_TOKENS, split further at ### boundaries
  4. If still too large, split at paragraph boundaries
  5. Add metadata (source_doc, section, topic_tags) to each chunk

Usage:
    python scripts/chunk_research.py
    python scripts/chunk_research.py --max-tokens 600
    python scripts/chunk_research.py --dry-run
"""

import json
import re
import sys
import argparse
from pathlib import Path

# Configuration
MAX_TOKENS = 800       # Target max tokens per chunk
MIN_TOKENS = 50        # Skip chunks smaller than this (metadata remnants)
OVERLAP_TOKENS = 50    # Overlap between split chunks for context continuity
WORDS_PER_TOKEN = 0.75 # Conservative: 1 token ≈ 0.75 words (for estimation)

# Files to process — the "best" version of each research output
# Order matters for consistent chunk IDs
RESEARCH_FILES = [
    "team1a_20260213_083023.md",
    "team1b_20260213_083055.md",
    "team1c_20260213_083157.md",
    "team2_20260213_080811.md",
    "team2b_synth_20260213_095326.md",
    "team3a_synth_20260213_084405.md",
    "team3b_synth_20260213_084339.md",
    "team3c_20260213_084530.md",
    "team4_20260213_080706.md",
    "team4b_20260213_094018.md",
    "team5_20260213_085131.md",
    "team5b_20260213_095752.md",
    "team6_20260213_084526.md",
    "team7_20260213_094819.md",
    "team8_20260213_095240.md",
]

# Friendly names for source docs (used in chunk metadata)
DOC_NAMES = {
    "team1a": "Event Format & Benchmarks",
    "team1b": "Pacing & Race Execution",
    "team1c": "Station Breakdown",
    "team2": "Elite Athletes",
    "team2b_synth": "Elite Athletes (Completion)",
    "team3a_synth": "Training Programs: PRVN/HWPO/CompTrain",
    "team3b_synth": "Training Programs: Persist/Hybrid/BPN",
    "team3c": "Training Programs: CrossFit-Hyrox Crossover",
    "team4": "Sports Science & Aerobic Frameworks",
    "team4b": "Recovery Science & Testing Protocols",
    "team5": "16-Week Periodization Blueprint",
    "team5b": "Autoregulation & Adaptive Programming",
    "team6": "RAG System & AI Coach Architecture",
    "team7": "Workout Construction Rules",
    "team8": "Daily Nutrition & Recovery",
}

# Topic tag mapping — helps with filtered retrieval
DOC_TOPICS = {
    "team1a": ["hyrox", "event_format", "benchmarks", "performance_tiers"],
    "team1b": ["pacing", "race_execution", "transitions", "race_strategy"],
    "team1c": ["stations", "technique", "skierg", "sled_push", "sled_pull", "rowing", "burpee_broad_jump", "farmers_carry", "lunges", "wall_balls"],
    "team2": ["elite_athletes", "training_methods", "competition"],
    "team2b_synth": ["elite_athletes", "crossfit_translation", "station_training"],
    "team3a_synth": ["training_programs", "prvn", "hwpo", "comptrain"],
    "team3b_synth": ["training_programs", "persist", "hybrid", "bpn"],
    "team3c": ["crossfit", "hyrox", "running", "program_comparison"],
    "team4": ["sports_science", "energy_systems", "aerobic_capacity", "concurrent_training"],
    "team4b": ["recovery", "testing", "sleep", "mobility", "overtraining", "nutrition"],
    "team5": ["periodization", "16_week_plan", "training_phases", "hiit_workouts", "simulation"],
    "team5b": ["autoregulation", "rpe", "readiness", "adaptation", "missed_sessions"],
    "team6": ["architecture", "rag", "system_design", "engineering"],
    "team7": ["workout_construction", "emom", "amrap", "intervals", "movement_pairing", "equipment_substitution", "scaling"],
    "team8": ["nutrition", "macros", "hydration", "supplements", "sleep", "recovery_modalities"],
}

COMPLETED_DIR = Path("docs/research/completed")
OUTPUT_DIR = Path("docs/chunks")


def estimate_tokens(text: str) -> int:
    """Estimate token count from text. Conservative: 1 word ≈ 1.3 tokens."""
    return int(len(text.split()) * 1.3)


def extract_content(filepath: Path) -> str:
    """Extract usable research content, stripping metadata and prompt echoes."""
    text = filepath.read_text(encoding="utf-8")
    lines = text.split("\n")

    content_lines = []
    in_content = False

    for line in lines:
        # Start after first --- separator (skip metadata block)
        if line.strip() == "---" and not in_content:
            in_content = True
            continue

        # Stop at these boundaries — everything after is waste
        if in_content and line.startswith("## Original Prompt"):
            break
        if in_content and line.startswith("## Sources"):
            break

        if in_content:
            content_lines.append(line)

    return "\n".join(content_lines).strip()


def split_by_headers(content: str, level: str = "## ") -> list[dict]:
    """Split content by markdown headers at the given level.

    Returns list of {header, content} dicts.
    """
    sections = []
    current_header = ""
    current_lines = []

    for line in content.split("\n"):
        if line.startswith(level) and not line.startswith(level + "#"):
            # Save previous section
            if current_lines:
                sections.append({
                    "header": current_header,
                    "content": "\n".join(current_lines).strip(),
                })
            current_header = line.lstrip("#").strip()
            current_lines = []
        else:
            current_lines.append(line)

    # Don't forget the last section
    if current_lines:
        sections.append({
            "header": current_header,
            "content": "\n".join(current_lines).strip(),
        })

    return sections


def split_by_paragraphs(text: str, max_tokens: int, overlap_tokens: int) -> list[str]:
    """Split text into paragraph-boundary chunks that fit within max_tokens."""
    paragraphs = re.split(r"\n\n+", text)
    chunks = []
    current_chunk = []
    current_tokens = 0

    for para in paragraphs:
        para_tokens = estimate_tokens(para)

        if current_tokens + para_tokens > max_tokens and current_chunk:
            chunks.append("\n\n".join(current_chunk))

            # Overlap: keep last paragraph for context
            if overlap_tokens > 0 and current_chunk:
                last = current_chunk[-1]
                if estimate_tokens(last) <= overlap_tokens:
                    current_chunk = [last]
                    current_tokens = estimate_tokens(last)
                else:
                    current_chunk = []
                    current_tokens = 0
            else:
                current_chunk = []
                current_tokens = 0

        current_chunk.append(para)
        current_tokens += para_tokens

    if current_chunk:
        chunks.append("\n\n".join(current_chunk))

    return chunks


def merge_small_chunks(raw_chunks: list[dict], max_tokens: int, min_tokens: int) -> list[dict]:
    """Merge consecutive small chunks from the same parent section.

    If two adjacent chunks are both under min_tokens and their combined size
    fits within max_tokens, merge them. This prevents overly granular chunks
    while preserving semantic boundaries.
    """
    if not raw_chunks:
        return []

    merged = [raw_chunks[0]]

    for chunk in raw_chunks[1:]:
        prev = merged[-1]

        # Merge candidates: both small, same doc, combined fits in max
        combined_tokens = prev["est_tokens"] + chunk["est_tokens"]
        same_doc = prev["source_doc"] == chunk["source_doc"]

        if (prev["est_tokens"] < min_tokens and same_doc and combined_tokens <= max_tokens):
            # Merge: combine content, update metadata
            merged_content = prev["content"] + "\n\n" + chunk["content"]
            merged_header = prev["section"]
            if chunk["section"] and chunk["section"] != prev["section"]:
                merged_header = f"{prev['section']} + {chunk['section']}"
            merged[-1] = {
                **prev,
                "section": merged_header,
                "content": merged_content,
                "word_count": len(merged_content.split()),
                "est_tokens": estimate_tokens(merged_content),
            }
        else:
            merged.append(chunk)

    return merged


def chunk_document(filepath: Path, max_tokens: int) -> list[dict]:
    """Chunk a single research document into semantically coherent pieces."""
    # Derive doc key from filename (e.g., "team1a_20260213_083023.md" → "team1a")
    filename = filepath.name
    doc_key = filename.split("_202")[0]  # Split at the timestamp

    content = extract_content(filepath)
    if not content:
        print(f"  WARNING: No content extracted from {filename}")
        return []

    # Split by ## headers first
    sections = split_by_headers(content, "## ")

    raw_chunks = []
    chunk_index = 0

    for section in sections:
        header = section["header"]
        text = section["content"]
        tokens = estimate_tokens(text)

        if tokens < MIN_TOKENS:
            continue

        if tokens <= max_tokens:
            # Section fits in one chunk
            raw_chunks.append({
                "id": f"{doc_key}_{chunk_index:03d}",
                "source_doc": filename,
                "source_name": DOC_NAMES.get(doc_key, doc_key),
                "section": header,
                "content": text,
                "word_count": len(text.split()),
                "est_tokens": tokens,
                "topic_tags": DOC_TOPICS.get(doc_key, []),
                "chunk_index": chunk_index,
            })
            chunk_index += 1
        else:
            # Too large — try splitting by ### headers
            subsections = split_by_headers(text, "### ")

            for sub in subsections:
                sub_header = sub["header"]
                sub_text = sub["content"]
                sub_tokens = estimate_tokens(sub_text)

                if sub_tokens < MIN_TOKENS:
                    continue

                display_header = f"{header} > {sub_header}" if sub_header else header

                if sub_tokens <= max_tokens:
                    raw_chunks.append({
                        "id": f"{doc_key}_{chunk_index:03d}",
                        "source_doc": filename,
                        "source_name": DOC_NAMES.get(doc_key, doc_key),
                        "section": display_header,
                        "content": sub_text,
                        "word_count": len(sub_text.split()),
                        "est_tokens": sub_tokens,
                        "topic_tags": DOC_TOPICS.get(doc_key, []),
                        "chunk_index": chunk_index,
                    })
                    chunk_index += 1
                else:
                    # Still too large — split by paragraphs
                    para_chunks = split_by_paragraphs(sub_text, max_tokens, OVERLAP_TOKENS)
                    for i, pc in enumerate(para_chunks):
                        pc_tokens = estimate_tokens(pc)
                        if pc_tokens < MIN_TOKENS:
                            continue
                        part_header = f"{display_header} (part {i+1}/{len(para_chunks)})"
                        raw_chunks.append({
                            "id": f"{doc_key}_{chunk_index:03d}",
                            "source_doc": filename,
                            "source_name": DOC_NAMES.get(doc_key, doc_key),
                            "section": part_header,
                            "content": pc,
                            "word_count": len(pc.split()),
                            "est_tokens": pc_tokens,
                            "topic_tags": DOC_TOPICS.get(doc_key, []),
                            "chunk_index": chunk_index,
                        })
                        chunk_index += 1

    # Merge pass: combine consecutive small chunks from the same document
    MERGE_THRESHOLD = 300  # Merge chunks under this size with their neighbor
    merged = merge_small_chunks(raw_chunks, max_tokens, MERGE_THRESHOLD)

    # Re-index after merging
    for i, chunk in enumerate(merged):
        chunk["id"] = f"{doc_key}_{i:03d}"
        chunk["chunk_index"] = i

    return merged


def main():
    parser = argparse.ArgumentParser(description="Chunk research documents for RAG embedding")
    parser.add_argument("--max-tokens", type=int, default=MAX_TOKENS,
                        help=f"Maximum tokens per chunk (default: {MAX_TOKENS})")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print stats without saving")
    args = parser.parse_args()

    all_chunks = []
    doc_stats = []

    print(f"Chunking research documents (max {args.max_tokens} tokens/chunk)")
    print(f"{'='*60}\n")

    for filename in RESEARCH_FILES:
        filepath = COMPLETED_DIR / filename
        if not filepath.exists():
            print(f"  SKIP: {filename} not found")
            continue

        chunks = chunk_document(filepath, args.max_tokens)
        all_chunks.extend(chunks)

        doc_key = filename.split("_202")[0]
        total_words = sum(c["word_count"] for c in chunks)
        total_tokens = sum(c["est_tokens"] for c in chunks)
        avg_tokens = total_tokens // len(chunks) if chunks else 0

        doc_stats.append({
            "doc": doc_key,
            "name": DOC_NAMES.get(doc_key, doc_key),
            "chunks": len(chunks),
            "total_words": total_words,
            "total_tokens": total_tokens,
            "avg_tokens": avg_tokens,
        })

        print(f"  {doc_key}: {len(chunks)} chunks, {total_words:,} words, ~{total_tokens:,} tokens (avg {avg_tokens}/chunk)")

    print(f"\n{'='*60}")
    print(f"Total: {len(all_chunks)} chunks")
    print(f"Total words: {sum(c['word_count'] for c in all_chunks):,}")
    print(f"Total est. tokens: {sum(c['est_tokens'] for c in all_chunks):,}")
    avg = sum(c["est_tokens"] for c in all_chunks) // len(all_chunks) if all_chunks else 0
    print(f"Average tokens/chunk: {avg}")

    # Token distribution
    brackets = {"<200": 0, "200-400": 0, "400-600": 0, "600-800": 0, ">800": 0}
    for c in all_chunks:
        t = c["est_tokens"]
        if t < 200:
            brackets["<200"] += 1
        elif t < 400:
            brackets["200-400"] += 1
        elif t < 600:
            brackets["400-600"] += 1
        elif t <= 800:
            brackets["600-800"] += 1
        else:
            brackets[">800"] += 1

    print(f"\nToken distribution:")
    for bracket, count in brackets.items():
        bar = "█" * (count // 2)
        print(f"  {bracket:>8}: {count:>3} {bar}")

    if args.dry_run:
        print("\n[DRY RUN] No files saved.")
        return

    # Save chunks
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    chunks_file = OUTPUT_DIR / "all_chunks.json"
    with open(chunks_file, "w") as f:
        json.dump(all_chunks, f, indent=2, ensure_ascii=False)
    print(f"\nChunks saved to: {chunks_file}")

    # Save stats
    stats_file = OUTPUT_DIR / "chunk_stats.md"
    with open(stats_file, "w") as f:
        f.write("# Chunk Statistics\n\n")
        f.write(f"**Generated**: {__import__('datetime').datetime.now().isoformat()}\n")
        f.write(f"**Max tokens/chunk**: {args.max_tokens}\n")
        f.write(f"**Total chunks**: {len(all_chunks)}\n")
        f.write(f"**Total words**: {sum(c['word_count'] for c in all_chunks):,}\n")
        f.write(f"**Total est. tokens**: {sum(c['est_tokens'] for c in all_chunks):,}\n")
        f.write(f"**Average tokens/chunk**: {avg}\n\n")

        f.write("## Per-Document Breakdown\n\n")
        f.write("| Document | Chunks | Words | Est. Tokens | Avg Tokens |\n")
        f.write("|----------|:------:|------:|:-----------:|:----------:|\n")
        for s in doc_stats:
            f.write(f"| {s['doc']} — {s['name']} | {s['chunks']} | {s['total_words']:,} | {s['total_tokens']:,} | {s['avg_tokens']} |\n")
        f.write(f"| **Total** | **{len(all_chunks)}** | **{sum(c['word_count'] for c in all_chunks):,}** | **{sum(c['est_tokens'] for c in all_chunks):,}** | **{avg}** |\n")

        f.write("\n## Token Distribution\n\n")
        f.write("| Range | Count |\n")
        f.write("|-------|------:|\n")
        for bracket, count in brackets.items():
            f.write(f"| {bracket} | {count} |\n")

    print(f"Stats saved to: {stats_file}")


if __name__ == "__main__":
    main()
