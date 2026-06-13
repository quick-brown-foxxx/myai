---
name: when-and-how-to-run-parallel-agents
description: >-
  Use when deciding whether multiple agents can work in parallel on independent
  tasks, failures, research threads, verification checks, or implementation
  slices. Guides independence checks, how to properly dispatch parallel work, write focused prompts, integrate agents, and when not to parallelize.
license: MIT
metadata:
  focus: parallel-agent-dispatch
  tags: orchestration, subagents, planning
---

# When And How To Run Parallel Agents

Parallel agents are for **independent problem domains**, not for making one
confused workflow noisier.

Use this skill to decide whether work can be split safely, then define focused
agent tasks with clear contracts and integrate their results deliberately.

For coding-related work, load `engineering-principles` before this skill and tell
coding subagents to load it before their focused task skills.

```text
engineering-principles
  -> planning-implementation / clear task batch
  -> when-and-how-to-run-parallel-agents  (you are here)
       -> independent?
            ├── no  -> sequence work
            └── yes -> executing-plans-with-subagents
                         -> inspect reports and changed files
                         -> doing-code-review       (when warranted)
                         -> receiving-code-review   (if findings need handling)
                         -> integrated verification
                         -> verification-before-completion
```

---

## Core Rule

Dispatch one agent per independent problem domain.

Do **not** parallelize tasks where one task depends on another task's output.

```text
Parallelizable:
  Agent A investigates auth test failures
  Agent B investigates billing test failures
  Agent C checks docs for deployment config

Not parallelizable:
  Agent A researches a library API
  Agent B implements code using that library API
  -> B must wait for A's result
```

---

## When To Use

Use parallel agents when at least two units of work are independent:

- multiple test failures in unrelated subsystems
- independent research questions
- separate verification passes such as accessibility, security, and behavior
- separate implementation slices that do not share files or state
- plan review and source research that can happen before implementation starts
- one agent can inspect docs while another inspects local code, then you merge both findings

Avoid parallel agents when work is sequential, tightly coupled, or needs one
shared mental model.

---

## Independence Test

Before dispatching, answer these questions.

| Question | If yes | If no |
| --- | --- | --- |
| Can each task be understood without the others? | Candidate for parallel dispatch | Keep together or sequence |
| Will agents edit different files, subsystems, or artifacts? | Safer to parallelize | Sequence or isolate carefully |
| Could one root cause explain all failures? | Investigate together first | Split by domain |
| Is there shared mutable state, shared environment, or shared test fixture? | Avoid parallel edits | Parallel likely safer |
| Does task 2 require task 1's output or decision? | Sequence task 2 after task 1 | Parallel may be safe |
| Would two agents make conflicting architecture choices? | Define the contract first | Parallelize after contract exists |

Dependency examples:

```text
Research -> implementation
  Agent 1: research library docs
  Agent 2: implement library usage
  Result: sequential. Implementation waits for research.

Foundation -> extension
  Agent 1: create user settings page
  Agent 2: add password change form inside settings
  Result: sequential. Form waits for page structure.

Contract -> parallel backend/frontend
  Agent 1: define API contract
  Agent 2: implement backend
  Agent 3: implement frontend
  Result: contract first, then backend/frontend can parallelize.
```

---

## Dispatch Pattern

```text
1. Group work into domains
        │
        ▼
2. Check independence and dependencies
        │
        ├── related / sequential -> do not parallelize
        │
        ▼
3. Write focused task contracts
        │
        ▼
4. Dispatch agents concurrently
        │
        ▼
5. Read results and check conflicts
        │
        ▼
6. Integrate, verify, and decide next step
```

The orchestrator owns the merge. Do not let subagents silently coordinate by
editing overlapping state unless the task explicitly gives them that protocol.

---

## Prompt Contract

Each agent prompt should be self-contained and narrow.

```text
Agent task contract
├── Scope: exactly what to inspect or change
├── Goal: what outcome is expected
├── Inputs: files, errors, docs, plan sections, constraints
├── Boundaries: what not to touch
├── Verification: what to run or check, if applicable
└── Output: specific summary format expected by orchestrator
```

Example:

```markdown
Investigate and fix failing tests in `tests/auth/session.test.ts` only.

Goal:
- Identify the root cause of the session timeout failures.
- Fix only this failure domain if the fix is local to auth/session code.

Constraints:
- Do not modify billing, settings, or unrelated test helpers.
- Do not increase arbitrary timeouts as the first fix.
- If the root cause appears shared outside auth/session, stop and report that.

Verification:
- Run the focused auth/session test if you change code.

Return:
- Root cause
- Files changed
- Verification output
- Any conflicts or follow-up risks
```

---

## Integration Step

Parallel work is not complete when agents return. The orchestrator must merge
their findings.

```text
For each result:
  read summary
  inspect changed files or evidence
  check overlap with other agents
  classify conflicts / dependencies discovered late
  run appropriate integrated verification
```

| Result type | Integration response |
| --- | --- |
| Independent fix, no overlap | Keep, then run integrated checks |
| Same file touched by multiple agents | Review diff manually; reconcile or sequence follow-up |
| Agents report same root cause | Collapse into one shared fix path |
| Agent found dependency on another task | Re-sequence; do not force parallel continuation |
| Agent is blocked | Decide whether to provide context, spawn focused research, or escalate |

---

## When Not To Use

Do not dispatch parallel agents when:

- the failures likely share one root cause
- the tasks are a chain, not a set
- one task needs another task's output
- agents would edit the same files without a defined merge protocol
- the whole point is to understand one system-wide interaction
- exploratory debugging has not yet identified separable domains
- the setup cost of parallelization is larger than the task

```text
Bad split:
  Agent A: refactor settings page layout
  Agent B: add password form inside settings page
  Agent C: update settings page tests

Why bad:
  This will cause edits race. The form and tests depend on the page structure. Define or implement the page
  structure first, then parallelize follow-up work if still useful.
```

---

## Common Mistakes

| Mistake | Why it fails | Better move |
| --- | --- | --- |
| "Fix all tests" as one broad agent task | Agent loses focus and context balloons | Split by independent failure domain |
| Splitting related failures too early | One root cause may explain all failures | Investigate shared root first |
| Parallelizing sequential work | Later agents guess missing outputs | Run dependency task first |
| Giving no constraints | Agents refactor outside scope | State files, boundaries, and non-goals |
| Accepting agent summaries without integration | Conflicts and hallucinated success slip through | Inspect evidence and run integrated checks |
| Letting agents edit shared state concurrently | Merge becomes accidental architecture | Define contract or sequence work |

---

## Handoff

Use this skill to decide and dispatch. Then hand off based on outcome:

```text
Independent findings integrated cleanly
  -> continue incremental-implementation or integrated verification

Shared root cause discovered
  -> systematic-debugging

Architecture dependency discovered
  -> architecting-changes or planning-implementation

Plan decomposition was wrong
  -> doubt-early or revise the plan

Final success claim needed
  -> verification-before-completion
```

When using `executing-plans-with-subagents`, this skill remains the lower-level
decision rule for whether tasks are independent enough to fan out.
