# CORE 1.0 — Isolated implementation status

**Branch:** `feat/core-1.0-implementation`  
**Baseline:** `docs/core-1.0-contracts`  
**Scope:** isolated reference implementation and local Workers-runtime integration tests only.

## Implemented

- SQLite-backed AgentIdentity Durable Object uses Cloudflare's `state.storage.sql.exec()` and `state.storage.transactionSync()` for reserve, consume, settle, and revoke operations.
- Idempotent reservations, per-agent budget accounting, and consume-time status/policy recheck.
- RFC 8785 JCS, SHA-256 and Ed25519 evidence signing/verification.
- Cloudflare Access administrator JWT verification: RS256 signature against JWKS, exact issuer/audience, expiration/not-before, required administrator role, and tenant check.
- PEP mTLS verification using Cloudflare's trusted `request.cf.tlsClientAuth` values, SHA-256 certificate fingerprint plus RFC2253 issuer/subject pinning, revocation and expiry checks.
- Vitest + `@cloudflare/vitest-plugin` runs locally on Miniflare/workerd. Wrangler config declares the SQLite-backed Durable Object class and test binding.
- Integration coverage includes real local SQLite persistence, 20 concurrent budget reservations, revocation-before-consume, expired/invalid Access JWTs, missing/invalid/revoked/unpinned mTLS certificates, and role rejection.

## Security and verification boundaries

- Access JWT tests use a generated local RSA keypair and local JWKS fixture. Production must configure the actual Access issuer, application audience, and JWKS URL. Never use fixture keys in a deployed environment.
- mTLS tests inject synthetic `request.cf.tlsClientAuth` metadata. They verify Worker policy logic, not a real TLS handshake or Cloudflare CA configuration.
- Miniflare exercises the Workers runtime and local SQLite-backed Durable Object implementation. It is not the hosted Cloudflare production environment or a security boundary.
- A process-kill/hosted storage crash test, production Access integration, real inbound mTLS handshake, Service Binding authentication, cross-agent/global emergency deny, schema meta-validation, duplicate JSON member rejection, decision-token PoP/replay, and external side-effect reconciliation remain pending.

No Worker production code, Cloudflare account resources, bindings, secrets, D1, R2, deployment, or `main` branch were changed. No production readiness or hosted E2E validation is claimed.
