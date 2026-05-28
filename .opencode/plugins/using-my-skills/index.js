/**
 * myai bootstrap plugin for OpenCode.
 *
 * Keep this entrypoint limited to plugin functions. OpenCode executes every
 * exported value from a plugin module and rejects non-function exports.
 */

import { getBootstrapContent, marker } from './core.js';

export const UsingMySkillsPlugin = async (input = {}) => {
  let mergedConfig = {};
  let bootstrapCache = undefined;

  const resolverOptions = () => ({
    cwd: input.directory,
    worktree: input.worktree,
    config: mergedConfig,
    env: process.env,
  });

  return {
    config: async (config) => {
      mergedConfig = config ?? {};
      bootstrapCache = undefined;
    },
    'experimental.chat.messages.transform': async (_input, output) => {
      if (bootstrapCache === undefined) bootstrapCache = getBootstrapContent(resolverOptions());
      const bootstrap = bootstrapCache;
      if (!bootstrap || !output.messages?.length) return;

      const firstUser = output.messages.find(
        (message) => message.info?.role === 'user' || message.role === 'user',
      );
      if (!firstUser?.parts?.length) return;

      const alreadyInjected = firstUser.parts.some(
        (part) => part.type === 'text' && typeof part.text === 'string' && part.text.includes(marker),
      );
      if (alreadyInjected) return;

      const ref = firstUser.parts[0];
      firstUser.parts.unshift({ ...ref, type: 'text', text: bootstrap });
    },
  };
};
