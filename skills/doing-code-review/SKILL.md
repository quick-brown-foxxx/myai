---
name: doing-code-review
description: >-
  Reviews code changes, PRs, diffs, branches, and agent-written code. Use when
  reviewing finished work, checking whether work is ready to merge, commit, or
  hand off, or requesting fresh-context or subagent review.
license: MIT
metadata:
  focus: evidence-based-code-review
  tags: review, verification, quality
---

# Doing Code Review

Review is evidence-based risk reduction.

The goal is not perfection. Approve a change when it definitely improves overall
code health, even if it is not exactly how you would have written it.

```text
doing-code-review  (you are here)
  -> understand contract and verification story
  -> inspect diff, tests, and applicable risk axes
  -> findings?
       ├── yes -> receiving-code-review -> focused fixes -> focused verification
       └── no  -> verification-before-completion / approve with residual risks
```

---

## Core Rules

| Rule | Meaning |
| --- | --- |
| Review requires fresh eyes | Real review usually means a subagent or fresh-context reviewer. |
| Self-review is weak evidence | Good for tiny work; not enough for medium/big/risky/merge-bound work. |
| Improve, not perfect | Do not block a net-positive change on personal preference. |
| Evidence first | Findings need file/line, behavior, tests, logs, or concrete reasoning. |
| Severity must be honest | Do not mark nitpicks as blockers or hide real risks as polish. |

---

## When To Use

Use this skill when reviewing:

- pull requests, branches, diffs, or uncommitted changes
- code written by an agent, colleague, or yourself
- medium/big work before merge, commit, or handoff
- small but critical changes, such as CI, build, deployment, auth, payments, migrations, or fragile config

Self-review alone is acceptable only for tiny, low-risk work:

```text
self-review may be enough:
  one-line typo fix
  small README wording change
  obvious import cleanup

fresh review needed:
  production behavior change
  medium/big implementation
  agent-written code others will trust
  PR before merge
  fragile CI/build/deploy config
```

---

## Review Axes

Review applicable axes. Correctness, readability, and architecture usually
apply. Security and performance are conditional, not ceremonial.

```text
always start here:
  1. Correctness
  2. Readability and simplicity
  3. Architecture fit

only when relevant:
  4. Security
  5. Performance
```

| Axis | What To Check |
| --- | --- |
| Correctness | Requirements, edge cases, error paths, tests, regressions, state/concurrency. |
| Readability | Naming, direct control flow, earned abstractions, scoped diff, no dead artifacts. |
| Architecture | Boundaries, ownership, coupling, existing patterns, public contracts. |
| Security | Only if touching auth, user input, secrets, PII, file upload, callbacks, SQL/query construction, CORS/CSP/cookies. |
| Performance | Only if touching complex queries, rendering, large data, hot paths, caching, workers, bundle/page-load-sensitive code. |

Route deeper when needed:

| Concern | Use |
| --- | --- |
| Security-sensitive change | `security-and-hardening` |
| Measurable performance risk | `performance-optimization` |
| Readability/complexity cleanup | `code-simplification` |
| Boundary/design question | `architecting-changes` |
| Independent specialist reviews | `when-and-how-to-run-parallel-agents` |

---

## Review Process

```text
1. Understand intent
        │
        ▼
2. Inspect verification story
        │
        ▼
3. Review tests first when tests exist
        │
        ▼
4. Review implementation across applicable axes
        │
        ▼
5. Classify findings by severity
        │
        ▼
6. Give verdict
```

### 1. Understand Intent

Identify the contract before judging the code.

```text
contract inputs:
  task / issue / PR description
  implementation plan or acceptance criteria
  current user instruction
  ADR/spec/design doc
  expected behavior before vs after
```

If the contract is missing or contradictory, verdict is `Needs clarification`.

### 2. Inspect Verification Story

| Claim | Evidence Expected |
| --- | --- |
| Tests pass | Exact command and output summary |
| Build/typecheck passes | Exact command and result |
| Bug fixed | Reproduction, regression test, or original symptom check |
| UI works | Manual path, screenshot, browser check, or E2E result |
| Requirements met | Checklist against contract |

If the author claims success without evidence, route through
`verification-before-completion`.

### 3. Review Tests First

```text
good tests:
  prove user-visible behavior
  cover important edge/error paths
  fail for the original bug
  avoid mocking away the thing under test

weak tests:
  assert implementation details only
  patch every dependency until nothing real remains
  test only happy path for risky behavior
```

### 4. Review The Implementation

Read the actual diff, not only summaries.

```bash
git diff --stat <base>..<head>
git diff <base>..<head>
```

For uncommitted work:

```bash
git status --short
git diff
```

---

## Severity And Verdict

