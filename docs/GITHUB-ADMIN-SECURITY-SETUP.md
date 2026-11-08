# GitHub Administrative Security Controls — ASTON Trust Infrastructure

This checklist covers GitHub repository settings that cannot be activated by committing workflow files. Confirm each setting in the repository UI before calling it enabled.

## Repository visibility and IP
- Intended architecture: keep `aston-risk-protocol` public as the deliberately published protocol/specification; keep the implementation repository `aston-trust-infrastructure` private unless its owner explicitly chooses public disclosure.
- Before changing public to private, review forks and clones. GitHub states existing public forks remain public and detach from the original repository after visibility changes.
- Review the existing ARP-1 CC BY 4.0 grant separately; changing this repository's visibility does not revoke prior permissions on ARP-1.

## Security and analysis
Settings → Security & analysis:
- Enable dependency graph (where applicable).
- Enable Dependabot alerts.
- Enable Dependabot security updates.
- Enable secret scanning and push protection if the plan/repository type supports them.
- Enable CodeQL default/advanced setup if Code Security entitlement supports it. This repository also contains a CodeQL workflow.
- Review all existing alerts; rotate any real exposed credential. Do not treat scanner success as proof that no secret was ever exposed.

## Rulesets for main
Create a ruleset targeting `main`:
- Require pull requests; block direct pushes where operationally feasible.
- Require at least one approval from a reviewer other than the author.
- Require CODEOWNERS review for protected paths.
- Dismiss stale approvals when new commits are pushed.
- Require all review conversations resolved.
- Require status checks for Trust Fabric CI, Gitleaks, npm audit, CodeQL, and OpenSSF Scorecard once stable.
- Block force pushes and branch deletion.
- Restrict bypass to named emergency administrators and audit every bypass.
- Consider signed commits and linear history if compatible with the release process.

## Actions and access
Settings → Actions:
- Set default `GITHUB_TOKEN` permissions to read-only.
- Require approval for workflows from outside collaborators.
- Restrict allowed actions to GitHub-owned and verified creators or explicitly approved actions.
- Keep actions pinned to full commit SHAs (new security workflows do this).
- Review environments and require approvals for any future release deployment.

## Identity and incident readiness
- Enforce MFA/passkeys on the GitHub account.
- Remove stale collaborators and use least-privilege access.
- Replace broad classic PATs with fine-grained, short-lived tokens where possible.
- Maintain a credential inventory, rotation procedure, incident contacts, and backup/recovery plan.

## Verification record
Record the date, operator, setting state, plan/entitlement limitation, and screenshot or audit evidence for each setting. Do not label a control enabled until it is verified in GitHub.
