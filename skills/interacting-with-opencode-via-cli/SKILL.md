---
name: interacting-with-opencode-via-cli
description: >-
  ALWAYS LOAD THIS SKILL WHEN USER ASKS TO CHECK, VERIFY, SMOKE-TEST,
  REPRODUCE, OR RUN SOMETHING THROUGH `opencode`, OR WHEN A PLAN CONTAINS A
  STEP TO VERIFY THROUGH `opencode`. Use for scenario-appropriate `opencode
  run`, `opencode models`, skill or plugin smoke tests, provider config checks,
  CI bootstrap, raw-binary selection, and tool-call verification through real
  OpenCode CLI execution.
license: MIT
metadata:
  focus: opencode-cli-verification
  tags: testing, verification, operations
---

# Interacting With OpenCode Via CLI

Workflow skill for evidence-based manual verification through real `opencode` commands.

This skill is not about writing a plugin or provider. It is about preparing a real `opencode`
scenario, running it, collecting evidence, and classifying failures correctly.

Use this as a focused companion to `manual-testing` when the runtime proof specifically depends on OpenCode CLI behavior.

Useful references:

- OpenCode CLI: `https://opencode.ai/docs/cli/`
- OpenCode config: `https://opencode.ai/docs/config/`
- OpenCode config schema: `https://opencode.ai/config.json`
- OpenCode providers: `https://opencode.ai/docs/providers/`
- OpenCode plugins: `https://opencode.ai/docs/plugins/`
- OpenCode tools: `https://opencode.ai/docs/tools/`
- OpenCode skills: `https://opencode.ai/docs/skills/`
- OpenCode server/events: `https://opencode.ai/docs/server/`

## Core Principle

- Decide what you are testing before choosing isolation.
- Preserve user OpenCode setup when OpenCode is only a helper agent.
- Isolate aggressively when testing or debugging OpenCode behavior, plugins, skills, or config semantics.
- Bootstrap explicitly in CI because there is usually no user config, auth, or session state.
- `opencode models` proves discovery only.
- `opencode run` is required for runtime compatibility.
- If tools matter, run a dedicated tool-call smoke.
- Never claim compatibility without fresh command output.

## Scenario Matrix

Choose isolation granularly. There is no universal "always isolate" rule.

| Scenario | Default posture | Typical command shape |
| --- | --- | --- |
| Use OpenCode as a helper agent for a separate task | Preserve user config, wrapper, skills, plugins, auth, and normal defaults; optionally run in a clean directory | `opencode run --dir "." ...` |
| Get a less project-biased helper answer | Preserve user/global setup, but use a temp working directory or minimal task directory | `opencode run --dir "$tmp/project" ...` |
| Test OpenCode itself, a plugin, provider wiring, config behavior, permissions, or isolated skill loading | Use raw/pinned binary and strict temp config/project/session isolation | `HOME="$tmp/home" OPENCODE_CONFIG_DIR="$tmp/config" "$OPENCODE_BIN" ...` |
| Reproduce a user-specific issue | Preserve the suspected user/project layers, then remove one layer at a time | start from the failing command |
| CI/CD or GitHub automation | Fresh install plus explicit config, auth env, model, permissions, and working directory | `npm exec -- opencode run ...` |
| Provider runtime smoke while keeping paid auth | Preserve provider auth only when needed; isolate unrelated prompts, skills, project config, and sessions | temp `XDG_CONFIG_HOME`, temp `OPENCODE_CONFIG_DIR`, real provider env/auth |

## Quick Scenario Choice

Pick the sections that match the task. Sections can be combined.

