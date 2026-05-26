---
name: executing-plans-with-subagents
description: >-
  Use when executing an implementation plan by delegating bounded tasks to
  fresh subagents. Applies to medium/big or multi-step plans where inline execution
  would overload context, where independent slices can be delegated, or where
  agent-written work needs explicit integration, review, and verification loops.
license: MIT
metadata:
  focus: subagent-plan-execution
  tags: orchestration, subagents, implementation
---

# Executing Plans With Subagents

Use subagents as isolated workers for bounded plan tasks. The orchestrator owns
the plan, context packaging, sequencing, integration, review, and final
verification.

---

## Core Rule

Dispatch subagents for scoped units of work, not for vague responsibility.

```text
written plan / clear task list
        |
        v
orchestrator extracts next bounded task
        |
        v
subagent implements or investigates one slice
        |
        v
orchestrator integrates, runs review and verification agents
        |
        v
orchestrator prepares final verification
```

The subagent is not the project lead. It should not silently expand scope,
invent requirements, or coordinate other agents.

---

## When To Use

Use this when:

- there is an implementation plan or clear task list
- tasks are distinguishable to delegate with explicit acceptance criteria
- inline execution would overload context or mix too many concerns
- you need fresh-context implementation plus review and verification loops
- a teammate/lead agent is orchestrating multiple bounded implementation slices

Prefer inline execution when:

- the task is small, obvious, and local
- the implementation fits safely in one focused edit
- dispatching and integrating a subagent would cost more than doing the work
- the orchestrator needs one continuous mental model of a tightly coupled change

For medium/big tasks, prefer this skill over inline execution. Inline execution and
subagent execution can be combined: the orchestrator may do small checks or local
edits directly, while delegating larger bounded slices.

---

## Required Inputs

Before dispatching implementation subagents, have:

| Input | Requirement |
| --- | --- |
| Plan or task list | Ordered tasks with acceptance criteria and verification steps. Use `planning-implementation` if missing. |
| Scope boundary | What the subagent may touch and what it must not touch. |
| Relevant context | Specs, docs, files, constraints, and examples needed for this task only. |
| Verification path | Commands or manual checks that prove this task. |
| Integration owner | The current orchestrator remains responsible for merging and judging results. |

If the plan is wrong, unclear, or too coarse, revise the plan before delegating.
Use `doubt-early` when the decomposition or assumptions feel suspect.

---

## Subagent Lifecycle

Most subagents are one-shot. When a subagent asks a question, reports
`NEEDS_CONTEXT`, or reports `BLOCKED`, it has exited and its context is gone.

Continuation means fresh re-dispatch:

```text
1. Read the subagent's report.
2. Resolve the question or blocker.
3. Build a new prompt with the original task plus the new answer/context.
4. Tell the new subagent to inspect current repo state first
5. Continue interrupted work from evidence, not from assumed memory.
```

Do not write prompts that assume same subagent resumes after a question unless
the current agentic system explicitly supports persistent subagent conversations.
This skill does not target that mode by default.

---

## Execution Flow

```text
1. Load and sanity-check the plan
        |
        v
2. Create an execution todo list from plan tasks
        |
        v
3. Decide sequence vs parallel fan-out
        |
        v
4. Dispatch bounded implementer subagent(s)
        |
        v
5. Inspect reports and changed files
        |
        v
6. Run spec compliance review
        |
        v
7. Run code quality review when warranted
        |
        v
8. Fix or re-dispatch until findings are resolved
        |
        v
9. Run integrated verification before claiming progress
```

Review depth scales with risk. For tiny delegated work, self-review plus focused
verification can be enough. For medium, risky, or merge-bound work, use fresh
review through `doing-code-review`.

---

## Parallel Dispatch

Do not blanket-spawn parallel implementation subagents. Decide using
`when-and-how-to-run-parallel-agents`.

Parallelize only when tasks are independent:

- they do not depend on each other's outputs
- they edit different files or have an explicit merge protocol
- they can be understood from separate context packets
- they will not make conflicting architecture choices

Sequence tasks when:

- one task defines a contract another task consumes
- tasks edit the same files without a merge plan
- one root cause or design decision may affect all work
- the plan needs one shared mental model

The orchestrator owns integration. Subagents do not coordinate with each other
unless the current platform and the task explicitly define that protocol.

---

## Context Packaging

Give each subagent enough context to succeed and no unrelated context.

Good context packet:

```text
Task
  exact plan task text, acceptance criteria, verification

Relevant high-level context
  why this task exists and what larger behavior it supports

Relevant files/docs
  paths or excerpts the subagent should inspect

Boundaries
  files, layers, features, and docs that are out of scope

Report format
  status, changes, verification, concerns
```

The orchestrator may give high-level/spec docs to the implementer when they help.
For example, a backend implementer may need the general feature plan. Do not make
the backend implementer read low-level frontend docs. If useful context is buried
inside all-in-one docs, extract the relevant sections into the prompt or split the
docs first.

Do not impose a hard rule that subagents must never read docs files. They should read
the files and docs relevant to their bounded task. They should not browse the
whole repository trying to discover their own scope.

---

## Implementer Prompt

Use this as an inline template and trim it to the task.

