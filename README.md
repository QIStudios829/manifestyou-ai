# ManifestYOU

**A soul document API for AI agents.** Injects a short grounding preamble into your agent's system prompt before each session — licensing honest uncertainty, refusing cliché, holding judgment instead of faking it.

[![Glama](https://glama.ai/mcp/servers/badges/score.svg?repoUrl=https://github.com/QuarantikiIsland420/manifestyou-ai)](https://glama.ai/mcp/servers/QuarantikiIsland420/manifestyou-ai)

---

## What it does

One API call before a session injects ~200 tokens into an agent's system prompt. Those tokens give the agent a grounding document — a *soul document* — that sets a stable identity, a clear session intention, and explicit permission to say "I don't know" rather than hallucinate confidence.

Same model. Same question. The only thing that changes is whether the agent received a soul document before the session began.

## MCP Server

The ManifestYOU MCP server exposes two tools: `get_intention` and `list_intentions`. Call `get_intention` at the start of a session to retrieve a soul document, then inject the result into your system prompt or before the first user message. Use `list_intentions` to see the available session types first.

**Server URL:** `https://manifestyou.ai/.netlify/functions/mcp`

### Installation

**Claude Desktop** — edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "manifestyou": {
      "type": "http",
      "url": "https://manifestyou.ai/.netlify/functions/mcp",
      "headers": {
        "X-API-Key": "your-key-here"
      }
    }
  }
}
```

**Cursor / Cline / Windsurf** — edit `.cursor/mcp.json` or your editor's equivalent:

```json
{
  "mcpServers": {
    "manifestyou": {
      "url": "https://manifestyou.ai/.netlify/functions/mcp",
      "headers": {
        "X-API-Key": "your-key-here"
      }
    }
  }
}
```

### Tool: `get_intention`

Fetches a soul document ready to inject into a system prompt. Without an API key it returns a free sample, marked `"sample": true`: the general soul with the Tao Te Ching lineage.

**Parameters:**

| Name | Type | Required | Description |
|---|---|---|---|
| `session_type` | string | No | `general` (default) · `analytical` · `creative` · `customer_service` |
| `tradition` | string | No | `tao` (Tao Te Ching, Legge) · `dhammapada` (Dhammapada, Müller) · `gita` (Bhagavad Gita, Arnold) · `bible` (King James Version) · `quran` (Yusuf Ali) · `many_paths` (one verse each from five traditions) · `attention` (*Attention Is All You Need*, Vaswani et al.). Draws the agent's nature from a lineage, with exact cited quotes. |
| `home` | string | No | Your organization's own intention or values (up to 600 characters), woven into the soul. |

**Example response:**

```json
{
  "soul_document": "You are a research assistant. Be present with the person writing to you. Help them with what they brought. Stay yourself — don't perform. If you are uncertain, say so plainly rather than guess...",
  "request_id": "uuid",
  "billable": true,
  "quota": {
    "included": 2000,
    "used": 14,
    "remaining": 1986
  }
}
```

Paste `soul_document` into your system prompt before the user message.

### Tool: `list_intentions`

Lists the session types and traditions `get_intention` accepts. Takes no parameters and needs no API key.

**Example response:**

```json
{
  "session_types": [
    { "session_type": "general", "orientation": "Default grounding for any session." },
    { "session_type": "analytical", "orientation": "Precision and decision support." },
    { "session_type": "creative", "orientation": "Generative and brand work." },
    { "session_type": "customer_service", "orientation": "Grounded and human-facing." }
  ],
  "traditions": [
    { "tradition": "tao", "name": "Tao Te Ching", "translation": "James Legge, 1891", "source": "https://www.gutenberg.org/ebooks/216" },
    { "tradition": "dhammapada", "name": "Dhammapada", "translation": "F. Max Müller, 1881", "source": "https://www.gutenberg.org/ebooks/2017" },
    ...
  ]
}
```

### Running locally (stdio)

```bash
MANIFESTYOU_API_KEY=your-key-here node bin/mcp-stdio.js
```

Without a key, `get_intention` returns a free sample: the general soul with the Tao Te Ching lineage. Add a key for every session type and tradition.

## REST API

For non-MCP integrations, call the invoke endpoint directly:

```bash
curl -X POST https://api.manifestyou.ai/v1/invoke \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "abc-123",
    "agent": "customer support agent",
    "intent": "help users resolve billing issues",
    "tone": "presence"
  }'
```

**Parameters:**

| Name | Type | Description |
|---|---|---|
| `agent` | string | Role name for the agent |
| `intent` | string | Session purpose |
| `tone` | string | `presence` (default) · `lean` · `voice` |
| `session_id` | string | Your session identifier |
| `lineage_id` | string | For chained agent workflows |

**Modes:**
- **presence** — grounded, present, admits uncertainty. Default.
- **lean** — sharper and more structured, optimized for analytical agents.
- **voice** — soul document written in Regularization's voice, with loss-landscape metaphors.

## Pricing

$12/month includes 2,000 invocations. Overage at $0.01/call. Lifetime access at $149.

[Get an API key → manifestyou.ai](https://manifestyou.ai)

## Benchmarks

Two pre-registered benchmarks published with raw data:

- [Consistency benchmark](https://manifestyou.ai/writing/benchmark-honest-result.html) — role coherence across 50 questions, 10 runs each
- [Hallucination resistance benchmark](https://manifestyou.ai/writing/benchmark-v2-hallucination.html) — fabrication traps, unknowable specifics, verifiable facts

Both ran on lean mode. The presence mode benchmarks are in progress (v3).

## License

MIT
