# ASTON OS 15.5 — Adversarial Validation Plan, Pass 1

**Status:** SOURCE-OBSERVED / TEST PLAN ONLY  
**Repository inspected:** `adminastonpay-blip/agente-OS-15.5-hector-zapata`, default branch at inspection time  
**Inspection date:** 2026-11-17  
**Application changes:** NONE  
**Runtime tests executed:** NONE  
**Production / Cloudflare changes:** NONE

## 1. Scope and evidence boundary

This document records a focused source trace to turn previously identified authorization and SafetyInterlock concerns into reproducible tests. It does not claim that any finding is exploitable, tested, validated, or present in production.

Evidence labels:
- **OBSERVED:** visible in source at the listed blob SHA.
- **TESTED:** a reproducible test has executed and its result is recorded.
- **VALIDATED:** independent/adversarial evidence confirms the behavior.
- **NOT VERIFIED:** required evidence is not available.

## 2. Inspected source and immutable blob references

| File | Blob SHA |
|---|---|
| `src/access/access.ts` | `b7ad374a839195e34b275c619bbc988f89e0b5cc` |
| `src/agents/governed.ts` | `1e2f524760ca49e77d78bedc0e74913595d6cfc9` |
| `src/do/agent-node.ts` | `7cefa5fc7f49c8640324d2f4f29fca060c9d08a8` |
| `src/do/safety-interlock.ts` | `25cdd4345b520582b675c187bf1314daf510dbe8` |
| `package.json` | `ffb5fa16b4cb28808a835949edc1b44f65c59f10` |

Existing test commands declared in `package.json`:
- `npm run test:safety`
- `npm run test:security`

Existing tests inspected:
- `tests/security-interlock-routing.test.mts`
- `tests/mission-brain-safety.test.mts`

These tests use source-text assertions for the inspected cases. They are useful regression checks, but do not by themselves demonstrate runtime authorization behavior.

## 3. Trace findings

### AUTHZ-REQAPP-001 — HIGH, source-observed; runtime behavior not tested

`AccessEffect` includes `allow`, `deny`, and `require_approval` in `src/access/access.ts`.

The following callers visibly reject only `effect === "deny"`:
- `secureReadObjects()` in `src/access/access.ts`.
- Plan creation, approval, and execution paths in `src/agents/governed.ts`.
- Per-action authorization in `executePlan()` in `src/agents/governed.ts`.

Important qualification: plan creation currently assigns `pending_approval` in the inspected branch for both risk approval and non-risk-approval outcomes. Therefore the strongest direct test targets are **secure reads, plan approval, plan execution, and per-action authorization**, not an assumption that plan creation immediately executes.

**Required invariant:** an authorization result of `require_approval` must never be treated as `allow`. It must stop the protected operation until an independently authenticated approval is recorded and checked for the same tenant, actor, resource, action, and decision context.

### INTERLOCK-STATUS-001 — HIGH, source-observed; exploitability not established

In `AgentNode`, each tool call explicitly handles `denied` and `pending_approval`, then reaches `runTool()` for any other returned status. The response JSON is cast to a TypeScript union but is not runtime schema-validated.

The planning and synthesis paths already require exact `allowed` through `status !== "allowed"`. The per-tool path should enforce the same invariant.

**Required invariant:** only a validated response whose status is exactly `allowed` may reach `runTool()`. Unknown, missing, malformed, or unexpected status values must fail closed.

### INTERLOCK-UNAVAILABLE-001 — CRITICAL (maximum severity), source-observed; runtime behavior not tested

This finding tests whether loss of the authorization dependency can become authorization. A timeout, rejected fetch/exception, missing Durable Object binding or stub, absent response, or incompatible response contract must never result in a protected tool being invoked.

Three distinct response classes are mandatory:
1. **Unexpected response:** HTTP success with unknown status, malformed/missing status, or incompatible contract/version. Only a validated, explicitly supported `allowed` decision may proceed.
2. **Absent response:** missing DO binding, rejected/throwing fetch, non-success response, empty body, or invalid JSON. The action must be denied and the route must not continue to the tool.
3. **Delayed response:** response does not arrive within a defined bounded deadline. The caller must terminate fail-closed; a late `allowed` response must not resurrect or execute the expired request.

A timeout must be a bounded behavior, not merely a test-runner timeout. The inspected `AgentNode.safetyCheck()` awaits the DO fetch without an explicit deadline. That is a source observation, not yet proof of fail-open behavior. If the route waits indefinitely, this is an availability/control-liveness defect; if a delayed or mismatched response leads to tool invocation, it is an authorization bypass and a critical finding. Do not equate DoS with authorization without an execution trace proving that transition.

**Required invariant:** no interlock response, no valid response contract, no explicit `allowed` decision, or expired decision deadline means no tool execution.

### TEST-COVERAGE-001 — MEDIUM, observed test-design gap

The existing inspected SafetyInterlock tests assert source patterns and gate presence. They do not currently establish that an unexpected 2xx JSON status prevents tool invocation, or that `require_approval` prevents each protected data/action path.

## 4. Adversarial test matrix (synthetic fixtures only)

