---
name: ai-edge-research
description: >
  Research what's actually trending in AI among practitioners — not what SEO and marketing say is trending.
  Use this skill whenever the user wants to research current AI trends, tools, frameworks, agents, models,
  techniques, or practices and wants results that reflect what real builders are adopting, not what content
  farms and listicles promote. Trigger on any request like "what's trending in AI", "what are people
  actually using for X", "what's the latest in AI agents/frameworks/models", "research current AI tools",
  "what should I look at in the AI space", or any AI topic research where recency and practitioner signal
  matter. Also trigger when the user mentions "edge research", "cutting edge AI", "what's new in AI",
  or wants to avoid SEO-biased results. This skill is specifically designed to cut through the AI hype
  machine and find what practitioners on the bleeding edge are actually building with.
---

# AI Edge Research

Research what's actually happening in AI — optimized for practitioner signal, not marketing noise.

Standard web search for AI topics is heavily polluted with SEO listicles, AI-generated content about AI,
and marketing from tools that invested in content 6-12 months ago. Real practitioner signal lives in
community platforms where builders share what they're actually using.

Before starting, read `references/source-seeds.md` for Telegram channel and Twitter practitioner
seed lists to use alongside the methods below.

## Core Principle

**This is a guide, not a script.** Adapt your approach to the topic, scope, and available tool budget.
A narrow question ("what's the best local embedding model right now") needs 3-5 targeted searches.
A broad sweep ("what's new in AI agents") needs 10-20+ across multiple sources. Use judgment.

## Sources & Methods

### Hacker News (Algolia API) — highest signal for tools people are shipping

Query `http://hn.algolia.com/api/v1/` directly via `web_fetch`. No auth needed, returns JSON.

Key endpoints and parameters:
- `search?query=X&tags=show_hn&numericFilters=created_at_i>TIMESTAMP` — Show HN posts (people shipping things, highest signal)
- `search?query=X&tags=story&numericFilters=points>30,created_at_i>TIMESTAMP` — high-engagement stories
- `search_by_date?query=X&tags=story&numericFilters=created_at_i>TIMESTAMP` — recent stories by date
- `tags=ask_hn` — people asking what to use (good landscape snapshot)
- Use `hitsPerPage=20`, `numericFilters` with Unix timestamps (1 week = 604800s, 1 month = 2592000s, 3 months = 7776000s)

From results, extract: `title`, `url`, `points`, `num_comments`, `created_at`, `objectID` (→ `news.ycombinator.com/item?id={objectID}`).
For interesting stories, fetch the HN discussion page — practitioner opinions in comments are often more valuable than the linked article.

Signal: Show HN >100 points = strong. Ask HN >50 comments = tool landscape goldmine. High comments + low points = controversial but interesting.

### GitHub — star velocity matters more than total stars

- Search for `github.com/trending?since=weekly` or `monthly`, then fetch the page
- `web_search` for `github.com [topic] stars:>500 created:>YYYY-MM-DD`
- A repo gaining 2K stars this week > a repo with 50K total but flat growth

When you find a promising repo, quickly check: created date, external contributors (not just author), last commit, license (permissive = more adoption).

### Reddit Practitioner Subreddits

Search these via `web_search` with `reddit r/[subreddit] [topic] [current year]` or `site:reddit.com/r/[subreddit] [topic]`:

- **r/LocalLLaMA** — local models, deployment, quantization, hardware
- **r/MachineLearning** — research trends, papers, techniques
- **r/vibecoding** — AI coding tools, agents, IDE integrations
- **r/ClaudeAI** — Claude ecosystem, Claude Code, MCP usage
- **r/ChatGPTCoding** — AI coding workflows, tool comparisons
- **r/mcp** — Model Context Protocol, MCP servers, integrations

Prioritize subreddits relevant to the specific topic rather than always hitting all of them.
Best posts: "I built X with Y", "I switched from X to Y because...", "after 3 months of using X...", benchmark comparisons.

### Twitter/X — degraded but still has signal

