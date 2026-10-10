import { cookies } from "next/headers";
import { login as dataLogin } from "@/lib/data";
import { loginSchema } from "@/lib/validators";
import {
  checkLoginRateLimit,
  fail,
  handleError,
  ok,
  parseOrThrow,
  readBody,
  requireCsrf,
} from "@/lib/api-helpers";
import {
  isCookieSecure,
  SESSION_COOKIE,
  signSessionToken,
  toPublicStudent,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCsrf(req);
    const body = parseOrThrow(loginSchema, await readBody(req));
    const email = body.email.toLowerCase();
    checkLoginRateLimit(email);

    const student = await dataLogin(email, body.password);
    if (!student) {
      return fail(
        "Invalid email or password. Please check your credentials and try again.",
        401,
      );
    }

    const token = signSessionToken(student.id, student.role, body.remember);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: body.remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12,
      secure: isCookieSecure(),
    });

    return ok({
      student: toPublicStudent(student),
      mustChangePassword: student.mustChangePassword,
    });
  } catch (e) {
    return handleError(e);
  }
}
