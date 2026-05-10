---
name: doubt-early
description: >-
  Invoke fresh-context adversarial review before committing to non-trivial decisions.
  Use when about to implement under uncertainty, when requirements feel underspecified,
  when fixing something that "shouldn't exist", or when adding complexity to work around
  uncertainty. Catches both wrong solutions AND wrong problems (XY).
license: MIT
---

# Doubt Early

## Overview

A confident answer is not a correct one. Long sessions accumulate context that quietly turns assumptions into "facts" without anyone noticing. You cannot reliably detect your own XY problems — a fresh-context reviewer can.

Doubt-early is the discipline of invoking a fresh-context reviewer to challenge your direction before you commit. The reviewer may find issues with your approach, or may find you're solving the wrong problem entirely.

This is not `/review`. `/review` is a verdict on a finished artifact. This is in-flight: challenge your direction while course-correction is still cheap.

## When to Use

**Trigger doubt-early when:**

- About to implement under uncertainty (requirements underspecified, multiple plausible approaches)
- About to fix something that "shouldn't exist" (flaky tests, race conditions, unexpected behavior)
- Drawing in lng multi step fixes that feel like a hack
- Caught yourself adding complexity to work around uncertainty
- Making an assumption that, if wrong, invalidates the approach
- About to make an architectural decision
- About to commit non-trivial code
- Working in code you don't fully understand

**Do NOT use for:**

- Mechanical operations (renaming, formatting, file moves)
- Following a clear, unambiguous user instruction
- Reading or summarizing existing code
- One-line changes with obvious correctness
- Pure tooling operations (running tests, listing files)
- User explicitly asked for speed over verification

## The Process

### Step 1: CLAIM — Name what you're about to do

Write the claim in 2-3 lines:

```
CLAIM: "Adding retries and simplifying test cases will fix the flaky E2E tests."
WHY THIS MATTERS: Tests are blocking the release, need to unblock quickly.
```

If you can't write the claim compactly, you have a vibe not a decision. Surface it first.

### Step 2: EXTRACT — Prepare artifact and contract

A fresh-context reviewer needs:
- **Artifact**: the code, plan, or decision (not the whole file — the relevant piece)
- **Contract**: what it must satisfy (constraints, requirements, invariants)

Strip your reasoning. If you hand over conclusions, you'll get back validation of your conclusions.

### Step 3: DOUBT — Invoke fresh-context reviewer

Use this adversarial prompt:

```
Adversarial review. Find what is wrong. Assume the author may be:
- Solving the right problem incorrectly, OR
- Solving the wrong problem entirely (XY problem)

Check for:
- Unstated assumptions
- Edge cases not handled
- Hidden coupling or shared state
- Missing constraints that should be clarified first
- Whether this is the right problem to solve at all
- Whether the approach is solving symptoms instead of root cause
- Whether complexity is masking uncertainty
- Ways the contract could be violated
- Existing conventions this might break
- Failure modes under unexpected input

Do NOT validate. Do NOT summarize. Find issues, or state explicitly 
that you cannot find any after thorough examination.

ARTIFACT: <paste artifact>
CONTRACT: <paste contract>
```

**Pass ARTIFACT + CONTRACT only. Do NOT pass the CLAIM.** The reviewer must independently determine whether the artifact satisfies the contract — and whether the contract itself is correct.

### Step 4: RECONCILE — Classify findings

The reviewer's output is data, not verdict. **You are still the orchestrator.**

For each finding, classify in this precedence order:

1. **Wrong problem (XY)** — you're solving the wrong thing. Stop, step back, reassess.
2. **Missing constraints** — clarify with user before proceeding.
3. **Contract misread** — reviewer flagged something because the CONTRACT was unclear. Fix the contract, re-classify.
4. **Valid + actionable** — real issue. Fix it, re-loop.
5. **Valid trade-off** — real issue but fixing costs more than accepting. Document it.
6. **Noise** — reviewer lacks context. Note it, move on.

### Step 5: STOP — Bounded loop