| Severity | Meaning | Action |
| --- | --- | --- |
| Critical | Security issue, data loss, broken functionality, serious regression | Must fix before proceeding |
| Important | Missing requirement, fragile design, weak error handling, meaningful test gap | Fix before merge unless accepted as trade-off |
| Minor | Naming, polish, local simplification, documentation | Optional or follow-up |
| Question | Contract, intent, or existing behavior unclear | Clarify before judging |
| FYI | Useful context, no action requested | No action |

| Verdict | Meaning |
| --- | --- |
| Approve | No blocking findings; change is safe enough to proceed. |
| Approve with minor follow-ups | Only non-blocking issues remain. |
| Request changes | Critical or Important findings must be addressed. |
| Needs clarification | Cannot review honestly until contract/intent is clarified. |

---

## Output Format

Findings come first. Summaries are secondary.

```markdown
## Findings

### Critical
- `src/auth/session.ts:42` - Missing ownership check before returning session data.
  Why it matters: authenticated users can read other users' sessions.
  Fix: require `session.userId === currentUser.id` before returning the record.

### Important
- `src/billing/retry.ts:88` - Retry loop retries validation errors.
  Why it matters: permanent bad requests are treated as transient failures.
  Fix: retry only network errors and 5xx responses.

### Minor
- `src/components/Invoice.tsx:17` - Generic name `data` hides intent.
  Fix: rename to `invoiceSummary`.

## Verdict
Request changes.

## Verification Reviewed
- Tests: `pnpm test billing`
- Build/typecheck: not provided
- Manual verification: not applicable
```

No findings is still a finding.

```markdown
## Findings
No findings.

## Residual Risk
I did not run the test suite myself. Review was limited to diff and test inspection.

## Verdict
Approve.
```

---

## Requesting Fresh Review

Use a fresh reviewer for medium/big work, risky changes, PR readiness, or when
the author is also the implementer.

Package context deliberately:

```text
review packet
├── what changed
├── requirements / acceptance criteria
├── diff range or files to inspect
├── verification already run
├── known risks or focus areas
└── expected output format
```

### Inline Reviewer Prompt

```markdown
You are reviewing a code change for correctness, maintainability, architecture,
and applicable security/performance risks.

## What Changed
<brief summary>

## Contract
<task, issue, plan section, PR description, or acceptance criteria>

## Diff / Files To Review
<git range, diff summary, or file list>

## Verification Already Run
<commands and results, or "not provided">

## Review Instructions
- Read the actual diff/code. Do not trust the author's summary.
- Check whether the implementation satisfies the contract.
- Review tests and verification quality.
- Check correctness, readability, and architecture.
- Check security only if security-related code/data flows are touched.
- Check performance only if this change can affect latency, rendering, DB load,
  memory, bundle size, or throughput.
- Categorize findings by actual severity.
- Do not nitpick style unless it affects maintainability or local conventions.

## Output Format
### Findings
Group by Critical / Important / Minor / Question / FYI.
For each finding include file:line, issue, why it matters, and fix if non-obvious.

### Verdict
Approve | Approve with minor follow-ups | Request changes | Needs clarification

### Verification Reviewed
List what evidence you inspected and what you did not verify.
```

### Optional Split Review

For large plan-driven work, split review into two passes:

```text
Pass 1: Spec compliance
  Did the implementation build exactly what was requested?
  Missing requirements?
  Extra unrequested behavior?
  Misread acceptance criteria?

Pass 2: Code quality
  Is the implementation clean, maintainable, tested, and well integrated?
```

Run spec compliance first. If scope is wrong, quality review can wait.

---

## Reviewability

| Change Size | Review Posture |
| --- | --- |
| ~100 lines | Good default; review in one pass. |
| ~300 lines | Acceptable if it is one coherent change. |
| ~1000 lines | Usually too large; split unless mostly generated, deletion, or mechanical. |

Separate behavior changes, refactors, formatting, generated files, and docs when
that makes review materially clearer.

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Need to handle requested changes or reviewer comments | `receiving-code-review` |
| Need proof before approval or completion claims | `verification-before-completion` |
| Need independent specialist review or parallel review passes | `when-and-how-to-run-parallel-agents` |
| Boundary/design question affects review verdict | `architecting-changes` |
| Security-sensitive change | `security-and-hardening` |
| Performance-sensitive change | `performance-optimization` |
| Complexity/readability cleanup | `code-simplification` |

---

## Final Check

Before giving a verdict:

- The contract is clear enough to judge the change.
- Findings are evidence-backed and severity-labeled.
- Security and performance were checked only when applicable, or explicitly scoped out.
- Verification evidence was inspected or its absence was stated.
- The verdict is clear.
- Any accepted imperfection still leaves the codebase better than before.
