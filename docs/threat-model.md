# Threat model — STRIDE

Assets: identity/session, player progression, virtual economy, real ledger, private academic data, payout tokens, content provenance, administrator authority. Boundaries: hostile browser → Next proxy → private API → database; provider webhook → payment adapter; submitted URL → isolated fetch worker; uploaded file → quarantine; advertiser → moderation.

| Threat                 | Attack                                           | Mitigation / verification                                             | Phase 0                 |
| ---------------------- | ------------------------------------------------ | --------------------------------------------------------------------- | ----------------------- |
| Spoofing               | Stolen/guessed guest token, forged OIDC          | 256-bit capability, hash, TTL, HttpOnly; later PKCE/MFA               | Capability tests        |
| Tampering              | Post money/XP, invalid campus, manipulated level | strict allowlist schema, cross-field invariants, server authority     | Negative API tests      |
| Repudiation            | Deny financial/admin action                      | immutable audit + journals, request IDs, protected storage            | Financial design only   |
| Information disclosure | IDOR, indexing private player, logs              | self-only capability endpoint, noindex, redaction, private DB         | Ownership/noindex tests |
| Denial of service      | Huge payloads, guest flood, expensive fetch      | body cap, route limits, bounded TTL store, WAF, queue quotas          | Local controls tested   |
| Elevation              | Guest becomes admin, role over-posting           | no role fields/endpoints, separate admin, MFA/least privilege         | over-posting tests      |
| SSRF                   | Metadata/private IP via redirects/DNS rebinding  | isolated egress, resolve/pin all hops, IPv4/IPv6 denial, limits       | No fetch feature        |
| Financial replay       | Forged/duplicate webhook, negative amount        | HMAC raw body, server verification, unique reference, balanced ledger | Not activated           |
| Supply chain           | Poisoned dependency/secrets in build             | exact versions, lockfile, audit, CodeQL, secret/container scan        | CI scaffold             |

Residual risks: guest cookie theft grants limited guest access; local counters can be evaded across replicas; no verified identity; fixture content is not official. Production deployment is gated. Review at each new trust boundary, especially sharing, upload, payments and advertising. Owner: implementing engineer; record evidence in security-controls and status before release.
