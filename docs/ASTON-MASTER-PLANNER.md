# ASTON OS / Trust Fabric / Immune Fabric — Master Planner

**Version:** 0.1.0-draft  
**Audit snapshot:** 2026-11-19  
**Status:** BASELINE PARTIAL — read-only GitHub inspection; no local test execution or Cloudflare verification  
**Authority:** subordinate to the Master Specification and governed by the Manual de Procedimiento.

> This is an evidence-indexed work queue, not proof of implementation or production readiness. Re-check branch heads and workflow states before acting.

## 1. Executive direction

Build one coherent ASTON platform:
- ASTON OS: runtime and orchestration.
- ASTON Trust Fabric: identity, tenant, policy, authorization, SafetyInterlock and evidence.
- ASTON Immune Fabric 2040: detection, containment, supply-chain defense, recovery and resilience.

The immediate priority is proving tenant-safe execution paths and consistent enforcement—not adding more modules.

**Next engineering focus:** reconcile open RAG tenant-isolation PR #34 with open lineage tenant-isolation PR #37 before either is merged or any D1 migration is applied.

## 2. Repository baseline — main branch snapshot

| Repository | Default branch | HEAD SHA | Files in recursive tree | Open PRs |
|---|---|---|---:|---:|
| agente-OS-15.5-hector-zapata | main | 7de36f06a1789792c173b2610016082dd486e532 | 359 | 12 |
| aston-trust-infrastructure | main | f9a04a5aff3d1f807c3ab267d547900e2e03b42a | 42 | 6 |
| aston-attestation-sdk | main | 3e2982c4c22adcd7df4ec21c26d53118d8cf4554 | 65 | 3 |
| aston-risk-protocol | main | f630fc3cec6ebabd68c72c413aa8389b6d75f5ff | 11 | 0 |

These are snapshot identifiers, not claims about future HEAD state.

### 2.1 Responsibility map — provisional

| Repository | Evidence in tree | Planner responsibility |
|---|---|---|
| agente-OS-15.5-hector-zapata | Worker entrypoint, routes, agents, SafetyInterlock DO, lineage, recovery, ETL, RAG and tests | Primary runtime and enforcement |
| aston-trust-infrastructure | Architecture, governance, identity/tenant contract, audits, tests, manual | Governing specifications and program records |
| aston-attestation-sdk | Python attestation, artifact policy, containment, revocation, schemas and tests | Attestation and evidence SDK |
| aston-risk-protocol | ARP-1 proposal, licensing, provenance and checksums | Risk vocabulary/protocol specification |

Boundaries remain provisional until callers, consumers, ownership, versioning and runtime paths are confirmed.

## 3. Relevant open PR inventory

### 3.1 Runtime repository

