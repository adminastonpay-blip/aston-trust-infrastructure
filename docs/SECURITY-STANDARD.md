# ASTON Security Standard

**Status:** Approved reference standard  
**Scope:** `aston-attestation-sdk` (public), `agente-OS-15.5-hector-zapata` (private), and `aston-trust-infrastructure` (private).  
**Purpose:** Define the approved, cost-conscious security controls for the ASTON repositories. This document is a policy baseline; it does not assert that every listed tool is already installed, enabled, or passing.

## 1. Repository control matrix

| Control | Public: `aston-attestation-sdk` | Private: `agente-OS-15.5-hector-zapata` | Private: `aston-trust-infrastructure` |
|---|---|---|---|
| Repository licensing | Apache License 2.0, subject to legal/IP review and correct license-file/notice handling | No open-source license; retain proprietary rights | No open-source license; retain proprietary rights |
| CodeQL code scanning | Approved; use GitHub's free public-repository availability | Not part of the zero-cost baseline where GitHub Advanced Security is required | Not part of the zero-cost baseline where GitHub Advanced Security is required |
| Dependency Review | Approved and retained | Not enabled in the zero-cost baseline; private-repository eligibility may require paid GitHub security licensing | Not enabled in the zero-cost baseline; private-repository eligibility may require paid GitHub security licensing |
| OpenSSF Scorecard | Approved; run against the default branch (`main`) and report the actual result | Optional only if supported by repository visibility and the workflow's requirements; no result is implied | Optional only if supported by repository visibility and the workflow's requirements; no result is implied |
| SLSA provenance | Approved for public SDK releases; publish only the intended public provenance | Disabled; do not publish private-repository provenance to a public transparency log without separate explicit authorization | Disabled; do not publish private-repository provenance to a public transparency log without separate explicit authorization |
| Gitleaks | Approved | Approved | Approved |
| Trivy | Approved | Approved | Approved |
| Semgrep | Approved | Approved | Approved |
| OSV-Scanner | Approved | Approved | Approved |
| Dependabot Alerts and Security Updates | Approved | Approved | Approved |

**Licensing note:** Apache License 2.0 grants specified copyright and contributor patent rights; it does not grant ASTON a patent, register a patent, or guarantee protection of an ASTON invention. Confirm ownership, contribution rights, patent strategy, and release scope with qualified counsel before publishing the SDK under Apache-2.0. Do not add an open-source license to either private repository under this standard.

## 2. Approved security tools

The following tools are approved for evaluation and controlled integration in CI:

- **Semgrep (SAST):** static analysis for code vulnerabilities and risky patterns.
- **Trivy (SCA and artifact/configuration scanning):** vulnerability scanning for dependencies, container images, and supported configuration targets. Enable only the scanners relevant to each repository.
- **Gitleaks (secret scanning):** detects exposed credentials and secret-like values. Where practical, scan the full Git history as well as new changes.
- **OSV-Scanner (dependency vulnerability scanning):** checks supported dependency manifests and lockfiles against the OSV vulnerability database.
- **Dependabot:** dependency vulnerability alerts and security updates, subject to repository configuration and ecosystem support.
- **GitHub CodeQL:** code scanning for the public SDK under the free public-repository offering.
- **GitHub Dependency Review:** pull-request dependency-change review for the public SDK under the free public-repository offering.
- **OpenSSF Scorecard:** repository security-practice assessment. Its workflow must target the default branch; a workflow file or badge alone is not proof of a passing score.
- **SLSA GitHub generator:** provenance generation for public SDK artifacts only, with the publication and transparency implications understood.

No tool is considered deployed merely because it appears in this standard. Before integration, pin third-party GitHub Actions to reviewed immutable commit SHAs where possible, minimize token permissions, review permissions and data egress, and test on an isolated branch. Unknown or unreviewed tools (including proposed `flareguard` and `wrangler-audit`) are not approved by this document.

## 3. Interpreting evidence: CI, SLSA, and production

These evidence classes answer different questions and must not be conflated.

### CI result

A successful CI run means only that the checks actually executed by that workflow passed for the exact commit SHA reported by the run. Record the workflow, run URL, commit SHA, conclusion, and timestamp. A green build does not prove that every security control ran, that the deployed service matches the tested commit, or that production is secure.

### SLSA provenance

SLSA provenance is an attestation describing how a particular artifact was built, including supported builder and source information. Verify the attestation, its subject digest, builder identity, and source revision against the artifact being consumed. Provenance is not a vulnerability-free certificate, a security audit, or proof that the artifact is deployed. For private repositories, do not publish provenance to a public transparency log unless the repository owner separately and explicitly authorizes that disclosure.

### Production validation

Production validation requires evidence from the actual deployed environment: identify the deployed version/revision, verify the target environment and configuration, execute authorized runtime tests, inspect results and logs, and record the evidence. A local test, GitHub Actions pass, dry-run, build artifact, or SLSA attestation is not production validation. Do not claim production readiness, certification, or successful end-to-end validation without corresponding environment-specific evidence.

## 4. Minimum operating requirements

1. Keep changes isolated on reviewed branches and preserve the known-good default branch.
2. Use least-privilege GitHub Actions permissions; grant write permissions only to jobs that require them.
3. Pin third-party actions to immutable commit SHAs and review updates before adoption.
4. Keep dependency manifests and lockfiles accurate for the repository's actual package ecosystems.
5. Review alerts and scan findings; document accepted risks with owner, rationale, and review date.
6. Protect sensitive paths and require appropriate human review for security-critical changes.
7. Maintain a clear `SECURITY.md` with a private vulnerability-reporting route appropriate to the repository.
8. Report evidence against exact commit SHAs. Never infer a pass from a configured workflow, badge, or tool installation.
9. Do not deploy, change Cloudflare resources, or promote a release as a consequence of a CI result alone; require a separate authorized release and production-validation process.

## 5. Rollout and change control

This file defines the approved target control matrix, not an authorization to change workflows, repository settings, secrets, branches, pull requests, or Cloudflare resources. Any implementation must be separately scoped, reviewed, and authorized. Existing workflow behavior and open pull requests must remain unchanged unless an explicit change request says otherwise.

---

**Document owner:** ASTON Security Engineering  
**Review trigger:** Changes to repository visibility, licensing/IP strategy, GitHub plan entitlements, build/release architecture, or approved security tooling.
