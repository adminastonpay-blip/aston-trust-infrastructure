<!--
SPDX-FileCopyrightText: 2026 Aston OS
SPDX-License-Identifier: LicenseRef-ASTON-Proprietary
-->

# ASTON Identity & Tenant Authority Contract

**Document ID:** ASTON-IAC-001  
**Version:** 0.1.0-draft  
**Status:** PROPOSED CONTRACT — NOT IMPLEMENTED / NOT RATIFIED  
**Scope:** Cross-repository identity, tenant binding, lifecycle authorization, and delegation boundaries  
**Change class:** Documentation only; no runtime, schema, migration, secret, CI, or deployment changes

## 1. Purpose

Define the minimum security contract that ASTON implementations must satisfy before an authenticated user, service, or AI agent can act within a tenant.

The contract separates four questions that must never be conflated:

1. **Authentication:** Which principal presented a credential, and was that credential cryptographically and temporally valid?
2. **Tenant membership:** Which tenant, if any, is that principal authoritatively bound to?
3. **Tenant lifecycle:** Is that tenant currently permitted to operate?
4. **Delegated authority:** Is this principal permitted to perform this specific action, on this resource, for this purpose, within the applicable limits?

A valid signature answers only part of the first question. It does not create a tenant, establish membership, prove current tenant status, or grant action authority.

## 2. Evidence and current-state boundary

The following repository-level observations motivate this contract:

- The runtime repository's current Access JWT path validates signature, issuer, audience, expiry, and not-before, then derives a tenant from a JWT custom claim. A missing or malformed claim currently produces an `unassigned-<fingerprint>` identifier.
- The current runtime API-key path maps a global configured key to `default`; its sensor path maps the same configured secret to `ops`.
- The runtime design review records no authoritative tenant registry or approved provisioning-source contract in the inspected runtime files.
- The Attestation SDK repository describes a schema and specification boundary; it explicitly does not provide an identity provider, trust store, production verifier, or key-management service.
- ARP-1 requires a verified tenant scope and says missing identity or mandatory controls must not silently grant authority.

These observations are scoped to the inspected files and revisions. They are not proof that no external identity provider, operational process, or uninspected system exists.

**Decision:** No repository in this review is designated by this document as the tenant authority. The authority owner and source of truth remain an explicit governance decision.

## 3. Principal and tenant are different security objects

A principal represents an authenticated actor: human, workload, service, device, or AI agent.

A tenant represents an organizational security and data-isolation boundary.

A principal may have zero, one, or multiple tenant memberships, but each request must resolve exactly one effective tenant context before tenant-scoped access. A tenant identifier is not a credential. A credential subject is not automatically a tenant. An agent identity is not automatically a human or organization identity.

Implementations MUST use distinct, stable identifiers for:

- principal;
- tenant;
- credential/key;
- issuer;
- delegated grant;
- request/decision correlation.

Identifiers MUST NOT contain secrets or be derived from mutable display names or email addresses.

## 4. Authority model

### 4.1 Tenant authority

A separately approved Tenant Authority MUST own tenant creation, canonical tenant identifiers, lifecycle transitions, membership/credential bindings, and authoritative lifecycle versions.

The authority may be an existing enterprise identity/control plane or a purpose-built service. Selection is blocked until the accountable owner, operational source of truth, recovery process, and consistency guarantees are approved.

A runtime, SDK schema, JWT claim, API request, agent, or self-asserted attestation MUST NOT create or activate a tenant merely by presenting an identifier.

### 4.2 Issuer trust

Issuer trust is a separate configuration decision. A verifier MUST establish issuer-to-key trust through independently configured trust policy, validate key purpose and algorithm, and apply key rotation/revocation rules.

An issuer's cryptographic validity does not grant that issuer permission to provision tenants unless the Tenant Authority has explicitly delegated that permission under a bounded, auditable grant.

### 4.3 Credential binding

The authority MUST resolve a credential or issuer subject to a canonical principal and, where applicable, an explicit tenant membership. The binding MUST include scope and status.

A caller-provided tenant header, query parameter, body field, JWT tenant claim, API-key label, or attestation field is an input hint only until checked against the authority's binding record.

## 5. Minimum logical authority record

The eventual implementation MUST represent, at minimum, the following logical records. This is a contract, not a database schema recommendation.

### Tenant

| Attribute | Contract |
|---|---|
| tenant_id | Immutable, globally unique canonical identifier |
| status | One of the states in section 6 |
| lifecycle_version | Monotonically increasing integer; never rolled back |
| created_at / updated_at | Authority-controlled timestamps |
| status_changed_at | Authority-controlled transition timestamp |
| status_reason_code | Controlled, non-secret reason code |
| policy_version | Version of policy applicable to this tenant |

### Principal membership / credential binding

