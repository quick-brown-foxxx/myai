---
name: setting-up-projects
description: >-
  ALWAYS LOAD THIS SKILL WHEN CREATING A NEW PROJECT, BOOTSTRAPPING A REPO, OR CHOOSING INITIAL PROJECT SHAPE
  FOR ANY LANGUAGE OR ECOSYSTEM. Do not scaffold projects directly — use this skill first.
  Project shape decisions, directory layout patterns, bootstrap checklist, graceful shutdown strategy, domain adaptation, and language-specific extension routing.
license: MIT
metadata:
  focus: project-bootstrap
  tags: bootstrap, architecture, project-structure
---

# Setting Up Projects

## Prerequisites

Load `engineering-principles` before this skill. It provides the foundation:
invest early, pit of success, safety net, strict tooling, and explicit over
clever. This skill builds on those principles with concrete project-shape
decisions, layout patterns, and a bootstrap checklist.

For deeper architecture decisions about boundaries, layers, and framework
choices, load `architecting-changes` after this skill.

---

## Choose the Shape First

Choose structure based on expected change axes and future callers, not
only conventions. The shape determines where code lives, how it is tested, and how
it grows.

| Situation | Default shape |
|-----------|---------------|
| One-off helper or tiny automation | Single-file script with inline dependencies. Do not force a full project layout. See `writing-scripts`. |
| Reusable library or composable tool | Package with clean public API. Add a thin CLI only if needed. |
| CLI application | Package with `core/`, `cli/`, `utils/`, `wrappers/` layers. |
| Multi-interface application (GUI + CLI + API sharing logic) | Shared domain layer + separate presentation adapters + one composition root. |
| Backend service / API / worker | Service-specific layout (see `setting-up-backends`). Thin transport + separate domain/services/infrastructure. |

The decision is about what will change independently and who will call the
code. A library needs a stable public API. A CLI app needs testable commands.
A multi-interface app needs a reusable core that survives presentation
changes.

---

## Project Layout Pattern

This is a starting point, not a mandate. Omit what you do not need. No GUI
→ no `ui/`. No CLI → no `cli/`. Add domain-specific directories when the
project demands them.

```text
project/
├── src/                         # Source code (or ecosystem-appropriate name)
│   └── appname/
│       ├── core/                # Business logic, pure domain rules
│       │   ├── models           # Data types
│       │   └── services         # Operations / use cases
│       ├── cli/                 # CLI interface (if applicable)
│       ├── ui/                  # GUI interface (if applicable)
│       ├── utils/               # Stateless shared utilities
│       ├── wrappers/            # Typed facades around third-party APIs
│       └── entrypoint           # Thin main/entry
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── scripts/                     # Dev utilities, automation
├── docs/                        # Coding standards, philosophy, ADRs
├── project-manifest             # Dependencies, tool config
├── linter-config                # Language-appropriate linter setup
└── ci-config/                   # CI pipeline definitions
```

**`wrappers/`**: Isolate third-party, platform-specific, or weakly-typed
boundaries behind typed interfaces. Wrap when typing, exception isolation,
portability, or replacement matters. Do not wrap every dependency
reflexively — wrap when the boundary is dynamic, risky, or likely to change.

**Entrypoint**: Keep it thin. Assemble the real presentation layer elsewhere
(core, CLI, GUI, API app factory, worker entrypoint) and let the entrypoint
do only the final handoff. The entrypoint bootstraps and delegates, it does
not own behavior.

---

## Setup Checklist

1. **Create directory structure** — create the source, test, script, and doc
   directories. Start with only what you need; add more as the project grows.

2. **Copy baseline files** — if you have them, promote templates into place: 
   project manifest, linter config, CI config, version-control ignore file,
   editor settings. Copy shared building blocks if the ecosystem provides them. 
   Copy coding standards and philosophy docs into `docs/`.

3. **Trim unused pieces** — keep only the modules and directories you
   actually need. Remove unused template dependencies, shared modules, and
   config sections. The template is a starting point, not a straitjacket.

4. **Create entry points** — thin main/entrypoint that hands off to the real
   presentation layer. Keep it minimal: bootstrap and delegate. If the app
   has multiple interfaces sharing one core, use a dedicated multi-interface
   pattern rather than an ad-hoc router in the entrypoint.

