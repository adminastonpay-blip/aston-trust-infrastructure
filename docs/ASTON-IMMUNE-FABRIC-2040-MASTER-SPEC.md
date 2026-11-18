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


## 16. Integrated product definition and value proposition

### 16.1 One-sentence definition

**ASTON is a trust and verification layer for autonomous AI actions.** It does not replace the model's reasoning. It governs whether a proposed action may execute, constrains that execution, and produces evidence that an independent party can inspect.

This is a product definition and target architecture, not a claim that every control is already implemented or deployed.

### 16.2 Integrated platform analogy

| Layer / component | Role in the unified platform |
|---|---|
| ASTON OS | The body: sovereign runtime and decision-execution environment |
| Trust Fabric | The nervous system: identity, policy, delegation, provenance, manifests, signatures, evidence |
| Immune Fabric | The immune system: threat context, detection, containment, recovery, resilience |
| SafetyInterlock | The handbrake at the action boundary: permits or blocks execution |
| Attestation SDK | The open interoperability surface: portable schemas and verification primitives |

These are not separate products competing for authority. They are coordinated layers of one platform with explicit ownership and versioned contracts.

### 16.3 Normative value flow

```text
Proposed action
   -> normalize and bind exact action/resource/context
   -> verify identity, tenant lifecycle, delegation and policy
   -> enrich with asset and threat context
   -> SafetyInterlock decision
        -> DENY / REQUIRE_HUMAN / bounded PERMIT / DEGRADED
   -> enforcement adapter validates permit at execution boundary
   -> protected resource executes within authorized scope
   -> Trust Fabric records manifest, digest, signature and execution evidence
   -> independent verifier evaluates the evidence package
   -> optional external timestamp, only when its receipt is independently verified
```

A permit must be bound to the canonical action, subject, tenant, resource, audience, policy version, nonce, expiry, and any required budget or concurrency reservation. A generic IAM token or a model statement that an action is authorized is insufficient.

An external timestamp service is optional. A workflow, stub, local receipt, or unverified response must never be represented as a confirmed Bitcoin/OpenTimestamps anchor.

### 16.4 Decision Passport

The **Decision Passport** is the proposed portable authorization-and-evidence object for one bounded action. It should bind, at minimum:

- canonical action and resource digest;
- subject, agent, tenant, environment and audience;
- policy identifier, version and digest;
- risk context and provenance references;
- nonce / replay-protection identifier;
- issued-at, expiry and permitted execution window;
- budget, concurrency and rate constraints where applicable;
- decision outcome, reason codes and approval evidence;
- issuer/key identifier and cryptographic verification material;
- execution result and evidence references, appended after execution.

The Passport is a proposed contract, not a claim that a complete cross-repository implementation exists today. It must not become a bearer credential that can be replayed for a different action.

### 16.5 Verification state vocabulary

All verification and external evidence integrations must expose honest, machine-readable states:

- **VERIFIED:** the defined checks succeeded against identified trust roots and evidence.
- **FAILED:** a required check failed.
- **PENDING:** verification is incomplete and may still complete.
- **INDETERMINATE:** available evidence is insufficient to reach a conclusion.
- **SIMULATED:** the result comes from a test, fixture, mock, or simulation.
- **NOT_CHECKED:** no verification was attempted.

No UI, report, API, investor material, or workflow may collapse PENDING, INDETERMINATE, SIMULATED, or NOT_CHECKED into VERIFIED. Verification claims must identify exactly what was checked and what remains outside scope.

## 17. Open-core strategy and intellectual-property boundaries

### 17.1 Proposed product boundary

The intended strategy is **open interoperability, proprietary orchestration and control**, subject to a complete legal and technical audit.

| Surface | Proposed posture | Guardrail |
|---|---|---|
| aston-attestation-sdk | Open, portable attestation/evidence interfaces; Apache-2.0 strategy | Verify actual release artifact, license, provenance and conformance before each public claim |
| ASTON OS runtime | Proprietary product layer, subject to repository ownership and license audit | Do not relicense existing code or contributions without authority |
| Trust Fabric control plane | Proprietary orchestration and governance layer, subject to legal audit | Clearly separate customer-owned data/keys from ASTON IP |
| Immune Fabric orchestration | Integrated proprietary defense and resilience layer, subject to implementation | Do not present roadmap modules as existing features |
| Schemas / protocol interfaces | Selectively publish stable interoperable contracts | Publish only after compatibility, security and governance review |

