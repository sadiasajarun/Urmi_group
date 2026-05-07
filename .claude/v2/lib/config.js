/**
 * fullstack-2 config — shared paths and constants
 */

const path = require('path');
const fs = require('fs');

function findProjectRoot(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, '.claude')) && fs.existsSync(path.join(dir, '.claude-project'))) {
      return dir;
    }
    dir = path.dirname(dir);
  }
  throw new Error(`No .claude/.claude-project root found from ${startDir}`);
}

/**
 * Build a config where .claude/ (blueprints, gates, scripts) is read from the SOURCE project
 * (where the orchestrator script lives — i.e. the cwd when --path isn't given, or the source
 * project containing claude-fullstack when --path is given), while .claude-project/ (status,
 * agent logs, generated output) is written to the TARGET project.
 */
function makeConfig(targetDir, sourceDir = null) {
  const target = path.resolve(targetDir);
  const source = sourceDir ? path.resolve(sourceDir) : target;
  return {
    targetDir: target,
    sourceDir: source,
    claudeDir: path.join(source, '.claude'),
    blueprintsDir: path.join(source, '.claude', 'blueprints'),
    gatesDir: path.join(source, '.claude', 'gates'),
    statusDir: path.join(target, '.claude-project', 'status'),
    gateProofsDir: path.join(target, '.claude-project', 'status', '.gate-proofs'),
    agentLogsDir: path.join(target, '.claude-project', 'agent-logs'),
    agentRunnerScript: path.join(source, '.claude', 'scripts', 'claude-agent-runner.js'),
  };
}

