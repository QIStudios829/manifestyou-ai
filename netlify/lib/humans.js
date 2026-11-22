// Shared pieces for ManifestYOU for Humans: database, links, local time, writing and sending readings.
const crypto = require("crypto");
const { compose, SIGNATURE } = require("./souls");
const voice = require("./voice");

const SITE = process.env.URL || "https://manifestyou.ai";
const MODEL = process.env.HUMANS_MODEL || "claude-haiku-4-5-20251001";
const BUCKET = "human-voice";

// ── Supabase (service key, server only) ──
function sb() {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Supabase not configured");
  return { url, key };
}
async function db(path, { method = "GET", body, prefer } = {}) {
  const { url, key } = sb();
  const r = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...(prefer ? { Prefer: prefer } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`db ${method} ${path.split("?")[0]} ${r.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}
async function storagePut(path, buf, type) {
  const { url, key } = sb();
  const r = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": type, "x-upsert": "true" }, body: buf,
  });
  if (!r.ok) throw new Error(`storage put ${r.status}`);
  return path;
}
async function storageSign(path, seconds = 3600) {
  const { url, key } = sb();
  const r = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path}`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: seconds }),
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.signedURL ? `${url}/storage/v1${j.signedURL}` : null;
}
async function storageRemovePrefix(prefix) {
  const { url, key } = sb();
  const h = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  try {
    const list = await (await fetch(`${url}/storage/v1/object/list/${BUCKET}`, { method: "POST", headers: h, body: JSON.stringify({ prefix, limit: 1000 }) })).json();
    const names = (Array.isArray(list) ? list : []).map((o) => `${prefix}/${o.name}`);
    if (names.length) await fetch(`${url}/storage/v1/object/${BUCKET}`, { method: "DELETE", headers: h, body: JSON.stringify({ prefixes: names }) });
  } catch {}
}

// ── links: "<id>.<hmac(id:version)>", so the server can rebuild a person's link for the morning email
// and revoke all of them by bumping token_version. Nothing secret is stored in the table.
const SECRET = () => crypto.createHash("sha256").update("humans-links:" + (process.env.HUMANS_SECRET || process.env.SUPABASE_SERVICE_KEY || "")).digest();
const sig = (id, v) => crypto.createHmac("sha256", SECRET()).update(`${id}:${v}`).digest("base64url").slice(0, 32);
const tokenFor = (h) => `${h.id}.${sig(h.id, h.token_version || 1)}`;
const todayLink = (h) => `${SITE}/humans/today#t=${tokenFor(h)}`;

async function byToken(token) {
  if (!token || typeof token !== "string") return null;
  const m = token.match(/^([0-9a-f-]{36})\.([A-Za-z0-9_-]{32})$/);
  if (!m) return null;
  const rows = await db(`humans?id=eq.${m[1]}&select=*`);
  const h = rows && rows[0];
  if (!h) return null;
  const want = Buffer.from(sig(h.id, h.token_version || 1)), got = Buffer.from(m[2]);
  return want.length === got.length && crypto.timingSafeEqual(want, got) ? h : null;
}

// ── local time ──
function validTz(tz) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}
function local(tz, now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "long" })
      .formatToParts(now).map((p) => [p.type, p.value])
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: Number(parts.hour), weekday: parts.weekday };
}

// ── writing a reading ──
const TONES = {
  gentle: "Speak gently and warmly, but do not flatter.",
  blunt: "Be direct and plain. Kind, but no cushioning.",
  playful: "Let a little dry humour in. Never at their expense.",
  quiet: "Use very few words. Leave space.",
};

function buildPrompt(human, checkins, recent, when) {
  const p = human.profile || {};
  const lines = [
    `Today is ${when.weekday}.`,
    p.carrying && `What I am carrying right now: "${p.carrying}"`,
    p.story && `What I keep telling myself: "${p.story}"`,
    p.want && `What I want, if nobody was grading it: "${p.want}"`,
    p.good_day && `A good ordinary day for me: "${p.good_day}"`,
    human.sign && `My sign (just colour, never the point): ${human.sign}`,
  ].filter(Boolean);
  const ci = checkins.map((c) => `${c.day}: "${c.text}"`).join("\n");
  const past = recent.map((r) => r.text.slice(0, 280)).join("\n---\n");
  return [
    "Write this morning's reading for one person. They will hear it in their own voice, so write it in the first person, as them talking to themselves (\"I\", never \"you\").",
    "",
    "What they told me:",
    lines.join("\n"),
    ci ? `\nTheir recent evening check-ins (newest last):\n${ci}` : "",
    past ? `\nRecent readings, do not repeat their images or advice:\n${past}` : "",
    "",
    "Rules:",
    "- 110 to 160 words. Plain spoken English that sounds natural read aloud. No lists, headers, emoji or em dashes.",
    "- Start from where they actually are (the latest check-in if there is one), not where they think they should be.",
    "- Tell the truth gently. No promises about outcomes, money, love or the universe delivering things.",
    "- Name one small, concrete thing to do today.",
    "- If anything suggests they might hurt themselves or are in danger, set the reading aside and gently say that today the one thing is to tell someone they trust, or call or text a local crisis line.",
    `- ${TONES[p.tone] || TONES.gentle}`,
    `- End with one short line on its own. Do not sign it; "${SIGNATURE}" is added after.`,
    "Return only the reading.",
  ].join("\n");
}

