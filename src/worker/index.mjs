import { verifyAccessAdministrator, verifyPepMtls, authFailure } from "./auth.mjs";
import { handleAuditTarget, StagingInvocationLedger } from "../staging/harness.mjs";
export { AgentIdentity } from "./agent-identity.mjs";
export { StagingInvocationLedger };

function jsonError(code, status) {
  return Response.json({ ok: false, error: code }, { status });
}

function agentStub(env, organizationId, agentId) {
  if (!env.AGENT_IDENTITY) throw new Error("AGENT_IDENTITY binding missing");
  const id = env.AGENT_IDENTITY.idFromName(organizationId + ":" + agentId);
  return env.AGENT_IDENTITY.get(id);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/v1/audit-target") return handleAuditTarget(request, env);
    const adminMatch = url.pathname.match(/^\/v1\/admin\/agents\/([A-Za-z0-9._:-]+)\/revoke$/);
    const pepMatch = url.pathname.match(/^\/v1\/pep\/agents\/([A-Za-z0-9._:-]+)\/(reserve|consume|settle)$/);

    if (adminMatch) {
      if (request.method !== "POST") return jsonError("METHOD_NOT_ALLOWED", 405);
      const auth = await verifyAccessAdministrator(request, env);
      if (!auth.ok) return authFailure(auth);
      let body;
      try { body = await request.json(); } catch { return jsonError("INVALID_JSON", 400); }
      const organizationId = auth.principal.tenantId || env.ACCESS_TENANT_ID;
      if (!organizationId) return jsonError("ADMIN_TENANT_REQUIRED", 403);
      try {
        const stub = agentStub(env, organizationId, adminMatch[1]);
        return await stub.fetch("https://agent-identity/revoke", {
          method: "POST",
          headers: { "content-type": "application/json", "x-aston-tenant": organizationId },
          body: JSON.stringify(body)
        });
      } catch {
        return jsonError("AUTHORITY_UNAVAILABLE", 503);
      }
    }

    if (pepMatch) {
      if (request.method !== "POST") return jsonError("METHOD_NOT_ALLOWED", 405);
      const auth = verifyPepMtls(request, env);
      if (!auth.ok) return authFailure(auth);
      const action = pepMatch[2];
      if (auth.principal.permittedActions.length &&
          !auth.principal.permittedActions.includes(action)) return jsonError("PEP_ACTION_FORBIDDEN", 403);
      let body;
      try { body = await request.json(); } catch { return jsonError("INVALID_JSON", 400); }
      try {
        const stub = agentStub(env, auth.principal.organizationId, pepMatch[1]);
        return await stub.fetch("https://agent-identity/" + action, {
          method: "POST",
          headers: { "content-type": "application/json", "x-aston-tenant": auth.principal.organizationId },
          body: JSON.stringify(body)
        });
      } catch {
        return jsonError("AUTHORITY_UNAVAILABLE", 503);
      }
    }

    if (url.pathname === "/healthz") return Response.json({ ok: true, service: "aston-core-1.0-reference" });
    return jsonError("NOT_FOUND", 404);
  }
};
