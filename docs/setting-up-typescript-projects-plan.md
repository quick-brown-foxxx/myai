# Plan: `setting-up-typescript-projects`

> **Status:** Proposed skill design; blocked on execution-model and strict-ruleset research
>
> **Target repository:** `coding_rules_ts`
>
> **Planned artifact:** `skills/setting-up-typescript-projects/SKILL.md`

## Research Modern Execution Models, Bundlers, and Runners Before Proceeding

The current Node, `tsc`, and `tsx` recommendations were introduced by an AI
agent and are **not approved defaults**. Before drafting the skill, research
modern execution models and toolchains, including bundlers, direct execution,
Node versus Bun, package managers, framework-managed execution, and strict
runners. Validate promising combinations in disposable projects.

## Research and Prepare a Recommended ESLint and `tsconfig` Strict Ruleset

Prepare a complete recommended ESLint and `tsconfig` strict ruleset. Exercise it
in representative test projects and resolve noisy, conflicting, redundant, or
impractical rules before accepting it.

Do not preserve an existing recommendation merely because it already appears in
this plan. Research may replace the candidate recommendations and tools below.

## Final Skill Writing Rule

The final skill must be compact and contain only guidance that is distinctive,
valuable, and not safely inferable by a capable agent. Do not explain routine
tool behavior or obvious project hygiene.

For example, omit reminders to run built projects from their build output or to
ignore generated output. Preserve rules that express a deliberate local
preference, such as: **if a project can conveniently run from source without a
separate bundle step, prefer that approach—for example, for a CLI.**

Compact this plan again while drafting the skill; candidate research detail and
obvious setup mechanics must not leak into the final artifact.

## Purpose

`setting-up-typescript-projects` will be a compact TypeScript
extension to the canonical project-setup workflow:

```text
engineering-principles
  -> setting-up-projects
    -> setting-up-typescript-projects
      |-> setting-up-react-projects
      |-> setting-up-typescript-backends
      |-> writing-typescript-code
      `-> testing-typescript
