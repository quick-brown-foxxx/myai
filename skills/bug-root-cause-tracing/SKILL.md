---
name: bug-root-cause-tracing
description: >-
  Use during debugging when the root cause is not obvious, the error appears deep
  in a call chain, or bad state must be traced back to the caller, test, or code
  path that introduced it. Backward tracing for invalid values, wrong files,
  unexpected side effects, and test pollution.
metadata:
  tags: debugging, root-cause
---

# Bug Root Cause Tracing

## Overview

Bugs often manifest deep in the call stack — wrong directory, bad parameter, corrupted data — far from where the invalid value originated. Fixing where the error appears treats the symptom. Tracing backward to find the original trigger fixes the cause.

**Core principle:** Never fix where the error surfaces. Trace back until you find what actually caused it.

```text
systematic-debugging
  -> bug-root-cause-tracing  (you are here, when root cause is unclear/deep)
       -> trace backward to original trigger
       -> fix at source
       -> test-driven-development / manual-testing  (prove original symptom)
       -> bug-protection-multi-layered              (if class can recur)
       -> verification-before-completion
```

## When to Use

- Error appears deep in execution (not at the entry point)
- Stack trace shows a long call chain
- Unclear where invalid data originated
- You need to find which code path triggers the problem
- Bad state, wrong files, unexpected side effects, or test pollution appear far from their origin
- `systematic-debugging` Phase 2 investigation didn't immediately reveal the root cause

## The Tracing Process

### Step 1: Observe the Symptom

Identify what exactly fails and where:

```
Error: git init failed in /home/user/project/packages/core
```

### Step 2: Find the Immediate Cause

What code directly produces this failure?

```python
subprocess.run(["git", "init"], cwd=project_dir, cwd=project_dir)
```

### Step 3: Trace Up One Level

Ask: what called this code, and with what values?

```
WorktreeManager.create_session_worktree(project_dir)
  → called by Session.initialize_workspace()
  → called by Session.create()
  → called by test at Project.create()
```

### Step 4: Keep Tracing

At each level, identify the parameter values and whether they're valid:

```
project_dir = ""   ← empty string!
  → Empty cwd resolves to process.cwd()
  → That's the source code directory!
```

### Step 5: Find the Original Trigger

Where did the bad value originate?

```python
context = setup_core_test()   # Returns { temp_dir: "" }
Project.create("name", context.temp_dir)   # Accessed before setUp!
```

**Root cause:** The test accessed a variable before it was initialized. Fix at this level, not at the `git init` call.

## Stack Trace Instrumentation

When you can't trace the call chain manually, add instrumentation:

```python
# Before the problematic operation
import traceback

def git_init(directory: str) -> None:
    print(f"DEBUG git init:", file=sys.stderr)
    print(f"  directory: {directory}", file=sys.stderr)
    print(f"  cwd: {os.getcwd()}", file=sys.stderr)
    traceback.print_stack(file=sys.stderr)

    subprocess.run(["git", "init"], cwd=directory)
```

**Critical:** Write diagnostics to stderr (not a logger that may be suppressed in tests).

**Run and capture:**
```bash
pytest -v 2>&1 | grep "DEBUG git init"
```

**Analyze stack traces:**
- Look for test file names and line numbers
- Find the origin of each call
- Identify the pattern — same test? same parameter?

## Key Pattern: Backward Tracing

```
Found immediate cause
    │
    ├── Can trace one level up?
    │   YES → what called this, with what values?
    │   │       │
    │   │       ├── Is this the source of the bad value?
    │   │       │   YES → fix at source
    │   │       │   NO  → trace further up
    │   │       │
    │   │       └── Can't trace up? Instrument with stack logging
    │   │
    │   NO → you're at a dead end
    │       Add instrumentation and re-run
    │
    └── NEVER fix just the symptom
```

## Adding Stack Traces

When the call chain is unclear:

```python
# Create a stack trace at the point of failure
stack = "".join(traceback.format_stack())
logging.debug("About to perform operation:\n%s", stack)
```

This reveals who called this code, with what arguments, in what context.

## Minimizing the Trace

Once you have a stack trace showing the full chain:

1. Find the outermost caller that passes a bad value
2. Verify by tracing forward: if you fix this value, does the symptom disappear?
3. If yes — you've found the root cause. Fix at this level.
4. If no — there's another source upstream. Keep tracing.

## Common Mistakes

- **Fixing the innermost error** — the place where the crash happens is rarely where the bug lives
- **Stopping at "this library is broken"** — trace further: are you using it correctly?
- **Adding null checks downstream** — downstream validation hides bugs; upstream fixes eliminate them
- **Skipping instrumentation** — "I know what this value should be" is not evidence. Log it and confirm.

## Real Example

**Symptom:** `.git` directory created inside source code directory

**Trace:**
1. `git init` ran in `process.cwd()` ← empty `cwd` parameter
2. `WorkspaceManager` called with empty project directory
3. `Session.create()` passed empty string
4. Test accessed `context.temp_dir` before setUp
5. `setup_core_test()` returned `{ temp_dir: "" }` initially

**Root cause:** Top-level variable initialization accessing an empty value before setup.

**Fix:** Made `temp_dir` a getter that raises if accessed before setUp. Also added validation at each level — the same bug is now structurally impossible.

## Related Skills

| Situation | Skill |
| --- | --- |
| Need the full debugging process before or around tracing | `systematic-debugging` |
| Automated regression proof is practical after the root cause is fixed | `test-driven-development` |
| Runtime/manual proof is the right verification path | `manual-testing` |
| Bug class can recur across layers or paths | `bug-protection-multi-layered` |
| Tracing reveals a fundamental design issue | `doubt-early` |
| About to claim the fix is complete | `verification-before-completion` |
