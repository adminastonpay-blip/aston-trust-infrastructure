import { describe, it, expect } from "vitest";
import worker from "../src/worker/index.mjs";

const now = Date.now();
const issuer = "https://aston.cloudflareaccess.com";
const audience = "aston-core-admin-app";
const keyPair = await crypto.subtle.generateKey({
  name: "RSASSA-PKCS1-v1_5", modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256"
}, true, ["sign", "verify"]);
const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
publicJwk.kid = "test-access-key";
publicJwk.use = "sig";
publicJwk.alg = "RS256";

function b64url(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replaceAll("+", "-").replaceAll("/", "_");
}
async function token(overrides = {}) {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT", kid: publicJwk.kid })));
  const claims = {
    iss: issuer, aud: audience, sub: "admin-test-01",
    iat: Math.floor(now / 1000), nbf: Math.floor(now / 1000) - 1,
    exp: Math.floor(now / 1000) + 300, roles: ["aston-admin"], tenant_id: "org-test",
    ...overrides
  };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(claims)));
  const signingInput = header + "." + payload;
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyPair.privateKey, new TextEncoder().encode(signingInput));
  return signingInput + "." + b64url(signature);
}
const env = {
  ACCESS_ISSUER: issuer, ACCESS_AUD: audience, ACCESS_ADMIN_ROLE: "aston-admin",
  ACCESS_TENANT_ID: "org-test",
  ACCESS_JWKS_JSON: JSON.stringify({ keys: [publicJwk] })
};
const noBinding = {};

describe("Cloudflare Access administrator boundary", () => {
  it("rejects an expired Access JWT with 401 before reaching the Durable Object", async () => {
    const jwt = await token({ exp: Math.floor(now / 1000) - 1 });
    const request = new Request("https://aston.test/v1/admin/agents/agent-1/revoke", {
      method: "POST", headers: { "Cf-Access-Jwt-Assertion": jwt }, body: JSON.stringify({ reasonCode: "ADMIN_REQUEST" })
    });
    const response = await worker.fetch(request, env, noBinding);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ ok: false, error: "ACCESS_JWT_EXPIRED" });
  });

  it("rejects an invalid signature with 401", async () => {
    const jwt = await token();
    const tampered = jwt.slice(0, -2) + "aa";
    const request = new Request("https://aston.test/v1/admin/agents/agent-1/revoke", {
      method: "POST", headers: { "Cf-Access-Jwt-Assertion": tampered }, body: "{}"
    });
    const response = await worker.fetch(request, env, noBinding);
    expect(response.status).toBe(401);
  });

  it("rejects an authenticated user without the administrator role with 403", async () => {
    const jwt = await token({ roles: ["viewer"] });
    const request = new Request("https://aston.test/v1/admin/agents/agent-1/revoke", {
      method: "POST", headers: { "Cf-Access-Jwt-Assertion": jwt }, body: "{}"
    });
    const response = await worker.fetch(request, env, noBinding);
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("ACCESS_ADMIN_ROLE_REQUIRED");
  });
});

describe("Cloudflare mTLS PEP boundary", () => {
  const cert = {
    certPresented: "1", certVerified: "SUCCESS", certRevoked: "0",
    certFingerprintSHA256: "a".repeat(64),
    certIssuerDNRFC2253: "CN=ASTON-TEST-CA,O=ASTON",
    certSubjectDNRFC2253: "CN=pep-test-01,O=ASTON",
    certNotAfter: new Date(now + 60_000).toUTCString()
  };
  const pepEnv = {
    PEP_CERT_ALLOWLIST: JSON.stringify([{
      fingerprintSHA256: "a".repeat(64),
      issuerDNRFC2253: cert.certIssuerDNRFC2253,
      subjectDNRFC2253: cert.certSubjectDNRFC2253,
      servicePrincipalId: "pep-test-01", organizationId: "org-test",
      permittedActions: ["reserve", "consume", "settle"]
    }])
  };
  function requestWithCert(tlsClientAuth) {
    const request = new Request("https://aston.test/v1/pep/agents/agent-1/reserve", {
      method: "POST", body: JSON.stringify({ amountMinor: 1 })
    });
    Object.defineProperty(request, "cf", { value: { tlsClientAuth } });
    return request;
  }

  it("rejects a certificate that failed Cloudflare verification with 403", async () => {
    const response = await worker.fetch(requestWithCert({ ...cert, certVerified: "FAILED:self signed certificate" }), pepEnv, noBinding);
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("MTLS_CERTIFICATE_INVALID");
  });

  it("rejects a revoked certificate with 403", async () => {
    const response = await worker.fetch(requestWithCert({ ...cert, certRevoked: "1" }), pepEnv, noBinding);
    expect(response.status).toBe(403);
  });

  it("rejects an otherwise valid certificate not pinned to a service principal", async () => {
    const response = await worker.fetch(requestWithCert({ ...cert, certFingerprintSHA256: "b".repeat(64) }), pepEnv, noBinding);
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("MTLS_PRINCIPAL_NOT_ALLOWLISTED");
  });

  it("rejects missing client certificates with 401", async () => {
    const response = await worker.fetch(requestWithCert({ certPresented: "0", certVerified: "NONE", certRevoked: "0" }), pepEnv, noBinding);
    expect(response.status).toBe(401);
  });
});
