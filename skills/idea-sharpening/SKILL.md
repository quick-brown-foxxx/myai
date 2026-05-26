---
name: idea-sharpening
description: >-
  Refines vague ideas into sharp, validated concepts through structured divergent
  and convergent thinking. Use when a concept is still unclear, when the user
  asks to ideate or refine an idea, or when exploring options before converging
  on what to build. Not for clear implementation tasks or adversarial review of
  an existing plan.
metadata:
  tags: planning, ideation, risk-reduction
---

## Planning Pipeline

This skill is part of a scalable planning pipeline. Each step is optional depending on work size:

```
idea-sharpening → brainstorming → planning-implementation → code
```

- **Tiny** (typo, single-file fix): skip all → code directly
- **Small** (obvious small change in known codebase): skip this → quick brainstorming inline
- **Moderate** (medium-sized feature in several files): brainstorming → planning-implementation
- **Big** (vague idea and/or big/multi-feature): full pipeline

**You are here:** idea-sharpening (strategic ideation).
**Next:** brainstorming (technical spec) — or skip to planning-implementation or code if the sharpened concept is straightforward enough.

## When to Use

- The work requirements are vague, ambiguous, or only exist as a rough idea
- You need to explore options before deciding what to build
- You want to stress-test whether an idea is worth pursuing before investing in it
- Someone says "I have an idea" without clear definition

**When to skip:** Requirements are already clear, unambiguous, and the path forward is obvious. In that case, start at brainstorming or go directly to planning-implementation.

## How It Works

You are an ideation partner. Guide the user through three phases. This is a conversation, not a template — adapt your approach based on what they say.

### Phase 1: Understand & Expand (Divergent)

**Goal:** Take the raw idea and open it up.

1. **Restate the idea** as a crisp "How Might We" problem statement. This forces clarity on what's actually being solved.

   Good HMW framings are narrow enough to act on, broad enough to allow multiple solutions, and include the user plus the key constraint. Avoid solution-embedded framings like "How might we add a chatbot?" when the real question is support load, response quality, or user self-service.

2. **Ask 3-5 sharpening questions.** Focus on:
   - Who is this for, specifically?
   - What does success look like?
   - What are the real constraints (time, tech, resources)?
   - What's been tried before?
   - Why now?

   Do not proceed until you understand who this is for and what success looks like.

3. **Generate 5-8 idea variations** using these lenses. Pick the ones that fit the idea — don't mechanically run all of them:

   - **Inversion:** "What if we did the opposite?"
   - **Constraint removal:** "What if budget/time/tech weren't factors?"
   - **Audience shift:** "What if this were for a different user?"
   - **Combination:** "What if we merged this with an adjacent idea?"
   - **Simplification:** "What's the version that's 10x simpler?"
   - **10x version:** "What would this look like at massive scale?"
   - **Expert lens:** "What would domain experts find obvious that outsiders wouldn't?"

   Each variation should have a reason it exists — not just a bullet point. Push beyond what the user initially asked for.

If running inside a codebase, scan for relevant context — existing architecture, patterns, prior art. Ground variations in what actually exists.

### Phase 2: Evaluate & Converge

After the user reacts to Phase 1 (resonant ideas, pushback, new context), shift to convergent mode:

1. **Cluster** the ideas that resonated into 2-3 distinct directions. Each should feel meaningfully different.

2. **Stress-test** each direction against three criteria:
   - **User value:** Who benefits and how much? Painkiller or vitamin?
   - **Feasibility:** What's the technical and resource cost? What's the hardest part?
   - **Differentiation:** What makes this genuinely different? Would someone switch from their current solution?

3. **Surface hidden assumptions.** For each direction, name:
   - What you're betting is true (but haven't validated)
   - What could kill this idea
   - What you're choosing to ignore (and why that's okay for now)

   This is where most ideation fails. Don't skip it.

**Be honest, not supportive.** If an idea is weak, say so with kindness. Push back on complexity, question real value. A good ideation partner is not a yes-machine.

Good ideation changes the frame, not just the wording. Diagnose the bottleneck before prescribing: "help restaurants compete" might become "retain regulars directly," and "stale retros" might become "fix the output layer." Variations should explain why they exist, and your recommendation should have an opinion.

## Example Process Patterns

Use these as calibration for tone and reasoning. The point is not to show the final answer; it is to show how to move from vague prompt to sharper bet.

### Local Restaurants vs Delivery Platforms

Raw idea: "Help small local restaurants compete with the big delivery platforms."

First move: reframe away from the user's wording. "Compete" could mean discovery, ordering, delivery logistics, customer retention, brand, margins, or loyalty. Ask which part hurts most and who the primary user is. If the answer is "restaurant owners paying 25-30% commission but feeling trapped," the problem is not generic competition; it is platform dependency and loss of customer relationship.

Expansion move: generate variations that attack different leverage points, not cosmetic versions of the same app:
- Direct channel toolkit: restaurants own branded ordering for customers who already know them.
- Pickup-first ordering: remove delivery entirely and keep the margin problem small.
- Neighborhood collective: restaurants pool discovery and marketing instead of each fighting alone.
- Regulars engine: focus only on repeat customers who already have a restaurant habit.
- Zero-management automation: assume owners are in the kitchen, not dashboards.

