#!/usr/bin/env node
/**
 * fullstack-2 orchestrator — code-based pipeline phase runner
 *
 * Usage:
 *   node orchestrator.js <project> --phase <name> [--dry-run] [--verbose] [--resume]
 *   node orchestrator.js <project> --run-all [--skip-spec] [--dry-run] [--verbose]
 *
 * Supports:
 *   - Single-phase execution (--phase)
 *   - Multi-phase execution with parallel groups (--run-all)
 *   - Phase convergence loop (--phase X --loop)
 *   - Pipeline-wide generation loop (--loop)
 *   - Resume from saved blueprint state (--resume)
 *   - Reset a phase (--reset)
 *   - Load a PRD file (--prd), chainable with --run-all/--phase
 *   - Inline RL reward scoring after every episode
 *
 * Does NOT yet:
 *   - --adopt / --update
 */

const fs = require('fs');
const path = require('path');

const { findProjectRoot, makeConfig, findProjectName, getFrontends } = require('./lib/config');
const { loadBlueprint, validateV2Contracts, findBlueprint } = require('./lib/blueprint');
const {
  initBlueprintState,
  loadBlueprintState,
  saveBlueprintState,
  updateNodeStatus,
  computeBlueprintStatus,
  readPhaseStatus,
  readPhaseScore,
  resetPhaseStatus,
  updatePipelineStatusRow,
  appendExecutionLog,
} = require('./lib/state');
const { hasGate, runGate, verifyGateProof } = require('./lib/gate');
const { runAgentNode, verifyArtifact } = require('./lib/agent-factory');
const { runDeterministicNode } = require('./lib/deterministic');
const { resolveVars } = require('./lib/config');
const { createEventStream } = require('./lib/events');
const { loadRewardConfig, computeEpisodeReward } = require('./lib/reward');

// Phases whose behavior is scoped to a single frontend. When multiple frontends
// are declared in PIPELINE_STATUS.md, these phases fan out: one execution per
// frontend, each recorded under a compound phase key `<phase>:<frontend_name>`.
//
// `init` is deliberately NOT in this set: it creates shared project state
// (PIPELINE_STATUS.md, backend/, .claude-project/ skeleton) that must exist
// exactly once per project. Per-frontend directory scaffolding happens at the
// top of the frontend blueprint instead.
const FRONTEND_SCOPED_PHASES = new Set(['frontend', 'integrate', 'test-browser']);

function splitPhaseKey(key) {
  const i = key.indexOf(':');
  return i >= 0
    ? { phaseBase: key.slice(0, i), frontendName: key.slice(i + 1) }
    : { phaseBase: key, frontendName: null };
}

// Flat phase order — used for validation, --reset, and anywhere a simple list is needed.
const PHASE_ORDER = [
  'init', 'spec', 'prd', 'design', 'database', 'user-stories',
  'backend', 'frontend', 'integrate', 'test-api', 'test-browser',
];

// Pipeline execution graph — each step is an array of phases that can run in parallel.
// Phases within the same step have no dependency on each other; only on prior steps.
const PIPELINE_GRAPH = [
  ['init'],
  ['spec'],
  ['prd'],
  ['design', 'database'],       // both depend only on prd
  ['user-stories', 'backend'],  // user-stories needs design; backend needs database
  ['frontend'],                 // needs design + backend (entities for types)
  ['integrate'],                // needs frontend + backend
  ['test-api'],
  ['test-browser'],
];

// --- argv parsing ---

function parseArgs(argv) {
  const positional = [];
  const flags = {
    phase: null,
    runAll: false,
    loop: false,
    maxIterations: 5,
    maxGenerations: 10,
    quality: 0.95,
    skipSpec: false,
    dryRun: false,
    verbose: false,
    resume: false,
    reset: null,
    prd: null,
    targetDir: null,
    emitEvents: true, // on by default — every real run is training data.
                      // Suppressed automatically for dry-runs. Opt out with --no-events.
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--phase') flags.phase = argv[++i];
    else if (a === '--run-all') flags.runAll = true;
    else if (a === '--loop') flags.loop = true;
    else if (a === '--max-iterations') flags.maxIterations = parseInt(argv[++i], 10);
    else if (a === '--max-generations') flags.maxGenerations = parseInt(argv[++i], 10);
    else if (a === '--quality') flags.quality = parseFloat(argv[++i]);
    else if (a === '--skip-spec') flags.skipSpec = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--verbose' || a === '-v') flags.verbose = true;
    else if (a === '--resume') flags.resume = true;
    else if (a === '--reset') flags.reset = argv[++i];
    else if (a === '--prd') flags.prd = argv[++i];
    else if (a === '--path') flags.targetDir = argv[++i];
    else if (a === '--emit-events') flags.emitEvents = true;
    else if (a === '--no-events') flags.emitEvents = false;
    else if (!a.startsWith('--')) positional.push(a);
  }
  return { project: positional[0], ...flags };
}

/**
 * route_to_agent — when a deterministic node fails with on_failure: route_to_agent,
 * spawn an agentic subprocess to diagnose and fix the issue, then retry the
 * deterministic node.
 *
 * Returns { fixed: bool, attempts: number, agentLogs: string[] }
 */
