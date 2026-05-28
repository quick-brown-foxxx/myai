---
name: manual-interacting-with-codex-via-cli
description: >-
  ALWAYS LOAD THIS SKILL WHEN USER ASKS TO CHECK, VERIFY, SMOKE-TEST,
  REPRODUCE, OR RUN SOMETHING THROUGH `codex`, OR WHEN A PLAN CONTAINS A
  STEP TO VERIFY THROUGH `codex`. Use for scenario-appropriate `codex exec`,
  Codex CLI automation, sandbox/approval checks, config/profile isolation,
  skill/plugin/MCP smoke tests, CI bootstrap, and real non-interactive Codex CLI evidence.
license: MIT
metadata:
  focus: codex-cli-verification
  tags: testing, verification, operations
---

# Interacting With Codex Via CLI

Workflow skill for evidence-based manual verification through real `codex` commands.

Use this as a companion to `manual-testing` when runtime proof depends on Codex CLI behavior.

References:

- CLI: `https://developers.openai.com/codex/cli`
- Command reference: `https://developers.openai.com/codex/cli/reference`
- Sandboxing: `https://developers.openai.com/codex/concepts/sandboxing`
- Open source repo: `https://github.com/openai/codex`

## Core Rule

Choose sandbox and approval behavior explicitly.

- Preserve user Codex setup when Codex is only a helper agent or a user-specific repro.
- Isolate aggressively when testing Codex behavior, config, profiles, skills, plugins, MCP, hooks, rules, permissions, or sandbox semantics.
- Use `--cd` for every non-interactive run so the workspace is explicit.
- Default to network-capable `workspace-write` runs for trusted helper, verification, and edit scenarios.
- Add `-c sandbox_workspace_write.network_access=true` unless the task is explicitly testing network denial or untrusted code isolation.
- Treat `danger-full-access` and `--dangerously-bypass-approvals-and-sandbox` as valid only inside externally hardened disposable environments or when user/instructions explicitly allow this. Treat older `--yolo` examples as legacy guidance unless installed help still exposes that flag.
- Do not use deprecated `--full-auto` as a default; use explicit sandbox and approval flags.
- Never claim compatibility without fresh command output or JSON evidence.

## Scenario Matrix

| Scenario | Default posture | Typical command |
| --- | --- | --- |
| Helper agent for a separate task | Preserve user auth/config unless isolation is requested; allow networked local commands | `codex --sandbox workspace-write -c sandbox_workspace_write.network_access=true -a never exec --cd <dir> ...` |
| Manual verification through Codex | Use explicit cwd, sandbox, approval policy, and JSON evidence | `codex --sandbox workspace-write -c sandbox_workspace_write.network_access=true -a never exec --cd <repo> --json ...` |
| No-edit review or triage | Use network-capable workspace sandbox, instruct no edits, and verify diff stayed clean | `codex --sandbox workspace-write -c sandbox_workspace_write.network_access=true -a never exec ...` |
| Runtime/code-change smoke | Network-capable workspace-write sandbox, no prompts, and isolated repo/worktree | `codex --sandbox workspace-write -c sandbox_workspace_write.network_access=true -a never exec ...` |
| Strict behavior/config test | Temp `CODEX_HOME`, optional `--ignore-user-config`, temp project | `CODEX_HOME="$tmp/codex" codex --sandbox workspace-write -a never exec --ignore-user-config ...` |
| Skill discovery/use test | Isolate or preserve skill paths by scenario; prove behavior via JSON/output | `codex --sandbox workspace-write -a never exec --json "Use <skill> ..."` |
| Plugin/MCP smoke | Config with only target plugin/MCP when behavior matters | `codex mcp list --json`; `codex --sandbox workspace-write -a never exec --json ...` |
| CI/automation | Prefer official Codex action when available; otherwise scope secrets to one invocation | `CODEX_API_KEY=... codex --sandbox workspace-write -a never exec --json ...` |
| Sandbox/permission test | Vary one sandbox/profile/rule dimension at a time | `codex sandbox ...` or explicit `--sandbox` flags |
| User-specific repro | Start from the exact failing command, then remove layers one at a time | original command first |

## Command Selection

First inspect local availability and installed behavior:

```bash
type -a codex
codex --version
codex --help
codex exec --help
codex login status
```

If `codex` is not installed, stop and report **missing CLI bootstrap** unless the task is docs-only research.

Use the user's normal `codex` command for helper-agent work and user-specific repros. Use temp `CODEX_HOME`, `--ignore-user-config`, or `--ignore-rules` only when inherited configuration would contaminate the test.

For complex prompts that might break shell interpolation, prefer prompt files or stdin:

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$repo" \
  --json \
  - < prompt.md
