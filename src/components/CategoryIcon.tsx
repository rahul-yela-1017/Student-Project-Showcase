import {
  BarChart3,
  Brain,
  Cloud,
  Cpu,
  Globe,
  Layers,
  Radio,
  ShieldCheck,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_TINTS, cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Artificial Intelligence": Brain,
  "Machine Learning": Cpu,
  "Web Development": Globe,
  "Mobile Applications": Smartphone,
  "Data Science": BarChart3,
  "Cloud Computing": Cloud,
  Cybersecurity: ShieldCheck,
  "Internet of Things": Radio,
  Other: Layers,
};

export function CategoryIcon({
  category,
  size = "size-5",
  className,
}: {
  category: string;
  size?: string;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category] ?? Layers;
  return (
    <Icon
      className={cn(size, "shrink-0", className)}
      aria-hidden
    />
  );
}

export function CategoryIconTile({
  category,
  className,
}: {
  category: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex size-11 items-center justify-center rounded-xl",
        CATEGORY_TINTS[category] ?? "bg-slate-50 text-slate-600",
        className,
      )}
    >
      <CategoryIcon category={category} />
    </span>
  );
}