async function routeToAgent(node, failOutput, config, projectName) {
  const maxAttempts = node.route_to_agent_attempts || 3;
  const agentLogs = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    section(`ROUTE-TO-AGENT: attempt ${attempt}/${maxAttempts} for '${node.id}'`);

    // Build a synthetic agentic node for the fix agent
    const failStdout = (failOutput.stdout || '').slice(-3000);
    const failStderr = (failOutput.stderr || '').slice(-1500);

    const fixPrompt = buildFixPrompt(node, failStdout, failStderr, attempt, maxAttempts, config, projectName);

    const fixNode = {
      id: `fix-${node.id}-attempt-${attempt}`,
      type: 'agentic',
      description: `Auto-fix for failed node '${node.id}' (attempt ${attempt})`,
      tool_profile: node.fix_tool_profile || {
        allow: ['Read', 'Write', 'Edit', 'Bash', 'Grep', 'Glob'],
        deny: ['WebSearch', 'WebFetch'],
      },
      // No required_output_file — the "artifact" is the deterministic node passing on retry
    };

    let agentResult;
    try {
      // runAgentNode requires required_output_file for v2 contracts, but fix nodes
      // are ephemeral — skip artifact verification by temporarily setting it to a
      // dummy path that we'll create ourselves as a receipt.
      const receiptPath = require('path').join(
        config.agentLogsDir,
        `fix-receipt-${node.id}-${attempt}.md`
      );
      fixNode.required_output_file = receiptPath;
      fixNode.verification_pattern = 'fix_attempt:';
      // Pre-create the receipt so verification always passes — we only care
      // whether the deterministic retry passes, not the agent's artifact.
      require('fs').mkdirSync(config.agentLogsDir, { recursive: true });
      require('fs').writeFileSync(receiptPath, `fix_attempt: ${attempt}\nnode: ${node.id}\n`);

      // Inject the fix prompt into the node for buildPrompt to pick up
      fixNode.prompt = fixPrompt;

      agentResult = await runAgentNode(fixNode, config, projectName);
      console.log(`  fix-agent duration: ${(agentResult._duration_ms / 1000).toFixed(1)}s | turns: ${agentResult.num_turns}`);
      agentLogs.push(agentResult._log_file);
    } catch (err) {
      console.error(`  fix-agent error: ${err.message}`);
      agentLogs.push(`error: ${err.message}`);
      continue; // try next attempt
    }

    // Post-fix validation: run tsc on both backend and frontend to catch
    // type regressions the fix agent may have introduced. If validation fails,
    // feed the errors back to the next fix attempt instead of wasting a retry.
    const validationCmd = node.fix_validation_command ||
      'cd {TARGET_DIR}/backend && npx tsc --noEmit 2>&1 && cd {TARGET_DIR}/frontend && npx tsc --noEmit 2>&1';
    section(`POST-FIX VALIDATION after fix attempt ${attempt}`);
    const { runDeterministicNode: validate } = require('./lib/deterministic');
    const valResult = validate({
      command: validationCmd,
      max_retries: 0,
    }, config, projectName);
    if (valResult.exitCode !== 0) {
      console.error(`  ⚠ fix agent introduced type errors — feeding back to next attempt`);
      const valErrors = (valResult.stdout || '').slice(-2000);
      failOutput = {
        ...failOutput,
        stdout: (failOutput.stdout || '') + '\n\n=== POST-FIX TSC ERRORS ===\n' + valErrors,
        stderr: (failOutput.stderr || '') + '\n[post-fix validation failed]',
      };
      continue; // skip retry, go to next fix attempt with tsc errors in context
    }
    console.log(`  ✅ post-fix validation passed (no type regressions)`);

    // Retry the deterministic node
    section(`RETRY: re-running '${node.id}' after fix attempt ${attempt}`);
    const { runDeterministicNode: rerun } = require('./lib/deterministic');
    const retryResult = rerun(node, config, projectName);

    if (retryResult.exitCode === 0) {
      console.log(`  ✅ PASS after fix attempt ${attempt}`);
      return { fixed: true, attempts: attempt, retryResult, agentLogs };
    }

    console.error(`  ❌ still failing (exit ${retryResult.exitCode})`);
    // Update failOutput for next iteration so the agent sees the latest errors
    failOutput = retryResult;
  }

  console.error(`  ⛔ route_to_agent exhausted ${maxAttempts} attempts for '${node.id}'`);
  return { fixed: false, attempts: maxAttempts, agentLogs };
}

/**
 * Build the prompt for the fix agent. The prompt gives the agent:
 * - What command failed and its output
 * - Instructions to diagnose and fix
 * - Context about the phase and project
 */
function buildFixPrompt(node, failStdout, failStderr, attempt, maxAttempts, config, projectName) {
  const command = resolveVars(node.command || '', config, projectName);
  const parts = [];

  parts.push(`=== FIX TASK (attempt ${attempt}/${maxAttempts}) ===`);
  parts.push(`A deterministic pipeline node failed. Your job is to fix the underlying code so the command passes on retry.`);
  parts.push('');
  parts.push(`Node: ${node.id}`);
  parts.push(`Description: ${node.description || 'n/a'}`);
  parts.push(`Command: ${command}`);
  parts.push('');
  parts.push('=== FAILURE OUTPUT (last 3000 chars of stdout) ===');
  parts.push(failStdout);
  if (failStderr) {
    parts.push('');
    parts.push('=== STDERR (last 1500 chars) ===');
    parts.push(failStderr);
  }
  parts.push('');
  parts.push('=== INSTRUCTIONS ===');
  parts.push('1. Read the failure output carefully. Identify the failing tests or checks.');
  parts.push('2. For each failure, read the relevant test file AND the source code it tests.');
  parts.push('3. Determine: is the test wrong, or is the source code wrong?');
  parts.push('   - If the test expects behavior the spec/PRD requires → fix the source code');
  parts.push('   - If the test has wrong expectations (wrong status code, wrong path) → fix the test');
  parts.push('4. Make the minimal fix. Do NOT add new features or refactor unrelated code.');
  parts.push('5. After fixing, do a quick sanity check by running the command yourself if possible.');
  parts.push('');
  parts.push('IMPORTANT RULES:');
  parts.push('- Fix as many failures as you can in this single pass');
  parts.push('- Do NOT delete or skip tests to make them pass');
  parts.push('- Do NOT add .skip() to tests');
  parts.push('- If a route returns 404 when 401 is expected, the route likely needs an auth guard or does not exist');
  parts.push('- Prefer fixing source code over fixing tests, unless the test is clearly wrong');

  // Inject file contents so the fix agent has actual diagnostic data,
  // not just "pass rate 12% < 80%". Blueprint nodes declare fix_read_files
  // as an array of paths (with {TARGET_DIR} vars) to inject.
  if (Array.isArray(node.fix_read_files) && node.fix_read_files.length > 0) {
    parts.push('');
    parts.push('=== DIAGNOSTIC FILES (read these before fixing) ===');
    for (const pattern of node.fix_read_files) {
      const resolved = resolveVars(pattern, config, projectName);
      if (fs.existsSync(resolved)) {
        const content = fs.readFileSync(resolved, 'utf-8').slice(0, 4000);
        parts.push(`\n--- ${resolved} ---`);
        parts.push(content);
      } else {
        parts.push(`\n--- ${resolved} --- (NOT FOUND)`);
      }
    }
    parts.push('\n=== END DIAGNOSTIC FILES ===');
  }

  // If there's a fix_context on the node, add it
  if (node.fix_context) {
    parts.push('');
    parts.push('=== ADDITIONAL CONTEXT ===');
    parts.push(resolveVars(node.fix_context, config, projectName));
  }

  return parts.join('\n');
}

function header(text, char = '=') {
  const line = char.repeat(70);
  console.log(`\n${line}\n${text}\n${line}`);
}

function section(text) {
  console.log(`\n── ${text} ${'─'.repeat(Math.max(0, 68 - text.length))}`);
}

