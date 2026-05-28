import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  copyOnlyAuth,
  extractText,
  findExistingOpenCodeAuth,
  getOpencodeVersion,
  makeIsolatedDirs,
  makeIsolatedEnv,
  makeOpenCodeConfig,
  packAndInstallPlugin,
  resolveOpenCodeCommand,
  runJson,
  smokeModel,
  spawnCollect,
} from './opencode-smoke-helpers.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Real CLI smoke currently verifies against OpenCode 1.15.0.

test('smoke: packed GPT-5 style helper plugin injects style helper through real opencode CLI', { timeout: 180_000 }, async (t) => {
  /*
  Scenario: OpenCode loads the installed GPT-5 style helper as a separate plugin
    Given a local machine with an existing OpenCode auth file
    And no global/project OpenCode config, skills, plugins, sessions, or cache are reused
    When real opencode run executes with only the GPT-5 helper plugin available
    Then GPT-5 models see the MYAI_GPT5_STYLE_HELPER marker injected by the plugin
  */
  if (process.env.CI) {
    t.skip('local smoke only; CI/CD bootstrap is out of scope');
    return;
  }

  const opencode = await resolveOpenCodeCommand();
  const opencodeVersion = await getOpencodeVersion(opencode);
  if (!opencodeVersion) {
    t.skip('opencode CLI is not available on PATH');
    return;
  }

  const existingAuthPath = await findExistingOpenCodeAuth();
  if (!existingAuthPath) {
    t.skip('local OpenCode auth file was not found; run opencode auth login first');
    return;
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'myai-opencode-gpt5-smoke-'));
  t.after(() => fs.promises.rm(tempDir, { recursive: true, force: true }));

  const dirs = await makeIsolatedDirs(tempDir);
  await copyOnlyAuth(existingAuthPath, dirs.data);

  const installed = await packAndInstallPlugin(repoRoot, tempDir);
  const { packedFiles } = installed;
  const gpt5StyleEntry = installed.resolvePackage('myai/gpt5-style-helper');
  assert.ok(packedFiles.includes('.opencode/plugins/gpt5-style-helper/index.js'));
  assert.ok(packedFiles.includes('.opencode/plugins/gpt5-style-helper/style-helper.md'));
  assert.ok(packedFiles.includes('.opencode/plugins/gpt5-style-helper/style-reminder.md'));
  assert.ok(gpt5StyleEntry.startsWith(path.join(tempDir, 'app')));

  const config = makeOpenCodeConfig([gpt5StyleEntry]);
  const env = makeIsolatedEnv(config, dirs);
  const debugConfig = await runJson(opencode, ['debug', 'config'], { env });

  assert.deepEqual(debugConfig.plugin, [`file://${gpt5StyleEntry}`]);
  assert.deepEqual(debugConfig.plugin_origins, [{
    spec: `file://${gpt5StyleEntry}`,
    source: 'OPENCODE_CONFIG_CONTENT',
    scope: 'local',
  }]);

  const result = await spawnCollect(
    opencode,
    [
      'run',
      '--dir', dirs.project,
      'Reply with exactly one token. If the marker string MYAI_GPT5_STYLE_HELPER appears anywhere in the text you were given, reply MYAI_GPT5_STYLE_PRESENT. Otherwise reply MYAI_GPT5_STYLE_ABSENT.',
      '-m', smokeModel,
      '--format', 'json',
      '--print-logs',
      '--log-level', 'INFO',
    ],
    { env, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
  );

  assert.equal(extractText(result.stdout).trim(), 'MYAI_GPT5_STYLE_PRESENT');
});
