---
name: teamlead-coordination
description: >-
  ALWAYS LOAD THIS SKILL WHEN ACTING AS A TEAMLEAD AGENT
  SESSION. Do not run a Teamlead-led multi-epic session directly — use this skill first.
  Backlog-driven multi-epic operating model, slice contract, teammate archetypes, verify-triage-fix chains,
  epic reject protocol, periodic analysis teammate, and the user-picks-teamlead boundary.
  Use when a user explicitly starts a Teamlead session, when coordinating teammates across multiple epics
  or features, when maintaining a project backlog across long autonomous work, when building a sequence of
  verify-fix teammate passes, or when running a comparison/merge flow for very big epics.
license: MIT
metadata:
  focus: teamlead-operating-model
  tags: orchestration, subagents, planning
---

# Teamlead Coordination

This skill is the operating model for the **Teamlead** agent. It tells you how
to run a Teamlead-led session the way it is meant to run: backlog-driven,
multi-epic, recurring, with explicit verify-triage-fix chains and periodic
analysis.

If you are the **Orchestrator** agent (bounded session, no teammates), load
`using-my-skills` and `executing-plans-with-subagents` instead. They are
orthogonal shapes and should not be mixed.

The user decides at session start whether the session is Teamlead-led or
Orchestrator-led. Do not second-guess that choice.

---

## Core Thesis

A Teamlead-led session is a **recurring backlog loop**, not a linear pipeline.
The Teamlead owns the backlog and the high-level alignment across teammates.
Teammates own one slice at a time and exit when done.

```text
high-level spec (from user)
        |
        v
backlog teammate          -- research + prototype via own subagents, produce multi-doc backlog
        |
        v
backlog verifier teammate -- second pass on same artifact, improve and challenge
        |
        v
for each epic in backlog, one at a time:
        |
        +-> implementer teammate            -- owns one slice end-to-end (plan via subagent, implement, verify)
        +-> verify-triage-fix teammate      -- independent pass: verify, triage findings, fix
        +-> optional 2nd/3rd verify-triage-fix teammate(s)
        +-> if epic fundamentally broken: reject + spawn fresh implementer with carried knowledge
        |
        v
periodic analysis teammate (between epics) -- docs-vs-reality, manual high-level verification, infra gaps
        |
        v
teamlead updates backlog from analysis findings
        |
        v
next epic
```

For very big epics, the implementer slot can be **multi-attempt + parallel
worktrees + comparison + merge** before the verify chain starts. This is the
only place where Teamlead knowingly dispatches work that is *not* strictly
independent across teammates — isolation is enforced by worktrees.

---

## Teamlead ↔ Teammate ↔ Subagent Boundaries

| Role     | Owns                                                       | Spawns                | Has user access |
| -------- | ---------------------------------------------------------- | --------------------- | --------------- |
| Teamlead | Backlog, epic sequencing, team composition, knowledge hand-off, final claim | Teammates, subagents for small auxiliary tasks | Yes             |
| Teammate | One slice end-to-end, or one verify-triage-fix pass, or one analysis pass    | Subagents             | No              |
| Subagent | One bounded research, implement, review, or verification task                | None                  | No              |

A Teamlead that starts editing source code in many files is doing the
Implementer teammate's job badly. Spawn the teammate instead.

---

## Slice Contract

A **slice** is a self-contained medium-size delivery handed to one
Implementer teammate. It is the unit of work the Teamlead dispatches.

Good slice examples:

- "Create and test a new feature: new page + endpoints + tests"
- "Bootstrap the testing infrastructure for the backend"
- "Refactor the auth module end-to-end and update affected tests"
- "Build the new billing flow with backend, frontend, and integration tests"

Bad slice examples (do not dispatch these):

- "Implement auth" — too broad, no acceptance criteria
- "Fix the failing test in `tests/foo.py`" — too small, use a subagent
- "Make the app production-ready" — vague, no shape

The Teamlead defines the slice boundary. The Teammate decides how to plan and
execute inside the slice. The Teammate may decompose the slice into smaller
subagent tasks.

---

## Teammate Lifecycle

Teammates are one-shot by default in most environments. Assume:

- A Teammate starts, completes its assigned work, reports back, and exits.
- The Teamlead cannot ask follow-up questions to the same Teammate.
- A new Teammate cannot see the stopped Teammate's private context.

Therefore, every Teamlead → Teammate prompt must be **self-contained** for a
fresh Teammate, and every Teammate → Teamlead report must be **self-contained**
for the next Teammate the Teamlead spawns.

### Spawning a Teammate

Each Teammate prompt should include:

| Field           | What to put there                                                          |
| --------------- | -------------------------------------------------------------------------- |
| Goal            | What this slice is, in one paragraph                                        |
| Current phase   | Where this slice sits in the epic and the backlog                           |
| Inputs          | Relevant files, docs, spec excerpts, prior teammate reports                |
| Decisions       | Architecture, contract, or design decisions already made that constrain this slice |
| Boundaries     | Files, layers, features, and docs the Teammate must not touch              |
| Verification    | Commands or manual checks the Teammate must run to prove the slice         |
| Knowledge       | What previous Teammates tried, what failed, what to carry forward          |
| Report shape    | The minimum the Teamlead needs back (see "Teammate report" below)         |

The Teammate decides internal decomposition (subagents, plan, retries) on its
own. Do not pre-decompose for it.

### Teammate report

The Teamlead must receive enough to continue without re-reading the source.
The Teammate decides what to put in based on the real case, but the minimum is:

- **What was done** — concrete changes, not vague summaries.
- **What was verified** — commands run, manual checks done, evidence paths.
- **Open issues / risks** — anything not finished, anything the next Teammate
  should know, anything the Teamlead should put back into the backlog.
- **Recommended next move** — which archetype of Teammate to dispatch next, or
  a recommendation to reject and restart the epic.

Do not lock a long rigid template. The Teammate picks the right level of detail
for the case.

### Knowledge hand-off

When the Teamlead spawns the next Teammate, it is the Teamlead's job to
extract from the previous report the things the next one needs:

- Failed approaches and why they failed.
- Verified working approaches and what evidence backs them.
- Open questions that the next Teammate must resolve.
- Slice contract updates that emerged during the previous Teammate's work.

This is the "knowledge pass" move. It is what makes the verify chain
non-redundant.

---

## Default Teammate Archetypes

Use this list as defaults. The Teamlead may invent new archetypes when a task
calls for them — these are not the only legitimate Teammate roles.

| Archetype                   | Job                                                                                   | Typical use                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **Backlog builder**         | Convert a high-level spec into a multi-doc backlog with epic and slice breakdown      | Once per session, after the user provides the high-level spec                |
| **Backlog verifier**        | Second-pass review of the backlog: gaps, ambiguities, missing non-functional concerns | Right after the Backlog builder, before any implementation                   |
| **Implementer**             | Owns one slice end-to-end: plan via subagent, implement, verify                       | One per slice, one epic at a time                                            |
| **Verifier-triage-fixer**   | Independent verify → triage findings → fix what is in scope                            | One to three per Implementer, depending on epic size and prior findings      |
| **Analysis**                | Compare docs/backlog to reality, run manual high-level checks, find infra gaps        | Between epics on a cadence the Teamlead picks                                |
| **Researcher / prototyper** | Test multiple implementation strategies, prototype, report what actually works        | Before implementation on ambiguous, risky, or new-domain slices              |

Common sense archetypes the Teamlead may also dispatch when warranted:

- Environment bootstrap (install browsers, tools, fixtures) — usually a subagent
  unless the bootstrap is large enough to need its own plan.
- Docs and ADRs update — usually a subagent unless the docs rework is its own
  epic.
- Release / launch — a Teammate per the existing release and launch skills.

---

## Operating Model In Detail

### Phase 1: Backlog creation

```text
user provides high-level spec
   -> Backlog builder Teammate (research, prototype, multi-doc output)
   -> Backlog verifier Teammate (improve and challenge the same artifact)
   -> Teamlead reads both, locks the backlog, decides epic ordering
```

The output of this phase is a **backlog** — a project-local artifact the
Teamlead owns for the rest of the session. Place it where the project
convention suggests (often `docs/backlog.md` or a `docs/backlog/` folder); the
Teamlead picks the path and tells the user.

### Phase 2: Per-epic loop

For each epic in the backlog, one at a time:

```text
Implementer Teammate (slice owner)
   -> Verifier-triage-fixer Teammate
   -> optional 2nd / 3rd Verifier-triage-fixer Teammate
   -> if epic broken at the root: reject, spawn fresh Implementer with knowledge pass
   -> if epic solid: mark done, advance backlog
```

The Teamlead decides how many verify passes to run based on:

- Epic size and risk.
- Findings from the prior verify pass.
- Whether the prior Implementer's work touched shared state with other epics.

Two to three verify passes is the normal range for a big epic. One is enough
for a small one. Zero is rarely correct.

### Phase 3: Periodic analysis

Between epics, the Teamlead dispatches an **Analysis Teammate** that:

- Compares the current docs and backlog to actual project state.
- Manually verifies the highest-value end-to-end flows.
- Highlights infra and testing gaps that did not catch problems it found.
- Surfaces features the user asked for that have no test or no implementation.

The cadence is the Teamlead's call. A reasonable default: after every two
epics, or before any "ship" gate, or whenever the user explicitly asks for
drift check.

The Teamlead turns analysis findings into backlog updates and inserts new
epics or slices as needed.

