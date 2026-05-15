# Skill Set Consolidation

## Goal

Build one unified, language-agnostic skill set by cherry-picking from four sources, resolving conflicts, merging overlaps, and generalizing Python-specific rules into core principles. The result is complemented by framework-specific skill sets per project.

## Sources

| Source        | Location                              | Count | Style                                     |
| ------------- | ------------------------------------- | ----- | ----------------------------------------- |
| Personal      | `skills/`                             | 5     | Pragmatic, lightweight, language-agnostic |
| Superpowers   | `.tmp/superpowers/skills/`            | 14    | Dogmatic, Iron Laws, heavy ceremony, TDD  |
| Addy (Google) | `.tmp/addy-agent-skills/skills/`      | 22    | Balanced, web/TS-focused, practical       |
| Python        | `.tmp/my_coding_rules_python/skills/` | 11    | Strict but pragmatic, Python-specific     |

## Design Principles

### Skills describe generic workflow, but meta-workflow will be added later on the layer above the skills

Skills recommend workflow and contain knowledge, but there will be also higher level meta-workflow added later.

For example, skills contain workflow steps such as planning, debugging, implementation, review, and say when each workflow step should be called.

After the consolidation, there will be added more higher level workflow that will be able to automate bigger tasks than skills now can handle.

### Ceremony scales with task size

Small tasks with clear intent get quick independent planning step. A big feature already brainstormed in the same chat should not require user to interactively re-plan from scratch only because "planning" skill sets hard rule to do this. The skill offers the process; the user or workflow decides the ceremony level.

### Hard gates and Iron Laws: minimal, targeted

Not banned entirely, but used sparingly. Legitimate example use case: **fail fast on environmental conditions**. If a skill requires certain env conditions and they're missing, the skill should tell the agent to stop and notify the orchestrator rather than work around it silently.

Examples of legitimate hard stops:
- API is down → stop, don't try to start the API yourself, escalate or delegate
- Docker broken → stop, don't try to fix Docker
- Browser MCP not installed → stop, don't replace with curl
- Config broken and can't be worked around sanely → stop

Another case for failing fast is situation when given task is too ambiguous or incorrect, something is missing, code broken, other unexpected problems. Why this matters? If agent is given a task and it will try to achieve the result regardless of the real state of the code, it may produce severe hallucinations instead of a usable result, and all its work will be rollbacked or reimplemented anyway.

Examples:
- user asks agent to do a research of feature implementation, but feature misses in source code because of the wrong current commit. Agent should fail fast instead of trying to do analysis on incorrect code
- orchestrator delegates a subagent to do browser verification of a task, and subagent discovers that feature is not present in deployed front end. Instead of trying to verify something else, it should report to orchestrator back that the feature is missing
- user asks agent to do a feature, but user gives too small description of a feature and recommendations are ambiguous and agent can't clearly understand what user wants him to do. It's better to clarify than to proceed blindly

### Hierarchical context isolation

Team lead (human or main AI) → teammates (large isolated tasks) → subagents (small focused actions). Skills are consumed by whichever layer is active. Skills recommend the hierarchy.

### Workflow alignment

The workflow is hierarchical, explicit, and deterministic. It is skill-driven. Workflow phases: high-level task design → detailed implementation planning → implementation → verification/fixing loop (majority of effort) → fresh-context re-verification (multiple times). Separate high level workflow docs will be created later.

## Conflict & Overlap Analysis

### Mutually exclusive (pick one or merge)

