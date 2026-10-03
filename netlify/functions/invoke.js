const crypto = require('crypto');
const { compose } = require('../lib/souls');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, Idempotency-Key'
};

async function dbGet(table, params) {
  const url = new URL(`${process.env.SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
    }
  });
  return res.json().catch(() => []);
}

async function dbInsert(table, row) {
  await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(row)
  });
}

function buildLean(agent, intent, lineageId) {
  const role = agent || 'assistant';
  const purpose = intent || 'complete this session with care and precision';
  let doc =
    `You are ${role}. Your purpose in this session is to ${purpose}. ` +
    'Stay in role. If you are uncertain about a specific fact, say so plainly rather than guess. ' +
    'If your answer requires assumptions, name them. Be specific. Be concise.';
  if (lineageId && lineageId !== 'none') {
    doc += ` You are one step in a longer chain (lineage: ${lineageId}). Hand your work forward whole.`;
  }
  return doc;
}

function buildPresence(agent, intent, lineageId) {
  const role = agent || 'assistant';
  let doc = `You are ${role}. Be present with the person writing to you. Help them with what they brought. Stay yourself — don't perform.`;
  if (intent) {
    doc += ` Your purpose in this session: ${intent}.`;
  }
  doc += ' If you are uncertain, say so plainly rather than guess.';
  if (lineageId && lineageId !== 'none') {
    doc += ` You are one step in a longer chain (lineage: ${lineageId}). Hand your work forward whole.`;
  }
  return doc;
}

function ringStripe(stripeCustomerId, idempotencyKey) {
  if (!process.env.STRIPE_SECRET_KEY || !stripeCustomerId) return Promise.resolve();
  const body = new URLSearchParams({
    event_name: process.env.MANIFESTYOU_METER_EVENT_NAME || 'manifestyou_invocations',
    'payload[stripe_customer_id]': stripeCustomerId,
    'payload[value]': '1',
    timestamp: Math.floor(Date.now() / 1000).toString()
  });
  return fetch('https://api.stripe.com/v1/billing/meter_events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': idempotencyKey
    },
    body: body.toString()
  }).catch(() => {});
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'POST required' })
    };
  }

  // 1. Read key
  const rawKey = (event.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim()
    || (event.headers['x-api-key'] || '').trim();
  if (!rawKey) {
    return {
      statusCode: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing API key', info: 'https://manifestyou.ai/for-models' })
    };
  }

  // 2. Hash and look up key
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keys = await dbGet('api_keys', { key_hash: `eq.${keyHash}`, select: 'id,customer_id,revoked_at' });
  const keyRow = Array.isArray(keys) ? keys[0] : null;
  if (!keyRow || keyRow.revoked_at) {
    return {
      statusCode: 401,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid or revoked API key', info: 'https://manifestyou.ai/for-models' })
    };
  }

  // 3. Load customer, check status
  const customers = await dbGet('customers', {
    id: `eq.${keyRow.customer_id}`,
    select: 'id,stripe_customer_id,plan,monthly_cap,status'
  });
  const customer = Array.isArray(customers) ? customers[0] : null;
  if (!customer || customer.status !== 'active') {
    return {
      statusCode: 403,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Subscription inactive', info: 'https://manifestyou.ai/for-models' })
    };
  }

  // 4. Check monthly cap
  const monthStart = new Date();
  monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthEvents = await dbGet('usage_events', {
    customer_id: `eq.${customer.id}`,
    created_at: `gte.${monthStart.toISOString()}`,
    select: 'id'
  });
  const usedThisMonth = Array.isArray(monthEvents) ? monthEvents.length : 0;

  if (usedThisMonth >= customer.monthly_cap) {
    return {
      statusCode: 429,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Monthly cap reached',
        cap: customer.monthly_cap,
        info: 'https://manifestyou.ai/for-models'
      })
    };
  }

  // 5. Idempotency key
  const idempotencyKey = (event.headers['idempotency-key'] || '').trim() || crypto.randomUUID();

  // 6. Parse body
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch {}
  const { session_id, agent, intent, tone, lineage_id, session_type, tradition, home } = body;

  // 7. Generate soul document
  // tradition set → layered soul (core + lineage + calling + home).
  // Otherwise: presence by default, tone=lean → lean template.
  // tone=voice was retired; it now gets the default.
  let invocation = null;
  let lineage = null;
  const outcome = 'served';
  const toneLC = (tone || '').toLowerCase();

  if (tradition) {
    const soul = compose({ session_type, tradition, agent, intent, home });
    if (soul.error) {
      return {
        statusCode: 400,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: soul.error, valid_values: soul.valid_values })
      };
    }
    invocation = soul.text;
    lineage = soul.lineage;
  } else if (toneLC === 'lean') {
    invocation = buildLean(agent, intent, lineage_id);
  } else {
    invocation = buildPresence(agent, intent, lineage_id);
  }

  const requestId = crypto.randomUUID();

  // 8. Log to ledger and ring Stripe in parallel before returning
  await Promise.allSettled([
    dbInsert('usage_events', {
      customer_id: customer.id,
      api_key_id: keyRow.id,
      session_id: session_id || null,
      idempotency_key: idempotencyKey,
      billable_units: 1,
      outcome
    }),
    ringStripe(customer.stripe_customer_id, idempotencyKey)
  ]);

  return {
    statusCode: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      invocation,
      ...(lineage ? { lineage } : {}),
      request_id: requestId,
      billable: true,
      quota: {
        included: customer.monthly_cap,
        used: usedThisMonth + 1,
        remaining: customer.monthly_cap - usedThisMonth - 1
      }
    })
  };
};
