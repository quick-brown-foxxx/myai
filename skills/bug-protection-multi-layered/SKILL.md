---
name: bug-protection-multi-layered
description: >-
  Use after fixing recurring, high-risk, or boundary-crossing bugs to prevent the same
  class from recurring. Adds validation at multiple layers — entry points, business logic,
  environment guards, and forensic instrumentation — so invalid states are caught even
  through different code paths. Skip for trivial one-off fixes where layered defenses would
  add more complexity than protection.
---

# Bug Protection: Multi-Layered

## Overview

A single validation point is easy to bypass — different code paths, refactoring, or mocks can circumvent it. Real protection requires checks at every layer data passes through.

**Core principle:** One fix removes the bug. Validation layers make the invalid state structurally impossible; instrumentation makes missed failures diagnosable.

## When to Use

- After fixing a bug that can recur through multiple code paths or boundaries
- When the same class of bug has appeared in different places
- When a bug was caused by invalid data propagating through the system
- When the bug involved dangerous side effects, destructive operations, security/safety boundaries, or production incidents
- After running `systematic-debugging` Phase 5 (Guard & Verify)

## When Not to Use

Skip this skill when layered defenses would add more complexity than protection:

- A typo, formatting issue, or obvious one-line mistake
- A stale or incorrect test expectation
- A one-off dependency/config/build issue with no recurring data path
- A local development mistake already covered by existing tests or tooling
- The fix does not cross subsystem, trust, safety, persistence, or side-effect boundaries

In these cases, a regression test or targeted verification is usually enough. Use this skill when the bug class matters, not merely because a bug existed.

## The Four Layers

### Layer 1: Entry Point Validation

Reject invalid input at every public API boundary — function parameters, API endpoints, config loaders, user input.

```python
def create_project(name: str, working_directory: str) -> Project:
    if not working_directory or not working_directory.strip():
        raise ValueError("working_directory cannot be empty")
    if not os.path.exists(working_directory):
        raise ValueError(f"working_directory does not exist: {working_directory}")
    if not os.path.isdir(working_directory):
        raise ValueError(f"working_directory is not a directory: {working_directory}")
    # ... proceed
```

**What to check:** existence, format, range, type, boundary values.

### Layer 2: Business Logic Validation

Ensure data makes sense for the specific operation — beyond format checks, validate semantic constraints.

```python
def initialize_workspace(project_dir: str, session_id: str) -> Workspace:
    if not project_dir:
        raise ValueError("project_dir required for workspace initialization")
    if not is_under_allowed_path(project_dir):
        raise PermissionError(f"project_dir not in allowed paths: {project_dir}")
    # ... proceed
```

**What to check:** semantic validity, authorization, state preconditions, invariants.

### Layer 3: Environment Guards

Prevent dangerous operations in unsafe contexts — test environments, production safeguards, platform-specific guards.

```python
def git_init(directory: str) -> None:
    # In tests, refuse git init outside temporary directories
    if os.environ.get("ENV") == "test":
        normalized = os.path.normpath(os.path.realpath(directory))
        tmp_dir = os.path.normpath(tempfile.gettempdir())
        if not normalized.startswith(tmp_dir):
            raise RuntimeError(
                f"Refusing git init outside temp dir during tests: {directory}"
            )
    # ... proceed
```

**What to check:** environment variables, platform, runtime mode (test/dev/prod), filesystem boundaries.

### Layer 4: Forensic Instrumentation

Capture context for forensics when other layers would miss the issue. Instrumentation does not prevent the bug by itself; it makes the next failure diagnosable.

```python
def git_init(directory: str) -> None:
    logger.debug("About to git init", extra={
        "directory": directory,
        "cwd": os.getcwd(),
    })
    # ... proceed
```

**What to instrument:** dangerous operations, external calls, state mutations, preconditions.

## How to Apply

After finding the root cause of a bug:

1. **Trace the data flow** — where does the bad value originate? What does it pass through?
2. **Map all checkpoints** — list every layer and function the data crosses
3. **Add protection at each layer** — entry validation, business validation, environment guards, forensic instrumentation
4. **Test each layer** — try to bypass layer 1, verify layer 2 catches it

```python
# Before: one check that can be bypassed
def create_project(dir):
    if not dir:
        raise ValueError("dir required")
    # ... downstream logic trusts dir completely

# After: four layers
def create_project(dir):
    validate_path(dir)           # Layer 1: entry validation
    # ...
    ws.validate_path(dir)        # Layer 2: business logic
    # ...
    guard.git_init(dir)          # Layer 3: environment guard
    # ...
    log.debug("git init in %s", dir)  # Layer 4: forensic instrumentation
```

## Why Multiple Layers Work

The validation layers catch what the others miss:
- **Entry validation** catches most bugs at the boundary
- **Business logic** catches edge cases and semantic violations
- **Environment guards** catch context-specific dangers
- **Forensic instrumentation** captures evidence when other layers fail

Different code paths may bypass one layer but not another. A mock may skip entry validation. Refactoring may skip business logic. Environment guards are context-aware. Instrumentation is always present.

## Common Mistakes

- **Stopping at one layer** — "I added a null check, the bug is fixed." That check only covers one code path.
- **Validation at the wrong layer** — checking business rules at the entry point creates coupling. Keep layers distinct.
- **No environment guard for dangerous operations** — delete operations, destructive commands, side effects in tests.
- **Skipping instrumentation** — "I'll know if it fails again." Without instrumentation, you'll have no context when it does.
- **Over-validating** — not every value needs all four layers. Focus on the data path the bug followed.

## Relationship to Testing

Multi-layer validation is complementary to regression tests:

```
Regression test:  "This specific bug will not recur"
Multi-layer:      "This invalid state is rejected or diagnosed across code paths"
```

Regression tests verify the fix. Multi-layer validation prevents the same mistake from being made elsewhere; instrumentation preserves evidence when prevention misses.

## Related Skills

- **`systematic-debugging`** — Use before this skill to find the root cause. Consider this skill as the guard step after high-risk or boundary-crossing fixes.
- **`bug-root-cause-tracing`** — When tracing the data flow for multi-layer placement, this skill provides the technique.
- **`verification-before-completion`** — Use before claiming the multi-layer fix is complete.
