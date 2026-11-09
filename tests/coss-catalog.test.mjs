import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateCatalog } from "../scripts/validate-coss-catalog.mjs";

const base = {
  standard: "CISOKit Open Security Standard",
  source_snapshot: "upstream snapshot identifier supplied by publisher",
  record_kind: "canonical_import",
  source_url: "https://cisokit.com/framework/crosswalks",
  retrieved_at: "2026-11-09T00:00:00.000Z",
  source_sha256: "a".repeat(64),
  expected_count: 1,
  records: [{
    control_id: "IAM-1",
    domain: "Identity & Access",
    tier: "L1",
    title: "Multi-Factor Authentication (all users)",
    source_url: "https://cisokit.com/framework/crosswalks",
    record_kind: "canonical_import",
    mappings: [{ framework: "CIS Controls v8", control_ids: ["6.3", "6.5"] }]
  }]
};

describe("COSS catalog validator", () => {
  it("accepts a well-formed, provenance-pinned canonical record", () => {
    assert.deepEqual(validateCatalog(base), []);
  });

  it("rejects duplicate control IDs", () => {
    const catalog = structuredClone(base);
    catalog.records.push(structuredClone(catalog.records[0]));
    catalog.expected_count = 2;
    assert.ok(validateCatalog(catalog).some(x => x.includes("duplicate control_id")));
  });

  it("rejects a mismatch in the declared record count", () => {
    const catalog = structuredClone(base);
    catalog.expected_count = 107;
    assert.ok(validateCatalog(catalog).some(x => x.includes("expected_count mismatch")));
  });

  it("rejects a missing or malformed source digest", () => {
    const catalog = structuredClone(base);
    catalog.source_sha256 = "not-a-digest";
    assert.ok(validateCatalog(catalog).some(x => x.includes("source_sha256")));
  });

  it("rejects unsupported maturity tiers and framework names", () => {
    const catalog = structuredClone(base);
    catalog.records[0].tier = "L6";
    catalog.records[0].mappings[0].framework = "CIS v8";
    const errors = validateCatalog(catalog);
    assert.ok(errors.some(x => x.includes("tier")));
    assert.ok(errors.some(x => x.includes("framework")));
  });

  it("rejects illustrative sample data as a canonical import", () => {
    const catalog = structuredClone(base);
    catalog.records[0].record_kind = "illustrative";
    assert.ok(validateCatalog(catalog).some(x => x.includes("record_kind")));
  });
});
