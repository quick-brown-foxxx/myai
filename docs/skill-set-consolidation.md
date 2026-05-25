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
- The workflow hierarchy is: human or lead agent -> teammate agents for large
  isolated tasks -> focused subagents for small independent actions.
- Workflow phases are explicit: design -> implementation planning -> execution
  -> verification/fixing loop -> fresh-context re-verification -> finish.
- `ENGINEERING-PHILOSOPHY.md` wins when a skill conflicts with local principles.

## Philosophy Decisions

| Topic | Decision |
| --- | --- |
| Testing | Trustworthy integration/e2e behavior over coverage. TDD is a technique, not a universal law. |
| Process gates | Keep fail-fast behavior for true blockers; remove persuasive Iron Law ceremony. |
| Agent autonomy | After clear high-level direction, agents execute independently until a real blocker appears. |
| Explicitness | Prefer typed boundaries, validation, Result-style expected failures, and simple readable code. |
| Architecture | Layer by responsibility; share stable contracts across applications before sharing implementation. |

## Conflict Resolutions

| Topic | Sources | Resolution |
| --- | --- | --- |
| TDD | Superpowers + Addy | Merge into softened `test-driven-development`; BDD/test-first for selected automated cases. |
| Ideation | Superpowers brainstorming + Addy idea-refine | Split into `idea-sharpening` and `brainstorming`. |
| Planning | Superpowers writing-plans + Addy planning | Merge into `planning-implementation`. |
| Debugging | Superpowers + Addy | Split/merge into debugging family: main workflow, root-cause tracing, multilayer protection. |
| Review | Superpowers requesting/receiving + Addy review | Split into `doing-code-review` and `receiving-code-review`. |
| Meta bootstrap | Superpowers using-superpowers + Addy using-agent-skills | Planned replacement: lightweight `using-skills`. |
| Skill writing | Local + Superpowers writing-skills | `how-to-write-skills` created. |
| Finishing branch | Superpowers finishing-development-branch | Dropped; covered by `git-workflow` plus platform git safety rules. |

## Python Generalization

| Python principle | Core location | Python-specific remainder |
| --- | --- | --- |
| Pit of success | `ENGINEERING-PHILOSOPHY.md` | Tool choices per project |
| Explicitness through types | `ENGINEERING-PHILOSOPHY.md` | basedpyright, msgspec, reportAny |
| Fail fast | `ENGINEERING-PHILOSOPHY.md` | Python preflight specifics |
| Error handling as control flow | `ENGINEERING-PHILOSOPHY.md` | rusty-results usage |
| Testing philosophy | `ENGINEERING-PHILOSOPHY.md` | pytest fixtures, containers, CLI/e2e patterns |
| Architecture separation | `ENGINEERING-PHILOSOPHY.md` | Python routers and backend/UI patterns |
| Project setup | `ENGINEERING-PHILOSOPHY.md` conceptually | uv, ruff, basedpyright, pytest, PySide6, typer |

## Current Skill Inventory

### Core Workflow

| Skill | Status | Notes |
| --- | --- | --- |
| `using-skills` | todo | Final bootstrap; do last after local map is stable. |
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
| `architecting-test-infra` | done | Test framework, fixtures, state isolation, service preflights. |

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
| `writing-python-scripts` | done | PEP 723 scripts with uv and typer. |

## Removed Or Merged Away

