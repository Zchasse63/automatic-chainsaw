# Research Output: custom_research_synth
## Generated: 2026-02-13T15:42:04.746837
## Preset: advanced-deep-research
## Model: anthropic/claude-opus-4-6
## Cost: $0.2963
## Output length: 11639 chars, 1885 words

---



# Serverless LoRA Fine-Tuning & Inference: Platform Comparison (Mid-2025)

## Executive Summary

You trained a LoRA on Kimi K2 Thinking via Fireworks AI and discovered it can't be served serverlessly — it requires dedicated deployment on 32× H100s. This analysis identifies which platforms and models actually support the full end-to-end workflow: **LoRA fine-tuning → serverless inference** (no dedicated GPU required).

**The short answer: Together AI is the only platform with a mature, documented serverless multi-LoRA inference system for large models. Fireworks AI's serverless LoRA is currently suspended. Nebius, Modal, and Replicate don't offer comparable serverless LoRA text inference.**

---

## Platform-by-Platform Analysis

### 1. Together AI ✅ — Best Option

Together AI is the clear leader here. They explicitly launched "Serverless Multi-LoRA" as a product, with dedicated documentation, and a specific list of supported base models.

#### Models Supporting BOTH Fine-Tuning AND Serverless LoRA Inference

The serverless LoRA base model list (from their adapter upload docs) is **distinct from and smaller than** their fine-tuning models list. Only these base models support serverless LoRA serving:

| Base Model | API String | Quantization | Size |
|---|---|---|---|
| **Llama 4 Maverick Instruct** | `meta-llama/Llama-4-Maverick-17B-128E-Instruct` | FP8 | 17B×128E MoE (~400B total) |
| **Llama 3.1 8B Instruct** | `meta-llama/Meta-Llama-3.1-8B-Instruct-Reference` | BF16 | 8B |
| **Llama 3.1 70B Instruct** | `meta-llama/Meta-Llama-3.1-70B-Instruct-Reference` | BF16 | 70B |
| **Qwen 2.5 72B Instruct** | `Qwen/Qwen2.5-72B-Instruct` | FP8 | 72B |
| **Qwen3 235B A22B Instruct 2507** | `Qwen/Qwen3-235B-A22B-Instruct-2507-tput` | FP8 | 235B MoE (22B active) |

> ⚠️ **Critical caveat**: You must use the `-Reference` variants (not `-Turbo`) for LoRA fine-tuning. Using Turbo variants will cause a "No lora_model specified" error.

#### Maximum Model Size for Serverless LoRA
- **Qwen3-235B-A22B** (235B total, 22B active parameters) — the largest supported
- **Llama 4 Maverick** (~400B total parameters as MoE) — also massive but only 17B active per expert

#### Pricing

**Fine-tuning (LoRA SFT):**

| Model Size | LoRA SFT per 1M tokens | LoRA DPO per 1M tokens |
|---|---|---|
| Up to 16B | $0.48 | $1.20 |
| 17B–69B | $1.50 | $3.75 |
| 70B–100B | $2.90 | $7.25 |
| Qwen3-235B-A22B | $6.00 | $15.00 |

**Serverless Inference (LoRA adapters served at base model price):**

| Model | Input / 1M tokens | Output / 1M tokens |
|---|---|---|
| Llama 3.1 8B | $0.18 | $0.18 |
| Llama 3.1 70B | $0.88 | $0.88 |
| Llama 3.3 70B Turbo* | $0.88 | $0.88 |
| Llama 4 Maverick | $0.27 | $0.85 |
| Qwen 2.5 72B Instruct | ~$0.30** | ~$0.30** |
| Qwen3 235B A22B Instruct 2507 | $0.20 | $0.60 |

*\*Turbo is the serverless chat model but NOT the LoRA base — you fine-tune on Reference but inference pricing matches the serverless tier.*
*\*\*Qwen 2.5 72B pricing not explicitly listed on the pricing page snippet; estimate based on tier.*

**Key cost insight**: LoRA inference is billed at the **same per-token price as the base model**. No additional hosting fee. No idle cost.

#### Your 729 Training Examples — Cost Estimate

Assuming ~500 tokens per example average, that's ~365K tokens per epoch. With 3–5 epochs:
- **Llama 3.1 70B LoRA SFT**: ~1.1M–1.8M tokens × $2.90/1M = **$3.19–$5.22**
- **Qwen3-235B-A22B LoRA SFT**: ~1.1M–1.8M tokens × $6.00/1M = **$6.60–$10.80**

These are extremely affordable fine-tuning costs.

#### Features
- ✅ OpenAI-compatible chat completions API
- ✅ Upload adapters from HuggingFace or S3
- ✅ Streaming supported
- ✅ Multi-LoRA (hundreds of adapters on one base model)
- ✅ Cross-LoRA continuous batching, adapter prefetching
- ✅ FP8 Turbo + speculative decoding for speed
- ⚠️ Cold start latency: 5–10 seconds on first request; sub-second thereafter
- ⚠️ Pre-Dec 2024 adapters require re-upload/migration

#### Limitations
- The serverless LoRA base model list is **small** (only 5 models currently)
- **DeepSeek R1/V3 are NOT on the serverless LoRA list** (they support LoRA fine-tuning but require dedicated endpoints for inference)
- **Kimi K2 is NOT on the serverless LoRA list** (same situation)
- No Mistral Large, no Llama 3.1 405B on serverless LoRA
- Maintains ~90% of base model throughput (10% overhead from runtime adapter loading)

---

### 2. Fireworks AI ⚠️ — Serverless LoRA Currently Suspended

#### Status
Fireworks conceptually supports serverless LoRA — their docs mention "LoRA addons must be deployed on a **serverless or dedicated** deployment" and the Concepts page references "serverless LoRA addons." However:

> **⚠️ "Serverless LoRA is not currently supported (February 2026). Please check our Documentation Page for the latest updates."** — Fireworks AI blog

The updated model overview page now states: *"LoRA addons must be deployed on a **dedicated** deployment"* — the word "serverless" has been removed.

#### What This Means
- You **can** fine-tune LoRA on Fireworks (including Kimi K2 Thinking, DeepSeek R1/V3, etc.)
- You **cannot** serve that LoRA serverlessly — you must spin up a dedicated on-demand deployment
- For Kimi K2 Thinking, that means paying for 32× H100s at $4.00/hr each = **$128/hour**

#### Pricing (For Reference)

**Fine-tuning:**

| Base Model Size | LoRA SFT / 1M tokens | LoRA DPO / 1M tokens |
|---|---|---|
| Up to 16B | $0.50 | $1.00 |
| 16.1B–80B | $3.00 | $6.00 |
| 80B–300B | $6.00 | $12.00 |
| >300B (DeepSeek V3, Kimi K2) | $10.00 | $20.00 |

**Serverless Inference (base models only, no LoRA):**

| Model | Price / 1M tokens |
|---|---|
| <4B params | $0.10 |
| 4B–16B params | $0.20 |
| >16B params | $0.90 |
| DeepSeek V3 family | $0.56 input / $1.68 output |
| Kimi K2 | $0.60 input / $2.50 output |

**Dedicated GPU Deployments (required for LoRA):**

| GPU | $/hour |
|---|---|
| A100 80GB | $2.90 |
| H100 80GB | $4.00 |
| H200 141GB | $6.00 |
| B200 180GB | $9.00 |

#### Features
- ✅ OpenAI-compatible API
- ✅ Up to 100 LoRA adapters per dedicated deployment
- ✅ LoRA and qLoRA support
- ✅ Extensive model library for fine-tuning
- ❌ **No serverless LoRA inference currently**
- ❌ Dedicated deployments for large models are very expensive

---

### 3. Nebius AI Studio ⚠️ — LoRA Fine-Tuning Yes, Serverless LoRA Inference Unclear

#### Status
Nebius offers LoRA fine-tuning via Token Factory and mentions "auto-deploy serverlessly on our infrastructure." However, the documentation is vague about whether fine-tuned LoRA adapters are served serverlessly with dynamic adapter swapping (like Together AI) or simply deployed as a new serverless endpoint.

#### What's Available
- **30+ models** for fine-tuning including Llama 3 series (1B–70B), Qwen series (1.5B–72B), DeepSeek Coder
- LoRA supported on all models; full fine-tuning only for models under 20B
- OpenAI-compatible API
- Token-based pricing (specific rates not clearly documented in gathered data)
- One-click deployment of fine-tuned models

