-- ============================================================
-- Hyrox AI Coach — Supabase PGVector Schema
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- 1. Enable pgvector extension
create extension if not exists vector with schema extensions;

-- ============================================================
-- 2. Knowledge Chunks table (RAG knowledge base)
-- ============================================================
create table knowledge_chunks (
  id text primary key,                    -- chunk id from all_chunks.json (e.g. "team1a_000")
  source_doc text not null,               -- source markdown filename
  source_name text,                       -- friendly document name
  section text,                           -- hierarchical section path
  content text not null,                  -- chunk text content
  topic_tags text[],                      -- topic/category tags for filtered retrieval
  chunk_index int,                        -- sequential index within source doc
  word_count int,
  est_tokens int,
  fts tsvector generated always as (to_tsvector('english', content)) stored,
  embedding vector(1536),                 -- text-embedding-3-small embeddings
  created_at timestamptz default now()
);

-- ============================================================
-- 3. Indexes
-- ============================================================

-- HNSW vector index for semantic search (cosine distance)
create index knowledge_chunks_embedding_idx
  on knowledge_chunks using hnsw (embedding vector_cosine_ops)
  with (m = 32, ef_construction = 80);

-- Full-text search index for hybrid search
create index knowledge_chunks_fts_idx
  on knowledge_chunks using gin (fts);

-- Topic tags GIN index for filtered retrieval
create index knowledge_chunks_tags_idx
  on knowledge_chunks using gin (topic_tags);

-- ============================================================
-- 4. Semantic search function (cosine similarity)
-- Called via supabase.rpc('match_chunks', {...})
-- ============================================================
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count int default 5
)
returns table (
  id text,
  content text,
  source_name text,
  section text,
  topic_tags text[],
  similarity float
)
language sql stable
as $$
  select
    knowledge_chunks.id,
    knowledge_chunks.content,
    knowledge_chunks.source_name,
    knowledge_chunks.section,
    knowledge_chunks.topic_tags,
    1 - (knowledge_chunks.embedding <=> query_embedding) as similarity
  from knowledge_chunks
  where 1 - (knowledge_chunks.embedding <=> query_embedding) > match_threshold
  order by knowledge_chunks.embedding <=> query_embedding asc
  limit match_count;
$$;

-- ============================================================
-- 5. Hybrid search function (Reciprocal Rank Fusion)
-- Combines vector similarity + full-text keyword search
-- Called via supabase.rpc('hybrid_search_chunks', {...})
-- ============================================================
create or replace function hybrid_search_chunks(
  query_text text,
  query_embedding vector(1536),
  match_count int default 5,
  full_text_weight float default 1,
  semantic_weight float default 1,
  rrf_k int default 50
)
returns table (
  id text,
  content text,
  source_name text,
  section text,
  topic_tags text[],
  score float
)
language sql
as $$
with full_text as (
  select
    kc.id,
    row_number() over(
      order by ts_rank_cd(kc.fts, websearch_to_tsquery(query_text)) desc
    ) as rank_ix
  from knowledge_chunks kc
  where kc.fts @@ websearch_to_tsquery(query_text)
  limit least(match_count, 30) * 2
),
semantic as (
  select
    kc.id,
    row_number() over(
      order by kc.embedding <=> query_embedding
    ) as rank_ix
  from knowledge_chunks kc
  order by kc.embedding <=> query_embedding
  limit least(match_count, 30) * 2
)
select
  kc.id,
  kc.content,
  kc.source_name,
  kc.section,
  kc.topic_tags,
  (coalesce(1.0 / (rrf_k + ft.rank_ix), 0.0) * full_text_weight +
   coalesce(1.0 / (rrf_k + s.rank_ix), 0.0) * semantic_weight)::float as score
from full_text ft
  full outer join semantic s on ft.id = s.id
  join knowledge_chunks kc on coalesce(ft.id, s.id) = kc.id
order by score desc
limit least(match_count, 30);
$$;
