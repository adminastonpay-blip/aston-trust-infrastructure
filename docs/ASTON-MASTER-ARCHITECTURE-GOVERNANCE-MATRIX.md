# ASTON MASTER ARCHITECTURE & GOVERNANCE MATRIX
## Traceability, evidence gates and change control — CORE 1.0 to 2040

**Status:** Strategic governance document / proposed control framework  
**Repository:** `adminastonpay-blip/aston-trust-infrastructure`  
**Document branch:** `docs/aston-master-architecture-governance-matrix`  
**Baseline:** CORE 1.0 implementation and the ASTON Trust Fabric 2030 / Civilization Trust 2040 roadmaps  
**Operational posture:** Documentation only. No production authorization is implied.

> **TRUST THAT OUTLIVES TECHNOLOGY.**  
> ASTON must remain independently verifiable even if ASTON itself is unavailable, replaced, or discontinued.

---

## 1. Purpose and governing rules

This matrix is the traceability layer connecting:
1. **CORE 1.0** — the currently implemented trust-enforcement foundation.
2. **ASTON Trust Fabric 2030** — the 24-month product and infrastructure evolution.
3. **ASTON Civilization Trust 2040** — the longer-horizon organizational, quantum-resilient, physical, sovereign and neurotechnology trust vision.

It is intended to prevent roadmap language from being mistaken for shipped functionality, test evidence from being mistaken for production assurance, or strategic ambition from being mistaken for certification.

### 1.1 Non-negotiable rules

- **Evidence before status:** every capability must have an identifiable artifact, test, deployment record, independent assessment, or an explicit statement that evidence does not yet exist.
- **No silent promotion:** a planned or experimental capability cannot be labelled implemented, validated, production-ready, compliant, or certified without its corresponding evidence gate.
- **Fail closed for authority:** missing, expired, invalid, ambiguous, or unverifiable authorization must not silently grant permission.
- **Least authority:** identity, policy, scope, tenant, audience, time window, resource, and action must be bounded explicitly.
- **Separation of duties:** policy authoring, policy approval, deployment, operation, and independent verification should not collapse into one unchecked role.
- **Portable evidence:** customers must be able to export and verify records without calling a live ASTON service.
- **Safe evolution:** schema, API, cryptographic, and policy changes must be versioned and migration-tested.
- **No production claims from CI alone:** passing repository tests is not proof of hosted-platform behavior, operational resilience, compliance, or independent security assurance.
- **No override of domain safety:** ASTON authorization does not replace safety-rated controls, human oversight, emergency stops, or legally required professional judgment.

### 1.2 Status vocabulary

| Status | Meaning | Minimum evidence |
|---|---|---|
| Implemented (code) | Code exists in the reviewed repository | Commit and code-path reference |
| Tested (CI) | Automated tests passed in a named run | Run ID, commit SHA, test report |
| Staging-validated | Deployed to controlled staging and exercised | Deployment identity, environment, test record, logs |
| Production-validated | Production behavior observed under approved change control | Deployment record, monitoring, rollback evidence, approval |
| Independently assessed | A qualified party assessed a defined scope | Assessor, scope, method, report and date |
| Certified / attested | A recognized scheme or authority issued a valid statement | Certificate/attestation, scope, issuer, validity |
| Planned | Approved direction, not yet delivered | Roadmap entry only |
| Research hypothesis | Feasibility or design is not established | Research plan and explicit uncertainty |
| Blocked / gated | Work cannot proceed until named prerequisites are met | Gate owner and exit criteria |

Do not combine these statuses into a single percentage of completion. Report each dimension separately.

---

## 2. Architecture traceability

### 2.1 Capability lineage

