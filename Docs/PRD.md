
# Product Requirements Document (PRD)
## Hybrid Clothing Brand SaaS

**Document Version:** 1.0  
**Status:** MVP Scope Finalized  
**Last Updated:** 14 October 2026  
**Product Type:** Multi-tenant SaaS  
**Target Market:** Small and growing clothing brands, D2C businesses, boutiques, and social-commerce sellers

---

## 1. Product Overview

### 1.1 Product Vision

Build an apparel-focused SaaS platform that enables clothing businesses to launch and manage their online stores while operating their product catalog, inventory, orders, customers, and sales analytics from one centralized dashboard.

The platform will combine built-in e-commerce capabilities with clothing-specific business operations.

### 1.2 Product Mission

Simplify the process of selling clothing online and managing day-to-day business operations by replacing fragmented tools, spreadsheets, and manual workflows with one integrated platform.

### 1.3 Product Description

The platform will provide each registered clothing business with:

- A dedicated business workspace.
- A branded, ready-to-use online storefront.
- Apparel product and variant management.
- Inventory and stock movement tracking.
- Centralized order management.
- Customer records and order history.
- Manual recording of Instagram and WhatsApp orders.
- Sales, inventory, and basic profitability reports.
- Subscription and account management.

The system will be designed as a multi-tenant SaaS application, allowing multiple independent businesses to use the same platform while keeping their data isolated.

---

## 2. Problem Statement

Small clothing brands, boutiques, and social-commerce sellers frequently manage their operations using separate tools.

Common problems include:

- Product information scattered across spreadsheets and social media.
- Difficulty tracking sizes, colors, and individual product variants.
- Incorrect stock counts and accidental overselling.
- Website orders and social-media orders managed separately.
- Poor visibility into sales, returns, and product performance.
- Difficulty identifying fast-selling and slow-moving variants.
- Manual order processing and customer communication.
- High costs or complexity associated with enterprise commerce software.

The platform aims to solve these problems through an affordable, easy-to-use, apparel-specific management system.

---

## 3. Product Goals

### 3.1 Primary Goals

1. Allow clothing businesses to establish an online store without building a website from scratch.
2. Provide reliable inventory tracking at the individual variant level.
3. Centralize online and manually recorded social-commerce orders.
4. Simplify product, customer, and order management.
5. Provide actionable sales and inventory insights.
6. Support multiple independent businesses through a secure SaaS architecture.
7. Establish a scalable foundation for subscriptions and future modules.

### 3.2 Secondary Goals

- Reduce manual inventory management.
- Improve visibility into product and variant performance.
- Help businesses understand estimated gross margins.
- Make the platform usable by non-technical business owners.
- Enable future integrations with payment gateways, couriers, messaging services, and marketplaces.

### 3.3 Non-Goals for MVP

The initial release will not include:

- A full drag-and-drop website builder.
- Native iOS or Android applications.
- Automated Instagram DM ingestion.
- Unofficial WhatsApp automation.
- Marketplace synchronization with Amazon or Flipkart.
- Advanced manufacturing and production management.
- Multi-warehouse inventory transfers.
- AI demand forecasting.
- Full accounting or automated GST filing.
- Advanced loyalty, affiliate, and referral programs.

---

## 4. Target Customers

### 4.1 Small D2C Clothing Brands

Businesses selling their own clothing collections directly to customers.

**Primary needs:**
- Branded online storefront.
- Product and variant management.
- Inventory visibility.
- Order processing.
- Sales and product analytics.

### 4.2 Boutiques and Clothing Retailers

Local clothing shops that want to manage products and inventory while establishing an online presence.

**Primary needs:**
- Product catalog management.
- Stock tracking by size and color.
- Online sales.
- Customer and order records.
- Basic sales reporting.

### 4.3 Social-Commerce Sellers

Businesses receiving orders through Instagram and WhatsApp conversations.

