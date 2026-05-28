/**
 * myai bootstrap plugin for OpenCode.
 *
 * Injects the compact `using-my-skills` bootstrap into the first user message
 * for each prompt build. Skills themselves are installed separately via
 * `npx skills add`.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, '../../skills');
const marker = 'MYAI_SKILLS_BOOTSTRAP';

let bootstrapCache = undefined;

const stripFrontmatter = (content) => {
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1] : content;
};

const getBootstrapContent = () => {
  if (bootstrapCache !== undefined) return bootstrapCache;

  const skillPath = path.join(skillsDir, 'using-my-skills', 'SKILL.md');
  if (!fs.existsSync(skillPath)) {
    bootstrapCache = null;
    return bootstrapCache;
  }

  const content = stripFrontmatter(fs.readFileSync(skillPath, 'utf8'));

  const toolMapping = `## OpenCode Tool Mapping

When a skill uses another platform's tool names, use OpenCode equivalents:

- TodoWrite -> todowrite
- Task with subagents -> task tool
- Skill tool -> OpenCode skill tool
- Read, Edit, Write, Bash -> native OpenCode file and shell tools
`;

  bootstrapCache = `<${marker}>
You have the myai skill set.

The using-my-skills bootstrap is already injected below. You don't need to load using-my-skills again.

${content}

${toolMapping}
</${marker}>`;

  return bootstrapCache;
};

export const UsingMySkillsPlugin = async () => {
  return {
    'experimental.chat.messages.transform': async (_input, output) => {
      const bootstrap = getBootstrapContent();
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
