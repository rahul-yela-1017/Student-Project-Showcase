import {
  deleteProject,
  getProject,
  updateProject,
} from "@/lib/data";
import {
  fail,
  handleError,
  ok,
  parseOrThrow,
  readBody,
  requireAuth,
  requireCsrf,
} from "@/lib/api-helpers";
import { getSessionStudent } from "@/lib/auth";
import { updateProjectSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/projects/:id — published for everyone; own or admin for others. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const project = await getProject(id);
    if (!project) return fail("Project not found.", 404);

    const session = await getSessionStudent();
    const isOwner = session?.id === project.owner;
    const isAdmin = session?.role === "admin";
    if (project.status !== "published" && !isOwner && !isAdmin) {
      return fail("Project not found.", 404);
    }
    return ok(project);
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/projects/:id — ownership (or admin) validated server-side. */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    requireCsrf(req);
    const session = requireAuth(await getSessionStudent());
    const { id } = await params;

    const project = await getProject(id);
    if (!project) return fail("Project not found.", 404);

    const isOwner = project.owner === session.id;
    const isAdmin = session.role === "admin";
    if (!isOwner && !isAdmin) {
      return fail("You can only edit your own projects.", 403);
    }

    const body = parseOrThrow(updateProjectSchema, await readBody(req));
    const updated = await updateProject(id, {
      title: body.title,
      summary: body.summary,
      description: body.description,
      category: body.category,
      technologies: body.technologies,
      githubUrl: body.githubUrl,
      liveUrl: body.liveUrl,
      thumbnailUrl: body.thumbnailUrl,
      teamMembers: body.teamMembers,
      academicYear: body.academicYear,
      status: body.status,
    });
    if (!updated) return fail("Project not found.", 404);
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/projects/:id — only the owner or an admin. */
export async function DELETE(req: Request, { params }: Ctx) {
  try {
    requireCsrf(req);
    const session = requireAuth(await getSessionStudent());
    const { id } = await params;

    const project = await getProject(id);
    if (!project) return fail("Project not found.", 404);

    if (project.owner !== session.id && session.role !== "admin") {
      return fail("You can only delete your own projects.", 403);
    }

    const deleted = await deleteProject(id);
    if (!deleted) return fail("Project not found.", 404);
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
