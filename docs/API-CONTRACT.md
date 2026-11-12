# ASTON TRUST FABRIC CORE 1.0 — API Contract

**Status:** Candidate contract — adversarial review incorporated; endpoints are not deployed  
**Version:** 1.0.0-draft  
**Base path:** `/v1`  
**Transport:** HTTPS only; JSON request/response bodies  
**Repository branch:** `docs/core-1.0-contracts`

This document defines the HTTP interface to be implemented later. It is not evidence that a Worker route exists. No Cloudflare Worker, production service, database, secret, or deployment is changed by this contract.

## 1. Contract-wide rules

### 1.1 Authentication and tenant context

**Human administrators — Cloudflare Access JWT**

Administrative routes MUST be behind a Cloudflare Access application. The Worker MUST validate the `Cf-Access-Jwt-Assertion` header's signature using the Access public signing keys, exact issuer/team domain, exact application audience (`aud`), `exp`, `nbf`, and required identity/role claims. Key retrieval and rotation must follow the Access signing-key lifecycle. Do not trust an unverified decoded JWT, the `CF_Authorization` cookie alone, or caller-supplied identity/tenant headers. Access authentication is necessary but not sufficient: the Worker must still authorize the administrator's role and tenant for the requested operation. If JWT validation or key refresh cannot be completed safely, reject the request.

**PEP services — mTLS or private Service Binding**

For public ingress, require mTLS on the API hostname. In the Worker, validate Cloudflare-provided `request.cf.tlsClientAuth` metadata: certificate presented, `certVerified === "SUCCESS"`, and `certRevoked === "0"`. Map the certificate to a provisioned service principal using a pinned certificate fingerprint and/or constrained SAN/issuer identity. A valid chain to the CA alone is not sufficient authorization. Never trust forwarded certificate headers or client-supplied principal headers.

For Worker-to-Worker calls within the same Cloudflare account, a Service Binding MAY be used instead of public mTLS. The target Worker SHOULD have no public route. If it has public ingress, that path MUST enforce its own authentication. Service Binding authenticates the internal service hop, not the agent making the business request.

Agent proof-of-possession (agent public key) remains required independently of PEP authentication. Cloudflare Access service tokens are not silently interchangeable with mTLS; CORE 1.0's selected PEP modes are mTLS or private Service Binding.

- Every endpoint except the explicitly public-key verification operation MUST require authenticated service or administrator credentials.
- The proposed baseline is short-lived OAuth 2.0 access tokens using asymmetric JWT signing, with issuer/audience validation and narrowly scoped roles. Mutual TLS MAY be added for service-to-service deployments.
- Static API keys MUST NOT be the sole authentication mechanism for administrative or authorization operations.
- Tenant identity MUST be derived from authenticated claims and independently checked against the target resource. A caller MUST NOT select or override its tenant merely by supplying `organizationId` in JSON.
- Agent requests MUST prove possession of an active agent private key. Private keys are never sent to ASTON.
- Authorization endpoints MUST require a service identity permitted to act as a PEP; organization administration endpoints require an organization administrator role.

### 1.2 Common headers

| Header | Requirement | Meaning |
|---|---|---|
| `Authorization: Bearer <token>` | Required | Short-lived access token |
| `Content-Type: application/json` | Required on body requests | JSON payload |
| `Accept: application/json` | Recommended | Response format |
| `Idempotency-Key` | Required on mutating requests | Unique client-generated key; same key + same body returns original result |
| `X-Correlation-ID` | Recommended | Caller correlation identifier |
| `If-Match` | Required for version-sensitive updates where specified | Optimistic concurrency / expected version |

Idempotency keys MUST be scoped by tenant, principal, endpoint, and request digest. Reuse with a different body returns `409 IDEMPOTENCY_KEY_REUSED`. Idempotency records must outlive the maximum retry window.

### 1.3 Response envelope

Successful responses use the following envelope unless an endpoint specifies a binary or signed artifact:

