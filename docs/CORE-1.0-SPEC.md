# ASTON TRUST FABRIC CORE 1.0 — Technical Specification

**Status:** Candidate contract — adversarial review incorporated; approval pending  
**Version:** 1.0.0-draft  
**Scope:** Portable Agent Identity, Cryptographic Evidence, Fail-Closed Authorization  
**Repository branch:** `docs/core-1.0-contracts`

## 1. Purpose and non-goals

CORE 1.0 defines a portable identity record for an autonomous agent, bounded authorization grants, a verifiable evidence envelope, and a fail-closed decision contract. It is an implementation-neutral specification for later development.

The design MUST make authorization decisions explicit, attributable, time-bounded, tenant-scoped, and independently auditable. A successful API response is not itself proof that an external action occurred. Evidence proves integrity and attribution of the submitted statement under a key; it does not prove that the statement is factually true.

**Not included in this deliverable:** runtime code, Cloudflare configuration, database migrations, production endpoints, wallet custody, blockchain transactions, ERC-8004 registration, x402 settlement, legal identity/KYC verification, or a claim of independent certification.

## 2. Normative language and conventions

The terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY** are normative. Timestamps use RFC 3339 UTC. Identifiers are opaque, globally unique strings. Monetary values are integer minor units with an ISO 4217 currency; floating-point money is prohibited.

All requests and responses are JSON over HTTPS. JSON schemas in `/schemas` use JSON Schema Draft 2020-12. Implementations MUST reject unknown security-critical fields or define an explicit extension namespace; they MUST NOT silently reinterpret them.

## 3. Trust boundaries and actors

- **Organization owner:** tenant that controls an agent registration and its grants.
- **Agent:** workload or autonomous process identified by a stable agent identifier and one or more public keys.
- **Organization administrator:** authenticated principal authorized to register agents and issue/revoke grants.
- **Policy decision point (PDP):** evaluates authorization requests against identity, policy, revocation, time, and budget state.
- **Policy enforcement point (PEP):** component immediately in front of the protected action. It MUST enforce the PDP result and MUST NOT treat a timeout as permission.
- **Evidence verifier:** independent implementation that validates signatures, canonicalization, schema, key status, and event linkage.
- **External action system:** the system that performs the protected operation. ASTON authorization does not guarantee that an external system enforces the decision unless integrated as the PEP.

The tenant boundary is mandatory. Every identity, policy, decision, budget, and evidence record MUST be scoped to an immutable `organization_id`. Cross-tenant lookups MUST return no data and MUST NOT disclose whether another tenant's object exists.

## 3A. Cloudflare reference architecture (normative boundary)

CORE 1.0 adopts Cloudflare-native primitives as the target deployment profile, without asserting that any binding or service is currently configured.

- **Human administrators:** Cloudflare Access protects administrative routes. The Worker MUST validate the `Cf-Access-Jwt-Assertion` JWT signature against the Access signing keys, exact issuer, exact application `aud`, `exp`, `nbf`, and any required identity claims/roles. It MUST handle signing-key rotation. It MUST NOT trust `CF_Authorization` cookies as the sole credential, caller-supplied identity headers, or an unverified JWT payload. Administrative mutations require explicit role/tenant authorization after JWT validation.
- **PEP services over public ingress:** mTLS is required at the protected hostname. The Worker MUST inspect Cloudflare's trusted `request.cf.tlsClientAuth` metadata; require `certPresented === "1"`, `certVerified === "SUCCESS"`, and `certRevoked === "0"`; reject absent, invalid, or revoked certificates; and map a verified certificate identity (preferably a pinned fingerprint/SAN plus issuer) to an allowlisted service principal and permitted tenant/action scope. Trusting any certificate merely because it chains to the CA is insufficient. The Worker MUST NOT accept client-supplied headers as proof of certificate identity.
- **PEP services within the same Cloudflare account:** a Service Binding MAY replace public mTLS for the Worker-to-Worker hop. The target service SHOULD have no public route. If public ingress exists, it MUST independently authenticate it; possession of a Service Binding name or a spoofable header is not authentication. Service Binding authenticates the service-to-service path, not the autonomous agent; agent proof-of-possession and per-request authorization remain required.
- **Agent cryptographic identity:** agent keys sign challenge proofs and evidence. They are not interchangeable with Access administrator JWTs or PEP mTLS certificates.
- **No implicit fallback:** if the required Access JWT, mTLS metadata, service binding context, agent signature, or principal mapping cannot be verified, deny.

