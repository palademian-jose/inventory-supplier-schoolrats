import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

type RouteParams = { params: Promise<{ sid: string; iid: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { sid, iid } = await params;

    const result = await execute(
      "DELETE FROM supplier_catalog_items WHERE supplier_id = ? AND item_id = ?",
      [sid, iid]
    );

    if (!result.affectedRows) {
      throw new ApiError(404, "Supplier catalog entry not found");
    }

    return jsonResponse({ message: "Supplier catalog entry deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