- If the task mentions a local plugin file, plugin directory loading, or plugin entrypoint path, use **Checking A Local Plugin**.
- If the task mentions npm plugin packages configured through the `plugin` array, start with **Isolation Building Blocks** and then use **Checking A Generic Run** or **Checking Tool Calls** as needed.
- If the task mentions the `provider` config block, use **Checking Through Provider Config**.
- If the task asks OpenCode to help with a separate task, use **Using OpenCode As A Helper Agent**.
- If the task asks for a clean OpenCode install or behavior test, use **Strict Isolation For OpenCode Behavior Work**.
- If the task asks whether a skill loads or is followed, use **Testing Skills Through OpenCode**.
- If the task is CI, GitHub automation, or a fresh environment, use **CI And Fresh Install Runs**.
- If the task asks whether generation works end-to-end, use **Checking A Generic Run**.
- If the task asks whether tools work, or whether the model can call tools through `opencode`, add **Checking Tool Calls**.

## Choosing The OpenCode Command

First decide whether user customization is part of the desired run.

- For helper-agent work, the user's wrapper may be exactly the right command because it loads the user's models, skills, plugins, env, and preferences.
- For OpenCode behavior tests, bypass wrappers and use a raw or pinned command.
- For reproducing user bugs, start with the exact user command, then compare against raw/pinned OpenCode.

`opencode` on `PATH` may be an alias, shell function, shim, or local wrapper that injects user-specific env vars, permissions, plugins, or prompts.

Minimum check:

```bash
type -a opencode
readlink -f "$(command -v opencode)"
opencode --version
```

If isolation matters and the first path is a wrapper script, inspect enough to know whether it sources user env files or sets `OPENCODE_CONFIG_CONTENT`, `OPENCODE_PERMISSION`, `HOME`, provider keys, plugins, or custom flags. Use a lower-level command instead, for example a package-manager shim or resolved package binary:

```bash
OPENCODE_BIN=/absolute/path/to/raw/opencode
"$OPENCODE_BIN" --version
```

For reproducible project tests, prefer pinning OpenCode in the project and running the local binary:

```bash
npm install --save-dev opencode-ai@<version>
npm exec -- opencode --version
```

Avoid shell aliases and user wrappers for OpenCode behavior tests unless the wrapper itself is what you are testing. Do not bypass them for helper-agent runs unless there is a concrete reason.

## Isolation Building Blocks

Use these as building blocks. Do not apply all of them blindly.

See config docs: `https://opencode.ai/docs/config/`

OpenCode merges configuration instead of replacing it. The important layers are:

| Layer | How to isolate |
| --- | --- |
| Working directory | Use `--dir "$tmp/project"` to avoid accidental project instructions/config while keeping user global setup |
| Global config | Set `XDG_CONFIG_HOME` to a temp directory, or set `HOME` to a temp directory for stronger isolation |
| Custom config file | Set `OPENCODE_CONFIG=/tmp/.../opencode.json`; remember this is a merge layer, not a reset |
| Config directory assets | Set `OPENCODE_CONFIG_DIR=/tmp/.../config` for temp `agents/`, `commands/`, `plugins/`, `skills/`, and config files |
| Project config and `.opencode` | Run in a temp project dir or set `OPENCODE_DISABLE_PROJECT_CONFIG=1` when supported |
| Inline override | Set `OPENCODE_CONFIG_CONTENT` for final task-specific overrides |
| External skills | Set `OPENCODE_DISABLE_EXTERNAL_SKILLS=1`; add `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` for Claude-compatible skill paths when needed |
| External plugins | Use `--pure` or `OPENCODE_PURE=1` when the plugin under test is not loaded through that mechanism |
| Session/data/cache | Set `HOME` to a temp directory for strongest isolation, or set XDG data/state/cache vars when preserving real `HOME` |

