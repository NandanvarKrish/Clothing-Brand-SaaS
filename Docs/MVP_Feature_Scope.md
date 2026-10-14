
# MVP Feature Scope — Clothing Brand SaaS

> **Document Status:** Proposed  
> **Product:** Clothing Brand SaaS  
> **Version:** 1.0  
> **Purpose:** Define exactly what will and will not be included in the Minimum Viable Product (MVP).

---

## 1. MVP Overview

The MVP is a multi-tenant SaaS platform that enables clothing brands, boutiques, D2C businesses, and social sellers to manage products, clothing variants, inventory, orders, and sales through a unified dashboard.

Each business will also be able to operate a built-in online storefront.

The primary objective is to help small apparel businesses manage their online and offline/social selling operations without relying on multiple disconnected tools.

### Primary Goals

- Simplify apparel product and variant management.
- Maintain accurate inventory across sales channels.
- Provide a built-in storefront for online sales.
- Centralize orders from the storefront and manual social selling.
- Give business owners visibility into sales and inventory.
- Establish a foundation for subscription-based SaaS revenue.
- Validate the product with real businesses before expanding scope.

---

## 2. Target Users

### Primary Customers

1. **Small clothing brands:** Businesses selling their own apparel collections.
2. **Boutiques:** Stores selling clothing in multiple sizes, colors, and styles.
3. **D2C sellers:** Brands selling directly to customers online.
4. **Instagram sellers:** Businesses taking orders through Instagram.
5. **WhatsApp sellers:** Businesses receiving orders through WhatsApp conversations.
6. **Small apparel retailers:** Businesses that need basic catalog, inventory, and order management.

### Initial User Roles

| Role | Permissions |
|---|---|
| Business Owner | Full access to the business workspace and settings |
| Staff Member | Access to authorized operational features |
| Platform Administrator | Platform-level support and administration with controlled access |

Role permissions must be enforced on the server, not merely hidden in the user interface.

---

## 3. MVP Feature Priorities

| Priority | Meaning |
|---|---|
| P0 — Critical | Essential for secure core functionality |
| P1 — Required | Necessary for a complete MVP experience |
| P2 — Optional | Include only if time and resources permit |
| P3 — Post-MVP | Excluded from the initial release |

P0 and P1 define the intended MVP. P2 requires explicit scope approval before implementation.

---

## 4. Authentication and Business Workspaces

**Priority:** P0

### Included Features

- User registration.
- User login and logout.
- Password recovery where supported.
- Business workspace creation.
- Business profile setup.
- Workspace membership.
- Owner and staff roles.
- Secure session handling.
- Server-side authorization.
- Tenant-level data isolation.
- Basic account settings.

### Acceptance Criteria

- A user can register and create a business workspace.
- Authorized users can access their assigned workspace.
- Users cannot read or modify another business's private records.
- Protected operations reject unauthorized requests.

### Excluded Features

- Social login providers unless specifically approved.
- Enterprise single sign-on.
- Advanced permission customization.
- Complex organization hierarchies.

---

## 5. Dashboard and Business Settings

**Priority:** P1

### Included Features

- Responsive dashboard.
- Business name and logo.
- Business contact details.
- Business address.
- Navigation for products, inventory, orders, customers, reports, and settings.
- Summary cards for sales, orders, and inventory.
- Low-stock indicators.
- Onboarding guidance.
- Loading, empty, and error states.

### Acceptance Criteria

- Business owners can configure basic business details.
- Dashboard metrics are calculated from authorized business data.
- New businesses see useful onboarding and empty states.

### Excluded Features

- Highly customizable dashboard layouts.
- Advanced analytics dashboards.
- Multiple branch dashboards.
- Employee performance analytics.

---

## 6. Product Catalog

**Priority:** P0

### Included Features

- Create, view, edit, and archive products.
- Product name and description.
- Product images.
- Selling price.
- Product status.
- Categories.
- Collections.
- Search, filtering, sorting, and pagination.
- Apparel-specific product variants.
- Variant-level SKU identifiers.
- Size and color attributes.
- Variant-level pricing where required.
- Variant availability status.

### Apparel Variant Example

A product named "Classic Cotton T-Shirt" may have the following variants:

| SKU | Size | Color |
|---|---|---|
| CCT-S-BLK | S | Black |
| CCT-M-BLK | M | Black |
| CCT-L-BLK | L | Black |
| CCT-M-WHT | M | White |

