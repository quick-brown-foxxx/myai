import { execFile, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const smokeModel = process.env.MYAI_OPENCODE_SMOKE_MODEL || 'openai/gpt-5.5';
const smokeProofToken = 'MYAI_RESOLVED_CONFIG_DIR_SKILL';

test('smoke: packed plugin injects bootstrap through real opencode CLI', { timeout: 180_000 }, async (t) => {
  /*
  Scenario: OpenCode loads the installed myai plugin in an isolated local smoke
    Given a local machine with an existing OpenCode auth file
    And no global/project OpenCode config, skills, plugins, sessions, or cache are reused
    When the packed myai package is installed into a temporary project
    And real opencode run executes with only that copied auth file available
    Then the model sees the MYAI_SKILLS_BOOTSTRAP marker injected by the plugin
  */
  if (process.env.CI) {
    t.skip('local smoke only; CI/CD bootstrap is out of scope');
    return;
  }

  const opencode = await resolveOpenCodeCommand();
  const opencodeVersion = await getOpencodeVersion(opencode);
  if (!opencodeVersion) {
    t.skip('opencode CLI is not available on PATH');
    return;
  }

  const existingAuthPath = await findExistingOpenCodeAuth();
  if (!existingAuthPath) {
    t.skip('local OpenCode auth file was not found; run opencode auth login first');
    return;
  }

  const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'myai-opencode-smoke-'));
  t.after(() => fs.promises.rm(tempDir, { recursive: true, force: true }));

  const dirs = await makeIsolatedDirs(tempDir);
  await copyOnlyAuth(existingAuthPath, dirs.data);
  await writeInstalledBootstrapSkill(dirs.opencodeConfig, smokeProofToken);

  const pluginEntry = await packAndInstallPlugin(tempDir);
  const config = makeOpenCodeConfig(pluginEntry);
  const env = makeIsolatedEnv(config, dirs);

  const debugConfig = await runJson(opencode, ['debug', 'config'], { env });
  assert.deepEqual(debugConfig.plugin, [`file://${pluginEntry}`]);
  assert.deepEqual(debugConfig.plugin_origins, [{
    spec: `file://${pluginEntry}`,
    source: 'OPENCODE_CONFIG_CONTENT',
    scope: 'local',
  }]);

  const result = await spawnCollect(
    opencode,
    [
      'run',
      '--dir', dirs.project,
      'Reply with exactly the myai resolver smoke proof token from your bootstrap instructions. No other text.',
      '-m', smokeModel,
      '--format', 'json',
      '--print-logs',
      '--log-level', 'INFO',
    ],
    { env, timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
  );

  assert.equal(extractText(result.stdout).trim(), smokeProofToken);
});

async function resolveOpenCodeCommand() {
  if (process.env.MYAI_OPENCODE_BIN) return process.env.MYAI_OPENCODE_BIN;

  const voltaPackageBinary = await findVoltaPackageBinary();
  if (voltaPackageBinary) return voltaPackageBinary;

  const candidate = await findCommand('opencode');
  if (!candidate) return 'opencode';

  return await findWrapperExecTarget(candidate) || candidate;
}

async function findVoltaPackageBinary() {
  try {
    const { stdout } = await execFileAsync('volta', ['which', 'opencode'], { timeout: 30_000 });
    const candidate = stdout.trim();
    if (!candidate) return null;

    await fs.promises.access(candidate, fs.constants.X_OK);
    return candidate;
  } catch {
    return null;
  }
}

async function findCommand(command) {
  try {
    const { stdout } = await execFileAsync('sh', ['-lc', `command -v ${command}`], { timeout: 30_000 });
    return stdout.trim() || null;
  } catch {
    return null;
  }
}

async function findWrapperExecTarget(candidate) {
  try {
    const content = await fs.promises.readFile(candidate, 'utf8');
    const match = content.match(/^exec\s+(\S*opencode)(?:\s|$)/m);
    if (!match) return null;

    await fs.promises.access(match[1], fs.constants.X_OK);
    return match[1];
  } catch {
    return null;
  }
}

