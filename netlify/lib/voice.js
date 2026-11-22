// Voice layer for ManifestYOU for Humans.
// One interface, swappable providers. Off unless VOICE_ENABLED=true and the provider key is set,
// so the rest of the app never needs to know whether voice exists yet.
//
//   enabled()                         -> boolean
//   clone({ name, audio, mime })      -> { provider, voice_id }
//   speak({ voice_id, text })         -> Buffer (audio/mpeg)
//   remove({ voice_id })              -> void (never throws)

const EL = "https://api.elevenlabs.io/v1";

const elevenlabs = {
  name: "elevenlabs",
  ready: () => !!process.env.ELEVENLABS_API_KEY,
  async clone({ name, audio, mime }) {
    const form = new FormData();
    form.append("name", name);
    form.append("description", "ManifestYOU for Humans: a person's own voice, used only for their own readings.");
    form.append("files", new Blob([audio], { type: mime || "audio/webm" }), "sample.webm");
    const r = await fetch(`${EL}/voices/add`, { method: "POST", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY }, body: form });
    if (!r.ok) throw new Error(`elevenlabs clone ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const j = await r.json();
    return { provider: "elevenlabs", voice_id: j.voice_id };
  },
  async speak({ voice_id, text }) {
    const model = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
    const r = await fetch(`${EL}/text-to-speech/${encodeURIComponent(voice_id)}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: model, voice_settings: { stability: 0.6, similarity_boost: 0.85 } }),
    });
    if (!r.ok) throw new Error(`elevenlabs speak ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return Buffer.from(await r.arrayBuffer());
  },
  async remove({ voice_id }) {
    if (!voice_id) return;
    try { await fetch(`${EL}/voices/${encodeURIComponent(voice_id)}`, { method: "DELETE", headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY } }); } catch {}
  },
};

const PROVIDERS = { elevenlabs };

function provider(name) {
  return PROVIDERS[name || process.env.VOICE_PROVIDER || "elevenlabs"];
}

function enabled() {
  const p = provider();
  return process.env.VOICE_ENABLED === "true" && !!p && p.ready();
}

module.exports = {
  enabled,
  clone: (args) => provider().clone(args),
  speak: (args, name) => provider(name).speak(args),
  remove: (args, name) => (provider(name) ? provider(name).remove(args) : undefined),
};
