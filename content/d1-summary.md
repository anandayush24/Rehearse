> **How to use this page:** read it top to bottom once, then drill the 52 questions in the **Certifications → Claude Developer** track. Items marked **⚠ Exam trap** are the places the source material says developers most often go wrong. Anything marked *version-pinned* (beta headers, limits, discounts) must be re-checked against the current docs at build time.

## At a glance: the 10 ideas that decide most questions

1. **Diagnose, don't reword.** Wrong shape → output constraint. Drifting scope → system prompt. Invented structure → few-shot. Breaks on edge cases → constraint or example for the variant.
2. **Claude never runs your tools.** It emits a `tool_use` block; *your code* executes it and returns a `tool_result` with the matching ID.
3. **The description is the router.** State when to use a tool *and when not to*.
4. **Stream ending ≠ message complete.** Only `message_stop` means whole. Never act on a partial `tool_use` block.
5. **Context is a budget you must measure on production-sized data**, not on test fixtures.
6. **Gate by worst-case cost.** Irreversible action → human checkpoint or deterministic hook, never a prompt rule.
7. **Hooks enforce, CLAUDE.md suggests.** A guardrail that must hold every time belongs in a `PreToolUse` hook (exit code 2 blocks).
8. **Secrets never travel with config.** Env var or secret store; rotate after any exposure.
9. **An eval defines "done" before you ship.** Match the grader to the output: exact match, code check, or calibrated LLM judge.
10. **Retriable vs terminal.** Retry 429/5xx/529 with backoff + `retry-after`; fail fast on 400/401/403/404 and on refusals.

---

## Module 1: Foundations

### How LLMs behave

| Concept | Key facts |
|---|---|
| **Tokens** | The unit of input, output *and* cost. Counts include prompt, history, tool definitions, tool results and the response. Chars-per-token is model-dependent. |
| **Context window** | Fixed budget for everything in one request. Input larger than the window → validation error *before* generation. Hitting the ceiling *during* generation → output so far with stop reason `model_context_window_exceeded`. Nothing is silently truncated, so *your app* must trim or summarize. |
| **Sampling** | The model samples from a probability distribution. Lower temperature = more repeatable, but `temperature 0` is **not** a guarantee of identical output. Newest models reject non-default `temperature`/`top_p`/`top_k` with a **400**; steer through prompting. |
| **Non-determinism** | Never assert exact text. Assert properties (field present, value in range, parses) and use an eval with a judge for meaning. |

### Model family and reasoning

- Tiers: **Fable** (most capable) · **Opus** · **Sonnet** (balanced default) · **Haiku** (speed and cost).
- **Start with Sonnet.** Move up only when an eval shows a miss; move down to Haiku only when an eval shows the drop is acceptable.
- **Model choice and reasoning are two independent levers.** Reasoning is adaptive thinking: tune depth with the **effort** setting. `budget_tokens` is deprecated and returns 400 on the newest generations. Thinking content is omitted by default on the newest models; request a summarized display to see it.

### Prompting modes

| Mode | Use when |
|---|---|
| Zero-shot | Simple task, obvious output shape |
| One-shot / multi-shot | Specific structure, casing or edge case a description keeps missing. Examples are *in the prompt*, not training data. Each costs tokens on every call. |

A more capable model may succeed zero-shot where a smaller one needs examples. Choose the model and the example count together, against an eval.

### SDK, REST, streaming, async

- The SDK is a thin layer over the same REST API (auth, retries, parsing). Same model, same endpoint.
- **Sync**: wait for the whole response. **Streaming**: server-sent events, so users see output immediately.
- **Concurrency without blocking**: `AsyncAnthropic` (Python); the TypeScript client is already Promise-based.
- **Message Batches API**: bulk offline work. Up to **100,000 requests or 256 MB** per batch, **up to 24 h**, **lower per-token cost**. Results return in **arbitrary order**; match with `custom_id`.

> **⚠ Exam trap:** looping over a list with the synchronous API, even in chunks, is *not* batching. It still makes one request per item and still hits rate limits.

---

## Module 2: Building with the API

### Prompt structure: four techniques

