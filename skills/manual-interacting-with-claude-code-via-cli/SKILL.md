---
name: manual-interacting-with-claude-code-via-cli
description: >-
  ALWAYS LOAD THIS SKILL WHEN USER ASKS TO CHECK, VERIFY, SMOKE-TEST,
  REPRODUCE, OR RUN SOMETHING THROUGH `claude` OR Claude Code CLI, OR WHEN A
  PLAN CONTAINS A STEP TO VERIFY THROUGH Claude Code. Use for non-interactive
  `claude -p`, background agent checks, permission/config isolation, subagent,
  skill, MCP, plugin, worktree, and wrapper-sensitive Claude Code CLI verification.
license: MIT
metadata:
  focus: claude-code-cli-verification
  tags: testing, verification, operations
---

# Interacting With Claude Code Via CLI

Workflow skill for evidence-based manual verification through real `claude` commands.

Use this as a companion to `manual-testing` when runtime proof depends on Claude Code CLI behavior.

References:

- CLI: `https://code.claude.com/docs/en/cli-reference`
- Settings: `https://code.claude.com/docs/en/settings`
- Permissions: `https://code.claude.com/docs/en/agent-sdk/permissions.md`
- Subagents: `https://code.claude.com/docs/en/sub-agents`
- Agent view/background agents: `https://code.claude.com/docs/en/agent-view`
- Worktrees: `https://code.claude.com/docs/en/cli-reference.md`
- Skills: `https://code.claude.com/docs/en/skills`

## Core Rule

Choose isolation and permissions by scenario, not by habit.

- Preserve user Claude Code setup when Claude is only a helper agent or user-specific repro.
- Isolate aggressively when testing Claude Code behavior, plugins, skills, MCP, permissions, settings, or subagents.
- Prefer least privilege: `dontAsk`, narrow tools, `acceptEdits`, or isolated worktrees before bypass modes.
- Use `--dangerously-skip-permissions` or `bypassPermissions` only inside externally isolated disposable environments, such as containers or VMs, or when user/instructions explicitly allow this.
- Treat `claude --help` as useful but incomplete; compare installed-version help with official docs.
- Never claim tool, skill, MCP, plugin, or permission behavior without fresh command output.

## Scenario Matrix

| Scenario | Default posture | Typical command |
| --- | --- | --- |
| Helper agent for a separate task | Preserve user auth, config, skills, plugins, MCP, and defaults | `claude -p ... --output-format json` |
| Less project-biased helper answer | Preserve user/global setup, but run in a temp or explicit directory | `claude -p ... --add-dir <dir>` |
| Scripted/CI-style reproducible run | Use `--bare`, explicit settings/model/tools, and no session persistence when needed | `claude --bare -p ...` |
| Tool-call verification | Require deterministic tool use and inspect stream/debug evidence | `--output-format stream-json --verbose` |
| Read-only review or research | Use `dontAsk` with allowed read-only tools or restricted `--tools` | `--permission-mode dontAsk --allowedTools ...` |
| Editing smoke test | Use temp repo/worktree plus `acceptEdits` or narrow allow rules | `claude --worktree <name> -p ...` |
| Permission behavior test | Isolate settings/config and vary one permission source at a time | `CLAUDE_CONFIG_DIR=... claude --settings ...` |
| Subagent behavior test | Use `--agent` or `--agents`; prove prompt/tool limits in output | `claude --agent <name> -p ...` |
| MCP/plugin/config test | Use explicit config paths and debug/stream evidence | `--mcp-config ... --strict-mcp-config --plugin-dir ...` |
| Background agents/agent view | Version-gate against local `claude --help`; docs may be ahead of install | `claude --bg`, `claude logs <id>` when supported |
| User-specific repro | Start from the exact failing command, then remove layers one at a time | original command first |

## Command Selection

Start by checking the installed command and version when behavior matters:

```bash
type -a claude
claude --version
claude --help
claude auth status --text
```

Use the user's normal `claude` command for helper-agent work and user-specific repros. Use strict isolation only when the task is about Claude Code behavior itself or when inherited config would contaminate the result.

If `type -a claude` shows a wrapper or alias, treat wrapper behavior as part of helper-agent and user-repro scenarios. For Claude Code behavior tests, compare the wrapper with the direct binary when practical and report which command path produced the evidence.

In non-interactive `-p` mode, invalid settings files may be ignored by some Claude Code versions. When testing settings behavior, use a minimal known-valid inline JSON or validate settings separately, then confirm the intended setting affected runtime behavior.

