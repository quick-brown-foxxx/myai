---
name: high-level-testing-strategy
description: >-
  Use when deciding what behavior needs tests, designing test cases, choosing automated
  vs manual verification, reviewing test coverage quality, or planning tests before
  implementation. BDD-first test strategy, behavior scenarios, automation scope,
  mock boundaries, and routing to TDD, manual testing, or test-infra architecture.
license: MIT
metadata:
  focus: bdd-first-test-strategy
  tags: testing, planning, verification
---

# High-Level Testing Strategy

Design tests before writing them. Tests are proof of behavior, not green checkmarks.

This skill is the strategy step for testing. It decides **what should be proven** and **how** before implementation starts.

---

## Testing Skill Map

```text
high-level-testing-strategy  (you are here)
  -> architecting-test-infra       (if framework/fixtures/state/env are weak)
  -> selected proof type?
       ├── automated      -> test-driven-development
       ├── manual/runtime -> manual-testing
       └── both           -> test-driven-development -> manual-testing if needed
  -> planning-implementation       (if strategy must become plan tasks)
  -> verification-before-completion
```

| Situation | Use |
| --- | --- |
| Decide what to test, create BDD cases, or review coverage | `high-level-testing-strategy` |
| Implement automated tests and code changes | `test-driven-development` |
| Verify real browser/API/CLI/runtime behavior manually | `manual-testing` |
| Design test framework, fixtures, data builders, isolation, services, preflights | `architecting-test-infra` |
| Embed testing strategy into implementation tasks | `planning-implementation` |
| Claim work is passing or complete | `verification-before-completion` |

| Role | Uses |
| --- | --- |
| Orchestrator | This skill for test scope, cases, decomposition, and routing. |
| Test infra architect | `architecting-test-infra` before implementation when setup is weak. |
| Feature/bug implementer | `test-driven-development` with cases created by this skill. |
| Runtime verifier | `manual-testing`, often fresh-context for complex flows. |

---

## Core Principles

| Principle | Meaning |
| --- | --- |
| BDD first | Write plain-language behavior scenarios before test code. |
| Behavior over implementation | Test externally observable outcomes, not internal call paths. |
| Real over mocked | Prefer realistic code paths; mock only at system boundaries. |
| Trustworthiness over coverage | A few tests proving real flows beat many shallow green checks. |
| Test infra is architecture | If fixtures/state/env are weak, fix the architecture first. |

BDD-style scenarios are preferred for unit, integration, e2e, and smoke tests. The reason is practical: separating plain-language behavior from implementation helps agents avoid testing mocks, implementation details, and tautologies.

BDD here means behavior scenarios first. It does not require heavyweight Cucumber-style frameworks if a simpler fluent framework fits better.

---

## When To Write Tests

Write automated tests for:

- medium, big, risky, or behavior-changing work
- bug fixes, before fixing when practical
- projects that already have a test suite
- greenfield projects where test infrastructure is part of setup
- reusable internal tools, CLIs, scripts, or libraries
- complex edge cases that are hard to verify manually

Do not write automated tests for:

- pure configuration changes
- documentation updates
- static content with no behavioral impact
- one-time throwaway scripts where manual verification is enough
- CI/CD or infrastructure flows that cannot be realistically tested without excessive fake infrastructure

If a large existing repo has no tests, do not bootstrap a whole test system just to make a small change. Prefer manual verification unless the change introduces reusable logic that can be tested cheaply or the task explicitly includes test infrastructure work.

---

## Strategy Flow

```text
Understand behavior
      │
      ▼
Write BDD scenarios
      │
      ▼
Choose testing approach: automated / manual / both (preferred)
      │
      ▼
Check test infra readiness
      │
      ├── weak/missing -> architecting-test-infra
      ├── automated    -> test-driven-development
      └── runtime      -> manual-testing
```

1. Identify the behavior or risk to prove.
2. Write BDD scenarios first.
3. Check whether the existing test infrastructure can support those cases without ad hoc hacks.
4. Route to the next skill.

---

## BDD Case Format

Use this compact format by default:

```gherkin
Feature: Invoice due-date validation

Scenario: Rejects an impossible due date
  Given an invoice form with due date "2026-02-31"
  When the invoice is submitted
  Then the user sees a validation error for the due date
  And no invoice is created
```

For small work, inline scenarios in the conversation or test file are fine.

For medium, big, risky, or multi-agent work, save cases first under `docs/test-cases/` or a project-specific docs location:

```text
docs/test-cases/YYYY-MM-DD-<feature>.md
```