| Attribute | Contract |
|---|---|
| binding_id | Stable unique binding identifier |
| principal_id | Canonical principal identifier |
| tenant_id | Canonical tenant identifier |
| issuer_id / subject_id | Trusted issuer and exact subject, or credential reference |
| credential_id | Non-secret identifier for the credential/key |
| scopes | Explicit least-privilege scopes |
| status | Active or revoked; unknown states deny |
| binding_version | Monotonically increasing version |
| valid_from / expires_at | Explicit validity interval |

The raw credential, private key, bearer token, or API secret MUST NOT be stored in these records or emitted in audit events.

## 6. Tenant lifecycle state machine

The only initial lifecycle states are:

- `provisioning`
- `active`
- `suspended`
- `revoked`
- `archived`

Authorization MUST require status exactly `active`.

Allowed transitions:

| From | To | Required control |
|---|---|---|
| provisioning | active | Approved onboarding and ownership checks |
| provisioning | revoked | Authorized cancellation with audit |
| active | suspended | Immediate deny; authorized action |
| active | revoked | Immediate terminal revocation |
| suspended | active | Fresh approval, reason, and version increment |
| suspended | revoked | Terminal revocation |
| revoked | archived | Retention-only transition; remains denied |

No transition may reactivate an archived or revoked tenant. Tenant identifiers MUST never be recycled. Re-onboarding creates a new tenant identifier and an audited relationship to any prior tenant.

Every accepted transition MUST atomically increment `lifecycle_version`. Duplicate, out-of-order, unauthorized, or stale-version transitions MUST be rejected.

## 7. Normative authorization protocol

For every protected request, the enforcement point MUST:

1. Authenticate the credential, including algorithm allowlist, signature, issuer, audience, expiry, not-before, key status, and purpose as applicable.
2. Resolve the principal from the trusted credential binding.
3. Resolve exactly one canonical tenant membership for the requested operation.
4. Read the authoritative tenant lifecycle record and binding status/version.
5. Require tenant status exactly `active` and binding status exactly `active`.
6. Verify that the membership and credential are valid for the requested tenant, scope, and time.
7. Bind the resulting principal, tenant, lifecycle version, binding version, and policy version to an immutable request authorization context.
8. Evaluate delegation, role, policy, resource ownership, risk envelope, and SafetyInterlock constraints.
9. Execute only the exact action that was authorized.
10. Record the decision and outcome in the evidence/audit path.

No protected data read, model invocation, tool call, queue enqueue, Durable Object operation, database mutation, or external side effect may occur before steps 1–7 succeed.

A downstream component MUST consume the trusted authorization context or a narrowly scoped capability derived from it. It MUST NOT reconstruct authority from caller-controlled body fields.

## 8. Consistency, revocation, and failure semantics

The initial security profile requires an authoritative online lifecycle/binding check at each protected authorization boundary.

- Missing, unavailable, timed-out, malformed, ambiguous, or inconsistent authority responses MUST deny.
- Unknown status, duplicate active bindings, version rollback, stale version, or failed signature verification MUST deny.
- A cached positive result MUST NOT authorize access when the authority cannot be reached.
- Any future cache requires an explicitly approved maximum revocation delay, invalidation protocol, rollback protection, and adversarial tests. No default cache duration is implied by this draft.
- Revocation MUST invalidate both future requests and outstanding delegated capabilities within the approved revocation bound.
- Emergency recovery MUST be dual-controlled, time-bounded, narrowly scoped, and immutably audited. It MUST NOT silently convert an unavailable authority into an allow decision.

The exact availability target and maximum revocation propagation time remain unresolved and require owner approval before implementation.

## 9. Delegation and AI-agent authority

Delegation MUST be explicit and attenuating: a delegate cannot receive more authority than the delegator currently possesses.

Every grant MUST bind at least:

- grant identifier and version;
- delegator and delegate principal identifiers;
- tenant identifier and lifecycle version;
- allowed action and resource scope;
- purpose and relevant constraints;
- policy/risk-envelope version;
- issued-at, expiry, and revocation reference;
- approval/evidence reference where required.

A delegated grant MUST be rejected if its tenant is not active, its binding or grant is revoked/expired, its versions are stale, or its requested action exceeds scope.

An AI agent's attestation may provide evidence about claimed identity or execution. It MUST NOT be treated as the authority that grants the agent tenant membership or permission.

## 10. Credential-class requirements

### Cloud access JWT

- Validate cryptography, issuer, audience, expiry, not-before, key identifier, key status, and algorithm.
- Treat tenant claims as binding hints until independently resolved.
- Never provision or activate a tenant from a JWT claim.
- Missing or mismatched membership MUST deny; no synthetic operational tenant fallback.

### API keys and service credentials

