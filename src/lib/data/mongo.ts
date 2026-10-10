import { MongoClient, ObjectId, type Collection, type Document, type Sort } from "mongodb";
import { INSTITUTE } from "@/lib/constants";
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

const DB_NAME = "student_project_showcase";

let client: MongoClient | null = null;
let ensureDone = false;

export function mongoUri(): string | null {
  return process.env.MONGODB_URI ?? null;
}

export function mongoClient(): MongoClient {
  if (!client) {
    const uri = mongoUri();
    if (!uri) throw new Error("MONGODB_URI is not configured");
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 6000,
      maxPoolSize: 10,
    });
  }
  return client;
}

export function mongoDb(): { students: Collection<Document>; projects: Collection<Document> } {
  const db = mongoClient().db(DB_NAME);
  return { students: db.collection("students"), projects: db.collection("projects") };
}

/** Ping the cluster (used by the driver selector). */
export async function mongoPing(): Promise<void> {
  await mongoClient().connect();
  await mongoClient().db("admin").command({ ping: 1 });
}

/**
 * listIndexes on a collection that does not exist yet throws
 * "ns does not exist" — treat that as "no indexes" so first-use works
 * even when only the pre-existing `students` collection is present.
 */
async function listIndexesSafe(coll: Collection<Document>) {
  try {
    return await coll.indexes();
  } catch (e) {
    const msg = String((e as Error)?.message ?? "");
    if (msg.includes("ns does not exist") || (e as { code?: number })?.code === 26) {
      return null;
    }
    throw e;
  }
}

/** Idempotent index creation — never duplicates existing indexes. */
export async function ensureIndexes(): Promise<void> {
  if (ensureDone) return;
  const { students, projects } = mongoDb();

  // Indexes are an optimization — if any creation fails (e.g. pre-existing
  // duplicates blocking a unique index) we warn but do NOT fail the
  // connection: the app works fine without them.
  try {
    const existingProjects = await listIndexesSafe(projects);
    const wantedProjects: Record<string, Record<string, 1 | -1>> = {
      projects_owner_idx: { owner: 1 },
      projects_status_idx: { status: 1 },
      projects_category_idx: { category: 1 },
      projects_created_at_idx: { createdAt: -1 },
    };
    for (const [name, key] of Object.entries(wantedProjects)) {
      const dup = (existingProjects ?? []).some(
        (i) => JSON.stringify(i.key) === JSON.stringify(key),
      );
      if (!dup) await projects.createIndex(key, { name }); // auto-creates collection
    }
  } catch (e) {
    console.warn("[data] projects index setup skipped:", (e as Error).message);
  }

  try {
    const existingStudents = await listIndexesSafe(students);
    if (existingStudents) {
      // Collection exists (the pre-seeded students collection) — only add
      // indexes that are genuinely missing, never duplicates.
      const wantedStudents: Record<string, { key: Record<string, 1>; unique?: boolean }> = {
        students_rollNumber_unique: { key: { rollNumber: 1 }, unique: true },
        students_email_unique: { key: { email: 1 }, unique: true },
      };
      for (const [name, spec] of Object.entries(wantedStudents)) {
        const dup = existingStudents.some(
          (i) => JSON.stringify(i.key) === JSON.stringify(spec.key),
        );
        if (!dup) {
          await students.createIndex(spec.key, { name, unique: spec.unique });
        }
      }
    }
  } catch (e) {
    console.warn("[data] students index setup skipped:", (e as Error).message);
  }
  ensureDone = true;
}

/* ------------------------------ Normalizers ------------------------------ */

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function date(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === "string" || typeof v === "number") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

function toStudent(doc: Document): StudentRecord {
  const id = doc._id;
  const role = str(doc.role, "student") === "admin" ? "admin" : "student";
  return {
    id: id instanceof ObjectId ? id.toHexString() : str(id),
    rollNumber: str(doc.rollNumber ?? doc.roll_number ?? doc.rollNo ?? doc.rollno).toUpperCase(),
    name: str(doc.name, "Unknown"),
    email: str(doc.email).toLowerCase(),
    passwordHash: str(doc.passwordHash ?? doc.password_hash ?? doc.password),
    role,
    mustChangePassword: doc.mustChangePassword !== false,
    isEmailVerified: doc.isEmailVerified === true,
    bio: typeof doc.bio === "string" ? doc.bio : null,
    department: str(doc.department, INSTITUTE.department),
    section: str(doc.section, INSTITUTE.section),
    batch: str(doc.batch, INSTITUTE.batch),
    createdAt: date(doc.createdAt),
    updatedAt: date(doc.updatedAt),
  };
}

