import { listStudents } from "@/lib/data";
import { handleError, ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/students?q=&page= — public student directory (no sensitive fields). */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1);
    const limit = 12;
    const result = await listStudents(q, page, limit);
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}