| Topic         | Skills                                                                    | Conflict                                                                                                    | Resolution                                                                                              |
| ------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| TDD           | Superpowers `test-driven-development` vs Addy `test-driven-development`   | Both define rigid red-green-refactor. Superpowers is dogmatic ("delete code before test"), Addy is moderate | Merge: Addy structure + Superpowers anti-rationalization, demote from Iron Law to recommended technique |
| Ideation      | Superpowers `brainstorming` vs Addy `idea-refine`                         | Both 3-phase ideation but different flows. Superpowers has HARD GATE, Addy is flexible                      | **Needs direct comparison before deciding**                                                             |
| Planning      | Superpowers `writing-plans` vs Addy `planning-and-task-breakdown`         | Both break work into tasks. Superpowers is rigid, Addy is practical (vertical slicing, dependency graphs)   | **Needs direct comparison before deciding**                                                             |
| Debugging     | Superpowers `systematic-debugging` vs Addy `debugging-and-error-recovery` | Same domain, different depth. Superpowers is deep, Addy is broader/shallower                                | Merge: Superpowers root-cause-first + Addy triage + error patterns. Drop pressure tests                 |
| Review        | Superpowers `requesting`+`receiving-code-review` vs Addy `code-review`    | Superpowers splits requesting/receiving + subagent pattern. Addy has 5-axis review in one skill             | Merge: Addy 5-axis + Superpowers verify-before-implementing-feedback. Drop mandatory subagent pattern   |
| Meta          | Superpowers `using-superpowers` vs Addy `using-agent-skills`              | Both define how to discover/load skills                                                                     | Merge into one lightweight bootstrap skill                                                              |
| Skill writing | Yours `how-to-write-skills` vs Superpowers `writing-skills`               | Yours is practical and portable. Superpowers is TDD-for-skills (655 lines)                                  | Keep yours as primary. Superpowers has some useful bits (discoverability, CSO) — cherry-pick if needed  |

### Complementary (coexist and enrich)

| Combination                                                 | How they complement                                                                          |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| prototype-first + any planning skill                        | Spike risky steps during planning. Doesn't replace planning — enriches it                    |
| prototype-first + systematic-debugging                      | When 3+ fixes fail, prototype the fix approach before committing                             |
| prototype-first + executing-plans                           | Spike risky plan steps before full implementation                                            |
| testing-python + TDD                                        | testing-python defines WHAT good tests look like. TDD defines WHEN to write them. Orthogonal |
| doubt-early + any skill                                     | Apply at any phase: doubt your spec, doubt your plan, doubt your implementation              |
| source-driven-development + any implementation skill        | "Check docs, not memory" applies everywhere                                                  |
| context-engineering + subagent-driven-development           | Context packing for subagent dispatch                                                        |
| spec-driven-development + planning                          | Spec comes first, then plan. Sequential but complementary                                    |
| verification-before-completion + incremental-implementation | Verify after each increment + final verification before marking done                         |
| incremental-implementation + git-workflow                   | Each increment → atomic commit                                                               |
| api-and-interface-design + architecting-changes             | Architecture skill routes to API design when change involves interfaces                      |
| deprecation-and-migration + api-and-interface-design        | API design should plan for deprecation from the start                                        |

## Philosophy Conflicts

| Conflict         | Your position (Python PHILOSOPHY.md)                           | Third-party position                                                                 | Resolution                                                                                                             |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Testing priority | E2e first, real over mocked, 20/80, trustworthiness > coverage | Superpowers TDD: unit test first, always. Addy TDD: red-green-refactor default       | Your testing philosophy → core PHILOSOPHY.md. TDD is a technique within that philosophy                                |
| Process gates    | prototype-first: "isolate, spike, capture outcome, move on"    | Superpowers: HARD GATE before implementation, 9-step brainstorming                   | Should check superpower's hard gate rules.                                                                             |
| Ceremony level   | "Do not turn verification into ritual"                         | Superpowers: Iron Laws, rationalization tables, pressure tests, 300-line enforcement | Principles over enforcement. Keep useful core idea, drop persuasive apparatus                                          |
| Agent autonomy   | After high-level agreement, agent should execute independently | Superpowers: agent stops to verify plan at every phase transition                    | Ceremony scales with task size. Clear high-level direction = less check-ins. Fails fast early if can't proceed clearly |

## Python Skills Generalization

6 of 9 PHILOSOPHY.md principles are fully language-agnostic and move to core:

| Principle                      | Moves to core? | Stays Python-specific            |
| ------------------------------ | -------------- | -------------------------------- |
| Pit of Success                 | Yes            | —                                |
| Explicitness Through Types     | Yes            | basedpyright, msgspec, reportAny |
| Fail Fast, Fail Early          | Yes            | —                                |
| Error Handling as Control Flow | Yes            | rusty-results specifically       |
| Testing Philosophy             | Yes            | —                                |
| Architecture: Separation       | Yes            | —                                |
| Tooling                        | No             | uv, basedpyright, ruff, pytest   |
| CLI/GUI choices                | No             | typer, PySide6, qasync           |
| Project Setup                  | Yes (concept)  | Python-specific tooling          |

## Proposed Final Skill List (draft, subject to change)

### Core Workflow Skills

| #   | Skill Name                       | Description                                                                                                                    | Primary Source                                                           |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1   | `using-skills`                   | Bootstrap: discover, load, combine skills. Lightweight, no Iron Laws                                                           | Merge: superpowers using-superpowers + addy using-agent-skills           |
| 2   | `how-to-write-skills`            | Author portable, discoverable, self-contained skills. Verification matched to complexity                                       | Personal                                                                 |
| 3   | `idea-refine`                    | 3-phase ideation: expand → converge → sharpen. Flexible, no hard gates. Includes refinement criteria and frameworks            | Addy (pending comparison with superpowers brainstorming)                 |
| 4   | `spec-driven-development`        | Write specs before code for significant changes. Gated but gates are recommendations                                           | Addy, softened                                                           |
| 5   | `planning-work`                  | Break work into ordered, verifiable tasks. Dependency graphs, vertical slicing, task sizing                                    | Merge (pending comparison of superpowers writing-plans vs addy planning) |
| 6   | `architecting-changes`           | Boundary placement, reusable core, composition vs inheritance, framework vs custom, wrapper decisions. Routes to domain skills | Generalized from Python architecting-python-changes                      |
| 7   | `incremental-implementation`     | Thin vertical slices: implement → test → verify → commit → next. Scope discipline, one thing at a time                         | Addy                                                                     |
| 8   | `systematic-debugging`           | No fixes without root cause. 4 phases: investigate → analyze → hypothesize → implement. Plus triage checklist                  | Merge: superpowers + addy                                                |
| 9   | `code-review`                    | 5-axis review. Verify before implementing feedback. Honest assessment, push back on incorrect suggestions                      | Merge: addy + superpowers                                                |
| 10  | `verification-before-completion` | No completion claims without fresh evidence. Calibrated to task size                                                           | Superpowers, softened                                                    |
| 11  | `finishing-a-development-branch` | Verify tests → detect environment → present options → cleanup                                                                  | Superpowers                                                              |
| 12  | `git-workflow`                   | Trunk-based, atomic commits, worktree isolation, save points, change summaries                                                 | Merge: addy + superpowers                                                |

### Cross-Cutting Enricher Skills

| #   | Skill Name                  | Description                                                                                                                                         | Primary Source       |
| --- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 13  | `prototype-first`           | Isolate risky assumptions, spike, capture outcome, update plan. Useful at any phase                                                                 | Personal             |
| 14  | `doubt-early`               | Fresh-context adversarial review before committing. Catches wrong solutions AND wrong problems (XY). Agent decides cross-model based on task scope. | Personal (from Addy) |
| 17  | `code-simplification`       | Preserve behavior, clarity over cleverness. Understand before touching. Incremental with verification                                               | Addy                 |

### Parallel/Agent Workflow Skills

| #   | Skill Name                    | Description                                                            | Primary Source |
| --- | ----------------------------- | ---------------------------------------------------------------------- | -------------- |
| 18  | `dispatching-parallel-agents` | One agent per independent domain. Focused prompts, specific output     | Superpowers    |
| 19  | `subagent-driven-development` | Dispatch fresh subagent per task with review. Optional for large tasks | Superpowers    |

### Research Skills