Cloudflare Access service tokens are a separate service-credential option, not equivalent to a human Access JWT. CORE 1.0 selects mTLS or a private Service Binding for PEP-to-Core calls; service tokens are not an automatic fallback.

## 4. Lifecycle state machine

The logical lifecycle is:

`REGISTERED → IDENTIFIED → AUTHORIZED → EXECUTING → EVIDENCE_RECORDED → INDEPENDENTLY_VERIFIED`

Revocation is a terminal authorization state for the affected identity or grant. Suspension is reversible; revocation is not. Historical evidence MUST remain verifiable after revocation, while new authorization MUST be denied.

### 4.1 Registration

1. An authenticated organization administrator submits an agent registration request.
2. The service validates tenant ownership, administrator authority, identifier uniqueness, required metadata, and the proposed public key.
3. The agent proves possession of the corresponding private key using a server-issued, short-lived, single-use challenge bound to the registration request and tenant.
4. The service verifies the proof, consumes the challenge atomically, and creates the identity record.
5. The service returns the stable `agent_id`, identity version, status, timestamps, and a signed registration receipt.

Registration MUST be idempotent when the same idempotency key and request digest are retried. Reusing an idempotency key with a different request digest MUST return a conflict. The private key MUST never be uploaded or stored by ASTON.

### 4.2 Identity assignment and key lifecycle

The identity record binds an agent identifier to an owning organization, public signing keys, validity interval, status, and policy references. The agent signs a proof-of-possession challenge before a key becomes active.

Key rotation MUST be an explicit, auditable transition. A new key is added and proven before the old key is retired, except during emergency compromise response. Key identifiers are immutable. Revoked keys MUST NOT be accepted for new signatures. Historical signatures may still be verified against the historical key material and status timeline, but MUST be labelled as signed before/after the relevant revocation time.

The identity document is a portable signed snapshot, not a bearer credential granting permissions by itself. Current status and revocation MUST be checked online for authorization.

### 4.3 Permission grant

An authorized organization administrator creates a policy grant referencing an agent and a policy document conforming to `schemas/policy-authorization.schema.json`.

A grant MUST:
- be scoped to one organization and one agent (or an explicitly defined group in a later version);
- state exact action/resource scope and effect;
- include not-before and expiry timestamps;
- bound budget and execution duration where relevant;
- identify the issuer and approval evidence;
- have a unique immutable `policy_id` and monotonically increasing version;
- support immediate revocation.

No implicit wildcard permission is allowed. Wildcards, if ever introduced, require a separately reviewed extension and explicit opt-in. A policy grant does not override global deny rules, tenant suspension, identity revocation, or emergency kill switches.

### 4.4 Authorization and execution

Before every protected action, the PEP requests authorization with the agent identity, tenant, action, resource, requested budget, execution context, and a unique `request_id`.

The PDP MUST validate all of the following at decision time:
1. Authenticated caller and tenant match.
2. Identity exists, is active, is within its validity interval, and its signing key is active.
3. Policy grant exists, is active, unexpired, not revoked, and applies to the exact action/resource.
4. The requested action and resource satisfy the grant's scope.
5. Requested amount, cumulative spend, call count, concurrency, and duration remain within limits.
6. Any required human approval is present, valid, and bound to this exact request.
7. No global, tenant, agent, resource, or emergency deny rule applies.
8. Required authoritative dependencies are available and their responses are fresh.

The decision MUST be `ALLOW` or `DENY`; there is no permissive `UNKNOWN` state. An unavailable dependency results in `DENY` with a machine-readable reason such as `DEPENDENCY_UNAVAILABLE`. An allow decision is short-lived, single-use, bound to the request digest, tenant, agent, action, resource, policy version, and expiry. The PEP MUST reject replay, mismatched context, expired decisions, or decisions already consumed.

