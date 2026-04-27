import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const updateItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category_id: z.coerce.number().int("Category is required"),
  unit_id: z.union([z.coerce.number().int(), z.null()]).optional().default(null),
  price: z.coerce.number().min(0, "Price must be zero or greater"),
  stock_quantity: z.coerce.number().int().min(0, "Stock cannot be negative"),
  reorder_level: z.coerce.number().int().min(0, "Reorder level cannot be negative"),
});

const ITEM_SELECT = `
  SELECT i.*, c.name AS category_name, u.name AS unit_name, u.symbol AS unit_symbol
  FROM items i
  LEFT JOIN categories c ON c.id = i.category_id
  LEFT JOIN units_of_measure u ON u.id = i.unit_id`;

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { name, category_id, unit_id, price, stock_quantity, reorder_level } = parsed.data;
    await execute(
      `UPDATE items
       SET name = ?, category_id = ?, unit_id = ?, price = ?, stock_quantity = ?,
           reorder_level = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, category_id, unit_id, price, stock_quantity, reorder_level, id]
    );

    const updated = await query(`${ITEM_SELECT} WHERE i.id = ?`, [id]);
    return jsonResponse(updated[0]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await execute("DELETE FROM items WHERE id = ?", [id]);
    return jsonResponse({ message: "Item deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
