# n8n Skill Research
**Focus:** Nodes, Connections, Claude Integration, Workflow Patterns, Validations, Dos & Don'ts  
**Last Updated:** May 2026

---

## Table of Contents
1. [What is n8n?](#what-is-n8n)
2. [Core Architecture & Data Model](#core-architecture--data-model)
3. [Node Categories](#node-categories)
4. [Core Nodes Reference](#core-nodes-reference)
5. [Trigger Nodes Reference](#trigger-nodes-reference)
6. [AI / LangChain Cluster Nodes](#ai--langchain-cluster-nodes)
7. [Connection Types](#connection-types)
8. [Expressions & Data Transformation](#expressions--data-transformation)
9. [Claude (Anthropic) Integration](#claude-anthropic-integration)
10. [Proper Claude → n8n Workflow Patterns](#proper-claude--n8n-workflow-patterns)
11. [Memory Management](#memory-management)
12. [Error Handling & Validations](#error-handling--validations)
13. [Performance & Cost Optimization](#performance--cost-optimization)
14. [Dos and Don'ts](#dos-and-donts)
15. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)

---

## What is n8n?

n8n is an open-source, self-hostable workflow automation platform with a visual canvas. Unlike Zapier/Make, it supports code (JavaScript/Python) inside nodes, complex branching, and a first-class LangChain-based AI agent system. As of 2025, the ecosystem has **1,650+ nodes** (820 core + 830 community).

**Key differentiator:** n8n charges per workflow execution, not per step — so a complex workflow with 50 nodes costs the same as a 3-node one. Critical for AI workflows with many LLM calls.

---

## Core Architecture & Data Model

Every n8n workflow passes **arrays of items** between nodes. Each item is a JSON object:

```json
[
  { "json": { "name": "Dorian", "email": "you@yourbrand.com" } },
  { "json": { "name": "Alice", "email": "alice@example.com" } }
]
```

**Key principles:**
- Nodes receive an array of items and output an array of items
- By default, most nodes run **once per item** (looping implicitly)
- The Code node can switch between "Run Once for All Items" or "Run Once for Each Item"
- Binary data (files, images) lives in `item.binary`, not `item.json`

---

## Node Categories

| Category | Description | Examples |
|---|---|---|
| **Core Nodes** | Logic, flow control, generic APIs | IF, Switch, Merge, HTTP Request, Code, Set, Wait |
| **Trigger Nodes** | Start a workflow | Webhook, Schedule, Chat Trigger, App Event Triggers |
| **App Nodes** | Connect to external services | Slack, Gmail, Notion, Airtable, Google Sheets |
| **Cluster/AI Nodes** | LangChain-based AI orchestration | AI Agent, Basic LLM Chain, Chat Model, Memory, Tools |
| **Sub-nodes** | Connect to AI parent nodes only | Anthropic Chat Model, Window Buffer Memory, Tool nodes |

---

## Core Nodes Reference

### Flow Control

**IF Node**
- Routes items into two branches: `true` and `false`
- Supports conditions: equals, contains, regex, greater than, empty, exists
- ⚠️ If you attach a Merge node downstream, both branches may execute — design carefully
- Upgrade to **Switch** if you need more than 2 outputs

**Switch Node**
- Multiple conditional branches (not limited to 2)
- Use when you have 3+ routing conditions
- Each branch has its own output connector

**Merge Node**
- Combines data streams back into one
- Modes: `Combine`, `Append`, `Multiplex`, `Choose Branch`, `SQL Query`
- Waits for **all connected inputs** before firing — can cause deadlocks if one branch never produces output
- Use "Wait" mode carefully in async patterns

**Loop Over Items (Split In Batches)**
- Splits large arrays into smaller batches
- Useful for APIs with rate limits
- Configure batch size based on downstream service limits

### Data Manipulation

**Edit Fields (Set) Node**
- Add, update, or remove fields on items
- Supports expressions for dynamic values
- Can strip all existing fields and set only what you need (clean slate mode)

**Code Node**
- Run JavaScript or Python
- Two run modes: "Run Once for All Items" (accesses `$input.all()`) vs "Run Once for Each Item" (accesses `$input.item`)
- Has access to all n8n variables: `$json`, `$input`, `$node`, `$workflow`, `$env`
- ⚠️ No `require()` for external modules — only built-in JS methods and n8n helpers

**Item Lists Node**
- Split, aggregate, sort, remove duplicates, limit items
- Replaces many custom Code node patterns — use it first

**Remove Duplicates Node**
- Deduplicates items by field value
- Supports cross-execution dedup (remembers previously seen values)

### HTTP & APIs

**HTTP Request Node**
- The universal REST API node
- Supports GET/POST/PUT/PATCH/DELETE
- Authentication: Bearer Token, Basic Auth, OAuth2, Header Auth, API Key
- Pagination modes: Offset, Cursor, Link Header (auto-handles multi-page APIs)
- ⚠️ Always set a timeout — default is no timeout, which can hang workflows

**GraphQL Node**
- Dedicated GraphQL query execution
- Alternative to HTTP Request for GraphQL APIs

### Utilities

**Wait Node**
- Pauses execution for a set time or until a webhook resumes it
- Use for polling patterns, human-in-the-loop approval, or timed delays

**Respond to Webhook Node**
- Sends a response back to the original webhook caller
- Must be used when your webhook trigger needs to return data synchronously

**Execute Workflow Node (Sub-workflow)**
- Call another n8n workflow and receive its output
- Critical pattern for modular architecture
- Supports "Wait for Sub-workflow Completion" mode

**Sticky Notes**
- Not a processing node — adds comments to the canvas
- Use liberally to document complex sections

---

## Trigger Nodes Reference

### Manual Trigger
- Click-to-run, development/testing only
- Never use in production workflows

### Webhook Trigger
- Creates an HTTP endpoint that activates the workflow
- Supports GET, POST, PUT, PATCH, DELETE
- Authentication: Header Auth, Basic Auth, JWT, or none
- Two webhook modes:
  - **Test:** Single execution, shows live data in UI
  - **Production:** Always active, runs headlessly
- ⚠️ Respond immediately with "Respond to Webhook" node — don't leave callers hanging

### Schedule Trigger (Cron)
- Preset intervals: every N minutes/hours, daily, weekly, monthly
- Custom Cron expression format: `Minute Hour DayOfMonth Month DayOfWeek`
- Example: `0 9 * * 1` = every Monday at 9 AM
- ⚠️ Timezone matters — configure explicitly, don't rely on server default

### Chat Trigger
- Provides a built-in chat UI for testing AI agents
- Used with AI Agent node for conversational workflows
- Automatically handles session IDs for memory

### App Event Triggers (Examples)
- Slack: new message, new channel, reaction added
- Gmail: new email, new thread
- Notion: page created/updated
- GitHub: push, PR opened, issue created
- Airtable: record created/updated
- HubSpot: deal stage change, contact created
- Each app trigger uses webhooks or polling depending on the app's API

---

## AI / LangChain Cluster Nodes

These are the "AI" nodes in n8n — built on LangChain and designed to work together in a specific hierarchy.

### Root Nodes (Agents & Chains)

**AI Agent (Tools Agent)**
- The main orchestration node for agentic workflows
- Autonomously decides which tools to call based on the user message
- Sub-connections: Language Model (required), Memory (optional), Tools (optional, multiple)
- ⚠️ Must have at least one Language Model sub-node connected — it won't run without one

**Basic LLM Chain**
- Simple prompt-in → response-out
- No tool use, no memory — just a single LLM call
- Best for: classification, extraction, summarization, formatting
- Sub-connections: Language Model (required), Output Parser (optional), Memory (optional)

**Summarization Chain**
- Handles documents too long for a single LLM context window
- Modes: Stuff (single call), Map-Reduce (batch then summarize), Refine (iterative)

**Question and Answer Chain**
- Retrieval-Augmented Generation (RAG) — retrieves context from a vector store then answers
- Sub-connections: Language Model, Retriever (from a vector store node)

### Sub-Nodes: Language Models

| Node | Provider | Best For |
|---|---|---|
| Anthropic Chat Model | Anthropic | Claude integration (main focus) |
| OpenAI Chat Model | OpenAI | GPT models |
| Azure OpenAI Chat Model | Azure | Enterprise GPT |
| Google Gemini Chat Model | Google | Gemini models |
| Ollama Chat Model | Local | Self-hosted LLMs |
| Groq Chat Model | Groq | Fast inference |

### Sub-Nodes: Memory

| Node | Persistence | TTL | Best For |
|---|---|---|---|
| Window Buffer Memory | Session only | Cleared on restart | Dev/testing |
| Postgres Chat Memory | Permanent | Manual delete | Long-term user history |
| Redis Chat Memory | Configurable TTL | Auto-expires | Session context with cleanup |
| MongoDB Chat Memory | Permanent | Manual delete | Document-based apps |
| Motorhead Memory | Configurable | Via Motorhead server | Advanced session mgmt |

### Sub-Nodes: Tools

| Tool | Function |
|---|---|
| Calculator | Math operations |
| Code Tool | Run custom JS/Python logic |
| HTTP Request Tool | Call any REST API |
| Workflow Tool | Call another n8n workflow as a tool |
| Wikipedia Tool | Retrieve Wikipedia articles |
| SerpAPI Tool | Web search |
| Vector Store Retriever | Search a vector database |

### Sub-Nodes: Vector Stores & Embeddings

| Node | Type |
|---|---|
| Simple Vector Store | In-memory (dev only) |
| Pinecone Vector Store | Pinecone cloud |
| Supabase Vector Store | Postgres + pgvector |
| Qdrant Vector Store | Qdrant |
| OpenAI Embeddings | Text embeddings |
| Cohere Embeddings | Text embeddings |

---

## Connection Types

n8n uses **typed connections** for AI nodes — this is different from regular node connections and enforces valid component wiring.

| Connection Type | Color/Icon | What Connects |
|---|---|---|
| `main` | Gray | Regular data flow between all standard nodes |
| `ai_languageModel` | Purple | Language Model sub-node → AI Agent or Chain |
| `ai_memory` | Green | Memory sub-node → AI Agent or Chain |
| `ai_tool` | Orange | Tool sub-node → AI Agent |
| `ai_retriever` | Blue | Vector Store Retriever → QA Chain |
| `ai_embedding` | Yellow | Embedding sub-node → Vector Store |
| `ai_document` | Teal | Document Loader → Vector Store |
| `ai_textSplitter` | Pink | Text Splitter → Document Loader |

**Rules:**
- You **cannot** connect a Memory node where a Language Model is expected — types are enforced
- The AI Agent node has **separate input connectors** for model, memory, and each tool
- Sub-nodes do **not** appear in the main execution flow — they attach below the parent node

---

## Expressions & Data Transformation

n8n expressions use double curly brace syntax: `{{ expression }}`

### Core Variables

```javascript
// Current item's JSON data (most commonly used)
{{ $json.fieldName }}
{{ $json['field with spaces'] }}

// Equivalent longhand
{{ $input.item.json.fieldName }}

// Access a specific previous node by name
{{ $('Node Name').first().json.fieldName }}
{{ $('Node Name').last().json.fieldName }}
{{ $('Node Name').all() }}            // array of all items

// Access all items from current input
{{ $input.all() }}
{{ $input.first().json.fieldName }}

// Workflow metadata
{{ $workflow.id }}
{{ $workflow.name }}

// Execution metadata
{{ $execution.id }}
{{ $execution.resumeUrl }}            // use with Wait node

// Environment variables
{{ $env.MY_VAR }}

// Current date/time (Luxon)
{{ $now }}
{{ $today }}
{{ DateTime.now().toISO() }}
{{ DateTime.now().minus({ days: 7 }).toFormat('yyyy-MM-dd') }}
```

### Common Patterns

```javascript
// Null-safe field access
{{ $json.user?.email ?? 'no-email' }}

// String manipulation
{{ $json.name.toLowerCase() }}
{{ $json.text.split(',').join('\n') }}

// Array operations
{{ $json.items.length }}
{{ $json.tags.includes('vip') }}

// Conditional expression
{{ $json.status === 'active' ? 'Yes' : 'No' }}

// JMESPath queries
{{ $json.users[?age > `30`].name }}
```

### In Code Nodes (JavaScript)

```javascript
// Run Once for All Items mode
const items = $input.all();
return items.map(item => ({
  json: {
    ...item.json,
    processed: true,
    fullName: `${item.json.firstName} ${item.json.lastName}`
  }
}));

// Access other nodes
const webhookData = $('Webhook').first().json;
```

---

## Claude (Anthropic) Integration

### Setup

1. Get API key from [console.anthropic.com](https://console.anthropic.com) → API Keys → Create Key
2. In n8n: **Credentials** → Create new → **Anthropic API**
3. Paste API key, save

### Two Ways to Use Claude in n8n

**Option 1: Anthropic Chat Model Sub-node (recommended for AI Agents)**
- Node type: `Anthropic Chat Model`
- Connects to: AI Agent, Basic LLM Chain, Summarization Chain, QA Chain
- This is the primary integration — Claude acts as the "brain" of the agent
- Supports all Claude models: `claude-opus-4-5`, `claude-sonnet-4-5`, `claude-haiku-4-5`

**Option 2: HTTP Request Node (for direct API calls)**
- Use when you need fine-grained control over the API call
- POST to `https://api.anthropic.com/v1/messages`
- Headers: `x-api-key: {{$credentials.anthropicApi.apiKey}}`, `anthropic-version: 2023-06-01`
- Use for: batch API, streaming, files API, custom parameters not exposed in the node

### Anthropic Chat Model Node Configuration

```
Model: claude-sonnet-4-5 (balanced speed/cost)
       claude-opus-4-5 (complex reasoning)
       claude-haiku-4-5-20251001 (fast/cheap)

Max Tokens: Set explicitly — default may cut off responses
Temperature: 0 for deterministic (extraction, classification)
             0.7-1.0 for creative/generative tasks

System Message: Set in the parent AI Agent or Chain node
                (not in the Chat Model sub-node itself)
```

### Available n8n Workflow Templates for Claude

- **Anthropic AI Agent with Think + Web Search** — Claude Sonnet 4 / Opus 4 with tool routing
- **Batch Process Prompts** — Anthropic Batch API for bulk processing (up to 100k requests)
- **Claude AI Document Generation** — Generate DOCX/PDF/PPTX and upload to Google Drive
- **Claude 3.7 Chatbot with Web Search** — Full chatbot with memory and search

---

## Proper Claude → n8n Workflow Patterns

### Pattern 1: Simple LLM Call (Classification / Extraction)

```
[Trigger] → [Set: prepare prompt] → [Basic LLM Chain] → [IF: route by result]
                                         └── [Anthropic Chat Model]
```

Use when: Single-turn, no memory needed, structured output expected.

**Tips:**
- Set temperature to 0 for consistent extraction
- Use output parsers for structured JSON output
- Add a fallback IF branch for when Claude returns unexpected format

### Pattern 2: Conversational AI Agent

```
[Chat Trigger / Webhook]
        ↓
[AI Agent: Tools Agent]
  ├── [Anthropic Chat Model]
  ├── [Window Buffer Memory or Redis Memory]
  ├── [HTTP Request Tool: Your API]
  ├── [Workflow Tool: Sub-workflow A]
  └── [Code Tool: Custom Logic]
        ↓
[Respond to Webhook / Chat Response]
```

Use when: Multi-turn conversation, autonomous tool use, user-facing chatbot.

**Tips:**
- Always set a system prompt in the AI Agent node describing the agent's role and available tools
- Name your tools clearly — Claude uses the tool name and description to decide when to call it
- Use Redis memory with a TTL to prevent unbounded context growth
- Add a "Require Human Approval" tool for sensitive actions (e.g., sending emails, deleting records)

### Pattern 3: Document Processing Pipeline

```
[Trigger: New file in Drive/S3]
        ↓
[HTTP Request: Download file]
        ↓
[Extract from File Node]
        ↓
[Text Splitter: Recursive Character]
        ↓
[Vector Store: Upsert into Pinecone]
        ↓
[Basic LLM Chain: Summarize]
  └── [Anthropic Chat Model]
        ↓
[Set: store metadata]
        ↓
[Postgres: save summary + vectors]
```

Use when: RAG knowledge base, document intelligence, content indexing.

### Pattern 4: Intelligent Routing Agent (Model Switching)

```
[Webhook]
    ↓
[IF: is complex query?]
    ├── True → [AI Agent] + [Anthropic: Opus 4]
    └── False → [AI Agent] + [Anthropic: Haiku]
```

Use when: Cost optimization — route simple tasks to Haiku, complex to Opus.

**Complexity signals:** length > 500 chars, contains technical jargon, multi-step instruction detected.

### Pattern 5: Batch Processing with Claude

```
[Schedule Trigger]
        ↓
[Postgres: Get unprocessed records]
        ↓
[Loop: Split in Batches (size: 10)]
        ↓
[HTTP Request: Anthropic Batch API]
        ↓
[Wait: Poll for batch completion]
        ↓
[Postgres: Update records with results]
```

Use when: High-volume processing where real-time isn't needed. Batch API is 50% cheaper and not rate-limited the same way.

### Pattern 6: Multi-Agent Orchestrator

```
[Webhook: User query]
        ↓
[AI Agent: Orchestrator]
  ├── [Anthropic: Sonnet 4]
  ├── [Workflow Tool: Research Agent]
  ├── [Workflow Tool: Writing Agent]
  └── [Workflow Tool: QA Agent]
        ↓
[Respond: Final output]
```

Each sub-agent is a **separate n8n workflow** — this keeps each workflow small, testable, and maintainable. The orchestrator routes tasks; sub-agents execute them.

---

## Memory Management

### Session ID Strategy

Memory nodes require a **session ID** to separate conversations. Always derive it from a stable identifier:

```javascript
// From webhook — use a user/session identifier
{{ $json.userId }}
{{ $json.sessionId }}
{{ $json.chatId }}

// From Chat Trigger (auto-provided)
{{ $json.sessionId }}

// Custom: combine user ID + date for daily sessions
{{ $json.userId + '_' + $today.toFormat('yyyy-MM-dd') }}
```

### Memory Node Comparison

**Window Buffer Memory (dev/testing)**
- Lives in n8n process memory
- Clears when workflow is saved or n8n restarts
- OK for testing, terrible for production

**Redis Chat Memory (production sessions)**
- Fast reads/writes
- Set TTL = 24h for typical chat sessions
- Pattern: Redis for recent context + Postgres for long-term history

**Postgres Chat Memory (long-term)**
- Survives restarts
- No TTL — must manually clean up old sessions
- Add a scheduled cleanup workflow to DELETE WHERE created_at < NOW() - INTERVAL '30 days'

### Context Window Management

Claude's context window is large (200k tokens for Sonnet/Opus) but memory in n8n adds tokens with every exchange. To prevent runaway context:

- Set `Max Messages in Context` on Window Buffer Memory (default: 10, set to 20-50 for longer conversations)
- Use Redis TTL to auto-expire old sessions
- For very long threads: summarize older messages and store summary, not full history (implement via Code node)

---

## Error Handling & Validations

### Tier 1: Input Validation (First Node After Trigger)

**Always validate at the entry point.** Never assume incoming webhook data is clean.

```javascript
// Code Node: validate required fields
const item = $input.first().json;
const required = ['email', 'userId', 'message'];
const missing = required.filter(f => !item[f]);

if (missing.length > 0) {
  throw new Error(`Missing required fields: ${missing.join(', ')}`);
}

// Type checks
if (typeof item.email !== 'string' || !item.email.includes('@')) {
  throw new Error(`Invalid email: ${item.email}`);
}

return [{ json: item }];
```

Or use IF nodes to route bad data to an error response branch without throwing.

### Tier 2: Node-Level Retry

Enable on every external API call node (HTTP Request, database nodes, etc.):
- **Retry on Fail:** ON
- **Max Tries:** 3
- **Wait Between Tries:** 5 seconds (use exponential backoff via Wait node for critical calls)

### Tier 3: Error Workflows

Set a global error workflow in **Workflow Settings → Error Workflow**:

```
[Error Trigger]
      ↓
[Set: format error message]
      ↓
[Slack: send alert to #n8n-errors]
      ↓
[Postgres: log error with timestamp, workflow name, execution ID]
```

Error trigger provides: `$json.execution.id`, `$json.execution.url`, `$json.workflow.name`, `$json.error.message`.

### Tier 4: AI-Specific Error Handling

```
[AI Agent]
    ↓
[IF: output contains error markers]
    ├── True → [Wait 5s] → [Retry AI Agent]
    └── False → [Continue]
```

Common Claude failure modes to handle:
- `overloaded_error` — Anthropic API overloaded, retry with backoff
- `rate_limit_error` — hit RPM/TPM limits, add Wait node before retry
- Response truncated — increase `max_tokens`, or check if output parser is too strict
- Tool call loops — set `Max Iterations` on AI Agent (default 10, max 50)

### Tier 5: Output Validation for Claude Responses

Claude sometimes returns JSON with extra text, code fences, or slight format deviations:

```javascript
// Code Node: sanitize Claude JSON output
const raw = $input.first().json.output;

// Strip markdown code fences if present
const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

try {
  const parsed = JSON.parse(cleaned);
  return [{ json: parsed }];
} catch (e) {
  // Fallback: return raw text for manual review
  return [{ json: { error: 'JSON parse failed', raw: raw } }];
}
```

---

## Performance & Cost Optimization

### Token Cost Strategy

| Model | Input | Output | Best Use Case |
|---|---|---|---|
| claude-haiku-4-5 | Cheapest | Cheapest | Classification, routing, simple extraction |
| claude-sonnet-4-5 | Mid | Mid | Most production use cases |
| claude-opus-4-5 | Most | Most | Complex reasoning, nuanced analysis only |

**Rule:** Default to Haiku first. Upgrade only when output quality is demonstrably insufficient.

### Prompt Caching

For workflows that send the same system prompt repeatedly (e.g., a customer support agent), use the HTTP Request node directly to enable `cache_control`:

```json
{
  "system": [
    {
      "type": "text",
      "text": "You are a helpful customer support agent for ACME Corp...",
      "cache_control": { "type": "ephemeral" }
    }
  ]
}
```

Cached tokens cost 10% of normal input price. On a 1,000-token system prompt with 1,000 calls/day → saves 90% of system prompt costs.

### Rate Limiting

- Anthropic rate limits: RPM, ITPM, OTPM per model tier
- Add **Wait nodes** (1-2 seconds) between batches to stay under RPM limits
- Use the **Batch API** (`/v1/messages/batches`) for non-real-time processing — no rate limits, 50% cheaper
- Use Redis to implement a token bucket rate limiter for high-volume workflows

### n8n Execution Optimization

- Use **Sub-workflows** to parallelize independent tasks
- Use **Split in Batches** with appropriate batch size to avoid memory issues on large datasets
- Avoid chaining more than 20-25 nodes in a single workflow — split into sub-workflows
- Disable "Save Execution Data" for high-frequency workflows to reduce DB load

---

## Dos and Don'ts

### ✅ DO

**Architecture**
- DO use sub-workflows for reusable logic (email sending, data formatting, API calls)
- DO name nodes descriptively — "Send Slack Alert" not "Slack"
- DO add Sticky Notes to explain non-obvious logic
- DO use the Execute Workflow node to break large workflows into modules
- DO set explicit timeouts on HTTP Request nodes
- DO configure an Error Workflow for every production workflow
- DO validate inputs at the very first node after any trigger

**Claude Integration**
- DO write detailed tool descriptions — Claude decides when to use a tool based on the description
- DO set system prompts that define the agent's role, tone, and constraints explicitly
- DO set `max_tokens` explicitly on the Anthropic Chat Model node
- DO use temperature 0 for deterministic tasks (extraction, classification, routing)
- DO use the Batch API for bulk/async processing
- DO implement a JSON sanitization step after any Claude response used as structured data
- DO set `Max Iterations` on the AI Agent node to prevent infinite loops

**Memory**
- DO use session IDs derived from stable user identifiers
- DO set TTL on Redis memory to prevent unbounded growth
- DO build cleanup workflows for Postgres memory tables
- DO test memory behavior with multi-turn conversations before launch

**Error Handling**
- DO enable Retry on Fail for all external API calls
- DO classify alerts by severity (WARNING vs CRITICAL) before sending to Slack
- DO log errors with enough context: workflow name, execution ID, input data, timestamp

### ❌ DON'T

**Architecture**
- DON'T put everything in one giant workflow — it becomes unmaintainable fast
- DON'T use Manual Trigger in production
- DON'T leave HTTP Request nodes without authentication on sensitive endpoints
- DON'T ignore the timezone setting on Schedule Trigger nodes
- DON'T use Simple Vector Store in production — it's in-memory and clears on restart
- DON'T connect Merge nodes without ensuring ALL branches will produce output (deadlocks)

**Claude Integration**
- DON'T send unvalidated Claude output directly to databases or downstream APIs
- DON'T use Opus for every task — it's overkill for classification/routing
- DON'T forget to handle the `overloaded_error` and `rate_limit_error` from Anthropic
- DON'T let the AI Agent run without a `Max Iterations` cap — it can loop indefinitely
- DON'T put sensitive data (API keys, PII) in prompts unless necessary — they appear in logs
- DON'T use Window Buffer Memory in production — it clears on workflow save/restart
- DON'T skip output validation for Claude JSON responses — code fences and extra text will break `JSON.parse()`

**Data & Expressions**
- DON'T chain long expression paths without null-safety (`?.` and `??`)
- DON'T try to use `require()` in the Code node — it's not supported
- DON'T assume item order is preserved after Merge operations — sort explicitly if order matters
- DON'T hardcode API endpoints or credentials — use environment variables (`$env.VARIABLE`)

**Performance**
- DON'T call Claude on every keystroke or event if batching is possible
- DON'T let memory context grow unbounded — set window size limits
- DON'T use Postgres memory without a scheduled cleanup job

---

## Quick Reference Cheat Sheet

### n8n Expression Quick Reference

```javascript
{{ $json.field }}                          // current item field
{{ $json?.field ?? 'default' }}           // null-safe with default
{{ $('Node Name').first().json.field }}    // access specific node output
{{ $input.all().length }}                  // count of incoming items
{{ $now.toFormat('yyyy-MM-dd') }}          // formatted date
{{ $execution.id }}                        // current execution ID
```

### Claude in n8n Decision Tree

```
Need Claude in n8n?
├── Single LLM call, no tools, no memory
│   └── Use: Basic LLM Chain + Anthropic Chat Model
├── Multi-turn conversation or autonomous tool use
│   └── Use: AI Agent (Tools) + Anthropic Chat Model + Memory
├── Bulk processing (100+ items, async ok)
│   └── Use: HTTP Request → Anthropic Batch API
├── RAG / document search
│   └── Use: QA Chain + Anthropic Chat Model + Vector Store Retriever
└── Complex routing (simple vs complex tasks)
    └── Use: IF node → Haiku branch + Opus branch
```

### Node Selection Guide

| Task | Best Node |
|---|---|
| Route by condition | IF (2 paths) / Switch (3+ paths) |
| Call REST API | HTTP Request |
| Transform data | Edit Fields (Set) / Item Lists / Code |
| Loop over items | Loop Over Items (Split in Batches) |
| Combine streams | Merge |
| Call another workflow | Execute Workflow |
| Add delay | Wait |
| Simple Claude call | Basic LLM Chain + Anthropic Chat Model |
| Claude with tools | AI Agent + Anthropic Chat Model |
| Validate data | Code Node (throw on invalid) + IF node |

### AI Agent System Prompt Template

```
You are [AGENT NAME], a specialized assistant for [PURPOSE].

## Your capabilities:
- [Tool 1 name]: [when to use it]
- [Tool 2 name]: [when to use it]

## Rules:
- Always [key constraint]
- Never [key restriction]
- When unsure, [fallback behavior]

## Output format:
[Describe expected output structure]
```

---

## Sources

- [n8n Node Types Documentation](https://docs.n8n.io/integrations/builtin/node-types/)
- [n8n Core Nodes Library](https://docs.n8n.io/integrations/builtin/core-nodes/)
- [n8n Trigger Nodes Library](https://docs.n8n.io/integrations/builtin/trigger-nodes/)
- [Anthropic Chat Model Node Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.lmchatanthropic/)
- [Anthropic Node Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.anthropic/)
- [Anthropic Credentials Setup](https://docs.n8n.io/integrations/builtin/credentials/anthropic/)
- [n8n Tools AI Agent Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/tools-agent/)
- [n8n Advanced AI Documentation](https://docs.n8n.io/advanced-ai/)
- [n8n AI Agent Memory Guide 2026](https://towardsai.net/p/machine-learning/n8n-ai-agent-node-memory-complete-setup-guide-for-2026)
- [n8n Error Handling Documentation](https://docs.n8n.io/flow-logic/error-handling/)
- [n8n Expression Reference](https://docs.n8n.io/data/expression-reference/)
- [n8n Schedule Trigger Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/)
- [Handling API Rate Limits in n8n](https://docs.n8n.io/integrations/builtin/rate-limits/)
- [n8n Best Practices - Hostinger](https://www.hostinger.com/uk/tutorials/n8n-best-practices)
- [Claude + n8n Workflow Templates](https://n8n.io/integrations/claude/)
- [Anthropic AI Agent Template (Sonnet 4 + Opus 4)](https://n8n.io/workflows/4399-anthropic-ai-agent-claude-sonnet-4-and-opus-4-with-think-and-web-search-tool/)
- [Batch Process Prompts with Anthropic](https://n8n.io/workflows/3409-batch-process-prompts-with-anthropic-claude-api/)
