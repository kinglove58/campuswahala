# Control evidence register

| Control                                    | Evidence                               | Status                                      |
| ------------------------------------------ | -------------------------------------- | ------------------------------------------- |
| Strict inputs and no rewards over-posting  | domain schemas + API integration tests | Implemented                                 |
| Capability ownership/expiry                | auth hash + player service + API tests | Implemented guest/account scope             |
| CSRF/origin and no token exposure          | Next guest proxy + e2e                 | Implemented guest/account scope             |
| Input/body/rate limits                     | Nest middleware + tests                | Local baseline                              |
| SQL parameterization                       | Prisma repository                      | Implemented; optional DB test               |
| Log redaction                              | structured allowlisted logger + test   | Implemented baseline                        |
| OIDC adapter / MFA and admin authorization | signed-token tests; locked admin       | Adapter implemented; live tenant/MFA absent |
| Distributed abuse/WAF prevention           | infrastructure design                  | Not Started                                 |
| Financial idempotency/audit                | payments design                        | Not Started                                 |
| Worker SSRF / future upload moderation     | pinned DNS/redirect/robots tests       | Worker implemented; uploads absent          |
| ASVS verification                          | independent assessment                 | Not Started                                 |

This register is not an ASVS conformance claim. Map applicable ASVS requirements to test evidence as each feature becomes executable.

## Phase 0.5 evidence additions

| Control                                         | Executable evidence                                                    | Limitation                                                                           |
| ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Service proof/body/route/session binding/replay | trust unit and Nest integration tests                                  | process-local replay; shared backend required before staging                         |
| Independent BFF creation quotas                 | two signed API clients and actual BFF request contexts                 | cookie resets/NAT/IPv6 require edge controls and tuning                              |
| Nonlocal API authentication/no CORS             | staging-config unsigned denial and signed success                      | test memory adapter; no Azure isolation evidence                                     |
| Explicit stage authority                        | nonstandard-stage schema and invalid-stage API/browser rejection       | normalized UUID FKs and position trigger now implemented                             |
| Entity-level source policy                      | cultural corroboration/official policy and fixture-only parsing        | automated policy/SSRF/TTL implemented; source registry review remains a release gate |
| Retention                                       | injected-clock bounded/idempotent tests; PostgreSQL concurrent batches | deployed worker cadence/backlog alerts absent                                        |
| Immutable action refs                           | upstream-resolved SHAs, Dependabot retained                            | remote runs/account entitlement unverified                                           |

Concrete local validation results are recorded in implementation status. Documentation and substituted test adapters are not evidence of a deployed security control.

Worker least-privilege configuration is executable: readWorkerConfig and domain tests prove it requires no session/ingress signing keys. Production DB grants/managed identities remain deployment gates.

## Phase 1 implemented boundary

Phase 1 test suites exercise OIDC signed/unsigned/expired/wrong-issuer/audience/nonce tokens, cross-client login state/replay, anonymous/role/user/publication rejection, cross-user receipt isolation, concurrent conversion, rotation/revocation/deletion, actual migration upgrades, policy independence/official/freshness/contradiction, and deterministic SSRF/rebinding/redirect/MIME/body/timeout checks. PostgreSQL tests skip explicitly without TEST_DATABASE_URL; browser durable-account tests also require that disposable database. This is implementation evidence, not independent ASVS certification.
