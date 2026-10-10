"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Save, Send } from "lucide-react";
import { Button } from "@/components/Button";
import { Field, Input, Select, Textarea } from "@/components/fields";
import { TagInput } from "@/components/TagInput";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";
import { ACADEMIC_YEARS, CATEGORIES } from "@/lib/constants";
import { cn, isSafeHttpUrl } from "@/lib/utils";
import type { ProjectWithOwner } from "@/lib/types";

type Mode = "create" | "edit";

export function ProjectForm({
  mode,
  initial,
}: {
  mode: Mode;
  initial?: ProjectWithOwner;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<string>(initial?.category ?? "");
  const [technologies, setTechnologies] = useState<string[]>(initial?.technologies ?? []);
  const [githubUrl, setGithubUrl] = useState(initial?.githubUrl ?? "");
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? "");
  const [teamMembers, setTeamMembers] = useState(initial?.teamMembers ?? "");
  const [academicYear, setAcademicYear] = useState(initial?.academicYear ?? "");
  const [status, setStatus] = useState<"draft" | "pending" | "published">(
    initial?.status === "rejected" ? "pending" : (initial?.status ?? "published"),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [imgPreviewFailed, setImgPreviewFailed] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (title.trim().length < 3) e.title = "Title must be at least 3 characters.";
    if (title.trim().length > 140) e.title = "Title must be under 140 characters.";
    if (summary.trim().length < 10) e.summary = "Summary must be at least 10 characters.";
    if (description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (!category) e.category = "Choose a category.";
    if (technologies.length === 0) e.technologies = "Add at least one technology.";
    if (githubUrl && !isSafeHttpUrl(githubUrl)) e.githubUrl = "Enter a valid http(s) URL.";
    if (liveUrl && !isSafeHttpUrl(liveUrl)) e.liveUrl = "Enter a valid http(s) URL.";
    if (thumbnailUrl && !isSafeHttpUrl(thumbnailUrl)) e.thumbnailUrl = "Enter a valid http(s) URL.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      description: description.trim(),
      category,
      technologies,
      githubUrl: githubUrl.trim() || null,
      liveUrl: liveUrl.trim() || null,
      thumbnailUrl: thumbnailUrl.trim() || null,
      teamMembers: teamMembers.trim() || null,
      academicYear: academicYear || null,
      status,
    };
    try {
      if (mode === "create") {
        const created = await api.post<ProjectWithOwner>("/api/projects", payload);
        toast("Project created successfully.");
        router.push(
          status === "published" ? `/projects/${created.id}` : "/dashboard",
        );
      } else {
        await api.put(`/api/projects/${initial!.id}`, payload);
        toast("Project updated successfully.");
        router.push(`/projects/${initial!.id}`);
      }
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : "Something went wrong.";
      setErrors({ form: message });
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const statusOptions: Array<{
    value: "published" | "pending" | "draft";
    label: string;
    desc: string;
  }> = [
    { value: "published", label: "Publish", desc: "Visible to everyone immediately" },
    { value: "pending", label: "Submit for review", desc: "An administrator approves it first" },
    { value: "draft", label: "Draft", desc: "Only you can see it" },
  ];

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {errors.form && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errors.form}
        </div>
      )}

      <div className="grid gap-5 rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Project details</h2>

        <Field label="Project title" htmlFor="title" error={errors.title}>
          <Input
            id="title"
            value={title}
            invalid={Boolean(errors.title)}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI Resume Analyzer"
            maxLength={140}
          />
        </Field>

        <Field
          label="Short summary"
          htmlFor="summary"
          error={errors.summary}
          hint="One or two sentences shown on cards. (min 10, max 300 characters)"
        >
          <Input
            id="summary"
            value={summary}
            invalid={Boolean(errors.summary)}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="A short, clear description of your project"
            maxLength={300}
          />
        </Field>

        <Field
          label="Detailed description"
          htmlFor="description"
          error={errors.description}
          hint="What does it do? What problem does it solve? How did you build it?"
        >
          <Textarea
            id="description"
            rows={6}
            value={description}
            invalid={Boolean(errors.description)}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your project in detail…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category" error={errors.category}>
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>
                Select a category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Academic year" htmlFor="year" optional>
            <Select
              id="year"
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            >
              <option value="">Not specified</option>
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Technologies used"
          error={errors.technologies}
          hint="Press Enter after each technology. e.g. React, Python, FastAPI, MongoDB"
        >
          <TagInput value={technologies} onChange={setTechnologies} error={errors.technologies} />
        </Field>

        <Field
          label="GitHub repository"
          htmlFor="github"
          error={errors.githubUrl}
          optional
          hint="https://github.com/username/repository"
        >
          <Input
            id="github"
            type="url"
            value={githubUrl}
            invalid={Boolean(errors.githubUrl)}
            onChange={(e) => setGithubUrl(e.target.value)}
            placeholder="https://github.com/your-name/your-project"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Live demo URL" htmlFor="live" error={errors.liveUrl} optional>
            <Input
              id="live"
              type="url"
              value={liveUrl}
              invalid={Boolean(errors.liveUrl)}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://your-app.vercel.app"
            />
          </Field>

          <Field label="Team members" htmlFor="team" optional>
            <Input
              id="team"
              value={teamMembers}
              onChange={(e) => setTeamMembers(e.target.value)}
              placeholder="Comma-separated names (optional)"
              maxLength={300}
            />
          </Field>
        </div>

        <Field
          label="Cover image URL"
          htmlFor="thumbnail"
          error={errors.thumbnailUrl}
          optional
          hint="Direct image link (jpg/png). A clean placeholder is used when empty."
        >
          <Input
            id="thumbnail"
            type="url"
            value={thumbnailUrl}
            invalid={Boolean(errors.thumbnailUrl)}
            onChange={(e) => {
              setThumbnailUrl(e.target.value);
              setImgPreviewFailed(false);
            }}
            placeholder="https://example.com/cover.jpg"
          />
          {thumbnailUrl && !imgPreviewFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnailUrl}
              alt="Cover preview"
              onError={() => setImgPreviewFailed(true)}
              className="mt-2 h-28 w-full rounded-lg border border-line object-cover"
            />
          )}
        </Field>
      </div>

      <div className="rounded-2xl border border-line bg-white p-5 sm:p-6">
        <h2 className="font-display text-lg font-bold text-ink">Visibility</h2>
        <p className="mt-1 text-sm text-muted">
          Published projects appear on the Explore page. Submissions for review
          are visible to administrators until approved.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Publishing option">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={status === opt.value}
              onClick={() => setStatus(opt.value)}
              className={cn(
                "rounded-xl border p-4 text-left transition-all",
                status === opt.value
                  ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                  : "border-line bg-white hover:border-primary/40",
              )}
            >
              <p className={cn("text-sm font-bold", status === opt.value ? "text-primary" : "text-ink")}>
                {opt.label}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" loading={submitting} size="lg">
          {submitting ?
            "Saving…" : mode === "create" ? <><Send className="size-4" /> Create Project</> : <><Save className="size-4" /> Save Changes</>}
        </Button>
      </div>
    </form>
  );
}
