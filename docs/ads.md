# Advertising — foundation design

Native placements: billboards, phone, feed, marketplace, sponsored event/challenge/location/product, transport and signing-out experience. Mark sponsorship clearly. Target only campus/faculty/level/broad interest/virtual context; no religion, sensitive profiling or physical GPS inference.

Campaign state: draft → automated_review → needs_changes/held/rejected/approved → paid → scheduled → active → ended/paused. Server calculates budget/fees and authorizes advertiser access. Impressions/clicks use signed placement/campaign identifiers, dedupe windows, bot filtering and frequency limits; browser counters are untrusted.

URL safety: normalize → HTTPS scheme policy → domain/DNS validation → isolated fetch with pinned public IP → controlled redirects (revalidate all hops/DNS) → Web Risk → category/creative moderation → advertiser reputation → risk decision. Deny loopback, RFC1918, link-local, metadata, IPv6 private/mapped addresses and internal destinations; response/time/content/redirect caps. URL worker has no internal network or credentials. New campaigns fail closed when safety providers are unavailable, existing campaigns follow explicit recheck TTL policy.

Routine safe ads can automatically approve. Risky campaigns are held with machine-readable reasons and reviewed only where needed. Periodically recheck destinations and pause changed/risky URLs. No URL-fetch endpoint or ad activation is implemented in Phase 0.
