# ASTON Immune Fabric 2040 — Master Specification

**Document status:** Architecture baseline / Draft for review  
**Version:** 0.1.0  
**Date:** 2026-11-18  
**Target branch:** `docs/aston-immune-fabric-2040-master-spec`  
**Scope:** Architecture and governance only. No runtime implementation, production deployment, Cloudflare change, D1 migration, or change to `main` is authorized by this document.

---

## 1. Executive intent

ASTON is to evolve as one coherent platform, not as four competing products or a collection of disconnected security tools.

The platform has three architectural layers:

1. **ASTON OS — the body:** runtime, agent execution, orchestration, workflows, and integration with customer environments.
2. **ASTON Trust Fabric — the nervous system:** identity, tenant boundaries, delegation, policy evaluation, authorization, safety interlocks, attestation, provenance, risk decisions, and verifiable evidence.
3. **ASTON Immune Fabric 2040 — the immune system:** threat intelligence, asset and attack-surface understanding, adaptive detection, containment orchestration, supply-chain defense, AI-agent defense, recovery, and resilience measurement.

These are logical layers of one platform. They may be deployed as separate services or components where isolation requires it, but they must share explicit contracts, trust assumptions, evidence formats, and lifecycle governance.

### Mission

Reduce the likelihood and blast radius of digital compromise, prevent unauthorized actions from propagating, preserve trustworthy evidence, and make recovery a demonstrable capability.

ASTON does not claim invulnerability, universal attack prevention, or guaranteed detection of every unknown threat. Security claims must be bounded by a documented threat model and repeatable evidence.

## 2. Architectural principles and non-negotiable invariants

1. **Fail closed for critical actions.** Missing, stale, malformed, unverifiable, or contradictory authorization evidence must not authorize a critical action.
2. **No implicit trust.** Issuer identity, artifact origin, agent identity, telemetry, and upstream verdicts are inputs to verify, not truth by themselves.
3. **Least privilege and bounded delegation.** Permissions are scoped by subject, action, resource, tenant, environment, purpose, and time.
4. **Separation of duties.** Detection, decision, enforcement, evidence storage, and recovery must not all depend on one component or one credential.
5. **Evidence before claims.** Every security control has a testable contract, explicit evidence, and a maturity state.
6. **Containment must be proportionate.** Prefer the narrowest verified containment action that limits harm; broad isolation requires stronger authorization and safeguards.
7. **Recovery is a security operation.** A backup is not trusted merely because it exists; restoration requires integrity, provenance, and post-restore validation.
8. **Customer sovereignty.** Customer data, keys, policies, and operational authority remain within explicitly agreed boundaries.
9. **Degraded-mode safety.** Loss of ASTON services must not silently turn denied actions into allowed actions.
10. **Replaceable components.** Modules communicate through versioned contracts and can be replaced without bypassing Trust Fabric controls.
11. **Cryptographic agility.** Algorithms and key formats are versioned and replaceable; post-quantum readiness is not claimed solely because a source file or placeholder exists.
12. **Independent recovery of the control plane.** Emergency recovery must not rely exclusively on the component or credentials whose compromise triggered the incident.

## 3. System context and trust boundaries

### 3.1 Logical context

- **Customer-controlled zone:** endpoints, networks, cloud accounts, workloads, identity providers, business applications, OT/ICS systems, customer data, customer-managed keys.
- **ASTON execution zone:** ASTON OS runtime, connectors, policy enforcement points, containment adapters, recovery orchestration.
- **ASTON trust zone:** identity and tenant registry, policy authority, delegation, Safety Interlock, risk decision contracts, attestation verification, evidence ledger.
- **External dependency zone:** cloud providers, software vendors, package registries, threat-intelligence sources, model providers, timestamp services, certificate authorities.
- **Independent assurance zone:** external auditors, customer security approvers, independent key custodians, offline recovery authority.

A deployment must document which zone hosts each component, which party controls its credentials, what data crosses each boundary, and which party can revoke or override access.

### 3.2 Trust-boundary rules