**Primary needs:**
- Centralized product and inventory information.
- Manual recording of social orders.
- Unified customer records.
- Order status tracking.
- Channel-level sales reporting.

### 4.4 User Roles

- **SaaS Administrator:** Manages the overall platform and tenant accounts.
- **Business Owner:** Manages a business workspace, products, inventory, orders, and settings.
- **Staff Member:** Performs permitted operational activities when team permissions are enabled.
- **Store Customer:** Browses a brand's public storefront and places orders.

Detailed staff permission management may be introduced after the core MVP, but tenant security must exist from the beginning.

---

## 5. Product Scope

The product will consist of the following modules:

1. Authentication and onboarding.
2. Business workspace and brand settings.
3. Dashboard.
4. Product catalog and apparel variants.
5. Inventory management.
6. Built-in online storefront.
7. Cart and checkout.
8. Order management.
9. Customer management.
10. Manual Instagram and WhatsApp order recording.
11. Basic discounts.
12. Sales and inventory analytics.
13. Subscription and SaaS administration.
14. Security, auditing, backup, and data export.

---

## 6. Functional Requirements

Priority definitions:

- **P0:** Required for MVP.
- **P1:** Important post-MVP enhancement.
- **P2:** Future or advanced functionality.

### 6.1 Authentication and Onboarding

**FR-AUTH-01:** Users must be able to register and log in securely.

**FR-AUTH-02:** Users must be able to reset forgotten passwords.

**FR-AUTH-03:** New business owners must complete an onboarding workflow.

**FR-AUTH-04:** The onboarding workflow must collect essential business information.

**FR-AUTH-05:** Each business must have a separate workspace.

**FR-AUTH-06:** Business owners must be able to configure brand identity and store settings.

**FR-AUTH-07:** Access to business resources must be authorized on the server.

**Priority:** P0

### 6.2 Dashboard

**FR-DASH-01:** Display sales totals for a selected period.

**FR-DASH-02:** Display total orders and order-status summaries.

**FR-DASH-03:** Display product and variant inventory summaries.

**FR-DASH-04:** Highlight low-stock and out-of-stock variants.

**FR-DASH-05:** Display recent orders and relevant business activity.

**FR-DASH-06:** Provide quick access to frequently used actions.

**FR-DASH-07:** Support predefined and custom reporting periods.

**Priority:** P0

### 6.3 Product Catalog

**FR-PROD-01:** Business owners must be able to create, view, update, and archive products.

**FR-PROD-02:** Products must support names, descriptions, images, categories, and collections.

**FR-PROD-03:** Products must support selling prices and optional cost prices.

**FR-PROD-04:** Products must support apparel attributes such as size and color.

**FR-PROD-05:** Each sellable variant must have a unique SKU within its business workspace.

**FR-PROD-06:** Each variant must support its own inventory quantity.

**FR-PROD-07:** The system must support product search, filtering, and sorting.

**FR-PROD-08:** Products must support draft, active, and archived states.

**FR-PROD-09:** Public storefronts must display only products intended to be publicly available.

**Priority:** P0

### 6.4 Inventory Management

**FR-INV-01:** Inventory must be tracked at the product-variant level.

**FR-INV-02:** Authorized users must be able to make stock adjustments.

**FR-INV-03:** Every stock adjustment must have a recorded reason.

**FR-INV-04:** The system must maintain a stock movement history.

**FR-INV-05:** Business owners must be able to configure low-stock thresholds.

**FR-INV-06:** The system must prevent sales from exceeding available inventory.

**FR-INV-07:** Stock changes caused by orders must be traceable.

**FR-INV-08:** Eligible cancellations must release reserved stock or restore committed stock according to the order lifecycle.

**FR-INV-09:** Returned items must not become sellable stock until their restocking eligibility is confirmed.

**FR-INV-10:** Concurrent checkout attempts must not oversell the same inventory.

**Priority:** P0

