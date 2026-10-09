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
