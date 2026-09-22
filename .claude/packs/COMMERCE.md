# Pack — Commerce and Payments

## Contract

- catalog/SKU/variant/inventory/pricing/tax/shipping/subscription/order/refund model;
- source of truth and synchronization;
- roles and administrative actions;
- payment provider and hosted/tokenized boundaries;
- webhook signature, idempotency, retries, duplicate/out-of-order events;
- fraud/abuse/rate handling;
- accessibility and complete cart/checkout/error/cancel/return states;
- receipts, support, privacy/retention, analytics, and jurisdiction obligations.

## Truth rules

Price, stock, shipping time, discounts, scarcity, reviews, guarantees, environmental claims, and availability must come from an owned source and be current. No fake countdown, crossed-out price, inventory pressure, or preselected paid add-on.

## Tests

Success/decline/cancel/timeout, duplicate submit/webhook, invalid signature, price change, out-of-stock, tax/shipping failure, refund/chargeback, role access, accessibility, and provider outage. Use provider test environments and never store raw sensitive payment credentials.

## Release evidence

Provider configuration and secret boundary, webhook/idempotency tests, order reconciliation, refund/support path, truthful price/stock source, privacy/security review, and production approval.