#### Limitations
- **No documented serverless multi-LoRA architecture** (no equivalent of Together's cross-LoRA batching)
- **No specific list of "serverless LoRA-compatible base models"** published
- Less transparent pricing compared to Together AI and Fireworks
- Smaller ecosystem and community compared to the other two

#### Verdict
Nebius may work for your use case but the lack of clear documentation about serverless LoRA inference makes it a riskier choice. You'd need to contact their team to confirm the exact workflow and pricing.

---

### 4. Modal ❌ — Not Applicable

Modal is an infrastructure platform for running custom code on GPUs. The research found a tutorial about loading LoRA adapters with Stable Diffusion XL for image generation — this is a **DIY approach**, not managed serverless LoRA inference. You would need to:
- Write your own serving code
- Manage GPU allocation and scaling
- Handle adapter loading yourself

Not a viable alternative for your use case.

---

### 5. Replicate ❌ — Image LoRA Only

Replicate's LoRA support is focused on **image generation models** (primarily Flux fine-tunes). The documentation discusses combining multiple LoRA styles for image generation. There is no evidence of serverless LoRA support for large language models in the research data.

---

## Comparison Matrix: 70B+ Models for Serverless LoRA

| Model | Together AI | Fireworks AI | Nebius |
|---|---|---|---|
| **Llama 3.1 70B Instruct** | ✅ Serverless LoRA | ❌ Dedicated only | ❓ Unclear |
| **Llama 3.1 405B** | ❌ Not on LoRA list | ❌ Dedicated only | ❌ Not mentioned |
| **Llama 4 Maverick (~400B MoE)** | ✅ Serverless LoRA | ❌ Dedicated only | ❌ Not mentioned |
| **DeepSeek R1/V3** | ❌ Fine-tune yes, serverless LoRA no | ❌ Dedicated only | ❌ Not mentioned |
| **Qwen 2.5 72B Instruct** | ✅ Serverless LoRA | ❌ Dedicated only | ❓ Unclear |
| **Qwen3 235B A22B** | ✅ Serverless LoRA | ❌ Dedicated only | ❌ Not mentioned |
| **Kimi K2 Thinking** | ❌ Fine-tune yes, serverless LoRA no | ❌ Dedicated only | ❌ Not available |
| **Mistral Large/Mixtral** | ❌ Not on LoRA list | ❌ Dedicated only | ❌ Not mentioned |

---

## 🎯 Recommendation

### Best Option: **Together AI + Qwen3-235B-A22B-Instruct-2507**

**Why this combination:**

1. **Largest reasoning model with serverless LoRA support**: At 235B total parameters (22B active), Qwen3-235B is the most capable model on Together's serverless LoRA list — significantly more powerful than Llama 3.1 70B, and a genuine reasoning model.

2. **Extremely affordable for your dataset**: 729 examples × ~500 tokens × 5 epochs = ~1.8M training tokens × $6.00/1M = **~$10.80 to fine-tune**. Even if you iterate 5 times, that's only ~$54.

3. **Cheapest inference for a model this size**: $0.20 input / $0.60 output per 1M tokens — cheaper than DeepSeek V3 on any platform, and you get your LoRA customization on top at **no additional cost**.

4. **Zero idle cost**: Pay-per-token only. No GPU rental when not in use.

5. **Immediate deployment**: Fine-tuning completes → model is instantly available for inference. No deployment step.

6. **OpenAI-compatible API**: Drop-in replacement for your existing code.

### Runner-Up: **Together AI + Llama 3.1 70B Instruct**

If you want the most battle-tested, widely-used model:
- Fine-tuning: ~$5 for your dataset
- Inference: $0.88/1M tokens (input and output)
- Maximum ecosystem support and community knowledge
- Proven LoRA fine-tuning results at 70B scale

### Runner-Up: **Together AI + Llama 4 Maverick**

If you want Meta's latest MoE architecture:
- Very cheap inference: $0.27 input / $0.85 output per 1M tokens
- 1M+ context length
- Newest model on the list
- Less community fine-tuning data available

### What to Do About Your Kimi K2 LoRA

Unfortunately, your existing Kimi K2 Thinking LoRA trained on Fireworks **cannot be transferred** to Together AI — Kimi K2 is not on Together's serverless LoRA list either. You will need to **retrain on one of Together's supported base models**. Given your small dataset (729 examples), this is a <$15 expense and likely under an hour of training time.

### Action Plan

1. **Format your 729 JSONL examples** for the target model's chat template (Qwen3 or Llama 3.1 format)
2. **Upload to Together AI**: `together files upload your-data.jsonl`
3. **Launch LoRA fine-tuning**: `together fine-tuning create --training-file <file-id> --model Qwen/Qwen3-235B-A22B-Instruct-2507 --lora`
4. **Run inference immediately** when training completes — no deployment needed
5. **Send a warmup query** to minimize cold start latency for production use

---

## Original Prompt

```
You have already completed extensive web research on this topic. Below is ALL the research data you gathered from web searches and URL fetches. Your job is to SYNTHESIZE this data into a comprehensive, well-structured analysis. Do NOT search for additional information — everything you need is provided below.

============================================================
RESEARCH DATA GATHERED:
============================================================

### Search Queries: Fireworks AI serverless LoRA inference supported models 2025, Together AI serverless multi-LoRA supported models 2025, Nebius AI LoRA fine-tuning serverless inference models

---

**Source: [Overview - Fireworks AI Docsdocs.fireworks.ai › models › overview](https://docs.fireworks.ai/models/overview)**
### Serverless inferenceFireworks supports serverless inference for popular models like Llama 3.1 405B. These models are pre-deployed by the Fireworks team for the community to use. Take a look at the Models page for the latest list of serverless models. Serverless inference is billed on a per-token basis depending on the model size. See our Pricing page for details.
Custom base models are not supported for serverless inference.

Since serverless deployments are shared across users, there are no SLA guarantees for up-time or latency. It is best-effort. The Fireworks team may also deprecate models from serverless with at least 2 weeks notice.

---

**Source: [Fine-tune open models with Nebius Token Factory](https://nebius.com/services/token-factory/fine-tuning)**
## Build specialized AI solutions

### Advanced LoRA fine-tuning

Adapt models to classification tasks, code completion or domain-specific requirements, without extensive prompt engineering. Achieve better results with less data.View documentation

### Seamless model deployment

Fine-tune your custom LLM and deploy it instantly — no complex infrastructure required. Download model checkpoints for local use or auto-deploy serverlessly on our infrastructure. Scale from prototype to production seamlessly as your needs grow.Start fine-tuning

---

**Source: [Supervised Fine-Tuning (SFT) with LoRA on Fireworks AI](https://fireworks.ai/blog/supervised-fine-tuning-tutorial)**
Supervised Fine-Tuning (SFT) is critical for adapting general-purpose Large Language Models (LLMs) to domain-specific tasks, significantly improving performance in real-world applications. Fireworks AI facilitates easy and scalable SFT through its intuitive APIs and support for Low-Rank Adaptation (LoRA), allowing efficient fine-tuning without full parameter updates.
LoRA significantly reduces the computational cost of fine-tuning large models by updating only a small subset of parameters in a low-rank structure, making it particularly suitable for large models like LLaMA or DeepSeek.

qLoRA (Quantized LoRA) further improves efficiency by enabling fine-tuning of 4-bit and 8-bit quantized models (dependent on model types) without sacrificing performance, reducing memory requirements even more.
Fireworks AI supports both LoRA and qLoRA tuning, allowing up to 100 LoRA adaptations to run simultaneously on a dedicated deployment without extra cost.

**Step-by-Step Guide to Fine-Tuning with Fireworks AI**

Go to fireworks.ai > Model Library > Filter “Tunable”

You can also filter for “Serverless” models if you are planning to run it serverless
This ensures that you are selecting models which allow LoRA-based tuning and deployments. These models support uploading LoRA adapters even if they were trained on another platform. You can also upload custom models that have the same architecture as the tunable ones in the list, and those models will also be tunable. For example, a deepseek distilled llama 8b model works just as well as a vanilla llama 8b model.
**Let’s say we select “DeepSeek R1 Distill Llama 70b”**

**⚠️ Note:** Serverless LoRA is not currently supported (February 2026). Please check our **Documentation Page** for the latest updates on supported features and fine-tuning capabilities.

Datasets must adhere strictly to the JSONL format, where each line represents a complete JSON-formatted training example.

…

Select the LoRA model from the drop-down list.

Click “Continue”

Then select your deployment. You can either deploy the LoRA model “serverless” or via an “on-demand deployment”.

Deployment Options:

💡 PS: Use an existing on-demand deployment to load the LoRA model onto (instead of serverless)
PS: As we are fine-tuning the DeepSeek R1 Distill Llama 70B, we will need to deploy the LoRA on -demand, rather than serverless. Use an existing on-demand deployment to load the LoRA model onto (instead of serverless)

Enter the model display name and click “Submit”
By following these steps, you can effectively adapt LLMs to your specific use case using Fireworks AI’s fine-tuning pipeline with LoRA. This approach ensures lower costs, faster training, and scalable deployment for real-world applications.

---

**Source: [Announcing Serverless Multi-LoRA: Fine-tune and deploy hundreds ...](https://www.together.ai/blog/serverless-multi-lora-fine-tune-and-deploy-hundreds-of-adapters-for-model-customization-at-scale)**
**LoRA (Low-Rank Adaptation) support on Together Serverless**, enabling you to fine-tune and deploy hundreds of custom LoRA adapters while only paying base model per-token prices to run them. Fine-tuning is a powerful tool to improve model performance for specific tasks e.g. style, formatting, and translation – but managing multiple fine-tuned models traditionally comes with significant complexity and cost. Our platform solves this by letting you serve hundreds of custom LoRA adapters alongside a single base model, dramatically reducing costs while delivering high-performance customized models without the headaches of infrastructure management.
Today's launch includes:

**Serverless LoRA inference with pay-per-token pricing.**Upload your own LoRA adapters (for example from Hugging Face) and run inference on them with any of our compatible serverless models - including popular models like Llama 3.1 and Qwen 2.5. **Multi-LoRA support**on our serverless platform, enabling dynamic adapter switching at scale.

…

We're working with leading companies like Salesforce, Zomato and The Washington Post to bring their fine-tuned models from experimentation to production, while partnering with fine-tuning platforms like OpenPipe to power inference for their customers.

*“We use LoRAs to help our customers to train and deploy heavily customized models faster. Together AI's serverless multi-LoRA inference scales well while maintaining high throughput and low latency. We’re excited to partner with them to enable our customers to bring fine-tuned models directly into production seamlessly.” * **- Kyle Corbitt, Founder of OpenPipe**

{{custom-cta-1}}

## LoRA: A powerful method for efficient fine-tuning

**LoRA (Low-Rank Adaptation)** is an efficient approach to fine-tuning models. Rather than modifying the entire model's weights, LoRA creates lightweight "adapters" that require less memory for training and can be dynamically loaded at run-time, while keeping the base model unchanged. This approach significantly reduces infrastructure costs and complexity, as you can use a single base model and swap smaller task-specific adapters as needed.

…

## The power of multi-LoRA: Run custom AI models at scale

**Multi-LoRA** unlocks the ability to serve multiple AI adapters with a single base model and swap between them at runtime. Before, if you had 100 different fine-tuned models, you would need to host and deploy each model on its own infrastructure. With multi-LoRA you can serve hundreds of LoRA adapters on the same infrastructure as the base model, leading to significant cost savings and rapid experimentation.

…

Deploying this multi-LoRA architecture on platforms like Amazon SageMaker requires complex memory and batching configurations to manage GPU resources and adapter swapping. Together Serverless eliminates this complexity by automatically handling the serving and scaling of hundreds of LoRAs while maintaining high performance and efficiency, at the same cost as the base model.

## Why run LoRAs on Together AI

### Cost-efficient model customization

Running multiple fine-tuned models traditionally requires separate instances and infrastructure for each model. With LoRAs on Together AI, you can serve hundreds of custom adapters at the same cost as running the base model alone. In addition to that, with our serverless infrastructure you only pay-per-token for using your fine-tuned models, eliminating spend on idle infrastructure.

…

### Optimized performance at scale

Running LoRA adapters dynamically (at run-time) typically introduces some performance overhead, forcing organizations to choose between speed, cost and flexibility when running fine-tuned models. At Together AI, our optimized serving system eliminates this trade-off,
**maintaining up to 90% of base model performance**, while providing incredibly flexible per-token pricing. These results are driven by the **Together Kernel Collection (TKC)** — featuring innovations like Together FlashAttention 3 — and other advanced techniques such as **Cross-LoRA Continuous Batching**, which parallelizes heterogeneous requests to maximize GPU utilization, and **Adapter Prefetching**, which scales seamlessly without overloading GPU memory.
Our serverless infrastructure is specifically tuned for efficient adapter serving, while our support for **FP8 Turbo** models ensures faster, more memory-efficient inference. **Speculative decoding** further accelerates generation, enabling us to deliver a scalable, high-performance LoRA serving solution despite the inherent challenges of runtime adapter computation.

…

- Configurable LoRA rank: trade off between the fine-tuning capacity and the size of the final adapter

- Layer-specific adapter application for targeted model improvements: apply LoRA to all linear layers, or just a selection of parameters (for example, query/key/value projections in attention)

- Adjustable LoRA alpha parameter to control the fine-tuning strength

---

**Source: [How to fine-tune your custom model](https://docs.studio.nebius.com/fine-tuning/how-to-fine-tune)**
`0`. Default:

`0`.



`lora`(boolean, optional): Whether to enable LoRA (Low-Rank Adaptation) for training. The LoRA method presumes that low-rank matrices are inserted into a pre-trained model. These matrices catch task-specific data during the training. As a result, you only train these matrices; you do not need to retrain the whole model and modify any preset fine-tuning parameters. If

---

**Source: [How to Fine-Tune Open Source LLMs with Nebius Token Factory | Full Tutorial](https://www.youtube.com/watch?v=gqCZ_sFha7E)**
We’ll cover:

- What fine-tuning really means and when you should use it
- Why general LLMs don’t work well for enterprise or niche data out of the box
- How LoRA makes fine-tuning faster and more cost-effective
- Preparing conversational datasets for fine-tuning
- Running a fine-tuning job on Nebius Token Factory
- Deploying your fine-tuned model as a live API endpoint
- Testing inference using an OpenAI-compatible API

---

**Source: [Concepts - Fireworks AI Docs - Introduction](https://fireworksai-docs.mintlify.app/getting-started/concepts)**
**example**)

- Users can also upload their own custom base models and specify model IDs.

**LoRA (low-rank adaptation) addons:**A LoRA addon is a small, fine-tuned model that significantly reduces the amount of memory required to deploy compared to a fully fine-tuned model. Fireworks supports

**training**,

**uploading**, and

**serving**LoRA addons. LoRA addons must be deployed on a serverless or dedicated deployment for its corresponding base model. Model IDs for LoRAs can be either auto-generated or user-specified.

…

**Serverless deployments:**Fireworks hosts popular base models on shared “serverless” deployments. Users pay-per-token to query these models and do not need to configure GPUs. The most popular serverless deployments also support serverless LoRA addons. See our Quickstart - Serverless guide to get started. **Dedicated deployments:**Dedicated deployments enable users to configure private deployments with a wide array of hardware (see on-demand deployments guide).

---

**Source: [Takeoff Serverless LoRA: Efficient inference at scale for ...](https://www.doubleword.ai/resources/takeoff-serverless-lora-efficient-inference-at-scale-for-fine-tuned-models)**
# Serverless, Batched LoRA

This blog introduces the Takeoff Serverless LoRA Inference Engine. This is a LoRA serving framework that allows you to efficiently inference hundreds of fine-tuned LoRA modules on a single GPU instance. Doing this can reduce the cost of serving a large number of LoRA adapters by orders of magnitude, unlocking wide-scale finetuning of self-hosted language models and enabling the deployment of truly differentiated applications at a fraction of the cost.

---

**Fetched: [Overview - Fireworks AI Docsdocs.fireworks.ai › models › overview](https://docs.fireworks.ai/models/overview)**
## IntroductionA

*model*is a foundational concept of the Fireworks platform, representing a set of weights and metadata that can be deployed on hardware (i.e. a

*deployment*) for inference. Each model has a globally unique name of the form

`accounts/<ACCOUNT_ID>/models/<MODEL_ID>`. The model IDs are:

- Pre-populated for models that Fireworks has uploaded. For example, “llama-v3p1-70b-instruct” is the model ID for the Llama 3.1 70B model that Fireworks provides. It can be found on each model’s page (example)

- Either auto-generated or user-specified for fine-tuned models uploaded or created by users

- User-specified for custom models uploaded by users

- Base models

- Low-rank adaptation (LoRA) addons

### Base modelsA base model consists of the full set of model weights. This may include models pre-trained from scratch as well as full fine-tunes (i.e. continued pre-training). Fireworks has a library of common base models that can be used for serverless inference as well as dedicated deployments. Fireworks also allows you to upload your own custom base models.

### Low-rank adaptation (LoRA) addonsA LoRA addon is a small, fine-tuned model that significantly reduces the amount of memory required to deploy compared to a fully fine-tuned model. Fireworks supports both training, uploading, and serving LoRA addons. LoRA addons must be deployed on a dedicated deployment for its corresponding base model.

## Using models for inferenceA model must be deployed before it can be used for inference. Take a look at the Querying text models guide for a comprehensive overview of making LLM inference.

### Serverless inferenceFireworks supports serverless inference for popular models like Llama 3.1 405B. These models are pre-deployed by the Fireworks team for the community to use. Take a look at the Models page for the latest list of serverless models. Serverless inference is billed on a per-token basis depending on the model size. See our Pricing page for details.

Custom base models are not supported for serverless inference.

Since serverless deployments are shared across users, there are no SLA guarantees for up-time or latency. It is best-effort. The Fireworks team may also deprecate models from serverless with at least 2 weeks notice.

### Dedicated deploymentsDedicated deployments give users the most flexibility and control over what models can be deployed and performance guarantees. These deployments are private to you and give you access to a wide array of hardware. Both LoRA addons and base models can be deployed to dedicated deployments. Dedicated deployments are billed by a GPU-second basis. See our Pricing page for details. Take a look at our On-demand deployments guide for a comprehensive overview.

## Data privacy & securityYour data is your data. No prompt or generated data is logged or stored on Fireworks; only meta-data like the number of tokens in a request is logged, as required to deliver the service. There are two exceptions:

- For our proprietary FireFunction model, input/output data is logged for 30 days only to enable bulk analytics to improve the model, such as tracking the number of functions provided to the model.

- For certain advanced features (e.g. FireOptimizer), users can explicitly opt-in to log data.

---

**Fetched: [Fine-tuning - Supported Models - Together.ai Docs](https://docs.together.ai/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

`meta-llama/Meta-Llama-3.1-8B-Instruct-Reference` instead of

`meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo` for serverless LoRA adapters.

- For batch sizes of 1, Gradient accumulation 8 is used, so effectively you will get batch size 8 (iteration time is slower).

- Long-context fine-tuning of Llama 3.1 (8B) Reference, Llama 3.1 (70B) Reference, Llama 3.1 Instruct (70B) Reference for context sizes of 32K-131K is only supported using the LoRA method.

- For Llama 3.1 (405B) Fine-tuning, please contact us.

*Request a model*

## LoRA Fine-tuning

|Organization|Model Name|Model String for API|Context Length (SFT)|Context Length (DPO)|Max Batch Size (SFT)|Max Batch Size (DPO)|Min Batch Size|
|--|--|--|--|--|--|--|--|
|Moonshot AI|Kimi K2 Thinking|moonshotai/Kimi-K2-Thinking|65536|32768|1|1|1|
|Moonshot AI|Kimi K2 Instruct-0905|moonshotai/Kimi-K2-Instruct-0905|65536|32768|1|1|1|
|Moonshot AI|Kimi K2 Instruct|moonshotai/Kimi-K2-Instruct|65536|32768|1|1|1|
|Moonshot AI|Kimi K2 Base|moonshotai/Kimi-K2-Base|65536|32768|1|1|1|
|Z.ai|GLM-4.7|zai-org/GLM-4.7|128000|64000|1|1|1|
|Z.ai|GLM-4.6|zai-org/GLM-4.6|128000|64000|1|1|1|
|OpenAI|gpt-oss-20b|openai/gpt-oss-20b|16384|8192|8|8|8|
|OpenAI|gpt-oss-120b|openai/gpt-oss-120b|16384|8192|16|16|16|
|DeepSeek|DeepSeek-R1-0528|deepseek-ai/DeepSeek-R1-0528|131072|32768|1|1|1|
|DeepSeek|DeepSeek-R1|deepseek-ai/DeepSeek-R1|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3.1|deepseek-ai/DeepSeek-V3.1|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3-0324|deepseek-ai/DeepSeek-V3-0324|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3|deepseek-ai/DeepSeek-V3|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3.1-Base|deepseek-ai/DeepSeek-V3.1-Base|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3-Base|deepseek-ai/DeepSeek-V3-Base|131072|32768|1|1|1|
|DeepSeek|DeepSeek-R1-Distill-Llama-70B|deepseek-ai/DeepSeek-R1-Distill-Llama-70B|24576|12288|8|8|8|
|DeepSeek|DeepSeek-R1-Distill-Llama-70B|deepseek-ai/DeepSeek-R1-Distill-Llama-70B-32k|32768|16384|1|1|1|
|DeepSeek|DeepSeek-R1-Distill-Llama-70B|deepseek-ai/DeepSeek-R1-Distill-Llama-70B-131k|131072|16384|1|1|1|
|DeepSeek|DeepSeek-R1-Distill-Qwen-14B|deepseek-ai/DeepSeek-R1-Distill-Qwen-14B|65536|49152|8|8|8|
|DeepSeek|DeepSeek-R1-Distill-Qwen-1.5B|deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B|131072|131072|8|8|8|
|Meta|Llama-4-Scout-17B-16E|meta-llama/Llama-4-Scout-17B-16E|16384|12288|8|8|8|
|Meta|Llama-4-Scout-17B-16E-Instruct|meta-llama/Llama-4-Scout-17B-16E-Instruct|16384|12288|8|8|8|
|Meta|Llama-4-Scout-17B-16E-Instruct-VLM|meta-llama/Llama-4-Scout-17B-16E-Instruct-VLM|16384|12288|8|8|8|
|Meta|Llama-4-Maverick-17B-128E|meta-llama/Llama-4-Maverick-17B-128E|16384|24576|16|16|16|
|Meta|Llama-4-Maverick-17B-128E-Instruct|meta-llama/Llama-4-Maverick-17B-128E-Instruct|16384|24576|16|16|16|
|Meta|Llama-4-Maverick-17B-128E-Instruct-VLM|meta-llama/Llama-4-Maverick-17B-128E-Instruct-VLM|16384|24576|16|16|16|
|gemma-3-270m|google/gemma-3-270m|32768|32768|128|128|8|
|gemma-3-270m-it|google/gemma-3-270m-it|32768|32768|128|128|8|
|gemma-3-1b-it|google/gemma-3-1b-it|32768|32768|32|32|8|
|gemma-3-1b-pt|google/gemma-3-1b-pt|32768|32768|32|32|8|
|gemma-3-4b-it|google/gemma-3-4b-it|131072|65536|8|8|8|
|gemma-3-4b-it-VLM|google/gemma-3-4b-it-VLM|131072|65536|8|8|8|
|gemma-3-4b-pt|google/gemma-3-4b-pt|131072|65536|8|8|8|
|gemma-3-12b-it|google/gemma-3-12b-it|16384|49152|8|8|8|
|gemma-3-12b-it-VLM|google/gemma-3-12b-it-VLM|16384|49152|8|8|8|
|gemma-3-12b-pt|google/gemma-3-12b-pt|65536|49152|8|8|8|
|gemma-3-27b-it|google/gemma-3-27b-it|49152|24576|8|8|8|
|gemma-3-27b-it-VLM|google/gemma-3-27b-it-VLM|49152|24576|8|8|8|
|gemma-3-27b-pt|google/gemma-3-27b-pt|49152|24576|8|8|8|
|Qwen|Qwen3-Next-80B-A3B-Instruct|Qwen/Qwen3-Next-80B-A3B-Instruct|65536|16384|8|8|8|
|Qwen|Qwen3-Next-80B-A3B-Thinking|Qwen/Qwen3-Next-80B-A3B-Thinking|65536|16384|8|8|8|
|Qwen|Qwen3-0.6B|Qwen/Qwen3-0.6B|32768|40960|64|64|8|
|Qwen|Qwen3-0.6B-Base|Qwen/Qwen3-0.6B-Base|32768|32768|64|64|8|
|Qwen|Qwen3-1.7B|Qwen/Qwen3-1.7B|32768|40960|32|32|8|
|Qwen|Qwen3-1.7B-Base|Qwen/Qwen3-1.7B-Base|32768|32768|32|32|8|
|Qwen|Qwen3-4B|Qwen/Qwen3-4B|32768|40960|16|16|8|
|Qwen|Qwen3-4B-Base|Qwen/Qwen3-4B-Base|32768|32768|16|16|8|
|Qwen|Qwen3-8B|Qwen/Qwen3-8B|32768|40960|8|8|8|
|Qwen|Qwen3-8B-Base|Qwen/Qwen3-8B-Base|32768|32768|16|16|8|
|Qwen|Qwen3-14B|Qwen/Qwen3-14B|32768|40960|8|8|8|
|Qwen|Qwen3-14B-Base|Qwen/Qwen3-14B-Base|32768|40960|8|8|8|
|Qwen|Qwen3-32B|Qwen/Qwen3-32B|24576|24576|8|8|8|
|Qwen|Qwen3-30B-A3B-Base|Qwen/Qwen3-30B-A3B-Base|8192|32768|16|16|8|
|Qwen|Qwen3-30B-A3B|Qwen/Qwen3-30B-A3B|8192|32768|16|16|8|
|Qwen|Qwen3-30B-A3B-Instruct-2507|Qwen/Qwen3-30B-A3B-Instruct-2507|8192|32768|16|16|8|
|Qwen|Qwen3-235B-A22B|Qwen/Qwen3-235B-A22B|32768|24576|1|1|1|
|Qwen|Qwen3-235B-A22B-Instruct-2507|Qwen/Qwen3-235B-A22B-Instruct-2507|32768|24576|1|1|1|
|Qwen|Qwen3-Coder-30B-A3B-Instruct|Qwen/Qwen3-Coder-30B-A3B-Instruct|8192|8192|16|16|8|
|Qwen|Qwen3-Coder-480B-A35B-Instruct|Qwen/Qwen3-Coder-480B-A35B-Instruct|131072|32768|1|1|1|
|Qwen|Qwen3-VL-8B-Instruct|Qwen/Qwen3-VL-8B-Instruct|32768|40960|8|8|8|
|Qwen|Qwen3-VL-32B-Instruct|Qwen/Qwen3-VL-32B-Instruct|24576|24576|8|8|8|
|Qwen|Qwen3-VL-30B-A3B-Instruct|Qwen/Qwen3-VL-30B-A3B-Instruct|8192|32768|16|16|8|
|Qwen|Qwen3-VL-235B-A22B-Instruct|Qwen/Qwen3-VL-235B-A22B-Instruct|16384|12288|16|16|16|
|Meta|Llama-3.3-70B-Instruct-Reference|meta-llama/Llama-3.3-70B-Instruct-Reference|24576|8192|8|8|8|
|Meta|Llama-3.3-70B-32k-Instruct-Reference|meta-llama/Llama-3.3-70B-32k-Instruct-Reference|32768|65536|1|1|1|
|Meta|Llama-3.3-70B-131k-Instruct-Reference|meta-llama/Llama-3.3-70B-131k-Instruct-Reference|131072|65536|1|1|1|
|Meta|Llama-3.2-3B-Instruct|meta-llama/Llama-3.2-3B-Instruct|131072|65536|8|8|8|
|Meta|Llama-3.2-3B|meta-llama/Llama-3.2-3B|131072|65536|8|8|8|
|Meta|Llama-3.2-1B-Instruct|meta-llama/Llama-3.2-1B-Instruct|131072|131072|8|8|8|
|Meta|Llama-3.2-1B|meta-llama/Llama-3.2-1B|131072|131072|8|8|8|
|Meta|Meta-Llama-3.1-8B-Instruct-Reference|meta-llama/Meta-Llama-3.1-8B-Instruct-Reference|131072|65536|8|8|8|
|Meta|Meta-Llama-3.1-8B-131k-Instruct-Reference|meta-llama/Meta-Llama-3.1-8B-131k-Instruct-Reference|131072|131072|4|4|1|
|Meta|Meta-Llama-3.1-8B-Reference|meta-llama/Meta-Llama-3.1-8B-Reference|131072|65536|8|8|8|
|Meta|Meta-Llama-3.1-8B-131k-Reference|meta-llama/Meta-Llama-3.1-8B-131k-Reference|131072|131072|4|4|1|
|Meta|Meta-Llama-3.1-70B-Instruct-Reference|meta-llama/Meta-Llama-3.1-70B-Instruct-Reference|24576|12288|8|8|8|
|Meta|Meta-Llama-3.1-70B-32k-Instruct-Reference|meta-llama/Meta-Llama-3.1-70B-32k-Instruct-Reference|32768|32768|1|1|1|
|Meta|Meta-Llama-3.1-70B-131k-Instruct-Reference|meta-llama/Meta-Llama-3.1-70B-131k-Instruct-Reference|131072|65536|1|1|1|
|Meta|Meta-Llama-3.1-70B-Reference|meta-llama/Meta-Llama-3.1-70B-Reference|24576|12288|8|8|8|
|Meta|Meta-Llama-3.1-70B-32k-Reference|meta-llama/Meta-Llama-3.1-70B-32k-Reference|32768|32768|1|1|1|
|Meta|Meta-Llama-3.1-70B-131k-Reference|meta-llama/Meta-Llama-3.1-70B-131k-Reference|131072|65536|1|1|1|
|Meta|Meta-Llama-3-8B-Instruct|meta-llama/Meta-Llama-3-8B-Instruct|8192|8192|64|64|8|
|Meta|Meta-Llama-3-8B|meta-llama/Meta-Llama-3-8B|8192|8192|64|64|8|
|Meta|Meta-Llama-3-70B-Instruct|meta-llama/Meta-Llama-3-70B-Instruct|8192|8192|8|8|8|
|Qwen|Qwen2.5-72B-Instruct|Qwen/Qwen2.5-72B-Instruct|32768|12288|8|8|8|
|Qwen|Qwen2.5-72B|Qwen/Qwen2.5-72B|24576|12288|8|8|8|
|Qwen|Qwen2.5-32B-Instruct|Qwen/Qwen2.5-32B-Instruct|32768|32768|8|8|8|
|Qwen|Qwen2.5-32B|Qwen/Qwen2.5-32B|49152|32768|8|8|8|
|Qwen|Qwen2.5-14B-Instruct|Qwen/Qwen2.5-14B-Instruct|32768|32768|8|8|8|
|Qwen|Qwen2.5-14B|Qwen/Qwen2.5-14B|65536|49152|8|8|8|
|Qwen|Qwen2.5-7B-Instruct|Qwen/Qwen2.5-7B-Instruct|32768|32768|16|16|8|
|Qwen|Qwen2.5-7B|Qwen/Qwen2.5-7B|131072|65536|8|8|8|
|Qwen|Qwen2.5-3B-Instruct|Qwen/Qwen2.5-3B-Instruct|32768|32768|32|32|8|
|Qwen|Qwen2.5-3B|Qwen/Qwen2.5-3B|32768|32768|32|32|8|
|Qwen|Qwen2.5-1.5B-Instruct|Qwen/Qwen2.5-1.5B-Instruct|32768|32768|32|32|8|
|Qwen|Qwen2.5-1.5B|Qwen/Qwen2.5-1.5B|32768|131072|8|8|8|
|Qwen|Qwen2-72B-Instruct|Qwen/Qwen2-72B-Instruct|32768|12288|16|16|16|
|Qwen|Qwen2-72B|Qwen/Qwen2-72B|32768|12288|16|16|16|
|Qwen|Qwen2-7B-Instruct|Qwen/Qwen2-7B-Instruct|32768|32768|8|8|8|
|Qwen|Qwen2-7B|Qwen/Qwen2-7B|131072|24576|8|8|8|
|Qwen|Qwen2-1.5B-Instruct|Qwen/Qwen2-1.5B-Instruct|32768|32768|32|32|8|
|Qwen|Qwen2-1.5B|Qwen/Qwen2-1.5B|131072|131072|8|8|8|
|Mistral|Mixtral-8x7B-Instruct-v0.1|mistralai/Mixtral-8x7B-Instruct-v0.1|32768|32768|8|8|8|
|Mistral|Mixtral-8x7B-v0.1|mistralai/Mixtral-8x7B-v0.1|32768|32768|8|8|8|
|Mistral|Mistral-7B-Instruct-v0.2|mistralai/Mistral-7B-Instruct-v0.2|32768|32768|16|16|8|
|Mistral|Mistral-7B-v0.1|mistralai/Mistral-7B-v0.1|32768|32768|16|16|8|
|Teknium|OpenHermes-2p5-Mistral-7B|teknium/OpenHermes-2p5-Mistral-7B|32768|32768|16|16|8|
|Meta|CodeLlama-7b-hf|codellama/CodeLlama-7b-hf|16384|16384|16|16|8|
|Together|llama-2-7b-chat|togethercomputer/llama-2-7b-chat|4096|4096|64|64|8|
## LoRA Long-context Fine-tuning

|Organization|Model Name|Model String for API|Context Length (SFT)|Context Length (DPO)|Max Batch Size (SFT)|Max Batch Size (DPO)|Min Batch Size|
|--|--|--|--|--|--|--|--|
|DeepSeek|DeepSeek-R1-0528|deepseek-ai/DeepSeek-R1-0528|131072|32768|1|1|1|
|DeepSeek|DeepSeek-R1|deepseek-ai/DeepSeek-R1|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3.1|deepseek-ai/DeepSeek-V3.1|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3-0324|deepseek-ai/DeepSeek-V3-0324|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3|deepseek-ai/DeepSeek-V3|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3.1-Base|deepseek-ai/DeepSeek-V3.1-Base|131072|32768|1|1|1|
|DeepSeek|DeepSeek-V3-Base|deepseek-ai/DeepSeek-V3-Base|131072|32768|1|1|1|
|DeepSeek|DeepSeek-R1-Distill-Llama-70B|deepseek-ai/DeepSeek-R1-Distill-Llama-70B-32k|32768|16384|1|1|1|
|DeepSeek|DeepSeek-R1-Distill-Llama-70B|deepseek-ai/DeepSeek-R1-Distill-Llama-70B-131k|131072|16384|1|1|1|
|Qwen|Qwen3-235B-A22B|Qwen/Qwen3-235B-A22B|32768|24576|1|1|1|
|Qwen|Qwen3-235B-A22B-Instruct-2507|Qwen/Qwen3-235B-A22B-Instruct-2507|32768|24576|1|1|1|
|Qwen|Qwen3-Coder-480B-A35B-Instruct|Qwen/Qwen3-Coder-480B-A35B-Instruct|131072|32768|1|1|1|
|Meta|Llama-3.3-70B-32k-Instruct-Reference|meta-llama/Llama-3.3-70B-32k-Instruct-Reference|32768|65536|1|1|1|
|Meta|Llama-3.3-70B-131k-Instruct-Reference|meta-llama/Llama-3.3-70B-131k-Instruct-Reference|131072|65536|1|1|1|
|Meta|Meta-Llama-3.1-8B-131k-Instruct-Reference|meta-llama/Meta-Llama-3.1-8B-131k-Instruct-Reference|131072|131072|4|4|1|
|Meta|Meta-Llama-3.1-8B-131k-Reference|meta-llama/Meta-Llama-3.1-8B-131k-Reference|131072|131072|4|4|1|
|Meta|Meta-Llama-3.1-70B-32k-Instruct-Reference|meta-llama/Meta-Llama-3.1-70B-32k-Instruct-Reference|32768|32768|1|1|1|
|Meta|Meta-Llama-3.1-70B-131k-Instruct-Reference|meta-llama/Meta-Llama-3.1-70B-131k-Instruct-Reference|131072|65536|1|1|1|
|Meta|Meta-Llama-3.1-70B-32k-Reference|meta-llama/Meta-Llama-3.1-70B-32k-Reference|32768|32768|1|1|1|
|Meta|Meta-Llama-3.1-70B-131k-Reference|meta-llama/Meta-Llama-3.1-70B-131k-Reference|131072|65536|1|1|1|
## Full Fine-tuning

|Organization|Model Name|Model String for API|Context Length (SFT)|Context Length (DPO)|Max Batch Size (SFT)|Max Batch Size (DPO)|Min Batch Size|
|--|--|--|--|--|--|--|--|
|DeepSeek|DeepSeek-R1-Distill-Llama-70B|deepseek-ai/DeepSeek-R1-Distill-Llama-70B|24576|12288|32|32|32|
|DeepSeek|DeepSeek-R1-Distill-Qwen-14B|deepseek-ai/DeepSeek-R1-Distill-Qwen-14B|65536|49152|8|8|8|
|DeepSeek|DeepSeek-R1-Distill-Qwen-1.5B|deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B|131072|131072|8|8|8|
|gemma-3-270m|google/gemma-3-270m|32768|32768|128|128|8|
|gemma-3-270m-it|google/gemma-3-270m-it|32768|32768|128|128|8|
|gemma-3-1b-it|google/gemma-3-1b-it|32768|32768|64|64|8|
|gemma-3-1b-pt|google/gemma-3-1b-pt|32768|32768|64|64|8|
|gemma-3-4b-it|google/gemma-3-4b-it|131072|65536|8|8|8|
|gemma-3-4b-it-VLM|google/gemma-3-4b-it-VLM|131072|65536|8|8|8|
|gemma-3-4b-pt|google/gemma-3-4b-pt|131072|65536|8|8|8|
|gemma-3-12b-it|google/gemma-3-12b-it|16384|49152|8|8|8|
|gemma-3-12b-it-VLM|google/gemma-3-12b-it-VLM|16384|49152|8|8|8|
|gemma-3-12b-pt|google/gemma-3-12b-pt|65536|49152|8|8|8|
|gemma-3-27b-it|google/gemma-3-27b-it|49152|24576|16|16|16|
|gemma-3-27b-it-VLM|google/gemma-3-27b-it-VLM|49152|24576|16|16|16|
|gemma-3-27b-pt|google/gemma-3-27b-pt|49152|24576|16|16|16|
|Qwen|Qwen3-0.6B|Qwen/Qwen3-0.6B|32768|40960|64|64|8|
|Qwen|Qwen3-0.6B-Base|Qwen/Qwen3-0.6B-Base|32768|32768|64|64|8|
|Qwen|Qwen3-1.7B|Qwen/Qwen3-1.7B|32768|40960|32|32|8|
|Qwen|Qwen3-1.7B-Base|Qwen/Qwen3-1.7B-Base|32768|32768|32|32|8|
|Qwen|Qwen3-4B|Qwen/Qwen3-4B|32768|40960|16|16|8|
|Qwen|Qwen3-4B-Base|Qwen/Qwen3-4B-Base|32768|32768|16|16|8|
|Qwen|Qwen3-8B|Qwen/Qwen3-8B|32768|40960|8|8|8|
|Qwen|Qwen3-8B-Base|Qwen/Qwen3-8B-Base|32768|32768|16|16|8|
|Qwen|Qwen3-14B|Qwen/Qwen3-14B|32768|40960|8|8|8|
|Qwen|Qwen3-14B-Base|Qwen/Qwen3-14B-Base|32768|40960|8|8|8|
|Qwen|Qwen3-32B|Qwen/Qwen3-32B|24576|24576|16|16|16|
|Qwen|Qwen3-30B-A3B-Base|Qwen/Qwen3-30B-A3B-Base|8192|32768|8|8|8|
|Qwen|Qwen3-30B-A3B|Qwen/Qwen3-30B-A3B|8192|32768|8|8|8|
|Qwen|Qwen3-30B-A3B-Instruct-2507|Qwen/Qwen3-30B-A3B-Instruct-2507|8192|32768|8|8|8|
|Qwen|Qwen3-Coder-30B-A3B-Instruct|Qwen/Qwen3-Coder-30B-A3B-Instruct|8192|8192|8|8|8|
|Qwen|Qwen3-VL-8B-Instruct|Qwen/Qwen3-VL-8B-Instruct|32768|40960|8|8|8|
|Qwen|Qwen3-VL-32B-Instruct|Qwen/Qwen3-VL-32B-Instruct|24576|24576|16|16|16|
|Qwen|Qwen3-VL-30B-A3B-Instruct|Qwen/Qwen3-VL-30B-A3B-Instruct|8192|32768|8|8|8|
|Meta|Llama-3.3-70B-Instruct-Reference|meta-llama/Llama-3.3-70B-Instruct-Reference|24576|8192|32|32|32|
|Meta|Llama-3.2-3B-Instruct|meta-llama/Llama-3.2-3B-Instruct|131072|65536|8|8|8|
|Meta|Llama-3.2-3B|meta-llama/Llama-3.2-3B|131072|65536|8|8|8|
|Meta|Llama-3.2-1B-Instruct|meta-llama/Llama-3.2-1B-Instruct|131072|131072|8|8|8|
|Meta|Llama-3.2-1B|meta-llama/Llama-3.2-1B|131072|131072|8|8|8|
|Meta|Meta-Llama-3.1-8B-Instruct-Reference|meta-llama/Meta-Llama-3.1-8B-Instruct-Reference|131072|65536|8|8|8|
|Meta|Meta-Llama-3.1-8B-Reference|meta-llama/Meta-Llama-3.1-8B-Reference|131072|65536|8|8|8|
|Meta|Meta-Llama-3.1-70B-Instruct-Reference|meta-llama/Meta-Llama-3.1-70B-Instruct-Reference|24576|12288|32|32|32|
|Meta|Meta-Llama-3.1-70B-Reference|meta-llama/Meta-Llama-3.1-70B-Reference|24576|12288|32|32|32|
|Meta|Meta-Llama-3-8B-Instruct|meta-llama/Meta-Llama-3-8B-Instruct|8192|8192|64|64|8|
|Meta|Meta-Llama-3-8B|meta-llama/Meta-Llama-3-8B|8192|8192|64|64|8|
|Meta|Meta-Llama-3-70B-Instruct|meta-llama/Meta-Llama-3-70B-Instruct|8192|8192|32|32|32|
|Qwen|Qwen2-7B-Instruct|Qwen/Qwen2-7B-Instruct|32768|32768|8|8|8|
|Qwen|Qwen2-7B|Qwen/Qwen2-7B|131072|24576|8|8|8|
|Qwen|Qwen2-1.5B-Instruct|Qwen/Qwen2-1.5B-Instruct|32768|32768|32|32|8|
|Qwen|Qwen2-1.5B|Qwen/Qwen2-1.5B|131072|131072|8|8|8|
|Mistral|Mixtral-8x7B-Instruct-v0.1|mistralai/Mixtral-8x7B-Instruct-v0.1|32768|32768|16|16|16|
|Mistral|Mixtral-8x7B-v0.1|mistralai/Mixtral-8x7B-v0.1|32768|32768|16|16|16|
|Mistral|Mistral-7B-Instruct-v0.2|mistralai/Mistral-7B-Instruct-v0.2|32768|32768|16|16|8|
|Mistral|Mistral-7B-v0.1|mistralai/Mistral-7B-v0.1|32768|32768|16|16|8|
|Teknium|OpenHermes-2p5-Mistral-7B|teknium/OpenHermes-2p5-Mistral-7B|32768|32768|16|16|8|
|Meta|CodeLlama-7b-hf|codellama/CodeLlama-7b-hf|16384|16384|16|16|8|
|Together|llama-2-7b-chat|togethercomputer/llama-2-7b-chat|4096|4096|64|64|8|

---

### Search Queries: Together AI serverless LoRA supported base models list 2025, Fireworks AI serverless LoRA supported models list tunable, Together AI LoRA inference pricing per token 2025

---

**Source: [Fine-tuning - Supported Models - Together.ai Docs](https://docs.together.ai/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Supervised Fine-Tuning (SFT) with LoRA on Fireworks AI](https://fireworks.ai/blog/supervised-fine-tuning-tutorial)**
Supervised Fine-Tuning (SFT) is critical for adapting general-purpose Large Language Models (LLMs) to domain-specific tasks, significantly improving performance in real-world applications. Fireworks AI facilitates easy and scalable SFT through its intuitive APIs and support for Low-Rank Adaptation (LoRA), allowing efficient fine-tuning without full parameter updates.

…

Fireworks AI supports both LoRA and qLoRA tuning, allowing up to 100 LoRA adaptations to run simultaneously on a dedicated deployment without extra cost.

**Step-by-Step Guide to Fine-Tuning with Fireworks AI**

Go to fireworks.ai > Model Library > Filter “Tunable”

You can also filter for “Serverless” models if you are planning to run it serverless
This ensures that you are selecting models which allow LoRA-based tuning and deployments. These models support uploading LoRA adapters even if they were trained on another platform. You can also upload custom models that have the same architecture as the tunable ones in the list, and those models will also be tunable. For example, a deepseek distilled llama 8b model works just as well as a vanilla llama 8b model.
**Let’s say we select “DeepSeek R1 Distill Llama 70b”**

**⚠️ Note:** Serverless LoRA is not currently supported (February 2026). Please check our **Documentation Page** for the latest updates on supported features and fine-tuning capabilities.

Datasets must adhere strictly to the JSONL format, where each line represents a complete JSON-formatted training example.

…

Select the LoRA model from the drop-down list.

Click “Continue”

Then select your deployment. You can either deploy the LoRA model “serverless” or via an “on-demand deployment”.

Deployment Options:

💡 PS: Use an existing on-demand deployment to load the LoRA model onto (instead of serverless)
PS: As we are fine-tuning the DeepSeek R1 Distill Llama 70B, we will need to deploy the LoRA on -demand, rather than serverless. Use an existing on-demand deployment to load the LoRA model onto (instead of serverless)

Enter the model display name and click “Submit”

---

**Source: [Pricing - Together AI](https://www.together.ai/pricing)**
## Fine-tuning

Price per 1M tokens

|Supervised Fine-Tuning|Direct Preference Optimization|Size|LoRA|Full Fine-Tuning|LoRA|Full Fine-Tuning|
|--|--|--|--|--|--|--|
|Up to 16B|$0.48|$0.54|$1.20|$1.35|
|17B-69B|$1.50|$1.65|$3.75|$4.12|
|70-100B|$2.90|$3.20|$7.25|$8.00|
Price is based on the sum of tokens processed in the fine-tuning training dataset (training dataset size * number of epochs) plus any tokens in the optional evaluation dataset (validation dataset size * number of evaluations).
Fine-tuning for the models below incurs minimum charges and is limited to LoRA fine-tuning.

Price per 1M tokens

…

|Qwen3-235B-A22B Qwen3-235B-A22B-Instruct-2507|$6.00|$15.00|No min price|
Price is based on the sum of tokens processed in the fine-tuning training dataset (training dataset size * number of epochs) plus any tokens in the optional evaluation dataset (validation dataset size * number of evaluations).

---

**Source: [Overview - Fireworks AI Docsdocs.fireworks.ai › models › overview](https://docs.fireworks.ai/models/overview)**
### Low-rank adaptation (LoRA) addonsA LoRA addon is a small, fine-tuned model that significantly reduces the amount of memory required to deploy compared to a fully fine-tuned model. Fireworks supports both training, uploading, and serving LoRA addons. LoRA addons must be deployed on a dedicated deployment for its corresponding base model.

---

**Source: [Serverless Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/serverless-models)**
|Organization|Modality|Model Name|Model String for API|
|--|--|--|--|
|Canopy Labs|Text-to-Speech|Orpheus 3B|canopylabs/orpheus-3b-0.1-ft|
|Kokoro|Text-to-Speech|Kokoro|hexgrad/Kokoro-82M|
|Cartesia|Text-to-Speech|Cartesia Sonic 2|cartesia/sonic-2|
|Cartesia|Text-to-Speech|Cartesia Sonic|cartesia/sonic|
|OpenAI|Speech-to-Text|Whisper Large v3|openai/whisper-large-v3|

…

|BGE-Large-EN-v1.5|BAAI/bge-large-en-v1.5|326M|1024|512|
|BGE-Base-EN-v1.5|BAAI/bge-base-en-v1.5|102M|768|512|
|GTE-Modernbert-base|Alibaba-NLP/gte-modernbert-base|149M|768|8192|

---

**Source: [Supervised Fine Tuning on Fireworks AI](https://www.youtube.com/watch?v=FpRd6eFmjjs)**
Lara is a gamecher
{ts:18} when it comes to fine-tuning large models. Instead of updating all model parameters, it trains small low rank
{ts:25} matrices making it much cheaper and faster. Fireworks AI supports up to 100 Laura adapters per base model on
{ts:32} dedicated deployments, which means you can scale with zero added deployment cost.

…

{ts:86} page. You can also click on the drop-own list and see what other models are tunable even from this dashboard. Do
{ts:92} note that this model does not support serverless Laura deployment and you need to create an ondemand Laura deployment
{ts:97} for this.

---

**Source: [Supported Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Concepts - Fireworks AI Docs - Introduction](https://fireworksai-docs.mintlify.app/getting-started/concepts)**
**example**)

- Users can also upload their own custom base models and specify model IDs.

**LoRA (low-rank adaptation) addons:**A LoRA addon is a small, fine-tuned model that significantly reduces the amount of memory required to deploy compared to a fully fine-tuned model. Fireworks supports

**training**,

**uploading**, and

**serving**LoRA addons. LoRA addons must be deployed on a serverless or dedicated deployment for its corresponding base model. Model IDs for LoRAs can be either auto-generated or user-specified.

---

**Source: [Together AI API Pricing and Rate Limits](https://hassandevops.site/together-ai-api-pricing-and-rate-limits-1)**
**Cost of Meta-Llama 3.1-8B Instruct Turbo on HuggingFace**

For users looking to deploy the Meta-Llama model via HuggingFace, the cost is calculated based on

**Tokens Per Million (TPM)**. **Price on TogetherAI**: $0.18 per million tokens

…

**Cost Calculation Formula:**

Where:

**Price Per Million Tokens**= $0.18 **Tokens Used**= Tokens processed within a specific period

**Scenario 1: Tier 2 ($50 paid)** **Maximum Tokens per Minute (TPM)**: 2,000,000 TPM **Price per Million Tokens**: $0.18
**Scenario 2: Tier 3 ($100 paid)** **Maximum Tokens per Minute (TPM)**: 10,000,000 TPM **Price per Million Tokens**: $0.18

**Scenario 3: Tier 4 ($250 paid)** **Maximum Tokens per Minute (TPM)**: 10,000,000 TPM **Price per Million Tokens**: $0.18
**Scenario 4: Tier 5 ($1,000 paid)** **Maximum Tokens per Minute (TPM)**: 20,000,000 TPM **Price per Million Tokens**: $0.18

**Summary of Costs**
|Tier|Tokens per Minute (TPM)|Cost per Minute|Cost per Hour|Cost per Day|
|--|--|--|--|--|
|Tier 2|2,000,000|$0.36|$21.60|$518.40|
|Tier 3|10,000,000|$1.80|$108.00|$2,592.00|

---

**Source: [Together.ai provider - AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)**
|Available Models|
|--|
|`stabilityai/stable-diffusion-xl-base-1.0`|
|`black-forest-labs/FLUX.1-dev`|
|`black-forest-labs/FLUX.1-dev-lora`|
|`black-forest-labs/FLUX.1-schnell`|

---

**Source: [What is Together AI? Features, Pricing, and Use Cases - Walturn](https://www.walturn.com/insights/what-is-together-ai-features-pricing-and-use-cases)**
Additionally, Together AI supports usage-based pricing for inference and training:

Model inference is charged per million tokens, with separate input and output pricing.

Fine-tuning is billed per million training tokens, varying by model size and method (e.g., full training vs. LoRA).

Dedicated GPU endpoints are billed per minute of usage, with high-end GPUs (H100, H200) priced accordingly.

Batch inference is offered at a 50% discount to encourage bulk processing.

This hybrid model - combining predictable per-token costs with flexible infrastructure pricing - gives customers precise control over usage and spend.

---

**Fetched: [Serverless LoRA Inference](https://docs.together.ai/docs/lora-inference)**
## OverviewLoRA (Low-Rank Adaptation) enables efficient fine-tuning of large language models by training only a small set of additional parameters while keeping the original model weights frozen. This approach delivers several key advantages:

**Reduced training costs**: Trains fewer parameters than full fine-tuning, using less GPU memory **Faster deployment**: Produces compact adapter files that can be quickly shared and deployed

Important: Adapters trained before December 17, 2024, require migration to work with the current serverless infrastructure. As a temporary workaround, you can download and re-upload these adapters following the instructions in our adapter upload guide.

## Quick startThis guide demonstrates how to fine-tune a model using LoRA and deploy it for serverless inference. For comprehensive fine-tuning options and best practices, refer to the Fine-Tuning Guide.

### Prerequisites

- Together AI API key

- Training data in the JSONL format

- Compatible base model selection

### Step 1: Upload Training DataFirst, upload your training dataset to Together AI:

```

together files upload "your-datafile.jsonl"

```

### Step 2: Create Fine-tuning JobLaunch a LoRA fine-tuning job using the uploaded file ID:

```

together fine-tuning create \

--training-file "file-629e58b4-ff73-438c-b2cc-f69542b27980" \

--model "meta-llama/Meta-Llama-3.1-8B-Instruct-Reference" \

--lora

```

Once you submit the fine-tuning job you should be able to see the model

Note: If you plan to use a validation set, make sure to set the

`--validation-file`and

`--n-evals`(the number of evaluations over the entire job) parameters.

`--n-evals`needs to be set as a number above 0 in order for your validation set to be used.

`output_name` and

`job_id` in the response:

```



"id": "ft-44129430-ac08-4136-9774-aed81e0164a4",

"training_file": "file-629e58b4-ff73-438c-b2cc-f69542b27980",

"validation_file": "",

"model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Reference",

"output_name": "zainhas/Meta-Llama-3.1-8B-Instruct-Reference-my-demo-finetune-4224205a",

...



```

### Step 3: Getting the output modelOnce you submit the fine-tuning job you should be able to see the model

`output_name` and

`job_id` in the response:

You can also see the status of the job and get the model name if you navigate to your fine-tuned model in the ‘Model’ or ‘Jobs’ tab in the Together dashboard.

```



"id": "ft-44129430-ac08-4136-9774-aed81e0164a4",

"training_file": "file-629e58b4-ff73-438c-b2cc-f69542b27980",

"validation_file": "",

"model": "meta-llama/Meta-Llama-3.1-8B-Instruct-Reference",

"output_name": "zainhas/Meta-Llama-3.1-8B-Instruct-Reference-my-demo-finetune-4224205a",

...



```

### Step 4: Running LoRA inferenceOnce the fine-tuning job is completed, your model is immediately available for inference.

Expected Response:

```

MODEL_NAME_FOR_INFERENCE="zainhas/Meta-Llama-3.1-8B-Instruct-Reference-my-demo-finetune-4224205a"

curl -X POST https://api.together.xyz/v1/chat/completions \

-H "Authorization: Bearer $TOGETHER_API_KEY" \

-H "Content-Type: application/json" \

--data @- <<EOF



"model": "$MODEL_NAME_FOR_INFERENCE",

"messages": [

{ "role": "user", "content": "debate the pros and cons of AI" }

],

"max_tokens": 128



EOF

```

```



"id": "8f2cb236c80ea20e-YYZ",

"object": "text.completion",

"created": 1734331375,

"model": "zainhas/Meta-Llama-3.1-8B-Instruct-Reference-my-demo-finetune-4224205a",

"prompt": [],

"choices": [



"text": "Here's a debate on the pros and cons of AI:\n\n**Moderator:** Welcome to today's debate on the pros and cons of AI. We have two debaters, Alex and Ben, who will present their arguments on the topic. Alex will argue in favor of AI, while Ben will argue against it. Let's begin with opening statements.\n\n**Alex (In Favor of AI):** Thank you, Moderator. AI has revolutionized the way we live and work. It has improved efficiency, productivity, and accuracy in various industries, such as healthcare, finance, and transportation. AI-powered systems can analyze vast amounts of data, identify",

"finish_reason": "length",

"seed": 5626645655383684000,

"logprobs": null,

"index": 0



],

"usage": {

"prompt_tokens": 18,

"completion_tokens": 128,

"total_tokens": 146,

"cache_hit_rate": 0



```

## Performance Characteristics

### Latency Expectations

**Cold start:**Initial requests may experience 5-10 seconds of latency **Warm requests:**Subsequent queries typically respond under 1 second **Optimization tip:**Send a warmup query after deployment to minimize cold starts for production traffic

## Best Practices

**Data Preparation**: Ensure your training data follows the correct JSONL format for your chosen model **Validation Sets**: Always include validation data to monitor training quality **Model Naming**: Use descriptive names for easy identification in production **Warmup Queries**: Run test queries immediately after deployment to optimize response times **Monitoring**: Track inference metrics through the Together dashboard

## Frequently Asked Questions

### Which base models support LoRA fine-tuning?Together AI supports LoRA fine-tuning on a curated selection of high-performance base models. See the complete list for current options.

### What are typical inference latencies?After an initial cold start period (5-10 seconds for the first request), subsequent requests typically achieve sub-second response times. Latency remains consistently low for warm models.

### Can I use streaming responses?Yes, streaming is fully supported. Add

`"stream": true` to your request parameters to receive incremental responses.

### How do I migrate pre-December 2024 adapters?Download your existing adapter files and re-upload them using our adapter upload workflow. We’re working on automated migration for legacy adapters.

### What’s the difference between LoRA and full fine-tuning?LoRA trains only a small set of additional parameters (typically 0.1-1% of model size), resulting in faster training, lower costs, and smaller output files, while full fine-tuning updates all model parameters for maximum customization at higher computational cost.

## Next Steps

- Explore advanced fine-tuning parameters for optimizing model performance

- Learn about uploading custom adapters trained outside Together AI

---

**Fetched: [Pricing - Together AI](https://www.together.ai/pricing)**
## Serverless Inference

State-of-the-art language and multimodal models.

Price per 1M tokens

Batch API price

|Model|Input|Output|
|--|--|--|
|Llama 4 Maverick Llama|$0.27|$0.85|
|Kimi K2.5 Kimi|$0.50|$2.80|
|Qwen3-Coder-Next Qwen|0.50|1.20|
|Llama 3.3 70B Llama|$0.88|$0.88|
|Llama 3.2 3B Instruct Turbo Llama|$0.06|$0.06|
|Llama 3.1 405B Llama|$3.50|$3.50|
|Llama 3.1 70B Llama|$0.88|$0.88|
|Llama 3.1 8B Llama|$0.18|$0.18|
|Llama 3 8B Instruct Lite Llama|$0.10|$0.10|
|DeepSeek-R1-0528 DeepSeek|$3.00|$7.00|
|DeepSeek-V3.1 DeepSeek|$0.60|$1.70|
|DeepSeek-V3-0324 DeepSeek|$1.25|$1.25|
|gpt-oss-120B GPT-OSS|$0.15|$0.60|
|gpt-oss-20B GPT-OSS|$0.05|$0.20|
|Qwen3-Next-80B-A3B-Instruct Qwen|$0.15|$1.50|
|Qwen3-Next-80B-A3B-Thinking Qwen|$0.15|$1.50|
|Qwen3-VL-32B-Instruct Qwen|$0.50|$1.50|
|Qwen3-Coder 480B A35B Instruct Qwen|$2.00|$2.00|
|Qwen3 235B A22B Instruct 2507 FP8 Qwen|$0.20|$0.60|
|Qwen3 235B A22B Thinking 2507 FP8 Qwen|$0.65|$3.00|
|Qwen2.5 7B Instruct Turbo Qwen|$0.30|$0.30|
|GLM-4.7 GLM|$0.45|$2.00|
|Kimi K2 Instruct Kimi|$1.00|$3.00|
|GLM-4.5-Air GLM|$0.20|$1.10|
|Kimi K2 Thinking Kimi|$1.20|$4.00|
|Mistral (7B) Instruct v0.2 Mistral|$0.20|$0.20|
|Mistral Small 3 Mistral|$0.10|$0.30|
|Gemma 3n E4B Instruct Gemma|$0.02|$0.04|
Looks like there are no models for this filter.

Displayed prices refer to the lowest resolution/duration settings. Actual prices might vary.

Generate stunning visuals with the latest and greatest image models.

Price per MP

|Model|Input|Images Per $1 (1MP)|Default steps|
|--|--|--|--|
|FLUX.1 Krea [dev]|$0.025|-|28|
|FLUX.1 Kontext [dev]|$0.025|-|28|
|FLUX.1 Kontext [pro]|$0.04|-|28|
|FLUX.1 Kontext [max]|$0.08|-|28|
|FLUX1.1 [pro]|$0.04|-|-|
|FLUX.1 [dev]|$0.025|-|28|
|FLUX.1 [schnell]|$0.0027|-|4|
|FLUX.1 Canny [pro]|$0.05|-|-|
|Google Imagen 4.0 Preview|$0.04|-|-|
|Google Imagen 4.0 Fast|$0.02|-|-|
|Google Imagen 4.0 Ultra|$0.06|-|-|
|Gemini Flash Image 2.5 (Nano Banana)|$0.039|-|-|
|ByteDance Seedream 3.0|$0.018|-|-|
|ByteDance Seedream 4.0|$0.03|-|-|
|ByteDance SeedEdit|$0.03|-|-|
|Qwen Image Edit|$0.0032|-|-|
|Qwen Image|$0.0058|-|-|
|Juggernaut Pro Flux|$0.0049|-|-|
|Juggernaut Lightning Flux|$0.0017|-|-|
|HiDream-I1-Full|$0.009|-|-|
|HiDream-I1-Dev|$0.0045|-|-|
|HiDream-I1-Fast|$0.0032|-|-|
|Ideogram 3.0|$0.06|-|-|
|Dreamshaper|$0.0006|-|-|
|SD XL|$0.0019|-|-|
|Stable Diffusion 3|$0.0019|-|-|
*Prices include default steps shown above. Additional costs apply only when exceeding default steps. * *See full pricing details →*

Speech synthesis and processing models.

Price per 1M Characters

|Model|Price|
|--|--|
|Cartesia Sonic-2|$65.00|
|Cartesia Sonic-3|$65.00|
Use our video generation API to create high-quality videos.

Price per video

|Model|Price|
|--|--|
|MiniMax 01 Director|$0.28|
|MiniMax Hailuo 02|$0.49|
|Google Veo 2.0|$2.50|
|Google Veo 3.0|$1.60|
|Google Veo 3.0 + Audio|$3.20|
|Google Veo 3.0 Fast|$0.80|
|Google Veo 3.0 Fast + Audio|$1.20|
|ByteDance Seedance 1.0 Lite|$0.14|
|ByteDance Seedance 1.0 Pro|$0.57|
|PixVerse v5|$0.30|
|Kling 2.1 Master|$0.92|
|Kling 2.1 Standard|$0.18|
|Kling 2.1 Pro|$0.32|
|Kling 2.0 Master|$0.92|
|Kling 1.6 Standard|$0.19|
|Kling 1.6 Pro|$0.32|
|Wan 2.2 I2V|$0.31|
|Wan 2.2 T2V|$0.66|
|Vidu 2.0|$0.28|
|Vidu Q1|$0.22|
|Sora 2|$0.80|
|Sora 2 Pro|$2.40|
Models for automatic speech recognition (ASR) and speech translation.

Price per audio minute

Batch API price

|Model|Price|
|--|--|
|Whisper Large v3|$0.0015|
Vector embeddings for semantic search and RAG.

Price per 1M tokens

|Model|Price|
|--|--|
|BGE-Base-EN v1.5|$0.01|
|BGE-Large-EN v1.5|$0.02|
|GTE ModernBERT base|$0.08|
|Multilingual e5 large instruct|$0.02|
Improve search relevance with reranking models.

Price per 1M tokens

|Model|Price|
|--|--|
|Mxbai Rerank Large V2|$0.10|
Filter and classify content for safety and compliance.

Price per 1M tokens

|Model|Price|
|--|--|
|VirtueGuard Text Lite|$0.20|
|Llama Guard 4 12B|$0.20|
|Llama Guard 3 11B Vision Turbo|$0.18|
|Llama Guard 3 8B|$0.20|
|Llama Guard 2 8B|$0.20|
Deploy models on custom hardware with guaranteed performance and full control.

Guaranteed performance (no sharing)

Support for custom models

Autoscaling & traffic spike handling

|Hardware Type|Price/Hour|
|--|--|
|1x H200 141GB|$4.99|
|1x H100 80GB|$3.36|
|1x A100 SXM 80GB|$2.56|
|1x A100 SXM 40GB|$2.40|
|1x A100 PCIe 80GB|$2.40|
|1x L40S 48GB|$2.10|
## Fine-tuning

Price per 1M tokens

|Supervised Fine-Tuning|Direct Preference Optimization|Size|LoRA|Full Fine-Tuning|LoRA|Full Fine-Tuning|
|--|--|--|--|--|--|--|
|Up to 16B|$0.48|$0.54|$1.20|$1.35|
|17B-69B|$1.50|$1.65|$3.75|$4.12|
|70-100B|$2.90|$3.20|$7.25|$8.00|
Price is based on the sum of tokens processed in the fine-tuning training dataset (training dataset size * number of epochs) plus any tokens in the optional evaluation dataset (validation dataset size * number of evaluations).

Fine-tuning for the models below incurs minimum charges and is limited to LoRA fine-tuning.

Price per 1M tokens

|Model|Supervised Fine-Tuning (LoRA)|Direct Preference Optimization (LoRA)|Minimum charge|
|--|--|--|--|
|DeepSeek-R1 DeepSeek-R1-0528 DeepSeek-V3 DeepSeek-V3-0324 DeepSeek-V3.1 DeepSeek-V3.1-Base|$10.00|$25.00|$20.00|
|GLM-4.6 GLM-4.7|$9.00|$22.50|$27.00|
|gpt-oss-120B|$5.00|$12.50|$6.00|
|Kimi K2 Thinking Kimi K2 Instruct-0905 Kimi K2 Instruct Kimi K2 Base|$15.00|$37.50|$60.00|
|Llama 4 Maverick Llama 4 Maverick Instruct|$8.00|$20.00|$16.00|
|Llama 4 Scout Llama 4 Scout Instruct|$3.00|$7.50|$6.00|
|Qwen3-Coder-480B-A35B-Instruct|$9.00|$22.50|$18.00|
|Qwen3-235B-A22B Qwen3-235B-A22B-Instruct-2507|$6.00|$15.00|No min price|
Price is based on the sum of tokens processed in the fine-tuning training dataset (training dataset size * number of epochs) plus any tokens in the optional evaluation dataset (validation dataset size * number of evaluations).

## Code Execution

Customize a deployment of VM sandboxes for large development environments.

Price per hour

|Price|
|--|
|Per vCPU|$0.0446|
|Per GiB RAM|$0.0149|
Execute LLM-generated code securely using our API.

Price per session

|Price|
|--|
|Session (60 minutes)|$0.03|
## GPU Cloud

Choice of Kubernetes or Slurm on Kubernetes

Free network ingress and egress

NVIDIA InfiniBand and NVLink networking

All Together Instant and Reserved Clusters feature: choice of Kubernetes or Slurm on Kubernetes, free network ingress and egress, NVIDIA InfiniBand, and NVLink networking.

Ready to use, self-service GPUs.

Price per hour per GPU

|Hardware|1 Week - 3 Months|1 - 6 Days|Hourly|
|--|--|--|--|
|NVIDIA HGX H100 SXM|$2.20|$2.50|$2.99|
|NVIDIA HGX H200|$3.15|$3.45|$3.79|
|NVIDIA HGX B200|$4.50|$4.90|$5.50|
Dedicated capacity, with expert support.

Price per hour

|Hardware|GPU Memory|Price|
|--|--|--|
|NVIDIA GB200 NVL72|384GB HBM3e|Contact us|
|NVIDIA B200|192GB HBM3e|Contact us|
|NVIDIA H200|141GB HBM3e|Starting at $2.09|
|NVIDIA H100|80GB HBM2e|Starting at $1.75|
|NVIDIA A100|80GB HBM2e|Starting at $1.30|
Large-scale, custom-built private GPU clusters. 1K → 10K → 100K+ NVIDIA GPUs.

High-bandwidth, parallel filesystem colocated with your compute.

|Item|Price|Unit|
|--|--|--|
|Shared Filesystem|$0.16|GiB/month|

---

### Search Queries: Together AI serverless LoRA base models list compatible models, Replicate fine-tuning LoRA supported models 2025, Modal LoRA serving inference models 2025

---

**Source: [Fine-tuning - Supported Models - Together.ai Docs](https://docs.together.ai/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Combine LoRAs when...](https://replicate.com/docs/guides/extend/working-with-loras)**
LoRA works by keeping the original model frozen and only adding small, trainable layers to the model. Think of it like applying a filter to a camera lens: the base model remains unchanged, but the filter tweaks the output in a specific way. This allows LoRAs to capture new styles or subjects without needing to retrain everything from scratch.

This approach makes fine-tuning more efficient, reducing memory and compute requirements without sacrificing quality. It also means multiple LoRAs can be swapped in and out of a model, allowing for quick customization without permanent changes.

…

## Combine LoRAs when generating images with Flux

A little-known feature of Flux fine-tunes on Replicate is that you can combine multiple LoRA styles in a single output image. LoRA stands for “Low-Rank Adaptation”. I won’t go into technical detail about how LoRAs work here, but the important thing to know is that it’s become an industry term for “trained weights” in the context of fine-tuning image models. When you refer to “a LoRA”, you’re talking about a specific set of trained weights that get added to the base Flux model to constitute a “fine-tuned model”.

…

- Create a fine-tuned model with whatever training data you have available.

- Explore LoRA fine-tunes from the community and pick a few that you like.

- Generate images with your fine-tuned model, combining it with the other LoRAs you selected.

- Comb through the outputs and select the ones that meet your expectations.

- Run a new training job using those outputs as training data.

To find LoRAs to combine with your model, check out the Flux fine-tunes on Replicate and Replicate LoRA fine-tunes on Hugging Face.

---

**Source: [Create a LoRA Playground with Modal, Gradio, and S3](https://modal.com/docs/examples/cloud_bucket_mount_loras)**
## Inference with LoRAs

We define a

`StableDiffusionLoRA` class to organize our inference code.

We load Stable Diffusion XL 1.0 as a base model, then, when doing inference,

we load whichever LoRA the user specifies from the S3 bucket.

For more on the decorators we use on the methods below to speed up building and booting,

---

**Source: [Serverless Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/serverless-models)**
|Organization|Modality|Model Name|Model String for API|
|--|--|--|--|
|Canopy Labs|Text-to-Speech|Orpheus 3B|canopylabs/orpheus-3b-0.1-ft|
|Kokoro|Text-to-Speech|Kokoro|hexgrad/Kokoro-82M|

---

**Source: [Using LoRA adapters - Modular Docs](https://docs.modular.com/max/serve/lora-adapters/)**
By encoding task-specific behavior into the model, LoRA adapters can reduce prompt length, eliminate the need for repeated context, and improve inference efficiency.

LoRA adapters also enable you to serve a single base model with multiple specializations, minimizing memory usage and simplifying deployment.

Adapters are especially effective at capturing specialized vocabulary, tone, or structure, and can help address model drift through targeted fine-tuning in production.

---

**Source: [Supported Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Together.ai provider - AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)**
|Available Models|
|--|
|`stabilityai/stable-diffusion-xl-base-1.0`|
|`black-forest-labs/FLUX.1-dev`|
|`black-forest-labs/FLUX.1-dev-lora`|
|`black-forest-labs/FLUX.1-schnell`|

---

**Fetched: [Audio models](https://docs.together.ai/docs/serverless-models)**
## Chat models

In the table below, models marked as “Turbo” are quantized to FP8 and those marked as “Lite” are INT4. All our other models are at full precision (FP16).If you’re not sure which chat model to use, we currently recommend

**Llama 3.3 70B Turbo**(

`meta-llama/Llama-3.3-70B-Instruct-Turbo`) to get started.

* The Free version of Llama 3.3 70B Instruct Turbo has a reduced rate limit of .6 requests/minute (36/hour) for users on the free tier and 3 requests/minute for any user who has added a credit card on file. *Deprecated model, see Deprecations for more details

|Organization|Model Name|API Model String|Context length|Quantization|
|--|--|--|--|--|
|Moonshot|Kimi K2 Instruct 0905|moonshotai/Kimi-K2-Instruct-0905|262144|FP8|
|Moonshot|Kimi K2 Thinking|moonshotai/Kimi-K2-Thinking|262144|INT4|
|Moonshot|Kimi K2.5|moonshotai/Kimi-K2.5|262144|INT4|
|DeepSeek|DeepSeek-V3.1|deepseek-ai/DeepSeek-V3.1|128000|FP8|
|OpenAI|GPT-OSS 120B|openai/gpt-oss-120b|128000|MXFP4|
|OpenAI|GPT-OSS 20B|openai/gpt-oss-20b|128000|MXFP4|
|Moonshot|Kimi K2 Instruct|moonshotai/Kimi-K2-Instruct|128000|FP8|
|Z.ai|GLM-5|zai-org/GLM-5|202752|FP4|
|Z.ai|GLM 4.7|zai-org/GLM-4.7|202752|FP8|
|Z.ai|GLM 4.5 Air|zai-org/GLM-4.5-Air-FP8|131072|FP8|
|Qwen|Qwen3 235B-A22B Thinking 2507|Qwen/Qwen3-235B-A22B-Thinking-2507|262144|FP8|
|Qwen|Qwen3-Coder 480B-A35B Instruct|Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8|256000|FP8|
|Qwen|Qwen3-Coder-Next|Qwen/Qwen3-Coder-Next-FP8|262144|FP8|
|Qwen|Qwen3 235B-A22B Instruct 2507|Qwen/Qwen3-235B-A22B-Instruct-2507-tput|262144|FP8|
|Qwen|Qwen3-Next-80B-A3B-Instruct|Qwen/Qwen3-Next-80B-A3B-Instruct|262144|BF16|
|Qwen|Qwen3-Next-80B-A3B-Thinking|Qwen/Qwen3-Next-80B-A3B-Thinking|262144|BF16|
|DeepSeek|DeepSeek-R1-0528|deepseek-ai/DeepSeek-R1|163839|FP8|
|Meta|Llama 4 Maverick (17Bx128E)|meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8|1048576|FP8|
|Meta|Llama 3.3 70B Instruct Turbo|meta-llama/Llama-3.3-70B-Instruct-Turbo|131072|FP8|
|Deep Cogito|Cogito v2.1 671B|deepcogito/cogito-v2-1-671b|32768|FP8|
|Mistral AI|Ministral 3 14B Instruct 2512|mistralai/Ministral-3-14B-Instruct-2512|262144|BF16|
|Marin Community|Marin 8B Instruct|marin-community/marin-8b-instruct|4096|FP16|
|Essential AI|Rnj-1 Instruct|essentialai/rnj-1-instruct|32768|BF16|
|Mistral AI|Mistral Small 3 Instruct (24B)|mistralai/Mistral-Small-24B-Instruct-2501|32768|FP16|
|Meta|Llama 3.1 8B Instruct Turbo|meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo|131072|FP8|
|Qwen|Qwen 2.5 7B Instruct Turbo|Qwen/Qwen2.5-7B-Instruct-Turbo|32768|FP8|
|Arcee|Arcee AI Trinity Mini|arcee-ai/trinity-mini|32768|-|
|Meta|Llama 3.2 3B Instruct Turbo|meta-llama/Llama-3.2-3B-Instruct-Turbo|131072|FP16|
|Meta|Llama 3 8B Instruct Lite|meta-llama/Meta-Llama-3-8B-Instruct-Lite|8192|INT4|
|Meta|Llama 3 70B Instruct Reference|meta-llama/Llama-3-70b-chat-hf|8192|FP16|
|Gemma Instruct (2B)|google/gemma-2b-it*|8192|FP16|
|Gemma 3N E4B Instruct|google/gemma-3n-E4B-it|32768|FP8|
|Gryphe|MythoMax-L2 (13B)|Gryphe/MythoMax-L2-13b*|4096|FP16|
|Mistral AI|Mistral (7B) Instruct v0.2|mistralai/Mistral-7B-Instruct-v0.2|32768|FP16|
|NVIDIA|Nemotron Nano 9B v2|nvidia/NVIDIA-Nemotron-Nano-9B-v2|131072|BF16|
**Chat Model Examples**

- PDF to Chat App - Chat with your PDFs (blogs, textbooks, papers)

- Open Deep Research Notebook - Generate long form reports using a single prompt

- RAG with Reasoning Models Notebook - RAG with DeepSeek-R1

- Fine-tuning Chat Models Notebook - Tune Language models for conversation

- Building Agents - Agent workflows with language models

## Image modelsUse our Images endpoint for Image Models.

Note: Image models can only be used with credits. Users are unable to call Image models with a zero or negative balance.

|Organization|Model Name|Model String for API|Default steps|
|--|--|--|--|
|Imagen 4.0 Preview|google/imagen-4.0-preview|-|
|Imagen 4.0 Fast|google/imagen-4.0-fast|-|
|Imagen 4.0 Ultra|google/imagen-4.0-ultra|-|
|Flash Image 2.5 (Nano Banana)|google/flash-image-2.5|-|
|Gemini 3 Pro Image (Nano Banana 2)|google/gemini-3-pro-image|-|
|Black Forest Labs|Flux.1 [schnell] (Turbo)|black-forest-labs/FLUX.1-schnell|4|
|Black Forest Labs|Flux.1 Dev|black-forest-labs/FLUX.1-dev|28|
|Black Forest Labs|Flux1.1 [pro]|black-forest-labs/FLUX.1.1-pro|-|
|Black Forest Labs|Flux.1 Kontext [pro]|black-forest-labs/FLUX.1-kontext-pro|28|
|Black Forest Labs|Flux.1 Kontext [max]|black-forest-labs/FLUX.1-kontext-max|28|
|Black Forest Labs|Flux.1 Kontext [dev]|black-forest-labs/FLUX.1-kontext-dev|28|
|Black Forest Labs|FLUX.1 Krea [dev]|black-forest-labs/FLUX.1-krea-dev|28|
|Black Forest Labs|FLUX.2 [pro]|black-forest-labs/FLUX.2-pro|-|
|Black Forest Labs|FLUX.2 [dev]|black-forest-labs/FLUX.2-dev|-|
|Black Forest Labs|FLUX.2 [flex]|black-forest-labs/FLUX.2-flex|-|
|ByteDance|Seedream 3.0|ByteDance-Seed/Seedream-3.0|-|
|ByteDance|Seedream 4.0|ByteDance-Seed/Seedream-4.0|-|
|Qwen|Qwen Image|Qwen/Qwen-Image|-|
|RunDiffusion|Juggernaut Pro Flux|RunDiffusion/Juggernaut-pro-flux|-|
|RunDiffusion|Juggernaut Lightning Flux|Rundiffusion/Juggernaut-Lightning-Flux|-|
|HiDream|HiDream-I1-Full|HiDream-ai/HiDream-I1-Full|-|
|HiDream|HiDream-I1-Dev|HiDream-ai/HiDream-I1-Dev|-|
|HiDream|HiDream-I1-Fast|HiDream-ai/HiDream-I1-Fast|-|
|Ideogram|Ideogram 3.0|ideogram/ideogram-3.0|-|
|Lykon|Dreamshaper|Lykon/DreamShaper|-|
|Stability AI|Stable Diffusion 3|stabilityai/stable-diffusion-3-medium|-|
|Stability AI|SD XL|stabilityai/stable-diffusion-xl-base-1.0|-|
**Image Model Examples**

- Blinkshot.io - A realtime AI image playground built with Flux Schnell

- Logo Creator - An logo generator that creates professional logos in seconds using Flux Pro 1.1

- PicMenu - A menu visualizer that takes a restaurant menu and generates nice images for each dish.

- Flux LoRA Inference Notebook - Using LoRA fine-tuned image generations models

**How FLUX pricing works**For FLUX models (except for pro) pricing is based on the size of generated images (in megapixels) and the number of steps used (if the number of steps exceed the default steps). **Default pricing:**The listed per megapixel prices are for the default number of steps. **Using more or fewer steps:**Costs are adjusted based on the number of steps used **only if you go above the default steps**. If you use more steps, the cost increases proportionally using the formula below. If you use fewer steps, the cost *does not*decrease and is based on the default rate.

- MP = (Width × Height ÷ 1,000,000)

- Price per MP = Cost for generating one megapixel at the default steps

- Steps = The number of steps used for the image generation. This is only factored in if going above default steps.

**How Pricing works for Gemini 3 Pro Image**Gemini 3 Pro Image offers pricing based on the resolution of the image.

- 1080p and 2K: $0.134/image

- 4K resolution: $0.24 /image

## Vision modelsIf you’re not sure which vision model to use, we currently recommend

**Llama 4 Maverick**(

`meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8`) to get started. For model specific rate limits, navigate here.

|Organization|Model Name|API Model String|Context length|
|--|--|--|--|
|Meta|Llama 4 Maverick (17Bx128E)|meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8|524288|
|Qwen|Qwen3-VL-32B-Instruct|Qwen/Qwen3-VL-32B-Instruct|256000|
|Qwen|Qwen3-VL-8B-Instruct|Qwen/Qwen3-VL-8B-Instruct|262100|
**Vision Model Examples**

- LlamaOCR - A tool that takes documents (like receipts) and outputs markdown

- Wireframe to Code - A wireframe to app tool that takes in a UI mockup of a site and give you React code.

- Extracting Structured Data from Images - Extract information from images as JSON

## Video models

|Organization|Model Name|Model String for API|Resolution / Duration|
|--|--|--|--|
|MiniMax|MiniMax 01 Director|minimax/video-01-director|720p / 5s|
|MiniMax|MiniMax Hailuo 02|minimax/hailuo-02|768p / 10s|
|Veo 2.0|google/veo-2.0|720p / 5s|
|Veo 3.0|google/veo-3.0|720p / 8s|
|Veo 3.0 + Audio|google/veo-3.0-audio|720p / 8s|
|Veo 3.0 Fast|google/veo-3.0-fast|1080p / 8s|
|Veo 3.0 Fast + Audio|google/veo-3.0-fast-audio|1080p / 8s|
|ByteDance|Seedance 1.0 Lite|ByteDance/Seedance-1.0-lite|720p / 5s|
|ByteDance|Seedance 1.0 Pro|ByteDance/Seedance-1.0-pro|1080p / 5s|
|PixVerse|PixVerse v5|pixverse/pixverse-v5|1080p / 5s|
|Kuaishou|Kling 2.1 Master|kwaivgI/kling-2.1-master|1080p / 5s|
|Kuaishou|Kling 2.1 Standard|kwaivgI/kling-2.1-standard|720p / 5s|
|Kuaishou|Kling 2.1 Pro|kwaivgI/kling-2.1-pro|1080p / 5s|
|Kuaishou|Kling 2.0 Master|kwaivgI/kling-2.0-master|1080p / 5s|
|Kuaishou|Kling 1.6 Standard|kwaivgI/kling-1.6-standard|720p / 5s|
|Kuaishou|Kling 1.6 Pro|kwaivgI/kling-1.6-pro|1080p / 5s|
|Wan-AI|Wan 2.2 I2V|Wan-AI/Wan2.2-I2V-A14B|-|
|Wan-AI|Wan 2.2 T2V|Wan-AI/Wan2.2-T2V-A14B|-|
|Vidu|Vidu 2.0|vidu/vidu-2.0|720p / 8s|
|Vidu|Vidu Q1|vidu/vidu-q1|1080p / 5s|
|OpenAI|Sora 2|openai/sora-2|720p / 8s|
|OpenAI|Sora 2 Pro|openai/sora-2-pro|1080p / 8s|
## Audio modelsUse our Audio endpoint for text-to-speech models. For speech-to-text models see Transcription and Translations

|Organization|Modality|Model Name|Model String for API|
|--|--|--|--|
|Canopy Labs|Text-to-Speech|Orpheus 3B|canopylabs/orpheus-3b-0.1-ft|
|Kokoro|Text-to-Speech|Kokoro|hexgrad/Kokoro-82M|
|Cartesia|Text-to-Speech|Cartesia Sonic 2|cartesia/sonic-2|
|Cartesia|Text-to-Speech|Cartesia Sonic|cartesia/sonic|
|OpenAI|Speech-to-Text|Whisper Large v3|openai/whisper-large-v3|
|Mistral AI|Speech-to-Text|Voxtral Mini 3B|mistralai/Voxtral-Mini-3B-2507|
**Audio Model Examples**

- PDF to Podcast Notebook - Generate a NotebookLM style podcast given a PDF

- Audio Podcast Agent Workflow - Agent workflow to generate audio files given input content

## Embedding models

|Model Name|Model String for API|Model Size|Embedding Dimension|Context Window|
|--|--|--|--|--|
|BGE-Base-EN-v1.5|BAAI/bge-base-en-v1.5|102M|768|512|
|GTE-Modernbert-base|Alibaba-NLP/gte-modernbert-base|149M|768|8192|
|Multilingual-e5-large-instruct|intfloat/multilingual-e5-large-instruct|560M|1024|514|
**Embedding Model Examples**

- Contextual RAG - An open source implementation of contextual RAG by Anthropic

- Code Generation Agent - An agent workflow to generate and iteratively improve code

- Multimodal Search and Image Generation - Search for images and generate more similar ones

- Visualizing Embeddings - Visualizing and clustering vector embeddings

## Rerank modelsOur Rerank API has built-in support for the following models, that we host via our serverless endpoints.

|Organization|Model Name|Model Size|Model String for API|Max Doc Size (tokens)|Max Docs|
|--|--|--|--|--|--|
|MixedBread|Rerank Large|1.6B|mixedbread-ai/Mxbai-Rerank-Large-V2|32768|-|
**Rerank Model Examples**

- Search and Reranking - Simple semantic search pipeline improved using a reranker

- Implementing Hybrid Search Notebook - Implementing semantic + lexical search along with reranking

## Moderation modelsUse our Completions endpoint to run a moderation model as a standalone classifier, or use it alongside any of the other models above as a filter to safeguard responses from 100+ models, by specifying the parameter

`"safety_model": "MODEL_API_STRING"`

|Organization|Model Name|Model String for API|Context length|
|--|--|--|--|
|Meta|Llama Guard 4 (12B)|meta-llama/Llama-Guard-4-12B|1048576|
|Virtue AI|Virtue Guard|VirtueAI/VirtueGuard-Text-Lite|32768|

---

### Search Queries: Together AI serverless LoRA compatible base models list page, Fireworks AI pricing per token models 2025 2026, Nebius AI Studio fine-tuning models supported list pricing

---

**Source: [Fine-tuning - Supported Models - Together.ai Docs](https://docs.together.ai/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Pricing - Fireworks AI](https://fireworks.ai/pricing)**
|Base model|$ / 1M tokens|
|--|--|
|Less than 4B parameters|$0.10|
|4B - 16B parameters|$0.20|
|More than 16B parameters|$0.90|
|MoE 0B - 56B parameters (e.g. Mixtral 8x7B)|$0.50|

…

|GLM-5|$1.00 input, $0.20 cached input, $3.20 output|
|Qwen3 VL 30B A3B|$0.15 input, $0.60 output|
|Kimi K2 Instruct, Kimi K2 Thinking|$0.60 input, $2.50 output|
|Kimi K2.5|$0.60 input, $0.10 cached input, $3.00 output|
|OpenAI gpt-oss-120b|$0.15 input, $0.60 output|
|OpenAI gpt-oss-20b|$0.07 input, $0.30 output|

…

|Base model parameter count|$ / 1M input tokens|
|--|--|
|up to 150M|$0.008|
|150M - 350M|$0.016|
|Qwen3 8B|$0.1|
Serve fine-tuned models for the same price as base models.
Priced per 1M training tokens

|Base Model|Supervised Fine Tuning|Direct Preference Optimization|
|--|--|--|
|Models up to 16B parameters|$0.50|$1.00|
|Models 16.1B - 80B|$3.00|$6.00|
|Models 80B - 300B (e.g. Qwen3-235B, gpt-oss-120B)|$6.00|$12.00|

---

**Source: [Fireworks: Models Intelligence, Performance & Price](https://artificialanalysis.ai/providers/fireworks)**
Blended Price ($/M tokens): Qwen3 8B ($0.20) and gpt-oss-120B (low) ($0.26) are the cheapest models offered by Fireworks, followed by gpt-oss-120B (high), Qwen3 30B & Qwen3

…

Price per token, represented as USD per million Tokens. Price is a blend of Input & Output token prices (3:1 ratio).

Price per token generated by the model (received from the API), represented as USD per million Tokens.

Price per token included in the request/message sent to the API, represented as USD per million Tokens.

---

**Source: [Fine-tune open models with Nebius Token Factory](https://nebius.com/services/token-factory/fine-tuning)**
## Developer-friendly workflow

Move from selection to deployment in minutes with our OpenAI-compatible API, intuitive UI and transparent per-token pricing.

…

## Transparent, competitive pricing

Pay only for the compute resources you use during LoRA fine-tuning and inference. No monthly fees, infrastructure costs or hidden charges.

## Start your journey with these in-depth guides

### Beyond prompting: fine-tuning LLMs

Learn how to customize open-source models for your specific requirements and improve performance on domain-specific tasks.

### Make AI work for you

Discover how Nebius Token Factory' fine-tuning service transforms generic models into specialized solutions with 30+ leading open-source models.

…

We offer 30+ leading open source models, including Llama 3 series (1B to 70B), Qwen series (1.5B to 72B) and specialized models like DeepSeek Coder. All models support LoRA, with full fine-tuning available for models under 20B parameters.
Our pricing is token-based and depends on model size, training data size, and number of epochs. We offer competitive rates with no hidden costs. Both training and deployment costs are clearly defined upfront.

Choose from serverless deployment via Nebius Token Factory, on-demand GPU instances or reserved clusters via Nebius AI Cloud. Easily switch between options as your needs evolve, with automatic scaling and infrastructure management. Our dedicated technical team is here to help.

---

**Source: [Serverless Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/serverless-models)**
|Organization|Modality|Model Name|Model String for API|
|--|--|--|--|
|Canopy Labs|Text-to-Speech|Orpheus 3B|canopylabs/orpheus-3b-0.1-ft|
|Kokoro|Text-to-Speech|Kokoro|hexgrad/Kokoro-82M|

---

**Source: [Fireworks AI: Features, and Pricing](https://www.eesel.ai/blog/fireworks-ai-pricing)**
#### Frequently asked questions

Fireworks AI pricing is primarily pay-as-you-go, based directly on your usage. It's broken down into per-token fees for serverless inference, hourly rates for dedicated GPU deployments, and one-off fees for fine-tuning models. Batch processing also offers a discounted rate.

The Fireworks AI pricing model is most cost-effective for technical teams building custom AI applications from scratch, especially if they can efficiently manage GPU utilization. For specific, off-the-shelf solutions like support automation, a tool with predictable monthly plans might offer better overall value.

---

**Source: [Make AI work for you: fine-tuning launches on Nebius AI Studio](https://www.youtube.com/watch?v=wk04TOCsFuw)**
- 30+ leading models, including Llama 3, Qwen and Mistral AI
- Both LoRA and full fine-tuning approaches
- High-performance GPU infrastructure
- OpenAI SDK compatibility
- Transparent, usage-based pricing

💡 Why it matters: You can now create AI solutions that truly understand your domain, reducing costs while improving accuracy. Instead of complex prompts and large context windows, get models that inherently understand your requirements.

➡️ Learn more: https://nebius.com/services/studio-fine-tuning

…

{ts:81} console,  you'll  see  the  prices  of 
 training  1  million  tokens  of  the
{ts:84} 
 selected  model.  Click  on  the  create  job 

{ts:86} button  in  the  lower  panel  to  initiate 
 your  finetuning
{ts:92} 
 run.  There  you  have  it.  Your  tuning  job

---

**Source: [Supported Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Together.ai provider - AI SDK](https://ai-sdk.dev/providers/ai-sdk-providers/togetherai)**
# Together.ai Provider

The Together.ai provider contains support for 200+ open-source models through the Together.ai API.

## Setup

The Together.ai provider is available via the

`@ai-sdk/togetherai` module. You can

install it with

pnpm add @ai-sdk/togetherai

…

## Model Capabilities

|Model|Image Input|Object Generation|Tool Usage|Tool Streaming|
|--|--|--|--|--|
|`meta-llama/Llama-3.3-70B-Instruct-Turbo`|
|`meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo`|

…

|Available Models|
|--|
|`stabilityai/stable-diffusion-xl-base-1.0`|
|`black-forest-labs/FLUX.1-dev`|
|`black-forest-labs/FLUX.1-dev-lora`|
|`black-forest-labs/FLUX.1-schnell`|

---

**Source: [What is Fireworks AI? Features, Pricing, and Use Cases](https://www.walturn.com/insights/what-is-fireworks-ai-features-pricing-and-use-cases)**
## Pricing and Commercial Strategy

Fireworks AI employs a usage-based pricing model, with transparent per-token and per-inference-step rates across a wide range of models and hardware options:

**Text Model Inference**:

Entry-tier models (<4B parameters): $0.10 per 1M tokens

Mid-tier models (4B–16B): $0.20 per 1M tokens
High-end models (>16B): Up to $0.90–$1.20 per 1M tokens

MoE Models (e.g., Mixtral, DBRX): Tiered rates based on parameter count and complexity

**Fine-Tuning**:

Training costs start at $0.50 per 1M tokens for models up to 16B parameters, with premium rates for larger architectures or more complex training techniques.

---

**Source: [Nebius AI Studio Q1 2025 roundup: Fine-tuning, new models and major expansions](https://preprod.nebius.ai/blog/posts/q1-2025-studio-updates)**
### Fine-tuning: Now available for everyone

After an extensive beta period, we’re thrilled to announce that fine-tuning is now generally available on Nebius AI Studio. This powerful capability allows you to transform generic AI models into specialized solutions that work precisely for your unique needs.

With our fine-tuning system, you can:

…

Fine-tuned models deliver significant advantages over generic models: they become more compact, responsive and domain-specialized; understanding your industry terminology and without complex prompting. The end result is improved accuracy, reduced costs and more consistent outputs.

Our developer-friendly workflow lets you move from model selection to fine-tuning and deployment in minutes by using our OpenAI-compatible API. You can download model checkpoints for local use or instantly deploy models like Llama 3.3-70B, Meta-Llama-3.1-8B and Qwen2.5-72B on our infrastructure, in just one click.

---

**Fetched: [Pricing - Fireworks AI](https://fireworks.ai/pricing)**
Start building in seconds, self-serve. Contact us for enterprise deployments with faster speeds, lower costs, and higher rate limits.

Get started in seconds with per token pricing, zero setup and no cold starts

Pay per token, with high rate limits and postpaid billing. Get started with $1 in free credits.

|Base model|$ / 1M tokens|
|--|--|
|Less than 4B parameters|$0.10|
|4B - 16B parameters|$0.20|
|More than 16B parameters|$0.90|
|MoE 0B - 56B parameters (e.g. Mixtral 8x7B)|$0.50|
|MoE 56.1B - 176B parameters (e.g. DBRX, Mixtral 8x22B)|$1.20|
|DeepSeek V3 family|$0.56 input, $1.68 output|
|GLM-4.7|$0.60 input, $2.20 output|
|GLM-5|$1.00 input, $0.20 cached input, $3.20 output|
|Qwen3 VL 30B A3B|$0.15 input, $0.60 output|
|Kimi K2 Instruct, Kimi K2 Thinking|$0.60 input, $2.50 output|
|Kimi K2.5|$0.60 input, $0.10 cached input, $3.00 output|
|OpenAI gpt-oss-120b|$0.15 input, $0.60 output|
|OpenAI gpt-oss-20b|$0.07 input, $0.30 output|
|MiniMax M2 family|$0.30 input, $0.03 cached input, $1.20 output|
Pay per second of audio input

|Model|$ / audio minute (billed per second)|
|--|--|
|Whisper-v3-large|$0.0015|
|Whisper-v3-large-turbo|$0.0009|
|Image model name|$ / step|Approx $ / image|
|--|--|--|
|All Non-Flux Models (SDXL, Playground, etc)|$0.00013 per step ($0.0039 per 30 step image)|$0.0002 per step ($0.006 per 30 step image)|
|FLUX.1 [dev]|$0.0005 per step ($0.014 per 28 step image)|N/A on serverless|
|FLUX.1 [schnell]|$0.00035 per step ($0.0014 per 4 step image)|N/A on serverless|
|FLUX.1 Kontext Pro|$0.04 per image|N/A|
|FLUX.1 Kontext Max|$0.08 per image|N/A|
|Base model parameter count|$ / 1M input tokens|
|--|--|
|up to 150M|$0.008|
|150M - 350M|$0.016|
|Qwen3 8B|$0.1|
Serve fine-tuned models for the same price as base models.

Priced per 1M training tokens

|Base Model|Supervised Fine Tuning|Direct Preference Optimization|
|--|--|--|
|Models up to 16B parameters|$0.50|$1.00|
|Models 16.1B - 80B|$3.00|$6.00|
|Models 80B - 300B (e.g. Qwen3-235B, gpt-oss-120B)|$6.00|$12.00|
|Models >300B (e.g. DeepSeek V3, Kimi K2)|$10.00|$20.00|
Reinforcement fine tuning jobs are priced per GPU hour (billed per second), at the same price as Fireworks on-demand deployment. Please see the section below for details on RFT pricing.

Pay per GPU second, with no extra charges for start-up times

|GPU Type|$ / hour (billed per second)|
|--|--|
|A100 80 GB GPU|$2.90|
|H100 80 GB GPU|$4.00|
|H200 141 GB GPU|$6.00|
|B200 180 GB GPU|$9.00|

---

### Search Queries: Together AI lora-supported-models serverless LoRA base models, site:docs.together.ai lora supported models serverless, Fireworks AI serverless LoRA models which models support serverless lora

---

**Source: [Fine-tuning - Supported Models - Together.ai Docs](https://docs.together.ai/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Evaluations Supported Models](https://docs.together.ai/docs/evaluations-supported-models)**
## Serverless modelsSet

`model_source = "serverless"` to use Together’s serverless inference.

Any Together serverless model that supports structured outputs can be used, including LoRA serverless variants and LoRA fine-tuned models. See LoRA serverless for supported models.

**Example configuration:**

Python

---

**Source: [Overview - Fireworks AI Docs](https://docs.fireworks.ai/models/overview)**
### Serverless inferenceFireworks supports serverless inference for popular models like Llama 3.1 405B. These models are pre-deployed by the Fireworks team for the community to use. Take a look at the Models page for the latest list of serverless models. Serverless inference is billed on a per-token basis depending on the model size. See our Pricing page for details.

---

**Source: [Step 4: Running LoRA inference](https://docs.together.ai/docs/lora-training-and-inference)**
## Quick startThis guide demonstrates how to fine-tune a model using LoRA and deploy it for serverless inference. For comprehensive fine-tuning options and best practices, refer to the Fine-Tuning Guide.

### Prerequisites

- Together AI API key

- Training data in the JSONL format

- Compatible base model selection

---

**Source: [Upload a LoRA Adapter - Together.ai Docs](https://docs.together.ai/docs/adapter-upload)**
## OverviewTogether AI supports uploading and running inference on custom LoRA (Low-Rank Adaptation) adapters that you’ve trained independently or obtained from sources like the Hugging Face Hub.

### Key benefits

**Serverless deployment**: No infrastructure management required **Fast inference**: Optimized for low latency **Private models**: Your adapters remain private to your account **Multiple sources**: Support for AWS S3 and Hugging Face Hub repositories

…

**Make Together API call to the model:**

Expected response:

```

MODEL_NAME_FOR_INFERENCE="devuser/test-lora-model-creation-8b"

curl -X POST https://api.together.xyz/v1/chat/completions \

-H "Authorization: Bearer $TOGETHER_API_KEY" \

-H "Content-Type: application/json" \

-d '{

"model": "'$MODEL_NAME_FOR_INFERENCE'",

"prompt": "Q: The capital of France is?\nA:",

"temperature": 0.8,

"max_tokens": 128

}'

```

---

**Source: [Concepts - Fireworks AI Docs - Introduction](https://fireworksai-docs.mintlify.app/getting-started/concepts)**
**Serverless deployments:**Fireworks hosts popular base models on shared “serverless” deployments. Users pay-per-token to query these models and do not need to configure GPUs. The most popular serverless deployments also support serverless LoRA addons. See our Quickstart - Serverless guide to get started. **Dedicated deployments:**Dedicated deployments enable users to configure private deployments with a wide array of hardware (see on-demand deployments guide).

---

**Source: [Supported Models - Together.ai Docs](https://togetherai-52386018.mintlify.app/docs/fine-tuning-models)**
**Note:**This list is different from the models that support Serverless LoRA inference, which allows you to perform LoRA fine-tuning and run inference immediately. See the LoRA inference page for the list of supported base models for serverless LoRA.

**Important:**When uploading LoRA adapters for serverless inference, you must use base models from the serverless LoRA list, not the fine-tuning models list. Using an incompatible base model (such as Turbo variants) will result in a “No lora_model specified” error during upload. For example, use

---

**Source: [Fine-tuning Guide - Together.ai Docs](https://docs.together.ai/docs/fine-tuning-quickstart)**
## Using a Fine-tuned ModelOnce your fine-tuning job completes, your model will be available for use:

**Option 1: Serverless LoRA Inference**If you used LoRA fine-tuning and the model supports serverless LoRA inference, you can immediately use your model without deployment. We can call it just like any other model on the Together AI platform, by providing the unique fine-tuned model

…

If you continue a LoRA fine-tuning job with the same LoRA hyperparameters (rank, alpha, selected modules), the trained model will be available for LoRA Serverless. However, if you change any of these parameters or continue with Full training, LoRA Serverless will be disabled. Additionally, if you continue a Full fine-tuning job, LoRA Serverless will remain disabled. *Note: The feature is disabled when parameters change because the Fine-tuning API merges the parent fine-tuning adapter to the base model when it detects different adapter hyperparameters, ensuring optimal training quality.

---

**Source: [How to check if a model is available on serverless? - Fireworks AI ...](https://fireworksai-docs.mintlify.app/faq-new/models-inference/how-to-check-if-a-model-is-available-on-serverless)**
```

llm = LLM(model="llama4-maverick-instruct-basic", deployment_type="auto")

print(llm.is_available_on_serverless()) # True

llm = LLM(model="qwen2p5-7b-instruct", deployment_type="auto")

# Error will be raised saying: "LLM(id=...) must be provided when deployment_strategy is on-demand"

# Which means the model is not available on serverless if the

# deployment_strategy was resolved as "on-demand" when the deployment_type was

# "auto"

```

---

**Source: [Changelog](https://docs.together.ai/docs/changelog)**
## February, 2026

Feb 13

/serverless-models

**Serverless Model Bring Ups**The following models have been added:

`zai-org/GLM-5`

Feb 4

Python SDK v2.0

**Python SDK v2.0 General Availability**Together AI is releasing the

…

Sep 8

/evaluation

**Serverless LoRA and Dedicated Endpoints support for Evaluations**You can now run evaluations:

- Using Serverless LoRA models, including supported LoRA fine-tuned models

- Using Dedicated Endpoints, including fine-tuned models deployed via dedicated endpoints

Sep 5

/chat/completions

**Kimi-K2-Instruct-0905 Model Release**Upgraded version of Moonshot’s 1 trillion parameter MoE model with enhanced performance. Read more

- Model ID:

`moonshot-ai/Kimi-K2-Instruct-0905`

---

**Source: [Together.AI เปิดบริการ Serverless LoRA ไม่คิดค่าโฮสต์โมเดลที่ปรับแต่งแล้ว คิดแต่ค่ารันตามโทเค็น](https://www.blognone.com/node/143814)**
Together.AI ผู้ให้บริการคลาวด์ปัญญาประดิษฐ์เปิดบริการปรับแต่งโมเดล (finetune) แบบ LoRA เต็มรูปแบบ โดยทั้งการฝึกโมเดลและการรันโมเดลที่ปรับแต่งมาแล้ว
บริการ Severless LoRA สามารถใช้ adapter ที่ปรับแต่งมาแล้วจากที่อื่นได้ โดยคิดค่ารันตามโทเค็นเท่ากับโมเดลหลักเท่านั้น และสามารถใช้งานได้กับทุกโมเดลที่ทาง Together.AI ให้บริการแบบ serverless อยู่ เช่น Llama และ Qwen
ส่วนการทำ finetune บน Together.AI ก็สามารถอัพโหลดชุดข้อมูลขึ้นไปฝึกแบบ LoRA ได้ โดยคิดค่าบริการตามขนาดข้อมูลและจำนวนรอบการฝึก หลักฝึกฝึกเสร็จแล้ว โมเดลจะนำไปรันได้ทันทีหรือจะดาวน์โหลด adapter ไปใช้งานที่อื่นก็ได้เช่นกัน
โดยปกติแล้วบริการคลาวด์ปัญญาประดิษฐ์ที่รองรับการทำ finetune มักคิดค่าบริการโฮสต์โมเดลหากไม่ใช้งาน ทาง Together.AI ระบุว่าสามารถปรับแต่งจนรัน LoRA นับร้อยชุดได้พร้อมกัน ทำให้สามารถให้บริการลูกค้าโดยคิดราคาเท่าๆ กับโมเดลพื้นฐาน ประสิทธิภาพการรันอยู่ที่ 90% ของโมเดลหลัก
ที่มา - Together.AI



หลังฝึกเสร็จแล้ว

เจ๋งเลยยย

---

**Source: [Deploying a Fine-tuned Model - Together.ai Docs](https://docs.together.ai/docs/deploying-a-fine-tuned-model)**
To use your model, you can either:

- Host it on Together AI as a dedicated endpoint(DE) for an hourly usage fee

- Run it immediately if the model supports Serverless LoRA Inference

- Download your model and run it locally

…

## Serverless LoRA InferenceIf you fine-tuned the model using parameter efficient LoRA fine-tuning you can select the model in the models dashbaord and can click

`OPEN IN PLAYGROUND` to quickly test the fine-tuned model.

You can also call the model directly just like any other model on the Together AI platform, by providing the unique fine-tuned model

---

**Fetched: [Upload a LoRA Adapter - Together.ai Docs](https://docs.together.ai/docs/adapter-upload)**
## OverviewTogether AI supports uploading and running inference on custom LoRA (Low-Rank Adaptation) adapters that you’ve trained independently or obtained from sources like the Hugging Face Hub.

### Key benefits

**Serverless deployment**: No infrastructure management required **Fast inference**: Optimized for low latency **Private models**: Your adapters remain private to your account **Multiple sources**: Support for AWS S3 and Hugging Face Hub repositories

### Supported base modelsCurrently, LoRA inference is supported for adapters based on the following base models in Together API. Whether using pre-fine-tuned models or bringing your own adapters, these are the only compatible models:

|Organization|Base Model Name|Base Model String|Quantization|
|--|--|--|--|
|Meta|Llama 4 Maverick Instruct|meta-llama/Llama-4-Maverick-17B-128E-Instruct|FP8|
|Meta|Llama 3.1 8B Instruct|meta-llama/Meta-Llama-3.1-8B-Instruct-Reference|BF16|
|Meta|Llama 3.1 70B Instruct|meta-llama/Meta-Llama-3.1-70B-Instruct-Reference|BF16|
|Alibaba|Qwen2.5 72B Instruct|Qwen/Qwen2.5-72B-Instruct|FP8|
|Alibaba|Qwen3 235B A22B Instruct 2507|Qwen/Qwen3-235B-A22B-Instruct-2507-tput|FP8|
## Implemenation guide

### Prerequisites

- Together AI API key

- Compatible LoRA adapter files:

If you are getting the adapter from Hugging Face Hub you can find information about the base model there as well.

You need to make sure that the adapter you are trying to upload has an

`adapter_config.json`and

`adapter_model.safetensors`files.

- Adapter hosted on AWS S3 or Hugging Face Hub

### Upload from S3

```

#!/bin/bash

# uploadadapter.sh

# Generate presigned adapter url

ADAPTER_URL="s3://test-s3-presigned-adapter/my-70B-lora-1.zip"

PRESIGNED_ADAPTER_URL=$(aws s3 presign ${ADAPTER_URL})

# Specify additional params

MODEL_TYPE="adapter"

ADAPTER_MODEL_NAME="test-lora-model-70B-1"

BASE_MODEL="meta-llama/Meta-Llama-3.1-70B-Instruct"

DESCRIPTION="test_70b_lora_description" # Lazy curl replace below, don't put spaces here.

# Upload

curl -v https://api.together.xyz/v0/models \

-H 'Content-Type: application/json' \

-H "Authorization: Bearer $TOGETHER_API_KEY" \

-d '{

"model_name": "'${ADAPTER_MODEL_NAME}'",

"model_source": "'${PRESIGNED_ADAPTER_URL}'",

"model_type": "'${MODEL_TYPE}'",

"base_model": "'${BASE_MODEL}'",

"description": "'${DESCRIPTION}'"

}'

