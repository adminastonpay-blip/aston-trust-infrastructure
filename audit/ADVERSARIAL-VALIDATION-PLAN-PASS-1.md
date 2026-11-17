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
| ADV-EVID-01 | Approval/audit evidence missing or invalid | No silent continuation or execution | Runtime test plus persisted-state assertions |

All fixtures must be synthetic and isolated. No live credentials, real tenants, external services, production bindings, or Cloudflare deployment are permitted.

## 5. Execution order

1. Identify the repository's existing test harness and safe mock patterns.
2. Add tests first on a dedicated, isolated branch; do not edit application source in this pass.
3. Run the narrow tests and record exact command, commit SHA, output, and exit status.
4. If a test exposes a defect, prepare a separate remediation proposal/branch with minimal changes and regression tests.
5. Do not merge or deploy without explicit authorization and completion of the Stage 0 governance gate.

## 6. Current disposition

- AUTHZ-REQAPP-001: **OBSERVED / NOT TESTED / OPEN**
- INTERLOCK-STATUS-001: **OBSERVED / NOT TESTED / OPEN**
- TEST-COVERAGE-001: **OBSERVED / OPEN**
- Production impact: **NOT VERIFIED**
- Exploitability: **NOT VERIFIED**
- Main / production / Cloudflare: **UNCHANGED**