Each variant must be identifiable independently for inventory and order processing.

### Acceptance Criteria

- A business can create a product with multiple size and color combinations.
- Each variant has a unique identifier within the appropriate business scope.
- Product and variant information is validated on the server.
- Archived products cannot be purchased through the storefront.

### Excluded Features

- AI-generated product descriptions.
- AI-generated product photography.
- Advanced product personalization.
- Manufacturing and bill-of-materials management.
- Automated marketplace catalog synchronization.

---

## 7. Inventory Management

**Priority:** P0

### Included Features

- Inventory tracking per product variant.
- Opening-stock entry.
- Manual stock adjustments.
- Stock movement history.
- Low-stock thresholds.
- Low-stock indicators and alerts.
- Available-stock display.
- Reservation and release rules where checkout requires them.
- Stock deduction at the defined order-confirmation stage.
- Eligible cancellation and return restocking.
- Protection against negative stock by default.
- Inventory consistency across storefront and manually entered orders.

### Core Inventory Rules

- Inventory belongs to a specific business and variant.
- Every stock-changing operation must follow a controlled server-side workflow.
- Inventory movements must record the reason and quantity change.
- Concurrent orders must not silently oversell a variant.
- Repeated requests must not cause duplicate deductions.
- Cancellation and return workflows must not restore stock twice.
- Stock reservation, deduction, release, and restocking must follow documented order-state rules.

### Acceptance Criteria

- The owner can see stock for every variant.
- Stock adjustments produce a corresponding inventory history entry.
- Low-stock conditions are detectable.
- Concurrent checkout requests cannot silently oversell the same stock.
- Failed order or payment operations do not leave inconsistent inventory.

### Excluded Features

- Multi-warehouse management.
- Warehouse transfers.
- Barcode scanning.
- Advanced purchase forecasting.
- Supplier procurement automation.
- Manufacturing inventory.
- AI-based replenishment recommendations.

---

## 8. Customer-Facing Online Storefront

**Priority:** P0

### Included Features

- Public storefront for each business.
- Responsive storefront layouts.
- Homepage with product highlights.
- Product listing pages.
- Product detail pages.
- Category and collection browsing.
- Product images and pricing.
- Size and color selection.
- Variant availability display.
- Shopping cart.
- Server-side price and stock validation.
- Basic search-engine metadata.
- Basic business branding.
- Storefront isolation between businesses.

### Customer Journey

1. Open a business storefront.
2. Browse products.
3. Select a size and color.
4. Add the selected variant to the cart.
5. Review cart items.
6. Enter checkout information.
7. Place the order using an available payment method.
8. Receive an order confirmation.

### Acceptance Criteria

- Customers can browse published products.
- Customers cannot purchase invalid or unavailable variants.
- Prices and totals are recalculated on the server.
- A customer cannot access another business's private dashboard or data.

### Excluded Features

- Drag-and-drop website builder.
- Advanced theme marketplace.
- Custom domain management unless approved for the initial release.
- Native iOS or Android shopping applications.
- Marketplace synchronization.
- Customer loyalty programs.
- Advanced personalization and recommendations.

---

## 9. Cart, Checkout, and Payments

**Priority:** P0 for reliable order creation; payment options require approval.

### Included Features

- Cart item management.
- Variant and quantity validation.
- Customer contact details.
- Shipping address collection where required.
- Server-side total calculation.
- Order creation.
- Separate order and payment states.
- Order confirmation.
- Duplicate-request protection.
- Secure payment-event verification for online payments.
- Payment failure handling.
- Defined stock reservation and release rules.

### Payment Scope

The exact initial payment configuration remains undecided.

Possible MVP approaches:

- **Option A:** Cash on Delivery only.
- **Option B:** One online payment gateway.
- **Option C:** Cash on Delivery plus one online payment gateway.

The payment option must be selected before checkout implementation is finalized.

### Acceptance Criteria

- The server validates prices, stock, and discounts before order creation.
- Browser-side payment success is not treated as proof of payment.
- Online payment notifications are verified before changing payment status.
- Repeated requests do not create duplicate orders or payment records.
- Failed or abandoned checkout follows the documented stock-release rules.

### Excluded Features

- Multiple payment gateways.
- International payment orchestration.
- Buy-now-pay-later integrations.
- Advanced installment payments.
- Complex split payments.

---

## 10. Order Management

**Priority:** P0

### Included Features

