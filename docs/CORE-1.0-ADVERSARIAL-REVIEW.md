# CORE 1.0 — Adversarial Design Review

**Status:** Completed; findings incorporated into the approved contract baseline  
**Review scope:** Identity passport, policy authorization, API contract, evidence envelope, Cloudflare authentication profile, Durable Object consistency  
**Branch:** `docs/core-1.0-contracts`  
**Review type:** Design-level adversarial review. No runtime code, Cloudflare account, Worker, database, or production environment was tested or modified.

## Executive result

The initial draft contained several material ambiguities that would have created security or correctness defects if implemented literally. They have been addressed in the contract documents on this branch. The architecture is now coherent enough to freeze as a **specification baseline**, not to claim an implementation or production security certification.

## Findings and dispositions

| ID | Severity | Finding | Required disposition | Status |
|---|---|---|---|---|
| AR-01 | Critical | A valid mTLS certificate chain alone does not identify which PEP is authorized for which tenant/action. | Pin/map certificate fingerprint and/or constrained SAN + issuer to a provisioned service principal; enforce scopes and revocation. | Incorporated |
| AR-02 | High | A Service Binding does not authenticate the autonomous agent and can be undermined if the target also exposes an unprotected public route. | Keep target private where possible; independently authenticate any public ingress; retain agent proof-of-possession. | Incorporated |
| AR-03 | High | Access JWT signature verification without exact issuer, audience, time claims, role checks, and signing-key rotation is insufficient. | Validate `Cf-Access-Jwt-Assertion`, issuer, audience, signature, exp/nbf, roles/tenant and rotating Access keys. | Incorporated |
| AR-04 | Critical | “Single-threaded DO” alone does not guarantee a multi-step read/check/write transaction; async interleaving can occur. | Use SQLite-backed DO storage and explicit atomic transaction for budget and state transitions; no external I/O inside transaction. | Incorporated |
| AR-05 | Critical | A per-agent DO cannot atomically enforce a budget shared by multiple agents or a tenant-wide global revocation. | CORE 1.0 budget scope is explicitly per agent. Tenant/global deny is a separate fail-closed authority; multi-agent budgets require a future distributed ledger. | Incorporated |
| AR-06 | Critical | DO budget reservation cannot make an external payment/action exactly-once across a network failure. | Require downstream idempotency and durable action states; reconcile unknown outcomes; never blindly retry non-idempotent effects. | Incorporated |
| AR-07 | Critical | The original evidence hash/signature description did not fully define what bytes are hashed or how self-reference is avoided. | Define core fields, JCS UTF-8 bytes, SHA-256 digest, Ed25519 signature over raw 32-byte digest, and excluded envelope fields. | Incorporated |
| AR-08 | High | Evidence signed by an agent versus a PEP makes different assertions and must not be conflated. | Add explicit signer principal type/ID/key ID and require key-to-principal binding. | Incorporated |
| AR-09 | High | Identity issuer signature and agent proof-of-possession are separate trust claims. | Separate organization issuer signature on identity snapshot from agent-signed one-time registration challenge. | Incorporated |
| AR-10 | High | JSON Schema `format` is not necessarily enforced by validators; cross-field temporal/algorithm constraints are not all expressible in the schema. | Require format assertion and runtime checks for timestamp order and algorithm/JWK/key-ID consistency. | Incorporated |
| AR-11 | High | Revocation after `/authorize` but before token consumption could otherwise leave a stale ALLOW usable. | Re-check revocation and policy version at consume time through the same agent DO; consume and revoke share one serialization authority. | Incorporated |
| AR-12 | Medium | A per-agent DO is a deliberate throughput bottleneck and cannot be horizontally sharded without changing consistency semantics. | Document as a design boundary; benchmark hot-agent throughput before rollout; no unsafe sharding. | Incorporated |
| AR-13 | Medium | Cloudflare BYOCA availability and managed client certificate quotas are plan/zone dependent. | Treat CA entitlement and certificate capacity as deployment gates; do not assume BYOCA is available. | Incorporated |

## Security invariants retained

1. Default deny on missing, stale, invalid, or uncertain authorization state.
2. Human administrator JWT, PEP mTLS/Service Binding, and agent signing key are separate trust domains.
3. Every identity/policy/decision/evidence operation is tenant-scoped.
4. Per-agent budget reservation, consumption, and revocation share one authoritative agent DO.
5. Revocation is checked again at the point of authorization-token consumption.
6. Evidence is append-only; signatures prove integrity/attribution under a trusted key, not factual truth.
7. Hashing and signing use one unambiguous canonicalization profile.
8. No exactly-once claim for external side effects; idempotency and reconciliation are mandatory.

## Remaining deployment parameters (not blockers to the design freeze)

- Cloudflare Access team issuer, app audience, role/tenant claim mapping, and JWKS refresh strategy.
- PEP certificate issuance, fingerprint/SAN allowlist, revocation handling, and CA entitlement.
- Whether PEP calls use public mTLS or private Service Bindings in each environment.
- Durable Object class/namespace, compatibility date, operational limits, alarms/recovery and backup strategy.
- Decision-token representation/TTL and revocation/deny propagation SLO.
- Resource attribute matching details, evidence retention/encryption/legal hold, timestamp authority, rate/payload limits and service SLOs.

These are environment/configuration or operational values. They must be selected and tested before deployment, but they do not change the approved security semantics.

## Required implementation verification (not performed in this review)

- JSON Schema Draft 2020-12 meta-schema validation and positive/negative fixtures for all three schemas.
- JCS test vectors, SHA-256 digest vectors, Ed25519 signing/verification vectors, malformed/duplicate JSON member rejection.
- Cross-tenant isolation and Access JWT issuer/audience/expiry/key-rotation tests.
- mTLS valid/absent/revoked/wrong-principal tests and Service Binding public-ingress bypass tests.
- Concurrent requests at budget boundary; atomic consume versus revocation race; crash/timeout/uncertain-commit recovery.
- Downstream idempotency, duplicate delivery, timeout-after-side-effect and reconciliation tests.
- Evidence chain break, altered payload, wrong signer key, unknown extension and unavailable trust-material tests.
- Load/latency testing for a single hot agent DO and documented capacity limits.

## Freeze decision

**CORE 1.0 is frozen as an approved contract baseline on `docs/core-1.0-contracts`.** This approval applies to the specification and schemas only. It does not approve code, deployment, production bindings, secrets, migrations, or changes to `main`. Any semantic change after this freeze requires a versioned contract change and review.
