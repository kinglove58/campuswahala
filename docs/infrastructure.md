# Azure architecture and operations

Bicep is the Azure-native IaC choice (ADR 003). Checked-in skeleton creates Log Analytics, managed Container Apps environment and Key Vault. It is an inspectable start, not production network or application deployment.

Production target: Internet → Front Door Premium → managed WAF/bot/rate rules → private-link origin → Container Apps → private PostgreSQL Flexible Server, Managed Redis, Blob, Service Bus. Entra External ID handles player identity; managed identities and Key Vault handle secrets. Web PubSub is optional presence/event fanout. Private DNS and denied public database/cache access are mandatory. Region/Private Link SKU support must be checked before deployment; do not assume every integration is available.

Economical start: one API process plus scale-to-zero workers; small PostgreSQL tier, Blob static assets and minimal queue; do not provision Redis/Web PubSub until measured demand. Front Door Premium/private connectivity has baseline costs; choose deployment budgets explicitly rather than exposing production databases for convenience. Production private origins are a release gate; the skeleton provisions no public DB.

Environments: local, development, staging, production have separate resources/identities/config. CI authenticates via OIDC federated identity; no long-lived Azure credentials. Images run as non-root, health-probed, immutable digest promotion. API readiness checks DB; liveness does not. VNet/subnets, private endpoints/DNS, ACA applications, Front Door/WAF, PostgreSQL, Storage/queue, permissions and alerts are future modules, not implemented by the skeleton.

WAF rollout: detection in staging → inspect false positives → documented narrow exclusions → production prevention. Endpoint-specific limits for login/reset, guests, gifts/checkout, ad creation, signatures/comments, search/uploads. Never trust WAF as sole authorization.

Backup targets: initial RPO ≤15 minutes and RTO ≤4 hours, not achieved SLAs. Enable PostgreSQL PITR, Blob versioning and IaC/config backups. Restore runbook: isolate clean environment, select recovery timestamp, restore DB, verify schema/row checks and journal balance, reconnect test apps with new identity, reconcile provider events/outbox, measure time/loss, promote with review. Quarterly restore drill and after schema/storage changes. Avoid unrestricted production access from laptops; PIM/JIT privileged access.

Reference: https://learn.microsoft.com/en-us/azure/container-apps/how-to-integrate-with-azure-front-door and https://learn.microsoft.com/en-us/azure/container-apps/networking . Review regional/SKU constraints at deployment.
