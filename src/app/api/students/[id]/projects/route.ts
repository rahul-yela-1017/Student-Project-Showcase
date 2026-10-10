import { getStudentProfile, listOwnProjects } from "@/lib/data";
import { fail, handleError, ok } from "@/lib/api-helpers";
import type { ProjectWithOwner } from "@/lib/types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/students/:id/projects — published projects of a student (by roll number). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const profile = await getStudentProfile(id);
    if (!profile) return fail("Student not found.", 404);

    const all = await listOwnProjects(profile.id);
    const items: ProjectWithOwner[] = all.filter((p) => p.status === "published");
    return ok({ items });
  } catch (e) {
    return handleError(e);
  }
}