| What you observe | What is missing | Fix |
|---|---|---|
| Wrong shape (sentence instead of label, prose instead of JSON) | **Output constraint** | Specify form, fields, no preamble, what to do when data is absent |
| Scope or tone drifts, worse over turns | **System prompt** (or a more specific one) | Role, rules, output contract that holds every turn |
| Right task, invented structure | **Few-shot examples** | One correct input→output pair, in consistent XML tags |
| Clean on tested inputs, breaks on a variant | **Constraint covering the variant** | Name it, or add an example for it |

- **XML tags** separate instructions from data; use descriptive names (`<ticket>`, `<sample_input>`, `<ideal_output>`).
- **Stack all four** only against a clearly defined output contract. **Simplify** when a trivial task gets over-engineered. **Diagnose first** when the prompt keeps getting longer.
- **Three failed re-prompts in a row → stop adding text.** Long prompts also produce long outputs and add latency without adding accuracy.

### Structured outputs (constrained decoding)

- **JSON outputs**: `output_config.format` with `type: json_schema`. Constrains the *final response*.
- **Strict tool use**: `strict: true` on a tool definition. Constrains the *tool arguments*.
- Costs and limits:
  - First request on a new schema is slower (grammar compile; **cached 24 h** from last use).
  - Input tokens rise slightly (injected format prompt is billed).
  - A guaranteed schema is **not** guaranteed success: `stop_reason: refusal` and `max_tokens` truncation still produce non-matching output. **Always check `stop_reason`.**
  - **Incompatible with message prefilling.**

### Extended thinking

- Use for multi-step reasoning, dependent planning, agentic loops that plan across tool calls. **Leave off** for classification, extraction, format conversion, lookups.
- Thinking tokens bill like output tokens.
- **Carry-back rule:** every `thinking` block (and `redacted_thinking`) must be returned **unchanged**. Edit, summarize or drop it and the signature fails, so the request is rejected.

### Tool use

**The loop** (steps 3 to 6 repeat until `end_turn`):

1. Define schema (name, description, input_schema)
2. Send message with tools
3. Claude returns `tool_use` (name, unique ID, input) with `stop_reason: tool_use`
4. **Your code executes the tool.** The model is stateless between calls; you make a fresh request with prior messages plus the result.
5. Return a `tool_result` referencing the ID
6. Claude continues

**Block rules**

| Block | Rule |
|---|---|
| `text` | May sit beside `tool_use`; keep the *full content array* when appending to history. |
| `tool_use` | Must be answered by a `tool_result` with the **same ID** in the **immediately following user turn**. |
| `tool_result` | Carries `tool_use_id`, content, optional `is_error: true`. |
| `thinking` | Pass back unchanged. |

**Schema design**

- **Name**: specific (`get_account_balance`, not `get_data`).
- **Description**: what it does, when to use it, **when not to**, what it returns (3 to 4 sentences, with example inputs where format matters).
- **`required`** only for fields the call truly needs. Marking everything required forces fabricated values.
- Overlapping tools: add exclusion language to **both**. If descriptions still cannot be separated, **merge into one tool with a type parameter**.
- Dependent calls run in separate turns; independent calls can be parallel (the default). `disable_parallel_tool_use` forces one call per turn.
- **Over-tooling** degrades routing. Start with the minimum set.

> **⚠ Exam trap:** exclusion logic that depends on earlier turns silently fails if history is truncated.

### MCP (Model Context Protocol)

- Moves tool definitions and execution into a **server**. The loop is unchanged: your MCP client sends `ListToolsRequest`, passes definitions to Claude, executes calls, returns results.
- **Transports**: **stdio** (local subprocess) and **Streamable HTTP** (remote; POST plus optional SSE stream). SSE-only is deprecated.
- **API MCP Connector**: remote (HTTP) servers only; needs beta header `mcp-client-2025-11-20`. Controls via `mcp_toolset`: `default_config`, per-tool `configs`, `enabled` (allow/deny list), `defer_loading` (load definitions on demand).
- Tool definitions consume context **even when unused**: register only servers you need.
- **Use MCP** when a maintained server exists · **write schemas** for description quality or precise control · **both** for breadth plus precision.

### Streaming

| Event | Handler action |
|---|---|
| `message_start` | Create empty content array |
| `content_block_start` | Open a slot at `index` with the block type (`tool_use` gives name and id) |
| `content_block_delta` | Append fragment (`text_delta`, `input_json_delta` = partial JSON, thinking) |
| `content_block_stop` | Finalize; **first moment tool JSON is parseable** |
| `message_delta` | Record `stop_reason`, final usage |
| `message_stop` | Stream complete: now it's safe to commit the turn |

