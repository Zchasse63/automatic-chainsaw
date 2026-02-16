# Nebius Token Factory Fine-Tuning Guide — Hyrox AI Coach

> **Purpose**: Complete reference for Claude Code to manage the full Nebius Token Factory fine-tuning lifecycle via OpenAI-compatible API. Covers dataset preparation, JSONL formatting, SFT job creation, job monitoring, LoRA deployment, serverless inference, and adapter management. This is the primary and only fine-tuning platform guide for the project.

---

## Table of Contents

1. [Authentication & Setup](#1-authentication--setup)
2. [JSONL Dataset Format](#2-jsonl-dataset-format)
3. [Data Preparation & Validation](#3-data-preparation--validation)
4. [File Upload API Operations](#4-file-upload-api-operations)
5. [Fine-Tuning Job API Operations](#5-fine-tuning-job-api-operations)
6. [Job Monitoring & Status](#6-job-monitoring--status)
7. [Checkpoints](#7-checkpoints)
8. [LoRA Deployment (Serverless)](#8-lora-deployment-serverless)
9. [Inference (Post-Deployment)](#9-inference-post-deployment)
10. [Hyperparameters & Tuning Strategy](#10-hyperparameters--tuning-strategy)
11. [External Adapter Upload](#11-external-adapter-upload)
12. [Supported Models](#12-supported-models)
13. [Cost Reference](#13-cost-reference)
14. [Integrations (W&B, MLflow, HuggingFace)](#14-integrations-wb-mlflow-huggingface)
15. [Error Handling & Troubleshooting](#15-error-handling--troubleshooting)
16. [End-to-End Workflow Script](#16-end-to-end-workflow-script)

---

## 1. Authentication & Setup

All Nebius Token Factory API calls use Bearer token authentication. The API is **OpenAI-compatible** — use the standard OpenAI Python SDK with a custom `base_url`.

**API Base URLs**:
- **v1 (OpenAI-compatible)**: `https://api.tokenfactory.nebius.com/v1/` — files, fine-tuning, inference
- **v0 (custom models)**: `https://api.tokenfactory.nebius.com/v0/` — LoRA deployment, adapter management

> **Migration note**: Old `api.studio.nebius.com` URLs still work but may be deprecated. Use `api.tokenfactory.nebius.com` for new work.

**Required variables** (store in `.env` or export):
```bash
export NEBIUS_API_KEY="v1.CmMKHHN0YXRpY2tleS1lMDB4OHJtZjRibmpibWdzYWQSIXNlcnZpY2VhY2NvdW50LWUwMHY0dHM4Z2NlN3Rid3poeDIMCJrLxMwGEMPqgpMCOgsIms7clwcQgOHrF0ACWgNlMDA.AAAAAAAAAAFpUaZHw1jPxdPEQSg6Xuky_s-JBOcNjzFEBgoJ7x42Ej5WmCcjtixWQVrJ3_kxXlT3sstCrAPdgIcttSKzdnUD"
```

**Authentication header** (every request):
```
Authorization: Bearer $NEBIUS_API_KEY
```

**Python SDK** (uses standard OpenAI SDK):
```bash
pip install openai
```

**Python SDK initialization**:
```python
import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ["NEBIUS_API_KEY"],
)
```

**For v0 endpoints** (LoRA deployment, custom models), use `requests` directly:
```python
import requests

NEBIUS_API_KEY = os.environ["NEBIUS_API_KEY"]
V0_BASE = "https://api.tokenfactory.nebius.com/v0"
HEADERS = {"Authorization": f"Bearer {NEBIUS_API_KEY}"}
```

**Key management**:
- Create keys at tokenfactory.nebius.com → API keys section
- Keys are shown **once** at creation — save immediately
- Login via Google or GitHub OAuth
- Compromised keys are auto-revoked by Nebius

---

## 2. JSONL Dataset Format

### Chat Completions Format (Primary — Use This)

Each line must be a valid JSON object with a `messages` array:

```jsonl
{"messages":[{"role":"system","content":"You are Coach K, an elite Hyrox performance coach."},{"role":"user","content":"How should I warm up before a Hyrox race?"},{"role":"assistant","content":"Your Hyrox warm-up should activate every energy system..."}]}
```

### Format Rules

| Rule | Details |
|------|---------|
| File extension | `.jsonl` |
| Encoding | UTF-8 |
| Max file size | 5 GB |
| One example per line | Complete JSON object, no line breaks within |
| Last message | Must be from `assistant` |
| Valid roles | `system` (optional, must be first), `user` (required), `assistant` (required) |
| Multi-turn | Supported — alternate user/assistant messages |
| Tool calling | Supported — include `tools` field for function-calling training |

### All Supported Dataset Formats

Nebius supports 4 formats. **Chat completions (above) is recommended for our use case.**

| Format | Schema | Use Case |
|--------|--------|----------|
| **Conversational** | `{"messages": [...]}` | Chat fine-tuning (our format) |
| **Instruction** | `{"prompt": "...", "completion": "..."}` | Simple prompt/completion |
| **Text** | `{"text": "..."}` | Continued pretraining |
| **Pre-tokenized** | `{"token_ids": [...], "labels": [...], "attention_mask": [...]}` | Advanced, pre-processed |

### Multi-Turn Example

```jsonl
{"messages":[{"role":"system","content":"You are Coach K, an elite Hyrox performance coach."},{"role":"user","content":"I have a Hyrox race in 8 weeks. How should I structure my training?"},{"role":"assistant","content":"Eight weeks out, we're in the build phase. Here's the structure..."},{"role":"user","content":"What about the sled push? That's my weakest station."},{"role":"assistant","content":"Sled push is about hip drive and ground contact time..."}]}
```

### Tool Calling Format

```jsonl
{"messages":[{"role":"system","content":"You are a coach with access to workout logging."},{"role":"user","content":"Log my 5K run today — 22:30"},{"role":"assistant","content":null,"tool_calls":[{"type":"function","function":{"name":"log_workout","arguments":"{\"type\":\"run\",\"distance\":\"5K\",\"time\":\"22:30\"}"}}]},{"role":"tool","content":"{\"success\": true}"},{"role":"assistant","content":"Got it — 22:30 for your 5K. That's a 4:30/km pace."}]}
```

---

## 3. Data Preparation & Validation

### Local Validation Script

```python
import json

def validate_jsonl_nebius(filepath, max_context=8192):
    """Validate JSONL for Nebius Token Factory fine-tuning."""
    errors = []
    warnings = []
    token_lengths = []

    with open(filepath) as f:
        for i, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                errors.append(f"Line {i}: empty")
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError as e:
                errors.append(f"Line {i}: invalid JSON — {e}")
                continue

            if "messages" not in obj:
                errors.append(f"Line {i}: missing 'messages' key")
                continue

            msgs = obj["messages"]
            if not isinstance(msgs, list) or len(msgs) < 2:
                errors.append(f"Line {i}: need ≥2 messages")
                continue

            # Check roles
            for j, m in enumerate(msgs):
                if m.get("role") not in ("system", "user", "assistant", "tool"):
                    errors.append(f"Line {i}, msg {j}: invalid role '{m.get('role')}'")
                if m.get("role") != "assistant" and not m.get("content", "").strip():
                    errors.append(f"Line {i}, msg {j}: empty content")

            # System must be first
            if msgs[0].get("role") == "system" and len(msgs) < 3:
                errors.append(f"Line {i}: system + at least user + assistant required")

            # Last message must be assistant
            if msgs[-1].get("role") != "assistant":
                errors.append(f"Line {i}: last message must be from assistant")

            # Rough token estimate (chars / 4)
            total_chars = sum(len(m.get("content", "")) for m in msgs)
            est_tokens = total_chars // 4
            token_lengths.append(est_tokens)
            if est_tokens > max_context:
                warnings.append(f"Line {i}: ~{est_tokens} tokens may exceed {max_context} context limit")

    print(f"Lines checked: {i}")
    print(f"Errors: {len(errors)}")
    print(f"Warnings: {len(warnings)}")
    if token_lengths:
        print(f"Token range: {min(token_lengths)} - {max(token_lengths)} (estimated)")
        print(f"Average tokens: {sum(token_lengths) // len(token_lengths)}")
    for e in errors[:20]:
        print(f"  ERROR: {e}")
    for w in warnings[:10]:
        print(f"  WARN: {w}")
    return len(errors) == 0

validate_jsonl_nebius("train.jsonl")
```

### Key Validation Points

| Check | Requirement |
|-------|-------------|
| JSON validity | Every line must parse as valid JSON |
| Messages array | Must exist and have ≥2 messages |
| Role values | `system`, `user`, `assistant`, `tool` only |
| Last message | Must be `assistant` role |
| Content | Non-empty for non-assistant messages |
| Token length | Must fit within `context_length` param (default 8192) |
| File size | Max 5 GB |

---

## 4. File Upload API Operations

### Upload Training File

```python
file_resp = client.files.create(
    file=open("train.jsonl", "rb"),
    purpose="fine-tune",
)
print(f"File ID: {file_resp.id}")
print(f"Filename: {file_resp.filename}")
print(f"Bytes: {file_resp.bytes}")
```

**Response fields**: `id`, `object`, `bytes`, `created_at`, `filename`, `purpose`, `status`

### List Files

```python
files = client.files.list()
for f in files.data:
    print(f"{f.id} | {f.filename} | {f.bytes} bytes | {f.purpose}")
```

### Retrieve File Metadata

```python
file_info = client.files.retrieve("file-abc123")
```

### Download File Content

```python
content = client.files.content("file-abc123")
content.write_to_file("output.jsonl")
```

### Delete File

```python
result = client.files.delete("file-abc123")
# Returns: {"id": "file-abc123", "deleted": true, "object": "file"}
```

### cURL Equivalents

```bash
# Upload
curl -X POST "https://api.tokenfactory.nebius.com/v1/files" \
  -H "Authorization: Bearer $NEBIUS_API_KEY" \
  -F "file=@train.jsonl" -F "purpose=fine-tune"

# List
curl "https://api.tokenfactory.nebius.com/v1/files" \
  -H "Authorization: Bearer $NEBIUS_API_KEY"

# Delete
curl -X DELETE "https://api.tokenfactory.nebius.com/v1/files/file-abc123" \
  -H "Authorization: Bearer $NEBIUS_API_KEY"
```

---

## 5. Fine-Tuning Job API Operations

### Create Job

```python
job = client.fine_tuning.jobs.create(
    training_file="file-abc123",
    model="meta-llama/Llama-3.3-70B-Instruct",
    suffix="hyrox-coach-v1",
    hyperparameters={
        "n_epochs": 3,
        "learning_rate": 0.0001,
        "batch_size": 8,
        "lora": True,
        "lora_r": 16,
        "lora_alpha": 32,
        "lora_dropout": 0.05,
        "packing": True,
        "context_length": 8192,
        "warmup_ratio": 0.1,
        "weight_decay": 0.01,
        "max_grad_norm": 1.0,
    },
    seed=42,
)
print(f"Job ID: {job.id}")
print(f"Status: {job.status}")
```

### Required Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `training_file` | string | File ID from upload |
| `model` | string | Base model ID (see [Supported Models](#12-supported-models)) |

### Optional Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `validation_file` | string | — | Validation file ID |
| `suffix` | string | — | Custom suffix for output model name (max 64 chars) |
| `seed` | int | random | Reproducibility control |
| `integrations` | array | — | W&B, MLflow, or HuggingFace export configs |

### Hyperparameters (in `hyperparameters` object)

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `n_epochs` | int | 1-20 | 3 | Number of complete dataset passes |
| `learning_rate` | float | >0 | 0.00001 | Gradient descent step size |
| `batch_size` | int | 1-32 | 8 | Training batch size |
| `warmup_ratio` | float | 0-1 | 0 | Linear LR warmup proportion |
| `weight_decay` | float | ≥0 | 0 | L2 regularization penalty |
| `max_grad_norm` | float | >0 | 1 | Gradient clipping threshold |
| `packing` | bool | — | true | Pack short samples for efficiency |
| `context_length` | int | 8192–131072 | 8192 | Max sequence length in tokens |
| `lora` | bool | — | false | Enable LoRA (vs full fine-tuning) |
| `lora_r` | int | 8-128 | 8 | LoRA matrix rank |
| `lora_alpha` | int | ≥8 | 8 | LoRA scaling factor |
| `lora_dropout` | float | 0-1 | 0 | Dropout rate on LoRA layers |

> **IMPORTANT**: Use `hyperparameters` at the top level, NOT inside a `method` object. The API rejects requests with both `method` and `hyperparameters`.

### cURL Create Job

```bash
curl -X POST "https://api.tokenfactory.nebius.com/v1/fine_tuning/jobs" \
  -H "Authorization: Bearer $NEBIUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "training_file": "file-abc123",
    "model": "meta-llama/Llama-3.3-70B-Instruct",
    "suffix": "hyrox-coach-v1",
    "seed": 42,
    "hyperparameters": {
      "n_epochs": 3,
      "learning_rate": 0.0001,
      "batch_size": 8,
      "lora": true,
      "lora_r": 16,
      "lora_alpha": 32,
      "lora_dropout": 0.05,
      "packing": true,
      "context_length": 8192,
      "warmup_ratio": 0.1,
      "weight_decay": 0.01,
      "max_grad_norm": 1.0
    }
  }'
```

### Other Job Operations

| Operation | Method | Code |
|-----------|--------|------|
| List jobs | GET | `client.fine_tuning.jobs.list()` |
| Get job | GET | `client.fine_tuning.jobs.retrieve(job_id)` |
| Cancel job | POST | `client.fine_tuning.jobs.cancel(job_id)` |
| List events | GET | `client.fine_tuning.jobs.list_events(job_id)` |
| List checkpoints | GET | `client.fine_tuning.jobs.checkpoints.list(job_id)` |

---

## 6. Job Monitoring & Status

### Job States

| State | Meaning | Terminal? |
|-------|---------|-----------|
| `validating_files` | Checking dataset format | No |
| `queued` | Waiting for GPU | No |
| `running` | Training in progress | No |
| `succeeded` | Done — deploy the LoRA | Yes ✅ |
| `failed` | Error — check events | Yes ❌ |
| `cancelled` | Manually cancelled | Yes |

### Polling Script

```python
import time
from openai import OpenAI

client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ["NEBIUS_API_KEY"],
)

def poll_job(job_id, interval=30):
    """Poll Nebius fine-tuning job until completion."""
    terminal = {"succeeded", "failed", "cancelled"}
    while True:
        job = client.fine_tuning.jobs.retrieve(job_id)
        status = job.status
        trained = getattr(job, 'trained_tokens', 0) or 0
        steps = f"{getattr(job, 'trained_steps', '?')}/{getattr(job, 'total_steps', '?')}"
        eta = getattr(job, 'estimated_finish', None)

        print(f"[{time.strftime('%H:%M:%S')}] {status} | tokens: {trained:,} | steps: {steps}")
        if eta:
            remaining = eta - int(time.time())
            if remaining > 0:
                print(f"  ~{remaining // 60} minutes remaining")

        if status in terminal:
            if status == "succeeded":
                print(f"  Result files: {job.result_files}")
                # Get cost estimate
                cost = (trained / 1_000_000) * 2.80  # >20B rate
                print(f"  Estimated cost: ${cost:.2f}")
            elif status == "failed":
                print(f"  Error: {job.error}")
            return job

        time.sleep(interval)
```

### Check Events

```python
events = client.fine_tuning.jobs.list_events(job_id)
for event in events.data:
    print(f"[{event.created_at}] {event.level}: {event.message}")
```

### Event Object Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique event ID |
| `created_at` | int | Unix timestamp |
| `level` | string | `info`, `warn`, or `error` |
| `message` | string | Human-readable description |
| `type` | string | `message` or `metrics` |
| `data` | object | Optional metrics data |

### Job Response Fields

| Field | Description |
|-------|-------------|
| `id` | Job ID (e.g., `ftjob-abc123`) |
| `model` | Base model used |
| `status` | Current state |
| `training_file` | Training file ID |
| `validation_file` | Validation file ID (if provided) |
| `hyperparameters` | Echo of configuration |
| `created_at` | Unix timestamp |
| `finished_at` | Unix timestamp (when terminal) |
| `estimated_finish` | Unix timestamp (ETA) |
| `trained_tokens` | Total tokens processed |
| `trained_steps` | Steps completed |
| `total_steps` | Total steps planned |
| `result_files` | Array of output file IDs (checkpoints) |
| `error` | Error object (`code`, `message`, `param`) on failure |
| `suffix` | Custom model suffix |
| `seed` | Seed used |

---

## 7. Checkpoints

Nebius creates checkpoints after each training epoch.

### List Checkpoints

```python
checkpoints = client.fine_tuning.jobs.checkpoints.list(job_id)
for ckpt in checkpoints.data:
    print(f"Checkpoint: {ckpt.id}")
    print(f"  Step: {ckpt.step_number}")
    print(f"  Metrics: {ckpt.metrics}")
    print(f"  Result files: {ckpt.result_files}")
```

### Checkpoint Object

| Field | Description |
|-------|-------------|
| `id` | Checkpoint ID (e.g., `ftckpt_abc123`) |
| `step_number` | Training step |
| `fine_tuning_job_id` | Parent job ID |
| `fine_tuned_model_checkpoint` | Model reference |
| `result_files` | Array of downloadable file IDs |
| `metrics` | Training metrics (see below) |

### Metrics Available

| Metric | Description |
|--------|-------------|
| `train_loss` | Training loss |
| `valid_loss` | Validation loss |
| `full_valid_loss` | Full validation set loss |
| `train_mean_token_accuracy` | Training accuracy |
| `valid_mean_token_accuracy` | Validation accuracy |
| `step` | Step number |

### Download Adapter Weights

```python
for file_id in checkpoint.result_files:
    file_obj = client.files.retrieve(file_id)
    content = client.files.content(file_id)
    content.write_to_file(file_obj.filename)
    print(f"Downloaded: {file_obj.filename}")
```

### Resume from Checkpoint

Nebius does NOT support resuming a stopped job. To iterate:
1. Download the adapter from the checkpoint
2. Upload as external adapter (see [Section 11](#11-external-adapter-upload))
3. Start a new job if needed

---

## 8. LoRA Deployment (Serverless)

After fine-tuning succeeds, you must **manually deploy** the LoRA adapter. This is NOT automatic.

### CRITICAL: Serverless LoRA Base Models

**Only 2 models support serverless LoRA deployment:**

| Base Model | Inference Pricing (in/out per 1M) |
|-----------|-----------------------------------|
| `meta-llama/Llama-3.3-70B-Instruct` | $0.13 / $0.40 (base) or $0.25 / $0.75 (fast) |
| `meta-llama/Llama-3.1-8B-Instruct` | $0.02 / $0.06 (base) or $0.03 / $0.09 (fast) |

All other models can be fine-tuned but adapters **cannot** be deployed serverlessly.

### Deploy from Fine-Tuning Checkpoint

```python
import requests, os

NEBIUS_API_KEY = os.environ["NEBIUS_API_KEY"]
V0_BASE = "https://api.tokenfactory.nebius.com/v0"
HEADERS = {
    "Authorization": f"Bearer {NEBIUS_API_KEY}",
    "Content-Type": "application/json",
}

# Get the best checkpoint ID
from openai import OpenAI
client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=NEBIUS_API_KEY,
)
checkpoints = client.fine_tuning.jobs.checkpoints.list("ftjob-abc123")
best_ckpt = checkpoints.data[0]  # Latest checkpoint
print(f"Deploying checkpoint: {best_ckpt.id}")

# Deploy via v0 API
resp = requests.post(
    f"{V0_BASE}/models",
    headers=HEADERS,
    json={
        "source": f"ftjob-abc123:{best_ckpt.id}",
        "base_model": "meta-llama/Llama-3.3-70B-Instruct-fast",  # Note: -fast suffix
        "name": "hyrox-coach-v1",
        "description": "Hyrox AI Coach LoRA adapter on Llama 3.3 70B",
    },
)
print(f"Status: {resp.status_code}")
print(f"Response: {resp.json()}")
```

### Deployment States

| State | Meaning |
|-------|---------|
| `validating` | Adapter being validated |
| `active` | Ready for inference ✅ |
| `error` | Validation failed — check `status_reason` |
| `deleted` | After deletion |

### Deployed Model Naming Convention

Format: `{base_model}-LoRa:{adapter_name}-{random_suffix}`

Example: `meta-llama/Llama-3.3-70B-Instruct-LoRa:hyrox-coach-v1-AbCd`

### Check Deployment Status

```python
resp = requests.get(
    f"{V0_BASE}/models",
    headers={"Authorization": f"Bearer {NEBIUS_API_KEY}"},
)
for model in resp.json().get("models", []):
    print(f"{model['name']} — {model.get('status', 'unknown')}")
```

### Delete Deployment

```python
resp = requests.delete(
    f"{V0_BASE}/models/hyrox-coach-v1",
    headers={"Authorization": f"Bearer {NEBIUS_API_KEY}"},
)
```

### Base Model Flavor for Deployment

When deploying, use the **-fast** suffix on the base model for lower latency:
- `meta-llama/Llama-3.3-70B-Instruct-fast` (lower latency, $0.25/$0.75)
- `meta-llama/Llama-3.3-70B-Instruct` (standard, $0.13/$0.40)

---

## 9. Inference (Post-Deployment)

Once the LoRA adapter is deployed and `active`, use the standard chat completions endpoint.

### Python SDK

```python
from openai import OpenAI
import os

client = OpenAI(
    base_url="https://api.tokenfactory.nebius.com/v1/",
    api_key=os.environ["NEBIUS_API_KEY"],
)

response = client.chat.completions.create(
    model="meta-llama/Llama-3.3-70B-Instruct-LoRa:hyrox-coach-v1-AbCd",
    messages=[
        {"role": "system", "content": "You are Coach K, an elite Hyrox performance coach."},
        {"role": "user", "content": "I have a Hyrox race in 8 weeks. How should I structure my training?"},
    ],
    temperature=0.7,
    max_tokens=1024,
    stream=True,
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="")
```

### cURL

```bash
curl -X POST "https://api.tokenfactory.nebius.com/v1/chat/completions" \
  -H "Authorization: Bearer $NEBIUS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/Llama-3.3-70B-Instruct-LoRa:hyrox-coach-v1-AbCd",
    "messages": [
      {"role": "system", "content": "You are Coach K, an elite Hyrox performance coach."},
      {"role": "user", "content": "I have a Hyrox race in 8 weeks."}
    ],
    "temperature": 0.7,
    "max_tokens": 1024,
    "stream": true
  }'
```

### Supported Inference Parameters

| Parameter | Type | Range | Default |
|-----------|------|-------|---------|
| `model` | string | required | — |
| `messages` | array | min 1, required | — |
| `temperature` | float | 0-2 | 1 |
| `top_p` | float | 0-1 | 1 |
| `max_tokens` | int | ≥0 | model-dependent |
| `n` | int | 1-128 | 1 |
| `stop` | array | up to 4 sequences | none |
| `presence_penalty` | float | -2 to 2 | 0 |
| `frequency_penalty` | float | -2 to 2 | 0 |
| `stream` | bool | — | false |
| `response_format` | object | `{"type": "text"}` or `{"type": "json_object"}` | text |
| `tools` | array | function definitions | none |
| `tool_choice` | string/object | `none`, `auto`, `required`, or named | auto |

### Key Inference Facts

- Fine-tuned LoRA models serve at **base model price** (no markup)
- No separate deployment fee
- Streaming fully supported
- JSON mode supported
- Tool/function calling supported
- Rate limits: ~60 RPM, ~400K TPM baseline (auto-scales up to 20x)

---

## 10. Hyperparameters & Tuning Strategy

### Recommended Starting Config (for our 729-example dataset)

```python
hyperparameters = {
    "n_epochs": 3,
    "learning_rate": 0.0001,
    "batch_size": 8,
    "lora": True,
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "packing": True,
    "context_length": 8192,
    "warmup_ratio": 0.1,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,
}
```

### Tuning Guidance

| Symptom | Adjustment |
|---------|------------|
| Model doesn't capture coaching style | Increase epochs (3→5), increase lora_r (16→32) |
| Model overfits / parrots training data | Decrease epochs, add more examples, increase lora_dropout |
| Responses too generic | Add more specific examples, increase lora_r (16→32→64) |
| Training too slow | Decrease batch_size, decrease context_length |
| Validation loss spikes | Decrease learning_rate (0.0001→0.00005), increase warmup_ratio |
| Memory issues | Decrease batch_size, decrease lora_r |

### LoRA Rank Selection Guide

| lora_r | Capacity | Best For |
|--------|----------|----------|
| 8 | Low | Simple style transfer, few examples |
| 16 | Medium | **Our use case** — domain knowledge + persona |
| 32 | High | Complex behaviors, large datasets |
| 64-128 | Very high | Near full fine-tuning capability |

### Context Length Options

| Value | Use Case |
|-------|----------|
| 8192 (default) | **Our data** — max example is 2,304 tokens |
| 16384 | Longer conversations |
| 32768 | Extended multi-turn |
| 65536 | Very long documents |
| 131072 | Maximum (requires multi-node) |

---

## 11. External Adapter Upload

Nebius supports deploying LoRA adapters trained on **any platform** (not just Nebius).

### Method A: Upload Archive

The archive must be a `.zip` file (max 500 MB) containing:
- `adapter_model.safetensors` — LoRA weights
- `adapter_config.json` — LoRA configuration

```python
import requests, os

NEBIUS_API_KEY = os.environ["NEBIUS_API_KEY"]
V0_BASE = "https://api.tokenfactory.nebius.com/v0"

# Step 1: Upload the archive
with open("my-adapter.zip", "rb") as f:
    resp = requests.post(
        f"{V0_BASE}/models/upload",
        headers={"Authorization": f"Bearer {NEBIUS_API_KEY}"},
        files={"file": f},
    )
    file_id = resp.json()["id"]
    print(f"Uploaded: {file_id}")

# Step 2: Deploy
resp = requests.post(
    f"{V0_BASE}/models",
    headers={
        "Authorization": f"Bearer {NEBIUS_API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "source": file_id,
        "base_model": "meta-llama/Llama-3.3-70B-Instruct-fast",
        "name": "my-external-adapter",
    },
)
```

### Method B: HuggingFace Repository

```python
resp = requests.post(
    f"{V0_BASE}/models",
    headers={
        "Authorization": f"Bearer {NEBIUS_API_KEY}",
        "Content-Type": "application/json",
    },
    json={
        "source": "huggingface.co/org/my-lora-adapter",
        "base_model": "meta-llama/Llama-3.3-70B-Instruct-fast",
        "name": "my-hf-adapter",
    },
)
```

### Restrictions

- Adapter must be compatible with a **supported serverless base model** (Llama 3.1 8B or Llama 3.3 70B)
- Max archive size: 500 MB
- Archive must contain `adapter_model.safetensors` + `adapter_config.json`

---

## 12. Supported Models

### Fine-Tunable Models (Complete List — Feb 2026)

**Serverless LoRA-Compatible** (can fine-tune AND deploy serverlessly):

| Model | Size | LoRA | Full FT |
|-------|------|------|---------|
| `meta-llama/Llama-3.3-70B-Instruct` | 70B | ✅ | ✅ |
| `meta-llama/Llama-3.1-70B-Instruct` | 70B | ✅ | ✅ |
| `meta-llama/Llama-3.1-70B` | 70B | ✅ | ✅ |
| `meta-llama/Llama-3.1-8B-Instruct` | 8B | ✅ | ✅ |
| `meta-llama/Llama-3.1-8B` | 8B | ✅ | ✅ |

**Fine-Tunable Only** (no serverless LoRA deployment):

| Model | Size | LoRA | Full FT | Notes |
|-------|------|------|---------|-------|
| `Qwen/Qwen3-Coder-480B-A35B-Instruct` | 480B MoE | ❌ | ✅ | Full FT only |
| `Qwen/Qwen3-Coder-30B-A3B-Instruct` | 30B MoE | ❌ | ✅ | Full FT only |
| `deepseek-ai/DeepSeek-V3.1` | 685B MoE | ❌ | ✅ | Full FT only, US DCs |
| `deepseek-ai/DeepSeek-V3.1-Terminus` | 685B MoE | ❌ | ✅ | Full FT only, US DCs |
| `deepseek-ai/DeepSeek-V3-0324` | 685B MoE | ❌ | ✅ | Full FT only, US DCs |
| `unsloth/gpt-oss-120b-BF16` | 120B | ✅ | ✅ | |
| `unsloth/gpt-oss-20b-BF16` | 20B | ✅ | ✅ | |
| `Qwen/Qwen3-32B` | 32B | ✅ | ✅ | |
| `Qwen/Qwen3-14B` | 14B | ✅ | ✅ | |
| `Qwen/Qwen3-8B` | 8B | ✅ | ✅ | |
| `Qwen/Qwen3-4B` | 4B | ✅ | ✅ | |
| `Qwen/Qwen3-1.7B` | 1.7B | ✅ | ✅ | |
| `Qwen/Qwen3-0.6B` | 0.6B | ✅ | ✅ | |
| `Qwen/Qwen2.5-72B-Instruct` | 72B | ✅ | ✅ | |
| `Qwen/Qwen2.5-32B-Instruct` | 32B | ✅ | ✅ | |
| `Qwen/Qwen2.5-14B-Instruct` | 14B | ✅ | ✅ | |
| `Qwen/Qwen2.5-7B-Instruct` | 7B | ✅ | ✅ | |
| `Qwen/Qwen2.5-Coder-32B-Instruct` | 32B | ✅ | ✅ | |
| `meta-llama/Llama-3.2-3B-Instruct` | 3B | ✅ | ✅ | |
| `meta-llama/Llama-3.2-1B-Instruct` | 1B | ✅ | ✅ | |
| + Base variants of all the above | | | | |

### Inference-Only Models (NOT fine-tunable)

| Model | Notes |
|-------|-------|
| `moonshotai/Kimi-K2.5` | Inference only |
| `moonshotai/Kimi-K2-Instruct` | Inference only |
| `moonshotai/Kimi-K2-Thinking` | Inference only |
| `Qwen/Qwen3-235B-A22B-Instruct-2507` | Inference only |
| `Qwen/Qwen3-235B-A22B-Thinking-2507` | Inference only |
| `deepseek-ai/DeepSeek-R1-0528` | Inference only |

---

## 13. Cost Reference

### Fine-Tuning Pricing

| Model Size | Cost per 1M Processed Tokens |
|-----------|------------------------------|
| Under 20B parameters | **$0.40** |
| Over 20B parameters | **$2.80** |

No minimum charge. No monthly fees. No idle GPU costs.

**Training tokens** = dataset tokens × epochs (with packing efficiency)

### Quick Cost Estimator

```python
def estimate_nebius_cost(dataset_tokens, epochs, model_size="large"):
    """Estimate Nebius fine-tuning cost."""
    rates = {"small": 0.40, "large": 2.80}  # per 1M tokens
    training_tokens = dataset_tokens * epochs
    return (training_tokens / 1_000_000) * rates[model_size]

# Our Hyrox dataset: 628,646 tokens, 3 epochs, Llama 3.3 70B (>20B)
cost = estimate_nebius_cost(628_646, 3, "large")
print(f"Estimated cost: ${cost:.2f}")  # $5.28
```

### Inference Pricing (Serverless LoRA Models)

| Model | Flavor | Input ($/1M) | Output ($/1M) |
|-------|--------|-------------|---------------|
| Llama 3.3 70B | Base | $0.13 | $0.40 |
| Llama 3.3 70B | Fast | $0.25 | $0.75 |
| Llama 3.1 8B | Base | $0.02 | $0.06 |
| Llama 3.1 8B | Fast | $0.03 | $0.09 |

**Key facts**:
- Fine-tuned LoRA models serve at base model price (no markup)
- No separate deployment fee
- Batch API available at 50% of base price

### Cost Comparison (Our 729-Example Dataset)

| Platform | Model | Training Cost (3 epochs) | Inference (in/out per 1M) |
|----------|-------|-------------------------|--------------------------|
| **Nebius** | **Llama 3.3 70B** | **$5.28** | **$0.13 / $0.40** |

---

## 14. Integrations (W&B, MLflow, HuggingFace)

### Weights & Biases

```python
job = client.fine_tuning.jobs.create(
    training_file="file-abc123",
    model="meta-llama/Llama-3.3-70B-Instruct",
    hyperparameters={...},
    integrations=[{
        "type": "wandb",
        "wandb": {
            "project": "hyrox-coach",
            "api_key": "your-wandb-key",
            "name": "llama-3.3-70b-hyrox-v1",
            "entity": "your-team",
            "tags": ["hyrox", "lora", "v1"],
        }
    }],
)
```

### MLflow

```python
integrations=[{
    "type": "mlflow",
    "mlflow": {
        "tracking_uri": "https://mlflow.example.com",
        "experiment_name": "hyrox-coach",
        "run_name": "llama-3.3-70b-v1",
        "username": "user",
        "password": "pass",
    }
}]
```

### HuggingFace Export

```python
integrations=[{
    "type": "huggingface",
    "huggingface": {
        "output_repo_name": "my-hyrox-coach-adapter",
        "api_token": "hf_your_token",
    }
}]
```

---

## 15. Error Handling & Troubleshooting

| Error | Fix |
|-------|-----|
| `Sequence length is too long: X > 8192` | Increase `context_length` or truncate long examples |
| `model: value is not a valid enumeration member` | Model not supported for fine-tuning — check [Section 12](#12-supported-models) |
| `Only one of 'method' or 'hyperparameters' must be provided` | Use `hyperparameters` at top level, don't pass `method` |
| Job stuck in `queued` | GPU queue — wait (typically minutes to an hour) |
| Deployment status `error` | Check `status_reason` — adapter may be incompatible with base model |
| File upload fails | Check file format (JSONL), encoding (UTF-8), size (<5GB) |
| `validating_files` → `failed` | Dataset format issue — validate locally first |
| 429 rate limit | Implement exponential backoff; limits auto-scale in 15-min windows |
| Model not found on inference | Use the **deployed model name** (with `-LoRa:` suffix), not the base model ID |
| LoRA adapter too large | Archive must be <500 MB |

### Common Gotchas

1. **Deployment is NOT automatic** — you must call `POST /v0/models` after training succeeds
2. **DeepSeek models are full fine-tuning only** — no LoRA support
3. **Only 2 base models for serverless LoRA** — Llama 3.1 8B and Llama 3.3 70B
4. **-fast suffix matters** — use it on the base model when deploying for lower latency
5. **Old API keys from studio.nebius.com** still work but migrate to tokenfactory.nebius.com

---

## 16. End-to-End Workflow Script

Complete script for the Hyrox AI Coach fine-tuning on Nebius:

```python
#!/usr/bin/env python3
"""
Nebius Token Factory: End-to-End LoRA Fine-Tuning for Hyrox AI Coach
Model: Llama 3.3 70B Instruct
"""

import os
import time
import json
import requests
from openai import OpenAI

# ── Config ──────────────────────────────────────────────
NEBIUS_API_KEY = os.environ["NEBIUS_API_KEY"]
V1_BASE = "https://api.tokenfactory.nebius.com/v1/"
V0_BASE = "https://api.tokenfactory.nebius.com/v0"

BASE_MODEL = "meta-llama/Llama-3.3-70B-Instruct"
DEPLOY_BASE = "meta-llama/Llama-3.3-70B-Instruct-fast"
ADAPTER_NAME = "hyrox-coach-v1"
TRAINING_FILE = "docs/training-data/combined/all.jsonl"

HYPERPARAMS = {
    "n_epochs": 3,
    "learning_rate": 0.0001,
    "batch_size": 8,
    "lora": True,
    "lora_r": 16,
    "lora_alpha": 32,
    "lora_dropout": 0.05,
    "packing": True,
    "context_length": 8192,
    "warmup_ratio": 0.1,
    "weight_decay": 0.01,
    "max_grad_norm": 1.0,
}

# ── Clients ─────────────────────────────────────────────
client = OpenAI(base_url=V1_BASE, api_key=NEBIUS_API_KEY)
v0_headers = {
    "Authorization": f"Bearer {NEBIUS_API_KEY}",
    "Content-Type": "application/json",
}

# ── Step 1: Upload Training Data ────────────────────────
print("Step 1: Uploading training data...")
file_resp = client.files.create(
    file=open(TRAINING_FILE, "rb"),
    purpose="fine-tune",
)
print(f"  File ID: {file_resp.id}")
print(f"  Bytes: {file_resp.bytes}")

# ── Step 2: Create Fine-Tuning Job ──────────────────────
print("\nStep 2: Creating fine-tuning job...")
job = client.fine_tuning.jobs.create(
    training_file=file_resp.id,
    model=BASE_MODEL,
    suffix=ADAPTER_NAME,
    seed=42,
    hyperparameters=HYPERPARAMS,
)
print(f"  Job ID: {job.id}")
print(f"  Status: {job.status}")

# ── Step 3: Poll Until Complete ─────────────────────────
print("\nStep 3: Polling job status...")
terminal = {"succeeded", "failed", "cancelled"}
while True:
    job = client.fine_tuning.jobs.retrieve(job.id)
    status = job.status
    trained = getattr(job, "trained_tokens", 0) or 0
    steps = f"{getattr(job, 'trained_steps', '?')}/{getattr(job, 'total_steps', '?')}"
    print(f"  [{time.strftime('%H:%M:%S')}] {status} | tokens: {trained:,} | steps: {steps}")

    if status in terminal:
        break
    time.sleep(60)

if status != "succeeded":
    print(f"\n  Job {status}. Error: {getattr(job, 'error', 'unknown')}")
    exit(1)

cost = (trained / 1_000_000) * 2.80
print(f"\n  Training complete! Estimated cost: ${cost:.2f}")

# ── Step 4: Deploy LoRA Adapter ─────────────────────────
print("\nStep 4: Deploying LoRA adapter...")
checkpoints = client.fine_tuning.jobs.checkpoints.list(job.id)
best_ckpt = checkpoints.data[0]
print(f"  Checkpoint: {best_ckpt.id} (step {best_ckpt.step_number})")
print(f"  Metrics: {best_ckpt.metrics}")

resp = requests.post(
    f"{V0_BASE}/models",
    headers=v0_headers,
    json={
        "source": f"{job.id}:{best_ckpt.id}",
        "base_model": DEPLOY_BASE,
        "name": ADAPTER_NAME,
        "description": "Hyrox AI Coach v1 — LoRA on Llama 3.3 70B",
    },
)
deploy_result = resp.json()
print(f"  Deploy response: {json.dumps(deploy_result, indent=2)}")

# Wait for deployment to become active
print("\n  Waiting for deployment to become active...")
while True:
    resp = requests.get(
        f"{V0_BASE}/models",
        headers={"Authorization": f"Bearer {NEBIUS_API_KEY}"},
    )
    models = resp.json().get("models", [])
    our_model = next((m for m in models if ADAPTER_NAME in m.get("name", "")), None)
    if our_model:
        status = our_model.get("status", "unknown")
        print(f"  [{time.strftime('%H:%M:%S')}] Deployment status: {status}")
        if status == "active":
            deployed_name = our_model["name"]
            print(f"  Deployed as: {deployed_name}")
            break
        elif status == "error":
            print(f"  Deployment failed: {our_model.get('status_reason', 'unknown')}")
            exit(1)
    time.sleep(30)

# ── Step 5: Test Inference ──────────────────────────────
print(f"\nStep 5: Testing inference with {deployed_name}...")
response = client.chat.completions.create(
    model=deployed_name,
    messages=[
        {"role": "system", "content": "You are Coach K, an elite Hyrox performance coach."},
        {"role": "user", "content": "I have a Hyrox race in 8 weeks. Give me a quick overview of how to structure my training."},
    ],
    temperature=0.7,
    max_tokens=512,
)
print(f"\n  Coach K says:\n{response.choices[0].message.content}")
print(f"\n  Tokens used: {response.usage}")
print("\n✅ Complete! Hyrox AI Coach is live.")
```

---

## Quick Reference Card

```
# Files API (v1)
POST /v1/files                                    # Upload (multipart/form-data)
GET  /v1/files                                    # List all files
GET  /v1/files/{id}                               # Get file metadata
GET  /v1/files/{id}/content                       # Download file content
DEL  /v1/files/{id}                               # Delete file

# Fine-Tuning Jobs API (v1)
POST /v1/fine_tuning/jobs                         # Create job
GET  /v1/fine_tuning/jobs                         # List all jobs
GET  /v1/fine_tuning/jobs/{id}                    # Get job details
POST /v1/fine_tuning/jobs/{id}/cancel             # Cancel job
GET  /v1/fine_tuning/jobs/{id}/events             # List events
GET  /v1/fine_tuning/jobs/{id}/checkpoints        # List checkpoints

# Custom Models API (v0) — LoRA Deployment
POST /v0/models                                   # Deploy model
GET  /v0/models                                   # List deployed models
GET  /v0/models/{vendor}/{name}                   # Get model details
DEL  /v0/models/{vendor}/{name}                   # Delete model
POST /v0/models/upload                            # Upload external adapter

# Inference (v1 — OpenAI-compatible)
POST /v1/chat/completions                         # Chat completions
POST /v1/completions                              # Text completions
POST /v1/embeddings                               # Embeddings
GET  /v1/models                                   # List all models
```
