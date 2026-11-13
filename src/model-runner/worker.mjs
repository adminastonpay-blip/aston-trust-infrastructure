import { CloudflareAIProvider } from "../adapters/CloudflareAIProvider.mjs";
import { verifyPermitToken } from "../core/permit-token.mjs";
import { createViolationReport } from "../core/violation-report.ts";
export { PermitReplayGuard } from "./PermitReplayGuard.mjs";
const json=(body,status=200)=>Response.json(body,{status,headers:{"cache-control":"no-store"}});
async function violation(env,body,reason,permitPresented) {
  try {
    if(!env.VIOLATION_SIGNING_PRIVATE_KEY||!env.VIOLATION_SIGNING_KEY_ID)
      return json({ok:false,decision:"DENY",error:reason,violationReport:"SIGNING_UNAVAILABLE"},403);
    const report=await createViolationReport({violationType:reason,observedAt:new Date().toISOString(),
      requestId:typeof body?.requestId==="string"?body.requestId:null,
      model:typeof body?.model==="string"?body.model:null,actor:"unverified-caller",route:"/infer",
      details:{permitPresented}},env.VIOLATION_SIGNING_PRIVATE_KEY,env.VIOLATION_SIGNING_KEY_ID);
    return json({ok:false,decision:"DENY",error:reason,violationReport:report},403);
  } catch {return json({ok:false,decision:"DENY",error:reason,violationReport:"SIGNING_FAILED"},403);}
}
export default {async fetch(request,env) {
  if(new URL(request.url).pathname!=="/infer"||request.method!=="POST")return json({ok:false,error:"NOT_FOUND"},404);
  let body;try{const raw=await request.text();if(raw.length>65536)return json({ok:false,error:"REQUEST_TOO_LARGE"},413);body=JSON.parse(raw);}
  catch{return json({ok:false,error:"INVALID_JSON"},400);}
  const rawPermit=request.headers.get("authorization");
  const token=rawPermit?.startsWith("Permit ")?rawPermit.slice(7):null;
  const claims=await verifyPermitToken(token,env.PERMIT_SIGNING_PUBLIC_KEY,{
    keyId:env.PERMIT_SIGNING_KEY_ID,requestId:body?.requestId,model:body?.model,inputs:body?.inputs});
  if(!claims)return violation(env,body,"INVALID_OR_MISSING_SAFETY_PERMIT",Boolean(token));
  if(!env.PERMIT_REPLAY_GUARD)return json({ok:false,decision:"DENY",error:"PERMIT_REPLAY_GUARD_UNAVAILABLE"},503);
  try {
    const guard=env.PERMIT_REPLAY_GUARD.get(env.PERMIT_REPLAY_GUARD.idFromName(claims.tokenId));
    const result=await guard.fetch("https://permit-replay-guard/consume",{method:"POST",
      headers:{"content-type":"application/json"},body:JSON.stringify({tokenId:claims.tokenId,expiresAt:claims.expiresAt})});
    if(!result.ok)return violation(env,body,"PERMIT_REPLAY_OR_GUARD_REJECTION",true);
  } catch{return json({ok:false,decision:"DENY",error:"PERMIT_REPLAY_GUARD_UNAVAILABLE"},503);}
  try {
    const output=await new CloudflareAIProvider(env.AI).run(body.model,body.inputs);
    return json({ok:true,decision:"ALLOW",requestId:claims.requestId,policyId:claims.policyId,policyVersion:claims.policyVersion,output});
  } catch{return json({ok:false,decision:"DENY",error:"MODEL_EXECUTION_FAILED",requestId:claims.requestId},502);}
}};