- **Never act on a partial block.** Commit the assistant turn to history **only after `message_stop`**.
- Interrupted stream → **discard** the partial turn and retry from the last complete turn.

> **⚠ Exam trap:** the error appears on the *retry* request, so teams debug the schema when the cause was a half-committed streamed turn.

---

## Module 3: Context engineering, agents and memory

### Staying in budget

| Strategy | Does | Lose |
|---|---|---|
| **Pruning** (rewind) | Jump back to an earlier message | Work after the rewind point |
| **Compaction** (`/compact`; server-side compaction in API, beta) | Summarize history | Anything the summary omitted |
| **Clearing** (`/clear`, new session) | Empty context | Everything unless persisted (e.g. CLAUDE.md) |
| **Subagent handoff** | Isolated context, returns a summary | Visibility into the subagent's steps |

- **Summarizer prompt quality is the whole game.** "Summarize the conversation" drops task-critical state; instead preserve *files modified, decisions, errors and resolutions*.
- **Prompt caching**: `cache_control: {type: "ephemeral"}` on the last block to cache; up to **4 breakpoints**; order is tools → system → messages; **exact prefix match** (one changed character invalidates); default TTL **5 min** (refreshed on read), opt-in `ttl: "1h"`; minimum ~**1,024 tokens** on most models. Writes cost **1.25x** (5 min) or **2x** (1 h); reads about **0.1x**. Only pays off when reads outnumber writes.
- **Token counting**: `count_tokens` takes the same body as a messages call, runs no inference. Use it to measure on real tool outputs and to gate oversize requests.
- **Measure token cost against the largest production input**, not fixtures. A tool result 4x bigger than the fixture fills the budget at turn 8, not turn 20, and the symptom looks like *bad tool selection*.

### RAG

| | Classical RAG | Agentic search |
|---|---|---|
| Work happens | Upfront: chunk → embed → index | At query time: model searches and reads |
| Strengths | Inspectable, testable, cheap per query | No index to build or keep fresh |
| Costs | Index to build, sync, secure | More tokens and time per query; less inspectable |
| Fits | Stable corpus, simple lookups | Changing corpus, multi-step questions |

- Break points: **chunking** (too small = no context, too large = diluted match; use overlap), **embedding match** (semantic ≠ exact term; add lexical), **assembly** (so the model answers from retrieved text).
- A cheap **router** can send lookups to fetch-once and multi-part questions to agentic search. Skip it if all queries look alike.

### Workflow vs agent

> Single call → workflow → agent. Move up only when the simpler pattern can't handle the variability.

| Workflow | Agent |
|---|---|
| Steps enumerable in code | Goal + tools, path unknown |
| Per-step guardrails, standard observability | Non-determinism acceptable, transcript-level tooling needed |

### Three wiring paths

| Path | Who runs the loop | Notes |
|---|---|---|
| **Raw Messages API loop** | You | Full control, full maintenance |
| **Agent SDK** | Your process, SDK structures it | Your code still executes tools |
| **Claude Managed Agents** (public beta) | Anthropic (loop + sandbox) | Agent = versioned API resource; sessions stored server-side → **not eligible for ZDR or HIPAA BAA**; beta header `managed-agents-2026-04-01` |

**Four loop steps:** register tools · scope the system prompt · handle every `tool_use` · **define exit conditions that don't depend on Claude volunteering to stop**.

### Human-in-the-loop placement

Ask: *what is the worst outcome if this step runs unchecked?*

| Insertion point | Risk |
|---|---|
| Before a destructive tool call | High (irreversible) |
| After a planning step | Medium (wrong plan) |
| On unexpected output | Variable (errors, empties, out-of-bounds) |

> **⚠ Exam trap:** a validator passing on *one file* is not a checkpoint on *downstream impact*.

### Memory scope

| Scope | Persists | Best for | Weakness |
|---|---|---|---|
| In-context | Within the session | Short sessions | Cost grows every turn; lost at session end |
| External storage | Across sessions/users/instances | Continuing threads | Retrieval latency + read/write code |
| Summarized | Condensed carry-over | Long conversations | Loses what the summarizer omitted |
| Stateless | Nothing | Independent jobs | No recall |

Decide memory scope **at design time**; retrofitting under production pressure costs far more.

### Skills