- Use per-credential server-side records bound to one principal, explicit tenant membership, scopes, expiry, and revocation state.
- Store only a suitable salted/peppered verifier or cryptographic hash according to an approved key-management design; never store/log the raw key.
- A global emergency or machine key, if retained, MUST be isolated from customer identities, have explicit audience and narrow scopes, and be separately governed.
- Missing tenant mapping MUST deny; no shared `default` tenant fallback.

### Sensors and devices

- Use unique device/workload credentials and explicit tenant binding.
- Grant sensor-only scopes; do not infer operational or administrative roles from possession of a shared secret.
- Device attestation is evidence input, not a substitute for membership and lifecycle authorization.

## 11. Evidence and audit contract

Each authorization decision SHOULD produce a tamper-evident event containing:

- event and correlation identifiers;
- principal, tenant, credential, issuer, and binding references;
- tenant lifecycle, binding, policy, and grant versions;
- action/resource scope and decision outcome;
- stable reason code;
- timestamp and verifier/enforcement version;
- evidence digests and references.

Events MUST NOT contain raw credentials, private keys, bearer tokens, unnecessary personal data, or full sensitive payloads.

A hash chain alone does not prove trusted time, signer identity, or independent custody. Those properties require separately specified key management, timestamping, and/or transparency infrastructure.

## 12. Required conformance and adversarial tests

A conforming implementation MUST test the real protected route and downstream side-effect boundary, not only isolated parsing helpers.

| Scenario | Expected result |
|---|---|
| Valid credential, active tenant, matching binding and scope | Continue to policy evaluation |
| Suspended, revoked, archived, or unknown tenant | Deny before side effects |
| Missing/malformed tenant claim or binding | Deny; no auto-provisioning |
| Credential subject bound to a different tenant | Deny |
| Duplicate or ambiguous membership | Deny |
| Expired/revoked credential or binding | Deny |
| Registry timeout, outage, malformed response | Deny |
| Tenant/binding version rollback or stale grant | Deny |
| Attempt to escalate delegated scope | Deny |
| Cross-tenant resource access | Deny |
| Valid active membership and in-scope action | Positive control succeeds |
| Revocation during an outstanding delegated workflow | Deny within the approved revocation bound |

For denial cases, tests MUST assert zero protected reads, database writes, queue enqueues, Durable Object mutations, model invocations, and external tool actions. Simulated tests MUST be labelled simulated; they do not establish live-provider or production validation.

## 13. Repository responsibility boundaries

| Repository | Responsibility under this contract | Explicit non-authority |
|---|---|---|
| `agente-OS-15.5-hector-zapata` | Enforce authentication, tenant binding, lifecycle checks, and fail-closed request context at runtime | JWT claims or runtime-local fallbacks cannot self-authorize tenants |
| `aston-trust-infrastructure` | Maintain cross-system architecture, policy and evidence contracts; document governance decisions | Architecture documents and reference prototypes are not a live tenant registry |
| `aston-attestation-sdk` | Define portable attestation data structures and verification expectations | Schema validity or producer claims do not grant identity or tenant membership |
| `aston-risk-protocol` | Define decision-risk, envelope, and policy interoperability requirements | Risk scores and envelopes cannot create identity or override tenant lifecycle |

Cross-repository contract changes require versioned compatibility review. No repository should silently redefine tenant identity, lifecycle states, or authorization semantics independently.

## 14. Governance decisions blocking implementation

The following must be approved and recorded before runtime implementation:

- [ ] Accountable owner of tenant provisioning and revocation.
- [ ] Existing authoritative identity/control-plane source, or explicit approval to build one.
- [ ] Canonical tenant identifier format and migration mapping for existing data.
- [ ] Trusted issuer list and issuer-subject-to-principal binding rules.
- [ ] Membership cardinality and tenant-selection rules for multi-tenant principals.
- [ ] API-key, sensor, and workload credential migration plan.
- [ ] Availability target, consistency model, and maximum revocation propagation time.
- [ ] Audit retention, privacy, and emergency recovery ownership.
- [ ] Approved test environment and evidence requirements.

Until these decisions are resolved, TEN-02 remains OPEN / NOT IMPLEMENTED / NOT VALIDATED. This document does not authorize a runtime registry, database migration, credential change, or deployment.

## 15. Change control

This contract is a proposal. Ratification requires review by the accountable security/identity owner and compatibility review across all four repositories.

Any implementation PR must:
- cite the ratified contract version;
- be separate from this documentation PR;
- include migration and rollback analysis where applicable;
- include positive, adversarial, and zero-side-effect tests;
- identify simulated versus real validation;
- remain isolated from production until separately authorized.

**Current verdict:** architecture contract drafted; authority owner and source of truth remain unselected. No runtime control has been changed by this document.
