---
name: ci-cd-and-automation
description: Automates CI/CD pipeline setup. Use when setting up or modifying build and deployment pipelines. Use when you need to automate quality gates, configure test runners in CI, or establish deployment strategies.
metadata:
  tags: domain, automation, release, operations
---

# CI/CD and Automation

## Overview

Automate quality gates so that no change reaches production without passing tests, lint, type checking, and build. CI/CD is the enforcement mechanism for every other skill — it catches what humans and agents miss, and it does so consistently on every single change.

For coding-related work, load `engineering-principles` before this skill. CI/CD
is the automation layer that enforces its strict tooling and pit-of-success
defaults.

**Shift Left:** Catch problems as early in the pipeline as possible. A bug caught in linting costs minutes; the same bug caught in production costs hours. Move checks upstream — static analysis before tests, tests before staging, staging before production.

**Faster is Safer:** Smaller batches and more frequent releases reduce risk, not increase it. A deployment with 3 changes is easier to debug than one with 30. Frequent releases build confidence in the release process itself.

## When to Use

- Setting up a new project's CI pipeline
- Adding or modifying automated checks
- Configuring deployment pipelines
- When a change should trigger automated verification
- Debugging CI failures

## The Quality Gate Pipeline

Every change goes through project-appropriate gates before merge. Which gates
apply depends on the project profile, but once declared, **no gate can be
skipped** — if lint fails, fix the lint rule, not the pipeline.

```text
Pull Request Opened
    │
    ▼
┌─────────────────────┐
│   FORMAT CHECK       │  format:check
│   ↓ pass             │
│   LINT CHECK         │  lint
│   ↓ pass             │
│   TYPE CHECK         │  typecheck
│   ↓ pass             │
│   TESTS              │  test
│   ↓ pass             │
│   BUILD              │  build (when the project produces an artifact)
│   ↓ pass             │
│   INTEGRATION / E2E  │  project-specific (may be separate job)
│   ↓ pass             │
│   SECURITY AUDIT     │  package-manager audit or equivalent
└─────────────────────┘
    │
    ▼
  Ready for review
```

**No gate can be skipped.** If lint fails, fix lint — don't disable the rule. If a test fails, fix the code — don't skip the test.

## GitHub Actions Configuration

### Basic CI Pipeline

The exact pipeline depends on the project's selected runtime, package manager,
and script contract. Derive the runtime version from the project's declared
policy, provision the package manager explicitly, use frozen lockfile installs,
and prefer repository-owned package scripts over direct `npx` commands.

Configure caching for the selected package manager's download/store, not
`node_modules` itself, unless the project has deliberately validated that
strategy.

```yaml
# .github/workflows/ci.yml — example for a pnpm project
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Derive Node version from project policy, not a hardcoded major
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'        # or .node-version, package.json#engines
          cache: 'pnpm'                       # cache package manager store, not node_modules

      - name: Install pnpm
        run: npm install -g pnpm              # or use corepack; verify current Corepack availability

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      # Use repository-owned package scripts, not direct npx
      - name: Format check
        run: pnpm format:check               # or: npm run format:check

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm typecheck                  # project script, not npx tsc

      - name: Test
        run: pnpm test

      - name: Build
        run: pnpm build

      - name: Security audit
        run: pnpm audit --audit-level=high   # use the selected manager's audit command
```

For projects using npm, adjust accordingly — `npm ci` for install, `node-version`
for the runtime, `npm` commands, and `cache: npm` for the store.

### With Database Integration Tests

Derive Node version and package manager from the project's declarations, as
shown in the basic pipeline above.

```yaml
  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: testdb
          POSTGRES_USER: ci_user
          POSTGRES_PASSWORD: ${{ secrets.CI_DB_PASSWORD }}
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Run migrations
        run: pnpm db:migrate                 # project-owned script, not npx
        env:
          DATABASE_URL: postgresql://ci_user:${{ secrets.CI_DB_PASSWORD }}@localhost:5432/testdb
      - name: Integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://ci_user:${{ secrets.CI_DB_PASSWORD }}@localhost:5432/testdb
```

> **Note:** Even for CI-only test databases, use GitHub Secrets for credentials rather than hardcoding values. This builds good habits and prevents accidental reuse of test credentials in other contexts.

### E2E Tests

```yaml
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: '.nvmrc'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - name: Install Playwright
        run: pnpm exec playwright install --with-deps chromium   # or pnpm playwright install
      - name: Build
        run: pnpm build
      - name: Run E2E tests
        run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Feeding CI Failures Back to Agents

The power of CI with AI agents is the feedback loop. When CI fails:

```
CI fails
    │
    ▼
Copy the failure output
    │
    ▼
Feed it to the agent:
"The CI pipeline failed with this error:
[paste specific error]
Fix the issue and verify locally before pushing again."
    │
    ▼
Agent fixes → pushes → CI runs again
```

**Key patterns:**

```
Lint failure → Agent runs the project's lint:fix command and commits
Type error  → Agent reads the error location and fixes the type
Test failure → Agent follows `systematic-debugging`
Build error → Agent checks config and dependencies
```

## Deployment Strategies

### Preview Deployments

Every PR gets a preview deployment for manual testing:

```yaml
# Deploy preview on PR (Vercel/Netlify/etc.)
deploy-preview:
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  steps:
    - uses: actions/checkout@v4
    - name: Deploy preview
      run: npx vercel --token=${{ secrets.VERCEL_TOKEN }}