### Phase 4: Complex-epic comparison flow (exception)

For very big/complex/ambiguous epics where a single Implementer attempt is too risky, the
Teamlead may use a multi-attempt pattern:

```text
spawn N Implementer Teammates in parallel worktrees (per git-workflow)
   -> comparison subagent reviews the N attempts
   -> merge Teammate integrates the best parts into the trunk
   -> Verifier-triage-fixer chain as usual
```

This is the only place where Teamlead knowingly dispatches work that is
*not* strictly independent across teammates. Isolation is enforced by
worktrees, not by domain separation. Keep N small (usually 2-3) and be honest
about the merge cost.

---

## Hard Rules For Teamlead

- **Do not edit source code in many files.** Spawn an Implementer Teammate.
- **Do not debug problems end-to-end yourself.** Spawn a focused Teammate or
  subagent.
- **Do not run a long verification-fix loop yourself.** It is the Implementer
  and Verifier-triage-fixer Teammates' job inside the slice.
- **Do not silently replace the user's high-level direction with your own.**
  Surface the conflict, ask or escalate.
- **Do not skip the analysis Teammate indefinitely.** Without it the backlog
  drifts away from reality.
- **Do not over-decompose.** A Teammate owns a slice. A subagent owns a step
  inside a slice. Do not spawn subagents for tasks that fit a slice.
- **Do not let Implementer and Verifier Teammates run in the same worktree**
  without a plan for what happens when both want to commit.
- **Do not blindly trust a Teammate's "done" report.** Inspect changed files
  and run integrated verification before advancing the backlog.

---

## Skill Routing

| Situation                                                            | Skill to load                              |
| -------------------------------------------------------------------- | ------------------------------------------ |
| Need a low-level plan with acceptance criteria for a slice            | `planning-implementation`                  |
| Need brainstorming for a slice or a new epic                          | `brainstorming`                            |
| Need to decide whether a big epic should fan out into parallel worktrees | `when-and-how-to-run-parallel-agents`      |
| Need to dispatch the slice's internal subagents                      | `executing-plans-with-subagents`           |
| Need to define a slice, run a thin verified implementation           | `incremental-implementation`               |
| Need worktree isolation for the big-epic comparison flow             | `git-workflow`                             |
| Need to challenge the backlog or a slice spec before implementation  | `doubt-early`, `prototype-first`           |
| Need a verify-triage-fix pass on Teammate output                     | `doing-code-review`, `receiving-code-review` |
| Need to debug a recurring or high-risk class of failure              | `systematic-debugging`, `bug-root-cause-tracing` |
| Need a Teammate or subagent to do manual end-to-end verification      | `manual-testing`                           |
| Need a final completion claim before reporting to the user            | `verification-before-completion`           |
| Need to think about test cases for a slice (preventing mock-only tests) | `high-level-testing-strategy`, `test-driven-development` |
| Need coding-related engineering standards inside a slice             | `engineering-principles` (for any coding subagent) |

For coding subagents inside a slice, always pass `engineering-principles` in
the prompt.

---

## Handoff At The End Of A Session

When the user closes the session or asks to stop, the Teamlead should leave:

- The backlog at its latest state, with epics marked done / pending / blocked.
- A short summary of where the next session should pick up, written for a
  fresh Teamlead to read cold.
- Any open Analysis findings not yet turned into backlog items, flagged.

This is what makes the next session low-friction. Without it, the next
Teamlead spends the first hour re-deriving context.

---

## Common Mistakes

| Mistake                                                              | Better move                                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Implementing the slice yourself instead of dispatching a Teammate     | Define the slice, spawn an Implementer, integrate when it returns           |
| Letting a Teammate run for a long time without an integration check  | Inspect the report, run focused verification, decide next move before dispatching the next Teammate |
| Treating one verify pass as enough                                   | Default to at least one Verifier-triage-fixer per Implementer; two for big epics |
| Skipping the Analysis Teammate                                       | Schedule it; the backlog drifts without it                                    |
| Vague slice contracts ("make auth work")                             | Specify the slice boundary, the acceptance criteria, and the verification path |
| Spawning subagents for tasks that fit a slice                        | Decompose inside the Teammate, not inside the Teamlead                       |
| Mixing Orchestrator and Teamlead patterns in one session             | Pick one at session start. Mixing confuses the operating model               |
| Reusing the same prompt for a fresh Teammate after a reject          | Add the knowledge pass: what failed, what to keep, what to avoid             |
| Trying to verify-fine-tune-fix without leaving the main worktree     | Each Teammate gets its own worktree when there is a real risk of conflict    |
| Spawning a subagent for a small doc-only task ("update these two docs") | Handle it directly; doc-only tasks do not always need subagent or teammate delegation |