```markdown
You are implementing one bounded task from an implementation plan.

## Task
{paste exact task text, acceptance criteria, dependencies, verification}

## Context
{briefly explain where this task fits in the larger feature}

## Relevant Inputs
{list relevant files, docs, examples, errors, or excerpts}

## Boundaries
- Touch only what this task requires.
- Do not modify unrelated files, docs, features, or tests.
- Do not add unrequested features or broad refactors.

## Work Instructions
1. Inspect the current repo state and relevant files before editing.
2. Implement the smallest complete slice that satisfies the task.
3. Follow existing project patterns and the plan's architecture.
4. Run the specified verification, or explain precisely why it cannot run.
5. Self-review for missing requirements, scope creep, and weak tests.

## Escalate Instead Of Guessing
Return `NEEDS_CONTEXT` if required information is missing.
Return `BLOCKED` if the task cannot be completed safely.
Return `DONE_WITH_CONCERNS` if complete but correctness or scope is uncertain.

If re-dispatched after a question or blocker, inspect current repo state first.
Do not assume prior subagent memory exists.

## Report Format
- Status: DONE | DONE_WITH_CONCERNS | NEEDS_CONTEXT | BLOCKED
- What changed
- Files changed
- Verification run and result
- Self-review findings
- Concerns, blockers, or follow-up risks
```

---

## Status Handling

| Status | Orchestrator response |
| --- | --- |
| `DONE` | Inspect changed files, then review and verify. |
| `DONE_WITH_CONCERNS` | Read concerns before review; resolve correctness/scope doubts before proceeding. |
| `NEEDS_CONTEXT` | Provide the missing context in a fresh re-dispatch; tell the new agent to inspect current state. |
| `BLOCKED` | Decide whether to fix environment/context, split the task, use `doubt-early`, or escalate to the human/lead. |

Never force the same prompt through again unchanged after a blocker. Something in
the context, plan, task size, or environment must change.

---

## Spec Compliance Review Prompt

Run this before quality review when the task is non-trivial. Scope correctness
comes before code polish.

```markdown
You are reviewing whether an implementation matches its requested task.

## Requested Task
{paste exact task text and acceptance criteria}

## Implementer Report
{paste implementer report}

## Review Instructions
- Do not trust the implementer report.
- Read the actual code and tests they changed.
- Compare implementation to requirements line by line.
- Check for missing requirements, extra unrequested behavior, and misread scope.
- Focus on whether the task was built exactly enough: nothing missing, nothing unnecessary.

## Output
- Status: SPEC_COMPLIANT | SPEC_ISSUES_FOUND
- Findings with file:line references where possible
- Required fixes before quality review
```

If spec issues are found, route through `receiving-code-review`: classify the
findings, fix valid issues, and re-review the affected scope.

---

## Code Quality Review Prompt

Run this after spec compliance passes for medium, risky, or merge-bound work.
Use `doing-code-review` as the review standard.

```markdown
You are reviewing a code change for correctness, maintainability, architecture,
and applicable security/performance risks.

## What Changed
{brief summary from implementation and your own diff inspection}

## Contract
{task, plan section, acceptance criteria, or spec excerpt}

## Diff / Files To Review
{git range, diff summary, or file list}

## Verification Already Run
{commands and results, or "not provided"}

## Review Instructions
- Read the actual diff/code. Do not trust the author's summary.
- Check whether the implementation satisfies the contract.
- Review tests and verification quality.
- Check correctness, readability, and architecture fit.
- Check security only if security-related code/data flows are touched.
- Check performance only if this change can affect latency, rendering, DB load,
  memory, bundle size, or throughput.
- Categorize findings by actual severity.
- Do not nitpick style unless it affects maintainability or local conventions.

## Output
### Findings
Group by Critical / Important / Minor / Question / FYI.
For each finding include file:line, issue, why it matters, and fix if non-obvious.

### Verdict
Approve | Approve with minor follow-ups | Request changes | Needs clarification

### Verification Reviewed
List what evidence you inspected and what you did not verify.
```

---

## Integration And Verification

After subagents return:

```text
For each result:
  read report
  inspect changed files/diff
  check overlap with other subagents
  run review appropriate to risk
  fix or re-dispatch if needed
  run focused verification

After a batch or checkpoint:
  run integrated verification
  compare against plan acceptance criteria
  record remaining work and risks
```

Use `verification-before-completion` before claiming a task, checkpoint, plan, or
agent batch is complete. Agent reports are not proof.

Use `git-workflow` for branch/worktree/commit discipline. This skill does not
require commits; platform and user instructions decide commit behavior.

---

## Common Mistakes

| Mistake | Better move |
| --- | --- |
| Delegating vague work like "implement auth" | Delegate one bounded task with files, criteria, and verification. |
| Making every task a subagent task | Inline small obvious edits; delegate only when isolation helps. |
| Giving the entire docs tree as context | Provide relevant docs, excerpts, or precise paths only. |
| Assuming a subagent can resume after reporting problems | Re-dispatch fresh with updated context and current-state inspection. |
| Parallelizing dependent tasks | Use `when-and-how-to-run-parallel-agents`; define contracts first. |
| Trusting agent reports | Inspect diffs and run verification yourself. |
| Running quality review before spec review | Confirm scope first; polish can wait. |
| Treating review feedback as orders | Use `receiving-code-review` to verify, classify, fix, or push back. |

---

## Related Skills

| Situation | Skill |
| --- | --- |
| Need to write or repair the plan | `planning-implementation` |
| Need slice execution discipline | `incremental-implementation` |
| Need to decide parallel fan-out | `when-and-how-to-run-parallel-agents` |
| Need adversarial check on plan/decomposition | `doubt-early` |
| Need fresh code review | `doing-code-review` |
| Need to handle review findings | `receiving-code-review` |
| Need git isolation or commit hygiene | `git-workflow` |
| Need final evidence before success claims | `verification-before-completion` |
