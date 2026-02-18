#!/usr/bin/env python3
"""
Test RAG retrieval against the Supabase knowledge_chunks table.
Runs semantic search and hybrid search for test queries.

Usage: python3 scripts/test_rag_retrieval.py
       python3 scripts/test_rag_retrieval.py "your custom query"
"""

import os
import sys

from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
EMBEDDING_MODEL = "text-embedding-3-small"

# Default test queries from build plan
TEST_QUERIES = [
    "How should I pace my 1km runs between stations?",
    "What's the best sled push technique?",
    "How much protein should I eat daily?",
    "What does a typical Hyrox training week look like?",
    "How do I improve my SkiErg performance?",
]


def embed_query(openai_client, query):
    """Embed a query string."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=query,
    )
    return response.data[0].embedding


def semantic_search(supabase_client, embedding, threshold=0.70, count=5):
    """Call match_chunks RPC for semantic search."""
    result = supabase_client.rpc(
        "match_chunks",
        {
            "query_embedding": embedding,
            "match_threshold": threshold,
            "match_count": count,
        },
    ).execute()
    return result.data


def hybrid_search(supabase_client, query_text, embedding, count=5):
    """Call hybrid_search_chunks RPC for combined semantic + keyword search."""
    result = supabase_client.rpc(
        "hybrid_search_chunks",
        {
            "query_text": query_text,
            "query_embedding": embedding,
            "match_count": count,
            "full_text_weight": 1.0,
            "semantic_weight": 1.0,
            "rrf_k": 50,
        },
    ).execute()
    return result.data


def print_results(results, search_type, score_field):
    """Pretty-print search results."""
    if not results:
        print(f"  No results found via {search_type}")
        return

    for i, r in enumerate(results):
        score = r.get(score_field, 0)
        chunk_id = r.get("id", "?")
        source = r.get("source_name", "?")
        tags = r.get("topic_tags", [])
        content_preview = r.get("content", "")[:120].replace("\n", " ")

        print(f"  [{i+1}] {chunk_id} ({score:.4f}) — {source}")
        print(f"      Tags: {', '.join(tags[:4])}")
        print(f"      \"{content_preview}...\"")
        print()


def run_test(openai_client, supabase_client, query):
    """Run both search methods on a single query."""
    print(f"\n{'='*70}")
    print(f"QUERY: \"{query}\"")
    print(f"{'='*70}")

    # Embed
    embedding = embed_query(openai_client, query)

    # Semantic search
    print(f"\n--- Semantic Search (cosine similarity, threshold=0.70) ---")
    semantic_results = semantic_search(supabase_client, embedding)
    print_results(semantic_results, "semantic", "similarity")

    # Hybrid search
    print(f"--- Hybrid Search (RRF: semantic + full-text) ---")
    hybrid_results = hybrid_search(supabase_client, query, embedding)
    print_results(hybrid_results, "hybrid", "score")


def main():
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Use custom query if provided, otherwise run all test queries
    if len(sys.argv) > 1:
        queries = [" ".join(sys.argv[1:])]
    else:
        queries = TEST_QUERIES

    for query in queries:
        run_test(openai_client, supabase_client, query)

    print(f"\n{'='*70}")
    print(f"Tested {len(queries)} queries. Review results above for relevance.")


if __name__ == "__main__":
    main()
