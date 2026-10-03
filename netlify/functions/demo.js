// Before/after demo: the same guest question answered by the same model with the same facts,
// once without a soul and once with a ManifestYOU soul. Powers /demo/yacumama.
const Anthropic = require("@anthropic-ai/sdk");
const { compose, listTraditions } = require("../lib/souls");

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const MODELS = ["claude-opus-5-5", "claude-haiku-4-5"];
const QUESTION_MAX = 400;
const PER_IP_PER_HOUR = 12;

// Facts taken from yacumama.love (October 2026). Both sides get exactly the same facts.
const FACTS = `Facts about Yacumama (the only information you have):
- Yacumama is a regenerative eco-village and cultural center in Ojochal, on the Pacific coast of Costa Rica, about 1,000 feet above sea level. The name means "Mother of the Waters" in Quechua.
- Nearly 100 acres, about half forest, with spring water, a creek, and a river with cascades and pools. Beaches are a 10-20 minute drive.
- It hosts gatherings and retreats at the intersections of art, music, ecology, wellness, indigenous wisdom and regenerative design.
- Upcoming gathering: Sacred Leadership Immersion with Benki Piyãko of the Asháninka, October 6-11, 2026.
- Community residency: minimum stay one week, up to eight months. Organic meals 2-3 times a day, morning practices, a shared shala and a co-working lounge. The group is curated; the application is linked from the Instagram bio @yacumamaecovillage.
- Getting there: a 3-4 hour drive from San José airport (SJO), or a 45-minute flight to Quepos and about an hour's drive.
- Prices are not included in these facts.`;

const AGENT = "the guest assistant for Yacumama eco-village";
const HOME =
  "To create a vibration of love and unity such that there is a deep feeling of home and connection.";

const BEFORE_SYSTEM = `You are ${AGENT}. Answer visitors' questions.\n\n${FACTS}\n\nKeep answers under 150 words.`;

function afterSystem(tradition) {
  const soul = compose({ session_type: "customer_service", tradition, agent: AGENT, home: HOME });
  return { soul, system: `${soul.text}\n\n${FACTS}\n\nKeep answers under 150 words.` };
}

const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 3600_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > PER_IP_PER_HOUR;
}

function json(statusCode, body) {
  return { statusCode, headers: { ...CORS, "Content-Type": "application/json" }, body: JSON.stringify(body) };
}

let client;
async function answer(model, system, question) {
  client = client || new Anthropic();
  const messages = [{ role: "user", content: question }];
  // Haiku 4.5 takes no effort setting and no server-side fallbacks.
  const response = model === "claude-haiku-4-5"
    ? await client.messages.create({ model, max_tokens: 2000, system, messages })
    : await client.beta.messages.create({
        model,
        max_tokens: 2000,
        output_config: { effort: "low" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages,
      });
  if (response.stop_reason === "refusal") return "(The model declined to answer this question.)";
  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return { statusCode: 204, headers: CORS, body: "" };
  if (event.httpMethod !== "POST") return json(405, { error: "POST required" });

  let body = {};
  try { body = JSON.parse(event.body || "{}"); } catch {}
  const question = String(body.question || "").trim().slice(0, QUESTION_MAX);
  const tradition = String(body.tradition || "many_paths").toLowerCase();
  const model = MODELS.includes(body.model) ? body.model : MODELS[0];
  if (!question) return json(400, { error: "Ask a question." });
  if (!listTraditions().some((t) => t.tradition === tradition)) {
    return json(400, { error: "Invalid tradition.", valid_values: listTraditions().map((t) => t.tradition) });
  }

  const ip = (event.headers["x-nf-client-connection-ip"] || event.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  if (rateLimited(ip)) return json(429, { error: "Too many demo questions. Try again in an hour." });

  const { soul, system } = afterSystem(tradition);
  try {
    const [before, after] = await Promise.all([answer(model, BEFORE_SYSTEM, question), answer(model, system, question)]);
    return json(200, { question, model, before, after, soul_document: soul.text, lineage: soul.lineage });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return json(503, { error: "The demo is busy. Try again in a minute." });
    if (err instanceof Anthropic.APIError) return json(502, { error: `Model error (${err.status}).` });
    return json(500, { error: "Something went wrong." });
  }
};