### 6.5 Built-in Storefront

**FR-STORE-01:** Every business must have its own public storefront.

**FR-STORE-02:** Each storefront must display the business's brand identity.

**FR-STORE-03:** Customers must be able to browse product listings and collections.

**FR-STORE-04:** Customers must be able to view product descriptions, images, prices, and available variants.

**FR-STORE-05:** Storefronts must support size and color selection.

**FR-STORE-06:** Customers must be able to add items to and remove items from their cart.

**FR-STORE-07:** Cart quantities must be validated against current inventory.

**FR-STORE-08:** Storefronts must work on mobile, tablet, and desktop devices.

**FR-STORE-09:** Storefronts must support basic SEO metadata.

**FR-STORE-10:** Each storefront must have a platform-provided URL.

**Priority:** P0

### 6.6 Checkout and Payments

**FR-CHECKOUT-01:** Customers must be able to submit delivery and contact information.

**FR-CHECKOUT-02:** The checkout must display an accurate order summary.

**FR-CHECKOUT-03:** The system must calculate item totals, discounts, shipping charges, and final order totals.

**FR-CHECKOUT-04:** The system must support cash-on-delivery where enabled by the business.

**FR-CHECKOUT-05:** Payment method and payment status must be recorded separately from order status.

**FR-CHECKOUT-06:** If online payments are enabled, payment status must be verified server-side through a trusted gateway response or webhook.

**FR-CHECKOUT-07:** Duplicate checkout submissions and payment callbacks must be handled safely.

**FR-CHECKOUT-08:** Failed payments must not be treated as successful payments.

**FR-CHECKOUT-09:** Refunds must be recorded against the relevant order and payment.

**Priority:** P0 for checkout and payment records. Live online payment gateway integration must be completed before accepting online payments.

### 6.7 Order Management

**FR-ORDER-01:** Business owners must be able to view and search orders.

**FR-ORDER-02:** Every order must include its line items, quantities, selected variants, prices, discounts, and totals.

**FR-ORDER-03:** Orders must record their sales channel.

**FR-ORDER-04:** The system must support manual order creation.

**FR-ORDER-05:** Order status and payment status must be managed independently.

**FR-ORDER-06:** Authorized users must be able to update order status.

**FR-ORDER-07:** Eligible orders must be cancellable.

**FR-ORDER-08:** Order items must preserve a snapshot of the product and pricing information at the time of purchase.

**FR-ORDER-09:** The system must maintain order status history.

**FR-ORDER-10:** Customers must receive an order confirmation or reference after successful order creation.

**FR-ORDER-11:** Businesses must be able to generate or print a basic order receipt.

**Priority:** P0

### 6.8 Customer Management

**FR-CUST-01:** The system must maintain customer records.

**FR-CUST-02:** Customer records must support names, contact details, and delivery addresses.

**FR-CUST-03:** Authorized users must be able to search customer records.

**FR-CUST-04:** The system must display relevant order history for each customer.

**FR-CUST-05:** Customer records must be associated with the correct business workspace.

**FR-CUST-06:** Customer information must be protected against unauthorized access.

**Priority:** P0

### 6.9 Instagram and WhatsApp Sales

**FR-SOCIAL-01:** Business owners must be able to record orders received through Instagram and WhatsApp.

**FR-SOCIAL-02:** Social orders must use the same product, inventory, customer, and order-management services as storefront orders.

**FR-SOCIAL-03:** Each order must retain its source channel.

**FR-SOCIAL-04:** Business owners must be able to associate social orders with customer records.

**FR-SOCIAL-05:** The system must support order confirmation details that can be copied or shared manually.

**FR-SOCIAL-06:** Social orders must appear in sales and order reports.

**Priority:** P0

Automated DM synchronization and automated messaging are excluded from the MVP.

### 6.10 Discounts

**FR-DISC-01:** Business owners must be able to create basic coupon codes.

