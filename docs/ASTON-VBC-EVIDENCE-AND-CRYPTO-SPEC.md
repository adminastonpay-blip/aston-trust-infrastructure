# ASTON VBC Evidence and Cryptographic Specification

**Version:** 0.1.0-draft  
**Status:** Design contract only — no production signer, Bitcoin anchoring, or public VBC issuance is claimed.

## 1. Security objectives
A VBC evidence package should support independent checks of evidence-byte integrity; issuer signature authenticity against a trusted public key; protocol, catalog, evaluator, target, and campaign version identification; timestamp proof validity and Bitcoin anchoring status; and revocation/supersession/scope.

It does not prove that observations were truthful, tests complete, an agent universally safe, or that a court/regulator must accept the result.

## 2. Canonical evidence package
The package should contain a canonical manifest and separately addressable evidence objects. The manifest should identify:
- schema_version
- issuer_id and key_id
- protocol_id, protocol_version, protocol_commit
- catalog_version and catalog_digest
- evaluator_version and evaluator_digest
- privacy-preserving target reference and target_version_digest
- campaign_id, start/end timestamps, environment classification
- per-case identifiers, observation digests, outcomes, and explicit not_run/not_evaluated states
- SafetyInterlock policy/version and decision references
- cost/token accounting with source and units
- evidence object digests and retention references
- signature_algorithm, signature, manifest digest
- timestamp_status, OpenTimestamps proof digest, and Bitcoin block reference when confirmed

Use deterministic canonical serialization (for example, RFC 8785 JSON Canonicalization Scheme) before hashing. Reject duplicate keys, ambiguous encodings, unsupported schema versions, and unknown critical fields.

## 3. Hashing and signatures
- Compute SHA-256 over the canonical manifest payload, excluding the signature envelope itself.
- Sign the exact digest or canonical payload under a versioned signing profile.
- Cloudflare Workers documents ML-DSA-44/65/87 behind webcrypto_modern_algorithms; the selected parameter set must be fixed in the profile and verified in the actual deployed runtime and compatibility date.
- Do not assume a private key generated in a Worker is durably or securely managed. Define generation, custody, backup, rotation, revocation, access logging, and recovery.
- Keep private keys outside source control and ordinary environment variables. Evaluate dedicated signing service or HSM-backed custody where assurance requirements justify it.
- Publish only public verification material, key identifier, validity period, and revocation information.
- Include algorithm agility and migration path; no silent downgrade.

## 4. OpenTimestamps / Bitcoin anchoring
1. Hash the exact canonical evidence package or a Merkle root over a defined batch.
2. Submit the commitment to independent OpenTimestamps calendars.
3. Store the returned .ots proof as untrusted/pending until independently upgraded and verified.
4. Verify the proof against Bitcoin block headers using an independent verifier; record block height/hash and verifier version.
5. Preserve original evidence bytes, canonicalization profile, digest, signature, public key, and .ots proof together.

A pending calendar response is not an anchored proof. OpenTimestamps establishes that committed data existed no later than the attested Bitcoin time; it does not prove truth, authorship, completeness, or legal effect. Calendar availability and upgrade time are external dependencies. Timestamping does not require one Bitcoin transaction per evidence package.

## 5. Privacy and selective disclosure
- Never anchor raw personal data, prompts, customer content, credentials, or confidential evidence.
- Anchor only a digest or Merkle commitment.
- Use per-tenant random salts or keyed commitments where low-entropy data could be guessed from public hashes. Keep salts/keys private and versioned.
- Provide redacted evidence views and selective disclosure without changing the committed original.
- Define retention, deletion, legal hold, and data-subject request procedures before production. An immutable hash does not override privacy obligations.

## 6. Verification outcomes
- INVALID: digest, signature, schema, or proof verification failed.
- PENDING: timestamp submitted but not yet anchored/confirmed.
- ANCHORED: timestamp proof verifies against the identified Bitcoin block.
- REVOKED: issuer revoked the certificate/key; historical integrity may still verify.
- EXPIRED / SUPERSEDED: certificate lifecycle state, not a cryptographic failure.
- UNVERIFIABLE: required evidence, trust root, or verifier capability is missing.

Never convert missing evidence into PASS. Never present ANCHORED as an audit PASS; report audit verdict separately.

## 7. Minimum test gates
Canonicalization stability and malformed JSON rejection; digest/signature tampering; wrong, unknown, and revoked key; ML-DSA sign/verify and negative tests on exact Cloudflare runtime; algorithm capability detection and fail-closed fallback; OpenTimestamps pending/upgrade/valid/wrong-file/altered-proof/independent-verifier tests; Merkle membership; privacy leakage and low-entropy hash-guessing; replay, duplicate campaign, rotation, and revocation.

## 8. Current implementation boundary
This is a target specification. The current Trust Fabric PR does not yet implement VBC issuance, ML-DSA signing, key custody, canonical evidence packaging, R2 retention controls, OpenTimestamps submission, or independent Bitcoin verification. Each requires separate implementation, tests, and explicit staging approval.
