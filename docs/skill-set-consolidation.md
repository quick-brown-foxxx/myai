# Skill Set Consolidation

## Goal

Build one unified, language-agnostic skill set by cherry-picking from four
sources, resolving conflicts, and moving generic Python rules into core
principles. Framework and language-specific skills remain per-project layers.

This is the main tracking doc. Keep it compact: decisions, current status,
remaining blockers, and deferred work only.

## Sources

| Source | Location | Role |
| --- | --- | --- |
| Personal | `skills/` | Primary local style: pragmatic, lightweight, language-agnostic |
| Superpowers | `.tmp/superpowers/skills/` | Useful workflow ideas, often too rigid |
| Addy | `.tmp/addy-agent-skills/skills/` | Balanced workflow and web/TS practices |
| Python | `.tmp/my_coding_rules_python/skills/` | Strict Python specifics; generic ideas moved to core philosophy |

## Global Decisions

- Skills describe reusable workflow and knowledge; higher-level workflow lives
  above skills and composes them explicitly.
- Ceremony scales with task size. Small clear tasks should not require heavy
  replanning; large ambiguous work still needs deliberate design.
- Hard gates are allowed only for real ambiguity, invalid environment, missing
  source state, or unsafe continuation.
- There are two current agent hierarchy shapes: big sessions use
  `User -> Teamlead -> Teammates -> Subagents`; bounded sessions use
  `User -> Orchestrator -> Subagents`.
- If an agent is unsure whether it is Teamlead, Orchestrator, Teammate, or
  Subagent, it should assume Orchestrator.
- Subagents never spawn children or decide higher-level phase transitions; they
  report evidence, blockers, changed files or sources inspected, risks, and next options.
- Workflow phases are explicit: design -> implementation planning -> execution
  -> verification/fixing loop -> fresh-context re-verification -> finish.

## Philosophy Decisions

| Topic | Decision |
| --- | --- |
| Testing | Trustworthy integration/e2e behavior over coverage. TDD is a technique, not a universal law. |
| Process gates | Keep fail-fast behavior for true blockers; remove persuasive Iron Law ceremony. |
| Agent autonomy | After clear high-level direction, agents execute independently until a real blocker appears. |
| Explicitness | Prefer typed boundaries, validation, Result-style expected failures, and simple readable code. |
| Architecture | Layer by responsibility; share stable contracts across applications before sharing implementation. |

## Python Generalization

| Python principle | Core location | Python-specific remainder |
| --- | --- | --- |
| Pit of success | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` | Tool choices per project |
| Explicitness through types | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` | basedpyright, msgspec, reportAny |
| Fail fast | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` | Python preflight specifics |
| Error handling as control flow | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` | rusty-results usage |
| Testing philosophy | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` | pytest fixtures, containers, CLI/e2e patterns |
| Architecture separation | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` | Python routers and backend/UI patterns |
| Project setup | `ENGINEERING-PHILOSOPHY.md` and `engineering-principles` conceptually | uv, ruff, basedpyright, pytest, PySide6, typer |

## Current Skill Inventory

### Core Workflow

| Skill | Status | Notes |
| --- | --- | --- |
| `using-my-skills` | done | Compact local bootstrap plus role hierarchy, workflow routing, ceremony scaling, and Claude/OpenCode injector support. |
| `engineering-principles` | done | Installable agent-facing copy of the engineering philosophy; loaded before coding-related work. |
| `how-to-write-skills` | exists | Already existed before starting. |
| `idea-sharpening` | done | Strategic ideation: expand, converge, sharpen. |
| `brainstorming` | done | Technical spec creation for understood features. |
| `planning-implementation` | done | Ordered, verifiable tasks with dependencies and checkpoints. |
| `architecting-changes` | done | Core router/decision skill; Python-specific routes deferred. |
| `incremental-implementation` | done | Execute thin slices; verify at meaningful checkpoints. |
| `systematic-debugging` | done | Root-cause-first debugging, plus triage and recovery. |
| `doing-code-review` | done | 5-axis review with calibrated severity and verdict. |
| `receiving-code-review` | done | Verify feedback before implementing; push back with evidence. |
| `verification-before-completion` | done | No completion claims without fresh evidence. |
| `git-workflow` | done | Atomic changes, branch hygiene, optional worktree isolation. |

### Cross-Cutting Enrichers

