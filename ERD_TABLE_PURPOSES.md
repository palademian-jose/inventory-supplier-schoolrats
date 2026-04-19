# ERD Table Purposes

This document explains why each table exists in the current inventory supplier system database design.

## `departments`

Purpose:
- Groups users by organizational unit such as Administration, Library, or IT.
- Supports internal reporting and makes it easier to identify which department a user belongs to.

Why it exists:
- The system is used internally, so department grouping is useful for stock issue tracking and user organization.

## `users`

Purpose:
- Stores system users and also acts as the table for people who receive issued stock.
- Holds login information, profile details, department assignment, and account status.

Why it exists:
- Your advisor said a separate recipient table is unnecessary because users already represent the people in the system.
- This keeps authentication and stock-recipient information in one place.

## `categories`

Purpose:
- Classifies items into groups such as Office Supplies, Stationery, or Electronics.

Why it exists:
- Improves item organization.
- Makes filtering, reporting, and normalization easier than storing category text repeatedly in the `items` table.

## `units_of_measure`

Purpose:
- Defines measurement units such as piece, box, pack, or ream.

Why it exists:
- Prevents repeated free-text unit values.
- Keeps item and stock records consistent.

## `suppliers`

Purpose:
- Stores supplier company information including name, contact person, phone, email, and address.

Why it exists:
- Purchase orders and supplier-item mapping both depend on supplier data.
- The system needs a dedicated table for procurement and supplier management.

## `items`

Purpose:
- Stores the main inventory products managed by the system.
- Tracks item identity, category, unit, price, current stock quantity, and reorder level.

Why it exists:
- This is the core inventory table.
- Other tables such as purchase orders, supplier catalog entries, and stock transactions all depend on items.

## `supplier_catalog_items`

Purpose:
- Connects suppliers and items.
- Stores supplier-specific information for an item such as supplier SKU, preferred status, price, and lead time.
- Uses the supplier-item pair itself as the table key.

Why it exists:
- A supplier can provide many items, and an item can potentially come from many suppliers.
- This table resolves that many-to-many relationship and stores procurement details for each supplier-item pair.

## `purchase_orders`

Purpose:
- Represents a purchase event made to a supplier.
- Stores order-level information such as supplier, creator, approver, status, total amount, notes, and dates.

Why it exists:
- Your advisor’s direction suggests the purchase order itself is the main procurement record.
- It captures one order transaction without requiring a separate payments table.

## `purchase_order_lines`

Purpose:
- Stores the individual items included in each purchase order.
- Tracks quantity ordered, quantity received, unit price, and line total.

Why it exists:
- One purchase order can contain multiple items.
- This table provides the detailed breakdown of the order and records the quantities ordered in one transaction, which matches your advisor’s point.

## `stock_transactions`

Purpose:
- Records all stock movement history.
- Tracks incoming stock, issued stock, and adjustments.
- Links each movement to an item and optionally to a supplier catalog pair, unit, user, and reference record.

Why it exists:
- This is the audit trail of inventory movement.
- It connects `items` and `users` for stock issue activity.
- It preserves stock history instead of only storing the latest quantity in the `items` table.

## Design Summary

The design separates the database into three main areas:

- Master data:
  `departments`, `categories`, `units_of_measure`, `suppliers`, `users`, `items`

- Procurement:
  `supplier_catalog_items`, `purchase_orders`, `purchase_order_lines`

- Inventory movement:
  `stock_transactions`

This structure keeps the system normalized, easier to maintain, and closer to the database direction discussed with your advisor.
