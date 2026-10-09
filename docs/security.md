# Security baseline

Target OWASP ASVS 5.0 Level 2 principles, not a certification. Financial/admin workflows require stronger reviewed controls. Browser claims, avatar coordinates and local storage cannot mint rewards or money. All authoritative commands validate schema, ownership, eligibility, state, idempotency and transaction boundaries server-side.

Implemented slice: strict Zod request schemas (no unknown fields), bounded request body, campus/programme cross-check, duration/level constraints, preset nickname/avatar allowlists, random 256-bit capability, keyed token hash, TTL, no public ID endpoint, HttpOnly SameSite=Strict cookie, Secure in nonlocal environment, Origin checks on mutation, security headers, exact local CORS origin, per-endpoint rate limit, request IDs and sanitized errors. No upload, external URL fetch, user text, payment or admin action exists.

Local API binds loopback; nonlocal origin ingress must be private/locked down. Request IP is never read from arbitrary X-Forwarded-For. Local counters do not support multi-replica production. Next proxy caps body, forwards only method/body/content-type/capability and returns no upstream token in JSON. No credentials in URLs or browser storage. Revocation deletes session server-side. Do not log cookies, tokens, bank data or raw request payloads.

Future Entra: authorization code + PKCE, validate issuer/audience/expiry/nonce/state, rotate refresh tokens, revoke sessions; separate player, merchant, moderator, support, admin and financial grants. MFA and reauthentication for privileged actions. Anonymous spectators require rate limits, risk challenges and moderation; opt-in public pages only. Free text chat remains disabled.

Production gates: independent threat/security review; distributed abuse control; verified OIDC; private database/network; managed identity/Key Vault; tested restore; dependency/container scans; endpoint authorization matrix; financial compliance and age/KYC before activating real money. Any removed security control requires ADR and explicit risk review.
