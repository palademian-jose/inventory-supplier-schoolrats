import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

// Master data config for departments, categories, units
const ENTITIES: Record<string, {
  table: string;
  select: string;
  columns: string[];
  updateAssignments: string[];
  validators: z.ZodObject<Record<string, z.ZodTypeAny>>;
}> = {
  departments: {
    table: "departments",
    select: "SELECT id, code, name FROM departments",
    columns: ["code", "name"],
    updateAssignments: ["code = ?", "name = ?"],
    validators: z.object({
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
    }),
  },
  categories: {
    table: "categories",
    select: "SELECT id, code, name FROM categories",
    columns: ["code", "name"],
    updateAssignments: ["code = ?", "name = ?"],
    validators: z.object({
      code: z.string().min(1, "Code is required"),
      name: z.string().min(1, "Name is required"),
    }),
  },
  units: {
    table: "units_of_measure",
    select: "SELECT id, name, symbol FROM units_of_measure",
    columns: ["name", "symbol"],
    updateAssignments: ["name = ?", "symbol = ?"],
    validators: z.object({
      name: z.string().min(1, "Name is required"),
      symbol: z.string().min(1, "Symbol is required"),
    }),
  },
};

type RouteParams = { params: Promise<{ entity: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth();
    const { entity } = await params;
    const config = ENTITIES[entity];
    if (!config) throw new ApiError(404, "Resource not found");

    const rows = await query(`${config.select} ORDER BY name ASC`);
    return jsonResponse(rows);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin", "staff");
    const { entity } = await params;
    const config = ENTITIES[entity];
    if (!config) throw new ApiError(404, "Resource not found");

    const body = await request.json();
    const parsed = config.validators.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const values = config.columns.map((col) => (parsed.data as Record<string, unknown>)[col]);
    const placeholders = config.columns.map(() => "?").join(", ");

    const result = await execute(
      `INSERT INTO ${config.table} (${config.columns.join(", ")}) VALUES (${placeholders})`,
      values
    );
    const created = await query(`${config.select} WHERE id = ?`, [result.insertId]);
    return jsonResponse(created[0], 201);
  } catch (error) {
    return errorResponse(error);
  }
}