5. **Create initial smoke test** — one test that exercises the entrypoint
   end-to-end. Verifies the wiring works, not business logic. For entrypoints
   that read command-line arguments, set them explicitly in the test so it
   does not depend on the test runner's own arguments.

6. **Initialize environment** — initialize version control, install
   dependencies, run linter + type checker + tests. Use the project's task
   runner for all commands rather than system-installed binaries.

7. **Verify everything works** — linter passes, type checker passes, tests
   pass. This is the baseline safety net. Every future commit must pass the
   same gates.

---

## Graceful Shutdown

Design every app to be interruptible without corruption, hanging, or ugly
tracebacks. The shutdown strategy depends on what the app does.

| App type | Strategy |
|----------|----------|
| Simple script/CLI | Catch interrupt signal, exit with standard signal code |
| CLI wrapping a quick subtask | Kill process group immediately on interrupt |
| CLI wrapping complex external tool | Graceful signal → wait timeout → force kill escalation |
| Long-running event-loop app | Handle signal in event loop (see platform-specific docs) |

Always use process groups when spawning subprocesses so you can kill the
entire tree, not just the parent. For async subprocesses, handle cancellation
with the same escalation pattern: terminate → wait → kill.

The goal is that Ctrl+C always works cleanly. No hung processes, no partial
writes, no stack traces in user output.

---

## Adapt to Domain

After scaffolding, adapt everything to the specific project. Templates are a
starting point, not a straitjacket. Keep the philosophy and core safety model
intact, then adapt the surrounding structure to fit the project's domain and
constraints.

| Area | How to adapt |
|------|--------------|
| Directory layout | Add/remove/rename directories to match domain. A data pipeline might need `pipelines/`, `schemas/`. A web service might need `routes/`, `middleware/`. |
| Dependencies | Add domain-specific libraries. Remove unused defaults. Research current best-in-class libraries for the domain. |
| Linter/type checker config | Adjust rules for ecosystem gaps. Do not relax strict defaults by default; document every real exception. |
| Project orientation doc | Fill in project-specific architecture, key decisions, domain vocabulary, workflows. Make it specific to THIS project. |
| Coding standards | Extend or override rules for the domain. Add domain-specific conventions (migration rules, API versioning, validation requirements). |
| Test structure | Adjust to what matters. CLI tool → heavy e2e. Library → heavy unit. Web service → API integration tests. |
| CI/CD | Add domain-appropriate checks (schema validation, container builds, integration suites). |

**Research before building**: When in an unfamiliar domain, research domain
conventions, check library compatibility with your toolchain, and identify
domain-specific tooling. Look at how well-maintained projects in the same
space are structured.

### Quick Customization Checklist

- [ ] Directory layout matches the domain, not the generic template
- [ ] Dependencies are domain-appropriate (researched, not guessed)
- [ ] Project orientation doc describes THIS project specifically
- [ ] Coding standards have domain-specific additions if needed
- [ ] Test structure reflects what matters most for this project
- [ ] Tool config accounts for domain-specific quirks

---

## Related myai Skills

- **`engineering-principles`** — Parent skill. Language-agnostic project setup
  philosophy: invest early, pit of success, safety net.
- **`architecting-changes`** — For architecture decisions about project shape,
  boundaries, and framework choice.
- **`writing-scripts`** — For single-file scripts and small automation instead
  of full project layout.
- **`building-backends`** — For backend architecture patterns after initial
  bootstrap: thin transport, reusable core, transactions, auth, workers.
- **`setting-up-backends`** — For backend service bootstrap when the project
  shape is a service/API/worker.
- **`ci-cd-and-automation`** — For CI/CD pipeline setup after bootstrap.

---

## Language-Specific Extensions

After applying the patterns in this skill, load the appropriate
language-specific extension for concrete tool choices, library selections,
config templates, and code examples:

- **Python**: `setting-up-python-projects` — uv, basedpyright, ruff, pytest,
  pre-commit, pyproject.toml, src layout, bootstrap script
- **Other ecosystems**: if no language-specific skill exists, apply the
  patterns above with `engineering-principles` ecosystem examples as a
  starting point, and record the gap for follow-up

When a language-specific extension is available, load this skill first for
the patterns and decision framework, then the extension for concrete tooling.
