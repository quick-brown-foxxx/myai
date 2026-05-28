---
name: manual-interacting-with-opencode-via-cli
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

Use this as a companion to `manual-testing` when runtime proof depends on OpenCode CLI behavior.

References:

- CLI: `https://opencode.ai/docs/cli/`
- Config: `https://opencode.ai/docs/config/`
- Schema: `https://opencode.ai/config.json`
- Providers: `https://opencode.ai/docs/providers/`
- Plugins: `https://opencode.ai/docs/plugins/`
- Tools: `https://opencode.ai/docs/tools/`
- Skills: `https://opencode.ai/docs/skills/`
- Server/events: `https://opencode.ai/docs/server/`

## Core Rule

Choose isolation by scenario, not by habit.

- Preserve user OpenCode setup when OpenCode is only a helper agent.
- Isolate aggressively when testing OpenCode behavior, plugins, skills, providers, permissions, or config semantics.
- Bootstrap explicitly in CI because there is usually no useful user config, auth, or session state.
- `opencode models` proves discovery only; `opencode run` proves runtime compatibility.
- If skills or tools matter, prove actual `tool_use` in JSON or logs.
- Never claim compatibility without fresh command output.

## Scenario Matrix

| Scenario | Default posture | Typical command |
| --- | --- | --- |
| Helper agent for a separate task | Preserve user wrapper, config, auth, plugins, skills, agents, and defaults | `opencode run --dir <dir> ...` |
| Less project-biased helper answer | Preserve user/global setup, but use a temp or minimal `--dir` | `opencode run --dir "$tmp/project" ...` |
| OpenCode/plugin/provider/config/permission behavior test | Use raw or pinned OpenCode plus temp config, project, and session state | `HOME="$tmp/home" "$OPENCODE_BIN" ...` |
| Skill loading test | Choose installed-skill smoke or isolated lab; prove `skill` tool use | `opencode debug skill` or strict env |
| User-specific repro | Start from the exact failing command, then remove layers one at a time | original command first |
| CI/CD or GitHub automation | Fresh install plus explicit model, auth env, permissions, config, and `--dir` | `npm exec -- opencode run ...` |
| Provider smoke with paid auth | Preserve provider auth only; isolate unrelated config and project influence | temp `XDG_CONFIG_HOME` and `OPENCODE_CONFIG_DIR` |

## Scenario Router

- Local plugin file or plugin entrypoint: use **Checking A Local Plugin**.
- NPM plugin package in `plugin`: use **Isolation Building Blocks**, then generic/tool smoke.
- `provider` config block: use **Checking Through Provider Config**.
- OpenCode as separate AI worker: use **Helper Agent Runs**.
- Clean OpenCode install or behavior test: use **Strict Isolation Runs**.
- Skill loading/following: use **Testing Skills Through OpenCode**.
- CI, GitHub automation, or fresh install: use **CI And Fresh Install Runs**.
- Text generation only: use **Checking A Generic Run**.
- Tool compatibility: add **Checking Tool Calls**.

## Command Selection

First decide whether user customization belongs in the run.

- Helper-agent work should usually use the user's normal `opencode` command, including wrappers.
- OpenCode behavior tests should bypass wrappers and use raw or pinned OpenCode.
- User-specific repros should start with the exact user command, then compare against raw or pinned OpenCode.

Quick inspection:

```bash
type -a opencode
readlink -f "$(command -v opencode)"
opencode --version
```

If isolation matters and `opencode` is a wrapper, inspect enough to know whether it sources env files or sets `OPENCODE_CONFIG_CONTENT`, `OPENCODE_PERMISSION`, `HOME`, provider keys, plugins, or custom flags. Then use a raw command:

```bash
OPENCODE_BIN=/absolute/path/to/raw/opencode
"$OPENCODE_BIN" --version
```

For reproducible project tests, pin OpenCode locally:

```bash
npm install --save-dev opencode-ai@<version>
npm exec -- opencode --version
```

## Isolation Building Blocks

OpenCode merges configuration; overrides do not reset other layers.

| Layer | Isolation control |
| --- | --- |
| Working directory | `--dir "$tmp/project"` avoids accidental project context while preserving user global setup |
| Global config | temp `XDG_CONFIG_HOME`, or temp `HOME` for stronger isolation |
| Custom config file | `OPENCODE_CONFIG=/tmp/.../opencode.json`; merge layer, not reset |
| Config directory assets | `OPENCODE_CONFIG_DIR=/tmp/.../config` for temp `agents/`, `commands/`, `plugins/`, `skills/`, config files |
| Project config and `.opencode` | temp project dir or `OPENCODE_DISABLE_PROJECT_CONFIG=1` when supported |
| Inline final override | `OPENCODE_CONFIG_CONTENT='{"share":"disabled"}'` |
| External skills | `OPENCODE_DISABLE_EXTERNAL_SKILLS=1`; add `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1` for Claude-compatible skill paths |
| External plugins | `--pure` or `OPENCODE_PURE=1` when the plugin under test is not loaded that way |
| Session/data/cache | temp `HOME`, or XDG data/state/cache vars when preserving real `HOME` |

