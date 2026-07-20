/**
 * skill-lint.js — shared, unit-testable skill validation rules.
 *
 * Adapted from Addy Osmani's agent-skills validator at commit
 * 2fbfa004a0192529bc997d103fc12f19a3804aab. This keeps the upstream split
 * between a thin CLI and a rules library while adapting it to this repository's
 * ESM package, real YAML frontmatter, flat skill layout, and local tag policy.
 */

import fs from 'node:fs';
import path from 'node:path';

import { parseDocument } from 'yaml';

const MAX_DESCRIPTION_LENGTH = 1024;
const LOWERCASE_KEBAB_SOURCE = String.raw`[a-z0-9]+(?:-[a-z0-9]+)*`;
const KEBAB_CASE = new RegExp(`^${LOWERCASE_KEBAB_SOURCE}$`);
const BACKTICKED_SKILL_NAME = `\`(${LOWERCASE_KEBAB_SOURCE})\``;

// Local descriptions use ordinary "Use when/for …" clauses and stronger
// "ALWAYS LOAD/USE … WHEN/BEFORE/AT …" routing directives.
const DESCRIPTION_TRIGGER =
  /\b(?:use|load)(?: this(?: skill)?)? (?:when|before|after|during|for)\b|\balways (?:load|use)(?: this(?: skill)?)? (?:(?:when|before|after|during|for)\b|at\b)/i;