function loadYaml() {
  try {
    return require('yaml');
  } catch {
    const { execSync } = require('child_process');
    let globalPath;
    try {
      globalPath = execSync('npm root -g', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch (err) {
      throw new Error(`yaml package not found and 'npm root -g' failed: ${err.message}. Install: npm install yaml (in project) or npm install -g yaml`);
    }
    try {
      return require(path.join(globalPath, 'yaml'));
    } catch {
      throw new Error('yaml package not found. Install: npm install -g yaml');
    }
  }
}

/**
 * Reads tech_stack.backend / tech_stack.frontends[0] from PIPELINE_STATUS.md.
 * Cached per config object to avoid re-parsing.
 */
function getTechStack(config, projectName) {
  if (config._techStackCache) return config._techStackCache;
  const defaults = { backend: 'nestjs', frontend: 'react' };
  const statusFile = path.join(config.statusDir, projectName, 'PIPELINE_STATUS.md');
  if (!fs.existsSync(statusFile)) {
    config._techStackCache = defaults;
    return defaults;
  }
  const content = fs.readFileSync(statusFile, 'utf-8');
  // Match: backend: nestjs   (inside tech_stack: block)
  const backendMatch = content.match(/^\s*backend:\s*([A-Za-z0-9_-]+)/m);

  // Frontend tech resolution — three formats:
  //   1. Inline scalar:    frontends: [react]         → tech = "react"
  //   2. Legacy list:      frontends:\n    - react     → tech = "react"
  //   3. Structured list:  frontends:\n    - name: frontend-worker\n      dir: ...
  //      In format 3, list items are app descriptors (not tech names).
  //      The tech is always the submodule name — default to "react".
  const frontendsInline = content.match(/^\s*frontends:\s*\[\s*([A-Za-z0-9_-]+)/m);
  // Legacy list: "- react" where the first token after "- " is a bare tech name (no colon)
  const frontendsLegacy = content.match(/^\s*frontends:\s*\n\s*-\s+([A-Za-z0-9_-]+)\s*$/m);
  // Structured list: "- name: ..." — detected but tech is NOT in the list items
  const frontendsStructured = content.match(/^\s*frontends:\s*\n\s*-\s+name:/m);

  let frontend;
  if (frontendsInline) {
    frontend = frontendsInline[1];
  } else if (frontendsStructured) {
    // Structured multi-frontend — tech is the submodule, not the app name.
    // Default to "react"; override if a frontend_tech: field exists.
    const techOverride = content.match(/^\s*frontend_tech:\s*([A-Za-z0-9_-]+)/m);
    frontend = techOverride ? techOverride[1] : defaults.frontend;
  } else if (frontendsLegacy) {
    frontend = frontendsLegacy[1];
  } else {
    frontend = defaults.frontend;
  }

  const result = {
    backend: backendMatch ? backendMatch[1] : defaults.backend,
    frontend,
  };
  config._techStackCache = result;
  return result;
}

function resolveVars(str, config, projectName) {
  if (typeof str !== 'string') return str;
  const stack = getTechStack(config, projectName);

  // Directory and port variables — sourced from config.frontend (set by orchestrator
  // during per-frontend fanout) or from defaults. Non-frontend-scoped phases get defaults.
  const frontendDir = config.frontend?.dir || 'frontend';
  const frontendPort = String(config.frontend?.dev_port || 5173);
  const backendDir = 'backend';
  const backendPort = '3000';

  return str
    .replace(/\{TARGET_DIR\}/g, config.targetDir)
    .replace(/\{CLAUDE_DIR\}/g, config.claudeDir)
    .replace(/\{project\}/g, projectName)
    // Tech stack names (submodule dirs: nestjs, react)
    .replace(/\{BACKEND\}/g, stack.backend)
    .replace(/\{FRONTEND\}/g, stack.frontend)
    // Project directory names (backend/, frontend-worker/, etc.)
    .replace(/\{BACKEND_DIR\}/g, backendDir)
    .replace(/\{FRONTEND_DIR\}/g, frontendDir)
    // Dev server ports
    .replace(/\{BACKEND_PORT\}/g, backendPort)
    .replace(/\{FRONTEND_PORT\}/g, frontendPort)
    // Shell variable equivalents — word-boundary to avoid rewriting prefixes
    // (e.g., $FRONTEND_DIR must NOT become react_DIR)
    .replace(/\$BACKEND_DIR(?![A-Za-z0-9_])/g, backendDir)
    .replace(/\$FRONTEND_DIR(?![A-Za-z0-9_])/g, frontendDir)
    .replace(/\$BACKEND_PORT(?![A-Za-z0-9_])/g, backendPort)
    .replace(/\$FRONTEND_PORT(?![A-Za-z0-9_])/g, frontendPort)
    .replace(/\$BACKEND(?![A-Za-z0-9_])/g, stack.backend)
    .replace(/\$FRONTEND(?![A-Za-z0-9_])/g, stack.frontend);
}

/**
 * Find the project name. Preference order:
 *   1. If `preferred` matches a subdirectory of statusDir with a PIPELINE_STATUS.md, return it.
 *   2. Otherwise return the first subdirectory that has a PIPELINE_STATUS.md.
 *   3. Fall back to basename(targetDir).
 */
function findProjectName(config, preferred = null) {
  if (!fs.existsSync(config.statusDir)) return preferred || path.basename(config.targetDir);

  // Preference 1: exact match of the argv project name
  if (preferred) {
    const preferredFile = path.join(config.statusDir, preferred, 'PIPELINE_STATUS.md');
    if (fs.existsSync(preferredFile)) return preferred;
  }

  // Preference 2: first subdirectory with PIPELINE_STATUS.md
  for (const entry of fs.readdirSync(config.statusDir, { withFileTypes: true })) {
    if (entry.isDirectory() && !entry.name.startsWith('.')) {
      const statusFile = path.join(config.statusDir, entry.name, 'PIPELINE_STATUS.md');
      if (fs.existsSync(statusFile)) return entry.name;
    }
  }

  return preferred || path.basename(config.targetDir);
}

/**
 * getFrontends — read all declared frontends from PIPELINE_STATUS.md.
 *
 * Supports two formats:
 *   1. Structured list (format_version >= 2):
 *        frontends:
 *          - name: frontend-worker
 *            dir: frontend-worker
 *            html_dir: worker
 *            dev_port: 5173
 *   2. Legacy scalar list:
 *        frontends: [react]
 *      or
 *        frontends:
 *          - react
 *
 * Returns an array of frontend descriptor objects. Each object has at minimum:
 *   { name, dir, dev_port, html_dir?, role_prefixes? }
 *
 * Falls back to a single implicit entry derived from config.frontend when the
 * status file is absent or the frontends block cannot be parsed.
 */
function getFrontends(config, projectName) {
  const statusFile = path.join(config.statusDir, projectName, 'PIPELINE_STATUS.md');
  if (!fs.existsSync(statusFile)) {
    return [{ name: config.frontend || 'react', dir: 'frontend', dev_port: 5173, html_dir: '', role_prefixes: ['*'] }];
  }

  const content = fs.readFileSync(statusFile, 'utf-8');

  // Legacy scalar: frontends: [react]
  const inlineMatch = content.match(/^\s*frontends:\s*\[\s*([A-Za-z0-9_-]+)/m);

  // Line-by-line parser for structured YAML frontend list
  const lines = content.split('\n');
  const frontendsIdx = lines.findIndex(l => /^\s*frontends:\s*$/.test(l));

  if (frontendsIdx >= 0) {
    const entries = [];
    let current = null;
    for (let i = frontendsIdx + 1; i < lines.length; i++) {
      const line = lines[i];
      // Stop when we leave the frontends block (non-indented line or end of YAML block)
      if (/^\s*[a-z_]+:/.test(line) && !/^\s{2,}/.test(line)) break;
      if (/^\s*dashboards:/.test(line)) break;
      // New list item
      const itemMatch = line.match(/^\s+-\s+name:\s+(.+)/);
      if (itemMatch) {
        if (current) entries.push(current);
        current = { name: itemMatch[1].trim(), dir: '', dev_port: 5173, html_dir: '', role_prefixes: [] };
        continue;
      }
      if (!current) continue;
      // Key: value lines
      const kvMatch = line.match(/^\s+(\w[\w_-]*):\s+(.+)/);
      if (kvMatch) {
        const [, key, val] = kvMatch;
        if (key === 'dir') current.dir = val.trim();
        else if (key === 'dev_port') current.dev_port = parseInt(val, 10) || 5173;
        else if (key === 'html_dir') current.html_dir = val.trim();
      }
      // role_prefixes: ["a", "b"]
      const rpMatch = line.match(/^\s+role_prefixes:\s*\[([^\]]+)\]/);
      if (rpMatch) {
        current.role_prefixes = rpMatch[1].split(',').map(s => s.trim().replace(/["']/g, ''));
      }
    }
    if (current) entries.push(current);
    // Ensure dir defaults to name
    entries.forEach(e => { if (!e.dir) e.dir = e.name; });
    if (entries.length > 0) return entries;
  }

  if (inlineMatch) {
    return [{ name: inlineMatch[1], dir: 'frontend', dev_port: 5173, html_dir: '', role_prefixes: ['*'] }];
  }

  // Fallback
  return [{ name: config.frontend || 'react', dir: 'frontend', dev_port: 5173, html_dir: '', role_prefixes: ['*'] }];
}

module.exports = {
  findProjectRoot,
  makeConfig,
  loadYaml,
  resolveVars,
  findProjectName,
  getFrontends,
};