- `SKILL.md` with frontmatter (`name`, `description`). **Only name and description load at startup**; the body loads when a request matches. The **description is the matching criterion**.
- Skills vs CLAUDE.md (always loaded, fixed cost) vs in-context (grows, dies with the session).
- Runtimes: **Claude Code** (filesystem, permission-gated) · **Messages API** (beta headers `code-execution-2025-08-25` + `skills-2025-10-02`; runs in the code-execution container) · **Agent SDK** (set `settingSources` / `setting_sources` explicitly, or skills never load) · **Managed Agents** (attached to the agent resource).
- **Subagents don't inherit skills or history** (they *do* inherit the parent's permission context). List needed skills in the subagent config.

### Multimodal and batch

- **Image cost** = ⌈width/28⌉ × ⌈height/28⌉ visual tokens (1000×1000 ≈ 1,296). Oversize images are downscaled first.
- **Sending images/PDFs**: base64 (one-off) · URL (public, stable, reachable) · **Files API** (`file_id`, upload once, reuse; beta, not on Bedrock/Vertex).
- **PDFs** use a `document` block (source: base64, URL, or `file_id`); `title` and `context` are optional.
- **Right API:** user waiting → sync · nightly/eval/backfill → Batches · image/PDF reuse → Files API.

---

## Module 4: Claude Code, MCP and enterprise integration

### Claude Code: explore → plan → code

Plan mode holds Claude in exploration; no edits or shell until released.

### Permission modes

| Mode | Auto-approves | Still gates | Use for |
|---|---|---|---|
| `default` | Reads | Edits and commands | New/unfamiliar work |
| `acceptEdits` | Reads, edits, common fs commands (`mkdir touch rm rmdir mv cp sed`) **inside the working dir** | Other shell, outside-dir and protected paths | Trusted local work |
| `plan` | Reads | Everything until a plan is approved | Research on sensitive code |
| `auto` | Everything, but a **classifier** reviews each action | Prod deploys, mass deletes, credential exfiltration, force-push to main (blocked by default) | Fewer prompts, still a net (research preview) |
| `dontAsk` | Only pre-allowed tools + read-only | **Auto-denies** the rest | Locked-down CI |
| `bypassPermissions` | Everything, **no safety checks, skips protected-path guard** | Only catastrophic deletes (`rm -rf /`, `~`) | Disposable container/VM only |

### Settings hierarchy

`User ~/.claude/settings.json` → `Project .claude/settings.json` (committed) → `Local .claude/settings.local.json` (git-ignored) → **Enterprise `managed-settings.json`** (cannot be overridden).
**Deny always beats allow**, in every mode. The most durable control is an **enterprise deny rule**.

> **⚠ Exam trap:** a broad glob (`/v1/legacy/`) matched files in `/deploy/config/prod/`, and `bypassPermissions` removed the prompt that would have caught it. Set deny rules *before* switching modes; prefer `auto` over a full bypass.

### Durable context mechanisms

| Mechanism | Loads | Cost | Belongs here |
|---|---|---|---|
| **CLAUDE.md** | Every session | Persistent, **dilutes with size** | Universal constraints, commands, conventions |
| **Rules** (`.claude/rules/`) | `paths` glob in YAML frontmatter → on matching files; **no `paths` = loads at launch like CLAUDE.md** (folder placement is organizational only) | Only when triggered | Path-specific guidance |
| **Hooks** | Run a script at an event, no context added | Minimal | **Enforced** guardrails, side effects, audit |
| **Subagents** | Isolated context, return a summary | Summary only | Exploration, parallel work |

- `/init` generates a starter CLAUDE.md. Validate it. An 800-line CLAUDE.md let a path restriction get ignored through dilution.
- **Hook events**: `PreToolUse` (can **block with exit code 2**, reason on stderr), `PostToolUse` (cannot block; formatters, tests, audit), `UserPromptSubmit`, `Stop`, `Notification`, `SessionStart`, `SessionEnd`.
- **Built-in subagents**: `Explore` and `Plan` **skip CLAUDE.md and git status**; the general-purpose subagent loads both. Custom subagents (`.claude/agents`) need skills listed explicitly.

### Plugins

