---
name: git-workflow
description: >-
  ALWAYS LOAD THIS BEFORE COMMITTING FOR THE FIRST TIME IN SESSION,
  OR WHEN CREATING GIT WORKTREES.
  Use for creating git branch, worktree isolation, atomic commits
  with messages, gitignore, git hooks, automated code quality checks,
  and multi-agent/worktree isolation.
license: MIT
metadata:
  focus: git-change-management
  tags: implementation, orchestration, quality
---

# Git Workflow

Git is the safety net for agentic development: branches isolate work, commits are
save points, and history explains why changes happened.

Default posture:

```text
main/master/dev branch -> stays clean and stable
feature/fix work       -> happens in a branch or worktree when non-trivial
commits                -> small, verified, atomic, and descriptive
```

This skill gives defaults. User instructions, project conventions, host rules,
and repository-specific workflows override them.

---

## Operating Principles

| Principle | Meaning |
| --- | --- |
| Never fight the harness | Prefer platform-native worktree/workspace tools before manual git worktrees |
| Detect before creating | Check whether you are already isolated before creating branches/worktrees |
| Main stays boring | Keep main/master/dev clean; do real work in short-lived branches/worktrees |
| Commit atomically | One logical change per commit; separate behavior, refactor, docs, and formatting |
| History explains why | Commit messages and summaries should explain intent, not just file movement |
| Destructive operations need confirmation | No force delete/reset/cleanup without explicit approval |

---

## Repository Setup Policy

Before serious edits, understand where you are.

```text
Is this a git repo?
│
├─ yes
│  └─ continue with branch/worktree/commit policy
│
└─ no
   ├─ project directory?        -> initialize git, then set hooks/ignore if current scope fits
   └─ generic user location?    -> do NOT init; warn user that edits are not versioned
```

Project-shaped locations:

```text
/home/user/projects/my-app/
/home/user/Desktop/my-tool/
/repo/customer-api/
```

Generic or personal locations:

```text
~
~/Desktop
~/Downloads
~/.config/something
/tmp/random-edit
```

If editing a generic location, do not initialize git by surprise. Say that the
files are outside a project repo and changes will not have normal versioned
rollback unless the user chooses a repo location.

---

## Branch And Worktree Decision Map

```text
Need isolation?
│
├─ tiny fast edit / one obvious file
│  └─ work in place, inspect diff carefully
│
├─ medium/big edit, risky refactor, feature, or multi-agent work
│  └─ prefer branch/worktree isolation
│
├─ already in branch or worktree?
│  └─ do not create another one unless explicitly needed
│
└─ platform has native workspace/worktree support?
   └─ use native tool first; manual git worktree only as fallback
```

Worktrees are preferred for medium/big work when isolation matters. They can be
skipped for small fast edits or when the prompt/context clearly asks to work in
place.

Parallel agents do not always need distinct worktrees. Use separate worktrees
only when agents need isolation from each other: overlapping files, risky
experiments, or clean fresh state. If agents are read-only or working on
non-overlapping checks, separate worktrees may be unnecessary overhead.

---

## Detect Existing Isolation

Before creating a worktree, check whether the current workspace is already a
linked worktree.

```bash
git rev-parse --show-toplevel
git rev-parse --git-dir
git rev-parse --git-common-dir
git branch --show-current
```

Interpretation:

```text
git-dir == git-common-dir
  -> normal checkout

git-dir != git-common-dir
  -> likely linked worktree
```

Submodule guard:

```bash
git rev-parse --show-superproject-working-tree 2>/dev/null
```

If this returns a path, you are inside a submodule, not simply a worktree. Treat
it according to the submodule/project context.

Never create a nested worktree just because a plan says "use worktree." Detect
first.

---

## Worktree Location Policy

Prefer existing project conventions over inventing a new layout.

```text
1. User/project instructions
2. Existing project-local .worktrees/ or worktrees/
3. Mature project with no worktree config -> external hidden location
4. Small/new/greenfield project -> create project-local .worktrees/ carefully
```

### Small Or Greenfield Projects

For small/new projects, a hidden project-local worktree directory is often best:

```text
proj_root/
  src/
  .worktrees/
    feat1/
    feat2/
  .gitignore
```

If creating `.worktrees/`, also update ignore/configuration so tooling does not
scan it.

Check likely files:

```text
.gitignore
package.json
eslint.config.js / eslint.config.mjs / .eslintrc*
tsconfig.json
pyproject.toml
ruff.toml
.vscode/settings.json
tool-specific config files
```

After adding ignores, run the appropriate build/lint/typecheck health check and
confirm the project is not worse than before.

### Mature Projects

For mature projects with no worktree convention, avoid adding new project-local
tooling noise. Use an external hidden location such as:

```text
~/.config/myai/worktrees/<project>/<branch>/
```

This avoids breaking build, lint, search, test discovery, and editor tooling in
large repositories.

---

## Baseline Health Check

Running tests/lint/typecheck before work in new worktree can be useful, but it is a health check,
not always a gate.

```text
Baseline check passes
  -> good, proceed with a known-clean starting point

Baseline check fails
  -> record existing failure; decide whether it blocks this work
```

Baseline failures may already exist on `main`. Do not treat every baseline
failure as caused by the current work. Record the command and failure summary so
future verification can distinguish new regressions from existing problems.

---

