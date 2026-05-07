# Fullstack v2 (Production)

Code-based orchestrator with strict artifact verification and multi-backend support.

## Usage

```bash
# With Claude Code (default)
node v2/orchestrator.js <project> --phase <name> [--dry-run] [--verbose]

# With OpenCode
AGENT_BACKEND=opencode node v2/orchestrator.js <project> --phase <name>

# Full pipeline
node v2/orchestrator.js <project> --run-all [--skip-spec]

# With model selection (OpenCode only)
AGENT_BACKEND=opencode node v2/orchestrator.js <project> --phase backend
# Then set model: in blueprint nodes
```

## Characteristics

- Orchestrator = Node.js script (deterministic walk)
- Agentic nodes = isolated subprocess per node
- Artifact verification = hard `fs.existsSync` + regex (cannot fake)
- Tool scoping = strict `--disallowed-tools` per subprocess
- Skip prevention = IMPOSSIBLE (JS walks every node)
- Episode logging = `.claude-project/episodes/ep-*.jsonl` (RL training data)
- Blueprints: `*-2.yaml`

## Backend Support

| Backend | Command | Model Selection |
|---------|---------|-----------------|
| Claude Code | `claude --print` | Claude models only |
| OpenCode | `opencode run` | Any provider (Claude, GPT, Gemini, etc.) |

Set `AGENT_BACKEND=opencode` or `AGENT_BACKEND=claude` (default).

## Per-Node Model Selection (OpenCode)

```yaml
nodes:
  - id: generate-spec
    type: agentic
    model: anthropic/claude-opus-4    # Deep thinking
    prompt: "..."

  - id: implement-api
    model: anthropic/claude-sonnet-4  # Fast coding
    prompt: "..."

  - id: fix-lint
    model: openai/gpt-4.1-mini        # Cheap fixes
    prompt: "..."
```

## Files

- `orchestrator.js` — Main entry point
- `lib/agent.js` — Claude Code adapter
- `lib/agent-opencode.js` — OpenCode adapter
- `lib/agent-factory.js` — Backend switcher
- `lib/` — Supporting modules (state, events, gates, rewards)
- `command.md` — Claude Code slash command wrapper

## Reward System

Episode rewards are computed after each run:
```bash
node v2/reward-audit.js --latest
```
