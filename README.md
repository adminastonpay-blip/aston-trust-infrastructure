# ASTON TRUST INFRASTRUCTURE (ATI)

**Version:** 2.0.0-draft  
**Status:** Architectural specification + reference prototype (not production-certified)  
**Organization:** ASTON OS  
**Related protocol:** [ARP-1 — Aston Risk Protocol](https://github.com/adminastonpay-blip/aston-risk-protocol)  
**Runtime integration:** Cloudflare Worker `agente-OS-15.5-hector-zapata` (branch `trust/decision-passport-v0`)

> **Intelligence. Governance. Evidence. Trust.**

ATI defines how automated decisions are **identified, authorized, budgeted, executed, verified, and recorded** — without claiming capabilities that lack reproducible proof.

## Classification

| Label | Meaning |
|-------|---------|
| **IMPLEMENTED** | Code or docs present |
| **VALIDATED** | Tests + reproducible evidence |
| **PRODUCTION** | Live deploy + monitoring + recovery proven |

Most ATI components today are **IMPLEMENTED** or **partial**. See [docs/ATI-2.0-GAP-MATRIX.md](docs/ATI-2.0-GAP-MATRIX.md).

## Four oceans (summary)

1. **Zero-Trust Agentic Edge** — constitutions, envelopes, fail-closed  
2. **Algorithmic Provenance** — Decision Passport, hashes, independent verify  
3. **Stateful Micro-Edge** — durable coordination (runtime-side)  
4. **Sovereign Economic Middleware** — budgets and attributable cost estimates  

## Reference prototype (this repo)

```
spec/ATI-2.0.md          Master architecture (summary)
src/                     Portable TypeScript modules
tests/                   Node unit tests
docs/                    Gap matrix, licensing, provenance
```

### Core modules

| Module | Role |
|--------|------|
| `decision-lifecycle` | State machine IDENTIFY→…→AUDIT |
| `constitution` | Executable agent limits |
| `hmac-passport` | Stable Decision Passport (HMAC-SHA256) |
| `economic-passport` | Cost estimate structure (not an invoice) |
| `canonical-hash` | Deterministic SHA-256 payloads |

### Run tests

```bash
npm test
```

## Explicit non-claims

- OpenTimestamps / Bitcoin anchoring **not** integrated here  
- Quantum resistance **not** asserted  
- Selective disclosure / ZK **not** implemented  
- Cost figures are **estimates** unless measured against a provider invoice  

## Worker endpoints (when integrated)

```
GET  /v1/trust/status
POST /v1/trust/e2e
POST /v1/trust/verify
POST /v1/trust/constitution/evaluate
```

Requires secrets: `PII_HMAC_SECRET` or `API_KEY` on the Cloudflare Worker.

## License

- Specification text: see [LICENSING.md](LICENSING.md)  
- Code: proprietary unless otherwise stated  
- Marks and commercial use: reserved  

## Governance

Read-only / audit-first. No autonomous production mutation. Human-authorized changes only.
