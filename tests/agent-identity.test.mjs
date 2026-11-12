import test from "node:test";
import assert from "node:assert/strict";
import { AgentIdentity } from "../src/worker/agent-identity.mjs";
import { CoreError } from "../src/core/errors.mjs";

/** Transactional in-memory SQL test double. Production class uses SQLite SQL API. */
class MemoryStorage {
  constructor() { this.agent = null; this.decisions = new Map(); this.storage = { sql: { exec: this.exec.bind(this) }, transactionSync: this.tx.bind(this) }; }
  exec(query, ...args) {
    const q = query.replace(/\\s+/g, " ").trim().toUpperCase();
    if (q.startsWith("CREATE TABLE")) return { toArray: () => [] };
    if (q.startsWith("SELECT * FROM AGENT_STATE")) return { toArray: () => this.agent ? [{ ...this.agent }] : [] };
    if (q.startsWith("SELECT AGENT_ID FROM AGENT_STATE")) return { toArray: () => this.agent ? [{ agent_id: this.agent.agent_id }] : [] };
    if (q.startsWith("SELECT * FROM DECISIONS WHERE IDEMPOTENCY_KEY")) return { toArray: () => [...this.decisions.values()].filter(x => x.idempotency_key === args[0]).map(x => ({...x})) };
    if (q.startsWith("SELECT * FROM DECISIONS WHERE DECISION_ID")) return { toArray: () => this.decisions.has(args[0]) ? [{...this.decisions.get(args[0])}] : [] };
    if (q.startsWith("INSERT INTO AGENT_STATE")) { this.agent = { organization_id:args[0], agent_id:args[1], identity_json:args[2], status:"active", policy_id:args[3], policy_version:args[4], currency:args[5], budget_total:args[6], budget_reserved:0, budget_spent:0, state_seq:1 }; return {toArray:()=>[]}; }
    if (q.startsWith("INSERT INTO DECISIONS")) { const [decision_id,idempotency_key,request_digest,amount_minor,policy_version,created_at]=args; this.decisions.set(decision_id,{decision_id,idempotency_key,request_digest,amount_minor,state:"reserved",policy_version,created_at}); return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE AGENT_STATE SET BUDGET_RESERVED = BUDGET_RESERVED +")) { this.agent.budget_reserved += args[0]; this.agent.state_seq++; return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE AGENT_STATE SET BUDGET_RESERVED = BUDGET_RESERVED -")) { this.agent.budget_reserved -= args[0]; this.agent.state_seq++; return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE AGENT_STATE SET BUDGET_SPENT = BUDGET_SPENT +")) { this.agent.budget_spent += args[0]; this.agent.state_seq++; return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE AGENT_STATE SET STATE_SEQ = STATE_SEQ +")) { this.agent.state_seq++; return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE AGENT_STATE SET STATUS = 'REVOKED'")) { this.agent.status="revoked"; this.agent.state_seq++; return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE DECISIONS SET STATE = 'CONSUMED'")) { this.decisions.get(args[0]).state="consumed"; return {toArray:()=>[]}; }
    if (q.startsWith("UPDATE DECISIONS SET STATE = 'SETTLED'")) { this.decisions.get(args[0]).state="settled"; return {toArray:()=>[]}; }
    throw new Error("Unimplemented SQL in test double: " + query);
  }
  tx(fn) {
    const before = structuredClone({agent:this.agent, decisions:this.decisions});
    try { return fn(); }
    catch (error) { this.agent=before.agent; this.decisions=before.decisions; throw error; }
  }
}
function makeDO() {
  const memory = new MemoryStorage();
  const state = { storage: memory.storage, blockConcurrencyWhile: (fn) => fn() };
  return { instance: new AgentIdentity(state, {}), memory };
}
const digest = "a".repeat(64);
async function setup() {
  const {instance, memory}=makeDO();
  await instance.register({organizationId:"org_test",agentId:"agent_test_01",identity:{status:"active"},policyId:"policy_0001",policyVersion:1,currency:"USD",budgetTotalMinor:100});
  return {instance,memory};
}

test("concurrent reservations cannot overspend the per-agent budget", async () => {
  const {instance}=await setup();
  const outcomes=await Promise.allSettled(Array.from({length:20},(_,i)=>instance.reserveBudget({
    decisionId:"decision_"+i,idempotencyKey:"idem_"+i,requestDigest:digest,amountMinor:10,policyVersion:1
  })));
  assert.equal(outcomes.filter(x=>x.status==="fulfilled").length,10);
  const state=await instance.getState();
  assert.equal(state.budgetReservedMinor,100);
  assert.equal(state.budgetSpentMinor,0);
});

test("revocation after reserve blocks the next consume", async () => {
  const {instance}=await setup();
  await instance.reserveBudget({decisionId:"decision_rev",idempotencyKey:"idem_rev",requestDigest:digest,amountMinor:25,policyVersion:1});
  await instance.revoke({reasonCode:"KEY_COMPROMISED"});
  await assert.rejects(()=>instance.consumeReservation({decisionId:"decision_rev",requestDigest:digest}),
    (error)=>error instanceof CoreError && error.code==="IDENTITY_INACTIVE");
  const state=await instance.getState();
  assert.equal(state.status,"revoked");
  assert.equal(state.budgetReservedMinor,25);
});

test("transaction rollback leaves state consistent after injected mid-transaction failure", async () => {
  const {instance,memory}=await setup();
  const original=memory.storage.transactionSync;
  let injected=false;
  memory.storage.transactionSync=(fn)=>original(()=> {
    const result=fn();
    if (!injected) { injected=true; throw new Error("simulated process failure before transaction commit"); }
    return result;
  });
  await assert.rejects(()=>instance.reserveBudget({decisionId:"decision_crash",idempotencyKey:"idem_crash",requestDigest:digest,amountMinor:40,policyVersion:1}));
  memory.storage.transactionSync=original;
  const state=await instance.getState();
  assert.equal(state.budgetReservedMinor,0);
  assert.equal(state.stateSeq,1);
  assert.equal(memory.decisions.size,0);
});
