import {test} from "node:test";
import assert from "node:assert/strict";
import {readFile,readdir} from "node:fs/promises";
import {join} from "node:path";
async function collect(dir){const entries=await readdir(new URL("../"+dir,import.meta.url),{withFileTypes:true});const out=[];
for(const e of entries){const p=join(dir,e.name);if(e.isDirectory())out.push(...await collect(p));else if(e.name.endsWith(".mjs"))out.push(p);}return out;}
test("Workers AI binding is isolated to the Model Runner service",async()=>{
 const files=await collect("src");
 for(const p of files.filter(x=>x!=="src/model-runner/worker.mjs"&&x!=="src/adapters/CloudflareAIProvider.mjs")){
  const s=await readFile(new URL("../"+p,import.meta.url),"utf8");assert.equal(/env\.AI\b|\.AI\.run\(/.test(s),false,p+" must not access AI");}
 const pep=await readFile(new URL("../src/worker/index.mjs",import.meta.url),"utf8");assert.equal(/env\.AI\b|AI\s*:/.test(pep),false);
 const runner=await readFile(new URL("../src/model-runner/worker.mjs",import.meta.url),"utf8");
 assert.match(runner,/verifyPermitToken/);assert.match(runner,/PERMIT_REPLAY_GUARD/);assert.match(runner,/CloudflareAIProvider\(env\.AI\)/);
});
test("Cloudflare SQL APIs are isolated behind the IDatabase adapter",async()=>{
 const files=await collect("src");
 for(const p of files.filter(x=>x!=="src/adapters/CloudflareSQLiteDatabase.mjs")){
  const s=await readFile(new URL("../"+p,import.meta.url),"utf8");
  assert.equal(/state\.storage\.sql|this\.state\.storage\.transactionSync/.test(s),false,p+" must use IDatabase");
 }
});
test("PEP Model Runner client signs a permit and calls only a service binding",async()=>{
 const s=await readFile(new URL("../src/core/model-runner.mjs",import.meta.url),"utf8");
 assert.match(s,/createPermitToken/);assert.match(s,/MODEL_RUNNER\.fetch/);assert.equal(/env\.AI\b/.test(s),false);
});
