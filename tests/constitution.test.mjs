import { describe, it } from "node:test";
import assert from "node:assert/strict";

function evaluate(c, input) {
  const reasons = [];
  if (c.denied_actions.includes(input.action)) reasons.push(`action_denied:${input.action}`);
  if (c.allowed_actions.length && !c.allowed_actions.includes(input.action)) {
    reasons.push(`action_not_in_allowlist:${input.action}`);
  }
  if ((input.estimated_exposure || 0) > c.max_exposure_usd) reasons.push("exposure_above_constitution");
  return { allowed: reasons.length === 0, reasons };
}

const defaultC = {
  allowed_actions: ["read", "analyze", "create", "update", "execute"],
  denied_actions: ["delete", "wire_transfer", "export_all"],
  max_exposure_usd: 10000,
};

describe("constitution", () => {
  it("allows analyze", () => {
    const v = evaluate(defaultC, { action: "analyze", estimated_exposure: 100 });
    assert.equal(v.allowed, true);
  });
  it("denies wire_transfer", () => {
    const v = evaluate(defaultC, { action: "wire_transfer", estimated_exposure: 1 });
    assert.equal(v.allowed, false);
  });
  it("blocks over exposure", () => {
    const v = evaluate(defaultC, { action: "analyze", estimated_exposure: 999999 });
    assert.equal(v.allowed, false);
  });
});
