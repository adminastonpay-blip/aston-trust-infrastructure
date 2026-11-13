# ASTON TRUST FABRIC — Global Architecture & 24-Month Roadmap 2030

**Document status:** Strategic North Star — proposed product and architecture direction  
**Version:** 1.0  
**Date:** 13 November 2026  
**Repository:** `adminastonpay-blip/aston-trust-infrastructure`  
**Documentation branch:** `docs/aston-trust-fabric-roadmap-2030`  
**Decision boundary:** This document is a roadmap, not an implementation authorization, deployment instruction, security certification, or claim of production readiness.

---

## 1. Executive Summary

ASTON's strategic transition is from building standalone software features to building **neutral trust infrastructure for the autonomous economy**.

As AI agents increasingly act across enterprise systems, APIs, models, tools, and payment networks, organizations need more than model-level safeguards or conventional application logs. They need a reliable way to establish agent identity, delegate bounded authority, enforce policy before protected actions, and produce evidence that can be independently examined.

ASTON aims to provide that trust layer without requiring customers to replace their existing cloud providers, models, identity systems, or business applications. The platform is intended to be model-agnostic, cloud-portable, interoperable, and independently verifiable.

The long-term strategy is organized around three reinforcing assets:

1. **ASTON Trust Fabric — the technology asset.** The control plane for agent identity, authorization, policy enforcement, controlled execution, risk response, and verifiable evidence.
2. **ASTON Trust Protocol — the interoperability asset.** Open, versioned formats and interfaces for exchanging authorization context, trust claims, and evidence across independently operated systems.
3. **ASTON Trust Network — the ecosystem asset.** Organizations, developers, infrastructure providers, auditors, and verifiers that issue, consume, and independently validate trust evidence.

The intended strategic advantage is not ownership of a closed ecosystem. It is adoption of a common, useful trust layer that customers can integrate and verify independently. The network effect is a hypothesis to earn through interoperability, security, distribution, and real customer adoption—not an assumed outcome.

**Mission:** Make consequential actions performed by autonomous agents identifiable, bounded, controlled, and verifiable across organizational and infrastructure boundaries.

**North Star:** Any participating organization should be able to determine who or what initiated an agent operation, what authority was granted, which controls were applied, what execution occurred, and whether the resulting evidence can be independently verified.

## 2. Core Capabilities (The 10 Modules)

The following ten modules define the target capability model. They are architectural objectives; this list does not imply that all modules are implemented or production-ready today.

1. **Identity — Agent Identity.** Establish a durable, cryptographically verifiable identity for each agent, including its controlling organization, keys, lifecycle state, issuer, and relevant provenance. Support key rotation, suspension, and revocation. Identity assertions must be scoped and validated; a name or caller-supplied identifier alone is not proof of identity.

2. **Trust Graph.** Represent relationships among organizations, human principals, agents, models, tools, workloads, policies, credentials, and evidence. Preserve provenance and confidence for entity relationships. Distinguish verified facts from inferred links, and retain the source and time of each assertion.

3. **Delegation.** Allow an authorized principal to delegate limited authority to an agent or another agent. Delegations must be scoped by tenant, action, resource, budget, time, audience, and depth where applicable. A delegate must not be able to expand the authority it received.

4. **Policy.** Evaluate explicit, versioned, deterministic authorization rules before protected operations. Policies should express subjects, actions, resources, constraints, budgets, approval requirements, and deny conditions. Missing, invalid, expired, or indeterminate mandatory inputs must fail closed.

5. **Safety Interlock.** Enforce the authorization boundary between an agent's request and a protected model, tool, or business action. The interlock must prevent bypass paths, bind authorization to the exact request context, and reject invalid or replayed permits. Model execution must remain isolated behind a separately controlled execution boundary.

6. **Runtime Attestation.** Provide evidence about the software, configuration, workload, and execution environment involved in an operation. The target design may incorporate signed build provenance, deployment identity, measured boot, hardware-backed attestation, or equivalent mechanisms where available. Do not treat a software version string or self-reported runtime field as independent attestation.

