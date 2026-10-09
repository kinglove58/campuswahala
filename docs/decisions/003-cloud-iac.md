# ADR 003: Azure and Bicep

Status: Accepted. Use Bicep for first-party Azure resource coverage and managed identity conventions. ACA compute, private PostgreSQL, Blob, Service Bus, optional Managed Redis/Web PubSub, Front Door/WAF, Key Vault and Monitor. Avoid cloud SDK dependencies in pure domain code; ports support replacement. Skeleton is intentionally partial and is not production-ready infrastructure.
