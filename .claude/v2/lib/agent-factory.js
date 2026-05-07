/**
 * agent-factory.js — picks between Claude Code and OpenCode backends
 *
 * Usage in orchestrator.js:
 *   const { runAgentNode, verifyArtifact } = require('./lib/agent-factory');
 *
 * Control via:
 *   - Environment: AGENT_BACKEND=opencode|claude
 *   - Config: config.agentBackend = 'opencode' | 'claude'
 *   - Per-node: node.backend = 'opencode' | 'claude'
 *
 * Priority: node.backend > config.agentBackend > AGENT_BACKEND env > 'claude' (default)
 */

const claudeAgent = require('./agent');
const opencodeAgent = require('./agent-opencode');

/**
 * Determine which backend to use for a given node.
 */
function getBackend(node, config) {
  // Per-node override (highest priority)
  if (node?.backend) {
    return node.backend;
  }
  
  // Config-level setting
  if (config?.agentBackend) {
    return config.agentBackend;
  }
  
  // Environment variable
  if (process.env.AGENT_BACKEND) {
    return process.env.AGENT_BACKEND;
  }
  
  // Default to Claude Code for backward compatibility
  return 'claude';
}

/**
 * Get the agent module for the specified backend.
 */
function getAgentModule(backend) {
  switch (backend.toLowerCase()) {
    case 'opencode':
    case 'oc':
      return opencodeAgent;
    case 'claude':
    case 'cc':
    default:
      return claudeAgent;
  }
}

/**
 * Run an agentic node using the appropriate backend.
 */
async function runAgentNode(node, config, projectName, options = {}) {
  const backend = getBackend(node, config);
  const agent = getAgentModule(backend);
  
  console.log(`[agent-factory] backend: ${backend}`);
  
  return agent.runAgentNode(node, config, projectName, options);
}

/**
 * Verify artifact using the appropriate backend.
 * (Currently identical for both, but factory pattern allows future divergence)
 */
function verifyArtifact(node, config, projectName) {
  const backend = getBackend(node, config);
  const agent = getAgentModule(backend);
  
  return agent.verifyArtifact(node, config, projectName);
}

/**
 * Re-export buildPrompt for compatibility (used by routeToAgent in orchestrator.js)
 */
function buildPrompt(node, config, projectName, retryContext) {
  const backend = getBackend(node, config);
  const agent = getAgentModule(backend);
  
  return agent.buildPrompt(node, config, projectName, retryContext);
}

module.exports = {
  getBackend,
  getAgentModule,
  runAgentNode,
  verifyArtifact,
  buildPrompt,
};
