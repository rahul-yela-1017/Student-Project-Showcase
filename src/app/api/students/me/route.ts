import { updateStudentBio } from "@/lib/data";
import {
  handleError,
  ok,
  parseOrThrow,
  readBody,
  requireAuth,
  requireCsrf,
} from "@/lib/api-helpers";
import { getSessionStudent, toPublicStudent } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** PUT /api/students/me — update permitted profile fields (bio only). */
export async function PUT(req: Request) {
  try {
    requireCsrf(req);
    const session = requireAuth(await getSessionStudent());
    const body = parseOrThrow(updateProfileSchema, await readBody(req));

    const updated = await updateStudentBio(session.id, body.bio);
    return ok(toPublicStudent(updated));
  } catch (e) {
    return handleError(e);
  }
}
