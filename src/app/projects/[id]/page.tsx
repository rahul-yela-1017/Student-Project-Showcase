import Link from "next/link";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  ExternalLink,
  FolderGit2,
  GraduationCap,
  Layers,
  Play,
  UserRound,
} from "lucide-react";
import { getProject, listOwnProjects } from "@/lib/data";
import { getSessionStudent } from "@/lib/auth";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryBadge, StatusBadge, TechBadge } from "@/components/Badge";
import { GithubIcon } from "@/components/icons";
import { ProjectActions } from "@/components/ProjectActions";
import { FadeIn } from "@/components/FadeIn";
import { cn, CATEGORY_COVER_TINTS, formatDate, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project = await getProject(id);
  if (!project) notFound();

  const session = await getSessionStudent();
  const isOwner = session?.id === project.owner;
  const isAdmin = session?.role === "admin";

  // Unpublished projects are only visible to their owner or an admin.
  if (project.status !== "published" && !isOwner && !isAdmin) notFound();

  const canManage = isOwner || isAdmin;
  const ownerRollHref =
    project.ownerRoll === session?.rollNumber
      ? "/profile"
      : `/students/${project.ownerRoll}`;

  const moreProjects =
    project.status === "published"
      ? (await listOwnProjects(project.owner))
          .filter((p) => p.status === "published" && p.id !== project.id)
          .slice(0, 2)
      : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <FadeIn>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/explore" className="font-medium hover:text-primary">
            Explore
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="truncate font-medium text-body">{project.title}</span>
        </nav>
      </FadeIn>

      <div
        className={cn(
          "mt-5 flex h-56 items-center justify-center overflow-hidden rounded-3xl border border-line bg-gradient-to-br sm:h-72",
          CATEGORY_COVER_TINTS[project.category] ?? "from-slate-100 to-white",
        )}
      >
        {project.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.thumbnailUrl}
            alt={`${project.title} cover`}
            className="size-full object-cover"
          />
        ) : (
          <CategoryIcon category={project.category} size="size-20" className="opacity-60" />
        )}
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_300px]">
        <div>
          <FadeIn>
            <div className="flex flex-wrap items-center gap-2.5">
              <CategoryBadge name={project.category} />
              {project.status !== "published" && <StatusBadge status={project.status} />}
              {project.academicYear && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <GraduationCap className="size-3.5" aria-hidden /> {project.academicYear}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">
              {project.title}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted">{project.summary}</p>

            {project.teamMembers && (
              <p className="mt-3 text-sm text-body">
                <span className="font-semibold">Team:</span> {project.teamMembers}
              </p>
            )}
          </FadeIn>

          <FadeIn delay={0.08}>
            <h2 className="mt-8 font-display text-lg font-bold text-ink">About this project</h2>
            <div className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-body">
              {project.description}
            </div>

            <h2 className="mt-8 flex items-center gap-2 font-display text-lg font-bold text-ink">
              <Layers className="size-4.5 text-primary" aria-hidden /> Technologies used
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.technologies.map((t) => (
                <TechBadge key={t} name={t} className="px-2.5 py-1" />
              ))}
            </div>
          </FadeIn>
        </div>

        <div className="space-y-5">
          <FadeIn delay={0.05}>
            <div className="rounded-2xl border border-line bg-white p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {initials(project.ownerName)}
                </span>
                <div className="min-w-0">
                  <Link
                    href={ownerRollHref}
                    className="block truncate text-sm font-bold text-ink hover:text-primary"
                  >
                    {project.ownerName}
                  </Link>
                  <p className="truncate text-xs text-muted">{project.ownerRoll}</p>
                </div>
              </div>
              {project.ownerBio && (
                <p className="mt-3 border-t border-line pt-3 text-xs leading-relaxed text-muted">
                  {project.ownerBio}
                </p>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="space-y-2.5 rounded-2xl border border-line bg-white p-5 text-sm">
              <p className="flex items-center gap-2.5 text-body">
                <CalendarDays className="size-4 text-muted" aria-hidden />
                <span className="text-muted">Published:</span>
                <span className="font-semibold">{formatDate(project.createdAt)}</span>
              </p>
              <p className="flex items-center gap-2.5 text-body">
                <Clock3 className="size-4 text-muted" aria-hidden />
                <span className="text-muted">Updated:</span>
                <span className="font-semibold">{formatDate(project.updatedAt)}</span>
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="space-y-2.5">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-ink text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <GithubIcon /> Open GitHub Repository
                  <ExternalLink className="size-3.5 opacity-60" aria-hidden />
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  <Play className="size-4" aria-hidden /> Open Live Demo
                  <ExternalLink className="size-3.5 opacity-60" aria-hidden />
                </a>
              )}
              <Link
                href="/explore"
                className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white text-sm font-semibold text-body transition hover:border-primary/50 hover:text-primary"
              >
                <FolderGit2 className="size-4" aria-hidden /> Back to Projects
              </Link>
            </div>
          </FadeIn>

          {canManage && (
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wide text-amber-800 uppercase">
                  <UserRound className="size-3.5" aria-hidden /> Manage
                </p>
                <ProjectActions projectId={project.id} isOwner={Boolean(isOwner)} />
              </div>
            </FadeIn>
          )}

          {moreProjects.length > 0 && (
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-line bg-white p-5">
                <p className="text-xs font-bold tracking-wide text-muted uppercase">
                  More by {project.ownerName.split(" ")[0]}
                </p>
                <ul className="mt-3 space-y-2">
                  {moreProjects.map((p) => (
                    <li key={p.id}>
                      <Link
                        href={`/projects/${p.id}`}
                        className="text-sm font-semibold text-body hover:text-primary"
                      >
                        {p.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
}
