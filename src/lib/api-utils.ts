import { NextResponse } from "next/server";
import { ApiError } from "./auth";

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ message: error.message }, { status: error.status });
  }

  // MySQL foreign key constraint error
  const err = error as { code?: string; message?: string };
  if (err.code === "ER_ROW_IS_REFERENCED_2") {
    return NextResponse.json(
      { message: "Record cannot be deleted because it is referenced by related records" },
      { status: 409 }
    );
  }

  if (err.code === "ER_DUP_ENTRY") {
    return NextResponse.json(
      { message: "A record with this value already exists" },
      { status: 409 }
    );
  }

  console.error("API Error:", error);
  return NextResponse.json(
    { message: "Internal server error" },
    { status: 500 }
  );
}

export function getSearchParams(request: Request) {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}
