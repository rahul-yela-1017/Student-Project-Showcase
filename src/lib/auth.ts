import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getStudentById } from "@/lib/data";
import type { StudentRecord } from "@/lib/data/types";

export const SESSION_COOKIE = "sp_session";

const DEV_FALLBACK_SECRET =
  "sp-dev-only-secret-do-not-use-in-production-0f8a2c";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;
  if (process.env.NODE_ENV === "production" && !secret) {
    throw new Error("JWT_SECRET must be set in production");
  }
  return DEV_FALLBACK_SECRET;
}

export interface SessionPayload {
  sub: string;
  role: string;
}

export function signSessionToken(
  studentId: string,
  role: string,
  remember: boolean,
): string {
  return jwt.sign({ sub: studentId, role }, getJwtSecret(), {
    expiresIn: remember ? "30d" : "12h",
  });
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === "string") return null;
    if (!payload.sub) return null;
    return { sub: String(payload.sub), role: String(payload.role ?? "student") };
  } catch {
    return null;
  }
}

export function isCookieSecure(): boolean {
  return process.env.COOKIE_SECURE === "true";
}

/**
 * Resolve the current session by reading the HTTP-only cookie and
 * re-fetching the student from the database (role is always trusted from DB,
 * never from the token or the frontend).
 */
export async function getSessionStudent(): Promise<StudentRecord | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return getStudentById(payload.sub);
}

/** Shape safe to send to the browser — never includes passwordHash. */
export type PublicStudent = Omit<StudentRecord, "passwordHash">;

export function toPublicStudent(s: StudentRecord): PublicStudent {
  return {
    id: s.id,
    rollNumber: s.rollNumber,
    name: s.name,
    email: s.email,
    role: s.role,
    mustChangePassword: s.mustChangePassword,
    isEmailVerified: s.isEmailVerified,
    bio: s.bio,
    department: s.department,
    section: s.section,
    batch: s.batch,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}
