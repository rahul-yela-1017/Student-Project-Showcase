"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Info, KeyRound } from "lucide-react";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/fields";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/context/AuthContext";
import { ApiClientError } from "@/lib/api-client";
import { INSTITUTE } from "@/lib/constants";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [redirecting, setRedirecting] = useState<null | "change" | "dashboard">(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.mustChangePassword ? "/change-password" : "/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const fe: typeof fieldErrors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      fe.email = "Enter a valid college email address.";
    }
    if (!password) fe.password = "Password is required.";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      const result = await login(email.trim().toLowerCase(), password, remember);
      const target = result.mustChangePassword ? "/change-password" : "/dashboard";
      setRedirecting(result.mustChangePassword ? "change" : "dashboard");
      // Give the browser a beat to paint the "redirecting" state, then go.
      window.setTimeout(() => router.replace(target), 350);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.message);
      else setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">
              Student Login
            </h1>
            <p className="mt-1 text-sm text-muted">
              Sign in with your college credentials to manage your projects.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {redirecting && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-3 text-sm font-medium text-green-800">
              <span className="mt-0.5 size-4 animate-spin rounded-full border-2 border-green-300 border-t-green-700" />
              {redirecting === "change"
                ? "Login successful. First time here — one quick step: set a new password, then you'll land on your dashboard."
                : "Login successful — taking you to your dashboard…"}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
            >
              <KeyRound className="mt-0.5 size-4 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <Field label="College email" htmlFor="email" error={fieldErrors.email}>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="25mvcsmr0545@mallareddyuniversity.ac.in"
                value={email}
                invalid={Boolean(fieldErrors.email)}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>

            <Field label="Password" htmlFor="password" error={fieldErrors.password}>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  invalid={Boolean(fieldErrors.password)}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-muted transition hover:text-body"
                >
                  {showPassword ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-4 rounded border-line accent-[#2563EB]"
                />
                Remember me
              </label>
              <Link
                href="/change-password"
                className="text-sm font-semibold text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {submitting ? "Signing in…" : "Log In"}
            </Button>
          </form>
        </div>

        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3.5 text-xs leading-relaxed text-sky-800">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong>Pre-registered {INSTITUTE.batch} students:</strong> use your
            college email (your roll number in lowercase + @{INSTITUTE.emailDomain})
            and your <strong>roll number in uppercase</strong> as the initial
            password. You will be asked to set a new password after your first
            login, then you&apos;ll land on your dashboard where you can submit
            projects.
          </p>
        </div>
      </div>
    </div>
  );
}
