# Security Policy — ASTON Trust Infrastructure

**Status:** Draft operational policy; not a completed security certification.

## Reporting vulnerabilities
- Do not publish exploit details, credentials, tenant data, private keys, or customer evidence in public issues.
- Use GitHub private vulnerability reporting when enabled. Otherwise contact the repository owner through a verified private channel before disclosure.
- Include affected commit/release, impact, prerequisites, reproducibility, and a safe remediation proposal.
- Do not test production, third-party systems, or customer data without written authorization.

## Secret handling
- Never commit API tokens, passwords, private keys, signing seeds, raw customer evidence, personal data, or production configuration.
- Store runtime secrets using Cloudflare secrets or an approved secret manager. Never place secret values in Wrangler vars, source files, issues, CI logs, or artifacts.
- Separate development, staging, and production credentials and resources.
- Revoke/rotate suspected exposed credentials. Deleting a visible file is not sufficient; inspect history, logs, caches, releases, and artifacts.
- Treat Git history and CI artifacts as disclosure surfaces.

## Security gates
- Deny by default when identity, policy version, authorization, binding, signature, or required evidence is missing or invalid.
- Bound request size, execution time, retries, concurrency, and cost.
- Require human approval for high-impact or irreversible actions.
- Keep audit and verification paths read-only unless an explicit authorization contract exists.
- Require tests, dependency review, secret scanning, and isolated deployment review before release.

The current Trust Fabric implementation is a reference prototype. Passing tests are not a production security certification. This draft policy claims no response-time SLA.
