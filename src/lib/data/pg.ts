import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db, pool } from "@/db";
import { projects, students } from "@/db/schema";
import { CATEGORIES } from "@/lib/constants";
import { verifyPassword } from "@/lib/password";
import type {
  AdminStudentRow,
  DashboardStats,
  DataDriver,
  HomeStats,
  ProjectCreateInput,
  ProjectStatus,
  ProjectUpdateInput,
  ProjectWithOwner,
  StudentProfile,
  StudentRecord,
} from "./types";

function toStudentRow(r: typeof students.$inferSelect): StudentRecord {
  return {
    id: r.id,
    rollNumber: r.rollNumber,
    name: r.name,
    email: r.email,
    passwordHash: r.passwordHash,
    role: r.role,
    mustChangePassword: r.mustChangePassword,
    isEmailVerified: r.isEmailVerified,
    bio: r.bio,
    department: r.department,
    section: r.section,
    batch: r.batch,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

type Joined = {
  p: typeof projects.$inferSelect;
  ownerName: string | null;
  ownerRoll: string | null;
  ownerBio: string | null;
};

function toProjectRow(r: Joined): ProjectWithOwner {
  return {
    ...r.p,
    ownerName: r.ownerName ?? "Unknown",
    ownerRoll: r.ownerRoll ?? "",
    ownerBio: r.ownerBio ?? null,
  };
}

const VALID_STATUSES = ["draft", "pending", "published", "rejected"];

export const pgDriver: DataDriver = {
  name: "pg",

  async login(email, password) {
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.email, email))
      .limit(1);
    const s = rows[0];
    if (!s) return null;
    const okPw = await verifyPassword(password, s.passwordHash);
    return okPw ? toStudentRow(s) : null;
  },

  async getStudentById(id) {
    const rows = await db.select().from(students).where(eq(students.id, id)).limit(1);
    return rows[0] ? toStudentRow(rows[0]) : null;
  },

  async getStudentByRoll(roll) {
    const rows = await db
      .select()
      .from(students)
      .where(eq(students.rollNumber, roll.toUpperCase()))
      .limit(1);
    return rows[0] ? toStudentRow(rows[0]) : null;
  },

  async updateStudentPassword(id, hash) {
    const updated = await db
      .update(students)
      .set({ passwordHash: hash, mustChangePassword: false, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    if (!updated[0]) throw new Error("Student not found");
    return toStudentRow(updated[0]);
  },

  async updateStudentBio(id, bio) {
    const updated = await db
      .update(students)
      .set({ bio, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    if (!updated[0]) throw new Error("Student not found");
    return toStudentRow(updated[0]);
  },

  async listStudents(q, page, limit) {
    const where = q
      ? or(ilike(students.name, `%${q}%`), ilike(students.rollNumber, `%${q}%`))
      : undefined;
    const [countRow] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(students)
      .where(where);
    const total = countRow?.cnt ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);
    const rows = await db
      .select({
        id: students.id,
        rollNumber: students.rollNumber,
        name: students.name,
        projectCount: sql<number>`count(${projects.id})::int`,
      })
      .from(students)
      .leftJoin(
        projects,
        and(eq(projects.owner, students.id), eq(projects.status, "published")),
      )
      .where(where)
      .groupBy(students.id, students.rollNumber, students.name)
      .orderBy(asc(students.rollNumber))
      .limit(limit)
      .offset((safePage - 1) * limit);
    return { items: rows, total, page: safePage, pages };
  },

  async getStudentProfile(idOrRoll) {
    const looksLikeUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRoll);
    const rows = await db
      .select()
      .from(students)
      .where(
        looksLikeUuid
          ? or(eq(students.rollNumber, idOrRoll.toUpperCase()), eq(students.id, idOrRoll))
          : eq(students.rollNumber, idOrRoll.toUpperCase()),
      )
      .limit(1);
    const s = rows[0];
    if (!s) return null;
    const { rows: counts } = await pool.query<{ cnt: string }>(
      `select count(*) as cnt from projects where owner = $1 and status = 'published'`,
      [s.id],
    );
    const { rows: techRows } = await pool.query<{ techs: string[] }>(
      `select coalesce(array_agg(t.tech), '{}'::text[]) as techs
       from (select distinct unnest(p.technologies) as tech
             from projects p
             where p.owner = $1 and p.status = 'published'
             order by 1) t`,
      [s.id],
    );
    const profile: StudentProfile = {
      id: s.id,
      rollNumber: s.rollNumber,
      name: s.name,
      email: s.email,
      department: s.department,
      section: s.section,
      batch: s.batch,
      bio: s.bio,
      projectCount: Number(counts[0]?.cnt ?? 0),
      technologies: techRows[0]?.techs ?? [],
    };
    return profile;
  },

  async listProjects(query) {
    const limit = Math.min(query.limit ?? 9, 24);
    const q = query.q?.trim() ?? "";
    const category = query.category?.trim() ?? "";
    const tech = query.tech?.trim() ?? "";
    const student = query.student?.trim() ?? "";

    const conditions = [eq(projects.status, "published")];
    if (q) {
      conditions.push(
        or(
          ilike(projects.title, `%${q}%`),
          ilike(projects.summary, `%${q}%`),
          ilike(projects.description, `%${q}%`),
        )!,
      );
    }
    if (category && (CATEGORIES as readonly string[]).includes(category)) {
      conditions.push(eq(projects.category, category));
    }
    if (tech) conditions.push(sql`${projects.technologies} @> ARRAY[${[tech]}]::text[]`);
    if (student) conditions.push(ilike(students.name, `%${student}%`));
    const where = and(...conditions);

    const order =
      query.sort === "oldest"
        ? asc(projects.createdAt)
        : query.sort === "az"
          ? asc(projects.title)
          : query.sort === "za"
            ? desc(projects.title)
            : desc(projects.createdAt);

    const [countRow] = await db
      .select({ cnt: sql<number>`count(*)::int` })
      .from(projects)
      .leftJoin(students, eq(projects.owner, students.id))
      .where(where);
    const total = countRow?.cnt ?? 0;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, query.page ?? 1), pages);
    const rows = await db
      .select({
        p: projects,
        ownerName: students.name,
        ownerRoll: students.rollNumber,
        ownerBio: students.bio,
      })
      .from(projects)
      .leftJoin(students, eq(projects.owner, students.id))
      .where(where)
      .orderBy(order, desc(projects.id))
      .limit(limit)
      .offset((safePage - 1) * limit);
    return { items: rows.map(toProjectRow), total, page: safePage, pages };
  },

  async listOwnProjects(ownerId) {
    const rows = await db
      .select({
        p: projects,
        ownerName: students.name,
        ownerRoll: students.rollNumber,
        ownerBio: students.bio,
      })
      .from(projects)
      .leftJoin(students, eq(projects.owner, students.id))
      .where(eq(projects.owner, ownerId))
      .orderBy(desc(projects.updatedAt), desc(projects.createdAt));
    return rows.map(toProjectRow);
  },

  async getProject(id) {
    const rows = await db
      .select({
        p: projects,
        ownerName: students.name,
        ownerRoll: students.rollNumber,
        ownerBio: students.bio,
      })
      .from(projects)
      .leftJoin(students, eq(projects.owner, students.id))
      .where(eq(projects.id, id))
      .limit(1);
    return rows[0] ? toProjectRow(rows[0]) : null;
  },

  async createProject(input, owner) {
    const rows = await db
      .insert(projects)
      .values({
        title: input.title,
        summary: input.summary,
        description: input.description,
        category: input.category,
        technologies: [...input.technologies],
        githubUrl: input.githubUrl,
        liveUrl: input.liveUrl,
        thumbnailUrl: input.thumbnailUrl,
        teamMembers: input.teamMembers,
        academicYear: input.academicYear,
        status: input.status as ProjectStatus,
        owner: owner.id,
      })
      .returning();
    const p = rows[0];
    return {
      ...p,
      ownerName: owner.name,
      ownerRoll: owner.rollNumber,
      ownerBio: owner.bio,
    };
  },

  async updateProject(id, input) {
    const updated = await db
      .update(projects)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.summary !== undefined ? { summary: input.summary } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.category !== undefined ? { category: input.category } : {}),
        ...(input.technologies !== undefined
          ? { technologies: [...input.technologies] }
          : {}),
        ...(input.githubUrl !== undefined ? { githubUrl: input.githubUrl } : {}),
        ...(input.liveUrl !== undefined ? { liveUrl: input.liveUrl } : {}),
        ...(input.thumbnailUrl !== undefined
          ? { thumbnailUrl: input.thumbnailUrl }
          : {}),
        ...(input.teamMembers !== undefined
          ? { teamMembers: input.teamMembers }
          : {}),
        ...(input.academicYear !== undefined
          ? { academicYear: input.academicYear }
          : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    if (!updated[0]) return null;
    const p = updated[0];
    const ownerRows = await db
      .select()
      .from(students)
      .where(eq(students.id, p.owner))
      .limit(1);
    const o = ownerRows[0];
    return {
      ...p,
      ownerName: o?.name ?? "Unknown",
      ownerRoll: o?.rollNumber ?? "",
      ownerBio: o?.bio ?? null,
    };
  },

  async deleteProject(id) {
    const res = await db.delete(projects).where(eq(projects.id, id));
    return (res.rowCount ?? 0) > 0;
  },

  async projectStats(ownerId) {
    const rows = await db
      .select({ status: projects.status, cnt: sql<number>`count(*)::int` })
      .from(projects)
      .where(eq(projects.owner, ownerId))
      .groupBy(projects.status);
    const stats: DashboardStats = {
      total: 0,
      published: 0,
      pending: 0,
      drafts: 0,
      rejected: 0,
    };
    for (const r of rows) {
      stats.total += r.cnt;
      if (r.status === "published") stats.published = r.cnt;
      if (r.status === "pending") stats.pending = r.cnt;
      if (r.status === "draft") stats.drafts = r.cnt;
      if (r.status === "rejected") stats.rejected = r.cnt;
    }
    return stats;
  },

  async allTechs() {
    const result = await pool.query(
      `select coalesce(array_agg(t.tech), '{}'::text[]) as techs
       from (select distinct unnest(technologies) as tech
             from projects
             where status = 'published'
             order by 1) t`,
    );
    return (result.rows[0]?.techs as string[]) ?? [];
  },

  async homeStats() {
    const [[publishedRow], [studentsRow], categoryRows, recentRows, techCountRes] =
      await Promise.all([
        db
          .select({ cnt: sql<number>`count(*)::int` })
          .from(projects)
          .where(eq(projects.status, "published")),
        db.select({ cnt: sql<number>`count(*)::int` }).from(students),
        db
          .select({ category: projects.category, cnt: sql<number>`count(*)::int` })
          .from(projects)
          .where(eq(projects.status, "published"))
          .groupBy(projects.category),
        db
          .select({
            p: projects,
            ownerName: students.name,
            ownerRoll: students.rollNumber,
            ownerBio: students.bio,
          })
          .from(projects)
          .leftJoin(students, eq(projects.owner, students.id))
          .where(eq(projects.status, "published"))
          .orderBy(desc(projects.createdAt), desc(projects.id))
          .limit(3),
        pool.query<{ n: string }>(
          `select count(*) as n
           from (select distinct unnest(technologies) as tech
                 from projects where status = 'published') t`,
        ),
      ]);
    const catCounts: Record<string, number> = {};
    for (const r of categoryRows) catCounts[r.category] = r.cnt;
    const stats: HomeStats = {
      publishedCount: publishedRow?.cnt ?? 0,
      studentsCount: studentsRow?.cnt ?? 0,
      techCount: Number(techCountRes.rows[0]?.n ?? 0),
      catCounts,
      recent: recentRows.map(toProjectRow),
    };
    return stats;
  },

  async adminProjects(status, q) {
    const conditions: SQL[] = [];
    if (status && VALID_STATUSES.includes(status)) {
      conditions.push(eq(projects.status, status as ProjectStatus));
    }
    if (q?.trim()) {
      conditions.push(
        or(ilike(projects.title, `%${q.trim()}%`), ilike(students.name, `%${q.trim()}%`))!,
      );
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const rows = await db
      .select({
        p: projects,
        ownerName: students.name,
        ownerRoll: students.rollNumber,
        ownerBio: students.bio,
      })
      .from(projects)
      .leftJoin(students, eq(projects.owner, students.id))
      .where(where)
      .orderBy(desc(projects.createdAt))
      .limit(200);
    return rows.map(toProjectRow);
  },

  async setProjectStatus(id, status) {
    const res = await db
      .update(projects)
      .set({ status, updatedAt: new Date() })
      .where(eq(projects.id, id));
    return (res.rowCount ?? 0) > 0;
  },

  async adminStudents() {
    const rows = await db
      .select({
        id: students.id,
        rollNumber: students.rollNumber,
        name: students.name,
        email: students.email,
        role: students.role,
        mustChangePassword: students.mustChangePassword,
        createdAt: students.createdAt,
        projectCount: sql<number>`count(${projects.id})::int`,
        publishedCount: sql<number>`count(${projects.id}) filter (where ${projects.status} = 'published')::int`,
      })
      .from(students)
      .leftJoin(projects, and(eq(projects.owner, students.id)))
      .groupBy(
        students.id,
        students.rollNumber,
        students.name,
        students.email,
        students.role,
        students.mustChangePassword,
        students.createdAt,
      )
      .orderBy(asc(students.rollNumber));
    return rows as AdminStudentRow[];
  },
};
