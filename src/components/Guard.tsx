"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageLoader } from "@/components/Skeletons";

/** Redirects to /login when anonymous; to /change-password on first login. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.mustChangePassword) {
      router.replace("/change-password");
    }
  }, [user, loading, router]);

  if (loading) return <PageLoader label="Checking your session…" />;
  if (!user) return <PageLoader label="Redirecting to login…" />;
  if (user.mustChangePassword)
    return <PageLoader label="Password change required…" />;
  return <>{children}</>;
}

export function RequirePasswordChangeAllowed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return <PageLoader label="Checking your session…" />;
  if (!user) return <PageLoader label="Redirecting to login…" />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.role !== "admin") router.replace("/dashboard");
  }, [user, loading, router]);

  if (loading) return <PageLoader label="Checking permissions…" />;
  if (!user) return <PageLoader />;
  if (user.role !== "admin") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <span className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-50 text-danger">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold text-ink">
          Administrator access required
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted">
          This area is restricted to platform administrators. If you believe
          you should have access, contact the department coordinator.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}
