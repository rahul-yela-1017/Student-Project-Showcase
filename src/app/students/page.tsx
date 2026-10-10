"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { Input } from "@/components/fields";
import { Pagination } from "@/components/Pagination";
import { EmptyState } from "@/components/EmptyState";
import { PageLoader } from "@/components/Skeletons";
import { api } from "@/lib/api-client";
import { initials } from "@/lib/utils";

interface DirectoryItem {
  id: string;
  rollNumber: string;
  name: string;
  projectCount: number;
}

function DirectoryContent() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<DirectoryItem[] | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedQ) params.set("q", debouncedQ);
    api
      .get<{ items: DirectoryItem[]; total: number; pages: number }>(
        `/api/students?${params.toString()}`,
      )
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
        setPages(res.pages);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setPages(1);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div>
        <p className="text-xs font-bold tracking-widest text-primary uppercase">The batch</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink">Students</h1>
        <p className="mt-1.5 text-sm text-muted">
          {total} registered student{total === 1 ? "" : "s"} from B.Tech CSE (AI &amp; ML),
          Section G, Batch 2025-2029.
        </p>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <Input
          aria-label="Search students"
          placeholder="Search by name or roll number…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && items === null ? (
        <PageLoader label="Loading students…" />
      ) : items && items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Users className="size-7" />}
          title="No students found"
          message={`No students match “${debouncedQ}”. Try a different name or roll number.`}
        />
      ) : (
        <div className={`mt-8 grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-60" : ""}`}>
          {items?.map((s) => (
            <Link
              key={s.id}
              href={`/students/${s.rollNumber}`}
              className="group flex items-center gap-3.5 rounded-2xl border border-line bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {initials(s.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink group-hover:text-primary">
                  {s.name}
                </p>
                <p className="mt-0.5 font-mono text-xs text-muted">{s.rollNumber}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                {s.projectCount} project{s.projectCount === 1 ? "" : "s"}
              </span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Pagination
          page={page}
          pages={pages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DirectoryContent />
    </Suspense>
  );
}
