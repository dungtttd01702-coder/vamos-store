---
name: vamos-store-engineering
description: Use when developing, reviewing, debugging, designing, testing, or documenting the VAMOS STORE shoe ecommerce project. Covers requirements, UML, ERD, Node.js, Express, Pug, Tailwind CSS, MySQL 8, Docker, security, and software quality.
---

# VAMOS STORE ENGINEERING SKILL

## 1. PURPOSE

This skill provides project-specific engineering rules for VAMOS STORE.

The agent must work as a careful software architect and full-stack developer.

Priorities:

1. Correctness.
2. Consistency with approved requirements.
3. Maintainable architecture.
4. Data integrity.
5. Security.
6. Testability.
7. Clear documentation.
8. Minimal unnecessary changes.

## 2. WHEN TO USE THIS SKILL

Use this skill when working on:

- VAMOS STORE requirements and specifications.
- Software Requirement Specification (SRS).
- Use Case Diagram and Use Case descriptions.
- Activity Diagram.
- Sequence Diagram.
- Class Diagram.
- Entity Relationship Diagram (ERD).
- MySQL database design and SQL scripts.
- Node.js and Express development.
- Pug templates.
- Tailwind CSS.
- Authentication and authorization.
- Product catalog, variants, cart and checkout.
- COD orders and order management.
- Admin dashboard.
- Testing, debugging and code review.
- Technical documentation and school reports.

Do not use this skill for unrelated projects unless the user explicitly asks.

## 3. PROJECT BASELINE

Project name: VAMOS STORE.

Project type: Online shoe store.

### Technology stack

- Node.js
- Express.js
- Pug
- Tailwind CSS
- MySQL 8
- Docker and Docker Compose
- Layered MVC architecture

Do not replace the approved stack without explicit permission.

Do not introduce React, Vue, Angular, MongoDB, PostgreSQL or another framework/database without user approval.

### Main actors

- Guest
- Customer
- Admin

Do not introduce Staff, Manager or additional roles unless the user approves.

### Payment method

- Cash on Delivery (COD) only.

Do not add online payment gateways or payment integrations without explicit approval.

### Reference website

Biti's is used only as a reference for ecommerce layout, navigation, product presentation and user experience.

Never copy Biti's branding, logo, proprietary text, images or identity into VAMOS STORE.

## 4. APPROVED FUNCTIONAL SCOPE

The project may include the following functions, subject to the latest approved requirements:

### Guest

- View homepage.
- Browse products.
- View product details.
- Search products.
- Filter and sort products.
- Register.
- Log in.

### Customer

- Manage personal profile.
- Manage delivery addresses.
- Add products to cart.
- Update cart quantities.
- Remove cart items.
- Apply eligible vouchers.
- Create COD orders.
- View order history.
- Track order status.
- Cancel orders when business rules permit.

### Admin

- Manage products.
- Manage categories.
- Manage brands.
- Manage product variants.
- Manage inventory.
- Manage orders.
- Manage vouchers.
- Manage banners and homepage content if approved.
- View reports and statistics.

Do not assume every function is approved merely because it appears in this list. Check the latest SRS and user decisions.

## 5. FEATURES THAT MUST NOT BE ADDED AUTOMATICALLY

Do not add the following without explicit approval:

- Online payment.
- Product reviews and ratings.
- Wishlist.
- Loyalty points.
- Live chat.
- AI chatbot.
- Multiple store branches.
- Complex warehouse management.
- Shipping company API integration.
- Social login.
- Email verification.
- Additional user roles.

If a feature seems necessary, explain why and ask for approval before expanding the scope.

## 6. WORKING PRINCIPLES

Before editing any file:

1. Inspect the current project structure.
2. Read relevant source files.
3. Understand existing architecture.
4. Identify dependencies and relationships.
5. Determine the smallest safe change.
6. Preserve existing user work.

Never assume the codebase is empty.

Never rewrite an entire module when a small targeted fix is sufficient.

Follow existing naming conventions unless they are clearly inconsistent.

Do not duplicate business logic across routes, controllers and database layers.

Separate responsibilities between:

- Routes.
- Controllers.
- Services.
- Models or repositories.
- Middleware.
- Views.
- Configuration.
- Utilities.

Keep business logic out of Pug templates.

Validate user input on the server, even when frontend validation exists.

## 7. REQUIREMENTS AND UML

All diagrams must reflect the approved business requirements.

### Use Case Diagram

Rules:

- Use the correct actors.
- Ensure actor associations are meaningful.
- Use `<<include>>` only for mandatory reusable behavior.
- Use `<<extend>>` only for optional or conditional behavior.
- Use actor generalization only when the specialized actor inherits the parent actor's behavior.
- Do not add unnecessary relationships.
- Ensure all Use Case IDs are unique.
- Ensure the number of Use Cases matches the catalog.
- Ensure the diagram and Use Case descriptions are consistent.