```json
{
  "requestId": "req_01J...",
  "correlationId": "corr_01J...",
  "data": {},
  "meta": {
    "apiVersion": "1.0",
    "servedAt": "2026-11-12T12:00:00Z"
  }
}
```

Errors use a stable machine-readable envelope:

```json
{
  "requestId": "req_01J...",
  "correlationId": "corr_01J...",
  "error": {
    "code": "DEPENDENCY_UNAVAILABLE",
    "message": "Authorization cannot be evaluated safely.",
    "retryable": true,
    "details": {
      "dependency": "identity"
    }
  }
}
```

Error messages MUST NOT reveal cross-tenant object existence, secrets, internal stack traces, or sensitive infrastructure details.

### 1.4 Time, amounts, and identifiers

- Timestamps: RFC 3339 UTC.
- Monetary amounts: integer minor units plus ISO 4217 currency; no floating point.
- Identifiers: opaque strings; clients MUST NOT infer internal database keys.
- All resource reads and writes are tenant-scoped.
- JSON request bodies MUST be validated against the versioned schemas and endpoint-specific constraints.

## 2. Endpoint summary

| Method | Path | Purpose | Principal |
|---|---|---|---|
| POST | `/v1/identity/challenge` | Issue proof-of-possession challenge | Org admin (Access JWT) |
| POST | `/v1/identity/register` | Register agent identity | Org admin (Access JWT) |
| GET | `/v1/identity/{agentId}` | Resolve identity snapshot | Access JWT or authenticated PEP (scope-limited) |
| POST | `/v1/identity/{agentId}/keys/rotate` | Add/retire signing key | Org admin (Access JWT) |
| POST | `/v1/identity/{agentId}/suspend` | Suspend identity | Org admin (Access JWT) |
| POST | `/v1/identity/{agentId}/revoke` | Revoke identity | Org admin (Access JWT) / emergency role |
| POST | `/v1/policies/grants` | Create bounded policy grant | Org admin (Access JWT) |
| GET | `/v1/policies/{policyId}` | Resolve policy grant | Access JWT or authenticated PEP (scope-limited) |
| POST | `/v1/policies/{policyId}/revoke` | Revoke grant | Org admin (Access JWT) |
| POST | `/v1/authorize` | Evaluate a protected action | PEP service |
| POST | `/v1/authorization/consume` | Atomically consume allow decision | PEP service |
| POST | `/v1/evidence/submit` | Append signed evidence event | Authenticated PEP (mTLS/Service Binding) or agent via approved ingress |
| POST | `/v1/evidence/verify` | Independently verify evidence package | Verifier |
| GET | `/v1/evidence/{eventId}` | Retrieve authorized evidence | Authorized reader |
| GET | `/v1/status` | Dependency/readiness status | Operator / monitor |

## 3. Identity endpoints

### 3.1 `POST /v1/identity/challenge`

Issues a short-lived, single-use challenge to prove possession of a proposed public key.

**Request**
```json
{
  "organizationId": "org_example",
  "agentId": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "keyId": "agent-key-01",
  "algorithm": "EdDSA",
  "publicJwk": {
    "kty": "OKP",
    "crv": "Ed25519",
    "x": "BASE64URL_PUBLIC_KEY"
  },
  "purpose": "identity_registration"
}
```

**Response data**
```json
{
  "challengeId": "chl_01J...",
  "nonce": "BASE64URL_RANDOM_NONCE",
  "audience": "aston-trust-core",
  "issuedAt": "2026-11-12T12:00:00Z",
  "expiresAt": "2026-11-12T12:02:00Z",
  "signingPayload": "BASE64URL_CANONICAL_CHALLENGE"
}
```

The client signs the exact challenge payload using the private key corresponding to `publicJwk`. Challenge lifetime is short (proposed default: 120 seconds), single-use, bound to tenant, agent, key, purpose, and audience. Challenge consumption MUST be atomic.

### 3.2 `POST /v1/identity/register`

Creates the agent identity after validating administrator authority and key proof-of-possession.

