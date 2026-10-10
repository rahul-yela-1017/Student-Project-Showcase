import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const items: Array<number | "…"> = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) items.push(i);
    else if (items[items.length - 1] !== "…") items.push("…");
  }

  return (
    <nav className="flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
        className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-body transition hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="size-4" />
      </button>
      {items.map((it, idx) =>
        it === "…" ? (
          <span key={`e${idx}`} className="px-1 text-sm text-muted">
            …
          </span>
        ) : (
          <button
            key={it}
            onClick={() => onChange(it)}
            aria-current={it === page ? "page" : undefined}
            className={cn(
              "size-9 rounded-lg border text-sm font-semibold transition",
              it === page
                ? "border-primary bg-primary text-white"
                : "border-line bg-white text-body hover:border-primary/40 hover:text-primary",
            )}
          >
            {it}
          </button>
        ),
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
        className="flex size-9 items-center justify-center rounded-lg border border-line bg-white text-body transition hover:border-primary/40 hover:text-primary disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
