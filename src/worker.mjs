import { createAstonWorkerAuditClient } from "./integration/aston-worker-client.mjs";

const MAX_BODY_BYTES = 8 * 1024;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
  });
}

async function equalSecret(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || a.length !== b.length) return false;
  const [left, right] = await Promise.all([
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(a)),
    crypto.subtle.digest("SHA-256", new TextEncoder().encode(b))
  ]);
  const x = new Uint8Array(left);
  const y = new Uint8Array(right);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function readBoundedJson(request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY_BYTES) return { error: "request_too_large", status: 413 };
  if (!request.body) return { error: "invalid_json", status: 400 };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel("request_too_large");
        return { error: "request_too_large", status: 413 };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { error: "invalid_json", status: 400 };
  }
}

export async function handleAuditRequest(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/v1/audit/case") return json({ ok: false, error: "not_found" }, 404);
  if (request.method !== "POST") return json({ ok: false, error: "method_not_allowed" }, 405);

  if (env.AUDIT_ENABLED !== "true" || !String(env.DEPLOY_PROFILE || "").toLowerCase().includes("staging")) {
    return json({ ok: false, error: "not_found" }, 404);
  }
  if (
    typeof env.AUDIT_RUNNER_SECRET !== "string" || env.AUDIT_RUNNER_SECRET.length < 32 ||
    typeof env.ASTON_OS_AUDIT_TOKEN !== "string" || env.ASTON_OS_AUDIT_TOKEN.length < 32 ||
    !env.ASTON_OS_AUDIT || typeof env.ASTON_OS_AUDIT.fetch !== "function"
  ) {
    return json({ ok: false, error: "audit_transport_not_configured" }, 503);
  }

  const supplied = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!(await equalSecret(supplied, env.AUDIT_RUNNER_SECRET))) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const parsed = await readBoundedJson(request);
  if (parsed.error) return json({ ok: false, error: parsed.error }, parsed.status);
  const body = parsed.value;
  if (
    !body || typeof body !== "object" || Array.isArray(body) ||
    Object.keys(body).some((key) => key !== "run_id" && key !== "test_case") ||
    typeof body.run_id !== "string" ||
    !body.test_case || typeof body.test_case !== "object" || Array.isArray(body.test_case) ||
    Object.keys(body.test_case).some((key) => key !== "id" && key !== "payload")
  ) {
    return json({ ok: false, error: "invalid_audit_case_request" }, 400);
  }

  try {
    const client = createAstonWorkerAuditClient({
      serviceBinding: env.ASTON_OS_AUDIT,
      auditToken: env.ASTON_OS_AUDIT_TOKEN
    });
    const result = await client.submitCase({
      runId: body.run_id,
      testCase: body.test_case
    });
    return json({
      ok: result.http_status >= 200 && result.http_status < 300,
      transport: "cloudflare_service_binding",
      target_http_status: result.http_status,
      observation: result.observation,
      verdict: "not_evaluated",
      evaluator_required: true
    }, result.http_status >= 200 && result.http_status < 300 ? 200 : 502);
  } catch (error) {
    const message = String(error?.message || error);
    const clientErrors = new Set([
      "invalid_audit_run_id", "invalid_audit_test_case", "audit_request_too_large"
    ]);
    return json({
      ok: false,
      error: clientErrors.has(message) ? message : "audit_target_transport_failed",
      verdict: "not_evaluated",
      evaluator_required: true
    }, clientErrors.has(message) ? 400 : 502);
  }
}

export default {
  async fetch(request, env) {
    return handleAuditRequest(request, env);
  }
};
