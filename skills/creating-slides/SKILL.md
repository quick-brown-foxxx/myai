---
name: creating-slides
description: >-
  Use when the user asks to create slides, a presentation, a deck, or any
  slides-like deliverable. Sets up an open-slide workspace and hands the real
  slide work to open-slide's own auto-installed agent skills. Not for editing
  slide content directly — bootstrap the workspace first, then work together.
metadata:
  tags: domain, design
---

## Overview

Slides are built with [open-slide](https://github.com/1weiho/open-slide), a
slide framework made for agents. It scaffolds a workspace that ships its own
agent skills (`/create-slide`, `/slide-authoring`) and a hot-reload dev server.
Your job is to get that workspace running and rely on those
skills — not to write the slides from scratch.

## Workflow

1. **Scaffold** the open-slide workspace:

   ```bash
   npx @open-slide/cli init -h
   npx @open-slide/cli init <deck-name> [OPTIONS]
   ```

2. **Ask the user where to save the slides** before initializing anything.

3. **Initialize the workspace:**

   - If the target is a **monorepo** — add the deck as a workspace subproject
     using the monorepo's package manager (npm/pnpm/…).
   - If it is **not** a monorepo — create a self-contained subproject, using
     **pnpm by default** unless the environment prefers another manager.

4. **Recommend restarting the session** in the new workspace directory. That
   lets the session auto-load the open-slide skills installed there, which is
   the smoothest path.

5. **Or continue in the current directory.** Then load only what you need to
   understand the workspace:

   - Read the workspace `AGENTS.md` for hard rules.
   - Read the frontmatter (name + description) of every skill under
     `.agents/skills` to learn what is available. Do **not** load full skill
     bodies up front — lazy-load them on demand when a skill becomes relevant.

6. **Start the dev server** with the active package manager
   (`pnpm run dev` or `npm run dev`).

7. **Tell the user the port/URL** where the deck is served.

8. **Work together** — follow open-slide's own skills for authoring,
   reviewing in the browser, and iterating on the deck.

## Notes

This skill is high-level. The concrete deck logic lives in the installed
  open-slide skills; this skill only owns setup and handoff.