| Skill | Status | Notes |
| --- | --- | --- |
| `prototype-first` | done | Spike risky assumptions before full implementation. |
| `doubt-early` | done | Fresh-context adversarial review before committing to uncertain decisions. |
| `code-simplification` | done | Preserve behavior while reducing complexity. |
| `visual-mockups` | done | Browser-based mockups for UI/design exploration. |

### Parallel And Agent Workflow

| Skill | Status | Notes |
| --- | --- | --- |
| `teamlead-coordination` | new | Operating model for the Teamlead agent: backlog, slice contract, default Teammate archetypes, verify-triage-fix chains, periodic analysis Teammate, epic reject + knowledge pass, big-epic worktree comparison flow. Loaded by the `teamlead` agent prompt and from `using-my-skills`. |
| `when-and-how-to-run-parallel-agents` | done | Dependency-aware parallelization decision skill. |
| `executing-plans-with-subagents` | done | Optional plan execution pattern for large delegated implementation work. |

### Research

| Skill | Status | Notes |
| --- | --- | --- |
| `ai-edge-research` | done | Practitioner-signal AI research. |
| `upstream-source-research` | done | Escalate web -> CLI -> shallow clone as needed. |
| `writing-upstream-bug-reports` | done | Evidence-backed upstream bug reports. |

### Domain Skills

| Skill | Status | Notes |
| --- | --- | --- |
| `api-design` | done | Contract-first boundaries, validation, error consistency. |
| `security-and-hardening` | done | Boundary hardening, secrets, auth, rate limits, OWASP themes. |
| `performance-optimization` | done | Measure -> identify -> fix -> verify -> guard. |
| `ci-cd-and-automation` | done | Quality gates, pipeline setup, automation. |
| `shipping-and-launch` | done | Launch readiness, rollout, monitoring, rollback. |
| `documentation-and-adrs` | done | Decisions, ADRs, agent docs, API docs. |
| `high-level-testing-strategy` | done | BDD-first proof selection. |
| `test-driven-development` | done | Red-green-refactor for chosen automated tests. |
| `manual-testing` | done | Browser/API/CLI/infra smoke and e2e checks. |
| `manual-interacting-with-claude-code-via-cli` | done | Claude Code CLI smoke, config/permission isolation, subagent, MCP, plugin, skill, worktree, and runtime verification. |
| `manual-interacting-with-codex-via-cli` | done | Codex CLI smoke, sandbox/approval, config/profile isolation, MCP/plugin/skill, CI, and runtime verification. |
| `manual-interacting-with-opencode-via-cli` | done | OpenCode CLI smoke, provider/config, runtime, and tool-call verification. |
| `architecting-test-infra` | done | Test framework, fixtures, state isolation, service preflights. |
| `setting-up-projects` | done | Language-agnostic project bootstrap: shape decisions, directory layout, setup checklist, graceful shutdown, domain adaptation. |
| `setting-up-backends` | done | Language-agnostic backend bootstrap: service layout, app factory, wiring rules, defer-by-default infrastructure, migrations and operations. |

### Python-Specific Future Layer

| Skill | Status | Notes |
| --- | --- | --- |
| `writing-python-code` | deferred | Refactor to reference core philosophy; keep Python tooling specifics. |
| `testing-python` | deferred | Keep pytest/testcontainers/CLI patterns; remove generic testing philosophy. |
| `architecting-python-changes` | deferred | Python-specific routes after core `architecting-changes`. |
| `building-python-backends` | deferred | FastAPI/Django, Result-to-HTTP, transactions, workers. |
| `building-multi-ui-apps` | deferred | Reusable Python core plus UI/CLI/API adapters. |
| `building-qt-apps` | deferred | PySide6/qasync details. |
| `setting-up-logging` | deferred | colorlog and runtime-mode logging. |
| `setting-up-python-backends` | deferred | Backend bootstrap, app factory, migrations. |
| `setting-up-python-projects` | deferred | uv, pyproject, ruff, basedpyright, pytest, pre-commit. |
| `setting-up-shortcuts` | deferred | PySide6 shortcut conventions. |
| `writing-python-scripts` | external | PEP 723 scripts with uv and typer. Lives in a separate repo for now; planned to port later. |

## Progress Summary