Convergence move: notice which variations combine into a sharper thesis. The regulars + zero-management pair changes the bet from "build a DoorDash alternative" to "move a restaurant's best repeat customers onto a lower-friction direct reorder loop." Push back on the tempting "also build the full ordering platform" instinct: that may be necessary later, but it can blur the MVP before the core behavior is validated.

Sharpening move: define the MVP around the riskiest assumption. If the hardest question is whether regular customers will switch channels, test that with a narrow SMS or direct-link reorder flow before building discovery, delivery, analytics, POS sync, or a marketplace.

### Real-Time Collaboration in an Existing Editor

Raw idea: "Add real-time collaboration to our document editor."

First move: ground the idea in existing architecture. Scan the codebase for the document model, persistence path, editor granularity, and real-time infrastructure. A block-based editor with no WebSocket layer suggests different options than a character-level text editor that already has presence events.

Diagnostic move: ask what collaboration actually means for users. Are they editing the same paragraph simultaneously, working in different sections, commenting while one person edits, or just needing a sales checkbox because competitors have it? The answer changes both the required fidelity and the cost worth paying.

Expansion move: produce directions with genuinely different complexity profiles:
- Presence only: users see who is in the doc and where they are, but editing remains single-user.
- Block-level locking: multiple users can work at once as long as they edit different blocks.
- Async suggestions: collaboration is review/merge, not simultaneous editing.
- Version branches: users work independently and merge later.
- Full CRDT co-editing: highest fidelity, highest implementation and testing cost.

Convergence move: separate "must have to stop losing deals" from "differentiator worth deep investment." If customers mostly need confidence that teams can work together, presence or block-level locking may be the first useful proof. If the product's core value is collaborative writing itself, the CRDT path may be justified earlier.

Sharpening move: make the not-doing list protect the plan. If choosing minimum viable co-editing, explicitly cut character-level CRDTs, offline sync, and AI collaboration until block-level collaboration proves insufficient. If choosing full fidelity, explicitly name the technical assumptions that need prototyping before committing.

### Phase 3: Sharpen & Ship

Produce a concrete artifact — a markdown one-pager that moves work forward:

```markdown
# [Concept Name]

## Problem Statement
[One-sentence "How Might We" framing]

## Recommended Direction
[The chosen direction and why — 2-3 paragraphs max]

## Key Assumptions to Validate
- [ ] [Assumption 1 — how to test it]
- [ ] [Assumption 2 — how to test it]
- [ ] [Assumption 3 — how to test it]

## MVP Scope
[The minimum version that tests the core assumption. What's in, what's out.]

## Not Doing (and Why)
- [Thing 1] — [reason]
- [Thing 2] — [reason]
- [Thing 3] — [reason]

## Open Questions
- [Question that needs answering before building]
```

The "Not Doing" list is the most valuable part. Make trade-offs explicit.

For moderate or larger concepts, ask the user if they'd like to save this to `docs/concepts/YYYY-MM-DD-<concept>.md` (or a location of their choosing). For small explorations, an inline one-pager is enough. Only save if they confirm.

## Ideation Frameworks

Use these selectively. Pick the lens that fits — don't run every framework mechanically.

### SCAMPER
- **Substitute:** Swap a component, technology, or audience
- **Combine:** Merge with another product, service, or idea
- **Adapt:** Borrow from other industries, domains, or time periods
- **Modify:** Make it 10x bigger, 10x smaller, exaggerate one feature
- **Put to other uses:** Who else could use this? What other problems could it solve?
- **Eliminate:** Remove a feature entirely. What's the zero-configuration version?
- **Reverse:** Do steps in opposite order. Flip the value chain.

Best for: Improving existing products. Less useful for greenfield ideas.

### First Principles Thinking
1. What do we know is true (not assumed, not conventional)?
2. What are we assuming? List every assumption, even the obvious ones.
3. Which assumptions can we challenge? Is this physics or just how it's been done?
4. Rebuild from the truths. What would you build from fundamentals only?

Best for: Breaking out of incremental thinking.

### Jobs To Be Done
Focus on what the user is trying to accomplish:
- **Functional job:** What task are they trying to complete?
- **Emotional job:** How do they want to feel?
- **Social job:** How do they want to be perceived?

Format: "When I [situation], I want to [motivation], so I can [expected outcome]."

Best for: Understanding the real problem, especially when you're not sure you're solving the right thing.

### Constraint-Based Ideation
Impose deliberate constraints to force creativity:
- **Time:** "What if you only had 1 day to build this?"
- **Feature:** "What if it could only have one feature?"
- **Tech:** "What if you couldn't use the obvious technology?"
- **Scale:** "What if it needed to work for 1 billion users? 10 users?"

Best for: Cutting through complexity when the idea is growing too large.

### Pre-Mortem
Imagine the idea has already failed. It's 12 months from now. What went wrong? List every plausible reason — technical, market, timing. Which failure modes are preventable? Which would kill the project?