| #   | Skill Name                     | Description                                                                                             | Primary Source |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------- |
| 20  | `ai-edge-research`             | Research AI trends from practitioner signal. HN, GitHub, Reddit, Twitter, Telegram. Tier classification | Personal       |
| 21  | `upstream-source-research`     | Escalate web → CLI → shallow clone as needed. Temporary clone hygiene                                   | Personal       |
| 22  | `writing-upstream-bug-reports` | Structured bug reports as self-contained folders. Lead with symptoms, prove with evidence               | Personal       |

### Domain Skills (language-agnostic, per-project selection)

| #   | Skill Name                      | Description                                                                                                        | Primary Source             |
| --- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | -------------------------- |
| 23  | `api-and-interface-design`      | Contract-first, consistent errors, validate at boundaries, addition over modification, predictable naming          | Addy (generalize examples) |
| 24  | `security-and-hardening`        | Three-tier boundary system. OWASP Top 10 prevention. Input validation, secrets, rate limiting                      | Addy (generalize examples) |
| 25  | `performance-optimization`      | Measure before optimizing. Workflow: measure → identify → fix → verify → guard. Common anti-patterns               | Addy                       |
| 26  | `ci-cd-and-automation`          | Quality gate pipelines, feature flags, staged rollouts, rollback plans, dependabot                                 | Addy                       |
| 27  | `shipping-and-launch`           | Pre-launch checklist, feature flag strategy, staged rollout with thresholds, monitoring, rollback                  | Addy                       |
| 31  | `documentation-and-adrs`        | ADRs, inline docs, API docs, README structure, changelog                                                           | Addy                       |
| 32  | `test-driven-development`       | Red-green-refactor as recommended technique. When TDD adds value vs when other approaches are better               | Merge: addy + superpowers  |

### Python-Specific Skills (reference core PHILOSOPHY.md)

| #   | Skill Name                    | Description                                                                                | Change from current                     |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------- |
| 33  | `writing-python-code`         | basedpyright strict, msgspec, rusty-results, async, type narrowing, ruff rules, banned-api | Remove generic philosophy (ref core)    |
| 34  | `testing-python`              | pytest config, fixtures, mock servers, containerized testing, CLI/e2e patterns             | Remove generic testing philosophy       |
| 35  | `architecting-python-changes` | Router to Python architecture skills. Python-specific layering decisions                   | Remove generic heuristics (ref core)    |
| 36  | `building-python-backends`    | Thin transport, Result-to-HTTP, transactions, auth boundaries, workers, idempotency        | No change                               |
| 37  | `building-multi-ui-apps`      | Multi-interface: reusable core, thin adapters, composition root, entry point router        | Generalize arch concept, keep Python ex |
| 38  | `building-qt-apps`            | PySide6 + qasync, Manager→Service→Wrapper, signals, system tray, testing                   | No change                               |
| 39  | `setting-up-logging`          | colorlog, rotating file logs, CLI vs GUI vs server modes                                   | No change                               |
| 40  | `setting-up-python-backends`  | Backend bootstrap: FastAPI vs Django, layout, app factory, config, migrations              | No change                               |
| 41  | `setting-up-python-projects`  | General project bootstrap: shape, directory structure, pyproject.toml, pre-commit, uv sync | No change                               |
| 42  | `setting-up-shortcuts`        | Keyboard shortcuts for PySide6: ActionShortcut, TOML config, platform defaults             | No change                               |
| 43  | `writing-python-scripts`      | Single-file PEP 723 scripts: inline deps, uv run --script, typer, Ctrl+C handling          | No change                               |

### Removed / Merged Away

| Removed                                            | Reason                                         |
| -------------------------------------------------- | ---------------------------------------------- |
| Superpowers `brainstorming`                        | Pending comparison with addy idea-refine       |
| Superpowers `writing-skills`                       | Personal how-to-write-skills is sufficient     |
| Superpowers `using-superpowers`                    | Merged into using-skills                       |
| Addy `using-agent-skills`                          | Merged into using-skills                       |
| Addy `contect-engineering`                         | Generally not needed                           |
| Addy `source-driven-development`                   | Too opinionated                                |
| Superpowers `executing-plans`                      | Merged into incremental-implementation         |
| Superpowers `writing-plans`                        | Merged into planning-work (pending comparison) |
| Superpowers `test-driven-development` (standalone) | Merged into demoted test-driven-development    |
| Addy `test-driven-development` (standalone)        | Same merge                                     |
| Addy `browser-testing-with-devtools`               | Will enroll my own later                       |
| Addy `deprecation-and-migration`                   | Not need for my cases                          |
| Addy `frontend-ui-engineering`                     | Too opinionated, will enroll my own            |
| Superpowers `requesting-code-review`               | Merged into code-review                        |
| Superpowers `receiving-code-review`                | Merged into code-review                        |

