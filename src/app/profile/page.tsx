"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock, Save } from "lucide-react";
import { RequireAuth } from "@/components/Guard";
import { Button } from "@/components/Button";
import { Field, Textarea } from "@/components/fields";
import { TechBadge } from "@/components/Badge";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import type { ProjectWithOwner, PublicStudentShape } from "@/lib/profile-types";

function ProfileContent() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [bio, setBio] = useState(user?.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<ProjectWithOwner[] | null>(null);

  const loadMine = useCallback(async () => {
    try {
      const res = await api.get<{ items: ProjectWithOwner[] }>("/api/projects/mine");
      setMine(res.items);
    } catch {
      /* non-fatal */
    }
  }, []);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const published = useMemo(
    () => (mine ?? []).filter((p) => p.status === "published"),
    [mine],
  );

  const techs = useMemo(() => {
    const set = new Set<string>();
    published.forEach((p) => p.technologies.forEach((t) => set.add(t)));
    return [...set].sort();
  }, [published]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.put<PublicStudentShape>("/api/students/me", {
        bio: bio.trim() || null,
      });
      setUser(updated);
      toast("Profile updated.");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const lockedRows: Array<{ label: string; value: string }> = [
    { label: "Roll number", value: user.rollNumber },
    { label: "College email", value: user.email },
    { label: "Role", value: user.role === "admin" ? "Administrator" : "Student" },
    { label: "Department", value: user.department },
    { label: "Section", value: `Section ${user.section}` },
    { label: "Batch", value: user.batch },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-xs font-bold tracking-widest text-primary uppercase">My profile</p>
      <h1 className="mt-2 font-display text-3xl font-bold text-ink">Profile settings</h1>
      <p className="mt-1.5 text-sm text-muted">
        Your academic details are managed by the university and cannot be changed
        here. You can update your short bio, which appears on your public profile
        and project pages.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
            <Lock className="size-4 text-muted" aria-hidden /> Academic record
          </h2>
          <dl className="mt-4 space-y-3">
            {lockedRows.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 border-b border-line pb-3 text-sm last:border-0 last:pb-0">
                <dt className="shrink-0 text-muted">{r.label}</dt>
                <dd className="truncate font-semibold text-body" title={r.value}>
                  {r.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <h2 className="font-display text-base font-bold text-ink">About you</h2>
            <div className="mt-4">
              <Field
                label="Short bio"
                htmlFor="bio"
                error={error ?? undefined}
                hint="Shown on your public profile. Max 300 characters."
              >
                <Textarea
                  id="bio"
                  rows={5}
                  value={bio}
                  maxLength={300}
                  placeholder="e.g. 2nd-year AI & ML student who loves building ML pipelines and web apps."
                  onChange={(e) => setBio(e.target.value)}
                />
              </Field>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted">{bio.length}/300</span>
                <Button size="sm" loading={saving} onClick={handleSave}>
                  <Save className="size-3.5" /> Save changes
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-ink">
                Published work
              </h2>
              <Link href="/dashboard" className="text-xs font-semibold text-primary hover:underline">
                Manage →
              </Link>
            </div>
            <p className="mt-1 text-sm text-muted">
              {published.length} published project{published.length === 1 ? "" : "s"}
            </p>
            {techs.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {techs.slice(0, 12).map((t) => (
                  <TechBadge key={t} name={t} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
