---
name: architecting-test-infra
description: >-
  Use when setting up or redesigning test infrastructure, BDD frameworks,
  fixtures, state isolation, data builders, seed layers, local services,
  preflight checks, test environments, or flaky/complex test setup. Architecture
  step for scalable, realistic test suites before writing individual tests.
license: MIT
metadata:
  focus: test-infrastructure-architecture
  tags: testing, architecture, verification
---

# Architecting Test Infrastructure

Test infrastructure is architecture. Treat it with the same care as production boundaries.

Use this before writing individual tests when the test runner, BDD framework, fixtures, data, services, isolation, or environment setup are missing or weak.

For coding-related work, load `engineering-principles` before this skill. Test
infrastructure applies its pit-of-success and real-over-mocked defaults.

---

## Testing Skill Map

```text
engineering-principles
  -> high-level-testing-strategy
  -> architecting-test-infra       (you are here: test infrastructure architecture)
       -> prove infra with one representative test
       -> test-driven-development  (for automated test implementation)
       -> manual-testing           (for runtime/e2e/smoke verification)
  -> verification-before-completion
```

| Situation | Use |
| --- | --- |
| Decide cases and proof type | `high-level-testing-strategy` |
| Design test framework, fixtures, data, isolation, services, preflights | `architecting-test-infra` |
| Implement automated test cases and code | `test-driven-development` |
| Verify realistic runtime flows manually | `manual-testing` |
| Claim setup or tests pass | `verification-before-completion` |

This is usually an orchestrator or architecture-focused subtask, not a simple implementation guide. For complex suites, split infra work into separate tasks before feature test implementation.

---

## When To Use

Use this when:

- a project has no test infrastructure and tests are worth adding
- introducing a new test suite or test layer
- existing tests are flaky, order-dependent, slow, or hard to write
- new BDD cases need fixtures, seeds, services, auth, or environment setup
- tests require local servers, databases, containers, external binaries, or mock services
- repeated tests are accumulating ad hoc setup and cleanup
- parallel test runs collide through shared state

Do not use this for a tiny test in an already healthy suite.

---

## Architecture Flow

```text
Understand scenarios and risks
      │
      ▼
Choose test layers and BDD framework
      │
      ▼
Design state, fixtures, data builders, services
      │
      ▼
Add preflight checks and isolation
      │
      ▼
Implement smallest useful infra slice
      │
      ▼
Prove with one representative test
```

---

## BDD Framework Choice

BDD is preferred for new suites and fresh setups.

Pick modern, lightweight, popular, fluent, low-verbosity tools when the ecosystem has good options.

Prefer:

- plain-language-like scenarios separated from implementation
- readable Given/When/Then structure
- simple local execution
- good editor/CI support
- low ceremony for small tests
- compatibility with existing project tooling

Avoid:

- heavyweight frameworks chosen only because they are "BDD"
- verbose step glue that obscures behavior
- tools that make agents write framework ceremony instead of meaningful checks
- one-off custom mini-frameworks when maintained tools exist

BDD-style scenarios matter more than a specific framework brand.

### Existing Non-BDD Suites

Do not force a framework migration just because BDD is preferred. If the project already has a non-BDD style and porting is out of scope, preserve the local style and keep BDD scenario text near each real test as a docstring, heredoc, block comment, or adjacent spec note.

The goal is to preserve behavior-first test design without turning infrastructure work into a broad suite migration.

---

## Test Suite Shape

Design around behavior and resources, not arbitrary pyramid ratios.

Typical layers:

| Layer | Proves | Infra needs |
| --- | --- | --- |
| Unit / component | Pure logic or small public contract | small fixtures, deterministic inputs |
| Integration | API/domain/storage boundaries | test DB, fake server, tmp dirs, seeds |
| CLI / process | Real command behavior | temp config/data dirs, mock binaries |
| Browser / e2e | User-visible runtime flow | app server, browser tooling, test accounts |
| Manual smoke | Realistic behavior not worth automating | environment plan, evidence capture |

Choose the fewest layers that prove the important risks.

---

## State And Data Architecture

For stateful suites, especially CRUD backends, invest in explicit data setup.

Useful patterns:

- seed subsystem for known baseline data
- builders/factories for per-test entities
- unique namespaces/tenants/users per test
- transaction rollback or database reset per case/group
- temp directories for filesystem state
- real-listening contract-powered servers (OpenAPI or shared-schema-driven) that preserve realistic behavior
- mock binaries for external command integrations

Avoid shared mutable global test data unless the suite guarantees isolation.

---

## Preflight Checks

Fail early when required resources are missing. Do not let the 14th test fail mysteriously because the database was never available.

Preflight should check relevant requirements:

- env vars and config files
- required binaries
- reachable local services
- database/schema/migrations
- browser/devtools availability
- ports and permissions
- credentials or test accounts when unavoidable

Preflight can live in:

- a resource management/control layer
- shared setup fixtures
- particular test file setup for focused suites
- explicit `check-test-env` commands

