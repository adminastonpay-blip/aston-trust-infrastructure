# ASTON OS 21.x — Integration Plan

Scope: integrate ASTON OS with TRUST FABRIC without replacing the existing Worker or changing production bindings.

## Implemented in the Trust Fabric branch

1. ARP-100 catalog and deterministic evaluator.
2. Guardian policy decision module.
3. Bounded Service Binding transport client with request/response size limits, run/case validation, and observation-only return semantics.
4. Unit tests for the transport boundary.
5. Staging-only target contract and release gates.

## Inspected, not modified

The connected private ASTON OS Worker repository was inspected read-only. Its current source identifies itself as version 21.6.3 and contains existing AI, D1, Queue and Durable Object bindings, including SafetyInterlock and Supervisor. Its current chat handler calls the AI service directly; the chat path is not currently wrapped by SafetyInterlock. The SafetyInterlock Durable Object has internal evaluation, approval and logging paths, but it is not a complete agent output guard or a full adversarial test harness.

No target Worker source, Wrangler configuration, bindings, secrets, databases, queues, migrations or deployments were changed.

## Remaining integration work

1. Prepare a separately named staging Worker and isolated D1/Queue/DO resources. Do not reuse production D1 or production queues.
2. Add a staging-only authenticated audit endpoint that is explicitly disabled unless an audit feature flag and secret are configured.
3. Ensure the endpoint traverses the actual control path and clearly scopes the first supported target (chat path versus tool-execution path). Do not claim full-system coverage from a chat-only adapter.
4. Add replay protection, tenant binding, request/token/concurrency/spend limits, kill switch and evidence correlation.
5. Configure the Service Binding only after verifying the staging Worker service name and environment.
6. Add an atomic Durable Object budget reservation adapter.
7. Add an isolated Sandbox executor only after validating the current Cloudflare runtime and SDK.
8. Add evidence manifest and R2 retention/versioning controls.
9. Add asymmetric passport signer/verifier and key custody.
10. Add continuous assurance, revocation and human release approval.

## Release gates

- No production target and no real customer data.
- Staging uses distinct Worker name and isolated data resources.
- Missing secret, feature flag, policy, binding, or evidence fails closed.
- Tests cover authentication, tenant isolation, replay, size limits, cost limits, kill switch, and non-execution of destructive actions.
- CI passes on the exact proposed commit.
- Human review approves the evidence and deployment plan.

No staging or production deployment, VBC issuance, Sandbox execution, R2 retention guarantee, atomic budget reservation, ML-DSA deployment or Bitcoin anchoring is claimed.
