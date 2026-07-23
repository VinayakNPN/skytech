---
phase: 5
plans: 4
---

# Plan 5.1: LLM Engine & Prompt Loader

## Objective
Establish the foundational LLM architecture using an abstract provider interface to route tasks dynamically between Claude and Gemini, and build a YAML-based prompt loading system.

## Context
- .gsd/SPEC.md
- .gsd/ARCHITECTURE.md
- .gsd/phases/5/RESEARCH.md

## Tasks

<task type="auto">
  <name>Implement LLM Providers</name>
  <files>zeno/ai/providers.py</files>
  <action>
    - Create an `LLMProvider` Protocol with `complete`, `complete_structured`, and `stream` async methods.
    - Implement `ClaudeProvider` (using `anthropic` package) and `GeminiProvider` (using `google-genai` package).
    - Implement `ProviderRouter` that initializes providers based on API keys from the environment and routes feature keys (e.g., `rubber_duck`, `intent_slot_fill`) based on `user_profile` config mappings.
    - IMPORTANT: Ensure all methods use `asyncio`.
  </action>
  <verify>python -c "from zeno.ai.providers import ProviderRouter; print('Providers loaded')"</verify>
  <done>LLMProvider protocol and concrete Claude/Gemini implementations are complete and syntactically valid.</done>
</task>

<task type="auto">
  <name>Implement Prompt Loader</name>
  <files>zeno/ai/prompts.py</files>
  <action>
    - Create a module to load system prompts from YAML files located in `~/Zeno/prompts/`.
    - Implement a `load_prompt(template_name: str, **kwargs)` function that reads the YAML, parses the text, and formats it using the provided kwargs.
    - If a prompt file does not exist, it should fallback to a default minimal string or raise a clear error.
  </action>
  <verify>python -c "from zeno.ai.prompts import load_prompt; print('Loader available')"</verify>
  <done>Prompt loading utility can read from YAML files and interpolate variables.</done>
</task>

## Success Criteria
- [ ] Abstract provider routing is functional.
- [ ] Prompt templates can be decoupled from Python code via YAML files.

---

# Plan 5.2: Rubber Duck State Machine

## Objective
Implement the Hybrid Rubber Duck conversation state machine, combining strict code-driven transitions with conversational LLM language generation.

## Context
- .gsd/phases/5/RESEARCH.md
- zeno/db.py

## Tasks

<task type="auto">
  <name>State Machine & Dataclass</name>
  <files>zeno/ai/rubber_duck.py</files>
  <action>
    - Create the `RubberDuckSession` dataclass with fields: id, state (PROBLEM, CONSTRAINTS, EDGE_CASES, DEPS, CRITERIA, GENERATING), problem_statement, constraints, edge_cases, dependencies, success_criteria, turn_history, slots_complete.
    - Implement the `process_turn(session, user_input)` method which appends to history, calls the LLM to extract slots into the current state's list/string, and generates the conversational follow-up.
    - Implement the transition logic: advance state when the current state's completion predicate (e.g., `len(session.constraints) > 0`) is met, or if user asks to skip.
    - Manage tiered context window (slots always present, last 6 turns sliding window).
  </action>
  <verify>python -m py_compile zeno/ai/rubber_duck.py</verify>
  <done>State machine logic properly handles transitions and tiered context generation.</done>
</task>

<task type="auto">
  <name>DB Serialization</name>
  <files>zeno/ai/rubber_duck.py, zeno/handlers/sessions.py</files>
  <action>
    - Ensure `RubberDuckSession` can be serialized to and deserialized from the SQLite `rubber_duck_sessions` table.
    - Wire the NLP intent `start_rubber_duck` to initialize or resume a session from the DB.
  </action>
  <verify>python -c "from zeno.ai.rubber_duck import RubberDuckSession; print('Dataclass wired')"</verify>
  <done>Session state persists between turns in SQLite.</done>
</task>

## Success Criteria
- [ ] Rubber duck sessions persist in the database.
- [ ] The state machine naturally transitions through all 6 phases.

---

# Plan 5.3: PRD Generation & Task Extraction

## Objective
Convert a completed Rubber Duck session into a final Markdown PRD and extract actionable tasks directly into the database.

## Context
- .gsd/phases/5/RESEARCH.md

## Tasks

<task type="auto">
  <name>PRD Writer & Dual Parsing</name>
  <files>zeno/ai/prd_writer.py</files>
  <action>
    - Implement `generate_prd(session)`. It calls the LLM with the full session context, prompting it to output the PRD in Markdown (Part 1), followed by the delimiter `---TASKS---`, followed by a JSON array of task objects (Part 2).
    - Parse the response: split by `---TASKS---`.
    - Write Part 1 to `~/Zeno/projects/<slug>/PRD.md`.
  </action>
  <verify>python -m py_compile zeno/ai/prd_writer.py</verify>
  <done>The LLM call successfully generates and splits the Markdown and JSON outputs.</done>
</task>

<task type="auto">
  <name>Task DB Insertion</name>
  <files>zeno/ai/prd_writer.py</files>
  <action>
    - Parse the JSON array from Part 2.
    - Insert the parsed tasks into the SQLite `tasks` table with their metadata (title, priority, estimated_minutes, etc.).
    - Implement a fallback: if JSON parsing fails, use regex to extract `- [ ]` checkboxes from Part 1 and insert them with default metadata.
    - Enforce prompt constraint: "Generate tasks only from explicitly stated scope."
  </action>
  <verify>python -m py_compile zeno/ai/prd_writer.py</verify>
  <done>Extracted tasks are reliably written to the database with fallback resilience.</done>
</task>

## Success Criteria
- [ ] PRD.md is saved to the local filesystem.
- [ ] Tasks are accurately extracted and inserted into SQLite.

---

# Plan 5.4: Morning Briefing Generator

## Objective
Gather necessary context from the database and system, and generate a concise morning briefing using the LLM.

## Context
- .gsd/phases/5/RESEARCH.md
- zeno/db.py

## Tasks

<task type="auto">
  <name>Context Builder</name>
  <files>zeno/ai/briefing.py</files>
  <action>
    - Implement functions to gather:
      - Pending tasks from `v_morning_brief_tasks` (title, priority, due, status).
      - Last session's departure card (last_active_task, pending_items, energy_level).
      - Today's calendar events (title, start, end).
      - `peak_focus_window` from `behaviour_patterns`.
      - Weekly summary from `analytics_weekly`.
    - Format these into a compact context string (under ~800 tokens).
  </action>
  <verify>python -m py_compile zeno/ai/briefing.py</verify>
  <done>Context builder collects all required data efficiently.</done>
</task>

<task type="auto">
  <name>Briefing Synthesis</name>
  <files>zeno/ai/briefing.py</files>
  <action>
    - Implement `generate_morning_briefing()` which takes the gathered context and calls the LLM.
    - Prompt constraint: The LLM must synthesize the information into a conversational briefing under 120 words of spoken length.
    - Connect this to the `deliver_briefing` intent or startup script.
  </action>
  <verify>python -m py_compile zeno/ai/briefing.py</verify>
  <done>The LLM generates a concise, accurate morning briefing from the provided context.</done>
</task>

## Success Criteria
- [ ] Briefing is correctly formed and respects context size limits.
- [ ] Briefing generates quickly and is ready for TTS.