- Connectors are untrusted until authenticated and authorized.
- Telemetry is potentially incomplete, delayed, duplicated, spoofed, or adversarial.
- External threat feeds and model outputs are advisory until validated against policy and corroborating evidence.
- A customer environment must not grant ASTON unrestricted administrative authority by default.
- ASTON must not possess a single credential capable of disabling all customer protections and deleting all evidence.
- Cross-tenant data access is denied unless an explicit, auditable policy authorizes a narrowly scoped operation.
- OT/ICS actions require environment-specific safety constraints and customer-approved operating envelopes; IT assumptions must not be applied blindly to physical processes.

## 4. Data-flow diagram (DFD) — trust and defense decision path

The following is the normative logical flow for a protected action. Implementations may add stages but must not bypass the authorization and enforcement invariants.

```text
[Agent / User / Workload]
          |
          | 1. Action request + identity + context
          v
[ASTON OS Runtime / Policy Enforcement Point]
          |
          | 2. Normalize request; assign correlation ID
          v
[Trust Fabric: Identity + Tenant + Delegation]
          |
          | 3. Verify identity, tenant lifecycle, scope, expiry
          v
[Trust Fabric: Policy + Risk Contracts] <---- [Immune Fabric: Threat / Asset Context]
          |                                          ^
          | 4. Evaluate policy and contextual risk   |
          |                                          | telemetry, intel, asset posture
          v                                          |
[Safety Interlock: Permit / Deny / Require Approval]
          |
          | 5. Short-lived, scoped decision token only if permitted
          v
[ASTON OS Enforcement Adapter]
          |
          | 6. Execute within bounded scope
          v
[Customer Resource / Agent Tool / Workload]
          |
          | 7. Result, telemetry, execution evidence
          v
[Evidence Ledger / Attestation / Provenance]
          |
          +----> [Immune Fabric: Detection, Containment, Recovery]
          |
          +----> [Audit / Customer Reporting]
```

### 4.1 Decision outcomes

- **DENY:** action is not executed.
- **ALLOW_BOUNDED:** a narrowly scoped, short-lived authorization is issued and enforced.
- **REQUIRE_HUMAN:** action remains blocked until the required approval is verified.
- **QUARANTINE / CONTAIN:** a separately authorized containment workflow is invoked.
- **DEGRADED:** critical dependencies are unavailable; critical actions remain denied unless a pre-approved, bounded offline policy explicitly applies.

A risk score alone must never grant permission. Model-generated recommendations must never directly mint a permit.

### 4.2 Evidence requirements

For each critical decision, record as applicable: request/correlation ID, subject and tenant identifiers, action/resource scope, policy version and digest, risk inputs and their provenance, decision and reason codes, approver identity and approval evidence, permit identifier and expiry, enforcement result, timestamps, and tamper-evident ledger references. Secrets and unnecessary personal data must not be written to evidence records.

## 5. Module architecture and responsibility boundaries

| Capability | Primary responsibility | Depends on | Explicit non-goal |
|---|---|---|---|
| Threat Intelligence | Ingest, normalize, score, expire, and trace external threat information | Provenance, source trust, evidence | Treating feeds as unquestionable truth |
| Attack Surface Intelligence | Maintain authorized inventory of assets, exposures, dependencies, and ownership | Connectors, tenant scope, asset identity | Unapproved scanning or discovery outside customer scope |
| Adaptive Detection | Correlate events and identify policy deviations and suspicious behavior | Telemetry quality, baselines, risk contracts | Claiming guaranteed zero-day detection |
| Autonomous Containment | Execute bounded isolation, credential revocation, process blocking, or route restriction | Safety Interlock, customer playbooks, rollback | Unbounded autonomous destructive actions |
| Supply Chain Immunity | Verify artifact digests, signatures, provenance, dependencies, and policy | Attestation SDK, key trust, revocation | Trusting a publisher identity alone |
| Quantum-Ready Security | Crypto inventory, agility, migration planning, hybrid transition | Algorithm registry, key lifecycle | Claiming post-quantum protection without validated algorithms and deployment |
| Recovery Fabric | Select verified recovery points and orchestrate restoration | Immutable evidence, backup integrity, customer authority | Restoring unverified backups as trusted |
| AI Defense | Govern model, agent, tool, prompt, delegation, and output risks | Identity, policy, telemetry, runtime enforcement | Assuming model safety filters are security boundaries |
| Verifiable Security | Produce independently checkable evidence of controls and outcomes | Evidence ledger, attestation, provenance | Treating logs alone as proof of prevention |
| Resilience Orchestration | Coordinate incident workflows, dependencies, continuity objectives, and exercises | All relevant modules and customer approvals | Becoming a single point of failure |