```

## Isolation Building Blocks

Codex behavior can come from config, profiles, project trust, hooks, rules, MCP, skills, plugins, auth, and session history.

| Layer | Isolation control |
| --- | --- |
| Working directory | Always use `--cd <dir>` / `-C <dir>` |
| Git repo guard | Use `--skip-git-repo-check` only for safe temp dirs |
| User config/state | temp `CODEX_HOME`; default is typically `~/.codex` |
| User config file | `--ignore-user-config` skips `$CODEX_HOME/config.toml`; auth still uses `CODEX_HOME` |
| Rules | `--ignore-rules` only when user/project execpolicy rules should not affect the run |
| Session persistence | `--ephemeral` when rollout/history persistence is not needed |
| Sandbox | `--sandbox read-only|workspace-write|danger-full-access` |
| Approvals | `--ask-for-approval untrusted|on-request|never` |
| Network | Default to `-c sandbox_workspace_write.network_access=true` with `workspace-write`; omit only for explicit network-denial/security tests |
| Inline config | `-c key=value`, values parse as TOML when possible |
| Profiles | `--profile <name>` layers `$CODEX_HOME/<profile>.config.toml` |
| MCP | `codex mcp list --json`, `codex mcp get <name> --json`, isolated config |
| Output evidence | `--json` for JSONL events; `--output-last-message <path>` for final answer artifact |

Strict temp-state pattern:

```bash
tmp="$(mktemp -d /tmp/codex-cli-test.XXXXXX)"
mkdir -p "$tmp/codex-home" "$tmp/project"

CODEX_HOME="$tmp/codex-home" \
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --ignore-user-config \
  --cd "$tmp/project" \
  --skip-git-repo-check \
  --json \
  "Reply with exactly: ok"
```

On Codex `0.134.0`, approval policy is a top-level flag, not an `exec` option. Prefer putting global flags before `exec` for portability across installed versions:

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$repo" --json "Reply with exactly: ok"
```

If real paid-provider auth is needed, preserve only the required auth source and isolate unrelated config, hooks, rules, project context, skills, plugins, MCP, and sessions.

## Helper Agent Runs

Use this when Codex is just another AI helper.

Default: preserve the user's normal Codex setup.

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$repo" \
  --json \
  "Research this question and report concise findings: <task>"
```

When edits are expected, run in an isolated worktree or temp copy. For no-edit helper runs, instruct Codex not to modify files and verify the diff afterward.

Background shelling with `&`, PID files, and logs can still be useful for long tasks, but non-interactive `codex exec` is already script-friendly. Prefer JSONL artifacts and `--output-last-message` over ad hoc `tail` checks.

## Checking A Generic Run

Use this when the task is simply generation through `codex exec`.

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$repo" \
  --json \
  "Reply with exactly: ok"
```

For downstream scripting:

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$repo" \
  --json \
  --output-last-message "$tmp/final.md" \
  "Summarize the repository structure."
```

Verify exit code, JSON events, final output, and absence of auth/sandbox/approval failures.

## Checking Tool Or File Effects

Use this when runtime compatibility depends on tool execution or file changes.

- Do not rely on final prose alone.
- Require a deterministic action such as reading a named file, running a safe command, or making a small isolated edit.
- Use `--json` events and inspect changed files or `--output-last-message`.
- Keep write checks inside a temp repo or git worktree.

Read-only pattern:

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$repo" \
  --json \
  "Read README.md and report only its first heading. Do not modify files."
```

Workspace-write pattern:

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$worktree" \
  --json \
  --output-last-message "$tmp/final.md" \
  "Make the smallest requested edit, then report the exact files changed."
```

## Checking Sandbox And Approvals

Sandbox and approval policies work together.

| Setting | Use |
| --- | --- |
| `--sandbox read-only` | Intentional no-write/no-command-side-effect sandbox tests; not the default for helper workflows |
| `--sandbox workspace-write` | Local commands and edits limited to workspace boundary; preferred default when command execution may need network |
| `--sandbox danger-full-access` | Only externally isolated disposable environments |
| `--ask-for-approval never` | True non-interactive runs that must not prompt |
| `--ask-for-approval on-request` | Interactive or watched local runs |
| `--ask-for-approval untrusted` | Ask before commands outside trusted set |

Network access is separate from filesystem sandboxing. For this repo's Codex helper workflows, networked command execution is usually expected, so enable it by default in `workspace-write` runs:

```bash
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  exec --cd "$repo" \
  --json \
  "Run the dependency check that requires network."
```

Use `read-only` only when intentionally blocking writes and command side effects. If a nominally read-only task may need package-manager, test, documentation, or web-backed shell commands, use network-enabled `workspace-write`, instruct Codex not to edit files, and verify `git diff` afterward.

Disable command network access only for sandbox/security tests, untrusted code, or when reproducing network-denial behavior.

Do not mix newer permission-profile features with older `sandbox_mode` assumptions unless the installed Codex version and docs confirm how they compose.

## Checking Resume And Sessions

Use official resume syntax.

```bash
codex exec resume --last \
  "Continue with the verification step only."
```

Or resume a known session:

```bash
codex exec resume <session-id> \
  "Continue from the previous result and report only remaining risks."
