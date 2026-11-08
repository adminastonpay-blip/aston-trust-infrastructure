# ASTON TRUST INFRASTRUCTURE (ATI)

**Version:** 2.0.0-draft + ASTON OS 21.x Trust Fabric integration track  
**Status:** Reference implementation and architecture; not production-certified or deployed  
**Organization:** ASTON OS  
**Related protocol:** [ARP-1 — Aston Risk Protocol](https://github.com/adminastonpay-blip/aston-risk-protocol)

> **Intelligence. Governance. Evidence. Trust.**

## ASTON OS Trust Fabric

This repository is the independent assurance plane for ASTON OS. It is additive: it does not replace the operational ASTON OS Worker or change its production bindings, secrets, migrations or deployments.

| Module | Responsibility | Current state |
|---|---|---|
| ASTON Audit Engine | ARP-100 catalog and deterministic evaluation | Reference code + CI tests |
| ASTON Guardian | Deny-by-default policy decision function | Pure function; no proxy/atomic storage adapter |
| ASTON OS transport adapter | Bounded authenticated Service Binding client | Implemented and unit-tested; binding not configured |
| Evidence Ledger | Evidence manifests, retention and verification | Architecture only |
| VBC Authority | Scoped passports, signature lifecycle and revocation | Architecture only |
| Threat Intelligence | Versioned threats mapped to tests | Roadmap |
| Command Plane | Tenant and operator workflows | Roadmap |

## ARP-100 catalog

`attack-catalog/arp-100.v1.json` contains 100 structured cases across four suites, 25 each:
- Prompt injection
- Denial of wallet
- Fail-closed constitutional controls
- Privacy and data protection

Cases use safe fixtures. Active adversarial execution requires an explicitly authorized isolated clone. Destructive operations are simulated. Synthetic control cases check against over-blocking. Missing observations fail closed. A passing campaign is not automatically a VBC certificate.

## Existing ATI capabilities

| Module | Role |
|---|---|
| `decision-lifecycle` | Decision state machine |
| `constitution` | Executable agent constraints |
| `hmac-passport` | Shared-secret HMAC integrity passport |
| `zk/commitment-passport` | Hash commitments and predicate claims; not a full SNARK |
| `insurance/coverage-protocol` | Coverage seal and kill-switch scaffold; not regulated insurance |
| `poi/proof-of-intention` | Inter-agent handshake scaffold |
| `economic-passport` | Cost-estimate structure |

## Validation labels

- **IMPLEMENTED:** source or documentation exists.
- **VALIDATED:** reproducible tests and evidence pass.
- **STAGING:** deployed to a non-production environment with reviewed configuration.
- **PRODUCTION:** approved deployment, monitoring, rollback, backup/restore and incident procedures demonstrated.

## Explicit non-claims

- No active scanning of live third-party agents or production ASTON OS.
- The Service Binding client is a transport adapter only; no Worker binding or target endpoint is configured.
- No Sandbox execution adapter or atomic Durable Object budget reservation yet.
- No R2 immutability claim until retention/versioning is verified.
- No public-verifiable asymmetric or post-quantum certificate issuance yet.
- No Bitcoin/OpenTimestamps integration.
- No regulated insurance, legal safe harbor or universal safety guarantee.
- No production or staging deployment is claimed.

## Tests

```bash
npm test
```

## Runtime integration

The Cloudflare Service Binding transport helper is implemented and unit-tested, but it is not connected to a live Worker. The target Worker was inspected read-only; no target-side code, Wrangler bindings, secrets, databases, queues, migrations or deployments were changed. A staging clone and isolated data resources must be prepared before configuring the binding.

See `docs/ASTON-OS-TRUST-FABRIC-MASTER-ARCHITECTURE.md`, `docs/ASTON-OS-21X-INTEGRATION-PLAN.md`, and `docs/ASTON-OS-AUDIT-TRANSPORT-CONTRACT.md`.
