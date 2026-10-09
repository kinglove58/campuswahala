# SEO and privacy

Marketing uses server-rendered semantic HTML and ordinary anchors. Game assets never load on marketing routes. Phase 0: home, universities and three university pages with honest fixture scope, unique title/description/canonical and social metadata. Sitemap only lists meaningful public routes. No fabricated ratings, locations, fees or review schema.

Future: university faculties/departments/guides/places/businesses/events, global guides/businesses/events/about/advertise only after original verified content exists. Return 404 for unknown campus. Structured data is deferred until the public domain and eligible records are confirmed: Organization/WebSite for the platform, and BreadcrumbList, Event and LocalBusiness for applicable verified records. Production metadata base is an explicitly configured HTTPS site origin. Local defaults are localhost.

Phase 0 emits one sitemap for five meaningful routes. At catalogue scale, publish an XML sitemap index with bounded campus/content shards, include only canonical public records and derive last-modified dates from content revisions. Keep private and revoked sharing pages out of every shard.

Game/admin pages carry noindex/nofollow metadata; guest API responses use no-store. Robots metadata is not access control. Profiles are private by default. Signing pages require explicit share state, revocable public slug, moderation and per-page index policy. Never expose timetable, email/phone, bank info or physical location. Signed images render sanitized whitelisted fields server-side; share tokens never authorize edits.

Performance budget: marketing ships no Phaser; game lazily imports canvas after onboarding; fixture world uses procedural assets, no remote fonts or heavy animation library. Measure CWV on real Android/network profiles before launch. PWA/offline cache is deferred; authoritative mutation must always sync with the server.
