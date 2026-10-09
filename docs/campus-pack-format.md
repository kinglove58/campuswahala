# Campus packs v1

`packages/campus-content/campuses/{futa,oau,unilag}/pack.json` is the single campus-specific source. Each pack includes schemaVersion, id, university display name, palette, contentStatus, programmes, levels, activity templates, locations, routes, transport, hostels, slang, events, quests, businesses and provenance. Runtime schema validation occurs on import.

Add a pack and register its JSON import in `src/registry.ts`, which is configuration only. Campus IDs use a bounded slug format; the API authorizes campus/programme pairs from the registered catalogue. No university-specific domain validator or engine branch is needed. Phase 1 replaces fixture registration with versioned verified catalogue imports.

Programme: stable id/title, typical duration, explicit levels, optional SIWES years/activity tags. Guest may override duration; Phase 0 numeric levels must fit their chosen duration. Catalogue ingestion will support direct entry/transfers/nonstandard structures via explicit programme-level records. A fixture programme is not an assertion that the named university offers it.

Location: stable id, kind, label, x/y coordinates in stylized 960×640 space, interaction copy, provenance/status. Map coordinates are virtual only. Routes/transport and other future arrays are empty until authored; empty arrays do not claim implementation.

Facts require source URL/reference, retrieval date, last observed, campus, category, aliases, confidence and publication status. Supplied university labels are brief inputs; every generated programme, duration, location and schedule is `unverified_fixture`. Fixture banner must be visible in world and phone. Do not publish fixtures as navigation guidance.

Ingestion later: discover permitted sources → extract → normalize → deduplicate → corroborate → score → policy gate → publish. Respect robots/platform rules; no private-group scraping. Critical deadlines/fees/emergency/medical data require authoritative sources and manual policy validation; cultural content can use configurable confidence thresholds. Feedback (correct/incorrect/outdated/correction) adjusts risk with anti-brigading controls. Preserve evidence and versions, never overwrite provenance silently.