```

### Upload from the Hugging Face HubMake sure that the adapter contains

`adapter_config.json` and

`adapter_model.safetensors` files in Files and versions tab on the Hugging Face Hub.

```

# From the Hugging Face Hub

HF_URL="https://huggingface.co/reissbaker/llama-3.1-8b-abliterated-lora"

MODEL_TYPE="adapter"

BASE_MODEL="meta-llama/Meta-Llama-3.1-8B-Instruct-Reference"

DESCRIPTION="test_lora_8B"

ADAPTER_MODEL_NAME=test-lora-model-creation-8b

HF_TOKEN=hf_token

TOGETHER_API_KEY=together-api-key

# Upload

curl -v https://api.together.xyz/v0/models \

-H 'Content-Type: application/json' \

-H "Authorization: Bearer $TOGETHER_API_KEY" \

-d '{

"model_name": "'${ADAPTER_MODEL_NAME}'",

"model_source": "'${HF_URL}'",

"model_type": "'${MODEL_TYPE}'",

"description": "'${DESCRIPTION}'",

"hf_token": "'${HF_TOKEN}'"

}'

```

### Upload responseSuccessful upload returns:

```



"data": {

"job_id": "job-b641db51-38e8-40f2-90a0-5353aeda6f21", <------- Job ID

"model_name": "devuser/test-lora-model-creation-8b",

"model_source": "remote_archive"

},

