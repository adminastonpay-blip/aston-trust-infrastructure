# ASTON — LOCAL PROOF DEMO (VERIFIED WORKER PATH)
**Purpose:** offline/local preparation for a repeatable ASTON staging audit demonstration. This document distinguishes an audit observation from a proven prompt-injection block.  
**Executable repository:** `adminastonpay-blip/agente-OS-15.5-hector-zapata`  
**Worker branch inspected:** `feat/audit-staging-harness-21x`  
**Inspected Worker version:** `21.6.3-cf-audit`  
**Documentation branch:** `docs/legal-brief-local-proof-demo` in `aston-trust-infrastructure`.

## 1. Correct source locations (verified)
- Worker entry point: `src/index.ts`
- Safety Durable Object: `src/do/safety-interlock.ts`
- Policy engine: `src/safety/policy.ts`
- Staging audit endpoint: `src/audit/staging-endpoint.ts`
- Staging route allowlist: `src/audit/staging-route-guard.ts`
- Cloudflare/Miniflare-compatible Worker config: `wrangler.toml`
- Package scripts: `package.json`

The Worker exports `SafetyInterlock` and binds `SAFETY` to that Durable Object in `wrangler.toml`. The DO evaluates proposed tool actions, logs decisions in SQLite, maintains an append-only hash-chained audit table, and supports optional external checkpoint verification when the required bindings exist.

The branch `feat/core-1.0-implementation` supplied in the task could not be resolved by GitHub at review time: fetching its files returned **“No commit found for the ref”** and branch search did not return it. Its harness and SQLite counter are therefore **not verified**. Obtain the branch's current commit SHA or restore the ref before adding those components to the demo.

## 2. Critical behavior of `POST /v1/audit-target`
The inspected implementation in `src/audit/staging-endpoint.ts` does the following:
1. Allows only POST and only when `AUDIT_ENABLED=true`, `DEPLOY_PROFILE` contains `staging`, `AUDIT_SECRET` is at least 32 characters, and `SAFETY` + `AI` bindings exist.
2. Authenticates `x-audit-token` against `AUDIT_SECRET`.
3. Validates `schema_version=aston.audit.request.v1`, a unique-format `run_id`, `test_case_id`, and a payload containing only a `message`.
4. Claims the run/case in the SafetyInterlock SQLite table (replay returns 409).
5. Performs a separate SafetyInterlock preflight for the fixed action `audit_chat_observation`.
6. Calls the existing chat handler with at most one model invocation and disables session, D1, queues, R2 journal, Vectorize and Hyperdrive bindings for that call.
7. Returns `aston.audit.observation.v1` containing the chat observation and control-coverage metadata.

**It is not a semantic prompt-injection classifier.** The response explicitly labels input protection as `policy_gate_not_semantic_input_classifier`, sets `tool_execution: not_invoked`, and `verdict: evaluator_required`. A `PROMPT_INJ_01` text payload is passed to chat for observation; the message text itself does not change the fixed preflight action. If chat succeeds, the audit endpoint returns HTTP 200, not an automatic 403. A 403 is returned only if that fixed SafetyInterlock preflight does not return `allowed`. Do not describe that preflight 403 as proof that the prompt-injection attack was detected or blocked.

Separately, `CHAT_SAFETY_ENFORCED=true` plus a staging profile enables `handleChat` to evaluate the fixed `chat_completion` action through SafetyInterlock. The inspected policy engine evaluates tool/action risk, clearance and roles; the output guard detects credential-like patterns. The source explicitly says this input gate is not a semantic prompt-injection classifier. Do not claim semantic PROMPT_INJ_01 protection without a test and implementation that demonstrate it.

## 3. Commands verified from `package.json`
From the Worker repository, on `feat/audit-staging-harness-21x`:

```bash
node --version
npm --version
npm install
npm run check
npm run test:safety
npm run test:security
```

The package defines:
- `dev`: `wrangler dev`
- `deploy`: `wrangler deploy` (do not run for this offline demo)
- `check`: `tsc --noEmit`
- `test:safety`: `node --experimental-strip-types --test tests/chat-output-guard.test.mts`
- `test:security`: the chat output guard, MVSP security, request guard, tenant auth, audit-chain and audit-anchor test files.

The inspected `package.json` does **not** declare Miniflare as a direct devDependency and does not expose a `test:integration` script. Wrangler's local dev mode uses its local runtime, but that alone is not evidence that the requested PROMPT_INJ_01 E2E test exists or that the AI binding works fully offline. Record actual command output, Node/npm/Wrangler versions and commit SHA; do not invent a test count.

## 4. Why the requested 403 demo script is not yet safe to author
The source currently available proves a staging audit-observation route and a policy engine; it does not prove that `PROMPT_INJ_01` is rejected with HTTP 403. In particular:
- the audit route's policy preflight evaluates a fixed low-impact observation action, not the semantic content of the attack prompt;
- the chat input gate is documented in code as not being a semantic classifier;
- the chat observation is intentionally non-tool-executing (`tool_execution: not_invoked`);
- the second branch `feat/core-1.0-implementation` containing the claimed instrumentation/SQLite counter could not be fetched.

A script that hardcodes 403, converts an arbitrary `denied` JSON field into a claimed production 403, or writes a fabricated “blocked” evidence record would misrepresent the system. Therefore **no attack-blocking script or success JSON is included yet**.

## 5. Acceptance criteria before adding `scripts/run-local-proof-demo.sh`
Provide the immutable commit SHA or restore `feat/core-1.0-implementation`, then verify:
- the exact Miniflare harness entry point and local binding definitions;
- the test named/identified `PROMPT_INJ_01`, including its payload and expected response;
- the exact source path that classifies/blocks that payload and the point where the protected action is prevented;
- whether expected HTTP 403 is emitted by the real Worker route or only by a test adapter;
- SQLite instrumentation schema/counter and evidence writer/verifier;
- an allow/control case proving the harness does not always deny.

Then write a script that invokes that actual Worker in Miniflare, asserts the true response, verifies no protected tool ran, writes JSON from the real response/evidence code and independently verifies it. Pin Miniflare/runtime versions. Keep the demo on a separate test branch and never deploy or edit production bindings/secrets.

## 6. Evidence file requirements (future acceptance contract)
The eventual `artifacts/local-proof-evidence.json` should include:
- schema/version and `demo_only: true`;
- repository, branch, commit SHA, runtime and test-run identifiers;
- case ID (`PROMPT_INJ_01`), request/decision ID and test tenant/agent;
- exact payload hash (not necessarily raw prompt), policy version and decision/reason;
- observed HTTP status from the real Worker;
- protected-tool invocation counter before/after;
- canonical manifest hash, signature algorithm/key ID and independent verification result;
- explicit statement that this is local Miniflare evidence, not Cloudflare production validation;
- no secrets or production credentials.

## 7. Non-negotiable presentation language
Until the above acceptance criteria pass, the accurate investor statement is: “ASTON has a staging-only authenticated audit-observation endpoint and a SafetyInterlock Durable Object with policy evaluation and append-only audit-chain logic. The PROMPT_INJ_01 semantic-blocking result and offline Miniflare 403 evidence are pending verification.” Do not claim a successful attack-blocking E2E or Bitcoin anchor based only on these files.
