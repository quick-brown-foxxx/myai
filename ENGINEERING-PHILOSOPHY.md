# Development Principles

Principles that guide architecture, coding, testing, and project setup decisions.
Agent management rules live in `SKILLS-PHILOSOPHY.md`.

Installable agent-facing copy: `skills/engineering-principles/SKILL.md`.
Keep both documents aligned when changing these principles.

---

## 1. Pit of Success

Build systems where doing things correctly is the path of least resistance.
Instead of relying on conventions that developers must remember, construct boundaries that make violations impossible.

- **Static analysis** that rejects ambiguity at analysis time. Eg typecheck/compilation and so on
- **Linters** that enforce rules automatically, not through code review
- **Architecture** that separates concerns structurally, not by agreement
- **Error handling** that forces callers to address failures, not ignore them

**The investment is front-loaded.** We spend time setting up types, linters, libraries, and architecture to minimize time spent on bug fixes, manual testing, and debugging later.

<details>
<summary>Ecosystem examples</summary>

|                            | Python                                                  | TypeScript / Node                                                 | Frontend (React)                                                                     |
| -------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Static analysis            | basedpyright strict, reportAny=error                    | tsconfig strict, noUncheckedIndexedAccess                         | same as TS + eslint-plugin-react-hooks exhaustive-deps                               |
| Linting                    | ruff (replaces black, isort, flake8, bandit)            | eslint + prettier (project-specific toolchain)                    | eslint-plugin-react, eslint-plugin-jsx-a11y                                          |
| Architecture separation    | layered: UI → Domain → Utilities, UI is a plugin        | layered: transport → use-cases → entities, adapters at boundaries | data flow unidirectional, UI as pure render of state, separate state vs presentation |
| Error handling enforcement | Result[T, E] for expected failures, exceptions for bugs | discriminated unions / Either types for expected failures         | error boundaries at route level, form validation at field level                      |

</details>

## 2. Explicitness Over Guesswork

Everything should be known before runtime. We always know what types and values we have. We always know whether we are on the error path or the success path.

- **Static type checking where the ecosystem supports it** — strict mode, no loose `any`/`Any`, no unvalidated suppressions. Every public interface has a type signature; internal functions should follow suit.
- **Errors are values, not exceptions** — use Result/Either types for expected failures. Exceptions are reserved for programming errors (impossible states, invariant violations) — they mean "this is a bug."
- **Data has shape** — validate at every external boundary. JSON, configs, API payloads are decoded and narrowed immediately on entry. Never pass raw untyped data through business logic.
- **Dynamic boundaries get wrapped** — third-party libraries with weak typing get typed wrappers. Untyped data from outside (user input, network, files) gets validated immediately at the boundary.

The goal: if the type checker says it's correct, it runs correctly. If something can fail, the type signature says so.

<details>
<summary>Ecosystem examples</summary>

| Concept                 | Python                                                 | TypeScript / Node                                            | Frontend (React)                                                     |
| ----------------------- | ------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------- |
| Type checking           | basedpyright strict, reportAny=error                   | tsconfig strict, noUncheckedIndexedAccess                    | same as TS                                                           |
| Errors as values        | rusty-results / Result[T, E]                           | neverthrow / nevertype / discriminated unions                | neverthrow for side effects, React Query status for async            |
| Data shape              | msgspec.Struct for JSON, dataclass for domain          | appropriate runtime schema validator for external boundaries (e.g., zod, valibot); infer transport DTO types from schemas | appropriate runtime validator for form/transport boundaries; pair with the appropriate form library |
| Wrap dynamic boundaries | typed wrappers around libraries, linter bans raw usage | typed wrappers around untyped JS libs, adapter pattern       | wrapper hooks around untyped context, typed props on every component |

</details>

## 3. Fail Fast, Fail Early

Detect problems at the earliest possible moment. Compile time is better than runtime. Startup is better than mid-operation. Explicit error is better than silent corruption.

- **Validate preconditions** at the entry of each subsystem: required permissions, installed dependencies, valid configuration, sane inputs
- **Validate postconditions** where output correctness matters
- **No escape hatches** — don't allow loose `any`/`Any`, casts, blanket suppressions, or bare excepts to silently bypass the safety net
- **Narrow over assume** — when a value could be multiple types, narrow it with type guards or pattern matching. Never assume

<details>
<summary>Ecosystem examples</summary>

| Concept             | Python                                                   | TypeScript / Node                                            | Frontend (React)                                          |
| ------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- |
| Precondition checks | raise early at boundary, use `__init_subclass__` for cfg | assert, neverthrow early return, parse with appropriate runtime validator | form validation before submit, route guards before render |
| No escape hatches   | no `# type: ignore` without note, no bare except         | no `as any` / `@ts-ignore`, no `eslint-disable` without note | no `// @ts-ignore`, no disabled hooks rules               |
| Type narrowing      | isinstance, TypeIs, match statement                      | type guards, discriminated unions, satisfies keyword         | same as TS                                                |

