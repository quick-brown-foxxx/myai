/**
 * KiloCode canonical plugin entrypoint.
 *
 * KiloCode discovers plugins via {plugin,plugins}/*.{ts,js} in .kilo/,
 * .kilocode/, and .opencode/ config directories. This file is the canonical
 * KiloCode entrypoint; all implementation lives in .opencode/plugins/ to
 * avoid duplication.
 *
 * If KiloCode ever diverges from OpenCode in plugin API, adaptations go here
 * without touching the shared implementation.
 */

export { UsingMySkillsPlugin, Gpt5StyleHelperPlugin } from '../../.opencode/plugins/index.js';
