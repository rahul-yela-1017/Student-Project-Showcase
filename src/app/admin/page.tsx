"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ClipboardList,
  Inbox,
  LayoutGrid,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";
import { RequireAdmin } from "@/components/Guard";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { StatusBadge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader, StatSkeleton } from "@/components/Skeletons";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import { CATEGORIES } from "@/lib/constants";
import { cn, formatDate } from "@/lib/utils";
import type { ProjectStatus, ProjectWithOwner } from "@/lib/types";

type Tab = "overview" | "submissions" | "projects" | "students";

interface AdminStudentRow {
  id: string;
  rollNumber: string;
  name: string;
  email: string;
  role: "student" | "admin";
  mustChangePassword: boolean;
  createdAt: Date;
  projectCount: number;
  publishedCount: number;
}

function AdminContent() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [projects, setProjects] = useState<ProjectWithOwner[] | null>(null);
  const [students, setStudents] = useState<AdminStudentRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ProjectWithOwner | null>(null);

  const load = useCallback(async () => {
    try {
      const [p, s] = await Promise.all([
        api.get<{ items: ProjectWithOwner[] }>("/api/admin/projects"),
        api.get<{ items: AdminStudentRow[]; total: number }>("/api/admin/students"),
      ]);
      setProjects(p.items);
      setStudents(s.items);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to load admin data.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: ProjectStatus, label?: string) => {
    setBusyId(id);
    try {
      await api.patch(`/api/admin/projects/${id}/status`, { status });
      toast(label ?? `Project marked as ${status}.`);
      setRejectTarget(null);
      await load();
    } catch (err) {
      toast(err instanceof ApiClientError ? err.message : "Update failed.", "error");
      setRejectTarget(null);
    } finally {
      setBusyId(null);
    }
  };

  const pending = useMemo(
    () => (projects ?? []).filter((p) => p.status === "pending"),
    [projects],
  );

  const stats = useMemo(() => {
    const counts: Record<ProjectStatus, number> = {
      draft: 0,
      pending: 0,
      published: 0,
      rejected: 0,
    };
    (projects ?? []).forEach((p) => {
      counts[p.status] += 1;
    });
    const byCategory = new Map<string, number>();
    (projects ?? [])
      .filter((p) => p.status === "published")
      .forEach((p) => byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1));
    return {
      counts,
      total: (projects ?? []).length,
      students: students?.length ?? 0,
      byCategory,
    };
  }, [projects, students]);

  const maxCat = Math.max(1, ...[...stats.byCategory.values()]);

  const tabs: Array<{ id: Tab; label: string; icon: typeof LayoutGrid; badge?: number }> = [
    { id: "overview", label: "Overview", icon: LayoutGrid },
    { id: "submissions", label: "Submissions", icon: Inbox, badge: pending.length || undefined },
    { id: "projects", label: "All Projects", icon: ClipboardList },
    { id: "students", label: "Students", icon: Users },
  ];

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          icon={<ShieldCheck className="size-7" />}
          title="Could not load admin data"
          message={error}
          action={<Button onClick={() => void load()}>Try again</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase">
            <ShieldCheck className="size-4" aria-hidden /> Administration
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Admin Dashboard</h1>
          <p className="mt-1.5 text-sm text-muted">
            Review submissions, manage projects, and monitor platform activity.
          </p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-2 border-b border-line pb-px" role="tablist" aria-label="Admin sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-body",
            )}
          >
            <t.icon className="size-4" aria-hidden />
            {t.label}
            {t.badge ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-700">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ------------------------------- OVERVIEW ------------------------------ */}
      {tab === "overview" && (
        <div className="mt-8">
          {projects === null || students === null ? (
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <StatSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
                {[
                  { label: "Students", value: stats.students, icon: Users, tint: "bg-primary/8 text-primary" },
                  { label: "Total Projects", value: stats.total, icon: ClipboardList, tint: "bg-slate-100 text-slate-700" },
                  { label: "Published", value: stats.counts.published, icon: CheckCircle2, tint: "bg-green-50 text-success" },
                  { label: "Pending Review", value: stats.counts.pending, icon: Inbox, tint: "bg-amber-50 text-warning" },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", c.tint)}>
                      <c.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="font-display text-2xl leading-none font-bold text-ink">{c.value}</p>
                      <p className="mt-1 text-xs font-medium text-muted">{c.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                  <h2 className="font-display text-base font-bold text-ink">Submissions by status</h2>
                  <div className="mt-4 space-y-3">
                    {(["published", "pending", "draft", "rejected"] as ProjectStatus[]).map((s) => (
                      <div key={s}>
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="capitalize text-body">{s}</span>
                          <span className="text-muted">{stats.counts[s]}</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              s === "published" && "bg-success",
                              s === "pending" && "bg-warning",
                              s === "draft" && "bg-slate-400",
                              s === "rejected" && "bg-danger",
                            )}
                            style={{
                              width: stats.total ? `${(stats.counts[s] / stats.total) * 100}%` : "0%",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
                  <h2 className="font-display text-base font-bold text-ink">
                    Published projects by category
                  </h2>
                  <div className="mt-4 space-y-3">
                    {CATEGORIES.map((cat) => {
                      const n = stats.byCategory.get(cat) ?? 0;
                      return (
                        <div key={cat}>
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-body">{cat}</span>
                            <span className="text-muted">{n}</span>
                          </div>
                          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${(n / maxCat) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ----------------------------- SUBMISSIONS ----------------------------- */}
      {tab === "submissions" && (
        <div className="mt-8">
          {projects === null ? (
            <PageLoader label="Loading submissions…" />
          ) : pending.length === 0 ? (
            <EmptyState
              icon={<Inbox className="size-7" />}
              title="All caught up"
              message="There are no submissions waiting for review right now."
            />
          ) : (
            <ul className="space-y-4">
              {pending.map((p) => (
                <li key={p.id} className="rounded-2xl border border-line bg-white p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          href={`/projects/${p.id}`}
                          className="font-display text-base font-bold text-ink hover:text-primary"
                        >
                          {p.title}
                        </Link>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted">{p.summary}</p>
                      <p className="mt-2 text-xs text-muted">
                        By <strong className="text-body">{p.ownerName}</strong> ({p.ownerRoll})
                        · {p.category} · submitted {formatDate(p.createdAt)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {p.technologies.slice(0, 6).map((t) => (
                          <span key={t} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        size="sm"
                        loading={busyId === p.id}
                        onClick={() => setStatus(p.id, "published", "Project approved and published.")}
                      >
                        <CheckCircle2 className="size-4" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        disabled={busyId === p.id}
                        onClick={() => setRejectTarget(p)}
                      >
                        <Trash2 className="size-4" /> Reject
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ------------------------------ ALL PROJECTS ---------------------------- */}
      {tab === "projects" && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
          {projects === null ? (
            <PageLoader label="Loading projects…" />
          ) : projects.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<ClipboardList className="size-7" />}
                title="No projects yet"
                message="Projects submitted by students will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-slate-50/70 text-xs tracking-wide text-muted uppercase">
                    <th className="px-5 py-3 font-semibold">Project</th>
                    <th className="px-5 py-3 font-semibold">Owner</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Updated</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="max-w-56 px-5 py-3.5">
                        <Link href={`/projects/${p.id}`} className="block truncate font-semibold text-ink hover:text-primary">
                          {p.title}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-body">{p.ownerName}</p>
                        <p className="font-mono text-xs text-muted">{p.ownerRoll}</p>
                      </td>
                      <td className="px-5 py-3.5 text-muted">{p.category}</td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted">{formatDate(p.updatedAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          {p.status !== "published" && (
                            <button
                              onClick={() => setStatus(p.id, "published", "Project published.")}
                              disabled={busyId === p.id}
                              className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1.5 text-xs font-semibold text-success transition hover:bg-green-100 disabled:opacity-50"
                            >
                              Publish
                            </button>
                          )}
                          {p.status !== "rejected" && (
                            <button
                              onClick={() => setRejectTarget(p)}
                              disabled={busyId === p.id}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-danger transition hover:bg-red-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------- STUDENTS ------------------------------- */}
      {tab === "students" && (
        <div className="mt-8 overflow-hidden rounded-2xl border border-line bg-white">
          {students === null ? (
            <PageLoader label="Loading students…" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line bg-slate-50/70 text-xs tracking-wide text-muted uppercase">
                    <th className="px-5 py-3 font-semibold">Student</th>
                    <th className="px-5 py-3 font-semibold">Roll number</th>
                    <th className="px-5 py-3 font-semibold">Email</th>
                    <th className="px-5 py-3 font-semibold">Role</th>
                    <th className="px-5 py-3 font-semibold">Password</th>
                    <th className="px-5 py-3 font-semibold">Projects</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-semibold text-ink">{s.name}</td>
                      <td className="px-5 py-3 font-mono text-xs text-muted">{s.rollNumber}</td>
                      <td className="max-w-64 truncate px-5 py-3 text-muted">{s.email}</td>
                      <td className="px-5 py-3">
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            s.role === "admin"
                              ? "bg-ink text-white"
                              : "bg-slate-100 text-slate-600",
                          )}
                        >
                          {s.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {s.mustChangePassword ? (
                          <span className="text-xs font-semibold text-warning">Initial password</span>
                        ) : (
                          <span className="text-xs font-semibold text-success">Changed</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {s.publishedCount} pub · {s.projectCount - s.publishedCount} other
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={rejectTarget !== null}
        title="Reject this submission?"
        message={
          rejectTarget
            ? `“${rejectTarget.title}” will be marked as rejected. The student can edit and resubmit it.`
            : ""
        }
        confirmLabel="Reject submission"
        danger
        loading={rejectTarget ? busyId === rejectTarget.id : false}
        onConfirm={() => {
          if (rejectTarget) void setStatus(rejectTarget.id, "rejected", "Submission rejected.");
        }}
        onClose={() => setRejectTarget(null)}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminContent />
    </RequireAdmin>
  );
}