**FR-DISC-02:** The system must validate coupon eligibility.

**FR-DISC-03:** Discounts must be calculated server-side.

**FR-DISC-04:** Orders must preserve applied discount information.

**FR-DISC-05:** Invalid, expired, or ineligible coupons must be rejected.

**Priority:** P0 for basic coupons; advanced promotional rules are P1.

### 6.11 Analytics and Reporting

**FR-REPORT-01:** Display sales totals over a selected period.

**FR-REPORT-02:** Display order counts and status breakdowns.

**FR-REPORT-03:** Identify best-selling products.

**FR-REPORT-04:** Display inventory and low-stock reports.

**FR-REPORT-05:** Display size- and color-level sales where sufficient data exists.

**FR-REPORT-06:** Report sales by channel.

**FR-REPORT-07:** Support CSV export for selected reports.

**FR-REPORT-08:** Display estimated gross margin where product cost information is available.

**FR-REPORT-09:** Distinguish gross order value, discounts, cancellations, refunds, and collected payments.

**Priority:** P0 for basic reporting and export; advanced analytics are P1/P2.

### 6.12 SaaS Administration and Subscriptions

**FR-SAAS-01:** The platform must support multiple independent business tenants.

**FR-SAAS-02:** The system must enforce tenant-level data isolation.

**FR-SAAS-03:** The platform must maintain subscription and plan status.

**FR-SAAS-04:** The platform must support configurable free and trial access.

**FR-SAAS-05:** The system must enforce configured usage limits.

**FR-SAAS-06:** Authorized SaaS administrators must be able to manage tenant account status.

**FR-SAAS-07:** Sensitive actions must be auditable.

**FR-SAAS-08:** The platform must support data export and account deletion workflows.

**FR-SAAS-09:** The platform must have a documented backup and recovery process.

**FR-SAAS-10:** Application failures and important operational errors must be monitored.

**Priority:** P0

---

## 7. Non-Functional Requirements

### 7.1 Security

- Use secure authentication and session handling.
- Enforce authorization at the backend and database levels.
- Apply tenant isolation to all business-owned data.
- Validate inputs on the server.
- Protect credentials, API keys, and payment secrets.
- Use HTTPS in production.
- Apply rate limiting to sensitive endpoints.
- Maintain audit trails for sensitive operations.
- Avoid storing raw payment-card information.
- Implement appropriate account deletion and data retention procedures.

### 7.2 Performance

Initial engineering targets, to be validated under realistic workloads:

- Common dashboard and catalog requests should target a p95 response time below 500 ms, excluding external service latency.
- Storefront pages should be optimized for mobile networks.
- Product and order lists should use pagination.
- Database queries should be indexed according to access patterns.
- Heavy reports should not block normal checkout operations.

### 7.3 Reliability

- Order creation must be transactional.
- Inventory updates must be atomic.
- Duplicate requests must be handled safely.
- Payment callbacks must be idempotent.
- Failed operations must not leave inconsistent order or inventory states.
- Backups must be tested through restoration exercises.

### 7.4 Scalability

- Support multiple independent businesses.
- Keep business data isolated.
- Use modular application services.
- Avoid unnecessary coupling between storefronts, inventory, payments, and analytics.
- Allow future integrations without redesigning core entities.

### 7.5 Usability and Accessibility

- Use a responsive, mobile-friendly interface.
- Provide clear validation and error messages.
- Support keyboard navigation for important workflows.
- Use accessible labels, contrast, and focus states.
- Keep common operations simple for non-technical business owners.

---

## 8. Business Rules

### 8.1 Tenant Isolation

Every business-owned resource must belong to a tenant.

A user must never be able to access another tenant's data by changing a URL, request payload, identifier, or client-side state.

### 8.2 Product Variants

