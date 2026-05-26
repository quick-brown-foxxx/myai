---
name: incremental-implementation
description: >-
  Use when starting to implement a feature, refactor, bug fix, or planned task that is too
  large to do safely in one edit. Guides thin slices, scope discipline, frequent
  lint/typecheck feedback, right-sized tests, blocker escalation, and handoff.
license: MIT
metadata:
  focus: implementation-discipline
  tags: implementation, verification, quality
---

# Incremental Implementation

Build in small, verified increments. Do not let work sprawl.

This skill is the execution discipline after a direction or plan exists.

```text
planning-implementation / clear task
        │
        ▼
incremental-implementation  (you are here)
        │
        ├── choose next slice
        ├── implement only that slice
        ├── run fast feedback checks
        ├── behavior verification
        │     ├── high-level-testing-strategy  (if approach is unclear)
        │     ├── test-driven-development      (for automated verification)
        │     └── manual-testing               (for runtime verification)
        ├── doing-code-review                  (when warranted)
        └── verification-before-completion     (before success claims)
```

---

## When To Use

Use this when:

- implementing a multi-file change
- executing a task from a written plan
- refactoring behavior or boundaries
- building a feature that could sprawl beyond one focused edit
- you are tempted to write a large amount of code before checking it

Skip this for tiny single-file edits where the scope is already obvious.

---

## The Increment Cycle

```text
┌──────────────────────────────────────────────┐
│ Pick smallest useful slice                   │
│        │                                     │
│        ▼                                     │
│ Implement only that slice                    │
│        │                                     │
│        ▼                                     │
│ Fast feedback: lint + typecheck / compile    │
│        │                                     │
│        ├── fails → fix / debug / escalate    │
│        │                                     │
│        ▼                                     │
│ Bigger checkpoint: tests or manual check     │
│        │                                     │
│        └── passes → next slice or handoff    │
└──────────────────────────────────────────────┘
```

For each slice:

1. Pick the smallest useful piece of work.
2. Implement only that piece.
3. Run fast feedback checks soon: lint, typecheck, compile, or equivalent.
4. Run tests or manual verification at meaningful checkpoints.
5. Stop, escalate, or continue based on evidence.

---

## Slicing Strategies

### Vertical Slices Preferred

In existing system, build one complete behavior path at a time.

```text
Slice 1: Create task
  DB/model + API/service + minimal UI/CLI path
  -> user can create a task

Slice 2: List tasks
  query + API/service + minimal UI/CLI path
  -> user can see tasks

Slice 3: Edit task
  update path + validation + UI/CLI affordance
  -> user can modify tasks
```

Vertical slices keep every increment useful and testable.

### Contract-First Slices For Big Greenfield Work

For large greenfield features or separate frontend/backend work, contract-first
slicing can be better than a premature vertical path.

```text
Slice 0: Define contract
  types / API shape / schema / generated client boundary

Slice 1a: Backend implements contract
  service + endpoint + contract/integration tests

Slice 1b: Frontend implements against contract
  typed client / mock server / fixture data

Slice 2: Integrate end-to-end
  real backend + real frontend + critical flow check
```

Use this when teams, agents, or codebases need to work in parallel without
guessing each other's shapes.

### Risk-First Slices

If one assumption could invalidate the whole plan, prove it early.

```text
Slice 1: Prove WebSocket connection survives reconnect
Slice 2: Build real-time updates on the proven transport
Slice 3: Add offline behavior and UI polish
```

For the risky slice, use `prototype-first`, or try `doubt-early` if it fails, or revisit the
plan instead of building around uncertainty.

---

## Feedback Cadence

Agents do not see compiler and linter feedback continuously the way humans do.
Run fast checks more often than full tests.

| Work size / event | Recommended check | Why |
| --- | --- | --- |
| About every ~100-300 lines or one meaningful files update | lint + typecheck / compile | catches syntax, type, import, and style drift early |
| After finishing a service, component, endpoint, command, or integration seam | targeted tests or manual check | proves behavior, not just syntax |
| After a vertical/contract/risk slice completes | broader relevant test set | catches interactions between touched pieces |
| Before claiming completion | `verification-before-completion` | evidence before success claims |

For tiny scripts or simple changes, manual verification may be enough. For
maintained applications, prefer automated checks when available.

Do not repeat the same successful command for reassurance if no code changed
since the last run. Run it again after the next relevant edit.

---

## Scope Discipline

Touch only what the slice requires.

```text
IN SCOPE
  Code needed for this slice
  Tests or checks proving this slice
  Tiny adjacent cleanup only when required by the change

OUT OF SCOPE
  Drive-by refactors
  Import reformatting in unrelated files
  Removing comments you do not understand
  Modernizing syntax while only passing through
  Adding features because they seem useful
```

If you notice unrelated problems, record them instead of fixing them silently.

```text
NOTICED BUT NOT TOUCHING:
  - src/auth/session.ts has duplicated validation unrelated to this task
  - dashboard query could be paginated later
```

---

## Simplicity Within Architecture

Prefer the simplest approach that fits the plan, existing architecture, and
expected evolution.

This does **not** mean avoiding architecture. It means avoiding unearned
architecture.

