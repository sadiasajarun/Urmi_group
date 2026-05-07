/**
 * deterministic.js — runs deterministic blueprint nodes via shell
 */

const { execSync } = require('child_process');
const { resolveVars } = require('./config');

function runDeterministicNode(node, config, projectName) {
  if (!node.command) {
    return { exitCode: 0, stdout: '', skipped: true, reason: 'no_command' };
  }

  const command = resolveVars(node.command, config, projectName);
  const startTime = Date.now();

  // Handle optional condition — if condition command fails, skip node
  if (node.condition) {
    const condCmd = resolveVars(node.condition, config, projectName);
    try {
      execSync(condCmd, { stdio: 'pipe', cwd: config.targetDir });
    } catch {
      return { exitCode: 0, stdout: '', skipped: true, reason: 'condition_false' };
    }
  }

  const maxRetries = node.max_retries || 0;
  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    try {
      // Pass directory and port variables as shell env vars so commands can use
      // $FRONTEND_DIR, $BACKEND_DIR, $FRONTEND_PORT, $BACKEND_PORT directly.
      const env = {
        ...process.env,
        FRONTEND_DIR: config.frontend?.dir || 'frontend',
        BACKEND_DIR: 'backend',
        FRONTEND_PORT: String(config.frontend?.dev_port || 5173),
        BACKEND_PORT: '3000',
      };
      const stdout = execSync(command, {
        cwd: config.targetDir,
        env,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
        // No timeout — script runs until it exits on its own.
      });
      return {
        exitCode: 0,
        stdout,
        duration_ms: Date.now() - startTime,
        attempts: attempt + 1,
      };
    } catch (err) {
      lastError = err;
      attempt++;
      if (attempt <= maxRetries) {
        console.log(`  retry ${attempt}/${maxRetries}...`);
      }
    }
  }

  return {
    exitCode: lastError.status || 1,
    stdout: (lastError.stdout || '').toString(),
    stderr: (lastError.stderr || '').toString(),
    duration_ms: Date.now() - startTime,
    attempts: attempt,
    error: lastError.message,
  };
}

module.exports = {
  runDeterministicNode,
};
