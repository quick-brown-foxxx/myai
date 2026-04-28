---
name: prototype-first
description: >-
  Helps fail fast on risky implementation steps by prototyping before committing
  to full code changes. Use during planning or implementation when a step is
  ambiguous, depends on multiple subsystems or flaky tools, may invalidate the
  current plan, or when repeated fix attempts suggest a doom loop. 
  Useful both at planning step and during implementation.
license: MIT
metadata:
  focus: early-risk-validation
---

# Prototype First

Prototype risky steps early instead of discovering failure in the middle of implementation.

## When To Use

- A plan contains an unclear or high-risk step.
- Multiple implementation strategies seem plausible.
- Success depends on interacting subsystems, external tools, packages, or flaky libraries.
- A bug fix already required several attempts.
- The next change may force meaningful plan changes if the assumption is wrong.

## Default Approach

- Isolate the risky assumption.
- Run the smallest useful prototype or spike that can confirm or reject the approach.
- Capture only the useful outcome: chosen approach, key rejected approaches when relevant, constraints, and required setup.
- Update the plan if needed, then proceed with real implementation.

## Delegation Rule

Prefer a separate subagent when the prototype is likely to create noisy context: failed attempts, dead ends, environment tweaking, or broad exploration.

Keep prototyping in the main agent only when it is small, fast, and unlikely to generate irrelevant detail.

The main agent should retain the final working idea, not the full trial-and-error history.

## Avoid

- Turning exploratory patches into production code without cleanup or deliberate reimplementation.
- Continuing ad hoc fixes after signals that the approach is not understood yet.
- Letting prototype results sit outside the implementation decision.

## Examples

### Example: Packaging `.deb` and `.rpm` artifacts across repos, distros, and `x86_64`/`arm64`.

Use `prototype-first` before implementation. First prototype the packaging and test flow in isolation: build inside distro-specific containers, validate dependency availability, and check which architecture combinations can be tested locally. If the host architecture does not match the target, prefer a separate subagent to research and prototype the viable path: native containers, extensive web research, cross-compilation, or remote/CI builds, depending on context and available tools/hardware capabilities. Return only the working matrix, rejected approaches, required environment setup, and constraints. Then update the plan if needed and implement the real packaging workflow.

### Example: An authentication or API-flow bug has already resisted several fixes.

Use `prototype-first` before trying another patch. Isolate the failing assumption and create a small reproduction or spike outside the main implementation path. Prefer a separate subagent if debugging will involve noisy trial-and-error across logs, environment settings, network behavior, or library internals. Return only the confirmed root cause, the working fix strategy, constraints, and any setup needed to verify it. Then update the plan if needed and apply the real fix cleanly instead of continuing ad hoc patches.
