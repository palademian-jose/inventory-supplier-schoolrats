import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { query } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const params = getSearchParams(request);
    const conditions: string[] = [];
    const queryParams: unknown[] = [];

    if (params.item_id) {
      conditions.push("st.item_id = ?");
      queryParams.push(params.item_id);
    }

    if (params.type) {
      conditions.push("st.transaction_type = ?");
      queryParams.push(params.type);
    }

    if (params.start_date) {
      conditions.push("DATE(st.transaction_date) >= ?");
      queryParams.push(params.start_date);
    }

    if (params.end_date) {
      conditions.push("DATE(st.transaction_date) <= ?");
      queryParams.push(params.end_date);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const rows = await query(
      `SELECT st.*, i.name AS item_name, c.name AS item_category, uu.full_name AS user_name,
              s.name AS supplier_name, um.symbol AS unit_symbol, cu.full_name AS created_by_name
       FROM stock_transactions st
       JOIN items i ON i.id = st.item_id
       LEFT JOIN categories c ON c.id = i.category_id
       LEFT JOIN suppliers s ON s.id = st.supplier_id
       LEFT JOIN units_of_measure um ON um.id = st.unit_id
       LEFT JOIN users uu ON uu.id = st.user_id
       LEFT JOIN users cu ON cu.id = st.created_by
       ${whereClause}
       ORDER BY st.transaction_date DESC, st.id DESC`,
      queryParams
    );

    return jsonResponse(rows);
  } catch (error) {
    return errorResponse(error);
  }
}
