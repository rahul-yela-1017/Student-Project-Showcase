"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, TriangleAlert } from "lucide-react";

interface Status {
  source: "mongo" | "unavailable" | "checking";
  mongoConfigured: boolean;
  serverPublicIp: string | null;
}

export function DataSourceBanner() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;
    let retries = 0;
    let timer: number | undefined;

    const poll = () => {
      fetch("/api/data-source")
        .then((r) => r.json())
        .then((j) => {
          if (cancelled || !j?.success) return;
          const data = j.data as Status;
          setStatus(data);
          if (data.source !== "mongo") {
            if (data.source === "checking" && retries < 4) {
              retries += 1;
              timer = window.setTimeout(poll, 4000 * retries);
            } else if (data.source === "unavailable") {
              timer = window.setTimeout(poll, 60_000);
            }
          }
        })
        .catch(() => {});
    };
    poll();

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  if (!status || status.source !== "unavailable") return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6">
        <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-warning" aria-hidden />
        <p className="text-xs leading-relaxed text-amber-900 sm:text-[13px]">
          <strong>MongoDB unavailable. No sample data is being shown.</strong>{" "}
          {status.mongoConfigured ? (
            <>
              This server cannot reach{" "}
              <code className="rounded bg-amber-100 px-1 font-mono">student_project_showcase</code>
              . Check the MongoDB URI and, for Atlas, allow this server&apos;s IP{" "}
              <strong className="font-mono">
                {status.serverPublicIp ?? "your server's public IP"}
              </strong>{" "}
              (or <code className="rounded bg-amber-100 px-1 font-mono">0.0.0.0/0</code> for
              development only) in Atlas under <strong>Security → Network Access</strong>.
              MongoDB is retried every 60 seconds.
            </>
          ) : (
            <>
              <code className="rounded bg-amber-100 px-1 font-mono">MONGODB_URI</code> is not
              configured. Add your Atlas connection string to{" "}
              <code className="rounded bg-amber-100 px-1 font-mono">.env.local</code>.
            </>
          )}
        </p>
        <DatabaseZap className="mt-0.5 size-4.5 shrink-0 text-amber-400" aria-hidden />
      </div>
    </div>
  );
}
