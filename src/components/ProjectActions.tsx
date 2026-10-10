"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/Button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { api, ApiClientError } from "@/lib/api-client";

export function ProjectActions({
  projectId,
  isOwner,
}: {
  projectId: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.del(`/api/projects/${projectId}`);
      toast("Project deleted.");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Could not delete project.";
      toast(message, "error");
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push(`/projects/${projectId}/edit`)}
      >
        <Pencil className="size-3.5" aria-hidden /> Edit
      </Button>
      <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
        <Trash2 className="size-3.5" aria-hidden /> Delete
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this project?"
        message="This will permanently remove the project and all of its details. This action cannot be undone."
        confirmLabel="Delete project"
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setConfirmOpen(false)}
      />
      {!isOwner && (
        <span className="w-full text-xs text-muted">
          You are viewing this as an administrator — the owner can also edit or
          delete it.
        </span>
      )}
    </div>
  );
}
