/** Stable HMAC Decision Passport — verifiable with shared secret */

import { canonicalJson, sha256Hex } from "./canonical-hash.ts";

export interface DecisionPassport {
  passport_version: "1.0";
  decision_id: string;
  tenant: string;
  actor: string;
  question_hash: string;
  outcome_hash: string;
  evidence_root: string;
  input_hash: string;
  context_hash: string;
  replay_key: string;
  model: string;
  issued_at: number;
  sig_alg: "HMAC-SHA256";
  signature: string;
  kid: string;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function kidFromSecret(secret: string): string {
  let h = 0;
  for (let i = 0; i < secret.length; i++) h = (h * 31 + secret.charCodeAt(i)) >>> 0;
  return `hmac-${h.toString(16).slice(0, 8)}`;
}

function payloadForSign(p: Omit<DecisionPassport, "signature" | "sig_alg" | "kid">): string {
  return canonicalJson({
    passport_version: p.passport_version,
    decision_id: p.decision_id,
    tenant: p.tenant,
    actor: p.actor,
    question_hash: p.question_hash,
    outcome_hash: p.outcome_hash,
    evidence_root: p.evidence_root,
    input_hash: p.input_hash,
    context_hash: p.context_hash,
    replay_key: p.replay_key,
    model: p.model,
    issued_at: p.issued_at,
  });
}

export async function issuePassport(
  secret: string,
  input: {
    decision_id: string;
    tenant: string;
    actor: string;
    question: string;
    outcome: string;
    evidence_hashes: string[];
    input_hash: string;
    context_hash: string;
    replay_key: string;
    model: string;
    issued_at?: number;
  }
): Promise<DecisionPassport | null> {
  if (!secret || secret.length < 16) return null;
  const issued_at = input.issued_at ?? Date.now();
  const question_hash = await sha256Hex(input.question);
  const outcome_hash = await sha256Hex(input.outcome);
  const evidence_root = await sha256Hex(canonicalJson(input.evidence_hashes));
  const base: Omit<DecisionPassport, "signature" | "sig_alg" | "kid"> = {
    passport_version: "1.0",
    decision_id: input.decision_id,
    tenant: input.tenant,
    actor: input.actor,
    question_hash,
    outcome_hash,
    evidence_root,
    input_hash: input.input_hash,
    context_hash: input.context_hash,
    replay_key: input.replay_key,
    model: input.model,
    issued_at,
  };
  const key = await importHmacKey(secret);
  const data = new TextEncoder().encode(payloadForSign(base));
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const signature = [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return { ...base, sig_alg: "HMAC-SHA256", signature, kid: kidFromSecret(secret) };
}

export async function verifyPassport(
  secret: string,
  passport: DecisionPassport
): Promise<{ ok: boolean; reason?: string }> {
  if (!secret || secret.length < 16) return { ok: false, reason: "no_signing_secret" };
  if (passport.sig_alg !== "HMAC-SHA256") return { ok: false, reason: "unsupported_alg" };
  if (passport.kid !== kidFromSecret(secret)) return { ok: false, reason: "kid_mismatch" };
  const { signature, sig_alg, kid, ...rest } = passport;
  const key = await importHmacKey(secret);
  const data = new TextEncoder().encode(payloadForSign(rest));
  const expected = await crypto.subtle.sign("HMAC", key, data);
  const expectedHex = [...new Uint8Array(expected)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  if (expectedHex.length !== signature.length) return { ok: false, reason: "sig_length" };
  let diff = 0;
  for (let i = 0; i < expectedHex.length; i++) {
    diff |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0 ? { ok: true } : { ok: false, reason: "signature_invalid" };
}
