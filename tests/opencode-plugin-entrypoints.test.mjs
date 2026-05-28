import test from 'node:test';
import assert from 'node:assert/strict';

test('OpenCode plugin entrypoints export only plugin functions', async () => {
  const modules = [
    await import('../.opencode/plugins/index.js'),
    await import('../.opencode/plugins/using-my-skills/index.js'),
    await import('../.opencode/plugins/gpt5-style-helper/index.js'),
  ];

  for (const module of modules) {
    const nonFunctions = Object.entries(module)
      .filter(([, value]) => typeof value !== 'function')
      .map(([name]) => name);

    assert.deepEqual(nonFunctions, []);
  }
});
