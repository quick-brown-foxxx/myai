# Agent Instructions

This repository maintains a personal AI skill set, bootstrap adapters, and the
documents that explain how those skills compose into workflows.

## Always Start Here

For the public overview, install commands, and install-oriented catalog, read
@README.md

For canonical skill architecture, workflow composition, stage guidance, tag
policy, compatibility notes, and the full skill catalog, read @skills/README.md

For the philosophy behind skills, workflows, agent roles, and orchestration
layers, read @SKILLS-PHILOSOPHY.md

For engineering values used by coding, architecture, testing, and tooling skills,
read @ENGINEERING-PHILOSOPHY.md

For migration state, source consolidation decisions, remaining cleanup, and
deferred work, read @docs/skill-set-consolidation.md

When touching future autonomous orchestration, read @docs/my-workflow-draft.md.

## Repository Layout

```text
myai/
|-- skills/                 Canonical skill source. Keep this directory flat.
|   |-- README.md            Canonical skill map, catalog, workflows, tags.
|   |-- AGENTS.md            Router back to the skill map for AGENTS-aware tools.
|   `-- <skill>/SKILL.md     Canonical skill files, plus optional references/scripts.
|-- .agents/skills/         Generated/symlinked mirror.
|-- .claude/skills/         Generated/symlinked mirror.
|-- .opencode/plugins/      OpenCode bootstrap plugin source.
|-- .claude-plugin/         Claude plugin metadata.
|-- hooks/                  Claude-style session bootstrap hooks.
|-- docs/                   Current status, notes, and drafts.
|-- AGENTS.md               Operational instructions for agents in this repo.
|-- README.md               Human-facing overview and install-oriented catalog.
|-- SKILLS-PHILOSOPHY.md    Skill and workflow philosophy.
|-- ENGINEERING-PHILOSOPHY.md
|-- TODO.md                 Scratch backlog, not canonical policy.
|-- package.json            Package entrypoint for the OpenCode plugin.
|-- upd-repo-symlinks.sh    Refreshes skill mirrors.
```

`skills/` is intentionally flat because the current mirror script and common
skill loaders expect each immediate child directory to be a skill directory with
its own `SKILL.md`.

Some skills carry support files under their own directory, such as
`skills/visual-mockups/scripts/` or `skills/ai-edge-research/references/`. Keep
skill-specific assets colocated with the owning skill.

Generated or non-canonical paths:

```text
.agents/skills/<skill-name> -> ../../skills/<skill-name>
.claude/skills/<skill-name> -> ../../skills/<skill-name>
.opencode/node_modules/ and .opencode/package*.json are local plugin deps
.tmp/ is ignored scratch/source-import space
```

## Skill Maintenance Rules

When creating or editing skills:

- Use `how-to-write-skills` before editing any `SKILL.md`.
- Keep every skill directory name globally unique.
- Keep every canonical skill at `skills/<skill-name>/SKILL.md`.
- Keep skill support files inside the owning skill directory.
- Do not manually edit `.agents/skills` or `.claude/skills` unless explicitly
  asked; treat them as generated mirrors of `skills/`.
- Run `./upd-repo-symlinks.sh` after adding, removing, or renaming canonical
  skill directories. The script creates and updates mirror symlinks; when a skill
  is removed or renamed, also check for stale generated mirror links and remove
  only those stale links deliberately.
- Update `skills/README.md` when adding, removing, renaming, or substantially
  changing a skill's role, workflow relationships, or tags.
- Use `metadata.tags` in skill frontmatter as a comma-separated string, following
  the tag policy in `skills/README.md`.
- Update `README.md` when public install instructions, plugin usage, or the
  install-oriented catalog changes.
- Update `docs/skill-set-consolidation.md` when migration state or remaining
  plans change.
- Update this `AGENTS.md` when repository operations, canonical sources,
  generated paths, or agent maintenance rules change.

Before changing catalogs, compare the canonical inventory from `skills/*/SKILL.md`
against both catalogs:

```text
skills/README.md   -> source-of-truth catalog and workflow map
README.md          -> public/install-oriented catalog summary
skills/using-my-skills/SKILL.md -> bootstrap skill that should list all workflows (but not atomic/independent/self-contained/task-specific skills)
```

Current canonical inventory is 35 skills. If that count changes, update the
catalogs and mirror directories in the same change.

## Bootstrap Adapter Rules

`using-my-skills` is the local bootstrap skill. Bootstrap adapters inject it at
session start; they do not install the full skill set.

```text
OpenCode package entrypoint -> package.json -> .opencode/plugins/using-my-skills.js
Claude plugin metadata      -> .claude-plugin/plugin.json and marketplace.json
Claude-style hook           -> hooks/hooks.json -> hooks/session-start
```

When editing bootstrap behavior:

- Edit `skills/using-my-skills/SKILL.md` for bootstrap content.
- Edit `.opencode/plugins/using-my-skills.js` only for OpenCode injection logic.
- Edit `hooks/session-start` only for Claude-style hook output.
- Keep the injected `MYAI_SKILLS_BOOTSTRAP` marker stable unless all adapters and
  docs are updated together.
- Preserve the rule that injected sessions do not need to load
  `using-my-skills` again.

## Workflow Control

`skills/README.md` contains workflows and stage maps.
`skills/using-my-skills/SKILL.md` contains the current role routing: big
sessions use `Teamlead -> Teammates -> Subagents`; bounded or default sessions
use `Orchestrator -> Subagents`.

Load the skill that governs the current phase. Do not load the whole catalog up
front, and do not duplicate the full catalog inside individual skills.

Phase transitions should be explicit:

```text
human / Teamlead / Orchestrator decides next phase
        |
        v
agent loads the skills needed for that phase
        |
        v
agent reports evidence, blockers, and next options
```

The future long-running `mega-workflow` is out of scope for current skill edits.
Keep current work focused on atomic skills and composable short workflows.

Prefer local canonical skill names from `skills/`. External or inherited skill
references must be intentional and documented in `docs/skill-set-consolidation.md`.

## Verification Expectations

Before claiming documentation or skill maintenance is complete:

- Check the relevant diff.
- Verify changed skill names exist under `skills/`.
- Verify catalogs still match canonical skills when the inventory changes.
- Run lightweight formatting or syntax checks that fit the changed files.
- State any checks that were skipped and why.

## Documentation And Text Writing Style

Prefer rich markdown structure with diagrams, maps, compact tables, and short
sections over long flat tables or deeply nested bullets when writing docs.
Structure should help both humans and AI agents understand how ideas connect.