- A product may have multiple variants.
- Every sellable variant must have a unique SKU within its tenant.
- Each variant must have its own stock record.
- Variant attributes may include size, color, and other configurable apparel properties.
- Archived products must not be available for new storefront purchases.

### 8.3 Inventory

- Stock must never become negative through normal sales operations.
- All inventory mutations must be recorded.
- Reservations and stock commitments must follow one documented lifecycle.
- Cancellation and returns must not restore stock more than once.
- Restocked returns must pass the applicable inspection or approval step.

### 8.4 Orders

- Order totals must be calculated and validated server-side.
- Orders must preserve purchased item and pricing snapshots.
- Order status and payment status must remain separate.
- An order must have a unique reference.
- Repeated checkout requests must not create unintended duplicate orders.

### 8.5 Payments

- Payment success must be confirmed by a trusted server-side mechanism.
- Payment events must be processed idempotently.
- Refund amounts must be validated against eligible amounts.
- Payment records must remain associated with their original orders.

### 8.6 Data Ownership

Each business must be able to access and export its own business data.

The platform must provide a documented account deletion workflow that respects applicable legal, financial, and security retention obligations.

---

## 9. Core User Journeys

### 9.1 Business Onboarding

1. User registers.
2. User verifies the account where required.
3. User creates a business workspace.
4. User configures brand identity and store details.
5. User adds the first product.
6. User configures product variants and initial stock.
7. User publishes the storefront.
8. User can begin receiving orders.

### 9.2 Online Purchase

1. Customer opens the brand storefront.
2. Customer browses products.
3. Customer selects a size and color.
4. Customer adds the selected variant to the cart.
5. Customer enters delivery details.
6. System validates current price, discount, and inventory.
7. Customer selects an available payment method.
8. System creates the order using transactional inventory rules.
9. Payment is confirmed or recorded according to the selected method.
10. Customer receives an order reference.
11. The business manages fulfillment through its dashboard.

### 9.3 Social Order

1. Customer contacts the brand through Instagram or WhatsApp.
2. Business owner confirms the requested product and variant.
3. Owner creates a manual order.
4. System validates the variant and stock.
5. Customer and channel details are associated with the order.
6. Stock is reserved or committed according to the order lifecycle.
7. Owner updates order and payment statuses as the sale progresses.

### 9.4 Cancellation and Return

1. Authorized user initiates a cancellation or records a return.
2. System validates the order's current state.
3. The appropriate stock release, refund, or inspection workflow is recorded.
4. Stock is restored only when eligible.
5. Order and payment records are updated.
6. Reports reflect the resulting changes.

---

## 10. Success Metrics

Initial targets are hypotheses and should be reviewed during the pilot.

### Activation

- Percentage of registered businesses that complete onboarding.
- Percentage that publish a storefront.
- Time taken to add and publish the first product.

### Commerce

- Successful checkout completion rate.
- Number of active stores receiving orders.
- Percentage of orders successfully processed.
- Checkout failure and duplicate-order rates.

### Operations

- Inventory discrepancy rate.
- Frequency of overselling incidents.
- Time required to record and process an order.
- Percentage of orders with complete channel attribution.

### Retention

- Weekly active business workspaces.
- Percentage of businesses receiving repeat orders.
- Trial-to-paid conversion rate.
- Monthly subscription churn.

### Reliability

- Application availability.
- Checkout error rate.
- Payment reconciliation failures.
- Backup restoration success.

---

## 11. Monetization

The product will use a hybrid subscription model.

Potential structure:

- **Free Plan:** Basic catalog, limited products or orders, and essential business operations.
- **Premium Trial:** Temporary access to selected premium features.
- **Paid Plans:** Different limits for product count, order volume, users, and advanced capabilities.
- **Future Enterprise Plan:** Multi-location operations, advanced integrations, and additional administrative controls.

Exact prices, quotas, trial duration, and feature entitlements must be validated before launch.

Subscription enforcement must happen on the server, not only in the frontend.

---

