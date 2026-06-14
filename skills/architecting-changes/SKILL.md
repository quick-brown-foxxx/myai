---
name: architecting-changes
description: >-
  Use when a feature, refactor, bug fix, or project setup needs an architecture
  decision about boundaries, layers, wrappers, reusable cores, framework choices,
  composition roots, shared logic, or where code should live.
license: MIT
metadata:
  focus: architecture-decision-routing
  tags: planning, architecture, boundaries
---

# Architecting Changes

This skill is the first stop for non-trivial architecture decisions.

It is both a compact guide and a router to deeper project docs and domain skills.
Use it to decide shape and boundaries, then continue through the normal planning
or implementation flow.

For coding-related work, `engineering-principles` should already be loaded as
the foundation for explicitness, validation, boundaries, testing, and tooling.

```text
engineering-principles
  -> brainstorming / planning-implementation / unclear implementation task
     -> architecting-changes  (you are here, when boundaries or ownership matter)
          -> api-design / security-and-hardening / performance-optimization
          -> documentation-and-adrs       (if decision should be durable)
          -> planning-implementation      (if work needs decomposition)
          -> incremental-implementation   (if direction is clear enough to execute)
```

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
5. Load the matching deeper skill when available.
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

### Pattern Awareness

Architecture is not only about boundaries. It is also about choosing the
**right pattern** for the problem at the right scope. A wrong or missing
pattern in a sensitive area produces a web of `if`s and small tangled
functions that becomes impossible to evolve, test, or trust. A pattern
applied in a trivial area is just ceremony.

For every non-trivial change, ask: *which established pattern fits this
job, at which scope, and what happens if I skip it?*

#### Three Scopes Of Patterns

```text
File-level / within one module
  -> state machines, parsers/combinators, builders, strategies,
     result types, value objects, specification/predicate, mappers
System-level / across files inside one application
  -> outbox, inbox, mediator/dispatcher, saga, CQRS, repository,
     unit of work, dependency injection, observer/publisher,
     idempotency keys, retries with backoff, circuit breakers,
     feature flags, ACL (anti-corruption layer)
Architecture-level / system shape
  -> hexagonal/ports-and-adapters, modular monolith, microservices,
     event-driven, message bus, event sourcing, read replicas,
     separate OLTP vs OLAP stores, queue per workload, cache layers,
     gateway / BFF, strangler fig
```

These scopes compose: an architecture choice (e.g. modular monolith) sets
the system, a system pattern (e.g. outbox) lives inside it, and file-level
patterns (e.g. a state machine for order status) make the pieces legible.

#### When Patterns Are Required, Not Optional

Some areas are **pattern-sensitive by nature**. If the wrong or no pattern
is chosen, the code will rot quickly and the cost of fixing it later is
high. Treat the following as a non-exhaustive list of areas where pattern
thinking is part of the architecture step, not a polish step:

```text
Money, billing, payments, accounting
  -> state machines, double-entry invariants, idempotency, outbox,
     transactional boundaries, money value objects (no floats),
     append-only audit log, reconciliation

High-throughput data pipelines, ingest, ETL, protocol converters
  -> backpressure, bounded queues, batching, idempotent consumers,
     dead-letter queues, schema evolution, partitioning/sharding,
     streaming vs batch choice, error classification

Authentication, authorization, session, secrets
  -> strategy/handler for providers, repository for sessions,
     mediator for events, audit log, ACL at trust boundaries,
     token rotation, fail-closed defaults

Long-running workflows, multi-step business processes
  -> saga / process manager, explicit state model, compensation
     steps, timeouts, idempotency keys, durable state

Multi-tenant or regulated data
  -> repository + unit of work, row-level access policy, audit log,
     soft delete with retention, separation of PII stores

External integrations and third-party APIs
  -> anti-corruption layer, adapter, retry with backoff, circuit
     breaker, idempotency keys, schema/version negotiation,
     dead-letter handling, sandbox/mock mode

Caching, search, read-heavy domains
  -> CQRS, read models, cache-aside vs write-through, eventual
     consistency windows, cache invalidation strategy

Configuration, feature flags, operational control
  -> feature flag service, config repository, dry-run / shadow mode,
     observability hooks, kill switch
```

