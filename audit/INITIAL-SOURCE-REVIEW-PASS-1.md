# ASTON Immune Fabric 2040 — Initial Source Review (Pass 1)

**Status:** PRELIMINARY — source excerpts inspected; no runtime tests executed  
**Reviewed:** 2026-11-17  
**Base inspected:** `main` of each named repository  
**Scope:** targeted files, not exhaustive repository coverage

## 1. Agente OS 15.5

### OBS-AGENT-001 — Chat safety decision receives message length, not message content

- **Evidence:** `src/index.ts`, `enforceChatSafety()`.
- The chat request invokes the SafetyInterlock Durable Object at `/evaluate` before model execution.
- The submitted action arguments include `message_length`, not the message body or a content digest.
- **Positive control observed:** missing `env.SAFETY`, failed response, non-allowed result, or thrown error blocks chat before `chat(env, messages, ...)`.
- **Question / risk:** determine whether any content-sensitive prompt-injection or data-loss policy is expected at this gate. If yes, the current request context is insufficient for that class of inspection. Do not transmit raw prompts to audit logs; use a scoped digest or separately protected inspection channel if needed.
- **Status:** OBSERVED; security impact not yet validated.

### OBS-AGENT-002 — SafetyInterlock exposes multiple Durable Object routes

- **Evidence:** `src/do/safety-interlock.ts`, `fetch()`.
- Routes observed include `/evaluate`, `/pending`, `/decide`, `/sandbox/exec`, `/audit/append`, `/audit/verify`, and `/audit/anchor/verify`.
- **Question / risk:** trace every caller and the Worker-level authorization boundary. Confirm that untrusted clients cannot obtain or invoke a Durable Object stub directly, and that each route has caller/role/tenant checks appropriate to its effect.
- **Status:** OBSERVED; reachability and exploitability NOT VERIFIED.

### OBS-AGENT-003 — Central API access policy contains explicit public POST allowlist

- **Evidence:** `src/security/mvsp-access.ts`.
- Public POST paths include chat/voice, risk score, defense triage, constitution check, economy quote, crypto identity/sign and validation.
- Other write methods require a non-public identity with admin or executor role; presented credentials that resolve to public identity are rejected.
- **Question / risk:** inspect each public handler for side effects, resource consumption, signing-key exposure, rate limiting, and abuse controls. Confirm the central authorization function is applied on every request path before dispatch.
- **Status:** OBSERVED; complete router coverage NOT VERIFIED.

### OBS-AGENT-004 — Default policy constitution permits wildcard models and broad action set

- **Evidence:** `src/constitution.ts`.
- `defaultConstitution()` defaults `models_allowed` to `["*"]` and `allowed_actions` to include read, analyze, create, update and execute; delete, wire transfer and export-all are denied.
- **Question / risk:** verify whether this default is used in any security-sensitive path and whether production tenants must explicitly narrow model/action scope. Verify expiry, tenant binding and revocation enforcement at the point of execution.
- **Status:** OBSERVED; deployment use NOT VERIFIED.

### OBS-AGENT-005 — Audit chain has immutability triggers and external checkpoint logic, but cryptographic guarantees need separation

- **Evidence:** `src/do/safety-interlock.ts`.
- SQL triggers reject update/delete of `audit_events`; event records are linked by previous hash and event hash; optional external checkpoints and OTS verification are present in the inspected code.
- **Question / risk:** verify exact hash preimage/canonicalization, signer/authenticity model, anchor freshness, local-state-missing behavior, backup/restore and privileged storage tampering. A hash chain and SQL triggers do not by themselves prove event completeness, trusted authorship or protection against privileged database replacement.
- **Status:** OBSERVED; independent validation NOT PERFORMED.

## 2. Trust Infrastructure

### OBS-ATI-001 — Decision lifecycle is a local state-transition helper

