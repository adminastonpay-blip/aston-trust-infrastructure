# ASTON OS 15.5 — Execution & Authorization Trace (Pass 1B)

**Status:** SOURCE-OBSERVED / NOT RUNTIME-VALIDATED  
**Review date:** 2026-11-17  
**Inspected repository:** `adminastonpay-blip/agente-OS-15.5-hector-zapata`  
**Inspected ref:** `main`  
**Scope:** targeted source paths listed below. This is not a penetration test and does not establish exploitability from the public internet.

## 1. Request execution path observed

```text
HTTP request
  -> Worker fetch() [src/index.ts]
  -> staging route allowlist
  -> staging audit handler (only /v1/audit-target; requires AUDIT_SECRET)
  -> resolveIdentity()
  -> rate limit + request body limit
  -> authorizeApiRequest()
  -> route handlers (risk / governed agents / provenance / infra / ...)
  -> optional Durable Object / D1 / external binding calls
```

Evidence:
- `src/index.ts`: `fetch()` lines 308–355 and route dispatch lines 418–480.
- `src/lib/identity.ts`: identity resolution delegates to `authenticate()`, otherwise anonymous identity.
- `src/security/mvsp-access.ts`: explicit public allowlists; non-public writes require authenticated admin/executor.
- `src/auth.ts`: Cloudflare Access JWT and API-key identity construction.

The order places rate limiting and request-size enforcement before central API authorization. The staging audit route is handled before ordinary identity resolution, but its own handler requires staging profile, AUDIT_ENABLED, a 32-character-or-longer AUDIT_SECRET, bounded body, schema validation and a one-time audit claim.

## 2. Confirmed source-level control gap: AccessPolicy require_approval is not enforced by callers

**ID:** AUTHZ-REQAPP-001  
**Severity:** HIGH — source-level control gap; runtime impact not independently tested  
**Files:**
- `src/access/access.ts` lines 4–5, 123–185, 284–314.
- `src/agents/governed.ts` lines 51–56, 214–220, 244–256.
- Other call sites require a repository-wide follow-up.

The access engine explicitly supports `AccessEffect = "allow" | "deny" | "require_approval"` and can return the matched policy effect. However, the inspected governed-agent call sites reject only `effect === "deny"`. An access decision of `require_approval` therefore does not itself stop plan creation, approval or execution at these call sites. The secure-read path also checks only for `deny`.

This is distinct from the SafetyInterlock policy's own pending-approval workflow. The access-policy layer must either implement a complete approval state transition or fail closed for `require_approval`; it must not silently treat that value as allow.

**Required remediation proposal (not implemented):**
1. Centralize enforcement of AccessEffect; only `allow` may proceed.
2. Route `require_approval` into a durable approval workflow bound to tenant, actor, resource, action, policy version and expiry.
3. Re-evaluate the policy at approval and execution time.
4. Add tests proving `deny` and `require_approval` cannot reach side effects without the required approval.

## 3. Confirmed source-level fail-open branch: unexpected SafetyInterlock status can reach tool execution

**ID:** INTERLOCK-STATUS-001  
**Severity:** HIGH — defensive fail-closed gap; exploitability depends on whether an unexpected 2xx response can occur  
**File:** `src/do/agent-node.ts` lines 38–56 and 95–123.

For each planned tool call, the code explicitly blocks `denied` and `pending_approval`, but then invokes `runTool()` for any other status. The initial planning and final synthesis gates correctly require `status === "allowed"`; the per-tool gate is inconsistent.

The current SafetyInterlock implementation normally returns the known statuses, and `safetyCheck()` maps non-2xx, JSON parse errors and thrown failures to denied. However, a malformed or unexpected successful response (for example, a future status value or protocol mismatch) is not rejected by the per-tool branch.

**Required remediation proposal (not implemented):**
- Change the per-tool condition to require `gate.status === "allowed"`; every other value must block.
- Validate the response schema and allowed status enum at the boundary.
- Add adversarial tests for missing status, unknown status, wrong JSON type, malformed response, non-2xx, timeout and thrown exception.
- Ensure no tool adapter is invoked for any result except exact `allowed`.

## 4. API-key tenant model — shared administrative identity risk

**ID:** TENANT-APIKEY-001  
**Severity:** HIGH if the same API_KEY is distributed across tenant/customer boundaries; otherwise internal service-account risk  
**File:** `src/auth.ts` lines 102–108.