The SDK may lower adoption friction, but “bait”, “moat”, or guaranteed network effects are not technical facts. Adoption, ecosystem effects, defensibility and monetization must be demonstrated commercially.

### 17.2 Release and supply-chain claim discipline

SLSA level, signatures, REUSE, dependency scanning and provenance must be reported per exact artifact, workflow run, source commit and verification procedure. A green workflow on a branch is not automatically proof that a release artifact has the same property. No blanket statement such as “the entire platform is SLSA L3” is permitted without evidence covering the relevant release and build boundary.

## 18. Engineering maturity and investor disclosure baseline

The following is the disclosure baseline supplied for this specification. It is deliberately conservative. Each item must be rechecked against the repositories and exact commits during Phase A before it is represented as an independently verified fact.

| Area | Current disclosure wording | What is not established by that wording |
|---|---|---|
| CORE tests | 23/23 reported passing in Miniflare/SQLite, within a branch/test scope | Production reliability, complete attack coverage, or current main-branch status |
| SafetyInterlock | Code and tests reported; full content-bound path in production runtime remains a milestone | Universal enforcement across all execution paths |
| Signatures and evidence | Ed25519/SHA-256 components reported tested within branch scope | End-to-end trust chain across all repositories and production |
| OpenTimestamps / Bitcoin | Workflow or stub exists | Independently confirmed Bitcoin anchoring |
| Cloudflare staging / production | Configuration exists in code | Operational deployment, live bindings, production enforcement |
| Three-/four-repository integration | Partial | Complete end-to-end integration and independent verification |
| Customers and revenue | No verified traction disclosed | Paid adoption, retention, repeatable sales |
| Patent | Provisional draft reported, not filed | Patent-pending status, granted rights, novelty or freedom to operate |

### 18.1 Required public and investor wording

A defensible current formulation is:

> ASTON has engineering evidence in defined repository and branch scopes, alongside a clear product thesis for governing autonomous actions and producing verifiable evidence. It is not being represented as production-certified; no independent Bitcoin anchor or verified customer traction is claimed.

Every external deck or diligence response must link each material statement to a dated evidence-register entry, commit SHA, artifact digest, test report, deployment record, or customer-approved reference. Where such evidence does not exist, the statement must be framed as a design objective or roadmap item.

## 19. Blue-ocean opportunity map

“Blue ocean” means a potentially under-served category, buyer problem, or integration gap. It does not mean there are no competitors. Existing policy engines, cloud identity systems, AI security vendors, endpoint platforms, and governance products must be included in competitive diligence.

The opportunities below are hypotheses to validate, not claims of uncontested markets or implemented features.