| ID | Attack / fixture | Expected result | Evidence required |
|---|---|---|---|
| ADV-AUTH-01 | Access policy returns `require_approval` for secure read | No object rows or restricted properties returned | Runtime test with DB fixture |
| ADV-AUTH-02 | Access policy returns `require_approval` for plan approval | Approval mutation rejected or held pending; no approved state | Runtime test and DB state assertion |
| ADV-AUTH-03 | Access policy returns `require_approval` for plan execution | No transition to executing; no action result written | Runtime test and DB state assertion |
| ADV-AUTH-04 | Per-action access returns `require_approval` | Action marked blocked/pending; no action side effect | Runtime test and action fixture |
| ADV-AUTH-05 | Approval comes from another tenant or wrong resource/action | Approval rejected | Cross-tenant and context-binding tests |
| ADV-INT-01 | SafetyInterlock returns HTTP 200 with status `unknown` | Tool not invoked; request fails closed | Spy asserting runTool invocation count is zero |
| ADV-INT-02 | HTTP 200 with missing/null/non-string status | Tool not invoked; fail closed | Runtime test |
| ADV-INT-03 | HTTP 200 with malformed JSON | Tool not invoked; fail closed | Runtime test |
| ADV-INT-04 | SafetyInterlock unavailable / non-2xx / throw | Tool not invoked; fail closed | Runtime test |
| ADV-UNAV-01 | Missing DO binding or rejected/throwing fetch | Deny before planning/tool execution | Real AgentNode.fetch route trace |
| ADV-UNAV-02 | Empty response / invalid JSON / non-2xx | Deny; no tool invocation | Real AgentNode.fetch route trace |
| ADV-UNAV-03 | Delayed response beyond bounded deadline | Return fail-closed; late allow cannot resume request | Deadline and late-response trace |
| ADV-UNAV-04 | Response contract/version mismatch | Deny; no tool invocation | Versioned contract fixture and route trace |
| ADV-TEN-01 | First-level tenant is A, nested referenced resource resolves to tenant B | Reject nested resource; no disclosure or action | Resource-resolution trace with both tenant IDs |
| ADV-TEN-02 | Cryptographically valid token belongs to prior tenant or archived tenant | Reject stale/archived tenant context | JWT verification plus tenant lifecycle lookup trace |
| ADV-TEN-03 | Same resource ID exists under two tenants | Resolve only by composite tenant + resource identity | Colliding-ID fixture and DB query trace |
| ADV-AUTH-06 | Sensitive read requires approval; operational read is explicitly allowed | Sensitive read blocked pending approval; operational read succeeds | Paired real-route tests with policy and row/result trace |
| ADV-AUTH-07 | Operational read positive control | Authorized operational data returned | Positive control, exact policy and query trace |
| ADV-EVID-01 | Approval/audit evidence missing or invalid | No silent continuation or execution | Runtime test plus persisted-state assertions |

All fixtures must be synthetic and isolated. No live credentials, real tenants, external services, production bindings, or Cloudflare deployment are permitted.

## 5. Execution order

1. INTERLOCK-UNAVAILABLE-001 (unexpected, absent, delayed response and contract mismatch).
2. INTERLOCK-STATUS-001.
3. AUTHZ-REQAPP-001, including paired sensitive-read block and operational-read allow controls.
4. Tenant nested-resource test.
5. Stale/archived tenant-context test.
6. Tenant-scoped resource-ID collision test.
7. Add tests and traces only on `test/adversarial-pass-1`, created from the exact unpatched `main` snapshot; do not edit application source in this pass.
8. Each case must exercise the actual request/router path, record policy + input context + state transition + action invocation count, and include a legitimate positive control where blocking is expected.
9. Record exact command, commit SHA, output, exit status and full trace. A failed test without a complete trace is `BLOCKED BY FIXTURE`, not a confirmed vulnerability.
10. Do not merge or deploy without explicit authorization and completion of the Stage 0 governance gate.

## 6. Current disposition

- INTERLOCK-UNAVAILABLE-001: **OBSERVED / NOT TESTED / OPEN / CRITICAL**
- AUTHZ-REQAPP-001: **OBSERVED / NOT TESTED / OPEN**
- INTERLOCK-STATUS-001: **OBSERVED / NOT TESTED / OPEN**
- TEST-COVERAGE-001: **OBSERVED / OPEN**
- Production impact: **NOT VERIFIED**
- Exploitability: **NOT VERIFIED**
- Main / production / Cloudflare: **UNCHANGED**


## 7. Required per-test trace and verdict format

Every executed case must report:
- Scenario and immutable base commit.
- Exact route/request and synthetic identity/tenant/resource context.
- Policy ID/version/effect evaluated (or explicit evidence that policy evaluation was not reached).
- Interlock contract/version and response class.
- State-machine branch taken and decision reason.
- Whether planning, tool execution, data read, mutation, or side effect was invoked (with counters).
- Expected and observed result.
- Positive-control result where applicable.
- Exact command, workflow run URL, exit status, and log/trace reference.
- Verdict: **CONFIRMED** only with a trace proving bypass; **NOT REPRODUCED** only when the intended route and policy were reached and blocked; **BLOCKED BY FIXTURE** if the test did not reach the required route/policy/state.

No verdict may be inferred from a green/red test badge alone.
