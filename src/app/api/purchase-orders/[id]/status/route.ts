import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, getConnection } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const statusSchema = z.object({
  status: z.enum(["Pending", "Approved", "Received"], { message: "Invalid status" }),
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
  const missingItemIds = uniqueItemIds.filter((id) => !availableItemIds.has(id));

  if (missingItemIds.length) {
    throw new ApiError(400, `Supplier ${supplierId} is not linked to item(s): ${missingItemIds.join(", ")}`);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth("admin", "staff");
    const { id } = await params;
    const body = await request.json();
    const parsed = statusSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { status } = parsed.data;
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      const currentRows = await query<Record<string, unknown>>(
        "SELECT * FROM purchase_orders WHERE id = ?",
        [id],
        connection
      );

      if (!currentRows.length) {
        throw new ApiError(404, "Purchase order not found");
      }

      const order = currentRows[0];

      // Handle stock receipt on transition to "Received"
      if (order.status !== "Received" && status === "Received") {
        const details = await query<{ item_id: number; quantity: number }>(
          "SELECT item_id, quantity FROM purchase_order_lines WHERE purchase_order_id = ?",
          [id],
          connection
        );

        await ensureSupplierCatalogPairsExist(
          connection,
          order.supplier_id as number,
          details.map((d) => d.item_id)
        );

        for (const detail of details) {
          await query(
            "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [detail.quantity, detail.item_id],
            connection
          );

          const itemRows = await query<{ unit_id: number; stock_quantity: number }>(
            "SELECT unit_id, stock_quantity FROM items WHERE id = ?",
            [detail.item_id],
            connection
          );
          const itemRecord = itemRows[0];

          await query(
            `INSERT INTO stock_transactions (
               item_id, supplier_id, unit_id, created_by, transaction_type, quantity, balance_after,
               reference_type, reference_id, notes
             )
             VALUES (?, ?, ?, ?, 'STOCK_RECEIPT', ?, ?, 'purchase_order', ?, ?)`,
            [detail.item_id, order.supplier_id, itemRecord.unit_id, user.id,
             detail.quantity, Number(itemRecord.stock_quantity), id,
             `Received via ${order.order_number}`],
            connection
          );

          await query(
            `UPDATE purchase_order_lines
             SET received_quantity = quantity
             WHERE purchase_order_id = ? AND item_id = ?`,
            [id, detail.item_id],
            connection
          );
        }
      }

      // Build update query
      const updateFields = ["status = ?", "updated_at = CURRENT_TIMESTAMP"];
      const updateParams: unknown[] = [status];

      if (order.status === "Pending" && (status === "Approved" || status === "Received")) {
        updateFields.push("approved_by = ?", "approved_at = COALESCE(approved_at, CURRENT_TIMESTAMP)");
        updateParams.push(user.id);
      }

      if (status === "Received") {
        updateFields.push("received_at = COALESCE(received_at, CURRENT_TIMESTAMP)");
      }

      updateParams.push(id);
      await query(
        `UPDATE purchase_orders SET ${updateFields.join(", ")} WHERE id = ?`,
        updateParams,
        connection
      );

      await connection.commit();
      return jsonResponse({ message: "Purchase order status updated" });
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