| Removed source skill | Resolution |
| --- | --- |
| Superpowers `brainstorming` hard gate | Split/softened into `brainstorming`; visual piece extracted to `visual-mockups`. |
| Superpowers `writing-skills` | Keep local `how-to-write-skills`; cherry-pick only if needed. |
| Superpowers `using-superpowers` | Replace with planned `using-skills`. |
| Addy `using-agent-skills` | Merge into planned `using-skills`. |
| Addy `context-engineering` | Not needed as standalone. |
| Addy `source-driven-development` | Too opinionated as standalone. |
| Addy `spec-driven-development` | Spec patterns absorbed into `brainstorming`. |
| Superpowers `executing-plans` | Useful pieces merged into `incremental-implementation`. |
| Superpowers `writing-plans` | Merged into `planning-implementation`. |
| Superpowers/Addy standalone TDD | Merged into softened `test-driven-development`. |
| Addy `browser-testing-with-devtools` | Runtime checks absorbed into `manual-testing`; deeper browser skill deferred. |
| Addy `deprecation-and-migration` | Not needed for current cases. |
| Addy `frontend-ui-engineering` | Dropped; local frontend skill may be authored later. |
| Superpowers `requesting-code-review` | Merged into `doing-code-review`. |
| Superpowers `receiving-code-review` | Rewritten as `receiving-code-review`. |
| Superpowers `finishing-a-development-branch` | Dropped; covered by `git-workflow` and platform git rules. |

## Progress Summary

| Area | Status | Notes |
| --- | --- | --- |
| Full inventory | done | Four source sets inventoried. |
| Conflict/overlap analysis | done | Major merge/split decisions recorded above. |
| Core philosophy | done | `ENGINEERING-PHILOSOPHY.md` written from generalized Python principles. |
| Cross-cutting enrichers | done | `prototype-first`, `doubt-early`, `code-simplification`, `visual-mockups`. |
| Domain skills | done | API, security, performance, CI/CD, shipping, docs. |
| Planning pipeline | done | `idea-sharpening`, `brainstorming`, `planning-implementation`. |
| Verification | done | `verification-before-completion`. |
| Debugging family | done | `systematic-debugging`, `bug-root-cause-tracing`, `bug-protection-multi-layered`. |
| Architecture/execution/git | done | `architecting-changes`, `incremental-implementation`, `git-workflow`. |
| Review skills | done | `doing-code-review`, `receiving-code-review`. |
| Testing family | done | Strategy, TDD, manual testing, test infra. |
| Parallel-agent decision | done | `when-and-how-to-run-parallel-agents`. |
| Subagent plan execution | done | `executing-plans-with-subagents`. |
| Bootstrap replacement | todo | `using-skills` is the remaining uninstall-path blocker. |
| Python skill refactor | deferred | Not required before Superpowers uninstall unless active workflows need it. |

## Minimum Superpowers Uninstall Path

Required before uninstall:

- [x] `architecting-changes` core exists so later workflow skills use local philosophy.
- [x] `incremental-implementation` exists as lightweight execution discipline.
- [x] `git-workflow` exists without duplicating platform git safety rules.
- [x] `doing-code-review` and `receiving-code-review` exist without mandatory subagent ceremony.
- [x] `.agents/skills` and `.claude/skills` are synced from `skills/`.
- [ ] Final `using-skills` bootstrap exists after the local skill map is stable.
- [ ] Superpowers-disabled dry run passes: bootstrap behavior works and no active docs/configs require `using-superpowers` or Superpowers-only skill names.

Defer unless proven active:

- Python skill refactoring batch

## Remaining Work

### 1. `using-skills` Bootstrap

Goal: replace `using-superpowers` with a local bootstrap skill.

- [ ] Encode that skills are low-level aids; high-level workflow is explicit orchestration.
- [ ] Encode that ceremony scales with task size.
- [ ] Encode fail-fast rules for true ambiguity, missing environment, or invalid source state.
- [ ] Route common intents to local skill names only.
- [ ] Include tool mappings only if still needed for portability.
- [ ] Run Superpowers-disabled dry run before uninstall.

### 2. Python Skill Refactor

Goal: slim Python skills so they reference core philosophy and keep only Python-specific guidance.

- [ ] Refactor `writing-python-code`.
- [ ] Refactor `testing-python`.
- [ ] Refactor `architecting-python-changes`.
- [ ] Review backend, Qt, logging, setup, shortcut, and script skills for duplicated generic philosophy.

### 3. Workflow Documentation

Goal: keep high-level orchestration separate from skill docs.

- [ ] Continue `docs/my-workflow-draft.md` as the future composition layer.
- [ ] Keep skills focused on reusable local workflow pieces, not full autonomous process governance.