### 5.1 Shared platform services

Identity, tenant lifecycle, policy, delegation, Safety Interlock, risk contracts, key management interfaces, time sources, evidence, audit, configuration, and version negotiation are shared services. Domain modules must not create competing authorities for these functions.

### 5.2 Module maturity

Every module and individual control must carry one of these labels:

- **DESIGNED:** specification exists; implementation not demonstrated.
- **IMPLEMENTED:** code exists; this does not imply tests pass.
- **TESTED:** defined automated or manual tests pass for stated cases.
- **VALIDATED:** independent or controlled adversarial validation supports the stated claim and scope.
- **PRODUCTION:** deployed under an identified operational configuration with monitoring, ownership, incident process, and evidence.

A status must include commit/version, environment, test scope, date, and evidence reference. No maturity state is inferred from a filename, documentation statement, or successful CI alone.

## 6. Versioned interface contracts

The first implementation phase must define and review schemas before connecting modules. The following are conceptual contracts, not implemented APIs.

### 6.1 Common envelope

Every inter-module message should carry:
- `contract_version`
- `event_id` and `correlation_id`
- `tenant_id` and environment scope, where applicable
- `issued_at`, `expires_at`, and replay-protection data
- `producer_identity` and authentication context
- payload digest and integrity metadata
- provenance references
- explicit classification and retention metadata

Unknown critical fields, unsupported contract versions, invalid signatures, expired messages, and replayed messages must fail closed.

### 6.2 Required contracts

| Contract | Producer → consumer | Required semantics |
|---|---|---|
| `IdentityContext` | Identity → Policy / Interlock | Verified subject, tenant lifecycle, credential status, scopes, expiry |
| `AssetContext` | Asset intelligence → Risk | Asset identity, owner, environment, criticality, observation freshness |
| `ThreatSignal` | Intelligence / Detection → Risk | Source, confidence, indicators, validity window, provenance |
| `RiskAssessment` | Risk → Policy / Interlock | Factors, rationale, confidence, limitations, policy context; never an authorization by itself |
| `PolicyDecision` | Policy → Interlock | Allow/deny/approval requirement, scope, policy digest, expiry |
| `PermitToken` | Interlock → Enforcement Point | Single-purpose, audience-bound, short-lived, replay-resistant authorization |
| `ContainmentCommand` | Orchestrator → adapter | Approved action, target, scope, safety envelope, expiry, rollback plan |
| `ExecutionEvidence` | Enforcement → Evidence | Actual action, result, resource, timestamps, permit and correlation references |
| `RecoveryPlan` | Recovery → customer approver / executor | Recovery point, integrity evidence, dependencies, impact, approval, verification steps |

All contracts require schema validation, authentication, authorization, version compatibility, size limits, replay protection, and audit behavior. Exact serialization, signing profile, and transport are to be selected in an architecture decision record (ADR), not silently assumed here.

## 7. Failure, compromise, and recovery matrix

| Failure / compromise | Required safe behavior | Recovery / evidence |
|---|---|---|
| Identity or tenant registry unavailable | Deny new critical permits; do not map unknown tenants to a trusted default | Restore registry from verified state; reconcile revocations |
| Policy service unavailable | Deny critical actions; allow only explicitly pre-approved offline-safe operations | Reconcile policy versions and decisions |
| Safety Interlock unavailable | No critical action executes without a valid permit | Independent recovery authority; verify service integrity before re-enable |
| Detection module unavailable or compromised | Mark visibility degraded; do not interpret absence of alerts as safety | Isolate module, use independent telemetry, restore known-good version |
| Threat feed poisoned | Quarantine source; require provenance and corroboration; avoid destructive response from one feed | Recompute decisions and preserve source evidence |
| Containment adapter compromised | Revoke adapter credentials and stop its commands; keep independent customer controls available | Customer-authorized recovery and credential rotation |
| Evidence ledger unavailable | Buffer signed, bounded evidence where safe; block actions whose auditability is mandatory | Reconcile sequence and integrity before accepting buffered records |
| Key or issuer compromised | Revoke affected key/issuer; reject artifacts and tokens within affected trust scope | Independent key custodian, rotation, re-attestation |
| Recovery image or backup untrusted | Do not restore it as a trusted state | Select another verified recovery point; forensic review |
| ASTON control plane compromised | Fail closed for high-impact actions; isolate control-plane credentials and segments | Out-of-band recovery, independent trust roots, customer authority |
| Cloud/provider outage | Enter documented degraded mode; preserve customer-side controls | Reconcile events and policy state after service restoration |
| Clock drift or time source compromise | Reject time-sensitive permits and freshness assertions outside tolerance | Re-establish trusted time and revalidate affected evidence |

