# TypeScript Tooling — Re-evaluation Notes (return later)

> **Status:** Not policy. A parking lot for findings that were investigated but are
> deliberately **not** used in the current skills.
>
> **Date:** 2026-10-01 · **Owner:** `myai` planning
>
> **When to return:** in a few months, to re-check whether the ecosystem has caught
> up and whether a migration is worth a dedicated step.
>
> **Do not load this while writing skills.** It exists so the findings are not
> lost, and so a future evaluation starts from evidence instead of memory.

The current settled stack is in `typescript-tooling-baseline.md`. This document is
everything we consciously set aside.

## 1. TypeScript 7 (native Go compiler)

**What it is.** The native port is complete. As of 2026-10-01 the npm `typescript`
package's `latest` tag is **7.0.2**, and its `tsc` is the Go-native compiler. The
`microsoft/typescript-go` staging repo was archived on 2026-09-01 and merged into
`microsoft/TypeScript`. The command is `tsc` (the old `tsgo` / preview package
names are for older builds). `@typescript/native-preview` still exists but is stale
(`7.0.0-dev.20260707.2`).

**Verified benefits.**
- Emit and diagnostics are **byte-identical** to TypeScript 6 on tested projects
  (JS and `.d.ts`, `diff` clean).
- Incremental no-change check ~0.08 s vs ~0.45 s (TS6 JS) on the small fixture;
  ~0.34 s vs ~0.90 s on an 80-file set.
- Watch, build mode, references, incremental, `--init`, `--showConfig` all work.

**Verified breakages (why it is not the default).**
- The classic programmatic API is gone: `require("typescript")` resolves to
  `lib/version.cjs` and has **no `createProgram`**; only a new `unstable/*` API
  remains. `tsserver` is absent.
- **`typescript-eslint` refuses to run on TS7**: it throws
  `Error: typescript-eslint does not support TS 7.0.` at import time (peer range
  capped below 6.1.0, with a hard `versionMajor >= 7` check). Tracking issue
  #10940. This breaks typed linting on the TS7 path entirely.
- `ts-node`, `ts-jest`, and `@swc-node/register` crash on a TS7 project.
- `moduleResolution: node10` and `baseUrl` were **removed**; existing tsconfigs can
  break silently.
- Type-error exit code changed from **2 to 1** (CI behavior change).
- No `tsserver` in the package, so editor support depends on a recent VS Code
  extension with native-tsdk support.
- NestJS tooling pins `typescript@^6` (Nest 12 schematics use `typescript ^6.0.2`).

**Reproduction snapshot.**
```bash
# TS7 vs TS6
npm i -D typescript@7   # or @6
./node_modules/.bin/tsc --version
./node_modules/.bin/tsc --noEmit -p tsconfig.json
node -e "console.log(Object.keys(require('typescript')).includes('createProgram'))"
```

### 1b. Side-by-side TS6 API + native preview (investigated, not adopted)
A working combo was verified: keep `typescript@6` for tools that consume the JS
API, and add `@typescript/native-preview` for the fast native binary. Typed lint
(tools on TS6 API) plus native checks both worked. Rejected for now to avoid two
TypeScript majors and script ambiguity; revisit together with TS7.

## 2. `ttsc` / `ttsx` (TS-Go toolchain)

**What it is.** A `typescript-go` toolchain by the author of typia/nestia.
`ttsc` is a drop-in `tsc` (build/check/transform); `ttsx` executes a file
**after type-checking the whole project** — a type error stops the run, which is
the opposite policy from `tsx`. It is also a compiler-plugin host.

**Verified strengths (core only; plugins/MCP/graph not evaluated).**
- Diagnostics text matches `tsc`; `ttsx` refused a broken project and ran after the
  fix.
- Emit was **byte-identical** to `tsc`, including `.js.map`, across ESM, CJS, and a
  decorator fixture.
- `emitDecoratorMetadata`, parameter properties, and `reflect-metadata` worked; a
  minimal NestJS DI app ran through `ttsx` (`DI result: hello nest`).
- `ttsc --watch` survived 20 edits with an intentional error at edit 8 and
  recovered; RSS plateaued (~86–94 MB) over 30 edits.
- `node --require ttsc/register` and `node --import ttsc/register --test` worked.
- Rebuild latency and memory were comparable to `tsc` (same native compiler).

**Verified weaknesses / red flags.**
- Repo created 2026-04-20; version tested **0.30.4**; `0.x`; ~40 releases in
  ~2.5 months.
