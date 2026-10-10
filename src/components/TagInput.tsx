"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { TECH_SUGGESTIONS } from "@/lib/constants";

export function TagInput({
  value,
  onChange,
  max = 25,
  placeholder = "Type a technology and press Enter",
  error,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  max?: number;
  placeholder?: string;
  error?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const tag = raw.trim().replace(/,+$/g, "");
    if (!tag) return;
    if (value.length >= max) return;
    if (value.some((t) => t.toLowerCase() === tag.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = TECH_SUGGESTIONS.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div>
      <div
        className={`flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 transition focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/60 ${
          error ? "border-danger/60" : ""
        }`}
      >
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 rounded-md bg-primary/8 py-1 pr-1 pl-2.5 text-xs font-semibold text-primary"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              className="rounded p-0.5 transition hover:bg-primary/15"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          placeholder={value.length === 0 ? placeholder : ""}
          disabled={value.length >= max}
          list="tech-suggestions"
          aria-label="Technology"
          className="min-w-32 flex-1 border-none bg-transparent py-1 text-sm text-body outline-none placeholder:text-muted/70"
        />
        <datalist id="tech-suggestions">
          {remaining.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      </div>
      {error && <p role="alert" className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}
