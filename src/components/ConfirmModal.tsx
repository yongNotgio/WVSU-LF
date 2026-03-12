"use client";

import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  loading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!open) return null;

  const confirmButtonClass =
    tone === "danger"
      ? "bg-lost-red text-white hover:bg-lost-red/90"
      : "bg-wvsu-blue text-white hover:bg-wvsu-blue-dark";

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-wvsu-blue-deeper/35 px-4">
      <div
        className="absolute inset-0"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md border-2 border-wvsu-blue bg-white shadow-[6px_6px_0_var(--blue)]">
        <div className="flex items-center justify-between bg-wvsu-blue px-4 py-3">
          <div className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-white font-mono">
            <AlertTriangle className="h-4 w-4" />
            Confirm Action
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-white/75 hover:text-white disabled:opacity-50"
            aria-label="Close confirmation modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <div className="font-display text-xl text-wvsu-text">{title}</div>
          <div className="text-sm leading-6 text-wvsu-muted">{description}</div>
        </div>

        <div className="flex justify-end gap-2 border-t border-wvsu-border px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="border border-wvsu-border px-4 py-2 text-xs font-bold uppercase tracking-wide text-wvsu-muted transition-colors hover:bg-wvsu-light-blue hover:text-wvsu-blue disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wide transition-colors disabled:opacity-50 ${confirmButtonClass}`}
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}