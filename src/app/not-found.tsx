import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
        <Compass className="size-8" aria-hidden />
      </span>
      <p className="font-display text-sm font-bold tracking-widest text-primary uppercase">
        404
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted">
        The page you are looking for does not exist, or the project you were
        trying to open is no longer published.
      </p>
      <div className="mt-7 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Go Home
        </Link>
        <Link
          href="/explore"
          className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-semibold text-body transition hover:border-primary/50 hover:text-primary"
        >
          Explore Projects
        </Link>
      </div>
    </div>
  );
}