| Capability domain | CORE 1.0 foundation | Trust Fabric 2030 evolution | Civilization Trust 2040 direction | Evidence required to advance |
|---|---|---|---|---|
| Identity | Caller context and permit claims; unauthenticated callers remain explicitly unverified | Durable agent identity, tenant boundaries, lifecycle and federation | Organizational and sovereign identity relationships | Identity threat model, lifecycle tests, federation conformance, revocation evidence |
| Authorization | SafetyInterlock and scoped, short-lived permit tokens | Policy service, delegated authority, budgets and approval workflows | Organizational constitutions, bounded swarm authority and offline mandates | Policy test vectors, deny-by-default tests, delegation proofs, audit trail |
| Model execution | Isolated Model Runner path; PEP does not directly invoke AI | Multi-provider execution governance and policy-aware routing | Cross-domain and sovereign execution governance | Provider isolation tests, invocation trace, failure semantics, provider-specific assessment |
| Replay and abuse resistance | Replay guard implementation and replay rejection tests | Distributed replay protection, abuse signals and risk-adaptive controls | Partition-aware anti-replay and cross-node reconciliation | Concurrency, persistence, partition and replay test suites |
| Evidence | Signed JSON violation reports; Merkle primitives and in-memory batcher | Durable evidence pipeline, independent verification and external anchoring | Long-lived evidence across organizations, algorithms and infrastructure generations | Export format, verifier conformance, key history, inclusion proofs, retention and recovery tests |
| Data lineage | Request/permit context and digest binding | Provenance, entity lineage, event histories and tenant-scoped records | Cross-jurisdiction and interplanetary provenance | Provenance schema, integrity tests, access controls, retention and deletion rules |
| Interoperability | Ports and Cloudflare adapters | Stable APIs, SDKs, integrations and multiple provider adapters | Open protocol ecosystem and independent implementations | Published schemas, compatibility suite, at least two independently operated implementations |
| Cryptography | Ed25519 permit signing in current CORE design | Crypto-agility and migration-ready evidence envelopes | Post-quantum and hybrid transition | Algorithm registry, test vectors, migration plan, key rotation and historical verification |
| Organizational trust | Not established by CORE 1.0 alone | Organization graph, roles, delegated authority and budgets | Multi-organization trust networks and governance | Graph semantics, conflict resolution, delegation and revocation tests |
| Physical systems | Not a CORE 1.0 capability | Future policy integration only where appropriate | Robots, vehicles, remote operations and critical infrastructure | Domain safety case, hardware interlocks, hazard analysis and external certification where required |
| Sovereign / offline nodes | Not established | Early offline design constraints | Local autonomy under delayed or unavailable connectivity | Offline authority model, TTL, budget limits, revocation behavior and reconciliation tests |
| Neurotechnology / BCI | Not a CORE 1.0 capability | Not a committed near-term capability | Research-level consent and intent safeguards | Human-subjects review, privacy impact assessment, validated consent model and applicable regulatory review |

### 2.2 Current CORE 1.0 evidence baseline