Minimal config content for strict or CI runs:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "share": "disabled",
  "autoupdate": false,
  "snapshot": false,
}
```

Then add only the minimum task-specific config:

- `plugin: [...]` for npm plugin packages
- `provider: {...}` for provider wiring checks
- `skills.paths` or files under `OPENCODE_CONFIG_DIR/skills` for skill checks
- `permission` rules for tool and skill allowlists

Important: a temporary config file or `OPENCODE_CONFIG` override does not automatically disable project config discovered from the current working directory. If strong isolation matters, run outside the project tree or explicitly disable project config.

Keep the config isolated from the repository unless the task explicitly requires editing a checked-in config.

## Using OpenCode As A Helper Agent

Use this when OpenCode is just another AI helper running a separate task from the CLI.

Default posture: preserve the user's normal OpenCode setup. That includes wrapper scripts, global config, provider auth, installed plugins, installed skills, agents, and personal defaults. This is usually the point: the user configured OpenCode to behave well.

Basic pattern:

```bash
tmp="$(mktemp -d /tmp/opencode-helper.XXXXXX)"
opencode run --dir "$tmp" \
  "Research this question and report concise findings: <task>" \
  -m <provider/model> --format json
```

Use a clean `--dir` when you do not want the current repository's project config, instructions, sessions, or files to affect the helper. Use the real project directory when the helper should inspect that project.

Add only task-specific overrides when needed:

```bash
tmp="$(mktemp -d /tmp/opencode-helper.XXXXXX)"
OPENCODE_CONFIG_CONTENT='{"share":"disabled"}' \
opencode run --dir "$tmp" \
  "Answer using the installed tools and skills when useful: <task>" \
  -m <provider/model> --format json
```

Do not use temp `HOME`, `OPENCODE_DISABLE_EXTERNAL_SKILLS`, or raw-binary bypasses here unless the task specifically needs less user customization.

## Strict Isolation For OpenCode Behavior Work

Use this when editing OpenCode itself, modifying/testing OpenCode plugins, testing provider/config semantics, checking permissions, or verifying skill discovery/loading behavior. Here the goal is a clean install-like run that is free from user configuration except provider credentials when intentionally preserved.

Strong isolation pattern:

```bash
tmp="$(mktemp -d /tmp/opencode-clean.XXXXXX)"
mkdir -p "$tmp/home" "$tmp/project" "$tmp/config"
HOME="$tmp/home" \
XDG_CONFIG_HOME="$tmp/home/.config" \
XDG_DATA_HOME="$tmp/home/.local/share" \
XDG_STATE_HOME="$tmp/home/.local/state" \
XDG_CACHE_HOME="$tmp/home/.cache" \
OPENCODE_CONFIG_DIR="$tmp/config" \
OPENCODE_DISABLE_EXTERNAL_SKILLS=1 \
OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1 \
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"snapshot":false,"formatter":false,"lsp":false}' \
"$OPENCODE_BIN" run --dir "$tmp/project" \
  "Reply with exactly one word: ok" \
  -m <provider/model> --format json --print-logs --log-level DEBUG
```

Provider-preserving isolation pattern:

```bash
tmp="$(mktemp -d /tmp/opencode-clean.XXXXXX)"
mkdir -p "$tmp/project" "$tmp/config" "$tmp/xdg-config"
XDG_CONFIG_HOME="$tmp/xdg-config" \
OPENCODE_CONFIG_DIR="$tmp/config" \
OPENCODE_DISABLE_PROJECT_CONFIG=1 \
OPENCODE_DISABLE_EXTERNAL_SKILLS=1 \
OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1 \
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"snapshot":false,"formatter":false,"lsp":false}' \
"$OPENCODE_BIN" run --dir "$tmp/project" \
  "Reply with exactly one word: ok" \
  -m <provider/model> --format json --print-logs --log-level DEBUG
```

Use the provider-preserving pattern when the machine already has working paid-provider auth in `~/.local/share/opencode/auth.json` or provider env vars and the task is not about credentials. Use stronger `HOME` isolation when you are testing config or skill behavior and no real auth is needed.

Before trusting the run, verify the resolved setup:

```bash
oc_isolated() {
  HOME="$tmp/home" \
  XDG_CONFIG_HOME="$tmp/home/.config" \
  XDG_DATA_HOME="$tmp/home/.local/share" \
  XDG_STATE_HOME="$tmp/home/.local/state" \
  XDG_CACHE_HOME="$tmp/home/.cache" \
  OPENCODE_CONFIG_DIR="$tmp/config" \
  OPENCODE_DISABLE_EXTERNAL_SKILLS=1 \
  OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1 \
  OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"snapshot":false,"formatter":false,"lsp":false}' \
  "$OPENCODE_BIN" "$@"
}