```

The skill will convert generic project-setup guidance into a strict,
reproducible, runtime-aware TypeScript application baseline. It will
contain ecosystem-specific decisions and routing rather than repeating generic
setup philosophy.

It applies to creating new projects and working with existing modern projects.
Pure JavaScript, JavaScript-to-TypeScript migration, legacy interoperability,
legacy module systems, and modernization of old projects are outside its scope.
The skill must not create or recommend a pure-JavaScript project without
explicit user approval or instruction; even with that approval, the setup itself
must be routed outside this skill.

The borrowed Next.js skill and the `4cells_frontend` project are inspiration and
evidence sources only. They are not templates for the new skill.

## Design Principles

- Prefer one concise, self-contained `SKILL.md`.
- State only non-obvious, high-value rules unique to this ruleset.
- Give decision rules and a small number of verified approaches rather than one
  universal configuration.
- Use one clearly assigned tool per responsibility.
- Model the real runtime, module resolver, and deployment artifact.
- Make checks independently runnable, non-mutating, and suitable for automation.
- Preserve reproducibility without embedding package versions as durable policy.
- Require runtime validation when an external boundary exists without mandating
  one schema library for every project type.
- Prove every recommendation through executable temporary fixtures.
- Route framework, architecture, implementation, and detailed testing concerns
  to their owning skills.

## Ownership

### The skill will own

| Area | Responsibility |
| --- | --- |
| Project intake | Runtime, deployment target, execution model, modern module constraints, and repository shape |
| Package management | One manager, one lockfile, local tools, reproducible provisioning, and project-level pinning |
| Runtime and modules | Modern runtime or bundler resolution, and emitted versus direct execution |
| TypeScript configuration | Strict, target-aware compiler configuration and complete file coverage |
| Tool roles | Type checker, linter, formatter, development runner, build path, and test-runner baseline |
| Git hooks | A small, fast local-feedback setup whose commands also run independently and in automation |
| Package scripts | Stable commands for development, checking, testing, building, and starting |
| Manifest and artifacts | Module metadata, dependency classification, compatibility metadata, and source/output boundaries |
| External configuration | Centralized validation and fail-fast behavior when external configuration exists |
| Workspace routing | Brief criteria for remaining single-package or adopting workspaces |
| Bootstrap proof | Install, analysis, test, build, runtime, and failure-path evidence appropriate to each recommended approach |

### The skill will route elsewhere

| Concern | Owner |
| --- | --- |
| Generic project shape and setup philosophy | `engineering-principles`, `setting-up-projects` |
| Detailed TypeScript coding patterns | `writing-typescript-code` |
| React, Next.js, React Router, and JSX setup | `setting-up-react-projects` |
| NestJS, Hono, persistence, authentication, jobs, and service layout | `setting-up-typescript-backends` and canonical backend skills |
| Test strategy and detailed test infrastructure | `testing-typescript` and canonical testing skills |
| Browser and component testing | `testing-frontends` |
| Architecture and layer placement | Canonical and TS-specific architecture skills |
| CI workflow implementation | `ci-cd-and-automation` |
| OpenAPI and shared DTO architecture | Backend/API contract guidance |
| Single-file scripts | `writing-scripts` |
| Pure JavaScript setup | Outside this skill; do not proceed without explicit user approval, then route elsewhere |
| JavaScript-to-TypeScript migration | Outside this skill |
| Legacy projects, CommonJS compatibility, and modernization | Outside this skill |
| Publishable package and library configuration | Outside the current roadmap |
| Templates and shared configuration packages | Deferred until repeated evidence justifies them |

## Planned Topic Map

### 1. Scope and invocation

The skill should state that it:

- loads after `engineering-principles` and `setting-up-projects`;
- applies when creating a TypeScript project or configuring an existing modern
  TypeScript project;
- selects setup based on project constraints;
- does not replace React, backend, architecture, coding, or testing skills.

The eventual description should trigger on language such as:

- create, initialize, bootstrap, or configure a TypeScript project;
- configure `package.json`, `tsconfig.json`, ESLint, formatting, modules, or
  project scripts;
- choose a TypeScript runtime, build path, or package manager for a project.

### 2. Project intake decision tree

Before selecting tools or configuration, determine:

1. **Execution target**
   - Node-compatible runtime.
   - Browser or bundler-managed source.
   - Edge or worker runtime.
   - Multiple environments with distinct global APIs.

2. **Execution and artifact model**
   - Emit JavaScript before execution.
   - Execute TypeScript directly.
   - Let a framework or bundler transform source.
   - Produce no runtime artifact.

3. **Modern module constraints**
   - Runtime-native modules.
   - Bundler or framework-managed modules.

4. **Repository shape**
   - Single package.
   - Workspace justified by independently built, deployed, or reused units.

### 3. Reproducible package management

The skill should require these invariants:

- Select one package manager and commit only its lockfile.
- Install tools locally rather than depending on ambient global installations.
- Record the selected package-manager release in the project.
- Declare a supported runtime policy.
- Use frozen or immutable lockfile installs in automation.
- Keep local and automation package-manager majors aligned.
- Do not assume that Corepack is bundled with the selected Node release.
- Avoid accidental, unpinned package downloads through automation commands.

The exact pnpm-versus-npm default remains a research and prototype decision.
Bun and Deno should be treated as runtimes with their own current
conventions, not merely as interchangeable Node package managers.

### 4. Runtime, module, and execution setup

The skill should teach alignment among:

```text
package.json module type
  <-> source import specifiers
  <-> TypeScript module settings
  <-> module resolution
  <-> actual executor
  <-> emitted or bundled artifact
