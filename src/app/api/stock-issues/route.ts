import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, getConnection } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const issueSchema = z.object({
  user_id: z.coerce.number().int("User is required"),
  item_id: z.coerce.number().int("Item is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be greater than zero"),
  notes: z.string().optional().default(""),
});

export async function POST(request: NextRequest) {
  try {
    const authUser = await requireAuth("admin", "staff");
    const body = await request.json();
    const parsed = issueSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { user_id, item_id, quantity, notes } = parsed.data;
    const connection = await getConnection();

    try {
      await connection.beginTransaction();

      const itemRows = await query<{ stock_quantity: number; unit_id: number }>(
        "SELECT * FROM items WHERE id = ? FOR UPDATE",
        [item_id],
        connection
      );

      if (!itemRows.length) {
        throw new ApiError(404, "Item not found");
      }

      const item = itemRows[0];

      if (Number(item.stock_quantity) < quantity) {
        throw new ApiError(400, "Insufficient stock");
      }

      await query(
        "UPDATE items SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [quantity, item_id],
        connection
      );

      const nextBalance = Number(item.stock_quantity) - quantity;

      const [txResult] = await connection.execute(
        `INSERT INTO stock_transactions (
           item_id, unit_id, user_id, created_by, transaction_type, quantity, balance_after,
           reference_type, notes
         )
         VALUES (?, ?, ?, ?, 'STOCK_ISSUE', ?, ?, 'stock_issue', ?)`,
        [item_id, item.unit_id, user_id, authUser.id, quantity, nextBalance, notes]
      );

      await connection.commit();
      return jsonResponse(
        { message: "Stock issued successfully", transactionId: (txResult as import("mysql2").ResultSetHeader).insertId },
        201
      );
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
