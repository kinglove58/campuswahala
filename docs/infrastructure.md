# Azure architecture and operations

Bicep is the Azure-native IaC choice (ADR 003). Checked-in skeleton creates Log Analytics, managed Container Apps environment and Key Vault. It is an inspectable start, not production network or application deployment.

Production target: Internet → Front Door Premium → managed WAF/bot/rate rules → private-link origin → Container Apps → private PostgreSQL Flexible Server, Managed Redis, Blob, Service Bus. Entra External ID handles player identity; managed identities and Key Vault handle secrets. Web PubSub is optional presence/event fanout. Private DNS and denied public database/cache access are mandatory. Region/Private Link SKU support must be checked before deployment; do not assume every integration is available.

Economical start: one API process plus scale-to-zero workers; small PostgreSQL tier, Blob static assets and minimal queue; do not provision Redis/Web PubSub until measured demand. Front Door Premium/private connectivity has baseline costs; choose deployment budgets explicitly rather than exposing production databases for convenience. Production private origins are a release gate; the skeleton provisions no public DB.

Environments: local, development, staging, production have separate resources/identities/config. CI authenticates via OIDC federated identity; no long-lived Azure credentials. Images run as non-root, health-probed, immutable digest promotion. API readiness checks DB; liveness does not. VNet/subnets, private endpoints/DNS, ACA applications, Front Door/WAF, PostgreSQL, Storage/queue, permissions and alerts are future modules, not implemented by the skeleton.

WAF rollout: detection in staging → inspect false positives → documented narrow exclusions → production prevention. Endpoint-specific limits for login/reset, guests, gifts/checkout, ad creation, signatures/comments, search/uploads. Never trust WAF as sole authorization.

Backup targets: initial RPO ≤15 minutes and RTO ≤4 hours, not achieved SLAs. Enable PostgreSQL PITR, Blob versioning and IaC/config backups. Restore runbook: isolate clean environment, select recovery timestamp, restore DB, verify schema/row checks and journal balance, reconnect test apps with new identity, reconcile provider events/outbox, measure time/loss, promote with review. Quarterly restore drill and after schema/storage changes. Avoid unrestricted production access from laptops; PIM/JIT privileged access.

Reference: https://learn.microsoft.com/en-us/azure/container-apps/how-to-integrate-with-azure-front-door and https://learn.microsoft.com/en-us/azure/container-apps/networking . Review regional/SKU constraints at deployment.

## Current versus release boundaries

Exists in source: Log Analytics/ACA environment/Key Vault foundation, non-root containers, loopback database recipe, signed request contracts, local rate/replay controls, cleanup worker and CI configuration. Nothing has been provisioned by this pass. The ACA skeleton does not establish a private app origin or VNet topology; compilation proves syntax only.

Absent: Front Door Premium/WAF, approved Private Link origins, private DNS/network, authenticated ingress bridge, internal API ACA app, private PostgreSQL, shared rate/replay backend, private Redis, Blob, Service Bus, managed-identity grants, worker scheduling/alerts and deployment pipeline. [Planned module contracts](../infra/modules/README.md) define dependencies without deployable placeholder claims.

Before public staging: validate supported region/workload-profile SKU, Premium/private-link web origin and denied public origin access; internal-only API; ingress header stripping/canonicalization/signing; TLS and independently provisioned keys; shared atomic limits/replay storage with outage tests; private PostgreSQL/DNS (and Redis if needed); tested cleanup cadence/backlog alerts; approved image digests/scans; secured admin boundary and verified OIDC before account tests. Front Door owns coarse network/bot/rate/WAF/request-size controls; application owns client/session/account/route quotas and authorization.

Front Door does not natively issue this app's custom HMAC envelope. A future private ingress bridge must verify the exclusive gateway path, sanitize headers and sign assertions. BFF refuses nonlocal guest traffic until this adapter supplies valid proof. Never substitute arbitrary forwarded headers.

Before production: negative network/auth/rate tests, prevention-mode WAF tuning, key-rotation drill, account/MFA authorization, least-privilege identities, restore/incident drills, retention evidence, load/attack tests and independent review. PostgreSQL and Redis must never be publicly exposed to simplify development. RPO/RTO remain targets; no Azure resources or spending in this pass.

## Phase 1 implemented boundary

Phase 1 uses no Azure/paid deployment. Identity is an Entra adapter/configuration boundary only; actual tenant/client registration, secret/certificate storage and admin MFA remain external setup gates. Worker egress must be isolated and deny internal/metadata networks independently of application SSRF checks. Separate API/worker/marketing PostgreSQL roles must restrict publication writes to the worker and private data to authorized service paths before public deployment. The minute worker now handles guest retention plus pending account erasure/session/attempt/receipt cleanup and opt-in research; monitor backlog/deletion latency/source failures/staleness. Multi-replica public staging requires shared atomic account/client/network/replay limits plus ingestion leases and domain pacing.
