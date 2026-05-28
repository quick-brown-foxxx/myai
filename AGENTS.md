# Agent Instructions

This repository maintains a personal AI skill set and the documents that explain how those skills compose into workflows.

## Always Start Here

For skill architecture, workflow composition, stage guidance, and the full skill
catalog, read @skills/README.md

For the philosophy behind skills, workflows, agent roles, and orchestration
layers, read @SKILLS-PHILOSOPHY.md

For engineering values used by coding, architecture, testing, and tooling skills,
read @ENGINEERING-PHILOSOPHY.md

## Repository Layout

```text
myai/
|-- skills/                 Canonical skill source. Keep this directory flat.
|-- .agents/skills/         Generated/symlinked mirror.
|-- .claude/skills/         Generated/symlinked mirror.
|-- docs/                   Current status, notes, and drafts.
|-- AGENTS.md               Operational instructions for agents in this repo.
|-- SKILLS-PHILOSOPHY.md    Skill and workflow philosophy.
|-- ENGINEERING-PHILOSOPHY.md
|-- upd-repo-symlinks.sh    Refreshes skill mirrors.
```

`skills/` is intentionally flat because the current mirror script and common
skill loaders expect each immediate child directory to be a skill directory with
its own `SKILL.md`.

## Skill Maintenance Rules

When creating or editing skills:

- Use `how-to-write-skills` before editing any `SKILL.md`.
- Keep every skill directory name globally unique.
- Keep every canonical skill at `skills/<skill-name>/SKILL.md`.
- Do not manually edit `.agents/skills` or `.claude/skills` unless explicitly
  asked; treat them as generated mirrors.
- Run `./upd-repo-symlinks.sh` after adding, removing, or renaming canonical
  skill directories.
- Update `skills/README.md` when adding, removing, renaming, or substantially
  changing a skill's role.
- Update `docs/skill-set-consolidation.md` when migration state or remaining
  plans change.

## Workflow Control

`skills/README.md` contains workflows and stage maps.
`skills/using-my-skills/SKILL.md` contains the current role routing: big
sessions use `Teamlead -> Teammates -> Subagents`; bounded or default sessions
use `Orchestrator -> Subagents`.

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

## Documentation And Skill Writing Style

Prefer reach markdown structure with diagrams, maps and so on over long flat
tables or deeply nested bullets when writing any messages/texts/docs.
Reach formatting and structure helps both humans and AI agents to better
expose and understand ideas.
