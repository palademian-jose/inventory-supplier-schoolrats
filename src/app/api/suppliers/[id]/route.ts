import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const updateSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional().default(""),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().optional().default(""),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin", "staff");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateSupplierSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { name, contact_person, phone, email, address } = parsed.data;
    await execute(
      `UPDATE suppliers
       SET name = ?, contact_person = ?, phone = ?, email = ?, address = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, contact_person, phone, email, address, id]
    );
    const updated = await query("SELECT * FROM suppliers WHERE id = ?", [id]);
    return jsonResponse(updated[0]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await execute("DELETE FROM suppliers WHERE id = ?", [id]);
    return jsonResponse({ message: "Supplier deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
