import { projectStats } from "@/lib/data";
import { handleError, ok, requireAuth } from "@/lib/api-helpers";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/dashboard/stats — real per-student project statistics. */
export async function GET() {
  try {
    const session = requireAuth(await getSessionStudent());
    const stats = await projectStats(session.id);
    return ok(stats);
  } catch (e) {
    return handleError(e);
  }
}
