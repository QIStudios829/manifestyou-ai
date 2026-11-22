// Hourly: write and email the morning reading for everyone whose local hour is their send hour.
// Readings already written today (e.g. opened early on the page) are emailed, not rewritten.
const H = require("../lib/humans");

const BATCH = 5, MAX_PER_RUN = 25, BUDGET_MS = 22000;

async function one(h, now) {
  const { reading, when } = await H.ensureReading(h, now);
  if (reading.emailed_at || reading.opened_at) return "skip";
  await H.sendEmail(h.email, `Your ${when.weekday} reading`, H.readingEmail(h, reading, when));
  await H.db(`human_readings?id=eq.${reading.id}`, { method: "PATCH", body: { emailed_at: new Date().toISOString() } });
  return "sent";
}

exports.handler = async () => {
  const t0 = Date.now(), now = new Date();
  const people = (await H.db("humans?status=eq.active&select=*")) || [];
  const due = people.filter((h) => H.local(h.tz, now).hour === h.send_hour).slice(0, MAX_PER_RUN);
  const tally = { due: due.length, sent: 0, skip: 0, failed: 0 };
  for (let i = 0; i < due.length && Date.now() - t0 < BUDGET_MS; i += BATCH) {
    const res = await Promise.allSettled(due.slice(i, i + BATCH).map((h) => one(h, now)));
    res.forEach((r) => { if (r.status === "fulfilled") tally[r.value]++; else { tally.failed++; console.error("morning:", r.reason && r.reason.message); } });
  }
  console.log("humans-morning", JSON.stringify(tally));
  return { statusCode: 200, body: JSON.stringify(tally) };
};
