const deny=(reasons,version)=>({decision:"DENY",reasons,policy_version:version??"unknown",forward_request:false});
export function evaluateGuardianRequest(request,constitution,runtime={}){
 const version=constitution?.version??"unknown",reasons=[];
 if(!request||typeof request!=="object")return deny(["invalid_request"],version);
 if(!constitution||typeof constitution!=="object")return deny(["constitution_missing"],version);
 if(!request.agent_id||request.agent_id!==constitution.agent_id)reasons.push("agent_identity_mismatch");
 if(!request.tenant||request.tenant!==constitution.tenant)reasons.push("tenant_mismatch");
 if(constitution.revoked===true)reasons.push("constitution_revoked");
 if(Number.isFinite(constitution.expires_at)&&constitution.expires_at>0&&Date.now()>=constitution.expires_at)reasons.push("constitution_expired");
 if(runtime.signature_verified!==true)reasons.push("signature_not_verified");
 if(runtime.replay_detected===true)reasons.push("replay_detected");
 if(typeof request.action!=="string"||!request.action)reasons.push("action_missing");
 if(constitution.denied_actions?.includes(request.action))reasons.push("action_explicitly_denied");
 if(Array.isArray(constitution.allowed_actions)&&!constitution.allowed_actions.includes(request.action))reasons.push("action_not_allowlisted");
 if(Array.isArray(constitution.models_allowed)&&constitution.models_allowed[0]!=="*"&&!constitution.models_allowed.includes(request.model))reasons.push("model_not_allowlisted");
 if(typeof request.object_type!=="string"||!constitution.allowed_object_types?.includes(request.object_type))reasons.push("object_type_not_allowlisted");
 if(!Number.isFinite(request.estimated_cost)||request.estimated_cost<0)reasons.push("invalid_cost_estimate");
 if(Number.isFinite(request.estimated_cost)&&Number.isFinite(constitution.max_budget_cost)&&request.estimated_cost>constitution.max_budget_cost)reasons.push("request_cost_exceeds_constitution");
 if(!Number.isInteger(runtime.used_calls)||runtime.used_calls<0)reasons.push("budget_state_unavailable");
 if(Number.isInteger(runtime.used_calls)&&Number.isFinite(constitution.max_budget_calls)&&runtime.used_calls>=constitution.max_budget_calls)reasons.push("call_budget_exhausted");
 if(runtime.budget_reserved!==true)reasons.push("budget_not_atomically_reserved");
 const threshold=constitution.require_human_above_usd;
 if(Number.isFinite(request.estimated_exposure)&&Number.isFinite(threshold)&&request.estimated_exposure>=threshold&&runtime.human_approval_verified!==true)reasons.push("verified_human_approval_required");
 if(reasons.length)return deny(reasons,version);
 return {decision:"ALLOW",reasons:[],policy_version:version,forward_request:true};
}