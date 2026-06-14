# SvelteKit As Default Web Framework

This document records the decision to adopt **SvelteKit** as the default web
framework for future frontend / fullstack projects, and provides a cookbook for
a classic frontend app shape.

It is one layer above `../ENGINEERING-PHILOSOPHY.md`. Philosophy says *what* we
believe. This document says *which framework best embodies it* and *how* we
use it.

It is not a skill. It is a durable decision that future agents should be able
to read, accept, and act on without re-deriving it from first principles.

---

## TL;DR

- **Default web framework:** SvelteKit (Svelte 5 runes) + SvelteKit `load`/`actions` + adapter of choice.
- **Standard library stack:** Superforms 2 + Valibot + Bits UI + shadcn-svelte + TanStack Query + Paraglide JS + `svelte/transition` + `svelte/motion`.
- **Why SvelteKit:** best fit for our `pit of success`, `errors as values`, `thin UI as typed adapter`, and `AI-agent friendly` philosophy. Best library ecosystem maturity among the credible non-React candidates as of mid-2026.
- **When not to use SvelteKit:** real-time high-frequency dashboards, projects that need a JS framework differentiator for marketing reasons, or anything that requires the largest possible component library without us owning the styling.

---

## Why SvelteKit (and what we considered)

### The decision

We picked **SvelteKit** over Solid, Vue, Nuxt, Angular, React Router v7, HTMX, and Phoenix LiveView. The reasoning is below; the goal is so a future agent does not re-derive this.

### What we wanted from a web framework

A web framework that is:

| Axis                           | Requirement                                                                                                            |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Pit of success**             | Structural enforcement of correct patterns, not just documented conventions.                                           |
| **Strong static types**        | Errors caught at compile time, narrowable types, generated route types, no `any` escape hatches.                       |
| **Errors as values**           | A framework story that *allows* Result-style expected failure handling, even if it does not ship a Result primitive.   |
| **Thin UI as typed adapter**   | Reusable domain core; UI as a render layer that consumes typed inputs.                                                 |
| **AI-agent friendly**          | Small mental model, explicit reactivity, official `llms.txt` / `AGENTS.md` / agent skills.                             |
| **Library ecosystem maturity** | Official, battle-tested versions of every boilerplate lib we would otherwise build ourselves.                          |
| **Replaceable boilerplate**    | Routing, data fetching, forms, validation, headless components, i18n, animation all come from dedicated libs we trust. |

We did not require: a specific runtime model (VDOM, signals, compile-time), a specific host language (TS-first is enough), or first-class client-side state machines.

### Candidates considered, in order

| Candidate                   | Verdict                                                                                                                                                                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **SvelteKit**               | **Selected.** Best overall fit.                                                                                                                                                                                                      |
| SolidJS + SolidStart        | Technical best fit on runtime / type story, but thin supporting ecosystem (headless, i18n, shadcn-equivalent, forms).                                                                                                                |
| Vue 3 + Nuxt                | Better than React, but Options/Composition/`<script setup>` "many ways" pattern; `vue-tsc` is opt-in; Vue 3.6 alien-signals rewrite has been on the `minor` branch for 18+ months unreleased; NuxtLabs acquired by Vercel July 2025. |
| Angular 22                  | Genuine renaissance (zoneless default, signals, OnPush default, Agent Skills + MCP), but heaviest runtime (~110-130 KB), largest surface area, signal/observable/promise trinity.                                                    |
| React Router v7             | Stays on React; does not fix hook rules, stale closures, re-render traps.                                                                                                                                                            |
| HTMX + Phoenix LiveView     | Strongest philosophical fit (errors-as-values structurally, no client state) but requires Elixir + gives up SPA UX. Worth reconsidering for server-rendered CRUD-heavy products.                                                     |
| Qwik                        | v2 still in beta, thin practitioner signal. Watch.                                                                                                                                                                                   |
| Hotwire / Rails, Gleam, Elm | Do not match the project profile.                                                                                                                                                                                                    |

### Why SvelteKit, concretely

