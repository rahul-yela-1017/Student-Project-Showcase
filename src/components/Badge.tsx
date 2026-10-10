import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/db/schema";

export function TechBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-line bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700",
        className,
      )}
    >
      {name}
    </span>
  );
}

export function CategoryBadge({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary",
        className,
      )}
    >
      {name}
    </span>
  );
}

const statusStyles: Record<ProjectStatus, string> = {
  published: "bg-green-50 text-success border-green-200",
  pending: "bg-amber-50 text-warning border-amber-200",
  draft: "bg-slate-50 text-slate-600 border-line",
  rejected: "bg-red-50 text-danger border-red-200",
};

const statusLabels: Record<ProjectStatus, string> = {
  published: "Published",
  pending: "Pending review",
  draft: "Draft",
  rejected: "Rejected",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        statusStyles[status],
        className,
      )}
    >
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "published" && "bg-success",
          status === "pending" && "bg-warning",
          status === "draft" && "bg-slate-400",
          status === "rejected" && "bg-danger",
        )}
        aria-hidden
      />
      {statusLabels[status]}
    </span>
  );
}