function toProject(doc: Document): ProjectWithOwner {
  const id = doc._id;
  const techs = Array.isArray(doc.technologies)
    ? doc.technologies.map((t) => String(t)).filter(Boolean)
    : [];
  const status: ProjectStatus =
    ["draft", "pending", "published", "rejected"].includes(str(doc.status))
      ? (str(doc.status) as ProjectStatus)
      : "published";
  const owner = doc.owner;
  return {
    id: owner instanceof ObjectId ? id.toHexString() : str(id),
    title: str(doc.title),
    summary: str(doc.summary),
    description: str(doc.description),
    category: str(doc.category, "Other"),
    technologies: techs,
    githubUrl: typeof doc.githubUrl === "string" ? doc.githubUrl : null,
    liveUrl: typeof doc.liveUrl === "string" ? doc.liveUrl : null,
    thumbnailUrl: typeof doc.thumbnailUrl === "string" ? doc.thumbnailUrl : null,
    teamMembers: typeof doc.teamMembers === "string" ? doc.teamMembers : null,
    academicYear: typeof doc.academicYear === "string" ? doc.academicYear : null,
    owner: owner instanceof ObjectId ? owner.toHexString() : str(owner),
    status,
    createdAt: date(doc.createdAt),
    updatedAt: date(doc.updatedAt),
    ownerName: "",
    ownerRoll: "",
    ownerBio: null,
  };
}

async function attachOwners(items: ProjectWithOwner[]): Promise<ProjectWithOwner[]> {
  const ownerIds = [...new Set(items.map((p) => p.owner).filter(Boolean))];
  if (ownerIds.length === 0) return items;
  const { students } = mongoDb();
  const docs = await students
    .find({ _id: { $in: ownerIds.map((o) => (ObjectId.isValid(o) ? new ObjectId(o) : (o as never))) } as Document })
    .toArray();
  const map = new Map(docs.map((d) => [toStudent(d).id, toStudent(d)]));
  for (const p of items) {
    const s = map.get(p.owner);
    if (s) {
      p.ownerName = s.name;
      p.ownerRoll = s.rollNumber;
      p.ownerBio = s.bio;
    }
  }
  return items;
}

