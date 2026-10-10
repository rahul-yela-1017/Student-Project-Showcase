import { listOwnProjects } from "@/lib/data";
import { handleError, ok, requireAuth } from "@/lib/api-helpers";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/projects/mine — all of the signed-in student's projects, any status. */
export async function GET() {
  try {
    const session = requireAuth(await getSessionStudent());
    const items = await listOwnProjects(session.id);
    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}
