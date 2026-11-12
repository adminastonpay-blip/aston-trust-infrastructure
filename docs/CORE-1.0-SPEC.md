# ASTON TRUST FABRIC CORE 1.0 — Technical Specification

**Status:** Draft for review (design only; not implemented)  
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

Authorization MUST occur as close as practical to the protected action. For high-risk actions, the PEP SHOULD reserve budget atomically before execution and settle actual usage after execution. If reservation cannot be confirmed, the action MUST NOT start.

### 4.5 Evidence recording

After an authorization decision and action attempt, the submitting component creates an evidence envelope containing at minimum:
- schema and protocol version;
- globally unique event and request identifiers;
- tenant, agent, key identifier, and policy identifier/version;
- action and resource identifiers;
- decision identifier, decision outcome, and decision timestamp;
- execution start/end timestamps and outcome, if an action was attempted;
- canonical payload digest and digest algorithm;
- previous-event digest or explicit chain-start marker;
- signer algorithm and detached signature.

The signature covers the canonicalized envelope excluding the signature field itself. Canonicalization MUST be deterministic and specified consistently by all implementations (CORE 1.0 selects RFC 8785 JSON Canonicalization Scheme). The signature algorithm MUST be allowlisted; CORE 1.0 baseline is Ed25519 (`EdDSA`). Implementations MUST reject algorithm substitution and unknown critical fields.

Evidence submission MUST be append-only. Corrections are new linked events; existing evidence MUST NOT be overwritten. Evidence storage SHOULD be immutable/WORM-capable with access logging and retention policy. A hash or signature establishes integrity/attribution under the relevant key, not truth, completeness, or legal admissibility.

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

Revocation MUST invalidate cached allow decisions and outstanding unused authorization tokens. Implementations MUST use short decision TTLs and a revocation propagation mechanism; if current revocation state cannot be established, authorization is denied. Evidence already accepted remains immutable and verifiable as historical evidence.

## 5. Fail-Closed requirements

**Fail-Closed means no protected action is allowed unless every required authorization check has succeeded using current, authoritative state.** It is not enough to return an error to the caller; the PEP must prevent the external side effect.

### 5.1 Database unavailable or uncertain

If the authoritative database is unavailable, times out, returns a partial result, has an uncertain commit, or cannot provide a consistent read:
- the PDP MUST return `DENY / DEPENDENCY_UNAVAILABLE`;
- the PEP MUST NOT start the protected action;
- no cached positive decision may be used as a fallback;
- no default policy or permissive local mode may be activated;
- the event SHOULD be written to an independent durable failure/audit channel if available, without delaying the deny response;
- recovery MUST NOT automatically replay a previously denied action. The caller must submit a new request and obtain a new decision.

A database write that may have committed but whose outcome is unknown MUST be reconciled by idempotency key before retry. Duplicate grants, budget reservations, or evidence events MUST NOT be created.

### 5.2 Identity service unavailable

If the identity service cannot confirm current identity, key, tenant, or revocation status, the PDP MUST deny. A previously cached signed identity snapshot MAY be used for offline evidence verification, but MUST NOT authorize a new high-risk action. CORE 1.0 does not define an offline authorization mode.

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
- organization administrator authentication and separation of duties;
- policy matching semantics and deny precedence;
- budget reservation/settlement consistency;
- authorization decision TTL and single-use enforcement;
- canonicalization/signature profile;
- evidence envelope and independent verifier inputs;
- revocation propagation and cache invalidation;
- database/identity/policy outage behavior;
- tenant isolation and privacy/retention controls.

Implementation MUST add positive, negative, concurrency, replay, outage, stale-cache, revocation, and cross-tenant tests. A green unit-test suite alone is not proof of production readiness. Production requires separate security review, operational recovery tests, monitoring, and explicit deployment approval.

## 11. Related contracts

- `schemas/agent-identity.schema.json`
- `schemas/policy-authorization.schema.json`
- `docs/API-CONTRACT.md`

## 12. Status statement

This document is a proposed technical contract. It does not assert that CORE 1.0 endpoints, schemas, runtime enforcement, cryptographic verification, or production fail-closed behavior are implemented. Existing repository modules are not silently reclassified as CORE 1.0 components by this specification.
