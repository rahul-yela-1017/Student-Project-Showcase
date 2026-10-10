import { fail, handleError, ok } from "@/lib/api-helpers";
import { getSessionStudent, toPublicStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const student = await getSessionStudent();
    if (!student) return fail("You are not logged in.", 401);
    return ok(toPublicStudent(student));
  } catch (e) {
    return handleError(e);
  }
}
