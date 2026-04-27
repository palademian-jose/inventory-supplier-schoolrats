import { NextRequest } from "next/server";
import { requireAuth, hashPassword, ApiError } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const updateUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required").optional().or(z.literal("")),
  address: z.string().optional().default(""),
  department_id: z.union([z.coerce.number().int(), z.null()]).optional().default(null),
  role: z.enum(["admin", "staff"]).optional().default("staff"),
  status: z.string().min(1, "Status is required"),
});

const USER_SELECT = `
  SELECT u.id, u.username, u.full_name, u.full_name AS name, u.email, u.phone, u.address,
         u.department_id, u.role, u.status, u.created_at, u.updated_at, d.name AS department_name
  FROM users u
  LEFT JOIN departments d ON d.id = u.department_id`;

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    const body = await request.json();
    const parsed = updateUserSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { full_name, username, password, phone, email, address, department_id, role, status } = parsed.data;

    const updateFields = [
      "username = ?",
      "full_name = ?",
      "email = ?",
      "phone = ?",
      "address = ?",
      "department_id = ?",
      "role = ?",
      "status = ?",
      "updated_at = CURRENT_TIMESTAMP",
    ];
    const updateParams: unknown[] = [username, full_name, email || null, phone, address, department_id, role, status];

    if (password) {
      updateFields.splice(1, 0, "password_hash = ?");
      updateParams.splice(1, 0, await hashPassword(password));
    }

    updateParams.push(id);

    await execute(`UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`, updateParams);
    const updated = await query(`${USER_SELECT} WHERE u.id = ?`, [id]);
    return jsonResponse(updated[0]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { id } = await params;
    await execute("DELETE FROM users WHERE id = ?", [id]);
    return jsonResponse({ message: "User deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