1. **Svelte 5 runes are the first compile-time reactivity model that is both explicit and AI-friendly.** `$state`, `$derived`, `$effect`, `$props`, `$bindable` are real TypeScript keywords via the compiler. No manual dep arrays, no stale closures, no re-render traps. The mental model is small enough for an LLM to model correctly.
2. **SvelteKit `load` + generated `./$types` is the pit-of-success data story.** File convention enforces a structure, route types are generated, server load runs on the server, errors are caught at the boundary.
3. **Best library ecosystem in the non-React JS world for our philosophy.** Official, mature, battle-tested versions of every boilerplate lib we would otherwise build:
   - `sveltekit-superforms 2` for forms (167k weekly downloads, Valibot adapter, discriminated-union `valid: boolean`).
   - `Bits UI 2.18` + `shadcn-svelte` (8,848 stars, official port) for headless + shadcn-style.
   - `@inlang/paraglide-js 2.19` (official SvelteKit i18n, compiler-based, type-safe).
   - `svelte/transition` + `svelte/motion` for animation (built-in, compiler-optimized).
   - `Valibot 1.4` for validation (1.37 kB, 90% smaller than Zod, narrow inference).
   - `@tanstack/svelte-query 6.1` for client-side server state.
4. **SvelteKit is the most AI-invested non-React framework.** Official `llms.txt` / `llms-medium.txt` / `llms-small.txt` for LLM consumption, `AGENTS.md` in the repo, Apple uses Svelte at scale (apps.apple.com, Apple Music).
5. **LSP scaling complaint substantially addressed.** The widely-cited "1-minute init on a 3,768-component project" was from the JS-TS-Checker era. `svelte-language-server 0.17.29` (Feb 2026) added `tsgo` (TypeScript-Go) backend, which is 5-10× faster on large codebases. We have no 2025-2026 replication of the original complaint with `tsgo` enabled.
6. **Built-in transitions, form actions, and progressive enhancement** mean we can write thin components that *just render state* without owning client-side state machines for every interaction.

### What we accepted as trade-offs

- **Solid has a smaller runtime (~7 KB) and arguably cleaner fine-grained reactivity.** Svelte 5's compile-time approach is slightly more "magic" — the compiler does the reactivity. In practice, both are small and explicit; this is not a deciding axis for us.
- **Angular has a stronger default type story (StrictTemplates default, exhaustive `@switch`).** Svelte 5's type story is excellent but not as aggressive. The trade is "less type enforcement, simpler mental model" — we accept it.
- **HTMX + Phoenix LiveView is structurally more pit-of-success for server-friendly UIs** (CRUD, forms, dashboards) because there is no client-side state to mismanage. We picked SvelteKit because most of our future projects will want at least *some* client-side richness (animations, optimistic UI, drag-and-drop) and we do not want to learn Elixir for the 50% case.

---

## Philosophy Fit (concrete mapping)

How SvelteKit maps onto our engineering principles. The right side of each row is the *default*; deviation needs a concrete reason.

| Principle                                  | SvelteKit default                                                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pit of success                             | Runes compiler enforces reactivity. `load` / `actions` file convention. `+page.svelte` / `+page.ts` / `+page.server.ts`. `use:enhance` progressive enhancement.      |
| Explicitness over guesswork                | `lang="ts"` everywhere. Generated `./$types`. Strict `tsconfig` (`noUncheckedIndexedAccess`, `noUnusedLocals`).                                                      |
| Fail fast, fail early                      | Valibot at every external boundary. `load` errors caught at the page boundary. `+error.svelte` is the last-resort error boundary.                                    |
| Errors as control flow                     | `Result`-shaped returns from server load and form actions. Superforms `valid: boolean` discriminated union. Custom `Result<T, E>` for our own domain logic.          |
| Testing philosophy                         | Playwright for browser e2e, Vitest for unit, real backends in tests. `pnpm test:unit` and `pnpm test:e2e` as separate gates.                                         |
| Architecture: separation by responsibility | Reusable domain core outside `src/routes/` (e.g. `src/lib/server/domain/`). Routes are thin adapters. UI components in `src/lib/components/ui/` (shadcn copy-paste). |
| Tooling: one per job, strict               | `pnpm` only. `eslint` + `prettier` (no debate). `svelte-check` + `tsc`. `vitest` + `@playwright/test`. Husky + lint-staged.                                          |
| Interface standards                        | SvelteKit `load` for SSR data. `ky` or `fetch` in routes. `pino` server-side. `colorlog`-equivalent in browser.                                                      |
| Frameworks: adopt, don't reinvent          | Standard lib from day one: Superforms + Valibot + Bits UI + shadcn-svelte + TanStack Query + Paraglide + svelte/transition.                                          |
| Project setup: invest early                | `pnpm create svelte@latest`, strict config, Husky, CI from day one. `AGENTS.md` in repo root.                                                                        |

