import { runAuthorizedModel } from "./model-runner.mjs";

function deny(error, status = 403) {
  return Response.json({ ok: false, decision: "DENY", error }, { status });
}

export async function enforceAndRunModel({ request, env, agentStub, agentId, principal }) {
  if (!agentStub || !principal?.servicePrincipalId || !principal?.organizationId || !agentId) return deny("TRUSTED_EXECUTION_CONTEXT_REQUIRED");
  let body;
  try { const raw = await request.text(); if (raw.length > 65536) return deny("MODEL_REQUEST_TOO_LARGE", 413); body = JSON.parse(raw); }
  catch { return deny("INVALID_JSON", 400); }
  const model = body?.model;
  if (typeof model !== "string" || !/^[A-Za-z0-9@._/-]{1,256}$/.test(model) || !body?.inputs || typeof body.inputs !== "object" || Array.isArray(body.inputs)) {
    return deny("INVALID_MODEL_REQUEST", 400);
  }
  const requestId = request.headers.get("idempotency-key") || request.headers.get("x-correlation-id");
  if (!requestId || !/^[A-Za-z0-9._:-]{8,128}$/.test(requestId)) return deny("IDEMPOTENCY_KEY_REQUIRED", 400);
  const costMinor = Number(env.MODEL_INVOCATION_COST_MINOR);
  if (!Number.isSafeInteger(costMinor) || costMinor <= 0) return deny("MODEL_COST_NOT_CONFIGURED", 503);
  let authorization;
  try {
    const response = await agentStub.fetch("https://agent-identity/authorize-model", {
      method: "POST", headers: { "content-type": "application/json", "x-aston-tenant": principal.organizationId },
      body: JSON.stringify({ requestId, action: "ai.inference", resourceId: model, modelCostMinor: costMinor })
    });
    const result = await response.json();
    if (!response.ok || !result.ok || result.result?.decision !== "ALLOW") return deny(result.error || "SAFETY_INTERLOCK_DENIED", response.status || 403);
    authorization = result.result;
  } catch { return deny("AUTHORITY_UNAVAILABLE", 503); }
  return runAuthorizedModel({ env, agentStub, authorization, model, inputs: body.inputs });
}
