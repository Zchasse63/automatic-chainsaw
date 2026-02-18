#!/usr/bin/env python3
"""
Embed all 239 research chunks via OpenAI text-embedding-3-small
and upload them to Supabase knowledge_chunks table.

Usage: python3 scripts/embed_and_upload.py
"""

import json
import os
import sys
import time

from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

# Load environment
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

CHUNKS_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "chunks", "all_chunks.json")
EMBEDDING_MODEL = "text-embedding-3-small"
BATCH_SIZE = 100  # OpenAI supports up to 2048 inputs per request


def load_chunks():
    """Load all chunks from all_chunks.json."""
    with open(CHUNKS_PATH, "r") as f:
        chunks = json.load(f)
    print(f"Loaded {len(chunks)} chunks from {CHUNKS_PATH}")
    return chunks


def prepare_embedding_text(chunk):
    """Prepend structural context before embedding for better retrieval."""
    source = chunk.get("source_name", "")
    section = chunk.get("section", "")
    content = chunk.get("content", "")
    return f"# {source}\n## {section}\n\n{content}"


def batch_embed(openai_client, texts, batch_size=BATCH_SIZE):
    """Embed texts in batches via OpenAI API."""
    all_embeddings = []
    total_tokens = 0

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (len(texts) + batch_size - 1) // batch_size

        print(f"  Embedding batch {batch_num}/{total_batches} ({len(batch)} chunks)...")

        response = openai_client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=batch,
        )

        batch_embeddings = [item.embedding for item in response.data]
        all_embeddings.extend(batch_embeddings)
        total_tokens += response.usage.total_tokens

        if batch_num < total_batches:
            time.sleep(0.5)  # Rate limit courtesy

    print(f"  Total tokens used: {total_tokens:,} (cost: ~${total_tokens * 0.02 / 1_000_000:.4f})")
    return all_embeddings


def upload_to_supabase(supabase_client, chunks, embeddings):
    """Insert chunks with embeddings into knowledge_chunks table."""
    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append({
            "id": chunk["id"],
            "source_doc": chunk["source_doc"],
            "source_name": chunk.get("source_name"),
            "section": chunk.get("section"),
            "content": chunk["content"],
            "topic_tags": chunk.get("topic_tags", []),
            "chunk_index": chunk.get("chunk_index"),
            "word_count": chunk.get("word_count"),
            "est_tokens": chunk.get("est_tokens"),
            "embedding": embedding,
        })

    # Upload in batches of 50 (Supabase REST API limit)
    upload_batch_size = 50
    uploaded = 0

    for i in range(0, len(rows), upload_batch_size):
        batch = rows[i : i + upload_batch_size]
        result = supabase_client.table("knowledge_chunks").upsert(batch).execute()
        uploaded += len(batch)
        print(f"  Uploaded {uploaded}/{len(rows)} rows...")

    return uploaded


def verify_upload(supabase_client, expected_count):
    """Verify the upload by counting rows."""
    result = supabase_client.table("knowledge_chunks").select("id", count="exact").execute()
    actual = result.count
    print(f"\nVerification: {actual} rows in knowledge_chunks (expected {expected_count})")
    if actual == expected_count:
        print("All chunks uploaded successfully!")
    else:
        print(f"WARNING: Expected {expected_count} but found {actual}")
    return actual == expected_count


def main():
    # Validate env
    missing = []
    if not SUPABASE_URL:
        missing.append("SUPABASE_URL")
    if not SUPABASE_KEY:
        missing.append("SUPABASE_ANON_KEY")
    if not OPENAI_API_KEY:
        missing.append("OPENAI_API_KEY")
    if missing:
        print(f"ERROR: Missing environment variables: {', '.join(missing)}")
        print("Make sure .env is configured correctly.")
        sys.exit(1)

    # Initialize clients
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Load chunks
    chunks = load_chunks()

    # Prepare texts for embedding
    print("\nPreparing texts with structural context...")
    texts = [prepare_embedding_text(c) for c in chunks]
    avg_len = sum(len(t) for t in texts) / len(texts)
    print(f"  Average text length: {avg_len:.0f} chars")

    # Embed all chunks
    print(f"\nEmbedding {len(texts)} chunks via {EMBEDDING_MODEL}...")
    embeddings = batch_embed(openai_client, texts)
    print(f"  Generated {len(embeddings)} embeddings (dim={len(embeddings[0])})")

    # Upload to Supabase
    print(f"\nUploading to Supabase ({SUPABASE_URL})...")
    uploaded = upload_to_supabase(supabase_client, chunks, embeddings)

    # Verify
    verify_upload(supabase_client, len(chunks))

    print("\nDone! Knowledge base is ready for RAG queries.")


if __name__ == "__main__":
    main()