Choose the smallest mechanism that gives clear failures.

---

## Flakiness And Isolation

Flaky tests are architecture feedback.

Fix causes, not symptoms:

| Problem | Better design |
| --- | --- |
| Fixed sleeps | Condition-based waits with timeout and clear failure message |
| Order dependence | Per-test state setup and cleanup |
| Shared DB rows | unique data, transactions, reset, schemas or namespaces |
| Parallel collisions | isolated ports, temp dirs, users, schemas |
| Auth setup copied everywhere | reusable auth fixture/helper |
| Mock setup larger than test | fake/local service or better boundary |

If writing the current test requires ad hoc isolation patches, stop and improve shared infra first.

---

## Real Over Mocked

Prefer realistic local resources:

- temp filesystem over mocked file operations
- real-listening contract-powered server with mock data (aligned with contract schemas) over patched HTTP client
- test database/container over in-memory fake when persistence semantics matter
- mock binary over patched `subprocess` when process behavior matters
- browser/runtime inspection over DOM assumptions for visual behavior

Mock only when reality is too slow, unsafe, expensive, nondeterministic, or external.

---

## Pattern Awareness

Test infrastructure is architecture, and it has the same pattern-or-bare-code
trade-off as the rest of the system. The general rule is in
`architecting-changes` (Pattern Awareness section): name the right pattern at
the right scope, or the area will rot into a tangle of one-off helpers and
flags. This section applies that rule to test infrastructure specifically.

The inline lists in `## State And Data Architecture`, `## Preflight Checks`,
`## Flakiness And Isolation`, and `## Real Over Mocked` are the concrete
patterns. This section is the meta-rule that decides when to reach for them
instead of patching the next test by hand.

### Three Scopes Of Test Infra Patterns

```text
File-level / inside one test or fixture module
  -> builders / factories, data builders with sane defaults, object
     mothers, condition-based waits, helper composition, custom matchers,
     parametrize, scenario docstrings / heredocs, in-place fakes
System-level / across the suite inside one project
  -> seed baseline + per-test delta, unique namespaces/tenants per case,
     transaction rollback or schema reset, suite-wide auth fixture,
     resource pool (ports, temp dirs, users), tagging by layer or speed,
     shared preflight gate, retry-with-backoff wrapper, recording/replay
     proxy, golden-file comparison, deterministic clock
Infra-level / shared framework, services, environments
  -> contract-powered test server (OpenAPI or shared-schema-driven), containerized dependencies (DB, broker, cache),
     ephemeral environment per CI job, service virtualization, BDD
     framework + step libraries, scenario data files, mock binary
     harness, browser farm / devtools container, test reporter with
     rich failure context
```

These compose. A suite-wide builder (system) is built on small file-level
factories. An infra-level fake server is wrapped by a system-level client
helper. Picking the wrong scope may be a mistake too: building a per-test
complex fake service is over-engineering; relying on a shared global
DB row (system-level pretending to be file-level) is under-engineering.

### When Test Infra Patterns Are Required, Not Optional

Test infra is **pattern-sensitive by nature** when any of the following
apply. If the pattern is missing, the suite will become flaky, slow, or
impossible to extend:

```text
Suite runs in parallel
  -> isolated namespaces/ports/users, resource pools, no shared mutable
     globals, deterministic ordering, independent preflight

Suite touches a real backend, DB, queue, or cache
  -> transactional reset, schema/namespace isolation, seed baseline,
     bounded wait + clear failure, idempotent setup

Suite covers auth, multi-tenant, or role-based flows
  -> reusable auth fixture, role/tenant factory, token rotation helper,
     per-case principal, no copy-pasted login

Suite covers external services or third-party APIs
  -> anti-corruption layer, contract-powered test server (OpenAPI or shared-schema-driven), recording/replay,
     schema/version negotiation, dead-letter / failure injection

Suite covers time, scheduling, retries, or background work
  -> deterministic clock, virtual time, condition-based waits with
     timeout, fake scheduler, controlled jitter

Suite covers visual or browser behavior
  -> local browser/devtools, stable selectors, screenshot/video on
     failure, isolated user data dir, network shaping

Suite is large or long-lived
  -> BDD-style scenarios, tagging by speed/risk/layer, golden files,
     shared preflight gate, test reporter with rich failure context
```

If the project hits one of these, the architecture step is incomplete
until the matching patterns are named, even if they are not yet
implemented.

### Right-Sized Engineering

Same rule as `architecting-changes`: invest pattern effort where
under-engineering is costly, stay boring where over-engineering is
worse.

```text
Invest in patterns when:
  - the suite is parallel, large, or long-lived
  - the system under test is pattern-sensitive (see list above)
  - the suite already shows flakiness, slow runs, or hard onboarding
  - new tests are accumulating copy-paste setup
  - one flaky test blocks or hides other failures

Stay boring when:
  - the project has one or two tests and no infra plan exists
  - the system under test is a tiny one-off helper
  - a manual smoke test is the right proof (route to `manual-testing`)
  - rewriting the few existing tests is cheaper than adding the pattern
```

