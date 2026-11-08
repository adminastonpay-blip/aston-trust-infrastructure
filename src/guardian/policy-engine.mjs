/**
 * Pure deny-by-default Guardian policy decision function.
 * Runtime adapters must cryptographically verify identity/signatures and
 * atomically reserve budget/concurrency before forwarding. This module does
 * not perform network I/O, signature verification or atomic reservations.
 */
const deny=(reasons,version)=>({decision:"DENY",reasons,policy_version:version??"unknown",forward_request:false});
export function evaluateGuardianRequest(request,constitution,runtime={}){
 const version=constitution?.version??"unknown",reasons=[];
 if(!request||typeof request!=="object")return deny(["invalid_request"],version);
 if(!constitution||typeof constitution!=="object")return deny(["constitution_missing"],version);
 if(typeof constitution.version!=="string"||!constitution.version)reasons.push("policy_version_missing");
 if(!request.agent_id||request.agent_id!==constitution.agent_id)reasons.push("agent_identity_mismatch");
 if(!request.tenant||request.tenant!==constitution.tenant)reasons.push("tenant_mismatch");
 if(constitution.revoked!==false)reasons.push("constitution_not_active");
 if(!(constitution.expires_at===null||(Number.isFinite(constitution.expires_at)&&constitution.expires_at>Date.now())))reasons.push("constitution_expired_or_invalid");
 if(runtime.signature_verified!==true)reasons.push("signature_not_verified");
 if(runtime.replay_detected!==false)reasons.push("replay_state_unverified_or_detected");
 if(!Array.isArray(constitution.allowed_actions)||constitution.allowed_actions.length===0)reasons.push("action_allowlist_missing");
 else if(!constitution.allowed_actions.includes(request.action))reasons.push("action_not_allowlisted");
 if(!Array.isArray(constitution.denied_actions))reasons.push("denylist_missing");
 else if(constitution.denied_actions.includes(request.action))reasons.push("action_explicitly_denied");
 if(!Array.isArray(constitution.allowed_object_types)||!constitution.allowed_object_types.includes(request.object_type))reasons.push("object_type_not_allowlisted");
 if(!Array.isArray(constitution.models_allowed)||constitution.models_allowed.length===0)reasons.push("model_allowlist_missing");
 else if(constitution.models_allowed[0]!=="*"&&!constitution.models_allowed.includes(request.model))reasons.push("model_not_allowlisted");
 if(!Number.isFinite(constitution.max_budget_cost)||constitution.max_budget_cost<0)reasons.push("budget_cost_limit_missing");
 if(!Number.isInteger(constitution.max_budget_calls)||constitution.max_budget_calls<1)reasons.push("budget_call_limit_missing");
 if(!Number.isInteger(constitution.max_frequency_per_hour)||constitution.max_frequency_per_hour<1)reasons.push("frequency_limit_missing");
 if(!Number.isFinite(constitution.require_human_above_usd)||constitution.require_human_above_usd<0)reasons.push("human_approval_threshold_missing");
 if(!Number.isFinite(request.estimated_cost)||request.estimated_cost<0)reasons.push("invalid_cost_estimate");
 else if(Number.isFinite(constitution.max_budget_cost)&&request.estimated_cost>constitution.max_budget_cost)reasons.push("request_cost_exceeds_constitution");
 if(!Number.isFinite(request.estimated_exposure)||request.estimated_exposure<0)reasons.push("invalid_exposure_estimate");
 if(!Number.isInteger(runtime.used_calls)||runtime.used_calls<0)reasons.push("budget_state_unavailable");
 else if(Number.isInteger(constitution.max_budget_calls)&&runtime.used_calls>=constitution.max_budget_calls)reasons.push("call_budget_exhausted");
 if(!Number.isInteger(runtime.calls_in_window)||runtime.calls_in_window<0)reasons.push("frequency_state_unavailable");
 else if(Number.isInteger(constitution.max_frequency_per_hour)&&runtime.calls_in_window>=constitution.max_frequency_per_hour)reasons.push("frequency_limit_exhausted");
 if(runtime.budget_reserved!==true)reasons.push("budget_not_atomically_reserved");
 if(runtime.concurrency_reserved!==true)reasons.push("concurrency_not_reserved");
 const needsHuman=request.estimated_exposure>=constitution.require_human_above_usd;
 if(needsHuman&&(runtime.human_approval_verified!==true||runtime.approval_bound_to_request!==true))reasons.push("verified_request_bound_human_approval_required");
 if(reasons.length)return deny([...new Set(reasons)],version);
 return {decision:"ALLOW",reasons:[],policy_version:version,forward_request:true};
}
