import { adminStudents } from "@/lib/data";
import { handleError, ok, requireAdmin, requireAuth } from "@/lib/api-helpers";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** GET /api/admin/students — full roster (admin only, no password fields). */
export async function GET() {
  try {
    requireAdmin(requireAuth(await getSessionStudent()));
    const items = await adminStudents();
    return ok({ items, total: items.length });
  } catch (e) {
    return handleError(e);
  }
}