A useful self-check: *if a new contributor joins tomorrow, can they add a
test without copying setup from another file?* If no, the suite has
already drifted into helper-spaghetti and needs a pattern pass before
adding more tests.

### Failure Mode: Flaky-Suite Spaghetti

The signature of under-engineered test infra is recognizable:

```text
- fixed `sleep` calls before asserts
- "skip if flaky" markers or `@pytest.mark.flaky` used to hide the cause
- copy-pasted login / setup / teardown in many test files
- one shared DB row or shared user mutated by many tests
- mock setup that is longer than the assertion it enables
- "just one more fixture parameter" added to fix a new case
- tests pass locally, fail in CI, with no clear reproducer
- new tests must run in a specific order to pass
```

When this shape appears, stop and reach for the right pattern from the
list above. The goal is not layers for their own sake; the goal is that
the next test is a normal local edit, not a copy-paste of broken setup.

### Pattern Selection Questions

Use these as a quick gate before leaving the architecture step:

```text
1. Which scope does this change live at? (file / suite / infra)
2. Is the suite pattern-sensitive? (parallel, stateful, auth, external,
   time, browser, large)
3. What is the dominant force?
     - state setup / isolation      -> builders, transactions, namespaces
      - async / external boundary    -> contract-powered test server, ACL, recording
     - time / retries / scheduling  -> deterministic clock, condition waits
     - auth / tenants / roles       -> reusable auth fixture, factories
     - parallel / shared state      -> resource pool, isolation, preflight
     - long-lived / many cases      -> BDD scenarios, tagging, golden files
4. What existing pattern in the suite already solves something similar?
   Reuse or evolve it before introducing a new one.
5. What is the smallest pattern that makes the next test local?
```

A pattern does not have to be implemented fully on day one. Naming it in
the test-infra plan is enough to make the boundary visible and to keep
the next test from sliding back into copy-paste setup.

---

## Planning Infra Work

For non-trivial infra, produce a small architecture plan before editing:

```markdown
## Test Infra Plan

### Scenarios Supported
- Scenario: ...

### Framework / Tooling
- Choice:
- Why:

### State Model
- Data setup:
- Isolation:
- Cleanup:

### Resources And Preflight
- Required services/env/binaries:
- Fail-fast check:

### Implementation Slices
1. Add runner/framework config
2. Add fixtures/builders/preflight
3. Prove with one representative BDD test
```

---

## Implementation Guidance

Implement the smallest infra slice that supports the current scenarios and will scale to nearby cases.

Good first slice:

- test command/config
- one BDD scenario/spec path
- shared setup fixture
- isolated state
- preflight for required resources
- one representative test proving the infra works

Do not build a full enterprise test platform before the first useful case. But also do not hack a fragile one-off fixture that will collapse on the next case.

---

## When To Use Subagents

Use separate subagents for independent infra areas:

- framework/tool choice research
- fixture/data-builder design
- local service/container setup
- browser/e2e environment setup
- migration of first representative cases

Keep dependent steps sequential: define framework and state model before parallelizing test case implementation.

---

## Common Mistakes

| Mistake | Better |
| --- | --- |
| Adding sleeps to make tests pass | Design condition waits. |
| Copying auth/setup into every test | Build reusable fixtures. |
| Mocking the subsystem under test | Use real/local resources or mock lower boundary. |
| No preflight checks | Fail fast with clear environment errors. |
| Bootstrapping too much for one small change | Use smallest useful infra slice or manual testing. |
| Treating BDD as heavyweight ceremony | Pick lightweight BDD-style tooling. |
| Patching the next test by hand (extra sleep, copied setup, `@flaky`) instead of fixing the shared infra | Reach for the right pattern (builders, isolation, deterministic clock, fake server) and grow the suite from there. |
| Building a per-test fake server, custom mini-framework, or heavyweight test platform for a small suite | Right-size: pattern effort goes where under-engineering is costly, not into one-off scripts. |

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Need to decide scenarios, proof type, or automation scope first | `high-level-testing-strategy` |
| Automated tests can be implemented after infra is ready | `test-driven-development` |
| Runtime/manual proof is the right or complementary path | `manual-testing` |
| Infra work should be decomposed into implementation tasks | `planning-implementation` |
| About to claim test infrastructure is ready | `verification-before-completion` |
| Cross-domain pattern-vs-bare-code rule (three scopes, right-sized engineering, failure modes) | `architecting-changes` (Pattern Awareness section) |

---

## Final Check

- BDD-friendly framework or scenario pattern is chosen.
- State setup, isolation, and cleanup are explicit.
- Required resources have preflight checks.
- Flakiness risks are addressed architecturally.
- Mocks are at justified boundaries.
- Pattern-sensitive areas (parallel, stateful, auth, external, time, browser, large) have their patterns named, even if not yet implemented.
- One representative test proves the infra works.
- Follow-up test implementation routes to `test-driven-development`.
