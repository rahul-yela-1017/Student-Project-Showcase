import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm shadow-blue-600/30">
        <GraduationCap className="size-5" aria-hidden />
      </span>
      {!compact && (
        <span className="leading-tight text-left">
          <span className="block font-display text-[15px] font-bold tracking-tight text-ink">
            Project Showcase
          </span>
          <span className="block text-[10px] font-medium tracking-wide text-muted">
            MALLA REDDY VISHWAVIDYAPEETH
          </span>
        </span>
      )}
    </span>
  );
}
