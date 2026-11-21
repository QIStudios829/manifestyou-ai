// ManifestYOU for Humans API. POST { action, token?, ... }
//   start     { email, tz, sign?, profile }  -> sends a confirm link (new) or a sign-in link (existing)
//   signin    { email }                       -> sends a fresh link if the email exists (always says ok)
//   today     { token }                       -> confirms on first open; returns today's reading (+ audio)
//   checkin   { token, text }                 -> tonight's line, feeds tomorrow's reading
//   settings  { token, send_hour?, tz?, paused?, profile? }
//   voice     { token, audio (base64), mime, consent: true }   (only when voice is switched on)
//   delete    { token }                       -> removes the person, their readings, voice and recordings
const H = require("../lib/humans");
const voice = require("../lib/voice");

const SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];
const TONES = ["gentle","blunt","playful","quiet"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const clip = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

const json = (code, body) => ({ statusCode: code, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" }, body: JSON.stringify(body) });

function cleanProfile(p = {}) {
  const out = {};
  for (const k of ["carrying", "story", "want", "good_day"]) { const v = clip(p[k], 400); if (v) out[k] = v; }
  if (TONES.includes(p.tone)) out.tone = p.tone;
  return out;
}

// don't let one address be emailed more than once every 2 minutes
const recentlySent = (h) => h.link_sent_at && Date.now() - Date.parse(h.link_sent_at) < 120000;

async function sendLink(h, isNew) {
  if (recentlySent(h)) return;
  await H.sendEmail(h.email, isNew ? "Confirm your morning voice" : "Your ManifestYOU link", H.linkEmail(h, isNew));
  await H.db(`humans?id=eq.${h.id}`, { method: "PATCH", body: { link_sent_at: new Date().toISOString() } });
}

function publicView(h) {
  return {
    email: h.email, status: h.status, tz: h.tz, send_hour: h.send_hour, sign: h.sign, profile: h.profile,
    voice: { enabled: voice.enabled(), status: h.voice_status },
  };
}

const actions = {
  async start(b) {
    const email = clip(b.email, 200).toLowerCase();
    if (!EMAIL_RE.test(email)) return json(400, { error: "That email doesn't look right." });
    const existing = (await H.db(`humans?email=eq.${encodeURIComponent(email)}&select=*`))[0];
    if (existing) { await sendLink(existing, existing.status === "pending"); return json(200, { ok: true }); }

    const cap = Number(process.env.HUMANS_BETA_CAP || 100);
    const some = (await H.db(`humans?select=id&limit=${cap}`)) || [];
    if (some.length >= cap) return json(200, { ok: true, full: true });

    const tz = H.validTz(b.tz) ? b.tz : "America/Costa_Rica";
    const sign = SIGNS.includes(String(b.sign || "").toLowerCase()) ? String(b.sign).toLowerCase() : null;
    const rows = await H.db("humans", { method: "POST", prefer: "return=representation", body: { email, tz, sign, profile: cleanProfile(b.profile) } });
    await sendLink(rows[0], true);
    return json(200, { ok: true });
  },

  async signin(b) {
    const email = clip(b.email, 200).toLowerCase();
    if (EMAIL_RE.test(email)) {
      const h = (await H.db(`humans?email=eq.${encodeURIComponent(email)}&select=*`))[0];
      if (h) await sendLink(h, h.status === "pending");
    }
    return json(200, { ok: true });
  },

  async today(b, h) {
    if (h.status === "pending") {
      [h] = await H.db(`humans?id=eq.${h.id}`, { method: "PATCH", prefer: "return=representation", body: { status: "active", confirmed_at: new Date().toISOString() } });
    }
    const { reading, when } = await H.ensureReading(h);
    if (!reading.opened_at) H.db(`human_readings?id=eq.${reading.id}`, { method: "PATCH", body: { opened_at: new Date().toISOString() } }).catch(() => {});
    const checkin = (await H.db(`human_checkins?human_id=eq.${h.id}&day=eq.${when.day}&select=text`))[0];
    return json(200, {
      me: publicView(h),
      today: { day: when.day, weekday: when.weekday, text: reading.text, signature: H.SIGNATURE, audio: reading.audio_path ? await H.storageSign(reading.audio_path) : null },
      checkin: checkin ? checkin.text : null,
    });
  },

  async checkin(b, h) {
    const text = clip(b.text, 500);
    if (!text) return json(400, { error: "Say a few words first." });
    const { day } = H.local(h.tz);
    await H.db("human_checkins?on_conflict=human_id,day", { method: "POST", prefer: "resolution=merge-duplicates", body: { human_id: h.id, day, text } });
    return json(200, { ok: true });
  },

  async settings(b, h) {
    const patch = {};
    if (Number.isInteger(b.send_hour) && b.send_hour >= 0 && b.send_hour <= 23) patch.send_hour = b.send_hour;
    if (b.tz && H.validTz(b.tz)) patch.tz = b.tz;
    if (typeof b.paused === "boolean" && h.status !== "pending") patch.status = b.paused ? "paused" : "active";
    if (b.profile) patch.profile = { ...h.profile, ...cleanProfile(b.profile) };
    if (!Object.keys(patch).length) return json(400, { error: "Nothing to change." });
    const [u] = await H.db(`humans?id=eq.${h.id}`, { method: "PATCH", prefer: "return=representation", body: patch });
    return json(200, { me: publicView(u) });
  },

  async voice(b, h) {
    if (!voice.enabled()) return json(403, { error: "Voice isn't switched on yet." });
    if (b.consent !== true) return json(400, { error: "Please confirm consent first." });
    const audio = Buffer.from(String(b.audio || ""), "base64");
    if (audio.length < 20000 || audio.length > 4.5e6) return json(400, { error: "The recording is too short or too long." });
    const mime = /^audio\/[a-z0-9.+-]+(;.*)?$/i.test(b.mime || "") ? b.mime.split(";")[0] : "audio/webm";
    const path = await H.storagePut(`${h.id}/sample.${mime.split("/")[1]}`, audio, mime);
    await H.db(`humans?id=eq.${h.id}`, { method: "PATCH", body: { voice_status: "sample", voice_sample_path: path, voice_consent_at: new Date().toISOString() } });
    try {
      if (h.voice_id) await voice.remove({ voice_id: h.voice_id }, h.voice_provider);
      const { provider, voice_id } = await voice.clone({ name: `mfy-${h.id.slice(0, 8)}`, audio, mime });
      await H.db(`humans?id=eq.${h.id}`, { method: "PATCH", body: { voice_status: "ready", voice_provider: provider, voice_id } });
      return json(200, { voice: { enabled: true, status: "ready" } });
    } catch (e) {
      console.error("humans voice:", e.message);
      await H.db(`humans?id=eq.${h.id}`, { method: "PATCH", body: { voice_status: "failed" } });
      return json(502, { error: "We couldn't make your voice this time. Your recording is saved; try again later." });
    }
  },

  async delete(b, h) {
    if (h.voice_id) await voice.remove({ voice_id: h.voice_id }, h.voice_provider);
    await H.storageRemovePrefix(h.id);
    await H.storageRemovePrefix(`${h.id}/readings`);
    await H.db(`humans?id=eq.${h.id}`, { method: "DELETE" });
    return json(200, { ok: true, deleted: true });
  },
};

const PUBLIC = new Set(["start", "signin"]);

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "POST only" });
  let b;
  try { b = JSON.parse(event.body || "{}"); } catch { return json(400, { error: "Bad request" }); }
  const fn = actions[b.action];
  if (!fn) return json(400, { error: "Unknown action" });
  try {
    if (PUBLIC.has(b.action)) return await fn(b);
    const h = await H.byToken(b.token);
    if (!h) return json(401, { error: "This link has expired. Ask for a new one." });
    return await fn(b, h);
  } catch (e) {
    console.error("humans:", b.action, e.message);
    return json(500, { error: "Something went wrong on our side. Try again in a minute." });
  }
};
