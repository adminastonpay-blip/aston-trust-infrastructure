# PROVISIONAL PATENT APPLICATION — TECHNICAL DISCLOSURE DRAFT

## Method and System for Cryptographic Attestation and Fail-Closed Enforcement of Autonomous Artificial Intelligence Agents

**Document status:** Confidential working draft for review by U.S. patent counsel. **Not filed with the USPTO.**  
**Inventor(s):** [Identify every natural person who contributed to conception; do not insert the company as inventor.]  
**Applicant / assignee:** [To be determined after ownership and assignment review.]  
**Docket / filing date:** [To be assigned.]

### 1. Technical field

The disclosure relates to computer-implemented control and audit systems for autonomous or semi-autonomous artificial-intelligence agents. More particularly, it concerns a coordinated mechanism that (i) evaluates whether an agent action is authorized under machine-enforceable safety conditions, (ii) generates independently verifiable cryptographic evidence concerning the action and its artifacts, and (iii) optionally commits evidence digests to a public, independently verifiable timestamping network.

### 2. Technical problem

An autonomous agent may generate outputs or invoke tools that change data, execute code, move funds, or trigger external operations. Conventional application logs may be mutable, fragmented, or controlled by the same system being audited. A model-generated explanation is not an independent integrity proof. A signature alone does not establish that a key is authorized, and a timestamp request alone does not establish that a public timestamp was completed.

There is therefore a technical need for a system that places an enforceable decision gate before a protected action and preserves evidence that an independent verifier can inspect afterward, while treating failed, missing, or indeterminate mandatory checks as non-approval.

### 3. Summary of the disclosed system

In one embodiment, a computer system coordinates three interoperable components:

**A. SafetyInterlock — pre-action enforcement.** A policy-enforcement component receives an agent-proposed action, associated context, identity and execution metadata, and a set of required controls. It evaluates the proposal against configurable authorization rules, risk limits, required approvals, and verification states. The interlock releases an execution capability, scoped token, or one-time authorization only when every mandatory predicate succeeds. If a mandatory predicate fails, is absent, times out, or is indeterminate, the interlock denies or suspends the protected action, records a reason code, and may route the proposal to a designated human-review path. The interlock is positioned at the action boundary rather than relying solely on post-hoc logging.

**B. Trust Fabric — evidence generation and independent audit.** An attestation service constructs a structured record identifying the agent and issuer, execution context, policy/version, relevant input and output commitments, artifact digests, provenance references, claims, and verification results. A canonical manifest binds the evidence fields to a defined byte sequence. The issuer signs the manifest or its cryptographic commitment using a declared algorithm and key identifier. A verifier independently checks document structure, digest consistency, signature validity, key trust and authorization policy, and the status of each required evidence source. Results distinguish verified, failed, pending/indeterminate, and not-applicable states. Sensitive payloads may remain in access-controlled storage while the attestation contains digests and protected references.

**C. Public timestamp anchoring — external existence-time evidence.** In an optional asynchronous stage, the system submits a cryptographic commitment derived from the signed manifest to a decentralized timestamping protocol, including an OpenTimestamps-compatible process that can ultimately anchor the commitment in the Bitcoin blockchain. Upon receipt, the system stores the proof, target digest, submission metadata, and verification state. An independent verifier checks the proof against the exact target bytes and, when fully upgraded, the corresponding Bitcoin block. A pending calendar response is not treated as a completed Bitcoin anchor. The anchor supports evidence that the committed data existed no later than the attested block time; it does not establish authorship, exact creation time, or truth of the data.

### 4. Example operating sequence

1. An agent submits a proposed action and execution context to the SafetyInterlock.
2. The interlock evaluates the applicable policy, required evidence, authorization scope, and current verification state.
3. If all mandatory conditions pass, the interlock issues a narrowly scoped execution authorization; otherwise it denies or suspends execution and records the outcome.
4. The Trust Fabric creates a manifest for the decision, policy version, relevant artifacts, and outcome; computes digests and obtains a detached signature.
5. A separate verifier validates the manifest, signature, trust policy, and evidence references and emits a machine-readable verification result.
6. The timestamping subsystem optionally submits a commitment and later upgrades and verifies the returned proof. The anchor state is appended to the audit record without rewriting the original signed bytes.
7. Subsequent protected actions can require a verified attestation and, where policy requires it, a completed external anchor. Any mandatory failure or indeterminate state remains non-authorizing.

### 5. Technical effects and variations

The coordinated arrangement can reduce unauthorized execution caused by fail-open defaults, make post-event alteration detectable, separate operational control from evidence verification, and permit third parties to validate selected integrity and existence-time claims without trusting the agent's user interface. Implementations may use hardware-backed keys, certificate chains or independently pinned keys, append-only storage, Merkle commitments, different public timestamping networks, multiple verifiers, or human approval workflows. The described components may execute on one machine or across separate services and administrative domains.

### 6. Figures recommended for a filing package

- **FIG. 1:** System architecture showing Agent → SafetyInterlock → protected tool/action, with Trust Fabric evidence path and optional Bitcoin timestamping path.
- **FIG. 2:** Fail-Closed decision state machine (pass / deny / pending / human review).
- **FIG. 3:** Manifest signing, independent verification, and timestamp-proof lifecycle.

---

## Filing and diligence notes — not part of the technical disclosure

This is an initial invention-disclosure draft, not a legal opinion, patentability assessment, or filing-ready application. Patent counsel should determine inventorship, ownership/assignment, prior-art and public-disclosure implications, claim strategy, and whether the proposed subject matter is eligible and sufficiently described. The implementation status must be checked before describing any feature as reduced to practice: the ATI repository currently identifies OpenTimestamps/Bitcoin anchoring as not integrated and several modules as prototype or non-production. The SafetyInterlock described above is an architectural embodiment to be mapped to concrete source code, interfaces, state transitions, and test evidence before filing.

A U.S. provisional application requires a written description sufficient under 35 U.S.C. §112(a), necessary drawings, a cover sheet identifying the provisional application and all inventors, and the applicable fee. A provisional is not examined and generally lasts 12 months; a corresponding nonprovisional application must be filed within that period to claim its benefit. Do not publicly disclose potentially patentable details before counsel reviews filing strategy, especially if international protection may be desired.

Official USPTO guidance: https://www.uspto.gov/patents/basics/apply/provisional-application