Authorization MUST occur as close as practical to the protected action. The authoritative per-agent budget ledger and revocation state reside in one SQLite-backed Durable Object (DO) per `organization_id + agent_id`. Every authorization, decision consumption, budget reservation/settlement, key status transition, and agent/grant revocation for that agent MUST be routed through that same DO. The DO MUST perform the read-check-write state transition in a SQLite transaction (or an equivalent documented atomic storage operation), with no external network `await` inside the transaction. A single-threaded event loop alone is not the transaction guarantee. Each mutation MUST carry an idempotency key and a monotonically increasing state sequence. If storage/transaction completion is uncertain, deny and reconcile by idempotency key before retry. A failed or uncertain budget reservation means the protected action MUST NOT start. CORE 1.0 budgets are per-agent only; organization-wide shared budgets spanning multiple agents are explicitly out of scope until a separately coordinated ledger is designed.

### 4.5 Evidence recording and cryptographic serialization

The normative evidence object is defined by `schemas/evidence-event.schema.json`. The envelope has a deliberately non-self-referential digest/signature construction:

1. Build the `core` object using exactly the fields defined by the evidence schema, excluding `eventDigest` and `signature`.
2. Canonicalize the complete `core` object using RFC 8785 JSON Canonicalization Scheme (JCS), UTF-8 encoded, with no byte-order mark and no trailing newline.
3. Compute `eventDigest = SHA-256(JCS(core))`; encode the digest as 64 lowercase hexadecimal characters.
4. If a payload is included in a future compatible profile, compute `payloadDigest = SHA-256(JCS(payload))` independently. CORE 1.0 stores payload content by reference or omission; the event schema carries its digest, not arbitrary raw payload bytes.
5. The signer signs the raw 32-byte `eventDigest` using Ed25519. The signature is base64url without padding. The signature object MUST declare `EdDSA` and the exact `keyId`.
6. The final envelope is `core + eventDigest + signature`. Verifiers MUST recompute the digest from the received core and verify the signature over those 32 bytes. They MUST reject duplicate JSON member names before canonicalization, unsupported algorithms, malformed encodings, and unknown security-critical fields.

JCS does not itself define the hash or signature; the ordered construction above does. Do not hash a JSON serialization containing its own digest or signature. `previousEventDigest` links to the prior event's `eventDigest`; the first event uses an explicit null chain predecessor. Trusted timestamp receipts, including any future OpenTimestamps proof, are separate detached artifacts over the event digest and are not included in the signed core.

The signer is explicitly identified as either the agent or the PEP. A PEP-signed event attests to the PEP's observation; an agent-signed event attests to the agent's statement. Neither alone proves external-world truth. Events are append-only. Corrections are new events referencing the superseded event. Evidence persistence MUST be confirmed before the API returns acceptance.

### 4.6 Independent verification

A verifier MUST be able to operate from the evidence package and trusted identity/key material without relying on the original dashboard. It checks:
1. schema and protocol version;
2. canonicalization and digest recomputation;
3. signature validity and algorithm allowlist;
4. key-to-agent binding and key validity at signing time;
5. tenant and identity status timeline;
6. policy reference/version and authorization decision linkage;
7. event/request uniqueness and chain linkage, where provided;
8. timestamp syntax and trusted timestamp receipt, if one is attached.

The result is a structured report with `VALID`, `INVALID`, or `INDETERMINATE` and individual checks. Missing trust material, unavailable revocation history, or untrusted timestamps MUST produce `INDETERMINATE`, not `VALID`. A valid signature does not prove that an action was actually performed or that its result was correct.

### 4.7 Suspension and revocation

Suspension temporarily blocks new authorizations and can be lifted by an authorized administrator. Revocation permanently invalidates an identity or a specific key/grant for future authorization. Revocation records MUST include actor, reason code, effective time, sequence/version, and signed administrative evidence.

Agent/key/grant revocation MUST be committed through the agent's authoritative DO and increment its state sequence. The `/v1/authorization/consume` operation MUST re-check revocation and policy version in that same DO at the point of consumption; therefore an allow decision issued before a committed revocation cannot be consumed afterward. No cached allow decision bypasses this check. Tenant-wide/global emergency deny state is a separate authoritative dependency: if it is unavailable or stale, every affected authorization is denied. Cross-agent revocation fan-out is not claimed to be instantaneous; CORE 1.0 defines per-agent linearization only. If an identity or policy change affects multiple agents, all affected agent DOs must be updated/confirmed before the change is reported as globally effective. Evidence already accepted remains immutable and verifiable as historical evidence.

