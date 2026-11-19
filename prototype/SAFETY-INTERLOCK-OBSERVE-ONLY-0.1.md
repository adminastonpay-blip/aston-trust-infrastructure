# ASTON Safety Interlock — Observe-Only Revocation Prototype 0.1

**Status:** DESIGN / PROTOTYPE SCOPE ONLY  
**Date:** 2026-11-17  
**Execution mode:** OBSERVE ONLY — no credentials are revoked  
**Environment:** local, isolated test harness; synthetic identities and events only

## 1. Falsifiable objective

Test whether a deterministic policy engine can identify a defined set of anomalous credential-use events, produce a reproducible proposed revocation decision, and emit independently verifiable evidence without taking an external action.

This prototype does **not** prove that ASTON can stop all cyberattacks, identify every compromised credential, or safely revoke production credentials.

## 2. Hard safety boundary

- No production credentials, tokens, keys, accounts, endpoints or customer data.
- No connection to GitHub administration, Cloudflare, identity providers, EDR, SIEM or external networks.
- No write-capable revocation adapter exists in this prototype.
- No automatic enforcement path or hidden fallback to active mode.
- The only output is a local decision record marked `WOULD_REVOKE`, `WOULD_ESCALATE`, or `NO_ACTION`.
- If configuration, policy, clock, identity, evidence signing or verification is missing/invalid, output `INDETERMINATE_FAIL_CLOSED`; never infer permission to act.
- No secrets in logs or evidence. Use synthetic opaque identifiers.

## 3. Minimal architecture

1. **Synthetic Event Generator:** produces deterministic, versioned test events.
2. **Normalizer:** validates schema, event ID, subject ID, event time, source and replay marker.
3. **Rule Engine:** applies explicit, versioned rules; no ML score may independently trigger a decision.
4. **Decision Engine:** returns a proposed outcome and reason codes.
5. **Evidence Writer:** creates canonical decision records and a hash chain.
6. **Independent Verifier:** separate test module verifies schema, policy version, digest, signature and chain continuity.
7. **Adversarial Test Harness:** supplies malformed, replayed, conflicting, delayed and forged events.

There is deliberately no revocation connector.

## 4. Initial deterministic rules

The first test set should use synthetic events and thresholds fixed in a versioned policy file:

| Rule ID | Trigger | Observe-only result |
|---|---|---|
| SI-001 | Same synthetic credential used from two incompatible test locations within a configured interval. | WOULD_ESCALATE |
| SI-002 | Repeated authentication failures exceed a fixed test threshold. | WOULD_ESCALATE |
| SI-003 | Credential used after a synthetic expiry/revocation event. | WOULD_REVOKE |
| SI-004 | Privilege or audience differs from the signed test grant. | WOULD_REVOKE |
| SI-005 | Event timestamp outside permitted skew or sequence is replayed. | INDETERMINATE_FAIL_CLOSED |
| SI-006 | Required source, identity, policy version or evidence signer is missing. | INDETERMINATE_FAIL_CLOSED |

Rules are test hypotheses, not universal indicators of compromise. Thresholds must be calibrated and documented before any future active-mode proposal.

## 5. Evidence record

Each decision record should include:

- schema version and unique decision ID;
- synthetic subject and credential identifiers;
- input event digests, not raw secrets;
- event time and processing time;
- policy ID, version and digest;
- rule IDs and reason codes;
- proposed outcome and explicit `mode: OBSERVE_ONLY`;
- previous record digest and current canonical record digest;
- signature algorithm, key ID and signature;
- verifier result and verifier version.

Use a documented canonical serialization format before hashing. SHA-256 provides integrity linkage, not authenticity by itself. A signature is meaningful only when the verifier independently establishes trust in the signing key. Do not claim immutable storage or trusted timestamping in this local prototype.

## 6. Adversarial test plan

Independent reviewer should attempt:

1. replaying an identical event and changing only its event ID;
2. changing subject, audience, privilege or policy version after signing;
3. presenting expired, unknown and rotated signing keys;
4. submitting duplicate, out-of-order and delayed events;
5. omitting required fields or supplying malformed encodings;
6. creating conflicting events from two simulated sources;
7. altering, deleting, reordering or truncating evidence records;
8. causing verifier failure, unavailable signer or invalid clock;
9. attempting to invoke a nonexistent active/revocation path;
10. testing that every failure remains observe-only and never calls an external system.

Record test ID, setup, expected result, actual result, artifact digest and reviewer identity. A test passes only when the observed result matches the expected result and the evidence can be independently checked.

## 7. Acceptance criteria

- 100% of defined deterministic test vectors produce the documented outcome.
- Every decision has a verifiable canonical digest and signature, or is explicitly marked unverifiable.
- Tampering, replay and sequence gaps are detected by the independent verifier.
- Missing/invalid policy or evidence dependencies produce fail-closed indeterminate outcomes.
- No test can cause a network call, credential mutation or external side effect.
- Independent reviewer reproduces the results from a clean checkout.

Passing this prototype validates only the narrow observe-only behavior above. It does not authorize active revocation.

## 8. Deferred decisions

Out of scope: production integration, live credential revocation, automatic response, machine-learning anomaly detection, multi-tenant service, high availability, key custody service, external transparency log, PQC migration, and certification.

Any future active-mode proposal requires a separate threat model, human approval design, rollback/recovery plan, false-positive analysis, staged kill switch, independent penetration testing and explicit owner authorization.

## 9. Status vocabulary

- **PROPOSED:** design described here.
- **IMPLEMENTED:** prototype code exists.
- **TESTED:** reproducible tests pass.
- **VALIDATED:** independent adversarial review passes.
- **PRODUCTION:** not applicable to this prototype.

At creation of this document, all prototype capabilities are **PROPOSED**, not implemented or validated.
