---
name: release-automation-small-repos
description: >-
  Helps bootstrap or reshape small repositories that build artifacts from source
  and publish to GitHub Releases, package registries, extension marketplaces, or
  packaging ecosystems. Use for release workflows, upstream sync automation,
  update PRs, version tags, generated artifacts, and end-to-end release verification.
metadata:
  tags: domain, automation, release
---

# Release Automation Repos

## Overview

Design small repos so the correct release path is the easiest path. The repo should expose a clear data flow from source or upstream input to validated generated files, build artifacts, tags, and published releases. Prefer explicit scripts, reviewable update PRs, reproducible builds, and verification that exercises the real automation rather than assuming it works.

Prefer simple, reviewable automation scripts for sync, generation, build
orchestration, metadata validation, and release helpers unless the target
ecosystem strongly favors another language.

## Recommended Repo Shape

Use names that reveal ownership and data flow.

```text
repo/
|-- src/ or source/               Human-maintained source, or extracted/generated source if this is a mirror
|-- scripts/                      Automation entry points; thin CLI wrappers around reusable logic
|   |-- lib/                      Reusable sync/build/release functions
|   |-- sync-upstream.py          Fetch/verify/update upstream or generated inputs
|   |-- validate.py               Fast repo invariants and metadata checks
|   |-- build.py                  Reproducible artifact build
|   \-- release.py                Create/update release or publish target
|-- tests/                        Unit tests for pure logic; integration tests for real workflows
|-- templates/                    Generated docs/scripts inputs
|-- docs/                         ADRs, diagrams, packaging notes
|-- .github/workflows/
|   |-- 01-verify-build-package-artifact.yml
|   |-- 02-sync-upstream-and-open-update-pr.yml
|   |-- 03-create-version-tag-after-main-update.yml
|   \-- 04-publish-release-from-version-tag.yml
|-- .mirror/ or data/             Last accepted upstream metadata, hashes, source URLs, generated indexes
|-- README.md                     What this is, install/use, commands, provenance, release links
|-- AGENTS.md                     Operational guide for humans and agents
|-- UPSTREAM.md                   Upstream package/source provenance when relevant
|-- TODO.md                       Deferred work and known gaps
|-- pyproject.toml                For Python projects; strict tooling from day one when maintained
`-- package manifests            package.json, extension manifest, Cargo.toml, flake.nix, etc.
```

Adjust names for ecosystem conventions, but keep the same boundaries: source, generated state, scripts, tests, docs, workflows, and publish artifacts.

## Data Flow

Make the happy path observable and reproducible.

```text
upstream input or local source
        |
        v
fetch / generate / extract
        |
        v
verify bytes, signatures, checksums, schemas, licenses, versions
        |
        v
write source + metadata + docs
        |
        v
tests + validation + build
        |
        v
update PR or directly commit
        |
        v
merge to main/master
        |
        v
create v<version> tag if missing
        |
        v
