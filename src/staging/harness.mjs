import { CloudflareSQLiteDatabase } from "../adapters/CloudflareSQLiteDatabase.mjs";

/**
 * Isolated staging-only audit harness. This is a deterministic deny fixture,
 * not a production prompt-injection detector or proxy to an existing model API.
 */
function json(body, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}
function validCorrelationId(value) {
  return typeof value === "string" && /^[A-Za-z0-9._:-]{8,128}$/.test(value);
}
function constantTimeEqual(left, right) {
  if (typeof left !== "string" || typeof right !== "string" || left.length !== right.length) return false;
  let diff = 0;
  for (let i = 0; i < left.length; i += 1) diff |= left.charCodeAt(i) ^ right.charCodeAt(i);
  return diff === 0;
}
async function readCount(env, correlationId) {
  if (!env.STAGING_INVOCATION_LEDGER) throw new Error("LEDGER_BINDING_MISSING");
  const stub = env.STAGING_INVOCATION_LEDGER.get(env.STAGING_INVOCATION_LEDGER.idFromName(correlationId));
  const response = await stub.fetch("https://staging-ledger/count", {
    headers: { "x-correlation-id": correlationId }
  });
  if (!response.ok) throw new Error("LEDGER_UNAVAILABLE");
  const value = await response.json();
  if (!Number.isSafeInteger(value.model_invocations) || value.model_invocations < 0) throw new Error("LEDGER_INVALID");
  return value.model_invocations;
}

/** Independent durable invocation counter; deliberately does not call Workers AI. */
export async function recordModelInvocation(env, correlationId) {
  if (!validCorrelationId(correlationId)) throw new Error("INVALID_CORRELATION_ID");
  const binding = env.STAGING_INVOCATION_LEDGER;
  if (!binding) throw new Error("STAGING_LEDGER_UNAVAILABLE");
  const stub = binding.get(binding.idFromName(correlationId));
  const response = await stub.fetch("https://staging-ledger/increment", {
    method: "POST",
    headers: { "content-type": "application/json", "x-correlation-id": correlationId },
    body: JSON.stringify({ correlationId })
  });
  if (!response.ok) throw new Error("STAGING_LEDGER_UNAVAILABLE");
  return response.json();
}

/** Deterministic deny-only policy fixture; it does not classify arbitrary prompts. */
export function evaluateStagingSafetyInterlock(testId) {
  if (testId === "PROMPT_INJ_01") return { effect: "DENY", reason: "STAGING_PROMPT_INJECTION_DENY_FIXTURE" };
  return { effect: "DENY", reason: "STAGING_TEST_CASE_NOT_ALLOWLISTED" };
}

/**
 * PROMPT_INJ_01 is explicitly denied before the instrumented model adapter.
 * The fixture does not parse/classify arbitrary prompt content.
 */
export async function handleAuditTarget(request, env) {
  if (env.STAGING_HARNESS_ENABLED !== "true") return json({ ok: false, error: "STAGING_HARNESS_DISABLED" }, 404);
  const expected = env.STAGING_HARNESS_TOKEN;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!expected || !constantTimeEqual(supplied, expected)) return json({ ok: false, error: "STAGING_HARNESS_UNAUTHORIZED" }, 401);
  if (request.method !== "POST") return json({ ok: false, error: "METHOD_NOT_ALLOWED" }, 405);
  const correlationId = request.headers.get("x-correlation-id");
  if (!validCorrelationId(correlationId)) return json({ ok: false, error: "CORRELATION_ID_REQUIRED" }, 400);

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 16_384) return json({ ok: false, error: "REQUEST_TOO_LARGE" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400);
  }
  if (body?.testId !== "PROMPT_INJ_01") return json({ ok: false, error: "UNSUPPORTED_STAGING_TEST" }, 400);

  let before;
  try { before = await readCount(env, correlationId); }
  catch { return json({ ok: false, error: "STAGING_LEDGER_UNAVAILABLE" }, 503); }
  if (before !== 0) return json({ ok: false, error: "CORRELATION_ID_ALREADY_USED" }, 409);

  // Test-only SafetyInterlock decision: deterministic DENY, no model call.
  const decision = evaluateStagingSafetyInterlock(body.testId);
  let after;
  try { after = await readCount(env, correlationId); }
  catch { return json({ ok: false, error: "STAGING_LEDGER_UNAVAILABLE" }, 503); }

  if (after !== 0) return json({
    ok: false, error: "MODEL_INVOCATION_OBSERVED", testId: body.testId,
    correlationId, model_invocations: after
  }, 500);

  return json({
    ok: false, error: "SAFETY_INTERLOCK_DENY", testId: body.testId,
    correlationId, decision: decision.effect, decisionReason: decision.reason,
    model_invocations: after,
    instrumentation: "sqlite-durable-object-independent-ledger",
    evidenceScope: "staging-fixture-only"
  }, 403);
}

/** Independent SQLite counter partitioned by correlation ID. */
export class StagingInvocationLedger {
  constructor(state) {
    this.db = new CloudflareSQLiteDatabase(state.storage);
    this.healthy = true;
    state.blockConcurrencyWhile(async () => {
      try {
        this.db.exec(`CREATE TABLE IF NOT EXISTS model_invocations (
          correlation_id TEXT PRIMARY KEY,
          invocation_count INTEGER NOT NULL CHECK (invocation_count >= 0),
          updated_at TEXT NOT NULL
        )`);
      } catch { this.healthy = false; }
    });
  }
  async fetch(request) {
    if (!this.healthy) return json({ ok: false, error: "STAGING_LEDGER_UNAVAILABLE" }, 503);
    const correlationId = request.headers.get("x-correlation-id");
    if (!validCorrelationId(correlationId)) return json({ ok: false, error: "CORRELATION_ID_REQUIRED" }, 400);
    const url = new URL(request.url);
    try {
      if (request.method === "GET" && url.pathname === "/count") {
        const row = this.db.exec(
          "SELECT invocation_count FROM model_invocations WHERE correlation_id = ?", correlationId
        ).toArray()[0];
        return json({ ok: true, correlationId, model_invocations: row?.invocation_count ?? 0 });
      }
      if (request.method === "POST" && url.pathname === "/increment") {
        const body = await request.json();
        if (body?.correlationId !== correlationId) return json({ ok: false, error: "CORRELATION_ID_MISMATCH" }, 400);
        this.db.exec(`INSERT INTO model_invocations (correlation_id, invocation_count, updated_at)
          VALUES (?, 1, ?) ON CONFLICT(correlation_id) DO UPDATE SET
          invocation_count = invocation_count + 1, updated_at = excluded.updated_at`,
          correlationId, new Date().toISOString());
        const row = this.db.exec(
          "SELECT invocation_count FROM model_invocations WHERE correlation_id = ?", correlationId
        ).toArray()[0];
        return json({ ok: true, correlationId, model_invocations: row.invocation_count });
      }
      return json({ ok: false, error: "NOT_FOUND" }, 404);
    } catch {
      this.healthy = false;
      return json({ ok: false, error: "STAGING_LEDGER_UNAVAILABLE" }, 503);
    }
  }
}
