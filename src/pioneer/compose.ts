/**
 * Compose pioneer stack for a single governed decision attempt.
 */
import { issueCommitmentPassport, publicPredicateScan } from "../zk/commitment-passport.ts";
import { underwriteCoverage, isSealActive } from "../insurance/coverage-protocol.ts";
import { proposeIntention, acceptIntention, poiAllowsExecution } from "../poi/proof-of-intention.ts";
import { evaluateConstitution, defaultConstitution } from "../constitution.ts";

export async function pioneerDecisionGate(input: {
  decision_id: string;
  tenant: string;
  agent_id: string;
  counterparty_agent_id?: string;
  counterparty_tenant?: string;
  question: string;
  outcome_preview: string;
  action: string;
  exposure_usd: number;
  arr_score: number;
  model_id?: string;
}) {
  const constitution = defaultConstitution(input.agent_id, input.tenant);
  const cv = evaluateConstitution(constitution, {
    action: input.action,
    object_type: "decision",
    estimated_exposure: input.exposure_usd,
  });

  const seal = underwriteCoverage({
    agent_id: input.agent_id,
    tenant: input.tenant,
    decision_id: input.decision_id,
    arr_score: input.arr_score,
    exposure_usd: input.exposure_usd,
  });

  const commitment = await issueCommitmentPassport({
    decision_id: input.decision_id,
    tenant: input.tenant,
    question: input.question,
    outcome: input.outcome_preview,
    evidence_hashes: [],
    model_id: input.model_id || "unknown",
    predicates: [
      { id: "constitution_ok", holds: cv.allowed, public_ref: cv.constitution_id },
      { id: "budget_ok", holds: !seal.kill_switch, public_ref: seal.tier },
      { id: "arp_ok", holds: input.arr_score >= 55, public_ref: `arr:${input.arr_score}` },
      {
        id: "exposure_cap_ok",
        holds: input.exposure_usd <= constitution.max_exposure_usd,
        public_ref: `cap:${constitution.max_exposure_usd}`,
      },
    ],
  });

  const pred = publicPredicateScan(commitment);

  let poi = null as Awaited<ReturnType<typeof proposeIntention>> | null;
  if (input.counterparty_agent_id) {
    poi = await proposeIntention({
      initiator: {
        agent_id: input.agent_id,
        tenant: input.tenant,
        constitution_id: constitution.constitution_id,
        capabilities: constitution.allowed_actions,
      },
      counterparty: {
        agent_id: input.counterparty_agent_id,
        tenant: input.counterparty_tenant || "external",
        constitution_id: `const_${input.counterparty_agent_id}`,
        capabilities: ["trade", "negotiate"],
      },
      purpose: input.question,
      max_exposure_usd: input.exposure_usd,
    });
    // Auto-accept only in demo when same process acts as counterparty
    poi = await acceptIntention(poi, {
      agent_id: input.counterparty_agent_id,
      tenant: input.counterparty_tenant || "external",
      constitution_id: `const_${input.counterparty_agent_id}`,
      capabilities: ["trade", "negotiate"],
    });
  }

  const allow =
    cv.allowed &&
    isSealActive(seal) &&
    pred.ok &&
    (poi ? poiAllowsExecution(poi) : true);

  return {
    allow,
    kill_switch: seal.kill_switch,
    constitution: cv,
    coverage_seal: seal,
    commitment_passport: commitment,
    predicate_scan: pred,
    proof_of_intention: poi,
    claims: {
      zk: "commitment_scaffold_not_snark",
      insurance: "protocol_model_not_licensed_product",
      poi: poi ? "handshake_v0" : "not_required",
    },
  };
}