Minimal strict/CI config:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "share": "disabled",
  "autoupdate": false,
  "snapshot": false
}
```

Add only task-specific config: `plugin`, `provider`, `skills.paths`, `permission`, `model`, `small_model`, or `mcp`. Do not confuse config key `provider` with server API paths such as `/config/providers`.

## Helper Agent Runs

Use this when OpenCode is just another AI helper running a separate task.

Default: preserve user wrapper, global config, auth, plugins, skills, agents, and defaults.

```bash
tmp="$(mktemp -d /tmp/opencode-helper.XXXXXX)"
opencode run --dir "$tmp" \
  "Research this question and report concise findings: <task>" \
  -m <provider/model> --format json
```

Use a temp `--dir` when the helper should not inherit the current repo's project config or files. Use the real project directory when the helper should inspect it.

Optional narrow override:

```bash
OPENCODE_CONFIG_CONTENT='{"share":"disabled"}' \
opencode run --dir "$tmp" "<task>" -m <provider/model> --format json
```

Do not use temp `HOME`, skill-disable env vars, or raw-binary bypasses unless the task specifically needs less user customization.

## Strict Isolation Runs

Use this when editing OpenCode itself, modifying/testing plugins, checking provider/config semantics, permissions, or isolated skill behavior.

Create a reusable wrapper once, then run all checks through it:

```bash
tmp="$(mktemp -d /tmp/opencode-clean.XXXXXX)"
mkdir -p "$tmp/home" "$tmp/project" "$tmp/config"
oc_isolated() {
  HOME="$tmp/home" \
  XDG_CONFIG_HOME="$tmp/home/.config" \
  XDG_DATA_HOME="$tmp/home/.local/share" \
  XDG_STATE_HOME="$tmp/home/.local/state" \
  XDG_CACHE_HOME="$tmp/home/.cache" \
  OPENCODE_CONFIG_DIR="$tmp/config" \
  OPENCODE_DISABLE_EXTERNAL_SKILLS=1 \
  OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1 \
  OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"snapshot":false}' \
  "$OPENCODE_BIN" "$@"
}

oc_isolated debug paths
oc_isolated debug config
oc_isolated debug skill
oc_isolated run --dir "$tmp/project" \
  "Reply with exactly one word: ok" \
  -m <provider/model> --format json --print-logs --log-level DEBUG
```

If real paid-provider auth is needed, preserve only provider auth sources (`~/.local/share/opencode/auth.json` or provider env vars) and still isolate unrelated config, project context, skills, plugins, and sessions. If changing `HOME` breaks `opencode`, you are probably still using a wrapper.

## CI And Fresh Install Runs

Use this for CI, GitHub automation, release checks, or fresh environments.

CI must explicitly provide:

- OpenCode install or pinned version
- provider credentials through secrets or env, never logs
- model via config or `-m <provider/model>`
- non-interactive permissions
- working directory with `--dir`
- sharing/autoupdate disabled unless intentionally needed
- JSON/log artifacts when debugging

Example:

```bash
npm install --no-save opencode-ai@<version>
OPENCODE_CONFIG_CONTENT='{"$schema":"https://opencode.ai/config.json","share":"disabled","autoupdate":false,"permission":{"bash":"deny","edit":"deny","write":"deny"}}' \
npm exec -- opencode run --dir "$GITHUB_WORKSPACE" \
  "Review the repository state and report findings only." \
  -m <provider/model> --format json --print-logs --log-level INFO
```

If CI tests an OpenCode plugin or skill, combine this with **Strict Isolation Runs**.

## Env And Secrets

Set only env needed for the run.

- Prefer task-provided or repo-established env sources.
- For provider production checks, first look for documented project token sources.
- Treat machine-local env files as fallback only when task context expects them.
- For auth debugging, check `opencode auth login`, `opencode auth list`, provider env vars, and project `.env` files OpenCode loads.
- Never print secrets; report only that a value was loaded.
- Do not copy auth files into temp homes unless explicitly requested.

## Testing Skills Through OpenCode

Use this to verify skill discovery, loading, and following.

Choose mode:

- Installed skill smoke: preserve user setup and use `opencode debug skill` to confirm installed location.
- Isolated lab: temp `HOME`, temp project, and `OPENCODE_CONFIG_DIR/skills/<name>/SKILL.md` or `skills.paths`.

Isolated lab layout:

```text
/tmp/opencode-skill-test.<id>/
|-- config/skills/probe-skill/SKILL.md
|-- home/
`-- project/
```

Give the skill a unique marker in description and body. Then verify:

- `debug skill` lists the expected skill and location.
- `opencode run --format json` contains `tool_use` for tool `skill`.
- The skill tool input names the expected skill.
- The final answer reflects skill content, not only the user prompt.

