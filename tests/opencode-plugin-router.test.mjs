import test from 'node:test';
import assert from 'node:assert/strict';

import {
  Gpt5StyleHelperPlugin,
  UsingMySkillsPlugin,
} from '../.opencode/plugins/index.js';

test('root router enables using-my-skills by default and allows disabling it', async () => {
  const enabled = await UsingMySkillsPlugin({}, {});
  const disabled = await UsingMySkillsPlugin({}, { usingMySkills: { enabled: false } });

  assert.equal(typeof enabled.config, 'function');
  assert.equal(typeof enabled['experimental.chat.messages.transform'], 'function');
  assert.deepEqual(disabled, {});
});

test('root router keeps GPT-5 helper opt-in and forwards its options', async () => {
  const disabled = await Gpt5StyleHelperPlugin({}, {});
  const enabled = await Gpt5StyleHelperPlugin({}, {
    gpt5StyleHelper: {
      enabled: true,
      baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
      tokenInterval: 123,
      turnInterval: 7,
    },
  });

  assert.deepEqual(disabled, {});
  assert.equal(typeof enabled['experimental.chat.system.transform'], 'function');
  assert.equal(typeof enabled['experimental.chat.messages.transform'], 'function');
});

test('package exports point root to router and preserve explicit plugin subpaths', async () => {
  const packageJson = await import('../package.json', { with: { type: 'json' } });

  assert.equal(packageJson.default.main, '.opencode/plugins/index.js');
  assert.equal(packageJson.default.exports['.'], './.opencode/plugins/index.js');
  assert.equal(packageJson.default.exports['./using-my-skills'], './.opencode/plugins/using-my-skills/index.js');
  assert.equal(packageJson.default.exports['./gpt5-style-helper'], './.opencode/plugins/gpt5-style-helper/index.js');
});