**Request**
```json
{
  "organizationId": "org_example",
  "agentId": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "displayName": "Procurement Agent",
  "challengeId": "chl_01J...",
  "proof": {
    "algorithm": "EdDSA",
    "keyId": "agent-key-01",
    "signature": "BASE64URL_SIGNATURE"
  },
  "publicKeys": [
    {
      "keyId": "agent-key-01",
      "algorithm": "EdDSA",
      "status": "active",
      "publicJwk": {
        "kty": "OKP",
        "crv": "Ed25519",
        "x": "BASE64URL_PUBLIC_KEY"
      },
      "validFrom": "2026-11-12T12:00:00Z"
    }
  ],
  "expiresAt": "2027-11-12T12:00:00Z"
}
```

The service MUST derive the authoritative organization from the authenticated administrator context and require it to match the request. The service MUST NOT accept private key material.

**Response data:** `agentId`, `organizationId`, `identityVersion`, `status`, `issuedAt`, `expiresAt`, signed identity passport, and registration receipt identifier.

**Status codes:** `201` created; `200` idempotent replay; `400` invalid schema/proof; `401/403` authentication/authority failure; `409` identifier or idempotency conflict; `503` authoritative dependency unavailable (registration not confirmed).

### 3.3 `GET /v1/identity/{agentId}`

Returns the latest authorized identity snapshot and status metadata. Response MUST include identity version, key statuses, policy references, issued/expiry timestamps, and revocation metadata when applicable. A resolved identity is not an authorization decision.

### 3.4 `POST /v1/identity/{agentId}/keys/rotate`

Adds a new public key after proof-of-possession. The request identifies the new key, challenge, signature proof, and optional `retireKeyId`. The old key remains active until the new key is proven and the rotation transaction commits. Emergency compromise rotation may revoke the old key immediately and MUST include a reason code and elevated administrative authority.

### 3.5 Suspend and revoke identity

`POST /v1/identity/{agentId}/suspend` temporarily blocks new authorizations.  
`POST /v1/identity/{agentId}/revoke` permanently revokes the identity.

Both require `reasonCode`, `effectiveAt`, and an administrator-signed action. Revocation is irreversible in CORE 1.0; a replacement identity must be registered if needed. The service MUST invalidate outstanding unused decisions and trigger revocation propagation.

## 4. Policy endpoints

### 4.1 `POST /v1/policies/grants`

Creates a policy grant conforming to `schemas/policy-authorization.schema.json`.

The server derives `organizationId` and issuer from authenticated claims, checks that the subject agent belongs to that organization, validates issuer authority, and assigns/validates immutable policy versioning. The request MUST include an idempotency key.

**Response data:** `policyId`, `policyVersion`, `status`, `issuedAt`, `expiresAt`, canonical policy digest, and signed grant receipt.

### 4.2 `GET /v1/policies/{policyId}`

Returns the policy version visible to the caller, status, effective interval, and digest. It MUST NOT return another tenant's policy.

### 4.3 `POST /v1/policies/{policyId}/revoke`

Revokes a grant for future authorization. Request includes `reasonCode`, `effectiveAt`, and optional administrative evidence reference. Revocation must invalidate outstanding unused decisions and be visible to the PDP before any subsequent protected action is allowed. If propagation cannot be confirmed, the PDP denies.

## 5. Authorization endpoints

### 5.1 `POST /v1/authorize`

Evaluates a proposed action. This endpoint MUST be called by an authenticated PEP service, not treated as a public permission oracle.

**Request**
```json
{
  "organizationId": "org_example",
  "agentId": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "keyId": "agent-key-01",
  "policyId": "pol_procurement_01",
  "action": "procurement.purchase",
  "resource": {
    "type": "purchase_order",
    "resourceId": "po_12345"
  },
  "requestedBudget": {
    "amountMinor": 25000,
    "currency": "USD"
  },
  "requestId": "req_action_01J...",
  "requestDigest": {
    "algorithm": "sha-256",
    "value": "64_HEX_CHARACTERS"
  },
  "context": {
    "environment": "production",
    "approvalEvidenceRef": null
  }
}
```