"message": "job created"



```

### Monitor upload progressYou can poll the API using the

`job_id` until the adapter has finished uploading.

Response when ready:

```

curl https://api.together.xyz/v1/jobs/job-b641db51-38e8-40f2-90a0-5353aeda6f21 \

-H "Authorization: Bearer $TOGETHER_API_KEY" | jq .

```

```



"type": "adapter_upload",

"job_id": "job-b641db51-38e8-40f2-90a0-5353aeda6f21",

"status": "Complete",

"status_updates": []



```

### Run LoRA inference:Use the

`model_name` string from the adapter upload.

```



"data": {

"job_id": "job-b641db51-38e8-40f2-90a0-5353aeda6f21",

"model_name": "devuser/test-lora-model-creation-8b", <------ Model Name

"model_source": "remote_archive"

},

"message": "job created"



```

**Make Together API call to the model:**

Expected response:

```

MODEL_NAME_FOR_INFERENCE="devuser/test-lora-model-creation-8b"

curl -X POST https://api.together.xyz/v1/chat/completions \

-H "Authorization: Bearer $TOGETHER_API_KEY" \

-H "Content-Type: application/json" \

-d '{

"model": "'$MODEL_NAME_FOR_INFERENCE'",

"prompt": "Q: The capital of France is?\nA:",