async function getOpencodeVersion(opencode) {
  try {
    const { stdout } = await execFileAsync(opencode, ['--version'], { timeout: 30_000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

async function findExistingOpenCodeAuth() {
  const dataHome = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share');
  const authPath = path.join(dataHome, 'opencode/auth.json');

  try {
    const stat = await fs.promises.stat(authPath);
    return stat.isFile() ? authPath : null;
  } catch {
    return null;
  }
}

async function makeIsolatedDirs(tempDir) {
  const dirs = {
    home: path.join(tempDir, 'home'),
    xdgConfig: path.join(tempDir, 'xdg-config'),
    data: path.join(tempDir, 'data'),
    state: path.join(tempDir, 'state'),
    cache: path.join(tempDir, 'cache'),
    opencodeConfig: path.join(tempDir, 'opencode-config'),
    project: path.join(tempDir, 'project'),
  };

  await Promise.all(Object.values(dirs).map((dir) => fs.promises.mkdir(dir, { recursive: true })));
  return dirs;
}

async function copyOnlyAuth(sourceAuthPath, dataDir) {
  const targetAuthPath = path.join(dataDir, 'opencode/auth.json');

  await fs.promises.mkdir(path.dirname(targetAuthPath), { recursive: true });
  await fs.promises.copyFile(sourceAuthPath, targetAuthPath);
}

async function writeInstalledBootstrapSkill(opencodeConfigDir, proofToken) {
  const skillPath = path.join(opencodeConfigDir, 'skills', 'using-my-skills', 'SKILL.md');

  await fs.promises.mkdir(path.dirname(skillPath), { recursive: true });
  await fs.promises.writeFile(
    skillPath,
    [
      '---',
      'name: using-my-skills',
      'description: Test bootstrap skill used by the myai OpenCode plugin smoke test',
      '---',
      '',
      '# Smoke Bootstrap',
      '',
      `If the user asks for the myai resolver smoke proof token, reply with exactly ${proofToken}.`,
      '',
    ].join('\n'),
    'utf8',
  );
}

async function packAndInstallPlugin(tempDir) {
  const { stdout } = await execFileAsync(
    'npm',
    ['pack', '--json', '--pack-destination', tempDir],
    { cwd: repoRoot, timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
  );
  const [packed] = JSON.parse(stdout);
  const packedFiles = packed.files.map((file) => file.path);

  assert.ok(packedFiles.includes('.opencode/plugins/using-my-skills.js'));
  assert.ok(packedFiles.includes('skills/using-my-skills/SKILL.md'));

  const appDir = path.join(tempDir, 'app');
  await fs.promises.mkdir(appDir);
  await execFileAsync('npm', ['install', '--prefix', appDir, path.join(tempDir, packed.filename)], {
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const require = createRequire(path.join(appDir, 'package.json'));
  const entry = require.resolve('myai');

  assert.ok(entry.startsWith(appDir), `expected package entry inside temp app, got ${entry}`);
  return entry;
}

function makeOpenCodeConfig(pluginEntry) {
  return JSON.stringify({
    $schema: 'https://opencode.ai/config.json',
    share: 'disabled',
    autoupdate: false,
    snapshot: false,
    plugin: [`file://${pluginEntry}`],
    permission: {
      bash: 'deny',
      edit: 'deny',
      write: 'deny',
    },
  });
}

function makeIsolatedEnv(config, dirs) {
  const env = pickEnv(['PATH']);

  return {
    ...env,
    HOME: dirs.home,
    XDG_CONFIG_HOME: dirs.xdgConfig,
    XDG_DATA_HOME: dirs.data,
    XDG_STATE_HOME: dirs.state,
    XDG_CACHE_HOME: dirs.cache,
    OPENCODE_CONFIG_DIR: dirs.opencodeConfig,
    OPENCODE_DISABLE_EXTERNAL_SKILLS: '1',
    OPENCODE_DISABLE_CLAUDE_CODE_SKILLS: '1',
    OPENCODE_DISABLE_PROJECT_CONFIG: '1',
    OPENCODE_CONFIG_CONTENT: config,
    MYAI_OPENCODE_BOOTSTRAP_DEBUG: '1',
    OPENCODE: '1',
    OPENCODE_RUN_ID: 'myai-smoke',
    OPENCODE_PID: String(process.pid),
    OPENCODE_PROCESS_ROLE: 'worker',
  };
}

function pickEnv(names) {
  return Object.fromEntries(
    names
      .filter((name) => process.env[name] !== undefined)
      .map((name) => [name, process.env[name]]),
  );
}

async function runJson(command, args, options) {
  const { stdout } = await execFileAsync(command, args, {
    ...options,
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(stdout);
}

function spawnCollect(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, options.timeout);

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > options.maxBuffer) child.kill('SIGTERM');
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      if (stderr.length > options.maxBuffer) child.kill('SIGTERM');
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code, signal) => {
      clearTimeout(timer);

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const reason = timedOut ? 'timed out' : `exited with code ${code ?? signal}`;
      const error = new Error(`Command ${reason}: ${command} ${args.join(' ')}\n${stderr}`);
      error.code = code;
      error.signal = signal;
      error.stdout = stdout;
      error.stderr = stderr;
      reject(error);
    });
  });
}

function extractText(jsonLines) {
  return jsonLines
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
    .filter((event) => event.type === 'text')
    .map((event) => event.part.text)
    .join('');
}
