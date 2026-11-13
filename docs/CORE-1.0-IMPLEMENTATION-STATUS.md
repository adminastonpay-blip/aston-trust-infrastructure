# CORE 1.0 — Isolated implementation status

**Branch:** `feat/core-1.0-implementation`  
**Baseline:** `docs/core-1.0-contracts`  
**Scope:** isolated reference implementation and local Workers-runtime integration tests only.

## Implemented in this branch

- SQLite-backed AgentIdentity Durable Object uses the `IDatabase` port and `CloudflareSQLiteDatabase` adapter for reserve, consume, settle, authorize, and revoke operations; the adapter delegates to Cloudflare Durable Object SQLite.
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
- `StagingInvocationLedger` is an independent SQLite-backed Durable Object keyed by correlation ID. The staging counter remains scoped to the CORE test harness; it is not a production-wide invocation monitor.
- Miniflare integration tests cover the 403/zero-invocation denial path and a synthetic adapter canary (one adapter call/one ledger increment).

## Staging harness: strict interpretation

The pre-existing CORE Worker had no `/v1/audit-target` route, model-execution endpoint, or production SafetyInterlock implementation. This addition is therefore a **test-only deterministic deny fixture**, not a proxy to an existing model service and not a semantic prompt-injection detector. It demonstrates that this fixture's deny branch executes before the instrumented adapter. The counter measures model calls through the guarded ModelRunner while staging instrumentation is enabled. A static architecture test scans runtime modules and asserts that the PEP Worker and CORE modules do not access the Workers AI binding; the separate Model Runner service is the only runtime entrypoint that receives it. Dynamic code loading and Cloudflare platform-level calls remain outside this local source scan.

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
- The separately stored, immutable policy grant must match the immutable tenant, agent, policy ID/version, active allow effect, validity interval, exact `ai.inference` action and exact model resource. Missing or malformed grants fail closed.
- Model execution requires an operator-configured positive integer `MODEL_INVOCATION_COST_MINOR`. This is a fixed internal budget debit per invocation, not actual provider billing. Only `grant_lifetime` policy budgets are supported; other budget periods fail closed.
- The PEP-side `src/core/model-runner.mjs` has no AI binding. It issues a short-lived Ed25519 Permit Token after the existing authoritative SafetyInterlock/AgentIdentity `ALLOW`, then calls the separate `MODEL_RUNNER` service binding. The token binds audience, tenant, agent, request ID, exact model, policy version and SHA-256 digest of the exact inputs.
- The invocation debit remains charged if provider execution fails or its outcome is uncertain. Active execution leases are removed in a finally path. If cleanup fails, the stale lease remains and blocks further model execution until a separately approved operator recovery procedure reconciles the uncertain execution; no automated lease-clear endpoint is exposed.

### Explicit remaining gaps — not production complete

- Agent proof-of-possession and signed per-request agent authorization are not implemented; the synthetic identity fixture in tests does not represent a verified identity signature. The current model endpoint authenticates the PEP service principal via mTLS and enforces registered tenant/agent state; it does not prove the autonomous agent signed the request.
- Human approval constraints, global/tenant emergency deny, non-lifetime budget periods and actual provider cost reconciliation remain pending. The permit/replay code is implemented in the branch, but production key provisioning, service-binding wiring and durable replay-guard binding are not configured or validated.
- A basic Cloudflare Access-protected administrator registration route now forwards an identity and policy grant to the per-agent DO. However, the route does not yet validate the identity's Ed25519 issuer proof, validate the complete JSON Schemas at runtime, or verify a policy issuer signature. Provisioning is therefore not yet suitable for untrusted or self-service registration.
- Miniflare/CI does not prove hosted Cloudflare mTLS, Access, Workers AI binding, Service Binding authentication, key provisioning, or provider behavior.

This implementation must not be described as production-ready or fully CORE 1.0 compliant until the remaining contract requirements are closed and hosted staging E2E passes.

