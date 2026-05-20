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

| Topic         | Skills                                                                    | Conflict                                                                                                    | Resolution                                                                                                 |
| ------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| TDD           | Superpowers `test-driven-development` vs Addy `test-driven-development`   | Both define rigid red-green-refactor. Superpowers is dogmatic ("delete code before test"), Addy is moderate | Merge: Addy structure + Superpowers anti-rationalization, demote from Iron Law to recommended technique    |
| Ideation      | Superpowers `brainstorming` vs Addy `idea-refine`                         | Both 3-phase ideation but different flows. Superpowers has HARD GATE, Addy is flexible                      | Split into `idea-sharpening` for strategic ideation and `brainstorming` for technical specs                |
| Planning      | Superpowers `writing-plans` vs Addy `planning-and-task-breakdown`         | Both break work into tasks. Superpowers is rigid, Addy is practical (vertical slicing, dependency graphs)   | Merge into `planning-implementation`: Addy structure plus selected Superpowers no-placeholder/review rules |
| Debugging     | Superpowers `systematic-debugging` vs Addy `debugging-and-error-recovery` | Same domain, different depth. Superpowers is deep, Addy is broader/shallower                                | Merge: Superpowers root-cause-first + Addy triage + error patterns. Drop pressure tests                    |
| Review        | Superpowers `requesting`+`receiving-code-review` vs Addy `code-review`    | Superpowers splits requesting/receiving + subagent pattern. Addy has 5-axis review in one skill             | Merge: Addy 5-axis + Superpowers verify-before-implementing-feedback. Drop mandatory subagent pattern      |
| Meta          | Superpowers `using-superpowers` vs Addy `using-agent-skills`              | Both define how to discover/load skills                                                                     | Merge into one lightweight bootstrap skill                                                                 |
| Skill writing | Yours `how-to-write-skills` vs Superpowers `writing-skills`               | Yours is practical and portable. Superpowers is TDD-for-skills (655 lines)                                  | Keep yours as primary. Superpowers has some useful bits (discoverability, CSO) — cherry-pick if needed     |

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

| Conflict         | Your position (Python `.tmp/.../PHILOSOPHY.md`)                | Third-party position                                                                 | Resolution                                                                                                             |
| ---------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Testing priority | E2e first, real over mocked, 20/80, trustworthiness > coverage | Superpowers TDD: unit test first, always. Addy TDD: red-green-refactor default       | Your testing philosophy → `ENGINEERING-PHILOSOPHY.md`. TDD is a technique within that philosophy                       |
| Process gates    | prototype-first: "isolate, spike, capture outcome, move on"    | Superpowers: HARD GATE before implementation, 9-step brainstorming                   | Should check superpower's hard gate rules.                                                                             |
| Ceremony level   | "Do not turn verification into ritual"                         | Superpowers: Iron Laws, rationalization tables, pressure tests, 300-line enforcement | Principles over enforcement. Keep useful core idea, drop persuasive apparatus                                          |
| Agent autonomy   | After high-level agreement, agent should execute independently | Superpowers: agent stops to verify plan at every phase transition                    | Ceremony scales with task size. Clear high-level direction = less check-ins. Fails fast early if can't proceed clearly |

## Python Skills Generalization

6 of 9 principles from Python `.tmp/.../PHILOSOPHY.md` are fully language-agnostic and moved to `ENGINEERING-PHILOSOPHY.md`:

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

