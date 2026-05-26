---
name: planning-implementation
description: >-
  Breaks validated specs into ordered, implementable tasks with explicit acceptance
  criteria and verification. Use when you have a spec or a task and need to decompose work
  into concrete steps with dependencies, file paths, and checkpoints. Not for simple
  single-file changes with obvious scope or specs with sufficient implementation
  detail built in.
---

# Planning Implementation

Break a validated spec or clear task into ordered implementation work,
acceptance criteria, dependencies, and verification checkpoints.

## Planning Pipeline

This skill is part of a scalable planning pipeline. Each step is optional
depending on work size.

```text
idea-sharpening        (if the idea is vague)
  -> brainstorming     (if spec or design is needed)
  -> planning-implementation  (you are here)
       -> high-level-testing-strategy       (if proof strategy is unclear)
       -> when-and-how-to-run-parallel-agents (if work may fan out)
       -> incremental-implementation        (soft next execution loop)
       -> executing-plans-with-subagents    (if delegating bounded tasks)
       -> verification-before-completion    (before completion claims)
```

- **Tiny** (typo, single-file fix): skip all and code directly.
- **Small** (obvious small change in known codebase): quick inline plan, then code.
- **Moderate** (medium-sized feature in several files): brainstorming, then this skill.
- **Big** (vague idea and/or big/multi-feature): full pipeline.

Planning commonly recommends implementation workflow next, but the transition is a soft
handoff. Stop after planning when the human or orchestrator needs to review,
defer, split, or delegate the work.

## When to Use

- You have a spec or clear requirements that need breaking into concrete steps
- A task feels too large or vague to start
- Work needs to be parallelized across multiple sessions
- The implementation order isn't obvious
- You need to communicate scope to a human or another agent

**When to skip:** Single-file changes with obvious scope, or when the spec already contains well-defined tasks with acceptance criteria.

## The Planning Process

### Step 1: Read-Only Exploration

Before writing any plan, operate in read-only mode:

- Read the spec, relevant docs and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Map likely files and responsibilities before writing tasks
- Note risks and unknowns

Do not write implementation code during planning. The output is a plan or task list, not implementation.

When mapping files, prefer clear responsibilities and existing conventions. Files that change together should usually live together; split by responsibility, not by technical layer alone. If an existing file is unwieldy and the planned change touches it, include a targeted split in the plan, but avoid unrelated restructuring.

### Step 2: Map the Dependency Graph

Identify what depends on what:

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

Implementation order follows the dependency graph bottom-up: build foundations first.

### Step 3: Slice Vertically

Instead of building all the database, then all the API, then all the UI — build one complete feature path at a time.

**Bad (horizontal slicing):**
```
Task 1: Build entire database schema
Task 2: Build all API endpoints
Task 3: Build all UI components
Task 4: Connect everything
```

**Good (vertical slicing):**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a todo (todo schema + API + UI for creation)
Task 4: User can view todo list (query + API + UI for list view)
```

Each vertical slice delivers working, testable functionality.

### Step 4: Size Tasks

Use this sizing guide:

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or endpoint | Add a new API endpoint |
| **M** | 3-5 | One feature slice | User registration flow |
| **L** | 5-8 | Multi-component feature | Search with filtering and pagination |
| **XL** | 8+ | Too large — break it down further | — |

Aim for S and M tasks. If a task is L or larger, break it into smaller tasks.

**When to break a task down further:**
- It would take more than one focused session of agent work
- You cannot describe acceptance criteria in 3 or fewer bullet points
- It touches two or more independent subsystems
- The task title contains "and" (sign of multiple tasks)

### Step 5: Write the Plan

Each task follows this structure:

```markdown
## Task [N]: [Short descriptive title]

**Description:** One paragraph explaining what this task accomplishes.

**Acceptance criteria:**
- [ ] [Specific, testable condition]
- [ ] [Specific, testable condition]

**Verification:**
- [ ] Tests pass: `pytest tests/feature/test_file.py -v`
- [ ] Manual check: [what to verify]

**Dependencies:** [Task numbers this depends on, or None]

**Estimated size:** [XS/S/M/L]

**Files likely touched:**
- `src/path/to/file.py`
- `tests/path/to/test_file.py`
```

#### No Placeholders

Every task must contain actionable content. These are plan failures:

- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" (without specifying what)
- "Write tests for the above" (without specifying test cases)
- "Similar to Task N" (repeat the detail — the engineer may read tasks out of order)
- Steps that describe what to do without showing specifics

Use exact file paths. Every path should be precise and actionable.

### Arrange Tasks With Checkpoints

Order tasks so that:
1. Dependencies are satisfied (build foundation first)
2. Each task leaves the system in a working state
3. Verification checkpoints occur after every 2-3 tasks
4. High-risk tasks are early (fail fast)

```markdown
## Checkpoint: After Tasks 1-3
- [ ] All tests pass
- [ ] Application builds without errors
- [ ] Core user flow works end-to-end
- [ ] Review with human before proceeding
```

### Plan Document Template

```markdown
# Implementation Plan: [Feature Name]