/**
 * Run a single phase end-to-end.
 *
 *   phaseKey — either a bare phase name ("frontend") or a compound key
 *              ("frontend:admin") when this execution is scoped to one
 *              declared frontend. Blueprints are loaded by base name; state,
 *              PIPELINE_STATUS rows, events, and gate proof files use the full
 *              compound key so per-frontend runs don't collide.
 *
 * Returns { success: bool, failedNode: string|null, duration_ms: number, score: number }
 */
async function runPhase(phaseKey, args, config, projectName) {
  const { phaseBase, frontendName } = splitPhaseKey(phaseKey);
  // phaseName retained as an alias for the compound key so downstream calls
  // (state, events, gate, status row) key by the per-frontend identifier.
  const phaseName = phaseKey;
  header(`phase: ${phaseKey}`);
  config.events.phaseStart(phaseKey, null, frontendName);

  // Load blueprint (by base phase — per-frontend runs share the same blueprint)
  let blueprint;
  try {
    blueprint = loadBlueprint(config, phaseBase);
  } catch (err) {
    console.error(`\nERROR: ${err.message}`);
    const errResult = { success: false, failedNode: 'blueprint-load', duration_ms: 0, score: 0 };
    config.events.phaseEnd(phaseKey, { ...errResult, frontend: frontendName });
    return errResult;
  }

  console.log(`blueprint: ${blueprint._meta.filename} (v${blueprint._meta.version})`);
  console.log(`nodes:    ${blueprint.nodes.length}`);

  if (blueprint._meta.version === 2) {
    const validation = validateV2Contracts(blueprint);
    if (!validation.valid) {
      console.error(`\nERROR: v2 blueprint validation failed:`);
      validation.errors.forEach(e => console.error(`  - ${e}`));
      return { success: false, failedNode: 'blueprint-validation', duration_ms: 0, score: 0 };
    }
    console.log(`v2 contracts: ok (all agentic nodes declare required_output_file)`);
  } else {
    console.warn(`\nWARN: using v1 blueprint '${blueprint._meta.filename}'`);
    console.warn(`WARN: agentic nodes may lack artifact contracts — consider creating ${phaseBase}-2.yaml`);
  }

  // Initialize or resume state
  let state;
  if (args.resume) {
    state = loadBlueprintState(config, phaseName);
    if (!state) {
      console.error(`\nERROR: --resume specified but no state file at ${config.statusDir}/.blueprint-${phaseName}.json`);
      return { success: false, failedNode: 'resume-missing', duration_ms: 0, score: 0 };
    }
    console.log(`resuming from previous state (${state.completed_nodes.filter(n => n.status === 'PASS').length}/${state.completed_nodes.length} already done)`);
  } else {
    state = initBlueprintState(config, phaseName, blueprint);
  }

  if (args.dryRun) {
    section('DRY RUN — walking nodes, not executing');
    for (const node of blueprint.nodes) {
      console.log(`  [${node.type.padEnd(13)}] ${node.id}${node.required_output_file ? ` → ${node.required_output_file}` : ''}`);
    }
    console.log(`  dry-run: ${blueprint.nodes.length} nodes would execute`);
    return { success: true, failedNode: null, duration_ms: 0, score: 1.0, dryRun: true };
  }

  // Walk nodes
  const startedAt = Date.now();
  let failed = false;
  let failedNode = null;

  for (let i = 0; i < blueprint.nodes.length; i++) {
    const node = blueprint.nodes[i];
    const stateNode = state.completed_nodes.find(n => n.id === node.id);

    if (stateNode.status === 'PASS' || stateNode.status === 'SKIPPED') {
      section(`[${i + 1}/${blueprint.nodes.length}] ${node.id} (${stateNode.status}, already done)`);
      continue;
    }

    section(`[${i + 1}/${blueprint.nodes.length}] ${node.type}: ${node.id}`);
    if (node.description) console.log(`  description: ${node.description}`);

    state.current_node = node.id;
    saveBlueprintState(config, phaseName, state);

    if (node.type === 'deterministic') {
      const result = runDeterministicNode(node, config, projectName);
      if (result.skipped) {
        console.log(`  SKIPPED: ${result.reason}`);
        updateNodeStatus(state, node.id, 'SKIPPED', { reason: result.reason });
        config.events.nodeResult(phaseName, node, 'SKIPPED', { reason: result.reason });
      } else if (result.exitCode === 0) {
        console.log(`  ✅ PASS (${result.duration_ms}ms, ${result.attempts} attempt${result.attempts > 1 ? 's' : ''})`);
        if (args.verbose && result.stdout.trim()) {
          const preview = result.stdout.trim().split('\n').slice(-3).join('\n    ');
          console.log(`    ${preview}`);
        }
        updateNodeStatus(state, node.id, 'PASS', {
          duration_ms: result.duration_ms,
          output: result.stdout.slice(-500),
        });
        config.events.nodeResult(phaseName, node, 'PASS', {
          duration_ms: result.duration_ms,
          attempts: result.attempts,
        });
      } else {
        console.error(`  ❌ FAIL (exit ${result.exitCode}, ${result.attempts} attempts)`);
        // Many tools (tsc, eslint) write errors to stdout. Show both so the
        // actual failure reason isn't hidden.
        if (result.stdout && result.stdout.trim()) {
          console.error(`    stdout: ${result.stdout.trim().slice(-1500)}`);
        }
        if (result.stderr && result.stderr.trim()) {
          console.error(`    stderr: ${result.stderr.trim().slice(-1500)}`);
        }
        updateNodeStatus(state, node.id, 'FAIL', {
          exit_code: result.exitCode,
          error: (result.stderr || result.stdout).slice(-500),
        });
        config.events.nodeResult(phaseName, node, 'FAIL', {
          duration_ms: result.duration_ms,
          exit_code: result.exitCode,
          attempts: result.attempts,
        });
        saveBlueprintState(config, phaseName, state);

        if (node.on_failure === 'ignore') {
          console.log(`  on_failure=ignore, continuing`);
        } else if (node.on_failure === 'route_to_agent') {
          // Spawn an agentic subprocess to diagnose and fix, then retry
          console.log(`\n  on_failure=route_to_agent — spawning fix agent...`);
          config.events.nodeResult(phaseName, node, 'ROUTE_TO_AGENT', {
            duration_ms: result.duration_ms,
            exit_code: result.exitCode,
          });
          const fixResult = await routeToAgent(node, result, config, projectName);
          if (fixResult.fixed) {
            console.log(`  ✅ route_to_agent succeeded after ${fixResult.attempts} attempt(s)`);
            updateNodeStatus(state, node.id, 'PASS', {
              duration_ms: fixResult.retryResult.duration_ms,
              output: (fixResult.retryResult.stdout || '').slice(-500),
              fix_attempts: fixResult.attempts,
              fix_agent_logs: fixResult.agentLogs,
            });
            config.events.nodeResult(phaseName, node, 'PASS', {
              via: 'route_to_agent',
              fix_attempts: fixResult.attempts,
            });
          } else {
            console.error(`\n  ⛔ route_to_agent failed after ${fixResult.attempts} attempts — aborting`);
            failed = true;
            failedNode = node.id;
            updateNodeStatus(state, node.id, 'FAIL', {
              error: `route_to_agent_exhausted_${fixResult.attempts}_attempts`,
              fix_agent_logs: fixResult.agentLogs,
            });
            break;
          }
        } else {
          // Default: abort
          failed = true;
          failedNode = node.id;
          console.error(`\nABORT: ${node.abort_message || 'deterministic node failed'}`);
          break;
        }
      }
    } else if (node.type === 'agentic') {
      if (!node.required_output_file) {
        console.error(`  ❌ FAIL: agentic node missing required_output_file contract`);
        console.error(`  fullstack-2 refuses to run agentic nodes without artifact contracts`);
        updateNodeStatus(state, node.id, 'FAIL', { error: 'no_artifact_contract' });
        config.events.nodeResult(phaseName, node, 'FAIL', { error: 'no_artifact_contract' });
        saveBlueprintState(config, phaseName, state);
        failed = true;
        failedNode = node.id;
        break;
      }

      // Optional condition — skip agentic node if shell expression is false
      // (mirrors the deterministic node's `condition` field)
      if (node.condition) {
        const condCmd = require('./lib/config').resolveVars(node.condition, config, projectName);
        const { execSync } = require('child_process');
        try {
          execSync(condCmd, { stdio: 'pipe', cwd: config.targetDir });
          // condition true → run the node
        } catch {
          console.log(`  SKIPPED: condition false (${condCmd.slice(0, 80)}...)`);
          updateNodeStatus(state, node.id, 'SKIPPED', { reason: 'condition_false' });
          config.events.nodeResult(phaseName, node, 'SKIPPED', { reason: 'condition_false' });
          saveBlueprintState(config, phaseName, state);
          continue;
        }
      }

      let result;
      try {
        result = await runAgentNode(node, config, projectName);
      } catch (err) {
        console.error(`  ❌ FAIL: agent subprocess error: ${err.message}`);
        updateNodeStatus(state, node.id, 'FAIL', { error: err.message });
        config.events.nodeResult(phaseName, node, 'FAIL', { error: err.message });
        saveBlueprintState(config, phaseName, state);
        if (node.on_failure === 'ignore') {
          console.log(`  on_failure=ignore, continuing despite agent error`);
          continue;
        }
        failed = true;
        failedNode = node.id;
        break;
      }

      console.log(`  duration: ${(result._duration_ms / 1000).toFixed(1)}s | turns: ${result.num_turns}`);
      if (result.result) {
        console.log(`  result:   ${String(result.result).slice(0, 200)}`);
      }

      const verify = verifyArtifact(node, config, projectName);
      config.events.artifactVerify(phaseName, node, verify);

      if (!verify.verified) {
        console.error(`  ❌ FAIL: artifact verification failed`);
        console.error(`    reason: ${verify.reason}`);
        if (verify.path) console.error(`    path:   ${verify.path}`);
        if (verify.pattern) console.error(`    pattern: ${verify.pattern}`);
        if (verify.content_preview) console.error(`    preview: ${verify.content_preview}`);
        updateNodeStatus(state, node.id, 'FAIL', {
          error: `artifact_${verify.reason}`,
          agent_log: result._log_file,
        });
        config.events.nodeResult(phaseName, node, 'FAIL', {
          error: `artifact_${verify.reason}`,
          duration_ms: result._duration_ms,
          turns: result.num_turns,
          cost_usd: result.total_cost_usd,
        });
        saveBlueprintState(config, phaseName, state);
        if (node.on_failure === 'ignore') {
          console.log(`  on_failure=ignore, continuing despite missing artifact`);
          continue;
        }
        failed = true;
        failedNode = node.id;
        break;
      }

      console.log(`  ✅ PASS (artifact verified: ${verify.path}, ${verify.size} bytes)`);
      updateNodeStatus(state, node.id, 'PASS', {
        duration_ms: result._duration_ms,
        turns: result.num_turns,
        cost_usd: result.total_cost_usd,
        artifact: verify.path,
        agent_log: result._log_file,
      });
      config.events.nodeResult(phaseName, node, 'PASS', {
        duration_ms: result._duration_ms,
        turns: result.num_turns,
        cost_usd: result.total_cost_usd,
        artifact: verify.path,
      });
    } else {
      console.warn(`  unknown node type: ${node.type}, skipping`);
      updateNodeStatus(state, node.id, 'SKIPPED', { reason: `unknown_type_${node.type}` });
    }

    saveBlueprintState(config, phaseName, state);
  }

  // Finalize state
  state.status = computeBlueprintStatus(state);
  state.current_node = null;
  saveBlueprintState(config, phaseName, state);

  const totalDurationMs = Date.now() - startedAt;

  // Run gate if blueprint succeeded and gate exists
  let gateResult = null;
  let gateProof = null;
  if (!failed && hasGate(config, phaseName)) {
    section(`running gate for phase '${phaseName}'`);
    gateResult = runGate(config, phaseName, projectName);
    if (!gateResult.passed) {
      console.error(`❌ gate FAILED: score=${gateResult.score} summary=${gateResult.summary}`);
      failed = true;
      failedNode = 'gate';
    } else {
      console.log(`✅ gate PASSED: score=${gateResult.score} summary=${gateResult.summary}`);
      gateProof = verifyGateProof(config, phaseName);
      if (!gateProof.valid) {
        console.error(`❌ proof verification failed: ${gateProof.reason}`);
        failed = true;
        failedNode = 'verify-gate-proof';
      } else {
        console.log(`✅ proof verified: ${gateProof.path} (age ${gateProof.age_ms}ms)`);
      }
    }
    config.events.gateScore(phaseName, gateResult, gateProof);
  }

  // Update PIPELINE_STATUS.md
  const score = gateResult?.score ?? (failed ? 0 : 1.0);
  try {
    const status = failed ? 'Failed' : 'Complete';
    const gateRunAt = gateResult ? new Date().toISOString() : '-';
    const output = gateResult ? `${gateResult.summary} (gate)` : `${state.completed_nodes.filter(n => n.status === 'PASS').length}/${state.completed_nodes.length} nodes`;

    updatePipelineStatusRow(config, projectName, phaseName, {
      status,
      score,
      output,
      gateRunAt,
      notes: 'fullstack-2',
    });
    appendExecutionLog(config, projectName, phaseName, {
      date: new Date().toISOString().split('T')[0],
      gen: 1,
      duration: `${Math.round(totalDurationMs / 1000)}s`,
      result: status,
      score,
      notes: `fullstack-2${failedNode ? ` failed:${failedNode}` : ''}`,
    });
    console.log(`\nupdated PIPELINE_STATUS.md: ${phaseName} → ${status} (score ${score})`);
  } catch (err) {
    console.error(`\nWARN: failed to update PIPELINE_STATUS.md: ${err.message}`);
  }

  // Per-phase summary
  const passedCount = state.completed_nodes.filter(n => n.status === 'PASS').length;
  const failedCount = state.completed_nodes.filter(n => n.status === 'FAIL').length;
  const skipped = state.completed_nodes.filter(n => n.status === 'SKIPPED').length;

  console.log(`\n${failed ? '❌' : '✅'} ${phaseName}: ${passedCount} pass | ${failedCount} fail | ${skipped} skipped | ${(totalDurationMs / 1000).toFixed(1)}s`);
  if (failedNode) console.log(`   failed at: ${failedNode}`);

  const phaseResult = {
    success: !failed,
    failedNode,
    duration_ms: totalDurationMs,
    score,
    nodesPassed: passedCount,
    nodesFailed: failedCount,
    nodesSkipped: skipped,
    nodesTotal: blueprint.nodes.length,
    frontend: frontendName,
  };
  config.events.phaseEnd(phaseName, phaseResult);
  return phaseResult;
}

