import Link from "next/link";
import { ArrowRight, Blocks, Cpu, Sparkles, Users } from "lucide-react";
import { homeStats } from "@/lib/data";
import { CATEGORIES, INSTITUTE } from "@/lib/constants";
import { ProjectCard } from "@/components/ProjectCard";
import { CategoryIconTile } from "@/components/CategoryIcon";
import { FadeIn } from "@/components/FadeIn";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let stats: Awaited<ReturnType<typeof homeStats>> | null = null;
  try {
    stats = await homeStats();
  } catch {
    stats = null;
  }

  const publishedCount = stats?.publishedCount ?? 0;
  const studentsCount = stats?.studentsCount ?? 0;
  const techCount = stats?.techCount ?? 0;
  const catCounts = stats?.catCounts ?? {};
  const recent = stats?.recent ?? [];

  return (
    <div>
      {/* ------------------------------- Hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.07),transparent_55%)]"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-4 pt-10 pb-12 sm:gap-12 sm:px-6 sm:pt-14 sm:pb-16 lg:grid-cols-2 lg:pt-20 lg:pb-24">
          <FadeIn>
            <span className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-xs font-semibold text-body shadow-sm">
              <Sparkles className="size-3.5 text-primary" aria-hidden />
              {INSTITUTE.course} · {INSTITUTE.department} · {INSTITUTE.batch}
            </span>
            <h1 className="mt-5 font-display text-3xl leading-[1.12] font-bold tracking-tight text-ink min-[390px]:text-4xl sm:text-5xl lg:text-[3.4rem]">
              Discover Ideas. Explore Innovation.{" "}
              <span className="text-primary">Showcase Your Work.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              A centralized platform for {INSTITUTE.name} students to publish
              projects, share technical skills, and discover innovative work
              created by their peers.
            </p>
            <div className="mt-7 flex flex-col gap-3 min-[480px]:flex-row sm:mt-8">
              <Link
                href="/explore"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 min-[480px]:w-auto min-[480px]:px-6 min-[480px]:text-base"
              >
                Explore Projects <ArrowRight className="size-4.5" aria-hidden />
              </Link>
              <Link
                href="/login"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-line bg-white px-5 text-sm font-semibold text-body transition hover:border-primary/50 hover:text-primary min-[480px]:w-auto min-[480px]:px-6 min-[480px]:text-base"
              >
                Showcase Your Project
              </Link>
            </div>
            <div className="mt-8 grid max-w-md grid-cols-3 gap-3 min-[480px]:mt-10 min-[480px]:gap-4">
              <div>
                <p className="font-display text-2xl font-bold text-ink">{publishedCount}</p>
                <p className="text-xs font-medium text-muted">Published projects</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-ink">{studentsCount}</p>
                <p className="text-xs font-medium text-muted">Registered students</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold text-ink">{techCount}</p>
                <p className="text-xs font-medium text-muted">Technologies used</p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.12} className="relative">
            <div className="relative isolate overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-3 shadow-xl shadow-slate-900/5 min-[390px]:p-4 sm:rounded-3xl sm:p-8">
              <div aria-hidden className="pointer-events-none absolute -right-14 -top-16 size-56 rounded-full bg-blue-200/40 blur-3xl" />
              <div aria-hidden className="pointer-events-none absolute -bottom-16 -left-12 size-52 rounded-full bg-indigo-200/50 blur-3xl" />
              <div className="relative rounded-xl border border-white/80 bg-white/75 p-3 shadow-lg shadow-blue-900/5 backdrop-blur min-[390px]:p-4 sm:rounded-2xl sm:p-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-primary uppercase">Student showcase</p>
                    <p className="mt-1 font-display text-lg font-bold text-ink">Ideas in motion</p>
                  </div>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-white shadow-md shadow-blue-600/20">
                    <Sparkles className="size-5" aria-hidden />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 py-4 sm:gap-3 sm:py-5">
                  <div className="rounded-xl bg-blue-50 p-3 sm:p-4">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white text-primary shadow-sm"><Cpu className="size-4.5" aria-hidden /></span>
                    <p className="mt-3 text-sm font-bold text-ink">Build with AI</p>
                    <p className="mt-1 text-xs text-muted">Turn research into working projects.</p>
                  </div>
                  <div className="rounded-xl bg-indigo-50 p-3 sm:p-4">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm"><Blocks className="size-4.5" aria-hidden /></span>
                    <p className="mt-3 text-sm font-bold text-ink">Share your work</p>
                    <p className="mt-1 text-xs text-muted">Showcase ideas with your peers.</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Users className="size-4.5" aria-hidden /></span>
                  <div>
                    <p className="text-xs font-bold text-ink">Made by students, for students</p>
                    <p className="mt-0.5 text-[11px] text-muted">Discover what your batch is creating</p>
                  </div>
                  <span className="ml-auto size-2 rounded-full bg-emerald-500" aria-hidden />
                </div>
              </div>
            </div>
            <FadeIn delay={0.3}>
              <div className="absolute -bottom-4 left-4 hidden items-center gap-2.5 rounded-xl border border-line bg-white/95 px-4 py-3 shadow-lg backdrop-blur sm:flex">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Cpu className="size-4" aria-hidden />
                </span>
                <div className="leading-tight">
                  <p className="text-xs font-bold text-ink">AI &amp; ML focused</p>
                  <p className="text-[11px] text-muted">Section {INSTITUTE.section} · Batch {INSTITUTE.batch}</p>
                </div>
              </div>
            </FadeIn>
          </FadeIn>
        </div>
      </section>

      {/* ----------------------------- Stats strip ---------------------------- */}
      <section className="border-y border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4">
          {[
            { icon: Blocks, label: "Published projects", value: publishedCount },
            { icon: Users, label: "Registered students", value: studentsCount },
            { icon: Sparkles, label: "Technology categories", value: CATEGORIES.length },
            { icon: Cpu, label: "Technologies showcased", value: techCount },
          ].map((s, i) => (
            <FadeIn key={s.label} delay={i * 0.05} className="flex items-center gap-3.5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <s.icon className="size-5.5" aria-hidden />
              </span>
              <div>
                <p className="font-display text-2xl leading-none font-bold text-ink">{s.value}</p>
                <p className="mt-1 text-xs font-medium text-muted">{s.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ----------------------------- Categories ----------------------------- */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-16 sm:px-6 lg:py-20">
        <FadeIn className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary uppercase">Browse by field</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-ink">Project Categories</h2>
            <p className="mt-2 max-w-lg text-sm text-muted">
              Every category from the AI &amp; ML curriculum — find projects by the
              field they belong to.
            </p>
          </div>
          <Link href="/explore" className="text-sm font-semibold text-primary hover:underline">
            View all projects →
          </Link>
        </FadeIn>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat, i) => (
            <FadeIn key={cat} delay={Math.min(i * 0.04, 0.3)}>
              <Link
                href={`/explore?category=${encodeURIComponent(cat)}`}
                className="group flex h-full flex-col gap-3 rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <CategoryIconTile category={cat} />
                <div>
                  <p className="text-sm font-bold text-ink group-hover:text-primary">{cat}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {catCounts[cat] ?? 0} project{(catCounts[cat] ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>
            </FadeIn>
          ))}
          <FadeIn delay={0.32} className="col-span-2 sm:col-span-3 lg:col-span-4">
            <div className="flex h-full flex-col justify-center rounded-2xl border border-line bg-gradient-to-br from-ink to-slate-800 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-bold">Don&apos;t see your field?</p>
                <p className="mt-1 text-sm text-slate-300">
                  Pick “Other” and tag your technologies — filters will pick them up automatically.
                </p>
              </div>
              <Link
                href="/explore"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink transition hover:bg-slate-100 sm:mt-0"
              >
                Explore all <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ------------------------- Recently published ------------------------- */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
          <FadeIn className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-widest text-primary uppercase">Fresh on the platform</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-ink">Recently Published</h2>
            </div>
            <Link href="/explore" className="text-sm font-semibold text-primary hover:underline">
              View all projects →
            </Link>
          </FadeIn>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.length > 0 ? (
              recent.map((p, i) => (
                <FadeIn key={p.id} delay={i * 0.07}>
                  <ProjectCard project={p} />
                </FadeIn>
              ))
            ) : (
              <FadeIn className="sm:col-span-2 lg:col-span-3">
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-canvas px-6 py-16 text-center">
                  <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/8 text-primary">
                    <Blocks className="size-7" aria-hidden />
                  </span>
                  <h3 className="font-display text-lg font-bold text-ink">No published projects yet</h3>
                  <p className="mt-1.5 max-w-sm text-sm text-muted">
                    Be the first to share your work with the batch. Your project can
                    be live in under two minutes.
                  </p>
                  <Link
                    href="/login"
                    className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Publish your first project
                  </Link>
                </div>
              </FadeIn>
            )}
          </div>
        </div>
      </section>

      {/* --------------------------------- CTA --------------------------------- */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <FadeIn>
          <div className="relative overflow-hidden rounded-3xl bg-ink px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.25),transparent_60%)]"
            />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-white sm:text-4xl">
                Built something brilliant? Share it with your batch.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-300">
                Publish your project, link your GitHub repository and live demo,
                and let your future recruiters see what you can build.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center gap-2 rounded-lg bg-primary px-7 text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  Showcase Your Project <ArrowRight className="size-4.5" aria-hidden />
                </Link>
                <Link
                  href="/students"
                  className="inline-flex h-12 items-center rounded-lg border border-white/20 bg-white/5 px-7 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Meet Your Peers
                </Link>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
