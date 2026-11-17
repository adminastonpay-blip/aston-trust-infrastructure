#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const FRAMEWORKS = new Set([
  "CIS Controls v8",
  "NIST SP 800-53 Rev 5",
  "ISO/IEC 27001:2022",
  "SOC 2 TSC",
  "NIST CSF 2.0",
  "HIPAA NPRM",
]);
const TIERS = new Set(["L1", "L2", "L3", "L4", "L5"]);
const ID = /^[A-Z]{2,5}-[0-9]{1,3}$/;
const SHA256 = /^[a-fA-F0-9]{64}$/;

export function validateCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    return ["catalog must be a JSON object"];
  }
  if (catalog.standard !== "CISOKit Open Security Standard") {
    errors.push("standard must identify CISOKit Open Security Standard");
  }
  if (typeof catalog.source_snapshot !== "string" || !catalog.source_snapshot.trim()) {
    errors.push("source_snapshot is required");
  }
  if (catalog.record_kind !== "canonical_import") {
    errors.push("catalog record_kind must be canonical_import");
  }
  if (typeof catalog.source_url !== "string" || !/^https:\/\//.test(catalog.source_url)) {
    errors.push("source_url must be an HTTPS URL");
  }
  if (typeof catalog.retrieved_at !== "string" || Number.isNaN(Date.parse(catalog.retrieved_at))) {
    errors.push("retrieved_at must be an ISO-compatible date-time");
  }
  if (typeof catalog.source_sha256 !== "string" || !SHA256.test(catalog.source_sha256)) {
    errors.push("source_sha256 must be a 64-character SHA-256 digest");
  }
  if (!Array.isArray(catalog.records) || catalog.records.length === 0) {
    errors.push("records must be a non-empty array");
    return errors;
  }
  if (Number.isInteger(catalog.expected_count) && catalog.records.length !== catalog.expected_count) {
    errors.push(`expected_count mismatch: expected ${catalog.expected_count}, got ${catalog.records.length}`);
  }

  const seen = new Set();
  for (const [index, record] of catalog.records.entries()) {
    const at = `records[${index}]`;
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      errors.push(`${at} must be an object`);
      continue;
    }
    for (const field of ["control_id", "domain", "title", "source_url"]) {
      if (typeof record[field] !== "string" || !record[field].trim()) errors.push(`${at}.${field} is required`);
    }
    if (typeof record.control_id === "string") {
      if (!ID.test(record.control_id)) errors.push(`${at}.control_id has invalid format`);
      if (seen.has(record.control_id)) errors.push(`duplicate control_id: ${record.control_id}`);
      seen.add(record.control_id);
    }
    if (!TIERS.has(record.tier)) errors.push(`${at}.tier must be L1-L5`);
    if (record.record_kind !== "canonical_import") errors.push(`${at}.record_kind must be canonical_import`);
    if (typeof record.source_url === "string" && !/^https:\/\//.test(record.source_url)) {
      errors.push(`${at}.source_url must be HTTPS`);
    }
    if (!Array.isArray(record.mappings)) errors.push(`${at}.mappings must be an array`);
    else for (const [m, mapping] of record.mappings.entries()) {
      if (!FRAMEWORKS.has(mapping?.framework)) errors.push(`${at}.mappings[${m}].framework is unsupported`);
      if (!Array.isArray(mapping?.control_ids) || mapping.control_ids.some(x => typeof x !== "string" || !x.trim())) {
        errors.push(`${at}.mappings[${m}].control_ids must be an array of non-empty strings`);
      }
    }
  }
  return errors;
}

async function main() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: node scripts/validate-coss-catalog.mjs <catalog.json>");
    process.exitCode = 2;
    return;
  }
  let catalog;
  try {
    catalog = JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    console.error(`Unable to read/parse catalog: ${error.message}`);
    process.exitCode = 2;
    return;
  }
  const errors = validateCatalog(catalog);
  if (errors.length) {
    console.error("COSS catalog validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`COSS catalog valid: ${catalog.records.length} unique controls; source SHA-256 ${catalog.source_sha256}`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  await main();
}
