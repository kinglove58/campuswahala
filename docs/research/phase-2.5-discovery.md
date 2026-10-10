# Phase 2.5 discovery targets

Observed through public search on 10 October 2026. Search results only identify retrieval targets: they are not imported facts or permission to bypass robots. The bounded exact-name registry is in apps/worker/src/landmarks.ts. Normal ingestion must independently fetch, ground, decide and retain provenance.

FUTA: official hostel construction news identifies existing Akindeko, Bisi Balogun and Oba Adesida hostels; the schools directory names Computing, Life Sciences and Physical Sciences; Physical Planning lists a senate extension and central research lab. These claims establish no coordinates or official timetable. Sources:

- https://www.futa.edu.ng/news/1433-fg-flags-off-construction-of-1500-bed-students-hostel-in-futa
- https://schools.futa.edu.ng/
- https://ppu.futa.edu.ng/home/140

OAU: Student Affairs provides residence names. Convocation names Oduduwa Hall. Historical event dates are deliberately not extracted.

- https://oauife.edu.ng/student-affairs/
- https://convocation.oauife.edu.ng/

UNILAG: Explore Campus lists Afe Babalola Hall, Medical Centre, Sport Centre, Lagoon Front, chapel and mosque. Public names are discovery hints; no opening times, emergency contacts or geometry are inferred.

- https://unilag.edu.ng/explore-campus/

Do not infer faith, sex or eligibility from residence/venue identity. Food locations and gates without permitted evidence remain fictional. PDF, video and geodata adapters require a separately reviewed bounded decoder/license policy; HTML, public JSON and permitted text are the executable adapters in this revision.

## Executed isolated evidence

Owner opt-in research ran against disposable PostgreSQL with the normal SSRF/robots/rate/size/publication controls. No production import occurred.

| Campus | Run                                                                                | Result                                                                                                                                                                                                                                       |
| ------ | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FUTA   | [38037980562](https://github.com/kinglove58/campuswahala/actions/runs/38037980562) | Zero published facts. Robots/access checks rejected nine targets; the remaining target was domain-rate limited. This does not prove the sites universally prohibit research; it records this controlled attempt.                             |
| OAU    | [38038490074](https://github.com/kinglove58/campuswahala/actions/runs/38038490074) | University and Hezekiah Oluwasanmi Library identities published through the permitted bounded official public API. Residence targets await a later normal backoff window; large HTML and timed-out sources stay rejected/held.               |
| UNILAG | [38038491546](https://github.com/kinglove58/campuswahala/actions/runs/38038491546) | Eight current facts: university, library, Afe Babalola Hall, Medical Centre, Sport Centre, UNILAG Chapel, UNILAG Mosque, Lagoon Front. Nine allow decisions include corroboration of the same university identity, not nine unique entities. |

The page-list API adapter extracts only bounded rendered title/content from at most 20 objects. Registry requests use per_page=1 and limited fields, with the existing overall fetch byte ceiling. Each API URL independently passes robots and safe fetch; no HTML size/robots limit is increased. Four research ticks respect normal domain pacing/backoff. Retain URL/hash/time/excerpts/structured facts only; raw retrieval text remains ephemeral. Medical identity is not an emergency-contact claim. No coordinates, hours, membership or religious preference are inferred.
