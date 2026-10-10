"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryBadge, TechBadge } from "@/components/Badge";
import { GithubIcon } from "@/components/icons";
import { cn, CATEGORY_COVER_TINTS, initials } from "@/lib/utils";
import type { ProjectWithOwner } from "@/lib/types";

export function ProjectCard({
  project,
  className,
}: {
  project: ProjectWithOwner;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = Boolean(project.thumbnailUrl) && !imgFailed;

  return (
    <Link
      href={`/projects/${project.id}`}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-slate-900/6",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-44 shrink-0 overflow-hidden bg-gradient-to-br",
          CATEGORY_COVER_TINTS[project.category] ?? "from-slate-100 to-white",
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl ?? undefined}
            alt={`${project.title} cover`}
            onError={() => setImgFailed(true)}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex size-full items-center justify-center opacity-70">
            <CategoryIcon category={project.category} size="size-14" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <CategoryBadge
            name={project.category}
            className="bg-white/90 shadow-sm backdrop-blur"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-base leading-snug font-bold text-ink group-hover:text-primary">
            {project.title}
          </h3>
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">
            {project.summary}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
            {initials(project.ownerName)}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-semibold text-body">
              {project.ownerName}
            </p>
            <p className="truncate text-[11px] text-muted">{project.ownerRoll}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.technologies.slice(0, 4).map((t) => (
            <TechBadge key={t} name={t} />
          ))}
          {project.technologies.length > 4 && (
            <span className="text-xs font-medium text-muted">
              +{project.technologies.length - 4}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center gap-2 border-t border-line pt-3">
          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${project.title} on GitHub`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-body transition hover:border-ink hover:text-ink"
            >
              <GithubIcon className="size-3.5" /> GitHub
            </a>
          )}
          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Open ${project.title} live demo`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 text-xs font-semibold text-body transition hover:border-primary hover:text-primary"
            >
              <Play className="size-3.5" aria-hidden /> Live Demo
            </a>
          )}
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Details
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}