const DESCRIPTION_TRIGGER_NEGATE =
  /\b(?:do not|don't|never) (?:use|load)(?: this(?: skill)?)? (?:when|before|after|during|for)\b/gi;

// These intentionally narrow patterns avoid treating every backticked token as
// a skill reference. Unknown references are warnings because external skill
// references may be intentional.
const SKILL_REF_PATTERNS = [
  new RegExp(
    String.raw`\b(?:load|use|follow|invoke)(?: the)? ` +
      BACKTICKED_SKILL_NAME +
      String.raw`(?=\s+(?:first\b|next\b|before\b|after\b|when\b))`,
    'gi',
  ),
  new RegExp(String.raw`\buse the ` + BACKTICKED_SKILL_NAME + String.raw` skill`, 'gi'),
  new RegExp(String.raw`\bfollow the ` + BACKTICKED_SKILL_NAME + String.raw` skill`, 'gi'),
  new RegExp(String.raw`\binvoke the ` + BACKTICKED_SKILL_NAME + String.raw` skill`, 'gi'),
  new RegExp(String.raw`\bcontinue with ` + BACKTICKED_SKILL_NAME, 'gi'),
  new RegExp(String.raw`\buse ` + BACKTICKED_SKILL_NAME + String.raw` skill`, 'gi'),
  new RegExp(BACKTICKED_SKILL_NAME + String.raw` skill\b`, 'gi'),
  new RegExp(String.raw`\bsee ` + BACKTICKED_SKILL_NAME, 'gi'),
  new RegExp(String.raw`→ ` + BACKTICKED_SKILL_NAME, 'g'),
];

function stripFencedCodeBlocks(content) {
  const lines = content.split(/\r?\n/);
  const proseLines = [];
  let openFence = null;

  for (const line of lines) {
    if (openFence === null) {
      const opener = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
      if (opener && !(opener[1][0] === '`' && opener[2].includes('`'))) {
        openFence = { marker: opener[1][0], length: opener[1].length };
        continue;
      }
      proseLines.push(line);
      continue;
    }

    const closer = line.match(/^ {0,3}(`+|~+)[ \t]*$/);
    if (
      closer &&
      closer[1][0] === openFence.marker &&
      closer[1].length >= openFence.length
    ) {
      openFence = null;
    }
  }

  return proseLines.join('\n');
}

/** Parse a frontmatter mapping from the start of a Markdown document. */
export function parseFrontmatter(content) {
  const match = content.match(
    /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/,
  );
  if (!match) return null;

  const document = parseDocument(match[1], {
    prettyErrors: false,
    uniqueKeys: true,
  });
  if (document.errors.length > 0) {
    throw new Error(document.errors[0].message.replace(/\s+/g, ' ').trim());
  }

  const frontmatter = document.toJS();
  if (
    frontmatter === null ||
    typeof frontmatter !== 'object' ||
    Array.isArray(frontmatter)
  ) {
    throw new Error('frontmatter must be a YAML mapping');
  }
  return frontmatter;
}

/** Collect conservative, explicit cross-skill references from prose. */
export function extractSkillReferences(content) {
  const refs = new Set();
  const proseContent = stripFencedCodeBlocks(content);

  for (const pattern of SKILL_REF_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(proseContent)) !== null) {
      refs.add(match[1]);
    }
  }
  return refs;
}

function validateDescription(description, errors) {
  if (typeof description !== 'string' || description.trim() === '') {
    errors.push("Frontmatter field 'description' must be a non-empty string");
    return;
  }

  const codePointLength = [...description].length;
  if (codePointLength > MAX_DESCRIPTION_LENGTH) {
    errors.push(
      `Description is ${codePointLength} Unicode code points — exceeds the ` +
        `${MAX_DESCRIPTION_LENGTH}-code-point portable limit`,
    );
  }

  const descriptionWithoutNegatedTriggers = description.replace(
    DESCRIPTION_TRIGGER_NEGATE,
    '',
  );
  if (!DESCRIPTION_TRIGGER.test(descriptionWithoutNegatedTriggers)) {
    errors.push(
      "Description has no trigger-oriented 'when to use' clause (for example, " +
        '"Use when …" or "ALWAYS LOAD THIS SKILL WHEN …")',
    );
  }
}

function validateTags(metadata, errors) {
  if (
    metadata === null ||
    typeof metadata !== 'object' ||
    Array.isArray(metadata) ||
    !Object.hasOwn(metadata, 'tags')
  ) {
    errors.push(
      "Frontmatter missing required field: 'metadata.tags' (comma-separated string)",
    );
    return;
  }

  const rawTags = metadata.tags;
  if (typeof rawTags !== 'string') {
    errors.push("Frontmatter field 'metadata.tags' must be a comma-separated string");
    return;
  }

  if (rawTags.trim() === '') {
    errors.push("Frontmatter field 'metadata.tags' must contain 1 to 4 non-empty tags");
    return;
  }

  const tags = rawTags.split(',').map((tag) => tag.trim());
  if (tags.length < 1 || tags.length > 4) {
    errors.push(
      `Frontmatter field 'metadata.tags' must contain 1 to 4 tags (found ${tags.length})`,
    );
  }
  if (tags.some((tag) => tag === '')) {
    errors.push("Frontmatter field 'metadata.tags' contains an empty tag");
  }

  for (const tag of tags) {
    if (tag !== '' && !KEBAB_CASE.test(tag)) {
      errors.push(`Tag '${tag}' is not lowercase kebab-case`);
    }
  }

  const duplicates = [...new Set(tags.filter((tag, index) => tags.indexOf(tag) !== index))].sort();
  for (const duplicate of duplicates) {
    errors.push(`Duplicate tag: '${duplicate}'`);
  }

  const canonicalTags = tags.join(', ');
  if (rawTags !== canonicalTags) {
    errors.push(
      `Frontmatter field 'metadata.tags' must use canonical comma-space formatting: '${canonicalTags}'`,
    );
  }
}

/** Lint already-read SKILL.md content without filesystem access. */
export function lintSkillContent(dirName, content, knownSkills = new Set()) {
  const errors = [];
  const warnings = [];

  let frontmatter;
  try {
    frontmatter = parseFrontmatter(content);
  } catch (error) {
    errors.push(`Invalid YAML frontmatter: ${error.message}`);
    return { errors, warnings };
  }

  if (!frontmatter) {
    errors.push(
      'Missing or malformed YAML frontmatter (expected a --- block at the top of the file)',
    );
    return { errors, warnings };
  }

  if (typeof frontmatter.name !== 'string' || frontmatter.name.trim() === '') {
    errors.push("Frontmatter field 'name' must be a non-empty string");
  } else if (frontmatter.name !== dirName) {
    errors.push(
      `Frontmatter name '${frontmatter.name}' does not match directory name '${dirName}'`,
    );
  }

  if (!KEBAB_CASE.test(dirName)) {
    errors.push(`Directory name '${dirName}' is not lowercase kebab-case`);
  }

  validateDescription(frontmatter.description, errors);
  validateTags(frontmatter.metadata, errors);

  const refs = [...extractSkillReferences(content)].sort();
  for (const ref of refs) {
    if (!knownSkills.has(ref)) {
      warnings.push(`Unknown cross-skill reference: \`${ref}\` is not a known local skill`);
    }
  }

  return { errors, warnings };
}

function findNestedSkillFiles(skillDir) {
  const nestedSkillFiles = [];

  function visit(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const entryPath = path.join(currentDir, entry.name);
      if (
        entry.name === 'SKILL.md' &&
        (entry.isFile() || entry.isSymbolicLink())
      ) {
        nestedSkillFiles.push(path.relative(skillDir, entryPath));
      } else if (!entry.isSymbolicLink() && entry.isDirectory()) {
        visit(entryPath);
      }
    }
  }

  for (const entry of fs.readdirSync(skillDir, { withFileTypes: true })) {
    if (!entry.isSymbolicLink() && entry.isDirectory()) {
      visit(path.join(skillDir, entry.name));
    }
  }
  return nestedSkillFiles.sort();
}

