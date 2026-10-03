# TypeScript Strict Ruleset — Copy-Paste + Adjustment Guide

> **Status:** Staged for review in `myai/docs`. Promote to `coding_rules_ts`
> (mirroring `coding_rules_python`'s `rules/` + `templates/`) after review.
>
> This is the deliverable from the research in
> `../typescript-strict-ruleset-research.md`. Every default here maps to an
> executed experiment (E1–E8); see that document for evidence.

## What this is

An opinionated, "just works" ESLint 9 flat config + strict `tsconfig` set for
modern TypeScript applications, designed to catch the most common bug families
without becoming a rule-disabling exercise. Prettier is assumed present and owns
all formatting.

```text
templates/
├── eslint.config.ts        the ruleset
├── tsconfig.base.json      strict compiler floor
├── tsconfig.json           solution root (references)
├── tsconfig.src.json       app environment
├── tsconfig.node.json      config files + scripts
├── tsconfig.test.json      tests
├── reset.d.ts              ts-reset safety-only subset
├── .prettierrc             formatting
└── package.scripts.json    scripts + local/commit/CI cadence
```

## Adopt it

```bash
# Pin the compiler and ESLint major: typescript-eslint 8 peers TypeScript <6.1
# and the ESLint 9/10 config loading path needs `jiti`.
pnpm add -D eslint@^9 @eslint/js typescript-eslint@^8 typescript@~6.0 jiti \
  eslint-config-prettier prettier eslint-plugin-import \
  eslint-import-resolver-typescript @vitest/eslint-plugin \
  @total-typescript/ts-reset vitest @types/node
# if pnpm blocks a trusted dependency build:
pnpm approve-builds --all

# copy templates into the project root
cp <this-dir>/templates/eslint.config.ts   .
cp <this-dir>/templates/tsconfig*.json     .
cp <this-dir>/templates/reset.d.ts         src/reset.d.ts
cp <this-dir>/templates/.prettierrc        .
cp <this-dir>/templates/.prettierignore    .
# merge package.scripts.json into package.json
# remove the vitest block from eslint.config.ts if not using Vitest
```

Then: `pnpm typecheck && pnpm lint && pnpm format`.

## Composition rules (do not break these)

1. **Spread whole preset arrays.** `...tseslint.configs.strictTypeChecked`, never
   `configs.strictTypeChecked[1].rules`. Index `[1]` is the `eslint-recommended`
   shim; the rules live at `[2]`. Confirmed: correct form enables 137 rules,
   buggy form 47 (91 typed rules silently dead).
2. **`strictTypeChecked` is the base, not `strict`.** It is a superset and covers
   the async/unsafe family. `stylisticTypeChecked` is a separate, trimmed add-on.
3. **`defineConfig` from `eslint/config`.** `tseslint.config` is deprecated and
   trips the config's own `no-deprecated`.
4. **Prettier last.** `eslint-config-prettier` disables all formatting rules.
5. **One owner per concern.** ESLint owns unused code; Prettier owns formatting;
   `tsc` owns the type gate.

## What the base preset misses (why the deltas exist)

`strictTypeChecked` is correctness-first and deliberately omits high-signal
opinionated rules. Our deltas add:

| Delta | Bug family it protects |
| --- | --- |
| `consistent-type-imports` + `no-import-type-side-effects` | Required by `verbatimModuleSyntax`; no preset offers these |
| `switch-exhaustiveness-check` | Union drift / missing cases |
| `strict-boolean-expressions` | Empty-string/0/null treated as false |
| `explicit-function-return-type` | Unstable inferred public surfaces |
| `no-restricted-types` (`object`) | Shapes that say nothing |
| `eqeqeq` | Coercion bugs |
| `no-confusing-void-expression` (tuned) | Void-in-expression noise |
| `no-console` (allow warn/error) | Debug leakage |
| `import/no-unresolved` + `import/order` + resolver | Broken/unsorted imports |

Trimmed out of `stylisticTypeChecked`: `array-type`,
`consistent-type-definitions`, `no-empty-function` (bikeshed / handled elsewhere).

## Adjustment guide

### By project kind

| Situation | Adjust |
| --- | --- |
| **Library / published package** | Keep `explicit-function-return-type` enforced; consider `explicit-module-boundary-types`; add `consistent-type-exports` |
| **Application** | Current defaults are the target |
| **React / Next** | Owned by `setting-up-react-frontends`; add `react-hooks`, tune `no-misused-promises` `checksVoidReturn.attributes:false` and `no-confusing-void-expression` for event handlers |
| **Untyped third-party lib at the edge** | Scope-relax `no-unsafe-*` for the wrapper module only, or write a typed wrapper/stub. Never blanket-disable |
| **Vendored/generated UI code** | Add a `files:` scope block relaxing type+style rules for that directory |
| **CLI entrypoint** | Scope-relax/allow `no-console` in the bin entry |
| **No React, Node-only app** | Drop DOM lib in `tsconfig.src.json`; use `types: ["node"]`, `lib: ["ESNext"]` |

### By rule, when it is too loud

- Prefer **per-rule options** over disabling.
- If still loud, **scope-relax** to a named `files:` block (vendored, boundary).
- Only then a **targeted** `// eslint-disable-next-line <rule> -- reason`.
- Never disable a rule for the whole repo.

Documented options:

| Rule | Lever |
| --- | --- |
| `strict-boolean-expressions` | Already nullable-tolerant. If `if (nonNullString)` is unacceptable, set `allowString/Number: true` (still catches nullable) |
| `explicit-function-return-type` | `allowFunctionsWithoutTypeParameters: false` enforces. Keep `true` only if you want it inert |
| `switch-exhaustiveness-check` | `{ considerDefaultExhaustiveForUnions: true }` |
| `eqeqeq` | `{ null: 'ignore' }` for the `x == null` idiom |
| `no-confusing-void-expression` | `ignoreArrowShorthand: true` (already set) |
| `no-deprecated` | Relax to `warn` or scope out when legacy deps flood it |
| `restrict-template-expressions` | `allowNumber: true` if numbers in templates are desired |

## Test zone

Tests keep the typed async/module core and relax only fixture/mock-hostile rules.
See the `files:` blocks in `eslint.config.ts`. Key facts:

- `unbound-method` is a **non-configurable** false positive under Vitest matchers
  (`expect(obj.method).toHaveBeenCalled()`) → off in tests only.
- Preserved in tests: `no-floating-promises`, `no-misused-promises`,
  `await-thenable`, `consistent-type-imports`, `no-unsafe-call`,
  `no-unsafe-return`.
- `@vitest/eslint-plugin` (not the stale `eslint-plugin-vitest`).
- Do **not** use `vitest/globals` (it leaks `describe`/`it` into app source); use
  explicit `import { describe, it, expect } from 'vitest'`.
- `@ts-expect-error` in type-level tests is allowed (with a description).

## tsconfig strategy

- `tsconfig.base.json`: the strict floor, extended by every env.
- **Single-env project:** one include-all `tsconfig.json`, skip the split.
- **Multi-env project (recommended default):** solution root
  (`{ "files": [], "references": [...] }`) plus plain `noEmit`
  `tsconfig.src/node/test.json`. `projectService: true` discovers them through
  `references`; unreferenced split configs are invisible to it.
- **Never** combine include-all with `references` (TS6305/TS6310).
- Any directory excluded from the lint program must also be ESLint-ignored, and
  vice versa, or `projectService` emits parse errors.
- Include `next-env.d.ts` (if present) in every env project, or `process.env`
  typing diverges.
- Type gate: `tsc -p <each> --noEmit` (per env). `tsc -b --noEmit` conflicts.

## Performance cadence (important)

Typed linting is linear (~0.37 s per 1k LOC) but **not viable as the per-save
linter**: `--cache` only helps a zero-change run; one edited file still pays
~7 s because the TS program is rebuilt. `tsc --watch` is the incremental type
gate.

| Stage | Run | Budget |
| --- | --- | --- |
| Local edit | untyped `eslint --cache` on changed files + `tsc --watch` | < 2 s |
| Pre-commit | typed `eslint` (projectService) on changed files | ~7 s |
| CI | full typed `eslint` + `pnpm typecheck` + tests | seconds/minutes |

The ruleset is the same everywhere; only the invocation changes. Typed lint never
replaces `tsc`; running both per edit is double work.

## ts-reset

Only the safety-only subset (see `reset.d.ts`). The full preset is unsound:
`filter(Boolean)` suppresses real type errors and literal widening removes
genuine `TS2345`s. The subset only turns `any`→`unknown` at `JSON.parse`,
`fetch`, `Promise.catch`, `new Map()`, `Array.isArray`.

Consequence: at a `JSON.parse` boundary, ESLint `no-unsafe-assignment` will **not**
fire (the value is already `unknown`); the `tsc` type error (`TS2322`) or a runtime
validator is what catches misuse. Without ts-reset, `no-unsafe-assignment` would
fire on the `any`.

## Custom project rules (planned)

Two structural rules belong in a small maintained local plugin in
`coding_rules_ts`, not in this portable config:

1. **`no-process-env-in-src`** — raw `process.env` forbidden in application
   source; all access goes through a validated config module. Default allowlist
   `NODE_ENV`. (Proven in both baseline repos.)
2. **Layer-boundary imports** — forbid importing presentation/adapters from the
   domain core; declared per project.

Express one-off bans with `no-restricted-imports` / `no-restricted-types`
instead of writing a rule.

## Known interactions / gotchas

- `verbatimModuleSyntax` + explicit `.ts` imports + `allowImportingTsExtensions`
  are compatible.
- `consistent-type-imports --fix` output is not Prettier-clean → run Prettier
  after `eslint --fix` (`lint:fix` does).
- Unresolved imports cascade into `no-unsafe-argument`; the resolver config is
  required, not optional.
- `no-unnecessary-condition` is **aligned** with `noUncheckedIndexedAccess` (not
  opposed) — keep both.
- `object` → `Partial<Record<string, unknown>>` (keys are optional), not
  `Record<string, unknown>`.
- oxlint `--type-aware` is ~30× faster but is TS7/typescript-go, rejects
  `baseUrl`, and is not a tsc replacement — opt-in supplement only.

## Provenance

All defaults come from executed experiments E1–E8 recorded in
`../typescript-strict-ruleset-research.md`. Raw experiment reports (temporary):
`/tmp/opencode/ruleset/*/REPORT.md`.
