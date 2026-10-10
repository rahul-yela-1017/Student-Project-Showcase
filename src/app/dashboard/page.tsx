"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Blocks,
  CheckCircle2,
  Clock3,
  FileEdit,
  LayoutDashboard,
  LogOut,
  Pencil,
  PenLine,
  Plus,
  Trash2,
} from "lucide-react";
import { RequireAuth } from "@/components/Guard";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { StatusBadge, TechBadge } from "@/components/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import { cn, timeAgo } from "@/lib/utils";
import type { DashboardStats, ProjectWithOwner } from "@/lib/types";

type Filter = "all" | "published" | "pending" | "draft" | "rejected";

function DashboardContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<ProjectWithOwner[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [deleteTarget, setDeleteTarget] = useState<ProjectWithOwner | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, mine] = await Promise.all([
        api.get<DashboardStats>("/api/dashboard/stats"),
        api.get<{ items: ProjectWithOwner[] }>("/api/projects/mine"),
      ]);
      setStats(s);
      setProjects(mine.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load dashboard.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.del(`/api/projects/${deleteTarget.id}`);
      toast("Project deleted.");
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Could not delete project.", "error");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = useMemo(() => {
    if (!projects) return [];
    if (filter === "all") return projects;
    return projects.filter((p) => p.status === filter);
  }, [projects, filter]);

  if (!user) return null;
  const firstName = user.name.split(" ")[0];

  const cards = [
    { key: "all" as Filter, label: "Total Projects", value: stats?.total, icon: Blocks, tint: "bg-primary/8 text-primary" },
    { key: "published" as Filter, label: "Published", value: stats?.published, icon: CheckCircle2, tint: "bg-green-50 text-success" },
    { key: "pending" as Filter, label: "Pending Review", value: stats?.pending, icon: Clock3, tint: "bg-amber-50 text-warning" },
    { key: "draft" as Filter, label: "Drafts", value: stats?.drafts, icon: FileEdit, tint: "bg-slate-100 text-slate-600" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Welcome */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Here&apos;s what&apos;s happening with your projects.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="size-4" /> Logout
          </Button>
          <Button size="sm" onClick={() => router.push("/projects/new")}>
            <Plus className="size-4" /> Quick Add Project
          </Button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Profile card */}
        <div className="h-fit rounded-2xl border border-line bg-white p-5">
          <div className="flex items-center gap-3.5">
            <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-white">
              {user.name.slice(0, 2).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-base font-bold text-ink">{user.name}</p>
              <p className="truncate text-xs font-medium text-muted">{user.rollNumber}</p>
            </div>
          </div>
          <dl className="mt-5 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Email</dt>
              <dd className="truncate text-right font-medium text-body">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="shrink-0 text-muted">Department</dt>
              <dd className="truncate text-right font-medium text-body">{user.department}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Section</dt>
              <dd className="font-medium text-body">Section {user.section}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Batch</dt>
              <dd className="font-medium text-body">{user.batch}</dd>
            </div>
          </dl>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              href="/profile"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-white text-xs font-semibold text-body transition hover:border-primary/50 hover:text-primary"
            >
              <PenLine className="size-3.5" /> Edit Profile
            </Link>
            <Link
              href={`/students/${user.rollNumber}`}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-white text-xs font-semibold text-body transition hover:border-primary/50 hover:text-primary"
            >
              <LayoutDashboard className="size-3.5" /> My Profile
            </Link>
          </div>
        </div>

        {/* Stats + projects */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            {stats === null
              ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
              : cards.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setFilter(c.key)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition hover:shadow-md",
                      filter === c.key ? "border-primary ring-1 ring-primary/30" : "border-line",
                    )}
                    aria-pressed={filter === c.key}
                  >
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", c.tint)}>
                      <c.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-display text-2xl leading-none font-bold text-ink">
                        {c.value ?? 0}
                      </p>
                      <p className="mt-1 text-xs font-medium text-muted">{c.label}</p>
                    </div>
                  </button>
                ))}
          </div>

          {stats && stats.rejected > 0 && (
            <button
              onClick={() => setFilter(filter === "rejected" ? "all" : "rejected")}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              <Trash2 className="size-3.5" />
              {stats.rejected} rejected — click to view
            </button>
          )}

          {error ? (
            <EmptyState
              icon={<Blocks className="size-7" />}
              title="Could not load your projects"
              message={error}
              action={<Button onClick={() => void load()}>Try again</Button>}
            />
          ) : projects && projects.length === 0 ? (
            <EmptyState
              icon={<Blocks className="size-7" />}
              title="You haven't published anything yet"
              message="Share your first project with the batch — it takes less than two minutes."
              action={
                <Button onClick={() => router.push("/projects/new")}>
                  <Plus className="size-4" /> Create your first project
                </Button>
              }
            />
          ) : (
            <div className="rounded-2xl border border-line bg-white">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h2 className="font-display text-base font-bold text-ink">My Projects</h2>
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter my projects">
                  {(["all", "published", "pending", "draft", "rejected"] as Filter[]).map((f) => (
                    <button
                      key={f}
                      role="tab"
                      aria-selected={filter === f}
                      onClick={() => setFilter(f)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-semibold capitalize transition",
                        filter === f
                          ? "bg-ink text-white"
                          : "bg-slate-100 text-muted hover:bg-slate-200",
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted">
                  No {filter === "all" ? "" : filter + " "}projects yet.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {filtered.map((p) => (
                    <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/projects/${p.id}`}
                          className="block truncate text-sm font-bold text-ink hover:text-primary"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <StatusBadge status={p.status} />
                          <span className="text-xs text-muted">
                            {p.category} · updated {timeAgo(p.updatedAt)}
                          </span>
                        </div>
                      </div>
                      <div className="hidden flex-wrap gap-1.5 md:flex">
                        {p.technologies.slice(0, 3).map((t) => (
                          <TechBadge key={t} name={t} />
                        ))}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => router.push(`/projects/${p.id}/edit`)}
                          aria-label={`Edit ${p.title}`}
                          className="flex size-8.5 items-center justify-center rounded-lg border border-line text-body transition hover:border-primary/50 hover:text-primary"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          aria-label={`Delete ${p.title}`}
                          className="flex size-8.5 items-center justify-center rounded-lg border border-line text-body transition hover:border-red-300 hover:bg-red-50 hover:text-danger"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete this project?"
        message={
          deleteTarget
            ? `“${deleteTarget.title}” will be permanently removed. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete project"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  );
}
