export type StudentRole = "student" | "admin";
export type ProjectStatus = "draft" | "pending" | "published" | "rejected";

/** Normalized student row (id is a stable string: ObjectId hex or uuid). */
export interface StudentRecord {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  passwordHash: string;
  role: StudentRole;
  mustChangePassword: boolean;
  isEmailVerified: boolean;
  bio: string | null;
  department: string;
  section: string;
  batch: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectRecord {
  id: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  thumbnailUrl: string | null;
  teamMembers: string | null;
  academicYear: string | null;
  owner: string;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectWithOwner extends ProjectRecord {
  ownerName: string;
  ownerRoll: string;
  ownerBio: string | null;
}

export type SortMode = "newest" | "oldest" | "az" | "za";

export interface ProjectListQuery {
  q?: string;
  category?: string;
  tech?: string;
  student?: string;
  sort?: SortMode;
  page?: number;
  limit?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pages: number;
}

export interface StudentDirectoryEntry {
  id: string;
  rollNumber: string;
  name: string;
  projectCount: number;
}

export interface StudentProfile {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  department: string;
  section: string;
  batch: string;
  bio: string | null;
  projectCount: number;
  technologies: string[];
}

export interface DashboardStats {
  total: number;
  published: number;
  pending: number;
  drafts: number;
  rejected: number;
}

export interface AdminStudentRow {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  role: StudentRole;
  mustChangePassword: boolean;
  createdAt: Date;
  projectCount: number;
  publishedCount: number;
}

export interface HomeStats {
  publishedCount: number;
  studentsCount: number;
  techCount: number;
  catCounts: Record<string, number>;
  recent: ProjectWithOwner[];
}

export interface ProjectCreateInput {
  title: string;
  summary: string;
  description: string;
  category: string;
  technologies: string[];
  githubUrl: string | null;
  liveUrl: string | null;
  thumbnailUrl: string | null;
  teamMembers: string | null;
  academicYear: string | null;
  status: ProjectStatus;
}

export interface ProjectUpdateInput extends Partial<ProjectCreateInput> {}

export interface DataDriver {
  readonly name: "mongo" | "pg";
  login(email: string, password: string): Promise<StudentRecord | null>;
  getStudentById(id: string): Promise<StudentRecord | null>;
  getStudentByRoll(roll: string): Promise<StudentRecord | null>;
  updateStudentPassword(id: string, hash: string): Promise<StudentRecord>;
  updateStudentBio(id: string, bio: string | null): Promise<StudentRecord>;
  listStudents(
    q: string,
    page: number,
    limit: number,
  ): Promise<Paginated<StudentDirectoryEntry>>;
  getStudentProfile(idOrRoll: string): Promise<StudentProfile | null>;
  listProjects(query: ProjectListQuery): Promise<Paginated<ProjectWithOwner>>;
  listOwnProjects(ownerId: string): Promise<ProjectWithOwner[]>;
  getProject(id: string): Promise<ProjectWithOwner | null>;
  createProject(
    input: ProjectCreateInput,
    owner: StudentRecord,
  ): Promise<ProjectWithOwner>;
  updateProject(
    id: string,
    input: ProjectUpdateInput,
  ): Promise<ProjectWithOwner | null>;
  deleteProject(id: string): Promise<boolean>;
  projectStats(ownerId: string): Promise<DashboardStats>;
  allTechs(): Promise<string[]>;
  homeStats(): Promise<HomeStats>;
  adminProjects(status?: string, q?: string): Promise<ProjectWithOwner[]>;
  setProjectStatus(id: string, status: ProjectStatus): Promise<boolean>;
  adminStudents(): Promise<AdminStudentRow[]>;
}
