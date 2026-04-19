import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute, getPagination } from "@/lib/db";
import { jsonResponse, errorResponse, getSearchParams } from "@/lib/api-utils";
import { z } from "zod";

const createSupplierSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contact_person: z.string().optional().default(""),
  phone: z.string().min(1, "Phone is required"),
  email: z.string().email("Valid email is required"),
  address: z.string().optional().default(""),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth();
    const params = getSearchParams(request);
    const { offset, limit, page } = getPagination(params.page, params.limit);
    const search = params.search ? `%${params.search}%` : null;

    const searchColumns = ["name", "contact_person", "phone", "email"];
    const whereClause = search
      ? `WHERE (${searchColumns.map((col) => `${col} LIKE ?`).join(" OR ")})`
      : "";
    const searchParams = search ? searchColumns.map(() => search) : [];

    const rows = await query(
      `SELECT * FROM suppliers ${whereClause} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...searchParams, limit, offset]
    );

    const countRows = await query<{ total: number }>(
      `SELECT COUNT(*) AS total FROM suppliers ${whereClause}`,
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
    const parsed = createSupplierSchema.safeParse(body);

    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const { name, contact_person, phone, email, address } = parsed.data;
    const result = await execute(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES (?, ?, ?, ?, ?)`,
      [name, contact_person, phone, email, address]
    );
    const created = await query("SELECT * FROM suppliers WHERE id = ?", [result.insertId]);
    return jsonResponse(created[0], 201);
  } catch (error) {
    return errorResponse(error);
  }
}
