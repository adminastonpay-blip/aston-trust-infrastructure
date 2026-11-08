/** Economic Decision Passport — structure only; measured:false until provider metrics */

export type EconomicPassport = {
  passport_version: "1.0-econ";
  decision_id: string;
  model: string;
  tokens_in_est: number;
  tokens_out_est: number;
  latency_ms: number;
  cost_usd_est: number;
  budget_authorized_usd: number;
  budget_remaining_usd: number;
  retries: number;
  cache_hit: boolean;
  quality_note: string;
  measured: boolean;
};

export function estimateChatCost(opts: {
  decision_id: string;
  model: string;
  messageChars: number;
  responseChars: number;
  latency_ms: number;
  budget_usd: number;
  retries?: number;
}): EconomicPassport {
  const tokens_in_est = Math.ceil(opts.messageChars / 4);
  const tokens_out_est = Math.ceil(opts.responseChars / 4);
  const cost_usd_est = Number(((tokens_in_est + tokens_out_est) * 0.000002).toFixed(6));
  return {
    passport_version: "1.0-econ",
    decision_id: opts.decision_id,
    model: opts.model,
    tokens_in_est,
    tokens_out_est,
    latency_ms: opts.latency_ms,
    cost_usd_est,
    budget_authorized_usd: opts.budget_usd,
    budget_remaining_usd: Math.max(0, opts.budget_usd - cost_usd_est),
    retries: opts.retries ?? 0,
    cache_hit: false,
    quality_note: "estimate_only_not_provider_invoice",
    measured: false,
  };
}
