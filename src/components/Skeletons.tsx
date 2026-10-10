import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-slate-200/70", className)}
      aria-hidden
    />
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <Shimmer className="h-44 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Shimmer className="h-5 w-3/4" />
        <Shimmer className="h-4 w-full" />
        <div className="flex items-center gap-2.5">
          <Shimmer className="size-7 rounded-full" />
          <div className="space-y-1.5">
            <Shimmer className="h-3 w-24" />
            <Shimmer className="h-3 w-28" />
          </div>
        </div>
        <div className="flex gap-1.5">
          <Shimmer className="h-5 w-14" />
          <Shimmer className="h-5 w-16" />
          <Shimmer className="h-5 w-12" />
        </div>
        <Shimmer className="h-8 w-full" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-3">
        <Shimmer className="size-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-20" />
          <Shimmer className="h-6 w-12" />
        </div>
      </div>
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3" role="status">
        <span className="size-8 animate-spin rounded-full border-[3px] border-line border-t-primary" />
        <p className="text-sm font-medium text-muted">{label}</p>
      </div>
    </div>
  );
}
