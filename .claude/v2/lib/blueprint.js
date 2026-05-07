/**
 * blueprint.js — loads and validates blueprint YAML
 *
 * Looks up "{phase}-2.yaml" first (v2 blueprints with artifact contracts).
 * Falls back to "{phase}.yaml" (v1 blueprint) only if v2 missing.
 */

const fs = require('fs');
const path = require('path');
const { loadYaml } = require('./config');

function findBlueprint(config, phaseName) {
  const v2Path = path.join(config.blueprintsDir, `${phaseName}-2.yaml`);
  if (fs.existsSync(v2Path)) {
    return { path: v2Path, version: 2 };
  }
  const v1Path = path.join(config.blueprintsDir, `${phaseName}.yaml`);
  if (fs.existsSync(v1Path)) {
    return { path: v1Path, version: 1 };
  }
  return null;
}

function loadBlueprint(config, phaseName) {
  const found = findBlueprint(config, phaseName);
  if (!found) {
    throw new Error(`Blueprint not found for phase '${phaseName}'. Looked for ${phaseName}-2.yaml and ${phaseName}.yaml in ${config.blueprintsDir}`);
  }
  const yaml = loadYaml();
  const content = fs.readFileSync(found.path, 'utf-8');
  const parsed = yaml.parse(content);
  parsed._meta = {
    path: found.path,
    version: found.version,
    filename: path.basename(found.path),
  };
  return parsed;
}

/**
 * Validates a v2 blueprint has artifact contracts on every agentic node.
 * Returns { valid: bool, errors: [] }
 */
function validateV2Contracts(blueprint) {
  const errors = [];
  if (!Array.isArray(blueprint.nodes)) {
    return { valid: false, errors: ['blueprint has no nodes array'] };
  }
  for (const node of blueprint.nodes) {
    if (node.type === 'agentic') {
      if (!node.required_output_file) {
        errors.push(`agentic node '${node.id}' missing required_output_file`);
      }
      // verification_pattern is optional but recommended
    }
  }
  return { valid: errors.length === 0, errors };
}

module.exports = {
  findBlueprint,
  loadBlueprint,
  validateV2Contracts,
};
