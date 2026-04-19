import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const createCatalogSchema = z.object({
  supplier_id: z.coerce.number().int("Supplier is required"),
  item_id: z.coerce.number().int("Item is required"),
  supplier_sku: z.string().optional().default(""),
  is_preferred: z.coerce.boolean().optional().default(false),
  supplier_price: z.coerce.number().min(0, "Supplier price must be zero or greater"),
  lead_time_days: z.coerce.number().int().min(0, "Lead time must be zero or greater"),
});

export async function GET() {
  try {
    await requireAuth();
    const rows = await query(
      `SELECT si.supplier_id, si.item_id, si.supplier_sku, si.is_preferred,
              si.supplier_price, si.lead_time_days,
              s.name AS supplier_name, i.name AS item_name
       FROM supplier_catalog_items si
       JOIN suppliers s ON s.id = si.supplier_id
       JOIN items i ON i.id = si.item_id
       ORDER BY si.created_at DESC, si.supplier_id DESC, si.item_id DESC`
    );
    return jsonResponse(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth("admin", "staff");
    const body = await request.json();
    const parsed = createCatalogSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { supplier_id, item_id, supplier_sku, is_preferred, supplier_price, lead_time_days } = parsed.data;
    await execute(
      `INSERT INTO supplier_catalog_items (
         supplier_id, item_id, supplier_sku, is_preferred, supplier_price, lead_time_days
       )
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         supplier_sku = VALUES(supplier_sku),
         is_preferred = VALUES(is_preferred),
         supplier_price = VALUES(supplier_price),
         lead_time_days = VALUES(lead_time_days)`,
      [supplier_id, item_id, supplier_sku || null, is_preferred, supplier_price, lead_time_days]
    );

    return jsonResponse({ message: "Supplier catalog entry saved", supplier_id, item_id }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