| #   | Skill Name                       | Description                                                                                                                    | Primary Source                                                                               |
| --- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| 1   | `using-skills`                   | Bootstrap: discover, load, combine skills. Lightweight, no Iron Laws                                                           | Merge: superpowers using-superpowers + addy using-agent-skills                               |
| 2   | `how-to-write-skills`            | Author portable, discoverable, self-contained skills. Verification matched to complexity                                       | Personal                                                                                     |
| 3   | `idea-sharpening`                | Complex ideation: expand → converge → sharpen. Flexible, no hard gates. Includes refinement criteria and frameworks            | Addy idea-refine                                                                             |
| 4   | `brainstorming`                  | Technical spec creation for understood features: architecture, components, data flow, success criteria                         | Merge: superpowers brainstorming + Addy spec patterns                                        |
| 5   | `planning-implementation`        | Break work into ordered, verifiable tasks. Dependency graphs, vertical slicing, task sizing                                    | Merge: addy planning + superpowers writing-plans (resolved in skills-for-planning-design.md) |
| 6   | `architecting-changes`           | Boundary placement, reusable core, composition vs inheritance, framework vs custom, wrapper decisions. Routes to domain skills | Generalized from Python architecting-python-changes                                          |
| 7   | `incremental-implementation`     | Thin vertical slices: implement → test → verify → commit → next. Scope discipline, one thing at a time                         | Addy                                                                                         |
| 8   | `systematic-debugging`           | No fixes without root cause. 4 phases: investigate → analyze → hypothesize → implement. Plus triage checklist                  | Merge: superpowers + addy                                                                    |
| 9   | `code-review`                    | 5-axis review. Verify before implementing feedback. Honest assessment, push back on incorrect suggestions                      | Merge: addy + superpowers                                                                    |
| 10  | `verification-before-completion` | No completion claims without fresh evidence. Calibrated to task size                                                           | Superpowers, softened                                                                        |
| 11  | `finishing-a-development-branch` | Verify tests → detect environment → present options → cleanup                                                                  | Superpowers                                                                                  |
| 12  | `git-workflow`                   | Trunk-based, atomic commits, worktree isolation, save points, change summaries                                                 | Merge: addy + superpowers                                                                    |

### Cross-Cutting Enricher Skills

| #   | Skill Name            | Description                                                                                                                                         | Primary Source       |
| --- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| 13  | `prototype-first`     | Isolate risky assumptions, spike, capture outcome, update plan. Useful at any phase                                                                 | Personal             |
| 14  | `doubt-early`         | Fresh-context adversarial review before committing. Catches wrong solutions AND wrong problems (XY). Agent decides cross-model based on task scope. | Personal (from Addy) |
| 17  | `code-simplification` | Preserve behavior, clarity over cleverness. Understand before touching. Incremental with verification                                               | Addy                 |

### Parallel/Agent Workflow Skills

| #   | Skill Name                            | Description                                                                                       | Primary Source |
| --- | ------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| 18  | `when-and-how-to-run-parallel-agents` | Decide when independent work can be parallelized; focused prompts, dependency checks, integration | Superpowers    |
| 19  | `subagent-driven-development`         | Dispatch fresh subagent per task with review. Optional for large tasks                            | Superpowers    |

### Research Skills

| #   | Skill Name                     | Description                                                                                             | Primary Source |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------- | -------------- |
| 20  | `ai-edge-research`             | Research AI trends from practitioner signal. HN, GitHub, Reddit, Twitter, Telegram. Tier classification | Personal       |
| 21  | `upstream-source-research`     | Escalate web → CLI → shallow clone as needed. Temporary clone hygiene                                   | Personal       |
| 22  | `writing-upstream-bug-reports` | Structured bug reports as self-contained folders. Lead with symptoms, prove with evidence               | Personal       |

### Domain Skills (language-agnostic, per-project selection)

| #   | Skill Name                 | Description                                                                                               | Primary Source             |
| --- | -------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------- |
| 23  | `api-and-interface-design` | Contract-first, consistent errors, validate at boundaries, addition over modification, predictable naming | Addy (generalize examples) |
| 24  | `security-and-hardening`   | Three-tier boundary system. OWASP Top 10 prevention. Input validation, secrets, rate limiting             | Addy (generalize examples) |
| 25  | `performance-optimization` | Measure before optimizing. Workflow: measure → identify → fix → verify → guard. Common anti-patterns      | Addy                       |
| 26  | `ci-cd-and-automation`     | Quality gate pipelines, feature flags, staged rollouts, rollback plans, dependabot                        | Addy                       |
| 27  | `shipping-and-launch`      | Pre-launch checklist, feature flag strategy, staged rollout with thresholds, monitoring, rollback         | Addy                       |
| 31  | `documentation-and-adrs`   | ADRs, inline docs, API docs, README structure, changelog                                                  | Addy                       |
| 32  | `test-driven-development`  | Red-green-refactor as recommended technique. When TDD adds value vs when other approaches are better      | Merge: addy + superpowers  |

