import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createEvidenceCore, signEvidence, verifyEvidence, sha256Hex } from "../src/core/evidence.mjs";

globalThis.crypto ??= webcrypto;

const input = {
  schemaVersion: "aston.evidence/1.0", eventId: "evt_test_0001",
  organizationId: "org_test", agentId: "urn:uuid:00000000-0000-4000-8000-000000000001",
  signer: { principalType: "agent", principalId: "urn:uuid:00000000-0000-4000-8000-000000000001", keyId: "key-01" },
  decisionId: "decision_0001", policyId: "policy_0001", policyVersion: 1,
  requestId: "request_0001", eventType: "action.completed", occurredAt: "2026-11-12T00:00:00Z",
  action: "procurement.purchase", resource: { type: "purchase_order", resourceId: "po_01" },
  decision: { outcome: "ALLOW", decidedAt: "2026-11-12T00:00:00Z" },
  previousEventDigest: null
};

test("JCS digest and Ed25519 signature are deterministic for identical JSON", async () => {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const coreA = await createEvidenceCore(input, { z: 1, a: "value" });
  const coreB = await createEvidenceCore({ ...input, resource: { resourceId: "po_01", type: "purchase_order" } }, { a: "value", z: 1 });
  assert.equal(await sha256Hex(coreA), await sha256Hex(coreB));
  const signedA = await signEvidence(coreA, pair.privateKey, "key-01");
  const signedB = await signEvidence(coreB, pair.privateKey, "key-01");
  assert.deepEqual(signedA.eventDigest, signedB.eventDigest);
  assert.equal(signedA.signature.value, signedB.signature.value);
  assert.equal(await verifyEvidence(signedA, pair.publicKey), true);
});

test("evidence verification rejects tampering", async () => {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const core = await createEvidenceCore(input, null);
  const envelope = await signEvidence(core, pair.privateKey, "key-01");
  assert.equal(await verifyEvidence({ ...envelope, action: "payments.transfer" }, pair.publicKey), false);
});
