# Architecture

## Modular monolith

Next.js marketing is separate from the Next.js game shell, which lazy loads Phaser. NestJS owns authoritative state; the browser renders and sends intents. A separate worker process executes background work via an adapter. Admin is a separate app with no privileged API implemented yet. No microservice proliferation.

```mermaid
flowchart LR
  Visitor --> Marketing[Next public discovery]
  Visitor --> Game[Next shell + lazy Phaser]
  Game --> BFF[Same-origin proxy: HttpOnly session]
  BFF --> API[Nest modular API]
  Admin[Separate admin boundary] -. future MFA .-> API
  API --> DB[(PostgreSQL)]
  API -. transactional outbox later .-> Queue[Service Bus adapter]
  Queue -.-> Worker
  API -.-> Cache[Managed Redis adapter]
  API -.-> Presence[Web PubSub adapter]
```

Package ownership: domain (pure player contracts/validation); campus-content (catalogue and fixtures); game-engine (render/movement primitives); database (Prisma repository); auth (guest capability/authentication ports); security (request protections); config (environment); observability (redacted request logs); payments (disabled provider port); UI (tokens/components); testing (fixtures). Packages export typed entry points; do not reach into another package's internals.

Identity, Catalogue, Simulation, Academics, Economy, Social, Commerce, Payments, Advertising, Content Intelligence, Moderation, Notifications, Analytics are bounded contexts. API orchestrates domain/repositories, not vice versa. Financial operations never share virtual currency tables. Publish versioned domain events through a transactional outbox when workers are added; consumers use inbox uniqueness, retries, exponential backoff and DLQ. Presence is ephemeral; it cannot change durable state.

Local memory is a demo adapter, bounded to 1,000 active guests and 24-hour TTL. PostgreSQL is the persistent adapter. Tokens are random bearer capabilities, stored only as keyed hashes at rest and delivered via same-origin HttpOnly cookies. Guests are not verified identities. Entra adapter remains a port; no pretend OAuth login.

Extraction triggers: independently hot workloads, compliance isolation or distinct deployment ownership, measured first. Start with one API replica in early staging; distribute rate-limit counters before multiple replicas. Build-time Next public environment values must match deployment origin. See ADRs before changing these decisions.