### Python-Specific Skills (reference core ENGINEERING-PHILOSOPHY.md and Python `.tmp/.../PHILOSOPHY.md`)

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

| Removed                                            | Reason                                                                              |
| -------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Superpowers `brainstorming` hard-gate workflow     | Split/softened into `brainstorming`; visual companion extracted to `visual-mockups` |
| Superpowers `writing-skills`                       | Personal how-to-write-skills is sufficient                                          |
| Superpowers `using-superpowers`                    | Merged into using-skills                                                            |
| Addy `using-agent-skills`                          | Merged into using-skills                                                            |
| Addy `contect-engineering`                         | Generally not needed                                                                |
| Addy `source-driven-development`                   | Too opinionated                                                                     |
| Addy `spec-driven-development` workflow governance | Too high level; spec patterns absorbed into `brainstorming`                         |
| Superpowers `executing-plans`                      | Merged into incremental-implementation                                              |
| Superpowers `writing-plans`                        | Merged into planning-implementation (resolved)                                      |
| Superpowers `test-driven-development` (standalone) | Merged into demoted test-driven-development                                         |
| Addy `test-driven-development` (standalone)        | Same merge                                                                          |
| Addy `browser-testing-with-devtools`               | Will enroll my own later                                                            |
| Addy `deprecation-and-migration`                   | Not need for my cases                                                               |
| Addy `frontend-ui-engineering`                     | Too opinionated, will enroll my own                                                 |
| Superpowers `requesting-code-review`               | Merged into code-review                                                             |
| Superpowers `receiving-code-review`                | Merged into code-review                                                             |

## Skill Relationship Map

