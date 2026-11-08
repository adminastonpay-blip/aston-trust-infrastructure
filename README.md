# ASTON TRUST INFRASTRUCTURE (ATI)

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