The project record reports a successful CI run with **31 tests passed and 0 failed** (Run #89, commit `12f54fd327c72183f2e5ffc8137375b0a6e87a90`). The reported breakdown is:
- Node/core: 6/6
- Architecture: 3/3
- Vitest unit: 6/6
- Vitest/Miniflare integration: 16/16

A subsequent documentation validation run was reported successful as Run #90, commit `798de34d05ecd18deb8978a69fa14e5a73c68a96`.

These are **repository CI results**, not hosted Cloudflare E2E evidence, production validation, certification, or an independent audit. The workflow used `npm install` with explicit flags followed by `npm test`; it did not establish reproducibility through `npm ci`.

Known CORE 1.0 boundaries that must remain visible:
- `PROMPT_INJ_01` is a deterministic test fixture, not proof of generalized prompt-injection detection.
- The Merkle batcher is in-memory; durable persistence, scheduling and external anchor receipt verification are not established by that primitive alone.
- Cloudflare adapters and ports exist, but a second production provider adapter has not demonstrated portability.
- Hosted Cloudflare bindings and deployment behavior have not been validated in this baseline.
- An unauthenticated caller is labelled `unverified-caller`; this is not proof of a real-world identity.
- A successful CI run does not establish production readiness or regulatory compliance.

**Baseline rule:** preserve CORE 1.0 behavior while future capabilities are specified and independently gated. Do not refactor working enforcement paths merely to match a future roadmap label.

---

## 3. Phase and approval matrix

Dates below are strategic planning horizons, not delivery promises. A phase may move only when its entry conditions are met; calendar dates do not waive gates.

| Phase / horizon | Intended outcome | Dependencies | Exit evidence / approval gate |
|---|---|---|---|
| A — CORE 1.0 foundation | Deterministic enforcement, scoped permits, replay protection and initial evidence | Current code and CI baseline | Reviewed threat model; reproducible CI; negative-path tests; explicit limitations; code review |
| B — Staging readiness | Controlled deployment and hosted integration validation | Cloud provider availability, complete bindings, secrets, isolated staging configuration, rollback plan | Staging deployment record; binding inventory; hosted tests; logs; rollback rehearsal; explicit operator approval |
| C — Durable evidence | Persisted event/evidence pipeline and independently verifiable exports | Stable event schema, retention policy, key management, storage threat model | Restart/recovery tests; export/import tests; independent verifier; key-history validation; integrity and retention tests |
| D — Trust Fabric 2030 | Multi-tenant productization, identity lifecycle, policy governance and integrations | A–C gates, stable API contracts, tenant isolation | Tenant isolation assessment; API compatibility suite; operational SLO evidence; security review; customer acceptance |
| E — Organizational Trust (2030–2033) | Organization graph, bounded delegation and swarm governance | Durable identity, graph model, conflict and revocation semantics | Delegation and budget test vectors; revocation propagation evidence; governance approval; adversarial review |
| F — Quantum transition (2033–2036) | Crypto-agile evidence and staged post-quantum migration | Algorithm registry, versioned envelopes, long-term key history | Standards-aligned test vectors; interoperability; hybrid migration tests; historical verification; cryptographic review |
| G — Physical Trust (2036–2038) | Trust policy integration with physical/robotic systems without replacing safety systems | Domain-specific safety engineering and qualified integrators | Hazard analysis; safety case; fail-safe behavior; hardware interlocks; relevant external assessment/certification |
| H — Sovereign / interplanetary and BCI research (2038–2040) | Partition-tolerant nodes and carefully bounded human-interface research | Offline authority model, communications assumptions, privacy and human-subjects governance | Partition/reconciliation evidence; consent and revocation validation; privacy/security review; jurisdictional and scientific review |

### 3.1 Gate decision outcomes

Every gate review must produce exactly one recorded outcome:
- **PASS:** all mandatory evidence is present and accepted for the defined scope.
- **CONDITIONAL PASS:** only explicitly listed non-safety-critical follow-ups remain, each with owner, deadline and compensating control. Never use for a missing critical security or safety control.
- **FAIL:** evidence contradicts the requirement or a mandatory control is absent.
- **BLOCKED:** prerequisite evidence or external service is unavailable; no implied approval.
- **NOT ASSESSED:** no review has occurred.

A gate record must include scope, commit/version, environment, evidence links, reviewer, date, decision, exceptions, expiry/review date and rollback/containment plan.

---

## 4. Evidence contract: “ASTON must survive ASTON”

The long-term trust claim is meaningful only if evidence remains verifiable without a live ASTON account, API, database, or proprietary service.

### 4.1 Minimum export envelope

The future evidence format should be versioned and documented independently. At minimum, evaluate inclusion of:
- schema identifier and version;
- event type and canonical serialization rules;
- event identifier and tenant/issuer identifiers using privacy-safe identifiers;
- subject, action, resource and relevant scope;
- policy identifier, policy version and decision;
- request/permit correlation identifiers;
- timestamps with declared clock source and uncertainty where relevant;
- cryptographic algorithm identifiers and parameter sets;
- signer key identifiers, certificate/attestation references where applicable, and key-validity history;
- payload digest and canonicalization method;
- signature(s), hash-chain/Merkle references and inclusion proofs where applicable;
- revocation/status information or a reference to a verifiable status snapshot;
- provenance and transformation history;
- retention, redaction and disclosure classification;
- explicit limitations and verification result semantics.

This is a requirements list, not a claim that the current CORE implementation already emits this envelope.

### 4.2 Independent verifier requirements

An independent verifier should:
1. Be distributable and operable without ASTON service access.
2. Validate schema versions and canonicalization rules.
3. Verify signatures and algorithm identifiers.
4. Resolve signer key history, rotation and revocation according to documented policy.
5. Verify hash chains, Merkle inclusion proofs and external timestamp/anchor receipts when present.
6. Distinguish “valid signature” from “authorized action,” “truthful event,” and “compliant process.”
7. Report missing evidence, unsupported algorithms, uncertain timestamps and unverifiable links as explicit outcomes.
8. Support export fixtures and conformance tests maintained independently from the production service.

A valid cryptographic signature proves a relationship between bytes and a key under stated assumptions; it does not independently prove that the underlying event was truthful, lawful, safe, or correctly authorized.

### 4.3 Long-term preservation

Before claiming long-term verifiability, define:
- algorithm deprecation and re-attestation policy;
- preservation of original signed bytes and verification metadata;
- trusted timestamp assumptions and clock uncertainty;
- key compromise response and historical validation rules;
- migration between envelope versions;
- independent archive format and recovery procedure;
- export completeness and customer portability tests.

External anchoring (including public blockchains) may add a timestamp or commitment layer, but it does not by itself establish signer identity, event truth, authorization, or perpetual security. Do not make the system depend on one anchor network.

---

## 5. Authority, delegation and offline operation

### 5.1 Organizational authority model

Before Organizational Trust is implemented, specify:
- organization, tenant, principal, agent, role, resource and action semantics;
- authority source and delegation chain;
- maximum delegation depth and scope;
- budgets (time, spend, compute, actions, resources and risk);
- separation of proposer, approver and executor where warranted;
- expiry, revocation and emergency suspension;
- policy conflict resolution and precedence;
- immutable event history with authorized, versioned amendments to governance documents;
- dispute, appeal and human escalation processes.

Do not describe governance rules as “mathematically immutable.” A system can preserve an append-only history of authorized amendments; it cannot eliminate governance, legal or social change.

### 5.2 Offline authority contract

Before any Sovereign Node or intermittently connected agent receives offline authority, the design must define:
- maximum credential and policy TTL;
- maximum offline action count and resource/spend budget;
- locally enforceable scope and safe-state constraints;
- behavior when a credential expires during a partition;
- revocation delay and the residual risk accepted during that delay;
- emergency stop and local human override;
- version conflict and reconciliation rules;
- signed local logs, monotonic counters or equivalent anti-replay measures;
- clock drift tolerance and trusted time assumptions;
- what happens when local policy and newly received central policy conflict.

No generic “offline mode” may grant open-ended authority. Offline execution must be bounded by a pre-authorized envelope, with explicit expiry and reconciliation.

### 5.3 Space communications assumptions

Earth–Mars communication delay and outages make synchronous central authorization unsuitable for time-critical local actions. Any future Mars or deep-space node must be designed for delayed synchronization, local safe-state behavior and pre-approved bounded authority. These are architecture constraints, not evidence that ASTON has a deployed space capability.

---

## 6. Cryptographic agility and quantum transition

The current CORE 1.0 permit design uses Ed25519. Future post-quantum migration must preserve algorithm distinction and protocol compatibility.

- **ML-KEM (FIPS 203)** is a key-encapsulation mechanism; it is not a drop-in replacement for Ed25519 signatures.
- **ML-DSA (FIPS 204)** and **SLH-DSA (FIPS 205)** are digital-signature standards.
- Hybrid approaches may be considered during migration, with explicit downgrade resistance and verification rules.

Required design controls:
1. Versioned algorithm registry and cryptographic profiles.
2. Algorithm identifiers bound into signed evidence.
3. Key generation, custody, rotation, revocation and compromise procedures.
4. Hybrid signature and transition semantics, including what must be verified by legacy and new clients.
5. Downgrade prevention and negotiation rules.
6. Historical verification when an algorithm is deprecated or a key is compromised.
7. Conformance vectors and independent implementation tests.
8. Migration plan for stored records, APIs, tokens and verifier software.

No claim of “quantum-safe” or “quantum-resistant” should be made for the complete system until the threat model, cryptographic components, implementation, key lifecycle and migration path have been independently reviewed.

---

## 7. Physical Trust and human-interface boundaries

### 7.1 Physical systems

ASTON may eventually express identity, policy, authorization and evidence around physical-system operations. It must not be represented as a replacement for:
- safety-rated controllers and certified safety functions;
- emergency stops, protective stops and physical interlocks;
- sensors, redundancy, fault detection and safe-state logic;
- hazard analysis, safety lifecycle and qualified integration;
- medical-device or vehicle-specific safety engineering.

A policy authorization is not a safety case. A valid permit must never force a physical system to violate its local safety envelope. On loss of ASTON connectivity or trust, the domain system must enter its independently designed safe behavior.

Applicable standards must be selected by domain and jurisdiction. ISO 10218 applies to industrial robot safety within its defined scope; it must not be generalized as a universal medical, automotive, aerospace or space certification.

### 7.2 Neurotechnology and BCI

Neural signals are not, by themselves, reliable proof of intent or consent. Any future BCI-related research requires:
- informed, revocable and purpose-specific consent;
- explicit confirmation for consequential actions;
- strict separation between raw neural data and authorization records;
- data minimization, retention limits and user access controls;
- safeguards against coercion, spoofing, inference and unauthorized secondary use;
- human override and safe cancellation;
- independent scientific, ethics, privacy and regulatory review.

No claim that ASTON can read thoughts, infer legal consent from brain signals, or establish a person's intent from neural data is permitted.

---

## 8. API, schema and protocol governance

### 8.1 Versioning policy

Every externally consumed API, event schema, permit format, evidence envelope and policy language must have:
- a stable identifier and explicit version;
- documented compatibility guarantees;
- canonical serialization and validation rules;
- deprecation and support windows;
- migration examples and conformance fixtures;
- security impact assessment for breaking changes.

Use additive, backward-compatible changes by default. Breaking changes require a new major version, migration plan, parallel-read/verification period where feasible, and explicit approval. Never silently reinterpret an old signed record under new semantics.

### 8.2 Change control

A material change must include:
1. Problem statement and threat-model delta.
2. Affected components, tenants, APIs, schemas and evidence formats.
3. Security, privacy, safety and operational impact.
4. Test plan, negative cases and rollback/containment plan.
5. Compatibility and migration plan.
6. Reviewer independent of the author for high-risk changes.
7. Release record linking source commit, artifacts, tests and approvals.

Emergency changes require retrospective review and a documented reason; emergency status must not become a normal bypass.

### 8.3 Open protocol and independent implementations

To avoid a single-vendor trust dependency:
- publish stable protocol and evidence-format specifications;
- provide open conformance fixtures and a reference verifier;
- permit independent implementations;
- define an extension registry and governance process;
- publish interoperability results with scope and limitations;
- preserve customer export rights and verifiability.

Interoperability is not established merely because an adapter interface exists. At least two independently implemented and tested integrations are required before claiming multi-provider portability.

---

## 9. Security assurance and operational readiness

Before any staging or production advancement, the release dossier should contain:

| Control area | Required evidence |
|---|---|
| Threat model | Assets, trust boundaries, attacker capabilities, abuse cases and residual risks |
| Authentication | Identity source, token validation, key lifecycle and negative tests |
| Authorization | Deny-by-default policy tests, scope binding, expiry and revocation behavior |
| Isolation | Tenant isolation, service boundary and data-access tests |
| Replay / idempotency | Concurrency, retries, duplicate and persistence tests |
| AI/model boundary | Explicit invocation path, provider isolation, prompt/data handling and failure semantics |
| Evidence integrity | Signature validation, durable storage, export and independent verification |
| Secrets | Secret inventory, least privilege, rotation and leak scanning |
| Supply chain | Dependency inventory, provenance, lockfile/reproducibility and artifact integrity |
| Resilience | Timeouts, dependency outage, queue/backlog, recovery and rollback tests |
| Observability | Correlation IDs, redaction, audit logs, alert thresholds and retention |
| Privacy | Data inventory, minimization, retention, deletion and disclosure rules |
| Operations | Runbooks, ownership, escalation, incident response and recovery exercises |
| Independent review | Defined scope, reviewer independence, findings and remediation tracking |

A control is not complete merely because a configuration field or binding name appears in a file. It must be configured in the target environment, exercised, observed and recorded.

---

## 10. Release gates and evidence register

Maintain one evidence register per release. The following fields are mandatory:

| Field | Description |
|---|---|
| Evidence ID | Stable unique reference |
| Requirement ID | Matrix row or control being satisfied |
| Artifact | Commit, test report, deployment, log, report or signed export |
| Version / SHA | Exact source and artifact identity |
| Environment | Local, CI, staging, production or independent lab |
| Method | Automated test, manual review, penetration test, audit, certification |
| Result | Pass, fail, blocked, not assessed |
| Scope and exclusions | What the evidence does and does not establish |
| Reviewer | Person or organization and role |
| Date and expiry | When produced and when it must be refreshed |
| Exceptions | Residual risks, owner, mitigation and deadline |
| Approval | Named authority and decision record |

### 10.1 Minimum release progression

- **Code complete:** implementation and peer review exist.
- **CI verified:** required automated checks pass on the exact commit.
- **Staging approved:** staging deployment and hosted tests pass; rollback is rehearsed.
- **Production approved:** explicit change authorization, monitoring, recovery and operational ownership are recorded.
- **Assured:** independent assessment or certification exists for the precise claim and scope.

These states are sequential gates, not synonyms. A later gate cannot be inferred from an earlier one.

### 10.2 Incident and platform-availability gate

If a critical infrastructure provider reports an active incident affecting the relevant service:
- suspend tests and changes that depend on the impaired service;
- do not interpret provider errors as application defects without evidence;
- do not fabricate success, failure, HTTP status or audit evidence;
- preserve the last known-good source and configuration;
- resume only after the incident is resolved and the project owner explicitly authorizes the next operation.

This document does not authorize any Cloudflare operation, deployment, production change, merge, workflow modification, or change to `main`.

---

## 11. Governance ownership and review cadence

Proposed role separation (roles may be assigned to named people or organizations in a separate controlled register):

| Role | Accountability |
|---|---|
| Architecture owner | Maintains architecture decisions and cross-roadmap traceability |
| Security owner | Threat model, security controls, risk acceptance and incident follow-up |
| Policy / governance owner | Authority model, policy lifecycle, delegation and appeals |
| Release owner | Release dossier, staging/production gates and rollback readiness |
| Evidence custodian | Evidence register, export integrity, retention and key-history records |
| Independent assessor | Reviews defined scope without authoring or approving their own work |
| Domain safety authority | Approves physical/medical/vehicle/space safety within relevant expertise and jurisdiction |

Recommended review triggers:
- every material architecture or policy change;
- every new API or evidence schema version;
- every cryptographic algorithm or key lifecycle change;
- every security incident or material near miss;
- each phase gate and release;
- at least quarterly while active development is underway.

Record decisions as version-controlled architecture decision records (ADRs), including rejected alternatives and the reason for the decision.

---

## 12. Immediate priorities and controlled next steps

The following priorities improve governance without implying permission to deploy:

1. **Preserve CORE 1.0:** retain the known CI baseline and current enforcement semantics; avoid broad refactoring.
2. **Resolve the 2028–2030 bridge:** add an explicit transition plan between the initial 24-month Trust Fabric roadmap and the 2030 Organizational Trust era.
3. **Specify the evidence contract:** define a versioned export envelope and independent verifier before claiming durable, portable trust.
4. **Specify offline authority:** define TTL, budgets, revocation delay, local safe states and reconciliation before building sovereign nodes.
5. **Publish protocol governance:** establish schema/API versioning, extension policy and independent implementation requirements.
6. **Maintain honest status reporting:** separate code, CI, staging, production, independent assessment and certification.

### 12.1 Current authorization boundary

At the time this document is authored, this work is **documentation-only**. It does not:
- change Cloudflare resources, bindings, secrets, Workers or Durable Objects;
- deploy or run hosted E2E tests;
- modify GitHub Actions workflows or Wrangler configuration;
- merge any pull request;
- modify the default branch or production code;
- claim that planned 2030–2040 capabilities exist today.

Any later operational step requires a separate, explicit authorization after relevant provider incidents are resolved and prerequisites are verified.

---

## 13. Source documents and traceability references

- [ASTON Trust Fabric Roadmap 2030](./ASTON-TRUST-FABRIC-ROADMAP-2030.md)
- [ASTON Civilization Trust Roadmap 2040](./ASTON-CIVILIZATION-TRUST-ROADMAP-2040.md)
- CORE 1.0 implementation and CI evidence must be referenced by exact repository commit, run ID and test report in each release dossier. The CI evidence described in Section 2.2 is historical baseline evidence, not a standing guarantee for future commits.

**Document principle:** ambition belongs in the roadmap; authority belongs in explicit policy; assurance belongs in evidence.
