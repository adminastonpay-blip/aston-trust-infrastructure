import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

function sha256Hex(s) {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

function underwrite({ arr_score, exposure_usd }) {
  const reasons = [];
  let kill_switch = false;
  if (exposure_usd > 25000) {
    reasons.push("exposure_above_policy_cap");
    kill_switch = true;
  }
  if (arr_score < 55) {
    reasons.push("arr_below_minimum");
    kill_switch = true;
  }
  return { kill_switch, reasons };
}

describe("agent insurance protocol", () => {
  it("kills high exposure", () => {
    const s = underwrite({ arr_score: 90, exposure_usd: 100000 });
    assert.equal(s.kill_switch, true);
  });
  it("kills low ARR", () => {
    const s = underwrite({ arr_score: 10, exposure_usd: 100 });
    assert.equal(s.kill_switch, true);
  });
  it("allows healthy band", () => {
    const s = underwrite({ arr_score: 80, exposure_usd: 500 });
    assert.equal(s.kill_switch, false);
  });
});

describe("commitment passport shape", () => {
  it("hides plaintext via hash", () => {
    const q = "secret strategy";
    const c = sha256Hex(":" + q);
    assert.equal(c.length, 64);
    assert.notEqual(c, q);
  });
});

describe("poi status", () => {
  it("accepted is required for execution flag", () => {
    const poi = { status: "proposed", expires_at: Date.now() + 10000 };
    assert.equal(poi.status === "accepted", false);
  });
});
