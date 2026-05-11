# Local LLM & GPU Stack — Expert Reference for syncflow (2026)

> **Scope:** Everything needed to run AI inference locally for Amazon brand automation — text LLMs, image generation, and embedding pipelines. This is the companion to `image-generation-apis.md` (cloud APIs). This document covers the LOCAL stack: Ollama, ComfyUI, hardware selection, batch pipeline patterns, and cost justification.  
> **Stack Context:** syncflow + n8n + Supabase + Ollama + ComfyUI  
> **Use Case:** Overnight batch jobs, high-volume inference, privacy-sensitive tasks, embedding generation for pgvector  
> **Last Updated:** May 2026

---

## Table of Contents

1. [Why Run Locally — The Honest Case](#1-why-run-locally--the-honest-case)
2. [Hardware Requirements & Tiers](#2-hardware-requirements--tiers)
3. [Ollama — Local LLM Server](#3-ollama--local-llm-server)
4. [LM Studio — GUI Model Runner](#4-lm-studio--gui-model-runner)
5. [ComfyUI — Local Image Generation](#5-comfyui--local-image-generation)
6. [Model Selection Guide](#6-model-selection-guide)
7. [Amazon-Specific Use Cases & Implementation Patterns](#7-amazon-specific-use-cases--implementation-patterns)
8. [Local n8n vs Cloud n8n](#8-local-n8n-vs-cloud-n8n)
9. [Overnight Batch Pipeline Patterns](#9-overnight-batch-pipeline-patterns)
10. [ComfyUI API Integration — Programmatic Control](#10-comfyui-api-integration--programmatic-control)
11. [Fine-Tuning Basics — When to Bother](#11-fine-tuning-basics--when-to-bother)
12. [Cost Analysis — Hardware Amortisation vs API Pricing](#12-cost-analysis--hardware-amortisation-vs-api-pricing)
13. [Docker Setup — Reproducible Local Stack](#13-docker-setup--reproducible-local-stack)
14. [Monitoring Overnight Jobs — What Breaks & How to Know](#14-monitoring-overnight-jobs--what-breaks--how-to-know)
15. [Dos & Don'ts](#15-dos--donts)

---

## 1. Why Run Locally — The Honest Case

### The Core Argument

Cloud APIs are elastic and zero-maintenance. Local hardware requires a capital purchase, physical space, electricity, and your attention when things break. So why bother? One reason: **volume**.

At low volumes (under ~5,000 LLM calls/month or ~500 images/month), cloud APIs win on total cost. Above certain thresholds — which depend on which API you're replacing — a local GPU pays for itself in under six months. At syncflow's operational scale, where overnight batch jobs process entire product catalogues, the economics shift dramatically.

### Cost-Per-Inference Breakdown

**Text LLM (GPT-4o-class quality):**

| Method | Cost per 1K calls | Monthly cost at 50K calls |
|---|---|---|
| OpenAI GPT-4o | ~$0.75 (input) + ~$3.00 (output) per 1M tokens | ~$75–$300 depending on token count |
| Anthropic Claude Sonnet | ~$3.00/$15.00 per 1M tokens | ~$150–$750 |
| Together AI (LLaMA 3.1 70B) | ~$0.88/$0.88 per 1M tokens | ~$44 |
| **Ollama local (LLaMA 3.1 70B, RTX 4090)** | **$0 variable** (electricity: ~$0.0002/call) | **~$10 electricity** |

**Image generation:**

| Method | Cost per image | Monthly cost at 10K images |
|---|---|---|
| OpenAI GPT-Image-1 | $0.04–$0.08 | $400–$800 |
| FAL.ai Flux.1 Dev | $0.025 | $250 |
| FAL.ai Flux Schnell | $0.003 | $30 |
| **Local ComfyUI (Flux.1 Dev, RTX 4090)** | **~$0.0004 electricity** | **~$4** |

**Embedding generation:**

| Method | Cost per 1M embeddings | Monthly at 10M embeddings |
|---|---|---|
| OpenAI text-embedding-3-large | $0.13 | $1.30 |
| Ollama nomic-embed-text (local) | $0 + electricity | ~$0.20 |

At very high embedding volumes (semantic search across large product catalogues), local embeddings become relevant mainly for latency, not cost — OpenAI embeddings are already cheap.

### Break-Even Analysis

The break-even point for a **$1,500 RTX 4090** setup (GPU + server hardware ~$3,000 total) against common API costs:

| Workload | Monthly API cost | Break-even month |
|---|---|---|
| 10K images/month (Flux Dev at $0.025) | $250 | Month 12 |
| 50K LLM calls/month (GPT-4o mini) | $150 | Month 20 |
| 10K images + 50K calls combined | $400 | Month 7–8 |
| 50K images/month | $1,250 | Month 2–3 |

**The rule:** if you're generating more than 5,000 images per month OR running >200K LLM inference calls/month, a local GPU pays for itself within a year. Below that, cloud APIs are cheaper when you factor in setup time.

### When Local Makes Sense

✅ **Overnight batch jobs** — you have 8+ hours to run inference, latency is irrelevant  
✅ **High image volume** — catalog-scale product image generation (5,000+/month)  
✅ **Embedding generation** — ingesting large text corpora into pgvector  
✅ **Privacy requirements** — customer review data, internal pricing strategies you don't want on a cloud API  
✅ **Experimental iteration** — rapid prompt engineering without burning API budget  
✅ **Rate-limit-free operation** — no OpenAI rate limits, no queue, no throttling  
✅ **Offline capability** — your batch job runs even if the API is down  

### When Local Is NOT Worth It

❌ **Low volume** — under 2,000 API calls/month, just use the cloud  
❌ **Time-sensitive tasks** — a local 70B model is slower than GPT-4o; don't use it for real-time user-facing responses  
❌ **Highest quality tasks** — GPT-4o still outperforms any 70B local model on complex reasoning; don't downgrade your quality just to save money  
❌ **No GPU budget** — CPU-only inference is viable for small models but far too slow for batch scale  
❌ **One person team, no DevOps comfort** — a broken overnight job that no one monitors is worse than a reliable API call  
❌ **The task is already cheap enough** — OpenAI embedding at $0.13/1M tokens barely registers on a budget; don't optimise it  

---

## 2. Hardware Requirements & Tiers

### The Fundamental Rule

**Model VRAM requirement (minimum) = parameter count × 2 bytes (FP16)**

So:
- 7B model: 7 × 2 = **14 GB VRAM** (minimum, no KV cache headroom)
- 8B model: 8 × 2 = **16 GB VRAM** (fits a 24GB card with headroom)
- 13B model: 13 × 2 = **26 GB VRAM** (needs 48GB card for comfortable FP16)
- 70B model: 70 × 2 = **140 GB VRAM** (needs 2× A100 80GB or similar)

**Quantisation saves VRAM at a quality cost:**
- Q4_K_M quantisation: roughly **0.5 bytes per parameter**
  - 7B at Q4: ~3.5 GB VRAM ✅ fits almost anything
  - 70B at Q4: ~35 GB VRAM ✅ fits a single 40GB A100 or dual 24GB cards
- Q8 quantisation: 1 byte per parameter — good quality/VRAM balance

**Image generation is different:** SDXL checkpoint = ~6.5 GB, Flux.1 Dev = ~24 GB VRAM at full precision, ~12 GB quantised.

---

### Tier 1 — Consumer (RTX 3090 / RTX 4090 — 24 GB VRAM)

**RTX 3090:** ~$700–900 used (2026). CUDA-capable, excellent for inference, older memory bandwidth.  
**RTX 4090:** ~$1,500–2,000 new. The current king of consumer-grade local inference. Ada Lovelace architecture with significantly faster memory bandwidth.

**What runs well at this tier:**
- LLaMA 3.1 8B / Mistral 7B / Phi-3 Mini: full FP16, very fast (30–60 tokens/sec)
- LLaMA 3.1 70B at Q4: fits (just), ~8–15 tokens/sec — usable for overnight batch
- SDXL checkpoint: fits easily, ~10–15 sec/image
- Flux.1 Schnell: fits (quantised), ~5–8 sec/image
- Flux.1 Dev: fits (quantised at fp8), ~10–20 sec/image
- nomic-embed-text / mxbai-embed-large: trivial, fits in <2 GB

**What doesn't run well:**
- Flux.1 Dev at full precision: 24 GB is too tight, causes OOM under load
- LLaMA 3.1 70B at FP16: 140 GB required — doesn't fit
- Multiple concurrent large models: you can only load one large model at a time

**Best for syncflow:** RTX 4090. This is the pragmatic recommendation. Fits all 8B/13B models at full precision, runs 70B models quantised, handles Flux images. If budget is tight, a used RTX 3090 is 80% of the capability for half the price.

---

### Tier 2 — Prosumer (RTX 6000 Ada 48 GB / Dual RTX 3090)

**RTX 6000 Ada:** ~$5,000–6,500. 48 GB GDDR6 with ECC. Designed for workstations, not gaming — runs 24/7 without throttling.  
**Dual RTX 3090 (NVLink):** ~$1,500 + motherboard considerations. Tensor parallelism with Ollama isn't fully automatic — you get model parallelism across cards but it's manual.

**What unlocks at this tier:**
- LLaMA 3.1 70B at Q8: excellent quality, ~12–20 tokens/sec
- Mixtral 8×7B MoE models: fits fully
- Multiple simultaneous smaller models (e.g., embed + LLM at same time)
- Flux.1 Dev at full BF16 precision: fits with headroom
- Stable Diffusion 3.5 Large: fits comfortably
- Training small LoRA adapters without offloading

**Best for:** Agencies running multiple clients' overnight batches simultaneously. If you're generating images AND running LLM pipelines for the same client concurrently, 48 GB eliminates the scheduling complexity.

---

### Tier 3 — Server (A100 40/80 GB, H100 — Data Center)

**A100 40 GB:** ~$8,000–12,000 used. Enterprise inference standard.  
**A100 80 GB:** ~$15,000–20,000. Fits LLaMA 70B at full FP16.  
**H100 80 GB:** ~$25,000–35,000. 3× faster than A100 for transformer inference.

**What this unlocks:**
- LLaMA 3.1 70B at full FP16: fits on A100 80GB
- LLaMA 3.1 405B at Q4: needs 2× A100 80GB
- True enterprise-grade inference throughput
- Running multiple concurrent 13B models

**For Amazon brand workflows:** Not practical. The economics don't justify hardware at this price for a typical Amazon seller operation. Cloud rental (Vast.ai, RunPod, Lambda Labs) at $2–4/hour is a better approach for occasional heavy batch jobs that need this tier.

**Exception:** If you're operating at true agency scale — generating 100K+ images/month for 50+ brands — server-tier hardware starts making sense. Do the math.

---

### CPU Fallback — Mac M-Series & AMD

**NVIDIA requirement:** Ollama and ComfyUI use CUDA. You need an NVIDIA GPU for full performance.

**Mac M-Series (Apple Silicon — M3/M4 Max/Ultra):**  
This is the exception to the NVIDIA-only rule. Apple's unified memory architecture means the CPU and GPU share the same memory pool.

- M3 Max (36–128 GB unified memory): can run LLaMA 3.1 70B at Q4 without loading into GPU VRAM separately
- Performance: ~8–15 tokens/sec on 70B Q4 — similar to a 4090 running the same model
- ComfyUI: runs on Metal backend, not CUDA — good community support but some custom nodes don't work
- Power consumption: ~40W vs ~300–450W for a 4090 under load — significant for 24/7 overnight jobs

**Rule of thumb for Mac:** If you already own an M3/M4 Max MacBook or Mac Studio, it's a legitimate local inference machine for LLMs. For image generation at scale, CUDA still wins due to ecosystem maturity.

**CPU-only (AMD or Intel):**  
Running LLMs on CPU is possible (Ollama falls back automatically) but orders of magnitude slower:
- LLaMA 3.1 8B on a modern AMD Ryzen 9: ~2–5 tokens/sec
- This is acceptable for low-volume testing, unusable for batch jobs
- Only practical for Phi-3 Mini / Phi-4 Mini sized models at CPU

---

### Summary: Recommended Hardware for syncflow

| Budget | Hardware | Models | Best for |
|---|---|---|---|
| $800–1,000 | Used RTX 3090 24GB | 8B FP16, 70B Q4, Flux Schnell | Getting started, moderate batch |
| $1,500–2,000 | RTX 4090 24GB | 8B FP16, 70B Q4, Flux Dev fp8 | Primary recommendation |
| $5,000–7,000 | RTX 6000 Ada 48GB | 70B Q8, Flux Dev BF16 | Agency-scale simultaneous jobs |
| Already owned | Mac M3/M4 Max | 70B Q4 LLM (no images at scale) | LLM batch on existing hardware |
| Occasional | Vast.ai / RunPod rental | Any | One-off heavy jobs |

---

## 3. Ollama — Local LLM Server

Ollama is the de facto standard for running open-weight LLMs locally. It handles model downloading, VRAM management, quantisation selection, and exposes an OpenAI-compatible HTTP API. If you're running local LLMs for syncflow, this is what you use.

### Installation

**macOS:**
```bash
# Option 1: brew (recommended)
brew install ollama

# Option 2: direct download
curl -fsSL https://ollama.com/install.sh | sh
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://ollama.com/install.sh | sh
# Ollama installs as a systemd service automatically
systemctl enable ollama
systemctl start ollama
```

**Windows:**
Download the installer from https://ollama.com/download  
Installs as a Windows service. GPU access via CUDA is automatic if drivers are installed.

**Verify installation:**
```bash
ollama --version
curl http://localhost:11434/api/tags  # should return JSON
```

### Model Library — Key Pull Commands

```bash
# Text LLMs
ollama pull llama3.1:8b          # Fast, general purpose (8B FP16 ~16GB VRAM)
ollama pull llama3.1:70b         # High quality, large (70B Q4 ~40GB)
ollama pull llama3.2:3b          # Tiny and fast for simple tasks
ollama pull mistral:7b           # Efficient, good instruction following
ollama pull phi4:14b             # Microsoft's best small model
ollama pull qwen2.5:7b           # Best multilingual model at 7B
ollama pull qwen2.5:72b          # Multilingual quality tier (Q4: ~40GB)
ollama pull gemma3:9b            # Google's Gemma 3, strong reasoning

# Embedding models
ollama pull nomic-embed-text     # 768-dim, fast, excellent for pgvector
ollama pull mxbai-embed-large    # 1024-dim, higher quality
ollama pull snowflake-arctic-embed  # Alternative high-quality embedder

# Vision models (describe images, analyze product photos)
ollama pull llava:13b            # LLaVA 13B vision model
ollama pull llava-llama3         # LLaVA on LLaMA 3 base, better quality
ollama pull moondream            # Tiny vision model, great for quick analysis
```

### Model Management

```bash
# List downloaded models
ollama list

# Remove a model
ollama rm llama3.1:8b

# Show model details (parameters, template, VRAM)
ollama show llama3.1:8b

# Run a model interactively (CLI chat)
ollama run llama3.1:8b

# Copy/alias a model
ollama cp llama3.1:8b my-custom-llama

# Check running models and memory usage
ollama ps
```

### OpenAI-Compatible API (localhost:11434)

Ollama exposes an OpenAI-compatible endpoint, meaning any code or tool that works with OpenAI can switch to Ollama by changing the base URL. This is the key integration point for syncflow.

**Basic completion:**
```bash
# Direct Ollama API
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.1:8b",
  "prompt": "Rewrite this Amazon bullet point to be more compelling: ...",
  "stream": false
}'

# OpenAI-compatible endpoint (same code as OpenAI)
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.1:8b",
    "messages": [{"role": "user", "content": "Rewrite this bullet point..."}]
  }'
```

**Python using the OpenAI client (drop-in replacement):**
```python
from openai import OpenAI

# Point to local Ollama instead of OpenAI
client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"  # required by client but ignored by Ollama
)

response = client.chat.completions.create(
    model="llama3.1:8b",
    messages=[
        {"role": "system", "content": "You are an Amazon listing optimization expert."},
        {"role": "user", "content": "Rewrite this bullet point: ..."}
    ],
    temperature=0.3
)

print(response.choices[0].message.content)
```

**Embeddings via OpenAI client:**
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)

response = client.embeddings.create(
    model="nomic-embed-text",
    input="Premium bamboo cutting board with juice groove"
)

embedding = response.data[0].embedding  # List[float], 768-dim
# Store this in Supabase pgvector for semantic search
```

**Streaming responses (for real-time output):**
```python
for chunk in client.chat.completions.create(
    model="llama3.1:8b",
    messages=[{"role": "user", "content": "Write 5 Amazon bullet points..."}],
    stream=True
):
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

### VRAM/CPU Automatic Selection

Ollama automatically detects your GPU and loads as much of the model as fits into VRAM, offloading the remainder to RAM/CPU. This means:

- If you have 24 GB VRAM and a 70B model needs 40 GB: Ollama loads ~60% to GPU, 40% to RAM — you get GPU-accelerated inference at reduced speed
- You don't need to manually configure split loading
- `ollama ps` shows the `%GPU` column indicating how much is GPU-resident

To force CPU-only (for testing):
```bash
OLLAMA_NUM_GPU=0 ollama run llama3.1:8b
```

To limit VRAM usage:
```bash
OLLAMA_GPU_MEMORY_FRACTION=0.8 ollama serve  # use 80% of VRAM
```

### Running as a Service

**Linux (systemd — automatic from install script):**
```bash
# Ollama runs as ollama.service by default
systemctl status ollama

# Edit service config (e.g., add environment variables)
sudo systemctl edit ollama
# Add:
[Service]
Environment="OLLAMA_HOST=0.0.0.0"  # listen on all interfaces (for n8n access)
Environment="OLLAMA_KEEP_ALIVE=60m"  # keep model in VRAM for 60 minutes
```

**macOS (launchd):**
```bash
# Ollama runs as a menu bar app; it starts on login by default
# To run as background service:
brew services start ollama
```

**Key environment variables:**

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_HOST` | `127.0.0.1:11434` | Bind address — set to `0.0.0.0` for network access |
| `OLLAMA_KEEP_ALIVE` | `5m` | How long to keep model loaded in VRAM after last request |
| `OLLAMA_NUM_PARALLEL` | `1` | Concurrent request slots (increase if VRAM allows) |
| `OLLAMA_MAX_LOADED_MODELS` | `3` | Max models simultaneously in VRAM |
| `OLLAMA_FLASH_ATTENTION` | `1` | Enable flash attention (better performance) |
| `OLLAMA_NUM_GPU` | auto | Number of GPU layers to load |

### Custom Modelfiles

Create custom Ollama models with specific system prompts baked in:

```dockerfile
# File: Modelfile.amazon-bullets
FROM llama3.1:8b

SYSTEM """
You are an Amazon listing optimization expert specializing in writing high-converting bullet points.
Follow these rules:
- Start each bullet with a key benefit in ALL CAPS (max 3 words)
- Keep each bullet under 200 characters
- Focus on the customer benefit, not just the feature
- Never use superlatives like "best" or "amazing"
- Format output as a JSON array of strings
"""

PARAMETER temperature 0.2
PARAMETER top_p 0.9
```

```bash
# Create the custom model
ollama create amazon-bullets -f Modelfile.amazon-bullets

# Use it
ollama run amazon-bullets "Write 5 bullet points for a bamboo cutting board"
```

---

## 4. LM Studio — GUI Model Runner

LM Studio is a desktop application that provides a graphical interface for downloading and running local models. It uses `llama.cpp` under the hood and exposes the same OpenAI-compatible API as Ollama.

### When to Use LM Studio vs Ollama

| Scenario | Use |
|---|---|
| Production batch pipeline | **Ollama** — headless service, auto-restart, better scripting |
| Experimenting with models | **LM Studio** — visual download manager, easy UI |
| Prompt engineering | **LM Studio** — side-by-side model comparison UI |
| Non-technical team member needs to run models | **LM Studio** — no CLI required |
| Docker/server deployment | **Ollama** — LM Studio is desktop-only |
| Benchmarking multiple models | **LM Studio** — tokens/sec display, easy switching |

### Setup

1. Download from https://lmstudio.ai (macOS, Windows, Linux)
2. Open → Search tab → Search "llama 3" → Download Q4_K_M variant
3. Go to Local Server tab → Load a model → Start Server
4. Server runs at `http://localhost:1234/v1` (OpenAI compatible)

### Using LM Studio's API

Same as Ollama's API — just change the port:
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"  # ignored, any value works
)
```

### LM Studio for Model Selection

LM Studio's model browser shows:
- VRAM requirements per quantisation level
- Token speed benchmarks from community
- Recommended quantisation for your hardware

This makes it ideal for **evaluating which model + quantisation** to commit to before configuring Ollama for production.

---

## 5. ComfyUI — Local Image Generation

ComfyUI is the standard production platform for local image generation. Unlike AUTOMATIC1111 (a simpler web UI), ComfyUI uses a node-based workflow graph that maps directly to the diffusion pipeline — making it fully programmable and API-drivable for automated batch jobs.

### Installation

**Prerequisites:**
- Python 3.10+ 
- CUDA 11.8 or 12.x for NVIDIA GPUs
- Git

**Standard installation:**
```bash
git clone https://github.com/comfyanonymous/ComfyUI
cd ComfyUI

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install dependencies
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

# Start ComfyUI
python main.py
# → Opens at http://127.0.0.1:8188

# API mode (no browser launch, for batch use)
python main.py --listen 0.0.0.0 --port 8188
```

**macOS (Apple Silicon):**
```bash
pip install torch torchvision torchaudio  # Metal backend auto-detected
python main.py  # Uses MPS backend automatically
```

### Directory Structure

Understanding this is critical — model files go in specific folders:

```
ComfyUI/
├── models/
│   ├── checkpoints/      # Main model weights (SDXL .safetensors, Flux .safetensors)
│   ├── loras/            # LoRA adapter files (.safetensors)
│   ├── vae/              # VAE decoder models
│   ├── clip/             # CLIP text encoders
│   ├── unet/             # Flux UNet / diffusion models (for split format)
│   ├── controlnet/       # ControlNet models
│   ├── upscale_models/   # Upscaler models (4x-UltraSharp, etc.)
│   └── embeddings/       # Textual inversion embeddings
├── custom_nodes/         # Plugin packs (install here)
├── output/               # Generated images saved here
├── input/                # Input images for img2img
└── workflows/            # Saved workflow JSON files
```

### Downloading Models

**Primary sources:**
- **Hugging Face:** `huggingface-cli download black-forest-labs/FLUX.1-dev --local-dir ./models/checkpoints/`
- **Civitai:** Manual download via browser (community fine-tunes and LoRAs)

**Flux.1 Dev (recommended for Amazon):**
```bash
# Install huggingface_hub
pip install huggingface_hub

# Download Flux.1 Dev (requires HF account and model access approval)
from huggingface_hub import hf_hub_download

# Flux Dev checkpoint (23 GB)
hf_hub_download(
    repo_id="black-forest-labs/FLUX.1-dev",
    filename="flux1-dev.safetensors",
    local_dir="./ComfyUI/models/checkpoints"
)

# You also need the CLIP and VAE
hf_hub_download(repo_id="openai/clip-vit-large-patch14", ...)
hf_hub_download(repo_id="black-forest-labs/FLUX.1-dev", filename="ae.safetensors", ...)
```

**Faster quantised Flux (fits in 12 GB VRAM):**
```bash
# GGUF quantised Flux (community-maintained)
# Download from: https://huggingface.co/city96/FLUX.1-dev-gguf
# Put flux1-dev-Q5_1.gguf in models/checkpoints/ (or models/unet/ for split format)
```

### Workflow JSON Format

ComfyUI workflows are JSON graphs where each node has an ID, class type, and inputs:

```json
{
  "3": {
    "class_type": "KSampler",
    "inputs": {
      "seed": 123456789,
      "steps": 20,
      "cfg": 7.0,
      "sampler_name": "euler",
      "scheduler": "normal",
      "denoise": 1.0,
      "positive": ["6", 0],
      "negative": ["7", 0],
      "model": ["4", 0],
      "latent_image": ["5", 0]
    }
  },
  "4": {
    "class_type": "CheckpointLoaderSimple",
    "inputs": {
      "ckpt_name": "flux1-dev.safetensors"
    }
  },
  "5": {
    "class_type": "EmptyLatentImage",
    "inputs": {
      "width": 1024,
      "height": 1024,
      "batch_size": 1
    }
  },
  "6": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "{{POSITIVE_PROMPT}}",
      "clip": ["4", 1]
    }
  },
  "7": {
    "class_type": "CLIPTextEncode",
    "inputs": {
      "text": "blurry, low quality, text watermark",
      "clip": ["4", 1]
    }
  },
  "8": {
    "class_type": "VAEDecode",
    "inputs": {
      "samples": ["3", 0],
      "vae": ["4", 2]
    }
  },
  "9": {
    "class_type": "SaveImage",
    "inputs": {
      "filename_prefix": "amazon_product",
      "images": ["8", 0]
    }
  }
}
```

### Essential Custom Node Packs

Install custom nodes by cloning into `ComfyUI/custom_nodes/`:

```bash
cd ComfyUI/custom_nodes

# 1. ComfyUI Manager — manages all other nodes (install this first)
git clone https://github.com/ltdrdata/ComfyUI-Manager

# 2. WAS Node Suite — extensive utility nodes (image processing, text, files)
git clone https://github.com/WASasquatch/was-node-suite-comfyui

# 3. ComfyUI Impact Pack — segmentation, detailing, face/product masking
git clone https://github.com/ltdrdata/ComfyUI-Impact-Pack

# 4. ComfyUI-Advanced-ControlNet — better ControlNet support
git clone https://github.com/Kosinkadink/ComfyUI-Advanced-ControlNet

# 5. rgthree-comfy — better node UI, grouping, bookmarks
git clone https://github.com/rgthree/rgthree-comfy

# 6. ComfyUI_IPAdapter_plus — style/product consistency (IP-Adapter)
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus

# 7. ComfyUI-layerdiffuse — transparent/foreground-only generation
git clone https://github.com/huchenlei/ComfyUI-layerdiffuse

# 8. comfyui-florence2 — image understanding/captioning (for auto-prompting)
git clone https://github.com/kijai/ComfyUI-Florence2

# After adding nodes, restart ComfyUI
```

**For Amazon product workflows, the most important are:**
- **ComfyUI-Impact-Pack** — for removing/segmenting product from background
- **ComfyUI_IPAdapter_plus** — for maintaining consistent product appearance across generations
- **ComfyUI-layerdiffuse** — for generating product with transparent background (then composite onto scene)
- **WAS Node Suite** — for file I/O and batch processing

---

## 6. Model Selection Guide

### Text LLMs

| Model | Size | VRAM (FP16) | VRAM (Q4) | Speed (4090) | Best for |
|---|---|---|---|---|---|
| **Phi-3 Mini** | 3.8B | 8 GB | 2.5 GB | 80+ t/s | Simple structured tasks, classification, extraction |
| **Phi-4 Mini** | 3.8B | 8 GB | 2.5 GB | 80+ t/s | Better than Phi-3 at reasoning, same speed |
| **Mistral 7B v0.3** | 7B | 14 GB | 4.5 GB | 60 t/s | General purpose, fast, good instruction following |
| **LLaMA 3.2 3B** | 3B | 6 GB | 2 GB | 100+ t/s | Ultra-fast simple tasks, classify/tag at scale |
| **LLaMA 3.1 8B** | 8B | 16 GB | 5 GB | 55 t/s | Recommended general purpose for 24GB GPUs |
| **LLaMA 3.1 70B Q4** | 70B | 140 GB | 40 GB | 12 t/s | High-quality rewrites, complex analysis |
| **Qwen2.5 7B** | 7B | 14 GB | 4.5 GB | 60 t/s | Best choice for multilingual (Amazon DE/FR/JP/ES) |
| **Qwen2.5 72B Q4** | 72B | 144 GB | 41 GB | 11 t/s | High-quality multilingual batch |
| **Gemma 3 9B** | 9B | 18 GB | 5.5 GB | 50 t/s | Strong reasoning, good for structured output |

**Recommendations by task:**

- **Product description rewriting:** LLaMA 3.1 8B (fast enough, quality sufficient)
- **Bullet point optimization:** LLaMA 3.1 8B or Mistral 7B
- **Complex copywriting / A+ content:** LLaMA 3.1 70B Q4 (overnight batch, quality justified)
- **Multi-marketplace translation:** Qwen2.5 7B (multilingual is its superpower)
- **Keyword extraction / classification:** Phi-4 Mini (trivially fast, cheap VRAM)
- **Review summarisation:** LLaMA 3.1 8B (sufficient quality, high throughput)

### Embedding Models

| Model | Dimensions | VRAM | Quality | Best for |
|---|---|---|---|---|
| **nomic-embed-text** | 768 | ~1 GB | ⭐⭐⭐⭐ | Fast, great for pgvector semantic search |
| **mxbai-embed-large** | 1024 | ~2 GB | ⭐⭐⭐⭐⭐ | Higher quality, recommended for keyword clustering |
| **snowflake-arctic-embed** | 1024 | ~2 GB | ⭐⭐⭐⭐⭐ | Very strong, good alternative to mxbai |
| **all-minilm** | 384 | ~0.5 GB | ⭐⭐⭐ | Tiny, for low-VRAM situations |

**For pgvector in Supabase:** Use `nomic-embed-text` (768-dim) for speed or `mxbai-embed-large` (1024-dim) for quality. Store as `vector(768)` or `vector(1024)` column type.

### Image Generation Models

| Model | VRAM (full) | VRAM (quant) | Speed (4090) | Quality | Best for |
|---|---|---|---|---|---|
| **SDXL 1.0** | 6.5 GB | 4 GB | 8–12 sec | ⭐⭐⭐ | Fast drafts, works on any GPU |
| **SD 3.5 Large** | 14 GB | 8 GB | 15–25 sec | ⭐⭐⭐⭐ | Quality step up from SDXL |
| **Flux.1 Schnell** | 24 GB | 10 GB (Q5) | 3–5 sec | ⭐⭐⭐⭐ | Fast bulk generation |
| **Flux.1 Dev** | 24 GB | 12 GB (Q5) | 10–18 sec | ⭐⭐⭐⭐⭐ | **Recommended for Amazon** — best quality/cost |
| **Flux.1 Pro** | API only | API only | n/a | ⭐⭐⭐⭐⭐ | Highest quality (cloud only) |

**For Amazon product images:** Flux.1 Dev at Q5 quantisation is the sweet spot. It fits in 12–16 GB VRAM, produces commercially-grade product shots, and at 10–18 sec/image on a 4090, you can generate ~3,000–5,000 images in an overnight run.

---

## 7. Amazon-Specific Use Cases & Implementation Patterns

### 7.1 Product Description Rewriting at Scale

**Scenario:** You have 500 ASINs with weak title/bullet points. You want to run LLaMA 3.1 8B overnight to rewrite all of them following your style guide.

**Architecture:** Supabase job queue → n8n polls → Ollama → Supabase result storage

**Python batch processor:**
```python
import asyncio
from openai import AsyncOpenAI
import asyncpg

OLLAMA_CLIENT = AsyncOpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"
)

SYSTEM_PROMPT = """
You are an Amazon listing optimization expert.
Given a product title and bullet points, rewrite them to:
1. Lead the title with the primary keyword (provided)
2. Make bullets benefit-focused, not feature-focused
3. Keep title under 200 characters
4. Keep each bullet under 200 characters
Return JSON: {"title": "...", "bullets": ["...", "...", "...", "...", "..."]}
"""

async def rewrite_listing(asin: str, current_title: str, current_bullets: list[str], primary_keyword: str) -> dict:
    response = await OLLAMA_CLIENT.chat.completions.create(
        model="llama3.1:8b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"""
Primary keyword: {primary_keyword}
Current title: {current_title}
Current bullets:
{chr(10).join(f'- {b}' for b in current_bullets)}

Rewrite the listing.
"""}
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    return response.choices[0].message.content

async def process_batch(asins: list[dict]) -> None:
    # Process 5 at a time (concurrency limited by Ollama's OLLAMA_NUM_PARALLEL)
    semaphore = asyncio.Semaphore(3)
    
    async def process_one(asin_data: dict):
        async with semaphore:
            result = await rewrite_listing(
                asin=asin_data["asin"],
                current_title=asin_data["title"],
                current_bullets=asin_data["bullets"],
                primary_keyword=asin_data["primary_keyword"]
            )
            # Write result back to Supabase
            # await db.execute("UPDATE asins SET rewritten_content = $1 WHERE asin = $2", result, asin_data["asin"])
            print(f"✅ {asin_data['asin']}: done")
    
    await asyncio.gather(*[process_one(a) for a in asins])
```

**n8n workflow equivalent:**
1. **Schedule trigger** — 11 PM nightly
2. **Supabase node** — `SELECT * FROM asins WHERE rewrite_status = 'pending' LIMIT 100`
3. **Loop Over Items**
4. **HTTP Request** → `POST http://localhost:11434/v1/chat/completions` with prompt template
5. **Supabase node** — `UPDATE asins SET rewritten_content = ..., rewrite_status = 'done'`

### 7.2 Background Removal and Scene Generation

**Scenario:** Generate lifestyle product images — product composited onto AI-generated backgrounds.

**Pattern in ComfyUI:**
1. Load product photo → segment/remove background (Impact Pack segmentation)
2. Generate background scene with Flux.1 Dev
3. Composite product onto background using ComfyUI's compositing nodes
4. Save result

**n8n + ComfyUI API workflow:**
```python
import requests, json, time, base64
from pathlib import Path

COMFY_URL = "http://localhost:8188"

def submit_background_generation(product_image_path: str, scene_prompt: str) -> str:
    """Submit a workflow to ComfyUI and return the prompt_id."""
    
    # First, upload the product image
    with open(product_image_path, "rb") as f:
        upload_response = requests.post(
            f"{COMFY_URL}/upload/image",
            files={"image": f},
            data={"type": "input"}
        )
    uploaded_filename = upload_response.json()["name"]
    
    # Load and parameterise workflow
    with open("workflows/product_scene_composite.json") as f:
        workflow = json.load(f)
    
    # Inject parameters into workflow nodes
    workflow["LOAD_IMAGE_NODE_ID"]["inputs"]["image"] = uploaded_filename
    workflow["FLUX_PROMPT_NODE_ID"]["inputs"]["text"] = scene_prompt
    workflow["SEED_NODE_ID"]["inputs"]["seed"] = int(time.time())
    
    # Submit to ComfyUI
    response = requests.post(
        f"{COMFY_URL}/prompt",
        json={"prompt": workflow}
    )
    return response.json()["prompt_id"]

def wait_for_completion(prompt_id: str, timeout: int = 300) -> list[str]:
    """Poll until workflow completes, return output image paths."""
    deadline = time.time() + timeout
    
    while time.time() < deadline:
        history = requests.get(f"{COMFY_URL}/history/{prompt_id}").json()
        
        if prompt_id in history:
            outputs = history[prompt_id]["outputs"]
            images = []
            for node_id, node_output in outputs.items():
                if "images" in node_output:
                    for img in node_output["images"]:
                        images.append(f"{COMFY_URL}/view?filename={img['filename']}&type={img['type']}")
            return images
        
        time.sleep(3)  # Poll every 3 seconds
    
    raise TimeoutError(f"Workflow {prompt_id} did not complete within {timeout}s")

# Usage
prompt_id = submit_background_generation(
    product_image_path="./product_photos/B08XYZ123.jpg",
    scene_prompt="Modern minimalist kitchen countertop, soft natural light, wooden accents, lifestyle photography"
)
image_urls = wait_for_completion(prompt_id)
print(f"Generated: {image_urls}")
```

### 7.3 Review Summarisation Batches

**Scenario:** Nightly job pulls all new reviews across your brand's ASINs, runs sentiment analysis and summarisation, writes structured summaries to Supabase.

```python
import json
from openai import OpenAI

client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

REVIEW_ANALYSIS_PROMPT = """
Analyze these Amazon product reviews and return JSON with:
{
  "sentiment": "positive|negative|mixed",
  "sentiment_score": 0.0-1.0,
  "key_positives": ["...", "..."],  // top 3 things customers love
  "key_negatives": ["...", "..."],  // top 3 complaints
  "summary": "2-3 sentence summary for the brand team",
  "actionable_insight": "One specific thing the brand should act on"
}
"""

def analyze_reviews(reviews: list[str]) -> dict:
    review_text = "\n---\n".join(reviews[:20])  # Cap at 20 reviews per call
    
    response = client.chat.completions.create(
        model="llama3.2:3b",  # Small model sufficient for structured extraction
        messages=[
            {"role": "system", "content": REVIEW_ANALYSIS_PROMPT},
            {"role": "user", "content": f"Reviews:\n{review_text}"}
        ],
        temperature=0.1,
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
```

**Why LLaMA 3.2 3B here, not 8B?** Review summarisation is pattern-matching work — extracting themes and sentiment — not creative writing. The 3B model is 3× faster and uses half the VRAM, letting you process 3× as many ASINs in the overnight window.

### 7.4 Keyword Clustering with Embeddings + pgvector

**Scenario:** You have 10,000 keywords from Helium 10 / SQP. You want to cluster them semantically to identify content themes and build PPC ad groups.

```python
import asyncio
from openai import AsyncOpenAI
import numpy as np

client = AsyncOpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

async def embed_keywords(keywords: list[str]) -> list[list[float]]:
    """Embed a batch of keywords using local Ollama."""
    # Process in batches of 50 to avoid memory pressure
    all_embeddings = []
    batch_size = 50
    
    for i in range(0, len(keywords), batch_size):
        batch = keywords[i:i+batch_size]
        response = await client.embeddings.create(
            model="nomic-embed-text",
            input=batch
        )
        batch_embeddings = [e.embedding for e in response.data]
        all_embeddings.extend(batch_embeddings)
        print(f"Embedded {min(i+batch_size, len(keywords))}/{len(keywords)} keywords")
    
    return all_embeddings

# Store in Supabase pgvector
SUPABASE_INSERT_SQL = """
INSERT INTO keyword_embeddings (keyword, embedding, asin)
VALUES ($1, $2::vector, $3)
ON CONFLICT (keyword, asin) DO UPDATE SET embedding = EXCLUDED.embedding;
"""

# Then query for similar keywords:
CLUSTER_QUERY_SQL = """
SELECT keyword, embedding <-> $1::vector AS distance
FROM keyword_embeddings
WHERE asin = $2
ORDER BY distance
LIMIT 20;
"""
```

**Supabase function for clustering:**
```sql
-- Find keyword clusters using pgvector cosine distance
CREATE OR REPLACE FUNCTION find_keyword_clusters(
    target_asin TEXT,
    cluster_threshold FLOAT DEFAULT 0.15
)
RETURNS TABLE(cluster_id INT, keywords TEXT[]) AS $$
DECLARE
    -- Implementation uses approximate nearest-neighbor search
    -- This is simplified for illustration
BEGIN
    RETURN QUERY
    SELECT 
        ROW_NUMBER() OVER () as cluster_id,
        array_agg(keyword ORDER BY keyword) as keywords
    FROM (
        SELECT 
            keyword,
            (embedding <-> LAG(embedding) OVER (ORDER BY embedding)) as gap
        FROM keyword_embeddings 
        WHERE asin = target_asin
    ) t
    GROUP BY CASE WHEN gap > cluster_threshold THEN keyword ELSE 'same_cluster' END;
END;
$$ LANGUAGE plpgsql;
```

### 7.5 Multi-Marketplace Translation

**Scenario:** You have English listings and need to create localised versions for DE, FR, IT, ES, JP marketplaces.

```python
TRANSLATION_SYSTEM_PROMPT = """
You are an Amazon listing specialist for {marketplace} ({language}).
Translate and localise the provided Amazon product listing.
Requirements:
- Maintain SEO keywords in the target language (not direct translation)
- Adapt cultural references and measurements (imperial → metric for EU)
- Follow Amazon's character limits for the target marketplace
- Return JSON: {{"title": "...", "bullets": ["...", ...], "description": "..."}}
"""

MARKETPLACE_CONFIG = {
    "DE": {"language": "German", "marketplace": "Amazon.de"},
    "FR": {"language": "French", "marketplace": "Amazon.fr"},
    "ES": {"language": "Spanish", "marketplace": "Amazon.es"},
    "IT": {"language": "Italian", "marketplace": "Amazon.it"},
    "JP": {"language": "Japanese", "marketplace": "Amazon.co.jp"},
}

def translate_listing(english_listing: dict, target_marketplace: str) -> dict:
    config = MARKETPLACE_CONFIG[target_marketplace]
    
    response = client.chat.completions.create(
        model="qwen2.5:7b",  # Qwen2.5 is far superior to LLaMA for multilingual
        messages=[
            {
                "role": "system",
                "content": TRANSLATION_SYSTEM_PROMPT.format(**config)
            },
            {
                "role": "user",
                "content": f"Translate and localise:\n{json.dumps(english_listing)}"
            }
        ],
        temperature=0.2,
        response_format={"type": "json_object"}
    )
    return json.loads(response.choices[0].message.content)
```

**Critical:** For Japanese marketplace, only Qwen2.5 and similar multilingual models produce acceptable quality. LLaMA 3.1 (English-dominant training) produces substandard Japanese that native speakers notice immediately. Always spot-check multilingual outputs before pushing to live listings.

---

## 8. Local n8n vs Cloud n8n

### When Running a Local Stack

If you're running Ollama and ComfyUI locally, the question naturally arises: should n8n also run locally?

### Arguments for Local n8n (alongside local AI stack)

✅ **Zero-latency internal calls** — n8n calling `localhost:11434` (Ollama) or `localhost:8188` (ComfyUI) is microsecond overhead, not network HTTP  
✅ **No egress costs** — data flowing between n8n and Ollama/ComfyUI never leaves the machine  
✅ **Simpler architecture** — one machine, one place to look when debugging  
✅ **Runs during cloud n8n outages** — your overnight batch continues even if n8n cloud is down  
✅ **No workflow execution limits** — n8n cloud free tier limits workflow executions; local is unlimited  

### Arguments for Cloud n8n (even with local AI)

✅ **Managed updates, uptime, backups** — you don't maintain the n8n server  
✅ **Webhook accessibility** — cloud n8n URLs are publicly accessible; local n8n needs ngrok or Cloudflare Tunnel for incoming webhooks  
✅ **Separation of concerns** — the n8n orchestration layer stays up even if the local AI machine crashes  
✅ **Multiple operators** — cloud n8n can be accessed by your whole team; local is one machine  
✅ **Credential management** — cloud n8n's credential store is centralised  

### Recommended Pattern

**Hybrid:** Run cloud n8n for orchestration and external-facing workflows, use a local n8n instance (in Docker) specifically for local AI workloads.

- External triggers (webhook from SP-API, Slack, email) → Cloud n8n
- Cloud n8n triggers a local n8n webhook → Local n8n runs the AI batch jobs
- Results written to Supabase → available to both

Or simpler: use cloud n8n exclusively, but call your local Ollama/ComfyUI via their HTTP APIs using the HTTP Request node. The machine running n8n cloud calls your home/office IP (with port forwarding or Cloudflare Tunnel). This works fine for overnight batch where latency of network hop doesn't matter.

### Resource Allocation Caution

If n8n is running on the same machine as Ollama and ComfyUI:
- n8n itself uses ~500 MB RAM
- Running a large ComfyUI generation (Flux.1 Dev) takes 12–24 GB VRAM
- Running Ollama 8B takes 16 GB VRAM
- These can't share VRAM simultaneously without quantisation

**Practical rule:** Don't run image generation and LLM inference concurrently on a 24 GB GPU. Sequence them in the workflow. Or run separate GPUs if your machine has multiple.

---

## 9. Overnight Batch Pipeline Patterns

### The Core Pattern: Supabase as Job Queue

The cleanest architecture for overnight batch AI jobs uses Supabase as both the job queue and result store. This avoids the complexity of Redis or separate message queues.

**Jobs table schema:**
```sql
CREATE TABLE ai_batch_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,              -- 'rewrite_bullets', 'generate_image', 'translate', 'embed_keywords'
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'done', 'failed'
    priority INTEGER DEFAULT 0,         -- higher = runs first
    
    -- Input payload
    input_data JSONB NOT NULL,
    
    -- Output
    output_data JSONB,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Context
    asin TEXT,
    marketplace TEXT,
    client_id UUID
);

-- Index for the polling query (critical for performance)
CREATE INDEX idx_batch_jobs_polling 
ON ai_batch_jobs (status, priority DESC, created_at ASC)
WHERE status = 'pending';
```

**Claim and process pattern (prevents duplicate processing):**
```sql
-- Atomically claim a batch of jobs
-- This SQL runs in n8n's Supabase node or a Python worker
WITH claimed AS (
    UPDATE ai_batch_jobs
    SET 
        status = 'processing',
        started_at = NOW(),
        attempts = attempts + 1
    WHERE id IN (
        SELECT id FROM ai_batch_jobs
        WHERE status = 'pending'
          AND attempts < max_attempts
        ORDER BY priority DESC, created_at ASC
        LIMIT 10  -- claim 10 at a time
        FOR UPDATE SKIP LOCKED  -- skip jobs being processed by another worker
    )
    RETURNING *
)
SELECT * FROM claimed;
```

**n8n workflow structure for overnight batch:**

```
Schedule Trigger (every night at 11:00 PM)
  │
  ▼
Supabase node: Claim batch of 50 pending jobs
  │
  ▼
IF: no jobs found → End (nothing to do tonight)
  │
  ▼
Loop Over Items (each job)
  │
  ├──[job_type = 'rewrite_bullets']──→ HTTP POST localhost:11434/v1/chat/completions
  │                                          │
  │                                          ▼
  │                                    Supabase: UPDATE status='done', output_data=result
  │
  ├──[job_type = 'generate_image']───→ HTTP POST localhost:8188/prompt
  │                                          │
  │                                          ▼
  │                                    Wait for completion (polling loop)
  │                                          │
  │                                          ▼
  │                                    Upload to Supabase Storage
  │                                          │
  │                                          ▼
  │                                    UPDATE status='done'
  │
  └──[error caught]────────────────→ UPDATE status='failed', error_message=...
                                       IF attempts >= max_attempts: Slack alert
```

**Mark complete / mark failed:**
```sql
-- On success
UPDATE ai_batch_jobs
SET 
    status = 'done',
    completed_at = NOW(),
    output_data = $1::jsonb  -- the result
WHERE id = $2;

-- On failure (will retry up to max_attempts)
UPDATE ai_batch_jobs
SET 
    status = 'pending',  -- back to pending for retry
    error_message = $1
WHERE id = $2 AND attempts < max_attempts;

-- On permanent failure (exhausted attempts)
UPDATE ai_batch_jobs
SET 
    status = 'failed',
    error_message = $1
WHERE id = $2 AND attempts >= max_attempts;
```

**Enqueueing jobs from external systems:**
```python
import httpx  # or use the Supabase Python client

async def enqueue_rewrite_job(asin: str, marketplace: str):
    """Add a listing rewrite job to the queue."""
    supabase.table("ai_batch_jobs").insert({
        "job_type": "rewrite_bullets",
        "status": "pending",
        "priority": 5,
        "input_data": {
            "asin": asin,
            "marketplace": marketplace,
            "fetch_current": True  # worker will fetch from SP-API
        },
        "asin": asin,
        "marketplace": marketplace
    }).execute()

# Bulk enqueue for a whole catalogue
def enqueue_catalogue_rewrite(asins: list[str]):
    jobs = [
        {
            "job_type": "rewrite_bullets",
            "priority": 5,
            "input_data": {"asin": asin},
            "asin": asin
        }
        for asin in asins
    ]
    supabase.table("ai_batch_jobs").insert(jobs).execute()
    print(f"Queued {len(asins)} rewrite jobs")
```

---

## 10. ComfyUI API Integration — Programmatic Control

### Running ComfyUI in API Mode

```bash
# Start in API mode (listens on 0.0.0.0 for network access)
python main.py --listen --port 8188 --disable-auto-launch

# For headless server (no display required)
python main.py --listen --port 8188 --disable-auto-launch --no-preview
```

### Complete API Integration Class

```python
import requests
import json
import time
import uuid
import websocket
from pathlib import Path


class ComfyUIClient:
    """
    Production-grade ComfyUI API client for batch image generation.
    Handles: job submission, WebSocket-based completion detection, 
    image retrieval, and upload to Supabase Storage.
    """
    
    def __init__(self, host: str = "localhost", port: int = 8188):
        self.base_url = f"http://{host}:{port}"
        self.ws_url = f"ws://{host}:{port}/ws"
        self.client_id = str(uuid.uuid4())
    
    def upload_image(self, image_path: str, image_type: str = "input") -> str:
        """Upload an input image (e.g., product photo) and return filename."""
        with open(image_path, "rb") as f:
            response = requests.post(
                f"{self.base_url}/upload/image",
                files={"image": f},
                data={"type": image_type, "overwrite": "true"}
            )
        response.raise_for_status()
        return response.json()["name"]
    
    def queue_prompt(self, workflow: dict) -> str:
        """Submit a workflow and return the prompt_id."""
        payload = {
            "prompt": workflow,
            "client_id": self.client_id
        }
        response = requests.post(f"{self.base_url}/prompt", json=payload)
        response.raise_for_status()
        return response.json()["prompt_id"]
    
    def wait_for_completion_ws(self, prompt_id: str, timeout: int = 600) -> list[str]:
        """
        Wait for job completion via WebSocket (more efficient than polling).
        Returns list of output image URLs.
        """
        ws = websocket.WebSocket()
        ws.connect(f"{self.ws_url}?clientId={self.client_id}")
        
        start_time = time.time()
        try:
            while time.time() - start_time < timeout:
                message = json.loads(ws.recv())
                
                if message["type"] == "executing":
                    if message["data"]["node"] is None and message["data"]["prompt_id"] == prompt_id:
                        # Execution complete
                        break
                
                elif message["type"] == "execution_error":
                    raise RuntimeError(f"ComfyUI error: {message['data']}")
        finally:
            ws.close()
        
        # Retrieve output images
        return self._get_output_images(prompt_id)
    
    def wait_for_completion_poll(self, prompt_id: str, timeout: int = 600, poll_interval: int = 3) -> list[str]:
        """Poll-based completion detection (fallback if WebSocket not available)."""
        deadline = time.time() + timeout
        
        while time.time() < deadline:
            history = requests.get(f"{self.base_url}/history/{prompt_id}").json()
            
            if prompt_id in history:
                if history[prompt_id].get("status", {}).get("completed"):
                    return self._get_output_images(prompt_id)
                elif history[prompt_id].get("status", {}).get("status_str") == "error":
                    raise RuntimeError(f"ComfyUI job failed: {history[prompt_id]}")
            
            time.sleep(poll_interval)
        
        raise TimeoutError(f"Job {prompt_id} timed out after {timeout}s")
    
    def _get_output_images(self, prompt_id: str) -> list[str]:
        """Extract output image URLs from completed job history."""
        history = requests.get(f"{self.base_url}/history/{prompt_id}").json()
        images = []
        
        for node_id, node_output in history[prompt_id]["outputs"].items():
            if "images" in node_output:
                for img in node_output["images"]:
                    url = f"{self.base_url}/view?filename={img['filename']}&type={img['type']}"
                    images.append(url)
        
        return images
    
    def download_image(self, image_url: str, output_path: str) -> str:
        """Download a generated image from ComfyUI to local disk."""
        response = requests.get(image_url, stream=True)
        response.raise_for_status()
        
        with open(output_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        return output_path
    
    def generate(self, workflow_path: str, prompt_overrides: dict, timeout: int = 300) -> list[str]:
        """
        High-level generation method. Load workflow, apply overrides, submit, wait.
        
        prompt_overrides: {node_id: {input_key: value}} to parameterise the workflow
        """
        with open(workflow_path) as f:
            workflow = json.load(f)
        
        # Apply overrides
        for node_id, overrides in prompt_overrides.items():
            if node_id in workflow:
                workflow[node_id]["inputs"].update(overrides)
        
        # Set random seed to avoid duplicate outputs
        for node_id, node in workflow.items():
            if node.get("class_type") in ("KSampler", "KSamplerAdvanced"):
                if workflow[node_id]["inputs"].get("seed", -1) == -1:
                    workflow[node_id]["inputs"]["seed"] = int(time.time() * 1000) % (2**32)
        
        prompt_id = self.queue_prompt(workflow)
        return self.wait_for_completion_poll(prompt_id, timeout=timeout)


# Usage example
client = ComfyUIClient("localhost", 8188)

image_urls = client.generate(
    workflow_path="workflows/flux_product_scene.json",
    prompt_overrides={
        "6": {"text": "Professional product photo, bamboo cutting board, marble countertop, natural light"},
        "7": {"text": "blurry, low quality, text, watermark, logo"},
        "5": {"width": 1024, "height": 1024}
    }
)
print(f"Generated {len(image_urls)} images: {image_urls}")
```

### Uploading Results to Supabase Storage

```python
import requests
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def upload_generated_image_to_supabase(
    comfy_image_url: str,
    asin: str,
    image_type: str,  # 'lifestyle', 'infographic', 'hero'
    index: int = 0
) -> str:
    """Download image from ComfyUI and upload to Supabase Storage."""
    
    # Download from ComfyUI
    image_data = requests.get(comfy_image_url).content
    
    # Upload to Supabase Storage
    storage_path = f"generated/{asin}/{image_type}_{index}.png"
    
    supabase.storage.from_("product-images").upload(
        path=storage_path,
        file=image_data,
        file_options={"content-type": "image/png", "upsert": "true"}
    )
    
    # Get public URL
    public_url = supabase.storage.from_("product-images").get_public_url(storage_path)
    
    # Update the database record
    supabase.table("asin_images").upsert({
        "asin": asin,
        "image_type": image_type,
        "image_index": index,
        "storage_path": storage_path,
        "public_url": public_url,
        "generated_at": "now()"
    }).execute()
    
    return public_url
```

---

## 11. Fine-Tuning Basics — When to Bother

### The Honest Answer: Rarely

Fine-tuning is frequently oversold. In most Amazon brand workflows, good prompt engineering with a strong base model outperforms a poorly fine-tuned model — and prompt engineering takes hours while fine-tuning takes days and significant compute.

**Fine-tune only when:**

1. You have **1,000+ high-quality training examples** of the exact task (fewer than this and you're just teaching the model noise)
2. The task is **stable and won't change** — a fine-tuned model is locked to its training distribution; if your style guide changes, you retrain
3. The base model with prompt engineering consistently fails despite multiple prompt iterations
4. You need to **reduce inference latency** — a fine-tuned 7B can outperform a prompted 70B on specific tasks

**Don't fine-tune when:**

- You have < 500 examples
- You just want to add a system prompt (use Ollama Modelfiles or a system prompt instead)
- You're trying to teach the model new facts (use RAG instead)
- You want product/brand-specific image style (use LoRA for images, or IP-Adapter — not fine-tuning the base LLM)

### LoRA for Image Style Consistency

For Amazon product imagery, LoRA training is much more applicable than LLM fine-tuning. A LoRA trained on 15–30 photos of your product teaches the image model to generate that specific product consistently.

**When to use LoRA:**
- You need the model to generate your specific physical product
- You want consistent brand aesthetic across all generated images
- You have 15–50 clean reference photos of the product

**Training a product LoRA (overview):**
```bash
# Use kohya_ss (most common LoRA training toolkit)
# https://github.com/kohya-ss/sd-scripts

# 1. Prepare 15-30 product photos (clean white background, multiple angles)
# 2. Caption each image describing the product
# 3. Run training:

python train_network.py \
    --pretrained_model_name_or_path="flux1-dev.safetensors" \
    --dataset_config="product_dataset.toml" \
    --output_dir="./loras" \
    --output_name="my_product_lora" \
    --network_module=networks.lora \
    --network_dim=16 \
    --network_alpha=8 \
    --learning_rate=0.0001 \
    --max_train_steps=1000 \
    --mixed_precision="bf16"
```

**Using the LoRA in ComfyUI:**  
Add a `LoraLoader` node connected to your model, set the LoRA weight to 0.7–0.9, and reference your product in the prompt using the trigger word you trained with (e.g., `bamboo_board_v1`).

### LLM Fine-Tuning (When Truly Warranted)

If you've decided fine-tuning is justified:

```bash
# Use Unsloth — 2x faster fine-tuning, 60% less VRAM
pip install unsloth

# Example: fine-tuning LLaMA 3.1 8B for Amazon bullet writing
from unsloth import FastLanguageModel

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/Meta-Llama-3.1-8B",
    max_seq_length=2048,
    dtype=None,
    load_in_4bit=True  # QLoRA
)

model = FastLanguageModel.get_peft_model(
    model,
    r=16,           # LoRA rank
    target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    lora_alpha=16,
    lora_dropout=0,
    bias="none"
)
```

Training data format (JSONL):
```json
{"instruction": "Write 5 Amazon bullet points for: ...", "output": "• SUPERIOR GRIP: ..."}
{"instruction": "Write 5 Amazon bullet points for: ...", "output": "• LEAK-PROOF LID: ..."}
```

---

## 12. Cost Analysis — Hardware Amortisation vs API Pricing

### Worked Example: 10,000 Images/Month

**Scenario:** Amazon brand generating lifestyle images for a 500-ASIN catalogue + ongoing new ASINs. Target: 10,000 images per month (Flux.1 Dev quality tier).

**Cloud cost (FAL.ai Flux.1 Dev at $0.025/image):**
- Monthly: 10,000 × $0.025 = **$250/month**
- Annual: **$3,000/year**

**Local GPU cost (RTX 4090 setup):**

| Item | Cost | Amortisation |
|---|---|---|
| RTX 4090 GPU | $1,800 | 3-year life = $50/month |
| PC build (CPU, RAM, PSU, case) | $1,200 | 4-year life = $25/month |
| Electricity (300W avg × 8h/night × 30 days) | 72 kWh × $0.15 = $11 | $11/month |
| **Total local cost** | | **$86/month** |

**Break-even:** Month 7–8 (hardware pays for itself in 7–8 months)  
**5-year savings:** ($250 - $86) × 60 months = **$9,840 saved** vs cloud API

**At 50,000 images/month (agency scale):**
- Cloud: $1,250/month
- Local (same hardware, more overnight hours): ~$90/month  
- Break-even: Month **2–3**
- 5-year savings: **$69,000**

### Performance Reality Check

An RTX 4090 running Flux.1 Dev (Q5 quantised) generates approximately:
- 15 seconds per image = 4 images/minute
- 240 images/hour
- 8-hour overnight window = **~1,900 images/night**
- 30 nights/month = **~57,000 images/month capacity**

So a single 4090 can handle up to ~57,000 images/month at overnight batch rates.

### LLM Cost Comparison (50,000 Calls/Month)

| Method | Cost | Notes |
|---|---|---|
| OpenAI GPT-4o mini | ~$3/1M tokens → ~$30/month | Fastest, easiest |
| Together AI LLaMA 3.1 70B | ~$0.88/1M tokens → ~$8.80/month | Cloud, near-local quality |
| Local Ollama LLaMA 3.1 8B | ~$2/month (electricity only) | Best quality-per-dollar if hardware already present |
| Local Ollama LLaMA 3.1 70B Q4 | ~$4/month (electricity, more power draw) | Higher quality, slower |

**For LLM workloads specifically,** the cost savings vs cloud are much smaller than image generation — because LLM API costs are already low (especially GPT-4o mini). Local LLMs make economic sense for LLMs primarily when combined with the image generation use case (hardware already paid for, marginal cost of LLM is just electricity).

### True Break-Even Calculator

```
Monthly API spend to justify local hardware:

Hardware_cost / Break_even_months + electricity = local_monthly_cost
Break-even when: local_monthly_cost < API_monthly_cost

For $3,000 hardware over 36 months: $83/month fixed + electricity
→ Break-even requires >$100/month in API spend being replaced
→ ~4,000+ images/month at FAL Flux Dev pricing ($0.025)
→ OR 200K+ LLM calls/month at GPT-4o mini pricing
```

---

## 13. Docker Setup — Reproducible Local Stack

Running everything in Docker ensures reproducible environments and easy machine migration. The key challenge is GPU passthrough.

### Prerequisites

```bash
# NVIDIA Container Toolkit (required for GPU access in Docker)
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/libnvidia-container/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/libnvidia-container/$distribution/libnvidia-container.list | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker

# Verify GPU access in Docker
docker run --rm --gpus all nvidia/cuda:12.3.0-base-ubuntu22.04 nvidia-smi
```

### docker-compose.yml — Full Local AI Stack

```yaml
version: '3.8'

services:
  # === OLLAMA — Local LLM Server ===
  ollama:
    image: ollama/ollama:latest
    container_name: syncflow-ollama
    restart: unless-stopped
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama  # persist downloaded models
    environment:
      - OLLAMA_KEEP_ALIVE=30m
      - OLLAMA_HOST=0.0.0.0
      - OLLAMA_FLASH_ATTENTION=1
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  # === COMFYUI — Local Image Generation ===
  comfyui:
    image: ghcr.io/ai-dock/comfyui:latest-cuda
    container_name: syncflow-comfyui
    restart: unless-stopped
    ports:
      - "8188:8188"
    volumes:
      - comfyui_models:/opt/ComfyUI/models      # persist model weights
      - comfyui_output:/opt/ComfyUI/output       # generated images
      - comfyui_input:/opt/ComfyUI/input         # input images
      - comfyui_custom:/opt/ComfyUI/custom_nodes  # custom node packs
      - ./workflows:/opt/ComfyUI/workflows        # your workflow JSON files
    environment:
      - JUPYTER_DISABLE=true
      - CF_QUICK_TUNNELS=false
    command: >
      python main.py 
        --listen 0.0.0.0 
        --port 8188 
        --disable-auto-launch
        --no-preview
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    depends_on:
      ollama:
        condition: service_healthy

  # === N8N — Local Workflow Orchestration ===
  n8n:
    image: n8nio/n8n:latest
    container_name: syncflow-n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/  # update with your domain/tunnel
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=${N8N_ADMIN_PASSWORD}  # set in .env file
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=your-supabase-host.supabase.co
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=postgres
      - DB_POSTGRESDB_USER=postgres
      - DB_POSTGRESDB_PASSWORD=${SUPABASE_DB_PASSWORD}
    depends_on:
      ollama:
        condition: service_healthy

  # === OLLAMA MODEL PULLER — runs once on startup ===
  ollama-init:
    image: ollama/ollama:latest
    container_name: syncflow-ollama-init
    depends_on:
      ollama:
        condition: service_healthy
    volumes:
      - ollama_models:/root/.ollama
    entrypoint: /bin/sh
    command: >
      -c "
        ollama pull llama3.1:8b &&
        ollama pull nomic-embed-text &&
        ollama pull qwen2.5:7b &&
        echo 'All models pulled successfully'
      "
    environment:
      - OLLAMA_HOST=ollama:11434
    restart: "no"  # run once only

volumes:
  ollama_models:
    driver: local
  comfyui_models:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /data/comfyui/models  # point to a drive with space for model weights
  comfyui_output:
    driver: local
  comfyui_input:
    driver: local
  comfyui_custom:
    driver: local
  n8n_data:
    driver: local
```

**.env file (keep out of git):**
```bash
N8N_ADMIN_PASSWORD=your-secure-password-here
SUPABASE_DB_PASSWORD=your-supabase-db-password
```

### Starting and Managing the Stack

```bash
# Start everything
docker compose up -d

# View logs
docker compose logs -f ollama
docker compose logs -f comfyui

# Check resource usage
docker stats

# Restart a single service
docker compose restart ollama

# Stop everything (preserves volumes/data)
docker compose down

# Full reset (removes all model data — careful!)
docker compose down -v
```

### Volume Strategy for Model Weights

Model weights are large (8–24+ GB each). Use a dedicated storage strategy:

```bash
# Point comfyui_models volume to a large drive (not your OS drive)
# Add to docker-compose.yml under comfyui_models volume:
driver_opts:
  type: none
  o: bind
  device: /mnt/storage/comfyui-models  # your large drive mount point
```

For Ollama models (stored in `/root/.ollama/models`):
```bash
# Check total model storage used
du -sh ~/.ollama/models/
# or inside Docker:
docker exec syncflow-ollama du -sh /root/.ollama/models/
```

---

## 14. Monitoring Overnight Jobs — What Breaks & How to Know

### What Breaks (in order of frequency)

**1. VRAM Out-of-Memory (most common)**
- Symptom: ComfyUI or Ollama crashes mid-job; job stays `processing` forever
- Cause: Loading a model that's too large, memory leak over many generations, concurrent model loads
- Detection: Check `nvidia-smi` output; look for process exit in logs

**2. Model Load Failure**
- Symptom: "model not found" or "safetensors load error" in ComfyUI output
- Cause: Corrupted download, wrong filename in workflow, model not in the expected directory

**3. Hung/Zombie Process**
- Symptom: GPU shows 100% utilisation but no output for 30+ minutes
- Cause: Deadlock in ComfyUI node execution, WebSocket connection dropped, infinite loop in custom node

**4. Ollama Context Window Overflow**
- Symptom: Error `context length exceeded` or truncated output
- Cause: Sending too much text to the model (long review concatenations, etc.)
- Fix: Chunk your input; set `num_ctx` parameter appropriately

**5. Docker Container OOM (RAM, not VRAM)**
- Symptom: Container killed by Docker; `exit code 137`
- Cause: n8n or Python worker accumulating memory over a long batch run
- Fix: Set memory limits in docker-compose, restart containers nightly

**6. Disk Full**
- Symptom: ComfyUI stops saving images; write errors in logs
- Cause: Output directory fills up if you don't clean up generated images

**7. Network Errors to Supabase**
- Symptom: Job claims succeed but result writes fail; jobs stuck in `processing`
- Cause: Temporary Supabase network issue, SSL certificate problem

### Monitoring Architecture

**n8n error handling pattern:**
```
For each job in the batch loop:
  Try:
    → Run AI inference
    → Write result to Supabase
    → Update status = 'done'
  Catch (any error):
    → Update status = 'pending', increment attempts
    → IF attempts >= 3: Update status = 'failed', send alert
    → Continue to next job (don't fail the whole batch)
```

**Watchdog script (run as a cron job every 15 minutes):**
```python
import subprocess
import time
import requests
from datetime import datetime, timedelta

SLACK_WEBHOOK = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
COMFYUI_URL = "http://localhost:8188"
OLLAMA_URL = "http://localhost:11434"

def check_comfyui_health() -> bool:
    try:
        response = requests.get(f"{COMFYUI_URL}/system_stats", timeout=10)
        return response.status_code == 200
    except:
        return False

def check_ollama_health() -> bool:
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=10)
        return response.status_code == 200
    except:
        return False

def check_gpu_memory():
    """Returns (used_mb, total_mb) or None if nvidia-smi fails."""
    try:
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.used,memory.total", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10
        )
        used, total = result.stdout.strip().split(", ")
        return int(used), int(total)
    except:
        return None

def check_stuck_jobs(supabase_client) -> list[dict]:
    """Find jobs stuck in 'processing' for more than 30 minutes."""
    cutoff = (datetime.utcnow() - timedelta(minutes=30)).isoformat()
    result = supabase_client.table("ai_batch_jobs")\
        .select("id, job_type, started_at, asin")\
        .eq("status", "processing")\
        .lt("started_at", cutoff)\
        .execute()
    return result.data

def send_slack_alert(message: str):
    requests.post(SLACK_WEBHOOK, json={"text": f"🚨 syncflow batch alert: {message}"})

def restart_service(service_name: str):
    """Restart a Docker service."""
    subprocess.run(["docker", "compose", "restart", service_name], 
                   cwd="/path/to/your/docker-compose", timeout=60)

# Main watchdog logic
if not check_comfyui_health():
    send_slack_alert("ComfyUI is not responding — restarting")
    restart_service("comfyui")

if not check_ollama_health():
    send_slack_alert("Ollama is not responding — restarting")
    restart_service("ollama")

gpu_mem = check_gpu_memory()
if gpu_mem:
    used, total = gpu_mem
    usage_pct = (used / total) * 100
    if usage_pct > 95:
        send_slack_alert(f"GPU memory critical: {used}MB / {total}MB ({usage_pct:.0f}%)")

# Check for stuck jobs (requires supabase client setup)
# stuck = check_stuck_jobs(supabase)
# if stuck:
#     send_slack_alert(f"{len(stuck)} jobs stuck in processing: {[j['asin'] for j in stuck]}")
```

**Crontab entry:**
```bash
# Run watchdog every 15 minutes
*/15 * * * * /usr/bin/python3 /opt/syncflow/watchdog.py >> /var/log/syncflow-watchdog.log 2>&1
```

### n8n Error Webhook Pattern

In n8n, connect the Error Trigger node to catch any unhandled workflow failures:

```
Error Trigger
  │
  ▼
Set node (format message):
  message: "Workflow '{{$json.workflow.name}}' failed at node '{{$json.execution.lastNode}}'. Error: {{$json.error.message}}"
  │
  ▼
HTTP Request → POST your Slack webhook
  body: {"text": "{{$json.message}}"}
  │
  ▼
Supabase: Log the failure
  INSERT INTO workflow_error_log (workflow_name, error, timestamp)
```

### Log Rotation

Ollama and ComfyUI generate significant log output on overnight runs:

```bash
# /etc/logrotate.d/syncflow
/var/log/syncflow-*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

### Automated Daily Cleanup

```bash
#!/bin/bash
# /opt/syncflow/cleanup.sh — run at 7 AM after overnight batch completes

# Clean ComfyUI output older than 3 days (images uploaded to Supabase already)
find /path/to/ComfyUI/output -name "*.png" -mtime +3 -delete

# Clean Ollama model cache if VRAM is needed (optional)
# ollama rm old-model:tag

# Log disk usage
df -h /data/comfyui/models >> /var/log/syncflow-disk.log

echo "Cleanup complete: $(date)"
```

---

## 15. Dos & Don'ts

### ✅ DOs — Practitioner-Level

**DO amortise hardware over 36 months, not 12.** GPUs last longer than people assume. A well-maintained RTX 4090 will run inference reliably for 4+ years. Use 36-month amortisation in your ROI calculations or you'll dramatically overstate the true cost.

**DO use Ollama's `OLLAMA_KEEP_ALIVE` setting strategically.** Set it to `30m` during overnight batch runs and `5m` during the day. A model sitting hot in VRAM is fast for the next call; a cold model load adds 20–60 seconds per request. Match your keep-alive to your actual call pattern.

**DO use Q4_K_M or Q5_K_M quantisation for production LLM inference, not Q2 or Q3.** Q2/Q3 cuts VRAM further but noticeably degrades output quality for structured tasks like bullet point writing. Q4_K_M is the sweet spot — ~90% of FP16 quality at ~50% the VRAM.

**DO test your entire overnight pipeline on a 10-job sample before scheduling it to run at 2 AM.** Run it manually at your desk first. Watch the logs. Confirm jobs complete, results write to Supabase, and status updates correctly. The worst thing is waking up to 500 failed jobs you can't debug until business hours.

**DO use `FOR UPDATE SKIP LOCKED` in your Supabase job queue queries.** This is what prevents two n8n executions (or two cron runs) from claiming the same job simultaneously. It's a PostgreSQL-native pattern designed exactly for job queue workloads.

**DO keep your ComfyUI workflows as JSON files in version control.** A workflow is code. When you change your product scene style or add a LoRA, commit the updated workflow JSON. You need to be able to reproduce yesterday's image batch in three months.

**DO monitor GPU memory with `nvidia-smi dmon -s u -d 5`** during the first few overnight runs. This streams GPU memory and utilisation every 5 seconds. Watch for the memory spike pattern — if you're within 1 GB of the limit, you'll OOM eventually.

**DO set `max_attempts = 3` in your job queue**, not infinite retry. A job failing 3 times in a row means something is structurally wrong (bad input data, wrong model, resource issue) — not a transient error. Alert on it and investigate rather than letting it loop forever.

**DO use Qwen2.5 for all non-English marketplace tasks.** LLaMA 3.1 is English-dominant. On German, French, Italian, and especially Japanese/Korean/Chinese marketplace content, Qwen2.5 produces noticeably higher quality output at the same parameter count. This is not a minor difference — it's significant enough to affect listing quality.

**DO run your AI machine's OS on a separate SSD from your model weights.** Put your OS on a 500 GB NVMe, and your models on a 2–4 TB storage drive. Models are large (8–24 GB each), and you'll accumulate many of them. Mixing OS and model storage causes I/O contention and fills up your boot drive.

**DO schedule overnight batch jobs to start at 11 PM and have a hard stop at 6 AM.** Don't let jobs run into business hours when the machine might be needed for other work. Build a time-limit into your scheduler; a job that exceeds the window should be paused and resumed the next night.

**DO test your Ollama endpoint with `curl` before blaming n8n.** When an HTTP Request node fails, rule out the AI stack first: `curl -s http://localhost:11434/api/tags | jq .` — if that fails, the problem is Ollama, not n8n.

**DO clean up ComfyUI output images once they're uploaded to Supabase Storage.** Generated images at 1024×1024 PNG are ~2–5 MB each. 10,000 images = 20–50 GB. If you don't clean up, you'll fill your local disk in a few days of batch runs.

### ❌ DON'Ts — Practitioner-Level

**DON'T use the same GPU simultaneously for image generation and large LLM inference.** Running Flux.1 Dev (12–24 GB VRAM) and LLaMA 3.1 70B Q4 (40 GB VRAM) on the same 24 GB card is physically impossible. But even sequencing them too quickly — loading one model before the other fully unloads — causes OOM crashes. Put a 30-second gap between model switches or, better, run them in separate overnight windows.

**DON'T skip error handling in your n8n batch loops.** An unhandled error in one loop iteration stops the entire loop. For a 500-ASIN batch, one bad ASIN will kill the other 499 jobs. Always wrap your HTTP calls in error handling nodes and mark failed jobs individually rather than crashing the whole run.

**DON'T assume Ollama automatically handles concurrency safely.** Ollama's default `OLLAMA_NUM_PARALLEL=1` means it queues requests. If you fire 50 async requests simultaneously without a semaphore in your Python code, they'll queue in Ollama — fine. But if you're also loading multiple models (OLLAMA_MAX_LOADED_MODELS=3), VRAM can be exhausted by model loading alone. Know your VRAM budget before enabling parallel model loading.

**DON'T run fine-tuning on your production inference machine during business hours.** Fine-tuning training consumes all available GPU resources and takes hours. Schedule it only during overnight maintenance windows when no inference jobs are running.

**DON'T use the default ComfyUI `random seed` without logging which seed generated which image.** If you generate 1,000 product images and need to regenerate one specific image later (for a variation), you need the seed. Log the seed value alongside each Supabase storage record.

**DON'T put your model weights inside a Docker volume that will be removed on `docker compose down -v`.** Use bind mounts (`type: none, o: bind`) for your model directories so they persist outside Docker's volume management. Accidentally running `docker compose down -v` should not mean re-downloading 200 GB of models.

**DON'T use localhost URLs in n8n nodes when ComfyUI/Ollama run in Docker.** Inside Docker, `localhost` resolves to the container itself, not the host machine. Use the service name (`http://ollama:11434` or `http://comfyui:8188`) when calling between containers, or use the host machine's actual IP when calling from outside Docker.

**DON'T translate multi-marketplace listings using GPT-4o API via OpenAI for cost-sensitive overnight batches.** If you're translating 1,000 listings into 5 languages = 5,000 calls. At GPT-4o pricing, this gets expensive quickly. Local Qwen2.5 72B Q4 produces comparable or better multilingual output at electricity-only cost.

**DON'T neglect `num_ctx` (context window) configuration in Ollama.** By default, Ollama uses a conservative context window (2048 tokens for many models). For tasks like review summarisation where you concatenate multiple reviews, you need a larger context. Set it in your Modelfile: `PARAMETER num_ctx 8192`. Exceeding the context window silently truncates your input.

**DON'T build a local stack and then not monitor it.** A crashed Ollama process at 2 AM will leave 499 jobs stuck in `processing` status permanently — they'll never be retried because the status was already claimed. The watchdog script and stuck-job detection query in Section 14 are not optional for production overnight pipelines. Build them before you depend on the system.

**DON'T forget to set `--no-preview` on ComfyUI for headless server operation.** Without this flag, ComfyUI tries to send live preview frames to the browser — wasting GPU compute generating preview images that no one is watching. On an overnight batch, this meaningfully reduces throughput.

---

## Quick Reference Cheat Sheet

### Essential Commands

```bash
# Ollama
ollama list                          # list downloaded models
ollama ps                            # show loaded models + VRAM usage
ollama pull llama3.1:8b              # download a model
ollama rm model:tag                  # delete a model
curl http://localhost:11434/api/tags  # API health check

# ComfyUI
python main.py --listen --port 8188 --no-preview  # start headless
# Web UI at: http://localhost:8188

# GPU monitoring
nvidia-smi                                    # snapshot
nvidia-smi dmon -s u -d 5                    # live stream every 5s
nvidia-smi --query-gpu=memory.used,memory.total --format=csv  # memory only

# Docker
docker compose up -d                 # start stack
docker compose logs -f ollama        # tail Ollama logs
docker stats                         # live resource usage
docker compose restart comfyui       # restart one service
```

### VRAM Quick Reference

| Action | VRAM used |
|---|---|
| Load LLaMA 3.1 8B (FP16) | ~16 GB |
| Load LLaMA 3.1 8B (Q4_K_M) | ~5 GB |
| Load LLaMA 3.1 70B (Q4_K_M) | ~40 GB |
| Load nomic-embed-text | ~1 GB |
| Load SDXL | ~6.5 GB |
| Load Flux.1 Dev (full) | ~24 GB |
| Load Flux.1 Dev (Q5 GGUF) | ~12 GB |
| KV cache per active session (8B model, 4K context) | ~2 GB extra |

### Default Ports

| Service | Port | URL |
|---|---|---|
| Ollama API | 11434 | `http://localhost:11434` |
| Ollama OpenAI-compat | 11434 | `http://localhost:11434/v1` |
| ComfyUI web | 8188 | `http://localhost:8188` |
| ComfyUI API | 8188 | `http://localhost:8188/prompt` |
| n8n (local) | 5678 | `http://localhost:5678` |
| LM Studio | 1234 | `http://localhost:1234/v1` |

### Model Recommendation Summary

| Task | Model | Why |
|---|---|---|
| Bullet point rewriting | `llama3.1:8b` | Fast enough, sufficient quality |
| Complex copywriting | `llama3.1:70b` (Q4) | Justifies overnight time |
| Translation (all markets) | `qwen2.5:7b` | Multilingual superpower |
| Classification / tagging | `phi4:14b` or `llama3.2:3b` | Tiny + fast |
| Review summarisation | `llama3.2:3b` | More than sufficient quality |
| Embeddings (fast) | `nomic-embed-text` | 768-dim, balanced |
| Embeddings (quality) | `mxbai-embed-large` | 1024-dim, better clusters |
| Image generation | Flux.1 Dev (Q5 GGUF) | Best local quality/VRAM |
| Fast draft images | Flux.1 Schnell (Q5) | 3–5 sec/image |

---

*Companion to: `image-generation-apis.md` (cloud image APIs), `supabase.md` (pgvector & job queue schema), `n8n-skill-research.md` (n8n workflow patterns). Last researched: May 2026.*
