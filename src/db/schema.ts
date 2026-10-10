import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Data model mirrors the MERN specification (student_project_showcase DB):
 *  - students collection: rollNumber, name, email, passwordHash, role,
 *    mustChangePassword, isEmailVerified, createdAt, updatedAt (+ showcase fields)
 *  - projects collection: title, summary, description, category, technologies,
 *    githubUrl, liveUrl, thumbnailUrl, owner (ref → students), status, timestamps
 */

export const studentRoleEnum = pgEnum("student_role", ["student", "admin"]);
export const projectStatusEnum = pgEnum("project_status", [
  "draft",
  "pending",
  "published",
  "rejected",
]);

export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  rollNumber: varchar("roll_number", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: studentRoleEnum("role").notNull().default("student"),
  mustChangePassword: boolean("must_change_password")
    .notNull()
    .default(true),
  isEmailVerified: boolean("is_email_verified")
    .notNull()
    .default(false),
  bio: text("bio"),
  department: varchar("department", { length: 120 })
    .notNull()
    .default("Computer Science & Engineering (AI & ML)"),
  section: varchar("section", { length: 5 }).notNull().default("G"),
  batch: varchar("batch", { length: 20 }).notNull().default("2025-2029"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 140 }).notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 60 }).notNull(),
    technologies: text("technologies").array().notNull().default([]),
    githubUrl: text("github_url"),
    liveUrl: text("live_url"),
    thumbnailUrl: text("thumbnail_url"),
    teamMembers: text("team_members"),
    academicYear: varchar("academic_year", { length: 20 }),
    owner: uuid("owner")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: projectStatusEnum("status").notNull().default("published"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("projects_owner_idx").on(t.owner),
    index("projects_status_idx").on(t.status),
    index("projects_category_idx").on(t.category),
    index("projects_created_at_idx").on(t.createdAt),
  ],
);

export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type StudentRole = (typeof studentRoleEnum.enumValues)[number];
export type ProjectStatus = (typeof projectStatusEnum.enumValues)[number];
