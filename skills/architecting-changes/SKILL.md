---
name: architecting-changes
description: >-
  Use when a feature, refactor, bug fix, or project setup needs an architecture
  decision about boundaries, layers, wrappers, reusable cores, framework choices,
  composition roots, shared logic, or where code should live.
license: MIT
metadata:
  status: draft
  focus: architecture-decision-routing
---

# Architecting Changes

This skill is the first stop for non-trivial architecture decisions.

It is both a compact guide and a router to deeper project docs and domain skills. 
Use it to decide shape and boundaries, then continue through the normal planning
or implementation flow.

> Draft status: Python-specific routes are intentionally left as TODOs until the
> Python skill batch is ported.

---

## Core Idea

Architecture is about **expected change**.

Split things when they change for different reasons. Keep things together when a
split only adds ceremony.

```text
Good architecture answers:

  What owns this responsibility?
  What is allowed to know about what?
  What will change independently later?
  What boundary prevents invalid states or dependency leaks?
```

---

## Default Flow

```text
Incoming non-trivial change
        │
        ▼
Classify the change
        │
        ▼
Find the expected change axis
        │
        ▼
Identify the real architecture question
        │
        ▼
Choose the smallest sufficient boundary
        │
        ▼
Route to deeper skills only when needed
```

1. Classify the change.
2. Ask what is actually expected to change later.
3. Identify the real architecture question.
4. Apply the heuristics below.
5. Load the matching deeper skill or TODO route when available.
6. Continue to planning or implementation.

---

## Change Classification

| Change type | Architecture question | Default bias |
| --- | --- | --- |
| Small local fix | Was the bug caused by the wrong boundary? | Keep local unless the boundary caused the bug |
| Feature adding behavior | Where does the new responsibility belong? | Follow existing layer and ownership |
| Feature adding a caller | Should shared behavior move into a reusable core? | Core plus thin adapters |
| Refactor | Which responsibilities are tangled? | Split by expected change axis |
| External integration | What wrapper and validation boundary is needed? | Wrap, validate, and isolate errors |
| Project setup | Framework or custom structure? | Prefer boring maintained frameworks |
| Cross-cutting concern | Does this need shared policy or local handling? | Centralize carefully, avoid god modules |

---

## Expected Change Axes

Ask which part is likely to evolve independently:

```text
Business rules
    │
    ├── Validation / decoding
    ├── Transport / request-response shape
    ├── UI / CLI / API presentation
    ├── Infrastructure / persistence / third-party calls
    ├── Platform integration / OS behavior
    └── Observability / dry-run / operational controls
```

If two concerns change for different reasons, they probably deserve a boundary.
If they always change together, splitting them may be ceremony.

---

## Core Heuristics

### Boundaries And Layers

- Keep a small fix local unless the bug was caused by the wrong boundary.
- Extract shared behavior downward into domain, application, or utility code instead of duplicating it across entry points.
- Keep business rules separate from validation plumbing, transport shapes, auth/session concerns, and raw infrastructure.
- Wrap third-party, OS-specific, network, file system, or weakly typed boundaries when typing, exception isolation, portability, or replacement matters.

```text
Presentation / transport
        │
        ▼
Application use case / service
        │
        ▼
Domain rules / pure decisions
        │
        ▼
Infrastructure wrappers
```

Dependencies should point inward or downward. Domain code should not import UI,
HTTP handlers, framework lifecycle, or persistence implementation details.

### Presentation Boundaries

Presentation layers are adapters, but the adapter boundary depends on the
repository and deployment shape.

Single application codebase:

```text
CLI command ───┐
GUI screen ────┼──> Application / Domain Core ──> Infrastructure wrappers
API handler ───┘
```

Separate frontend/backend applications:

```text
Frontend app ──> API contract / generated client ──> Backend API ──> Backend domain
      │                                                    │
      └── frontend state, UX validation                    └── server invariants
```

Do not move logic across a frontend/backend boundary just to satisfy "shared
core" as a pattern. Share contracts first. Share implementation only when the
repo and deployment model make that coupling intentional.

### Reuse Versus Custom Code

