# Control evidence register

| Control                                   | Evidence                               | Status                        |
| ----------------------------------------- | -------------------------------------- | ----------------------------- |
| Strict inputs and no rewards over-posting | domain schemas + API integration tests | Implemented                   |
| Capability ownership/expiry               | auth hash + player service + API tests | Implemented guest scope       |
| CSRF/origin and no token exposure         | Next guest proxy + e2e                 | Implemented guest scope       |
| Input/body/rate limits                    | Nest middleware + tests                | Local baseline                |
| SQL parameterization                      | Prisma repository                      | Implemented; optional DB test |
| Log redaction                             | structured allowlisted logger + test   | Implemented baseline          |
| OIDC/MFA and admin authorization          | auth ports; admin has no operations    | Not Started                   |
| Distributed abuse/WAF prevention          | infrastructure design                  | Not Started                   |
| Financial idempotency/audit               | payments design                        | Not Started                   |
| Malware/SSRF moderation                   | ads/upload design                      | Not Started                   |
| ASVS verification                         | independent assessment                 | Not Started                   |

This register is not an ASVS conformance claim. Map applicable ASVS requirements to test evidence as each feature becomes executable.

## Phase 0.5 evidence additions

| Control                                         | Executable evidence                                                    | Limitation                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Service proof/body/route/session binding/replay | trust unit and Nest integration tests                                  | process-local replay; shared backend required before staging |
| Independent BFF creation quotas                 | two signed API clients and actual BFF request contexts                 | cookie resets/NAT/IPv6 require edge controls and tuning      |
| Nonlocal API authentication/no CORS             | staging-config unsigned denial and signed success                      | test memory adapter; no Azure isolation evidence             |
| Explicit stage authority                        | nonstandard-stage schema and invalid-stage API/browser rejection       | normalized FKs/admission eligibility remain Phase 1          |
| Entity-level source policy                      | cultural corroboration/official policy and fixture-only parsing        | authenticity/manual review importer absent                   |
| Retention                                       | injected-clock bounded/idempotent tests; PostgreSQL concurrent batches | deployed worker cadence/backlog alerts absent                |
| Immutable action refs                           | upstream-resolved SHAs, Dependabot retained                            | remote runs/account entitlement unverified                   |

Concrete local validation results are recorded in implementation status. Documentation and substituted test adapters are not evidence of a deployed security control.

Worker least-privilege configuration is executable: readWorkerConfig and domain tests prove it requires no session/ingress signing keys. Production DB grants/managed identities remain deployment gates.
