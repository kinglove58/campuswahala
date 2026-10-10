# Phase 2.5 review — validation in progress

Base master: `9427141546c9257d3cc3c213dcf89079425332b1` (merged Phase 2). Branch: `codex/phase-2.5-authenticity-hardening`. Draft PR #10. Phase 0–2 were extended, not rebuilt. Phase 3 is not started. No deployment or production DB writes.

## Architecture and data safety

Migration 006 introduces explicit CampusSubject UUIDs and mutually exclusive canonical/candidate subject identity plus property. Existing fact IDs, current pointers, statuses, versions, decisions and feedback survive. Legacy subject keys remain distinct. Extractors now require stable subjectKey/propertyKey; exact ambiguous names never fuzzy-merge. Official eligible name evidence can establish a canonical subject without verifying geometry. See ADR 011.

Catalogue: validated campus/category/subject filters, limits 1–100, deterministic UUID ordering and versioned scope-bound opaque cursor. Live reads exclude stale/held/candidate/rejected/missing-version records and private ingestion metadata. Phone pagination and world canonical-ID lookup avoid a global first-100 bottleneck.

Authority/status parsers and SQL constraints fail closed. Critical contacts/fees/deadlines require literal official authority. Unknown/institutional/community/reputable sources cannot publish critical information. Source uniqueness is campus+URL, with ephemeral raw retrieval and bounded excerpts/hashes.

Guest conflict: preserve cookie/guest/feedback, reserve conversion to the same owner and return `EXISTING_CHARACTER_CONFLICT`. UI offers saved journey or temporary guest exploration; guest mode cannot persist account world changes. First conversion/retry remains transactional. Account deletion revokes sessions immediately; worker claims bounded SKIP LOCKED requests and counts only actual idempotent completion. See ADR 012.

## Content and visual changes

FUTA discovery adds official hostel, school and physical-planning evidence targets. OAU adds residence/convocation targets. UNILAG adds campus facility/religious targets. These are not seed facts; normal robots/safe-fetch/grounding/publication must independently succeed. `docs/research/phase-2.5-discovery.md` lists URLs; resulting research artifacts will be reported separately.

World/schema v2 binds canonical UUID/property. Exact original v1 manifests and hashed art remain served unchanged. Layout is compressed geography, never physical GPS. Campus-specific roof/facade treatment, kerbs/crossings, ground variation, layered trees/palms, props and clearer avatars improve original local vector/procedural art. Nearby ambient groups remain fictional. Limits: 32 NPCs/manifest, six/zone, 16 rendered nearby; inactive NPCs skip movement. CW Pocket retains focus/Escape/reduced motion and gains clearer map identity/transport labels and guide pagination.

PWA: bounded static/hashed/immutable allowlist; no private APIs, navigation HTML, current facts or latest pointers. No mutation queue. Open world/map may continue offline; private resume on reload waits for reconnect via branded static fallback. Zone art is actually requested by visible zone, not a single conceptual campus bundle.

## Evidence so far

Local compilation, lint, 103 non-PostgreSQL tests and production game/marketing builds passed. Nine PostgreSQL cases were skipped locally because this environment has no PostgreSQL/Docker; they are not local passes.

First remote checkpoint `760c0370e7b715b2b00d4dda613d632ce6cbbf48`, run `38037349385`: all 112 unit/API/PostgreSQL/migration tests passed with zero skips. Production build and budget checks passed. CodeQL successfully uploaded SARIF and reported success. Semgrep, verified-secret scan and containers/Trivy/SBOM passed. Browser checks: 15 passed/3 failed; failures were the stale map-copy assertion and the previous shared-demo-account expectation, corrected in the next checkpoint. Offline/throttled/failure-recovery browser cases passed. Dependency audit after the failed browser step was skipped in this first run; success is not claimed for that checkpoint.

Measured remote gzip: FUTA manifest 4,400 bytes; OAU 3,264; UNILAG 3,496. All per-campus zone art: 2,130 / 1,427 / 1,430 gzip bytes. All game static JS upper bound including lazy chunks: 541,761 gzip bytes. Local webpack upper bound: 639,773 bytes. Build-mode difference is reported, not hidden. Marketing has no Phaser runtime. These are compressed output measurements, not actual first-load/FPS/physical-device results.

## Remaining review gates

Corrected full remote run, complete-history secret scan, additional world/conflict captures, compliant research outputs and visual inspection are still being completed. Physical low-end/mid-range Android performance/usability/thermal/long-session acceptance is **NOT TESTED** and requires the human procedure in `docs/mobile-device-acceptance.md`. No physical results are fabricated.

Existing Phase 1 public-release gates remain: private ingress/egress, shared atomic abuse/replay controls, configured live identity/MFA, least-privilege DB roles and operational/security review. Public repo visibility does not provide these controls.

Do not merge as a production-ready release. Stop for Phase 2.5 review; no Phase 3 sign-off yet.