Stop when:
- Next iteration returns only trivial or already-considered findings, OR
- 3 cycles completed (escalate to user — don't grind alone), OR
- User says "ship it"

If 3 cycles still surface substantive issues, the artifact isn't ready. Surface this to the user.

## Cross-Model Review

A different model/agentic CLI may catch blind spots your current model shares with itself.

### When to Use Cross-Model

**Skip cross-model (single subagent review is enough) when:**
- Small task in a small project
- Problem is trivial with clear context
- Single-model review gave clean, actionable insights
- You're already confident after the first review

**Use cross-model when:**
- Big task in a large codebase (50k+ lines)
- Long struggle without clear progress
- Single-model review was inconclusive or suspicious
- High-stakes decision where blind spots are costly
- You've been working on this problem for a long time

### Discover Available CLIs

Check which CLIs are available in the environment. Default set: `claude`, `codex`, `gemini`, `opencode`.

**Important:** Don't call yourself. If running inside OpenCode, skip `opencode`. If inside Claude Code, skip `claude`.

### Healthcheck Before Use

Before relying on a CLI for review, verify it works with a quick test prompt:

```bash
# OpenCode (example — skip if you ARE OpenCode)
opencode run "this is a health check! say hello and exit" --dir $(mktemp -d)

# Codex (skip if you ARE codex)
codex exec --skip-git-repo-check "this is a health check! say hello and exit" --cd $(mktemp -d)

# Gemini
(cd $(mktemp -d) && GEMINI_CLI_TRUST_WORKSPACE=true gemini -p "this is a health check! say hello and exit")

# Claude
(cd $(mktemp -d) && claude -p "this is a health check! say hello and exit")
```

Only use CLIs that pass the healthcheck. If a CLI fails, note it and move to the next option.

### Invoke Cross-Model Review

When invoking a cross-model CLI:

1. Check relevant skills to understand how to use particular CLI agent
2. Pass ARTIFACT + CONTRACT + adversarial prompt only — no session context, no CLAIM
3. Never interpolate artifact into shell arguments — use stdin or temp file
4. Spawn the agent in same working directory with you so it will have the full context

Take the output into Step 4 (RECONCILE).

## Examples

### Example 1: Flaky Tests (XY Detection)

**CLAIM:** "Adding retries and simplifying test cases will fix the flaky E2E tests."

**Subagent output:**
> These tests are flaky because the service bootstrap is non-deterministic. You're patching symptoms at the test layer. The fix belongs upstream in bootstrap logic. Step back and investigate the test infrastructure before modifying tests.

**Action:** Pivot. Investigate bootstrap. Fix root cause.

---

### Example 2: Missing Constraints

**CLAIM:** "Implementing token bucket middleware with 100 req/min per-IP limit."

**Subagent output:**
> You picked per-IP with 100 req/min, but the user didn't specify. Per-IP breaks shared networks (offices, NAT). Per-user requires auth context. Rate limiting architecture depends on answers you don't have. Clarify: per-user/per-IP/per-key, limit value, and rejection behavior before implementing.

**Action:** Ask user for constraints. Then implement correctly.

---

### Example 3: Wrong Layer

**CLAIM:** "Adding mutex to file writer to fix concurrent write race condition."

**Subagent output:**
> This code is documented as single-threaded. If concurrent writes are happening, something upstream is spawning duplicate jobs. You're locking a codepath that shouldn't have concurrency at all. The fix is in the caller — find why jobs are duplicated.

**Action:** Investigate caller. Find duplicate job spawning. Fix there.

---

### Example 4: Complexity Masking Uncertainty

**CLAIM:** "Implementing merge logic that handles both per-device and global preferences by checking device context."

**Subagent output:**
> You built a branch to handle two conflicting models because you don't know which one is correct. This is complexity born of uncertainty. The merge logic will be fragile and hard to test. Resolve the model question first — don't encode ambiguity into the system.

**Action:** Clarify with user. Implement one model cleanly.

---

### Example 5: Premature Optimization

**CLAIM:** "Adding Redis caching layer to speed up the slow dashboard."

**Subagent output:**
> You're optimizing without measurement. You don't know if the slowness is DB, frontend, network, or something else. Adding Redis is a significant architectural commitment. Profile first — the fix might be a single query index, not a caching layer.

**Action:** Profile. Find missing index. Add index. Done.

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "I'm confident, skip doubt" | Confidence correlates poorly with correctness on novel problems. |
| "A reviewer is expensive" | Debugging in production is more expensive. The check is bounded; the bug isn't. |
| "I'll doubt at the end with `/review`" | `/review` is post-hoc. Doubt-early catches wrong directions when course-correction is cheap. |
| "If I doubt every step I'll never ship" | The skill applies to non-trivial decisions, not every keystroke. |
| "The reviewer will just nitpick" | Only if unscoped. The adversarial prompt targets meaningful issues. |
| "I can self-check" | You cannot reliably detect your own XY problems. Fresh context is the load-bearing mechanism. |

## Red Flags

- Spawning a fresh-context reviewer for a simple implementation or clean fix
- Treating reviewer output as authoritative without re-reading the artifact text
- Skipping doubt under time pressure on a high-stakes decision
- Prompting the reviewer with "is this good?" instead of "find issues"
- Passing the CLAIM to the reviewer (biases toward agreement)
- Classifying all reviewer findings as "noise" (you're validating, not doubting)
- Looping >3 cycles without escalating
- Re-spawning review on an unchanged artifact (you're stalling)
- Silently skipping cross-model offer in interactive mode
- Treating reviewer output as verdict instead of data

## Interaction with Other Skills

- **`prototype-first`**: use when the doubt reveals a risky assumption worth prototyping
- **`source-driven-development`**: SDD verifies framework facts; doubt-early verifies your reasoning
- **`systematic-debugging`**: when doubt reveals a real failure mode, drop into debugging
- **`brainstorming`**: doubt-early challenges decisions; brainstorming generates them

## Verification Checklist

After applying doubt-early:

- [ ] Named the claim explicitly
- [ ] Invoked fresh-context reviewer (not self-reflection)
- [ ] Passed ARTIFACT + CONTRACT only (not CLAIM)
- [ ] Used adversarial prompt ("find issues", not "is it good")
- [ ] Classified findings (XY / missing constraints / contract misread / actionable / trade-off / noise)
- [ ] Acted on findings or explicitly documented trade-offs
- [ ] Met stop condition
- [ ] In interactive mode, offered cross-model review
