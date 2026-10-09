# ADR 002: PostgreSQL and Prisma

Status: Accepted. PostgreSQL Flexible Server is production target; Prisma 6.19.3 is pinned for a stable generated client and migration workflow compatible with the local slice. This is a deliberate major-version choice, not a claim of latest-version usage. Review support/advisories before production and migrate to a newer stable major with an ADR if required. Prisma repository stays behind a domain port. Monetary invariants will use SQL constraints/transactions alongside ORM, not just application balances. Initial migration is GuestPlayer only; the full domain ERD is a proposal.

The transitive `deepmerge-ts` dependency is overridden to patched 8.0.0 to address a high-severity advisory. Prisma generate, validate and migration commands must be tested with this override. Remove the override when a chosen Prisma version supplies a patched dependency natively.

Reference: https://docs.prisma.io/docs/orm/v6/reference/prisma-schema-reference