```
WORKFLOW PHASES          SKILLS (with cross-cutting enrichers)

IDEATION ──────────── idea-sharpening ✓
                      │
                      ├── enriched by: doubt-early
                      ├── enriched by: prototype-first (spike risky assumptions)
                      │
DESIGN/SPEC ───────── brainstorming ✓
                      │
                      ├── enriched by: doubt-early (adversarial review)
                      ├── enriched by: api-and-interface-design
                      ├── enriched by: architecting-changes
                      │
PLANNING ───────────── planning-implementation ✓
                      │
                      ├── enriched by: prototype-first (validate plan assumptions) and doubt-early
                      │
IMPLEMENTATION ─────── incremental-implementation
                      │               │
                      │               ├── subagent-driven-development (parallel)
                      │               └── when-and-how-to-run-parallel-agents (independent tasks)
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
  ├── how-to-write-skills ✓
  └── doubt-early ✓

RESEARCH (on-demand):
  ├── ai-edge-research ✓
  ├── upstream-source-research ✓
  └── writing-upstream-bug-reports ✓

DOMAIN-SPECIFIC (per-project):
  ├── security-and-hardening ✓
  ├── performance-optimization ✓
  ├── ci-cd-and-automation ✓
  ├── shipping-and-launch ✓
  └── documentation-and-adrs ✓

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
- [x] Direct comparison: brainstorming vs idea-refine — resolved in skills-for-planning-design.md
- [x] Direct comparison: writing-plans vs planning-and-task-breakdown — resolved in skills-for-planning-design.md
- [x] Write core ENGINEERING-PHILOSOPHY.md (generalized from Python)
- [x] Batch 1: cross-cutting enrichers (prototype-first ✓, doubt-early ✓, source-driven ⛌, context-engineering ⛌, code-simplification ✓)
- [x] Batch 2: domain skills (api-design ✓, security ✓, perf ✓, ci-cd ✓, shipping ✓, frontend ⛌, devtools ⛌, deprecation ⛌, docs ✓)
- [x] Batch 3a: planning pipeline (idea-sharpening ✓, brainstorming ✓, planning-implementation ✓)
- [ ] Batch 3b: remaining core workflow skills, ordered by complexity and dependencies

  ### Complexity model

  Complexity is estimated by:

  - **Source volume:** number and size of source/aux files to read and merge.
  - **Workflow rigidity:** how much Superpowers-style mandatory process must be removed.
  - **Philosophy mismatch:** conflict with `ENGINEERING-PHILOSOPHY.md` and `docs/my-workflow-draft.md`.
  - **Dependencies:** whether other local skills must exist first.

  The goal is not to port everything before uninstalling Superpowers. The goal is to remove Superpowers as a dependency safely. Some draft final-list skills are deferable if no active workflow or bootstrap references them.

  ### Minimum Superpowers uninstall path

  Required before uninstall:

  - [ ] `architecting-changes` core exists, so later workflow skills inherit local philosophy instead of Superpowers-style hard gates. Partial: draft core exists, Python-specific routes are TODOs until Batch 5.
  - [x] `incremental-implementation` exists as the lightweight execution discipline for multi-step work.
  - [x] Minimal `git-workflow` exists, focused on local safety and atomic changes without duplicating platform git rules.
  - [ ] Minimal `finishing-a-development-branch` exists as a decision aid after work is verified.
  - [ ] `code-review` exists in softened/split form, covering review and review-feedback handling without mandatory subagent ceremony.
  - [ ] Final `using-skills` bootstrap exists after the local skill map is stable.
  - [ ] `.agents/skills` and `.claude/skills` are synced from `skills/`.
  - [ ] Superpowers-disabled dry run passes: bootstrap behavior works and no active docs/configs require `using-superpowers` or Superpowers-only skill names.

  Defer unless proven active:

  - `subagent-driven-development`
  - Python skill refactoring batch
  - deep `how-to-write-skills` review/cherry-pick from Superpowers `writing-skills`
  - full TDD port

  ### Source skill inventory (remaining core and uninstall-related groups)

  | Target Skill                        | SP Source                                      | Addy Source                  | Python Source               | SP Aux                       |
  | ----------------------------------- | ---------------------------------------------- | ---------------------------- | --------------------------- | ---------------------------- |
  | verification-before-completion      | verification-before-completion                 | —                            | —                           | Clean                        |
  | systematic-debugging                | systematic-debugging                           | debugging-and-error-recovery | —                           | 10 aux (3 useful, 7 discard) |
  | code-review                         | requesting-code-review + receiving-code-review | code-review-and-quality      | —                           | 1 aux (code-reviewer.md)     |
  | incremental-implementation          | executing-plans (thin, skip)                   | incremental-implementation   | —                           | Clean                        |
  | finishing-a-development-branch      | finishing-a-development-branch                 | —                            | —                           | Clean                        |
  | git-workflow                        | using-git-worktrees                            | git-workflow-and-versioning  | —                           | Clean                        |
  | architecting-changes                | —                                              | —                            | architecting-python-changes | Clean                        |
  | when-and-how-to-run-parallel-agents | dispatching-parallel-agents                    | —                            | —                           | Clean                        |
  | subagent-driven-development         | subagent-driven-development                    | —                            | —                           | 3 prompt templates           |
  | test-driven-development             | test-driven-development                        | test-driven-development      | —                           | testing-anti-patterns.md     |
  | using-skills                        | using-superpowers                              | using-agent-skills           | —                           | tool mapping references      |
  | how-to-write-skills review          | writing-skills                                 | —                            | —                           | 6 aux files                  |

  ### Complexity-ordered subtask breakdown

  #### Completed: `verification-before-completion` ✓

  - [x] Read SP source skill, compare with existing engineering-philosophy.md (testing philosophy)
  - [x] Reviewed options: tone (forceful vs technical), scope (standalone vs embedded), overlap with philosophy doc, gate function style
  - [x] Added "When Verification Fails Repeatedly" section — converging vs diverging validation loop, escalation pattern, doubt-early reference
  - [x] Updated Red Flags + Rationalization tables with diverging-loop patterns
  - [x] Write final `skills/verification-before-completion/SKILL.md`

  #### Completed: `systematic-debugging` — split into 3 skills ✓

  - [x] Decision: split into 3 skills (systematic-debugging + bug-root-cause-tracing + bug-protection-multi-layered)
  - [x] Created design doc: `docs/debugging-skills-design.md`
  - [x] SP `root-cause-tracing.md` → rewritten as standalone `skills/bug-root-cause-tracing/SKILL.md` (language-agnostic, cross-refs)
  - [x] SP `defense-in-depth.md` → rewritten as standalone `skills/bug-protection-multi-layered/SKILL.md` (4-layer pattern, language-agnostic)
  - [x] SP `systematic-debugging/SKILL.md` + Addy `debugging-and-error-recovery/SKILL.md` → merged as `skills/systematic-debugging/SKILL.md`
  - [x] Discarded SP aux: condition-based-waiting.md + .ts, find-polluter.sh, CREATION-LOG.md, test-*.md
  - [x] Review all 3 skills: match quality bar of existing skills

  #### Group 1: `architecting-changes` core — low-medium complexity, partial ✓

  Estimate:

  - Source volume: low (`architecting-python-changes`, 118 lines + `ENGINEERING-PHILOSOPHY.md`).
  - Workflow rigidity: low.
  - Philosophy mismatch: low if kept as a decision/router skill.
  - Dependencies: none for the core language-agnostic version.

  Status: draft core is written and discoverable. It is good enough to shape the next workflow ports, but not final because Python-specific routes remain TODOs.

  Scope:

  - [x] Read Python `architecting-python-changes` as base.
  - [x] Split core architecture decision guidance from Python-specific routing.
  - [x] Reference `ENGINEERING-PHILOSOPHY.md` instead of duplicating its heuristics.
  - [x] Generalize the classify → identify architecture question → route pattern.
  - [x] Route to existing language-agnostic domain skills only (`api-design`, `security-and-hardening`, `performance-optimization`, `documentation-and-adrs`, etc.).
  - [x] Defer Python-specific routes to Batch 5.
  - [x] Write `skills/architecting-changes/SKILL.md`.
  - [x] Review: matches quality bar and does not become a high-level workflow controller.

  #### Group 2: `incremental-implementation` — medium complexity ✓

  Estimate:

  - Source volume: medium (Addy 245 lines + SP `executing-plans` 70 lines).
  - Workflow rigidity: medium, because SP `executing-plans` implies execute-all and mandatory finish behavior.
  - Philosophy mismatch: low-medium after softening.
  - Dependencies: `planning-implementation` and `verification-before-completion` already exist.

  Status: written as an Addy-primary execution discipline with local adjustments. Fast feedback favors lint/typecheck over running full tests too often; tests/manual checks happen at meaningful checkpoints. Simplicity is bounded by plan and architecture. Safe-defaults section was intentionally omitted. Agent-workflow references remain TODO until related skills are ported.

  Scope:

  - [x] Read Addy `incremental-implementation` as primary source.
  - [x] Verify SP `executing-plans` contributes only small useful ideas: critical plan review, stop on blockers, follow verification steps.
  - [x] Remove mandatory execute-all, mandatory commit, and mandatory finishing-branch semantics.
  - [x] Align with `planning-implementation` as execution discipline after a plan exists.
  - [x] Write `skills/incremental-implementation/SKILL.md`.
  - [x] Review: matches quality bar and keeps ceremony task-sized.

  #### Group 3: `when-and-how-to-run-parallel-agents` — low-medium complexity ✓

  Estimate:

  - Source volume: low (SP 182 lines).
  - Workflow rigidity: low-medium, because agent dispatch must remain optional and scoped.
  - Philosophy mismatch: low; aligns with hierarchical context isolation.
  - Dependencies: none unless `subagent-driven-development` is in scope.

  Status: written as a dependency-aware parallelization decision skill. It keeps the core idea of one agent per independent problem domain, adds explicit dependency-chain checks, and requires orchestrator integration after agents return.

  Scope:

  - [x] Read SP `dispatching-parallel-agents`.
  - [x] Keep the core idea: one agent per independent problem domain with focused prompts.
  - [x] Make use conditional: only for independent work with no shared state or sequential dependency.
  - [x] Add dependency rule: if task 2 requires task 1's output or decision, they cannot run in parallel.
  - [x] Remove platform-specific examples where possible; keep OpenCode-compatible wording.
  - [x] Write `skills/when-and-how-to-run-parallel-agents/SKILL.md`.
  - [x] Review: does not encourage parallelism when a single root cause is likely.

  #### Group 4: `git-workflow` — medium complexity ✓

  Estimate:

  - Source volume: medium-high (Addy 300 lines + SP `using-git-worktrees` 215 lines).
  - Workflow rigidity: medium.
  - Philosophy mismatch: low-medium; must avoid duplicating platform safety rules or forcing commits.
  - Dependencies: needed by `finishing-a-development-branch`; optional for general implementation.

  Status: written as a merged git change-management skill. Addy provides broad branch/commit/history discipline; Superpowers provides isolation detection and harness-aware worktree rules. Local notes added repository-init policy, worktree location policy, baseline health-check nuance, generated-file/hook scope, and parallel-agent worktree guidance.

  Scope:

  - [x] Compare Addy (atomic commits, trunk-based, branch hygiene, change summaries) vs SP (worktree isolation).
  - [x] Keep git workflow as guidance, not a hard requirement for every trivial edit.
  - [x] Absorb worktree guidance as one technique chapter, not a separate mandatory skill.
  - [x] Remove Superpowers path assumptions such as `~/.config/superpowers/worktrees/`; use `~/.config/myai/worktrees` for external worktrees.
  - [x] Avoid destructive command recipes unless guarded by explicit user confirmation.
  - [x] Write `skills/git-workflow/SKILL.md`.
  - [x] Review: does not conflict with OpenCode git safety instructions.

  #### Group 5: `finishing-a-development-branch` — medium complexity, split recommended

  Estimate:

  - Source volume: medium (SP 251 lines).
  - Workflow rigidity: medium-high, because the source prescribes exact menus and cleanup behavior.
  - Philosophy mismatch: medium; should be a decision aid, not a forced branch lifecycle.
  - Dependencies: `git-workflow`, `verification-before-completion`.

  Scope:

  - [ ] Read SP source and identify worktree-heavy assumptions.
  - [ ] First port: lightweight finish options after implementation is verified.
  - [ ] Present clear choices: keep branch, create PR, merge locally, cleanup/discard only with explicit confirmation.
  - [ ] Defer detailed merge/worktree cleanup mechanics unless needed.
  - [ ] Ensure integration with `git-workflow`.
  - [ ] Write `skills/finishing-a-development-branch/SKILL.md`.
  - [ ] Review: no Superpowers-owned cleanup assumptions, no destructive flow without confirmation.

  #### Group 6: `code-review` — medium-high complexity, split recommended

  Estimate:

  - Source volume: high (Addy 347 + SP requesting 103 + SP receiving 213 + reviewer template 168).
  - Workflow rigidity: medium-high, because SP requesting pushes subagent review checkpoints.
  - Philosophy mismatch: medium; review should be calibrated, skeptical, and not performative.
  - Dependencies: `security-and-hardening`, `performance-optimization`, `verification-before-completion` already exist. Useful before `subagent-driven-development`.

  Scope:

  - [ ] Compare Addy (what: 5-axis review, checklist, sizing) vs SP requesting (when/how: subagent dispatch) vs SP receiving (psychology: verify before implement, no performative agreement)
  - [ ] Split conceptually into: reviewing code, receiving review feedback, and requesting fresh-context review.
  - [ ] Identify merge plan: Addy's 5-axis as core framework + SP receiving as "how to handle feedback" section + SP requesting distilled to optional fresh-context/subagent pattern.
  - [ ] Embed `code-reviewer.md` aux as a compact template block in the main skill body only if it stays useful after shortening.
  - [ ] Note cross-link: security section references `security-and-hardening` skill, performance references `performance-optimization`
  - [ ] Write `skills/code-review/SKILL.md`
  - [ ] Review: matches quality bar, no mandatory review-after-every-task rule.

  #### Group 7: `test-driven-development` — high complexity, do not direct-port

  Estimate:

  - Source volume: high (SP 371 + SP anti-patterns 299 + Addy 383).
  - Workflow rigidity: very high in SP source.
  - Philosophy mismatch: high; local testing philosophy values trustworthy integration/e2e tests and treats TDD as a technique, not an Iron Law.
  - Dependencies: `verification-before-completion`; may relate to future Python `testing-python`.

  Scope:

  - [ ] Treat as a new testing-strategy / prove-it-pattern skill, not a direct TDD port.
  - [ ] Keep red-green-refactor as recommended when it adds value.
  - [ ] Preserve bug reproduction before fix where practical.
  - [ ] Remove delete-production-code Iron Law and universal test-first requirement.
  - [ ] Align with `ENGINEERING-PHILOSOPHY.md` testing section: trustworthy tests over coverage, integration/e2e first where they prove more.
  - [ ] Decide final name later: keep `test-driven-development` for compatibility or rename to a broader testing skill.

  #### Group 8: `subagent-driven-development` — high complexity, conditional/deferable

  Estimate:

  - Source volume: high (SP 279 + prompt templates totaling ~199 lines).
  - Workflow rigidity: very high; two-stage review, continuous execution, commits, and final finishing flow are prescribed.
  - Philosophy mismatch: high risk of turning skills into high-level workflow driver.
  - Dependencies: `planning-implementation`, `incremental-implementation`, `when-and-how-to-run-parallel-agents`, `code-review`, `git-workflow`, `verification-before-completion`.

  Scope:

  - [ ] Defer unless current workflow actively needs it.
  - [ ] If ported, keep as an optional pattern for large implementation plans, not default execution.
  - [ ] Rework prompt templates into compact inline examples or keep only if they remain reusable.
  - [ ] Remove mandatory commits and mandatory final branch completion.
  - [ ] Align with `docs/my-workflow-draft.md`: high-level workflow is orchestrated explicitly, not auto-triggered by skills.

- [ ] Batch 4: parallel/agent skills (`when-and-how-to-run-parallel-agents` first ✓; `subagent-driven-development` conditional)
- [ ] Batch 5: Python skill set refactoring (deferred from Superpowers uninstall path unless active workflows require it)
- [ ] Batch 6: `using-skills` bootstrap + `how-to-write-skills` review

  #### Batch 6a: `using-skills` — highest dependency sensitivity, do last

  Estimate:

  - Source volume: medium (SP bootstrap 117 + Addy 180 + tool mapping refs).
  - Workflow rigidity: very high in SP source.
  - Philosophy mismatch: high unless rewritten around local principles.
  - Dependencies: final local skill map and decisions about deferred/retired skills.

  Scope:

  - [ ] Port after the replacement set is stable.
  - [ ] Encode: skills are low-level aids; high-level workflow is explicit orchestration.
  - [ ] Encode: ceremony scales with task size.
  - [ ] Encode: fail fast on real ambiguity or invalid environment, but do not force every phase.
  - [ ] Route common intents to local skill names only.
  - [ ] Include tool mappings only if still needed for portability.
  - [ ] Run Superpowers-disabled dry run before uninstall.

  #### Batch 6b: `how-to-write-skills` review — deferable

  Estimate:

  - Source volume: high (SP `writing-skills` 655 + 6 aux files).
  - Workflow rigidity: high; SP treats skill writing as TDD with pressure tests.
  - Philosophy mismatch: medium-high; current local skill is already concise and practical.
  - Dependencies: none.

  Scope:

  - [ ] Defer unless a concrete missing behavior is identified.
  - [ ] Cherry-pick only targeted ideas such as discoverability, prompt pressure testing, or compact scenario verification.
  - [ ] Do not import SP ceremony wholesale.

- [ ] Workflow documentation (separate from skills)
- [x] Extract `visual-mockups` as standalone aux skill (in-browser UI mockups for brainstorming/spec phase)