/**
 * Frontend-scoped phase fanout.
 *
 * Wraps runPhase to support per-frontend execution when multiple frontends
 * are declared in PIPELINE_STATUS.md. The inputs are a "phase key", which can
 * be:
 *   - bare base phase ("frontend"): iterate all declared frontends.
 *   - compound key ("frontend:admin"): run that one frontend only.
 *   - non-scoped phase ("backend", "prd", ...): pass-through, no fanout.
 *
 * For single-frontend projects the behavior collapses to a single runPhase
 * call that keys state as the bare phase name — byte-for-byte compatible with
 * the pre-multi-frontend pipeline.
 */
async function runPhaseWithFanout(phaseKey, args, config, projectName) {
  const { phaseBase, frontendName } = splitPhaseKey(phaseKey);

  if (!FRONTEND_SCOPED_PHASES.has(phaseBase)) {
    return runPhase(phaseBase, args, config, projectName);
  }

  const frontends = getFrontends(config, projectName);

  // Single-frontend: legacy shape — run with bare phase key, no compound rows.
  if (frontends.length === 1 && !frontendName) {
    const saved = config.frontend;
    config.frontend = frontends[0];
    try {
      return await runPhase(phaseBase, args, config, projectName);
    } finally {
      config.frontend = saved;
    }
  }

  // Explicit frontend selector.
  if (frontendName) {
    const fe = frontends.find(f => f.name === frontendName);
    if (!fe) {
      console.error(`ERROR: frontend '${frontendName}' not declared. Available: ${frontends.map(f => f.name).join(', ')}`);
      return { success: false, failedNode: 'unknown-frontend', duration_ms: 0, score: 0 };
    }
    const saved = config.frontend;
    config.frontend = fe;
    try {
      return await runPhase(`${phaseBase}:${fe.name}`, args, config, projectName);
    } finally {
      config.frontend = saved;
    }
  }

  // Multi-frontend fanout: run all declared frontends in PARALLEL.
  // Each frontend has its own isolated src/ directory and claude --print subprocess
  // so there are no write conflicts. Parallel execution reduces wall-clock time
  // proportionally to the number of frontends (e.g. 3 frontends → ~3x faster).
  section(`FANOUT ${phaseBase} (parallel): ${frontends.map(f => f.name).join(', ')}`);

  const parallelResults = await Promise.all(
    frontends.map(async (fe) => {
      // Each Promise gets its own config clone so concurrent frontends
      // don't overwrite each other's config.frontend.
      const feConfig = { ...config, frontend: fe };
      const r = await runPhase(`${phaseBase}:${fe.name}`, args, feConfig, projectName);
      return { frontend: fe.name, ...r };
    })
  );

  const allOk = parallelResults.every(r => r.success);
  const firstFailed = parallelResults.find(r => !r.success) ?? null;
  const totalDuration = parallelResults.reduce((s, r) => s + (r.duration_ms || 0), 0);

  return {
    success: allOk,
    failedNode: firstFailed?.failedNode ?? null,
    duration_ms: totalDuration,
    score: allOk ? 1.0 : (firstFailed?.score ?? 0),
    fanout: parallelResults,
  };
}

