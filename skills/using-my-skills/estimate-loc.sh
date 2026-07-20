#!/usr/bin/env bash

set -euo pipefail

git ls-files -z --cached --others --exclude-standard \
| while IFS= read -r -d '' f; do
  # Skip symlinks, including symlinked dirs like tools/mytool -> src/mytool
  [ -L "$f" ] && continue
  # Skip deleted/missing/non-regular files
  [ -f "$f" ] || continue

  case "$f" in
    *.tsx) lang="React/TSX" ;;
    *.jsx) lang="React/JSX" ;;
    *.ts) lang="TypeScript" ;;
    *.js|*.mjs|*.cjs) lang="JavaScript" ;;
    *.vue) lang="Vue" ;;
    *.svelte) lang="Svelte" ;;
    *.py) lang="Python" ;;
    *.go) lang="Go" ;;
    *.rs) lang="Rust" ;;
    *.java) lang="Java" ;;
    *.cs) lang="C#" ;;
    *.php) lang="PHP" ;;
    *.rb) lang="Ruby" ;;
    *.kt|*.kts) lang="Kotlin" ;;
    *.swift) lang="Swift" ;;
    *.c|*.h) lang="C" ;;
    *.cpp|*.cc|*.cxx|*.hpp|*.hh|*.hxx) lang="C++" ;;
    *.html) lang="HTML" ;;
    *.css|*.scss|*.sass|*.less) lang="CSS" ;;
    *.sql) lang="SQL" ;;
    *.sh|*.bash|*.zsh) lang="Shell" ;;
    *.yaml|*.yml) lang="YAML" ;;
    *.json) lang="JSON" ;;
    *.md|*.mdx) lang="Markdown/MDX" ;;
    *) continue ;;
  esac

  lines=$(wc -l < "$f" 2>/dev/null || echo 0)
  printf '%s\t%s\n' "$lang" "$lines"
done \
| awk -F '\t' '{sum[$1]+=$2} END {for (k in sum) print sum[k], k}' \
| sort -nr \
| head -10