publish GitHub Release / npm / marketplace / package registry
```

Track enough metadata to answer “what exactly produced this artifact?” Store upstream URL, commit/package URL, version, hash, fetched-at time, tool version, license evidence, and any fork patches. For generated source, store generator config and input identity, not just output files.

## Script Patterns

Keep workflows thin; put behavior in scripts that can run locally and in CI.

Good script commands:

```text
sync:local       fetch upstream or regenerate locally
sync:github      dispatch the GitHub sync workflow
validate         check manifest, metadata, provenance, and repo invariants
build            produce the artifact deterministically
test             run tests that prove logic and workflows
release          publish or update the release for the current version
publish:<target> publish to npm, AMO, PyPI, marketplace, Flatpak, Nix, etc.
```

Python automation defaults:

- Use `uv`, `pyproject.toml`, `typer`, `ruff`, `basedpyright`, and `pytest` for maintained Python projects.
- Use PEP 723 inline metadata if only one or two simple single-file scripts are needed.
- Prefer proper pyproject.toml when multiple distinct scripts exist.
- Validate external JSON/config at the boundary with typed models or explicit schema checks.
- Return structured results from core functions; CLI adapters print concise human output and set exit codes.
- Make destructive or publishing actions explicit and idempotent where possible.

## Testing Guidance

Tests should prove the release path works, not maximize green checkmarks.

- Prefer a few smoke, CLI, integration, or end-to-end tests that exercise real commands, real files, real processes, and real artifact flow.
- Avoid unit-test abuse: tests that mock away fetch/build/package/publish behavior do not prove release automation.
- Unit-test the most important isolated logic only: version parsing, metadata normalization, checksum decisions, manifest transforms, no-op detection, and package filename construction.
- Use temporary directories/explicit environment overrides/docker so tests do not depend on developer machine state or execution order.
- Skip tests for trivial glue, framework wiring, and getters unless they protect a release-critical invariant.

## Workflow Patterns

Use numbered workflow filenames so humans and agents understand order.

### 01 Verify, Build, Package Artifact

Runs on pushes to `main`/`master` and PRs. It should install dependencies, run tests, run validation, build artifacts, run security/audit checks when applicable, and upload artifacts. This is the baseline safety net.

### 02 Sync Upstream And Open Update PR

Usually manual `workflow_dispatch`, optionally scheduled only when the source has a reliable cadence. The workflow should run the sync/generation script, detect whether files changed, skip PR creation on no-op, run tests/build on changes, upload an artifact, then create or update a PR from an automation branch.

Prefer update PRs over direct commits for upstream or generated changes. PRs preserve reviewability and make rollback easier.

### 03 Create Version Tag After Main Update

Runs after pushes to the main branch. It reads the authoritative version from the package manifest, generated metadata, or release config. If `v<version>` already exists, it exits cleanly. If missing, it creates the tag.

Important: tags created with `GITHUB_TOKEN` may not trigger tag-push workflows. If the release workflow must run after an automation-created tag, explicitly dispatch it from this workflow with `actions: write`, or use an approved GitHub App/PAT with the right event behavior.

### 04 Publish Release From Version Tag

Runs on tag push and `workflow_dispatch`. It checks out the tag/ref, installs dependencies, runs tests or at least release-critical validation, builds the artifact, then creates or updates the target release.

For GitHub Releases, make release scripts idempotent: create if missing, upload with clobber/update if present. For npm/marketplaces, prefer “publish once” semantics with a preflight that fails clearly when the version already exists.

## Sync And Generation Modes

Choose the least surprising mode that preserves provenance.

```text
manual sync only       Best when upstream changes are rare or review matters most.
scheduled sync         OK when upstream cadence is frequent and false positives are cheap.
repository_dispatch    Useful when an external watcher or package registry event exists.
local generation       Best when source is derived from checked-in schemas/configs.
hybrid generation      Use when upstream input plus local patches produce final source.
```

No-op detection should compare stable identity, not timestamps alone: version, source URL, commit SHA, package hash, generator config hash, lockfile hash, or input digest. A no-op sync should not rewrite generated files.

When applying fork patches, keep the patch layer explicit. Either patch in a script after extraction/generation, keep small patch files, or document deliberate manual fork edits. Avoid silently mixing upstream source with local modifications.

## Documentation Pattern

The README should be high level and explain what the repo publishes, whether it is official or unofficial, how to install/use it, and how releases are produced.

Prefer rich markdown structure that makes the operational model obvious: short sections, tables, ASCII diagrams, command blocks, checklists, and callout-style paragraphs where each format clarifies a different kind of information. Do not abuse only one or two shapes such as deeply nested lists or giant tables. Rich structure should make knowledge simpler and more apparent, not inflate the document with unnecessary lines.

`AGENTS.md` should include most important technical info:

- Project map.
- Commands and expected outputs.
- Source ownership model.
- Sync flow diagram.
- Release flow diagram.
- Safe change checklist.
- Known gotchas such as token event suppression, generated README/source, marketplace credential requirements, and PR CI limitations.

Use `UPSTREAM.md`, `.mirror/`, `data/`, or similar provenance files for forks, republishers, package mirrors, and generated repos. Future agents need exact upstream identity, hashes, licenses, and local patch intent.

## Bootstrap Process

When creating a new repo or reshaping an existing one:

1. Identify the artifact and publication target: GitHub Release, npm, PyPI, browser marketplace, Flatpak, Nix, container registry, or other.
2. Identify the source of truth for version and provenance.
3. Map the data flow from source/upstream input to final artifact.
4. Create scripts first, then wire workflows to scripts.
5. Add validation before release automation: metadata consistency, manifest version, hashes, license evidence, expected files, and build reproducibility where practical.
6. Add tests for pure logic and integration checks for the important path.
7. Add workflows in numbered order.
8. Add README and AGENTS.md with commands, flow diagrams, and gotchas.
9. Run local verification before first push.
10. Run remote verification and inspect logs, artifacts, tags, and releases.

For existing repos, inventory current state first. Do not rewrite everything at once. Add the missing pit-of-success pieces incrementally: scripts, validation, CI, sync PRs, tags, release publication, docs.

## Verification Strategy

Prefer real end-to-end verification over isolated green checks.

Local minimum:

```text
test
validate
build
audit or ecosystem security check when applicable
version/provenance consistency check
git status
```

Remote minimum:

```text
verify workflow success
sync workflow success or explicit no-op
PR diff contains only expected generated/source/provenance files
tag workflow creates or no-ops correctly
release workflow creates/updates expected artifact
release asset name/version/hash match source of truth
no unintended tags, releases, branches, or open PRs remain
```

Capture workflow run IDs immediately after dispatch or push. Inspect the actual run logs rather than a previous green run.

## Artifact Install Verification

For complex packaging logic such as Flatpak, DEB, RPM, Nix, or multi-distro packages, add a separate artifact install verification step. Good pattern: build the package artifact, then run an install test script inside a target-like Docker/container image before publishing.

The install verification should prove the artifact is usable, not merely built:

```text
build artifact
        |
        v
