# Debugging Skills Design

## Rationale

A single `systematic-debugging` skill would be too large (~600 lines) and mix investigation process, prevention techniques, and tracing techniques. Splitting into three focused skills lets each load independently when appropriate and keeps each skill readable.

## Skill Map

```
Bug occurs
    │
    ├── Bug is unclear, deep in stack, root cause unknown?
    │   └── `bug-root-cause-tracing` — backward trace to find original trigger
    │
    ├── Bug is any technical issue?
    │   └── `systematic-debugging` — core investigation + fix process
    │
    ├── Bug found and fixed?
    │   └── `bug-protection-multi-layered` — add validation so it never recurs
    │
    └── (all three can be called independently)
```

## Skill Definitions

### 1. `systematic-debugging` (core merging SP + Addy)

**Purpose:** Primary entry point for any bug, test failure, or unexpected behavior.

**Sources:**
- SP `systematic-debugging/SKILL.md` (296 lines) — 4-phase process, rationalization tables, red flags
- Addy `debugging-and-error-recovery/SKILL.md` (300 lines) — triage checklist, error-specific patterns, safe fallbacks, untrusted data

**Merge plan:**
- Phase 1: Reproduce & Localize — Addy's reproduce/localize/reduce triage, SP's evidence gathering
- Phase 2: Root Cause Analysis — SP's backward tracing (with reference to bug-root-cause-tracing for deep cases), Addy's error-specific patterns
- Phase 3: Pattern Analysis — SP's working examples comparison
- Phase 4: Hypothesis & Fix — SP's single hypothesis + Addy's fix root cause
- Phase 5: Guard & Verify — merged failing test + regression test + e2e verify
- Plus: error-specific triage (Addy), 3+ fixes = question architecture (SP), untrusted data (Addy), safe fallbacks (Addy)
- Red flags and rationalizations merged from both

**Cross-references:** Links to `bug-protection-multi-layered` (Phase 5) and `bug-root-cause-tracing` (Phase 2)

### 2. `bug-root-cause-tracing` (from SP root-cause-tracing.md)

**Purpose:** When a bug's root cause is not obvious, the error appears deep in the call stack, or you need to trace backward through a chain of calls to find the original trigger.

**Source:** SP `root-cause-tracing.md` (169 lines)

**Adjustments:**
- Generalize from TypeScript examples to language-agnostic
- Add stack trace instrumentation techniques
- Add call chain mapping and bisection within the trace

**Activation trigger:** Any debugging session where "root cause is unclear" or "error is deep in a long call chain" or "need to trace back to find where bad data originated"

**Cross-reference:** Called from `systematic-debugging` Phase 2 when standard investigation doesn't reveal root cause. Calls back into `systematic-debugging` Phase 3 when trace reveals the source.

### 3. `bug-protection-multi-layered` (from SP defense-in-depth.md)

**Purpose:** After a bug is fixed, add validation at multiple layers so the same bug becomes structurally impossible — not just fixed at one point.

**Source:** SP `defense-in-depth.md` (122 lines)

**Adjustments:**
- Generalize from TypeScript to language-agnostic
- Rename layers if needed for clarity
- Add: distinction between validation layers (catch errors) vs instrumentation layers (capture context for forensics)

**Activation trigger:** After any bug fix, to "ensure the bug does not recur in other code paths" or "add defenses so the same class of bug becomes impossible"

**Cross-reference:** Called from `systematic-debugging` Phase 5 (Guard & Verify). Independent skill — also useful as standalone post-fix step.

## Files Kept From SP Source

| File                                      | Action         | Destination                            |
| ----------------------------------------- | -------------- | -------------------------------------- |
| SP `systematic-debugging/SKILL.md`        | → refactor     | → `skills/systematic-debugging/SKILL.md` |
| SP `root-cause-tracing.md`                | → rewrite      | → `skills/bug-root-cause-tracing/SKILL.md` |
| SP `defense-in-depth.md`                  | → rewrite      | → `skills/bug-protection-multi-layered/SKILL.md` |
| SP `condition-based-waiting.md`           | discard        | —                                      |
| SP `condition-based-waiting-example.ts`   | discard        | —                                      |
| SP `find-polluter.sh`                     | discard        | —                                      |
| SP `CREATION-LOG.md`                      | discard        | —                                      |
| SP `test-academic.md`                     | discard        | —                                      |
| SP `test-pressure-1.md`                   | discard        | —                                      |
| SP `test-pressure-2.md`                   | discard        | —                                      |
| SP `test-pressure-3.md`                   | discard        | —                                      |

## Style Reference

Follow the pattern from `skills/verification-before-completion/SKILL.md`:
- Self-contained single file
- Sections with tables where useful
- Examples before/after (✅/❌) for key patterns
- Red Flags and Rationalization Prevention sections
- Cross-references to related skills
- No aux files in the skill directory
