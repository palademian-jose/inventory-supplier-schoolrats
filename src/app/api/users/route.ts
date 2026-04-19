import { NextRequest } from "next/server";
import { requireAuth, hashPassword, ApiError } from "@/lib/auth";
import { query, execute, getPagination } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams } from "@/lib/api-utils";
import { z } from "zod";

const createUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
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

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const params = getSearchParams(request);
    const { offset, limit, page } = getPagination(params.page, params.limit);
    const search = params.search ? `%${params.search}%` : null;

    const whereClause = search
      ? `WHERE (
          u.full_name LIKE ? OR u.username LIKE ? OR u.phone LIKE ? OR u.email LIKE ? OR
          u.status LIKE ? OR u.role LIKE ? OR d.name LIKE ?
        )`
      : "";
    const searchParams = search ? [search, search, search, search, search, search, search] : [];

    const rows = await query(
      `${USER_SELECT}
       ${whereClause}
       ORDER BY u.created_at DESC, u.id DESC
       LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total
       FROM users u
       LEFT JOIN departments d ON d.id = u.department_id
       ${whereClause}`,
      searchParams
    );

    return jsonResponse({
      data: rows,
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
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { full_name, username, password, phone, email, address, department_id, role, status } = parsed.data;
    const passwordHash = await hashPassword(password);

    const result = await execute(
      `INSERT INTO users (username, password_hash, full_name, email, phone, address, department_id, role, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [username, passwordHash, full_name, email || null, phone, address, department_id, role, status]
    );

    const insertId = result.insertId;
    const created = await query(`${USER_SELECT} WHERE u.id = ?`, [insertId]);
    return jsonResponse(created[0], 201);
  } catch (error) {
    return errorResponse(error);
  }
}
