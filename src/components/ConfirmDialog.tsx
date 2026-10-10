"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/Button";
import { cn } from "@/lib/utils";

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink/40 p-4 backdrop-blur-[2px] sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            className="w-full max-w-md rounded-2xl border border-line bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <span
                className={
                  danger
                    ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-danger"
                    : "flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-warning"
                }
              >
                <TriangleAlert className="size-5.5" aria-hidden />
              </span>
              <div>
                <h2 id="confirm-title" className="font-display text-lg font-bold text-ink">
                  {title}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-muted">{message}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <button
                ref={(el) => {
                  confirmRef.current = el;
                }}
                disabled={loading}
                onClick={onConfirm}
                className={cn(
                  "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white shadow-sm transition-all",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:pointer-events-none disabled:opacity-60",
                  danger
                    ? "bg-danger hover:bg-red-700"
                    : "bg-primary hover:bg-blue-700",
                )}
              >
                {loading && (
                  <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                )}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
