import { describe, it } from "node:test";
import assert from "node:assert/strict";

const ALLOWED = {
  RECEIVED: ["IDENTIFIED", "FAILED"],
  IDENTIFIED: ["AUTHORIZED", "DENIED", "FAILED"],
  AUTHORIZED: ["BUDGET_RESERVED", "DENIED", "FAILED"],
  BUDGET_RESERVED: ["EXECUTING", "FAILED", "DENIED"],
  EXECUTING: ["EXECUTED", "FAILED"],
  EXECUTED: ["VERIFIED", "FAILED"],
  VERIFIED: ["EVIDENCE_STORED", "FAILED"],
  EVIDENCE_STORED: ["TIMESTAMP_PENDING", "REVOKED"],
  TIMESTAMP_PENDING: ["TIMESTAMP_CONFIRMED", "FAILED"],
  TIMESTAMP_CONFIRMED: ["REVOKED"],
  DENIED: [],
  FAILED: [],
  REVOKED: [],
};

function canTransition(from, to) {
  return (ALLOWED[from] || []).includes(to);
}

describe("decision lifecycle", () => {
  it("happy path edges exist", () => {
    assert.equal(canTransition("RECEIVED", "IDENTIFIED"), true);
    assert.equal(canTransition("BUDGET_RESERVED", "EXECUTING"), true);
    assert.equal(canTransition("VERIFIED", "EVIDENCE_STORED"), true);
  });
  it("cannot skip to TIMESTAMP_CONFIRMED", () => {
    assert.equal(canTransition("EXECUTED", "TIMESTAMP_CONFIRMED"), false);
  });
  it("DENIED is terminal", () => {
    assert.equal(canTransition("DENIED", "AUTHORIZED"), false);
  });
});
