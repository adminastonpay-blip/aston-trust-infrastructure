# ASTON Intellectual Property and Release Controls

**Status:** Internal governance baseline — legal review required before public release or commercial licensing.

## 1. Default disclosure rule
No component is open source merely because it is hosted on GitHub. Unless a valid license is deliberately approved and attached to the relevant files or repository, the default operational position is All Rights Reserved. This is a governance instruction, not a legal opinion about ownership or enforceability.

Do not add an OSI license, patent grant, broad reuse permission, or public contribution terms without explicit owner-approved legal review.

## 2. Two disclosure planes

### Public-verification plane (candidate for later publication)
- Stable protocol identifiers and version formats.
- Public certificate and evidence-manifest schemas.
- Verification algorithms and test vectors that reveal no proprietary thresholds, customer information, or secret implementation details.
- Public keys, key identifiers, revocation status, and independent verification instructions.
- Release hashes and signed version metadata.

### Proprietary implementation plane (restricted)
- Internal orchestration, scoring logic, non-public policy thresholds, detection heuristics, and operational playbooks.
- Tenant-specific rules, private integrations, model prompts, customer evidence, and personal data.
- Private signing keys, API credentials, tokens, salts, and secret configuration.
- Unreleased roadmap details where disclosure would compromise competitive advantage or security.

A public verifier must not require disclosure of the proprietary engine or confidential customer evidence.

## 3. Ownership and contributor provenance
Before claiming exclusive ownership or commercial exclusivity, maintain evidence for:
- The legal person/entity that owns each contribution.
- Author and contributor identity and dates.
- Employment, contractor, assignment, and third-party dependency terms where applicable.
- Dependency licenses, notices, and source provenance.
- Pre-existing code or material incorporated into ASTON.

Do not assume a GitHub account, commit author field, company name in a README, or Bitcoin timestamp alone proves legal title. Obtain written IP assignments or licenses where needed and legal advice for relevant jurisdictions.

## 4. Version and evidence integrity
For each approved release, record repository and immutable commit SHA; protocol, catalog, evaluator, and schema versions; dependency lockfile digest and build provenance; test report and CI run identifier; release manifest digest and signature key identifier; change approval and rollback reference.

Use signed annotated Git tags where supported. Protect release branches, require review, and prevent force-pushes/deletion on protected branches. A Git signature authenticates use of a signing key; it does not independently establish the signer's legal identity.

## 5. Secret and history protection
- Run secret scanning and dependency/security scanning on every PR.
- Enable GitHub secret scanning and push protection where plan and settings permit.
- Scan current files, release assets, workflow logs, and repository history before public disclosure.
- If a secret is found, revoke/rotate it. Do not rely on deleting the latest file or rewriting history as the only remediation.
- Never rewrite protected branch history as a cleanup shortcut.

## 6. Licensing and marks
Keep software, specification text, data, trademarks, and patents as separate rights categories. Reserve ASTON and related marks pending trademark review. Do not imply that protocol conformance grants a right to use ASTON marks or issue an ASTON-branded certificate.

Any future public specification license must define copyright permission, patent treatment, attribution, trademark exclusion, versioning, and compatibility claims. Any proprietary software license must separately define permitted use, redistribution, support, and audit rights.

## 7. Release state labels
- DRAFT: design or code exists; not approved for external reliance.
- IMPLEMENTED: source is present.
- VALIDATED: reproducible tests pass for the stated scope.
- STAGING: isolated non-production deployment and configuration are verified.
- ANCHORED: a complete OpenTimestamps proof is independently verified against a Bitcoin block.
- PRODUCTION: approved deployment, monitoring, rollback, backup/restore, incident response, and operational ownership are demonstrated.

Never promote a release label based solely on a successful build or pending timestamp.

## 8. Legal boundary
Copyright, trade-secret, trademark, patent, privacy, consumer, financial-services, and evidentiary rules vary by jurisdiction. Before public launch, licensing, certification claims, or customer contracts, obtain qualified counsel in the jurisdictions where ASTON operates. This document promises no legal admissibility, regulatory approval, or exclusive rights.
