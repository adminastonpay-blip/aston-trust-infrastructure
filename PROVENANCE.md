# Provenance

| Item | Status |
|------|--------|
| Spec version | 2.0.0-draft |
| First commit of this repo | 2026-11-08 |
| OpenTimestamps of this tree | **Not applied** — do not claim Bitcoin anchor |
| Source extraction | Modules mirrored from Worker branch `trust/decision-passport-v0` |

## How to seal (future)

1. Freeze release tag  
2. Generate `SHA256SUMS.txt` over release artifacts  
3. Stamp with OpenTimestamps  
4. Publish `.ots` **and** the exact `SHA256SUMS.txt` side by side  
5. Independent verify against Bitcoin  

Until steps 3–5 succeed, status remains **unsigned draft**.
