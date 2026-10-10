import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, GraduationCap, Users } from "lucide-react";
import { getStudentProfile, listOwnProjects } from "@/lib/data";
import { ProjectCard } from "@/components/ProjectCard";
import { TechBadge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { FadeIn } from "@/components/FadeIn";
import { initials } from "@/lib/utils";
import type { ProjectWithOwner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ rollNumber: string }>;
}) {
  const { rollNumber } = await params;

  let profile;
  try {
    profile = await getStudentProfile(rollNumber);
  } catch {
    profile = null;
  }
  if (!profile) notFound();

  let projs: ProjectWithOwner[] = [];
  try {
    const all = await listOwnProjects(profile.id);
    projs = all;
  } catch {
    projs = [];
  }
  const published = projs.filter((p) => p.status === "published");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <FadeIn>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
          <Link href="/students" className="font-medium hover:text-primary">
            Students
          </Link>
          <ChevronRight className="size-3.5" aria-hidden />
          <span className="font-medium text-body">{profile.name}</span>
        </nav>
      </FadeIn>

      <FadeIn delay={0.05}>
        <div className="mt-5 rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <span className="flex size-20 shrink-0 items-center justify-center rounded-3xl bg-primary text-2xl font-bold text-white">
              {initials(profile.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-bold text-ink">{profile.name}</h1>
              <p className="mt-1 font-mono text-sm font-semibold text-primary">
                {profile.rollNumber}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="size-4" aria-hidden /> {profile.department}
                </span>
                <span>Section {profile.section}</span>
                <span>Batch {profile.batch}</span>
              </div>
              {profile.bio && (
                <p className="mt-4 max-w-2xl rounded-xl bg-canvas px-4 py-3 text-sm leading-relaxed text-body">
                  {profile.bio}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-8 sm:flex-col sm:items-end sm:gap-3">
              <div className="text-center sm:text-right">
                <p className="font-display text-3xl font-bold text-ink">{published.length}</p>
                <p className="text-xs font-medium text-muted">Published projects</p>
              </div>
              <div className="text-center sm:text-right">
                <p className="font-display text-3xl font-bold text-ink">{profile.technologies.length}</p>
                <p className="text-xs font-medium text-muted">Technologies</p>
              </div>
            </div>
          </div>

          {profile.technologies.length > 0 && (
            <div className="mt-6 border-t border-line pt-5">
              <p className="text-xs font-bold tracking-widest text-muted uppercase">
                Technologies used
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {profile.technologies.map((t) => (
                  <TechBadge key={t} name={t} className="px-2.5 py-1" />
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeIn>

      <FadeIn delay={0.1}>
        <div className="mt-10 mb-6 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">
            Published projects
          </h2>
          <Link href="/explore" className="text-sm font-semibold text-primary hover:underline">
            Explore all →
          </Link>
        </div>
      </FadeIn>

      {published.length === 0 ? (
        <FadeIn delay={0.15}>
          <EmptyState
            icon={<Users className="size-7" />}
            title="No published projects yet"
            message={`${profile.name.split(" ")[0]} hasn't published any projects yet. Check back soon!`}
          />
        </FadeIn>
      ) : (
        <div className="grid gap-6 pb-14 sm:grid-cols-2 lg:grid-cols-3">
          {published.map((p, i) => (
            <FadeIn key={p.id} delay={Math.min(i * 0.05, 0.3)}>
              <ProjectCard project={p} />
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
