import { CATEGORIES } from "@/lib/constants";
import {
  createProject as dataCreateProject,
  listProjects as dataListProjects,
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
import { createProjectSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

/** GET /api/projects — published projects only, with search/filter/sort/pagination. */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const result = await dataListProjects({
      q: url.searchParams.get("q") ?? "",
      category: url.searchParams.get("category") ?? "",
      tech: url.searchParams.get("tech") ?? "",
      student: url.searchParams.get("student") ?? "",
      sort: (url.searchParams.get("sort") as "newest" | "oldest" | "az" | "za") ??
        "newest",
      page: Number.parseInt(url.searchParams.get("page") ?? "1", 10) || 1,
      limit: Number.parseInt(url.searchParams.get("limit") ?? "9", 10) || 9,
    });
    return ok(result);
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/projects — authenticated students create their own project. */
export async function POST(req: Request) {
  try {
    requireCsrf(req);
    const session = requireAuth(await getSessionStudent());
    const body = parseOrThrow(createProjectSchema, await readBody(req));
    if (!CATEGORIES.includes(body.category as (typeof CATEGORIES)[number])) {
      return fail("Choose a valid category.", 400);
    }

    const created = await dataCreateProject(
      {
        title: body.title,
        summary: body.summary,
        description: body.description,
        category: body.category,
        technologies: [...body.technologies],
        githubUrl: body.githubUrl,
        liveUrl: body.liveUrl,
        thumbnailUrl: body.thumbnailUrl,
        teamMembers: body.teamMembers,
        academicYear: body.academicYear,
        status: body.status,
      },
      session,
    );
    return ok(created, 201);
  } catch (e) {
    return handleError(e);
  }
}
