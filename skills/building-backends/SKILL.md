---
name: building-backends
description: >-
  ALWAYS LOAD THIS SKILL WHEN DESIGNING OR CHANGING BACKEND, SERVICE, WORKER, OR API ARCHITECTURE:
  ROUTES, USE-CASE LAYERS, AUTH BOUNDARIES, PERSISTENCE, TRANSACTIONS, OR BACKGROUND JOBS.
  Do not shape backends directly — use this skill first.
  Backend architecture patterns: thin transport, reusable core, transaction ownership,
  auth/session boundaries, workers, idempotency, and infrastructure separation.
  Includes Python and TypeScript/Node ecosystem examples.
license: MIT
metadata:
  focus: backend-architecture
  tags: backend, api, architecture, workers
---

# Building Backends

## Prerequisites

Load `architecting-changes` and `api-design` before this skill. They provide
the architecture decision framework, boundaries, pattern awareness, and API
design principles. This skill adds backend-specific heuristics: transaction
ownership, auth context patterns, worker rules, and common backend mistakes.

Also load `engineering-principles` (via myai bootstrap).

## Core Rules

- Routes and workers decode input, call one core operation, then map the
  result outward. They are thin adapters, not orchestration layers.
- Convert auth/session/request state immediately at the edge into
  framework-free typed inputs and actor/principal values. Framework auth
  objects never enter domain code.
- Expected failures stay as Result types through core layers. HTTP
  status mapping (or equivalent transport error encoding) happens at the
  transport boundary only. Errors are domain values, not transport codes.
- Exceptions are bugs or infrastructure escapes. Catch them at the global
  error boundary and in wrappers around actions that may throw.

## Persistence and Transactions

- A use-case/handler/service owns the transaction boundary. The use-case/handler/service
  decides when to commit or roll back.
- Repositories are optional, not mandatory. Use them when they express a
  real persistence boundary, not because the pattern exists. For simple
  CRUD through an ORM, the ORM may be the repository.
- Routes must not open, commit, and orchestrate business transactions
  inline. Transaction management belongs in the use-case/handler/service layer.
- Repositories must not silently commit their own work for multi-step
  flows. A repository that auto-commits inside a multi-step operation
  breaks atomicity.

## Workers and Background Work

- Workers are another adapter calling the same core services as HTTP or
  CLI. Do not duplicate business logic in worker handlers.
- Important background work should have an explicit job payload and
  handler. Make the job contract visible, not buried in closure state.
- Do not hide important work inside fire-and-forget tasks started from
  request handlers. If the work matters, it deserves a job, not a
  dangling promise.
- If work needs retries, durability, or traceability, treat it as a real
  backend workflow with explicit state, not a convenience callback.

## Auth and Operation Context

- Keep framework auth/session objects at the edge. Pass a typed
  actor/principal into core operations.
- Important write operations should expose execution context clearly:
  actor, request ID, idempotency key, and mode when needed. This makes
  operations inspectable and auditable.
- Prefer typed mode values over a naked boolean flag (e.g.
  `dry_run: bool` is bad) when behavior meaningfully changes. A mode enum
  makes the intent explicit and prevents boolean confusion.

## Common Mistakes

- business logic and DB commits inline in routes
- request DTOs or ORM rows used as domain models
- framework request/auth/session objects leaking into core code
- generic repository layers everywhere (use only at real persistence
  boundaries)
- separate worker logic duplicating route logic
- important writes without idempotency, dry-run, or traceability where
  they matter
- CLI or admin scripts bypassing the real core services

## Ecosystem Examples

### Python

- **FastAPI** is the default boring HTTP adapter for most service APIs.
- **Django** is justified when backend complexity, admin, auth/session,
  and CRUD surface are obviously large from day 1.
- **SQLAlchemy 2** + **Alembic** is the default relational stack when
  the service owns its DB.
- Use `pydantic` DTOs at the FastAPI HTTP edge — convert immediately to
  framework-basic types (`msgspec.Struct` for config types, `dataclass` for
  domain models).
- Use `Result[T, E]` (rusty-results) for expected failures through core
  layers. Map to HTTP status codes at the transport boundary only.
- **httpx** wrappers own outbound HTTP boundaries.
- Add Redis, queues, and extra infrastructure only when the product
  actually needs them.

### TypeScript / Node

- **NestJS** is the default boring backend framework for most service
  APIs. Its module system, guards, interceptors, and pipes map well to
  the layered architecture.
- **Hono** is alternative HTTP layer for edge environments where runtime is limited.
- **Express** + manual middleware is justified for very thin-edge builds or
  when framework weight is actively undesirable.
- **Prisma** or **Drizzle** for relational persistence. Keep ORM models
  at the infrastructure layer — map to plain domain types at the
  service boundary.
- Use appropriate runtime schema validator (e.g., Zod, Valibot) for
  request/response validation at the HTTP edge. Convert validated transport
  DTOs immediately into plain domain types. Transport schemas describe the
  wire format; domain models are not transport schemas.
- Use `Result<T, E>` (neverthrow, effect, or custom Either) for expected
  failures through core layers. Map to HTTP status codes in exception
  filters or error middleware.
- **fetch** / **undici** wrappers own outbound HTTP boundaries.
- Add BullMQ, Redis, and extra infrastructure only when needed.

## Handoff

- Use `setting-up-backends` for new backend repo bootstrap and initial
  scaffolding.
- Use `setting-up-projects` for general project shape decisions.
- Use `api-design` for stable API contract and protocol design.
- Use `security-and-hardening` for auth, secrets, and boundary hardening.

## Related myai Skills

- **`architecting-changes`** — Parent skill. Architecture decision
  framework, boundaries, pattern awareness.
- **`api-design`** — Parent skill. Stable API and protocol design.
- **`engineering-principles`** — Foundation. Language-agnostic philosophy.
- **`setting-up-backends`** — Backend repo bootstrap and scaffolding.
- **`setting-up-projects`** — General project shape and layout.
- **`security-and-hardening`** — Auth, secrets, rate limiting.
