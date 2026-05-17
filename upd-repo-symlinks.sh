#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
SKILLS_DIR="$REPO_ROOT/skills"

for target_dir in "$REPO_ROOT/.agents/skills" "$REPO_ROOT/.claude/skills"; do
  mkdir -p "$target_dir"

  for skill in "$SKILLS_DIR"/*/; do
    skill_name="$(basename "$skill")"
    link="$target_dir/$skill_name"
    rel_target="../../skills/$skill_name"

    if [ -L "$link" ] && [ "$(readlink "$link")" = "$rel_target" ]; then
      continue
    fi

    ln -sfn "$rel_target" "$link"
    echo "  $link -> $rel_target"
  done
done

echo "Done."
