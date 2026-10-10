import type {
  DataDriver,
  ProjectCreateInput,
  ProjectStatus,
  ProjectUpdateInput,
  StudentRecord,
} from "./types";
import { ensureIndexes, mongoDriver, mongoPing } from "./mongo";
import { hashPassword } from "@/lib/password";

/**
 * MongoDB is the only source of application data. A failed connection is
 * surfaced instead of serving a stale or sample-data replica.
 */
let resolved: DataDriver | null = null;
let mongoRetryAt = 0;
let mongoError: Error | null = null;
let initPromise: Promise<DataDriver> | null = null;

export async function getDataDriver(): Promise<DataDriver> {
  if (resolved) return resolved;
  if (mongoError && Date.now() < mongoRetryAt) throw mongoError;

  if (initPromise) return initPromise;
  initPromise = (async () => {
    try {
      if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not configured. Add it to .env.local.");
      }

      await mongoPing();
      await ensureIndexes();
      resolved = mongoDriver;
      mongoError = null;
      console.info("[data] Using MongoDB (student_project_showcase)");
      return mongoDriver;
    } catch (cause) {
      mongoError = cause instanceof Error ? cause : new Error(String(cause));
      mongoRetryAt = Date.now() + 60_000;
      console.error(`[data] MongoDB unavailable: ${mongoError.message.split("\n")[0]}`);
      throw mongoError;
    }
  })();

  try {
    return await initPromise;
  } finally {
    initPromise = null;
  }
}

/* ------------------------------ Public API ------------------------------ */

const d = () => getDataDriver();

export async function login(email: string, password: string) {
  return (await d()).login(email, password);
}
export async function getStudentById(id: string) {
  return (await d()).getStudentById(id);
}
export async function updateStudentPassword(id: string, newPassword: string) {
  const hash = await hashPassword(newPassword);
  return (await d()).updateStudentPassword(id, hash);
}
export async function updateStudentBio(id: string, bio: string | null) {
  return (await d()).updateStudentBio(id, bio);
}
export async function listStudents(q: string, page: number, limit: number) {
  return (await d()).listStudents(q, page, limit);
}
export async function getStudentProfile(idOrRoll: string) {
  return (await d()).getStudentProfile(idOrRoll);
}
export async function listProjects(query: Parameters<DataDriver["listProjects"]>[0]) {
  return (await d()).listProjects(query);
}
export async function listOwnProjects(ownerId: string) {
  return (await d()).listOwnProjects(ownerId);
}
export async function getProject(id: string) {
  return (await d()).getProject(id);
}
export async function createProject(
  input: ProjectCreateInput,
  owner: StudentRecord,
) {
  return (await d()).createProject(input, owner);
}
export async function updateProject(id: string, input: ProjectUpdateInput) {
  return (await d()).updateProject(id, input);
}
export async function deleteProject(id: string) {
  return (await d()).deleteProject(id);
}
export async function projectStats(ownerId: string) {
  return (await d()).projectStats(ownerId);
}
export async function allTechs() {
  return (await d()).allTechs();
}
export async function homeStats() {
  return (await d()).homeStats();
}
export async function adminProjects(status?: string, q?: string) {
  return (await d()).adminProjects(status, q);
}
export async function setProjectStatus(id: string, status: ProjectStatus) {
  return (await d()).setProjectStatus(id, status);
}
export async function adminStudents() {
  return (await d()).adminStudents();
}

/** Active backend name for logging/UI hints. */
export async function activeDriverName(): Promise<"mongo"> {
  await getDataDriver();
  return "mongo";
}

/**
 * Synchronous read of MongoDB connection state for the status banner.
 */
export function dataSourceStatus(): {
  source: "mongo" | "unavailable" | "checking";
  mongoConfigured: boolean;
} {
  return {
    source: resolved ? "mongo" : mongoError ? "unavailable" : "checking",
    mongoConfigured: Boolean(process.env.MONGODB_URI),
  };
}
