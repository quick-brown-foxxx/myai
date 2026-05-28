/**
 * myai bootstrap plugin for OpenCode.
 *
 * Injects the compact `using-my-skills` bootstrap into the first user message
 * for each prompt build. Skills themselves are installed separately via
 * `npx skills add`.
 */

import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, '../../skills');
const skillName = 'using-my-skills';
const bundledSkillPath = path.join(skillsDir, skillName, 'SKILL.md');

export const marker = 'MYAI_SKILLS_BOOTSTRAP';
export const debugEnvVar = 'MYAI_OPENCODE_BOOTSTRAP_DEBUG';

const truthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value ?? '').toLowerCase());

const makeDebug = (env, logger) => {
  if (!truthy(env?.[debugEnvVar])) return () => {};
  const write = logger ?? ((line) => console.warn(line));

  return (message, data = {}) => {
    write(`[myai-bootstrap] ${message} ${JSON.stringify(data)}`);
  };
};

const stripFrontmatter = (content) => {
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/);
  return match ? match[1] : content;
};

const parseFrontmatterName = (content) => {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return undefined;

  const name = match[1].match(/^name:\s*['"]?([^'"\n#]+?)['"]?\s*$/m);
  return name?.[1]?.trim();
};

const readSkill = (filePath, debug) => {
  if (!filePath || !fs.existsSync(filePath)) return undefined;

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const name = parseFrontmatterName(raw);
    if (name !== skillName) {
      debug('skip', { path: filePath, reason: name ? `name:${name}` : 'missing-frontmatter-name' });
      return undefined;
    }

    const content = stripFrontmatter(raw).trim();
    if (!content) {
      debug('skip', { path: filePath, reason: 'empty-content' });
      return undefined;
    }

    return { name, path: filePath, content };
  } catch (error) {
    debug('skip', { path: filePath, reason: error?.message ?? String(error) });
    return undefined;
  }
};

const isDirectory = (dir) => {
  try {
    return fs.statSync(dir).isDirectory();
  } catch {
    return false;
  }
};

const scanSkillFiles = (root) => {
  if (!isDirectory(root)) return [];

  const results = [];
  const visit = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name === 'SKILL.md') {
        results.push(entryPath);
        continue;
      }

      if (entry.isDirectory() || entry.isSymbolicLink()) {
        if (isDirectory(entryPath)) visit(entryPath);
      }
    }
  };

  visit(root);
  return results;
};

const homeDir = (env) => env?.OPENCODE_TEST_HOME || env?.HOME || os.homedir();

const xdgConfigHome = (env) => env?.XDG_CONFIG_HOME || path.join(homeDir(env), '.config');

const resolveTilde = (inputPath, env) => (
  inputPath.startsWith('~/') ? path.join(homeDir(env), inputPath.slice(2)) : inputPath
);

const ancestorDirs = (start, stop) => {
  const result = [];
  let current = path.resolve(start || process.cwd());
  const stopAt = stop ? path.resolve(stop) : undefined;

  while (true) {
    result.push(current);
    if (current === stopAt) break;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return result;
};

const addCandidate = (candidates, seen, source, filePath) => {
  if (!filePath || seen.has(filePath)) return;
  seen.add(filePath);
  candidates.push({ source, path: filePath });
};

const addScanned = (candidates, seen, source, root) => {
  for (const filePath of scanSkillFiles(root)) addCandidate(candidates, seen, source, filePath);
};

const collectCandidates = ({ cwd, worktree, env, config, fallbackPath }) => {
  const candidates = [];
  const seen = new Set();
  const baseDir = path.resolve(cwd || process.cwd());
  const home = homeDir(env);
  const disableProjectConfig = truthy(env?.OPENCODE_DISABLE_PROJECT_CONFIG);
  const disableExternalSkills = truthy(env?.OPENCODE_DISABLE_EXTERNAL_SKILLS);
  const disableClaudeSkills = truthy(env?.OPENCODE_DISABLE_CLAUDE_CODE)
    || truthy(env?.OPENCODE_DISABLE_CLAUDE_CODE_SKILLS);

  addCandidate(candidates, seen, 'bundled', fallbackPath);

  if (!disableExternalSkills) {
    if (!disableClaudeSkills) addScanned(candidates, seen, 'global:.claude', path.join(home, '.claude', 'skills'));
    addScanned(candidates, seen, 'global:.agents', path.join(home, '.agents', 'skills'));

    for (const dir of ancestorDirs(baseDir, worktree)) {
      if (!disableClaudeSkills) addScanned(candidates, seen, 'project:.claude', path.join(dir, '.claude', 'skills'));
      addScanned(candidates, seen, 'project:.agents', path.join(dir, '.agents', 'skills'));
    }
  }

  const configDirs = [path.join(xdgConfigHome(env), 'opencode')];
  if (!disableProjectConfig) {
    configDirs.push(...ancestorDirs(baseDir, worktree).map((dir) => path.join(dir, '.opencode')));
  }
  configDirs.push(path.join(home, '.opencode'));
  if (env?.OPENCODE_CONFIG_DIR) configDirs.push(env.OPENCODE_CONFIG_DIR);

  for (const dir of configDirs) {
    addScanned(candidates, seen, `config:${dir}`, path.join(dir, 'skill'));
    addScanned(candidates, seen, `config:${dir}`, path.join(dir, 'skills'));
  }

  for (const item of config?.skills?.paths ?? []) {
    if (typeof item !== 'string') continue;
    const expanded = resolveTilde(item, env);
    const root = path.isAbsolute(expanded) ? expanded : path.join(baseDir, expanded);
    addScanned(candidates, seen, `skills.paths:${item}`, root);
  }

  return candidates;
};

export const resolveBootstrapSkill = (options = {}) => {
  const env = options.env ?? process.env;
  const debug = makeDebug(env, options.logger);
  const candidates = collectCandidates({
    cwd: options.cwd,
    worktree: options.worktree,
    env,
    config: options.config ?? {},
    fallbackPath: options.bundledSkillPath ?? bundledSkillPath,
  });

  let selected = null;
  for (const candidate of candidates) {
    debug('candidate', candidate);
    const skill = readSkill(candidate.path, debug);
    if (!skill) continue;
    selected = { ...skill, source: candidate.source };
  }

  if (selected) debug('selected', { source: selected.source, path: selected.path });
  else debug('selected', { source: null, path: null });

  return selected;
};

const buildBootstrapContent = (skill) => {
  if (!skill) return null;

  const toolMapping = `## OpenCode Tool Mapping

When a skill uses another platform's tool names, use OpenCode equivalents:

- TodoWrite -> todowrite
- Task with subagents -> task tool
- Skill tool -> OpenCode skill tool
- Read, Edit, Write, Bash -> native OpenCode file and shell tools
`;

  return `<${marker}>
You have the myai skill set.

The using-my-skills bootstrap is already injected below. You don't need to load using-my-skills again.

${skill.content}

${toolMapping}
</${marker}>`;
};

const getBootstrapContent = (options) => buildBootstrapContent(resolveBootstrapSkill(options));

export const UsingMySkillsPlugin = async (input = {}) => {
  let mergedConfig = {};
  let bootstrapCache = undefined;

  const resolverOptions = () => ({
    cwd: input.directory,
    worktree: input.worktree,
    config: mergedConfig,
    env: process.env,
    bundledSkillPath,
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

export default UsingMySkillsPlugin;