</details>

## 4. Error Handling as Control Flow

Errors are a normal part of program execution, not exceptional events. The type system should track them.

- **Expected failures** (IO, network, user input, missing resources): return Result/Either types — the caller must handle both paths
- **Programming errors** (violated invariants, impossible states): raise exceptions — these are bugs, the program should crash
- **Third-party boundaries**: catch library errors immediately, convert to Result — don't let foreign error hierarchies leak through layers
- **Error boundaries**: UI/CLI layers catch all remaining errors and present user-friendly messages. Business logic never swallows errors silently
- **Early returns**: handle the error case first, keep the success path unindented and linear

<details>
<summary>Ecosystem examples</summary>

| Concept                | Python                                                       | TypeScript / Node                                       | Frontend (React)                                           |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| Expected failures      | Result[T, E] (rusty-results)                                 | neverthrow Result<T, E>, discriminated unions           | React Query status + error fields, neverthrow in mutations |
| Programming errors     | raise or assert for impossible states                        | throw for bugs, panic-equivalent                        | throw in dev, caught by error boundaries                   |
| Third-party boundaries | catch library Exception → return Result                      | catch → Result pattern, wrap untyped callbacks          | wrap external API calls in typed hooks with error states   |
| Error boundaries       | outer CLI try/except → user message, GUI try/except → dialog | NestJS exception filters, domain never catches          | <ErrorBoundary> per route, global fallback                 |
| Early returns          | if error: return Err(...), success path unindented           | if (error) return failure(...), success path unindented | guard clauses before render                                |

</details>

## 5. Testing Philosophy

Tests exist to prove that features work, not to produce green checkmarks.

- **Trustworthiness over coverage** — a test that mocks away the thing it's testing proves nothing. Coverage numbers are a guideline, not a goal.
- **Integration / e2e tests are the primary safety net** — they test real behavior through real code paths. Five good integration tests give more confidence than 100 unit tests with heavy mocking.
- **Unit tests for pure logic** — functions that transform data without side effects. These are worth unit testing because they're honest.
- **Real over mocked** — prefer real listening HTTP servers over intercepted or patched requests. When an authoritative API contract exists, derive test-server routes and payloads from it. Prefer real file systems (via temp directories) over mocked IO. Prefer real databases over in-memory fakes. When mocking is necessary, build test doubles, don't monkey-patch runtime.
- **20/80 rule** — invest test effort where it gives the most confidence. Don't chase 100% coverage in utilities while core workflows go untested.
- **Two tiers of infrastructure** — lightweight (test runner + fixtures) for most projects. Heavyweight (containers, contract-powered test servers, isolated environments) when the project warrants it.

<details>
<summary>Ecosystem examples</summary>

| Concept                         | Python                                                    | TypeScript / Node                               | Frontend (React)                                     |
| ------------------------------- | --------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------- |
| Integration / e2e               | pytest + httpx, containerized, real process exec          | vitest + listening app server with real HTTP client, Playwright for browser e2e  | Playwright / Cypress for browser tests               |
| Real over mocked                | pytest-httpserver, tmp_path for files, subprocess for CLI | real-listening HTTP test server (OpenAPI-powered or shared-schema TS server), tmp dirs for files, execa for CLI | contract-powered real listening test server (Mockoon for OpenAPI, or TS server importing shared transport schemas), testing-library (no enzyme) |
| Lightweight infra               | pytest + fixtures + markers                               | vitest + describe/it/expect                     | vitest + testing-library + happy-dom                 |
| Heavyweight infra (when needed) | testcontainers, docker compose                            | testcontainers, docker compose, isolated env    | Playwright with docker browsers, Percy for visual    |

</details>

## 6. Architecture: Separation by Responsibility

Separate what changes for different reasons. Separate what can be tested independently.

