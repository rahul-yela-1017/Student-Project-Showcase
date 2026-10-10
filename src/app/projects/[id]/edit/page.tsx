import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProject } from "@/lib/data";
import { getSessionStudent } from "@/lib/auth";
import { RequireAuth } from "@/components/Guard";
import { ProjectForm } from "@/components/ProjectForm";
import { FadeIn } from "@/components/FadeIn";
import type { ProjectWithOwner } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSessionStudent();
  if (!session) redirect("/login");

  const project = await getProject(id);
  if (!project) notFound();

  const isOwner = project.owner === session.id;
  const isAdmin = session.role === "admin";
  if (!isOwner && !isAdmin) notFound();

  const initial: ProjectWithOwner = project;

  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <FadeIn>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Edit submission</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Edit project</h1>
          <p className="mt-2 text-sm text-muted">
            Updating <strong className="text-body">{project.title}</strong>
            {!isOwner && isAdmin && " (as administrator)"}
          </p>
          <div className="mt-8">
            <ProjectForm mode="edit" initial={initial} />
          </div>
          <div className="mt-6 text-center">
            <Link
              href={`/projects/${project.id}`}
              className="text-sm font-semibold text-primary hover:underline"
            >
              ← Back to project
            </Link>
          </div>
        </FadeIn>
      </div>
    </RequireAuth>
  );
}