"temperature": 0.8,

"max_tokens": 128

}'

```

```



"id": "8f3317dd3c3a39ef-YYZ",

"object": "text.completion",

"created": 1734398453,

"model": "devuser/test-lora-model-creation-8b",

"prompt": [],

"choices": [



"text": " Paris\nB: Berlin\nC: Warsaw\nD: London\nAnswer: A",

"finish_reason": "eos",

"seed": 13424880326038300000,

"logprobs": null,

"index": 0



],

"usage": {

"prompt_tokens": 10,

"completion_tokens": 18,

"total_tokens": 28,

"cache_hit_rate": 0



```

## Troubleshooting

#### 1. “Model name already exists” Error

**Problem:**Attempting to upload with a duplicate model name

**Solution:**Choose a unique model name for your adapter

#### 2. Missing Required Files

**Problem:**Adapter missing

`adapter_config.json` or

`adapter_model.safetensors`

**Solution:**Ensure both files are present in your source location before uploading

#### 3. Base Model Incompatibility

**Problem:**Adapter trained on unsupported base model

**Solution:**Verify your adapter was trained on one of the supported base models listed above

#### 4. Upload Job Stuck in “Processing”

**Problem:**Job status remains “Processing” for extended period

**Solution:**

- Check if file size exceeds limits for your tier

- Verify presigned URL hasn’t expired (for S3)

- Ensure Hugging Face token has proper permissions (for private repos)

#### 5. Authentication Errors

**Problem:**401 or 403 errors during upload

**Solution:**

- Verify your Together API key is valid

- For Hugging Face Hub private repos, ensure HF token is included

- For S3, check presigned URL is properly generated

---

**Fetched: [Fine-tuning in Nebius AI Studio: Overview](https://docs.studio.nebius.com/fine-tuning/overview)**
Nebius AI Studio documentation home page

Search...

⌘K

Contact us

Nebius AI Studio

Nebius AI Studio

Search...

Navigation

Fine-tuning

Fine-tuning in Nebius AI Studio: Overview

Guides

API Reference

Legal

Cookbook

LinkedIn

Discord Community

X

Get Started

Quickstart

AI models inference

Overview

Function calling & Tools

Structured output & JSON

Batch inference

Rate Limits & Scaling

UI & Playground

Generating consistent images with LoRA adapters

Utilities

Prompt presets

Fine-tuning

Overview

How to fine-tune

Models

Datasets

Deploy LoRA

Other capabilities

Billing

Enterprise

Integrations

Overview

Aisuite

Continue

Helicone

Hugging Face

Postman

Portkey

LlamaIndex

Fine-tuning in Nebius AI Studio allows you to train models, so they can outperform generic models and fit domain-specific tasks better. Due to training on a large amount of data, fine-tuned models return outputs of higher accuracy, and the possibility of AI hallucinations lowers.

Fine-tuning provides a way to train a model on a dataset. It serves as an alternative to prompting because fine-tuning does not suffer from a limited number of input examples that you can use in a prompt. As fine-tuning supports a larger number of examples, it eliminates the need for further extensive prompt engineering. As a result, fine-tuning lowers operational costs and reduces request latency.

For more information about how to fine-tune a model, see the following:

General instructions

Fine-tuning LLMs with Nebius AI Studio

Video tutorial: Fine-tuning launches on Nebius AI Studio

Prompt presets

How to fine-tune

Assistant


============================================================
ANALYSIS REQUIREMENTS:
============================================================

Synthesize all the research data above into a comprehensive comparison of platforms and models that support BOTH LoRA fine-tuning AND serverless LoRA inference (serving fine-tuned adapters without dedicated GPU deployment) in 2026. For each platform (Fireworks AI, Together AI, Nebius AI, Modal, Replicate, and any others found), provide:

1. Exact list of models that support BOTH fine-tuning AND serverless LoRA inference
2. Maximum model size that supports serverless LoRA
3. Pricing for fine-tuning (per token or per GPU-hour)
4. Pricing for serverless inference (per token)
5. Whether they support OpenAI-compatible chat completions format
6. Any relevant limitations

Focus on models with strong reasoning/instruction-following in the 70B+ range: Llama 3.1 70B/405B, Llama 4 models, DeepSeek R1/V3, Qwen 3 models, Kimi K2, Mistral Large, Mixtral. 

Context: I trained a LoRA on Kimi K2 Thinking via Fireworks AI but discovered K2 doesn't support serverless LoRA serving (needs 32 H100s). I need an alternative model+platform where I can fine-tune AND serve the LoRA serverlessly at reasonable cost. I have 729 training examples in JSONL chat completions format.

Provide a clear RECOMMENDATION at the end: which model + platform is the best option for my use case.
```