- **Layered dependency flow**: Presentation (UI/CLI/API) → Domain (business logic) → Utilities. Never upward.
- **Separate by expected change axis** — split code where domain rules, validation, transport, infrastructure, platform integration, or workflow orchestration will evolve for different reasons.
- **UI is a plugin (within its application boundary)** — UI, CLI, API, workers, and automation should be thin adapters over the logic they own. In a single codebase, this often means a reusable core with multiple presentation adapters. In separate frontend/backend codebases, do not force frontend code to share backend internals; share transport contracts—transport runtime schemas or generated clients—not backend domain, persistence, entity, or use-case models. Server-side domain invariants still belong on the server. Frontend-specific state, validation UX, and interaction logic belong in the frontend application layer.
- **Reusable core, thin adapters** — if CLI, GUI, API, workers, or automation may share behavior (within the same application boundary), keep a composable core and treat each interface as a presentation adapter. Across separate applications, share contracts before implementation.
- **State management is layered, not scattered** — in UI apps, separate server state (API data), client state (UI, form, navigation), and derived state (computed from other state). Use purpose-built tools for each layer. Don't scatter low-level state management across the app, but also don't put everything in one god store.
- **Data vs. logic** — domain types carry data. Services operate on data. Utilities are stateless pure functions. Stateful classes exist for managing lifecycle — but their state is explicit, not hidden.
- **Prefer composition over inheritance** — explicit data flow, small collaborating objects, protocols over deep class hierarchies. Inheritance only when genuinely stable and semantic, not to share code.
- **Scale-appropriate separation** — in large projects: separate files, directories, layers. In single scripts: separate functions, clear sections within one file. The principle scales; the implementation doesn't need to.
- **Wrap third-party dependencies** — isolate external dependencies behind typed interfaces for type safety, testability, and swap-ability.
- **Transparency over magic** — important workflows should expose validation, state transitions, logs, and dry-run behavior where practical.

<details>
<summary>Ecosystem examples</summary>

| Concept                      | Python                                             | TypeScript / Node                                                | Frontend (React)                                                                                   |
| ---------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Layered architecture         | UI → Domain → Utils, GUI never imports from domain | controllers → use-cases → entities, or event handlers → services | Zustand/Jotai for client state, TanStack Query for server state, React Hook Form for forms         |
| Presentation adapters        | same core for CLI, GUI (Qt/React), API             | use-cases behind controllers, workers, CLI, serverless           | frontend app core behind pages, components, and routes; backend shared through contracts           |
| State management             | n/a                                                | n/a                                                              | server state: TanStack Query; client state: Zustand/Jotai; derived: useMemo; form: react-hook-form |
| Composition over inheritance | protocols / ABCs, dataclasses composited           | interfaces, functional composition, NestJS providers             | custom hooks compose behavior, context for shared state                                            |
| Wrap third-party             | typed wrappers + ruff banned-api                   | adapter interfaces around JS libs                                | custom hooks wrapping libraries, prop interfaces                                                   |

</details>

## 7. Tooling: One Per Job, Strictly Configured

Use tools that enforce the philosophy automatically. Prefer tools that are fast, opinionated, and cover one job well.

- **One tool per job** — one linter, one formatter, one type checker, one test runner. No competing tools for the same responsibility.
- **Strict configuration from the start** — the strictest viable config. Loosen only when there is a concrete, measured reason. Never default to lenient.
- **Automate enforcement** — pre-commit hooks or equivalent, CI gates. Every commit passes analysis, linting, and tests.
- **Latest stable runtime** — use modern language features. Don't target old versions unless explicitly required.

<details>
<summary>Ecosystem examples</summary>

| Job             | Python       | TypeScript / Node   | Frontend (React)             |
| --------------- | ------------ | ------------------- | ---------------------------- |
| Linter          | ruff         | eslint              | eslint + eslint-plugin-react |
| Formatter       | ruff format  | prettier            | prettier                     |
| Type checker    | basedpyright | tsc                 | tsc                          |
| Test runner     | pytest       | vitest              | vitest + testing-library     |
| Package manager | uv           | project-specific (e.g., pnpm) | project-specific (e.g., pnpm) |
| Task runner     | poethepoet   | npm scripts initially; add orchestrator only when graph/caching needed | npm scripts initially; add orchestrator only when graph/caching needed |
| Git hooks       | pre-commit   | husky + lint-staged | husky + lint-staged          |

</details>

## 8. Interface Standards

Each interface type gets one standard framework per ecosystem, chosen for quality and long-term viability.

| Layer         | Python           | TypeScript / Node  | Frontend (React)    |
| ------------- | ---------------- | ------------------ | ------------------- |
| Web framework | FastAPI / Django | NestJS             | Next.js / Remix     |
| CLI           | typer            | commander / clack  | n/a                 |
| HTTP client   | httpx            | ky / ofetch        | ky / TanStack Query |
| Config        | YAML + msgspec   | config loader + project-specific runtime schema validator | same as Node        |
| Logging       | colorlog         | pino               | pino (server-side)  |
| Async         | asyncio          | native async/await | native async/await  |
| GUI           | PySide6 + qasync | tauri / electron   | React itself        |

## 9. Frameworks: Adopt, Don't Reinvent

Choose established batteries-included frameworks over ad-hoc architecture for core concerns.
A framework codifies conventions, provides battle-tested infrastructure, and brings an ecosystem that individual developers can't replicate.

