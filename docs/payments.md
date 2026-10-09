# Payments — design only, disabled

Three separate domains: Campus Cash (virtual, no redemption), real commerce, real gifts/earnings. No conversion rate and no shared balance column. PaymentProvider port initially targets hosted Paystack checkout; raw cards never reach CampusWahala. Adapter currently rejects operations: no payment endpoint is exposed.

Server computes amounts from trusted order/gift intent and fee policy. Minor-unit integer amount, currency NGN, recipient/provider subaccount, provider reference and idempotency key are bound to intent. Fee policy supports percentage, fixed fee, provider fee treatment, recipient share, category/campaign overrides and effective version; no global hard-coded 10%.

Intent states: created → checkout_pending → provider_confirmed → posted → settled; failed/expired alternatives. Webhook uses raw-body HMAC verification, event type allowlist and server-to-server confirmation of reference, amount, currency, recipient and state. Persist provider-event digest and secure payload with retention controls. Duplicate reference/event returns success without duplicate posting. A transaction commits balanced journal, audit and outbox together. Out-of-order/retry events reconcile rather than overwrite settled records.

Journal fields: transaction/provider reference, source/destination accounts, gross/platform/provider/recipient amounts, currency, status, created/settled timestamp, idempotency key. Immutable postings sum to zero per currency. Refunds/reversals append compensating journals referencing originals. Reconcile provider settlement reports daily; alert on differences. Unknown provider fee stays explicitly unknown until reconciled.

Payouts: eligible age/KYC, bank → account number → provider name verification → provider subaccount/token. Minimize bank data; encrypt necessary values and restrict access. Gifts/fundraising use category-specific eligibility/risk/fees. Public gifts require anti-abuse and fraud controls. Production payments remain off until security and compliance reviews, replay/failure/audit/idempotency tests and operational reconciliation are complete.

Commerce order transitions: pending → paid → accepted → preparing → ready → dispatched → delivered; cancelled/refunded/disputed branches have explicit authorized transitions. Merchant fulfils initially; logistics adapters later.
