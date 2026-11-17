# ASTON OS 22 — Trust Infrastructure Integration

## Architectural boundary
ATI remains the trust and evidence layer. The agent runtime may request attestations, but it cannot self-assert that a decision is trusted. Trust is derived from verifiable inputs, policy version, identity scope, and evidence.

## Required invariants
- Tenant and actor identity are cryptographically bound to every passport or decision receipt.
- Canonical serialization is versioned and deterministic; do not silently change existing hash inputs.
- HMAC/signature verification is distinct from authorization and from proof of external anchoring.
- Missing verifier, key, or evidence produces an explicit unavailable/unverified state, never a success state.
- Human approval is recorded as a separate actor and cannot be inferred from the requesting agent.

## Compatibility
- Preserve current public interfaces and existing test fixtures.
- Introduce new claims as optional versioned fields until all consumers migrate.
- Do not rotate deployed keys or alter external anchors from this branch.
