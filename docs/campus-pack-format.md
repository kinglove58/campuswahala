# Campus preview packs v2

The FUTA/OAU/UNILAG JSON packs remain single-source configuration registered in src/registry.ts. Runtime Zod parsing rejects unsupported versions (now 2), unknown fields, duplicate entity IDs and broken location/building/route/activity/stage references. No unknown placeholder arrays or silent v1 fallback remain.

Exported schemas cover programmes, programme structures/stages/semesters, locations, buildings/venues, routes/virtual waypoints, transport, hostels, slang/cultural facts, events, quests, businesses and activity templates. Empty future arrays describe contracts, not activated gameplay, commerce or real navigation.

Structures own ordered stable stage IDs, compatibility numeric codes, entry modes, activity tags and semester definitions. `levels` is a compatibility projection which must match stage codes exactly. Personal duration is independent. Engineering preview explicitly includes 100..600 to preserve the prior guest case; computing has four stages and extended has six. These are generated samples, not university academic claims. Nonstandard numeric codes are supported; Phase 1 normalizes structure/stage IDs and independent academic calendar/history records.

Every entity has metadata: status (fixture/candidate/published/outdated/rejected), category, authorityClass, confidence, aliases, evidence[], retrievedAt and lastObservedAt (nullable for fixtures). Evidence includes sourceId, reference/URL text, authority, retrieval/observation dates and independentGroup for corroboration. Properties with different factual authority should become separate fact entities; never give an entire university one verification badge. Evidence references are never fetched by schemas.

Structural publication gates: fixtures have confidence zero and cannot publish as generated authority. Cultural records need at least two independent non-generated source groups and confidence ≥0.8. Official information requires official/institutional evidence. Critical information requires fresh official/institutional evidence under the automated Phase 1 policy; no routine manual approval. Publication requires dates/evidence. Schema checks cannot establish authenticity, reviewer authorization or freshness; future ingestion must enforce those, retain versions/decisions and apply category-specific expiry. The current pack registry still contains fixtures; structured research facts live in PostgreSQL, not these packs.

Every registered preview entity must additionally remain **fixture**, with `contentStatus: unverified_fixture` and visible world/phone warnings. Candidate/published schema support is not a verified catalogue. University labels originate from the user's brief; coordinates are stylized 960×640 geometry. Empty arrays are not implementations.

Future pipeline: permitted discovery → extraction → normalization/deduplication → provenance/corroboration → automatic source policy → immutable publication. No private-group scraping. Feedback needs anti-brigading controls; evidence/rejected/outdated records must not be silently overwritten.

The general packSchema accepts `mixed_content` packs with independently validated entity statuses for future ingestion. This is a neutral container marker, not a verified-university badge. The stricter previewPackSchema is what the current registry uses, rejecting all mixed/candidate/published packs. No real content is registered or served.

## Phase 1 implemented boundary

The Phase 1 normalized catalogue uses UUIDs separate from these compatibility slugs, versioned structures/stages and retained structured fact provenance. Fixture seed migration preserves these exact demo choices for conversion without promoting their metadata. PublicationPolicyService is the authority (currently confidence >=0.85 plus category TTL/source/independence/contradiction requirements); pack schema structural minima are not a substitute. Critical publication is automated official-source-only, superseding prior manual-review wording.
