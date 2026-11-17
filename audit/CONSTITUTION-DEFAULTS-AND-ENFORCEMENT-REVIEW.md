<!--
SPDX-FileCopyrightText: 2026 Aston OS
SPDX-License-Identifier: LicenseRef-ASTON-Proprietary
-->

# Agent Constitution Defaults and Enforcement Review

**Review ID:** ATI-CONST-001  
**Review date:** 2026-11-17  
**Repository:** `aston-trust-infrastructure`  
**Scope:** `src/constitution.ts`, `tests/constitution.test.mjs`, `spec/ASTON-IDENTITY-TENANT-AUTHORITY-CONTRACT.md`  
**Change class:** Read-only source review and documentation; no runtime changes  
**Status:** FINDINGS RECORDED — REMEDIATION NOT IMPLEMENTED / NOT VALIDATED

## 1. Executive finding

The reference constitution helper currently combines broad default permissions with incomplete enforcement. In particular:

1. The default constitution allows `execute` and any model through the wildcard `*`.
2. A decision requiring human approval is returned with `allowed: true`; the function exposes `require_human: true` but does not itself enforce an approval gate.
3. `max_frequency_per_hour` is declared and defaulted but is not evaluated by `evaluateConstitution`.
4. The evaluator does not bind the request to an authenticated principal, authoritative tenant membership/lifecycle version, delegated grant, purpose, or resource ownership.
5. The existing test file reimplements a reduced evaluator instead of importing or exercising the implementation in `src/constitution.ts`.

These are code-level findings in a reference prototype. The repository describes itself as an architectural draft/reference prototype. This review does not establish that the helper is used by a production runtime or that any production system is exposed.

**Risk statement:** If this helper or its defaults are used as an enforcement boundary, it is insufficient as a standalone authorization control. It must not be represented as production-grade authorization.

## 2. Evidence reviewed

### 2.1 Default permissions

In `src/constitution.ts`, `defaultConstitution()` sets:

- `allowed_actions`: `read`, `analyze`, `create`, `update`, `execute`;
- `denied_actions`: `delete`, `wire_transfer`, `export_all`;
- `models_allowed`: `["*"]`;
- `expires_at`: `null`;
- `revoked`: `false`.

The returned object also spreads `overrides` last, allowing the caller to replace any default field. This is a constructor, not a verified policy issuance flow.

**Finding CONST-01 — Broad default authority**  
**Severity:** HIGH if defaults are used to authorize real agents; otherwise DESIGN RISK.  
A new constitution is permissive by default, including execution and wildcard model selection. Least privilege should be explicit at policy issuance. No production use was established in this review.

### 2.2 Human approval is advisory in the evaluator

The evaluator calculates:

```ts
require_human: exp >= c.require_human_above_usd
```

but independently calculates:

```ts
allowed: reasons.length === 0
```

There is no approval proof, approval state, approver identity, approval expiry, or binding of approval to a specific tenant, principal, action, resource, and policy version in this function.

**Finding CONST-02 — Approval threshold does not enforce a gate**  
**Severity:** HIGH if downstream code treats `allowed` as permission to execute.  
A caller that checks only `allowed` could proceed even when `require_human` is true. The function must not be treated as enforcing human approval. A future contract must distinguish `policy_eligible`, `approval_required`, `approval_satisfied`, and final `permit`/deny.

### 2.3 Declared frequency limit is not enforced

`max_frequency_per_hour` is part of `AgentConstitution` and defaults to 60. No frequency input or rolling-window counter is accepted by `evaluateConstitution`, and no frequency check occurs.

**Finding CONST-03 — Unenforced frequency limit**  
**Severity:** MEDIUM if operators rely on this field as a live rate limit.  
The field currently expresses configuration data, not an enforced control. A real limiter requires a trusted counter/store, atomic updates, a defined time window, and failure semantics.

### 2.4 Missing authority and scope binding

The evaluator accepts an `AgentConstitution` and an input containing action, object type, optional exposure/cost/model/call count. It does not validate:

- authenticated principal identity;
- requested tenant equals an authoritative membership binding;
- tenant lifecycle status and monotonic lifecycle version;
- credential and membership status/expiry;
- delegated grant identity, expiry, revocation, or attenuation;
- purpose and resource ownership;
- policy version freshness;
- approval evidence.

