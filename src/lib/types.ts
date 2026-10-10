/**
 * Shared frontend types — re-exported from the data layer so every surface
 * (API routes, server components, client components) uses one definition.
 */
export type {
  ProjectWithOwner,
  StudentDirectoryEntry,
  StudentProfile,
  DashboardStats,
  AdminStudentRow,
  HomeStats,
  StudentRecord,
  ProjectRecord,
  ProjectStatus,
  StudentRole,
} from "./data/types";
