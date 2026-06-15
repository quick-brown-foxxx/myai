---
name: setting-up-backends
description: >-
  ALWAYS LOAD THIS SKILL WHEN BOOTSTRAPPING A NEW BACKEND, API SERVICE, OR WORKER REPO
  FOR ANY LANGUAGE OR ECOSYSTEM. Do not scaffold backends directly — use this skill first.
  Backend/service directory layout, app factory pattern, wiring rules, defer-by-default infrastructure, and service-first project conventions.
license: MIT
metadata:
  focus: backend-bootstrap
  tags: backend, api, setup, bootstrap, architecture
---

# Setting Up Backends

## Prerequisites

Load `engineering-principles` and `architecting-changes` before this skill.
They provide the foundation: strict tooling, boundary rules, reusable cores,
and framework-over-ad-hoc defaults.

Load `setting-up-projects` first for general project bootstrap (directory
structure, setup checklist, domain adaptation). This skill adds the
backend-specific layer: service layout, app factory, wiring, and
infrastructure deferral.

---

## Default Approach

1. **Choose framework weight**:
   - Default to the boring, well-maintained framework for your ecosystem.
   - Heavier framework justified when auth, admin, sessions, and CRUD are
     obviously present and important from the start.
   - Thin-edge framework for deliberate minimal builds, not as a default.

2. **Start with reusable core and thin transport**: routes, workers,
   schedulers, CLI hooks, and automation all call the same core services.
   Business logic lives in the domain layer, not in HTTP handlers.

3. **Add infrastructure only when needed**: relational DB, auth, outbound
   HTTP, cache/jobs — each only when the project actually needs it. Do not
   pre-install infrastructure for hypothetical future needs.

4. **Keep one composition root and one app factory**: single place where all
   wiring happens. No scattered initialization, no hidden side effects in
   module imports.

---

## Default Stack Philosophy

Pick a standard, well-maintained stack for your ecosystem. The stack should
be boring, well-documented, and widely adopted.

- Keep transport-layer DTOs/schemas at the HTTP boundary — convert
  immediately into framework-free typed structures. Request/response shapes
  are not domain models.
- Framework handles transport, serialization, routing, lifecycle. Your code
  handles business logic. When framework knowledge dominates the codebase,
  the separation is wrong.
- One task runner for all dev commands (run, lint, test, migrate). Every
  operation should be reproducible with a single command.

---

## Default Layout

Omit what you do not need. No DB → no `db/` or `migrations/`. No workers →
no `workers/`. Start minimal and add directories only when the project
demands them. This layout is an example, not a mandatory template.

```text
src/appname/
  api/               # HTTP layer only
    app              # App factory
    routes/          # Route handlers
    schemas/         # Request/response DTOs
    errors           # HTTP error mapping
  domain/            # Business logic (framework-free)
    models           # Domain data types
    services         # Use cases / operations
    errors           # Domain error types
  infrastructure/    # External concerns
    config           # Typed settings from env/files
    logging          # Logging setup
    db/              # Database access (models, session, queries)
    clients/         # External API clients
  workers/           # Background job handlers
    entrypoint       # Worker process entry
  bootstrap          # Composition root — wires everything together
tests/
  integration/
  unit/
  fixtures/
migrations/          # If owning a relational DB
```

---

## First Files

Create these early to establish the skeleton before adding features:

- API entrypoint with app factory function
- Health check endpoint (e.g. `/healthz`)
- Bootstrap/composition-root module that wires services
- Domain models and one small service/use-case/handler module
- Config module to parse environment into typed settings
- DB files and migrations only if persistence exists
- One smoke API test and one domain test

The smoke test proves the app starts and the health endpoint responds. The
domain test proves one piece of business logic works. Together they verify
the wiring is correct before any real features are built.

---

## Wiring Rules

- **App factory** assembles only the transport/HTTP layer — routes,
  middleware, error handlers. It does not know about database connections or
  business logic.
- **Bootstrap/composition root** wires settings, DB/session factories,
  external clients, and services. This is the single place where all
  dependencies are connected.
- **Keep entrypoints thin** — the main/server entrypoint does only the final
  handoff to the app factory. It imports, calls, and exits.
- **Domain classes never instantiate their own infrastructure** — pass
  everything via constructor. A service that creates its own database
  connection is untestable and couples business logic to infrastructure.

---

## Boundary Rules

- Request/response schemas are not domain models.
- No `Request`, `Response`, `Depends`, ORM session, or framework auth objects in domain services.
- Convert request data and auth/session state at the edge.
- Workers are another adapter, not a separate business-logic stack.
- CLI/admin scripts should call the same core services when they touch the same workflows.

---

## Defer by Default

Add these only when the project/specs really needs them:

- queues and background-job stacks
- caching layers
- metrics/tracing vendors
- event buses or CQRS
- multitenancy
- API versioning strategy beyond basic room for growth
- generated SDKs and OpenAPI customization
- Kubernetes-specific guidance

Each deferred item is real infrastructure with real operational cost. The
default is to defer until a concrete feature demands it. Pre-installing
infrastructure for hypothetical needs adds complexity without value.

---

## Migrations and Operations

- If the service owns a relational DB, initialize migrations early. The
  first migration should create the initial schema; every subsequent schema
  change gets its own migration.
- Add health and readiness endpoints early. Health answers "is the process
  alive?" Readiness answers "can it serve traffic?" (DB reachable, caches
  warm, etc.)
- Keep all dev commands (run, lint, test, migrate) in the task runner. No
  ad-hoc shell scripts scattered across the repo.
- Containerize when needed, but keep v1 simple and boring (Linux-first). Do
  not build a multi-arch container pipeline before the first deployment.

---

## Handoff

After bootstrap, use these skills for deeper decisions:

- `building-backends` — for backend architecture patterns: thin transport,
  reusable core, transaction ownership, auth boundaries, workers, and common
  backend mistakes.
- `architecting-changes` — for architecture decisions about service
  boundaries, pattern selection, and infrastructure choices.
- `api-design` — for stable API and protocol/interface design at the HTTP
  boundary.
- `security-and-hardening` — for auth, secrets, and boundary hardening in
  backend services.

---

## Related myai Skills

- **`engineering-principles`** — Parent skill. Language-agnostic project
  setup philosophy and architecture principles.
- **`architecting-changes`** — Parent skill. Architecture decision framework
  for backend shape, boundaries, and pattern selection.
- **`building-backends`** — Backend architecture patterns: thin transport,
  reusable core, transaction ownership, auth boundaries, and workers.
- **`setting-up-projects`** — General project bootstrap (directory structure,
  setup checklist, domain adaptation). Load before this skill.
- **`api-design`** — For stable API and protocol/interface design.
- **`security-and-hardening`** — For auth, secrets, and boundary hardening.
- **`ci-cd-and-automation`** — For CI/CD pipeline setup after bootstrap.

---

## Language-Specific Extensions

After applying the patterns in this skill, load the appropriate
language-specific extension for concrete framework choices, library
selections, config templates, and code examples:

- **Python**: `setting-up-python-backends` — FastAPI/Django/Starlette choice,
  SQLAlchemy + Alembic, pydantic at edge, httpx, default stack,
  Python-specific layout with file names
- **Other ecosystems**: if no language-specific skill exists, apply the
  patterns above with `engineering-principles` ecosystem examples as a
  starting point, and record the gap for follow-up

When a language-specific extension is available, load this skill first for
the patterns and decision framework, then the extension for concrete tooling.