7. **Evidence Ledger.** Produce integrity-protected, time-ordered records of authorization decisions and consequential operations. Support signed event envelopes, cryptographic digests, Merkle inclusion proofs, retention controls, and independent verification. Durable storage, anchoring, and receipt verification are required before claiming end-to-end tamper-evident archival.

8. **Continuous Risk.** Reassess identities, credentials, behavior, policy state, and operational signals over time. Detect anomalies, trigger step-up approval, constrain activity, suspend identities, or revoke authority. Risk scores must be explainable enough for operators to understand and must not silently replace deterministic policy decisions.

9. **Agentic Commerce.** Apply identity, delegation, budgets, policy, and evidence controls to agent-initiated purchases and payments. Begin with authorization and verification around existing payment rails and protocols. ASTON should not custody customer funds in the initial product strategy.

10. **Cross-Domain Verification.** Enable one organization to validate evidence and trust claims issued by another without blindly trusting the issuer's application or ASTON's own user interface. Define trust roots, issuer policies, key status, schema versions, revocation behavior, and privacy-preserving disclosure.

## 3. The ASTON Trust Chain

The ASTON Trust Chain is the proposed verifiable lifecycle record for a consequential agent operation. It links identity, authority, policy, execution, and evidence into a coherent, independently checkable sequence.

A reference operation should capture, as applicable:

1. **Initiation:** Which human, service, or agent initiated the request; the authenticated principal; tenant or organization; correlation and request identifiers; and the time of initiation.
2. **Agent identity:** The agent identity and key identifier, issuer, lifecycle status, and the evidence used to validate the identity and proof of possession.
3. **Delegated authority:** Who delegated authority, to whom, for which actions and resources, under what constraints, for what period, and whether the delegation remained active.
4. **Authorization decision:** The policy identifier and version, evaluated inputs, decision, applicable limits, required approvals, and reason codes. Sensitive policy inputs may be represented by commitments or selectively disclosed claims where appropriate.
5. **Execution context:** The protected action, tool or service, model and model version where relevant, runtime or deployment identity, request digest, and the execution boundary that accepted the authorization.
6. **Outcome:** Whether execution was completed, denied, interrupted, or left uncertain; the resulting status; and any relevant resource or transaction reference.
7. **Evidence:** Signed event records, cryptographic digests, sequence relationships, timestamps, and proofs needed by an authorized verifier to validate integrity and provenance.

The Trust Chain must distinguish what is directly observed from what is asserted by a participant. A valid signature proves that a corresponding key signed a particular payload; it does not, by itself, prove that the underlying statement is true, that the key holder was uncompromised, or that a business decision was correct.

Three system properties are foundational:

- **Revocation:** Identity credentials, keys, delegated grants, permits, and policy authority must have explicit status and bounded lifetimes. Revocation must prevent future protected operations within a documented and tested propagation target. Historical evidence must remain verifiable while accurately reflecting the credential status and trust policy applicable at the relevant time.
- **Privacy:** Evidence exchange must disclose only what a verifier needs. The design should support data minimization, tenant isolation, selective disclosure, commitments, retention limits, and customer-controlled access. Privacy techniques must not obscure facts required for security, legal, or audit obligations.
- **Portability:** Evidence must use documented, versioned formats and cryptographic algorithms. An independent verifier should be able to validate an evidence package without calling a proprietary ASTON service. Export, migration, key rotation, and algorithm agility must be designed into the protocol.

The Trust Chain is not simply an application log or a claim that every event is immutable. Its strength depends on authenticated event sources, secure key management, reliable ordering and time sources, durable persistence, independently verifiable proofs, and transparent failure handling.

## 4. Product Suite

The product suite packages the Trust Fabric capabilities for distinct buyers while sharing common identity, policy, execution, and evidence foundations.

### 4.1 ASTON Trust Fabric

