import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  discoverSkillDirectories,
  extractSkillReferences,
  lintSkill,
  lintSkillContent,
  parseFrontmatter,
} from '../scripts/lib/skill-lint.js';

const knownSkills = new Set(['sample-skill', 'known-skill']);

function skillContent({
  name = 'sample-skill',
  description = 'Use when validating a sample skill.',
  tags = 'quality, verification',
  body = '# Sample\n\nArbitrary guidance.',
} = {}) {
  return `---\nname: ${name}\ndescription: ${description}\nmetadata:\n  tags: ${tags}\n---\n\n${body}\n`;
}

function descriptionOfCodePointLength(length) {
  const trigger = 'Use when needed. ';
  return trigger + '😀'.repeat(length - [...trigger].length);
}

test('parses folded YAML descriptions and nested metadata.tags', () => {
  const content = `---
name: sample-skill
description: >-
  Helps validate skill files.
  Use when checking portable frontmatter.
metadata:
  tags: quality, verification
---

# Any body
`;

  assert.deepEqual(parseFrontmatter(content), {
    name: 'sample-skill',
    description:
      'Helps validate skill files. Use when checking portable frontmatter.',
    metadata: { tags: 'quality, verification' },
  });
  assert.deepEqual(lintSkillContent('sample-skill', content, knownSkills), {
    errors: [],
    warnings: [],
  });
});

test('enforces description length in Unicode code points at 1024/1025', () => {
  const atLimit = lintSkillContent(
    'sample-skill',
    skillContent({ description: descriptionOfCodePointLength(1024) }),
    knownSkills,
  );
  const overLimit = lintSkillContent(
    'sample-skill',
    skillContent({ description: descriptionOfCodePointLength(1025) }),
    knownSkills,
  );

  assert.deepEqual(atLimit.errors, []);
  assert.match(overLimit.errors[0], /1025 Unicode code points/);
});

test('accepts trigger forms used by this repository', () => {
  const descriptions = [
    'Use when reviewing a skill.',
    'Use before reviewing a skill.',
    'Use after reviewing a skill.',
    'Use during review of a skill.',
    'Use for release workflows and update automation.',
    'Load when reviewing a skill.',
    'ALWAYS LOAD THIS SKILL WHEN REVIEWING SKILLS.',
    'ALWAYS LOAD THIS BEFORE REVIEWING SKILLS.',
    'ALWAYS load this at the beginning of a new session.',
    'ALWAYS USE when reviewing skills.',
  ];

  for (const description of descriptions) {
    const result = lintSkillContent(
      'sample-skill',
      skillContent({ description }),
      knownSkills,
    );
    assert.deepEqual(result.errors, [], description);
  }
});

test('rejects descriptions with only a negated trigger', () => {
  const result = lintSkillContent(
    'sample-skill',
    skillContent({ description: 'Do not use when checking ordinary prose.' }),
    knownSkills,
  );

  assert.equal(result.errors.length, 1);
  assert.match(result.errors[0], /no trigger-oriented/);
});

test('requires a non-empty string description but has no 200-character rule', () => {
  const longPortableDescription =
    'Use when checking a description. ' + 'x'.repeat(250);
  assert.deepEqual(
    lintSkillContent(
      'sample-skill',
      skillContent({ description: longPortableDescription }),
      knownSkills,
    ).errors,
    [],
  );

  const content = skillContent().replace(
    'description: Use when validating a sample skill.',
    'description: 42',
  );
  assert.match(
    lintSkillContent('sample-skill', content, knownSkills).errors[0],
    /non-empty string/,
  );
});

test('enforces local metadata.tags rules', () => {
  const cases = [
    {
      tags: '[quality, verification]',
      expected: /must be a comma-separated string/,
    },
    { tags: 'quality,', expected: /contains an empty tag/ },
    { tags: 'Quality', expected: /not lowercase kebab-case/ },
    { tags: 'quality, quality', expected: /Duplicate tag/ },
    { tags: 'quality,verification', expected: /comma-space formatting/ },
    {
      tags: 'one, two, three, four, five',
      expected: /must contain 1 to 4 tags \(found 5\)/,
    },
  ];

  for (const { tags, expected } of cases) {
    const result = lintSkillContent(
      'sample-skill',
      skillContent({ tags }),
      knownSkills,
    );
    assert.ok(result.errors.some((error) => expected.test(error)), tags);
  }

  const missingMetadata = skillContent().replace(
    'metadata:\n  tags: quality, verification\n',
    '',
  );
  assert.match(
    lintSkillContent('sample-skill', missingMetadata, knownSkills).errors[0],
    /metadata\.tags/,
  );
});

