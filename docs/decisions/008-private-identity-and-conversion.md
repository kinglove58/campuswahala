# ADR 008: Private BFF identity and transactional conversion

Status: Accepted for Phase 1 local development; deployment review gates remain.

Use Entra External ID behind an authorization-code/PKCE provider interface, with an explicitly local-only demo provider. Keep provider tokens server-side and issue opaque revocable CampusWahala browser sessions. Key external identities by provider+subject, never email. Bind single-use login state to the signed client cookie and nonce. Rotate sessions and derive account abuse dimensions from verified principals.

Convert a guest capability into one private durable character in a row-locked transaction. Retain a short owner-bound idempotency receipt; consume the guest only after success. An existing character wins unchanged. Store UUID campus/programme/structure/version/stage references with database consistency guards. No caller user ID, roles, publication status or resource balances are accepted. Unknown/minor privacy is strict, deletion revokes immediately and physically removes Phase 1 account data through the worker.