- A **plugin** bundles skills, hooks, subagents and MCP servers; distributed via **marketplace** (`/plugin marketplace add <owner/repo>`).
- Skills are now the recommended format for explicit and automatic invocation (`/skill-name`); `disable-model-invocation: true` = explicit-only. `.claude/commands/` is legacy.
- Plugin commands are **namespaced** (`/payments:run-tests`); renaming the plugin renames every command.
- Enterprise: managed settings can allowlist marketplaces; add `extraKnownMarketplaces` to *push* one. Managed scope can't be overridden.
- **Never hard-code absolute paths or env assumptions** in a plugin; it works for the author and fails for everyone else.

### MCP server configuration

- Scopes: **local** (you, this project) · **project** (`.mcp.json`, shared via repo) · **user** (you, all projects) · **managed** (admin).
- Permission rules can target a **single MCP tool** by server and tool name.
- Auth by service type:

| Service | Pattern |
|---|---|
| Remote, **user identity** (SaaS) | **OAuth** (server returns 401 → browser sign-in → token) |
| Remote, **service identity** | **API key via environment variable** |
| Local, file access | **stdio**, no network auth; the security boundary is filesystem permissions |
| GitHub MCP example | Personal access token passed as header |

### Secrets

1. **Separation**: config holds a variable reference, never the value.
2. **Home**: env var injected at execution, or a **secret store** for shared credentials.
3. **Rotation**: scheduled and **immediately after any exposure**. A committed key stays in git history, so removing it from the file is not a fix.
4. Least privilege; one credential per integration.

Regulated add-ons: **managed config** (admin-locked auth), **`PostToolUse` audit hook** (deterministic log), **region-pinned endpoint** (residency).

---

## Module 5: Production engineering

### Design document (before code)

Four decisions: **success criteria** (gradable) · **failure handling** (retriable/terminal + user outcome) · **cost and latency budget** (+ reliability floor) · **trust boundary** (untrusted inputs, minimum actions).

### Evals

- An eval = dataset + expected behavior + grader + average. **Write it before the feature.** Change one variable at a time.
- Grader choice follows the output shape:

| Output | Grader | Weakness |
|---|---|---|
| One correct label/value | **Exact match** | Fails valid paraphrases/reorderings |
| Structured / code | **Code-graded check** (valid JSON, parses, in range, field present) | Says nothing about quality |
| Open-ended quality | **LLM-as-judge** (rubric, scored with reasoning) | Costly, noisy; **meaningless until calibrated** |

- Run cheap code graders on every commit; reserve the judge for a scheduled quality pass.
- **Coverage over perfection**: include edge cases, not just the demo path.

### Test levels

| Level | Isolates | Misses |
|---|---|---|
| Unit | One function (parser, tool wrapper) | How pieces fit |
| Functional | One Claude call returns the right shape | The system around it |
| **Integration** | **Handoff between components** (where silent failures hide) | Full-flow effects |
| End-to-end | Whole flow | Slow, hard to localize |

**Tracing** records prompt, tool calls, intermediate outputs, timing, so a failed eval is localized to a step (e.g. "step 4: parser KeyError").

### Errors and retries

| Error | Class | Handling |
|---|---|---|
| 429 rate limit | Retriable | Exponential backoff + jitter, **honor `retry-after`**, cap attempts |
| 529 overloaded | Retriable | Backoff; Anthropic-side load, not a rate-limit signal; fail over if persistent |
| 500 / 502 / 503 / 504 | Retriable | Backoff |
| 400 / 401 / 403 / 404 | **Terminal** | Fail fast, fix the request |
| Tool failure | Depends | Return `tool_result` with **`is_error: true`**; never an empty result |
| **Refusal** (HTTP 200, `stop_reason: "refusal"`) | **Terminal** | A retriable-status classifier will **not** catch it |

- The SDK **already retries** transient failures. Don't stack your own loop on top (attempts multiply). Pick one layer.
- Unsure → treat as terminal (loud failure beats hammering a service).

### Cost, latency, reliability

- **Instrument every call**: input tokens, output tokens, latency, error rate. Find the one step that is ~90% of spend.
- Levers: model selection (+ routing: default model with override on a cheap task signal) · prompt/context size · number of tool calls · streaming vs batched · caching · batching.
- **Batch + caching compound**; streaming and batching never compete for the same request.
- **Multi-agent orchestrator-worker**: parallel fan-out, ~**15x tokens** vs a normal chat (reported by Anthropic). Worth it for broad, splittable research; poor fit for tightly coupled work like coding. Every subagent needs its own retry/backoff.
- **Reliability is the floor**: set retry budget and latency ceiling first, then tune cost *above* it.

