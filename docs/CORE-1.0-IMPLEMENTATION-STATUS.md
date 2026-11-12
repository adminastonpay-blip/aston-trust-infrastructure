# CORE 1.0 — Isolated implementation status

**Branch:** `feat/core-1.0-implementation`  
**Baseline:** `docs/core-1.0-contracts`  
**Scope:** local reference implementation and unit-level fault/concurrency tests only.

## Implemented in this branch

- SQLite-backed Durable Object class with per-agent identity, policy version, budget totals/reservations/spend, state sequence, and decision state.
- Explicit synchronous storage transactions for reserve, consume, settle, and revoke operations; no network I/O inside transactions.
- Idempotent reservation handling and rejection when an idempotency key is reused with a different digest/amount.
- Consume-time identity status and policy-version recheck, so a committed revocation blocks a previously reserved decision.
- RFC 8785 JCS via the `canonicalize` package, SHA-256 digest, and Ed25519 Web Crypto signing/verification over the raw 32-byte digest.
- Node test suite for deterministic digest/signature, tamper rejection, budget concurrency, revocation-before-consume, and rollback under an injected pre-commit failure.

## Verification boundaries

The Durable Object class uses the Cloudflare SQLite-backed Durable Object storage API. The local unit suite uses a transactional in-memory SQL test double; it does **not** boot Miniflare or Cloudflare's SQLite engine. The injected failure test demonstrates rollback semantics of the test adapter, not a real Cloudflare process kill or storage-engine crash.

The test suite does not yet validate: JSON Schema meta-validation, duplicate JSON member rejection before parsing, Access JWT, PEP mTLS/Service Binding identity, cross-tenant routing/namespace binding, policy action/resource matching, human approval, decision-token cryptographic binding, real SQLite integration, or external side-effect reconciliation.

No Worker production code, Cloudflare resources, bindings, secrets, D1, R2, or `main` branch were changed. No deployment or production readiness is claimed.