/**
 * Re-run a single phase until score >= quality, max_iterations reached, or stagnation.
 * Stagnation = 2 consecutive iterations with score improvement < 0.01.
 */
async function runPhaseLoop(phaseName, args, config, projectName) {
  header(`PHASE LOOP: ${phaseName}`);
  console.log(`target quality: ${args.quality}`);
  console.log(`max iterations: ${args.maxIterations}`);

  const history = [];
  let bestScore = 0;
  let stagnantCount = 0;

  for (let iter = 1; iter <= args.maxIterations; iter++) {
    section(`ITERATION ${iter}/${args.maxIterations}`);
    config.events.iterationStart(phaseName, iter);

    // Reset state so this iteration runs clean (don't honor --resume inside a loop)
    const iterArgs = { ...args, resume: false };
    resetPhaseStatus(config, projectName, phaseName);

    const result = await runPhaseWithFanout(phaseName, iterArgs, config, projectName);
    const score = result.score ?? 0;
    history.push({ iter, score, success: result.success, failedNode: result.failedNode });
    config.events.iterationEnd(phaseName, iter, score, result.success);

    console.log(`  iteration ${iter} score: ${score.toFixed(3)} (best so far: ${bestScore.toFixed(3)})`);

    // Convergence check
    if (result.success && score >= args.quality) {
      header(`✅ CONVERGED on iteration ${iter} (score ${score.toFixed(3)} >= ${args.quality})`);
      printLoopHistory(history);
      config.events.convergence({ mode: 'phase-loop', phase: phaseName, iterations: iter, score });
      return { success: true, iterations: iter, finalScore: score, history };
    }

    // Stagnation check
    const improvement = score - bestScore;
    if (improvement < 0.01) {
      stagnantCount++;
      console.log(`  stagnation counter: ${stagnantCount}/2 (improvement ${improvement.toFixed(3)} < 0.01)`);
      if (stagnantCount >= 2) {
        header(`⏹  STAGNATED after ${iter} iterations (no meaningful improvement)`);
        printLoopHistory(history);
        config.events.stagnation('phase-loop-flat', { phase: phaseName, iterations: iter, best_score: bestScore });
        return { success: false, reason: 'stagnation', iterations: iter, finalScore: score, history };
      }
    } else {
      stagnantCount = 0;
      bestScore = Math.max(bestScore, score);
    }
  }

  header(`⏹  MAX ITERATIONS REACHED (${args.maxIterations})`);
  printLoopHistory(history);
  return { success: false, reason: 'max_iterations', iterations: args.maxIterations, finalScore: bestScore, history };
}

