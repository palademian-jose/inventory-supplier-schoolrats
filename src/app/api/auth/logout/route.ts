import { clearAuthCookie } from "@/lib/auth";
import { jsonResponse } from "@/lib/api-utils";

export async function POST() {
  const response = jsonResponse({ message: "Logged out successfully" });
  response.headers.set("Set-Cookie", clearAuthCookie());
  return response;
}