test('does not require any body sections', () => {
  const result = lintSkillContent(
    'sample-skill',
    skillContent({ body: '# Bespoke Structure\n\nNo standard sections.' }),
    knownSkills,
  );

  assert.deepEqual(result.errors, []);
  assert.ok(result.errors.every((error) => !error.includes('required section')));
});

test('rejects malformed YAML and name/directory mismatches', () => {
  const malformed = skillContent().replace(
    'tags: quality, verification',
    'tags: [quality',
  );
  assert.match(
    lintSkillContent('sample-skill', malformed, knownSkills).errors[0],
    /Invalid YAML frontmatter/,
  );

  const mismatch = lintSkillContent(
    'Bad_Name',
    skillContent(),
    knownSkills,
  );
  assert.ok(mismatch.errors.some((error) => error.includes('does not match')));
  assert.ok(mismatch.errors.some((error) => error.includes('lowercase kebab-case')));
});

test('rejects duplicate YAML keys and non-mapping frontmatter', () => {
  const duplicateName = skillContent().replace(
    'name: sample-skill',
    'name: sample-skill\nname: other-skill',
  );
  assert.match(
    lintSkillContent('sample-skill', duplicateName, knownSkills).errors[0],
    /Invalid YAML frontmatter: Map keys must be unique/,
  );

  const sequenceFrontmatter = `---
- sample-skill
---

# Sample
`;
  assert.match(
    lintSkillContent('sample-skill', sequenceFrontmatter, knownSkills).errors[0],
    /frontmatter must be a YAML mapping/,
  );
});

test('warns conservatively for unknown explicit references and ignores code fences', () => {
  const content = skillContent({
    body: [
      'Use the `known-skill` skill.',
      'See `missing-skill` for the next step.',
      '```md',
      'Use the `example-skill` skill.',
      '```',
    ].join('\n'),
  });

  assert.deepEqual([...extractSkillReferences(content)].sort(), [
    'known-skill',
    'missing-skill',
  ]);
  assert.deepEqual(lintSkillContent('sample-skill', content, knownSkills).warnings, [
    'Unknown cross-skill reference: `missing-skill` is not a known local skill',
  ]);
});

test('extracts explicit load, use, follow, and invoke references without requiring skill suffix', () => {
  const content = skillContent({
    body: [
      'Load `missing-load` before this skill.',
      'Use `missing-use` first.',
      'Follow the `missing-follow` next.',
      'Invoke `missing-invoke` when escalation is needed.',
      'A bare token such as `not-a-reference` remains ordinary prose.',
      'Use `pydantic` at the validation boundary.',
    ].join('\n'),
  });

  assert.deepEqual([...extractSkillReferences(content)].sort(), [
    'missing-follow',
    'missing-invoke',
    'missing-load',
    'missing-use',
  ]);
});

test('extracts every lowercase-kebab skill-name length accepted by validation', () => {
  for (const name of ['a', 'ab', '1', 'a-1']) {
    const contentForName = skillContent().replace(
      'name: sample-skill',
      `name: '${name}'`,
    );
    assert.deepEqual(
      lintSkillContent(name, contentForName, new Set()).errors,
      [],
      name,
    );
  }

  const content = skillContent({
    body: [
      'Use the `a` skill.',
      'Follow the `ab` skill.',
      'Invoke the `1` skill.',
      'Continue with `a-1`.',
    ].join('\n'),
  });

  assert.deepEqual([...extractSkillReferences(content)].sort(), [
    '1',
    'a',
    'a-1',
    'ab',
  ]);
});