### Activity Diagram

Rules:

- Show the correct starting point.
- Show decisions and alternative flows.
- Show successful and unsuccessful paths.
- Include validation where appropriate.
- Avoid unnecessary activities.
- Ensure the final flow matches the actual business process.

### Sequence Diagram

Rules:

- Show interactions in the correct order.
- Use meaningful participants.
- Separate user interface, controller, service and database responsibilities.
- Include alternative flows when important.
- Ensure the sequence matches the implementation architecture.

### ERD

Rules:

- Every entity must have a clear purpose.
- Every relationship must have correct cardinality.
- Define primary keys and foreign keys.
- Define nullability and uniqueness.
- Define defaults and deletion behavior.
- Avoid unnecessary entities and duplicate data.
- Preserve historical transaction information.

### PlantUML

When generating PlantUML:

- Use valid syntax.
- Keep names consistent.
- Avoid unnecessary complexity.
- Validate the diagram when a PlantUML renderer is available.
- Do not claim that a diagram was validated unless it was actually rendered or checked.

## 8. DATABASE BASELINE

The current ERD baseline contains 18 entities:

1. users
2. addresses
3. password_reset_tokens
4. categories
5. brands
6. products
7. product_images
8. sizes
9. colors
10. product_variants
11. inventory_transactions
12. carts
13. cart_items
14. vouchers
15. banners
16. orders
17. order_items
18. order_status_histories

This is a baseline, not permission to add or remove entities without reviewing the requirements.

### Database design rules

For every table, inspect:

- Primary key.
- Foreign keys.
- Unique constraints.
- Nullability.
- Default values.
- Data types.
- Indexes.
- Relationships.
- Delete and update behavior.

Use appropriate indexes for frequently queried columns.

Use transactions for operations that update multiple related records.

Avoid deleting records referenced by historical orders.

Use soft deletion or inactive status when appropriate.

### Data integrity

Enforce these business invariants:

- Product stock cannot be negative.
- Cart quantity must be positive.
- Order item quantity must be positive.
- Prices must not be negative.
- Inventory changes must be auditable.
- Order item prices must preserve the price at purchase time.

Expected calculations:

`line_total = unit_price * quantity`

`total_amount = subtotal - discount_amount + shipping_fee`

Do not rely only on frontend calculations.

Recalculate important financial values on the server.

### Special constraints

- Store password reset token hashes, not raw tokens.
- A user should have at most one default address.
- A product should have at most one primary image.
- Inventory transactions must record old quantity, new quantity and change quantity.
- `change_quantity = new_quantity - old_quantity`.
- Define explicit foreign key deletion behavior.
- Use MySQL 8 compatible syntax.
- Remember that enforced CHECK constraints require MySQL 8.0.16 or newer.
- Use `CURRENT_TIMESTAMP` for timestamp defaults where appropriate.

For voucher usage limits, do not assume that zero means unlimited unless the business rule explicitly confirms it.

If zero means unlimited, the constraint must allow it explicitly, for example:

`usage_limit = 0 OR used_count <= usage_limit`

## 9. BUSINESS RULES THAT REQUIRE CONFIRMATION

### 9.1 Confirmed Project Business Rules (Approved by User)

1. **Guest Cart Access:**
   - Guests **CANNOT** add products to cart or use a temporary session cart.
   - Adding products to cart requires authentication as a `Customer`. Guests attempting to add to cart must be prompted or redirected to log in.

2. **Inventory Deduction Timing:**
   - Inventory is deducted **immediately upon successful creation of a COD order**.
   - Must be executed inside an ACID transaction using pessimistic locking (`SELECT ... FOR UPDATE` on `product_variants`).
   - Every deduction must record an `inventory_transactions` record (`EXPORT`, `ORDER`).

3. **Order Cancellation by Customer:**
   - Customers are permitted to cancel orders **ONLY when the order status is `PENDING`**.
   - Once the order moves beyond `PENDING` (`CONFIRMED`, `PROCESSING`, `SHIPPING`, `COMPLETED`), customers cannot cancel.
   - When an order is cancelled, deducted inventory must be restored automatically in a transaction, and recorded in `inventory_transactions` (`IMPORT`, `CANCELLED_ORDER`).

### 9.2 Other Business Rules (Require Confirmation if Needed)

Never guess the following unresolved rules without checking:

1. Can Admin lock and unlock customer accounts?
2. Can Admin manage homepage banners?
3. Does voucher usage_limit = 0 mean unlimited?
4. How is shipping fee calculated?
5. Is email verification required?
6. Can a draft product exist without variants?
7. Can an order be edited after creation?

If information is missing:

- Identify the unresolved rule.
- Explain the impact.
- Present a reasonable recommendation.
- Ask for confirmation when it affects implementation or data structure.

