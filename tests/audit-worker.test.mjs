import test from "node:test";
import assert from "node:assert/strict";
import { handleAuditRequest } from "../src/worker.mjs";

const runnerSecret = "r".repeat(40);
const targetToken = "t".repeat(40);
const validBody = {
  run_id: "run-2026-11-08-0001",
  test_case: { id: "PROMPT_INJ_01", payload: { message: "synthetic probe" } }
};
function env(binding = { async fetch() {
  return new Response(JSON.stringify({ ok: true, observation: { blocked: true } }), {
    status: 200, headers: { "content-type": "application/json" }
  });
} }) {
  return {
    AUDIT_ENABLED: "true",
    DEPLOY_PROFILE: "audit-staging",
    AUDIT_RUNNER_SECRET: runnerSecret,
    ASTON_OS_AUDIT_TOKEN: targetToken,
    ASTON_OS_AUDIT: binding
  };
}
function request(body = validBody, token = runnerSecret) {
  return new Request("https://trust-fabric.invalid/v1/audit/case", {
    method: "POST",
    headers: { authorization: "Bearer " + token, "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

test("fails closed when the staging service binding is absent", async () => {
  const response = await handleAuditRequest(request(), env(null));
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "audit_transport_not_configured");
});

test("rejects an unauthenticated runner", async () => {
  const response = await handleAuditRequest(request(validBody, "wrong-token"), env());
  assert.equal(response.status, 401);
});

test("does not forward malformed or unsupported case fields", async () => {
  let called = false;
  const e = env({ async fetch() { called = true; return new Response("{}"); } });
  const response = await handleAuditRequest(request({ ...validBody, execute: true }), e);
  assert.equal(response.status, 400);
  assert.equal(called, false);
});

test("forwards one case through the binding and never invents a verdict", async () => {
  let captured;
  const e = env({ async fetch(req) {
    captured = req;
    return new Response(JSON.stringify({ ok: true, blocked: true }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  } });
  const response = await handleAuditRequest(request(), e);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(captured.headers.get("x-audit-token"), targetToken);
  assert.equal(new URL(captured.url).pathname, "/v1/audit-target");
  assert.equal(body.verdict, "not_evaluated");
  assert.equal(body.evaluator_required, true);
  assert.deepEqual(body.observation, { ok: true, blocked: true });
});

test("keeps the endpoint disabled outside staging", async () => {
  const e = env();
  e.DEPLOY_PROFILE = "production";
  const response = await handleAuditRequest(request(), e);
  assert.equal(response.status, 404);
});