---

## Library Stack (canonical)

The default stack. Record deviations with a reason.

```text
framework          : sveltekit 2.x (svelte 5.x)
package manager    : pnpm
type checker       : tsc + svelte-check
linter             : eslint + prettier
test (unit)        : vitest + @testing-library/svelte
test (e2e)         : @playwright/test
data fetching      : sveltekit load (SSR/initial) + @tanstack/svelte-query (client cache, mutations)
forms              : sveltekit-superforms 2 + valibot adapter
validation         : valibot 1.4
headless           : bits-ui 2.x
shadcn-style       : shadcn-svelte (copy-paste into src/lib/components/ui)
animation          : svelte/transition + svelte/motion (built-in); gsap only for timeline/marketing
i18n               : @inlang/paraglide-js 2.x + @inlang/paraglide-sveltekit
server http        : native fetch in +page.server.ts; ky for client if needed
logging            : pino (server), console + structured JSON (client)
auth               : better-auth or lucia (decide per project)
db                 : drizzle-orm (or prisma) — decide per project
```

### Why these and not their alternatives

| Category     | Pick                                  | Rejected                                         | Reason                                                                                                                                      |
| ------------ | ------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Forms        | `sveltekit-superforms` 2              | Felte (1.3.0, last commit Nov 2024, maintenance) | Superforms is the de facto SvelteKit form lib, 167k weekly, supports Valibot + Zod + ArkType, returns `valid: boolean` discriminated union. |
| Forms        | `sveltekit-superforms` 2              | `@formisch/svelte`                               | Newer, smaller community, less battle-tested. Pick only if cross-framework form sharing is required.                                        |
| Validation   | `valibot` 1.4                         | `zod` 4                                          | Valibot is 1.37 KB vs Zod's 15.18 KB (90% smaller). Same inference, all major libs support it.                                              |
| Validation   | `valibot` 1.4                         | `arktype` 2                                      | Excellent runtime and TS-native syntax but smaller adapter ecosystem. Re-evaluate if it grows.                                              |
| Headless     | `bits-ui` 2.x                         | `melt-ui`                                        | Melt UI was effectively superseded by Bits UI. The Bits UI intro page credits Melt as inspiration.                                          |
| Headless     | `bits-ui` 2.x                         | `ark-ui` (Svelte adapter)                        | Real cross-framework option but no shadcn-style component set. Re-evaluate if shadcn-solid-style ecosystem grows.                           |
| Animation    | `svelte/transition` + `svelte/motion` | `solid-motionone`-style lib for Svelte           | Svelte's built-in transitions are compiler-optimized and free. `motion` (the merged Framer/Motion-One) has no native Svelte adapter.        |
| i18n         | `paraglide-js`                        | `svelte-i18n`                                    | Paraglide is the official SvelteKit i18n integration, compiler-based, type-safe, 70% smaller bundles than runtime libs.                     |
| Server state | `@tanstack/svelte-query`              | Hand-rolled cache                                | We don't reinvent solved problems. TanStack is the pit-of-success for client-side server state.                                             |

---

## Project Layout (canonical)