## Implementation delta — 2026-11-13 (feature branch only)

The following code was added on `feat/core-1.0-implementation` after the earlier baseline above:

- **Hexagonal boundaries:** added `src/ports/IDatabase.ts` and `src/ports/IAIProvider.ts`; AgentIdentity now uses the Cloudflare SQLite adapter through the database port.
- **AI isolation:** moved provider invocation to the separate Model Runner Worker entrypoint. The PEP Worker contains no `env.AI` access and calls a service binding named `MODEL_RUNNER`.
- **Signed permits:** SafetyInterlock's successful decision is converted into a short-lived Ed25519 permit, bound to tenant, agent, request, policy, model and canonical input digest. The runner verifies it and uses an SQLite-backed one-time token-ID guard.
- **Violation evidence:** rejected/missing/invalid permits and replay rejections can produce an Ed25519-signed JSON violation report if the Model Runner has its report-signing key configured.
- **Merkle batching:** added deterministic domain-separated Merkle roots, inclusion proofs and a batch coordinator. The coordinator is in-memory and requires an external durable queue/store, scheduler and anchor adapter before production use.
- **Unit tests:** added Vitest unit tests for permits, Merkle batching/proofs, violation signatures and adapters; the existing architecture and SafetyInterlock integration tests were updated for the separate Model Runner path.

### Explicit integration and validation gaps

- No `wrangler.jsonc`, Cloudflare account setting, secret, binding, deployment or production resource was changed. Consequently, `MODEL_RUNNER`, `PERMIT_REPLAY_GUARD`, permit signing/verification keys and violation-report signing keys still require controlled configuration in a future, explicitly authorized deployment phase. The runner fails closed if required bindings/keys are absent.
- The separate Model Runner Worker and its replay-guard Durable Object have source code but are not deployed or connected to a hosted service binding.
- The Merkle batch coordinator does not yet persist pending batches across process restarts, schedule periodic flushes, submit Bitcoin/OpenTimestamps transactions or verify external anchor receipts.
- Violation reports are signed by the isolated Model Runner's configured report key. The report records an unverified caller when permit validation fails; it does not claim cryptographic attribution to an agent whose identity has not been authenticated.
- These code changes were not executed in the assistant's local container; the private repository could not be cloned there. However, GitHub Actions completed the repository's `npm test` command successfully on 2026-11-13 for commit `12f54fd327c72183f2e5ffc8137375b0a6e87a90` (workflow run #89). The run executed the Node test suite (6/6), architecture checks (3/3), Vitest unit tests (6/6), and Miniflare/Vitest integration tests (16/16): **31 tests passed, 0 failed**. The workflow installed dependencies using `npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps`, not `npm ci`. This is CI evidence for the tested feature-branch commit, not a claim that tests were run on the user's machine or that hosted Cloudflare/production behavior was validated.

These changes are implementation work in an isolated feature branch, not production deployment, independent certification, proof of network-level isolation, or evidence of hosted end-to-end behavior.



### GitHub Actions validation — 2026-11-13

- **Result:** PASS — workflow run [#89](https://github.com/adminastonpay-blip/aston-trust-infrastructure/actions/runs/43380632706).
- **Tested commit:** `12f54fd327c72183f2e5ffc8137375b0a6e87a90` on `feat/core-1.0-implementation`.
- **Observed counts:** Node tests 6/6; architecture checks 3/3; Vitest unit tests 6/6; Miniflare/Vitest integration tests 16/16. Total: **31 passed, 0 failed**.
- The integration suite includes the authorized Model Runner call, independent staging invocation-ledger increment, replay rejection, wrong-model denial, and post-revocation denial.
- The workflow step was `npm test`; dependency installation used `npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps`. It did not run `npm ci`.
- This result validates the tested code under GitHub Actions' local test runtime only. It is not a hosted Cloudflare E2E test, deployment, production certification, or approval to resume the paused Cloudflare phases.
