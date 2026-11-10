# VAMOS STORE - Database Schema Baseline (18 Entities)

This reference documents the 18 relational tables designed for MySQL 8.0 (`database/schema.sql`) and Microsoft SQL Server (`database/mssql_schema.sql`). Active deployment uses Microsoft SQL Server (`vamos_store_db`).

## 1. Entities Overview

| #   | Table Name               | Purpose                                | Key Relations                          |
| --- | ------------------------ | -------------------------------------- | -------------------------------------- |
| 1   | `users`                  | User accounts (Customer, Admin)        | Auth, Profiles                         |
| 2   | `addresses`              | Customer shipping addresses            | FK -> `users(id)`                      |
| 3   | `password_reset_tokens`  | Secure hashed reset tokens             | FK -> `users(id)`                      |
| 4   | `categories`             | Product hierarchy/categories           | Self-referencing parent                |
| 5   | `brands`                 | Footwear manufacturer brands           | Reference                              |
| 6   | `products`               | Base product definitions               | FK -> `categories`, `brands`           |
| 7   | `product_images`         | Gallery images per product             | FK -> `products(id)`                   |
| 8   | `sizes`                  | Footwear sizes (38 - 45)               | Reference                              |
| 9   | `colors`                 | Color variants                         | Reference                              |
| 10  | `product_variants`       | SKU per product + size + color + stock | FK -> `products`, `sizes`, `colors`    |
| 11  | `inventory_transactions` | Immutable stock audit log              | FK -> `product_variants`, `users`      |
| 12  | `carts`                  | Persistent shopping carts per user     | FK -> `users(id)`                      |
| 13  | `cart_items`             | Items added to shopping cart           | FK -> `carts`, `product_variants`      |
| 14  | `vouchers`               | Discount & promo codes                 | Validation & Limits                    |
| 15  | `banners`                | Homepage visual banners                | Marketing display                      |
| 16  | `orders`                 | Customer purchase orders (COD)         | FK -> `users`, `addresses`, `vouchers` |
| 17  | `order_items`            | Snapshot items in each order           | FK -> `orders`, `product_variants`     |
| 18  | `order_status_histories` | Order state transition audit log       | FK -> `orders`, `users`                |

## 2. Invariants & Calculation Rules

- **Financial Integrity**:
  - `line_total = unit_price * quantity`
  - `total_amount = subtotal - discount_amount + shipping_fee`
  - All financial calculations MUST be performed on the backend server.
- **Stock Integrity**:
  - `stock_quantity >= 0` enforced via MySQL 8 `CHECK` constraint.
  - Every stock modification MUST generate an `inventory_transactions` entry with:
    - `change_quantity = new_quantity - old_quantity`
    - `reference_type` (`ORDER`, `IMPORT`, `RETURN`, `ADJUSTMENT`)
- **Address & Image Uniqueness**:
  - Maximum 1 `is_default = 1` address per customer.
  - Maximum 1 `is_primary = 1` image per product.
- **Payment & Order**:
  - Method: `COD` only.
  - Initial payment status: `UNPAID`.
  - Initial order status: `PENDING`.
  - **Cart Constraint**: Carts exist strictly for authenticated `Customer` accounts (`carts.user_id`). `Guest` cannot maintain carts.
  - **Inventory Deduction**: Stock is deducted immediately upon successful COD order creation (using `SELECT ... FOR UPDATE` inside a database transaction).
  - **Cancellation Rule**: Customers can cancel orders **ONLY when `order_status = 'PENDING'`**. Cancellation automatically restores stock and logs an `inventory_transactions` record.
