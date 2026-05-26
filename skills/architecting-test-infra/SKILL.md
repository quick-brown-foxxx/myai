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
---

# Architecting Test Infrastructure

Test infrastructure is architecture. Treat it with the same care as production boundaries.

Use this before writing individual tests when the test runner, BDD framework, fixtures, data, services, isolation, or environment setup are missing or weak.

---

## Testing Skill Map

```text
high-level-testing-strategy
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
- fake local servers that preserve realistic behavior
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
- local HTTP server with mock data over patched HTTP client
- test database/container over in-memory fake when persistence semantics matter
- mock binary over patched `subprocess` when process behavior matters
- browser/runtime inspection over DOM assumptions for visual behavior

Mock only when reality is too slow, unsafe, expensive, nondeterministic, or external.

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

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Need to decide scenarios, proof type, or automation scope first | `high-level-testing-strategy` |
| Automated tests can be implemented after infra is ready | `test-driven-development` |
| Runtime/manual proof is the right or complementary path | `manual-testing` |
| Infra work should be decomposed into implementation tasks | `planning-implementation` |
| About to claim test infrastructure is ready | `verification-before-completion` |

---

## Final Check

- BDD-friendly framework or scenario pattern is chosen.
- State setup, isolation, and cleanup are explicit.
- Required resources have preflight checks.
- Flakiness risks are addressed architecturally.
- Mocks are at justified boundaries.
- One representative test proves the infra works.
- Follow-up test implementation routes to `test-driven-development`.