- Order list and detail pages.
- Order creation from storefront checkout.
- Order status tracking.
- Separate payment status tracking.
- Customer and address snapshots.
- Product and variant snapshots.
- Historical item prices.
- Order status history.
- Fulfillment status.
- Cancellation workflows.
- Basic return and restocking workflows.
- Order search and filtering.
- Audit history for sensitive operations.

### Acceptance Criteria

- Businesses can view and manage their orders.
- Historical order details remain accurate after catalog changes.
- Invalid status transitions are rejected.
- Cancellations and returns follow inventory rules.
- Payment and order statuses cannot be incorrectly conflated.

### Excluded Features

- Advanced exchange workflows.
- Automated courier allocation.
- Complex split shipments.
- International fulfillment.
- Multi-warehouse fulfillment.

---

## 11. Manual Social Orders and Sales Channels

**Priority:** P1

### Included Features

- Create orders manually from the dashboard.
- Record the customer and purchased variants.
- Record the order's source channel.
- Support storefront, Instagram, WhatsApp, and other approved labels.
- Validate stock before confirming the order.
- Reuse the same order and inventory services used by storefront orders.
- Include manual orders in appropriate reports.

### Acceptance Criteria

- A business can record an order received through a social channel.
- Manual orders cannot bypass server-side price or inventory rules.
- Sales-channel attribution is stored and reportable.

### Excluded Features

- Automated Instagram DM ingestion.
- Unofficial WhatsApp automation.
- Automated social-media checkout synchronization.
- Marketplace order synchronization.
- Automatic social conversation management.

---

## 12. Discounts and Coupons

**Priority:** P1

### Included Features

- Create and edit basic coupons.
- Fixed-value discounts.
- Percentage discounts.
- Start and end dates.
- Minimum order value where required.
- Basic usage limits.
- Coupon validation during checkout.
- Store the applied discount on the order.
- Prevent unauthorized or duplicate redemption.

### Acceptance Criteria

- Invalid or expired coupons are rejected.
- Discounts are calculated on the server.
- Discounts cannot exceed permitted order totals.
- Reports use the actual discount recorded for each order.

### Excluded Features

- Complex stacking rules.
- Advanced loyalty points.
- Referral rewards.
- Personalized AI promotions.
- Multi-stage marketing campaigns.

---

## 13. Customer Management

**Priority:** P1

### Included Features

- Customer records.
- Contact information.
- Customer addresses.
- Order history.
- Basic customer search.
- Customer details associated with orders.
- Appropriate access controls for customer information.

### Acceptance Criteria

- Authorized business users can view their customers.
- Customer records remain isolated by tenant.
- Customer order history reflects the correct business.
- Sensitive customer data is not exposed to unauthorized users.

### Excluded Features

- Advanced CRM pipelines.
- Automated marketing segmentation.
- Customer loyalty programs.
- AI customer lifetime-value predictions.

---

## 14. Reports and CSV Exports

**Priority:** P1

### Included Features

- Sales summary.
- Order counts and statuses.
- Product and variant performance.
- Inventory summary.
- Low-stock reporting.
- Date-range filters.
- Sales-channel filters where applicable.
- CSV export.
- Tenant-scoped reporting.

### Acceptance Criteria

- Report values match the underlying records and documented business rules.
- Cancelled and refunded orders are handled consistently.
- CSV exports contain only authorized business data.
- Large exports are handled safely within the system's practical limits.

### Excluded Features

- Full accounting software.
- GST return filing.
- Advanced financial forecasting.
- Complex tax-compliance automation.
- Custom business intelligence dashboards.

Tax calculations, invoices, and statutory requirements must be clarified before claiming compliance with any applicable jurisdiction.

---

## 15. SaaS Plans and Subscriptions

**Priority:** P1 for a paid SaaS launch; implementation scope requires approval.

### Business Model

The intended business model is a hybrid subscription structure:

- Free plan.
- Free trial of premium features.
- Multiple paid tiers based on business size, branches, employees, or advanced features.

Exact pricing and plan limits remain undecided.

### Included Features

- Plan definitions.
- Subscription status.
- Free-plan access.
- Premium trial eligibility and duration.
- Subscription settings page.
- Server-side plan-limit enforcement.
- Trial expiration handling.
- Upgrade and downgrade workflows.
- Subscription cancellation.
- Payment and renewal status handling if a billing provider is integrated.

### Acceptance Criteria

- Restricted features are enforced server-side.
- Expired trials follow documented access rules.
- Subscription changes do not delete business data.
- Billing-provider notifications are verified where applicable.

