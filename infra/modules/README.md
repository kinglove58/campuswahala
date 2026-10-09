# Planned Azure module contracts

These are boundaries to implement and test, not deployable placeholder modules. `../main.bicep` remains a foundation skeleton only.

| Module              | Inputs / outputs                                                   | Mandatory boundary                                                                               |
| ------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| network             | environment/region, subnet sizes -> VNet/subnets/private DNS IDs   | separated ingress/compute/data; deny public DB/cache                                             |
| edge                | private web origin ID, domains -> Premium Front Door/WAF route IDs | approved Private Link, WAF/bot/network controls, no API route                                    |
| ingress             | approved edge identity/path -> internal bridge URL                 | sanitize client headers, canonicalize client IP, sign bounded edge assertions; no raw-IP logging |
| compute             | image digests, internal endpoints, identity IDs -> app/job IDs     | game/marketing web behind edge; API internal-only; worker no ingress                             |
| postgres            | data subnet/DNS, managed identity policy -> private endpoint/FQDN  | publicNetworkAccess disabled, PITR, TLS, no public workaround                                    |
| redis (conditional) | private endpoint/DNS, capacity -> private FQDN                     | required for shared counters if selected; denied public access                                   |
| storage             | private endpoint/DNS, identities -> blob endpoints                 | least privilege, versioning; approved public asset delivery only                                 |
| messaging           | queue policy/private DNS, identities -> Service Bus namespace      | RBAC, retries/DLQ/quotas                                                                         |
| secrets-identities  | resource IDs/role scopes -> managed identities/vault grants        | no stored cloud credentials; independent trust secrets; rotation                                 |
| operations          | app/data IDs, recipients -> alerts/retention/backup policy         | no raw IP/session logging, cleanup failure/backlog metrics, tested restore                       |

Dependencies: network -> private data/secrets -> compute/ingress -> edge -> operations. Validate supported region/SKU/private connectivity first; compile/what-if and network rejection tests before public staging. No Azure resources created in Phase 0.5.
