# ASTON Immune Fabric 2040 — Stage 0 Audit Charter & Initial Register

**Status:** IN PROGRESS — initial-pass scope only  
**Date opened:** 2026-11-17  
**Target for initial-pass closure:** 2026-11-24  
**Authority:** Owner-approved, read-only audit. No merge or production changes authorized.

## 1. Safety and scope

This audit covers four repositories:

- `adminastonpay-blip/agente-OS-15.5-hector-zapata`
- `adminastonpay-blip/aston-trust-infrastructure`
- `adminastonpay-blip/aston-attestation-sdk`
- `adminastonpay-blip/aston-risk-protocol`

Allowed: inspect repository files, history, pull requests, workflows, tests, dependency manifests, and available GitHub governance metadata; create audit documentation on this branch only.

Prohibited: modifying `main`, changing branch rules, merging PRs, deploying, accessing or changing Cloudflare resources, generating releases, changing secrets, or running tests that mutate external systems.

## 2. Governance gate — BLOCKING

The prior observation `protected: false` is not sufficient by itself to conclude that no organization ruleset applies. Conversely, it is not evidence that protection exists.

Required evidence for each repository's `main`:

1. Repository branch-protection configuration, including required status checks, reviews, conversation resolution, linear history, force-push/deletion restrictions, and bypass actors.
2. Organization rulesets, including active status, target repositories/branches, enforcement mode, rules, and bypass lists.
3. Effective-rule evaluation for `main`, not merely the existence of a ruleset.
4. Permission inventory identifying who can push, administer, bypass, approve, and merge.
5. A recorded test or authoritative settings evidence confirming enforcement.

**Fail-closed classification:** if any required evidence is unavailable, mark the repository **NOT VERIFIED — TREAT AS UNPROTECTED FOR GOVERNANCE PURPOSES**. Do not infer protection from a green workflow, a draft PR, or an API field alone.

**Access limitation recorded:** the connected GitHub integration does not expose the organization administration/ruleset settings in this session, and its repository branch-protection read is not currently authorized. Therefore the organization-level ruleset and effective protection state remain **NOT VERIFIED**. No settings were changed.

## 3. Four bounded deliverables

### A. Execution Map

For each critical entry point, record: file and symbol, caller, trust boundary, identity/privileges, execution sequence, validation gates, external side effects, failure behavior, and evidence. Include a sequence diagram and controls checklist. Do not claim coverage for uninspected paths.

### B. Trust Matrix

For each component-to-component relationship, record: trustor, trustee, asset, assertion, verification mechanism, key/issuer dependency, expiry/revocation behavior, failure mode, and status. Every relationship without a demonstrated verifier is debt.

### C. Reuse Inventory

Classify each inspected component as **REUSE**, **ADAPT**, **BUILD**, or **REJECT**. Include exact path/version, test evidence, license/dependency constraints, rationale, and required remediation. Presence in a repository is not proof of safe reuse.

### D. Risk Register

Each risk must have a stable ID, affected repository/path, threat scenario, impact, likelihood, severity, evidence, owner role, mitigation, residual risk, and state. Unknown ownership is recorded as **UNASSIGNED**, not silently assigned.

## 4. Initial observations — not a completed audit

These observations are based on repository README files only and require source-level confirmation:

| Repository | README-level signal | Audit question |
|---|---|---|
| Agente OS 15.5 | Describes SafetyInterlock, policy evaluation, pending human approvals, audit endpoint, recovery workflows, PII masking and PQC modules. | Trace actual request handlers to authorization, policy evaluation, AI/tool execution and durable side effects; verify fail-closed behavior and tenant boundaries. |
| Trust Infrastructure | Describes decision lifecycle, constitution, HMAC passport, commitment passport, coverage protocol and compose gate; explicitly disclaims full SNARK, quantum resistance and external anchoring. | Verify implementation, key handling, replay resistance, trust-root rotation and whether claims match tests. |
| Attestation SDK | Describes a schema/specification and explicitly states that schema validation does not verify signatures, issuer identity, runtime truth or external anchors. | Inspect verifier implementation, canonicalization, signature algorithms, key discovery/revocation, provenance validation and negative tests. |
| Risk Protocol | Describes ARP-1 as a draft proposal, not ratified, with no conformance program. | Trace any implementation separately from the specification; verify risk scoring, envelope enforcement and approval semantics. |

## 5. Initial risk register

| ID | Risk | Severity | State | Required evidence / mitigation |
|---|---|---:|---|---|
| GOV-001 | Effective `main` protection and organization rulesets cannot currently be verified for all four repositories. | CRITICAL | OPEN / BLOCKING | Obtain authoritative organization and repository settings evidence; treat as unprotected until verified. |
| GOV-002 | Merge, bypass, admin and write permissions have not been independently inventoried. | HIGH | OPEN | Capture role/team/actor permissions and bypass conditions. |
| EXEC-001 | SafetyInterlock enforcement across every path to model/tool execution is not yet traced. | CRITICAL | OPEN | Build call graph and test bypass/exception/failure paths. |
| TEN-001 | Cross-tenant isolation is not established by README-level evidence. | CRITICAL | OPEN | Trace tenant identity propagation and test object, cache, storage and queue boundaries. |
| CRYPTO-001 | Cryptographic module names do not establish correct key lifecycle or protocol security. | HIGH | OPEN | Inspect implementations, algorithms, formats, key rotation, revocation and test vectors. |
| EVID-001 | Audit/attestation structures do not alone prove tamper-evident, complete event capture. | HIGH | OPEN | Verify signing, ordering, anchoring, retention, omission detection and independent verification. |
| SUPPLY-001 | Dependency and workflow risk needs path-by-path verification across all four repositories. | HIGH | OPEN | Inventory lockfiles, pinned actions, permissions, provenance and vulnerability policy. |
| REC-001 | Recovery claims require restore evidence, not merely workflow or queue definitions. | HIGH | OPEN | Inspect recovery code and require isolated restore/rollback exercises. |

## 6. Evidence and status vocabulary

- **OBSERVED:** directly seen in a source file or authoritative GitHub response.
- **IMPLEMENTED:** code exists and its behavior has been traced.
- **TESTED:** a reproducible test exercises the stated behavior.
- **VALIDATED:** independent or adversarial evidence supports the stated property.
- **PRODUCTION:** deployed behavior, monitoring and recovery are evidenced.
- **NOT VERIFIED:** evidence is unavailable or insufficient.
- **PROPOSED:** design only; not implemented.

No control may be upgraded based solely on README claims or architecture diagrams.

## 7. Timebox and exit criteria

Initial pass target: **2026-11-24**. The initial pass is closed only when A–D contain bounded findings for all four repositories, evidence links/paths, unresolved unknowns, severity and accountable owner roles. A second pass is limited to CRITICAL findings and any HIGH finding that blocks a critical trust boundary.

If access limitations prevent a conclusion, the deliverable must state **NOT VERIFIED** and name the missing evidence. The audit must not be marked complete merely because the date is reached.

## 8. Change control

This charter and its updates remain on `audit/immune-fabric-stage0`. It is independent of PR #10 and the Safety Interlock prototype branch. No PR is merged without explicit owner authorization.
