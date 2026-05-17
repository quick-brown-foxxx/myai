---
name: brainstorming
description: >-
  Creates technical specs and designs for well-understood features. Use when
  requirements are clear but you need architecture, component design, data flow,
  or approach decisions before implementing. Not for vague ideas (use
  idea-sharpening first) or for trivially implementable changes.
---

## Planning Pipeline

This skill is part of a scalable planning pipeline. Each step is optional depending on work size:

```
idea-sharpening → brainstorming → planning-implementation → code
```

- **Tiny** (typo, single-file fix): skip all → code directly
- **Small** (obvious small change in known codebase): skip this → inline plan + code
- **Moderate** (medium-sized feature in several files): brainstorming → planning-implementation
- **Big** (vague idea and/or big/multi-feature): idea-sharpening first → then here

**You are here:** brainstorming (technical spec creation).
**Next:** planning-implementation (task breakdown) — or skip to code if the spec is detailed enough that tasks are obvious.

## When to Use

- You know what to build but need to decide *how* — architecture, components, data flow, approach
- The feature touches multiple files or modules
- There are design decisions with trade-offs to evaluate
- You need a written spec for team alignment, PR context, or later validation

**When to skip:** The change is trivially implementable from existing context. A single endpoint with the same pattern as existing ones, a bug fix with an obvious approach, or cosmetic changes.

**Prerequisite:** If the requirements are vague or you're unsure what to build, use `idea-sharpening` first to validate the concept.

## Process

Adapt the level of detail to the task size. A small feature might take 2-3 questions and a short spec. A large feature warrants the full process.

### 1. Explore Context

Check the current project state — files, docs, recent commits, existing patterns. Understand what exists before proposing changes.

- Where does this new feature fit in the existing structure?
- Are there existing patterns to follow?
- Are there files that already do something similar?

Follow existing conventions. If existing code has problems affecting the work (overgrown files, unclear boundaries), include targeted improvements in the design — but don't propose unrelated refactoring.

### 2. Surface Assumptions

Before writing any spec content, explicitly list what you're assuming:

```
ASSUMPTIONS I'M MAKING:
1. This is a web application (not native mobile)
2. Authentication uses session-based cookies (not JWT)
3. The database is PostgreSQL (based on existing Prisma schema)
4. We're targeting modern browsers only (no IE11)
→ Correct me now or I'll proceed with these.
```

Don't silently fill in ambiguous requirements. The spec's purpose is to surface misunderstandings before code gets written.

### 3. Ask Clarifying Questions

Ask questions one at a time (not in batches) to avoid overwhelming the user. Prefer multiple choice when possible.

Focus on understanding:
- Architecture constraints and preferences
- Performance or scale requirements
- Error handling expectations
- Testing expectations
- Deployment and environment considerations

If multiple approaches exist, propose 2-3 with trade-offs and your recommendation. Lead with your recommended option and explain why.

### 4. Write the Spec

The spec is a living document that persists for the feature's lifetime. It's used in PRs for context and final validation. Update it if scope or plan changes.

Cover these core areas:

**Objective:** What are we building and why? Who is the user? What does success look like?

**Tech Stack:** Key frameworks, languages, dependencies with versions.

**Project Structure:** Where source code lives, where tests go, where docs belong.

**Code Style:** One real code snippet showing your style beats three paragraphs describing it. Include naming conventions and formatting rules.

**Testing Strategy:** What framework, where tests live, coverage expectations, which test levels for which concerns.

**Boundaries:**
- Always do: Run tests before commits, follow naming conventions, validate inputs
- Ask first: Database schema changes, adding dependencies, changing CI config
- Never do: Commit secrets, edit vendor directories, remove failing tests without approval

**Reframe vague requirements as concrete success criteria:**
```
REQUIREMENT: "Make the dashboard faster"

REFRAMED CRITERIA:
- Dashboard LCP < 2.5s on 4G connection
- Initial data load completes in < 500ms
- No layout shift during load (CLS < 0.1)
→ Are these the right targets?
```

**Spec template:**

