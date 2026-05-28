import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const helperMarker = 'MYAI_GPT5_STYLE_HELPER';
export const reminderMarker = 'MYAI_GPT5_STYLE_REMINDER';

const defaultOptions = {
  modelPattern: '(^|/)gpt-5([.-]|$)',
  tokenInterval: 25_000,
  turnInterval: 3,
};

const defaultBaseDir = path.dirname(fileURLToPath(import.meta.url));

const resolveBaseDir = (baseDir) => {
  if (!baseDir) return defaultBaseDir;
  if (baseDir instanceof URL) return fileURLToPath(baseDir);
  return path.resolve(String(baseDir));
};

const readPromptFile = (baseDir, filename) => fs.readFileSync(path.join(baseDir, filename), 'utf8').trim();

const withMarker = (marker, content) => `<${marker}>\n${content}\n</${marker}>`;

const injectedPart = (ref, suffix, text) => ({
  ...ref,
  id: ref?.id ? `${ref.id}-${suffix}` : suffix,
  type: 'text',
  synthetic: true,
  text,
});

const getModelID = (model) => model?.id ?? model?.modelID ?? model?.model?.id ?? '';

const isUserMessage = (message) => message?.info?.role === 'user' || message?.role === 'user';

const isTextPart = (part) => part?.type === 'text' && typeof part.text === 'string';

const includesMarker = (message, marker) =>
  message?.parts?.some((part) => isTextPart(part) && part.text.includes(marker)) ?? false;

const hasCompactionContinue = (message) =>
  message?.parts?.some((part) => part?.metadata?.compaction_continue === true) ?? false;

const estimateTokens = (messages) => {
  const chars = messages.reduce((sum, message) => {
    const textChars = (message.parts ?? [])
      .filter(isTextPart)
      .reduce((partSum, part) => partSum + part.text.length, 0);
    return sum + textChars;
  }, 0);

  return Math.ceil(chars / 4);
};

const countUserMessages = (messages) => messages.filter(isUserMessage).length;

const latestUserIndex = (messages) => {
  for (let index = messages.length - 1; index >= 0; index--) {
    if (isUserMessage(messages[index])) return index;
  }
  return -1;
};

const firstUserIndex = (messages) => {
  for (let index = 0; index < messages.length; index++) {
    if (isUserMessage(messages[index])) return index;
  }
  return -1;
};

const lastReminderIndex = (messages, beforeIndex) => {
  for (let index = beforeIndex; index >= 0; index--) {
    if (includesMarker(messages[index], reminderMarker)) return index;
  }
  return -1;
};

const shouldRemind = (messages, latestIndex, options) => {
  const latest = messages[latestIndex];
  if (hasCompactionContinue(latest)) return true;

  const previousReminder = lastReminderIndex(messages, latestIndex);
  const sinceReminder = messages.slice(previousReminder + 1, latestIndex + 1);

  return (
    estimateTokens(sinceReminder) >= options.tokenInterval ||
    countUserMessages(sinceReminder) >= options.turnInterval
  );
};

export const createGpt5StyleHelperPlugin = async (input = {}) => {
  const options = { ...defaultOptions, ...input };
  const baseDir = resolveBaseDir(options.baseDir);
  const modelPattern = new RegExp(options.modelPattern);
  const fullHelper = withMarker(helperMarker, readPromptFile(baseDir, 'style-helper.md'));
  const reminder = withMarker(reminderMarker, readPromptFile(baseDir, 'style-reminder.md'));
  const systemInjectedSessions = new Set();
  const matchesModel = (model) => modelPattern.test(getModelID(model));

  return {
    'experimental.chat.system.transform': async ({ sessionID, model }, output) => {
      if (!matchesModel(model)) return;
      if (output.system.some((text) => typeof text === 'string' && text.includes(helperMarker))) return;

      output.system.push(fullHelper);
      if (sessionID) systemInjectedSessions.add(sessionID);
    },

    'experimental.chat.messages.transform': async (_input, output) => {
      const messages = output.messages ?? [];
      const index = latestUserIndex(messages);
      if (index === -1) return;

      const latest = messages[index];
      if (!matchesModel(latest.info?.model ?? latest.model)) return;
      if (!latest.parts?.length) return;

      const firstIndex = firstUserIndex(messages);
      const first = messages[firstIndex];
      const sessionID = latest.info?.sessionID ?? latest.sessionID;
      const shouldUseMessageFallback = !sessionID || !systemInjectedSessions.has(sessionID);
      if (shouldUseMessageFallback && first?.parts?.length && !messages.some((message) => includesMarker(message, helperMarker))) {
        const ref = first.parts.find(isTextPart) ?? first.parts[0];
        first.parts.unshift(injectedPart(ref, 'myai-gpt5-style-helper', fullHelper));
      }

      if (includesMarker(latest, reminderMarker)) return;
      if (!shouldRemind(messages, index, options)) return;

      const ref = latest.parts.find(isTextPart) ?? latest.parts[0];
      latest.parts.push(injectedPart(ref, 'myai-gpt5-style-reminder', reminder));
    },
  };
};

export default async (_input, options = {}) => createGpt5StyleHelperPlugin(options);
