---
name: test-driven-development
description: >-
  Use when implementing automated tests and code for new behavior, bug fixes,
  regressions, or behavior changes after test cases are known. BDD/test-first
  red-green-refactor, prove the test can fail, implement minimal code, keep
  scenario text near tests, and verify without orthodox ceremonies.
license: MIT
metadata:
  focus: bdd-test-first-implementation
---

# Test-Driven Development

Write the behavior case first. Watch the test fail for the right reason. Then write the smallest useful code to make it pass.

This is an implementation skill, not the place to design a whole test suite. Use `high-level-testing-strategy` first when test cases or scope are unclear.

---

## Testing Skill Map

```text
high-level-testing-strategy
  -> architecting-test-infra    (if framework/fixtures/state/env are missing or weak)
  -> test-driven-development    (you are here: automated implementation)
  -> manual-testing             (for runtime/e2e/smoke verification)
  -> verification-before-completion
```

| Situation | Use |
| --- | --- |
| Decide what to test or write BDD cases | `high-level-testing-strategy` |
| Implement automated tests and code | `test-driven-development` |
| Verify real browser/API/CLI/runtime behavior manually | `manual-testing` |
| Fix weak fixtures, state isolation, services, or preflights | `architecting-test-infra` |
| Claim tests pass or work is complete | `verification-before-completion` |

---

## When To Use

Use this when:

- implementing new behavior with automated tests
- fixing a bug where a reproduction test is practical
- changing behavior in a project that already has tests
- adding regression coverage before modifying code
- implementing BDD cases from a test strategy

Do not use this for pure docs, static content, pure config changes, or cases where `manual-testing` is explicitly the better proof.

If test infrastructure is missing or brittle, stop and use `architecting-test-infra` first. Do not pile ad hoc setup into individual tests just to get green.

---

## Core Loop

```text
BDD/test case scenario
      │
      ▼
RED: write automated test
      │
      ▼
Run it: confirm expected failure
      │
      ▼
GREEN: minimal implementation
      │
      ▼
Run it: confirm pass
      │
      ▼
REFACTOR: clean while green
```

The key proof is not "a test exists". The proof is that the test can fail for the behavior you care about and pass after the implementation is corrected.

---

## Step 1: Start From BDD

Use an existing BDD case from `high-level-testing-strategy`, or write a compact one before test code.

```gherkin
Scenario: Existing user cannot register with the same email
  Given a user already exists with email "a@example.com"
  When another registration uses "a@example.com"
  Then registration fails with a duplicate-email error
  And no second user record is created
```

If the project uses a BDD-native split, put the scenario in the spec file.

If not, keep the scenario near the test as a heredoc, docstring, or block comment.

---

## Step 2: RED

Write one focused automated test for the scenario.

Good tests:

- prove one behavior or one coherent scenario
- use public APIs or user-visible boundaries
- assert outcomes, not internal method calls
- use real code paths where practical
- include realistic state and edge cases

Run the targeted test and confirm:

- it fails
- the failure is expected
- it fails because behavior is missing or wrong, not because of typo/setup noise

If it passes immediately, it has not proven the behavior. Recheck the case, fixture state, and assertion.

---

## Step 3: GREEN

Write the smallest correct implementation that satisfies the case.

Do not add speculative options, future abstractions, or unrelated refactors. If the test is hard to write or requires huge setup, the design or test infrastructure may be wrong. Pause and route to `high-level-testing-strategy` or `architecting-test-infra`.

Run the targeted test and confirm it passes.

---

## Step 4: REFACTOR

Refactor only after green:

- improve names
- remove duplication
- extract helpers that clarify domain setup
- simplify implementation

After each meaningful refactor, rerun the relevant test. For larger changes, run the surrounding suite.

---

## Bug Fixes: Prove-It Pattern

For bugs, start with reproduction:

```text
Bug report
  -> BDD scenario for the failing behavior
  -> automated test that fails on current code
  -> fix root cause
  -> test passes
  -> broader regression check
```

For complex or quirky bugs, consider a separate subagent to write the reproduction test without seeing the planned fix. This reduces implementation bias.

If an automated reproduction is not practical, document why and use `manual-testing` for realistic verification.

---

## Existing Code And Characterization

Sometimes code already exists before tests. Do not pretend this is normal TDD.

Acceptable patterns:

- characterization tests before refactoring legacy behavior
- regression tests added before a bug fix
- safety tests for existing behavior before risky changes
- manual verification where automation would be fake or excessive

Still prefer BDD scenario text and outcome-based assertions.

---

## Test Quality Rules

### Test Outcomes, Not Implementation Details

Prefer assertions on:

- return values and errors
- persisted records or files
- HTTP status/body/contracts
- CLI output and exit codes
- visible UI state
- public events or messages

Avoid method-call sequence checks unless the call itself is the public contract.

### Mock At Boundaries Only

Use real code by default. Mock only external, slow, nondeterministic, unsafe, or expensive dependencies.

If you mock response data, mirror the real shape. Partial mocks create false confidence.

### DAMP Over DRY

Keep tests readable as specs. Test should keep test code DAMP (Descriptive And Meaningful Phrases) rather than DRY (Don't Repeat Yourself). Avoid clever shared helpers that hide the case.

### Deterministic Over Flaky

Use condition-based waits, isolated state, and explicit setup/cleanup. Do not add sleeps or order dependencies unless the timing itself is the behavior under test.

---

## Running Tests

Run checks in this order:

1. New targeted test: should fail in RED.
2. New targeted test: should pass in GREEN.
3. Nearby suite or package tests after refactor.
4. Full relevant suite at completion when practical.

Do not rerun the same command repeatedly without changing code or state. It adds little evidence unless the test is suspected flaky.

---

## Common Mistakes

| Mistake | Better |
| --- | --- |
| Test passes immediately | Fix the test or setup; it did not prove the behavior. |
| Testing mock calls instead of behavior | Assert externally visible outcome. |
| Adding test-only methods to production code | Put lifecycle/cleanup in test utilities or fixtures. |
| Writing broad code before one case is green | Implement the current scenario only. |
| Hacking fixtures inside every test | Use `architecting-test-infra`. |
| Calling manual clicking "tested" without evidence | Use `manual-testing` and record steps/results. |

---

## Final Check

- BDD scenario exists near or before the test.
- The test failed for the expected reason before the fix.
- The implementation is minimal and behavior-focused.
- Assertions verify outcomes, not internals.
- Tests pass after implementation.
- Broader verification is delegated to `verification-before-completion` before claiming completion.
