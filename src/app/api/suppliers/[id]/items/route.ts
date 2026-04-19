import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { id } = await params;
    const rows = await query(
      `SELECT si.supplier_id, si.item_id, si.supplier_price, si.lead_time_days, si.supplier_sku, si.is_preferred,
              i.id AS item_id, i.name AS item_name
       FROM supplier_catalog_items si
       JOIN items i ON i.id = si.item_id
       WHERE si.supplier_id = ?`,
      [id]
    );
    return jsonResponse(rows);
  } catch (error) {
    return errorResponse(error);
  }
}
