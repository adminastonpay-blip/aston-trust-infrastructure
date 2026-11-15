[![OpenSSF Best Practices](https://bestpractices.dev/projects/16476/badge)](https://bestpractices.dev/projects/16476)

# ASTON TRUST INFRASTRUCTURE (ATI)

## OpenSSF Best Practices — verified project status

**Project:** [aston-trust-infrastructure](https://www.bestpractices.dev/projects/16476)  
**OpenSSF project ID:** `16476`  
**Badge status shown in the owner-provided screenshots (2026-11-09):** **Passing**  
**Passing level completion shown:** **100%**  
**Progress by levels shown in the owner dashboard:** **113%**. OpenSSF explains this field as 100% for Passing plus progress beyond the highest achieved badge level; it must not be described as a 113% Passing score or as Silver/Gold.  
**Visible criteria in the screenshot:** Fundamentos 13/13; Control de cambios 9/9; Informes 8/8; Calidad 13/13; Seguridad 16/16; Análisis 8/8 (67/67 displayed items).

The badge is a project self-assessment in the OpenSSF Best Practices program. It is not an independent security audit, product certification, ISO certification, or proof that every deployment is secure. The status above is recorded from screenshots supplied by the project owner on 2026-11-09; the live badge is dynamic and should be checked at the official project page before reuse in external claims.

Official records: [Project assessment](https://www.bestpractices.dev/projects/16476) · [Dynamic badge](https://bestpractices.dev/projects/16476/badge)

---

**Version:** 2.0.0-draft + Pioneer Layer 2030 scaffolds  
**Status:** Architectural specification + reference prototype (not production-certified)  
**Organization:** ASTON OS  
**Related protocol:** [ARP-1 — Aston Risk Protocol](https://github.com/adminastonpay-blip/aston-risk-protocol)  
**Runtime integration:** Cloudflare Worker `agente-OS-15.5-hector-zapata` (branch `trust/decision-passport-v0`)

> **Intelligence. Governance. Evidence. Trust.**

## Pioneer Layer 2030 (category bets)

| Innovation | In this repo | Honest claim |
|------------|--------------|--------------|
| **ZK-Decision Passports** | `src/zk/commitment-passport.ts` | Hash commitments + predicate claims — **not** full SNARK |
| **Agent Insurance Protocol** | `src/insurance/coverage-protocol.ts` | Coverage seal + kill-switch logic — **not** a licensed insurer |
| **Proof-of-Intention (PoI)** | `src/poi/proof-of-intention.ts` | Inter-agent handshake package — **not** global consensus network |
| **Compose gate** | `src/pioneer/compose.ts` | Single decision gate wiring all three |

See [spec/PIONEER-2030.md](spec/PIONEER-2030.md) and [docs/PIONEER-ROADMAP.md](docs/PIONEER-ROADMAP.md).

## Classification

| Label | Meaning |
|-------|---------|
| **IMPLEMENTED** | Code or docs present |
| **VALIDATED** | Tests + reproducible evidence |
| **PRODUCTION** | Live deploy + monitoring + recovery proven |

## Four oceans + pioneer track

1. Zero-Trust Agentic Edge  
2. Algorithmic Provenance  
3. Stateful Micro-Edge  
4. Sovereign Economic Middleware  
5. **Pioneer 2030** — privacy audit track, algorithmic coverage, inter-agent intention  

## Vision 2035 — Three Strategic Breakthroughs

ASTON's long-term roadmap explores three next-generation capabilities built on the Trust Fabric, Protocol and Network:

1. **Agentic Escrow** — policy-controlled, evidence-conditioned settlement for machine-to-machine commerce.
2. **ZK-Agent Attestation** — privacy-preserving proofs that selected AI governance predicates were satisfied.
3. **Physical Attestation Edge** — hardware-rooted device identity and verifiable telemetry for robotics and industrial systems.

These are strategic research and product bets, not claims of current production capability. Cloudflare Wallets, x402 escrow flows, production ZK circuits and ESP32/ATECC608 device attestation each have availability, integration, security and regulatory dependencies. See the bilingual [Strategic Breakthroughs 2035](docs/STRATEGIC-BREAKTHROUGHS-2035.md) architecture and maturity boundaries.

## Core modules

| Module | Role |
|--------|------|
| `decision-lifecycle` | State machine IDENTIFY→…→AUDIT |
| `constitution` | Executable agent limits |
| `hmac-passport` | Open Decision Passport (HMAC-SHA256) |
| `zk/commitment-passport` | Privacy-oriented commitments |
| `insurance/coverage-protocol` | Seal + kill-switch |
| `poi/proof-of-intention` | Cross-agent handshake |
| `economic-passport` | Cost estimate structure |

```bash
npm test
```

## Explicit non-claims

- Full zero-knowledge SNARK/STARK circuits **not** shipped  
- On-chain collateral / regulated insurance **not** shipped  
- Universal agent TCP/IP network **not** shipped  
- OpenTimestamps / Bitcoin anchoring **not** integrated  
- Quantum resistance **not** asserted  

## Worker endpoints (trust branch)

```
GET  /v1/trust/status
POST /v1/trust/e2e
POST /v1/trust/verify
POST /v1/trust/constitution/evaluate
```

Secrets: `PII_HMAC_SECRET` or `API_KEY`.

## License & governance

See [LICENSING.md](LICENSING.md). Audit-first; human-authorized mutation only.