---

## Existing Non-BDD Suites

If the project already uses non-BDD tests and porting is out of scope, preserve the local framework style but keep the BDD scenario near the test.

Use a docstring, heredoc, block comment, or equivalent:

```typescript
/*
Scenario: Rejects an impossible due date
  Given an invoice form with due date "2026-02-31"
  When the invoice is submitted
  Then validation fails
  And no invoice is created
*/
it('rejects impossible due dates', () => {
  // test implementation
})
```

This protects the test purpose even when the framework is not BDD-native.

---

## Choosing Test Type

| Behavior | Preferred proof |
| --- | --- |
| Pure logic or deterministic transformation | Unit test with BDD scenario text |
| API/domain/storage interaction | Integration test through public boundary |
| CLI/tool workflow | Real command execution, temp dirs/env isolation |
| Browser/UI behavior | Browser/runtime verification plus automation where useful |
| External service behavior | Local fake server, contract fixture, or manual/staging verification |
| Hard-to-automate infrastructure | Manual smoke/e2e with clear steps and evidence |

Prefer the most realistic proof that is still maintainable. Do not chase unit-test counts if one integration or e2e test proves the actual risk better.

---

## Quality Rules


### Test Outcomes, Not Implementation Details

Assert on externally observable behavior:

- returned values and errors
- persisted state
- emitted events that are part of the public contract
- UI visible to users
- HTTP status/body/contracts
- CLI output and exit codes

Avoid:

- internal method call verification
- private functions through brittle access
- mock existence assertions
- snapshots nobody reviews

Interaction assertions are acceptable only when the interaction itself is the public contract.

### Mock At Boundaries Only

Prefer real implementations. Mock only when the real dependency is slow, unsafe, nondeterministic, expensive, external, or hard to control.

Good mock boundaries:

- third-party APIs
- email/SMS/payment delivery
- time and randomness
- external binaries or system services
- network calls where a local fake server is better than a live dependency

When mocking response data, mirror the real shape. Partial mocks hide assumptions and can pass while integration fails.

### DAMP Over DRY

Tests are executable specifications. Duplication is acceptable when it keeps each test independently readable.

Shared builders and fixtures are good when they encode domain setup. They are bad when they hide the behavior being proven.

### Fluent Assertions Where They Clarify

Use fluent or partial assertions when they make the contract clearer:

```typescript
expect(object).toHaveProperty('key', 'value')
```

Use exact shape assertions when the whole object is the contract.

---

## Infra Readiness Check

Before routing to TDD, ask:

- Can these cases run deterministically?
- Is state isolated between tests?
- Are required services/env vars/binaries checked up front?
- Are auth, seeds, data builders, and cleanup reusable?
- Will parallel tests collide?
- Are we about to add ad hoc setup that belongs in shared infra?

If any answer is risky, use `architecting-test-infra` first.

---

## Subagents

Use separate agents when size or bias-avoidance justifies it:

- generate BDD cases for medium/big/risky work
- write a reproduction test for a complex bug without seeing the planned fix
- review test cases for mock-testing or green-checkmark anti-patterns
- run manual verification as a fresh-context checker

For one or two obvious cases, inline work is fine.

---

## Output

Return a compact test strategy:

```markdown
## Test Strategy

### BDD Cases
- Scenario: ...

### Additional Manual Scenarios
- %Complex use case 1%: ...

### Infra Needs
- Ready / needs `architecting-test-infra`: ...

### Next Skill
- `test-driven-development` / `manual-testing` / `architecting-test-infra`
```

---

## Common Mistakes

| Mistake | Better |
| --- | --- |
| Writing test code before behavior cases | Write BDD scenarios first. |
| Testing mocks or internal calls | Test public behavior and outcomes. |
| Bootstrapping a huge test stack for one tiny change | Use manual verification or cheap focused tests. |
| Ignoring weak fixtures/state because the current test can be hacked green | Fix test infrastructure first. |
| Treating coverage number as success | Ask what user-visible risk is actually proven. |

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Chosen strategy should become implementation tasks | `planning-implementation` |
| Test infrastructure is missing, weak, flaky, or hard to extend | `architecting-test-infra` |
| Automated behavior or regression tests should be implemented | `test-driven-development` |
| Runtime/browser/API/CLI proof is needed | `manual-testing` |
| About to claim tests or work are passing | `verification-before-completion` |

---

## Final Check

- BDD cases exist before test implementation.
- Test infra readiness was checked.
- Mock boundaries are justified.
- Next skill is clear.