## Overview
[One paragraph summary of what we're building]

## Architecture Decisions
- [Key decision 1 and rationale]
- [Key decision 2 and rationale]

## Task List

### Phase 1: Foundation
- [ ] Task 1: ...
- [ ] Task 2: ...

### Checkpoint: Foundation
- [ ] Tests pass, builds clean

### Phase 2: Core Features
- [ ] Task 3: ...
- [ ] Task 4: ...

### Checkpoint: Core Features
- [ ] End-to-end flow works

### Phase 3: Polish
- [ ] Task 5: ...

### Checkpoint: Complete
- [ ] All acceptance criteria met
- [ ] Ready for review

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk] | [High/Med/Low] | [Strategy] |

## Open Questions
- [Question needing human input]
```

For moderate or larger work, save the plan to `docs/implementation-plans/YYYY-MM-DD-<feature>.md`. For small work, an inline task list is enough. Plans are working artifacts; persist them when they will help coordination, handoff, or later review.

## Parallelization

When multiple agents or sessions are available:

- **Safe to parallelize:** Independent feature slices, tests for already-implemented features, documentation
- **Must be sequential:** Database migrations, shared state changes, dependency chains
- **Needs coordination:** Features that share an API contract — define the contract first, then parallelize

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'll figure it out as I go" | That's how you end up with rework. 10 minutes of planning saves hours. |
| "The tasks are obvious" | If the work is multi-step, write them anyway. Explicit tasks surface hidden dependencies and edge cases. |
| "Planning is overhead" | Planning is the task. Implementation without a plan is just typing. |
| "I can hold it all in my head" | Context windows are finite. Written plans survive session boundaries. |

## Red Flags

- Starting implementation without a written task list for multi-step work
- Tasks that say "implement the feature" without acceptance criteria
- No verification steps in the plan
- All tasks are XL-sized
- No checkpoints between tasks
- Dependency order isn't considered

## Related Skills

| Situation | Skill |
| --- | --- |
| Idea is vague or still needs product/concept sharpening | `idea-sharpening` |
| Need a technical spec before task decomposition | `brainstorming` |
| Plan needs an architecture boundary or ownership decision | `architecting-changes` |
| Verification strategy, BDD cases, or automated/manual proof is unclear | `high-level-testing-strategy` |
| Task involves a risky or ambiguous technical assumption | `prototype-first` |
| Plan or assumptions need adversarial review | `doubt-early` |
| Plan may be parallelized across independent work domains | `when-and-how-to-run-parallel-agents` |
| Plan will be delegated to bounded subagents | `executing-plans-with-subagents` |
| Plan is ready for direct execution | `incremental-implementation` |
| About to claim the plan or checkpoint is complete | `verification-before-completion` |

## Review

After writing the plan, review it before proceeding. How you review depends on scope. `doubt-early` can be part of the review process with same or separate subagent.

**Plan scope (few tasks, straightforward dependencies, well-understood domain):** Run a quick self-review:
- Are there any "TBD", "TODO", or placeholder steps?
- Does every task have acceptance criteria and a verification step?
- Are tasks ordered by dependency (build foundation first)?
- Do tasks have exact file paths, not vague locations?
- Does the plan cover all requirements in the spec?

**Complex or large plan (many tasks, cross-component, risky dependencies):** Dispatch a fresh subagent to review the plan document independently before proceeding:

```
You are a plan document reviewer. Verify this plan is complete and ready for implementation.

**Plan to review:** [PLAN_FILE_PATH]
**Spec for reference:** [SPEC_FILE_PATH]

## What to Check
| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, incomplete tasks, missing steps |
| Spec Alignment | Plan covers spec requirements, no major scope creep |
| Task Decomposition | Tasks have clear boundaries, steps are actionable |
| Buildability | Could an engineer follow this plan without getting stuck? |

## Calibration
Only flag issues that would cause real problems during implementation.
Minor wording, stylistic preferences, and "nice to have" suggestions are not issues.
Approve unless there are serious gaps — missing requirements from the spec,
contradictory steps, placeholder content, or tasks so vague they can't be acted on.

## Output Format
**Status:** Approved | Issues Found
**Issues (if any):** [Task X, Step Y]: [specific issue] - [why it matters for implementation]
**Recommendations:** [advisory suggestions]
```

Fix any issues found. Iterate if the review exposed meaningful problems.

## Verification

Before starting implementation:

- [ ] Every task has acceptance criteria
- [ ] Every task has a verification step
- [ ] Task dependencies are identified and ordered correctly
- [ ] No task touches more than ~5 files
- [ ] Checkpoints exist between major phases
- [ ] For moderate/large or ambiguous work, the human has reviewed and approved the plan
