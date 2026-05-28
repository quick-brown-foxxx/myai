import test from 'node:test';
import assert from 'node:assert/strict';

import { createGpt5StyleHelperPlugin } from '../.opencode/plugins/gpt5-style-helper/index.js';
import UsingMySkillsPlugin from '../.opencode/plugins/using-my-skills.js';

// Hook behavior verified against OpenCode 1.15.0.

const textPart = (text, extra = {}) => ({
  id: `part-${Math.random()}`,
  messageID: 'message',
  sessionID: 'session',
  type: 'text',
  text,
  ...extra,
});

const userMessage = (id, modelID, parts) => ({
  info: {
    id,
    role: 'user',
    sessionID: 'session',
    model: { providerID: 'openai', modelID },
  },
  parts,
});

test('injects full style helper into GPT-5 system prompts only once', async () => {
  /*
  Scenario: GPT-5 requests receive the full style helper as system context
    Given a GPT-5 model request
    When OpenCode builds the system prompt
    Then the full style helper is appended once
    And non-GPT-5 models are left untouched
  */
  const plugin = await createGpt5StyleHelperPlugin({ baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url) });
  const hook = plugin['experimental.chat.system.transform'];
  const output = { system: [] };

  await hook({ model: { providerID: 'openai', modelID: 'gpt-5.5' } }, output);
  await hook({ model: { providerID: 'openai', modelID: 'gpt-5.5' } }, output);

  assert.equal(output.system.length, 1);
  assert.match(output.system[0], /MYAI_GPT5_STYLE_HELPER/);

  const otherOutput = { system: [] };
  await hook({ model: { providerID: 'anthropic', modelID: 'claude-sonnet-4-6' } }, otherOutput);
  assert.deepEqual(otherOutput.system, []);
});

test('matches provider-qualified GPT-5 model IDs from OpenCode hooks', async () => {
  /*
  Scenario: OpenCode passes provider-qualified model IDs
    Given a system transform model ID shaped like openai/gpt-5.5
    When OpenCode builds the system prompt
    Then the GPT-5 style helper still applies
  */
  const plugin = await createGpt5StyleHelperPlugin({ baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url) });
  const output = { system: [] };

  await plugin['experimental.chat.system.transform']({ model: { id: 'openai/gpt-5.5' } }, output);

  assert.equal(output.system.length, 1);
  assert.match(output.system[0], /MYAI_GPT5_STYLE_HELPER/);
});

test('adds short reminder near the latest GPT-5 user turn after token threshold', async () => {
  /*
  Scenario: Long GPT-5 chats receive a recent style reminder
    Given a GPT-5 conversation with enough new context since the last reminder
    When OpenCode transforms model messages
    Then a short style reminder is appended to the latest user turn
  */
  const plugin = await createGpt5StyleHelperPlugin({
    baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
    tokenInterval: 10,
    turnInterval: 99,
  });
  const hook = plugin['experimental.chat.messages.transform'];
  const latest = userMessage('u2', 'gpt-5.5', [textPart('latest')]);
  const output = {
    messages: [
      userMessage('u1', 'gpt-5.5', [textPart('x'.repeat(80))]),
      latest,
    ],
  };

  await hook({}, output);

  assert.match(output.messages[0].parts[0].text, /MYAI_GPT5_STYLE_HELPER/);
  assert.equal(latest.parts.length, 2);
  assert.match(latest.parts[1].text, /MYAI_GPT5_STYLE_REMINDER/);
});

test('adds full helper to first GPT-5 user turn as message-transform fallback', async () => {
  /*
  Scenario: Current OpenCode runtimes rely on message transforms for prompt injection
    Given a GPT-5 conversation below reminder thresholds
    When OpenCode transforms model messages
    Then the full style helper is injected near the beginning of message history
    And the short reminder is not injected yet
  */
  const plugin = await createGpt5StyleHelperPlugin({
    baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
    tokenInterval: 1_000_000,
    turnInterval: 1_000_000,
  });
  const hook = plugin['experimental.chat.messages.transform'];
  const first = userMessage('u1', 'gpt-5.5', [textPart('first')]);
  const latest = userMessage('u2', 'gpt-5.5', [textPart('latest')]);
  const output = { messages: [first, latest] };

  await hook({}, output);

  assert.equal(first.parts.length, 2);
  assert.match(first.parts[0].text, /MYAI_GPT5_STYLE_HELPER/);
  assert.equal(latest.parts.length, 1);
});