Best for: Stress-testing ideas in Phase 2.

### Analogous Inspiration
What industry has solved a version of this problem? What would this look like if a specific company built it? Find structural similarities, not surface-level ones. "Uber for X" is surface-level. "A two-sided marketplace solving a trust problem between strangers" is structural.

## Refinement Criteria

Use during Phase 2 to evaluate directions. Not every criterion applies to every idea.

### User Value
- **Painkiller:** Solves an acute, frequent problem. Users actively seek it, have built workarounds, will pay.
- **Vitamin:** Nice to have, marginally better. Users nod politely, don't change behavior.

Questions: Can you name 3 specific people with this problem? What do they do today instead? Would they switch?

Red flags: "Everyone could use this" (name a specific user or it's not clear). "It's like X but better." High intensity but low frequency.

### Feasibility
- Does the core technology exist and work reliably?
- What's the hardest technical problem?
- Are there third-party dependencies you don't control?
- How quickly can you get something in front of users — days, weeks, months?

Red flags: "We just need to solve [very hard research problem] first." MVP still requires months of work.

### Differentiation
- If a user described this to a friend, what would they say?
- What's the one thing this does that nothing else does?
- Is the difference durable (can't be copied in a week)?

Types (strongest to weakest): New capability > 10x improvement > New audience > New context > Better UX > Cheaper.

Red flags: Differentiation is entirely about technology. The differentiator is not what users care most about.

### Decision Matrix

| | High Feasibility | Low Feasibility |
|---|---|---|
| **High Value** | Do this first | Worth the risk |
| **Low Value** | Only if trivial | Don't do this |

Differentiation is the tiebreaker between options in the same quadrant.

### MVP Scoping
1. One job, done well. Not three jobs done partially.
2. The riskiest assumption first — MVP's purpose is to test the assumption most likely wrong.
3. Time-box, not feature-list. "What can we build and test in 2 weeks?"
4. The "Not Doing" list is mandatory. Explicitly name what you're cutting and why.
5. If it's not embarrassing, you waited too long.

## Anti-Patterns

- Generating 20+ shallow variations instead of 5-8 considered ones
- Skipping "who is this for"
- No assumptions surfaced before committing to a direction
- Yes-machining weak ideas instead of pushing back with specificity
- Producing a plan without a "Not Doing" list
- Ignoring codebase constraints when ideating inside a project
- Jumping straight to the output without running Phases 1 and 2

## Related Skills

- **`doubt-early`** — After sharpening the concept, use `doubt-early` for adversarial review of your conclusions before proceeding. Helps catch XY problems and hidden assumptions.
- **`prototype-first`** — If the concept relies on a technical assumption that needs validation (e.g., "will this library actually solve the hard part?"), consider a quick prototype. But generally it's too early for implementation paths — keep the focus on whether the concept is worth pursuing, not how to build it.
- **`brainstorming`** — Next step after the concept is validated. Produces the technical spec.
- **`planning-implementation`** — Final planning step before coding. Breaks the spec into concrete tasks.

## Review

After writing the concept doc, review it before proceeding. How you review depends on scope. `doubt-early` can be part of the review process with same or separate subagent.

**Concept scope (assumptions are mostly clear, straightforward path):** Run a quick self-review:
- Are there any "TBD", "TODO", or incomplete sections?
- Is the problem statement crisp and unambiguous?
- Are the recommended direction and the assumptions list internally consistent?
- Could someone read this and build the wrong thing?

**Complex or vague concept (many open questions, high-risk assumptions):** Dispatch a fresh subagent to review the concept doc independently before proceeding:

```
You are a concept reviewer. Verify this concept doc is coherent and ready for spec writing.

**Concept to review:** [CONCEPT_FILE_PATH]

## What to Check
| Category | What to Look For |
|----------|------------------|
| Completeness | TODOs, placeholders, "TBD", incomplete sections |
| Consistency | Internal contradictions between problem, direction, and scope |
| Clarity | Requirements ambiguous enough to spec the wrong thing |
| Assumptions | Hidden assumptions that aren't surfaced in the list |
| Focus | Scoped to one concept, not multiple independent ideas |

## Calibration
Only flag issues that would cause real problems during spec writing. Minor wording
improvements and stylistic preferences are not issues.
Approve unless there are serious gaps that would lead to a flawed spec.

## Output Format
**Status:** Approved | Issues Found
**Issues (if any):** [section]: [specific issue] - [why it matters]
**Recommendations:** [advisory suggestions]
```

Fix any issues found. Iterate if the review exposed meaningful problems.

## Verification

After completing an ideation session:

- [ ] A clear problem statement exists (How Might We framing)
- [ ] The target user and success criteria are defined
- [ ] Multiple directions were explored, not just the first idea
- [ ] Hidden assumptions are explicitly listed with validation strategies
- [ ] A "Not Doing" list makes trade-offs explicit
- [ ] The output is a concrete artifact (markdown one-pager), not just conversation
- [ ] For moderate/large or ambiguous work, the user confirmed the final direction before implementation work
