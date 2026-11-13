import {describe,it,expect} from "vitest";
import {webcrypto} from "node:crypto";
import {createPermitToken,verifyPermitToken,encodePermitKey} from "../../src/core/permit-token.mjs";
import {buildMerkleTree,createMerkleProof,verifyMerkleProof} from "../../src/core/merkle-tree.ts";
import {EvidenceBatcher} from "../../src/core/merkle-batcher.mjs";
import {createViolationReport,verifyViolationReport} from "../../src/core/violation-report.ts";
import modelRunnerWorker from "../../src/model-runner/worker.mjs";
import {CloudflareSQLiteDatabase} from "../../src/adapters/CloudflareSQLiteDatabase.mjs";
import {CloudflareAIProvider} from "../../src/adapters/CloudflareAIProvider.mjs";
globalThis.crypto??=webcrypto;
describe("CORE 1.0 security modules",()=>{
 it("issues signed permits bound to exact inputs and rejects tampering/expiry",async()=>{
  const pair=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  const priv=encodePermitKey(await crypto.subtle.exportKey("pkcs8",pair.privateKey)),pub=encodePermitKey(await crypto.subtle.exportKey("spki",pair.publicKey));
  const authorization={decision:"ALLOW",action:"ai.inference",resourceId:"model-a",requestId:"request-0001",organizationId:"org-1",policyId:"p1",policyVersion:1};
  const inputs={prompt:"approved"},token=await createPermitToken({authorization,agentId:"agent-1",model:"model-a",inputs,privateKey:priv,keyId:"test",now:1800000000000});
  expect((await verifyPermitToken(token,pub,{keyId:"test",requestId:"request-0001",model:"model-a",inputs,organizationId:"org-1",agentId:"agent-1"},1800000001000))?.action).toBe("ai.inference");
  expect(await verifyPermitToken(token,pub,{requestId:"request-0001",model:"model-a",inputs:{prompt:"tampered"}},1800000001000)).toBeNull();
  expect(await verifyPermitToken(token,pub,{requestId:"request-0001",model:"model-a",inputs},1800000040000)).toBeNull();
  await expect(createPermitToken({authorization:{...authorization,decision:"DENY"},agentId:"a",model:"model-a",inputs,privateKey:priv,keyId:"test"})).rejects.toThrow();
 });
 it("builds Merkle roots, verifies inclusion and retains a failed batch",async()=>{
  const ds=["a","b","c"].map(x=>x.repeat(64)),tree=await buildMerkleTree(ds),proof=await createMerkleProof(ds,2);
  expect(tree.root).toMatch(/^[a-f0-9]{64}$/);expect(await verifyMerkleProof(proof)).toBe(true);
  expect(await verifyMerkleProof({...proof,root:"f".repeat(64)})).toBe(false);
  const batcher=new EvidenceBatcher({maxBatchSize:2});batcher.add(ds[0]);batcher.add(ds[1]);
  const prepared=await batcher.flush();expect(prepared.anchored).toBe(false);expect(batcher.size).toBe(2);
  await expect(batcher.flush({anchor:async()=>{throw Error("anchor down");}})).rejects.toThrow();expect(batcher.size).toBe(2);
  const anchored=await batcher.flush({anchor:async({root})=>({receipt:root})});
  expect(anchored.anchored).toBe(true);expect(anchored.batchId).toBe(prepared.batchId);expect(batcher.size).toBe(0);
 });
 it("rejects reuse of a signed permit at the Model Runner boundary",async()=>{
  const pair=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  const priv=encodePermitKey(await crypto.subtle.exportKey("pkcs8",pair.privateKey));
  const pub=encodePermitKey(await crypto.subtle.exportKey("spki",pair.publicKey));
  const authorization={decision:"ALLOW",action:"ai.inference",resourceId:"model-r",requestId:"request-replay-01",
    organizationId:"org-r",policyId:"policy-r",policyVersion:1};
  const inputs={prompt:"only once"};
  const token=await createPermitToken({authorization,agentId:"agent-r",model:"model-r",inputs,privateKey:priv,keyId:"permit-r"});
  const consumed=new Set();let modelCalls=0;
  const guard={idFromName:id=>id,get:id=>({fetch:async(input,init)=>{const req=new Request(input,init);const v=await req.json();
    if(consumed.has(v.tokenId))return Response.json({ok:false},{status:409});
    consumed.add(v.tokenId);return Response.json({ok:true});}})};
  const runnerEnv={AI:{run:async()=>{modelCalls++;return {ok:true};}},PERMIT_SIGNING_PUBLIC_KEY:pub,
    PERMIT_SIGNING_KEY_ID:"permit-r",PERMIT_REPLAY_GUARD:guard};
  const invoke=()=>modelRunnerWorker.fetch(new Request("https://runner.test/infer",{method:"POST",
    headers:{"content-type":"application/json",authorization:"Permit "+token},
    body:JSON.stringify({requestId:"request-replay-01",model:"model-r",inputs})}),runnerEnv,{});
  expect((await invoke()).status).toBe(200);
  expect((await invoke()).status).toBe(403);
  expect(modelCalls).toBe(1);
 });
 it("creates independently verifiable Ed25519 violation JSON",async()=>{
  const pair=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  const report=await createViolationReport({violationType:"SAFETY_INTERLOCK_BYPASS_ATTEMPT",observedAt:"2026-11-13T12:00:00Z",
   requestId:"req-violation-01",model:"model-a",actor:"unverified-caller",route:"/infer",details:{permitPresented:false}},pair.privateKey,"vk1");
  expect(await verifyViolationReport(report,pair.publicKey)).toBe(true);
  expect(await verifyViolationReport({...report,actor:"forged"},pair.publicKey)).toBe(false);
 });
 it("returns a signed violation report when the Model Runner receives no SafetyInterlock permit",async()=>{
  const pair=await crypto.subtle.generateKey({name:"Ed25519"},true,["sign","verify"]);
  const response=await modelRunnerWorker.fetch(new Request("https://runner.test/infer",{method:"POST",
    headers:{"content-type":"application/json"},body:JSON.stringify({requestId:"request-bypass-01",model:"model-a",inputs:{prompt:"x"}})}),{
      VIOLATION_SIGNING_PRIVATE_KEY:pair.privateKey,VIOLATION_SIGNING_KEY_ID:"violation-test"
    },{});
  expect(response.status).toBe(403);
  const body=await response.json();
  expect(body.error).toBe("INVALID_OR_MISSING_SAFETY_PERMIT");
  expect(await verifyViolationReport(body.violationReport,pair.publicKey)).toBe(true);
 });
 it("adapts SQLite and AI behind narrow ports",async()=>{
  const calls=[];const db=new CloudflareSQLiteDatabase({sql:{exec:(...args)=>{calls.push(args);return{toArray:()=>[{ok:true}]};}},transactionSync:fn=>fn()});
  expect(db.exec("SELECT ?",1).toArray()).toEqual([{ok:true}]);expect(db.transaction(()=>7)).toBe(7);expect(calls).toHaveLength(1);
  expect(await new CloudflareAIProvider({run:async(model,inputs)=>({model,inputs})}).run("m",{prompt:"x"})).toEqual({model:"m",inputs:{prompt:"x"}});
 });
});