The core enterprise platform and integration layer. It provides agent registration, identity resolution, policy administration, authorization APIs, bounded delegation, controlled execution integrations, revocation, risk operations, audit views, and tenant administration. It should integrate with existing identity providers, model gateways, tools, cloud environments, and security operations workflows.

### 4.2 ASTON Agent ID

The agent identity and lifecycle product. It provides agent credentials, proof-of-possession flows, organizational ownership, key rotation, status, suspension, revocation, and machine-readable identity records. Its objective is to make agent identity portable across participating services without creating a single mandatory global identity provider.

### 4.3 ASTON Agentic Commerce

The authorization and evidence layer for agent-initiated economic actions. It provides spending authority, transaction limits, merchant and resource constraints, approval policies, payment intent binding, and post-transaction evidence. The initial scope is non-custodial: payment execution and custody remain with established payment providers or customer-controlled systems.

**x402 integration:** ASTON should integrate with x402 as an authorization, policy, and evidence layer around compatible HTTP payment flows—not replace x402 or claim ownership of its protocol. Before a payment is attempted, ASTON can evaluate agent identity, delegated authority, merchant/resource scope, amount, currency, budget, and approval requirements. The resulting authorization should be bound to the specific payment intent and protected against replay or substitution. After execution, the payment provider's response or receipt can be linked to the Trust Chain and verified according to its source and assurance level. The integration must respect the protocol's current specification, provider requirements, and ecosystem governance. Payment authorization is not custody, settlement finality, or a guarantee that a merchant will fulfill an order.

### 4.4 ASTON Verifiable Evidence

The evidence issuance, packaging, export, and verification product. It provides signed event envelopes, evidence bundles, schemas, verification libraries, audit exports, integrity proofs, and interfaces for independent auditors. The verifier should be usable outside the ASTON control plane. Advanced capabilities may include durable external anchoring, trusted timestamps, and privacy-preserving disclosure after their security and operational models have been independently reviewed.

## 5. Interoperability Strategy

ASTON must be a neutral integration layer, not a closed garden. Customers should be able to adopt individual capabilities, retain their existing infrastructure, export their data, and independently verify evidence.

**NIST alignment.** Track relevant NIST AI, cybersecurity, digital identity, and agent-related guidance as it evolves. Map ASTON controls to applicable publications and terminology, record versioned mappings, and document gaps. Alignment is not endorsement, certification, or proof of conformity. Any formal conformity claim requires a defined assessment scope and appropriate independent evaluation.

**OAuth 2.0 and OpenID Connect (OIDC).** Integrate with established authorization and identity providers for human and service authentication. Validate issuer, audience, signature, expiry, scopes, and relevant claims. Keep authentication distinct from authorization: a valid login or token does not automatically authorize an agent to perform a business action. Use narrowly scoped tokens, secure key rotation, and explicit tenant boundaries.

**SPIFFE and SPIRE.** Evaluate SPIFFE workload identities and SPIRE-based issuance and attestation for service-to-service and workload identity. Map workload identities to ASTON principals and policy subjects through explicit, auditable trust configuration. Do not assume that a workload identity alone establishes the business authority of an agent.

**Open interfaces and formats.** Publish versioned API contracts, event schemas, evidence envelopes, verification rules, and SDK interfaces. Prefer established cryptographic and serialization standards where suitable. Document extension points and compatibility guarantees. Avoid proprietary-only identifiers or formats where an interoperable alternative is practical.

**Provider neutrality.** Keep policy logic and domain contracts behind stable ports. Support multiple model providers, databases, cloud runtimes, key-management systems, and evidence stores over time. Cloudflare is a current implementation target, not a permanent architectural dependency or the definition of the ASTON product.

**Independent verification and exit.** Provide exportable evidence packages, documented key discovery and trust configuration, reference verifiers, migration guidance, and customer-controlled retention. Customers must be able to verify historical evidence and leave the platform without losing access to their records.

