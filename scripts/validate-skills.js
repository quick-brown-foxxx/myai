#!/usr/bin/env node
/**
 * Validate every canonical skill in skills/.
 *
 * Adapted from Addy Osmani's agent-skills validator at commit
 * 2fbfa004a0192529bc997d103fc12f19a3804aab. The CLI shape and diagnostics
 * remain recognizable; repository-specific rules live in lib/skill-lint.js.
 *
 * Exit codes: 0 = no errors, 1 = one or more errors or an unexpected failure.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { discoverSkillDirectories, lintSkill } from './lib/skill-lint.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(scriptDir, '..', 'skills');

function main() {
  if (!fs.existsSync(skillsDir)) {
    console.error(`ERROR: skills directory not found at ${skillsDir}`);
    process.exitCode = 1;
    return;
  }

  const { candidateNames: skillDirs, knownSkills } =
    discoverSkillDirectories(skillsDir);

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const dirName of skillDirs) {
    const { errors, warnings } = lintSkill(dirName, skillsDir, knownSkills);
    totalErrors += errors.length;
    totalWarnings += warnings.length;

    if (errors.length === 0 && warnings.length === 0) {
      console.log(`  ✓  ${dirName}`);
      continue;
    }

    console.log(`${errors.length > 0 ? '  ✗ ' : '  ⚠ '} ${dirName}`);
    for (const message of errors) console.log(`       ERROR: ${message}`);
    for (const message of warnings) console.log(`       WARN:  ${message}`);
  }

  const status =
    totalErrors > 0
      ? 'FAILED'
      : totalWarnings > 0
        ? 'PASSED WITH WARNINGS'
        : 'PASSED';
  console.log(
    `\n${skillDirs.length} skills checked — ${totalErrors} error(s), ` +
      `${totalWarnings} warning(s) — ${status}`,
  );

  if (totalErrors > 0) process.exitCode = 1;
}

try {
  main();
} catch (error) {
  console.error(`\nERROR: validate-skills failed unexpectedly: ${error.message}`);
  process.exitCode = 1;
}