function isPathWithin(parentPath, candidatePath) {
  const relativePath = path.relative(parentPath, candidatePath);
  return (
    relativePath === '' ||
    (!relativePath.startsWith(`..${path.sep}`) &&
      relativePath !== '..' &&
      !path.isAbsolute(relativePath))
  );
}

/** Discover regular skill directories plus symlink candidates that must be rejected. */
export function discoverSkillDirectories(skillsDir) {
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return {
    candidateNames: entries
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => entry.name)
      .sort(),
    knownSkills: new Set(
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    ),
  };
}

/** Read and lint one canonical skills/<name>/SKILL.md directory. */
export function lintSkill(dirName, skillsDir, knownSkills) {
  const skillDir = path.join(skillsDir, dirName);
  const skillPath = path.join(skillDir, 'SKILL.md');

  let skillDirStat;
  try {
    skillDirStat = fs.lstatSync(skillDir);
  } catch (error) {
    return {
      errors: [`Unreadable skill directory: ${error.message}`],
      warnings: [],
    };
  }
  if (skillDirStat.isSymbolicLink() || !skillDirStat.isDirectory()) {
    return {
      errors: ['Canonical skill directory must be a regular directory, not a symlink'],
      warnings: [],
    };
  }

  let realSkillsDir;
  let realSkillDir;
  try {
    realSkillsDir = fs.realpathSync(skillsDir);
    realSkillDir = fs.realpathSync(skillDir);
  } catch (error) {
    return {
      errors: [`Cannot resolve canonical skill directory: ${error.message}`],
      warnings: [],
    };
  }
  if (!isPathWithin(realSkillsDir, realSkillDir)) {
    return {
      errors: ['Canonical skill directory resolves outside skills/'],
      warnings: [],
    };
  }

  const layoutErrors = findNestedSkillFiles(skillDir).map(
    (nestedPath) =>
      `Nested SKILL.md is not canonical; expected only skills/${dirName}/SKILL.md ` +
      `(found skills/${dirName}/${nestedPath})`,
  );

  let skillPathStat;
  try {
    skillPathStat = fs.lstatSync(skillPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      return {
        errors: [`Unreadable SKILL.md: ${error.message}`, ...layoutErrors],
        warnings: [],
      };
    }
    return {
      errors: ['Missing exact canonical file: SKILL.md', ...layoutErrors],
      warnings: [],
    };
  }

  if (skillPathStat.isSymbolicLink() || !skillPathStat.isFile()) {
    return {
      errors: [
        'Canonical SKILL.md must be a regular non-symlink file in its skill directory',
        ...layoutErrors,
      ],
      warnings: [],
    };
  }

  let realSkillPath;
  try {
    realSkillPath = fs.realpathSync(skillPath);
  } catch (error) {
    return {
      errors: [`Cannot resolve canonical SKILL.md: ${error.message}`, ...layoutErrors],
      warnings: [],
    };
  }
  if (
    !isPathWithin(realSkillDir, realSkillPath) ||
    path.dirname(realSkillPath) !== realSkillDir
  ) {
    return {
      errors: [
        'Canonical SKILL.md resolves outside its expected skill directory',
        ...layoutErrors,
      ],
      warnings: [],
    };
  }

  let content;
  try {
    content = fs.readFileSync(skillPath, 'utf8');
  } catch (error) {
    return {
      errors: [`Unreadable SKILL.md: ${error.message}`, ...layoutErrors],
      warnings: [],
    };
  }

  const result = lintSkillContent(dirName, content, knownSkills);
  result.errors.push(...layoutErrors);
  return result;
}