test('skips message fallback when system transform already injected for the session', async () => {
  /*
  Scenario: OpenCode runtimes that support system transforms avoid duplicate full helpers
    Given the system transform already injected the full helper for a GPT-5 session
    When message transforms run for the same session
    Then the full helper is not also injected into message history
  */
  const plugin = await createGpt5StyleHelperPlugin({
    baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
    tokenInterval: 1_000_000,
    turnInterval: 1_000_000,
  });
  const systemOutput = { system: [] };
  const messageOutput = { messages: [userMessage('u1', 'gpt-5.5', [textPart('hello')])] };

  await plugin['experimental.chat.system.transform'](
    { sessionID: 'session', model: { providerID: 'openai', modelID: 'gpt-5.5' } },
    systemOutput,
  );
  await plugin['experimental.chat.messages.transform']({}, messageOutput);

  assert.match(systemOutput.system[0], /MYAI_GPT5_STYLE_HELPER/);
  assert.equal(messageOutput.messages[0].parts.length, 1);
});

test('does not add duplicate reminders to the same latest user turn', async () => {
  /*
  Scenario: Reminder injection is idempotent per prompt build
    Given the latest GPT-5 user turn already contains the reminder marker
    When OpenCode transforms messages again
    Then no second reminder is added
  */
  const plugin = await createGpt5StyleHelperPlugin({
    baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
    tokenInterval: 10,
    turnInterval: 99,
  });
  const hook = plugin['experimental.chat.messages.transform'];
  const latest = userMessage('u2', 'gpt-5.5', [textPart('latest')]);
  const output = {
    messages: [
      userMessage('u1', 'gpt-5.5', [textPart('x'.repeat(80))]),
      latest,
    ],
  };

  await hook({}, output);
  await hook({}, output);

  assert.equal(latest.parts.length, 2);
});

test('adds reminder after compaction auto-continue regardless of token threshold', async () => {
  /*
  Scenario: Compacted GPT-5 sessions are reminded immediately after auto-continue
    Given OpenCode added a synthetic compaction continue user message
    When messages are transformed for GPT-5
    Then the short style reminder is injected even below normal thresholds
  */
  const plugin = await createGpt5StyleHelperPlugin({
    baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
    tokenInterval: 1_000_000,
    turnInterval: 1_000_000,
  });
  const hook = plugin['experimental.chat.messages.transform'];
  const latest = userMessage('u1', 'gpt-5.5', [
    textPart('Continue.', { synthetic: true, metadata: { compaction_continue: true } }),
  ]);
  const output = { messages: [latest] };

  await hook({}, output);

  assert.equal(latest.parts.length, 3);
  assert.match(latest.parts[0].text, /MYAI_GPT5_STYLE_HELPER/);
  assert.match(latest.parts[2].text, /MYAI_GPT5_STYLE_REMINDER/);
});

test('leaves non-GPT-5 message history untouched', async () => {
  /*
  Scenario: Other models do not receive GPT-5-specific reminders
    Given a long non-GPT-5 conversation
    When OpenCode transforms model messages
    Then no GPT-5 reminder is added
  */
  const plugin = await createGpt5StyleHelperPlugin({
    baseDir: new URL('../.opencode/plugins/gpt5-style-helper/', import.meta.url),
    tokenInterval: 10,
    turnInterval: 1,
  });
  const hook = plugin['experimental.chat.messages.transform'];
  const latest = userMessage('u2', 'claude-sonnet-4-6', [textPart('latest')]);
  const output = {
    messages: [
      userMessage('u1', 'claude-sonnet-4-6', [textPart('x'.repeat(80))]),
      latest,
    ],
  };

  await hook({}, output);

  assert.equal(latest.parts.length, 1);
});

test('keeps GPT-5 style hooks separate from the skills bootstrap plugin', async () => {
  /*
  Scenario: The installed myai package keeps bootstrap and GPT-5 style behavior separate
    Given OpenCode loads the default package entrypoint plugin
    When the plugin registers hooks
    Then GPT-5 system transforms are not composed into the skills bootstrap
  */
  const plugin = await UsingMySkillsPlugin();

  assert.equal(plugin['experimental.chat.system.transform'], undefined);
  assert.equal(typeof plugin['experimental.chat.messages.transform'], 'function');
});
