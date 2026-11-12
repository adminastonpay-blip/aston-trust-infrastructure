# ASTON — LEGAL BRIEF FOR U.S. PATENT COUNSEL
**Matter:** Provisional patent review and filing preparation  
**Proposed title:** *Method and System for Cryptographic Attestation and Fail-Closed Enforcement of Autonomous Artificial Intelligence Agents*  
**Status:** Confidential working brief. No application has been filed. This is not a patentability opinion.

## Requested engagement
Review `docs/PATENT_DRAFT.md` and Figures 1–3; confirm inventorship, applicant and ownership; conduct a focused prior-art and eligibility assessment; identify disclosure gaps; revise the specification/claims; and, only if the record is adequate and the client authorizes it, prepare and file a U.S. provisional application.

## Proposed technical contribution
The invention is not AI safety in the abstract. It is a computer-implemented workflow at the boundary of a consequential agent action:

1. **Action-boundary control:** receive an agent's proposed action, identity and execution context; evaluate scoped authority, policy version, risk/budget predicates, approvals and required evidence.
2. **Fail-closed authorization:** issue a narrowly scoped execution capability only when every mandatory predicate affirmatively passes. A failed, missing, timed-out or indeterminate check denies/suspends execution and records a reason; it does not silently fail open.
3. **Cryptographic decision record:** create a canonical manifest binding the decision, agent/tenant, policy version, context and evidence digests; sign the defined bytes using an identified algorithm and key.
4. **Independent verification:** independently check manifest structure, digest integrity, signature, issuer-key trust/authorization and evidence state—without relying on the agent's own explanation or UI.
5. **Optional external timestamp:** submit a commitment to a timestamp service and distinguish pending from independently verified completion. A pending response is not a completed Bitcoin anchor.

Potential technical effects to assess: preventing unauthorized tool execution, making alteration of signed evidence detectable, separating authorization from later verification, and enabling portable third-party validation.

## Patentability questions for counsel
Is the *specific ordered combination and its interfaces* novel and non-obvious over agent guardrails, policy engines, signed audit logs, decision passports, key-management systems and timestamping services? Assess U.S. subject-matter eligibility, written-description/enablement support and claim scope. Consider method, system and non-transitory computer-readable-medium claims, with dependent claims for one-time capabilities, policy-version binding, key revocation/rotation, human escalation, privacy-preserving digests and optional external anchoring.

The possible point of distinction is coupling pre-execution, action-scoped fail-closed authorization with a cryptographically bound decision/evidence manifest and independent verification with explicit pending/failed/verified states. **Do not assume this combination is patentable:** identify closest prior art, substantiate technical differences, and narrow or remove unsupported claims.

## Accuracy limits to preserve
The separate executable Worker is in `adminastonpay-blip/agente-OS-15.5-hector-zapata`, branch `feat/audit-staging-harness-21x` (inspected source snapshot: `src/index.ts`, `src/do/safety-interlock.ts`, `src/safety/policy.ts`, `src/audit/staging-endpoint.ts`; Worker version `21.6.3-cf-audit`). Its `SafetyInterlock` is a Durable Object bound as `SAFETY`, with policy evaluation, approval workflow, SQLite audit tables/hash-chain, and optional R2/OpenTimestamps verification paths. The `/v1/audit-target` route is a staging-only authenticated diagnostic harness: it claims a unique run/case, performs a separate `audit_chat_observation` policy preflight, then invokes the chat handler with persistence/external data bindings disabled and at most one AI call. It returns an observation record, normally HTTP 200 if the chat response succeeds; it does **not** classify prompt injection semantically and does **not** itself guarantee HTTP 403 for `PROMPT_INJ_01`. The returned `control_coverage` explicitly says `input_guard_on_existing_chat_path: policy_gate_not_semantic_input_classifier`, `tool_execution: not_invoked`, and `verdict: evaluator_required`. `CHAT_SAFETY_ENFORCED=true` enables a staging-only SafetyInterlock check for the `chat_completion` action, while the output guard is a credential-pattern guard, not a semantic prompt-injection detector. The reported branch `feat/core-1.0-implementation` could not be resolved in GitHub at review time (the ref returned “No commit found”); obtain its current commit SHA or restore the branch before relying on any additional Core 1.0 instrumentation/SQLite counter claims. The reference-core repo remains a separate architectural repository; do not conflate its source or tests with this Worker.

## Attach for counsel
- [ ] `docs/PATENT_DRAFT.md` and Figures 1–3.
- [ ] Source snapshot/commit SHA; module-to-claim mapping; architecture and sequence diagrams.
- [ ] Test reports with commands, runtime versions, output and limitations.
- [ ] Every inventor's legal name, residence and written contribution-to-conception statement.
- [ ] Applicant/assignee legal name, formation records, ownership chain, signed assignments and relevant employment/contractor agreements.
- [ ] Conception/reduction-to-practice timeline; all public disclosures, demos, sales/offers, repository visibility and dates; NDAs.
- [ ] Related U.S./foreign filings, priority claims, government funding/third-party obligations, correspondence address and filing authorization.

## Filing gate / five-minute intake
First confirm applicant identity, ownership, inventor(s) and domicile. For USPTO patent matters received on or after **July 20, 2026**, applicants/owners domiciled outside the U.S. and its territories must be represented by a USPTO-registered patent practitioner; counsel must confirm application to the actual applicant structure. Verify any small-/micro-entity fee eligibility before certification or payment. Confirm current fee, cover sheet/ADS, inventors, drawings and the 12-month nonprovisional deadline. A provisional is not examined and does not itself become an issued patent; do not use “Patent Pending” until filing is confirmed.

**Five-minute sequence:** (1) conflicts/client/applicant/domicile; (2) read this brief, draft and figures; (3) check ownership and disclosure timeline; (4) identify technical gaps and closest prior art; (5) agree scope, fee status, deadline and written filing authorization.

**USPTO reference:** https://www.uspto.gov/patents/basics/apply/provisional-application