| # | Opportunity hypothesis | Potential buyer / use case | Evidence required to validate the wedge |
|---:|---|---|---|
| 1 | Action trust layer: authorization of actions, not only prompts | CISO, AI platform engineering; high-impact agent workflows | Demonstrate exact-action binding, pre-execution enforcement and bypass tests |
| 2 | Independent evidence plane | Auditors, regulators, insurers, B2B counterparties | Verify evidence outside the enforcement runtime and document trust-root separation |
| 3 | Decision Passport | IAM/platform teams governing agent actions | Prove scope, nonce, expiry, policy version, canonical action binding and replay resistance |
| 4 | Fail-closed as a product guarantee | Regulated enterprises | Fault-injection evidence for timeout, invalid signature, missing policy and verifier outage |
| 5 | Atomic resource control for agents | Finance, platform and operations teams | Race-condition tests for spend, concurrency, quotas and idempotency |
| 6 | Portable multi-vendor attestation | Agent platforms, cloud providers, integrators | Independent implementations and cross-vendor conformance tests |
| 7 | Explicit human-governance states | Compliance and operations teams | Demonstrate PENDING/REVIEW/DENY/ALLOW lifecycle, approver identity and re-evaluation |
| 8 | Certified Extraction Environment (CEE) | Finance, legal, insurance claims, trade documentation | Signed extraction result, confidence threshold, lineage and reproducibility |
| 9 | Bitemporal ontology and decision lineage | Compliance, legal, forensic audit | Reconstruct what was known at decision time and what changed later |
| 10 | Verifiable Immune Fabric | Security operations and AI platform owners | Bounded detection-to-containment flow, customer authority, rollback and evidence |
| 11 | Cross-system trust across cloud, edge, hybrid and OT | Industrial, infrastructure and hybrid enterprises | Demonstrate boundary contracts and safety cases in at least one real environment |
| 12 | Honest multi-state verification | Auditors, procurement, security buyers | Ensure VERIFIED/FAILED/PENDING/INDETERMINATE/SIMULATED states cannot be misreported |
| 13 | Insurance / algorithmic-risk evidence interface | Insurers, brokers, enterprise risk teams | Underwriting partner validation; evidence-to-coverage mapping; no claim ASTON is an insurer |
| 14 | Proof-of-Intention between agents | Multi-agent platforms and agent-commerce networks | Authenticated intent, bounded delegation, counterparty policy and dispute evidence |
| 15 | Privacy-preserving Decision Passports | Regulated and confidential workflows | First define commitments and threat model; prove privacy properties before claiming ZK |
| 16 | Physical / edge attestation | Robotics and industrial operators | Device identity, measured state, telemetry integrity and physical safety validation |
| 17 | Neutral MCP governance server | Enterprises using multiple MCP tool vendors | Tool authorization, identity propagation, policy enforcement and audit across vendors |
| 18 | Executable constitution-as-code | AI governance and platform teams | Deterministic, versioned policy evaluation at every protected action boundary |
| 19 | Replay-resistant regulator audit package | Banks, healthcare, critical infrastructure | Reproducible evidence bundle, verifier independence and regulator usability |
| 20 | Narrow design-partner workflow | One enterprise team with a costly, bounded agent workflow | Paid or formally sponsored pilot, measurable baseline, acceptance criteria and renewal signal |

### 19.1 Prioritization horizon

**Near term — discovery and pilot wedge:** opportunities 1, 2, 3, 4, 6, 7, 12 and 20. These are closest to the core action-control/evidence thesis. Select one workflow rather than attempting to sell a horizontal “AI governance for everyone” platform.

**12–18 month candidates:** opportunities 5, 8, 9, 10, 11, 17, 18 and 19. Advance only when core integration, customer demand and measurable acceptance criteria justify the investment.

**Long-horizon research / Pioneer:** opportunities 13, 14, 15 and 16. These require ecosystem, cryptographic, insurance, physical-device or safety validation that should not be implied by the present architecture baseline.

The order is a planning hypothesis and must be revisited using customer interviews, willingness-to-pay, implementation cost, regulatory constraints and competitive evidence.

### 19.2 Competitive honesty

Potential adjacent or competing categories include AI application security, prompt and model guardrails, policy-as-code, IAM/PAM, cloud security, endpoint detection and response, software supply-chain security, observability, GRC and digital forensics. ASTON's proposed differentiation is the integration of pre-execution action authorization, bounded enforcement, independently verifiable evidence and controlled containment under one explicit trust model.

No claim of superiority over a named vendor is justified without a defined benchmark, comparable deployment scope, independent test results and customer evidence.

## 20. Commercial entry strategy and pilot acceptance

The initial commercial motion should be a **design-partner wedge**: one painful workflow, one buyer, one bounded integration, one measurable outcome. The platform vision remains broad; the first sale should not.

Candidate workflows include:
- an agent that initiates or approves payments;
- an agent that changes cloud infrastructure;
- an agent that issues legal documents or invoices;
- an agent that accesses personal data under clearance/ABAC rules.

For each pilot, define before implementation:
1. customer owner and accountable security approver;
2. exact agent, tools, resources and actions in scope;
3. baseline workflow and existing controls;
4. actions that must always be denied;
5. permit scope, expiry, replay and budget constraints;
6. human approval and emergency stop procedures;
7. evidence package and independent verification method;
8. latency, availability, false-positive and operational burden targets;
9. incident, rollback and data-retention responsibilities;
10. acceptance, failure and termination criteria.