**Standards participation.** Participate in relevant standards and open-source communities where ASTON can contribute practical implementation experience. Do not describe a proprietary ASTON format as an industry standard until it has transparent governance, independent implementations, and meaningful external adoption.

## 6. 24-Month Roadmap

The roadmap is organized into five phases. Timing is directional and subject to evidence, dependencies, security reviews, customer feedback, and operational readiness. No phase authorizes production changes by itself.

### Phase 1 — Core Foundation (Months 0–3)

**Objective:** Establish a defensible, reviewable security core and close the gap between repository-level test evidence and a deployable staging design.

- Complete CORE 1.0 review, documentation, and branch-level validation.
- Review identity, policy, permit, Safety Interlock, isolated Model Runner, replay protection, and signed violation-report boundaries.
- Resolve and review the missing staging configuration and bindings before any deployment is considered.
- Add tests for failure modes, revocation behavior, tenant isolation, replay, key rotation, and dependency unavailability.
- Define threat model, security assumptions, trust boundaries, and operational failure semantics.
- Separate unit, integration, local simulation, hosted staging, and production evidence in all reporting.

**Exit criteria:** Approved architecture and threat model; reproducible CI; documented staging prerequisites; reviewed deployment plan; no unresolved critical security design issue. Hosted staging validation remains a separate, explicitly authorized activity.

### Phase 2 — Integrable Product (Months 3–6)

**Objective:** Turn the core into a product that external engineering teams can integrate.

- Stabilize versioned REST APIs and service-to-service contracts.
- Deliver initial Agent ID and bounded delegation workflows.
- Provide a developer SDK, quick-start guide, reference integration, and test fixtures.
- Deliver policy administration and an enterprise audit console.
- Provide a standalone evidence verifier and portable evidence export.
- Establish compatibility, versioning, deprecation, and security disclosure policies.
- Demonstrate integration with more than one model or infrastructure provider before claiming provider neutrality.

**Exit criteria:** External developers can integrate the documented happy path and denial path; evidence can be exported and independently verified; compatibility and support boundaries are documented.

### Phase 3 — Institutional Validation (Months 6–12)

**Objective:** Validate product value and security with real organizations under controlled conditions.

- Recruit design partners with defined, measurable agent-risk problems.
- Run scoped pilots with explicit success criteria, data boundaries, and rollback plans.
- Commission independent architecture review and penetration testing.
- Complete privacy, data protection, legal, and IP reviews appropriate to target markets.
- Validate operational controls: key lifecycle, incident response, backups, recovery, monitoring, and tenant isolation.
- Measure false denials, missed policy violations, latency, availability, operator workload, and evidence-verification success.
- Convert successful pilots into paid contracts where customer value and procurement requirements support it.

**Exit criteria:** Documented pilot outcomes; independent findings with remediation tracking; production-readiness decision for a clearly bounded scope. No certification claim without an applicable external assessment.

### Phase 4 — Trust Network (Months 12–18)

**Objective:** Enable verifiable trust relationships across organizational boundaries.

- Publish the Trust Protocol specification and reference verifier.
- Support issuer discovery, key status, trust policies, revocation, and schema evolution.
- Enable cross-organization evidence exchange with tenant and privacy controls.
- Establish partner onboarding and conformance test suites.
- Pilot agent commerce authorization integrations, including x402-compatible flows where appropriate.
- Develop transparent governance for protocol changes and extension registries.

**Exit criteria:** Multiple independently operated organizations can exchange and verify evidence using documented interfaces; external implementations pass conformance tests; governance and incident procedures are published.

### Phase 5 — Global Trust Infrastructure (Months 18–24)

**Objective:** Expand resilience, portability, ecosystem adoption, and institutional credibility.

- Deliver multi-cloud deployment options and independently tested provider adapters.
- Strengthen evidence durability, backup, external anchoring, and receipt verification.
- Expand integrations across identity, security, model, workload, and payment ecosystems.
- Establish an independent assurance and partner program with published criteria and scope.
- Develop regional deployment, data residency, and enterprise support options.
- Publish security advisories, compatibility commitments, transparency reporting, and protocol governance updates.
- Scale commercial distribution through technology partners and customer references.