Runtime pattern:

```bash
oc_isolated run --dir "$tmp/project" \
  "Say PROBE-SKILL-MARKER. Use any relevant skill before answering." \
  -m <provider/model> --format json --print-logs --log-level DEBUG
```

The final answer alone is not enough proof that a skill loaded. `customize-opencode` is built-in and may still appear in listings.

## Checking A Local Plugin

Use this for local plugin entrypoints such as `src/index.ts` or `dist/index.js`.

Default workflow:

1. Use raw or pinned OpenCode unless testing the user's wrapper.
2. Put only the plugin under test in a controlled project `.opencode/plugins/`, global config path, or temp `OPENCODE_CONFIG_DIR`.
3. Disable unrelated external plugins; do not use `--pure` if it suppresses the plugin under test.
4. Build first when runtime depends on built artifacts.
5. Run `opencode models <provider>` for discovery, then real `opencode run` for runtime.
6. Add tool-call smoke when plugin behavior affects tools.

For npm package plugins, prefer config `plugin: [...]`.

## Checking Through Provider Config

Use this for config block `provider`, not plugins.

Default workflow:

1. Use the same command and isolation env for discovery and runtime.
2. Build minimal temp config containing only the provider block under test.
3. Verify expected provider/models via `opencode models`.
4. Run real `opencode run` against a known model ID.
5. Vary only one dimension at a time: base URL, API key env, package name, or model ID.

## Checking A Generic Run

Use this when the task is simply generation through `opencode run`.

```bash
<opencode-command> run --dir "$RUN_DIR" \
  "Reply with exactly one word: ok" \
  -m <provider/model> --print-logs --log-level DEBUG --format json
```

Use `opencode` for helper-agent scenarios, `npm exec -- opencode` for CI, or `"$OPENCODE_BIN"` for strict behavior tests. Choose a model visible through `opencode models` or explicitly known to exist.

Verify provider resolution, runtime provider initialization, model resolution, and normal terminal response.

## Checking Tool Calls

Use this when tool compatibility matters.

- Do not rely on a generic prompt and hope the model uses tools.
- Require a deterministic tool action, such as reading a local file through `read` and summarizing it.
- Inspect logs or `--format json` output and confirm actual `tool_use`.
- Do not hardcode an undocumented event name unless verified in this OpenCode version.
- If needed, read saved tool-output logs and cite concrete tool invocation evidence.

## Failure Classes

Name the failure; do not say only "it failed".

- **Missing key / bootstrap precondition**: credentials unavailable.
- **Wrapper contamination**: `opencode` on `PATH` sourced user env or injected config during a behavior test.
- **Over-isolation**: helper-agent or user-repro run bypassed user settings that should be part of the scenario.
- **Isolation leak**: unexpected config, agents, plugins, skills, permissions, instructions, or sessions affected the run.
- **Config/setup issue**: bad temp config, wrong env, invalid plugin/provider path.
- **Discovery issue**: `opencode models` fails or misses expected provider/models.
- **Runtime wiring issue**: provider initializes incorrectly or factory/model mapping fails.
- **Model resolution issue**: provider loads but model ID is wrong or unknown.
- **Auth issue**: backend returns `401`, `403`, or similar.
- **Tool execution issue**: text generation works but tool call does not execute.
- **Upstream OpenCode contract mismatch**: current OpenCode expectations block behavior.

## Evidence And Reporting

Collect the smallest complete evidence set for the claim.

| Claim | Evidence |
| --- | --- |
| Discovery | command plus output showing provider/models |
| Isolated behavior | raw binary/path or version, isolated layers, `debug config`/`debug paths` when relevant |
| Helper-agent run | preserved user setup, `--dir`, task-specific overrides |
| CI/fresh install | install/pin method, explicit config/model, credential source presence without values |
| Runtime compatibility | real `opencode run`, output, no init/model resolution failure |
| Skill loading | `debug skill`, `tool_use` for `skill`, expected skill name, final answer based on skill content |
| Tool compatibility | real `opencode run`, actual tool invocation, final answer based on tool output |

Report:

- scenario run
- exact commands with secrets redacted
- command path/version when isolation, CI reproducibility, or wrapper behavior matters
- layers preserved, isolated, or bootstrapped
- pass/fail for each step
- key output snippets and failure class

## Common Mistakes

- Treating `opencode models` as runtime proof.
- Using a user wrapper when testing OpenCode itself.
- Bypassing user wrapper/settings when OpenCode is only a helper agent.
- Applying strict isolation by habit instead of by scenario.
- Assuming `OPENCODE_CONFIG` disables project or global config.
- Running from a real repo when avoiding project `.opencode`, rules, agents, or skills.
- Forgetting global `.agents` and `.claude` skills can load separately from OpenCode config.
- Treating final answer as proof that a skill/tool loaded.
- Continuing without required API key instead of failing fast.