- Prefer boring popular maintained libraries and frameworks for commodity infrastructure: auth, routing, migrations, packaging, builds, queues, caching, deployment, and orchestration.
- Do not build ad hoc systems on top of a tiny framework when the domain already implies substantial backend or operational concerns.
- For tiny one-off helpers or stable details, simple custom code is often better than heavyweight scaffolding.
- When selecting a library, verify current docs and compare options; do not choose from memory alone.

### Composition And State

- Prefer composition, explicit data flow, and small interface-shaped boundaries over deep class hierarchies.
- Add stateful classes or services for lifecycle and orchestration, not to manufacture abstractions.
- Hidden mutable state is a smell. Important state changes should be visible in code, logs, or explicit state models.

### Reusable Cores

- If CLI, GUI, API, worker, or automation code may share logic in the same application boundary, build a reusable core plus thin adapters.
- Start with one useful implementation, but do not trap durable business logic inside the first interface.
- Prefer composable pieces over one giant super-tool.

### Transparency And Operations

- Important workflows should be inspectable: clear validation, explicit errors, logs at operation boundaries, and dry-run behavior where practical.
- For risky multi-step actions, prefer explicit step/state models over opaque helper chains.
- If a failure would be costly or hard to debug, design for traceability early instead of bolting it on later.

---

## Router

Use this table to decide whether to stay in this skill or load a deeper one.

| Architecture question | Use now | Later / TODO |
| --- | --- | --- |
| Public API, protocol, module contract, or component props | `api-design` | — |
| User input, auth, secrets, PII, files, webhooks, sessions, external services | `security-and-hardening` | — |
| Performance-sensitive path or suspected performance trade-off | `performance-optimization` | — |
| CI, quality gates, deployment automation, release pipeline | `ci-cd-and-automation` | — |
| Production launch, rollout, monitoring, rollback strategy | `shipping-and-launch` | — |
| ADR-worthy decision or context future agents must preserve | `documentation-and-adrs` | — |
| Implementation order or task decomposition after architecture direction is clear | `planning-implementation` | — |
| Python project structure, packaging, tooling, repo bootstrap | TODO | `setting-up-python-projects` |
| Python backend/API/worker architecture | TODO | `setting-up-python-backends`, `building-python-backends` |
| Python reusable core shared by CLI, GUI, API, or automation | TODO | `building-multi-ui-apps` |
| PySide6/Qt manager-service-wrapper decisions | TODO | `building-qt-apps` |
| Python implementation details, typed wrappers, import cycles | TODO | `writing-python-code` |

If the needed route is still TODO, make the architecture decision with this
skill and `ENGINEERING-PHILOSOPHY.md`, then note the missing follow-up skill in
the handoff.

---

## Decision Checklist

Before leaving this skill, be able to answer:

```text
Responsibility:
  What owns the new behavior?

Boundary:
  What must not leak across this boundary?

Change axis:
  What is expected to change independently later?

Reuse:
  Is shared logic actually shared, or only hypothetically reusable?

Framework:
  Is this commodity infrastructure that a boring framework should own?

Handoff:
  Which deeper skill, plan, or implementation step comes next?
```

---

## Common Mistakes

| Mistake | Better move |
| --- | --- |
| Extracting layers because the pattern exists | Split only when responsibilities or change axes differ |
| Letting the first UI own durable business rules | Move durable rules into the app/domain core when within the same app boundary |
| Sharing backend internals with a separate frontend | Share contracts and generated clients instead |
| Mixing domain rules with request/response models | Decode at the boundary, pass typed domain/application inputs inward |
| Wrapping every dependency reflexively | Wrap when the boundary is dynamic, weakly typed, risky, or likely to change |
| Introducing inheritance to share code | Prefer composition and small explicit collaborators |
| Building custom infrastructure for solved problems | Use maintained frameworks/libraries for commodity concerns |
| Refactoring unrelated architecture while passing through | Stay scoped to the current task unless the current task depends on the cleanup |

---

## Handoff

After the architecture direction is clear:

```text
Tiny obvious change       -> implement directly
Small known-code change   -> quick inline plan, then implement
Moderate multi-file work  -> planning-implementation
Risky assumption          -> prototype-first or doubt-early
ADR-worthy decision       -> documentation-and-adrs
```

If Python-specific routing is needed before Batch 5 is ported, record the TODO
explicitly rather than pretending the local skill exists.
