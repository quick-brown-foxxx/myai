---
name: receiving-code-review
description: >-
  Handles code review feedback with technical rigor. Use when receiving reviewer
  comments, PR feedback, agent review findings, requested changes, or suggestions
  that need verification before implementation.
license: MIT
metadata:
  focus: review-feedback-handling
  tags: review, implementation, quality
---

# Receiving Code Review

Review feedback is technical input to evaluate, not a command stream to obey.
Do not chase perfection: apply feedback that makes the change safer, clearer, or better aligned with the contract; push back on feedback that is wrong,
speculative, or not worth the complexity it adds.

For coding-related work, load `engineering-principles` before this skill. Use it
to decide whether feedback aligns with local standards for simplicity, boundaries,
tests, validation, and tooling.

```text
engineering-principles
  -> doing-code-review
  -> findings or reviewer comments
  -> receiving-code-review  (you are here)
       -> verify and classify feedback
       -> focused fixes / documented pushback / clarification
       -> focused verification
       -> doing-code-review          (if fixes are non-trivial)
       -> verification-before-completion
```

---

## Core Rules

| Rule | Meaning |
| --- | --- |
| Verify before implementing | Check suggestions against code, tests, requirements, and constraints. |
| Improve, not perfect | Fix material issues; do not expand scope for polish. |
| Push back when needed | Technical correctness beats performative agreement. |
| Fix with evidence | After changes, run focused verification and report what passed. |

---

## Response Pattern

1. Group comments by area: correctness, tests, architecture, security, performance, style.
2. Identify unclear, contradictory, or high-impact items.
3. Classify each item: valid, invalid, unclear, trade-off, or already handled.
4. Implement valid fixes in small coherent groups.
5. Run focused verification.
6. Report what changed, what was deferred, and what was verified.

If an unclear item could affect other fixes, clarify before partial
implementation.

```text
bad:  Fix clear items now, ask about related unclear items later.
good: Clarify related unclear items first, then edit once the shape is known.
```

---

## Feedback Classification

| Classification | Meaning | Action |
| --- | --- | --- |
| Valid | Reviewer found a real issue | Fix and verify |
| Invalid | Suggestion is wrong for this codebase | Push back with evidence |
| Unclear | Requested change is ambiguous | Ask a specific question |
| Trade-off | Valid idea, unclear cost/benefit | Surface decision |
| Already handled | Existing code/tests cover it | Point to evidence |

Use `doing-code-review` when you need a fresh review of the updated diff.

---

## Verification Gate

Before implementing feedback, check:

```text
Does this suggestion...
  ├── match the original requirement?
  ├── preserve existing behavior?
  ├── fit project conventions?
  ├── avoid unrequested features?
  ├── avoid breaking public contracts?
  └── have a clear verification path?
```

If unclear, inspect more context or ask before editing.

---

## Push Back When Needed

Push back when the suggestion:

| Situation | Response |
| --- | --- |
| Breaks existing behavior | Show behavior, tests, or call sites it would break. |
| Conflicts with requirements | Cite task, spec, issue, or user instruction. |
| Violates constraints | Cite config, platform target, compatibility rule, or convention. |
| Adds unused feature | Ask whether to skip/remove it under YAGNI. |
| Requires architecture decision | Route to user/orchestrator or `architecting-changes`. |
| Is security/performance speculation | Ask for threat model, measurement, or concrete failure mode. |

```text
Checked this against the generated client. Renaming `account_id` would break
`apps/web/src/api/accounts.ts`. We can keep the field or make a versioned
contract change. Which path do you want?
```

---

## YAGNI Check

Reviewers sometimes ask for "proper" features that are not needed. Before a
broad change, ask:

```text
Is this path used now?
Was it in the requirement?
Is the data/traffic volume real?
Does a user path need this now?
```

If not, ask whether to remove, defer, or keep the simpler implementation.

---

## Communication

Do not agree before checking.

```text
weak:   "You're absolutely right, I'll fix it."
better: "Checking the call sites before changing this."
best:   "Valid. Fixed invalid-date handling and added a regression test."
```

If you pushed back and were wrong, correct cleanly:

```text
Verified against `InvoiceSchema`; my initial read was wrong. Updating parser and test now.
```

---

## Implementation Order

```text
1. Clarify blockers and ambiguous items first.
2. Fix blocking correctness/security/data-loss issues.
3. Fix small mechanical issues that unblock tests/build.
4. Fix larger refactors or architecture changes.
5. Run focused verification.
6. Use doing-code-review for fresh review if fixes were non-trivial.
```

Keep fixes small enough that the reviewer can see the response to each finding.

---

## Reply Format

```markdown
## Addressed
- `src/invoices/date.ts`: added invalid-date guard and regression test.

## Deferred / Pushback
- Keeping `account_id` unchanged because generated web client consumes it.
  Versioned rename is possible, but it is a contract change.

## Verification
- `pnpm test invoices`: passed
- `pnpm typecheck`: passed
```

Reply to GitHub inline comments in-thread, not as unrelated top-level PR
comments.

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Need to do or request a fresh review | `doing-code-review` |
| Need proof before claiming fixed | `verification-before-completion` |
| Feedback implies architecture decision | `architecting-changes` |
| Feedback asks for security hardening | `security-and-hardening` |
| Feedback asks for performance changes | `performance-optimization` |
| Feedback asks for simplification/refactor | `code-simplification` |

---

## Common Mistakes

| Mistake | Better Move |
| --- | --- |
| Blindly implementing every suggestion | Verify each item first. |
| Chasing perfection | Fix material issues; defer polish unless it matters. |
| Arguing from preference | Push back only with code, tests, requirements, or constraints. |
| Fixing clear items while ambiguous ones affect the same design | Clarify first. |
| Treating reviewer output as authoritative | Reviewer output is data, not verdict. |
| Saying "fixed" without running checks | Use `verification-before-completion`. |