The server MUST derive tenant from authentication and verify exact match with the subject, policy, and resource. It evaluates current identity, key, policy, revocation, budget, time, deny rules, and required approvals. Unknown or unavailable state MUST deny.

**Allow response data**
```json
{
  "decision": "ALLOW",
  "decisionId": "dec_01J...",
  "decisionToken": "OPAQUE_SINGLE_USE_TOKEN",
  "agentId": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "policyId": "pol_procurement_01",
  "policyVersion": 1,
  "requestDigest": {
    "algorithm": "sha-256",
    "value": "64_HEX_CHARACTERS"
  },
  "issuedAt": "2026-11-12T12:00:00Z",
  "expiresAt": "2026-11-12T12:00:30Z",
  "singleUse": true
}
```

**Deny response data**
```json
{
  "decision": "DENY",
  "decisionId": "dec_01J...",
  "reasonCode": "DEPENDENCY_UNAVAILABLE",
  "retryable": true,
  "issuedAt": "2026-11-12T12:00:00Z"
}
```

An allow decision MUST be bound to the exact tenant, agent, key, action, resource, policy version, request digest, and expiry. Proposed default allow-token lifetime is 30 seconds, configurable downward for high-risk actions. No stale allow token is accepted.

### 5.2 `POST /v1/authorization/consume`

Atomically consumes an allow decision immediately before the protected side effect.

**Request**
```json
{
  "decisionToken": "OPAQUE_SINGLE_USE_TOKEN",
  "requestId": "req_action_01J...",
  "requestDigest": {
    "algorithm": "sha-256",
    "value": "64_HEX_CHARACTERS"
  },
  "budgetReservation": {
    "amountMinor": 25000,
    "currency": "USD"
  }
}
```

The PEP MUST call this endpoint once and only once. The server verifies token binding, expiry, current revocation state, and atomic budget reservation. A duplicate consume returns `409 DECISION_ALREADY_CONSUMED`; a mismatched digest returns `403 DECISION_CONTEXT_MISMATCH`. If the consume outcome is uncertain, the PEP MUST NOT perform the action until it reconciles the decision state.

A successful consume response authorizes the PEP to attempt the bound action; it does not prove that the action succeeded. After execution, the PEP submits evidence.

## 6. Evidence endpoints

### 6.1 `POST /v1/evidence/submit`

Appends an evidence event. The submitted envelope MUST be signed by an active agent or PEP key and conform to the evidence profile in `docs/CORE-1.0-SPEC.md`. The request MUST conform to `schemas/evidence-event.schema.json`. The schema defines the exact JCS/SHA-256/Ed25519 serialization profile.

**Request shape**
```json
{
  "schemaVersion": "aston.evidence/1.0",
  "eventId": "evt_01J...",
  "organizationId": "org_example",
  "agentId": "urn:uuid:00000000-0000-4000-8000-000000000001",
  "keyId": "agent-key-01",
  "decisionId": "dec_01J...",
  "policyId": "pol_procurement_01",
  "policyVersion": 1,
  "requestId": "req_action_01J...",
  "eventType": "action.completed",
  "occurredAt": "2026-11-12T12:00:05Z",
  "payloadDigest": {
    "algorithm": "sha-256",
    "value": "64_HEX_CHARACTERS"
  },
  "previousEventDigest": null,
  "signature": {
    "algorithm": "EdDSA",
    "canonicalization": "RFC8785",
    "value": "BASE64URL_SIGNATURE"
  }
}
```

The server validates schema, canonical JCS digest, Ed25519 signature over the raw 32-byte event digest, key status at signing time, tenant linkage, event uniqueness, and referenced decision/policy linkage. The event digest is SHA-256 over the JCS UTF-8 bytes of the event core excluding `eventDigest` and `signature`; no self-referential hashing is permitted. It appends rather than overwrites. Corrections require a new event referencing the prior event. The response returns event identifier, accepted timestamp, canonical digest, storage receipt, and append sequence. Acceptance does not assert the factual truth of the payload.

