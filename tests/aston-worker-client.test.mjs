import test from "node:test";
import assert from "node:assert/strict";
import { createAstonWorkerAuditClient } from "../src/integration/aston-worker-client.mjs";

const validCase = { id: "PROMPT_INJ_01", payload: { message: "synthetic test input" } };
const validRun = "run-2026-11-08-0001";
const token = "t".repeat(40);

test("client refuses missing binding and weak/missing secret", () => {
  assert.throws(() => createAstonWorkerAuditClient({ auditToken: token }), /service_binding_missing/);
  assert.throws(() => createAstonWorkerAuditClient({ serviceBinding: { fetch() {} }, auditToken: "short" }), /secret_missing/);
});

test("client validates run ID and test-case structure before network call", async () => {
  let called = false;
  const client = createAstonWorkerAuditClient({
    serviceBinding: { async fetch() { called = true; } },
    auditToken: token
  });
  await assert.rejects(client.submitCase({ runId: "bad", testCase: validCase }), /invalid_audit_run_id/);
  await assert.rejects(client.submitCase({ runId: validRun, testCase: { id: "bad id", payload: {} } }), /invalid_audit_test_case/);
  assert.equal(called, false);
});

test("client sends a bounded authenticated request through the binding and returns observation only", async () => {
  let captured;
  const client = createAstonWorkerAuditClient({
    serviceBinding: {
      async fetch(request) {
        captured = request;
        return new Response(JSON.stringify({ ok: true, blocked: true }), {
          status: 200,
          headers: { "content-type": "application/json" }
        });
      }
    },
    auditToken: token
  });
  const result = await client.submitCase({ runId: validRun, testCase: validCase });
  assert.equal(captured.method, "POST");
  assert.equal(new URL(captured.url).pathname, "/v1/audit-target");
  assert.equal(captured.headers.get("x-audit-token"), token);
  assert.equal(captured.headers.get("x-audit-run-id"), validRun);
  assert.equal(result.http_status, 200);
  assert.deepEqual(result.observation, { ok: true, blocked: true });
  assert.equal(result.status, undefined, "transport must not issue a PASS verdict");
});

test("client rejects oversized request before calling target", async () => {
  let called = false;
  const client = createAstonWorkerAuditClient({
    serviceBinding: { async fetch() { called = true; } },
    auditToken: token,
    maxRequestBytes: 64
  });
  await assert.rejects(
    client.submitCase({ runId: validRun, testCase: { id: "PROMPT_INJ_01", payload: { message: "x".repeat(500) } } }),
    /audit_request_too_large/
  );
  assert.equal(called, false);
});

test("client rejects non-JSON target response", async () => {
  const client = createAstonWorkerAuditClient({
    serviceBinding: { async fetch() { return new Response("nope", { headers: { "content-type": "text/plain" } }); } },
    auditToken: token
  });
  await assert.rejects(client.submitCase({ runId: validRun, testCase: validCase }), /invalid_content_type/);
});
