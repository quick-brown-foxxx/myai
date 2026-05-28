import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  debugEnvVar,
  resolveBootstrapSkill,
} from '../.opencode/plugins/using-my-skills-core.js';

test('resolver prefers OPENCODE_CONFIG_DIR skill over bundled fallback and logs the selected source', async (t) => {
  /*
  Scenario: A bootstrap skill is installed in the active OpenCode config dir
    Given the plugin package has a bundled fallback skill
    And OPENCODE_CONFIG_DIR contains an installed using-my-skills skill
    When the bootstrap resolver runs with debug logging enabled
    Then the installed OpenCode config-dir skill is selected instead of the bundled fallback
    And the debug log names the selected file without printing skill content
  */
  const root = await makeTempRoot(t);
  const bundled = path.join(root, 'package', 'skills', 'using-my-skills', 'SKILL.md');
  const configDir = path.join(root, 'opencode-config');
  const installed = path.join(configDir, 'skills', 'using-my-skills', 'SKILL.md');

  await writeSkill(bundled, 'BUNDLED_MARKER');
  await writeSkill(installed, 'CONFIG_DIR_MARKER');

  const logs = [];
  const resolved = resolveBootstrapSkill({
    cwd: path.join(root, 'project'),
    worktree: path.join(root, 'project'),
    bundledSkillPath: bundled,
    env: {
      HOME: path.join(root, 'home'),
      XDG_CONFIG_HOME: path.join(root, 'xdg-config'),
      OPENCODE_CONFIG_DIR: configDir,
      [debugEnvVar]: '1',
    },
    config: {},
    logger: (line) => logs.push(line),
  });

  assert.equal(resolved?.path, installed);
  assert.match(resolved?.content ?? '', /CONFIG_DIR_MARKER/);
  assert.ok(logs.some((line) => line.includes('selected') && line.includes(installed)));
  assert.ok(!logs.some((line) => line.includes('CONFIG_DIR_MARKER')));
});

test('resolver lets configured skills.paths override config-dir skills and resolves relative paths from cwd', async (t) => {
  /*
  Scenario: A config-provided skills.paths directory contains using-my-skills
    Given OPENCODE_CONFIG_DIR contains one using-my-skills skill
    And the merged OpenCode config has a relative skills.paths entry with another using-my-skills skill
    When the bootstrap resolver runs from the project directory
    Then the skills.paths skill wins because OpenCode scans configured skill paths after config dirs
  */
  const root = await makeTempRoot(t);
  const project = path.join(root, 'project');
  const bundled = path.join(root, 'package', 'skills', 'using-my-skills', 'SKILL.md');
  const configDirSkill = path.join(root, 'opencode-config', 'skills', 'using-my-skills', 'SKILL.md');
  const configuredPathSkill = path.join(project, 'custom-skills', 'team', 'using-my-skills', 'SKILL.md');

  await fs.promises.mkdir(project, { recursive: true });
  await writeSkill(bundled, 'BUNDLED_MARKER');
  await writeSkill(configDirSkill, 'CONFIG_DIR_MARKER');
  await writeSkill(configuredPathSkill, 'SKILLS_PATH_MARKER');

  const resolved = resolveBootstrapSkill({
    cwd: project,
    worktree: project,
    bundledSkillPath: bundled,
    env: {
      HOME: path.join(root, 'home'),
      XDG_CONFIG_HOME: path.join(root, 'xdg-config'),
      OPENCODE_CONFIG_DIR: path.join(root, 'opencode-config'),
    },
    config: {
      skills: {
        paths: ['custom-skills'],
      },
    },
  });

  assert.equal(resolved?.path, configuredPathSkill);
  assert.match(resolved?.content ?? '', /SKILLS_PATH_MARKER/);
});

test('resolver honors external and project-config disable flags', async (t) => {
  /*
  Scenario: OpenCode skill discovery is intentionally disabled for some locations
    Given project .opencode and external .agents skills both contain using-my-skills
    And the matching OpenCode disable flags are set
    When the bootstrap resolver runs
    Then those disabled locations are ignored and the bundled fallback is selected
  */
  const root = await makeTempRoot(t);
  const project = path.join(root, 'project');
  const bundled = path.join(root, 'package', 'skills', 'using-my-skills', 'SKILL.md');
  const projectOpenCodeSkill = path.join(project, '.opencode', 'skills', 'using-my-skills', 'SKILL.md');
  const projectAgentsSkill = path.join(project, '.agents', 'skills', 'using-my-skills', 'SKILL.md');

  await writeSkill(bundled, 'BUNDLED_MARKER');
  await writeSkill(projectOpenCodeSkill, 'PROJECT_OPENCODE_MARKER');
  await writeSkill(projectAgentsSkill, 'PROJECT_AGENTS_MARKER');

  const resolved = resolveBootstrapSkill({
    cwd: project,
    worktree: project,
    bundledSkillPath: bundled,
    env: {
      HOME: path.join(root, 'home'),
      XDG_CONFIG_HOME: path.join(root, 'xdg-config'),
      OPENCODE_DISABLE_PROJECT_CONFIG: '1',
      OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
    },
    config: {},
  });

  assert.equal(resolved?.path, bundled);
  assert.match(resolved?.content ?? '', /BUNDLED_MARKER/);
});

async function makeTempRoot(t) {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'myai-resolver-test-'));
  t.after(() => fs.promises.rm(root, { recursive: true, force: true }));
  return root;
}

async function writeSkill(filePath, marker) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(
    filePath,
    [
      '---',
      'name: using-my-skills',
      'description: Test bootstrap skill',
      '---',
      '',
      `# ${marker}`,
      '',
      `Loaded marker: ${marker}`,
      '',
    ].join('\n'),
    'utf8',
  );
}
