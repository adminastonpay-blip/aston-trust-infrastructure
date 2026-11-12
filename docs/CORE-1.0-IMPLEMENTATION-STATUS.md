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
- Vitest + `@cloudflare/vitest-plugin` runs locally on Miniflare/workerd. Wrangler config declares the SQLite-backed Durable Object classes and bindings.
- Integration coverage includes local SQLite persistence, concurrent budget reservations, cross-tenant rejection, SQLite schema/storage failure fail-closed behavior, revocation-before-consume, Access JWT rejection cases, and mTLS rejection/revocation cases.
- Staging-only `POST /v1/audit-target` accepts only the synthetic `PROMPT_INJ_01` fixture, requires an explicit enable flag and bearer secret, and returns a deny decision before any model adapter call.
- `StagingInvocationLedger` is an independent SQLite-backed Durable Object keyed by correlation ID. `runInstrumentedModel()` increments it before calling `env.AI.run()`; the deny route reads it independently and requires zero.
- Miniflare integration tests cover the 403/zero-invocation denial path and a synthetic adapter canary (one adapter call/one ledger increment).

## Staging harness: strict interpretation

The pre-existing CORE Worker had no `/v1/audit-target` route, model-execution endpoint, or production SafetyInterlock implementation. This addition is therefore a **test-only deterministic deny fixture**, not a proxy to an existing model service and not a semantic prompt-injection detector. It demonstrates that this fixture's deny branch executes before the instrumented adapter. The counter measures only model calls routed through `runInstrumentedModel()`; any direct `env.AI.run()` elsewhere would bypass it. Before hosted E2E, verify that the staging target has no such bypass.

The route is disabled unless `STAGING_HARNESS_ENABLED=true` and a non-empty `STAGING_HARNESS_TOKEN` secret is configured. Do not commit the token to Wrangler vars. Keep the route disabled outside the isolated staging test window and use a fresh correlation ID per test. No external model or production system is contacted by the denial fixture.

## Security and verification boundaries

- Access JWT tests use a generated local RSA keypair and local JWKS fixture; production must configure the actual Access issuer, audience, and JWKS URL.
- mTLS tests inject synthetic `request.cf.tlsClientAuth` metadata. They test Worker logic, not a real TLS handshake or Cloudflare CA configuration.
- The PEP revocation test mutates test runtime environment; this is not proof of fleet-wide distributed revocation.
- Miniflare exercises local Workers runtime and SQLite-backed DO behavior, not hosted Cloudflare production.
- SQLite recovery test simulates schema failure by dropping a table, not physical database corruption or hosted restore.
- Hosted crash/recovery, production Access integration, real mTLS, Service Binding authentication, global emergency deny, schema meta-validation, duplicate JSON member rejection, PoP/replay, and external side-effect reconciliation remain pending.

No Worker production code, Cloudflare account resources, production bindings/secrets, D1, R2, deployment, or `main` branch were changed. No production readiness or hosted E2E validation is claimed.


## Model execution boundary — implementation scope

- `src/core/safety-interlock.mjs` authenticates the trusted PEP context supplied by the Worker and delegates an atomic policy/identity/budget/invocation/concurrency decision to the agent's SQLite Durable Object before model execution.
- The agent's registered identity JSON must contain a `policyGrant` matching the immutable tenant, agent, policy ID/version, active allow effect, validity interval, exact `ai.inference` action and exact model resource. Missing or malformed grants fail closed.
- Model execution requires an operator-configured positive integer `MODEL_INVOCATION_COST_MINOR`. This is a fixed internal budget debit per invocation, not actual provider billing. Only `grant_lifetime` policy budgets are supported; other budget periods fail closed.
- `src/core/model-runner.mjs` contains the only direct `env.AI.run()` call in CORE source. A Node architecture test scans runtime modules for direct invocation bypasses.
- The invocation debit remains charged if provider execution fails or its outcome is uncertain. Active execution leases are removed in a finally path and expire at the policy maximum execution duration if cleanup fails.

### Explicit remaining gaps — not production complete

- Agent proof-of-possession and signed per-request agent authorization are not implemented. The current model endpoint authenticates the PEP service principal via mTLS and enforces registered tenant/agent state; it does not prove the autonomous agent signed the request.
- Human approval constraints, global/tenant emergency deny, non-lifetime budget periods, actual provider cost reconciliation, and cryptographically signed single-use decision tokens remain pending.
- The existing Worker does not yet expose a complete administrator-facing registration/policy issuance workflow. A trusted provisioning path must register a validated and issuer-authenticated identity containing `policyGrant` before this model route can authorize anything.
- Miniflare/CI does not prove hosted Cloudflare mTLS, Access, Workers AI binding, or provider behavior.

This implementation must not be described as production-ready or fully CORE 1.0 compliant until the remaining contract requirements are closed and hosted staging E2E passes.