oc_isolated debug paths
oc_isolated debug config
oc_isolated debug skill
```

Run those commands with the same env and working directory as the smoke test.

## CI And Fresh Install Runs

Use this for CI, GitHub automation, release checks, or any environment where OpenCode starts with no useful user state.

Default posture: bootstrap everything needed explicitly.

CI checklist:

- install or pin `opencode-ai`
- provide provider credentials through CI secrets or job environment
- write a minimal `opencode.json` or set `OPENCODE_CONFIG_CONTENT`
- set `model` or pass `-m <provider/model>`
- define permissions intentionally; CI should not rely on interactive prompts
- run in a checked-out project directory only when the task needs the project
- disable sharing and autoupdate unless the workflow explicitly needs them
- save command output or JSON events as CI artifacts when debugging

Example shape:

```bash
npm install --no-save opencode-ai@<version>
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"permission":{"bash":"deny","edit":"deny","write":"deny"}}' \
npm exec -- opencode run --dir "$GITHUB_WORKSPACE" \
  "Review the repository state and report findings only." \
  -m <provider/model> --format json --print-logs --log-level INFO
```

If CI is testing an OpenCode plugin or skill, combine this section with **Strict Isolation For OpenCode Behavior Work**.

## Preparing Env And Secrets

Set only the env needed for the current run.

Typical examples:

- provider API key
- base URL
- optional plugin or provider env

Rules:

- prefer task-provided or repo-established env sources
- for provider-specific production checks, first look for the documented project token source
- treat machine-local env files as fallback sources only when the repo or task context says they are expected
- when debugging auth, check all documented credential sources: `opencode auth login`, `opencode auth list`, environment variables, and any project `.env` that OpenCode loads
- never print secrets in the report
- if you must inspect an env file, report only that the value was loaded, not the value itself

Isolation rules:

- do not source a user wrapper's env files unless the wrapper is under test
- if preserving provider auth during a behavior test, keep only provider auth sources and isolate all other config layers
- if changing `HOME` breaks `opencode`, you are probably still using a wrapper; switch to a raw binary for strict isolation
- never copy auth files into temp homes unless the user explicitly asks and you can avoid printing secrets

## Testing Skills Through OpenCode

Use this when the task is to verify that OpenCode discovers, loads, and follows a skill.

See skills docs: `https://opencode.ai/docs/skills/`

Recommended layout:

```text
/tmp/opencode-skill-test.<id>/
|-- config/
|   `-- skills/
|       `-- probe-skill/
|           `-- SKILL.md
|-- home/
`-- project/
```

Choose one mode:

- isolated lab: use temp `HOME`, temp project, and `OPENCODE_CONFIG_DIR/skills/<name>/SKILL.md`
- installed skill smoke: preserve the user's normal OpenCode setup and use `opencode debug skill` to confirm the installed location

For isolated lab tests, put the skill under `OPENCODE_CONFIG_DIR/skills/<name>/SKILL.md`, or use `skills.paths` when the task needs a separate source directory. Give the skill a unique marker in both the description and body so the final answer can prove it was followed.

Discovery check:

```bash
HOME="$tmp/home" \
XDG_CONFIG_HOME="$tmp/home/.config" \
OPENCODE_CONFIG_DIR="$tmp/config" \
OPENCODE_DISABLE_EXTERNAL_SKILLS=1 \
OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1 \
OPENCODE_CONFIG_CONTENT='{"permission":{"skill":{"*":"allow"}}}' \
"$OPENCODE_BIN" debug skill
```

Runtime check:

```bash
HOME="$tmp/home" \
XDG_CONFIG_HOME="$tmp/home/.config" \
OPENCODE_CONFIG_DIR="$tmp/config" \
OPENCODE_DISABLE_EXTERNAL_SKILLS=1 \
OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1 \
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"snapshot":false,"permission":{"skill":{"*":"deny","probe-skill":"allow"},"edit":"deny","write":"deny","bash":"deny"}}' \
"$OPENCODE_BIN" run --dir "$tmp/project" \
  "Say PROBE-SKILL-MARKER. Use any relevant skill before answering." \
  -m <provider/model> --format json --print-logs --log-level DEBUG
```

What to verify:

- `debug skill` lists the expected skill and location
- the JSON output contains a `tool_use` part for tool `skill`
- the skill tool input names the expected skill
- the final answer reflects the skill body, not just the user prompt

Important:

- the final answer alone is not enough evidence that the skill loaded
- `OPENCODE_CONFIG_DIR/skills` and `skills.paths` are both valid skill sources in current OpenCode
- `customize-opencode` is a built-in skill and may still appear in skill listings
- if project `.opencode` or global `.agents` skills appear unexpectedly, your isolation is incomplete

## Checking A Local Plugin

Use this when the task is about a local plugin entrypoint such as `src/index.ts` or `dist/index.js`.

See plugin docs: `https://opencode.ai/docs/plugins/`

Default workflow:

1. Use a raw OpenCode command, not a user wrapper.
2. Prefer a controlled plugin directory such as project `.opencode/plugins/`, `~/.config/opencode/plugins/`, or a temporary `OPENCODE_CONFIG_DIR` when testing a local plugin file.
3. Disable unrelated external plugins; do not use `--pure` if it suppresses the plugin under test.
4. If the plugin has a build step and the task depends on built artifacts, build it first.
5. Run `opencode models <provider>` if the plugin provides model discovery.
6. Run at least one real `opencode run` against a known model if runtime compatibility matters.
7. If tools matter, add a tool-call smoke.

Use the `plugin` array in config for npm package plugins. The public plugin docs document package-based loading there more clearly than local file paths.

Important:

- a green `opencode models` does not prove inference works
- local plugin checks often fail in runtime wiring, provider factory loading, or model id mapping, not in discovery

## Checking Through Provider Config

Use this when the task is about the provider config block `provider` in config rather than a plugin.

See provider docs: `https://opencode.ai/docs/providers/`

Default workflow:

1. Use the same raw binary and isolation env for discovery and runtime.
2. Build a minimal `/tmp` config containing only the provider block under test.
3. Verify the provider appears in `opencode models` if model discovery is expected.
4. Run a real `opencode run` against a known model id from that provider.
5. If needed, vary only one dimension at a time:
   - base URL
   - API key env
   - provider package name
   - model id

Focus on whether the config is compatible with OpenCode, not whether the backend implementation is elegant.

## Checking A Generic Run

Use this when the task is simply "does it work through `opencode run`?".

See CLI docs: `https://opencode.ai/docs/cli/`

Minimum command pattern:

```bash
<opencode-command> run --dir "$RUN_DIR" "Reply with exactly one word: ok" -m <provider/model> --print-logs --log-level DEBUG --format json
```

Use `opencode` for helper-agent scenarios, `npm exec -- opencode` for CI, or `"$OPENCODE_BIN"` for strict behavior tests.

Choose a model that is already visible through `opencode models` or otherwise explicitly known to exist.

For repeated smoke checks, consider running `opencode serve` once and then using `opencode run --attach ...` to avoid repeated startup overhead.

What to verify:

- provider resolution succeeds
- runtime provider initializes
- model resolves correctly
- generation returns a normal terminal response

## Checking Tool Calls

Use this when the task is about tool compatibility, not just text generation.

See tools docs: `https://opencode.ai/docs/tools/`

Do not rely on a generic prompt and hope the model will use a tool. Ask for a specific tool action and instruct the model not to answer from memory.

Good pattern:

