# AI CLI Skills Research Summary

Research into third-party skills for AI CLIs (Codex, Gemini, OpenCode, Claude) to teach agents how to spawn separate AI processes from shell.

## Key Finding

**No single official skill pack covers all four CLIs comprehensively.** Best material is fragmented across official docs, builtin skills, and select third-party skills.

## Best Candidates by CLI

| CLI | Best Source | Location | Key Strengths |
|-----|-------------|----------|---------------|
| **Claude Code** | `anthropics/claude-code@agent-development` | official, 11K installs | Subagents, permissions, worktree isolation |
| **Claude Code** | `glittercowboy/taches-cc-resources@create-subagents` | third-party, 166 installs | Subagent prompt patterns, orchestration |
| **Gemini CLI** | `google-gemini/gemini-cli/.gemini/skills/async-pr-review` | official builtin | Headless `gemini -p`, background workers, ephemeral worktrees |
| **Codex** | `softaworks/agent-toolkit@codex` | third-party, 3.6K installs | `codex exec`, resume, sandbox modes |
| **OpenCode** | `different-ai/openwork/.opencode/skills/opencode-primitives` | third-party, 621 installs | Skills/plugins/config/permissions reference |

## Critical Commands to Encode

### Claude Code
```bash
claude -p "prompt"                    # Non-interactive
claude --agent <name>                 # Run as specific agent
claude --agents '{"name": {...}}'     # Define agents via JSON
claude --permission-mode <mode>       # default|acceptEdits|plan|auto|dontAsk|bypassPermissions
# Subagent frontmatter: isolation: worktree
```

### Gemini CLI
```bash
gemini -p "prompt"                    # Headless mode
gemini -s                             # Sandbox mode
GEMINI_SANDBOX=docker gemini ...      # Env-based sandbox
@subagent_name                        # Invoke subagent
/shells                               # View background processes
```

### Codex
```bash
codex exec "prompt"                   # Non-interactive
codex exec --ephemeral ...            # No session persistence
codex exec resume --last              # Resume session
--sandbox read-only|workspace-write|danger-full-access
--ask-for-approval never|on-request|untrusted
```

### OpenCode
```bash
opencode run "prompt"                 # Non-interactive
opencode run --format json            # Machine-readable output
opencode run --attach <url>           # Attach to running server
opencode run --dir <path>             # Working directory
opencode run --agent <name>           # Use specific agent
# Agent permissions: permission.task, permission.bash, etc.
```

## Important Patterns

**Gemini async-pr-review skill** is the strongest example of:
- Spawning AI as background shell worker
- Using ephemeral git worktrees for isolation
- Coordinating multiple parallel AI tasks
- Status checking and result aggregation

**Claude subagents** have the most mature isolation model:
- Worktree isolation via `isolation: worktree`
- Tool restrictions via `tools`/`disallowedTools`
- Permission mode inheritance/overrides
- MCP server scoping

## Identified Gaps

1. **No official Codex skill** for external shell-spawn orchestration
2. **No official OpenCode skill** for CLI automation patterns
3. Some third-party skills have stale CLI syntax (verify before reuse)
4. **No unified skill** covering cross-model spawning (Claude → Gemini → Codex workflows)

## Recommendations

1. **Use official upstream docs as base**, cherry-pick from candidates above
2. **Write new first-party skills** rather than importing third-party verbatim
3. **Ground truth all CLI examples** against `claude --help`, `gemini --help`, etc.
4. **Model after Gemini's async-pr-review** for shell-spawn patterns
5. **Model after Claude's subagent docs** for isolation/permission patterns

## Research Method

- `npx skills find` via skills.sh registry
- GitHub API: `gh repo view`, `gh search code`
- Raw file fetches from upstream repos
- Official docs: code.claude.com, opencode.ai, developers.openai.com

## Environment Context

Available locally:
- `claude 2.1.105` ✓
- `opencode 1.14.41` ✓

Not installed:
- `codex` ✗
- `gemini` ✗

---

*Research date: 2026-05-10*
*Scope: skills for spawning separate AI processes, isolation/permissions, workflows*
