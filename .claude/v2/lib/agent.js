/**
 * agent.js — runs an agentic node via `claude --print` subprocess
 *
 * This wraps the existing claude-agent-runner.js pattern but lives inside
 * the orchestrator so we can control logging, timeouts, and artifact
 * verification from one place.
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { resolveVars } = require('./config');

function buildPrompt(node, config, projectName, retryContext) {
  const parts = [];

  // Inject retry context from previous failed attempt
  if (retryContext) {
    parts.push('=== RETRY CONTEXT (previous attempt failed) ===');
    parts.push(`Attempt: ${retryContext.attempt} of ${retryContext.maxAttempts}`);
    parts.push(`Failure reason: ${retryContext.reason}`);
    if (retryContext.path) parts.push(`Expected artifact: ${retryContext.path}`);
    if (retryContext.pattern) parts.push(`Required pattern: ${retryContext.pattern}`);
    if (retryContext.error) parts.push(`Error: ${retryContext.error}`);
    parts.push('Fix the issue above and produce the required artifact.');
    parts.push('=== END RETRY CONTEXT ===\n\n');
  }

  // Inject additional_read context
  if (node.context && node.context.additional_read) {
    parts.push('=== CONTEXT FILES ===\n');
    for (const pattern of node.context.additional_read) {
      const resolved = resolveVars(pattern, config, projectName);
      if (resolved.includes('*')) {
        const dir = path.dirname(resolved);
        const base = path.basename(resolved).replace(/\*/g, '.*');
        if (fs.existsSync(dir)) {
          for (const f of fs.readdirSync(dir)) {
            if (new RegExp('^' + base + '$').test(f)) {
              const full = path.join(dir, f);
              if (fs.statSync(full).isFile()) {
                parts.push(`--- ${full} ---\n${fs.readFileSync(full, 'utf-8').slice(0, 5000)}\n`);
              }
            }
          }
        }
      } else if (fs.existsSync(resolved)) {
        parts.push(`--- ${resolved} ---\n${fs.readFileSync(resolved, 'utf-8').slice(0, 5000)}\n`);
      }
    }
    parts.push('\n=== END CONTEXT ===\n\n');
  }

  // The node's prompt
  parts.push(resolveVars(node.prompt || '', config, projectName));

  // Artifact contract
  if (node.required_output_file) {
    const requiredPath = resolveVars(node.required_output_file, config, projectName);
    parts.push(`\n\n=== MANDATORY ARTIFACT CONTRACT ===`);
    parts.push(`You MUST produce a file at this exact path:`);
    parts.push(`  ${requiredPath}`);
    parts.push(``);
    parts.push(`The orchestrator will verify this file exists after your run.`);
    parts.push(`If the file is missing, your work is REJECTED regardless of what you say.`);
    if (node.verification_pattern) {
      parts.push(`\nThe file MUST contain content matching this regex:`);
      parts.push(`  ${node.verification_pattern}`);
      parts.push(`This pattern is verified by code, not interpretation.`);
    }
    parts.push(`\nDo not claim the task is complete without writing this file.`);
  }

  return parts.join('\n');
}

function buildClaudeArgs(node, config) {
  const args = [
    '--print',
    '--output-format', 'json',
    '--permission-mode', 'bypassPermissions',
    '--add-dir', config.targetDir,
  ];

  const toolProfile = node.tool_profile || {};
  if (Array.isArray(toolProfile.allow) && toolProfile.allow.length) {
    args.push('--allowed-tools', toolProfile.allow.join(' '));
  }
  if (Array.isArray(toolProfile.deny) && toolProfile.deny.length) {
    args.push('--disallowed-tools', toolProfile.deny.join(' '));
  }

  // No budget cap — we run on Claude Code OAuth/Max (flat-rate subscription).
  // Time and idle watchdogs are the only guardrails.

  return args;
}

function runAgentNode(node, config, projectName, options = {}) {
  return new Promise((resolve, reject) => {
    const prompt = buildPrompt(node, config, projectName, options.retryContext);
    const args = buildClaudeArgs(node, config);

    // Log file per node per run
    fs.mkdirSync(config.agentLogsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(config.agentLogsDir, `${node.id}-${timestamp}.log`);
    const logStream = fs.createWriteStream(logFile);
    logStream.write(`=== NODE: ${node.id} ===\n`);
    logStream.write(`timestamp: ${new Date().toISOString()}\n`);
    logStream.write(`command: claude ${args.join(' ')}\n`);
    logStream.write(`\n=== PROMPT (${prompt.length} chars) ===\n${prompt}\n\n=== STDOUT ===\n`);

    console.log(`\n[agent] node: ${node.id}`);
    console.log(`[agent] tools allow: ${(node.tool_profile?.allow || []).join(' ') || '(default)'}`);
    console.log(`[agent] tools deny:  ${(node.tool_profile?.deny || []).join(' ') || '(none)'}`);
    console.log(`[agent] log:         ${path.relative(config.targetDir, logFile)}`);
    console.log(`[agent] launching claude subprocess...`);

    const startTime = Date.now();
    // No limits — agent runs until it exits on its own.
    // Use Ctrl-C at the terminal to abort manually.

    const child = spawn('claude', args, {
      cwd: config.targetDir,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', chunk => {
      const text = chunk.toString();
      stdout += text;
      logStream.write(text);
    });
    child.stderr.on('data', chunk => {
      const text = chunk.toString();
      stderr += text;
      logStream.write(`[stderr] ${text}`);
    });

    child.stdin.write(prompt);
    child.stdin.end();

    child.on('close', code => {
      const duration = Date.now() - startTime;
      logStream.write(`\n=== EXIT CODE: ${code} | DURATION: ${duration}ms ===\n`);
      logStream.end();

      if (code !== 0) {
        return reject(new Error(`claude exited with code ${code}: ${stderr.slice(-500)}`));
      }
      let parsed;
      try {
        parsed = JSON.parse(stdout);
      } catch (e) {
        return reject(new Error(`failed to parse claude output: ${e.message}\nstdout: ${stdout.slice(-500)}`));
      }
      parsed._duration_ms = duration;
      parsed._log_file = logFile;
      resolve(parsed);
    });

    child.on('error', err => {
      logStream.end();
      reject(err);
    });
  });
}

function verifyArtifact(node, config, projectName) {
  if (!node.required_output_file) {
    return { verified: true, reason: 'no_contract' };
  }
  const file = resolveVars(node.required_output_file, config, projectName);
  if (!fs.existsSync(file)) {
    return { verified: false, reason: 'file_missing', path: file };
  }
  const content = fs.readFileSync(file, 'utf-8');
  if (node.verification_pattern) {
    // Multiline flag: blueprint patterns use ^ to anchor at line start,
    // not string start (e.g. "^## Endpoints" in a markdown body).
    const re = new RegExp(node.verification_pattern, 'm');
    if (!re.test(content)) {
      return {
        verified: false,
        reason: 'pattern_mismatch',
        path: file,
        pattern: node.verification_pattern,
        content_preview: content.slice(0, 200),
      };
    }
  }
  return {
    verified: true,
    path: file,
    size: content.length,
  };
}

module.exports = {
  buildPrompt,
  buildClaudeArgs,
  runAgentNode,
  verifyArtifact,
};