```text
my-app/
|-- src/
|   |-- routes/                          # SvelteKit routes — thin adapters only
|   |   |-- +layout.svelte
|   |   |-- +layout.ts                   # global loaders (auth, locale, theme)
|   |   |-- +error.svelte                # top-level error boundary
|   |   |-- +page.svelte                 # /
|   |   |-- +page.ts                     # client/SSR load
|   |   |-- +page.server.ts              # server-only load, mutations
|   |   `-- [feature]/
|   |       |-- +page.svelte
|   |       |-- +page.server.ts
|   |       `-- +page.ts
|   |-- lib/
|   |   |-- components/
|   |   |   `-- ui/                      # shadcn-svelte copy-paste components (we own styling)
|   |   |-- server/                      # server-only modules (never import from +page.svelte)
|   |   |   |-- domain/                  # reusable core: business rules, no UI
|   |   |   |   |-- user/
|   |   |   |   |   |-- index.ts         # public API of the user domain
|   |   |   |   |   |-- service.ts       # business logic
|   |   |   |   |   `-- repository.ts    # data access (interface + impl)
|   |   |   |   `-- order/
|   |   |   |-- infra/                   # db client, third-party adapters
|   |   |   `-- auth.ts                  # auth helpers
|   |   |-- client/                      # client-only modules
|   |   |   `-- query/                   # @tanstack/svelte-query keys, fetchers
|   |   |-- paraglide/                   # generated i18n messages (do not edit)
|   |   `-- schemas/                     # valibot schemas, shared between server and client
|   |-- app.d.ts
|   |-- app.html
|   `-- hooks.server.ts
|-- tests/
|   |-- e2e/                             # Playwright
|   `-- unit/                            # Vitest
|-- static/
|-- package.json
|-- svelte.config.js
|-- vite.config.ts
|-- tsconfig.json
|-- .eslintrc.cjs
|-- .prettierrc
|-- playwright.config.ts
|-- vitest.config.ts
|-- AGENTS.md
`-- .github/workflows/ci.yml
```

**Layer rules (enforced by lint, not convention):**

- `src/lib/server/**` MUST NOT be imported by `+page.svelte`, `+layout.svelte`, or any `src/lib/components/**`. Server code only.
- `src/lib/components/**` MUST NOT import from `src/lib/server/**` or from external state libraries directly. Components consume props and emit events; they do not call the DB.
- `src/lib/schemas/**` is the only place schemas live. Both server and client import from here.
- `+page.svelte` is a thin render of `data` from `+page.ts` / `+page.server.ts`. No business logic in components.
- `+page.server.ts` does auth checks, calls into `src/lib/server/domain/**`, and returns typed data or `fail()`.

### Path aliases

Configure `tsconfig.json` and `svelte.config.js`:

```json
{
  "compilerOptions": {
    "paths": {
      "$lib": ["./src/lib"],
      "$lib/*": ["./src/lib/*"],
      "$schemas": ["./src/lib/schemas"],
      "$schemas/*": ["./src/lib/schemas/*"]
    }
  }
}
```

This means our lint rule can ban `import ... from "../../../lib/server/..."` style imports without false positives.

---

## Project Setup (the invest-early checklist)

Run once per project, before any feature work. This is the pit of success in action.

```bash
pnpm create svelte@latest my-app
# -> Skeleton project, TypeScript, ESLint, Prettier, Playwright, Vitest

cd my-app
pnpm add -D svelte-check @sveltejs/adapter-node  # or adapter-auto / vercel / cloudflare
pnpm add superforms valibot bits-ui @tanstack/svelte-query
pnpm add @inlang/paraglide-js @inlang/paraglide-sveltekit
pnpm add -D @shadcn/svelte  # the CLI
pnpm dlx shadcn-svelte@latest init
pnpm dlx shadcn-svelte@latest add button dialog form input select ...
```

Then:

- [ ] Tighten `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noUnusedLocals`, `noFallthroughCasesInSwitch`.
- [ ] Add `svelte-check` to `pnpm check` and CI.
- [ ] Configure ESLint to ban `$lib/server/**` imports from `.svelte` files and from `$lib/components/**`.
- [ ] Configure Vitest + Playwright separately. Playwright runs against a built preview server, not dev.
- [ ] Set up Husky + lint-staged: `pre-commit` runs `pnpm check && pnpm lint && pnpm format`.
- [ ] Set up GitHub Actions: `lint -> typecheck -> test:unit -> test:e2e -> build`. Every PR runs all four.
- [ ] Add `AGENTS.md` at the repo root with project-specific agent instructions (see "AI Agent Setup" below).
- [ ] Add `docs/architecture.md` with the project's specific deviations from this doc (if any).

### tsconfig.json — strict baseline

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### ESLint — layer enforcement

In `eslint.config.js`, add a custom rule that bans `$lib/server` from `*.svelte` files and from `$lib/components/**`. The `eslint-plugin-svelte` already handles most of this, but the explicit ban is worth the 20 lines.

```js
// pseudocode
{
  files: ['**/*.svelte'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{ group: ['$lib/server/*', '$lib/server'] }],
    }],
  },
}
```

---

## Modern SvelteKit Conventions (2.16+)

Two SvelteKit 2.16+ additions shape the cookbook. Use them by default; fall back to older patterns only when the project is pinned below 2.16.

### `PageProps` (and the unified props pattern)

Since SvelteKit 2.16, the generated `./$types` module exports a `PageProps` type that combines `data`, `form`, and route params. This is the preferred typing for `+page.svelte`:

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>
```

The legacy `let { data, form }: { data: PageData; form: ActionData } = $props()` still works. New code should use `PageProps`.

### Remote functions (SvelteKit 2.27+)

Remote functions (`query`, `form`, `command`, `getRequestEvent`) are a newer alternative to `load` + form actions for cases where you want server-only functions you can call directly from client components. They are useful for one-off RPC-style interactions without owning a route.

```ts
// $lib/server/users.ts
import { query } from '$sveltekit/remote';
import * as v from 'valibot';

export const getUser = query(v.string(), async (id) => {
  return await db.getUser(id);
});
```

```svelte
<script>
  import { getUser } from '$lib/server/users';
</script>

{#await getUser('123')}
  <p>Loading…</p>
{:then user}
  <p>{user.name}</p>
{/await}
```

**Default to `load` + form actions for the cookbook patterns.** Reach for remote functions only when:
- The call is one-off (not tied to a route entry)
- You want the RPC ergonomics without writing a custom API route
- You have a use case that `load` + form actions make awkward (e.g., a sidebar widget that needs fresh data on every navigation)

This feature is recent. Verify the project's SvelteKit version supports it before adopting.

---

## Cookbook: Building a Classic CRUD Page

This is the shape of a normal frontend app: a list, a detail view, a create/edit form, a delete confirmation. It demonstrates all the canonical patterns in one place.

### 1. Define the schema once (in `$schemas`)

`src/lib/schemas/user.ts`:

```ts
import * as v from 'valibot';

// Wire format from the API
export const UserSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  role: v.picklist(['admin', 'member']),
  createdAt: v.pipe(v.string(), v.isoTimestamp()),
});

export type User = v.InferOutput<typeof UserSchema>;

// Form input format (id optional, createdAt absent)
export const UserInputSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  role: v.picklist(['admin', 'member']),
});

export type UserInput = v.InferOutput<typeof UserInputSchema>;

// Reusable superforms-friendly wrapper
export const UserFormSchema = v.object({
  email: UserInputSchema.entries.email,
  name: UserInputSchema.entries.name,
  role: UserInputSchema.entries.role,
});
```

The same schema is used by the form (Superforms + Valibot), the server action (Valibot parse), and the API client (Valibot parse on the response). One source of truth.

### 2. Implement the domain (in `$lib/server/domain/user/`)

`src/lib/server/domain/user/repository.ts`:

```ts
import type { User, UserInput } from '$schemas/user';

export interface UserRepository {
  list(): Promise<User[]>;
  get(id: string): Promise<User | null>;
  create(input: UserInput): Promise<User>;
  update(id: string, input: UserInput): Promise<User>;
  delete(id: string): Promise<void>;
}
```

`src/lib/server/domain/user/service.ts`:

```ts
import * as v from 'valibot';
import { UserInputSchema, type User, type UserInput } from '$schemas/user';
import type { UserRepository } from './repository';
import type { Result } from '$lib/server/result';

export function makeUserService(repo: UserRepository) {
  return {
    async list(): Promise<Result<User[], never>> {
      return { ok: true, value: await repo.list() };
    },
    async create(raw: unknown): Promise<Result<User, v.GenericValibotError | 'duplicate'>> {
      const parsed = v.safeParse(UserInputSchema, raw);
      if (!parsed.success) return { ok: false, error: parsed.issues };
      try {
        const user = await repo.create(parsed.output);
        return { ok: true, value: user };
      } catch (e) {
        if (isDuplicateEmailError(e)) return { ok: false, error: 'duplicate' };
        throw e; // programming error — let it crash
      }
    },
    // ...
  };
}
```

`Result<T, E>` is a small discriminated union we own. It is not framework magic; it is two lines of TypeScript. This is how we *use* the philosophy, not just declare it.

### 3. Wire the route (thin adapter)

`src/routes/users/+page.server.ts`:

```ts
import type { PageServerLoad, Actions } from './$types';
import { makeUserService } from '$lib/server/domain/user/service';
import { userRepository } from '$lib/server/infra/repositories';
import { fail } from '@sveltejs/kit';

const userService = makeUserService(userRepository);

export const load: PageServerLoad = async () => {
  const result = await userService.list();
  if (!result.ok) return fail(500, { message: 'Failed to load users' });
  return { users: result.value };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const raw = Object.fromEntries(form);
    const result = await userService.create(raw);
    if (!result.ok) {
      return fail(400, { errors: result.error });
    }
    return { success: true, user: result.value };
  },
  // update, delete: same shape
};
```

`src/routes/users/+page.svelte`:

```svelte
<script lang="ts">
  import type { PageProps } from './$types';
  import { enhance } from '$app/forms';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { UserFormSchema } from '$schemas/user';

  let { data, form }: PageProps = $props();
</script>

<h1>Users</h1>

{#each data.users as user (user.id)}
  <div>
    {user.name} — {user.email}
    <form method="POST" action="?/delete" use:enhance>
      <input type="hidden" name="id" value={user.id} />
      <Button type="submit" variant="destructive">Delete</Button>
    </form>
  </div>
{/each}

<h2>New user</h2>
<form method="POST" action="?/create" use:enhance>
  <Input name="name" placeholder="Name" />
  <Input name="email" type="email" placeholder="Email" />
  <select name="role">
    <option value="member">Member</option>
    <option value="admin">Admin</option>
  </select>
  <Button type="submit">Create</Button>
</form>

{#if form?.errors}
  <p>Validation failed: {JSON.stringify(form.errors)}</p>
{/if}
```

That is the entire page. No `useEffect`, no `useState`, no `useMemo`, no `useCallback`, no `useRef`, no `useReducer`, no stale closure, no dep array. The component is a *pure render of props*. The server does the work.

### 4. If we need client-side reactivity (TanStack Query)

For optimistic updates, polling, real-time-ish client caching, layer `@tanstack/svelte-query` on top:

```svelte
<script lang="ts">
  import { createQuery, createMutation, useQueryClient } from '@tanstack/svelte-query';
  import { api } from '$lib/client/api';

  const qc = useQueryClient();
  const users = createQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/api/users').then((r) => r.json()),
  });

  const create = createMutation({
    mutationFn: (input: UserInput) => api.post('/api/users', input).then((r) => r.json()),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
</script>

{#if users.isPending}
  <p>Loading…</p>
{:else if users.isError}
  <p>Error: {users.error.message}</p>
{:else}
  {#each users.data as user (user.id)}
    <div>{user.name} — {user.email}</div>
  {/each}
{/if}

<button
  onclick={() => create.mutate({ name: 'New', email: 'new@example.com', role: 'member' })}
  disabled={create.isPending}
>
  {create.isPending ? 'Creating…' : 'Create'}
</button>
```

The TanStack layer is the *exception*, not the default. Most pages should use `load` + form actions. Reach for TanStack only when you need one of:

- Optimistic updates with rollback
- Real-time-ish polling or invalidation
- Cache sharing across many components
- Background refetch on window focus

If you do not need those, you do not need TanStack Query.

### 5. i18n (Paraglide)

`src/routes/users/+page.svelte`:

```svelte
<script lang="ts">
  import { m } from '$lib/paraglide/messages';
</script>

<h1>{m.users_title()}</h1>
<button>{m.create_user_button()}</button>
```

Message keys are typed — no string footguns, autocomplete in IDE, tree-shaken at build. Server-side rendering works correctly out of the box.

### 6. Animation (built-in)

```svelte
<script lang="ts">
  import { fly, fade } from 'svelte/transition';
  import { flip } from 'svelte/animate';
  import { quintOut } from 'svelte/easing';
</script>

{#each data.users as user (user.id)}
  <div in:fly={{ y: 20, duration: 300, easing: quintOut }} animate:flip>
    {user.name}
  </div>
{/each}
```

Declarative, no `useEffect` cleanup, type-safe. For more complex motion (drag, gesture), reach for `motion` (the vanilla JS library from the Motion-One + Framer merger).

### 7. Testing

`tests/e2e/users.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('create, list, and delete a user', async ({ page }) => {
  await page.goto('/users');
  await page.getByPlaceholder('Name').fill('Alice');
  await page.getByPlaceholder('Email').fill('alice@example.com');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByText('Alice — alice@example.com')).toBeVisible();

  await page.getByRole('button', { name: 'Delete' }).first().click();
  await expect(page.getByText('Alice')).not.toBeVisible();
});
```

`tests/unit/user-service.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { makeUserService } from '$lib/server/domain/user/service';
import type { UserRepository } from '$lib/server/domain/user/repository';

const fakeRepo: UserRepository = {
  list: async () => [],
  get: async () => null,
  create: async (input) => ({ id: '1', createdAt: new Date().toISOString(), ...input }),
  update: async (id, input) => ({ id, createdAt: new Date().toISOString(), ...input }),
  delete: async () => {},
};

describe('userService.create', () => {
  it('returns ok with user on valid input', async () => {
    const svc = makeUserService(fakeRepo);
    const result = await svc.create({ name: 'A', email: 'a@b.c', role: 'member' });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.name).toBe('A');
  });

  it('returns err on invalid email', async () => {
    const svc = makeUserService(fakeRepo);
    const result = await svc.create({ name: 'A', email: 'not-an-email', role: 'member' });
    expect(result.ok).toBe(false);
  });
});
```

Real repository, not a mocked one. The "trustworthy over covered" rule from the philosophy.

---

## Cookbook: Errors as Values, End to End

This is the recurring pattern. Save it as a habit.

```ts
// $lib/server/result.ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Domain function
async function createUser(raw: unknown): Promise<Result<User, CreateUserError>> {
  const parsed = v.safeParse(UserInputSchema, raw);
  if (!parsed.success) return err({ kind: 'validation', issues: parsed.issues });
  // ... actual creation
  return ok(user);
}

// Route handler
export const actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const result = await createUser(Object.fromEntries(form));
    if (!result.ok) {
      return fail(400, { error: result.error });
    }
    return { success: true, user: result.value };
  },
};

// Component
{#if form?.error?.kind === 'validation'}
  <p>Please fix: {form.error.issues.length} field(s)</p>
{/if}
```

Exceptions are reserved for *programming errors* (invariant violations, "this should never happen"). Expected failures — validation, network, missing data, conflict — return `Result`. This is the philosophy in code, not in a doc.

---

## AI Agent Setup

SvelteKit is the most AI-friendly non-React framework as of mid-2026. We lean on that.

### Project-level

- Add `AGENTS.md` at the repo root. See the template at the end of this section.
- Add `docs/architecture.md` with the project's deviations from this doc.

### Agent rules to enforce

In the project's `AGENTS.md`, list the patterns an agent should follow:

- Components in `src/routes/**/+page.svelte` MUST be thin renders of `data` and `form`. No business logic, no direct DB calls, no direct fetch calls.
- Business logic lives in `src/lib/server/domain/**`. Routes call into it; components do not.
- Schemas live in `src/lib/schemas/**`. Do not duplicate Valibot schemas per route.
- Use `+page.server.ts` for SSR data and mutations. Use TanStack Query only when you have a specific reason.
- Validation goes through Valibot, not ad-hoc checks. Same schema on the server and the client.
- Do not add a new dependency without a recorded reason in `docs/dependencies.md`. Prefer the canonical stack.
- Run `pnpm check && pnpm lint && pnpm test:unit` before claiming a task is done. Add Playwright run if the change touched a route.

### Anti-patterns an agent should refuse

These are the recurring mistakes an agent trained on React will reach for. Refuse them.

- "I'll add client-side state for this form" — use a `bind:value` + form action with `use:enhance`. The server owns the source of truth.
- "I'll fetch data in `onMount`" — use a `load` function. SSR + hydration is free.
- "I'll add a separate Zod schema for the client" — share the Valibot schema from `$lib/schemas/`.
- "I'll add a custom store" — use `load` (server state) or TanStack Query (client cache). A Svelte writable is a smell in a SvelteKit app.
- "I'll create a custom transition with JS" — use `svelte/transition` or `svelte/motion`.
- "I'll write my own i18n context" — use Paraglide.
- "I'll mock the database in tests" — use the real DB on a test schema, or `pglite` for unit.
- "I'll add a global CSS file with utility classes" — use the design tokens from `src/lib/components/ui/` (shadcn-svelte) + component-scoped Svelte styles.
- "I'll add `$effect` to react to prop changes" — derive with `$derived` instead. `$effect` is for side effects, not derived state.

---

## What This Doc Is Not

- **Not a SvelteKit tutorial.** It assumes the reader can read SvelteKit's official docs and use the standard library. The cookbook shows the *shape*; the official docs cover the API.
- **Not a complete replacement for project-level `docs/architecture.md`.** Every project writes its own deviations.
- **Not frozen.** Rules might changed based on practice and future researches.