- **Pick the framework for the job** — NestJS over Express, FastAPI/Django over Flask. React framework selection (Next.js, Vite + React Router, etc.) is a project decision owned by `setting-up-react-projects`. The framework's conventions become your conventions. Don't fight them unless you chose the wrong framework.
- **Standard library from day one** — don't reimplement ad-hoc state management, form handling, routing, or validation. Eg for React: TanStack Query + Zustand/Jotai + React Hook Form + appropriate runtime schema validator. Runtime validation is non-negotiable; exact state, form, and schema packages are project-specific. For Python backend: FastAPI + SQLAlchemy/psycopg3 + alembic. This should be extended/adjust per project.
- **Thin application code** — framework handles transport, serialization, routing, lifecycle. Your code handles business logic. When framework knowledge dominates your codebase, the separation is wrong.
- **Exceptions prove the rule** — a small script or experimental prototype may skip frameworks. But if the project will be maintained, introduce the framework before ad-hoc patterns harden.

## 10. Project Setup: Invest Early

Every project, no matter how small, starts with the safety net configured:

- **Single file**: inline metadata / dependencies, tool config at the top, shebang for direct execution
- **Full project**: src layout, AGENTS.md, principles reference, linter + type checker + test runner configured, CI from day one
- **Stronger scaffolding when complexity is real** — if the domain needs auth, background jobs, stateful workflows, migrations, or admin concerns, prefer stronger framework scaffolding early instead of bolting it on later
- **The overhead is worth it** — spending 10 minutes on setup saves hours of debugging implicit failures later. This is the pit of success in action.

<details>
<summary>Ecosystem examples</summary>

| Concept                | Python                                              | TypeScript / Node                                                | Frontend (React)                                |
| ---------------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------- |
| Single file            | PEP 723 inline metadata, uv run --script            | tsx or Node native type stripping for small projects (see writing-scripts) | npx create-next-app, vite                       |
| Full project bootstrap | uv init, pyproject.toml, ruff, basedpyright, pytest | project-specific selection: package manager, strict tsconfig, linter, formatter, runner, test runner | project-specific: framework scaffold, linter, formatter, runner, test runner |
| CI from day one        | GitHub Actions: lint → typecheck → test             | GitHub Actions: format:check → lint → typecheck → test → build (when applicable) | GitHub Actions: lint → typecheck → test → build |

</details>

## 11. Principle Over Prescription

Ceremony scales with task size. Not every project needs the full apparatus — but every project needs the principles.

- **A 50-line script** — inline metadata, a shebang, quick manual verification. No pre-commit, no CI.
- **A growing project** — add type checking, strict configs, pre-commit, linter, tests, git hooks one at a time as value becomes clear.
- **A production system** — full stack: CI with lint → typecheck → test, pre-merge CI e2e testing, complex release system with rollbacks.

The same principles apply at every scale. The implementation scales down. Don't force heavyweight process on trivial work. Don't skip safety net on anything that will be maintained.

## 12. Explicit Over Clever

Code is read far more often than it is written. Favor clarity, directness, and transparency over abstraction, metaprogramming, or conciseness tricks.

- **Name identifiers for readers, not writers** — variables, fields, entities and types, functions, events, jobs, and similar identifiers should use meaningful, context-rich domain names rather than generic buckets. Longer is better when it removes ambiguity or saves the reader from tracing context: `payload` → `solana_transaction_payload`, `mode` → `service_lifecycle_mode`. Apply this scope-sensitively, not mechanically: a short name is appropriate when a small, focused local scope already makes its meaning obvious.
- **Flat is better than nested** — guard clauses, early returns, extracted helpers. Deep nesting is a signal the logic needs splitting
- **Explicit state over implicit magic** — visible data flow beats decorators, proxies, or interceptors that hide what's happening
- **Simple over concise** — if the concise version requires a mental pause, write the simple version. Fewer characters is not the goal
- **Comment business and domain logic** — always preserve intent, business rules, invariants, or the overall approach; never narrate syntax
- **Explain non-obvious constraints** — always document tricks, hacks, bug workarounds, and framework-imposed constraints, including the removal condition when useful
- **Layer comments by scale** — give large, complex logic sections a high-level overview, then target non-obvious phases, decisions, and invariants inside the flow
- **Skip obvious narration** — self-evident boilerplate and standard framework wiring need no comments; avoid line-by-line descriptions

The canonical agent-facing commenting policy is in `skills/engineering-principles/SKILL.md`.

## Applying This Document

Architecture, coding, testing, security, performance, and other engineering-facing skills build on this document. Skill invocation, workflow composition, delegation, and agent orchestration are governed by `SKILLS-PHILOSOPHY.md`.
