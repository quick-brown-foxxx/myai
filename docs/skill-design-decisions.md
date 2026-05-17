# Skill Design Decisions

Captures architectural decisions from the ideation/planning skill design session.
If starting fresh, read this + `skill-set-consolidation.md` first.

## Three-Skill Pipeline

```
idea-sharpening ──→ brainstorming ──→ planning-implementation ──→ code
(business level)    (technical spec)   (implementation plan)
```

### Ceremony Scaling

All three skills adapt to task size. Small/obvious tasks can collapse the pipeline:

- **Tiny** (typo, single-file fix) skip all three, go straight to code
- **Small** (obvious small change in known codebase) skip idea-sharpening, quick inline brainstorming + plan
- **Moderate** (medium-sized feature in several files) brainstorming → planning-implementation
- **Big** (vague idea and/or big/multi-feature) full pipeline, all three documents

Each skill's description should explicitly state when to skip it.

### Skill: `idea-sharpening`

- **Alias:** Strategic ideation, business-level brainstorming
- **Source:** Addy `idea-refine` (primary) + all aux files
- **Purpose:** Vague idea → validated concept worth building or clear kill decision
- **When to skip:** Task requirements are already clear and unambiguous
- **Output:** `docs/concepts/YYYY-MM-DD-<concept>.md`
- **Next:** `brainstorming` (or directly to `planning-implementation` for simple concepts)
- **Cross-refs:** Recommends `prototype-first` for risky assumptions, `doubt-early` for adversarial review
- **Aux material:** `frameworks.md`, `refinement-criteria.md`, `examples.md` — condensed inline if budget allows, otherwise split to future `strategic-deep-dive` subskill
- **Not included:** Workflow orchestration, subagent dispatch patterns

### Skill: `brainstorming`

- **Alias:** Technical spec creation, design phase
- **Source:** Superpowers `brainstorming` (primary) + Addy `spec-driven-development` (spec patterns only)
- **Purpose:** "We know what to build" → technical spec (architecture, approach, components, data flow)
- **When to skip:** Task is trivially implementable from existing context
- **Output:** `docs/specs/YYYY-MM-DD-<feature>.md`
- **Spec lifespan:** Persists for the feature's lifetime. Used in PRs for context and final validation. Updated if scope/plan changes.
- **Next:** `planning-implementation`
- **Cross-refs:** Recommends `prototype-first` for risky implementation choices, `doubt-early` for design review. References `visual-mockups` for browser-based mockups when UI questions arise.
- **From spec-driven-development (absorbed):** 6-core-area spec template, "surface assumptions" practice, "reframe instructions as success criteria" technique
- **From spec-driven-development (excluded):** Workflow governance (gates, plans, implementation dispatch) — belongs in future workflow docs
- **From brainstorming (excluded):** Hard gate ("MUST present design for every project") — replaced by ceremony scaling
- **From brainstorming (excluded):** After-design dispatch to `writing-plans` — replaced by recommendation (agent decides contextually)

### Skill: `planning-implementation`

- **Alias:** Implementation planning, task breakdown
- **Source:** Addy `planning-and-task-breakdown` (primary) + Superpowers `writing-plans` (cherry-picked)
- **Purpose:** Validated spec → ordered task list with files, dependencies, and verification
- **When to skip:** Spec already contains sufficient implementation detail
- **Output:** `docs/implementation-plans/YYYY-MM-DD-<feature>.md`
- **Plan lifespan:** May or may not persist — no special requirements. Useful during implementation, not required for future reference.
- **Next:** Implementation (via `incremental-implementation`, TDD, or direct coding)
- **Cross-refs:** Recommends `prototype-first` for risky tasks, `doubt-early` for plan review
- **From planning-and-task-breakdown (kept):** Vertical slicing, dependency graph, task sizing (XS-XL), checkpoints, parallelization guidance
- **From writing-plans (cherry-picked):** No-placeholders rule with concrete examples, exact file paths, execution handoff mention (generic — not subagent-vs-inline)
- **From writing-plans (excluded):** TDD-per-step as mandatory, subagent-driven vs inline choice, full code in every task

## Document Storage

```
docs/
  concepts/              ← idea-sharpening output
    YYYY-MM-DD-<concept>.md
  specs/                 ← brainstorming output (persistent, evolves with feature)
    YYYY-MM-DD-<feature>.md
  implementation-plans/  ← planning-implementation output (may not persist)
    YYYY-MM-DD-<feature>.md
```

### Naming Convention

- All lowercase kebab-case
- Date prefix `YYYY-MM-DD-` for uniqueness and chronological ordering
- Descriptive name matching the feature or concept
- Examples: `2026-05-17-user-auth.md`, `2026-05-17-api-rate-limiting.md`

### Cross-References Between Documents

Plans reference specs, specs reference concepts — simple relative links:

```markdown
Spec: docs/concepts/2026-05-17-user-auth.md
Plan: docs/specs/2026-05-17-user-auth.md
```

## Skill File Conventions

### Style

- One self-contained `SKILL.md` per skill, no aux files
- Target ~400-500 lines for core skills, ~200-300 for smaller skills
- Frontmatter: `name` + `description` with clear trigger scope
- No hard gates or iron laws — ceremony scales with task size
- "Related Skills" sections instead of mandatory cross-dispatch
- Verification matched to complexity (not one-size-fits-all checklist)

### Directory

All skills live in `skills/` at repo root. Symlinked into `.agents/skills/` for agent discovery. Build process handled by the skills CLI (see README.md).

## Related/Aux Skills

| Skill              | Status     | Notes                                                                                 |
| ------------------ | ---------- | ------------------------------------------------------------------------------------- |
| `prototype-first`  | ✅ Existing | Referenced by all three pipeline skills (recommendation)                              |
| `doubt-early`      | ✅ Existing | Referenced by all three pipeline skills (recommendation)                              |
| `visual-mockups`      | ✅ Existing  | Browser mockups for brainstorming. Extracted from superpowers brainstorming aux files |

## Excluded / Deferred

| Item                      | Source                    | Reason                                                                              |
| ------------------------- | ------------------------- | ----------------------------------------------------------------------------------- |
| Subagent dispatch prompts | Both superpowers          | Models handle subagent prompts ad hoc; aux files are rarely loaded (~80% skip rate) |
| Subagent-vs-inline choice | Superpowers writing-plans | Depends on task size/session context. Not part of planning skill.                   |
| workflow orchestration    | Addy spec-driven-dev      | Belongs in separate workflow documentation, not in skills                           |
| `strategic-deep-dive`     | idea-refine aux files | Future subskill if frameworks/examples/criteria are too large for idea-sharpening      |

## Source Map

Maps upstream skill files to resulting skills. For final review and comparison.

### idea-sharpening

| Upstream Source | File | Content Used | Status |
|---|---|---|---|
| Addy idea-refine | `SKILL.md` | 3-phase process (divergent→convergent→ship), output template, anti-patterns, verification | ✅ Fully absorbed |
| Addy idea-refine | `frameworks.md` | 7 ideation frameworks (SCAMPER, First Principles, JTBD, Constraint-Based, Pre-Mortem, Analogous Inspiration) | ✅ Condensed inline |
| Addy idea-refine | `refinement-criteria.md` | Evaluation rubric (User Value, Feasibility, Differentiation), Decision Matrix, MVP Scoping | ✅ Condensed inline |
| Addy idea-refine | `examples.md` | 3 full session transcripts | ❌ Excluded — too long, rarely read |
| Addy idea-refine | `scripts/idea-refine.sh` | Creates `docs/ideas/` directory | ❌ Excluded — trivial, done inline |

### brainstorming

| Upstream Source | File | Content Used | Status |
|---|---|---|---|
| Superpowers brainstorming | `SKILL.md` | Explore context, one-at-a-time questions, multi-choice preference, propose 2-3 approaches, design-for-isolation | ✅ Fully absorbed |
| Superpowers brainstorming | `spec-document-reviewer-prompt.md` | Review checklist (Completeness, Consistency, Clarity, Scope, YAGNI) | ✅ Review questions absorbed into Review section |
| Superpowers brainstorming | `visual-companion.md` | Browser-based mockup server | ✅ Extracted to `visual-mockups` skill |
| Superpowers brainstorming | `scripts/` | `start-server.sh`, `stop-server.sh`, etc. | ➡️ Goes with `visual-mockups` skill |
| Addy spec-driven-dev | `SKILL.md` | 6-core-area spec template, surface assumptions, reframe criteria technique | ✅ Absorbed (spec patterns only) |
| — | — | Workflow governance, phase gates, implementation dispatch | ❌ Excluded (belongs in future workflow docs) |

### planning-implementation

| Upstream Source | File | Content Used | Status |
|---|---|---|---|
| Addy planning-and-task-breakdown | `SKILL.md` | 5-step process, dependency graph, vertical slicing, task sizing (XS-XL), checkpoints, parallelization, rationalizations, red flags | ✅ Fully absorbed |
| Superpowers writing-plans | `SKILL.md` | No-placeholders rule, exact file paths requirement | ✅ Cherry-picked |
| Superpowers writing-plans | `plan-document-reviewer-prompt.md` | Review checklist (Completeness, Spec Alignment, Task Decomposition, Buildability) | ✅ Review questions absorbed into Review section |
| — | — | TDD-per-step as mandatory | ❌ Excluded |
| — | — | Subagent-driven vs inline execution choice | ❌ Excluded (context-dependent) |
| — | — | Full code in every task step | ❌ Excluded (over-specification) |
