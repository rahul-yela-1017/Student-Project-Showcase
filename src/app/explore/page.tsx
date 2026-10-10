"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Blocks, Eraser, Search } from "lucide-react";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectCardSkeleton } from "@/components/Skeletons";
import { EmptyState } from "@/components/EmptyState";
import { Pagination } from "@/components/Pagination";
import { Input, Select } from "@/components/fields";
import { Button } from "@/components/Button";
import { api } from "@/lib/api-client";
import { CATEGORIES } from "@/lib/constants";
import type { ProjectWithOwner } from "@/lib/types";

const PAGE_SIZE = 9;

interface ListResponse {
  items: ProjectWithOwner[];
  total: number;
  page: number;
  pages: number;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [tech, setTech] = useState("");
  const [student, setStudent] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [techs, setTechs] = useState<string[]>([]);
  const [debouncedQ, setDebouncedQ] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);

  const hasFilters = useMemo(
    () => Boolean(debouncedQ || category || tech || student || sort !== "newest"),
    [debouncedQ, category, tech, student, sort],
  );

  const loadTechs = useCallback(async () => {
    try {
      const res = await api.get<{ techs: string[] }>("/api/techs");
      setTechs(res.techs);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadTechs();
  }, [loadTechs]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });
    if (debouncedQ) params.set("q", debouncedQ);
    if (category) params.set("category", category);
    if (tech) params.set("tech", tech);
    if (student) params.set("student", student);

    api
      .get<ListResponse>(`/api/projects?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load projects.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, category, tech, student, sort, page]);

  const clearFilters = () => {
    setQ("");
    setCategory("");
    setTech("");
    setStudent("");
    setSort("newest");
    setPage(1);
  };

  const shownFrom = data && data.total > 0 ? (data.page - 1) * PAGE_SIZE + 1 : 0;
  const shownTo = data ? Math.min(data.total, data.page * PAGE_SIZE) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-widest text-primary uppercase">Discovery</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Explore Projects</h1>
          <p className="mt-1.5 text-sm text-muted">
            {data
              ? `${data.total} published project${data.total === 1 ? "" : "s"}${
                  hasFilters ? " match your filters" : " on the platform"
                }`
              : "Loading projects…"}
          </p>
        </div>
        <Link
          href="/projects/new"
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          + Showcase Your Project
        </Link>
      </div>

      {/* Filter bar */}
      <div className="mt-6 rounded-2xl border border-line bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_0.8fr_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              aria-label="Search projects"
              placeholder="Search by title or description…"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Filter by technology"
            value={tech}
            onChange={(e) => {
              setTech(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All technologies</option>
            {techs.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input
            aria-label="Filter by student name"
            placeholder="Student name…"
            value={student}
            onChange={(e) => {
              setStudent(e.target.value);
              setPage(1);
            }}
          />
          <Select
            aria-label="Sort projects"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Title A–Z</option>
            <option value="za">Title Z–A</option>
          </Select>
          <Button
            variant="outline"
            onClick={clearFilters}
            disabled={!hasFilters}
            title="Clear all filters"
          >
            <Eraser className="size-4" aria-hidden /> Clear
          </Button>
        </div>
      </div>

      {/* Results */}
      {error ? (
        <EmptyState
          className="mt-8"
          icon={<Blocks className="size-7" />}
          title="Could not load projects"
          message={error}
          action={<Button onClick={() => setPage(1)}>Try again</Button>}
        />
      ) : loading && !data ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <EmptyState
          className="mt-8"
          icon={<Blocks className="size-7" />}
          title="No projects found"
          message={
            hasFilters
              ? "Nothing matches your current search and filters. Try broadening them."
              : "No published projects yet. Be the first to share yours with the batch."
          }
          action={
            hasFilters ? (
              <Button variant="outline" onClick={clearFilters}>
                <Eraser className="size-4" /> Clear filters
              </Button>
            ) : (
              <Link
                href="/login"
                className="inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Publish a project
              </Link>
            )
          }
        />
      ) : (
        <>
          {data && data.total > 0 && (
            <p className="mt-6 text-xs font-medium text-muted" aria-live="polite">
              Showing {shownFrom}–{shownTo} of {data.total}
              {loading && " (updating…)" }
            </p>
          )}
          <div
            className={`mt-4 grid gap-6 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
              loading ? "opacity-60" : ""
            }`}
          >
            {data?.items.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
          <div className="mt-10">
            <Pagination
              page={data?.page ?? 1}
              pages={data?.pages ?? 1}
              onChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" />}>
      <ExploreContent />
    </Suspense>
  );
}
