import { describe, it, expect } from "vitest";
import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";

const digest = "a".repeat(64);
let sequence = 0;
function unique(prefix) { sequence += 1; return prefix + "-" + sequence; }

async function createAgent(budgetTotalMinor = 100, organizationId = "org-integration") {
  const agentId = unique("agent");
  const stub = env.AGENT_IDENTITY.get(env.AGENT_IDENTITY.idFromName(organizationId + ":" + agentId));
  const registered = await stub.fetch("https://agent-identity/register", {
    method: "POST", headers: { "content-type": "application/json", "x-aston-tenant": organizationId },
    body: JSON.stringify({
      organizationId, agentId, identity: { status: "active" },
      policyId: "policy-integration", policyVersion: 1, currency: "USD", budgetTotalMinor
    })
  });
  expect(registered.status).toBe(200);
  return { agentId, stub, organizationId };
}
async function post(stub, path, body, tenant = "org-integration") {
  return stub.fetch("https://agent-identity" + path, {
    method: "POST",
    headers: { "content-type": "application/json", "x-aston-tenant": tenant },
    body: JSON.stringify(body)
  });
}

describe("CORE 1.0 SQLite Durable Object integration", () => {
  it("persists identity and budget state in the real Miniflare SQLite-backed DO", async () => {
    const { stub } = await createAgent(250);
    const first = await (await post(stub, "/reserve", {
      decisionId: unique("decision"), idempotencyKey: unique("idem"),
      requestDigest: digest, amountMinor: 75, policyVersion: 1
    })).json();
    expect(first.ok).toBe(true);
    const state = await runInDurableObject(stub, async (_instance, state) =>
      state.storage.sql.exec("SELECT budget_total, budget_reserved, budget_spent FROM agent_state").toArray()[0]
    );
    expect(state.budget_total).toBe(250);
    expect(state.budget_reserved).toBe(75);
    expect(state.budget_spent).toBe(0);
  });

  it("serializes concurrent reservations and prevents overspending in SQLite", async () => {
    const { stub } = await createAgent(100);
    const results = await Promise.all(Array.from({ length: 20 }, (_, index) => post(stub, "/reserve", {
      decisionId: unique("decision-" + index), idempotencyKey: unique("idem-" + index),
      requestDigest: digest, amountMinor: 10, policyVersion: 1
    })));
    const bodies = await Promise.all(results.map((response) => response.json()));
    expect(bodies.filter((body) => body.ok)).toHaveLength(10);
    const state = await runInDurableObject(stub, async (_instance, state) =>
      state.storage.sql.exec("SELECT budget_total, budget_reserved, budget_spent FROM agent_state").toArray()[0]
    );
    expect(state.budget_total - state.budget_reserved - state.budget_spent).toBe(0);
    expect(state.budget_reserved).toBe(100);
  });

  it("rejects Tenant B context when it attempts to access Tenant A's Durable Object", async () => {
    const { stub } = await createAgent(100, "tenant-a");
    const response = await post(stub, "/reserve", {
      decisionId: unique("cross-tenant-decision"), idempotencyKey: unique("cross-tenant-idem"),
      requestDigest: digest, amountMinor: 1, policyVersion: 1
    }, "tenant-b");
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ ok: false, error: "TENANT_MISMATCH" });
    const state = await runInDurableObject(stub, async (_instance, state) =>
      state.storage.sql.exec("SELECT budget_reserved FROM agent_state").toArray()[0]
    );
    expect(state.budget_reserved).toBe(0);
  });

  it("fails closed after a SQLite schema/storage failure and stays latched closed", async () => {
    const { stub } = await createAgent(100);
    await runInDurableObject(stub, async (_instance, state) => {
      state.storage.sql.exec("DROP TABLE agent_state");
    });

    const failed = await post(stub, "/reserve", {
      decisionId: unique("storage-failure"), idempotencyKey: unique("storage-failure-idem"),
      requestDigest: digest, amountMinor: 1, policyVersion: 1
    });
    expect(failed.status).toBe(503);
    expect((await failed.json()).error).toBe("STORAGE_UNAVAILABLE_FAIL_CLOSED");

    // Even if a later request arrives, the instance remains latched closed.
    // Recovery requires an operator-restored storage image and instance replacement.
    const subsequent = await post(stub, "/reserve", {
      decisionId: unique("after-storage-failure"), idempotencyKey: unique("after-storage-failure-idem"),
      requestDigest: digest, amountMinor: 1, policyVersion: 1
    });
    expect(subsequent.status).toBe(503);
    expect((await subsequent.json()).error).toBe("STORAGE_UNAVAILABLE_FAIL_CLOSED");
  });

  it("keeps a prior reservation unusable after committed revocation", async () => {
    const { stub } = await createAgent(100);
    const decisionId = unique("decision-revoke");
    const requestDigest = "b".repeat(64);
    const reserve = await post(stub, "/reserve", {
      decisionId, idempotencyKey: unique("idem-revoke"), requestDigest, amountMinor: 20, policyVersion: 1
    });
    expect((await reserve.json()).ok).toBe(true);
    await post(stub, "/revoke", { reasonCode: "KEY_COMPROMISED" });
    const consume = await post(stub, "/consume", { decisionId, requestDigest });
    expect(consume.status).toBe(403);
    expect((await consume.json()).error).toBe("IDENTITY_INACTIVE");
  });
});