### 6.2 `POST /v1/evidence/verify`

Verifies an evidence package. The verifier returns `VALID`, `INVALID`, or `INDETERMINATE` with individual check results. Missing trust material or unavailable revocation history cannot produce `VALID`.

**Request**
```json
{
  "evidence": {},
  "identitySnapshot": {},
  "policySnapshot": {},
  "trustAnchors": [
    {
      "keyId": "org-issuer-key-01",
      "publicJwk": {}
    }
  ],
  "verificationOptions": {
    "requireCurrentRevocationStatus": true,
    "requireTrustedTimestamp": false
  }
}
```

**Response data**
```json
{
  "result": "INDETERMINATE",
  "checks": [
    { "name": "schema", "result": "VALID" },
    { "name": "canonical_digest", "result": "VALID" },
    { "name": "signature", "result": "VALID" },
    { "name": "revocation_status", "result": "INDETERMINATE" }
  ],
  "limitations": ["Current revocation history was unavailable."]
}
```

A verifier MAY support offline operation when all required signed snapshots and trust anchors are supplied. Offline results MUST clearly state that current revocation status was not checked.

### 6.3 `GET /v1/evidence/{eventId}`

Returns an evidence event and its verification metadata to an authorized tenant principal. Access control and retention policy apply. It MUST NOT silently alter the original event.

## 7. Status endpoint

### `GET /v1/status`

Returns service health and dependency readiness for operational monitoring. It MUST NOT expose secrets, database connection strings, tenant data, or detailed internal topology.

Example:
```json
{
  "service": "aston-trust-core",
  "apiVersion": "1.0",
  "state": "degraded",
  "authorizationReady": false,
  "dependencies": {
    "identity": "unavailable",
    "policy": "healthy",
    "database": "unavailable",
    "evidenceStore": "healthy"
  }
}
```

If any mandatory authorization dependency is unavailable, `authorizationReady` MUST be false and `/v1/authorize` MUST deny. Health status is informational and never grants permission.

## 8. HTTP status and error codes

| HTTP | Error code | Meaning |
|---|---|---|
| 400 | `INVALID_REQUEST` | Malformed request or schema failure |
| 401 | `UNAUTHENTICATED` | Missing/invalid credentials |
| 403 | `FORBIDDEN` | Authenticated principal lacks authority |
| 403 | `IDENTITY_INACTIVE` | Identity/key suspended or revoked |
| 403 | `POLICY_DENIED` | No applicable grant or deny rule matched |
| 403 | `BUDGET_EXCEEDED` | Budget/call/concurrency limit exceeded |
| 403 | `DECISION_CONTEXT_MISMATCH` | Token does not bind to submitted action |
| 404 | `NOT_FOUND` | Resource not visible to caller |
| 409 | `CONFLICT` | Version or uniqueness conflict |
| 409 | `IDEMPOTENCY_KEY_REUSED` | Same key with different request digest |
| 409 | `DECISION_ALREADY_CONSUMED` | Single-use decision already consumed |
| 410 | `CHALLENGE_EXPIRED` | Challenge expired or already consumed |
| 422 | `INVALID_PROOF` | Signature/proof validation failed |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 503 | `DEPENDENCY_UNAVAILABLE` | Required authoritative dependency unavailable |
| 503 | `AUTHORIZATION_NOT_READY` | System cannot safely evaluate authorization |

A dependency outage MUST NOT be converted into `200 ALLOW`, a permissive cached response, or a retry that executes the side effect automatically.

## 9. Fail-Closed behavior at the API boundary

