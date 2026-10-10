import { z } from "zod";
import { CATEGORIES } from "./constants";
import { isSafeHttpUrl } from "./utils";

const safeUrl = z
  .string()
  .url("Enter a valid URL (including https://).")
  .refine((u) => isSafeHttpUrl(u), "Only public http(s) URLs are allowed.");

const optionalUrl = z
  .union([safeUrl, z.literal("")])
  .transform((v) => (v === "" ? null : v));

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .max(160, "Email is too long."),
  password: z.string().min(1, "Password is required."),
  remember: z.boolean().optional().default(false),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: z
      .string()
      .min(8, "Use at least 8 characters.")
      .max(72, "Password is too long.")
      .regex(/[A-Z]/, "Include at least one uppercase letter.")
      .regex(/[a-z]/, "Include at least one lowercase letter.")
      .regex(/[0-9]/, "Include at least one number."),
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters.")
    .max(140, "Title must be under 140 characters."),
  summary: z
    .string()
    .trim()
    .min(10, "Summary must be at least 10 characters.")
    .max(300, "Summary must be under 300 characters."),
  description: z
    .string()
    .trim()
    .min(20, "Description must be at least 20 characters.")
    .max(6000, "Description is too long."),
  category: z.enum(CATEGORIES, { message: "Choose a valid category." }),
  technologies: z
    .array(z.string().trim().min(1, "Empty technology.").max(40))
    .min(1, "Add at least one technology.")
    .max(25, "Maximum 25 technologies."),
  githubUrl: optionalUrl.optional().default(null),
  liveUrl: optionalUrl.optional().default(null),
  thumbnailUrl: optionalUrl.optional().default(null),
  teamMembers: z
    .string()
    .trim()
    .max(300, "Team members field is too long.")
    .optional()
    .transform((v) => (v ? v : null)),
  academicYear: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => (v ? v : null)),
  status: z.enum(["draft", "pending", "published"]).default("published"),
});

export const updateProjectSchema = createProjectSchema.partial();

export const updateProfileSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(300, "Bio must be under 300 characters.")
    .optional()
    .transform((v) => (v ? v : null)),
});

export const projectStatusSchema = z.object({
  status: z.enum(["draft", "pending", "published", "rejected"]),
});

export const passwordStrengthIssues = (password: string): string[] => {
  const issues: string[] = [];
  if (password.length < 8) issues.push("At least 8 characters");
  if (!/[A-Z]/.test(password)) issues.push("One uppercase letter");
  if (!/[a-z]/.test(password)) issues.push("One lowercase letter");
  if (!/[0-9]/.test(password)) issues.push("One number");
  return issues;
};

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
