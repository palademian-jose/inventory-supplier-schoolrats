import { requireAuth } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-utils";

export async function GET() {
  try {
    const user = await requireAuth();
    return jsonResponse({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