function oid(id: string): ObjectId | string {
  return ObjectId.isValid(id) ? new ObjectId(id) : id;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* --------------------------------- Driver -------------------------------- */

export const mongoDriver: DataDriver = {
  name: "mongo",

  async login(email, password) {
    const { students } = mongoDb();
    const re = { $regex: `^${escapeRegex(email)}$`, $options: "i" };
    const doc = await students.findOne({ $or: [{ email: re }, { email: { $eq: email } }] });
    if (!doc) return null;
    const student = toStudent(doc);
    const okPw = await verifyPassword(password, student.passwordHash);
    return okPw ? student : null;
  },

  async getStudentById(id) {
    const { students } = mongoDb();
    const doc = ObjectId.isValid(id)
      ? await students.findOne({ _id: new ObjectId(id) })
      : null;
    if (!doc) return null;
    return toStudent(doc);
  },

  async getStudentByRoll(roll) {
    const { students } = mongoDb();
    const doc = await students.findOne({
      rollNumber: { $regex: `^${escapeRegex(roll.toUpperCase())}$` },
    });
    return doc ? toStudent(doc) : null;
  },

  async updateStudentPassword(id, hash) {
    const { students } = mongoDb();
    const res = await students.updateOne(
      { _id: oid(id) } as Document,
      { $set: { passwordHash: hash, mustChangePassword: false, updatedAt: new Date() } },
    );
    if (res.matchedCount === 0) throw new Error("Student not found");
    const doc = await students.findOne({ _id: oid(id) } as Document);
    return toStudent(doc!);
  },

  async updateStudentBio(id, bio) {
    const { students } = mongoDb();
    const res = await students.updateOne(
      { _id: oid(id) } as Document,
      { $set: { bio: bio ?? "", updatedAt: new Date() } },
    );
    if (res.matchedCount === 0) throw new Error("Student not found");
    const doc = await students.findOne({ _id: oid(id) } as Document);
    return toStudent(doc!);
  },

  async listStudents(q, page, limit) {
    const { students, projects } = mongoDb();
    const filter = q
      ? {
          $or: [
            { name: { $regex: escapeRegex(q), $options: "i" } },
            { rollNumber: { $regex: escapeRegex(q.toUpperCase()), $options: "i" } },
          ],
        }
      : {};
    const all = (await students.find(filter).toArray()).map(toStudent);
    const counts = await projectCountsByOwner(projects, "published");
    const withCount = all
      .map((s) => ({ id: s.id, rollNumber: s.rollNumber, name: s.name, projectCount: counts.get(s.id) ?? 0 }))
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    const total = withCount.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, pages);
    return { items: withCount.slice((safePage - 1) * limit, safePage * limit), total, page: safePage, pages };
  },

  async getStudentProfile(idOrRoll) {
    const { students, projects } = mongoDb();
    const isOid = ObjectId.isValid(idOrRoll);
    const doc = isOid
      ? await students.findOne({ $or: [{ _id: new ObjectId(idOrRoll) }, { rollNumber: idOrRoll.toUpperCase() }] })
      : await students.findOne({ rollNumber: idOrRoll.toUpperCase() });
    if (!doc) return null;
    const s = toStudent(doc);
    const counts = await projectCountsByOwner(projects, "published");
    const techAgg = await projects
      .aggregate<{ _id: null; techs: string[] }>([
        { $match: { owner: oid(s.id) } as Document },
        { $unwind: "$technologies" },
        { $group: { _id: null, techs: { $addToSet: "$technologies" } } },
      ])
      .toArray();
    const technologies = [...(techAgg[0]?.techs ?? [])].sort();
    return {
      id: s.id,
      rollNumber: s.rollNumber,
      name: s.name,
      email: s.email,
      department: s.department,
      section: s.section,
      batch: s.batch,
      bio: s.bio,
      projectCount: counts.get(s.id) ?? 0,
      technologies,
    };
  },

  async listProjects(query) {
    const { projects, students } = mongoDb();
    const limit = Math.min(query.limit ?? 9, 24);
    const filter: Document = { status: "published" };
    if (query.q?.trim()) {
      const re = { $regex: escapeRegex(query.q.trim()), $options: "i" };
      filter.$or = [{ title: re }, { summary: re }, { description: re }];
    }
    if (query.category) filter.category = query.category;
    if (query.tech) filter.technologies = query.tech;
    if (query.student?.trim()) {
      const matched = await students
        .find({ name: { $regex: escapeRegex(query.student.trim()), $options: "i" } }, { projection: { _id: 1 } })
        .toArray();
      const ids = matched.map((m) => m._id);
      if (ids.length === 0) return { items: [], total: 0, page: 1, pages: 1 };
      filter.owner = { $in: ids };
    }

    const sort: Sort =
      query.sort === "oldest"
        ? { createdAt: 1 }
        : query.sort === "az"
          ? { title: 1 }
          : query.sort === "za"
            ? { title: -1 }
            : { createdAt: -1, _id: -1 };

    const total = await projects.countDocuments(filter);
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(1, query.page ?? 1), pages);
    const docs = await projects
      .find(filter)
      .sort(sort)
      .skip((safePage - 1) * limit)
      .limit(limit)
      .toArray();
    const items = await attachOwners(docs.map(toProject));
    return { items, total, page: safePage, pages };
  },

  async listOwnProjects(ownerId) {
    const { projects } = mongoDb();
    const docs = await projects
      .find({ owner: oid(ownerId) })
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();
    return attachOwners(docs.map(toProject));
  },

  async getProject(id) {
    if (!ObjectId.isValid(id)) return null;
    const { projects } = mongoDb();
    const doc = await projects.findOne({ _id: new ObjectId(id) });
    if (!doc) return null;
    const items = await attachOwners([toProject(doc)]);
    return items[0];
  },

  async createProject(input, owner) {
    const { projects } = mongoDb();
    const now = new Date();
    const res = await projects.insertOne({
      title: input.title,
      summary: input.summary,
      description: input.description,
      category: input.category,
      technologies: input.technologies,
      githubUrl: input.githubUrl || null,
      liveUrl: input.liveUrl || null,
      thumbnailUrl: input.thumbnailUrl || null,
      teamMembers: input.teamMembers || null,
      academicYear: input.academicYear || null,
      owner: oid(owner.id),
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });
    const doc = await projects.findOne({ _id: res.insertedId });
    return (await attachOwners([toProject(doc!)]))[0];
  },

  async updateProject(id, input) {
    if (!ObjectId.isValid(id)) return null;
    const { projects } = mongoDb();
    const set: Document = { updatedAt: new Date() };
    const map: Array<[string, keyof ProjectUpdateInput]> = [
      ["title", "title"],
      ["summary", "summary"],
      ["description", "description"],
      ["category", "category"],
      ["technologies", "technologies"],
      ["githubUrl", "githubUrl"],
      ["liveUrl", "liveUrl"],
      ["thumbnailUrl", "thumbnailUrl"],
      ["teamMembers", "teamMembers"],
      ["academicYear", "academicYear"],
      ["status", "status"],
    ];
    for (const [field, key] of map) {
      if (input[key] !== undefined) set[field] = input[key];
    }
    const res = await projects.updateOne({ _id: new ObjectId(id) }, { $set: set });
    if (res.matchedCount === 0) return null;
    return this.getProject(id);
  },

  async deleteProject(id) {
    if (!ObjectId.isValid(id)) return false;
    const { projects } = mongoDb();
    const res = await projects.deleteOne({ _id: new ObjectId(id) });
    return res.deletedCount === 1;
  },

  async projectStats(ownerId) {
    const { projects } = mongoDb();
    const stats: DashboardStats = { total: 0, published: 0, pending: 0, drafts: 0, rejected: 0 };
    const rows = await projects
      .aggregate<{ _id: string; cnt: number }>([
        { $match: { owner: oid(ownerId) } as Document },
        { $group: { _id: "$status", cnt: { $sum: 1 } } },
      ])
      .toArray();
    for (const r of rows) {
      stats.total += r.cnt;
      if (r._id === "published") stats.published = r.cnt;
      if (r._id === "pending") stats.pending = r.cnt;
      if (r._id === "draft") stats.drafts = r.cnt;
      if (r._id === "rejected") stats.rejected = r.cnt;
    }
    return stats;
  },

  async allTechs() {
    const { projects } = mongoDb();
    const rows = await projects
      .aggregate<{ _id: string }>([
        { $match: { status: "published" } },
        { $unwind: "$technologies" },
        { $group: { _id: "$technologies" } },
        { $sort: { _id: 1 } },
      ])
      .toArray();
    return rows.map((r) => r._id);
  },

  async homeStats() {
    const { projects, students } = mongoDb();
    const [publishedCount, studentsCount] = await Promise.all([
      projects.countDocuments({ status: "published" }),
      students.countDocuments({}),
    ]);
    const techRows = await projects
      .aggregate<{ _id: string }>([
        { $match: { status: "published" } },
        { $unwind: "$technologies" },
        { $group: { _id: "$technologies" } },
      ])
      .toArray();
    const catRows = await projects
      .aggregate<{ _id: string; cnt: number }>([
        { $match: { status: "published" } },
        { $group: { _id: "$category", cnt: { $sum: 1 } } },
      ])
      .toArray();
    const recentDocs = await projects
      .find({ status: "published" })
      .sort({ createdAt: -1, _id: -1 })
      .limit(3)
      .toArray();
    const recent = await attachOwners(recentDocs.map(toProject));
    const catCounts: Record<string, number> = {};
    for (const c of catRows) catCounts[c._id] = c.cnt;
    return { publishedCount, studentsCount, techCount: techRows.length, catCounts, recent };
  },

  async adminProjects(status, q) {
    const { projects, students } = mongoDb();
    const filter: Document = {};
    if (status) filter.status = status;
    if (q?.trim()) {
      const re = { $regex: escapeRegex(q.trim()), $options: "i" };
      const nameMatch = await students
        .find({ name: re }, { projection: { _id: 1 } })
        .toArray();
      const ors: Document[] = [{ title: re }];
      if (nameMatch.length > 0) ors.push({ owner: { $in: nameMatch.map((m) => m._id) } });
      filter.$or = ors;
    }
    const docs = await projects.find(filter).sort({ createdAt: -1 }).limit(200).toArray();
    return attachOwners(docs.map(toProject));
  },

  async setProjectStatus(id, status) {
    if (!ObjectId.isValid(id)) return false;
    const { projects } = mongoDb();
    const res = await projects.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } },
    );
    return res.matchedCount === 1;
  },

  async adminStudents() {
    const { students, projects } = mongoDb();
    const all = (await students.find({}).toArray()).map(toStudent);
    const counts = await projectCountsByOwner(projects, null);
    const published = await projectCountsByOwner(projects, "published");
    return all
      .sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
      .map((s) => ({
        id: s.id,
        rollNumber: s.rollNumber,
        name: s.name,
        email: s.email,
        role: s.role,
        mustChangePassword: s.mustChangePassword,
        createdAt: s.createdAt,
        projectCount: counts.get(s.id) ?? 0,
        publishedCount: published.get(s.id) ?? 0,
      }));
  },
};

async function projectCountsByOwner(
  projects: Collection<Document>,
  status: ProjectStatus | null,
): Promise<Map<string, number>> {
  const rows = await projects
    .aggregate<{ _id: ObjectId; cnt: number }>(
      status
        ? [
            { $match: { status } },
            { $group: { _id: "$owner", cnt: { $sum: 1 } } },
          ]
        : [{ $group: { _id: "$owner", cnt: { $sum: 1 } } }],
    )
    .toArray();
  return new Map(rows.map((r) => [r._id.toHexString(), r.cnt]));
}
