import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, getConnection } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const createPOSchema = z.object({
  supplier_id: z.coerce.number().int("Supplier is required"),
  status: z.enum(["Pending", "Approved", "Received"], { message: "Invalid status" }),
  expected_delivery_date: z.string().nullish().transform((value) => value ?? ""),
  notes: z.string().nullish().transform((value) => value ?? ""),
  items: z.array(z.object({
    item_id: z.coerce.number().int("Item is required"),
    quantity: z.coerce.number().int().min(1, "Quantity must be greater than zero"),
    unit_price: z.coerce.number().min(0, "Unit price must be zero or greater"),
  })).min(1, "At least one item is required"),
});

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

export async function GET() {
  try {
    await requireAuth();
    const rows = await query(
      `SELECT po.id, po.order_number, po.status, po.total_amount, po.order_date,
              po.expected_delivery_date, po.approved_at, po.received_at,
              s.name AS supplier_name
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       ORDER BY po.order_date DESC, po.id DESC`
    );
    return jsonResponse(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth("admin", "staff");
    const body = await request.json();
    const parsed = createPOSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { supplier_id, status, items, notes, expected_delivery_date } = parsed.data;
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      await ensureSupplierCatalogPairsExist(connection, supplier_id, items.map((i) => i.item_id));

      const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
      const orderNumber = `PO-${Date.now()}`;
      const approvedAt = status === "Approved" || status === "Received" ? new Date() : null;
      const receivedAt = status === "Received" ? new Date() : null;
      const approvedBy = approvedAt ? user.id : null;

      const [orderResult] = await connection.execute(
        `INSERT INTO purchase_orders (
           order_number, supplier_id, created_by, approved_by, status, total_amount, notes,
           expected_delivery_date, approved_at, received_at
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderNumber, supplier_id, user.id, approvedBy, status, totalAmount, notes,
         expected_delivery_date || null, approvedAt, receivedAt]
      );

      const orderId = (orderResult as import("mysql2").ResultSetHeader).insertId;

      for (const item of items) {
        const lineTotal = item.quantity * item.unit_price;
        await connection.execute(
          `INSERT INTO purchase_order_lines (
             purchase_order_id, item_id, quantity, received_quantity, unit_price, line_total
           )
           VALUES (?, ?, ?, ?, ?, ?)`,
          [orderId, item.item_id, item.quantity, status === "Received" ? item.quantity : 0,
           item.unit_price, lineTotal]
        );

        if (status === "Received") {
          await connection.execute(
            "UPDATE items SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.item_id]
          );
          const [itemRows] = await connection.execute(
            "SELECT unit_id, stock_quantity FROM items WHERE id = ?",
            [item.item_id]
          );
          const itemRecord = (itemRows as { unit_id: number; stock_quantity: number }[])[0];
          await connection.execute(
            `INSERT INTO stock_transactions (
               item_id, supplier_id, unit_id, created_by, transaction_type, quantity, balance_after,
               reference_type, reference_id, notes
             )
             VALUES (?, ?, ?, ?, 'STOCK_RECEIPT', ?, ?, 'purchase_order', ?, ?)`,
            [item.item_id, supplier_id, itemRecord.unit_id, user.id, item.quantity,
             Number(itemRecord.stock_quantity), orderId, `Received via ${orderNumber}`]
          );
        }
      }

      await connection.commit();
      return jsonResponse({ id: orderId, order_number: orderNumber, total_amount: totalAmount }, 201);
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
