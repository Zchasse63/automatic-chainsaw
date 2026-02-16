# Model Selection Analysis (HISTORICAL)

> **Note**: This document is from the original project planning phase. The project now uses **Llama 3.3 70B Instruct on Nebius Token Factory** for fine-tuning and inference. See CLAUDE.md for current architecture.

# Original Analysis: Kimi K2 Thinking

## Why Kimi K2 Thinking

### Specs
- 1 trillion total params, 32B active (MoE, 384 experts, 8 selected per token)
- 256K context window
- Native INT4 quantization (QAT-trained, lossless at 2x inference speed)
- Modified MIT License (commercial use allowed; branding required only if >100M MAU or >$20M/month revenue)
- Designed specifically for interleaved reasoning + tool calling (200-300 sequential calls without drift)

### Fireworks AI Pricing & Fine-Tuning
- Serverless inference: $0.60 input / $0.30 cached / $2.50 output per 1M tokens
- LoRA fine-tuning: Generally available
- Fine-tuned models serve at base model rates (no markup)
- Output speed: 236.7 tokens/sec (second fastest after Google Vertex)
- Function calling supported
- Multi-LoRA: up to 100 adapters on single deployment

### Benchmarks vs Competitors
| Benchmark | K2 Thinking | GPT-5 | Claude 4.5 |
|-----------|------------|-------|------------|
| HLE (with tools) | 44.9% | 41.7% | — |
| AIME 2025 | ~94% | ~94% | — |
| SWE-bench Verified | 71.3% | 74.9% | 77.2% |
| BrowseComp | 60.2% | 54.9% | — |
| LiveCodeBench v6 | 83.1% | 87.0% | 64.0% |

### Why K2 Thinking Over K2.5
1. Don't need multimodal (text-only coaching app) — K2.5's entire upgrade is vision
2. Fine-tuning maturity: K2T LoRA is GA; K2.5 full-param RL still private preview
3. Output cost 17% cheaper ($2.50 vs $3.00)
4. Inference 18% faster (237 vs 200 t/s)
5. More distinctive personality (easier to fine-tune coaching persona vs Claude-influenced K2.5)
6. Same architecture means LoRA adapter trained on K2T could potentially transfer to K2.5 later

### Cost Modeling (1,000 coaching interactions)
Assumptions: 500 input + 2K cached system prompt + 800 output tokens per interaction

| Component | K2 Thinking | K2.5 |
|-----------|------------|------|
| Input (non-cached) | $0.30 | $0.30 |
| Input (cached) | $0.60 | $0.20 |
| Output | $2.00 | $2.40 |
| **Total** | **$2.90** | **$2.90** |

Costs wash out — tiebreaker is speed, fine-tuning maturity, and persona controllability (all favor K2T).

### Known Concerns
- Hallucination rate: 74% (elevated vs GPT-5.1/5.2)
- Some reports of training on Claude/Sonnet outputs (less severe than K2.5)
- Genspark case study: RFT on Kimi achieved "12% better quality, 33% increase in tool calls, 50% cost reduction"

## Backup Models

### GPT-4.1-nano (OpenAI)
- SFT + DPO fine-tuning support
- $0.10/$0.40 per 1M tokens (cheapest option)
- 1M context window
- Proprietary — deprecation risk (retiring ~Oct 2026)

### gpt-oss-20b (OpenAI Open Weight)
- 21B total params, 3.6B active
- Apache 2.0 license — no deprecation, full ownership
- Runs on 16GB memory (consumer hardware)
- $0.05/$0.20 per 1M on Together AI
- Fine-tunable with open-source tools

### GPT-4.1-mini (OpenAI)
- SFT + DPO fine-tuning
- $0.40/$1.60 per 1M tokens
- 1M context window
- Best if we want DPO for persona tuning on OpenAI platform
