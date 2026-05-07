/**
 * agent-opencode.js — runs agentic nodes via `opencode run` subprocess
 *
 * Drop-in replacement for agent.js that uses OpenCode instead of Claude Code.
 * Supports per-node model selection via node.model field in blueprints.
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { resolveVars } = require('./config');

/**
 * Build the prompt for the agent, including retry context and artifact contracts.
 */
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

/**
 * Build OpenCode CLI arguments for the node.
 */
function buildOpenCodeArgs(node, config) {
  const args = [
    'run',
    '--format', 'json',
    '--dangerously-skip-permissions',
  ];

  // Per-node model override (the key feature!)
  if (node.model) {
    args.push('--model', node.model);
  } else if (config.defaultModel) {
    args.push('--model', config.defaultModel);
  } else if (process.env.OPENCODE_DEFAULT_MODEL) {
    args.push('--model', process.env.OPENCODE_DEFAULT_MODEL);
  }
  // If none specified, OpenCode uses its configured default

  // Working directory
  if (config.targetDir) {
    args.push('--dir', config.targetDir);
  }

  return args;
}

/**
 * Parse OpenCode's nd-JSON output into a structured result.
 * OpenCode emits one JSON object per line (newline-delimited JSON).
 */
function parseOpenCodeOutput(stdout) {
  const lines = stdout.trim().split('\n').filter(Boolean);
  const events = [];
  
  for (const line of lines) {
    try {
      events.push(JSON.parse(line));
    } catch (e) {
      // Skip non-JSON lines (shouldn't happen with --format json)
      console.warn(`[opencode] skipping non-JSON line: ${line.slice(0, 100)}`);
    }
  }

  // Extract key metrics from events
  let result = '';
  let totalTokens = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let costUsd = 0;
  let numTurns = 0;

  for (const event of events) {
    // Count tool uses as "turns"
    if (event.type === 'tool_use') {
      numTurns++;
    }
    
    // Collect text content
    if (event.type === 'text' && event.part?.text) {
      result += event.part.text + '\n';
    }

    // Aggregate token counts from step_finish events
    if (event.type === 'step_finish' && event.part?.tokens) {
      const t = event.part.tokens;
      totalTokens += t.total || 0;
      inputTokens += t.input || 0;
      outputTokens += t.output || 0;
      costUsd += event.part.cost || 0;
    }
  }

  return {
    result: result.trim(),
    num_turns: numTurns,
    total_tokens: totalTokens,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_cost_usd: costUsd,
    _events: events,
  };
}

/**
 * Run an agentic node via OpenCode subprocess.
 * Returns a promise that resolves with the parsed result.
 */
function runAgentNode(node, config, projectName, options = {}) {
  return new Promise((resolve, reject) => {
    const prompt = buildPrompt(node, config, projectName, options.retryContext);
    const args = buildOpenCodeArgs(node, config);

    // Log file per node per run
    fs.mkdirSync(config.agentLogsDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logFile = path.join(config.agentLogsDir, `${node.id}-${timestamp}.log`);
    const logStream = fs.createWriteStream(logFile);
    
    logStream.write(`=== NODE: ${node.id} ===\n`);
    logStream.write(`timestamp: ${new Date().toISOString()}\n`);
    logStream.write(`backend: opencode\n`);
    logStream.write(`model: ${node.model || config.defaultModel || '(default)'}\n`);
    logStream.write(`command: opencode ${args.join(' ')} "<prompt>"\n`);
    logStream.write(`\n=== PROMPT (${prompt.length} chars) ===\n${prompt}\n\n=== STDOUT ===\n`);

    console.log(`\n[opencode] node: ${node.id}`);
    console.log(`[opencode] model: ${node.model || config.defaultModel || '(default)'}`);
    console.log(`[opencode] log:   ${path.relative(config.targetDir, logFile)}`);
    console.log(`[opencode] launching subprocess...`);

    const startTime = Date.now();

    // OpenCode takes prompt as positional argument, not stdin
    const fullArgs = [...args, prompt];
    
    const child = spawn('opencode', fullArgs, {
      cwd: config.targetDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Ensure OpenCode doesn't try to open TUI
        TERM: 'dumb',
      },
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

    // OpenCode reads prompt from args, not stdin
    child.stdin.end();

    child.on('close', code => {
      const duration = Date.now() - startTime;
      logStream.write(`\n=== EXIT CODE: ${code} | DURATION: ${duration}ms ===\n`);
      logStream.end();

      if (code !== 0) {
        return reject(new Error(`opencode exited with code ${code}: ${stderr.slice(-500)}`));
      }

      let parsed;
      try {
        parsed = parseOpenCodeOutput(stdout);
      } catch (e) {
        return reject(new Error(`failed to parse opencode output: ${e.message}\nstdout: ${stdout.slice(-500)}`));
      }

      parsed._duration_ms = duration;
      parsed._log_file = logFile;
      parsed._backend = 'opencode';
      
      resolve(parsed);
    });

    child.on('error', err => {
      logStream.end();
      reject(err);
    });
  });
}

/**
 * Verify that the required artifact exists and matches the pattern.
 * Identical to the original agent.js implementation.
 */
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
  buildOpenCodeArgs,
  parseOpenCodeOutput,
  runAgentNode,
  verifyArtifact,
};