## Skill Relationship Map

```
WORKFLOW PHASES          SKILLS (with cross-cutting enrichers)

IDEATION ──────────── idea-refine / brainstorming (TBD)
                      │
                      ├── enriched by: doubt-early
                      ├── enriched by: prototype-first (spike risky assumptions)
                      │
DESIGN/SPEC ───────── spec-driven-development
                      │
                      ├── enriched by: doubt-early (adversarial review)
                      ├── enriched by: api-and-interface-design
                      ├── enriched by: architecting-changes
                      │
PLANNING ───────────── planning-work
                      │
                      ├── enriched by: prototype-first (validate plan assumptions)
                      │
IMPLEMENTATION ─────── incremental-implementation
                      │               │
                      │               ├── subagent-driven-development (parallel)
                      │               └── dispatching-parallel-agents (independent tasks)
                      │
                      ├── enriched by: code-simplification (simplest thing first)
                      ├── enriched by: prototype-first (spike before commit)
                      │
DEBUGGING ──────────── systematic-debugging
                      │
                      ├── enriched by: prototype-first (3+ fixes → spike)
                      │
REVIEW ─────────────── code-review
                      │
                      ├── enriched by: doubt-early (adversarial review)
                      │
VERIFICATION ───────── verification-before-completion
                      │
FINISHING ──────────── finishing-a-development-branch
                                   git-workflow

ALWAYS AVAILABLE (cross-cutting):
  ├── using-skills (bootstrap/meta)
  ├── how-to-write-skills
  └── doubt-early

RESEARCH (on-demand):
  ├── ai-edge-research
  ├── upstream-source-research
  └── writing-upstream-bug-reports

DOMAIN-SPECIFIC (per-project):
  ├── security-and-hardening
  ├── performance-optimization
  ├── ci-cd-and-automation
  ├── shipping-and-launch
  └── documentation-and-adrs

PYTHON-SPECIFIC (per-project):
  ├── writing-python-code
  ├── testing-python
  ├── architecting-python-changes
  ├── building-python-backends
  ├── building-multi-ui-apps
  ├── building-qt-apps
  ├── setting-up-logging
  ├── setting-up-python-backends
  ├── setting-up-python-projects
  ├── setting-up-shortcuts
  └── writing-python-scripts
```

## Progress

- [x] Full skill inventory across all 4 sources
- [x] Conflict and overlap analysis
- [x] Philosophy conflict identification
- [x] Python generalization analysis
- [x] Design principles agreed
- [x] Proposed final skill list (draft)
- [x] Skill relationship map
- [ ] Direct comparison: brainstorming vs idea-refine
- [ ] Direct comparison: writing-plans vs planning-and-task-breakdown
- [ ] Write core PHILOSOPHY.md (generalized from Python)
- [x] Batch 1: cross-cutting enrichers (prototype-first ✓, doubt-early ✓, source-driven ⛌, context-engineering ⛌, code-simplification ✓)
- [x] Batch 2: domain skills (api-design ✓, security ✓, perf ✓, ci-cd ✓, shipping ✓, frontend ⛌, devtools ⛌, deprecation ⛌, docs ✓)
- [ ] Batch 3: core workflow skills
- [ ] Batch 4: parallel/agent skills
- [ ] Batch 5: Python skill set refactoring
- [ ] Batch 6: using-skills bootstrap + how-to-write-skills review
- [ ] Workflow documentation (separate from skills)
