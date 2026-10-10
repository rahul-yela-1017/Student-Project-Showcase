export const INSTITUTE = {
  name: "Malla Reddy Vishwavidyapeeth",
  shortName: "MRV University",
  course: "B.Tech",
  department: "Computer Science & Engineering (AI & ML)",
  batch: "2025-2029",
  section: "G",
  emailDomain: "mallareddyuniversity.ac.in",
  rollPrefix: "25MVCSMR",
  rollStart: 545,
  rollEnd: 631,
} as const;

export const CATEGORIES = [
  "Artificial Intelligence",
  "Machine Learning",
  "Web Development",
  "Mobile Applications",
  "Data Science",
  "Cloud Computing",
  "Cybersecurity",
  "Internet of Things",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const ACADEMIC_YEARS = ["2025-26", "2026-27", "2027-28", "2028-29"] as const;

export const PROJECT_STATUSES = [
  "draft",
  "pending",
  "published",
  "rejected",
] as const;

export const TECH_SUGGESTIONS = [
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "MongoDB",
  "PostgreSQL",
  "Python",
  "Django",
  "FastAPI",
  "Flask",
  "TensorFlow",
  "PyTorch",
  "scikit-learn",
  "OpenCV",
  "Flutter",
  "React Native",
  "Kotlin",
  "Java",
  "Spring Boot",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "Tailwind CSS",
  "TypeScript",
  "Firebase",
  "Linux",
  "Git",
  "Linux",
] as const;
