"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Check, KeyRound, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/fields";
import { Logo } from "@/components/Logo";
import { RequirePasswordChangeAllowed } from "@/components/Guard";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import { passwordStrengthIssues } from "@/lib/validators";

function ChangePasswordForm() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !user.mustChangePassword) {
      // Optional route — still allow updating password when already set.
    }
  }, [user]);

  const missing = passwordStrengthIssues(next);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const fe: Record<string, string> = {};
    if (!current) fe.current = "Current password is required.";
    if (missing.length > 0) fe.next = "Password does not meet the strength requirements.";
    if (next !== confirm) fe.confirm = "Passwords do not match.";
    setFieldErrors(fe);
    if (Object.keys(fe).length > 0) return;

    setSubmitting(true);
    try {
      const { student } = await api.post<{ student: NonNullable<typeof user> }>(
        "/api/auth/change-password",
        {
          currentPassword: current,
          newPassword: next,
          confirmPassword: confirm,
        },
      );
      setUser(student);
      toast("Password updated successfully.");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Something went wrong. Please try again.");
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
              {user?.mustChangePassword ? "Set a new password" : "Change password"}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {user?.mustChangePassword
                ? "For security, you must replace your initial password before continuing."
                : "You can update your password at any time. Your new password will be used the next time you log in."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {user?.mustChangePassword && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm font-medium text-amber-800">
              <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
              This step is mandatory for first-time users.
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
            <Field label="Current password" htmlFor="current" error={fieldErrors.current}>
              <Input
                id="current"
                type="password"
                autoComplete="current-password"
                value={current}
                invalid={Boolean(fieldErrors.current)}
                onChange={(e) => setCurrent(e.target.value)}
              />
            </Field>

            <Field label="New password" htmlFor="next" error={fieldErrors.next}>
              <Input
                id="next"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={next}
                invalid={Boolean(fieldErrors.next)}
                onChange={(e) => setNext(e.target.value)}
              />
            </Field>

            {next.length > 0 && (
              <ul className="grid grid-cols-1 gap-1.5 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
                {["At least 8 characters", "One uppercase letter", "One lowercase letter", "One number"].map(
                  (rule) => {
                    const done = !missing.includes(rule);
                    return (
                      <li
                        key={rule}
                        className={`flex items-center gap-1.5 text-xs font-medium ${done ? "text-success" : "text-muted"}`}
                      >
                        {done ? <Check className="size-3.5" /> : <X className="size-3.5" />}
                        {rule}
                      </li>
                    );
                  },
                )}
              </ul>
            )}

            <Field label="Confirm new password" htmlFor="confirm" error={fieldErrors.confirm}>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                autoComplete="new-password"
                value={confirm}
                invalid={Boolean(fieldErrors.confirm)}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>

            <Button type="submit" size="lg" loading={submitting} className="w-full">
              {submitting ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  return (
    <RequirePasswordChangeAllowed>
      <ChangePasswordForm />
    </RequirePasswordChangeAllowed>
  );
}
