import { setProjectStatus } from "@/lib/data";
import {
  fail,
  handleError,
  ok,
  parseOrThrow,
  readBody,
  requireAdmin,
  requireAuth,
  requireCsrf,
} from "@/lib/api-helpers";
import { getSessionStudent } from "@/lib/auth";
import { projectStatusSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/projects/:id/status — approve / reject / unpublish (admin). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    requireCsrf(req);
    requireAdmin(requireAuth(await getSessionStudent()));
    const { id } = await params;
    const body = parseOrThrow(projectStatusSchema, await readBody(req));

    const updated = await setProjectStatus(id, body.status);
    if (!updated) return fail("Project not found.", 404);
    return ok({ id, status: body.status });
  } catch (e) {
    return handleError(e);
  }
}