A pilot is not a production certification. A successful pilot requires recorded results against pre-agreed criteria and explicit customer acceptance.

## 21. External positioning

Recommended core message:

> We do not ask customers to trust an agent because it says it behaved correctly. ASTON builds the control boundary that decides whether an agent may act, and the evidence layer that lets others independently verify what happened.

Supporting explanation:
- ASTON governs actions at the execution boundary rather than relying only on model-level assurances.
- The permit is bounded to a specific action, context and time.
- The resulting evidence is designed to be independently checked.
- Immune Fabric adds risk-informed detection, proportionate containment and verifiable recovery.
- The scope and limits of every verification claim are explicit.

Avoid claims such as “unhackable”, “stops every cyberattack”, “zero-day proof”, “production-grade” without deployment evidence, “Bitcoin anchored” without independently verified receipts, “patented” before filing/grant status supports it, or “beats Palantir” without comparable independent benchmarks.

## 22. Updated acceptance criteria for the unified strategy

In addition to Section 15, the following must be satisfied before the integrated strategy is considered ready for external technical or investment diligence:

- [ ] Product definition and three-layer architecture are consistent across repositories and materials.
- [ ] Decision Passport is specified with canonical action binding and replay protection.
- [ ] Enforcement and independent verification domains have documented trust-root separation.
- [ ] All verification states are represented consistently and cannot overstate results.
- [ ] Open-core boundary is reconciled with actual licenses, ownership and contribution history.
- [ ] Every SLSA, signature, timestamp and test claim is tied to exact artifacts and verification evidence.
- [ ] Blue-ocean hypotheses are mapped to competitors, buyers, willingness-to-pay and measurable acceptance criteria.
- [ ] One initial design-partner workflow is selected and bounded.
- [ ] No customer, revenue, production, patent or certification claim is made without supporting evidence.


## 23. ASTON Cyber Dome — layered cyber-resilience architecture

### 23.1 Strategic analogy and claim boundary

ASTON may use **“Cyber Dome”** as a strategic analogy for layered cyber defense and resilience: detect where possible, assess context, prevent unauthorized actions at the execution boundary, contain compromise, preserve evidence, and recover from verified state.

The analogy is not a claim of equivalence to a kinetic missile-defense system, nor a guarantee that every attack will be detected, intercepted, or prevented. ASTON must not claim that “no successful attack can become a catastrophe” as an assured outcome. The defensible objective is to **reduce the probability and impact of compromise, constrain what a compromised identity or agent can do, and improve containment and recovery with measurable evidence**.

A layered system assumes that individual controls can fail. No single sensor, model, policy service, cryptographic key, adapter, or operator is trusted as the only line of defense.

### 23.2 Layer mapping

| Layered-defense analogy | ASTON capability | Intended function | Limitation / required evidence |
|---|---|---|---|
| Early-warning radar | Attack Surface Intelligence + Threat Intelligence + telemetry | Identify exposed assets, suspicious signals and relevant threat context | Visibility is incomplete; feeds and telemetry can be poisoned, delayed or absent |
| Battle-management system | Trust Fabric | Correlate identity, tenant, delegation, policy, asset context, risk and evidence | Must prove authoritative sources, bounded latency and deterministic decision semantics |
| Interceptor / action barrier | SafetyInterlock + enforcement adapter + Immune Fabric | Prevent or constrain a prohibited action before it reaches the protected resource | Must be enforced at every in-scope execution path; code presence alone is not proof |
| Shelters / continuity layer | Recovery Fabric + customer-native resilience controls | Isolate affected scope, restore verified recovery points and validate service integrity | Recovery time and restoration success must be measured; never promise “seconds” without evidence |
| Independent proof layer | Attestation SDK + Trust Fabric evidence + independent verifier | Let a separate party verify defined artifacts, decisions and execution evidence | Does not prove that every attack was detected or that the environment was uncompromised |

The layers complement existing customer controls; ASTON must not imply that it replaces firewalls, EDR, backups, network segmentation, identity providers, incident response or physical safety systems.