```markdown
# Spec: [Feature Name]

## Objective
[What we're building and why. User stories or acceptance criteria.]

## Tech Stack
[Framework, language, key dependencies with versions]

## Commands
[Build, test, lint, dev — full commands]

## Project Structure
[Directory layout with descriptions]

## Code Style
[Example snippet + key conventions]

## Testing Strategy
[Framework, test locations, coverage requirements, test levels]

## Boundaries
- Always: [...]
- Ask first: [...]
- Never: [...]

## Success Criteria
[How we'll know this is done — specific, testable conditions]

## Open Questions
[Anything unresolved that needs human input]
```

Scale each section to its complexity: a few sentences if straightforward, more if nuanced.

## Design Principles

### Design for Isolation
Break the system into smaller units that each have one clear purpose, communicate through well-defined interfaces, and can be understood and tested independently. For each unit you should be able to answer: what does it do, how do you use it, and what does it depend on?

### Separation by Responsibility
- Separate what changes for different reasons
- Layered dependency flow: Presentation → Domain → Utilities. Never upward.
- UI is a plugin to the core — adding a new interface should not require changing business logic
- Prefer composition over inheritance for flexible boundaries

### Wrap External Dependencies
Isolate third-party libraries behind typed interfaces. This provides type safety, testability, and the ability to swap implementations.

## Output

Save the validated spec to `docs/specs/YYYY-MM-DD-<feature>.md`.

The spec persists for the feature's lifetime. Reference it in PRs for context. Update it when scope or plan changes.

## Related Skills

- **`idea-sharpening`** — Run this first if you're not sure what to build. Produces a validated concept to spec against.
- **`visual-mockups`** — If the design involves UI questions (layouts, mockups, diagrams), use the visual mockups skill for browser-based interactive exploration.
- **`prototype-first`** — If the spec involves a technically risky approach, prototype the critical path first before committing the full spec.
- **`doubt-early`** — After writing the spec, use `doubt-early` for adversarial review of the design decisions.
- **`planning-implementation`** — Next step. Breaks the spec into ordered implementation tasks.

## Red Flags

- Starting implementation without any written spec for multi-file changes
- Making architectural decisions without documenting the rationale
- Skipping the spec because "it's obvious" — if it's truly obvious, the spec is short, not absent
- Silencing ambiguous requirements instead of surfacing them as assumptions
- Over-engineering (building for scale that won't arrive, abstractions for future needs)

## Review

After writing the spec, review it before proceeding. How you review depends on scope. `doubt-early` can be part of the review process with same or separate subagent.

**Spec scope (small feature, clear architecture, few files):** Run a quick self-review:
- Are there any "TBD", "TODO", or incomplete sections?
- Is the objective specific enough to validate against later?
- Are the architecture decisions internally consistent?
- Are there ambiguous requirements that could be interpreted two ways?
- Are there unrequested features (YAGNI violations)?

**Complex or large spec (multi-component, risky architecture, many dependencies):** Dispatch a fresh subagent to review the spec document independently before proceeding:

```
You are a spec document reviewer. Verify this spec is complete and ready for planning.

**Spec to review:** [SPEC_FILE_PATH]

## What to Check
| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, "TBD", incomplete sections |
| Consistency | Internal contradictions, conflicting requirements |
| Clarity | Requirements ambiguous enough to cause someone to build the wrong thing |
| Scope | Focused enough for a single plan — not covering multiple independent subsystems |
| YAGNI | Unrequested features, over-engineering |

## Calibration
Only flag issues that would cause real problems during implementation planning.
Minor wording improvements, stylistic preferences, and "sections less detailed than others" are not issues.
Approve unless there are serious gaps that would lead to a flawed plan.

## Output Format
**Status:** Approved | Issues Found
**Issues (if any):** [Section X]: [specific issue] - [why it matters for planning]
**Recommendations:** [advisory suggestions]
```

Fix any issues found. Iterate if the review exposed meaningful problems.

## Verification

- [ ] The spec covers objective, approach, and success criteria
- [ ] Assumptions were surfaced and validated with the user
- [ ] The user has reviewed and approved the spec
- [ ] The spec is saved to `docs/specs/YYYY-MM-DD-<feature>.md`
- [ ] Ambiguous requirements were reframed as concrete criteria
