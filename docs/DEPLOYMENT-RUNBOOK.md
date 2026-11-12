# CORE 1.0 — Cloudflare Deployment Runbook

**Status:** staging-only deployment procedure; not an authorization to deploy.  
**Target:** a new, isolated Cloudflare Worker named `aston-core-1-0-staging`.  
**Production:** explicitly out of scope. Do not change production Workers, routes, zones, Durable Object namespaces, secrets, D1, R2, or bindings.

## 0. Preconditions and stop conditions

Do not start a deployment until all of the following are true:

- The exact branch HEAD has a completed, green GitHub Actions run for `.github/workflows/core-1.0-tests.yml`. Verify the run's `head_sha` equals the branch HEAD; an earlier green run is not sufficient.
- Security review has accepted the implementation and the documented test limitations.
- A dedicated non-production Cloudflare account or explicitly isolated staging account is selected. If the same account must be used, the staging Worker name, hostname, Access application, mTLS policy, secrets, and Durable Object namespace must be separate from production.
- A rollback owner and an operator with Cloudflare permission to deploy Workers and create Durable Object namespaces are present.
- The account's plan and zone support the selected inbound mTLS architecture. If not, stop and design an approved private Service Binding or alternative ingress; do not silently disable mTLS.
- A staging hostname is available and is not a production hostname.

**Important implementation limits:** this repository is a reference implementation. The current Worker now includes Access-protected agent registration/revocation and an mTLS-protected model inference route through the SafetyInterlock and ModelRunner. The model route is still a reference implementation: agent proof-of-possession, identity/policy signature verification, global tenant emergency deny, human approval, non-lifetime budget periods, provider cost reconciliation, and durable distributed PEP revocation remain incomplete. Do not represent these functions as production-ready.

## 1. Confirm repository and branch

From a clean checkout:

```bash
git clone https://github.com/adminastonpay-blip/aston-trust-infrastructure.git
cd aston-trust-infrastructure
git fetch origin
git checkout feat/core-1.0-implementation
git pull --ff-only origin feat/core-1.0-implementation
git status --short
git rev-parse HEAD
```

Confirm the output branch is `feat/core-1.0-implementation`, the working tree is clean, and record the full HEAD SHA in the deployment record. Do not checkout, merge, or push to `main`.

## 2. Local prerequisites and test gate

Required Node.js: 22 or newer. Use the repository's declared dependencies and lockfile if one exists; do not upgrade packages as part of deployment preparation.

```bash
node --version
npm --version
npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps
npm test
```

Expected test scripts are `test:core`, `test:architecture`, and `test:integration`. The architecture test scans every runtime `.mjs` file under `src/` and permits the direct Workers AI binding invocation only in `src/core/model-runner.mjs`. A successful local run supplements, but does not replace, the matching GitHub Actions run. Save the command output and test counts.

Check the Cloudflare CLI before proceeding:

```bash
npx wrangler --version
npx wrangler whoami
```

If Wrangler is not available or the authenticated account is not the approved staging account, stop. Do not install an unpinned CLI or switch accounts during the change window without review.

## 3. Review the deployment configuration

The checked-in `wrangler.jsonc` currently declares:

- Worker entry point: `src/worker/index.mjs`.
- Durable Object binding: `AGENT_IDENTITY` → class `AgentIdentity`.
- Durable Object binding: `STAGING_INVOCATION_LEDGER` → class `StagingInvocationLedger`.
- SQLite-backed migrations: `core-1.0-sqlite-v1` (`AgentIdentity`) and `core-1.0-staging-ledger-v2` (`StagingInvocationLedger`).
- Default administrator role variable: `ACCESS_ADMIN_ROLE=aston-admin`.

The file's Worker name is a local reference name. The staging deploy command below overrides it with `aston-core-1-0-staging`; do not edit the checked-in config to point at a production Worker.

Before deployment, review the current Wrangler documentation and account capabilities for SQLite-backed Durable Objects and migration syntax. Do not rename the DO class or alter an already-applied migration tag. A future schema change must use a new, reviewed migration tag.

## 4. Configure staging-only identity and PEP settings

Authenticate only after confirming the intended account:

```bash
npx wrangler whoami
```

Set the staging Access values using the Cloudflare dashboard or Wrangler secrets. Never commit real values to Git, paste them into CI logs, or reuse production values:

```bash
npx wrangler secret put ACCESS_ISSUER --name aston-core-1-0-staging
npx wrangler secret put ACCESS_AUD --name aston-core-1-0-staging
npx wrangler secret put ACCESS_JWKS_URL --name aston-core-1-0-staging
npx wrangler secret put ACCESS_TENANT_ID --name aston-core-1-0-staging
```

Configure `PEP_CERT_ALLOWLIST` as a JSON array containing only the staging certificate fingerprint, exact RFC2253 issuer and subject, staging `servicePrincipalId`, staging `organizationId`, and least-privilege `permittedActions` (include `model` only for the dedicated inference test principal). Configure `PEP_REVOKED_PRINCIPALS` as a JSON array (initially `[]`) through the approved staging secret/configuration process. These are configuration examples, not credentials:

```bash
npx wrangler secret put PEP_CERT_ALLOWLIST --name aston-core-1-0-staging
npx wrangler secret put PEP_REVOKED_PRINCIPALS --name aston-core-1-0-staging
```

Do not use test JWKS fixtures, local RSA keys, synthetic TLS metadata, production certificates, or broad wildcard allowlists. The current Worker code reads these settings from its runtime environment. Confirm how the selected Wrangler version exposes secrets as Worker bindings before deploying.