If the change touches one of these areas, the architecture step is
incomplete until the matching patterns are named and their boundaries
drawn — even if their bodies are not yet implemented.

#### Right-Sized Engineering

Pattern awareness does not mean "apply every pattern everywhere". It
means: **invest pattern effort where the cost of under-engineering is
high, and stay boring where the cost of over-engineering is higher**.

```text
Invest in patterns when:
  - the area is pattern-sensitive (see list above)
  - business rules are non-trivial or expected to grow
  - failures are costly, hard to detect, or hard to undo
  - multiple actors, tenants, or processes share state
  - the code is on a known scale or complexity axis

Stay boring when:
  - it is a one-off helper, glue, or boilerplate
  - the rules are stable and the change axis is purely cosmetic
  - the cost of rewriting from scratch is lower than the cost of the
    pattern
  - the lifetime of the code is short and well bounded
```

A useful self-check: *if this area is going to grow, what shape will
make the next change easy?* That shape is usually a pattern. If the area
is not going to grow, the pattern is overhead.

#### Common Failure Mode: If-Webs And Helper Spaghetti

The signature of under-engineered sensitive code is recognizable:

```text
- long functions with many flags and early returns
- "manager" objects that take a context blob and branch on type
- state stored in scattered booleans or magic strings
- retries and rollbacks hidden inside ad-hoc helpers
- implicit ordering between operations that must be transactional
- "just one more if" added every time a case is reported
- no place to attach tests, observability, or rollback
```

When this shape starts to appear, stop and reach for the right pattern
instead of another conditional. The goal is not to add layers for their
own sake; the goal is to make the next change a normal local edit
rather than a global surgery.

#### Pattern Selection Questions

Use these as a quick gate before leaving the architecture step:

```text
1. Which scope does this change live at? (file / system / architecture)
2. Is the area pattern-sensitive? (billing, throughput, auth, workflow, ...)
3. What is the dominant force?
     - state transitions           -> state machine
     - async work / fan-out        -> queue, outbox, saga
     - external boundary           -> adapter / ACL
     - multiple representations   -> CQRS, read model
     - many independent rules      -> strategy / specification
     - cross-cutting concern       -> mediator / observer
4. What existing pattern in the codebase already solves something
   similar? Reuse or evolve it before introducing a new one.
5. What is the smallest pattern that makes the next change local?
```

A pattern does not have to be implemented fully on day one. Naming it in
the architecture step is enough to make the boundary visible and to keep
the next change from sliding back into the if-web.

---

## Router

Use this table to decide whether to stay in this skill or load a deeper one.

| Architecture question | Use now | Notes |
| --- | --- | --- |
| Public API, protocol, module contract, or component props | `api-design` | — |
| User input, auth, secrets, PII, files, webhooks, sessions, external services | `security-and-hardening` | — |
| Performance-sensitive path or suspected performance trade-off | `performance-optimization` | — |
| CI, quality gates, deployment automation, release pipeline | `ci-cd-and-automation` | — |
| Production launch, rollout, monitoring, rollback strategy | `shipping-and-launch` | — |
| ADR-worthy decision or context future agents must preserve | `documentation-and-adrs` | — |
| Implementation order or task decomposition after architecture direction is clear | `planning-implementation` | — |
| Pattern-sensitive area (billing, throughput, auth, long-running workflows, integrations) needing named patterns and their boundaries | This skill, with the Pattern Awareness section as the gate | Move to `planning-implementation` after patterns are named |
| Python-specific project, backend, GUI, or implementation concerns | Use this skill plus `engineering-principles` | Record follow-up if a future language-specific skill is needed |

If a language-specific route is missing, make the architecture decision with this
skill and `engineering-principles`, then note any needed follow-up in the
handoff.

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

Pattern:
  Is the area pattern-sensitive? If yes, which pattern fits at which scope, and is the boundary visible even if the pattern is not fully implemented yet?

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
| Skipping pattern thinking on a pattern-sensitive area (billing, throughput, auth, workflows, integrations) | Name the pattern, draw its boundary, and keep the next change local instead of growing the if-web |
| Applying heavy patterns to trivial helpers or one-off glue | Right-size: pattern effort goes where the cost of under-engineering is high |

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

If language-specific routing is needed but no canonical skill exists, record the
gap explicitly rather than pretending the local skill exists.
