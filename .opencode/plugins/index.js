/**
 * Root myai OpenCode plugin entrypoint.
 *
 * OpenCode can execute multiple plugin functions exported from one module. This
 * router keeps the Git package install simple while allowing each feature to be
 * enabled independently through plugin options.
 */

import { UsingMySkillsPlugin as createUsingMySkillsPlugin } from './using-my-skills/index.js';
import { Gpt5StyleHelperPlugin as createGpt5StyleHelperPlugin } from './gpt5-style-helper/index.js';

const isEnabled = (value, defaultValue) => value?.enabled ?? defaultValue;

export const UsingMySkillsPlugin = async (input = {}, options = {}) => {
  const pluginOptions = options.usingMySkills ?? {};
  if (!isEnabled(pluginOptions, true)) return {};
  return createUsingMySkillsPlugin(input, pluginOptions);
};

export const Gpt5StyleHelperPlugin = async (input = {}, options = {}) => {
  const pluginOptions = options.gpt5StyleHelper ?? {};
  if (!isEnabled(pluginOptions, false)) return {};
  return createGpt5StyleHelperPlugin(input, pluginOptions);
};