## Commit Policy

Default workflow: commit meaningful verified increments.

Exceptions and overrides:

- User, project, or platform instructions may override commit behavior.
- If current runtime says not to commit without explicit request, make the work
  commit-ready and report that instead of committing.
- Do not commit edits in generic locations such as `~`, `~/Desktop`,
  `~/Downloads`, or random `~/.config/...` directories; warn the user instead.

```text
Work in real project repo
  -> commit meaningful verified increments

Work in generic location
  -> no commits; warn user edits are outside normal project history
```

---

## Atomic Commits

Each commit should do one logical thing.

```text
Good history:
  feat: add task creation endpoint
  test: cover task validation errors
  refactor: extract task validation helper

Bad history:
  update stuff
  fix
  add task feature and refactor auth and update prettier
```

Separate these concerns when practical:

| Concern | Usually separate? | Why |
| --- | --- | --- |
| Behavior change | yes | should be reviewable and revertable alone |
| Refactor | yes | behavior-preserving changes need different review |
| Formatting-only change | yes | hides real diffs if mixed |
| Tests for a feature | often with feature | if they prove the same behavior |
| Config/tooling change | yes unless it is required by the feature | affects the whole project |

---

## Commit Messages

Default format, unless user/project conventions say otherwise:

```text
<type>: <short imperative summary>

<optional body explaining why>
```

Common types:

```text
feat      new behavior
fix       bug fix
refactor  behavior-preserving code change
test      tests only or test infrastructure
docs      documentation only
chore     tooling, dependencies, maintenance
```

Before choosing a message style, check recent commits and match the repository.

```bash
git log --oneline -10
```

Good message:

```text
fix: validate emails before persisting users

Prevents invalid email formats from reaching the database and keeps API error
semantics consistent with existing auth validation.
```

Weak message:

```text
update user stuff
```

---

## Pre-Commit Hygiene

Before committing, inspect what will be committed.

```text
1. Check status and diff
2. Confirm no unrelated files are staged
3. Confirm no secrets or local env files are included
4. Run right-sized verification
5. Commit with repository-style message
```

Reference skills:

| Concern | Use |
| --- | --- |
| Success claims or test/build claims | `verification-before-completion` |
| CI and automated quality gates | `ci-cd-and-automation` |

---

## Generated Files, Ignores, And Hooks

Generated-file and hook setup should happen when it naturally fits your current task
scope.

Good times to update gitignore/hooks/config:

- bootstrapping a project
- editing project configuration
- adding generated outputs or build tooling
- setting up CI/lint/typecheck/test workflows
- creating project-local `.worktrees/`

Bad time:

- fixing a backend bug in a mature monorepo where ignore/hook changes are
  unrelated to the task

Commit generated files only if the project expects them, such as lockfiles,
migrations, generated clients, or checked-in schemas. Do not commit build output,
local env files, secret material, or editor-local noise unless the project has an
explicit convention.

Create git hooks when the project language/environment supports them and the
task scope includes project setup or quality gates. Keep hooks fast and aligned
with the project's toolchain.

---

## Change Summaries

After meaningful work, provide a summary that helps review and catches scope
drift.

```text
CHANGES MADE
  - src/routes/tasks.ts: added validation to POST /tasks
  - src/lib/task-schema.ts: introduced TaskCreateSchema

VERIFICATION
  - npm run lint: passed
  - npm run typecheck: passed
  - npm test -- tasks: passed

INTENTIONALLY NOT TOUCHED
  - auth routes have similar validation gaps, but are out of scope

CONCERNS / FOLLOW-UPS
  - schema rejects extra fields; confirm this matches API policy
```

---

## Git For Debugging

Git is also a diagnostic tool.

```bash
# See recent changes
git log --oneline -20

# Inspect a range
git diff HEAD~5..HEAD -- src/

# Find when a bug appeared
git bisect start
git bisect bad HEAD
git bisect good <known-good-commit>

# Check line history
git blame path/to/file
```

Use this with `systematic-debugging` when the introducing change is not obvious.

---

## Common Mistakes

| Mistake | Why it hurts | Better move |
| --- | --- | --- |
| Creating manual worktrees when the harness already isolates work | Hidden state and cleanup problems | Prefer native harness tools |
| Creating project-local worktrees without ignore/tool config | Build/lint/search may scan worktrees | Update `.gitignore` and relevant tool configs |
| Treating fresh worktree baseline test failures as new regressions | False positives waste time | Record baseline and compare later |
| Giant uncommitted changes | Hard to review, debug, or revert | Commit meaningful verified increments |
| Mixed behavior/refactor/formatting commits | Diffs become opaque | Split concerns |
| Force-pushing or deleting branches casually | Can destroy shared work | Confirm explicitly first |
| Committing from generic user locations | Creates confusing repo history or no repo at all | Warn and ask for project location |

---

## Handoff

Use related skills depending on where the work goes next:

```text
Need incremental execution discipline -> incremental-implementation
Need independent parallel work         -> when-and-how-to-run-parallel-agents
Need diff/PR readiness review          -> doing-code-review
Need verification before commit/PR     -> verification-before-completion
Need CI hooks or quality gates         -> ci-cd-and-automation
```

This skill sets up sane git discipline and isolation. Use platform git safety
rules, `doing-code-review`, and `verification-before-completion` for final
handoff readiness.