## 5. Fail-Closed requirements

**Fail-Closed means no protected action is allowed unless every required authorization check has succeeded using current, authoritative state.** It is not enough to return an error to the caller; the PEP must prevent the external side effect.

### 5.1 Database unavailable or uncertain

If the authoritative DO/SQLite storage is unavailable, times out, returns a partial result, a transaction aborts, or commit outcome is uncertain:
- the PDP MUST return `DENY / DEPENDENCY_UNAVAILABLE`;
- the PEP MUST NOT start the protected action;
- no cached positive decision may be used as a fallback;
- no default policy or permissive local mode may be activated;
- the event SHOULD be written to an independent durable failure/audit channel if available, without delaying the deny response;
- recovery MUST NOT automatically replay a previously denied action. The caller must submit a new request and obtain a new decision.

A database write that may have committed but whose outcome is unknown MUST be reconciled by idempotency key before retry. Duplicate grants, budget reservations, or evidence events MUST NOT be created.

### 5.2 Identity service unavailable

If the identity authority or the agent's DO cannot confirm current identity, key, tenant, policy version, budget, or revocation status, the PDP MUST deny. There is no KV cache fallback for an allow decision. A previously cached signed identity snapshot MAY be used for offline evidence verification, but MUST NOT authorize a new high-risk action. CORE 1.0 does not define an offline authorization mode.

### 5.3 Policy service or revocation feed unavailable

If policy retrieval, policy version validation, revocation lookup, emergency deny list, or approval validation is unavailable or stale beyond the configured maximum age, deny. An older permissive policy MUST NOT be substituted for a newer unknown policy.

### 5.4 Network partitions, time, and replay

- A timeout, malformed response, signature failure, clock uncertainty beyond configured tolerance, or network partition MUST result in deny.
- If a trusted time source is unavailable or the local clock is outside the accepted drift bound, time-bounded authorization MUST be denied.
- Decision tokens MUST be single-use and bound to a nonce/request digest. Replays MUST be rejected.
- The PEP MUST fail closed if it cannot atomically consume the decision or reserve the required budget.

### 5.5 Recovery

Recovery is fail-closed by default. The service must re-establish healthy authoritative reads, verify current identity/policy/revocation versions, and reconcile uncertain writes before accepting new operations. No queued action is automatically executed merely because a dependency recovered. Operators must use a documented recovery procedure and, where applicable, explicit human re-authorization.

### 5.6 Fail-closed observability

Every denial due to dependency failure SHOULD produce a redacted audit event with correlation ID, dependency class, timeout/error category, and timestamp. Do not log private keys, access tokens, secrets, or unnecessary personal data. Health endpoints MUST NOT imply that authorization is available when a required dependency is degraded.

## 6. Security invariants

1. Default deny: absence, ambiguity, or uncertainty never grants permission.
2. Least privilege: grants are narrow, tenant-scoped, and time-bounded.
3. Separation of duties: agent identity, policy issuer, and verifier are distinct logical roles.
4. No private-key custody: agent signing private keys remain with the agent/operator.
5. Revocation wins: current revocation and emergency deny state override cached grants.
6. Evidence is append-only: corrections are linked new events.
7. Replay resistance: challenges, authorization decisions, and idempotency keys have explicit uniqueness and expiry.
8. Tenant isolation: tenant identifiers are enforced at every lookup and mutation.
9. No trust-score bypass: reputation must never replace identity, policy, or authorization checks.
10. No self-attestation shortcut: an agent's own claim cannot establish its organization ownership or grant authority.

## 7. Threats and mitigations

| Threat | Required mitigation |
|---|---|
| Stolen agent key | Short validity, rotation, revocation, proof-of-possession, anomaly alerts |
| Forged organization ownership | Authenticated admin authority and tenant-scoped registration |
| Cross-tenant access | Tenant-bound queries, authorization checks, isolation tests |
| Policy downgrade | Immutable versions, monotonic sequence, explicit issuer |
| Replay of allow decision | Single-use nonce, request digest binding, atomic consumption |
| Budget race/double spend | Atomic reservation and idempotent settlement |
| Database outage | Deny; no permissive cache fallback |
| Identity outage | Deny new authorization |
| Evidence tampering | Canonical digest, signature, append-only storage |
| False evidence claim | Independent checks; report integrity separately from factual truth |
| Clock manipulation | Trusted time source and bounded drift |
| Malicious administrator | Separation of duties, signed admin events, immutable audit trail |

