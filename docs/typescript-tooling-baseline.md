# TypeScript Tooling Baseline — Settled

> **Status:** Settled working reference for writing the TypeScript skills.
>
> **Date:** 2026-10-01 · **Owner:** `myai` planning
>
> **Lifespan:** Temporary. Delete this document once all TypeScript skills and the
> plan are finished. It exists only so skill-writing sessions share one proven
> stack.
>
> **Scope:** Only what is verified to work today. No alternatives, no roadmap, no
> open questions. Load this when creating or updating TypeScript skills.

## Decisions

### Runtime
- **Node.js 24 LTS** or **Node.js 26 LTS** are default runtime options for applications and services.
- Bun is **not** a runtime default and **not** a package manager. See "Bun" below.

### Package manager
- **pnpm** is the default, pinned in `package.json` via `packageManager` (use
  **pnpm 12.x**). Commit `pnpm-lock.yaml`.
- In automation use the frozen/immutable install (`pnpm ci` or
  `pnpm install --frozen-lockfile`).
- pnpm blocks dependency build scripts by default. When a trusted dependency needs
  one (for example `esbuild`), allowlist it explicitly (pnpm 11+ key:
  `allowBuilds`). A silent `Ignored build scripts:` line means something was
  skipped.
- Catalogs and strict isolated `node_modules` are used for workspaces.
- **npm** is a fallback only for primitive projects/tasks or when compatibility
  requires it. Do not use it as the default.
- Do not use Bun or yarn as the package manager.

### Compiler
- **TypeScript 6.x** is the project compiler. Pin it explicitly; do not float to a
  newer major.
- Type checking is authoritative and separate from the dev runner.

### tsconfig and imports
Use a bundler-mode base for type checking, a compile config for emit, and
per-target overlays.

`tsconfig.base.json`:
```jsonc
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["ESNext"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "verbatimModuleSyntax": true,
    "allowImportingTsExtensions": true,
    "rewriteRelativeImportExtensions": true,
    "noEmit": true,
    "isolatedModules": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true
  }
}
```

`tsconfig.build.json` (emit for the compile-based runner):
```jsonc
{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "noEmit": false,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src"]
}
```

Per-target overlays set `types`/`lib` explicitly so globals do not leak:
```jsonc
// node
{ "extends": "./tsconfig.base.json", "compilerOptions": { "types": ["node"], "lib": ["ESNext"] } }

// browser
{ "extends": "./tsconfig.base.json", "compilerOptions": { "types": [], "lib": ["ESNext", "DOM", "DOM.Iterable"] } }

// edge / worker
{ "extends": "./tsconfig.base.json", "compilerOptions": { "types": [], "lib": ["ESNext", "WebWorker"] } }
```

**Import rule:** use explicit `.ts` extensions in relative imports
(`import { x } from './x.ts'`). This is the only style accepted by the
compile-based runner, `tsx`, and Node's type stripping together.
`allowImportingTsExtensions` + `rewriteRelativeImportExtensions` make `tsc` rewrite
those specifiers to `.js` on emit.

Strictness flags beyond the base are chosen when the ruleset is finalized; do not
invent extras in the setup skill.

### Development and build runner
- **Default: `tsc --watch` + `node --watch dist/...`** (compile-based). Verified
  fast enough (cold ~0.2 s, rebuild ~0.3 s) and keeps real compiler semantics,
  decorator metadata, and exact source maps.
- Start the compile step first; `node --watch` needs the first emit to exist.
- Source maps: run with `--enable-source-maps`; graceful shutdown via SIGINT works.
- **Dev does not block on type errors.** Run a separate
  `tsc --noEmit --watch` (and CI) as the type gate. Do **not** combine
  `noEmitOnError: true` with `node --watch` — emission is blocked and the process
  runs stale code.
- **`tsx`** (esbuild, transpile-only, no type checking) is acceptable only for
  plain Node services that do **not** use decorators/metadata. It does not support
  `emitDecoratorMetadata`. Never use it for NestJS or any DI/decorator code.
