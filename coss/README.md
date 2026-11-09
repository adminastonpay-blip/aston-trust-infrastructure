# ATI — COSS integration (Phase 1)

**Status:** integration scaffold; not an attestation, certification, or completed COSS assessment.

## Purpose

Provide ATI with a versioned, evidence-first adapter for the CISOKit Open Security Standard (COSS), while keeping ATI's decision-passport and constitution modules independent. COSS is an external standard; ATI does not own, certify, or speak for CISOKit.

## Phase 1 deliverables

- `registry.schema.json`: metadata contract for imported control records.
- `assessment.schema.json`: evidence-backed assessment record and allowed status vocabulary.
- `registry.sample.json`: small illustrative sample, not the complete 107-control catalogue.
- No production enforcement, automated compliance claim, external API dependency, secrets, or Worker changes.

## Evidence and status rules

A control may be marked:
- `implemented`: implementation is identified, but evidence review is not complete.
- `partially_implemented`: some requirements have evidence and others remain open.
- `not_implemented`: evidence shows the control is absent.
- `not_assessed`: no sufficient assessment has been performed.
- `not_applicable`: scope exclusion is documented and approved by a human reviewer.

An evidence item must identify its source, collection time, scope, integrity digest, and reviewer or collection process. A hash proves integrity of the referenced bytes only; it does not prove that the evidence is true, complete, current, or independently audited.

Never infer compliance from a README, a planned feature, a passing unit test, or an unverified configuration. Every assessment is tied to a specific COSS source snapshot and ATI commit.

## External references

- COSS control crosswalk: https://cisokit.com/framework/crosswalks
- COSS public adopter registry: https://cisokit.com/framework/registry
- CIS Controls v8.1 (separate framework; do not conflate with COSS): https://www.cisecurity.org/controls

The published COSS crosswalk currently presents 107 control rows and mappings to several frameworks. Import the complete catalogue only after confirming CISOKit's current terms, permitted redistribution, canonical version identifier, and source integrity. Until then this repository contains only a few clearly labelled illustrative records.

## Phase 2 progress

A deterministic catalog validator and provenance contract are now available in [`PHASE-2-INGESTION.md`](PHASE-2-INGESTION.md). The complete upstream catalogue remains intentionally unimported until redistribution terms and a canonical snapshot are verified.

## Next phases

1. **Phase 1 — contract and boundary:** schemas, sample records, and evidence rules (implemented).
2. **Phase 2 — ingestion:** validator and provenance contract implemented; authorized full-catalog import pending.
3. **Phase 3 — assessment engine:** scoring, scope, reviewer approvals, findings, and remediation tracking.
4. **Phase 4 — crosswalk engine:** map controls to external frameworks without claiming equivalence or certification.
5. **Phase 5 — continuous evidence:** CI and runtime collectors with provenance, expiry, and tamper-evident audit history.

## Safety boundary

This integration is additive and repository-local. It does not modify the Cloudflare Worker, deployment configuration, bindings, secrets, production resources, or the existing ATI decision modules.
