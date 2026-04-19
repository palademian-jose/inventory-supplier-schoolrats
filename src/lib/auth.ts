import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

export interface JWTPayload {
  id: number;
  username: string;
  role: "admin" | "staff";
  fullName: string;
  status: string;
}

const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const COOKIE_NAME = "inventory_token";

export function signToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function getAuthUser(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(COOKIE_NAME);
    if (!tokenCookie?.value) return null;
    return verifyToken(tokenCookie.value);
  } catch {
    return null;
  }
}

export async function requireAuth(
  ...roles: string[]
): Promise<JWTPayload> {
  const user = await getAuthUser();
  if (!user) {
    throw new ApiError(401, "Authentication required");
  }
  if (roles.length > 0 && !roles.includes(user.role)) {
    throw new ApiError(403, "Access denied");
  }
  return user;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setAuthCookie(token: string) {
  // Returns cookie header value for Set-Cookie
  const maxAge = 8 * 60 * 60; // 8 hours
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function clearAuthCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
