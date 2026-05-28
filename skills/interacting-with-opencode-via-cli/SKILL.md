---
name: interacting-with-opencode-via-cli
description: >-
  ALWAYS LOAD THIS SKILL WHEN USER ASKS TO CHECK, VERIFY, SMOKE-TEST,
  REPRODUCE, OR RUN SOMETHING THROUGH `opencode`, OR WHEN A PLAN CONTAINS A
  STEP TO VERIFY THROUGH `opencode`. Use for `opencode run`, `opencode models`,
  local plugin smoke, `provider` or `providers` config checks, compatibility
  smoke, and tool-call verification through real OpenCode CLI execution.
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

- `opencode models` proves discovery only.
- `opencode run` is required for runtime compatibility.
- If tools matter, run a dedicated tool-call smoke.
- Never claim compatibility without fresh command output.

## Quick Scenario Choice

Pick the sections that match the task. Sections can be combined.

- If the task mentions a local plugin file, plugin directory loading, or plugin entrypoint path, use **Checking A Local Plugin**.
- If the task mentions npm plugin packages configured through the `plugin` array, start with **Preparing Temporary Config In `/tmp`** and then use **Checking A Generic Run** or **Checking Tool Calls** as needed.
- If the task mentions the `provider` config block, use **Checking Through Provider Config**.
- If the task asks whether generation works end-to-end, use **Checking A Generic Run**.
- If the task asks whether tools work, or whether the model can call tools through `opencode`, add **Checking Tool Calls**.

## Preparing Temporary Config In `/tmp`

Default to a disposable config in `/tmp/<name>/` unless the task explicitly says to use an existing config file.

See config docs: `https://opencode.ai/docs/config/`

Recommended shape:

```json
{
  "$schema": "https://opencode.ai/config.json"
}
```

Then add only the minimum task-specific config:

- `plugin: [...]` for npm plugin packages
- `provider: {...}` for provider wiring checks

Do not confuse config key `provider` with server API paths such as `/config/providers`.

Important: OpenCode merges config sources. A temporary config file or `OPENCODE_CONFIG` override does not automatically disable project config discovered from the current working directory. If strong isolation matters, run outside the project tree or explicitly account for merged project settings.

Keep the config isolated from the repository unless the task explicitly requires editing a checked-in config.

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

## Checking A Local Plugin

Use this when the task is about a local plugin entrypoint such as `src/index.ts` or `dist/index.js`.

See plugin docs: `https://opencode.ai/docs/plugins/`

Default workflow:

1. Prefer a controlled plugin directory such as project `.opencode/plugins/`, `~/.config/opencode/plugins/`, or a temporary `OPENCODE_CONFIG_DIR` when testing a local plugin file.
2. If the plugin has a build step and the task depends on built artifacts, build it first.
3. Run `opencode models <provider>` if the plugin provides model discovery.
4. Run at least one real `opencode run` against a known model if runtime compatibility matters.
5. If tools matter, add a tool-call smoke.

Use the `plugin` array in config for npm package plugins. The public plugin docs document package-based loading there more clearly than local file paths.

Important:

- a green `opencode models` does not prove inference works
- local plugin checks often fail in runtime wiring, provider factory loading, or model id mapping, not in discovery

## Checking Through Provider Config

Use this when the task is about the provider config block `provider` in config rather than a plugin.

See provider docs: `https://opencode.ai/docs/providers/`

Default workflow:

1. Build a minimal `/tmp` config containing only the provider block under test.
2. Verify the provider appears in `opencode models` if model discovery is expected.
3. Run a real `opencode run` against a known model id from that provider.
4. If needed, vary only one dimension at a time:
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
opencode run "Reply with exactly one word: ok" -m <provider/model> --print-logs --log-level DEBUG --format json
```

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
- Runtime compatibility:
  - real `opencode run`
  - terminal JSON or text output
  - no provider init or model resolution failure
- Tool compatibility:
  - real `opencode run`
  - evidence of actual `tool_use`
  - final answer based on tool output

If any of those are missing, say the verification is partial.

## Reporting

Report concisely:

- what scenario you ran
- exact commands with secrets redacted
- pass or fail for each step
- key snippets from output
- failure classification if anything broke

Never paste raw secrets, cookies, or full noisy logs when a short snippet is enough.

## Common Mistakes

- Treating `opencode models` as proof that runtime works
- Forgetting a real `opencode run`
- Forgetting a dedicated tool-call smoke when tools matter
- Using a model id that was never validated through discovery or task context
- Claiming success from intuition instead of command output
- Continuing without a required API key instead of failing fast
- Re-explaining auth/bootstrap here instead of relying on the current repo or task context
