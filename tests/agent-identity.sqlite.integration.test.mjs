import { describe, it, expect } from "vitest";
import { env } from "cloudflare:workers";
import { runInDurableObject } from "cloudflare:test";

const digest = "a".repeat(64);
let sequence = 0;
function unique(prefix) { sequence += 1; return prefix + "-" + sequence; }

async function createAgent(budgetTotalMinor = 100) {
  const agentId = unique("agent");
  const stub = env.AGENT_IDENTITY.get(env.AGENT_IDENTITY.idFromName("org-integration:" + agentId));
  const registered = await stub.fetch("https://agent-identity/register", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({
      organizationId: "org-integration", agentId, identity: { status: "active" },
      policyId: "policy-integration", policyVersion: 1, currency: "USD", budgetTotalMinor
    })
  });
  expect(registered.status).toBe(200);
  return { agentId, stub };
}
async function post(stub, path, body) {
  return stub.fetch("https://agent-identity" + path, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body)
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