// Free fallback when the model is unavailable: their own words handed back, plainly.
function templateReading(human, checkins) {
  const p = human.profile || {};
  const latest = checkins.length ? checkins[checkins.length - 1].text : null;
  const s = [];
  s.push(latest ? `Last night I said: ${latest.replace(/[.\s]+$/, "")}. That is where I am starting from, not where I wish I was.`
                : "I am starting from where I actually am this morning, not where I think I should be.");
  if (p.carrying) s.push(`I am carrying ${p.carrying.replace(/[.\s]+$/, "")}. I do not have to set it all down today. I only have to notice how heavy it is.`);
  if (p.story) s.push(`I keep telling myself ${p.story.replace(/[.\s]+$/, "")}. Today I can hold that story a little more loosely and see what is underneath.`);
  if (p.good_day) s.push(`A good ordinary day looks like ${p.good_day.replace(/[.\s]+$/, "")}. I can make one small piece of that happen before noon.`);
  s.push("One breath before I start. Then one small true step.");
  return s.join(" ");
}

async function writeReading(human, when) {
  const [checkins, recent] = await Promise.all([
    db(`human_checkins?human_id=eq.${human.id}&order=day.desc&limit=3&select=day,text`).then((r) => (r || []).reverse()),
    db(`human_readings?human_id=eq.${human.id}&order=day.desc&limit=3&select=text`),
  ]);
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const soul = compose({
        session_type: "general",
        agent: "the morning voice of one person, speaking to themselves",
        intent: "help this person meet today honestly, from where they actually are",
      }).text;
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({ model: MODEL, max_tokens: 500, system: soul, messages: [{ role: "user", content: buildPrompt(human, checkins, recent || [], when) }] }),
      });
      const j = await r.json();
      const text = j && j.content && j.content[0] && j.content[0].text && j.content[0].text.trim();
      if (r.ok && text) return { text: text.replace(/—/g, ", "), model: MODEL };
      console.error("humans: model failed", r.status, j && j.error && j.error.message);
    } catch (e) { console.error("humans: model error", e.message); }
  }
  return { text: templateReading(human, checkins), model: "template" };
}

// Get today's reading, writing (and voicing) it if it doesn't exist yet.
async function ensureReading(human, now = new Date()) {
  const when = local(human.tz, now);
  const have = await db(`human_readings?human_id=eq.${human.id}&day=eq.${when.day}&select=*`);
  if (have && have[0]) return { reading: have[0], when };
  const { text, model } = await writeReading(human, when);
  let audio_path = null;
  if (voice.enabled() && human.voice_status === "ready" && human.voice_id) {
    try {
      const buf = await voice.speak({ voice_id: human.voice_id, text: `${text} ${SIGNATURE}` }, human.voice_provider);
      audio_path = await storagePut(`${human.id}/readings/${when.day}.mp3`, buf, "audio/mpeg");
    } catch (e) { console.error("humans: voice failed", e.message); }
  }
  // on_conflict keeps the first one if two requests race
  const rows = await db(`human_readings?on_conflict=human_id,day`, {
    method: "POST", prefer: "resolution=ignore-duplicates,return=representation",
    body: { human_id: human.id, day: when.day, text, model, audio_path },
  });
  if (rows && rows[0]) return { reading: rows[0], when };
  const again = await db(`human_readings?human_id=eq.${human.id}&day=eq.${when.day}&select=*`);
  return { reading: again[0], when };
}

// ── email (Resend) ──
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function shell(inner) {
  return `<div style="background:#06070a;padding:32px 16px;font-family:Georgia,serif"><div style="max-width:520px;margin:0 auto;background:#0d1110;border:1px solid #2a3a2c;border-radius:20px;padding:32px 28px;color:#e8e2d4;font-size:16px;line-height:1.7">${inner}<p style="margin:28px 0 0;font:11px/1.6 monospace;letter-spacing:.12em;color:#7d8a7a">MANIFESTYOU · FOR HUMANS</p></div></div>`;
}
const button = (href, label) =>
  `<p style="margin:26px 0 0"><a href="${href}" style="display:inline-block;padding:13px 24px;border-radius:999px;border:1px solid #a8d38d;color:#a8d38d;text-decoration:none;font:12px monospace;letter-spacing:.2em;text-transform:uppercase">${label}</a></p>`;

async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "ManifestYOU <noreply@send.manifestyou.ai>", reply_to: process.env.HUMANS_REPLY_TO || undefined, to, subject, html }),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

function linkEmail(human, isNew) {
  const href = todayLink(human);
  return shell(
    (isNew
      ? `<p style="margin:0 0 14px">You asked for a morning voice that tells you the truth. Tap below to confirm it's you, and your first reading will be waiting.</p>`
      : `<p style="margin:0 0 14px">Here is your link back in. It replaces any older link.</p>`) +
    button(href, isNew ? "Confirm and read" : "Open today") +
    `<p style="margin:22px 0 0;font-size:13px;color:#8d978a">If you didn't ask for this, ignore it and nothing happens.</p>`
  );
}

function readingEmail(human, reading, when) {
  const first = reading.text.split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  return shell(
    `<p style="margin:0 0 6px;font:11px monospace;letter-spacing:.2em;color:#a8d38d">${esc(when.weekday.toUpperCase())}</p>` +
    `<p style="margin:0">${esc(first)} …</p>` +
    button(todayLink(human), "Breathe, then read") +
    `<p style="margin:22px 0 0;font-size:13px;color:#8d978a">Pause, change the time, or delete everything from the same page.</p>`
  );
}

module.exports = {
  db, storagePut, storageSign, storageRemovePrefix, tokenFor, byToken, todayLink,
  validTz, local, ensureReading, sendEmail, linkEmail, readingEmail, buildPrompt, templateReading, SIGNATURE,
};
