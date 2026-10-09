# ADR 001: Modular monolith and guest slice

Status: Accepted. Use typed packages and Nest modules before service extraction. Separate game/marketing/admin browser bundles. Local bounded memory adapter keeps the slice runnable without paid infrastructure; PostgreSQL adapter supports durable staging. Production fails closed on memory mode. Guest capabilities provide scoped temporary ownership but do not substitute for OIDC. Consequence: production login and shared rate limiting remain launch gates.