### Security

- **Prompt injection**: the model sees one token stream; there is no trust boundary inside it. Hostile text hides in anything the agent reads (web pages, documents, emails, tool output; also hidden text and images). Treat fetched content as **data**. Delimiters help but are a **soft boundary**. No agent that reads untrusted content is fully immune.
- **Jailbreak** (override safety) ≠ **injection** (hijack your app's instructions), but the defense has the same shape: constrain what reaches the model **and** what it may do.
- **Least privilege** is what holds when everything else fails: narrow write paths, explicit denies, scoped secrets. Whatever can edit the auth config can widen the blast radius, so protect it.
- **Hook-based guardrails** (`PreToolUse` block, `PostToolUse` log) are enforcement, not convention.
- **OS-level sandboxing** is the residual control.

---

## Module 6: Regulated delivery, platforms and packaging

### Governing constraint picks the route first

| Constraint | Route |
|---|---|
| **Attorney-client privilege** | Direct API/SDK from the firm's app, SSO, **approved LLM gateway**, full request/response logging. Anthropic doesn't capture conversation content by default on direct API traffic, so **you** log it. |
| **HIPAA (PHI)** | **BAA-covered configuration** only (direct API with HIPAA-enabled org, or Bedrock/Vertex on the partner's eligible account). BAA excludes Console, Workbench, beta features, consumer plans; check feature eligibility. |
| **GDPR / EU residency** | Bedrock or Vertex with **region pinned**. Direct API doesn't currently offer EU data residency. A global endpoint is the failure pattern. |
| **FedRAMP** | Claude for Government (FedRAMP High via PFCS-SS) · Bedrock GovCloud (High, DoD IL4/5) · Vertex AI Assured Workloads. Enterprise on AWS Marketplace is **not** FedRAMP authorized. Don't let dev/test hit the commercial endpoint. |
| **Internal residency policy** | Build against whatever SDK client/endpoint the CIO has cleared. |

> **Managed Agents:** server-side stateful sessions → not ZDR/BAA eligible. A PHI or ZDR workload rules it out.

### Systems lifecycle and requirements

- Derive **functional** and **infrastructure** requirements from the business problem *before* choosing a platform; document them so a decision can be defended.
- Lifecycle phases each need an **artifact and a gate**; skipping gates under deadline is the usual failure.

### Platform and versioning

- **The customer's cloud usually determines the platform.** Compare on **latency (measured from the customer's region)**, **compliance**, and **total cost** (beyond per-token rate).
- **Pin the model snapshot**, not a moving alias, so an upstream change isn't a silent production change. **Promote a new version only through the eval**, and keep the prior version for rollback.

### Multi-component integration

- Map components; **name every seam as a trust boundary**; apply least privilege per component; log boundary crossings.

### Packaging and contribution

- Packaging an **accelerator**: keep the reusable parts, separate customer-specific parts, **parameterize while the build is fresh**, document assumptions, bundle the audit log.
- Contributing upstream: match the channel, supply **examples and tests** a maintainer can verify, and clear **rights/licensing/attribution** before technical review.

---

## Cheat sheet: "which tool for this symptom?"

| Symptom | Reach for |
|---|---|
| Output shape varies run to run | Output constraint + few-shot (or structured outputs) |
| Claude picks the wrong tool | Exclusion conditions on **both** descriptions; or merge tools |
| Tool call has missing/garbled args after a stream | You acted before `content_block_stop`/`message_stop` |
| Wrong-tool selection that starts at turn N | Context filling; measure tool-output tokens |
| Agent did something irreversible | HITL checkpoint before the write / `PreToolUse` hook |
| Rule in CLAUDE.md ignored | File too long; path-scope it or enforce with a hook |
| Skill not firing under SDK | `settingSources` not set |
| Key leaked in a repo | Rotate now; move to env var/secret store |
| 429 storm at night | Message Batches API, `custom_id`, not chunked sync loops |
| Same long system prompt every request | Prompt caching (check TTL, minimum length, exact prefix) |
| Passes unit tests, fails end-to-end | Integration test at the handoff; add tracing |
| Bill is high, no idea why | Per-call token/latency/error logging |
| EU customer, residency required | Bedrock/Vertex with pinned region |