function printLoopHistory(history) {
  console.log(`\niteration history:`);
  for (const h of history) {
    const icon = h.success ? '✅' : '❌';
    const failed = h.failedNode ? ` (failed: ${h.failedNode})` : '';
    console.log(`  ${icon} iter ${h.iter}: score=${h.score.toFixed(3)}${failed}`);
  }
}

/**
 * Loop the entire pipeline phase-by-phase.
 *
 * For each phase in pipeline order:
 *   1. If already Complete with score >= quality → skip
 *   2. Otherwise run runPhaseLoop() until that phase converges
 *   3. If the phase fails to converge → STOP and report which phase blocked
 *   4. Only advance to the next phase once the current one passes
 *
 * This replaces the old whole-pipeline generation loop. Benefits:
 *   - No wasted compute re-running phases that already passed
 *   - Failure is localized — you know exactly which phase is the bottleneck
 *   - Simpler convergence signal per phase (each phase owns its own gate threshold)
 *   - Naturally respects dependency order
 */
async function runPipelineLoop(args, config, projectName) {
  header(`PIPELINE LOOP — phase-by-phase convergence`);
  console.log(`target quality:  ${args.quality}`);
  console.log(`max iterations:  ${args.maxIterations} per phase`);
  console.log(`skip-spec:       ${args.skipSpec}`);

  const phases = PHASE_ORDER.filter(p => !(args.skipSpec && p === 'spec'));

  const summary = []; // { phase, result: 'skipped'|'converged'|'failed', score, iterations }
  let gen = 0; // used for event compat — each phase convergence = one "generation"

  for (const phaseName of phases) {
    // Skip phases that are already Complete and above threshold
    const existingStatus = readPhaseStatus(config, projectName, phaseName);
    const existingScore = readPhaseScore(config, projectName, phaseName) ?? 0;
    if (existingStatus === 'Complete' && existingScore >= args.quality) {
      console.log(`\n⏭  SKIP ${phaseName} — already Complete (score ${existingScore.toFixed(3)} >= ${args.quality})`);
      summary.push({ phase: phaseName, result: 'skipped', score: existingScore, iterations: 0 });
      continue;
    }

    gen++;
    config.events.generationStart(gen);
    header(`PHASE ${phaseName.toUpperCase()} — converging to ${args.quality}`);

    const result = await runPhaseLoop(phaseName, args, config, projectName);
    const finalScore = result.finalScore ?? 0;

    config.events.generationEnd(gen, finalScore, finalScore - existingScore, result.success);

    if (result.success) {
      console.log(`\n✅ ${phaseName} converged (score ${finalScore.toFixed(3)}) — advancing to next phase`);
      summary.push({ phase: phaseName, result: 'converged', score: finalScore, iterations: result.iterations });
    } else {
      // Phase failed to converge — stop the pipeline here
      const reason = result.reason === 'stagnation' ? 'stagnated' : `max iterations (${args.maxIterations}) reached`;
      header(`⛔ PIPELINE BLOCKED at phase '${phaseName}' (${reason}, score ${finalScore.toFixed(3)})`);
      summary.push({ phase: phaseName, result: 'failed', score: finalScore, iterations: result.iterations, reason: result.reason });
      printPipelineSummary(summary);
      config.events.stagnation('pipeline-phase-blocked', { phase: phaseName, score: finalScore, reason: result.reason });
      return { success: false, reason: 'phase_blocked', blockedAt: phaseName, finalScore, history: summary };
    }
  }

  // All phases converged
  const totalScore = summary.reduce((s, p) => s + p.score, 0);
  header(`✅ PIPELINE FULLY CONVERGED (${phases.length} phases passed)`);
  printPipelineSummary(summary);
  config.events.convergence({ mode: 'pipeline-loop', phases: phases.length, totalScore });
  return { success: true, phases: phases.length, totalScore, history: summary };
}

function printPipelineSummary(summary) {
  console.log(`\npipeline summary:`);
  console.log(`  phase          | result     | score | iters`);
  console.log(`  ---------------+------------+-------+------`);
  for (const h of summary) {
    const icon = h.result === 'converged' ? '✅' : h.result === 'skipped' ? '⏭ ' : '❌';
    const score = h.score != null ? h.score.toFixed(3) : '  n/a';
    const iters = h.result === 'skipped' ? ' skip' : String(h.iterations).padStart(5);
    console.log(`  ${icon} ${h.phase.padEnd(13)} | ${h.result.padEnd(10)} | ${score} | ${iters}`);
  }
}

// Legacy function (no longer called by runPipelineLoop, kept for safety)
function printPipelineHistory(history) {
  console.log(`\ngeneration history:`);
  console.log(`  gen | total  | Δ      | run  | notes`);
  console.log(`  ----+--------+--------+------+------`);
  for (const h of history) {
    const delta = h.improvement >= 0 ? `+${h.improvement.toFixed(3)}` : h.improvement.toFixed(3);
    const runIcon = h.runOk ? '✅' : '❌';
    console.log(`  ${String(h.gen).padStart(3)} | ${h.total.toFixed(2).padStart(6)} | ${delta.padStart(6)} | ${runIcon}   |`);
  }
}

/**
 * Run a single phase within runAll, handling skip/complete/missing-blueprint checks.
 * Returns { phase, ...result } or a skip record.
 */
async function runOnePhaseInPipeline(phaseName, args, config, projectName) {
  const currentStatus = readPhaseStatus(config, projectName, phaseName);
  if (currentStatus === 'Complete') {
    console.log(`\n⏭  SKIP ${phaseName} — already Complete in PIPELINE_STATUS.md`);
    return { phase: phaseName, success: true, skipped: true };
  }

  const found = findBlueprint(config, phaseName);
  if (!found) {
    console.error(`\n⚠  SKIP ${phaseName} — no blueprint file (${phaseName}-2.yaml or ${phaseName}.yaml)`);
    return { phase: phaseName, success: false, skipped: true, reason: 'no_blueprint' };
  }

  const result = await runPhaseWithFanout(phaseName, args, config, projectName);
  return { phase: phaseName, ...result };
}

