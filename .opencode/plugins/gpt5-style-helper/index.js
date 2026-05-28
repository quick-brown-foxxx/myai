/**
 * OpenCode GPT-5 style helper plugin entrypoint.
 *
 * Keep this module limited to plugin functions. Testable helpers live in
 * `core.js` so OpenCode does not try to execute constants as plugins.
 */

import { createGpt5StyleHelperPlugin } from './core.js';

export const Gpt5StyleHelperPlugin = async (_input, options = {}) => createGpt5StyleHelperPlugin(options);
