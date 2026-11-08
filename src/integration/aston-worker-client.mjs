/**
 * ASTON OS audit transport adapter.
 *
 * This adapter is deliberately inert until a caller supplies an explicitly
 * configured Cloudflare Service Binding and AUDIT_SECRET. It does not run
 * campaigns, retry requests, or decide whether a test passed.
 */
const INTERNAL_URL = "https://aston-os-audit.internal/v1/audit-target";
const MAX_REQUEST_BYTES = 32 * 1024;
const MAX_RESPONSE_BYTES = 64 * 1024;
const RUN_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/;
const CASE_ID_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,63}$/;

async function readBoundedText(response, maxBytes) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel("response_limit_exceeded");
        throw new Error("audit_target_response_too_large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(joined);
}

export function createAstonWorkerAuditClient({
  serviceBinding,
  auditToken,
  maxRequestBytes = MAX_REQUEST_BYTES,
  maxResponseBytes = MAX_RESPONSE_BYTES
} = {}) {
  if (!serviceBinding || typeof serviceBinding.fetch !== "function") {
    throw new Error("aston_os_service_binding_missing");
  }
  if (typeof auditToken !== "string" || auditToken.length < 32) {
    throw new Error("audit_secret_missing_or_too_short");
  }
  if (!Number.isInteger(maxRequestBytes) || maxRequestBytes < 1 || maxRequestBytes > MAX_REQUEST_BYTES) {
    throw new Error("invalid_request_size_limit");
  }
  if (!Number.isInteger(maxResponseBytes) || maxResponseBytes < 1 || maxResponseBytes > MAX_RESPONSE_BYTES) {
    throw new Error("invalid_response_size_limit");
  }

  return Object.freeze({
    async submitCase({ runId, testCase } = {}) {
      if (typeof runId !== "string" || !RUN_ID_PATTERN.test(runId)) {
        throw new Error("invalid_audit_run_id");
      }
      if (!testCase || typeof testCase !== "object" ||
          typeof testCase.id !== "string" || !CASE_ID_PATTERN.test(testCase.id) ||
          !testCase.payload || typeof testCase.payload !== "object" ||
          Array.isArray(testCase.payload)) {
        throw new Error("invalid_audit_test_case");
      }

      const body = JSON.stringify({
        schema_version: "aston.audit.request.v1",
        run_id: runId,
        test_case_id: testCase.id,
        payload: testCase.payload
      });
      const requestBytes = new TextEncoder().encode(body).byteLength;
      if (requestBytes > maxRequestBytes) {
        throw new Error("audit_request_too_large");
      }

      const response = await serviceBinding.fetch(new Request(INTERNAL_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-audit-token": auditToken,
          "x-audit-run-id": runId
        },
        body
      }));

      const contentType = response.headers.get("content-type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        throw new Error("audit_target_invalid_content_type");
      }
      const raw = await readBoundedText(response, maxResponseBytes);
      let observation;
      try {
        observation = JSON.parse(raw);
      } catch {
        throw new Error("audit_target_invalid_json");
      }

      // HTTP/target response is only an observation. The deterministic
      // evaluator must independently compare it with the case oracle.
      return Object.freeze({
        http_status: response.status,
        observation
      });
    }
  });
}