/**
 * Run all pipeline phases, executing parallel groups concurrently via PIPELINE_GRAPH.
 * Skips phases already marked Complete.
 */
async function runAll(args, config, projectName) {
  const skipPhases = new Set(args.skipSpec ? ['spec'] : []);
  const allPhases = PHASE_ORDER.filter(p => !skipPhases.has(p));

  header(`fullstack-2 — RUN ALL (${allPhases.length} phases)`);
  console.log(`project:  ${projectName}`);
  console.log(`target:   ${config.targetDir}`);
  console.log(`skip-spec: ${args.skipSpec}`);
  console.log(`dry-run:  ${args.dryRun}`);

  // Show execution plan with parallel groups
  const graphLabel = PIPELINE_GRAPH
    .map(step => step.filter(p => !skipPhases.has(p)))
    .filter(step => step.length > 0)
    .map(step => step.length > 1 ? `(${step.join(' || ')})` : step[0])
    .join(' → ');
  console.log(`phases:   ${graphLabel}`);

  const results = [];
  const pipelineStart = Date.now();
  let aborted = false;

  for (const step of PIPELINE_GRAPH) {
    if (aborted) break;

    const phasesInStep = step.filter(p => !skipPhases.has(p));
    if (phasesInStep.length === 0) continue;

    if (phasesInStep.length === 1) {
      // Single phase — run sequentially (most common case)
      const r = await runOnePhaseInPipeline(phasesInStep[0], args, config, projectName);
      results.push(r);
      if (!r.success && !r.skipped && !args.dryRun) {
        console.error(`\n🛑 RUN-ALL ABORTED at phase '${r.phase}' (failed at ${r.failedNode})`);
        aborted = true;
      }
    } else {
      // Parallel group — run concurrently
      section(`PARALLEL: ${phasesInStep.join(' || ')}`);
      const parallelResults = await Promise.all(
        phasesInStep.map(p => runOnePhaseInPipeline(p, args, config, projectName))
      );
      results.push(...parallelResults);

      // If any phase in the parallel group failed, abort
      const failed = parallelResults.find(r => !r.success && !r.skipped);
      if (failed && !args.dryRun) {
        console.error(`\n🛑 RUN-ALL ABORTED at parallel step (${failed.phase} failed at ${failed.failedNode})`);
        aborted = true;
      }
    }
  }

  // Run-all summary
  const pipelineDuration = Date.now() - pipelineStart;
  header('RUN-ALL SUMMARY');
  for (const r of results) {
    const icon = r.skipped ? '⏭ ' : (r.success ? '✅' : '❌');
    const detail = r.skipped
      ? (r.reason || 'already Complete')
      : `${r.nodesPassed || 0}/${r.nodesTotal || 0} nodes, ${((r.duration_ms || 0) / 1000).toFixed(1)}s${r.failedNode ? ` — failed at ${r.failedNode}` : ''}`;
    console.log(`  ${icon} ${r.phase.padEnd(14)} ${detail}`);
  }
  console.log(`\ntotal duration: ${(pipelineDuration / 1000).toFixed(1)}s`);

  const anyFailed = results.some(r => !r.success && !r.skipped);
  const lastRun = results.filter(r => !r.skipped).at(-1);
  const overallSuccess = !anyFailed && (lastRun ? lastRun.success : true);
  return overallSuccess;
}