For complex prompts, prefer prompt files or stdin-safe input instead of fragile shell quoting.

## Isolation Building Blocks

Claude Code settings merge across scopes; a session override does not automatically erase everything else.

| Layer | Isolation control |
| --- | --- |
| Working directory | Run from a temp project, use `--add-dir` intentionally, or use `--worktree` for write isolation |
| User/project/local settings | `--setting-sources user,project,local` to choose scopes |
| Session settings | `--settings <file-or-json>` for temporary overrides |
| Config/session state | `CLAUDE_CONFIG_DIR="$tmp/claude-config"` for config, credentials, sessions, jobs, and daemon state |
| Process home | temp `HOME` only for stronger isolation; it may break OAuth/keychain expectations |
| Project instructions and hooks | `--bare` skips hooks, plugin sync, auto memory, background prefetches, keychain reads, and `CLAUDE.md` auto-discovery |
| Tools | `--tools` restricts available tools; `--allowedTools` pre-approves; `--disallowedTools` denies/removes |
| Permissions | `--permission-mode default|dontAsk|acceptEdits|plan|auto|bypassPermissions` |
| MCP | `--mcp-config` plus `--strict-mcp-config` for explicit MCP scope |
| Plugins | `--plugin-dir <path>` for local plugin tests |
| Session persistence | `--no-session-persistence` when resume/history must not be written |

Minimal locked-down non-interactive pattern:

```bash
claude --bare -p "Check repository status and report facts only" \
  --permission-mode dontAsk \
  --allowedTools "Read,Glob,Grep,Bash(git status *)" \
  --output-format json
```

Strict temp-state pattern:

```bash
tmp="$(mktemp -d /tmp/claude-cli-test.XXXXXX)"
mkdir -p "$tmp/claude-config" "$tmp/project"

CLAUDE_CONFIG_DIR="$tmp/claude-config" \
claude --bare -p "Reply with exactly: ok" \
  --permission-mode dontAsk \
  --output-format json
```

If real paid-provider auth is needed, preserve only the needed auth source and isolate unrelated project config, hooks, skills, plugins, MCP, and sessions.

## Helper Agent Runs

Use this when Claude Code is just another AI helper.

Default: preserve the user's normal setup.

```bash
claude -p "Research this question and report concise findings: <task>" \
  --output-format json
```

Use `--bare`, temp config, or restricted tools only when the helper should not inherit the current project's rules or tools.

For background shell jobs on versions without native background commands: redirect output, store the PID, and verify the process ended before resuming the session. Treat `--bg`, `claude logs`, `claude attach`, and `claude stop` as version-dependent examples from newer docs; use them only after installed `claude --help` confirms support. If only `claude agents` is available, use that installed command's help and behavior instead.

## Checking A Generic Run

Use this when the task is simply generation through `claude -p`.

```bash
claude -p "Reply with exactly: ok" --output-format json
```

For scripted pipelines, consider:

```bash
claude --bare -p "Summarize this repository at a high level" \
  --permission-mode dontAsk \
  --allowedTools "Read,Glob,Grep,Bash(git status *)" \
  --output-format json \
  --no-session-persistence
```

Verify exit code, final response, model/session metadata where present, and absence of permission or auth failures.

## Checking Tool Calls

Use this when tool compatibility matters.

- Do not rely on a generic prompt and hope Claude uses tools.
- Require a deterministic tool action, such as reading a local file or running a safe `git status`.
- Use `--output-format stream-json --verbose` or `--debug-file` and inspect actual tool invocation/result evidence.
- Do not claim tool compatibility from final text alone.

Pattern:

```bash
claude -p "Read ./README.md and report only its first heading." \
  --output-format stream-json \
  --verbose
```

## Checking Permissions

Use permission modes deliberately:

| Mode | Use |
| --- | --- |
| `dontAsk` | Headless locked-down runs where unapproved tools should fail instead of prompt |
| `plan` | Read-only planning or review |
| `acceptEdits` | File-editing checks in an isolated workspace |
| `auto` | Local interactive-ish flows where classifier behavior is acceptable |
| `bypassPermissions` / `--dangerously-skip-permissions` | Only inside externally isolated disposable environments |

Remember:

- `--allowedTools` pre-approves; it does not fully constrain all modes.
- `--tools` restricts available built-in tools.
- `--disallowedTools` and settings deny rules are stronger negative controls.
- Parent bypass/accept modes can affect subagents; do not grant broad permissions to subagents casually.