**Exit criteria:** Demonstrated portability across more than one infrastructure provider; independently verified evidence flows; repeatable customer deployments; measurable recurring adoption and operational maturity.

## 7. Business Model

ASTON should combine an open, interoperable developer foundation with paid enterprise operations and assurance services. Pricing must be tested against customer value, deployment costs, security obligations, and procurement realities.

1. **Open Core.** Offer developer SDKs, protocol specifications, reference implementations, test fixtures, and a basic independent verifier under clearly defined licenses. The open foundation lowers adoption friction and allows external scrutiny. Paid services should not be required merely to inspect or verify a standard evidence package.

2. **Enterprise.** Annual subscriptions or licenses for enterprise policy administration, fleet management, advanced controls, governance, audit operations, private deployment options, support, and service-level commitments. Pricing may reflect organization scale, protected workloads, agent volume, deployment model, and support requirements.

3. **Trust API.** Usage-based pricing for authorization evaluations, identity lifecycle operations, evidence issuance, and verification at scale. Metering must be transparent, predictable, and designed so that essential security checks do not create incentives to bypass the trust layer.

4. **Commerce.** Optional fees for agent-commerce authorization, policy evaluation, and evidence services around payment flows. Any percentage or per-transaction fee is a commercial hypothesis to validate. ASTON's initial role is non-custodial; payment processing, custody, settlement, and regulated financial activities remain with appropriately authorized providers unless a separately reviewed business model is approved.

5. **Assurance.** Paid implementation support, architecture assessments, conformance testing, evidence reviews, and independent-partner services. Distinguish ASTON's own product checks from independent audits or certifications. Assurance criteria, scope, conflicts of interest, and auditor independence must be transparent.

**Commercial validation principles:** Begin with a narrow buyer and a costly, measurable problem. Test willingness to pay through customer discovery and paid pilots. Track annual recurring revenue, gross margin, retention, expansion, deployment time, sales cycle, and support burden. Do not present target contract values, transaction-fee rates, market-size estimates, or valuation goals as achieved results without documented evidence.

## 8. Current State (What is Real vs. What is Planned)

This section is the technical truth baseline for engineering reviews, investor materials, and due diligence. It must be updated when new evidence is produced. A roadmap statement is not an implementation claim.

### 8.1 Implemented and validated in repository CI

The CORE 1.0 implementation branch contains the following code and automated test coverage:

- **SafetyInterlock and policy-gated path:** the protected model-inference path evaluates identity and policy context before delegating to the isolated Model Runner.
- **Isolated Model Runner boundary:** the PEP client uses a `MODEL_RUNNER` service binding abstraction; the architecture test checks that direct `env.AI.run()` access is confined to the Model Runner implementation.
- **Signed permit tokens:** Ed25519 permits are short-lived and bound to request context including tenant, agent, model, request identifier, and input digest.
- **Replay protection:** a replay-guard interface and SQLite-backed Durable Object implementation exist in the repository; tests exercise rejection of a reused permit before a second model invocation.
- **Signed violation reports:** Ed25519-signed JSON violation reports can be created and verified; an unauthenticated caller is explicitly represented as `unverified-caller`, not falsely attributed to a real identity.
- **Merkle primitives:** Merkle tree construction, inclusion proof generation, and proof verification have unit-test coverage.
- **Evidence batching prototype:** the current batcher has retry-oriented behavior and an anchor callback interface, but its in-memory state is not durable.
- **Adapter boundaries:** database and AI provider ports and Cloudflare adapter implementations exist. The existence of ports does not yet prove portability to a second provider.

### 8.2 Exact CI evidence

GitHub Actions **Run #89** completed successfully on 13 November 2026 for commit:

`12f54fd327c72183f2e5ffc8137375b0a6e87a90`

The observed result was **31 tests passed, 0 failed**, with this breakdown:

- Node/core tests: 6/6.
- Architecture tests: 3/3.
- Vitest unit tests: 6/6.
- Vitest/Miniflare integration tests: 16/16.

Run: https://github.com/adminastonpay-blip/aston-trust-infrastructure/actions/runs/43380632706

The workflow installed dependencies using `npm install --ignore-scripts --no-audit --no-fund --legacy-peer-deps` and then ran `npm test`. It did **not** run `npm ci`. This distinction must remain explicit in diligence materials.

GitHub Actions **Run #90** completed successfully for documentation updates at commit:

`798de34d05ecd18deb8978a69fa14e5a73c68a96`

Run: https://github.com/adminastonpay-blip/aston-trust-infrastructure/actions/runs/43381126814

These results demonstrate that the tested repository code passed the specified automated CI suites in their configured environment. They do not demonstrate hosted Cloudflare operation, production readiness, independent security certification, customer adoption, or regulatory compliance.

### 8.3 Known gaps and planned capabilities

The following items are not established as completed production capabilities and must not be represented as such:

- **Hosted Cloudflare deployment and E2E:** no completed hosted Cloudflare staging or production E2E validation is established by the 31/31 CI result.
- **Deployment configuration:** the reviewed current Wrangler configuration declares `AGENT_IDENTITY` and `STAGING_INVOCATION_LEDGER`, but does not yet declare the required `MODEL_RUNNER` Service Binding, `PERMIT_REPLAY_GUARD` Durable Object binding, Workers AI binding for the isolated Model Runner, or complete separate staging configurations for both Workers.
- **Operational pause:** Cloudflare operations, deployments, and hosted E2E remain paused pending incident resolution and explicit authorization. This roadmap does not override that restriction.
- **Durable evidence:** the Merkle batcher is currently in-memory. Durable persistence, scheduling, an implemented external anchoring adapter, trusted timestamp integration, and independent receipt verification remain future work.
- **Cross-provider portability:** ports and Cloudflare adapters exist, but a second production-grade provider adapter and cross-provider conformance evidence have not been demonstrated.
- **Runtime attestation:** hardware-backed or independently measured runtime attestation is a future capability, not a current CORE 1.0 guarantee.
- **Trust Graph and cross-domain network:** a production trust graph, federated issuer governance, cross-organization verification network, and independent ecosystem adoption remain planned.
- **Continuous risk:** a complete production risk engine with validated detection quality, response orchestration, and operational metrics remains planned.
- **Agentic Commerce:** x402 and other payment integrations, transaction authorization in live payment environments, and any commercial transaction-fee model remain planned.
- **Identity assurance:** signed test artifacts and identity-related code do not establish universal real-world identity attribution. Key custody, issuer trust, certificate lifecycle, and independent identity assurance require further implementation and review.
- **Prompt-injection resistance:** deterministic test fixtures demonstrate specific tested denial paths. They do not prove general detection or prevention of all prompt-injection attacks.
- **Independent assurance:** no external penetration-test result, product certification, regulatory approval, or independent audit is claimed by this document.
- **Commercial traction:** no customer count, paid pilot, recurring revenue, strategic partnership, or market adoption is asserted without separately verifiable records.

### 8.4 Governance of claims and evidence

Every public technical claim must identify its scope, version, evidence source, test environment, date, and known limitations. CI, local simulation, hosted staging, production telemetry, external audit, and certification are different evidence classes and must never be conflated.

Any future capability should move through explicit states: **proposed → designed → implemented → locally tested → CI validated → staging validated → independently assessed (where applicable) → production approved**. A state may be claimed only when its exit criteria and supporting evidence are available.

Changes to production infrastructure, Cloudflare resources, protected branches, or deployment workflows require separate review and explicit authorization. This roadmap creates no such authorization.

**This document is the strategic North Star for ASTON's next 24 months. It defines the intended destination while preserving a strict distinction between what exists today, what has been tested, and what remains to be built and independently proven.**