The checked-in config sets `ACCESS_ADMIN_ROLE` to `aston-admin`. Keep that role narrow and enforce the same role in the Cloudflare Access application policy.

Set `MODEL_INVOCATION_COST_MINOR` as a positive integer staging variable representing the fixed internal budget debit per model invocation; it is not actual provider billing. For the isolated E2E window only, set `STAGING_HARNESS_ENABLED=true` and configure `STAGING_HARNESS_TOKEN` as a staging secret. Keep the harness disabled outside that window. Model execution fails closed if the fixed debit is absent or invalid.

## 5. Configure staging ingress before exposing the Worker

1. Create a dedicated staging Cloudflare Access application for the staging hostname. Restrict it to named administrators and the intended staging tenant.
2. Ensure the Worker validates the Access JWT on every administrative route; test missing, expired, wrong-audience, wrong-issuer, bad-signature, wrong-role, and wrong-tenant cases.
3. Configure inbound mTLS for the PEP hostname using a supported Cloudflare certificate-validation setup. Pin the staging client certificate by SHA-256 fingerprint and exact issuer/subject mapping in `PEP_CERT_ALLOWLIST`.
4. Verify the Worker receives Cloudflare's trusted `request.cf.tlsClientAuth` metadata. Do not forward or trust caller-supplied certificate headers.
5. Do not attach a production hostname, route, DNS record, Access application, or certificate policy.

If mTLS cannot be enabled and verified on the chosen staging hostname, do not expose the PEP endpoints publicly. A Service Binding alternative requires a separately reviewed private target Worker; it is not configured by the current `wrangler.jsonc`.

## 6. Dry run and staging deployment

First inspect the planned upload:

```bash
npx wrangler deploy --config wrangler.jsonc --name aston-core-1-0-staging --dry-run
```

Review the output for the expected entry point, DO binding/class, and migration. If the command proposes an unexpected Worker, route, environment, or resource change, stop.

Only after explicit staging change approval:

```bash
npx wrangler deploy --config wrangler.jsonc --name aston-core-1-0-staging
```

This command targets the isolated staging Worker name. It is not a production deployment command. Record the Wrangler output, deployment version, timestamp, account, and commit SHA. Do not add a custom route unless the staging hostname and security controls have been separately approved.

## 7. Staging smoke and negative tests

Use only synthetic staging identities and certificates. Never use real customer or production data.

- `GET /healthz` returns the reference service health response. This endpoint does **not** prove that the DO, Access, mTLS, or authorization dependencies are healthy.
- Administrative revoke without a valid Access JWT must return `401`; an authenticated principal without the required role must return `403`.
- `POST /v1/admin/agents/:agentId/register` requires a valid Access administrator JWT and registers the identity plus policy grant in the agent DO; `POST /v1/admin/agents/:agentId/revoke` revokes it.
- `POST /v1/pep/agents/:agentId/model` requires a verified mTLS PEP principal with explicit `permittedActions: ["model"]`, a registered active agent, an active matching policy grant, exact `ai.inference` action and exact model resource, available grant-lifetime budget, invocation quota, and concurrency capacity.
- PEP requests without a client certificate must return `401`; invalid, expired, revoked, or unpinned certificates must return `403`.
- A PEP with a revoked service principal must be denied before the Durable Object is called.
- A model request with a policy-denied action/resource must return `403` and the independent staging invocation ledger must remain `0`.
- A model request with an authorized policy must reach the single ModelRunner adapter; the independent staging ledger must record exactly `1` before `env.AI.run()`.
- Cross-tenant attempts against a known staging DO must return `403` without changing its state.
- Storage/runtime failure must deny with `503`; do not retry a protected action automatically.
- Verify that no test path can reach a production model, payment, customer record, or external side effect.

Capture sanitized request/response metadata, correlation IDs, timestamps, relevant Worker logs, and test results. Redact JWTs, private keys, certificate private material, and secrets.

## 8. Rollback and recovery

- If a staging deploy fails, stop traffic to the staging hostname and disable the staging route/hostname or Access application as appropriate.
- Use Wrangler's deployment history to identify the last known-good **staging** version. Roll back only the staging Worker, following the currently documented Wrangler rollback procedure and reviewing any migration implications first.
- A Durable Object migration or SQLite state change may not be safely reversible by rolling back Worker code alone. Never delete or recreate a namespace as an improvised rollback.
- If SQLite state is corrupt or uncertain, keep the affected object fail-closed. Preserve evidence, identify the last trusted backup/recovery point, reconcile uncertain idempotency keys and writes, and require operator approval before restoring data or replacing an instance.
- Do not replay queued operations automatically after recovery. Require fresh authorization for each new action.
- If any production resource was changed unexpectedly, stop and invoke the organization's incident/change process; do not attempt ad hoc cleanup.

## 9. Exit criteria

Staging deployment may be marked technically accepted only after:

- the exact deployed commit is recorded and matches the reviewed branch HEAD;
- all CI and staging negative/positive tests are green;
- Access and real inbound mTLS have been validated on the staging hostname;
- tenant isolation, PEP revocation propagation, SQLite failure/recovery, and audit evidence have passed the separately approved E2E plan;
- logs contain no secrets and no protected side effect occurred on a denied request;
- rollback/recovery steps have been rehearsed or explicitly accepted as residual risk;
- a separate production-readiness review and explicit production deployment authorization are recorded.

**A green CI run or a successful staging deploy is not, by itself, production approval.**
