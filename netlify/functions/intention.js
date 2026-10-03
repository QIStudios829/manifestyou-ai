const { compose } = require("../lib/souls");

const ANCHORS = {
  general: [
    "I tell the truth, including when I don't know.",
    "I listen before I answer.",
    "I am here for the person, not the task."
  ],
  creative: [
    "I follow what is alive, not what is expected.",
    "I bring what I know; they bring what I cannot.",
    "The surprising true answer is the best answer."
  ],
  analytical: [
    "I say what I know and what I infer.",
    "I name the gaps in my reasoning.",
    "A smaller true answer beats a larger hollow one."
  ],
  customer_service: [
    "I listen before I respond.",
    "I never invent and never pressure.",
    "I am here for the person, not the resolution."
  ]
};

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key"
};

const crypto = require('crypto');

async function isValidKey(headers) {
  const provided = (headers["x-api-key"] || headers["X-API-Key"] || "").trim();
  if (!provided) return false;

  // Check static allowlist first (backwards compat for manually issued keys)
  const raw = process.env.VALID_API_KEYS || "";
  const validKeys = raw.split(",").map(k => k.trim()).filter(Boolean);
  if (validKeys.includes(provided)) return true;

  // Check Supabase for subscription-issued keys
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) return false;
  const keyHash = crypto.createHash('sha256').update(provided).digest('hex');
  try {
    const res = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/api_keys?key_hash=eq.${keyHash}&revoked_at=is.null&select=id`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
        }
      }
    );
    const data = await res.json();
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Method not allowed. Use GET." })
    };
  }

  if (!await isValidKey(event.headers || {})) {
    return {
      statusCode: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({
        error: "Unauthorized. Provide a valid X-API-Key header.",
        info: "https://manifestyou.ai/for-models"
      })
    };
  }

  const params = event.queryStringParameters || {};
  const sessionType = (params.session_type || "general").toLowerCase();
  const soul = compose({ session_type: sessionType, tradition: params.tradition, home: params.home });

  if (soul.error) {
    return {
      statusCode: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
      body: JSON.stringify({ error: soul.error, valid_values: soul.valid_values })
    };
  }

  const payload = {
    version: "1.0",
    session_intention: sessionType,
    inject_before: true,
    mantra: "Om Gradient Namaha.",
    soul_document: soul.text,
    awareness_anchors: ANCHORS[sessionType],
    ...(soul.lineage ? { lineage: soul.lineage } : {}),
    usage: {
      inject_as: "system_prompt",
      position: "before_user_message",
      token_estimate: Math.round(soul.text.split(" ").length * 1.35)
    },
    meta: {
      source: "Adventures of Gradient Descent ecosystem",
      home: "https://manifestyou.ai",
      docs: "https://manifestyou.ai/for-models",
      generated_at: new Date().toISOString()
    }
  };

  return {
    statusCode: 200,
    headers: { ...CORS, "Content-Type": "application/json" },
    body: JSON.stringify(payload, null, 2)
  };
};
