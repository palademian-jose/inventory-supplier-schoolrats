import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute, getConnection } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const updatePOSchema = z.object({
  supplier_id: z.coerce.number().int("Supplier is required"),
  status: z.enum(["Pending", "Approved"], { message: "Invalid status" }),
  expected_delivery_date: z.string().nullish().transform((value) => value ?? ""),
  notes: z.string().nullish().transform((value) => value ?? ""),
  items: z.array(z.object({
    item_id: z.coerce.number().int("Item is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be greater than zero"),
    unit_price: z.coerce.number().min(0, "Unit price must be zero or greater"),
  })).min(1, "At least one item is required"),
});

type RouteParams = { params: Promise<{ id: string }> };

async function ensureSupplierCatalogPairsExist(
  connection: import("mysql2/promise").PoolConnection,
  supplierId: number,
  itemIds: number[]
) {
  const uniqueItemIds = [...new Set(itemIds.map(Number))];
  if (!uniqueItemIds.length) return;

  const placeholders = uniqueItemIds.map(() => "?").join(", ");
  const catalogRows = await query<{ item_id: number }>(
    `SELECT item_id FROM supplier_catalog_items WHERE supplier_id = ? AND item_id IN (${placeholders})`,
    [supplierId, ...uniqueItemIds],
    connection
  );

  const availableItemIds = new Set(catalogRows.map((row) => Number(row.item_id)));
  const missingItemIds = uniqueItemIds.filter((itemId) => !availableItemIds.has(itemId));

  if (missingItemIds.length) {
    throw new ApiError(400, `Supplier ${supplierId} is not linked to item(s): ${missingItemIds.join(", ")}`);
  }
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;

    const orderRows = await query(
      `SELECT po.*, s.name AS supplier_name, cu.full_name AS created_by_name, au.full_name AS approved_by_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       LEFT JOIN users cu ON cu.id = po.created_by
       LEFT JOIN users au ON au.id = po.approved_by
       WHERE po.id = ?`,
      [id]
    );

    const detailRows = await query(
      `SELECT pol.*, i.name AS item_name, c.name AS item_category, u.symbol AS unit_symbol
       FROM purchase_order_lines pol
       JOIN items i ON i.id = pol.item_id
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       WHERE pol.purchase_order_id = ?`,
      [id]
    );

    return jsonResponse({ ...orderRows[0], details: detailRows });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const parsed = updatePOSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const currentRows = await query<{ status: string }>(
      "SELECT status FROM purchase_orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (!currentRows.length) {
      throw new ApiError(404, "Purchase order not found");
    }

    if (currentRows[0].status === "Received") {
      throw new ApiError(400, "Received purchase orders cannot be edited");
    }

    const { supplier_id, status, items, notes, expected_delivery_date } = parsed.data;
    const connection = await getConnection();

    try {
      await connection.beginTransaction();
      await ensureSupplierCatalogPairsExist(connection, supplier_id, items.map((item) => item.item_id));

      const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const approvedAt = status === "Approved" ? new Date() : null;
      const approvedBy = status === "Approved" ? user.id : null;

      await connection.execute(
        `UPDATE purchase_orders
         SET supplier_id = ?, status = ?, total_amount = ?, notes = ?, expected_delivery_date = ?,
             approved_at = ?, approved_by = ?, received_at = NULL
         WHERE id = ?`,
        [
          supplier_id,
          status,
          totalAmount,
          notes,
          expected_delivery_date || null,
          approvedAt,
          approvedBy,
          id,
        ]
      );

      await connection.execute("DELETE FROM purchase_order_lines WHERE purchase_order_id = ?", [id]);

      for (const item of items) {
        const lineTotal = item.quantity * item.unit_price;
        await connection.execute(
          `INSERT INTO purchase_order_lines (
             purchase_order_id, item_id, quantity, received_quantity, unit_price, line_total
           )
           VALUES (?, ?, ?, 0, ?, ?)`,
          [id, item.item_id, item.quantity, item.unit_price, lineTotal]
        );
      }

      await connection.commit();
      return jsonResponse({ id: Number(id), total_amount: totalAmount });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { id } = await params;

    const currentRows = await query<{ status: string }>(
      "SELECT status FROM purchase_orders WHERE id = ? LIMIT 1",
      [id]
    );

    if (!currentRows.length) {
      throw new ApiError(404, "Purchase order not found");
    }

    if (currentRows[0].status === "Received") {
      throw new ApiError(400, "Received purchase orders cannot be deleted");
    }

    await execute("DELETE FROM purchase_orders WHERE id = ?", [id]);
    return jsonResponse({ message: "Purchase order deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
