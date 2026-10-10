# ADR 012: Public-only offline cache and preserved guest conflicts

Status: proposed for Phase 2.5 review; no Phase 3 authorization.

The PWA service worker caches a bounded same-origin allowlist: immutable hashed static JS/CSS/fonts, hashed local art, immutable world revisions and a static identity-free offline fallback. It does not cache live guide/identity information, latest pointers, account/guest responses or any mutation. It respects `no-store`, accepts no external URL, does not queue writes and never caches navigation HTML. Offline reload uses generic static UI; a previously open world can continue local cosmetic exploration and map interaction. Private account/guest resume waits for reconnection.

World v2/schema v2 changes canonical bindings and art references. Exact Phase 2 v1 manifests and their original hashed assets remain served unchanged at immutable v1 URLs. Saved safe spawns remain valid or fall back through the existing server read model. No mutable latest pointer is cached indefinitely. Service-worker updates activate on a later navigation, not by forcing an active game onto new code.

When a valid guest and an existing durable character conflict, the transaction stores an owner-bound temporary conflict receipt and returns `EXISTING_CHARACTER_CONFLICT`. The guest, feedback and cookie survive. Another account cannot claim the reserved guest. Same-owner retries remain a conflict. UI offers resume existing or temporary guest exploration with durable writes disabled. First conversion and successful retry still consume only after transactional success.

Deletion cleanup claims at most 100 request rows with `FOR UPDATE SKIP LOCKED`, then obtains user locks without waiting to avoid reversed-lock deadlocks. Only actual deletes complete/count a request. Other workers skip claimed rows; repeat sweeps are idempotent. Request-time session revocation is independent of cleanup. Worker credentials remain database-only, with no API/session/BFF keys.

Explicit account deletion also removes its reserved conflict guests before deleting owner-bound receipts, so account erasure cannot make a previously reserved guest claimable by another account. Normal guest exploration otherwise expires through retention.
