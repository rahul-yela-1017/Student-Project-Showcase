import { allTechs } from "@/lib/data";
import { handleError, ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

/** GET /api/techs — distinct technologies across published projects (for filters). */
export async function GET() {
  try {
    const techs = await allTechs();
    return ok({ techs });
  } catch (e) {
    return handleError(e);
  }
}
