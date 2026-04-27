import { NextRequest } from "next/server";
import { requireAuth, ApiError } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

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

type RouteParams = { params: Promise<{ entity: string; id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { entity, id } = await params;
    const config = ENTITIES[entity];
    if (!config) throw new ApiError(404, "Resource not found");

    const body = await request.json();
    const parsed = config.validators.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, parsed.error.errors.map((e) => e.message).join(", "));
    }

    const values = config.columns.map((col) => (parsed.data as Record<string, unknown>)[col]);
    await execute(
      `UPDATE ${config.table} SET ${config.updateAssignments.join(", ")} WHERE id = ?`,
      [...values, id]
    );
    const updated = await query(`${config.select} WHERE id = ?`, [id]);
    return jsonResponse(updated[0]);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    await requireAuth("admin");
    const { entity, id } = await params;
    const config = ENTITIES[entity];
    if (!config) throw new ApiError(404, "Resource not found");

    await execute(`DELETE FROM ${config.table} WHERE id = ?`, [id]);
    return jsonResponse({ message: "Record deleted successfully" });
  } catch (error) {
    return errorResponse(error);
  }
}
