import type { ZodSchema } from "zod";
import { ZodError } from "zod";
import type { Student } from "@/db/schema";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400): Response {
  return Response.json({ success: false, error: message }, { status });
}

/** Centralized error handler for route handlers. Never leaks stack traces. */
export function handleError(e: unknown): Response {
  if (e instanceof ApiError) return fail(e.message, e.status);
  console.error("[api]", e);
  return fail("Something went wrong. Please try again.", 500);
}

/**
 * Basic CSRF protection: SameSite=Lax cookie + a required custom header on
 * every state-changing request. Cross-origin forms/scripts cannot set it.
 */
export function requireCsrf(req: Request): void {
  if (req.headers.get("x-requested-with") !== "XMLHttpRequest") {
    throw new ApiError(403, "Invalid request. Please refresh and try again.");
  }
}

export async function readBody<T = unknown>(req: Request): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

function firstCharUpper(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Parse with zod; convert the first issue into a friendly 400 message. */
export function parseOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    if (result.error instanceof ZodError) {
      const issue = result.error.issues[0];
      const field = issue?.path?.length
        ? firstCharUpper(issue.path.join(" "))
        : "Input";
      throw new ApiError(400, `${field}: ${issue?.message ?? "invalid value"}`);
    }
    throw new ApiError(400, "Validation failed.");
  }
  return result.data;
}

export function requireAuth(student: Student | null): Student {
  if (!student) throw new ApiError(401, "Please log in to continue.");
  return student;
}

export function requireAdmin(student: Student): Student {
  if (student.role !== "admin") {
    throw new ApiError(403, "Administrator access is required.");
  }
  return student;
}

/* ------------------------------ Rate limiting ----------------------------- */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkLoginRateLimit(key: string): void {
  const now = Date.now();
  let record = attempts.get(key);
  if (!record || record.resetAt < now) {
    record = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(key, record);
  }
  record.count += 1;
  if (record.count > MAX_ATTEMPTS) {
    throw new ApiError(
      429,
      "Too many login attempts. Please wait 15 minutes and try again.",
    );
  }
}
