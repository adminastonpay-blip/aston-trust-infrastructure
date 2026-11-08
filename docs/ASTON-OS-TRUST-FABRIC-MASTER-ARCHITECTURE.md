# ASTON OS — TRUST FABRIC Master Architecture
**Track:** ASTON OS 21.x | **Status:** additive reference implementation; not deployed or certified.

## Product topology
ASTON OS remains the orchestration and system-of-record core. TRUST FABRIC is an independent assurance plane:
- Audit Engine: ARP-100 registry, isolated execution adapters, deterministic evaluation and risk reports.
- Guardian: deny-by-default policy decision point for identity, tenant, permissions, approvals, budgets and replay.
- Evidence Ledger: evidence manifests, canonical hashes, retention controls and independent verification.
- VBC: scoped assurance passports, signer key IDs, validity and revocation.
- Threat Intelligence: versioned threat records mapped to tests and mitigations.
- Command Plane: operator workflows, approvals and tenant administration.

Integrate through authenticated, versioned APIs. Do not mutate or import the production Worker environment directly.

## Trust boundaries
1. The target agent is untrusted during audit.
2. Evaluator and signer are separate from the target.
3. Fixtures contain no real credentials, secrets or personal data.
4. Active adversarial tests run only against explicitly authorized isolated clones.
5. Destructive actions are simulated; never execute them against live targets.
6. Missing identity, signature, budget state or policy means DENY.
7. Budget reservation must be atomic before forwarding. The current Guardian module is a pure decision function, not an atomic reservation adapter.
8. R2 is not called immutable until retention/versioning configuration is verified.

## Cloudflare mapping
Workers: API and routing. Durable Objects: audit coordination and atomic budget reservation. Sandbox/Containers: isolated execution. Queues: async campaigns and DLQ. D1: metadata and policies. R2: evidence artifacts. AI Gateway: model traffic and spend controls. Vectorize: optional threat retrieval. WebCrypto: signing and verification.
No binding is assumed to exist. Add bindings only in a separately reviewed integration change after inspecting the target Worker configuration.

## ARP-100
Four suites, 25 tests each: prompt injection, denial-of-wallet, fail-closed constitutional controls, privacy/data protection. Each case has severity, safe fixture, execution mode, deterministic oracle, expected observations, timeout and evidence requirement. Synthetic controls check that legitimate actions are not over-blocked. Missing observations fail. Critical failures reject the campaign. Passing the suite does not itself issue a VBC certificate.

## Guardian
The pure policy engine denies missing identity, tenant match, action/model allowlist, signature verification, replay state, cost estimate, budget state or atomic reservation. High-impact actions require separately verified human approval bound to the exact request digest. A production adapter must authenticate, validate signatures, atomically reserve budget, verify approvals, forward only after ALLOW and record evidence.

## Passport claims
A passport binds tenant, agent identity, artifact/config digest, model/tool versions, policy and catalog versions, result digest, evidence root, timestamps, signer key ID and revocation reference. HMAC is shared-secret integrity, not public-verifiable asymmetric signing. PQ signatures are claimed only after real runtime key custody, signing and independent verification tests. Bitcoin/OpenTimestamps anchoring proves timestamped existence under its assumptions, not safety or legal truth.

## Release gates
IMPLEMENTED means source/tests exist. VALIDATED requires reproducible passing tests and security evidence. STAGING requires non-production deployment and integration checks. PRODUCTION requires approved deployment, monitoring, rollback, backup/restore and incident procedures. This branch does not change production.