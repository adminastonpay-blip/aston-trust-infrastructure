# ASTON Cross-Repository Constitution Consumer Inventory

**Status:** READ-ONLY AUDIT / PARTIAL INVENTORY  
**Date:** 2026-11-17  
**Scope:** ASTON Trust Infrastructure, ASTON OS runtime, Attestation SDK, and ARP-1  
**Production status:** No production or Cloudflare execution was performed.

## Executive finding

ASTON currently contains at least two distinct constitution implementations:

1. `aston-trust-infrastructure/src/constitution.ts` — a reference-core evaluator with action, object-type, exposure, cost, call-budget, and model checks.
2. `agente-OS-15.5-hector-zapata/src/provenance/constitution.ts` — a separate runtime-side profile with allowed tools, budget, risk, evidence, and escalation fields.

These are not the same schema or implementation. No compatibility or shared enforcement relationship is established by the files inspected in this audit.

## Evidence inspected

### 1. Trust Infrastructure

- `src/constitution.ts` at inspected blob SHA `c60acbf7fc2d44f90b374147cd2ed8d841c09f89`.
- `tests/constitution.test.mjs` at inspected blob SHA `d7353c4d70b82b4b7989c31b0d38b31b719d961b`.
- `package.json` at inspected blob SHA `a95598a8c8074a2ebc4714568528bc0090833b43`.

The package describes itself as a private reference core and its check script explicitly says typechecking runs in the Worker repository because this package is source reference. The current constitution test file defines a local simplified `evaluate()` function instead of importing `src/constitution.ts`. Therefore these tests do not establish that the production source module is exercised.

Previously recorded source-level concerns remain open: permissive default action list including `execute`, wildcard model allowance, no enforcement of the human-approval signal in `allowed`, and an unused `max_frequency_per_hour` field.

### 2. ASTON OS runtime

Inspected:

- `src/provenance/constitution.ts` at blob SHA `b29c99fae060b479c10030a268af9c2f3d5d97f7`.
- `src/agents/governed.ts` at blob SHA `1e2f524760ca49e77d78bedc0e74913595d6cfc9`.
- `src/safety/policy.ts` at blob SHA `615f9f81f62b8b24258088d47e2eedd62ef03080`.
- `src/mcp/governance.ts` at blob SHA `00010acffef3721029ba910cd2a0801403127310`.

The runtime constitution is a distinct implementation. Its default tool allowlist is `reason`, `search`, and `graph_query`; it defines call/cost/write/time budgets, risk thresholds, evidence requirements, and escalation settings. Its `checkConstitution()` checks tool membership, budgets, and risk score.

The inspected governed-agent module calls `evaluateAccess()` and risk-envelope functions; the inspected policy module defines a separate `evaluatePolicy()`. The inspected MCP governance module identifies itself as a stub. These observations do not prove that the runtime constitution has no callers elsewhere.

### 3. Attestation SDK

The default-branch repository tree contains the attestation schema, proof-package example, verification script, security architecture, and governance documentation. No constitution implementation file appeared in the inspected tree. This is a tree-level observation, not proof that no indirect integration exists.

### 4. ARP-1

The default-branch tree contains the ARP-1 specification and integration document. Its README identifies ARP-1 as a draft standards proposal, not ratified. No executable constitution module appeared in the inspected tree.

## Search and completeness limitations

GitHub code-search requests returned zero results with `incomplete_results: true`; they cannot be used as proof of absence. The inventory is therefore partial. A complete consumer inventory still requires reliable repository-wide reference search or inspection of all relevant source files and build entry points.

## Required next steps

1. Establish every import/call site of both constitution implementations, including dynamic imports and build entry points.
2. Determine which evaluator, if any, is on an actual execution path and where its verdict is enforced.
3. Add tests that import the real source modules; do not duplicate simplified evaluators in tests.
4. Define a canonical versioned contract only after consumer and compatibility analysis.
5. Keep any runtime behavior changes in a separate implementation PR with adversarial tests and explicit rollback criteria.

## Disposition

- Cross-repository duplication: **CONFIRMED** (two distinct source modules inspected).
- Production use of either module: **NOT ESTABLISHED**.
- Complete caller inventory: **OPEN / INCOMPLETE**.
- Canonical shared contract: **NOT IMPLEMENTED**.
- Production validation: **NOT PERFORMED**.

This document is an audit artifact only. It changes no runtime code, schemas, migrations, workflows, secrets, Cloudflare resources, or deployments.