### Excluded Features

- Complex enterprise contracts.
- Usage-based billing infrastructure.
- Affiliate commissions.
- Multiple billing-provider integrations.
- Advanced revenue analytics.

---

## 16. Security, Reliability, and Operations

**Priority:** P0

### Included Features

- Secure authentication and authorization.
- Tenant-level data isolation.
- Server-side validation.
- Secure handling of secrets.
- Controlled file uploads.
- Database access policies.
- Protection against duplicate order operations.
- Payment webhook verification where applicable.
- Audit logging for sensitive actions.
- Application error logging.
- Database backup and restoration procedures.
- Basic monitoring.
- Data export and deletion workflows.
- Production and staging environment separation.

### Acceptance Criteria

- Cross-tenant access is denied.
- Sensitive operations are validated and authorized on the server.
- Critical database operations preserve consistency.
- Backups can be restored using a tested procedure.
- Production credentials are not exposed to the browser or source repository.

---

## 17. Features Explicitly Excluded from the MVP

The following features are out of scope for the initial release unless separately approved.

- Native Android and iOS applications.
- Multi-warehouse inventory.
- Warehouse transfers.
- POS and barcode scanning.
- Marketplace integrations.
- Manufacturing and production planning.
- Full accounting and GST filing.
- AI demand forecasting.
- AI-powered business assistant.
- Automated Instagram messaging.
- Unofficial WhatsApp automation.
- Loyalty and referral programs.
- Advanced marketing automation.
- Drag-and-drop storefront builder.
- Advanced shipping automation.
- Enterprise access-management features.

---

## 18. MVP Acceptance Checklist

The MVP can be considered ready for pilot release when the following critical workflows pass.

### Business Setup

- [ ] A user can register and create a workspace.
- [ ] A business owner can configure business details.
- [ ] Tenant isolation has been tested.

### Catalog and Inventory

- [ ] A business can create a product with size and color variants.
- [ ] Each variant has a unique SKU within its business.
- [ ] Stock can be added and adjusted.
- [ ] Inventory movements are recorded.
- [ ] Concurrent purchase attempts cannot silently oversell stock.

### Storefront and Checkout

- [ ] Customers can browse published products.
- [ ] Customers can select a valid variant and add it to the cart.
- [ ] The server validates stock and prices.
- [ ] Orders are created without duplicate processing.
- [ ] The approved payment method works correctly.

### Order Operations

- [ ] Businesses can view and manage orders.
- [ ] Historical order item details are preserved.
- [ ] Cancellation and restocking rules work.
- [ ] Manual social orders use the same inventory rules.

### Reporting and SaaS

- [ ] Sales and inventory reports are accurate.
- [ ] CSV exports are tenant-scoped.
- [ ] Subscription and plan restrictions work if included in launch scope.

### Production Readiness

- [ ] Authorization and security tests pass.
- [ ] Critical user journeys pass.
- [ ] Backup and restoration have been tested.
- [ ] Errors are monitored.
- [ ] Production environment and secrets are configured securely.

---

## 19. Decisions Pending Approval

These decisions must be resolved before the related implementation is finalized.

| Decision | Current Status |
|---|---|
| Final technology stack | Proposed; approval required |
| Brand name | Pending |
| Payment method | COD, one gateway, or both |
| Currency and tax requirements | Pending |
| Subscription pricing | Pending validation |
| Plan limits | Pending |
| Billing provider | Pending |
| Deployment platform | Pending |
| Custom domains in initial release | Pending |
| Exact MVP launch scope for subscriptions | Pending |
| Initial storefront customization options | Pending |

---

## 20. Scope Change Policy

Any feature not explicitly included in this document must be treated as out of scope until reviewed.

Before adding a feature:

1. Identify the customer problem it solves.
2. Determine whether it is essential to the MVP.
3. Estimate its development and maintenance cost.
4. Identify changes required to the database, architecture, and UI.
5. Assess security and operational implications.
6. Obtain approval before changing the scope or technology stack.
7. Update the PRD, TRD, database schema, and roadmap where necessary.

---

## Final Definition

The MVP is a secure, multi-tenant apparel commerce platform that combines product and variant management, inventory control, order management, a built-in storefront, basic reporting, and an approved checkout method.

Its purpose is to validate the core product with real clothing businesses before investing in advanced integrations, mobile applications, AI features, and enterprise capabilities.

**End of MVP Feature Scope**