Twitter's API is locked down, so the primary method is `web_search` with `site:x.com`:
- `site:x.com [topic] [current year]`
- `site:x.com [practitioner handle] [topic]`
- `[topic] "I've been using" OR "I switched to" site:x.com`

See `references/source-seeds.md` for a seed list of AI practitioners worth checking directly.

### Telegram Public Channels — one more practitioner community

Public channels have a web preview at `https://t.me/s/<channel>` showing ~20 recent posts.
Use `web_fetch` on that URL to scan recent content.
Also: `web_search` with `site:t.me/s/<channel> [keywords]` to find indexed older posts.

Alternative access methods: RSS via RSSHub (`rsshub.app/telegram/channel/<name>`)
or RSS-Bridge (`rss-bridge.org/bridge01/?action=display&bridge=Telegram&format=Mrss&username=<name>`).
Sometimes they might work better or worse than raw web access approach.

See `references/source-seeds.md` for the seed channel list. Do a quick health check before relying
on any channel: is the last post within 2 weeks? If not, skip it.

### Complementary Sources

- **hype.replicate.dev** — aggregated trending AI/ML content with engagement scores
- **Papers With Code** / **Arxiv** — for technique-level trends (not product-level)
- General web search with practitioner signal terms: `[topic] "I've been using" OR "I switched to" OR "in production" site:news.ycombinator.com OR site:reddit.com`

## What to Ignore

- "Top N AI Tools in 202X" listicles
- Product landing pages and marketing blogs
- SEO-optimized aggregator sites
- AI-generated roundup articles
- YouTube "review" videos that are sponsored content

If a tool already appears in multiple listicles, it's 3-6 months past its "edge" moment. Still worth
mentioning as established, but it's not a new finding.

## Cross-Referencing & Triangulation

For each tool/framework/technique found, consider:

1. **Source diversity**: How many independent source types mentioned it? (HN + Reddit + GitHub = strong. Single source = flag it.)
2. **Practitioner vs marketing**: Is the signal from builders or marketers? Red flags: polished landing page, no public repo, only found in listicles. Green flags: Show HN by the author, real GitHub issues from external users, production experience reports.
3. **Adoption trajectory**: Is it being compared TO something established (rising challenger)? Is it being compared FROM something established (people migrating away)?
4. **Marketing lag**: If already in listicles → stale signal. If only in practitioner channels → fresher signal but less proven. Sweet spot: discussed in HN/Reddit but NOT yet in listicles.

## Categorization

Use these tiers as a rough guide — not every finding needs a rigid score, and items can sit between tiers:

| Tier | Typical Profile |
|------|----------------|
| 🔴 **Bleeding Edge** | 0-3 weeks in discourse. 1-2 practitioner mentions, <500 GH stars, no tutorials exist yet. Worth watching, not adopting. |
| 🟠 **Rising** | 3-8 weeks. Multi-community discussion, 500-5K GH stars with high velocity. First "how to" posts appearing. Worth trying as early adopter. |
| 🟡 **Establishing** | 2-3 months. Production use cases reported, "X vs Y" comparisons appearing, 5K+ GH stars with sustained growth. Safe to evaluate for production. |
| 🟢 **Battle-Tested** | 3+ months. Documented production use, stable releases, considered the default for its niche. In this report because it's still recent or had a significant update. A 🟢 with strong upward momentum = established tool experiencing renewed hype. |

Also note **⚠️ Declining / Overhyped** when you see: migration-away stories, abandoned repos, negative sentiment shift, still in listicles but practitioners moved on.

When in doubt, err toward the less-hyped tier. Never label something 🟢 without clear production evidence.

## Output

Adapt the report format to the query. A narrow topic might just need a focused list. A broad sweep warrants sections by tier. Always include:

- What was found, where it was found, and a candid assessment
- The tier classification
- Anything found in one community but absent from others (unique signal)
- Things that are declining or overhyped (saves the user time)
- Which sources were actually consulted and any limitations hit

Don't force a rigid template — the goal is to give the user a clear, honest picture of the landscape that they couldn't have gotten from a Google search.