| Area | Status | Notes |
| --- | --- | --- |
| Full inventory | done | Four source sets inventoried. |
| Conflict/overlap analysis | done | Major merge/split decisions recorded above. |
| Core philosophy | done | `ENGINEERING-PHILOSOPHY.md` written from generalized Python principles and duplicated into installable `engineering-principles`. |
| Cross-cutting enrichers | done | `prototype-first`, `doubt-early`, `code-simplification`, `visual-mockups`. |
| Domain skills | done | API, security, performance, CI/CD, shipping, docs, and AI CLI runtime verification. |
| Planning pipeline | done | `idea-sharpening`, `brainstorming`, `planning-implementation`. |
| Verification | done | `verification-before-completion`. |
| Debugging family | done | `systematic-debugging`, `bug-root-cause-tracing`, `bug-protection-multi-layered`. |
| Architecture/execution/git | done | `architecting-changes`, `incremental-implementation`, `git-workflow`. |
| Review skills | done | `doing-code-review`, `receiving-code-review`. |
| Testing family | done | Strategy, TDD, manual testing, test infra. |
| Parallel-agent decision | done | `when-and-how-to-run-parallel-agents`. |
| Subagent plan execution | done | `executing-plans-with-subagents`. |
| Bootstrap replacement | done | `using-my-skills` exists with role gates, workflow routing, and injectors. |
| Python skill refactor | deferred | Not required before Superpowers uninstall unless active workflows need it. |

## Minimum Superpowers Uninstall Path

Required before uninstall:

- [x] `architecting-changes` core exists so later workflow skills use local philosophy.
- [x] `incremental-implementation` exists as lightweight execution discipline.
- [x] `git-workflow` exists without duplicating platform git safety rules.
- [x] `doing-code-review` and `receiving-code-review` exist without mandatory subagent ceremony.
- [x] Final `using-my-skills` bootstrap exists after the local skill map is stable.
- [ ] Superpowers-disabled dry run passes: bootstrap behavior works and no active docs/configs require `using-superpowers` or Superpowers-only skill names.

Defer unless proven active:

- Python skill refactoring batch

## Teamlead Operating Model

A separate concern from the Superpowers uninstall path. Goal: keep the
Teamlead role behaviorally consistent across sessions.

- [x] `teamlead-coordination` exists as the canonical operating model.
- [x] `teamlead` and `teamlead-yolo` agent prompts load it as the first skill.
- [x] `using-my-skills` points at it from the Teamlead role section and from
      the Reusable Workflow Helpers table.
- [x] `skills/README.md` lists it in the Agent Orchestration section.
- [x] `SKILLS-PHILOSOPHY.md` glossary and agent-roles flowchart reference it.
- [ ] Convert `docs/my-workflow-commands-draft.md` prompt templates into
      reusable skills/commands the Teamlead can dispatch to Teammates.
- [ ] Decide whether the periodic Analysis Teammate needs its own skill or
      stays as a Teamlead archetype.

## Remaining Work

### 1. `using-my-skills` Bootstrap

Goal: replace `using-superpowers` with a local bootstrap skill.

- [x] Encode the current role hierarchy: big `Teamlead -> Teammates -> Subagents`
      sessions and bounded `Orchestrator -> Subagents` sessions.
- [x] Encode the composition model: atomic skills, composable short workflows,
      and future command-driven mega-workflow orchestration.
- [x] Encode that ceremony scales with task size.
- [x] Encode fail-fast rules for true ambiguity, missing environment, or invalid source state.
- [x] Route common intents to local skill names only.
- [x] Include tool mappings only if still needed for portability.
- [ ] Run Superpowers-disabled dry run before uninstall.

### 2. Python Skill Refactor

Goal: slim Python skills so they reference core philosophy and keep only Python-specific guidance.

- [ ] Refactor `writing-python-code`.
- [ ] Refactor `testing-python`.
- [ ] Refactor `architecting-python-changes`.
- [ ] Review backend, Qt, logging, setup, shortcut, and script skills for duplicated generic philosophy.

### 3. Workflow Documentation

Goal: keep workflow composition explicit

- [x] Create `skills/README.md` as the current skill map and workflow catalog.
- [x] Keep `skills/README.md` current when skill roles or relationships change.
- [ ] Continue `docs/my-workflow-draft.md` as the future `mega-workflow` sketch.
- [ ] Keep individual skills focused on atomic capabilities or bounded local
      workflows, not full autonomous process governance.

### 4. Skill Reference Cleanup

Goal: remove stale references without hiding intentional external dependencies.

- [x] Replace removed `finishing-a-development-branch` references in `git-workflow`.
- [x] Replace missing `debugging-and-error-recovery` references in `ci-cd-and-automation`.
- [ ] Keep `writing-python-scripts` referenced by `release-automation-small-repos` until it is ported from the external repo.