### 7.1 No single kill switch

Emergency stop mechanisms must be scoped and independently controlled. A global shutdown must not be the only containment option. Conversely, no single ASTON module may unilaterally disable customer infrastructure. High-impact actions require customer-defined limits, explicit authorization, and tested rollback or compensating procedures.

## 8. Autonomy and human control model

Actions are classified by impact:

- **Tier 0 — Observe:** collect and correlate authorized telemetry.
- **Tier 1 — Recommend:** produce a reasoned recommendation; no environment change.
- **Tier 2 — Reversible low impact:** bounded automated actions explicitly pre-approved by customer policy.
- **Tier 3 — High impact:** human approval required, such as broad isolation, privileged credential revocation, or production workload shutdown.
- **Tier 4 — Safety-critical / OT:** customer-specific safety case and operating envelope; no autonomous action unless explicitly certified and authorized for that environment.

Every automated action must specify target, scope, maximum duration, rate limits, prerequisites, rollback, escalation path, and evidence requirements.

## 9. Security and adversarial validation plan

Validation must cover at minimum:

- identity spoofing, stolen credentials, tenant confusion, and cross-tenant access;
- privilege escalation, delegated authority abuse, stale permits, replay, and race conditions;
- malicious or compromised agents, prompt injection, tool misuse, and policy bypass;
- malicious packages, compromised publishers, dependency confusion, and artifact substitution;
- telemetry suppression, forged signals, poisoned threat feeds, and model manipulation;
- containment abuse, accidental blast-radius expansion, and rollback failure;
- evidence deletion, ledger truncation, key compromise, and clock manipulation;
- ransomware recovery, backup tampering, persistence after restore, and service continuity;
- control-plane compromise and failure of independent recovery paths.

Tests must define attack preconditions, expected control, expected evidence, pass/fail criteria, and residual risk. Independent red-team or third-party assessment is required before claims of validated enterprise protection.

## 10. Deployment models and customer sovereignty

Supported deployment patterns to evaluate:
- customer-hosted / self-managed;
- customer cloud account with ASTON-managed control components;
- hybrid control plane with customer-side enforcement;
- isolated or disconnected environments;
- OT/ICS deployments with dedicated safety constraints.

For each model, document data residency, key ownership, network flows, telemetry minimization, administrative access, update channel, offline behavior, evidence retention, disaster recovery, and exit/decommissioning process. No deployment model is declared supported until tested.

## 11. Intellectual property, licensing, and open-core boundaries

The public `aston-attestation-sdk` currently has an Apache-2.0 strategy in the project context. This specification does not change any repository license or establish ownership of every contribution.

Before presenting an open-core investment narrative, complete a repository-by-repository legal and technical inventory:
- license and SPDX status of every repository and material component;
- copyright ownership, contributor agreements, third-party code, and dependency obligations;
- exact public SDK boundary and compatibility commitments;
- proprietary repository access and distribution controls;
- patentability review by qualified counsel, including prior art and disclosure timing;
- trademark and brand clearance.

Do not describe the SDK as a deliberate “loss leader” or claim a defensible IP moat without legal review and market evidence. Open-source adoption, proprietary orchestration, and patent strategy are separate decisions requiring documented approval.

## 12. Repository mapping and audit obligations

This architecture spans four repositories. Their roles below are provisional and must be confirmed by a read-only audit.

| Repository | Provisional role | Audit questions |
|---|---|---|
| `agente-OS-15.5-hector-zapata` | Runtime, orchestration, defense routes, Safety Interlock, recovery workflows | Which paths are reachable in runtime? Which controls are enforced versus advisory? What is deployed? |
| `aston-trust-infrastructure` | Trust policies, identity/tenant controls, governance and architecture | Are tenant lifecycle, policy enforcement, approval, and revocation authoritative and complete? |
| `aston-attestation-sdk` | Public cryptographic attestation, artifact integrity, revocation and evidence primitives | Which claims are verified end-to-end? What is caller asserted? What are compatibility and threat boundaries? |
| `aston-risk-protocol` | Risk vocabulary, protocol and integration contracts | Are schemas versioned, deterministic, authenticated, tested, and consumed by runtime? |

