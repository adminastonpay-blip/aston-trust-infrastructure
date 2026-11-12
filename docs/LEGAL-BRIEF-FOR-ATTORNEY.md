# LEGAL BRIEF — ASTON TRUST INFRASTRUCTURE
**For:** U.S. patent counsel  
**Matter:** Provisional application review and filing preparation  
**Working title:** *Method and System for Cryptographic Attestation and Fail-Closed Enforcement of Autonomous Artificial Intelligence Agents*  
**Status:** Attorney-review brief only. No application has been filed. This is not a patentability opinion.

## 1. What counsel is being asked to do
Review `docs/PATENT_DRAFT.md` and the accompanying technical figures, identify the correct inventors and applicant, conduct a focused prior-art / patent-eligibility assessment, revise the disclosure and claims, and—if counsel concludes the record is adequate—prepare and file a U.S. provisional application. Please advise before filing if the written description or drawings do not adequately support an embodiment.

## 2. The technical contribution to evaluate
The proposed invention is not “AI safety” in the abstract. It is a computer-implemented control and evidence workflow at the boundary of a consequential agent action:

1. **Action-boundary interlock:** receive a proposed agent action and execution context; evaluate scoped identity, policy version, risk/budget predicates, approvals and required evidence.
2. **Fail-closed authorization:** issue a narrowly scoped, preferably single-use execution capability only if every mandatory predicate is affirmatively satisfied. A failed, missing, timed-out or indeterminate check denies or suspends execution and records a reason.
3. **Cryptographically bound decision record:** create a canonical manifest binding the decision, agent/tenant, policy version, context and evidence digests; sign the defined bytes using an identified algorithm/key.
4. **Independent verification:** a verifier checks manifest structure, digest consistency, signature, issuer-key trust/authorization and evidence state independently of the agent's own explanation or UI.
5. **Optional external time anchoring:** submit a commitment to a timestamping service and distinguish pending from independently verified completion. A pending response is not represented as a completed Bitcoin anchor.

**Potential technical effects to assess:** preventing fail-open tool execution; making post-decision evidence alteration detectable; separating authorization from later verification; and enabling portable third-party verification. These are proposed effects, not proven performance claims.

## 3. Patentability and claim strategy — counsel's assessment required
Please assess whether the *specific ordered combination and interfaces* are novel and non-obvious over agent guardrails, policy engines, signed audit logs, decision passports, trusted execution / key-management systems and timestamping services. The strongest potential claim focus is the coupling of (a) pre-execution, action-scoped fail-closed authorization, (b) a cryptographically bound decision/evidence manifest, and (c) independent verification with explicit pending/failed/verified states. Consider system, method and non-transitory computer-readable-medium claims, plus dependent claims for one-time capabilities, policy-version binding, key rotation/revocation, human escalation, privacy-preserving digests and optional external anchoring.

Do not assume that combining known components is patentable. Identify the closest prior art, distinguish the actual implementation, and narrow or remove unsupported claim language. Confirm subject-matter eligibility and adequate written-description / enablement support under applicable U.S. law. The current draft is an invention disclosure, not a legal conclusion that the invention is patentable.

## 4. Technical accuracy constraints
The repository describes itself as an architectural specification/reference prototype. Its README explicitly says OpenTimestamps/Bitcoin anchoring is **not integrated** and full SNARK/STARK circuits are **not shipped**. Do not describe those as implemented. The present repository's `package.json` exposes `npm test` and `npm run check`; it does not configure a Cloudflare Worker or Miniflare. Obtain the actual SafetyInterlock Worker source, deployment configuration and test evidence before making implementation-specific assertions. Local tests are not Cloudflare production validation.

## 5. Documents and facts to attach
- [ ] `docs/PATENT_DRAFT.md` — current technical disclosure.
- [ ] Patent drawing sheets / figures 1–3 and their editable source, if available.
- [ ] Source snapshot or commit SHA for each relied-upon module; identify prototype vs deployed code.
- [ ] Test reports, exact commands, runtime versions, test output and known limitations.
- [ ] Architecture and sequence diagrams showing the action boundary, deny path, manifest/signature and verifier.
- [ ] Inventor names, residential addresses/countries as required by counsel, and a written contribution statement mapping each inventor to conception of claimed subject matter.
- [ ] Applicant/assignee legal name, formation/jurisdiction documents, ownership chain, signed assignments or confirmatory assignments, and any employer/contractor agreements.
- [ ] Earliest conception/reduction-to-practice dates; all public disclosures, demos, offers, sales, publications, repository visibility and dates; relevant NDAs.
- [ ] Related U.S./foreign filings, priority claims, government funding or third-party obligations, if any.
- [ ] Correspondence address and counsel's filing authorization.

## 6. Filing gate — do not pay or submit until confirmed
Confirm who is the applicant and where each applicant is domiciled. For patent matters received by the USPTO on or after **July 20, 2026**, applicants/owners domiciled outside the United States and its territories must be represented by a USPTO-registered patent practitioner. Counsel should confirm applicability to the actual applicant structure and current USPTO rules. Also determine whether any applicant qualifies for small- or micro-entity fees; do not claim reduced status without verifying every statutory requirement and signing the required certification.

Counsel should confirm the current provisional filing fee, cover sheet / ADS details, inventor information, necessary drawings, signature/authorization, and the 12-month deadline for a corresponding nonprovisional application. A provisional is not examined and does not itself become an issued patent. Do not use “Patent Pending” until counsel confirms that a complete application has actually been filed.

## 7. Five-minute intake sequence
1. Confirm client, applicant, inventor(s), domicile and conflicts.
2. Open this brief, `docs/PATENT_DRAFT.md`, and figures 1–3.
3. Review the disclosure/publication timeline and ownership documents.
4. Identify missing technical support and run a focused prior-art / eligibility screen.
5. Agree on claim scope, filing route, fee/entity status and filing deadline; file only after written client approval.

**Primary technical source:** `docs/PATENT_DRAFT.md` in this repository.  
**Official USPTO starting point:** https://www.uspto.gov/patents/basics/apply/provisional-application
