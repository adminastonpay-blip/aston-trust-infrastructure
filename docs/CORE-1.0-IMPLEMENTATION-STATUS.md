# CORE 1.0 — Isolated implementation status

**Branch:** `feat/core-1.0-implementation`  
**Baseline:** `docs/core-1.0-contracts`  
**Scope:** isolated reference implementation and local Workers-runtime integration tests only.

## Implemented in this branch

- SQLite-backed AgentIdentity Durable Object uses Cloudflare's `state.storage.sql.exec()` and `state.storage.transactionSync()` for reserve, consume, settle, and revoke operations.
- Idempotent reservations, per-agent budget accounting, and consume-time status/policy recheck.
- RFC 8785 JCS, SHA-256 and Ed25519 evidence signing/verification.
- Cloudflare Access administrator JWT verification: RS256 signature against JWKS, exact issuer/audience, expiration/not-before, required administrator role, and tenant check.
- PEP mTLS verification using Cloudflare's trusted `request.cf.tlsClientAuth` values, SHA-256 certificate fingerprint plus RFC2253 issuer/subject pinning, revocation and expiry checks.
- Tenant context is injected by the authenticated Worker and checked again against the immutable organization ID stored inside the Durable Object before every non-registration operation. Registration also requires the request tenant to match the registered organization.
- PEP service-principal revocation is checked independently of Access JWT validity using a deny-first `PEP_REVOKED_PRINCIPALS` runtime configuration.
- Unexpected SQLite/runtime errors latch the Durable Object instance into a 503 fail-closed state. Operator recovery requires restoring a trusted storage image and replacing/restarting the affected instance under a controlled procedure.
- Vitest + `@cloudflare/vitest-plugin` runs locally on Miniflare/workerd. Wrangler config declares the SQLite-backed Durable Object class and test binding.
- Integration coverage includes local SQLite persistence, 20 concurrent budget reservations, cross-tenant rejection, SQLite schema/storage failure fail-closed behavior, revocation-before-consume, expired/invalid Access JWTs, missing/invalid/revoked/unpinned mTLS certificates, administrator role rejection, and immediate PEP-principal revocation.

## Security and verification boundaries

- Access JWT tests use a generated local RSA keypair and local JWKS fixture. Production must configure the actual Access issuer, application audience, and JWKS URL. Never use fixture keys in a deployed environment.
- mTLS tests inject synthetic `request.cf.tlsClientAuth` metadata. They verify Worker policy logic, not a real TLS handshake or Cloudflare CA configuration.
- The PEP revocation test mutates the test runtime environment between two requests. A production deployment must supply a revocation source with defined propagation/consistency guarantees; an environment variable change is not, by itself, a distributed revocation service.
- Miniflare exercises the Workers runtime and local SQLite-backed Durable Object implementation. It is not the hosted Cloudflare production environment or a security boundary.
- The SQLite recovery test simulates a destructive schema/storage failure by dropping a table. It verifies the instance latches closed; it does not corrupt a SQLite database file or prove backup restoration/restart behavior on hosted Cloudflare.
- A process-kill/hosted storage crash test, production Access integration, real inbound mTLS handshake, Service Binding authentication, cross-agent/global emergency deny, schema meta-validation, duplicate JSON member rejection, decision-token PoP/replay, and external side-effect reconciliation remain pending.

No Worker production code, Cloudflare account resources, bindings, secrets, D1, R2, deployment, or `main` branch were changed. No production readiness or hosted E2E validation is claimed.