- **Bus factor 1** (samchon: 2483 of ~2520 commits).
- Open bug **#1610 `TtscUnstableGenerationError: could not capture a reusable
  transform generation`** reported as breaking a real project's testing on the
  current version.
- Precedent of a native concurrency race (#115 `concurrent map read and map
  write`).
- `ttsc --build` (solution mode) unsupported.
- `paths` aliases type-check but **fail at `ttsx` runtime** and are not rewritten
  on emit (`ttsx` does not honor tsconfig `paths`, unlike `tsx`). Node subpath
  imports (`#lib/*` in `package.json#imports`) do work.
- Unpolished failure output from `ttsc/register` (raw stack traces); exit codes
  differ from `tsc`.
- Heavy AI-agent churn (hundreds of issues/PRs in months) makes triage noisy.

**Verdict:** promising, close to usable, but a single-maintainer `0.x` with an
open instability bug. Revisit alongside the TS7 migration.

## 3. Alternative lint engines (set aside)

- **oxlint + `oxlint-tsgolint`** (oxc): type-aware linting on a typescript-go
  engine. On a TS7 project it caught `no-floating-promises` and
  `no-unsafe-assignment`, and `--type-aware --type-check` emitted real `TS2322`
  diagnostics (experimental). Caveats: `--type-aware` silently degrades without
  `oxlint-tsgolint` installed (CI must pin and assert); `--type-check` is
  explicitly experimental; not a `tsc` replacement.
- **Biome**: fast combined lint+format (~0.35 s on 80 files), but its only
  type-flavoured rule is a nursery `noFloatingPromises`; no `noUnsafeAssignment`;
  no type checker. Not a typed-lint option.

Both are the likely destination if the ecosystem standardizes on TS7.

## 4. Other set-aside findings

- **swc builder for Nest** (`nest start --builder swc --watch`): very fast
  (~2.0 s cold vs ~7.9 s) but performs **zero type checking** and silently serves
  broken code. Usable only paired with a separate `tsc --noEmit --watch`.
- **`@swc-node/register`** crashes on TS7; `swc --watch` requires the optional
  `chokidar` dependency or it dies after the first compile.
- **ts-node**: latest 10.9.2 (published 2023-12); crashes on TS7; conflicts with
  Node 24 native strip; ~7.9 s cold, ~338 MB RSS; no watch. Abandoned direction.
- **Bun auto-install** for scripts is silent, unpinned, and lockfile-less —
  reproducibility hazard; pin dependencies explicitly if a script matters.
- **Bun `--compile`** binaries are ~90 MB (~36 MB gzip); `--minify` saves little.

## 5. Re-evaluation checklist (when you return)

Start from the current state, not from this document's conclusions.

- [ ] Is `typescript-eslint` TS7-compatible (or has oxlint/tsgolint become the
      typed-lint default)? Check the tracking issue #10940 and typescript-eslint
      releases.
- [ ] Is there a `tsserver` / editor story for TS7 (VS Code native tsdk stable)?
- [ ] Does NestJS tooling (Nest CLI, schematics) support TS7?
- [ ] Has `ttsc` reached `1.x`, gained a second maintainer, and closed `#1610`?
      Does it support `-b` and `paths` at runtime?
- [ ] Do Vitest / Prettier / ESLint (or their replacements) run on TS7?
- [ ] Re-run: TS7 vs TS6 emit parity, diagnostics, watch, build mode, incremental.
- [ ] Re-check `moduleResolution: node10` / `baseUrl` fallout in real configs.
- [ ] Re-check exit-code and CI assumptions (2 vs 1).
- [ ] Only then decide whether a dedicated migration step is worth it.

## 6. Snapshot of what was tested

Versions touched during this investigation: Node 24.15.0, TypeScript 7.0.2 and
6.0.3, pnpm 10.21.0 / 12.8.1, npm 11.12.1, bun 1.3.14, tsx 4.23.15,
`@swc/core` 1.16.13, `@swc-node/register` 1.12.1, ts-node 10.9.2, ttsc 0.30.4,
`@nestjs/core` 11.2.7 / 12.1.2, `@nestjs/cli` 11.0.24, Vitest 5.0.3,
ESLint 9.39.5, typescript-eslint 8.71.0, Prettier 3.9.9, Biome 2.5.15,
oxlint 1.86.0, `oxlint-tsgolint` 7.0.2003.

Detailed prototype reports were written under `/tmp/opencode/proto/proto-*/`
(throwaway; assume they are gone). The decisive results are summarized above and
in `typescript-tooling-baseline.md`.
