# Automatic publication policy

Phase 1 supersedes Phase 0.5's manual-critical-review proposal. There is **no routine manual approval queue**. Administrative exception overrides are a future authenticated operation and cannot bypass current publication through an API route.

The separate `PublicationPolicyService` returns ALLOW/HOLD/REJECT/STALE with reason codes and policy version. Parsing schema, extraction success and a high model confidence do not establish verification. Evidence must be non-generated, ≥0.85 confidence, dated, not in the future and fresh for its category. Editorial source groups and identical page hashes collapse syndicated copies. Authority/independence comes from the controlled source registry, not candidates or feedback.

| Category                       | Automatic eligibility                                                       | Default freshness |
| ------------------------------ | --------------------------------------------------------------------------- | ----------------- |
| University                     | Fresh official/institutional evidence                                       | 365 days          |
| Faculty, department, programme | Fresh official/institutional evidence                                       | 180 days          |
| Academic structure             | Fresh official/institutional evidence                                       | 90 days           |
| Critical contacts/safety       | Fresh official/institutional evidence only                                  | 7 days            |
| Cultural expressions           | Two genuinely independent non-generated groups                              | 180 days          |
| Locations/buildings            | Official evidence or two independent reputable groups                       | 180 days          |
| Hostels                        | Official evidence or two independent reputable groups                       | 90 days           |
| Routes                         | Official evidence or two independent reputable groups                       | 14 days           |
| Transport/prices               | Official evidence or two independent reputable groups                       | 7 days            |
| Businesses/food spots          | Current authoritative listing or two independent reputable references       | 30 days           |
| Events                         | Authoritative or independently corroborated; explicit end date also expires | 1 day maximum     |

Thresholds/TTLs are injected versioned settings. Fresh, strong contradictions from authorities appropriate to the category hold publication pending independent source rechecks. Significant weighted negative feedback can hold categories without an official-only requirement; official-only academic/critical facts are rechecked but cannot be suppressed by crowd weight. Crowd reports cannot supply official authority or rewrite canonical values. The current strategy conservatively holds contradictions; automated authoritative conflict resolution can be added as a versioned policy after review. Every decision is retained. Expiry removes facts from all public readers immediately by query even if the worker is delayed, then marks them stale without deleting evidence/history. Business lastObservedAt and staleAt are always returned with published records. Events may carry an explicit expiresAt.

Feedback accepts correct/incorrect/outdated/closed/wrong location/suggested correction, strict fact IDs and a bounded optional suggestion. Only current published facts can receive reports. Authenticated actors derive from verified sessions; guests must prove a live guest capability and carry less weight. One retained report per actor/fact prevents repeated vote accumulation. Account age, same-campus character and bounded report history influence internal weight. Browser, network/account rates and HMAC pseudonyms apply. No score is visible. Guests/new accounts cannot instantly replace facts; determined distributed brigading still requires shared controls and abuse review before public launch.
