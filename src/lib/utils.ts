/** Join class names, skipping falsy values. */
export function cn(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(d);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

/**
 * Validate that a user-supplied external URL is safe:
 * must be http(s) with a real hostname (blocks javascript:, data:, about: etc.)
 */
export function isSafeHttpUrl(input: string): boolean {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname.toLowerCase();
    if (!host.includes(".")) return false;
    if (host === "localhost") return false;
    return true;
  } catch {
    return false;
  }
}

/** Deterministic tint classes per category (light theme). */
export const CATEGORY_TINTS: Record<string, string> = {
  "Artificial Intelligence": "bg-blue-50 text-blue-700",
  "Machine Learning": "bg-indigo-50 text-indigo-700",
  "Web Development": "bg-sky-50 text-sky-700",
  "Mobile Applications": "bg-teal-50 text-teal-700",
  "Data Science": "bg-emerald-50 text-emerald-700",
  "Cloud Computing": "bg-cyan-50 text-cyan-700",
  Cybersecurity: "bg-slate-100 text-slate-700",
  "Internet of Things": "bg-amber-50 text-amber-700",
  Other: "bg-slate-50 text-slate-600",
};

export const CATEGORY_COVER_TINTS: Record<string, string> = {
  "Artificial Intelligence": "from-blue-100 via-sky-50 to-white",
  "Machine Learning": "from-indigo-100 via-blue-50 to-white",
  "Web Development": "from-sky-100 via-cyan-50 to-white",
  "Mobile Applications": "from-teal-100 via-emerald-50 to-white",
  "Data Science": "from-emerald-100 via-teal-50 to-white",
  "Cloud Computing": "from-cyan-100 via-sky-50 to-white",
  Cybersecurity: "from-slate-200 via-slate-100 to-white",
  "Internet of Things": "from-amber-100 via-orange-50 to-white",
  Other: "from-slate-100 via-slate-50 to-white",
};
