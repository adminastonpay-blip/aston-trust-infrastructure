/**
 * Proof-of-Intention (PoI) — inter-agent handshake before cross-org action.
 */
import { canonicalJson, sha256Hex } from "../canonical-hash.ts";

export type AgentCard = {
  agent_id: string;
  tenant: string;
  constitution_id: string;
  /** Optional open or commitment passport id */
  passport_ref?: string;
  capabilities: string[];
};

export type IntentionDraft = {
  protocol: "ATI-PoI-v0";
  intention_id: string;
  initiator: AgentCard;
  counterparty: AgentCard;
  purpose: string;
  max_exposure_usd: number;
  expires_at: number;
  nonce: string;
};

export type ProofOfIntention = IntentionDraft & {
  package_hash: string;
  status: "proposed" | "accepted" | "rejected" | "expired";
  accepted_at?: number;
};

export async function proposeIntention(input: {
  initiator: AgentCard;
  counterparty: AgentCard;
  purpose: string;
  max_exposure_usd: number;
  ttl_ms?: number;
}): Promise<ProofOfIntention> {
  const intention_id = `poi_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const nonce = crypto.randomUUID();
  const draft: IntentionDraft = {
    protocol: "ATI-PoI-v0",
    intention_id,
    initiator: input.initiator,
    counterparty: input.counterparty,
    purpose: String(input.purpose).slice(0, 1000),
    max_exposure_usd: Math.max(0, input.max_exposure_usd),
    expires_at: Date.now() + (input.ttl_ms ?? 120_000),
    nonce,
  };
  const package_hash = await sha256Hex(canonicalJson(draft));
  return { ...draft, package_hash, status: "proposed" };
}

export async function acceptIntention(
  poi: ProofOfIntention,
  acceptor: AgentCard
): Promise<ProofOfIntention> {
  if (poi.status !== "proposed") return { ...poi, status: "rejected" };
  if (Date.now() > poi.expires_at) return { ...poi, status: "expired" };
  if (acceptor.agent_id !== poi.counterparty.agent_id) {
    return { ...poi, status: "rejected" };
  }
  // Re-hash must match frozen draft fields (without status)
  const draft: IntentionDraft = {
    protocol: poi.protocol,
    intention_id: poi.intention_id,
    initiator: poi.initiator,
    counterparty: poi.counterparty,
    purpose: poi.purpose,
    max_exposure_usd: poi.max_exposure_usd,
    expires_at: poi.expires_at,
    nonce: poi.nonce,
  };
  const h = await sha256Hex(canonicalJson(draft));
  if (h !== poi.package_hash) return { ...poi, status: "rejected" };
  return { ...poi, status: "accepted", accepted_at: Date.now() };
}

export function poiAllowsExecution(poi: ProofOfIntention, now = Date.now()): boolean {
  return poi.status === "accepted" && now <= poi.expires_at;
}
