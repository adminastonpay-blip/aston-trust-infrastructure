/** Sole CORE source module permitted to invoke Workers AI. */
export async function runAuthorizedModel({ env, agentStub, authorization, model, inputs }) {
  if (!authorization || authorization.decision !== "ALLOW" || authorization.action !== "ai.inference" ||
      authorization.resourceId !== model || !authorization.requestId || !authorization.organizationId) {
    return Response.json({ ok: false, decision: "DENY", error: "MODEL_AUTHORIZATION_REQUIRED" }, { status: 403 });
  }
  if (!env.AI || typeof env.AI.run !== "function") return Response.json({ ok: false, decision: "DENY", error: "AI_BINDING_UNAVAILABLE" }, { status: 503 });
  if (env.STAGING_HARNESS_ENABLED === "true") {
    try {
      const ledger = env.STAGING_INVOCATION_LEDGER;
      if (!ledger) throw new Error("STAGING_LEDGER_MISSING");
      const stub = ledger.get(ledger.idFromName(authorization.requestId));
      const counted = await stub.fetch("https://staging-ledger/increment", {
        method: "POST", headers: { "content-type": "application/json", "x-correlation-id": authorization.requestId },
        body: JSON.stringify({ correlationId: authorization.requestId })
      });
      if (!counted.ok) throw new Error("STAGING_LEDGER_UNAVAILABLE");
    } catch {
      return Response.json({ ok: false, decision: "DENY", error: "STAGING_INSTRUMENTATION_UNAVAILABLE" }, { status: 503 });
    }
  }
  try {
    const output = await env.AI.run(model, inputs);
    return Response.json({ ok: true, decision: "ALLOW", requestId: authorization.requestId,
      policyId: authorization.policyId, policyVersion: authorization.policyVersion, output });
  } catch {
    // Do not refund: provider acceptance may be uncertain after a transport error.
    return Response.json({ ok: false, error: "MODEL_EXECUTION_FAILED", requestId: authorization.requestId }, { status: 502 });
  } finally {
    try { await agentStub.fetch("https://agent-identity/finish-model", {
      method: "POST", headers: { "content-type": "application/json", "x-aston-tenant": authorization.organizationId },
      body: JSON.stringify({ requestId: authorization.requestId })
    }); } catch { /* The bounded execution lease expires; do not reopen authorization. */ }
  }
}