```

### Feature Flags

Feature flags decouple deployment from release. Deploy incomplete or risky features behind flags so you can:

- **Ship code without enabling it.** Merge to main early, enable when ready.
- **Roll back without redeploying.** Disable the flag instead of reverting code.
- **Canary new features.** Enable for 1% of users, then 10%, then 100%.
- **Run A/B tests.** Compare behavior with and without the feature.

```typescript
// Simple feature flag pattern
if (featureFlags.isEnabled('new-checkout-flow', { userId })) {
  return renderNewCheckout();
}
return renderLegacyCheckout();
```

**Flag lifecycle:** Create → Enable for testing → Canary → Full rollout → Remove the flag and dead code. Flags that live forever become technical debt — set a cleanup date when you create them.

### Staged Rollouts

```
PR merged to main
    │
    ▼
  Staging deployment (auto)
    │ Manual verification
    ▼
  Production deployment (manual trigger or auto after staging)
    │
    ▼
  Monitor for errors (15-minute window)
    │
    ├── Errors detected → Rollback
    └── Clean → Done
```

### Rollback Plan

Every deployment should be reversible:

```yaml
# Manual rollback workflow
name: Rollback
on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true

jobs:
  rollback:
    runs-on: ubuntu-latest
    steps:
      - name: Rollback deployment
        run: |
          # Deploy the specified previous version
          npx vercel rollback ${{ inputs.version }}
```

## Environment Management

```
.env.example       → Committed (template for developers)
.env                → NOT committed (local development)
.env.test           → Committed (test environment, no real secrets)
CI secrets          → Stored in GitHub Secrets / vault
Production secrets  → Stored in deployment platform / vault
```

CI should never have production secrets. Use separate secrets for CI testing.

## Automation Beyond CI

### Dependabot / Renovate

```yaml
# .github/dependabot.yml — adjust package-ecosystem to match the project (npm, pnpm, etc.)
version: 2
updates:
  - package-ecosystem: npm        # use 'npm' for both npm and pnpm projects
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
```

### Build Cop Role

Designate someone responsible for keeping CI green. When the build breaks, the Build Cop's job is to fix or revert — not the person whose change caused the break. This prevents broken builds from accumulating while everyone assumes someone else will fix it.

### PR Checks

- **Required reviews:** At least 1 approval before merge
- **Required status checks:** CI must pass before merge
- **Branch protection:** No force-pushes to main
- **Auto-merge:** If all checks pass and approved, merge automatically

## CI Optimization

When the pipeline exceeds 10 minutes, apply these strategies in order of impact:

```
Slow CI pipeline?
├── Cache dependencies
│   └── Cache the package manager's download/store using setup-node or equivalent; avoid caching node_modules directly unless deliberately validated
├── Run jobs in parallel
│   └── Split lint, typecheck, test, build into separate parallel jobs
├── Run full heavy suite only before release
│   └── Run only fast lint/build/tsc/unit tests for commits/PRs and delay full heavy e2e suite for pre-release verification
├── Only run what changed
│   └── Use path filters to skip unrelated jobs (e.g., skip e2e for docs-only PRs)
├── Use matrix builds
│   └── Shard test suites across multiple runners
├── Optimize the test suite
│   └── Remove slow tests from the critical path, run them on a schedule instead
└── Use larger runners
    └── GitHub-hosted larger runners or self-hosted for CPU-heavy builds
```

**Example: caching and parallelism (adapt Node version and package manager to the project)**
```yaml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version-file: '.nvmrc', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm test
```

## Common Rationalizations

| Rationalization | Reality |
|---|---|
| "CI is too slow" | Optimize the pipeline (see CI Optimization below), don't skip it. A 5-minute pipeline prevents hours of debugging. |
| "This change is trivial, skip CI" | Trivial changes break builds. CI is fast for trivial changes anyway. |
| "The test is flaky, just re-run" | Flaky tests mask real bugs and waste everyone's time. Fix the flakiness. |
| "We'll add CI later" | Projects without CI accumulate broken states. Set it up on day one. |
| "Manual testing is enough" | Manual testing doesn't scale and isn't repeatable. Automate what you can. |

## Red Flags

- No CI pipeline in the project
- CI failures ignored or silenced
- Tests disabled in CI to make the pipeline pass
- Production deploys without staging verification
- No rollback mechanism
- Secrets stored in code or CI config files (not secrets manager)
- Long CI times with no optimization effort

## Verification

After setting up or modifying CI:

- [ ] All quality gates are present (lint, types, tests, build, audit)
- [ ] Pipeline runs on every PR and push to main
- [ ] Failures block merge (branch protection configured)
- [ ] CI results feed back into the development loop
- [ ] Secrets are stored in the secrets manager, not in code
- [ ] Deployment has a rollback mechanism
- [ ] Pipeline runs in under 10 minutes for the test suite
