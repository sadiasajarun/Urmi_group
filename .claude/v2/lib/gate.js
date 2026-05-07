/**
 * gate.js — runs gate scripts and verifies proof files
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

function gateScriptPath(config, phaseName) {
  return path.join(config.gatesDir, `${phaseName}-gate.sh`);
}

function hasGate(config, phaseName) {
  return fs.existsSync(gateScriptPath(config, phaseName));
}

function gateProofPath(config, phaseName) {
  return path.join(config.gateProofsDir, `${phaseName}.proof`);
}

function runGate(config, phaseName, projectName) {
  const script = gateScriptPath(config, phaseName);
  if (!fs.existsSync(script)) {
    return { ran: false, reason: 'no_gate_script' };
  }

  const projectArg = projectName || path.basename(config.targetDir);
  console.log(`\n[gate] running: bash ${path.relative(config.targetDir, script)} ${config.targetDir} ${projectArg}`);
  const startTime = Date.now();

  let stdout, exitCode = 0;
  const result = spawnSync('bash', [script, config.targetDir, projectArg], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    // No timeout — gate script runs to completion.
  });

  stdout = result.stdout || '';
  exitCode = result.status || 0;

  const duration = Date.now() - startTime;

  let parsed = null;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    // some gates may print plain text
  }

  return {
    ran: true,
    exitCode,
    duration_ms: duration,
    stdout,
    json: parsed,
    score: parsed?.score ?? null,
    passed: parsed?.passed ?? (exitCode === 0),
    summary: parsed?.summary ?? null,
  };
}

function verifyGateProof(config, phaseName, maxAgeMinutes = 10) {
  const file = gateProofPath(config, phaseName);
  if (!fs.existsSync(file)) {
    return { valid: false, reason: 'proof_missing', path: file };
  }
  const stat = fs.statSync(file);
  const ageMs = Date.now() - stat.mtimeMs;
  if (ageMs > maxAgeMinutes * 60 * 1000) {
    return { valid: false, reason: 'proof_stale', age_ms: ageMs, path: file };
  }
  const content = fs.readFileSync(file, 'utf-8');
  const gateMatch = content.match(/^gate: (\S+)/m);
  const scoreMatch = content.match(/^score: (\S+)/m);
  return {
    valid: true,
    path: file,
    gate: gateMatch?.[1],
    score: scoreMatch ? parseFloat(scoreMatch[1]) : null,
    age_ms: ageMs,
  };
}

module.exports = {
  gateScriptPath,
  hasGate,
  gateProofPath,
  runGate,
  verifyGateProof,
};