This is consistent with the newly merged Identity & Tenant Authority Contract's boundary: an agent constitution is not itself a tenant authority, credential verifier, or proof of membership.

**Finding CONST-04 — Constitution is not an identity or delegation verifier**  
**Severity:** HIGH if it is used as a complete authorization boundary.  
The evaluator may be a policy subroutine only after trusted identity, tenant, lifecycle, delegation, and resource context have been established elsewhere.

### 2.5 Tests do not exercise the implementation

`tests/constitution.test.mjs` defines its own local `evaluate()` function with a subset of the logic. It does not import `src/constitution.ts`, and it tests only an allowed action, a denied action, and over-exposure.

The tests therefore cannot detect regressions in the actual TypeScript implementation, including the human-approval behavior, wildcard model behavior, expiry/revocation behavior, call budget, cost limit, or frequency omission.

**Finding CONST-05 — Test/implementation disconnect**  
**Severity:** HIGH for confidence in this module's test evidence.  
The current three passing tests, if run, would validate the local test helper rather than the production source function. They must not be cited as proof that `src/constitution.ts` is tested.

## 3. Required remediation sequence

Do not make a quick patch that merely changes the default arrays. First define the authorization boundary and its caller contract.

### Phase A — Contract and ownership

- Identify every caller of `defaultConstitution` and `evaluateConstitution` across the four ASTON repositories.
- Establish whether this helper is reference-only, imported by runtime code, or used in another enforcement path.
- Ratify the Identity & Tenant Authority Contract and determine the authoritative source for principal, tenant, lifecycle, and membership.
- Define whether `require_human` is a hard permit gate and specify the cryptographically/auditably bound approval object.
- Define whether the frequency field is intended to be an enforced rate limit or should be removed/renamed as descriptive metadata.

### Phase B — Test the actual source

- Add a supported TypeScript test/build path or a deliberate source-compatible module boundary.
- Import the actual implementation from tests; remove duplicated evaluator logic.
- Cover all fields and boundaries, including expiry, revocation, action allow/deny, model restrictions, cost, exposure, call budget, frequency, and approval gating.
- Add adversarial tests for tenant mismatch, stale lifecycle/binding versions, revoked delegation, and untrusted caller-supplied identity.
- Assert that a denied or approval-pending decision causes zero protected side effects in the actual caller path.

### Phase C — Harden implementation

Only after the caller inventory and authority contract are resolved:

- Replace permissive defaults with deny-by-default or require an explicitly supplied, validated policy.
- Do not use wildcard model/action permissions for customer-facing or high-risk agents without an explicit, versioned policy decision.
- Make approval-pending a non-executable outcome; only a separately verified approval can produce a final permit.
- Enforce rate limits using an atomic trusted counter, not an untrusted caller-supplied number.
- Bind every decision to authenticated principal, tenant lifecycle/binding versions, policy version, resource, action, and grant.
- Fail closed on missing, stale, malformed, or unavailable mandatory context.

## 4. Required acceptance criteria

A future remediation is acceptable only when:

1. Tests execute the actual implementation rather than a duplicate.
2. A request requiring human approval cannot reach execution without a valid, unexpired approval bound to the exact operation.
3. Missing or mismatched tenant authority context denies before protected reads or side effects.
4. Revoked/expired/stale credentials, bindings, constitutions, and grants deny.
5. Rate-limit enforcement is backed by an atomic trusted mechanism and tested under concurrency.
6. Default policy does not silently grant execution or wildcard model authority.
7. CI evidence is linked to the exact commit and distinguishes unit tests, simulated integration, and real integration.
8. No Cloudflare or production deployment is inferred from repository tests.

## 5. Current disposition

| Finding | Disposition |
|---|---|
| CONST-01 broad defaults | OPEN |
| CONST-02 approval not enforced | OPEN |
| CONST-03 frequency field unused | OPEN |
| CONST-04 no identity/tenant/delegation binding | OPEN |
| CONST-05 tests duplicate logic | OPEN |

**Overall:** The reference constitution is not validated as a complete authorization control. No runtime remediation is included in this review. No production or Cloudflare action was taken.

**Relationship to ASTON-IAC-001:** This review is subordinate to the Identity & Tenant Authority Contract. It does not ratify an identity provider, tenant registry, or credential authority.
