/** PEP-side client. No Workers AI binding is available in this process. */
import { createPermitToken } from "./permit-token.mjs";
import { recordModelInvocation } from "../staging/harness.mjs";
export async function runAuthorizedModel({env,agentStub,authorization,agentId,model,inputs}) {
  try {
    if(!env.MODEL_RUNNER||typeof env.MODEL_RUNNER.fetch!=="function")
      return Response.json({ok:false,decision:"DENY",error:"MODEL_RUNNER_UNAVAILABLE"},{status:503});
    const permit=await createPermitToken({authorization,agentId,model,inputs,
      privateKey:env.PERMIT_SIGNING_PRIVATE_KEY,keyId:env.PERMIT_SIGNING_KEY_ID});
    const response = await env.MODEL_RUNNER.fetch(new Request("https://model-runner.internal/infer",{
      method:"POST",headers:{"content-type":"application/json",authorization:"Permit "+permit},
      body:JSON.stringify({requestId:authorization.requestId,model,inputs})
    }));
    if (response.ok && env.STAGING_HARNESS_ENABLED === "true") {
      try {
        await recordModelInvocation(env, authorization.requestId);
      } catch {
        return Response.json({
          ok:false,decision:"DENY",error:"MODEL_INVOCATION_LEDGER_UNAVAILABLE",
          modelInvocationMayHaveCompleted:true,requestId:authorization.requestId
        },{status:503});
      }
    }
    return response;
  } catch {
    return Response.json({ok:false,decision:"DENY",error:"MODEL_RUNNER_UNAVAILABLE"},{status:503});
  } finally {
    try { await agentStub.fetch("https://agent-identity/finish-model",{method:"POST",
      headers:{"content-type":"application/json","x-aston-tenant":authorization.organizationId},
      body:JSON.stringify({requestId:authorization.requestId})}); } catch { /* fail closed: lease remains */ }
  }
}