- **Node native type stripping** is not used for real serious applications. It is
  erasable-only (no enums, runtime namespaces, parameter properties, decorators,
  import aliases), ignores `tsconfig`, has no `paths`, and does not support
  `.tsx`.
- Do not use `ts-node` - stale.

### NestJS
- **Nest 12** (ESM-only) with TypeScript 6 and pnpm.
- Dev runner: **`nest start --watch`** (tsc builder). It compiles to `outDir`,
  restarts `node --enable-source-maps`, blocks restart on type errors, emits
  correct DI metadata, and runs shutdown hooks on SIGINT.
- Never use `tsx` for Nest (silent DI failure: green boot, runtime 500).
- Tests: Vitest (see below). OpenAPI via `@nestjs/swagger`.

### Lint and format
- **ESLint 9+** with flat config and **typescript-eslint** (typed linting via
  `projectService`), plus **Prettier** for formatting.
- Verification commands are non-mutating; fixes and format-on-write are explicit.
- The full ruleset is defined in a later phase, not here.

### Testing
- **Vitest 5** is the default test runner (`vitest run` for verification,
  `vitest` for watch). It works with ESM, explicit `.ts` imports, and — verified —
  with NestJS decorators/DI (it emits decorator metadata correctly).
- No Jest. Legacy/CJS compatibility is out of scope for this skill set.

### Bun
- Allowed for exactly two things:
  1. **Standalone CLI binaries** via `bun build --compile` (cross-target
     supported; assets via `with { type: "file" }`). Binaries are large
     (~90 MB), cold start is very fast.
  2. **Single-file scripts** run with `bun run script.ts`.
- For scripts that must be reproducible for exact dependency version, declare dependencies and pin them; do
  not rely on Bun's silent auto-install (no lockfile, unpinned).
- Bun is not used as a runtime for services or as the project package manager by default.

## Evidence snapshot
Measured on Node 24.15.0, pnpm 12.8.1, TypeScript 6.0.3, tsx 4.23.15,
Vitest 5.0.3, ESLint 9.39.5, typescript-eslint 8.71.0, Prettier 3.9.9, Nest 12.1.2,
bun 1.3.14.

| Check | Result |
| --- | --- |
| pnpm vs npm fresh install | pnpm ~6.4 s, npm ~14.8 s; pnpm detects phantom deps, catalogs work |
| pnpm CI install | `pnpm ci` / `--frozen-lockfile` detects drift (pnpm ci requires ≥12) |
| `tsc --watch` + `node --watch` | cold ~200 ms, rebuild ~302 ms, RSS ~196 MB, exact source maps, SIGINT clean |
| `tsx watch` | cold ~140 ms, RSS ~137 MB; starts even with type errors; no decorator metadata |
| explicit `.ts` imports | accepted by tsc, tsx, and Node strip; `tsc` rewrites to `.js` on emit |
| Nest `nest start --watch` | blocks restart on type error, DI + OpenAPI + shutdown hook correct |
| tsx on Nest | DI silently broken (runtime 500) |
| Vitest 5 | run ~143 ms; watch rerun ~19 ms; Nest e2e passes, ~2× faster than Jest-ESM |
| Prettier | 80 files ~0.67 s |
| `bun build --compile` | ~90 MB binary, cold start 10–20 ms, cross-target OK |

## Operational gotchas (current)
- pnpm's `Ignored build scripts` warning means a postinstall was skipped; add the
  package to `allowBuilds` when it is trusted.
- `rewriteRelativeImportExtensions` is required for emitted `.ts` specifiers.
- `tsx` + decorators = silent runtime failure; never use it for Nest/DI.
- Node native strip: enums/decorators/namespaces/parameter properties are hard
  errors; not for applications.
- Keep the type gate (`tsc --noEmit`) separate from the dev runner so dev stays
  fast without losing correctness.

## Deferred to later phases
- ESLint/TypeScript strictness ruleset contents.
- Git hooks, test infrastructure patterns, templates.
- Publishable-library configuration.
