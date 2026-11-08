/**
 * Commitment-based Decision Passport (ZK *track*, not full ZKP).
 * Hides raw question/outcome; publishes only hashes + predicate claims.
 */
import { canonicalJson, sha256Hex } from "../canonical-hash.ts";

export type PredicateClaim = {
  /** Machine-readable predicate id */
  id: "constitution_ok" | "budget_ok" | "arp_ok" | "exposure_cap_ok";
  /** Claimed boolean result */
  holds: boolean;
  /** Public threshold or policy id (non-sensitive) */
  public_ref: string;
};

export type CommitmentPassport = {
  protocol: "ATI-CommitmentPassport-v0";
  decision_id: string;
  tenant_commitment: string; // hash(tenant || salt) optional privacy
  question_commitment: string;
  outcome_commitment: string;
  evidence_root: string;
  predicates: PredicateClaim[];
  model_id: string;
  issued_at: number;
  /** Binding to open passport if any */
  open_passport_id?: string;
  note: "commitment_only_not_snark";
};

export async function commitString(value: string, salt = ""): Promise<string> {
  return sha256Hex(`${salt}:${value}`);
}

export async function issueCommitmentPassport(input: {
  decision_id: string;
  tenant: string;
  question: string;
  outcome: string;
  evidence_hashes: string[];
  predicates: PredicateClaim[];
  model_id: string;
  salt?: string;
  open_passport_id?: string;
}): Promise<CommitmentPassport> {
  const salt = input.salt || "";
  return {
    protocol: "ATI-CommitmentPassport-v0",
    decision_id: input.decision_id,
    tenant_commitment: await commitString(input.tenant, salt),
    question_commitment: await commitString(input.question, salt),
    outcome_commitment: await commitString(input.outcome, salt),
    evidence_root: await sha256Hex(canonicalJson(input.evidence_hashes)),
    predicates: input.predicates,
    model_id: input.model_id,
    issued_at: Date.now(),
    open_passport_id: input.open_passport_id,
    note: "commitment_only_not_snark",
  };
}

/** Verify openings when auditor is given salt + plaintext under NDA */
export async function verifyOpenings(
  passport: CommitmentPassport,
  openings: { tenant: string; question: string; outcome: string; salt?: string }
): Promise<{ ok: boolean; mismatches: string[] }> {
  const salt = openings.salt || "";
  const mismatches: string[] = [];
  if ((await commitString(openings.tenant, salt)) !== passport.tenant_commitment) {
    mismatches.push("tenant");
  }
  if ((await commitString(openings.question, salt)) !== passport.question_commitment) {
    mismatches.push("question");
  }
  if ((await commitString(openings.outcome, salt)) !== passport.outcome_commitment) {
    mismatches.push("outcome");
  }
  return { ok: mismatches.length === 0, mismatches };
}

/** Public check: all required predicates claimed true (does NOT prove honesty of issuer) */
export function publicPredicateScan(
  passport: CommitmentPassport,
  required: PredicateClaim["id"][] = ["constitution_ok", "budget_ok", "arp_ok"]
): { ok: boolean; missing: string[] } {
  const missing: string[] = [];
  for (const id of required) {
    const p = passport.predicates.find((x) => x.id === id);
    if (!p || !p.holds) missing.push(id);
  }
  return { ok: missing.length === 0, missing };
}