- require the model to read a local file through `read`
- require the model to inspect config or another deterministic artifact
- then ask for a short summary based on the tool result

What counts as evidence:

- the final answer alone is not enough
- inspect logs or structured `--format json` output and confirm there was an actual tool invocation
- do not hardcode an undocumented event name as the only proof unless you verified it in the current OpenCode version
- if needed, read the saved `opencode` tool-output log and point to the concrete tool invocation evidence you observed

## How To Interpret Failures

Classify the failure before proposing fixes.

Common classes:

- **Missing key / bootstrap precondition**: cannot start real verification because credentials are unavailable
- **Wrapper contamination**: `opencode` on `PATH` sourced user env, injected config, or failed when `HOME` was changed
- **Over-isolation**: a helper-agent or user-repro run incorrectly bypassed user settings, skills, plugins, auth, or wrappers that should have been part of the scenario
- **Isolation leak**: unexpected global/project config, agents, plugins, skills, permissions, instructions, or sessions affected the run
- **Config/setup issue**: bad temp config, wrong env wiring, invalid plugin or provider path
- **Discovery issue**: `opencode models` fails or returns no expected provider/models
- **Runtime wiring issue**: provider initializes incorrectly, factory cannot load, package or file path mismatch
- **Model resolution issue**: provider loads but the wrong model id is passed or requested model is unknown
- **Auth issue**: provider runtime reaches backend but gets `401`, `403`, or similar auth failures
- **Tool execution issue**: text generation works but tool call is not actually executed
- **Upstream OpenCode contract mismatch**: behavior is blocked by current `opencode` expectations rather than only local code

Do not bundle these together as "it failed". Name the class and support it with evidence.

## What Counts As Sufficient Evidence

For a compatibility claim, collect the smallest complete evidence set for the task.

Examples:

- Discovery only:
  - command
  - success output showing provider/models
- Isolated run:
  - raw binary path or package version
  - isolation env summary with secrets redacted
  - `debug config`, `debug paths`, or logs showing temp paths when relevant
- Helper-agent run:
  - whether user setup was intentionally preserved
  - working directory used with `--dir`
  - any added config overrides
- CI/fresh install run:
  - OpenCode install/pin method
  - explicit config and model selection
  - credential source presence without secret values
- Runtime compatibility:
  - real `opencode run`
  - terminal JSON or text output
  - no provider init or model resolution failure
- Skill loading:
  - `debug skill` listing expected skill location
  - real `opencode run`
  - JSON `tool_use` for tool `skill` with the expected skill name
  - final answer based on skill content
- Tool compatibility:
  - real `opencode run`
  - evidence of actual `tool_use`
  - final answer based on tool output

If any of those are missing, say the verification is partial.

## Reporting

Report concisely:

- what scenario you ran
- exact commands with secrets redacted
- command path/version when isolation, CI reproducibility, or wrapper behavior matters
- which layers were preserved, isolated, or bootstrapped explicitly
- pass or fail for each step
- key snippets from output
- failure classification if anything broke

Never paste raw secrets, cookies, or full noisy logs when a short snippet is enough.

## Common Mistakes

- Treating `opencode models` as proof that runtime works
- Using a user wrapper or alias when trying to test OpenCode itself
- Bypassing the user's wrapper/settings when OpenCode is only being used as a helper agent
- Applying strict isolation by habit instead of choosing layers by scenario
- Setting `OPENCODE_CONFIG` and assuming it disables project or global config
- Running from a real repo when trying to avoid project `.opencode`, rules, agents, or skills
- Forgetting that global `.agents` and `.claude` skills can be loaded separately from OpenCode config
- Treating a final answer as proof that a skill loaded without checking JSON `tool_use`
- Forgetting a real `opencode run`
- Forgetting a dedicated tool-call smoke when tools matter
- Using a model id that was never validated through discovery or task context
- Claiming success from intuition instead of command output
- Re-explaining auth/bootstrap here instead of relying on the current repo or task context