The audit must record repository default branch and commit SHA, open/merged PRs, active workflows, tests and results, dependency and license state, security findings, runtime call paths, configuration and deployment evidence, and unresolved gaps. A component is not considered integrated merely because files with related names exist in multiple repositories.

### 12.1 Known cautions at drafting time

- Presence of `autodefense`, `defense`, `recovery`, or `pq` source files does not establish production enforcement, complete detection, or validated post-quantum security.
- A passing pull-request workflow proves only the tested checks for that commit and workflow scope.
- SDK artifact verification and revocation primitives do not automatically prove that every runtime execution path enforces them.
- A documented D1 migration is not evidence that it has been applied to a live database.
- No production capability is claimed by this document.

## 13. Roadmap and exit criteria

### Phase A — Baseline audit and architecture (current)

Deliverables:
- four-repository read-only audit with commit-pinned evidence;
- data-flow and trust-boundary diagrams;
- module inventory and dependency map;
- threat model, failure matrix, autonomy tiers;
- reviewed contract catalog and ADR backlog.

Exit criteria: every existing capability is mapped to a repository, entry point, tests, dependencies, maturity state, and known limitation. Unverified claims are marked unknown or not validated.

### Phase B — Contract and integration design

Deliverables:
- versioned schemas and compatibility policy;
- authority model for identity, tenant, policy, risk, permits, and evidence;
- reference enforcement flow;
- security and privacy requirements;
- deployment profiles and recovery design.

Exit criteria: architecture review confirms no duplicate authorities, no critical bypass, and explicit degraded-mode behavior.

### Phase C — Controlled integration

Only after approval of Phase B:
- integrate existing components behind contracts;
- add conformance tests and negative tests;
- preserve isolated modules and independent recovery;
- no production deployment without separate authorization.

### Phase D — Adversarial validation and pilot

- independent threat-led testing;
- customer-approved bounded pilot;
- measurable detection, containment, recovery, false-positive, and availability metrics;
- documented residual risks and remediation.

### Phase E — Scale toward 2030–2040

- multi-provider interoperability;
- cryptographic agility and post-quantum migration;
- agent ecosystem governance;
- resilience across hybrid, distributed, and critical environments.

Future horizons are planning assumptions, not predictions or claims of capability.

## 14. Required architecture decisions (ADRs)

The following decisions remain open and must be resolved with evidence:
1. Canonical identity and tenant lifecycle authority.
2. Policy evaluation and permit-token format, issuer, audience, TTL, and revocation semantics.
3. Risk score semantics and prohibition on risk-only authorization.
4. Evidence canonicalization, signing, storage, retention, and independent verification.
5. Event transport, delivery guarantees, ordering, idempotency, and replay prevention.
6. Key custody, rotation, emergency revocation, and cryptographic agility.
7. Offline/degraded operation and reconciliation.
8. Customer-side enforcement and connector privilege model.
9. Containment safety envelope, approval tiers, rollback, and OT-specific constraints.
10. Recovery-point trust, restore verification, and out-of-band authority.
11. Data minimization, privacy, residency, and retention.
12. Module isolation, upgrade, rollback, and compromise recovery.

## 15. Acceptance checklist for this specification

- [ ] Four-repository audit completed and pinned to exact commit SHAs.
- [ ] DFD reviewed by runtime, trust, and security owners.
- [ ] Trust boundaries and data classifications approved.
- [ ] Every module has a single owner and explicit non-goals.
- [ ] Contract schemas and versioning rules approved.
- [ ] Failure and compromise matrix reviewed.
- [ ] Autonomy tiers and customer approval requirements approved.
- [ ] Threat model and adversarial test plan approved.
- [ ] IP/licensing inventory reviewed by qualified counsel.
- [ ] No unverified implementation or production claims remain.
- [ ] Separate authorization obtained before any code integration or deployment.

---

**Status statement:** This is an architecture baseline for review. It is not evidence that ASTON currently implements, tests, validates, or operates all capabilities described herein.
