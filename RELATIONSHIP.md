# Repository relationship

```text
aston-risk-protocol          → ARP-1 risk scoring / envelopes (spec)
aston-trust-infrastructure   → ATI 2.0 trust architecture + reference core (this repo)
agente-OS-15.5-hector-zapata → Cloudflare Worker runtime (integrates both)
```

Worker branch carrying first integration: `trust/decision-passport-v0`

Do not merge experimental ATI claims into Worker `main` without human approval and tests.