```

Before resuming a backgrounded process, verify the previous process ended. Do not send a follow-up to a session that is still running.

Use `--ephemeral` when session persistence is undesirable.

## Checking Skills, Plugins, MCP, Hooks, And Rules

Skills/plugins/MCP features move quickly; verify against installed `codex --help`, `codex exec --help`, and current official docs.

MCP inspection:

```bash
codex mcp list --json
codex mcp get <server-name> --json
```

MCP add pattern:

```bash
codex mcp add context7 -- npx -y @upstash/context7-mcp
```

Rules check pattern, only when installed help exposes `codex execpolicy`:

```bash
codex execpolicy --help
codex execpolicy check --pretty \
  --rules "$HOME/.codex/rules/default.rules" \
  -- gh pr view 123 --json title,body
```

When testing MCP/plugin/skill/hook behavior, isolate config so only the target component is active. If a component must initialize for the run to count, configure it to fail loudly where supported and inspect JSON events or command output.

## CI And Automation

Prefer official Codex automation when it fits. For raw CLI use:

- install or pin Codex explicitly
- check `codex --version`
- set model/config explicitly when needed
- use `--cd "$GITHUB_WORKSPACE"`
- choose explicit sandbox and approval policy
- emit `--json` and save artifacts
- scope `CODEX_API_KEY` or `OPENAI_API_KEY` to the single invocation when possible
- never print secrets or config files containing credentials

Example:

```bash
CODEX_API_KEY="$CODEX_API_KEY" \
codex --sandbox workspace-write \
  -c sandbox_workspace_write.network_access=true \
  --ask-for-approval never \
  exec --cd "$GITHUB_WORKSPACE" \
  --json \
  "Review repository state and report high-confidence findings only."
```

## Env And Secrets

Set only env needed for the run.

- Prefer documented auth flows: `codex login`, `codex login status`, or scoped API key env.
- Do not expose API keys job-wide in CI unless unavoidable.
- Do not print `CODEX_HOME` auth files, full config, or environment dumps.
- Report credential presence or absence without values.

## Failure Classes

Name the failure; do not say only "it failed".

- **Missing CLI bootstrap**: `codex` is not installed or not on `PATH`.
- **Missing auth / bootstrap precondition**: `codex login status` fails or required API env is absent.
- **Unsafe autonomy**: `danger-full-access`, `--dangerously-bypass-approvals-and-sandbox`, or legacy bypass aliases used outside a hardened environment.
- **Interactive deadlock**: non-interactive run uses an approval policy that can prompt.
- **Flag placement mismatch**: installed Codex accepts global flags such as `--ask-for-approval` only before `exec`.
- **Config contamination**: user/project `.codex`, hooks, rules, MCP, skills, plugins, profile, or history affected a behavior test.
- **Over-isolation**: temp `CODEX_HOME` hid config/auth needed for a user repro.
- **Wrong working directory**: missing or wrong `--cd` selected the wrong repo/session.
- **Git repo guard**: non-repo run failed without `--skip-git-repo-check`.
- **Network confusion**: expected networked commands failed because the `workspace-write` network config was omitted or unsupported by the installed version.
- **MCP/plugin/skill false positive**: configured component was not actually initialized or used.
- **Tool/file effect issue**: final text did not match actual JSON events or filesystem state.
- **Version drift**: docs mention flags/features missing from installed help.

## Evidence And Reporting

Collect the smallest complete evidence set for the claim.

| Claim | Evidence |
| --- | --- |
| Installed capability | `codex --version`, relevant `--help`, official doc comparison |
| Generic runtime | real `codex exec`, exit status, JSON/final output, no auth/sandbox failure |
| Isolated behavior | `CODEX_HOME`, `--ignore-user-config`, `--ignore-rules`, temp project, sandbox/approval flags |
| Tool/file compatibility | JSON events, command output, changed files, or output artifact |
| Sandbox/approval behavior | explicit sandbox, approval policy, expected allow/deny outcome |
| Skill/plugin/MCP behavior | config source plus runtime initialization/use evidence |
| CI/fresh install | install method, version, scoped credential presence, command and artifacts |

Report:

- scenario run
- exact commands with secrets redacted
- installed version and command path when relevant
- layers preserved, isolated, or bootstrapped
- sandbox and approval settings
- pass/fail for each step
- key output snippets and failure class

## Common Mistakes

- Using `--full-auto` from old notes instead of explicit sandbox/approval flags.
- Using `danger-full-access`, `--dangerously-bypass-approvals-and-sandbox`, or legacy bypass aliases outside a disposable external sandbox.
- Forgetting `--cd` and testing the wrong project.
- Letting user/project config, hooks, rules, MCP, skills, or plugins leak into behavior tests.
- Over-isolating and then reporting a user-specific repro cannot be reproduced.
- Treating final prose as proof of tool use or file effects.
- Running non-interactively with a policy that can request approval.
- Forgetting `-c sandbox_workspace_write.network_access=true` for Codex helper runs that may need networked commands.
- Printing API keys, auth files, config, JSON events, or env dumps containing secrets.
