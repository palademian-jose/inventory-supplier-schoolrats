import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute, getPagination } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams } from "@/lib/api-utils";
import { z } from "zod";

const createItemSchema = z.object({
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

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const params = getSearchParams(request);
    const { offset, limit, page } = getPagination(params.page, params.limit);
    const search = params.search ? `%${params.search}%` : null;

    const whereClause = search
      ? `WHERE (i.name LIKE ? OR c.name LIKE ? OR u.name LIKE ? OR u.symbol LIKE ?)`
      : "";
    const searchParams = search ? [search, search, search, search] : [];

    const rows = await query(
      `${ITEM_SELECT}
       ${whereClause}
       ORDER BY i.created_at DESC, i.id DESC
       LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM items i
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN units_of_measure u ON u.id = i.unit_id
       ${whereClause}`,
      searchParams
    );

    const data = rows.map((item: Record<string, unknown>) => ({
      ...item,
      is_low_stock: Number(item.stock_quantity) <= Number(item.reorder_level),
    }));

    return jsonResponse({
      data,
      pagination: { page, limit, total: countRows[0].total },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin", "staff");
    const body = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { name, category_id, unit_id, price, stock_quantity, reorder_level } = parsed.data;
    const result = await execute(
      `INSERT INTO items (name, category_id, unit_id, price, stock_quantity, reorder_level)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category_id, unit_id, price, stock_quantity, reorder_level]
    );

    const created = await query(`${ITEM_SELECT} WHERE i.id = ?`, [result.insertId]);
    return jsonResponse(created[0], 201);
  } catch (error) {
    return errorResponse(error);
  }
}