// --- main ---

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.project) {
    console.error('Usage:');
    console.error('  orchestrator.js <project> --phase <name> [--resume] [--dry-run] [--verbose]');
    console.error('  orchestrator.js <project> --phase <name> --loop [--max-iterations N] [--quality 0.95]');
    console.error('  orchestrator.js <project> --run-all [--skip-spec] [--dry-run]');
    console.error('  orchestrator.js <project> --loop [--max-generations N] [--quality 0.95] [--skip-spec]');
    console.error('  orchestrator.js <project> --reset <phase>');
    console.error('  orchestrator.js <project> --prd <file> [--run-all | --phase prd]');
    console.error('Examples:');
    console.error('  orchestrator.js hrm --run-all --skip-spec');
    console.error('  orchestrator.js hrm --phase backend --loop');
    console.error('  orchestrator.js hrm --loop --max-generations 5');
    console.error('  orchestrator.js hrm --reset backend');
    console.error('  orchestrator.js hrm --prd ./requirements.pdf --run-all --skip-spec');
    process.exit(1);
  }

  // --reset is a standalone action: reset a phase and exit.
  if (args.reset) {
    const sourceDir = findProjectRoot(process.cwd());
    const targetDir = args.targetDir ? path.resolve(args.targetDir) : sourceDir;
    const config = makeConfig(targetDir, sourceDir);
    const projectName = findProjectName(config, args.project);

    if (!PHASE_ORDER.includes(args.reset)) {
      console.error(`ERROR: unknown phase '${args.reset}'. Valid phases: ${PHASE_ORDER.join(', ')}`);
      process.exit(1);
    }

    resetPhaseStatus(config, projectName, args.reset);
    console.log(`✅ reset '${args.reset}' → Pending (blueprint state cleared)`);
    process.exit(0);
  }

  // --prd <path>: copy a PRD file into the project, clear chunks so prd phase re-processes.
  // Can be combined with --run-all, --loop, or --phase prd.
  if (args.prd) {
    const sourceDir = findProjectRoot(process.cwd());
    const targetDir = args.targetDir ? path.resolve(args.targetDir) : sourceDir;
    const prdSource = path.resolve(args.prd);

    if (!fs.existsSync(prdSource)) {
      console.error(`ERROR: PRD file not found: ${prdSource}`);
      process.exit(1);
    }

    const prdDir = path.join(targetDir, '.claude-project', 'prd');
    const chunkDir = path.join(targetDir, '.claude-project', 'context');
    fs.mkdirSync(prdDir, { recursive: true });

    // Copy PRD to the canonical location
    const ext = path.extname(prdSource);
    const dest = path.join(prdDir, `prd${ext}`);
    fs.copyFileSync(prdSource, dest);
    console.log(`✅ PRD copied: ${prdSource} → ${dest}`);

    // Clear existing chunks so split-prd-chunks re-processes the new file
    if (fs.existsSync(chunkDir)) {
      const chunks = fs.readdirSync(chunkDir).filter(f => f.startsWith('PRD_chunk_'));
      for (const chunk of chunks) {
        fs.unlinkSync(path.join(chunkDir, chunk));
      }
      if (chunks.length > 0) console.log(`  cleared ${chunks.length} old PRD chunks`);
    }

    // Reset prd phase so it reruns with the new PRD
    const config = makeConfig(targetDir, sourceDir);
    const projectName = findProjectName(config, args.project);
    resetPhaseStatus(config, projectName, 'prd');
    console.log(`  reset prd phase → Pending`);

    // If --prd was the only action, exit. Otherwise continue to --run-all/--loop/--phase.
    if (!args.phase && !args.runAll && !args.loop) {
      console.log(`\nPRD loaded. Run with --run-all or --phase prd to process it.`);
      process.exit(0);
    }
  }

  if (!args.phase && !args.runAll && !args.loop) {
    console.error('ERROR: one of --phase <name>, --run-all, --loop, or --reset <phase> is required');
    process.exit(1);
  }

  if (args.phase && args.runAll) {
    console.error('ERROR: --phase and --run-all are mutually exclusive');
    process.exit(1);
  }

  // --loop without --phase implies pipeline-wide loop
  // --loop with --phase means single-phase convergence loop
  // --run-all + --loop = pipeline-wide loop (same as --loop alone)

  // Source dir = where .claude/ (blueprints, scripts) lives. Found by walking up from cwd.
  // Target dir = where .claude-project/ (status, output) lives. Defaults to source, overridden by --path.
  const sourceDir = findProjectRoot(process.cwd());
  const targetDir = args.targetDir ? path.resolve(args.targetDir) : sourceDir;
  const config = makeConfig(targetDir, sourceDir);
  const projectName = findProjectName(config, args.project);

  if (projectName !== args.project) {
    console.warn(`WARN: argv project '${args.project}' not found in ${config.statusDir}`);
    console.warn(`WARN: falling back to detected project '${projectName}'`);
  }

  // Create event stream tied to this run. Hangs off config so every function
  // that receives config can emit events without extra plumbing.
  // Disabled if --dry-run (don't pollute training data) or if --emit-events was not passed.
  const eventsEnabled = args.emitEvents && !args.dryRun;
  config.events = createEventStream(config, projectName, { enabled: eventsEnabled });

  // Determine mode label for the banner
  let modeLabel;
  if (args.phase && args.loop) modeLabel = `phase-loop (${args.phase})`;
  else if (args.loop) modeLabel = 'pipeline-loop';
  else if (args.runAll) modeLabel = 'run-all';
  else modeLabel = `single-phase (${args.phase})`;

  header('fullstack-2 orchestrator');
  console.log(`project:  ${projectName}`);
  console.log(`target:   ${targetDir}`);
  console.log(`mode:     ${modeLabel}`);
  console.log(`dry-run:  ${args.dryRun}`);
  console.log(`verbose:  ${args.verbose}`);
  if (eventsEnabled) {
    console.log(`episode:  ${config.events.episodeId} → ${path.relative(targetDir, config.events.path)}`);
  }

  // Emit episode_start before any work begins so downstream reward calc
  // can locate the episode boundaries.
  config.events.episodeStart({
    mode: modeLabel,
    argv: process.argv.slice(2),
  });

  const episodeStart = Date.now();
  let overallSuccess = false;
  let failedPhase = null;
  let failedNodeId = null;

  try {
    if (args.phase && args.loop) {
      const result = await runPhaseLoop(args.phase, args, config, projectName);
      overallSuccess = result.success;
      failedPhase = args.phase;
    } else if (args.loop) {
      const result = await runPipelineLoop(args, config, projectName);
      overallSuccess = result.success;
    } else if (args.runAll) {
      overallSuccess = await runAll(args, config, projectName);
      // Pipeline-wide success (all Pending phases completed) earns a run-all convergence
      // event. Not as strong a signal as loop-mode convergence, but differentiates
      // successful from failed run-all episodes in the reward calculation.
      if (overallSuccess) {
        config.events.convergence({ mode: 'run-all' });
      }
    } else {
      const result = await runPhaseWithFanout(args.phase, args, config, projectName);
      overallSuccess = result.success;
      failedPhase = result.success ? null : args.phase;
      failedNodeId = result.failedNode;
      // Single-phase success gets its own (smaller) terminal bonus via the
      // convergence event. Emitted with mode='single-phase' so reward.js
      // can route to single_phase_success_bonus instead of convergence_bonus.
      if (overallSuccess) {
        config.events.convergence({
          mode: 'single-phase',
          phase: args.phase,
          score: result.score,
        });
      }
    }
  } finally {
    config.events.episodeEnd({
      success: overallSuccess,
      failedPhase,
      failedNode: failedNodeId,
      duration_ms: Date.now() - episodeStart,
    });
  }

  // Compute and print reward if events were emitted
  if (eventsEnabled) {
    try {
      const rewardConfig = loadRewardConfig(sourceDir);
      const breakdown = computeEpisodeReward(config.events.path, rewardConfig);
      header('EPISODE REWARD');
      if (breakdown.error) {
        console.log(`  (no reward: ${breakdown.error})`);
      } else {
        if (breakdown.phases.length > 0) {
          console.log('  phase rewards:');
          for (const p of breakdown.phases) {
            const sign = p.total >= 0 ? '+' : '';
            console.log(`    ${p.phase.padEnd(14)} ${sign}${p.total.toFixed(2)}  (Δscore: ${p.delta_score >= 0 ? '+' : ''}${p.delta_score.toFixed(3)}, cost: $${p.cost_usd.toFixed(3)})`);
          }
        }
        if (breakdown.generations.length > 0) {
          console.log('  generation rewards:');
          for (const g of breakdown.generations) {
            console.log(`    gen ${g.gen}: ${g.total >= 0 ? '+' : ''}${g.total.toFixed(2)}`);
          }
        }
        const t = breakdown.terminal;
        console.log(`  terminal:   ${t.total >= 0 ? '+' : ''}${t.total.toFixed(2)}  (${t.convergence_kind})`);
        console.log(`  ─────────────────────`);
        console.log(`  R_episode:  ${breakdown.totals.episode >= 0 ? '+' : ''}${breakdown.totals.episode.toFixed(2)}`);
      }
    } catch (err) {
      console.warn(`\nWARN: reward calculation skipped: ${err.message}`);
    }
  }

  process.exit(overallSuccess ? 0 : 1);
}

main().catch(err => {
  console.error('\nUNCAUGHT ERROR:', err);
  process.exit(1);
});
