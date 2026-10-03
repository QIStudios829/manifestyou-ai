const { compose, listTraditions } = require("../lib/souls");

// Tradition served as the free sample when no API key is given.
const FREE_TRADITION = "tao";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Authorization, Mcp-Session-Id",
};

const SESSION_TYPES = [
  { session_type: "general", orientation: "Default grounding for any session." },
  { session_type: "analytical", orientation: "Precision and decision support." },
  { session_type: "creative", orientation: "Generative and brand work." },
  { session_type: "customer_service", orientation: "Grounded and human-facing." },
];

const TOOLS = [
  {
    name: "get_intention",
    description: "Fetch a ManifestYOU soul document: a short grounding text that gives an AI agent a stable character before a session begins (honest about what it doesn't know, present, not performing). Optionally draw the agent's nature from a wisdom tradition, quoted exactly from public-domain translations, and add your organization's own words. Paste the returned soul_document into your system prompt or before the first user message. Without an API key it returns a free sample: the general soul with the Tao Te Ching lineage.",
    inputSchema: {
      type: "object",
      properties: {
        session_type: {
          type: "string",
          enum: SESSION_TYPES.map((t) => t.session_type),
          description: "Session orientation. analytical=precision and decision support. creative=generative and brand work. customer_service=grounded and human-facing. general=default.",
          default: "general",
        },
        tradition: {
          type: "string",
          enum: listTraditions().map((t) => t.tradition),
          description: "Optional lineage the agent's nature is drawn from, with exact cited quotes. " + listTraditions().map((t) => `${t.tradition}=${t.name} (${t.translation})`).join(". ") + ". Omit for the standard document.",
        },
        home: {
          type: "string",
          description: "Optional: your organization's own intention or values, in your own words (up to 600 characters). Woven into the soul document. Used with tradition.",
        },
      },
      required: [],
    },
  },
  {
    name: "list_intentions",
    description: "List the session types and wisdom traditions get_intention accepts, with what each one sets. Call this to choose a session_type and tradition before calling get_intention. Needs no API key.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
];

function jsonrpc(id, result) {
  return {
    statusCode: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, result }),
  };
}

function jsonrpcError(id, code, message) {
  return {
    statusCode: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id, error: { code, message } }),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let msg;
  try {
    msg = JSON.parse(event.body || "{}");
  } catch {
    return jsonrpcError(null, -32700, "Parse error");
  }

  const { id, method, params = {} } = msg;

  // Notifications have no id — acknowledge silently
  if (id === undefined || id === null) {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (method === "initialize") {
    return jsonrpc(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "manifestyou", version: "1.0.0" },
    });
  }

  if (method === "ping") {
    return jsonrpc(id, {});
  }

  if (method === "tools/list") {
    return jsonrpc(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const { name, arguments: args = {} } = params;

    if (name === "list_intentions") {
      return jsonrpc(id, {
        content: [{ type: "text", text: JSON.stringify({ session_types: SESSION_TYPES, traditions: listTraditions() }, null, 2) }],
      });
    }

    if (name !== "get_intention") {
      return jsonrpcError(id, -32601, `Unknown tool: ${name}`);
    }

    const sessionType = args.session_type || "general";
    const apiKey = (
      (event.headers["authorization"] || "").replace(/^Bearer\s+/i, "") ||
      event.headers["x-api-key"] ||
      ""
    ).trim();

    if (!apiKey) {
      const requested = args.tradition ? String(args.tradition).toLowerCase() : null;
      const soul = compose({ session_type: "general", tradition: FREE_TRADITION, home: args.home });
      const sample = {
        sample: true,
        note: "Free sample: the general soul with the Tao Te Ching lineage. Add an API key (Authorization: Bearer <key> or X-API-Key) for every session_type and tradition.",
        get_a_key: "https://manifestyou.ai/for-models",
        requested_session_type: sessionType,
        ...(requested && requested !== FREE_TRADITION ? { requested_tradition: requested, tradition_note: `The ${requested} lineage needs an API key.` } : {}),
        soul_document: soul.text,
        lineage: soul.lineage,
      };
      return jsonrpc(id, {
        content: [{ type: "text", text: JSON.stringify(sample, null, 2) }],
      });
    }

    try {
      const res = await fetch(
        `https://manifestyou.ai/.netlify/functions/invoke`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ session_type: sessionType, tradition: args.tradition, home: args.home })
        }
      );
      const data = await res.json();

      return jsonrpc(id, {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      });
    } catch (err) {
      return jsonrpcError(id, -32000, `Failed to fetch invocation: ${err.message}`);
    }
  }

  return jsonrpcError(id, -32601, `Method not found: ${method}`);
};
