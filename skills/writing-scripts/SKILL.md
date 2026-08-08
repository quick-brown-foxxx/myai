---
name: writing-scripts
description: >-
  ALWAYS LOAD THIS SKILL WHEN CREATING ANY STANDALONE SINGLE-FILE SCRIPT, AUTOMATION,
  OR TINY CLI TOOL FOR ANY LANGUAGE OR ECOSYSTEM. Do not create scripts directly — use this skill first.
  Single-file script patterns: when to use scripts vs projects, script layout, script body structure,
  CLI conventions, graceful shutdown, and ecosystem-specific examples for Python and TypeScript/Node.
license: MIT
metadata:
  focus: single-file-scripts
  tags: scripts, cli, automation
---

# Writing Scripts

## Prerequisites

Load `engineering-principles` before this skill. It provides the foundation:
strict types, validation at boundaries, explicit errors, and
principle-over-prescription (ceremony scales with task size). This skill adds
concrete script patterns: the script-or-project decision, layout conventions,
body structure, and CLI/signal handling defaults.

## When to Use a Single Script vs Full Project

| Single Script | Full Project |
|---------------|--------------|
| One task, one file | Multiple features |
| No tests needed | Tests required |
| Templating / generation / automation | Application with UI or API |
| Run directly from source | Run via task runner or build step |
| Dependencies inline or in a minimal header | Dependencies in project manifest |
| Under ~500 lines | Will grow beyond ~500 lines |

If criteria lean toward "Full Project," start with a project
layout instead. See `setting-up-projects`.

## Script Layout

Supporting files live alongside the single script. Keep a minimal tool-config
manifest with only linter and type checker settings — no project metadata or
dependency declarations (those live inline in the script).

```text
app/
├── script                  # Self-contained, directly executable
├── template.ext            # Templates (if generating text)
├── schema.ext              # Validation schema (if validating configs)
├── configs/                # Configuration files (if multiple needed)
├── tool-config             # Linter + type checker config only (no project section)
└── .gitignore
```

## Script Body Structure

Organize every script in four clearly separated sections:

```text
# =============================================================================
# Constants & Types
# =============================================================================

(all type definitions, constants, configuration defaults)

# =============================================================================
# Utils & Helpers
# =============================================================================

(small self-contained helpers that not contain any business logic)

# =============================================================================
# Business Logic
# =============================================================================

(pure functions: load, transform, validate, process — no I/O at the bottom,
 no CLI/presentation at the top)

# =============================================================================
# CLI Interface
# =============================================================================

(thin CLI adapter: parse input → call business logic → format output → exit)
```

The CLI section is a thin adapter: parse arguments, call one business
function or a small pipeline, map the result to stdout/stderr and exit code.
Do not spread argument parsing, I/O, and business logic across the file.

## CLI Conventions

- **Always support `-h`** in addition to `--help`. Most CLI frameworks
  default to `--help`-only. Override to also accept `-h`.
- **Use the ecosystem's good CLI library**: typer for Python, commander
  or yargs for Node, etc. Use the standard-library argument parser only when
  external dependencies are impossible.
- **Map errors to exit codes explicitly**. Expected failures from business
  logic produce non-zero exit codes with a user-readable message to stderr.
- **Keep the CLI adapter thin** — it decodes input, calls core, and formats
  output. No business logic in argument handlers.

## Graceful Shutdown

Scripts must not dump tracebacks on Ctrl+C. Catch the interrupt signal and
exit cleanly:

- **Unix convention**: exit code 130 (128 + signal 2 for SIGINT)
- **No traceback**: the user pressed Ctrl+C intentionally — show nothing
  or a brief "Interrupted" message
- **Subprocess cleanup**: if the script spawns subprocesses, use process
  groups so Ctrl+C kills the entire tree, not just the parent

If a subprocess runs a long-lived tool, escalate: friendly signal first
(SIGTERM), wait with timeout, force kill (SIGKILL) if unresponsive. See
`setting-up-projects` for detailed shutdown patterns.

## Ecosystem Examples

### Python

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.14"
# dependencies = [
#     "typer>=0.12.0",
#     "rusty-results>=1.1.1",
# ]
# ///

import sys
from pathlib import Path
from typing import Final

import typer
from rusty_results import Result, Ok, Err

# =============================================================================
# Constants & Types
# =============================================================================

TEMPLATE_PATH: Final[Path] = Path(__file__).parent / "template.html"

# =============================================================================
# Helpers
# =============================================================================

