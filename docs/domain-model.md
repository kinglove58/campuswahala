# Domain model and schema

The ownership table and broad ER diagram include future contexts; only the Phase 1 implemented boundary below is executable today. Simulation, rewards, financial and social aggregates are design context, not seeded tables or active systems.

## Ownership and aggregates

| Context              | Aggregate roots and owned records                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Identity             | User, Profile, Session, role grants, Payout eligibility references                                                              |
| Campus Catalogue     | University → Campus; Faculty → Department → Programme → ProgrammeStage; Location, Building, Venue, Route, TransportMode, Hostel |
| Simulation           | PlayerCharacter → PlayerStats, Inventory/Item ownership, Skill, Room/Roommate, WahalaEvent; WahalaTemplate                      |
| Academics            | AcademicSession → Semester; Course, Enrollment → Assessment (Lecture/Assignment/Test/Exam), Result; Progression                 |
| Economy              | VirtualWallet → immutable VirtualLedger; Hustle, simulated Job, virtual Business                                                |
| Social               | Friendship, Club, Organization, CampusEvent, Quest, Achievement, CampusWar/Leaderboard                                          |
| Commerce             | VerifiedBusiness → Product; Order → OrderLine/StateHistory; real Job                                                            |
| Payments             | PaymentIntent, ProviderEvent, Journal → Posting, PayoutProfile, Gift, FeePolicy                                                 |
| Memories             | SigningPage → Signature, MemoryBook, BirthdayEvent, CreatorProfile, Fundraiser                                                  |
| Advertising          | Advertiser → Campaign → Creative, Placement, Impression, Click                                                                  |
| Content Intelligence | ContentSource → CampusFact → Evidence, FactFeedback                                                                             |
| Moderation           | Report, ModerationEvent, AuditLog                                                                                               |

```mermaid
erDiagram
  UNIVERSITY ||--o{ CAMPUS : contains
  CAMPUS ||--o{ FACULTY : owns
  FACULTY ||--o{ DEPARTMENT : owns
  DEPARTMENT ||--o{ PROGRAMME : offers
  PROGRAMME ||--o{ PROGRAMME_STRUCTURE : versions
  PROGRAMME_STRUCTURE ||--o{ PROGRAMME_STAGE : defines
  ACADEMIC_YEAR ||--o{ SEMESTER : contains
  USER ||--o| PLAYER_CHARACTER : plays
  CAMPUS ||--o{ PLAYER_CHARACTER : hosts
  PROGRAMME ||--o{ PLAYER_CHARACTER : studies
  PLAYER_CHARACTER ||--|| PLAYER_STATS : has
  PLAYER_CHARACTER ||--o{ ENROLLMENT : registers
  COURSE ||--o{ ENROLLMENT : has
  SEMESTER ||--o{ ENROLLMENT : schedules
  ENROLLMENT ||--o{ RESULT : receives
  PLAYER_CHARACTER ||--|| VIRTUAL_WALLET : owns
  VIRTUAL_WALLET ||--o{ VIRTUAL_LEDGER : records
  PAYMENT_INTENT ||--o{ PROVIDER_EVENT : reconciles
  JOURNAL ||--|{ POSTING : balances
  ORDER ||--o{ ORDER_LINE : contains
  ORDER ||--o{ PAYMENT_INTENT : funds
  SIGNING_PAGE ||--o{ SIGNATURE : collects
  CONTENT_SOURCE ||--o{ EVIDENCE : supports
  CAMPUS_FACT ||--o{ EVIDENCE : justified
```

This is a proposal, not a claim that these tables exist. Phase 0 migration only adds GuestPlayer: UUID, campus/programme keys, current level, individual duration, avatar/preset nickname, hashed capability, expiry and timestamps. Catalogue stays versioned fixture configuration until validated research supports normalized import. Guest has no user foreign key and no publicly queryable list. Phase 1 adds identities, versioned structure/stage catalogue and explicit guest-to-player conversion, transactionally.

IDs are opaque UUIDs; tenant/campus filters do not replace resource ownership. Money uses integer minor units / database BigInt, never floats. Every amount carries a currency/domain; virtual cash cannot enter real postings. Financial posting sums must be zero per currency, enforced transactionally and by database constraints/triggers. Settled journals append only; reversals reference the original journal. Provider references and idempotency scope/key are unique. Outbox shares the source transaction.

Indexes: token hash unique, guest expiry/id, campus/programme/level; later enrollment(player, semester), order(merchant,status,created), event(aggregate,sequence), payment(provider,reference), ledger(account,created). Page all lists with bounded cursors. The PostgreSQL worker now purges expired guests at startup/every 15 minutes in bounded batches; access expiry remains enforced on reads. Deployment cadence/backlog alerts remain release gates. Audit/financial retention requires legal policy.

## Explicit academic position

Programme → versioned ProgrammeStructure → ProgrammeStage → explicit semester definitions. AcademicYear is a separate calendar record. `AcademicPosition` declares structure ID/version, stage ID, academic year/semester, admission mode, enrollment state and attempt. These are Phase 1 contracts, not added tables or a progression engine.

Guests retain numeric `level` as a compatibility code (1..9999), selected from the registered programme's explicit stages. It need not be a multiple of 100. Personal durationYears (1..12) never validates or generates stages. Direct entry/transfers need future admission checks; repeated stages retain stage identity with a new attempt/history. Interruption/deferment changes enrollment state. SIWES/IT associates authored tags/templates with stage IDs. No universal internship year or numeric next-level formula.

Migration 202610090002_explicit_stages removes both arithmetic CHECK constraints, adds independent bounds and an expiry/id index without rewriting guests. PlayerService enforces catalogue membership; configuration is not yet relational. The PostgreSQL regression test persists stage 42 with a one-year preference to prove arithmetic is gone. Phase 1 normalized imports must pin structure versions and add transactional catalogue FKs.

## Phase 1 implemented boundary

The current schema is packages/database/prisma/schema.prisma. Migrations 003-004 add User, ExternalIdentity, UserProfile, UserPrivacySettings, UserSession, LoginAttempt, DeletionRequest, PlayerCharacter and GuestConversion; University/Campus/Faculty/Department/Programme/ProgrammeStructure/ProgrammeStage/AcademicSemesterTemplate; Location/Building/Hostel/Route/TransportMode/CulturalFact/CampusBusinessReference; ContentSource/SourceObservation/Evidence/CampusFact/FactVersion/FactVersionEvidence/PublicationDecision/FactFeedback/EntityMergeHistory. UUID identities are distinct from public slugs. Versioned structures and explicit stages/entry modes have no duration or 100-level arithmetic. SQL guards relational position consistency. Preview academic rows are explicitly fixture; facts are empty on migration. Repeat/defer/interruption/transfer/programme-change remain contracts, not progression behavior.