```

Candidate setups to validate follow.

#### Node ESM with emitted JavaScript

```text
TypeScript source -> tsc -> JavaScript output -> Node
```

This is a candidate primary application approach when bundling is unnecessary.
It must prove clean output, correct Node imports, source maps where selected,
and production startup from the emitted artifact.

#### Direct TypeScript execution

Potential variants are:

- native Node type stripping for erasable TypeScript only;
- `tsx` when broader development execution support is required.

The skill must make clear that neither runtime type stripping nor transpilation
performs authoritative type checking. Unsupported syntax, import semantics,
`tsconfig` limitations, JSX, aliases, and downlevel requirements must be part of
the selection decision.

#### Bundler or framework-managed source

```text
tsc --noEmit for checking
  + bundler or framework for transformation
```

Only generic alignment rules belong here. React and backend framework selection
remain in their dedicated setup skills.

Every recommendation included in the final skill must have corresponding
executable evidence. Unverified possibilities should remain routing notes rather
than recommended configurations.

### 5. Strict TypeScript compiler baseline

Candidate strictness settings to validate include:

- `strict`;
- `noUncheckedIndexedAccess`;
- `exactOptionalPropertyTypes`;
- `noImplicitOverride`;
- `noFallthroughCasesInSwitch`;
- `noUncheckedSideEffectImports`;
- `verbatimModuleSyntax`.

Situation-dependent decisions include:

- `target` and `lib` from the actual runtime;
- ambient `types` and separation of Node, DOM, test, and worker globals;
- `module` and `moduleResolution`;
- emit versus `noEmit`;
- source maps;
- `rootDir` and `outDir` or equivalent source/output boundaries;
- `isolatedModules`;
- `noImplicitReturns`;
- declaration output where an application genuinely needs it;
- `skipLibCheck` as a measured compatibility or performance choice.

The skill should also require:

- every TypeScript source, test, script, and configuration file to be covered by
  an appropriate type-checking configuration;
- separate configurations when environments have incompatible globals or emit
  requirements;
- one owner for unused-code diagnostics rather than duplicate compiler and
  linter enforcement;
- runtime support for any path alias or import mapping;
- no use of `skipLibCheck` merely to hide unexplained failures.

### 6. One tool per responsibility

The final recommendations should be selected after prototype evidence.

| Job | Candidate direction |
| --- | --- |
| Type checking | Local `tsc` |
| Linting | ESLint flat configuration with typescript-eslint |
| Formatting | Prettier candidate; alternatives only as deliberate replacements |
| Development execution | Node, \`tsx\`, or framework runner according to the project type |
| Build or transformation | `tsc`, framework, or bundler according to the required artifact |
| Testing baseline | Vitest by default; `node:test` only for very small, zero-dependency, or throwaway projects |
| Task orchestration | Package scripts initially |

Research must determine:

- whether typed linting is universal or situational;
- whether `recommendedTypeChecked` or `strictTypeChecked` is the practical
  baseline;
- whether Prettier or a lean alternative best fits each supported setup;
- how small a project must be for `node:test` to remain appropriate; any project
  expected to grow or need meaningful test infrastructure should use Vitest;
- whether the project needs an additional runner at all.

Biome or another integrated tool should be considered only as a replacement
toolchain alternative, not added alongside overlapping ESLint and formatter roles.

### 7. Git hooks

Research and define a recommended Git-hook setup rather than inheriting one by
habit. Hooks should provide fast local feedback, invoke the same independently
runnable checks used elsewhere, and never replace authoritative automation.
Evaluate current hook managers and staged-file tooling as part of the prototype
work; keep only rules that add meaningful value to the final skill.

### 8. Stable package-script contract

Use predictable names for the checks the project actually needs. The
governing non-obvious rules are:

- verification commands are non-mutating;
- fix and watch behavior is explicit in the command name;
- automation never uses watch mode;
- `check` may aggregate commands, but each responsibility remains runnable by
  itself;
- hooks and automation call the same independently runnable checks.

### 9. Manifest and artifact contract

Cover only manifest or artifact choices that need an explicit local rule and are
not already implied by the selected toolchain.

It should not expand into package publishing, dual ESM/CommonJS publication,
declaration bundling, export maps for consumers, or compatibility matrices.

### 10. Runtime configuration boundaries

When external configuration exists, validate it once at the boundary and expose
typed configuration to the application. Do not add a configuration subsystem
when no such boundary exists or mandate a schema library before research settles
the choice.

### 11. TypeScript-specific project-shape deltas

Generic project shape belongs to `setting-up-projects`. Mention only TS-specific
deltas: complete analysis coverage and separate configurations where runtime,
test, or tooling environments genuinely differ.

### 12. Brief workspace routing

The default should remain a single package. A workspace becomes appropriate
when there are real boundaries such as:

- independently deployed applications;
- reusable internal contract packages;
- independently built tools;
- distinct runtime environments requiring separate manifests.

Do not introduce Turborepo, Nx, or another graph runner until graph scheduling,
caching, or orchestration is demonstrably needed. Detailed monorepo architecture
and package publishing remain outside this skill.

## Explicit Exclusions

The final skill should not contain:

- a universal directory tree;
- Next.js App Router or React component conventions;
- React providers, hooks, state packages, JSX rules, Tailwind, or shadcn/ui;
- NestJS/Hono service architecture, authentication, persistence, migrations, or
  background jobs;
- MSW;
- detailed Playwright, Mockoon, or HTTP test-server setup;
- universal Zod prescriptions;
- detailed Result, error-handling, naming, or narrowing patterns;
- OpenAPI or shared DTO architecture;
- detailed monorepo architecture;
- publishable-library configuration;
- Docker or deployment recipes;
- fixed package versions as durable skill policy;
- exhaustive package recommendation lists;
- committed project templates or shared configuration packages;
- project-specific dependency compatibility escapes;
- pure-JavaScript setup or checked-JavaScript alternatives;
- JavaScript-to-TypeScript migration;
- legacy projects, CommonJS compatibility, old-project modernization, or other
  legacy interoperability;
- obvious tool behavior and routine hygiene that a capable agent can infer.

## Use of Inspiration Sources

### Borrowed `setting-up-nextjs-projects`

Retain as candidate principles:

- strict compiler and linting intent;
- external configuration validation;
- clear quality commands;
- executable bootstrap checks;
- synchronization of scaffold documentation with the real project.

Do not carry over:

- its Next.js structure and conventions;
- fixed package or framework versions;
- MSW;
- universal Zod;
- template-specific integrations;
- its configuration-encyclopedia structure;
- commands where linting also rewrites and formats the project.

### `4cells_frontend`

Retain as candidate principles:

- one package manager and committed lockfile;
- explicit runtime and package-manager policy;
- strict TypeScript and typed linting;
- distinct test responsibilities;
- validated public/private configuration;
- hooks as fast feedback while automation remains authoritative;
- executable agreement among scripts and documentation.

Do not universalize:

- Next.js, Turbopack, Tailwind, Sentry, generators, or microfrontends;
- compatibility workarounds;
- its exact `tsconfig.json`;
- exclusions that leave tests or configuration files unanalyzed;
- custom browser, Docker, or deployment choices;
- its current mutating aggregate lint command.

## Research and Prototype Work

Before drafting guidance, use current official documentation and
executable prototypes to evaluate:

| Decision | Required evidence |
| --- | --- |
| pnpm versus npm | Fresh install, manager pinning, frozen automation install, and current Corepack behavior |
| Native Node TypeScript versus `tsx` | Imports, watch mode, unsupported syntax, and `tsconfig` limitations |
| `tsc` emit versus direct execution | Runtime semantics, production startup, artifact cleanliness, and source maps |
| ESM compiler settings | Package type, import extensions, Node resolution, and emitted output |
| ESLint typed configuration | Setup cost and useful signal across supported TypeScript scenarios |
| ESLint strictness preset | Useful enforcement versus noise in representative code |
| Prettier versus alternatives | Responsibility overlap, ecosystem support, and reproducibility |
| Vitest versus \`node:test\` | Minimal Node and general application use cases |
| Git hooks | Current hook managers, staged-file behavior, speed, portability, and agreement with independently runnable checks |
| `skipLibCheck` | Performance benefit versus hidden declaration failures |
| Runtime schema tools | Enough evidence to keep setup compatible while leaving detailed selection to the right skill |

Record each outcome as one of:

```text
accepted default
situational alternative
compatibility fallback
deferred to another skill
rejected
```

## Executable Evidence Plan

Select the exact supported approaches before drafting. Every recommendation in
the final skill must map to executable evidence.

Likely temporary fixtures are:

| Fixture | Purpose |
| --- | --- |
| Node ESM application emitting JavaScript | Prove module alignment, clean build output, and production startup |
| Direct-TypeScript Node application | Prove native stripping or `tsx` limitations and independent type checking |
| Bundler-managed fixture, if guidance remains | Prove `noEmit` and bundler-resolution behavior |

Run each fixture's install, formatting, linting, type checking, tests, build, and
runtime smoke checks as applicable. Include real module imports and relevant
failure paths; do not add artificial subsystems merely to create more evidence.

API contract or executable HTTP test-server evidence is not automatically
applicable to this foundation skill. If a minimal HTTP boundary is used, it
should verify runtime setup without introducing backend architecture. Detailed
contract-powered testing remains in later backend and testing skills.

Temporary fixtures are evidence artifacts, not project templates. They should
not become canonical repository structure unless repeated use later justifies a
separate decision.

## Skill Verification Plan

### Structure and coherence

Validate the skill and its catalog entry, then check that it routes generic
theory and sibling concerns instead of copying them.

### Positive discovery prompts

Examples that should trigger the skill:

- “Set up a new TypeScript Node project.”
- “Configure TypeScript, ESLint, formatting, and build scripts.”
- “Choose ESM and compiler settings for a new Node application.”
- “Create the baseline tooling for a TypeScript workspace.”

### Negative and routing prompts

Examples that should route elsewhere:

- “Create a Next.js application.”
- “Set up a NestJS API.”
- “Fix the types in this function.”
- “Design our frontend testing strategy.”
- “Write a one-file TypeScript migration script.”
- “Publish a dual ESM/CommonJS npm library.”
- “Migrate this JavaScript project to TypeScript.”
- “Modernize this legacy CommonJS application.”

### Fresh-context review

A reviewer without authoring context should check:

- whether the decision model is understandable and actionable;
- whether any recommendation is presented as universal without evidence;
- whether every recommendation was actually exercised;
- whether JavaScript, migration, or legacy guidance has leaked into the skill;
- whether parent guidance is duplicated;
- whether sibling-skill responsibilities have leaked into this skill;
- whether the skill is concise enough to load and apply reliably.

## Planned Production Sequence

After this design is approved and its prerequisites are complete:

```text
1. Research modern execution models, runtimes, bundlers, runners, and package managers
2. Prepare and test the complete strict ESLint and TypeScript ruleset
3. Select the initial recommendations
4. Build disposable executable fixtures
5. Record accepted, situational, deferred, and rejected outcomes
6. Draft one compact SKILL.md containing only non-obvious local rules
7. Validate structure and catalog integration
8. Run positive and negative discovery tests
9. Run fresh-context coherence and usability review
10. Re-run representative bootstrap evidence
11. Revise until material findings are resolved
12. Record completion evidence and roadmap status
```

## Expected Final Artifact

The eventual canonical artifact will be:

```text
/home/lord/Projects/coding_rules_ts/
`-- skills/
    `-- setting-up-typescript-projects/
        `-- SKILL.md
```

Expected characteristics:

- one self-contained file;
- trigger-oriented frontmatter;
- explicit parent-skill routing;
- concise decision rules rather than copied configuration files;
- no more than two or three primary approaches plus compact compatibility notes;
- no supporting files unless executable evidence demonstrates a clear need;
- no committed project template.

This boundary keeps the skill useful as the foundation for later React,
backend, architecture, coding, and testing skills without absorbing their
responsibilities.