| PR | State at snapshot | Purpose | Disposition |
|---|---|---|---|
| [#34 RAG tenant isolation](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/34) | OPEN, not merged | Tenant namespace + metadata filter for RAG, D1 indexing states and regression tests | Candidate; reconcile with #37 |
| [#37 lineage tenant isolation](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/37) | OPEN, not merged | Tenant-scoped lineage and tenant propagation through producers/ETL | Do not merge independently until migration and route overlap resolved |
| [#36 PII HMAC fail-closed](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/36) | OPEN, not merged | Removes fixed fallback; rejects missing/short PII HMAC secret | Review separately; requires secure secret provisioning before deploy |
| [#33 tenant assignment fail-closed](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/33) | OPEN, not merged | Fail-closed for unassigned tenant identities | Review dependency/order with #34/#37 |
| [#23 adversarial SafetyInterlock pass 1](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/23) | OPEN, not merged | Routed tests; report identifies synthetic Safety DO and cases not run/not implemented | Test harness, not complete interlock validation |
| [#22 GAP-001 RAG embeddings](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/22) | OPEN, draft | Embedding gating and public identity validation | Compare against #34; avoid duplicate work |
| [#21 AI input gating](https://github.com/adminastonpay-blip/agente-OS-15.5-hector-zapata/pull/21) | OPEN, not merged | Closes input-gating gaps after #20 | Inspect runtime paths and dependencies |

Other open PRs exist in this repository. Re-list all open PRs before scheduling new implementation work.

### 3.2 Trust Infrastructure

Open PRs at snapshot:
- [#12 Safety Interlock observe-only revocation prototype](https://github.com/adminastonpay-blip/aston-trust-infrastructure/pull/12)
- [#10 Immune Fabric 2040 architecture](https://github.com/adminastonpay-blip/aston-trust-infrastructure/pull/10)
- [#4 security standardization baseline](https://github.com/adminastonpay-blip/aston-trust-infrastructure/pull/4)
- [#3 CORE 1.0 staging implementation/validation](https://github.com/adminastonpay-blip/aston-trust-infrastructure/pull/3)
- [#2 controlled COSS catalog ingestion](https://github.com/adminastonpay-blip/aston-trust-infrastructure/pull/2)
- [#1 Trust Fabric foundation / ARP-100](https://github.com/adminastonpay-blip/aston-trust-infrastructure/pull/1)

Do not create duplicate architecture or security-baseline PRs until these are reconciled.

### 3.3 Attestation SDK

Open PRs at snapshot:
- [#34 fail-closed artifact integrity policy](https://github.com/adminastonpay-blip/aston-attestation-sdk/pull/34)
- [#33 supply-chain defense v1 documentation](https://github.com/adminastonpay-blip/aston-attestation-sdk/pull/33)
- [#21 layered attestation verification integration](https://github.com/adminastonpay-blip/aston-attestation-sdk/pull/21)

### 3.4 Risk Protocol

No open PRs were returned. ARP-1 README labels it a draft proposal, not a ratified standard or conformance program.

## 4. Critical integration finding — PR #34 vs PR #37

**Severity: P1 — migration and source integration blocker.**

The inspected patches show:

1. PR #34 adds authenticated tenant namespaces and tenant metadata on RAG vector upsert; adds namespace and metadata equality filtering to /v1/rag/query and /v1/decide; persists D1 document tenant and index_status; and adds RAG regression tests.
2. PR #37 modifies the same src/routes/v21.ts to pass tenant to lineage and scope lineage reads. Its patch is based on the existing main snapshot and does not include the RAG namespace/filter changes introduced by #34.
3. Both PRs add a D1 migration that executes ALTER TABLE documents ADD COLUMN tenant:
   - #34: migrations/20261118_rag_document_01_tenant.sql
   - #37: migrations/20261119_lineage_tenant_isolation.sql
4. If both additive migrations are applied unchanged, the second attempt to add documents.tenant can fail with a duplicate-column error. Migration order and schema baseline must be reconciled.
5. PR #37 additionally adds lineage_events.tenant, its index and tenant propagation. PR #34 does not include those lineage changes.

### Required resolution before merge

- Build one combined integration plan preserving #34 RAG namespace/filter behavior and #37 lineage isolation.
- Produce one canonical ordered D1 migration path. Do not add the same column twice. Verify fresh D1 and existing D1 separately.
- Ensure schema.sql matches the final migration result.
- Update/rebase branches or create a reviewed integration PR without discarding either feature.
- Inspect every RAG query, decide, ingest, ETL, re-embedding and vector retrieval path.
- Verify Vectorize namespace and metadata filter semantics against exact Worker types/API version; do not rely only on mocks.
- Add tests for cross-tenant denial, missing tenant, legacy vectors without tenant metadata, D1 migration ordering and lineage separation.
- Run CI on the final combined SHA. No migration or deployment until separately authorized.

## 5. CI and workflow observations

### Runtime repository
For the observed PR head SHAs of #34, #37 and #36, these PR-triggered workflows were returned as successful:
- Secret Leak Scan
- Dependency Vulnerability Audit
- ASTON OS Audit Staging Validation
- Cloudflare CI

This proves only that those named workflows succeeded for those PR head SHAs. It does not prove live staging integration, an actual D1 migration, real Vectorize tenant isolation or production deployment.

Recent run history also included an older Cloudflare CI failure and cancelled runs on earlier SHAs. Tie every CI claim to exact commit SHA and run URL.

### Trust Infrastructure
The latest Scorecard run on audited main SHA f9a04a5aff3d1f807c3ab267d547900e2e03b42a returned success. Several prior runs on older SHAs failed. Do not treat older failures as current without checking the current workflow and run.

### Attestation SDK
On audited main SHA 3e2982c4c22adcd7df4ec21c26d53118d8cf4554, observed successful runs included Verify ASTON Attestation SDK, Free Security Scanning, Generate SBOM, REUSE Compliance Check and Scorecard supply-chain security.

The latest listed AI security scan on the same SHA failed. Its job logs and failure cause have not yet been inspected.

README describes SLSA verification for a specific v1.0.0 artifact/provenance pair. Keep the claim scoped to that exact artifact, digest, source and verification run; it is not a blanket SLSA claim for every commit or release.

### Risk Protocol
The latest listed Scorecard run on audited main SHA succeeded. ARP-1 remains a draft proposal per README, not a ratified standard or verified runtime implementation.

## 6. Priority task register

| ID | Priority | Task | Repository | Status | Exit criteria |
|---|---|---|---|---|---|
| AST-001 | P1 | Reconcile PR #34/#37 source overlap and D1 migration duplication | Runtime | BLOCKED / NOT STARTED | One reviewed combined patch/migration plan; no duplicate ALTER; both features retained |
| AST-002 | P1 | Verify RAG tenant isolation across all retrieval/ingest paths | Runtime | PARTIAL — PR #34 candidate | Real API semantics and tests for Alpha/Beta, absent tenant, legacy vectors and /v1/decide |
| AST-003 | P1 | Verify tenant authority and propagation for every lineage/ETL producer | Runtime | PARTIAL — PR #37 candidate | Authenticated tenant source proven at each producer; negative tests |
| AST-004 | P1 | Complete SafetyInterlock enforcement-path inventory | Runtime + Trust | OPEN | Every execution path mapped; bypass/failure tests use real policy evaluator |
| AST-005 | P1 | Inspect AI security scan failure | SDK | NOT CHECKED | Job log, root cause, severity and remediation recorded |
| AST-006 | P2 | Revalidate PII HMAC fail-closed behavior and provisioning runbook | Runtime | PR #36 OPEN | Tests/checks and rotation runbook; no secret in repo |
| AST-007 | P2 | Review tenant assignment PR #33 against tenant contract | Runtime | OPEN | Contract alignment and no bypass/regression |
| AST-008 | P2 | Audit SDK PR #34/#33/#21 and artifact policy compatibility | SDK | OPEN | Diff/dependency/license/test review |
| AST-009 | P2 | Reconcile Trust PR #10/#12 and existing audit documents | Trust | OPEN | Canonical architecture baseline and explicit observe-only status |
| AST-010 | P2 | Confirm ARP-1 schema/version ownership and consumers | Risk + Runtime + Trust | DRAFT | Versioned contract and compatibility matrix |
| AST-011 | P2 | Capture reproducible tests/dependency/license inventory | All four | PARTIAL | Commands/results tied to exact SHAs; no inferred pass |
| AST-012 | P3 | Create cross-repo module/contract dependency graph | All four | NOT STARTED | Every interface has owner, version, caller, provider, boundary and evidence |

## 7. Gates and execution order

### Gate A — Baseline (in progress)
- [x] Read default branches, main HEAD SHAs and recursive trees for four repositories.
- [x] Read open PR inventories.
- [x] Read selected PR diffs for runtime RAG and lineage.
- [x] Read recent workflow outcomes for audited heads.
- [ ] Inspect remaining PR diffs, workflow failure logs, dependency/license metadata and runtime call paths.
- [ ] Reconfirm current SHAs before implementation.
- **Exit:** reproducible inventory with evidence links and unresolved questions.

### Gate B — RAG + lineage integration design
- [ ] Resolve AST-001 through AST-003.
- [ ] Review exact Vectorize type/API semantics.
- [ ] Reconcile fresh and existing D1 migration paths.
- [ ] Define rollback and staging validation protocol.
- **Exit:** reviewed design and test plan; no migration applied.

### Gate C — SafetyInterlock and identity coverage
- [ ] Map all execution paths and tenant authorities.
- [ ] Distinguish synthetic stubs from real policy evaluation.
- [ ] Define missing-binding, timeout, stale-policy, replay and degraded-mode behavior.
- **Exit:** enforcement matrix and test evidence.

### Gate D — SDK, risk and supply-chain assurance
- [ ] Resolve SDK AI scan failure.
- [ ] Review SDK PRs and artifact claims.
- [ ] Define ARP-1 ownership/versioning and consumers.
- **Exit:** evidence-scoped assurance inventory.

### Gate E — Controlled implementation and validation
Only after earlier gates pass and the user authorizes the specific action:
- one focused PR per task;
- tests and CI on exact SHA;
- human review;
- separately authorized staging migration/deployment;
- no production change without explicit approval and rollback.

## 8. Authorization boundaries

This planner and its audit are documentation/read-only work. They do not authorize:
- merging any PR;
- applying any D1 migration;
- creating/changing Cloudflare bindings, Vectorize indexes, Durable Objects, secrets, KV or R2;
- deploying to staging or production;
- modifying runtime code;
- changing branch protection or bypassing required reviews.

## 9. Evidence and audit limitations

- Method: GitHub repository metadata, default branch references, recursive trees, PR metadata/diffs and workflow run summaries.
- No local checkout or local test command was executed.
- No Cloudflare dashboard/runtime state was read.
- No D1 migration was executed.
- No live Vectorize query was run.
- Some workflow endpoints return only recent/first-page results; absence is not proof that a workflow never ran.
- Open PR counts are snapshot counts and may change.
- File-level review is incomplete outside selected RAG/lineage changes.

## 10. Session continuation record

**Snapshot date:** 2026-11-19  
**Manual:** docs/ASTON-MANUAL-DE-PROCEDIMIENTO.md is present on Trust Infrastructure main at blob SHA 9d67a918f467ede5ea775bd6720a5b4b83071720. PR #16 merge commit: 73115ba10c2961f93c585f9e2b47b07f2d879fe8.  
**Current planner task:** AST-001 — reconcile PR #34 and #37 before merge/migration.  
**Next single step:** inspect remaining changed files and migration/schema interactions for #34/#37, then prepare a narrowly scoped integration recommendation.  
**No production actions authorized.**
