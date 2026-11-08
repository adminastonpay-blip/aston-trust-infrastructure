/**
 * Autonomous Agent Insurance Protocol — reference logic (not a licensed product).
 * Coverage seal + kill-switch decision before irreversible action.
 */

export type CoverageTier = "none" | "micro" | "standard" | "elevated" | "blocked";

export type CoverageSeal = {
  protocol: "ATI-AgentInsurance-v0";
  seal_id: string;
  agent_id: string;
  tenant: string;
  decision_id: string;
  arr_score: number; // 0-100 higher = safer (align with ARP narrative)
  exposure_usd: number;
  max_coverage_usd: number;
  collateral_usd: number;
  tier: CoverageTier;
  kill_switch: boolean;
  reasons: string[];
  issued_at: number;
  expires_at: number;
  /** On-chain settlement — not wired */
  settlement: "off_chain_model_only";
};

export type InsurancePolicyParams = {
  max_single_exposure_usd: number;
  min_arr_to_cover: number;
  collateral_ratio: number; // e.g. 0.1 = 10% of exposure
  seal_ttl_ms: number;
};

export const DEFAULT_POLICY: InsurancePolicyParams = {
  max_single_exposure_usd: 25_000,
  min_arr_to_cover: 55,
  collateral_ratio: 0.1,
  seal_ttl_ms: 60_000,
};

export function underwriteCoverage(input: {
  agent_id: string;
  tenant: string;
  decision_id: string;
  arr_score: number;
  exposure_usd: number;
  policy?: Partial<InsurancePolicyParams>;
}): CoverageSeal {
  const policy = { ...DEFAULT_POLICY, ...input.policy };
  const reasons: string[] = [];
  let kill_switch = false;
  let tier: CoverageTier = "standard";
  const exposure = Math.max(0, Number(input.exposure_usd) || 0);
  const arr = Math.max(0, Math.min(100, Number(input.arr_score) || 0));

  if (exposure <= 0) {
    tier = "micro";
  }
  if (exposure > policy.max_single_exposure_usd) {
    reasons.push("exposure_above_policy_cap");
    kill_switch = true;
    tier = "blocked";
  }
  if (arr < policy.min_arr_to_cover) {
    reasons.push("arr_below_minimum");
    kill_switch = true;
    tier = "blocked";
  }
  if (!kill_switch && arr < 70) {
    tier = "elevated";
    reasons.push("elevated_risk_band");
  }
  if (!kill_switch && exposure < 100) tier = "micro";

  const collateral_usd = kill_switch
    ? 0
    : Number((exposure * policy.collateral_ratio).toFixed(4));
  const max_coverage_usd = kill_switch ? 0 : exposure;

  const now = Date.now();
  return {
    protocol: "ATI-AgentInsurance-v0",
    seal_id: `seal_${input.decision_id}`,
    agent_id: input.agent_id,
    tenant: input.tenant,
    decision_id: input.decision_id,
    arr_score: arr,
    exposure_usd: exposure,
    max_coverage_usd,
    collateral_usd,
    tier,
    kill_switch,
    reasons,
    issued_at: now,
    expires_at: now + policy.seal_ttl_ms,
    settlement: "off_chain_model_only",
  };
}

export function isSealActive(seal: CoverageSeal, now = Date.now()): boolean {
  return !seal.kill_switch && now <= seal.expires_at && seal.tier !== "blocked";
}
