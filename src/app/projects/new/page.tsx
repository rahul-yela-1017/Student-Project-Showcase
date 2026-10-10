"use client";

import { RequireAuth } from "@/components/Guard";
import { ProjectForm } from "@/components/ProjectForm";
import { FadeIn } from "@/components/FadeIn";

export default function NewProjectPage() {
  return (
    <RequireAuth>
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <FadeIn>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">New submission</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">
            Showcase your project
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Fill in the details below. You can edit or delete your project at any
            time from your dashboard.
          </p>
          <div className="mt-8">
            <ProjectForm mode="create" />
          </div>
        </FadeIn>
      </div>
    </RequireAuth>
  );
}
