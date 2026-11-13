const encoder = new TextEncoder();
const decoder = new TextDecoder();

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]*$/.test(value)) throw new Error("BAD_BASE64URL");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function decodeJsonSegment(segment) {
  return JSON.parse(decoder.decode(decodeBase64Url(segment)));
}

function unauthorized(code = "UNAUTHORIZED") {
  return { ok: false, status: 401, code };
}
function forbidden(code = "FORBIDDEN") {
  return { ok: false, status: 403, code };
}

export async function verifyAccessAdministrator(request, env, nowMs = Date.now()) {
  const token = request.headers.get("Cf-Access-Jwt-Assertion");
  if (!token) return unauthorized("ACCESS_JWT_MISSING");
  const parts = token.split(".");
  if (parts.length !== 3) return unauthorized("ACCESS_JWT_MALFORMED");

  let header;
  let claims;
  try {
    header = decodeJsonSegment(parts[0]);
    claims = decodeJsonSegment(parts[1]);
  } catch {
    return unauthorized("ACCESS_JWT_MALFORMED");
  }

  if (header.alg !== "RS256" || typeof header.kid !== "string") return unauthorized("ACCESS_JWT_ALGORITHM_REJECTED");
  if (typeof claims.exp !== "number" || claims.exp <= Math.floor(nowMs / 1000)) return unauthorized("ACCESS_JWT_EXPIRED");
  if (typeof claims.nbf === "number" && claims.nbf > Math.floor(nowMs / 1000)) return unauthorized("ACCESS_JWT_NOT_YET_VALID");
  if (claims.iss !== env.ACCESS_ISSUER) return unauthorized("ACCESS_JWT_ISSUER_MISMATCH");
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!env.ACCESS_AUD || !aud.includes(env.ACCESS_AUD)) return unauthorized("ACCESS_JWT_AUDIENCE_MISMATCH");

  let jwks;
  try {
    if (env.ACCESS_JWKS_JSON) jwks = JSON.parse(env.ACCESS_JWKS_JSON);
    else if (env.ACCESS_JWKS_URL) {
      const response = await fetch(env.ACCESS_JWKS_URL, { headers: { accept: "application/json" } });
      if (!response.ok) return unauthorized("ACCESS_JWKS_UNAVAILABLE");
      jwks = await response.json();
    } else return unauthorized("ACCESS_JWKS_NOT_CONFIGURED");
  } catch {
    return unauthorized("ACCESS_JWKS_UNAVAILABLE");
  }
  const jwk = jwks.keys?.find((key) => key.kid === header.kid && key.kty === "RSA" && key.use !== "enc");
  if (!jwk) return unauthorized("ACCESS_JWT_KEY_NOT_FOUND");

  try {
    const key = await crypto.subtle.importKey("jwk", jwk, {
      name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"
    }, false, ["verify"]);
    const signed = encoder.encode(parts[0] + "." + parts[1]);
    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5", key, decodeBase64Url(parts[2]), signed
    );
    if (!valid) return unauthorized("ACCESS_JWT_SIGNATURE_INVALID");
  } catch {
    return unauthorized("ACCESS_JWT_SIGNATURE_INVALID");
  }

  if (typeof claims.sub !== "string" || !claims.sub) return unauthorized("ACCESS_JWT_SUBJECT_MISSING");
  const requiredRole = env.ACCESS_ADMIN_ROLE || "aston-admin";
  const roles = Array.isArray(claims.roles) ? claims.roles : [];
  if (!roles.includes(requiredRole)) return forbidden("ACCESS_ADMIN_ROLE_REQUIRED");
  if (env.ACCESS_TENANT_ID && claims.tenant_id !== env.ACCESS_TENANT_ID) {
    return forbidden("ACCESS_TENANT_MISMATCH");
  }
  return { ok: true, principal: { subject: claims.sub, roles, tenantId: claims.tenant_id ?? null } };
}

/**
 * Authenticate a PEP from Cloudflare's trusted TLS metadata and a pinned
 * service-principal allowlist. PEP_REVOKED_PRINCIPALS is an independent,
 * deny-first runtime revocation list; a valid administrator JWT cannot
 * override a revoked PEP certificate principal.
 */
export function verifyPepMtls(request, env, nowMs = Date.now()) {
  const tls = request.cf?.tlsClientAuth;
  if (!tls || tls.certPresented !== "1") return unauthorized("MTLS_CERTIFICATE_MISSING");
  if (tls.certVerified !== "SUCCESS" || tls.certRevoked !== "0") {
    return forbidden("MTLS_CERTIFICATE_INVALID");
  }
  const notAfter = Date.parse(tls.certNotAfter || "");
  if (!Number.isFinite(notAfter) || notAfter <= nowMs) return forbidden("MTLS_CERTIFICATE_EXPIRED");

  let allowlist;
  let revokedPrincipals;
  try {
    allowlist = JSON.parse(env.PEP_CERT_ALLOWLIST || "[]");
    revokedPrincipals = JSON.parse(env.PEP_REVOKED_PRINCIPALS || "[]");
    if (!Array.isArray(allowlist) || !Array.isArray(revokedPrincipals) ||
        revokedPrincipals.some((value) => typeof value !== "string")) {
      return forbidden("MTLS_REVOCATION_CONFIG_INVALID");
    }
  } catch {
    return forbidden("MTLS_ALLOWLIST_INVALID");
  }

  const fingerprint = String(tls.certFingerprintSHA256 || "").toLowerCase().replaceAll(":", "");
  const match = allowlist.find((entry) =>
    String(entry.fingerprintSHA256 || "").toLowerCase().replaceAll(":", "") === fingerprint &&
    entry.issuerDNRFC2253 === tls.certIssuerDNRFC2253 &&
    entry.subjectDNRFC2253 === tls.certSubjectDNRFC2253
  );
  if (!match || !match.servicePrincipalId || !match.organizationId) {
    return forbidden("MTLS_PRINCIPAL_NOT_ALLOWLISTED");
  }
  if (revokedPrincipals.includes(match.servicePrincipalId)) {
    return forbidden("MTLS_PRINCIPAL_REVOKED");
  }
  return { ok: true, principal: {
    servicePrincipalId: match.servicePrincipalId,
    organizationId: match.organizationId,
    permittedActions: Array.isArray(match.permittedActions) ? match.permittedActions : []
  } };
}

export function authFailure(result) {
  return Response.json({ ok: false, error: result.code }, { status: result.status });
}
