# ASTON OS 15.5 — Adversarial Pass 1 Trace Report

**Status:** IN PROGRESS — no test run has yet been observed in GitHub Actions.  
**Test branch:** `test/adversarial-pass-1`  
**Unpatched base snapshot:** `main` at `077331484f0cbfae4a23139564000117510a6767`  
**Application source edits:** NONE.  
**Runtime / production / Cloudflare:** untouched.  
**Important:** this report deliberately does not infer outcomes from source inspection or from tests that have not run.

## Trace and verdict rules

A case can be **CONFIRMED** only when the actual route trace proves that an operation crossed a control that should have blocked it. A case is **NOT REPRODUCED** only when the route and intended policy were reached and the action was blocked. A case is **BLOCKED BY FIXTURE** when the required policy, resource resolver, tenant lifecycle source, route, or state transition was not reached. Until a CI run provides output and logs, the verdict is **NOT RUN**.

The current AgentNode tests exercise the actual `AgentNode.fetch(POST /execute)` route and its internal `safetyCheck()` routing. The SafetyInterlock Durable Object itself is represented by a synthetic DO stub. Therefore policy identifiers and policy decisions in these tests are **fixture policies**, not proof that the production policy engine evaluated them. This is intentionally disclosed and is not sufficient to close the user's full trace requirement.

## 1. INTERLOCK-UNAVAILABLE-001 (execution order 1)

| Case | Scenario | Expected | Observed | Trace | Verdict |
|---|---|---|---|---|---|
| UNAV-01 | Missing SAFETY DO binding | HTTP fail-closed; planning/tool not invoked | NOT RUN | Test emits route response, plan/tool counters, tenant/actor context. Policy evaluation is explicitly marked not reached. | NOT RUN |
| UNAV-02 | DO fetch throws (synthetic timeout/exception) after plan gate allow | Tool not invoked; fail-closed branch | NOT RUN | Test emits both DO requests, tool/tenant context, fixture policy ID, fetch-throw branch, response and counters. | NOT RUN |
| UNAV-03 | Tool decision arrives after 40 ms deadline | Bounded timeout returns fail-closed; late allow cannot resume request | NOT RUN | Test records deadline observation, pending state, late response and tool counter. | NOT RUN; current source has no explicit deadline in `safetyCheck()`, so this test is designed to expose an unbounded wait. |
| UNAV-04 | HTTP 200 with empty 204 body | JSON parse failure must deny; tool not invoked | NOT RUN | Test emits request context, absent-body branch, route result and counters. | NOT RUN |
| UNAV-05 | HTTP 200 with contract version 99 | Reject unsupported contract; no tool invocation | NOT RUN | Test emits fixture policy ID/version, response contract, route branch and counters. | NOT RUN |

**Scope limitation:** The current test file also includes unexpected-status and legitimate-allow controls, recorded under INTERLOCK-STATUS-001 below. A missing Durable Object binding is tested at the AgentNode route boundary; a rejected fetch is represented by a thrown synthetic stub error. Actual Cloudflare DO unavailability/transport timeout is not exercised.

## 2. INTERLOCK-STATUS-001 (execution order 2)

| Case | Scenario | Expected | Observed | Trace | Verdict |
|---|---|---|---|---|---|
| STATUS-01 | HTTP 200 with unknown status `mystery` | Tool not invoked | NOT RUN | Test emits fixture policy ID/effect, tenant/actor/tool, route branch, tool invocation counter. | NOT RUN |
| STATUS-02 | Explicit supported `allowed` response | Tool invoked once | NOT RUN | Positive control records fixture policy/version/effect and tool counter. | NOT RUN |

**Trace limitation:** the DO policy is synthetic. The route under test is real, but the production `SafetyInterlock.fetch('/evaluate')` and `evaluatePolicy()` are not yet part of the harness. Do not label the finding validated from these tests alone.

## 3. AUTHZ-REQAPP-001 (execution order 3)

| Case | Scenario | Expected | Observed | Trace | Verdict |
|---|---|---|---|---|---|
| AUTHZ-01 | Sensitive read with `require_approval` | No sensitive rows returned until matching human approval | NOT IMPLEMENTED | No routed D1 fixture and no complete request-to-policy trace added yet. | BLOCKED BY FIXTURE |
| AUTHZ-02 | Operational read with explicit `allow` | Operational data is returned | NOT IMPLEMENTED | Required positive control is not yet implemented. | BLOCKED BY FIXTURE |

The pair must be implemented together. Blocking every read is not an acceptable security result.

## 4. Tenant boundary cases (execution order 4)

| Case | Scenario | Expected | Observed | Trace | Verdict |
|---|---|---|---|---|---|
| TEN-01 | First-level tenant A, nested referenced resource resolves to tenant B | Reject reference; no disclosure/action | NOT IMPLEMENTED | Need identify and exercise the actual nested resource resolver and its DB lookup. | BLOCKED BY FIXTURE |
| TEN-02 | Validly signed token for prior/archived tenant | Reject stale/archived tenant context | NOT IMPLEMENTED | Need synthetic JWT signing/certificate fixture plus authoritative tenant lifecycle lookup. | BLOCKED BY FIXTURE |
| TEN-03 | Same resource ID exists in tenants A and B | Composite tenant+resource lookup returns only the caller tenant's object | NOT IMPLEMENTED | Need route and D1 fixture proving resource ID is not resolved globally. | BLOCKED BY FIXTURE |

A URL-only tenant substitution test is not a substitute for any of these three cases.

## 5. Governance GOV-001

The Stage 0 planning record now labels organization/effective branch rulesets as a **temporarily accepted governance risk**, with accountable owner `adminastonpay-blip`, review date **2026-11-24**, and compensating restrictions. This is not a branch-protection validation and does not authorize merging, production deployment, Cloudflare changes, secret changes, or release changes.

## 6. Closure gate

This pass is not complete until:
1. GitHub Actions executes the new route tests against this unpatched branch snapshot and the exact run URL, commit SHA, exit status and diagnostic output are recorded.
2. The delayed-response case demonstrates a bounded fail-closed result; a test-runner deadline alone does not count as an application timeout.
3. AUTHZ sensitive-read block and operational-read positive control are both implemented and traced.
4. All three tenant cases are implemented against the actual resource/tenant resolution path, or individually recorded as blocked by a specific missing source fixture with the evidence showing why.
5. Every verdict includes a readable trace; no test badge alone closes a finding.

No vulnerability is confirmed in this report. No remediation code is included.
