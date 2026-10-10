import { getStudentProfile } from "@/lib/data";
import { fail, handleError, ok } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/students/:id — public profile info.
 * Accepts a roll number (e.g. 25MVCSMR0545) or a student id.
 * Never exposes password hashes or other private auth fields.
 */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const profile = await getStudentProfile(id);
    if (!profile) return fail("Student not found.", 404);
    return ok(profile);
  } catch (e) {
    return handleError(e);
  }
}

/**
 * PUT /api/students/me — students can update permitted profile fields only
 * (currently: bio). Roll number, email, and role are immutable here.
 */
export async function PUT() {
  return fail("Use PUT /api/students/me to update your own profile.", 405);
}
