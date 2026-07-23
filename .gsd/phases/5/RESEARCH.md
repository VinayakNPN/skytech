---
phase: 5
level: 2
researched_at: 2026-07-02
---

# Phase 5 Research

## Questions Investigated
1. How should we structure the LLM API integration given the conflict between the PRD (Claude) and STATE.md (Gemini)?
2. How should the Rubber Duck Mode state machine be designed (Code vs LLM driven)?
3. How should we extract tasks from the generated PRD reliably?
4. Where should system prompts live to allow easy tuning without code redeploys?

## Findings

### LLM Integration Architecture
Different features have different requirements. Rubber duck sessions and briefings are high-reasoning, latency-tolerant tasks (Claude is better). Intent disambiguation requires near-instant responses (Gemini Flash is better).

**Recommendation:** Build an abstract `LLMProvider` interface. Use `ProviderRouter` to route by feature based on a `config.yaml` mapping.

### Rubber Duck State Machine
Pure code-driven state machines are too rigid for natural conversation. Pure LLM-driven state machines are fragile, impossible to unit test, and hard to serialize for resuming sessions.

**Recommendation:** A Hybrid approach. The Python state machine owns transitions (based on completion predicates), the LLM owns conversational language and slot extraction, and the slots own persistence.

### Task Extraction
Markdown checkboxes alone lack metadata (priority, estimate). JSON alone lacks a scannable, human-readable PRD artifact.

**Recommendation:** A single LLM call that produces both, separated by a `---TASKS---` delimiter. Part 1 is the full PRD in Markdown, Part 2 is a JSON array of task objects. Use Markdown checkboxes as a fallback if JSON parsing fails.

### Prompt Management
Hard-coding prompts in Python f-strings requires redeploying code to tweak behavior.

**Recommendation:** Move system prompts to version-controlled YAML files under `~/zeno/prompts/`.

## Decisions Made
| Decision | Choice | Rationale |
|----------|--------|-----------|
| Provider | `LLMProvider` Protocol | Allows feature-specific routing (Claude for PRDs, Gemini for quick tasks) via `config.yaml`. |
| Rubber Duck | Hybrid State Machine | Code manages state transitions via predicates; LLM manages language. Allows robust DB serialization. |
| Task Parsing | Markdown + JSON Split | One call generates both. JSON provides metadata, Markdown provides readability. |
| Concurrency | `asyncio` | Prevents LLM network calls from blocking the voice pipeline daemon. |

## Patterns to Follow
- `asyncio` for all LLM network calls.
- `asyncio.run_in_executor` for CPU-bound tasks like Whisper STT inference.
- Tiered context window for LLMs (slots always, last 6 turns sliding, older turns summarized).

## Anti-Patterns to Avoid
- **Implied Scope:** Asking the LLM to generate tasks beyond the explicit scope provided by the user.
- **Blocking Daemon:** Using `asyncio.run()` in the voice pipeline thread.

## Dependencies Identified
| Package | Version | Purpose |
|---------|---------|---------|
| `anthropic` | latest | Claude provider implementation |
| `google-genai` | latest | Gemini provider implementation |
| `pyyaml` | latest | Loading prompt templates and config |

## Ready for Planning
- [x] Questions answered
- [x] Approach selected
- [x] Dependencies identified
