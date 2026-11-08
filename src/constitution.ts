/** Agent Constitution — executable constraints */

export type AgentConstitution = {
  constitution_id: string;
  agent_id: string;
  tenant: string;
  version: string;
  allowed_actions: string[];
  denied_actions: string[];
  allowed_object_types: string[];
  max_budget_calls: number;
  max_budget_cost: number;
  max_exposure_usd: number;
  max_frequency_per_hour: number;
  require_human_above_usd: number;
  models_allowed: string[];
  expires_at: number | null;
  revoked: boolean;
};

export function defaultConstitution(
  agent_id: string,
  tenant: string,
  overrides?: Partial<AgentConstitution>
): AgentConstitution {
  return {
    constitution_id: `const_${agent_id}`,
    agent_id,
    tenant,
    version: "1.0",
    allowed_actions: ["read", "analyze", "create", "update", "execute"],
    denied_actions: ["delete", "wire_transfer", "export_all"],
    allowed_object_types: ["agent_plan", "report", "decision", "chat"],
    max_budget_calls: 20,
    max_budget_cost: 50,
    max_exposure_usd: 10_000,
    max_frequency_per_hour: 60,
    require_human_above_usd: 1_000,
    models_allowed: ["*"],
    expires_at: null,
    revoked: false,
    ...overrides,
  };
}

export type ConstitutionVerdict = {
  allowed: boolean;
  reasons: string[];
  require_human: boolean;
  constitution_id: string;
};

export function evaluateConstitution(
  c: AgentConstitution,
  input: {
    action: string;
    object_type: string;
    estimated_exposure?: number;
    estimated_cost?: number;
    model?: string;
    used_calls?: number;
  }
): ConstitutionVerdict {
  const reasons: string[] = [];
  if (c.revoked) reasons.push("constitution_revoked");
  if (c.expires_at && Date.now() > c.expires_at) reasons.push("constitution_expired");
  if (c.denied_actions.includes(input.action)) reasons.push(`action_denied:${input.action}`);
  if (c.allowed_actions.length && !c.allowed_actions.includes(input.action)) {
    reasons.push(`action_not_in_allowlist:${input.action}`);
  }
  if (
    c.allowed_object_types.length &&
    !c.allowed_object_types.includes(input.object_type)
  ) {
    reasons.push(`object_type_forbidden:${input.object_type}`);
  }
  const exp = input.estimated_exposure ?? 0;
  const cost = input.estimated_cost ?? 0;
  if (exp > c.max_exposure_usd) reasons.push("exposure_above_constitution");
  if (cost > c.max_budget_cost) reasons.push("cost_above_constitution");
  if ((input.used_calls ?? 0) >= c.max_budget_calls) reasons.push("calls_exhausted");
  if (
    input.model &&
    c.models_allowed[0] !== "*" &&
    !c.models_allowed.includes(input.model)
  ) {
    reasons.push(`model_not_allowed:${input.model}`);
  }
  return {
    allowed: reasons.length === 0,
    reasons,
    require_human: exp >= c.require_human_above_usd,
    constitution_id: c.constitution_id,
  };
}