test('requires a routing cue instead of matching bare verb and token sentences', () => {
  const content = skillContent({
    body: [
      'Load `package-name`.',
      'Use `tool-name`.',
      'Follow `document-name`.',
      'Invoke `command-name`.',
    ].join('\n'),
  });

  assert.deepEqual([...extractSkillReferences(content)], []);
});

test('ignores references in CommonMark backtick and tilde fences', () => {
  const content = skillContent({
    body: [
      'Load `outside-reference` before continuing.',
      '   ~~~~md',
      'Use `tilde-example` first.',
      '   ~~~',
      'Invoke `still-in-tilde-fence` next.',
      '   ~~~~~',
      '  ```text',
      'Follow `backtick-example` next.',
      '  ~~~',
      'Load `still-in-backtick-fence` before this skill.',
      '  ````',
    ].join('\n'),
  });

  assert.deepEqual([...extractSkillReferences(content)], ['outside-reference']);
});

test('rejects nested canonical SKILL.md layout', (t) => {
  const skillsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lint-'));
  t.after(() => fs.rmSync(skillsDir, { recursive: true, force: true }));

  const skillDir = path.join(skillsDir, 'sample-skill');
  fs.mkdirSync(path.join(skillDir, 'nested'), { recursive: true });
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent());
  fs.writeFileSync(path.join(skillDir, 'nested', 'SKILL.md'), skillContent());

  const result = lintSkill('sample-skill', skillsDir, knownSkills);
  assert.ok(result.errors.some((error) => error.includes('Nested SKILL.md')));
});

test('reports a nested SKILL.md symlink without traversing symlinked directories', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lint-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  const skillsDir = path.join(rootDir, 'skills');
  const skillDir = path.join(skillsDir, 'sample-skill');
  const nestedDir = path.join(skillDir, 'nested');
  const outsideDir = path.join(rootDir, 'outside');
  fs.mkdirSync(nestedDir, { recursive: true });
  fs.mkdirSync(outsideDir);
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), skillContent());
  fs.writeFileSync(path.join(outsideDir, 'SKILL.md'), skillContent());
  fs.symlinkSync(path.join(outsideDir, 'SKILL.md'), path.join(nestedDir, 'SKILL.md'));
  fs.symlinkSync(outsideDir, path.join(nestedDir, 'linked-directory'));

  const result = lintSkill('sample-skill', skillsDir, knownSkills);
  const nestedErrors = result.errors.filter((error) => error.includes('Nested SKILL.md'));
  assert.equal(nestedErrors.length, 1);
  assert.match(nestedErrors[0], /nested[/\\]SKILL\.md/);
  assert.doesNotMatch(nestedErrors[0], /linked-directory/);
});

test('rejects a canonical SKILL.md symlink that resolves outside its skill directory', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lint-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  const skillsDir = path.join(rootDir, 'skills');
  const skillDir = path.join(skillsDir, 'sample-skill');
  const outsideSkillPath = path.join(rootDir, 'outside-SKILL.md');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(outsideSkillPath, skillContent());
  fs.symlinkSync(outsideSkillPath, path.join(skillDir, 'SKILL.md'));

  const result = lintSkill('sample-skill', skillsDir, knownSkills);
  assert.ok(result.errors.some((error) => error.includes('regular non-symlink file')));
});

test('rejects a symlink used as a canonical skill directory', (t) => {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-lint-'));
  t.after(() => fs.rmSync(rootDir, { recursive: true, force: true }));

  const skillsDir = path.join(rootDir, 'skills');
  const outsideSkillDir = path.join(rootDir, 'outside-skill');
  fs.mkdirSync(skillsDir);
  fs.mkdirSync(outsideSkillDir);
  fs.writeFileSync(path.join(outsideSkillDir, 'SKILL.md'), skillContent());
  fs.symlinkSync(outsideSkillDir, path.join(skillsDir, 'sample-skill'));

  const discovery = discoverSkillDirectories(skillsDir);
  assert.deepEqual(discovery.candidateNames, ['sample-skill']);
  assert.equal(discovery.knownSkills.has('sample-skill'), false);

  const result = lintSkill('sample-skill', skillsDir, knownSkills);
  assert.ok(result.errors.some((error) => error.includes('regular directory')));
});