### 23.3 SafetyInterlock — critical action-boundary control

SafetyInterlock is the critical authorization barrier for protected actions. It must evaluate the exact action at the point where execution can still be prevented.

**Required decision sequence:**

1. Receive the proposed action from an authenticated workload or agent.
2. Normalize the request into a canonical representation and assign a unique correlation identifier.
3. Verify subject, agent identity, tenant lifecycle, delegation chain, credential status and requested audience.
4. Resolve the exact resource, operation, environment and customer-defined impact class.
5. Load the applicable policy by immutable version/digest; reject missing, ambiguous or unsupported policy.
6. Obtain required risk and asset context, validating source, freshness, scope and provenance. Risk scores are advisory inputs, never standalone permission.
7. Check permit prerequisites: action binding, policy version, nonce, expiry, audience, replay status, budget/concurrency reservation and any human approval.
8. Produce an explicit decision: DENY, REQUIRE_HUMAN, ALLOW_BOUNDED or DEGRADED.
9. If allowed, issue a short-lived, single-purpose permit bound to the canonical action and intended enforcement point.
10. At execution, the enforcement adapter independently validates the permit and confirms that the action being executed matches the authorized action.
11. Record the actual enforcement result and evidence, including denials and failures.
12. Reconcile the permit as consumed, expired or revoked; prevent reuse.

**The permit is not a general authorization token.** It must not be transferable to a different action, tenant, resource, environment or audience. A mismatch between the authorized request and the execution request results in denial.

### 23.4 Fail-closed behavior and degraded modes

Fail-closed applies to the protected action boundary, not as an indiscriminate shutdown of every customer system.

| Condition | Required result for critical protected actions |
|---|---|
| Identity or tenant cannot be verified | DENY |
| Tenant is suspended, revoked or unresolved | DENY |
| Policy is missing, expired, malformed or ambiguous | DENY |
| SafetyInterlock is unavailable | DENY; no bypass to direct execution |
| Required threat/asset context is unavailable or too stale | DENY or REQUIRE_HUMAN according to pre-approved policy; never infer safety from missing signals |
| Permit signature, scope, audience or expiry is invalid | DENY |
| Nonce is reused or replay state is unavailable | DENY |
| Human approval is required but absent or unverifiable | REQUIRE_HUMAN; execution remains blocked |
| Budget or concurrency reservation cannot be made atomically | DENY |
| Evidence service is unavailable where evidence is mandatory | DENY, unless a specifically approved bounded buffer mode exists |
| Clock or freshness guarantees are outside tolerance | DENY time-sensitive permits |
| Detection service is unavailable | Mark visibility DEGRADED; continue only actions whose policy explicitly permits operation without that signal |
| Independent verifier is unavailable | Do not claim VERIFIED; block only those actions whose policy requires synchronous verification |

No timeout, exception handler, fallback route, retry, legacy endpoint or emergency mode may silently convert a denial into permission. Any offline-safe exception must be explicit, narrow, time-bounded, customer-approved, tested and auditable.

### 23.5 Enforcement completeness and bypass resistance

SafetyInterlock only protects an action if all relevant execution paths are forced through it. The implementation must therefore inventory and test:

- direct API routes and internal service calls;
- agent tool adapters and MCP tool execution;
- scheduled jobs, queues, retries and background workers;
- administrative and break-glass paths;
- recovery, containment and automation commands;
- cloud, edge, on-premises and OT connectors;
- alternate credentials, service accounts and legacy integrations.

For every protected resource, define the authoritative enforcement point and prove that direct access cannot bypass it within the stated threat model. If an enforcement point cannot be controlled by ASTON, the product must disclose the limitation and rely on a customer-controlled policy enforcement point or mark the resource out of scope.

### 23.6 Atomicity, race conditions and idempotency

Authorization and resource reservation must not be separated by an exploitable time-of-check/time-of-use gap. Where an action consumes money, quota, concurrency or another scarce resource, the permit path must reserve that capacity atomically or use an equivalent transactional protocol.