def _run(command: list[str], cwd: Path) -> None:
    subprocess.run(command, cwd=cwd, check=True)

# =============================================================================
# Business Logic
# =============================================================================

def load_config(path: Path) -> Result[str, str]:
    if not path.exists():
        return Err(f"Config not found: {path}")
    return Ok(path.read_text())

def process(config: str) -> Result[str, str]:
    return Ok(config.upper())

def do_work() -> Result[str, str]:
    config = load_config(Path("config.toml"))
    if config.is_err:
        return Err(config.unwrap_err())
    return process(config.unwrap())

# =============================================================================
# CLI Interface
# =============================================================================

app = typer.Typer(
    help="Description",
    add_completion=False,
    context_settings={"help_option_names": ["-h", "--help"]},
)

@app.command()
def main_command() -> None:
    result = do_work()
    if result.is_err:
        typer.echo(f"Error: {result.unwrap_err()}", err=True)
        sys.exit(1)
    typer.echo(result.unwrap())

if __name__ == "__main__":
    try:
        app()
    except KeyboardInterrupt:
        sys.exit(130)
```

**Python tool config** (pyproject.toml, no `[project]` section):

```toml
[tool.basedpyright]
typeCheckingMode = "strict"
reportAny = "error"

[tool.ruff]
line-length = 120

[tool.ruff.lint]
extend-select = ["E", "F", "I", "N", "UP", "S", "B", "A", "C4", "RUF"]
```

- Use **PEP 723** inline metadata for dependencies (`# /// script` block).
- Execute with `uv run --script` or `./script.py` (requires the shebang).
- Use **typer** for CLI (stdlib **argparse** only for no-dependency scripts).
- See `writing-python-code` for full Python type and error handling rules.

### TypeScript / Bun

```typescript
#!/usr/bin/env bun

// Bun auto-installs dependencies on first run — no package.json needed.
// Just import what you need.

import { program } from "commander";
import { ok, err, Result } from "neverthrow";
import { z } from "zod";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// =============================================================================
// Constants & Types
// =============================================================================

const TEMPLATE_PATH = resolve(import.meta.dir, "template.html");

const ConfigSchema = z.object({
  name: z.string(),
});

type Config = z.infer<typeof ConfigSchema>;

// =============================================================================
// Business Logic
// =============================================================================

function loadConfig(path: string): Result<Config, string> {
  if (!existsSync(path)) {
    return err(`Config not found: ${path}`);
  }
  const raw = readFileSync(path, "utf-8");
  const parsed = ConfigSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return err(`Invalid config: ${parsed.error.message}`);
  }
  return ok(parsed.data);
}

function process(config: Config): Result<string, string> {
  return ok(config.name.toUpperCase());
}

function doWork(): Result<string, string> {
  const config = loadConfig("config.json");
  if (config.isErr()) {
    return err(config.error);
  }
  return process(config.value);
}

// =============================================================================
// CLI Interface
// =============================================================================

program
  .name("script")
  .description("Description")
  .helpOption("-h, --help", "Show help")
  .action(() => {
    const result = doWork();
    if (result.isErr()) {
      console.error(`Error: ${result.error}`);
      process.exit(1);
    }
    console.log(result.value);
  });

program.parse();
```

**Bun tool config** (tsconfig.json, optional — only needed for IDE type checking):

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"]
  }
}
```

- Use **Bun** as the default runtime — zero-config TypeScript, auto-installs
  npm dependencies on first run, no `package.json` or build step needed.
- Use **commander** or **yargs** for CLI parsing.
- Use a runtime schema validator (e.g., zod, valibot) for validation at the
  file/config boundary — this example uses zod.
- Use **neverthrow** or a custom Result type for expected errors.
- Use `import.meta.dir` (Bun built-in) instead of `__dirname` for script-relative paths.
- For scripts that must run under Node instead, use **tsx** or
  `node myscript.ts` with a minimal `package.json`. Verify
  current Node native type-stripping limitations (erasable syntax only, no
  `tsconfig`-dependent behavior) before choosing it for a script.

These defaults apply to single-file scripts only. Maintained application
projects should follow `setting-up-typescript-projects` for their own runtime,
package-manager, and schema decisions.

## Handoff

- Use `setting-up-projects` when the script grows beyond ~500 lines or needs
  tests and a full project layout.
- Use `writing-python-code` (Python) for type system, error handling, and
  async patterns that apply to scripts too.

## Related myai Skills

- **`engineering-principles`** — Parent skill. Language-agnostic philosophy.
- **`setting-up-projects`** — When a script outgrows single-file scope.
