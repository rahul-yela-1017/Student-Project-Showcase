import { updateStudentPassword } from "@/lib/data";
import { changePasswordSchema } from "@/lib/validators";
import { verifyPassword } from "@/lib/password";
import {
  fail,
  handleError,
  ok,
  parseOrThrow,
  readBody,
  requireAuth,
  requireCsrf,
} from "@/lib/api-helpers";
import { getSessionStudent, toPublicStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    requireCsrf(req);
    const session = requireAuth(await getSessionStudent());
    const body = parseOrThrow(changePasswordSchema, await readBody(req));

    const currentOk = await verifyPassword(
      body.currentPassword,
      session.passwordHash,
    );
    if (!currentOk) {
      return fail("Your current password is incorrect.", 400);
    }

    const updated = await updateStudentPassword(session.id, body.newPassword);
    return ok({ student: toPublicStudent(updated) });
  } catch (e) {
    return handleError(e);
  }
}
