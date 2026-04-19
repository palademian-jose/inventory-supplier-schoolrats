import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ id: string }> };

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