The following are mandatory:
- Identity, policy, revocation, budget, approval, or authoritative database unavailable: deny authorization.
- Timeout, malformed dependency response, stale policy/revocation data, signature error, or clock uncertainty: deny.
- Authorization decision consumption cannot be atomically confirmed: PEP does not execute.
- Evidence store unavailable after an action: the PEP follows its separately approved execution policy. For high-risk actions, the recommended profile is to require durable pre-action intent/authorization evidence before execution and deny if that prerequisite cannot be persisted. The inability to append post-action evidence MUST be surfaced as an incident; it must never be concealed.
- Service recovery does not replay denied or uncertain actions automatically.

A status endpoint cannot override these rules.

## 10. Rate limits, retries, and concurrency

Mutating endpoints require idempotency. Clients may retry only with the same idempotency key and identical body. Exponential backoff with jitter is recommended for retryable dependency errors, but retries MUST NOT bypass authorization or repeat side effects.

Budget reservation, decision consumption, key/grant revocation, and agent status changes MUST be serialized through the same agent Durable Object. The DO MUST use SQLite-backed storage and an explicit transaction for the read-check-write transition. All writes require idempotency keys and monotonic state sequence numbers. Do not perform network I/O inside the transaction. Per-agent budget is authoritative; organization-wide budgets spanning multiple agents are out of scope for CORE 1.0. The DO is a deliberate per-agent throughput boundary. No exactly-once guarantee is made for external side effects: PEPs require downstream idempotency and reconciliation for unknown outcomes.

## 11. Security and privacy requirements

- TLS 1.2+ (TLS 1.3 preferred); modern cipher suites.
- Strict request size limits, content-type validation, schema validation, and rate limiting.
- JWT issuer, audience, expiry, not-before, signature, and key rotation validation.
- No private keys, passwords, bearer tokens, or secrets in logs.
- Redact sensitive payload fields and avoid logging unnecessary personal data.
- Tenant isolation on every query and mutation, including evidence retrieval and idempotency storage.
- Append-only evidence semantics and access audit.
- CORS, if needed for browser clients, must use explicit allowlists; never wildcard credentialed origins.
- Administrative mutations require stronger authorization and auditable issuer identity.
- Error responses must not leak whether an inaccessible cross-tenant resource exists.

## 12. Versioning and compatibility

The API prefix `/v1` is a major compatibility boundary. Additive non-security fields MAY be introduced only if clients are required to ignore documented optional fields. Changes to authorization semantics, signature profiles, required fields, or error behavior require a versioned contract update and review. Schemas are versioned independently through their `schemaVersion` constants.

## 13. Decisions fixed by this contract and remaining implementation parameters

Fixed for CORE 1.0: Cloudflare Access JWT for human administrators; mTLS or private Service Binding for PEP services; agent key proof-of-possession independent of both; RFC 8785 JCS followed by SHA-256 for event digest; Ed25519 signature over the raw 32-byte digest; SQLite-backed per-agent Durable Object as the authoritative serialization/transaction boundary; deny on uncertain dependency or transaction state.

Implementation parameters still requiring values before deployment: Access team issuer and audience; PEP certificate fingerprint/SAN allowlist and CA entitlement; Service Binding topology; Durable Object namespace/class and compatibility date; decision-token TTL and storage representation; revocation/deny propagation SLO; resource-attribute matching details; evidence retention/encryption/legal-hold policy; timestamp authority/OpenTimestamps integration; rate limits, payload limits, and service SLOs. These parameters do not weaken the security invariants above.

The identity schema's issuer signature is distinct from the agent proof-of-possession challenge. Implementations MUST enforce that the public JWK algorithm, key metadata algorithm, and proof/signature algorithm agree. JSON Schema `format` annotations MUST be actively validated; implementations must also enforce temporal ordering (issuedAt < expiresAt, notBefore < expiresAt, validFrom < validUntil), which JSON Schema alone does not express.
 
## 14. Implementation gate

No implementation should begin until the four CORE 1.0 deliverables are reviewed together and the open decisions above are resolved. Subsequent code must be built on an isolated branch, validated with schema tests, contract tests, outage tests, concurrency tests, replay tests, revocation tests, and independent verification tests. Deployment to production requires a separate explicit approval and is outside this contract.
