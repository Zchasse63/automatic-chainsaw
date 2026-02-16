# Skill+RAG Alternative Architecture — Hyrox AI Coach

> **Status**: Documented as fallback option. Primary approach is LoRA fine-tuning on Nebius Token Factory.

## Overview

Instead of fine-tuning a model, use the 729 training examples as a **retrieval-augmented few-shot corpus**. At query time, embed the user's question, retrieve the most relevant training examples, and inject them as few-shot demonstrations into the prompt — teaching the model the coaching persona via in-context learning rather than weight updates.

## Why This Exists

This doc exists as a fallback architecture in case fine-tuning doesn't meet quality targets. Fine-tuning on Nebius + Llama 3.3 70B is now the primary approach (v1 deployed successfully at $5.63).

## Architecture

```
User Question
    ↓
[1] Embed question (text-embedding-3-small)
    ↓
[2] Retrieve top-K training examples from PGVector
    (+ retrieve relevant research chunks for factual grounding)
    ↓
[3] Construct prompt:
    - System prompt (Coach K persona definition)
    - Few-shot examples (2-3 retrieved training conversations)
    - RAG context (relevant research chunks)
    - User's actual question
    ↓
[4] Send to LLM (any model — Claude, K2.5, Qwen3, Llama, etc.)
    ↓
[5] Return coaching response
```

## Key Components

### 1. Training Example Embeddings (Supabase PGVector)

Embed all 729 training examples into PGVector alongside the 239 research chunks. Each training example gets embedded using the **user message** as the embedding key.

```sql
CREATE TABLE training_examples (
    id SERIAL PRIMARY KEY,
    category TEXT,                    -- team1, team2, etc.
    user_message TEXT,                -- The user's question
    full_conversation JSONB,         -- Complete messages array
    embedding VECTOR(1536),          -- text-embedding-3-small
    token_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON training_examples
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
```

### 2. Retrieval at Query Time

```python
# Embed user's question
query_embedding = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=user_question,
).data[0].embedding

# Retrieve top 3 most similar training conversations
similar_examples = supabase.rpc(
    "match_training_examples",
    {"query_embedding": query_embedding, "match_count": 3}
).execute()

# Also retrieve relevant research chunks for factual grounding
research_chunks = supabase.rpc(
    "match_research_chunks",
    {"query_embedding": query_embedding, "match_count": 5}
).execute()
```

### 3. Prompt Construction

```python
system_prompt = """You are Coach K, an elite Hyrox performance coach.
You combine deep sports science knowledge with practical coaching experience.
Your style is direct, motivating, and specific — never generic.
Always back recommendations with reasoning.
Below are examples of how you coach. Follow this style exactly."""

# Build few-shot section from retrieved training examples
few_shot = ""
for ex in similar_examples:
    conversation = ex["full_conversation"]
    for msg in conversation:
        if msg["role"] == "user":
            few_shot += f"\n**Athlete asks**: {msg['content']}\n"
        elif msg["role"] == "assistant":
            few_shot += f"\n**Coach K responds**: {msg['content']}\n"
    few_shot += "\n---\n"

# Build RAG context from research chunks
rag_context = "\n\n".join([
    f"[Source: {chunk['metadata']['source']}]\n{chunk['content']}"
    for chunk in research_chunks
])

# Final prompt
messages = [
    {"role": "system", "content": system_prompt},
    {"role": "user", "content": f"""Here are examples of my coaching style:

{few_shot}

Here is relevant training science for context:

{rag_context}

Now respond to the athlete's question in my coaching style:

{user_question}"""},
]
```

### 4. Model Flexibility

The key advantage: **any model works**. No fine-tuning lock-in.

| Model | Platform | Cost (in/out per 1M) | Notes |
|-------|----------|---------------------|-------|
| Claude Opus 4.6 | Anthropic | ~$15/$75 | Highest quality, expensive |
| Claude Sonnet 4.5 | Anthropic | ~$3/$15 | Good balance |
| Kimi K2.5 | Nebius | $0.50/$2.50 | Reasoning model, 256K context |
| Qwen3-235B | Nebius | $0.20/$0.60 | Cheap, strong |
| Llama 3.3 70B | Nebius | $0.13/$0.40 | Cheapest |
| GPT-4o | OpenAI | ~$2.50/$10 | Widely available |

## Quick MVP: Claude Projects

The fastest path to test the concept:

1. Upload all 729 JSONL training examples to a Claude Project as knowledge files
2. Set the system prompt to the Coach K persona
3. Upload the 239 research chunks as additional knowledge
4. Start chatting — Claude will automatically reference the training examples

**Pros**: Zero code, instant setup, Claude handles retrieval internally
**Cons**: No API access, manual UI only, can't integrate with Supabase athlete profile

## Full Build: Supabase Edge Function

For a production-ready API:

1. Load 729 training examples + 239 research chunks into PGVector
2. Create Edge Function that:
   - Embeds the user query
   - Retrieves top-K training examples + research chunks
   - Constructs the few-shot prompt
   - Calls the target LLM
   - Returns the response
3. Expose as REST API for any frontend

## Cost Comparison

| Approach | Training Cost | Ongoing Cost | Model Lock-in |
|----------|-------------|--------------|---------------|
| **LoRA Fine-Tuning** (Nebius) | $5.28 | $0.13/$0.40 per 1M | Yes (Llama 3.3 70B only) |
| **Skill+RAG** (any model) | $0 | Embedding cost + LLM cost | No — switch models freely |
| **Claude Projects** (MVP) | $0 | Claude subscription ($20/mo) | Yes (Claude only) |

## When to Use Each

| Scenario | Best Approach |
|----------|---------------|
| Quick testing / MVP | Claude Projects |
| Production with cheapest inference | LoRA fine-tuned Llama 3.3 70B on Nebius |
| Maximum quality, model flexibility | Skill+RAG with Claude or K2.5 |
| Both persona AND factual accuracy matter | LoRA + RAG combined (fine-tuned model with RAG context) |

## Limitations of Skill+RAG vs Fine-Tuning

| Aspect | Skill+RAG | Fine-Tuning |
|--------|-----------|-------------|
| Persona consistency | Good (depends on retrieval quality) | **Better** (baked into weights) |
| Token cost per request | Higher (few-shot examples use tokens) | Lower (no examples needed) |
| Latency | Higher (embedding + retrieval + longer prompt) | Lower (direct model call) |
| Model flexibility | **Any model** | Locked to base model |
| Iteration speed | **Instant** (change examples, no retraining) | Slow (retrain needed) |
| Cold start | None | 5-10s on first request |

## Recommendation

**Use both**: Fine-tune Llama 3.3 70B on Nebius for the core coaching experience (cheap, fast, consistent persona), AND build the Skill+RAG pipeline for the RAG layer regardless. The RAG layer provides factual grounding that fine-tuning can't — this was always part of the architecture. The Skill+RAG approach just adds the option to also inject few-shot coaching examples when using non-fine-tuned models.