## 12. MVP Acceptance Criteria

The MVP is ready for pilot release when:

- A business can register and create a workspace.
- Multiple businesses can operate without cross-tenant data access.
- A brand can create products with size/color variants and unique SKUs.
- Stock can be tracked and adjusted with a complete movement history.
- A brand can publish and manage its storefront.
- Customers can complete a test checkout using an enabled payment method.
- Orders are visible to the correct business.
- Concurrent purchase attempts cannot oversell stock.
- Payment failures and repeated callbacks are handled safely.
- Instagram and WhatsApp orders can be recorded manually.
- Cancellations and eligible returns follow the documented inventory rules.
- Basic sales, order, and inventory reports produce consistent results.
- Data export, backup, restoration, monitoring, and security checks are in place.
- Critical user journeys pass end-to-end tests.

---

## 13. Dependencies

The main implementation dependencies are:

1. Architecture and database foundation.
2. Authentication and tenant isolation.
3. Business workspace and settings.
4. Product catalog and variants.
5. Inventory ledger and stock lifecycle.
6. Storefront and product pages.
7. Cart, checkout, and order creation.
8. Payment recording and optional gateway integration.
9. Order fulfillment, cancellations, and returns.
10. Customers and social-order recording.
11. Analytics and exports.
12. Subscription enforcement and SaaS administration.
13. Testing, monitoring, security, and production launch.

Detailed task breakdowns and delivery milestones belong in `Development_Roadmap.md`.

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Overselling | Atomic stock operations, reservations, and concurrency testing |
| Tenant data leakage | Database-level isolation, server-side authorization, and security tests |
| Payment inconsistencies | Verified callbacks, idempotency, and reconciliation |
| Scope expansion | Enforce MVP boundaries and defer advanced modules |
| Social API restrictions | Start with manual social-order recording |
| Inaccurate profitability | Label estimates clearly and include known cost components |
| Poor onboarding | Guided setup and pilot feedback |
| Operational data loss | Automated backups and restoration testing |
| Complex subscriptions | Begin with a small set of configurable plans |

---

## 15. Future Roadmap

### V1.x

- Product CSV import and bulk editing.
- Supplier management and purchase orders.
- Custom domains and additional storefront themes.
- Courier and shipping integrations.
- Improved returns and exchanges.
- Advanced profitability and inventory reports.
- Approved WhatsApp Business integrations.

### V2+

- Multi-location inventory.
- POS and barcode workflows.
- Manufacturing and production management.
- Bills of materials and production costing.
- Marketplace integrations.
- AI-assisted demand forecasting.
- AI business assistant.
- Loyalty and referral programs.
- Advanced marketing automation.

Future development must be guided by customer demand and validated business value.

---

## 16. Related Documentation

This PRD is the product-level source of truth.

Related project documents:

- `MVP_Feature_Scope.md` — Required, optional, and future feature classification.
- `TRD.md` — Technical architecture and implementation decisions.
- `UI_UX_Brief.md` — Visual design and interface requirements.
- `AppFlow.md` — Detailed user journeys and state transitions.
- `DatabaseSchema.md` — Tables, relationships, constraints, and indexes.
- `Development_Roadmap.md` — Implementation phases, tasks, and milestones.
- `README.md` — Project overview, documentation index, and setup instructions.

Changes to the MVP must be reflected consistently across these documents.

---

## 17. Final Product Definition

The product is a multi-tenant, apparel-focused SaaS platform that combines a built-in e-commerce storefront with centralized clothing business operations.

The MVP will focus on:

- Product and apparel variant management.
- Reliable inventory tracking.
- Built-in online selling.
- Unified website and manually recorded social orders.
- Customer management.
- Basic analytics.
- Secure tenant isolation and SaaS administration.

The guiding principle is to deliver a reliable and useful core product first, then expand into advanced integrations, manufacturing, automation, and AI based on real customer needs.
