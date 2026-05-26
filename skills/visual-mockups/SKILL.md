---
name: visual-mockups
description: >-
  Browser-based interactive mockups, wireframes, and diagrams for UI exploration
  during brainstorming. Use when discussing layouts, visual design decisions,
  architecture diagrams, or any question where seeing options is better than
  describing them in text. Not for purely conceptual or text-based questions.
metadata:
  tags: planning, design
---

## When to Use

**Use the browser** when the content itself is visual:

- UI mockups and wireframes — layouts, navigation, component placement
- Architecture diagrams — system components, data flow, relationship maps
- Side-by-side visual comparisons — comparing two layouts or design directions
- Design polish — look and feel, spacing, visual hierarchy
- Spatial relationships — state machines, flowcharts, entity relationships

**Use the chat** when the content is text or tabular:

- Requirements questions, tradeoff lists, conceptual A/B choices
- Technical decisions (API design, data modeling)
- Clarifying questions where the answer is words, not visuals

A question *about* a UI topic is not automatically visual. "What kind of wizard?" is conceptual. "Which wizard layout feels right?" is visual.

## Quick Start

```bash
# Start server (project files persist under .superpowers/visual-mockups/)
scripts/start-server.sh --project-dir /path/to/project
```

Returns JSON with URL, `screen_dir`, and `state_dir`. Tell the user to open the URL.

Different platforms may need different flags:
- **macOS/Linux (Claude Code):** Default mode works — script backgrounds itself
- **Windows (Git Bash):** Use `--foreground` since Windows reaps background processes
- **Remote/containerized:** Pass `--host 0.0.0.0 --url-host localhost` for external browser access
- **Codex:** Auto-detected, runs in foreground automatically
- **Gemini CLI:** Use `--foreground`

If the URL is unreachable, bind to `0.0.0.0` and expose via `--url-host`.

## Content Fragments vs Full Documents

Write **content fragments** by default — just the HTML inside the page:

```html
<h2>Which layout works better?</h2>
<p class="subtitle">Consider readability and visual hierarchy</p>

<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Single Column</h3>
      <p>Clean, focused reading experience</p>
    </div>
  </div>
  <div class="option" data-choice="b" onclick="toggleSelect(this)">
    <div class="letter">B</div>
    <div class="content">
      <h3>Two Column</h3>
      <p>Sidebar navigation with main content</p>
    </div>
  </div>
</div>
```

The server auto-wraps fragments in the frame template (header, CSS theme, selection indicator, interactive JS). Only write full `<html>` documents when you need complete control — rare.

## Interaction Loop

1. **Check server is alive**, then write HTML to a new file in `screen_dir`:
   - Check `$STATE_DIR/server-info` exists (if not, server shut down — restart)
   - Use semantic filenames: `layout.html`, `visual-style.html`
   - **Never reuse filenames** — each screen gets a fresh filename

2. **Tell user to look and respond in the chat:**
   - Remind them of the URL
   - Brief text summary of what's on screen
   - "Take a look and let me know what you think."

3. **On next turn**, read `$STATE_DIR/events` for browser interactions, merge with chat response. The chat message is primary feedback; events provide structured data (clicks, selections).

4. **Iterate or advance** — if feedback changes the current screen, write a new file (e.g., `layout-v2.html`).

5. **Unload when returning to chat** — push a waiting screen to clear stale content:
   ```html
   <div style="display:flex;align-items:center;justify-content:center;min-height:60vh">
     <p class="subtitle">Continuing in chat...</p>
   </div>
   ```

6. Repeat until done.

## CSS Classes Available

The frame template provides these styles for your content fragments:

### Options (A/B/C choices)
```html
<div class="options">
  <div class="option" data-choice="a" onclick="toggleSelect(this)">
    <div class="letter">A</div>
    <div class="content">
      <h3>Title</h3>
      <p>Description</p>
    </div>
  </div>
</div>
```
Add `data-multiselect` to the container for multi-select.

### Cards (visual designs)
```html
<div class="cards">
  <div class="card" data-choice="design1" onclick="toggleSelect(this)">
    <div class="card-image"><!-- mockup content --></div>
    <div class="card-body"><h3>Name</h3><p>Description</p></div>
  </div>
</div>
```

### Mockup container, Split view, Pros/Cons
```html
<div class="mockup"><div class="mockup-header">Preview</div><div class="mockup-body"><!-- content --></div></div>
<div class="split"><div class="mockup"><!-- left --></div><div class="mockup"><!-- right --></div></div>
<div class="pros-cons"><div class="pros"><h4>Pros</h4><ul><li>X</li></ul></div><div class="cons"><h4>Cons</h4><ul><li>Y</li></ul></div></div>
```

### Wireframe building blocks
```html
<div class="mock-nav">Logo | Home | About</div>
<div class="mock-sidebar">Navigation</div>
<div class="mock-content">Main content</div>
<button class="mock-button">Action</button>
<input class="mock-input" placeholder="Input">
<div class="placeholder">Placeholder area</div>
```

### Typography
`h2` = page title, `h3` = section heading, `.subtitle` = secondary text, `.section` = content block, `.label` = small uppercase label.

## Design Tips

- Scale fidelity to the question — wireframes for layout, polish for look-and-feel questions
- 2-4 options max per screen
- Use real content when it matters (Unsplash for images, real text for copy)
- Explain the question on each page — "Which layout feels more professional?" not just "Pick one"
- Keep mockups simple — focus on structure, not pixel-perfect design

## Cleaning Up

```bash
scripts/stop-server.sh $SESSION_DIR
```

If the session used `--project-dir`, mockup files persist in `.superpowers/visual-mockups/` for later reference. Only `/tmp` sessions are deleted on stop.

## Browser Events

When the user clicks options, interactions are recorded to `$STATE_DIR/events` as JSON lines:

```jsonl
{"type":"click","choice":"a","text":"Option A - Simple Layout","timestamp":1706000101}
{"type":"click","choice":"b","text":"Option B - Hybrid","timestamp":1706000115}
```

The full event stream shows the user's exploration path. Last `choice` is typically the final selection. If `$STATE_DIR/events` doesn't exist, the user didn't interact with the browser — use only their chat text. The file is cleared when you push a new screen.

## Related Skills

- **`brainstorming`** — The primary context for visual mockups. Use during the spec-creation phase when UI questions arise.
- **`idea-sharpening`** — If you're still exploring what to build, do that first before reaching for mockups.
