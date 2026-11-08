# ASTON OS 21.x — Integration Plan
Scope: integrate ASTON OS with TRUST FABRIC without replacing the existing Worker or changing production bindings.

1. ARP-100 catalog and deterministic evaluator.
2. Guardian policy decision module.
3. Durable Object atomic budget reservation adapter (future).
4. Isolated Sandbox executor (future; verify current SDK/runtime).
5. Evidence manifest and R2 storage adapter.
6. Asymmetric passport signer and verifier.
7. Authenticated ASTON OS API adapter with tenant scoping.
8. Continuous assurance and revocation workflow.

Not complete in this reference branch: live scanner, active attack execution, Worker entrypoint, Wrangler binding changes, atomic Durable Object budget adapter, R2 retention configuration, ML-DSA key custody, Bitcoin anchoring, staging or production deployment, VBC issuance.

Acceptance: npm test passes; catalog has 100 unique tests and 25 per suite; missing evidence fails closed; Guardian denies missing signature/replay/budget reservation/tenant match/approval; ASTON OS Worker repository remains unchanged.