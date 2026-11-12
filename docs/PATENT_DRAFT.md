# PROVISIONAL PATENT APPLICATION — TECHNICAL DISCLOSURE DRAFT

## Method and System for Cryptographic Attestation and Fail-Closed Enforcement of Autonomous Artificial Intelligence Agents

**Status:** Confidential working draft for U.S. patent counsel; **not filed with the USPTO**.  
**Inventor(s):** [Identify every natural person who contributed to conception.]  
**Applicant/assignee:** [Determine after ownership and assignment review.]

### Technical field and problem

This disclosure concerns computer-implemented control and audit systems for autonomous or semi-autonomous artificial-intelligence agents. Agents can invoke tools, modify records, execute code, or initiate consequential transactions. Conventional logs may be fragmented or mutable; model-generated explanations are not independent evidence; a signature alone does not establish key authorization; and submitting a timestamp request does not prove that a public timestamp was completed.

A technical need exists for a system that enforces policy at the boundary of a protected action and creates portable evidence that an independent verifier can check afterward. Mandatory checks that fail, are absent, or remain indeterminate must not be treated as approval.

### System summary

In one embodiment, the system coordinates three components:

**1. SafetyInterlock — pre-action blocking.** Receives an agent-proposed action, execution context, identity metadata, and applicable policy. It evaluates authorization scope, risk limits, required approvals, and mandatory evidence states. Only when every mandatory predicate succeeds does it issue a narrowly scoped execution capability, token, or one-time authorization. A failed, missing, timed-out, or indeterminate predicate causes denial or suspension, records a reason code, and may route the request to human review. The interlock operates at the action boundary, not solely as post-event monitoring.

**2. Trust Fabric — cryptographic audit.** Creates a structured attestation identifying the agent and issuer, execution context, policy version, relevant artifacts, provenance, claims, and verification outcomes. It binds defined manifest bytes to cryptographic digests and a detached signature using a declared algorithm and key identifier. An independent verifier checks structure, digest consistency, signature validity, issuer-key trust and authorization policy, and required evidence sources. Results distinguish verified, failed, pending/indeterminate, and not-applicable. Sensitive payloads may remain in protected storage while the attestation carries digests and access-controlled references.

**3. Bitcoin anchoring — external existence-time evidence.** Optionally submits a commitment derived from the signed manifest to a public timestamping protocol, such as an OpenTimestamps-compatible process that can ultimately anchor the commitment in the Bitcoin blockchain. The proof, target digest, and state are retained and independently verified against the exact target bytes and, when complete, the corresponding Bitcoin block. A pending calendar response is not an anchor. A verified anchor supports that the committed data existed no later than the block time; it does not prove authorship, exact creation time, or truth.

### Example operation

An agent proposes an action to SafetyInterlock. The interlock evaluates policy and evidence and either issues scoped authorization or denies/suspends the action. Trust Fabric records the decision, policy version, and relevant artifacts in a manifest, computes digests, and signs the defined bytes. An independent verifier checks the signature and trust policy. An optional timestamp service submits the commitment and later records the proof's pending or verified state. A subsequent protected action may require both a verified attestation and a completed external anchor; any mandatory failure or indeterminate result remains non-authorizing.

### Technical effects and variations

The coordinated system can reduce fail-open execution, make alteration of signed evidence detectable, separate action authorization from evidence verification, and permit third parties to validate selected integrity and existence-time claims without relying on the agent's interface. Components may run on one machine or across administrative domains and may use hardware-backed keys, certificate chains, independently pinned keys, append-only storage, Merkle commitments, alternate timestamp networks, multiple verifiers, or human approval.

**Figures recommended:** (1) Agent/SafetyInterlock/protected-tool architecture with Trust Fabric and timestamp paths; (2) pass/deny/pending/review state machine; (3) manifest signing, independent verification, and timestamp lifecycle.

---

### Counsel review and filing cautions

This is an invention-disclosure draft, not legal advice, a patentability opinion, or a filing-ready application. Counsel should assess prior art, eligibility, inventorship, ownership, public disclosures, claim strategy, and whether the written description supports each proposed embodiment. Map SafetyInterlock to concrete interfaces, state transitions, source code, and tests before filing. The ATI repository currently identifies OpenTimestamps/Bitcoin anchoring as not integrated and several modules as prototype or non-production; do not characterize these as completed implementations.

USPTO provisional guidance requires a written description sufficient under 35 U.S.C. §112(a), necessary drawings, a cover sheet identifying the provisional and all inventors, and the applicable fee. A provisional is not examined and generally has a 12-month pendency; a corresponding nonprovisional application must be filed within that period to claim its benefit. Review filing strategy before any further public disclosure, particularly if international protection is contemplated.

Official guidance: https://www.uspto.gov/patents/basics/apply/provisional-application