## 8. Data handling and privacy

Identity records SHOULD contain identifiers and public keys, not secrets. Avoid storing unnecessary personal data. Logs and evidence must be tenant-scoped, access-controlled, encrypted in transit and at rest, and governed by documented retention/deletion requirements. Where deletion obligations conflict with audit retention, the implementation requires a reviewed legal and data-governance policy; this specification does not resolve jurisdiction-specific obligations.

## 9. Compatibility and extensibility

The identity model is designed to permit future DID methods, verifiable credentials, and adapters to agent registries such as ERC-8004. CORE 1.0 does not claim ERC-8004 conformance or require an EVM chain. External identifiers are references, not proof of identity by themselves.

Unknown extensions MUST be namespaced and MUST NOT alter security semantics. A verifier that encounters an unsupported critical extension returns `INDETERMINATE` or `INVALID`, never `VALID`.

## 10. Acceptance criteria before implementation approval

The specification is ready for implementation planning only when reviewers agree on:
- identity/key format and proof-of-possession;
- Cloudflare Access JWT validation, administrator roles, and separation of duties;\n- PEP mTLS certificate identity mapping or private Service Binding isolation;
- policy matching semantics and deny precedence;
- budget reservation/settlement consistency;
- authorization decision TTL and single-use enforcement;
- canonicalization/signature profile;
- evidence envelope JSON Schema, RFC 8785 JCS + SHA-256 digest construction, and Ed25519 signature profile;
- per-agent DO revocation linearization, tenant/global deny behavior, and cache invalidation;
- database/identity/policy outage behavior;
- tenant isolation and privacy/retention controls.

Implementation MUST add positive, negative, concurrency, replay, outage, stale-cache, revocation, and cross-tenant tests. A green unit-test suite alone is not proof of production readiness. Production requires separate security review, operational recovery tests, monitoring, and explicit deployment approval.

## 11. Related contracts

- `schemas/agent-identity.schema.json`
- `schemas/policy-authorization.schema.json`
- `docs/API-CONTRACT.md`

## 12. Reserved

This document is a proposed technical contract. It does not assert that CORE 1.0 endpoints, schemas, runtime enforcement, cryptographic verification, or production fail-closed behavior are implemented. Existing repository modules are not silently reclassified as CORE 1.0 components by this specification.


## 12A. Cloudflare implementation constraints and documented limits

The implementation profile SHOULD use SQLite-backed Durable Objects, which Cloudflare recommends for new namespaces. Each agent object owns only that agent's mutable authorization state. A tenant-level/global emergency deny control is separate and must be consulted fail-closed; it cannot be represented as if all per-agent objects update atomically.

Cloudflare Durable Objects are single-threaded coordination primitives, but asynchronous operations can allow event interleaving. Use explicit transactions for related read/modify/write operations. Never hold a storage transaction open while calling an external service. SQLite-backed DO transactions are the authority for budget reservation and state transitions; an in-memory mutex or single-threaded assumption is insufficient.

The per-agent DO is a serialization and throughput boundary. It prevents concurrent spends against that agent's ledger when all relevant mutations route to the same object, but it does not provide atomicity across multiple agents, multiple DOs, external payment providers, or external action systems. Those cases require a separately specified distributed ledger/saga and reconciliation protocol.

For incoming mTLS, the Worker must use the documented `request.cf.tlsClientAuth` properties and exact runtime values, not infer validity from arbitrary forwarded certificate headers. Cloudflare's BYOCA support for inbound client certificate validation is plan-dependent; if the account does not have the required entitlement, use Cloudflare-managed CA within its published limits or another explicitly reviewed ingress architecture. Service Bindings are internal Worker-to-Worker calls and require the target Worker to be deployed/configured in the same account; they do not authenticate end-user agents.

## 13. Status statement

This document is a proposed technical contract. It does not assert that CORE 1.0 endpoints, schemas, runtime enforcement, or production fail-closed behavior are implemented. Existing repository modules are not silently reclassified as CORE 1.0 components by this specification.
