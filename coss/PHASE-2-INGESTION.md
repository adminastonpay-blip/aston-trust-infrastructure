# COSS Phase 2 — controlled catalog ingestion

**Status:** importer validation scaffold implemented; canonical 107-row import not yet performed.

## What the public source currently states

The CISOKit public crosswalk page currently reports 107 controls, five maturity tiers (L1–L5), and mappings to six frameworks. Its coverage percentages count mapped framework references; they are not evidence that an adopter is certified or compliant.

Source: https://cisokit.com/framework/crosswalks

## Canonical import contract

A future canonical catalog JSON must contain:

- `standard`: exact standard name.
- `source_snapshot`: publisher-provided version or explicit dated snapshot identifier.
- `record_kind`: `canonical_import`.
- `source_url`: canonical HTTPS source.
- `retrieved_at`: UTC ISO-8601 retrieval time.
- `source_sha256`: SHA-256 of the exact source export bytes, calculated before parsing.
- `expected_count`: expected number of records declared for that snapshot.
- `records`: unique control IDs, domain, tier, title, source URL, and framework mappings.

## Validation

Run:

```bash
npm run coss:validate -- path/to/canonical-coss-catalog.json
```

The validator rejects:
- missing provenance metadata or invalid SHA-256;
- duplicate or malformed control IDs;
- unsupported tiers or framework names;
- missing mappings arrays;
- mismatch between expected and imported record count;
- illustrative records presented as canonical.

The validator is intentionally strict. It does not establish that the publisher's source is truthful, that the importer has legal redistribution rights, or that a control is implemented by ATI.

## Rights and publication gate

CISOKit's public pages provide a crosswalk view and describe an export to CSV. The public page also states that CISOKit content is copyrighted. Public visibility alone is not a redistribution license. Before committing the complete control catalogue into ATI, obtain and record the publisher's applicable license/permission or confirm that the exported data is licensed for redistribution.

Until that gate is satisfied:
- keep only the small, explicitly illustrative sample;
- do not mirror the complete 107-row catalogue;
- do not expose a public COSS badge or claim COSS certification;
- do not treat the CISOKit adopter registry's anonymized founding examples as real adopters.

## Phase 2 exit criteria

1. Authorized source snapshot acquired.
2. Exact source bytes hashed and retained with provenance.
3. All 107 controls imported (or the publisher's current declared count for the pinned snapshot).
4. IDs unique; tiers and mappings validated.
5. Source attribution and redistribution terms recorded.
6. Tests pass in CI.
7. No production Worker, Cloudflare bindings, secrets, or deployment resources changed.
