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
    'experimental.chat.system.transform': async (_input, output) => {
      if (bootstrapCache === undefined) bootstrapCache = getBootstrapContent(resolverOptions());
      const bootstrap = bootstrapCache;
      if (!bootstrap || !Array.isArray(output.system)) return;

      const alreadyInjected = output.system.some(
        (text) => typeof text === 'string' && text.includes(marker),
      );
      if (alreadyInjected) return;

      output.system.push(bootstrap);
    },
  };
};