fresh target container
        |
        v
install through the real package manager or ecosystem installer
        |
        v
verify installed files, dependency resolution, runtime linkage, and basic command/plugin behavior
```

For DEB/RPM packages, install through `apt`, `dnf`, or `zypper` rather than raw `dpkg -i` or `rpm -i` so dependency resolution is tested. For Flatpak, install the built bundle or repo output in an isolated environment and run the cheapest meaningful smoke command. Keep this as a reusable script or callable workflow so every distro/architecture target can run the same validation pattern before release upload.

Brief DEB/RPM example:

```text
build-package.yml
  matrix/callable inputs: distro, docker_image, package_manager, cpack_generator, arch
  run inside target container: ubuntu:25.04, debian:trixie, fedora:42, opensuse/tumbleweed
  build with CMake + CPack
  upload artifact: myplugin-<distro>-<arch>.deb or .rpm

validate-package.yml
  run inside the same target container family
  download package artifact
  apt install ./dist/myplugin-ubuntu-amd64.deb
  dnf install -y ./dist/myplugin-fedora-amd64.rpm
  zypper --non-interactive --no-gpg-checks install ./dist/myplugin-opensuse-amd64.rpm
  verify key installed plugin/binary files exist in expected system paths
  check commands like -v or --help
  run ldd or ecosystem equivalent and fail on "not found"

release.yml
  build each distro/arch in parallel
  validate each artifact before release
  publish only after all validate jobs pass
```

The important shape is separate build and validate jobs: build proves the archive can be produced; validate proves a fresh target system can install it, resolve dependencies, find installed files, and load required shared libraries.

## Rollback And Clean Release Verification

Preferred pattern: exercise the real main-branch release path with a reversible forward history.

```text
current main at version N
        |
        v
temporarily remove release/tag N if testing clean creation is approved
        |
        v
commit synthetic downgrade or old metadata with [skip ci]
        |
        v
run sync/generation workflow
        |
        v
automation opens update PR restoring N
        |
        v
merge PR to main
        |
        v
tag workflow creates vN
        |
        v
release workflow publishes artifact
```

Use this only with explicit approval if it deletes real tags/releases or temporarily breaks main. Never force-push or reset public history without explicit permission. Restore using forward commits and automation.

Use secondary test branches when main rollback would be dangerous, external consumers watch tags/releases aggressively, marketplace publication is irreversible, or policy forbids synthetic main commits. In that case, verify sync/build/PR behavior on a test branch and test publish scripts with dry-run, staging, sandbox, or manually approved targets.

Always preflight before destructive verification:

- Clean worktree and local branch equals remote.
- No open automation PRs.
- Target release/tag state is known.
- Lower synthetic version tag/release is absent, or deletion is explicitly allowed.
- Credentials and permissions can recreate what will be deleted.
- Stop condition is clear if recreation fails.

## Incremental Fix Loop

When verification fails:

1. Preserve evidence: run ID, logs, PR number, tag/release state, local diff.
2. Classify the failure: script bug, workflow wiring, token permission/event behavior, registry state, credentials, upstream change, or wrong test setup.
3. Fix the smallest layer that owns the failure.
4. Run local checks for that layer.
5. Commit and push a forward fix.
6. Rerun only the necessary workflow segment, unless the release path changed and needs a full rerun.
7. Repeat until the final state is correct or a real external blocker is identified.

Do not “greenwash” by manually creating missing release assets unless the goal is emergency recovery and you document that automation was not verified. Manual recovery may restore users, but it does not prove the pipeline.

## Common Mistakes

- Workflows contain all behavior and scripts cannot be run locally.
- Release workflow assumes an automation-created tag will trigger another workflow.
- No-op sync rewrites generated files because timestamps changed.
- Upstream provenance is incomplete, especially hashes and license evidence.
- Marketplace publish is irreversible but tested directly without sandbox or manual approval.
- PRs from automation tokens are expected to trigger PR CI when the platform suppresses those events.
- Tests mock away the build, fetch, or publish behavior they claim to verify.
- Complex packages are built but never installed in a fresh target environment before release.
- Synthetic downgrade tags/releases are accidentally created during rollback tests.
- Final report claims success without checking release assets, tags, open PRs, and workflow logs.

## Final Checklist

Before calling the repo “shaped” or “verified”:

- Numbered workflows exist and match the intended data flow.
- Scripts can run locally and in CI.
- Source of truth for version is documented and enforced.
- Generated or mirrored metadata records upstream identity and hashes.
- Sync/generation opens reviewable PRs or has a documented reason not to.
- Tag creation and release publication handle existing and missing tags/releases.
- Complex package artifacts have install verification in a fresh target environment.
- Clean release creation was tested, or the reason it was not tested is explicit.
- README and AGENTS.md explain operations for future humans and agents.
- Final local and remote checks have fresh evidence.