```text
Plan or existing architecture says event-driven producer/consumer flow?
  -> Use the event bus or event pattern deliberately.

Plan does not call for eventing and this is a one-time local action?
  -> Use a direct function call.

Existing project uses factories for component registration?
  -> Follow that pattern if this belongs there.

One-off component with no expected variation?
  -> Do not invent a generic factory.
```

If plan is not certain enough about architecture, you may use `architecting-changes`. If the plan specifies only behavior and not structure, follow existing
codebase patterns and choose the simplest maintainable implementation.

Ask the architecture question when the choice matters:

```text
Will this evolve independently later?
Will more callers or variants appear soon?
Does this boundary prevent invalid states or dependency leaks?
Is this commodity infrastructure that a framework should own?
```

If the answer is no, keep it local and direct.

---

## Executing A Written Plan

When a plan exists, treat it as input to execute thoughtfully, not a script to
follow blindly.

```text
Read task
  │
  ├── clear and realistic? -> execute one slice
  │
  ├── unclear?             -> clarify or escalate
  │
  ├── seems wrong?         -> doubt-early / plan validation
  │
  └── blocked?             -> isolate blocker, delegate/fix/escalate
```

Important practice: review the plan critically before and during
execution.

---

## Blockers And Escalation

Do not force through blockers. A blocker means the current plan, environment,
or slice boundary may be wrong.

| Blocker | Good response |
| --- | --- |
| Plan instruction is unrealistic or contradicts code | Use `doubt-early` or escalate to the orchestrator with the conflict |
| Lint/typecheck cannot run because tooling is broken | Isolate tooling blocker; fix if in scope, otherwise escalate |
| Tests fail from unrelated existing issue | Record baseline failure, decide whether to proceed or delegate blocker investigation |
| Needed architecture decision is missing | Use `architecting-changes` before writing more code |
| External service/API is unavailable | Stop that path; do not fake success |
| Same failure repeats after several fixes | Switch to `doubt-early` or `systematic-debugging` or `prototype-first` |

Escalation does not always mean asking the human immediately. Depending on the
workflow level, it can mean:

- report to the higher-level orchestrator
- run `doubt-early` on the plan
- dispatch a focused subagent to investigate a build/test blocker
- pivot into `systematic-debugging`
- ask the human when requirements or priorities are genuinely missing

---

## Working With Agents

This skill can be used at multiple levels:

```text
Main agent on small/medium task
  -> uses incremental implementation directly

Low-level subagent on delegated task
  -> uses it inside the assigned slice only

Higher-level orchestrator
  -> uses it to define slice boundaries and verification cadence
```

Subagents should not silently expand their slice. If a delegated slice is wrong
or blocked, report that precisely instead of improvising a larger plan.

For plan-driven execution with delegated implementation tasks, use
`executing-plans-with-subagents`. For parallel fan-out decisions, use
`when-and-how-to-run-parallel-agents`. For isolation, commits, and handoff, use
`git-workflow`.

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Need to decide boundaries, layering, wrappers, or framework direction | `architecting-changes` |
| Need to break a spec/task into ordered steps | `planning-implementation` |
| Need to decide BDD cases or automated vs manual proof | `high-level-testing-strategy` |
| Need shared fixtures, state isolation, services, or test preflights | `architecting-test-infra` |
| Need automated behavior or regression tests | `test-driven-development` |
| Need browser/API/CLI/runtime proof | `manual-testing` |
| Repeated failure or unknown root cause | `systematic-debugging` |
| Risky assumption needs a spike | `prototype-first` |
| Plan or approach may be wrong | `doubt-early` |
| Need fresh review before merge, handoff, or trust | `doing-code-review` |
| Need to handle review findings | `receiving-code-review` |
| About to claim completion or success | `verification-before-completion` |
| Refactor is becoming clarity work | `code-simplification` |
| Public interface/API shape matters | `api-design` |
| User input, auth, secrets, or external data involved | `security-and-hardening` |
| Need plan-driven subagent execution | `executing-plans-with-subagents` |
| Need independent parallel work | `when-and-how-to-run-parallel-agents` |
| Need git isolation, commits, or handoff | `git-workflow` |

---

## Common Mistakes

| Mistake | Why it fails | Better move |
| --- | --- | --- |
| Testing everything only at the end | Bugs compound and become hard to localize | Run fast checks during the slice, behavior checks at checkpoints |
| Running full tests after every tiny edit | Slow feedback causes avoidance | Use lint/typecheck frequently, tests at meaningful blocks |
| Simplifying against the architecture | Creates dead-end code that must be rewritten | Stay simple inside the planned architecture |
| Building abstractions for hypothetical future needs | Adds complexity without evidence | Ask whether this will actually evolve soon |
| Mixing feature work and unrelated refactor | Harder to review, debug, and revert | Separate slices or record follow-up |
| Continuing through a contradictory plan | Produces plausible but wrong code | Validate or escalate the plan |
| Expanding delegated scope silently | Breaks orchestration and context isolation | Report the scope issue to the orchestrator |

---

## Completion Handoff

After a slice or task:

```text
Report:
  - what slice changed
  - what checks ran
  - what remains
  - blockers or follow-ups
```

For multi-slice work, move to the next slice only when the current slice has
fresh evidence appropriate to its size. For final completion claims, use
`verification-before-completion`.
