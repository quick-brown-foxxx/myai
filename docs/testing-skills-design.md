# Testing Skills Design

## Goal

Create a local testing skill set that replaces direct Superpowers/Addy TDD guidance with a testing philosophy aligned to `ENGINEERING-PHILOSOPHY.md`:

- tests prove behavior, not coverage numbers
- realistic tests beat mocked green checkmarks
- BDD-style test case design is preferred for all levels of testing
- test-first is the default when writing tests for new behavior or bug fixes
- test infrastructure deserves the same architectural care as production code

The result should be a small group of focused skills rather than one overloaded testing skill.

## Source Material

| Source | File | Keep / Drop |
| --- | --- | --- |
| Superpowers TDD | `.tmp/superpowers/skills/test-driven-development/SKILL.md` | Keep red/green idea and "test must prove it can fail". Drop Iron Law, mandatory delete-code rule, universal TDD absolutism. |
| Superpowers anti-patterns | `.tmp/superpowers/skills/test-driven-development/testing-anti-patterns.md` | Mostly skip. Useful ideas are already better covered elsewhere: don't test mocks, don't add test-only production methods, mock minimally. |
| Addy TDD | `.tmp/addy-agent-skills/skills/test-driven-development/SKILL.md` | Keep Prove-It pattern, outcome-over-interaction, DAMP, flaky-test warnings, mock-boundary guidance. Drop pyramid/resource-model section. |
| Addy testing patterns | `.tmp/addy-agent-skills/references/testing-patterns.md` | Cherry-pick examples and fluent assertion style; do not keep as aux reference unless a future TS skill needs it. |
| Addy browser testing | `.tmp/addy-agent-skills/skills/browser-testing-with-devtools/SKILL.md` | Extract later as manual/runtime browser verification, not automated testing. |
| Python testing | `.tmp/my_coding_rules_python/skills/testing-python/SKILL.md` | Keep as future Python-specific skill: pytest config, fixtures, tmp dirs, HTTP servers, containers, CLI/e2e examples. Generic philosophy moves into core testing skills. |

## Settled Skill Split

| Skill | Primary User | Purpose |
| --- | --- | --- |
| `high-level-testing-strategy` | Orchestrator / implementer | Decide what behavior needs tests, write BDD cases first, choose automated vs manual coverage, identify required test infra. |
| `test-driven-development` | Implementer | Execute BDD/test-first red-green-refactor for selected test cases. |
| `manual-testing` | Implementer / verifier subagent | Run realistic smoke/e2e/manual verification when automation is insufficient, too costly, or complementary. |
| `architecting-test-infra` | Orchestrator / architecture-focused implementer | Design or improve test framework, fixtures, state isolation, seeds, resource preflights, and environment management. |

Future language-specific skills:

| Skill | Scope |
| --- | --- |
| `testing-python` | Pytest, fixtures, Python CLI/e2e tests, pytest-httpserver, containers, uv/poe commands. |
| `testing-typescript` | Vitest/Jest, Playwright, MSW or server fakes, TS assertion patterns, framework-specific tooling if needed. |

## Workflow Map

Every testing skill should include a compact map at the top so agents can choose the right skill and avoid over-triggering.

```
high-level-testing-strategy
  -> architecting-test-infra    (if framework/fixtures/state/env are missing or weak)
  -> test-driven-development    (for automated test implementation)
  -> manual-testing             (for runtime/e2e/smoke verification)
  -> verification-before-completion
```

Skill responsibilities:

| Situation | Use |
| --- | --- |
| Need to decide what to test, create cases, or review coverage | `high-level-testing-strategy` |
| Need to implement automated tests and code changes | `test-driven-development` |
| Need realistic browser/API/CLI/manual verification | `manual-testing` |
| Need test runner, fixtures, data builders, isolation, services, preflights | `architecting-test-infra` |
| Need to claim tests pass or work is complete | `verification-before-completion` |

Orchestrator vs implementer split:

| Role | Uses |
| --- | --- |
| Orchestrator | `high-level-testing-strategy`, task decomposition, subagent assignment, infra decision. |
| Test infra architect | `architecting-test-infra`; this is an architecture/design step before straightforward implementation. |
| Feature/bug implementer | `test-driven-development`, with test cases from strategy. |
| Runtime verifier | `manual-testing`, often as a fresh subagent for complex flows. |

## Core Decisions

### BDD Is Preferred

BDD-style test case design is the default for new test suites, new test infrastructure, unit tests, integration tests, e2e tests, and smoke tests.