## Checking Subagents, Skills, MCP, And Plugins

Subagents:

```bash
claude --agents '{"reviewer":{"description":"Reviews code","prompt":"Report only high-confidence issues","tools":["Read","Grep","Glob"],"model":"inherit"}}' \
  --agent reviewer \
  -p "Review the README for broken instructions only." \
  --output-format json
```

Skills:

- Verify discovery or behavior in the target environment.
- Be careful with `-p`: interactive slash commands and user-invoked skills may not behave like interactive mode.
- `--bare` minimizes auto-loaded context but may still allow explicit `/skill-name` resolution in some versions; `--disable-slash-commands` is the stronger switch when the test needs skills disabled.
- Prefer prompts that naturally trigger the skill and inspect stream/debug evidence when the claim depends on loading.

MCP and plugins:

```bash
claude -p "Use the configured MCP server only if available and report status." \
  --mcp-config ./mcp.json \
  --strict-mcp-config \
  --output-format stream-json \
  --verbose
```

For local plugins, add `--plugin-dir ./path/to/plugin` and keep unrelated plugins/settings isolated.

## Worktree Isolation

Use `--worktree <name>` or a manual git worktree when Claude may edit files and parallel runs could overlap.

```bash
claude --worktree claude-cli-smoke \
  -p "Make an isolated test change and report the diff." \
  --permission-mode acceptEdits \
  --output-format json
```

Check whether the installed Claude Code version creates, names, and cleans worktrees the way the docs describe. Do not leave non-empty worktrees behind without reporting them.

## Env And Secrets

Set only env needed for the run.

- Prefer documented auth flows and project-provided env sources.
- Do not print settings files, debug logs, or environment values that may contain secrets.
- Report that credentials were present or absent, not their values.
- Be explicit when `--bare` changes auth behavior by skipping OAuth/keychain reads.

## Failure Classes

Name the failure; do not say only "it failed".

- **Missing auth / bootstrap precondition**: `claude auth status` fails or required API env is absent.
- **Version mismatch**: docs mention a flag or command missing from installed `claude --help`.
- **Wrapper contamination**: `claude` on `PATH` injects env, config, aliases, or flags during a behavior test.
- **Ignored settings**: invalid settings input was silently ignored in non-interactive mode.
- **Over-isolation**: helper run bypassed user config/auth that should be part of the scenario.
- **Isolation leak**: project/user hooks, skills, plugins, MCP, settings, `CLAUDE.md`, or sessions affected a behavior test.
- **Permission deadlock**: headless run needed approval but could not prompt.
- **Tool execution issue**: final text appears normal but expected tool calls did not run.
- **Subagent/scope issue**: agent prompt, tools, permissions, or isolation did not apply as intended.
- **Skill/plugin/MCP issue**: discovery or initialization worked differently from runtime behavior.

## Evidence And Reporting

Collect the smallest complete evidence set for the claim.

| Claim | Evidence |
| --- | --- |
| Installed capability | `claude --version` and relevant `--help`/official doc comparison |
| Generic runtime | real `claude -p`, output format, exit status, no auth/permission failure |
| Isolated behavior | isolated layers used, settings/config sources, command path/version |
| Tool compatibility | stream/debug evidence of actual tool invocation and result |
| Permission behavior | mode, allow/deny/tool settings, expected allow/deny outcome |
| Subagent behavior | agent definition/source, tool/model/permission constraints, output evidence |
| Skill/plugin/MCP behavior | discovery/init evidence plus runtime use evidence |
| Worktree isolation | worktree path/name, changed files, cleanup state |

Report:

- scenario run
- exact commands with secrets redacted
- installed version and command path when relevant
- layers preserved, isolated, or bootstrapped
- pass/fail for each step
- key output snippets and failure class

## Common Mistakes

- Treating final text as proof of tool, skill, MCP, or plugin use.
- Defaulting to `--dangerously-skip-permissions` from old helper notes.
- Assuming `claude --help` is complete or that docs match the installed version.
- Confusing `claude agents` subagent listing with newer agent-view/background-session commands.
- Forgetting `--bare` changes auth and context loading behavior.
- Assuming `--settings` resets all config instead of layering with selected scopes.
- Running write-capable parallel jobs without worktree isolation.
- Leaving worktrees or temp config/session artifacts behind without reporting them.
- Printing secrets from env, settings, auth, stream events, or debug logs.
