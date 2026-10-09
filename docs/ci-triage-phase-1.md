# Remote CI triage, 9 October 2026

Inspected the actual authenticated GitHub jobs/logs for [run 37969277957](https://github.com/kinglove58/campuswahala/actions/runs/37969277957), commit `9bc9eecc18d34dd5dae1b8e5d523fbb564b4dadd`. Verify and verified-secret scan passed. Verify includes install, Bicep, migrations, lint, types, unit/PostgreSQL tests, build, browser tests and audit. Both container builds and API smoke passed.

CodeQL extracted 46 TypeScript files, three JavaScript files and the workflow, completed query execution and SARIF generation, then failed with `Resource not accessible by integration` on the workflow-run API. The job grants contents/security-events permissions but omitted `actions: read`. Added that permission, preserved analysis. The latest run additionally warned `Code scanning is not enabled for this repository`. This is an observed permission/configuration failure; the repository setting and applicable entitlement require review. It is not an observed source finding or proof of a specific account-plan denial. A new remote run must confirm upload/entitlement; do not report CodeQL success yet.

The web Trivy scan failed on HIGH vulnerabilities inside the base image's npm tree: brace-expansion (CVE-2026-102276, CVE-2026-102278, CVE-2026-13149, CVE-2026-14257, CVE-2026-69152), ip-address (CVE-2026-69192), pacote (CVE-2026-9496), picomatch (CVE-2026-33671), sigstore (CVE-2026-48815). Application packages in that scan had zero findings. OS summary had zero HIGH/CRITICAL findings. Node itself had no reported finding. The API scan/SBOM were skipped after the web failure; they were not successful scans.

Runtime images do not need package managers. Removed npm/Yarn payloads and package-manager launchers (including the Corepack shim) from runtime stages, retaining build tooling in build stages. This removes the affected components instead of suppressing CVEs. Both scans now include unfixed findings; API scan and SBOM run even after a web scan failure. There are no CVE allowlists. Local final-image rebuilds, smoke tests and Trivy results are recorded below. A new remote run remains necessary to confirm remote remediation. Public release remains gated on actual clean scans, private ingress, shared abuse/replay stores and identity configuration.

The initial inspected run 37963486686 and latest run 37969277957 show the same failure pattern. Latest jobs: sast 113951448620, containers 113951448803; verify and secrets succeeded. The latest scan reported ten HIGH findings across nine CVE identifiers in npm. Logs were inspected read-only; no workflow dispatch, push or repository-setting change was performed.

A complementary Semgrep Community scan is added independently of repository code-scanning upload: engine 1.180.0, official image digest `sha256:529ee8a277ec8adc5b534d7c74eea0a47e9de21d62852b6ba7ac6ba9566845c3`, JavaScript and Node.js registry rule packs, OSS-only, metrics off, strict errors and findings fail the job. It needs no account or paid plan and uploads only a CI artifact, not source to a hosted analysis service. The registry rules remain maintained external inputs; record scan versions/results and review updates. Coverage differs from CodeQL (including missing inter-file analysis); this complements rather than replaces it. Source guidance: [Semgrep CLI](https://docs.semgrep.dev/cli-reference) and [official 1.180.0 release](https://github.com/semgrep/semgrep/releases/tag/v1.180.0). Local result is recorded in Phase 1 review; new remote execution is still pending.

## Final local container evidence

Both final images use Node 22 Alpine 3.24.2; API build/runtime generate and carry the matching native Prisma engine. Web HTTP 200/non-root/no-npm smoke passed. API non-root memory guest smoke passed; real PostgreSQL readiness/guest roundtrip and local account login/conversion/private defaults/immediate deletion denial passed on the Alpine image. [Prisma v6 platform support](https://docs.prisma.io/docs/orm/v6/reference/prisma-schema-reference) documents the musl/OpenSSL target; compatibility here is supported by the actual PostgreSQL test, not just documentation.

Trivy 0.75.0 scanned both final images with HIGH/CRITICAL thresholds and unfixed findings included. Both exited 0 with zero findings. Database metadata: UpdatedAt 2026-10-09 13:10:00 UTC, DownloadedAt 17:52:20 UTC; the same-day database snapshot was reused under its update policy. Scanner image digest: `sha256:af6acf9a6b85dfe389a1941505c0ce9efef52a4719635e1a962f022a3d855daa`. This is point-in-time evidence, not a vulnerability-free guarantee.

| Image | Trivy-recorded ImageID                                                    | HIGH/CRITICAL |
| ----- | ------------------------------------------------------------------------- | ------------- |
| Web   | `sha256:1f00e14aef16152e3b0da995fc8ec6c4b9580fab45f06d8501cbcd01295d76fd` | 0             |
| API   | `sha256:4ca65fd24d1ac9742bb79a91d6d7b1a0209c73eb493f39520bdb375ecc8c8107` | 0             |

CycloneDX 1.7 API SBOM generation exited 0 and contains 164 components. Full JSON/logs/SBOM are ignored development artifacts (`artifacts/trivy-*-phase1-final.json`, `api-phase1-sbom.json`); no credentials or personal records are included in the checked-in report. Development tags are still not a production promotion policy.

## Additional API base-image findings and remediation

The first local API scan with unfixed findings included exposed 60 inherited Debian 12 package findings across 21 CVEs (including CRITICAL). Application dependency findings were zero. These were not visible in the original remote job because its API scan was skipped, and its web threshold ignored unfixed findings. The historical Debian result remains in ignored `artifacts/trivy-api-phase1-bookworm.json`; it is not the final Alpine result.

Several findings had no fixed Debian version listed in the scan. The table records that evidence without asserting that no other upstream distribution has a fix. The API recipe now uses Alpine for both build/runtime, installs current OpenSSL and regenerates the native Prisma engine; its final scan is clean. No CVE was ignored or reclassified.

| CVE            | Historical affected component(s)     | Installed version(s)                 | Fixed Debian version reported |
| -------------- | ------------------------------------ | ------------------------------------ | ----------------------------- |
| CVE-2023-45853 | zlib1g                               | 1:1.2.13.dfsg-1                      | Not listed                    |
| CVE-2025-69720 | libtinfo6, ncurses-base, ncurses-bin | 6.4-4                                | Not listed                    |
| CVE-2026-13221 | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-16742 | libsystemd0, libudev1                | 252.39-1~deb12u2                     | Not listed                    |
| CVE-2026-41992 | gzip                                 | 1.12-1                               | Not listed                    |
| CVE-2026-42496 | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-42497 | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-48962 | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-53613 | util-linux family (see below)        | 1:2.38.1-5+deb12u3, 2.38.1-5+deb12u3 | Not listed                    |
| CVE-2026-54369 | libacl1                              | 2.3.1-3                              | Not listed                    |
| CVE-2026-57432 | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-57433 | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-76642 | util-linux family (see below)        | 1:2.38.1-5+deb12u3, 2.38.1-5+deb12u3 | Not listed                    |
| CVE-2026-78408 | util-linux family (see below)        | 1:2.38.1-5+deb12u3, 2.38.1-5+deb12u3 | Not listed                    |
| CVE-2026-78409 | util-linux family (see below)        | 1:2.38.1-5+deb12u3, 2.38.1-5+deb12u3 | Not listed                    |
| CVE-2026-78410 | util-linux family (see below)        | 1:2.38.1-5+deb12u3, 2.38.1-5+deb12u3 | Not listed                    |
| CVE-2026-8376  | perl-base                            | 5.36.0-7+deb12u3                     | 5.36.0-7+deb12u4              |
| CVE-2026-84782 | libssl3, openssl                     | 3.0.22-1~deb12u1                     | Not listed                    |
| CVE-2026-88647 | libgnutls30                          | 3.7.9-2+deb12u7                      | Not listed                    |
| CVE-2026-88648 | libgnutls30                          | 3.7.9-2+deb12u7                      | Not listed                    |
| CVE-2026-9538  | perl-base                            | 5.36.0-7+deb12u3                     | Not listed                    |

The util-linux family rows cover bsdutils, libblkid1, libmount1, libsmartcols1, libuuid1, mount, util-linux and util-linux-extra. Scanner source-package attribution can cover multiple binaries; precise exploitability of every historical component was not independently established, and none was dismissed as a false positive.

During isolated local verification, the API ran non-root without privileged container mode, exposed only loopback to its owned test client, accepted strict intents and had no shell/archive/terminal execution endpoint. It uses TCP TLS, not a DTLS application endpoint. Those controls reduce exposure to inherited OS helpers/libraries but are not grounds to accept a vulnerable production image. The historical Debian image is excluded from promotion; changing the base and validating PostgreSQL removes dependence on those affected Debian packages. Tracking plan: retain the original CVE record, scan every new base/dependency revision including unfixed findings, review vendor advisories and updated SBOM/digests, and block public promotion on any new unresolved HIGH/CRITICAL result. If Debian is reintroduced, all listed findings require renewed assessment/remediation before release.

## Local static-analysis evidence

Semgrep Community 1.180.0, OSS-only: 74 JavaScript/Node.js rules, 53 supported source files, zero findings, zero parse errors; strict scan exited 0. It scanned an isolated 97-file source snapshot copied into the Linux container to avoid Windows bind-mount enumeration overhead. The scanned code matches current source after newline normalization. Initial strict parsing exposed the scanner's ambiguity around an HTML-comment regex literal; an equivalent static RegExp string form preserves behavior, and extraction/grounding tests passed afterward. No findings/rules/errors were suppressed. The first slow mounted attempt and first parse-error attempt are not counted as successful scans. This complements CodeQL with different coverage; CodeQL upload and the new CI job still require remote confirmation.
