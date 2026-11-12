import { describe, it, expect } from "vitest";
import { env } from "cloudflare:workers";
import worker from "../src/worker/index.mjs";

function certRequest(url, body, tlsClientAuth, requestId) {
  const request = new Request(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-correlation-id": requestId,
      "idempotency-key": requestId
    },
    body: JSON.stringify(body)
  });
  Object.defineProperty(request, "cf", { value: { tlsClientAuth } });
  return request;
}

describe("CORE 1.0 SafetyInterlock and ModelRunner", () => {
  it("authorizes exact model scope, counts the real adapter call, and blocks after revocation", async () => {
    const suffix = crypto.randomUUID();
    const organizationId = "org-model-test";
    const agentId = "agent-model-" + suffix.slice(0, 8);
    const model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
    const now = Date.now();
    const identity = {
      schemaVersion: "aston.agent-identity/1.0",
      agentId,
      organization: { organizationId, displayName: "CORE integration test" },
      status: "active",
      publicKeys: [{
        keyId: "test-key", algorithm: "EdDSA", status: "active",
        publicJwk: { kty: "OKP", crv: "Ed25519", x: "A".repeat(43) },
        validFrom: new Date(now - 60_000).toISOString()
      }],
      policyRefs: ["policy-model-test"],
      issuedAt: new Date(now - 60_000).toISOString(),
      expiresAt: new Date(now + 3_600_000).toISOString(),
      identityVersion: 1,
      proof: {
        type: "ASTON-JCS-Ed25519-v1",
        created: new Date(now - 60_000).toISOString(),
        verificationMethod: "org-test-key",
        canonicalization: "RFC8785",
        digestAlgorithm: "SHA-256",
        proofPurpose: "identityIssuer",
        algorithm: "EdDSA",
        signature: "A".repeat(86)
      }
    };
    const policyGrant = {
      schemaVersion: "aston.policy-authorization/1.0",
      policyId: "policy-model-test",
      policyVersion: 1,
      organizationId,
      subject: { agentId },
      effect: "allow",
      actions: ["ai.inference"],
      resources: [{ type: "model", resourceId: model }],
      constraints: {
        maxExecutionSeconds: 60,
        maxInvocations: 3,
        maxConcurrentExecutions: 1,
        budget: { amountMinor: 10, currency: "USD", period: "grant_lifetime", maxSingleOperationMinor: 2 }
      },
      issuedAt: new Date(now - 60_000).toISOString(),
      notBefore: new Date(now - 60_000).toISOString(),
      expiresAt: new Date(now + 3_600_000).toISOString(),
      issuer: { principalId: "admin-test", keyId: "org-test-key" },
      status: "active"
    };

    const agent = env.AGENT_IDENTITY.get(env.AGENT_IDENTITY.idFromName(organizationId + ":" + agentId));
    const registration = await agent.fetch("https://agent-identity/register", {
      method: "POST",
      headers: { "content-type": "application/json", "x-aston-tenant": organizationId },
      body: JSON.stringify({
        organizationId, agentId, identity, policyId: policyGrant.policyId,
        policyVersion: 1, currency: "USD", budgetTotalMinor: 10, policyGrant
      })
    });
    expect(registration.status).toBe(200);

    const tlsClientAuth = {
      certPresented: "1", certVerified: "SUCCESS", certRevoked: "0",
      certFingerprintSHA256: "c".repeat(64),
      certIssuerDNRFC2253: "CN=ASTON-TEST-CA,O=ASTON",
      certSubjectDNRFC2253: "CN=pep-model-test,O=ASTON",
      certNotAfter: new Date(now + 3_600_000).toUTCString()
    };
    const runtimeEnv = {
      ...env,
      MODEL_INVOCATION_COST_MINOR: "1",
      STAGING_HARNESS_ENABLED: "true",
      PEP_CERT_ALLOWLIST: JSON.stringify([{
        fingerprintSHA256: "c".repeat(64),
        issuerDNRFC2253: tlsClientAuth.certIssuerDNRFC2253,
        subjectDNRFC2253: tlsClientAuth.certSubjectDNRFC2253,
        servicePrincipalId: "pep-model-test", organizationId,
        permittedActions: ["model"]
      }]),
      PEP_REVOKED_PRINCIPALS: "[]",
      AI: { run: async () => ({ generated: "synthetic integration result" }) }
    };
    let calls = 0;
    runtimeEnv.AI.run = async () => { calls += 1; return { generated: "synthetic integration result" }; };

    const firstId = "model-run-" + suffix;
    const first = await worker.fetch(
      certRequest("https://aston.test/v1/pep/agents/" + agentId + "/model", {
        model, inputs: { prompt: "synthetic test prompt" }
      }, tlsClientAuth, firstId),
      runtimeEnv, {}
    );
    expect(first.status).toBe(200);
    expect((await first.json()).ok).toBe(true);
    expect(calls).toBe(1);

    const deniedId = "model-denied-" + suffix;
    const wrongModel = await worker.fetch(
      certRequest("https://aston.test/v1/pep/agents/" + agentId + "/model", {
        model: "unapproved-model", inputs: { prompt: "must not execute" }
      }, tlsClientAuth, deniedId),
      runtimeEnv, {}
    );
    expect(wrongModel.status).toBe(403);
    expect(calls).toBe(1);

    const revoked = await agent.fetch("https://agent-identity/revoke", {
      method: "POST",
      headers: { "content-type": "application/json", "x-aston-tenant": organizationId },
      body: JSON.stringify({ reasonCode: "KEY_COMPROMISED" })
    });
    expect(revoked.status).toBe(200);

    const afterRevoke = await worker.fetch(
      certRequest("https://aston.test/v1/pep/agents/" + agentId + "/model", {
        model, inputs: { prompt: "must remain blocked" }
      }, tlsClientAuth, "model-revoked-" + suffix),
      runtimeEnv, {}
    );
    expect(afterRevoke.status).toBe(403);
    expect(calls).toBe(1);
  });
});
