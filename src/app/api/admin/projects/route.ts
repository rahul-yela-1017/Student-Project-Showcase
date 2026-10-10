import { adminProjects } from "@/lib/data";
import {
  handleError,
  ok,
  requireAdmin,
  requireAuth,
} from "@/lib/api-helpers";
import { getSessionStudent } from "@/lib/auth";

export const dynamic = "force-dynamic";

const VALID_STATUSES = ["draft", "pending", "published", "rejected"];

/** GET /api/admin/projects?status=&q= — all submissions (admin only). */
export async function GET(req: Request) {
  try {
    const admin = requireAdmin(requireAuth(await getSessionStudent()));
    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "";
    const q = url.searchParams.get("q")?.trim() ?? "";

    const items = await adminProjects(
      status && VALID_STATUSES.includes(status) ? status : undefined,
      q || undefined,
    );
    return ok({ items, viewerRole: admin.role });
  } catch (e) {
    return handleError(e);
  }
}