- **Evidence:** `src/decision-lifecycle.ts`.
- The module declares allowed transitions and converts illegal transitions to FAILED.
- **Question / risk:** find all callers and prove no execution path can skip authorization, budget reservation, verification or evidence storage by bypassing this helper.
- **Status:** OBSERVED; enforcement coverage NOT VERIFIED.

### OBS-ATI-002 — Default constitution has wildcard model permission and no expiry

- **Evidence:** `src/constitution.ts`.
- Defaults include `models_allowed: ["*"]` and `expires_at: null`; caller-supplied overrides are spread over defaults.
- **Question / risk:** establish safe production defaults, explicit tenant scoping, policy versioning, revocation propagation and enforcement at execution time.
- **Status:** OBSERVED; runtime usage NOT VERIFIED.

## 3. Attestation SDK

### OBS-SDK-001 — Schema describes claims but cannot establish cryptographic truth

- **Evidence:** `agent-attestation.schema.json` and README.
- Schema fields describe issuer, execution, digests, signatures, verification and transparency references. README explicitly states that schema validation does not verify signatures, issuer identity, runtime truth, timestamps or external anchors.
- **Question / risk:** inspect actual verifier code and tests for canonicalization, algorithm allowlists, key binding, key rotation/revocation, signature verification, digest recomputation, timestamp policy and fail-closed handling.
- **Status:** OBSERVED; verifier assurance NOT VERIFIED.

## 4. Risk Protocol

### OBS-ARP-001 — ARP-1 is explicitly a draft proposal

- **Evidence:** `ASTON_RISK_PROTOCOL.md` and README.
- The protocol labels itself a standards proposal, not ratified, and states no conformance program exists.
- It requires missing identity, policy, evidence or mandatory controls not to silently grant authority.
- **Question / risk:** identify any implementation that claims to enforce ARP-1 and test it independently; do not equate specification language with deployed controls.
- **Status:** OBSERVED.

## 5. Immediate follow-up priorities

1. Trace Worker dispatch from request entry through `resolveIdentity`, `authorizeApiRequest`, route dispatch and all calls into SafetyInterlock.
2. Inspect `authenticate()`, tenant derivation, session key derivation and every route that accepts caller-supplied tenant/actor/operator values.
3. Inspect SafetyInterlock `evaluateAndGate`, `decide` and `sandboxExec` end-to-end, including approval binding and replay resistance.
4. Inspect SDK verifier implementation and adversarial tests.
5. Trace every ATI constitution and decision-lifecycle caller.
6. Inspect ARP-1 implementation, if any, separately from the proposal.

## 6. Important limits

This review is not a penetration test, runtime validation, complete code audit, independent cryptographic review or production assessment. No vulnerability is declared solely from the observations above. Each question remains open until source tracing and reproducible tests establish the behavior.


## GOV-001 — Organization rulesets and effective branch governance

- **Severity:** CRITICAL governance risk; blocks any claim that protected-branch governance is validated.
- **Evidence status:** repository-level branch API reports `main` as unprotected for the inspected repositories; organization rulesets and effective inherited rules could not be read through the current GitHub integration. Absence of rulesets is **not** established.
- **Disposition:** **TEMPORARILY ACCEPTED RISK** for this bounded, read-only / test-only audit period, not a control pass and not a waiver for production changes or merges.
- **Risk owner:** `adminastonpay-blip` (repository owner / project maintainer) is assigned accountability for obtaining organization-level evidence and recording the acceptance. This assignment does not assert that GitHub organization settings were changed.
- **Review date:** **2026-11-24**.
- **Compensating restrictions until review:** no merges, no production deployments, no Cloudflare changes, no secrets/releases changes; all work remains on isolated branches and draft PRs. If these restrictions cannot be maintained, stop work and escalate rather than rely on this temporary acceptance.
- **Exit criteria:** obtain authoritative organization ruleset/effective-rule evidence, including bypass actors, required reviews/status checks, admin enforcement, and scope; then either validate the control or renew/escalate the documented risk with a new owner decision and review date.