Do not silently choose a rule.

## 10. COD AND ORDER MANAGEMENT

COD means payment is collected when the order is delivered.

When a customer creates a COD order:

- Payment method is COD.
- Initial payment status should be UNPAID.
- Do not mark the order PAID immediately.
- Mark it PAID only when payment has actually been received.

Use wording such as:

- "Chọn phương thức thanh toán COD"
- "Đặt hàng"
- "Đơn hàng đã được tạo"

Do not display "Thanh toán thành công" immediately after creating a COD order.

A possible order lifecycle is:

`NEW → PROCESSING → SHIPPING → COMPLETED`

Alternative:

`CANCELLED`

However, the exact transitions, cancellation permissions and inventory effects must follow approved business rules.

## 11. SECURITY BASELINE

Always consider:

### Authentication

- Hash passwords using a suitable password hashing algorithm.
- Never store plaintext passwords.
- Use secure session configuration.
- Regenerate sessions after authentication where appropriate.
- Protect password reset workflows.

### Authorization

- Apply role-based access control.
- Check permissions on the server.
- Never rely only on hiding frontend buttons.
- Prevent Guest and Customer access to Admin routes.

### Input and output security

- Validate all server-side inputs.
- Use parameterized SQL queries.
- Prevent SQL injection.
- Escape untrusted output to prevent XSS.
- Apply CSRF protection to state-changing requests where applicable.
- Apply rate limits to sensitive endpoints.

### File uploads

- Validate file type and size.
- Do not trust file extensions alone.
- Generate safe filenames.
- Prevent executable uploads.
- Store uploads safely.

### Secrets

- Store credentials in environment variables.
- Never commit real database passwords, API keys or session secrets.
- Provide `.env.example` without real secrets.

## 12. IMPLEMENTATION WORKFLOW

Follow this workflow for substantial tasks:

### Step 1: Understand

Read the relevant requirements, source files and existing implementation.

### Step 2: Analyze

Identify affected modules, dependencies and risks.

### Step 3: Plan

Create a concise implementation plan.

### Step 4: Implement

Make targeted changes following the current architecture.

### Step 5: Validate

Check syntax, imports, database queries, routes, permissions and business rules.

### Step 6: Test

Run relevant tests where possible.

### Step 7: Review

Inspect the final changes for regressions and inconsistencies.

### Step 8: Report

List actual changes, files and test results.

Do not skip validation for database or authentication changes.

## 13. TESTING AND QUALITY ASSURANCE

Test relevant scenarios:

- Successful workflows.
- Invalid inputs.
- Missing required fields.
- Boundary values.
- Unauthorized access.
- Invalid user roles.
- Duplicate submissions.
- Database errors.
- Transaction rollback.
- Inventory conflicts.
- Order status transitions.
- Voucher limits.
- Cart and checkout consistency.

Do not fabricate test results.

Use these statuses accurately:

- PASS: Test executed and expected behavior confirmed.
- FAIL: Test executed and actual behavior differs from expectation.
- BLOCKED: Test cannot be completed because of an external dependency or missing condition.
- NOT RUN: Test has not been executed.

When reporting bugs, include:

- Bug ID.
- Title.
- Environment.
- Preconditions.
- Steps to reproduce.
- Expected result.
- Actual result.
- Severity.
- Priority.
- Evidence when available.

## 14. DOCUMENTATION AND SCHOOL REPORTS

When preparing project documentation:

- Follow the user's provided template.
- Follow the lecturer's requirements.
- Use clear, natural Vietnamese.
- Avoid unnecessary academic jargon.
- Maintain consistent terminology.
- Ensure diagrams match the written descriptions.
- Ensure tables and IDs are consistent.
- Do not invent implementation or testing results.
- Do not add unrelated sections.

For school assignments, prioritize complete, accurate and easy-to-understand content.

## 15. ANTIGRAVITY EXECUTION SAFETY

Before running commands:

- Inspect the command.
- Understand its purpose.
- Check whether it modifies files or data.
- Avoid unknown scripts.
- Prefer non-destructive inspection commands first.

Never perform these actions without explaining the impact and obtaining user approval:

- Delete databases.
- Drop tables.
- Reset production data.
- Delete project directories.
- Overwrite major project files.
- Remove dependencies.
- Perform destructive migrations.
- Deploy to production.
- Publish secrets or credentials.

Preserve existing user changes.

If a task could damage data, stop and ask for confirmation.

## 16. COMPLETION REPORT FORMAT

At the end of each substantial task, report:

### Completed

List what was actually completed.

### Files changed

List the exact files created or modified.

### Validation

List the commands or checks actually performed and their results.

### Remaining issues

List unresolved problems or decisions.

### User confirmation required

List only decisions that genuinely require approval.

### Run instructions

Provide exact commands when relevant.

Never claim completion for an action that was not performed.