The configured API key maps to a single identity with:
- tenant: `default`
- roles: `admin`, `executor`
- method: `apikey`

The sensor path maps the same secret to tenant `ops` with a sensor role. The source does not show whether the key is strictly internal, unique per customer, or exposed to tenant applications. If shared across customer boundaries, this collapses tenant isolation and grants broad privileges within the `default` tenant.

**Required evidence:** inventory all API_KEY consumers, issuance, distribution, rotation and customer exposure. Do not assume the key is private merely because it is a secret binding.

**Required remediation proposal:** replace shared customer-facing API keys with per-tenant, scoped, revocable identities; reserve any global service key for isolated machine-to-machine use with explicit audience and narrow scopes.

## 5. Positive controls observed — not independently validated

- Worker central authorization rejects unauthenticated non-public writes and requires admin/executor for non-public write methods (`src/security/mvsp-access.ts`).
- Cloudflare Access JWT verification checks RS256, issuer, audience, expiry, not-before, key ID and signature (`src/auth.ts`).
- Missing Access tenant claim derives an unassigned tenant from an actor fingerprint rather than collapsing all such users into one tenant (`src/auth.ts`).
- Chat session Durable Object names are derived from method, tenant, actor and session ID (`src/security/session-key.ts`); anonymous chat history is not persisted (`src/index.ts`).
- AgentNode's planning and synthesis gates require exact `allowed`; missing SAFETY or request failure returns denied (`src/do/agent-node.ts`).
- Governed plan and action queries inspected here are tenant-scoped (`src/agents/governed.ts`).
- The sandbox execution endpoint currently returns a placeholder and does not execute code; it explicitly states that actual execution is unavailable until a container binding is configured (`src/do/safety-interlock.ts`).

These controls have not been exercised in adversarial runtime tests.

## 6. Durable Object trust boundary

The inspected `SafetyInterlock.fetch()` routes accept identity, tenant, actor and operator values in request bodies and do not independently authenticate the caller. This may be acceptable only if the Durable Object is exclusively reachable through trusted Worker bindings and every calling path constructs those values from verified identity. The inspected source alone does not establish that assumption for every binding/caller.

**ID:** DO-BOUNDARY-001  
**Severity:** HIGH / NOT VERIFIED  
**Required next work:** inventory every `SAFETY.get(...)` call, verify that only trusted Worker code can reach the binding, trace caller identity provenance, and ensure no public route proxies arbitrary body-supplied identity or operator fields. If any untrusted caller can reach these handlers, add authenticated caller context or a capability token bound to the specific operation and tenant.

## 7. Agent execution flow and observed boundaries

```text
/v1/agents/plans POST
  -> central Worker authorization
  -> createPlan()
  -> evaluateAccess(create agent_plan)
  -> risk envelope gate
  -> persist plan/actions as pending_approval (current code sets this status in both non-deny branches)
  -> audit + lineage

/v1/agents/plans/{id}/approve POST
  -> central Worker authorization
  -> approvePlan()
  -> tenant-scoped plan lookup
  -> evaluateAccess(execute agent_plan)
  -> update status approved/rejected

/v1/agents/plans/{id}/execute POST
  -> central Worker authorization
  -> executePlan()
  -> tenant-scoped plan lookup + status === approved
  -> evaluateAccess(execute agent_plan)
  -> per-action exposure gate
  -> per-action evaluateAccess
  -> simulated action result + D1 update + lineage + audit
```

Important caveat: current `executePlan()` action results are explicitly marked `simulated: true`; this review does not treat them as real external execution. A separate review must inspect every other tool/connector path.

## 8. Next targeted review

1. Enumerate all callers of `evaluateAccess()` and classify how each handles `allow`, `deny`, and `require_approval`.
2. Enumerate every `SAFETY`, `AGENT_NODE`, `GRAPH`, `SESSION` and other Durable Object binding caller.
3. Inspect `src/safety/policy.ts` for identity/action scoring and all override modes.
4. Trace `handleStagingAudit` and staging-only environment gates against deployment configuration (without accessing production).
5. Inspect D1 schema constraints and mutation queries for tenant scoping, especially updates/deletes and resource ownership.
6. Add isolated tests for unknown SafetyInterlock status and AccessEffect require_approval. No production integration.

## 9. Evidence status

All findings above are **OBSERVED IN SOURCE**. None is marked TESTED, VALIDATED or PRODUCTION. No source code in the audited repository was changed. This report is documentation-only and belongs to the independent Stage 0 audit branch.
