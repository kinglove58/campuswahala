# ADR 011: Subject/property facts and campus-scoped evidence sources

Status: proposed for Phase 2.5 review. Base master `9427141546c9257d3cc3c213dcf89079425332b1`.

CampusFact identity is campus + subject type + canonical UUID **or** deterministic candidate subject key + property. A SQL XOR constraint enforces one subject identity; separate unique indexes prevent collisions for the same property while allowing hundreds of different buildings with `name`. CampusSubject's composite foreign key prevents cross-campus/type bindings. Exact names/aliases can match uniquely; ambiguous identities stay candidates. No fuzzy merge is enabled.

Extractor candidates require explicit stable subjectKey and propertyKey. Legacy `key` is retained only as an extraction locator/compatibility field. A candidate is not canonical because its spelling looks plausible. Fresh eligible official name publication can establish a subject UUID derived from its campus/type/stable registry key; the fact ID/version/feedback remain unchanged. Its identity proves no coordinates, survey geometry, opening hours or other properties.

Migration 006 preserves existing fact UUIDs, versions, feedback, current pointers and statuses. It maps known UUIDs into subject records and legacy unbound keys into distinct `legacy:<key>` candidates. Dotted registry keys keep their subject and use their terminal property. Unexpected invalid authority/state values abort migration for explicit remediation rather than silently broadening trust or deleting publication history. Backup and verify the real small fact set before any production upgrade; no production migration has run here.

ContentSource uniqueness becomes `(campusId, url)`. One page can support several campuses without assigning all its facts to the first campus. Each association owns policy/schedule/observation metadata; raw pages remain ephemeral and are never duplicated into an archive. Content hashes already prevent copied pages from becoming independent corroboration. A normalized shared source/page table can follow measured volume, not speculation.

Public catalogue has 1–100 records/page, UUID ordering and versioned opaque cursors bound to campus/category/subject filters. It excludes candidates, holds, stale/missing versions and ingestion metadata. This is a live read, not a transactional snapshot across many requests; publications can change between pages. World reads request their campus and canonical venue IDs rather than scanning global facts.

Strict application parsers and database checks constrain authority, source policy, robots/processing/fact states and publication decisions. Critical contacts/fees/deadlines require literal `official` authority; institutional/community/reputable evidence cannot substitute. Academic institutional sources remain separately registry-controlled. Evidence and user feedback never choose their own authority.