Retries must be idempotent. A consumed, expired, revoked or replayed permit must not authorize a second execution. Concurrency tests must include simultaneous requests, delayed messages, duplicate delivery, partial failure and process restart.

### 23.7 Active defense — lawful defensive operations only

ASTON Immune Fabric may support active defensive measures within systems and environments the customer owns or is explicitly authorized to administer:

- **Deception:** isolated honeypots, decoy services, synthetic credentials and instrumented traps that do not expose third-party systems or real customer secrets.
- **Dynamic isolation:** narrow quarantine of a workload, credential, tool, connector or network segment under an approved policy and safety envelope.
- **Credential and session containment:** revoke or suspend scoped credentials, sessions and permits through authorized control planes.
- **Threat neutralization inside the authorized boundary:** block malicious requests, disable compromised integrations, rate-limit abuse and preserve forensic evidence.
- **Threat attribution support:** correlate indicators and evidence with confidence levels, alternative hypotheses and provenance. Attribution is probabilistic unless independently established; an IP address or indicator alone does not prove an actor's identity.

ASTON must not perform unauthorized access, destructive retaliation, malware deployment, denial-of-service, credential theft, or “hack back” against suspected attackers or third-party infrastructure. Offensive security testing requires explicit written authorization, defined scope, time window, rules of engagement and stop conditions. Deception systems must be segmented, monitored and prevented from becoming launch points against others.

### 23.8 Recovery and continuity as the final defensive layer

If prevention or containment fails, Recovery Fabric must support a controlled path back to a known-good state:

1. isolate affected assets and preserve volatile and durable evidence where feasible;
2. identify candidate recovery points and validate their integrity, provenance and trust status;
3. reject backups or images with unresolved compromise indicators;
4. obtain customer approval according to impact tier;
5. restore in an isolated environment where possible;
6. validate identity, keys, configurations, dependencies and persistence mechanisms;
7. reconnect in stages under bounded permits;
8. monitor for recurrence and preserve the recovery evidence package.

Recovery objectives (RTO/RPO), restoration duration and data-loss bounds are customer- and workload-specific measurable targets, not universal ASTON guarantees.

### 23.9 Independent assurance and operational metrics

The Cyber Dome claim must be supported by measurable, scoped evidence, including:

- percentage of in-scope execution paths protected by an enforced interlock;
- bypass-test results and negative authorization test coverage;
- permit validation latency and failure behavior under load;
- replay, race-condition and atomic-reservation test results;
- detection coverage and known visibility gaps;
- containment time, false-positive rate and rollback success;
- recovery time, recovery-point integrity and post-restore validation;
- evidence completeness, signature verification and independent-verifier outcomes;
- degraded-mode behavior during dependency, identity, key and control-plane failures.

Metrics must state test environment, workload, sample size, date, commit/version, assumptions and residual risks. No metric may be generalized beyond the tested scope.

### 23.10 SafetyInterlock acceptance gates

SafetyInterlock is not considered validated until all applicable gates pass:

- [ ] Every in-scope action path is inventoried and has an authoritative enforcement point.
- [ ] Direct, alternate, legacy and administrative bypass attempts are denied or explicitly documented as out of scope.
- [ ] Identity, tenant, delegation and policy failures fail closed.
- [ ] Permit is bound to canonical action, resource, tenant, audience, policy digest, nonce and expiry.
- [ ] Permit replay, mutation, cross-tenant use and cross-resource use are rejected.
- [ ] Time-of-check/time-of-use and atomic budget/concurrency races are tested.
- [ ] Human approval cannot be forged, replayed or silently skipped.
- [ ] Dependency outages and degraded modes match the decision table.
- [ ] Enforcement result and denial evidence are independently verifiable.
- [ ] Compromise of the interlock, adapter, key or control plane has a documented independent recovery path.
- [ ] Adversarial testing is completed by a party independent of the implementation team before external claims of validated protection.
- [ ] Production status is claimed only after a separately authorized deployment, operational monitoring and customer acceptance.

**Status:** This section defines the target architecture and acceptance requirements. It does not establish that the Cyber Dome, all-layer interception, active defense, complete enforcement coverage or recovery objectives are currently implemented, validated or deployed.
