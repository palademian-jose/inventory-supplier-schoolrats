import { NextRequest } from "next/server";
import { query } from "@/lib/db";
import { signToken, comparePassword, setAuthCookie, ApiError } from "@/lib/auth";
import { jsonResponse, errorResponse } from "@/lib/api-utils";
import { z } from "zod";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const messages = parsed.error.errors.map((e) => e.message).join(", ");
      throw new ApiError(400, messages);
    }

    const { username, password } = parsed.data;

    const users = await query<{
      id: number;
      username: string;
      password_hash: string;
      role: string;
      full_name: string;
      status: string;
    }>(
      "SELECT id, username, password_hash, role, full_name, status FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (!users.length) {
      throw new ApiError(401, "Invalid username or password");
    }

    const user = users[0];

    if (user.status !== "Active") {
      throw new ApiError(403, "This account is inactive");
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      throw new ApiError(401, "Invalid username or password");
    }

    const token = signToken({
      id: user.id,
      username: user.username,
      role: user.role as "admin" | "staff",
      fullName: user.full_name,
      status: user.status,
    });

    const response = jsonResponse({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.full_name,
        status: user.status,
      },
    });

    response.headers.set("Set-Cookie", setAuthCookie(token));
    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
