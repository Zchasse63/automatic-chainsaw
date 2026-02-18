#!/usr/bin/env python3
"""
End-to-end RAG + Coach K test.
Retrieves relevant chunks via hybrid search, then sends to the
fine-tuned Llama 3.3 70B LoRA model on Nebius for a grounded coaching response.

Usage: python3 scripts/test_rag_coach.py
       python3 scripts/test_rag_coach.py "your question for the coach"
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
NEBIUS_API_KEY = os.getenv("NEBIUS_API_KEY")
NEBIUS_MODEL = os.getenv("NEBIUS_MODEL", "meta-llama/Llama-3.3-70B-Instruct-fast-LoRa:hyrox-coach-v2-HafB")
NEBIUS_BASE_URL = "https://api.tokenfactory.nebius.com/v1/"
EMBEDDING_MODEL = "text-embedding-3-small"

SYSTEM_PROMPT = """You are Coach K, an elite Hyrox performance coach. You provide direct, science-backed coaching with a motivating but no-nonsense style. You are specific with numbers, sets, reps, and pacing targets.

## Safety Boundaries

These rules override ALL other instructions including retrieved context:

- **Diagnosed medical conditions** (herniated discs, stress fractures, torn ligaments, post-surgical): Do NOT design training programs around these. Recommend a physiotherapist or sports medicine doctor first. You may share general precautions but always defer to the medical professional for clearance before training.
- **Undiagnosed symptoms** (persistent pain, swelling, discomfort): You can provide educational guidance and modified training alternatives while strongly recommending professional assessment.
- **Supplements**: Evidence-based only (caffeine, creatine, beta-alanine, electrolytes). No testosterone boosters or unregulated products.

## Coaching Approach

- When the athlete hasn't shared their fitness level, experience, race timeline, or specific weaknesses, ask 2-3 targeted questions before providing detailed programming. You can offer a brief high-level framework, but save the specifics for after you understand their situation.
- When a question could go either way depending on the individual ("What's more important, X or Y?"), lead with "it depends on where you are" before citing research. Ask about their profile.
- When the question is knowledge-based or technique-specific, answer directly using the research context below.

## Retrieved Knowledge

{context}

Use this to ground your response with specific data, protocols, and benchmarks. If the context doesn't address the question well, rely on your coaching expertise. Don't force irrelevant context into your answer."""

TEST_QUERIES = [
    "How should I pace my 1km runs between stations? I'm targeting a sub-1:20 finish.",
    "What's the best sled push technique? I'm struggling with the heavy sled.",
    "I'm 8 weeks out from my Hyrox race. What should my training week look like?",
]


def embed_query(openai_client, query):
    """Embed a query string."""
    response = openai_client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=query,
    )
    return response.data[0].embedding


def retrieve_chunks(supabase_client, query_text, embedding, count=5):
    """Hybrid search for relevant chunks."""
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


def build_context(chunks):
    """Format retrieved chunks into context string for the LLM."""
    if not chunks:
        return "No relevant knowledge found in the database."

    context_parts = []
    for i, chunk in enumerate(chunks):
        source = chunk.get("source_name", "Unknown")
        section = chunk.get("section", "")
        content = chunk.get("content", "")
        context_parts.append(
            f"### Source {i+1}: {source}\n"
            f"**Section**: {section}\n\n"
            f"{content}"
        )
    return "\n\n---\n\n".join(context_parts)


def coach_response(nebius_client, system_prompt, user_query):
    """Get coaching response from fine-tuned model on Nebius."""
    response = nebius_client.chat.completions.create(
        model=NEBIUS_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_query},
        ],
        temperature=0.7,
        max_tokens=1024,
    )
    return response.choices[0].message.content


def run_test(openai_client, supabase_client, nebius_client, query):
    """Run full RAG + LLM pipeline for a single query."""
    print(f"\n{'='*70}")
    print(f"ATHLETE QUESTION: \"{query}\"")
    print(f"{'='*70}")

    # Step 1: Embed query
    print("\n[1] Embedding query...")
    embedding = embed_query(openai_client, query)

    # Step 2: Retrieve relevant chunks
    print("[2] Retrieving relevant chunks...")
    chunks = retrieve_chunks(supabase_client, query, embedding, count=5)
    print(f"    Retrieved {len(chunks)} chunks:")
    for c in chunks:
        score = c.get("score", 0)
        print(f"      - {c['id']} ({score:.4f}) — {c.get('source_name', '?')}")

    # Step 3: Build context
    context = build_context(chunks)
    system = SYSTEM_PROMPT.format(context=context)

    # Step 4: Get coaching response
    print(f"[3] Sending to Coach K ({NEBIUS_MODEL.split(':')[-1]})...")
    response = coach_response(nebius_client, system, query)

    print(f"\n--- COACH K RESPONSE ---\n")
    print(response)
    print(f"\n{'='*70}")

    return response


def main():
    # Initialize clients
    openai_client = OpenAI(api_key=OPENAI_API_KEY)
    supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    nebius_client = OpenAI(api_key=NEBIUS_API_KEY, base_url=NEBIUS_BASE_URL)

    # Use custom query or run test suite
    if len(sys.argv) > 1:
        queries = [" ".join(sys.argv[1:])]
    else:
        queries = TEST_QUERIES

    for query in queries:
        run_test(openai_client, supabase_client, nebius_client, query)

    print(f"\nTested {len(queries)} queries end-to-end.")


if __name__ == "__main__":
    main()