The reason is practical: two-file BDD-style patterns that split plain-language scenarios from implementation make agents write better tests. They reduce common failure modes:

- testing mocks instead of behavior
- producing green checkmarks that do not prove user-visible behavior
- hiding unclear requirements inside test code
- overfitting tests to the implementation

When bootstrapping test infrastructure, prefer modern, lightweight, popular, fluent, low-verbosity BDD-capable frameworks when the ecosystem has a good option.

BDD here means BDD-style behavior scenarios first. It does not require heavyweight Cucumber-style frameworks if the ecosystem has a simpler, better option.

### Existing Non-BDD Suites

When a project already has a non-BDD test style and porting is out of scope, preserve the local style but keep the BDD scenario text near the test.

Default fallback:

```text
BDD scenario doc / heredoc / docstring
  before each real test case
```

This protects the purpose of the test even when the framework is not BDD-native. For very simple tests with already self-explanatory names, the scenario text can be short, but the behavior should still be explicit.

### Test-First Default

If writing tests, prefer TDD/test-first by default.

Strong defaults:

- write BDD cases before implementation
- for bug fixes, reproduce the bug first
- run the new test and observe it fail for the expected reason
- implement the minimal code needed to pass
- refactor only while tests stay green

Writing tests after core logic exists is a bad default because tests often pass immediately and only confirm the implementation, not the intended behavior.

Acceptable exceptions depend on context: characterization tests around existing legacy behavior, adding safety before refactor, low-value one-off scripts, or cases where automation is not realistic and manual verification is the better proof.

### Testing Implementation Details Is Bad

Tests should assert externally observable behavior, state, outputs, persisted effects, UI, responses, or public contracts.

Avoid:

- method-call sequence assertions for internal collaborators
- asserting that mocks were rendered or called unless the interaction itself is the public contract
- testing private functions through brittle internals
- snapshots that nobody reviews

Good rule: test outcomes, not implementation details.

### Mock At Boundaries Only

Prefer real implementations when practical.

Mock only at boundaries where reality is slow, non-deterministic, expensive, unsafe, or external:

- third-party APIs
- email/SMS/payment delivery
- time and randomness
- external binaries or system services
- network calls where a local fake server is better than live dependency

When mocking response data, mirror the real shape. Partial mocks hide structural assumptions and can make tests pass while integration fails.

### DAMP Over DRY

Tests are executable specifications. Duplication is acceptable when it makes each test independently readable.

Avoid over-abstracted test helpers that hide the story. Shared builders and fixtures are good when they encode domain setup, not when they obscure what the case is proving.

### Fluent Assertions Are Preferred Where They Clarify Contracts

Use fluent or partial contract assertions when they make intent clear, for example:

```typescript
expect(object).toHaveProperty('key', 'value')
```

But do not make this a blanket style rule. Exact shape assertions are better when the whole object is the contract; partial assertions are better when only specific contract fields matter.

### Flakiness And Isolation Are Architecture Problems

Flaky tests, timing-dependent tests, order-dependent tests, and shared-state leaks should not be patched ad hoc inside individual cases.

When flakiness or complex setup appears, step aside from the current test case and improve shared test infrastructure first:

- deterministic waits instead of sleeps
- isolated filesystem/env/database state
- explicit cleanup and lifecycle management
- data builders or seed layers
- resource preflight checks
- separate namespaces for parallel tests

Test suite infrastructure should be planned and maintained like production architecture.

## When To Write Automated Tests

Write automated tests for:

- medium, big, risky, or behavior-changing work
- bug fixes, before fixing when practical
- projects that already have a test suite
- greenfield projects where test infrastructure is part of setup
- reusable internal tools or CLIs
- scripts or utilities with complex edge cases that are hard to verify manually

Do not write automated tests for:

- pure configuration changes
- documentation updates
- static content with no behavioral impact
- one-time throwaway scripts where manual verification is enough
- CI/CD pipelines or infra flows that cannot be realistically tested without excessive fake infrastructure

If a large existing repo or subproject has no test configuration, do not blindly bootstrap a whole test system just to make a small change. Prefer manual verification unless the change introduces reusable logic that can be tested cheaply or the task explicitly includes test infrastructure work.

## Manual Testing

Manual testing is not a failure mode. It is useful alongside automated tests and sometimes replaces them when automation would be untrustworthy or not worth the cost.

Manual testing should be realistic and smoke/e2e-like:

- frontend: browser DevTools/MCP, real pages, clicks, screenshots, console/network checks
- backend/API: curl or throwaway Postman-like scripts
- CLI/tools/infra: step-by-step command execution with isolated env vars or temp dirs
- combined flows: UI + API + database/log/admin checks

Manual verification should include:

- environment preflight before starting
- isolated state where practical (`/tmp`, XDG env vars, Docker-like envs)
- logs/dev output checks
- side-effect checks in database/admin endpoints/CLIs
- cleanup after completion
- note why automation is not used when manual replaces automated tests

If test cases are few and simple, run them inline. If they are many, stateful, cross-system, or easy to get wrong, delegate to a fresh subagent.

## Subagents And Separation Of Concerns

Use subagents based on task size and bias risk, not as a mandatory ritual.

Good uses:

- generate BDD cases for medium/big/risky work
- write reproduction tests for complex or quirky bugs without seeing the planned fix
- build test infrastructure as a separate task before feature tests
- run manual verification as a fresh-context checker
- review test quality and catch mock-testing/green-checkmark anti-patterns

For simple bug fixes with one or two obvious test cases, inline work is fine.

The key advantage of separate agents for complex bugs: the test author is less biased by the implementation fix, making the failing test more likely to prove real behavior.

## Bootstrapping Test Infrastructure

Use a dedicated test-infrastructure architecture skill when a project lacks suitable test infrastructure or when existing infra causes friction, flakiness, or ad hoc patches.

Principles:

- BDD is preferred for new suites and fresh setups.
- Pick modern, lightweight, popular, fluent, low-verbosity tools when available.
- Add preflight checks for required services, env vars, binaries, and credentials before individual test cases fail mysteriously.
- For stateful suites, especially CRUD backends, design explicit seed/data-builder layers.
- Prefer real local resources over monkeypatching when practical: tmp dirs, local HTTP servers, containers, mock binaries, local databases.
- Split complex infra setup into subtasks and subagents.

Preflight can live in:

- a resource management/control layer
- shared test setup fixtures
- fail-fast checks at test file start
- explicit environment validation commands

The exact mechanism depends on ecosystem and project size.

## What Each First Skill Should Contain

### `high-level-testing-strategy`

- Top workflow map of related testing skills.
- Decide if tests are needed and what kind.
- Generate BDD cases before implementation.
- Save BDD cases to a doc for medium/big/risky work.
- For small work, allow compact inline BDD cases.
- Identify whether test infra is sufficient before implementation starts.
- Route to `architecting-test-infra` if infra architecture work is needed.
- Route to `test-driven-development` for automated implementation.
- Route to `manual-testing` for runtime/manual verification.

### `test-driven-development`

- Top workflow map of related testing skills.
- Execute BDD/test-first red-green-refactor.
- Keep red-green as process, not Superpowers Iron Law.
- Emphasize: a test that never failed has not proven it can catch the bug.
- Require bug reproduction before bug fix when practical.
- Keep scenario text near test implementation if not using a BDD-native split.
- Do not include broad test architecture guidance; reference `high-level-testing-strategy`.

### `manual-testing`

- Top workflow map of related testing skills.
- Realistic smoke/e2e/manual verification patterns.
- Browser DevTools/MCP guidance belongs here or a later browser-focused sub-skill.
- API/CLI/infra manual test patterns.
- Environment preflight, isolation, cleanup, side-effect verification.
- Guidance for when manual verification replaces automation and how to state residual risk.

### `architecting-test-infra`

- Top workflow map of related testing skills.
- Choose BDD-capable framework/tooling for the ecosystem.
- Set up test runner, fixtures, data builders, seeds, local resources, and preflight checks.
- Fix test infra before piling ad hoc patches into individual tests.
- Include language-agnostic patterns; defer Python/TS specifics to later skills.

## Open Decisions

| Decision | Current Leaning |
| --- | --- |
| Exact names | Use `high-level-testing-strategy`, `test-driven-development`, `manual-testing`, `architecting-test-infra`. |
| Browser skill | Defer as separate browser/manual runtime verification skill unless `manual-testing` grows too large. |
| BDD docs location | Medium/big/risky cases should save docs under `docs/`; exact subdirectory can be chosen when writing `high-level-testing-strategy`. |
| Language-specific skills | Defer until generic skills exist, then refactor `testing-python`. |

## Implementation Order

1. `high-level-testing-strategy`
2. `test-driven-development`
3. `manual-testing`
4. `architecting-test-infra`
5. Update `docs/skill-set-consolidation.md`
6. Sync skill mirrors
7. Later: refactor `testing-python` and optionally add `testing-typescript`
