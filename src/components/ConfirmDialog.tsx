"use client";

import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm(): void;
  onCancel(): void;
  /** 추가 버튼 자리 (예: 현재 데이터 먼저 내보내기) */
  children?: ReactNode;
};

export function ConfirmDialog({ open, title, message, confirmLabel, destructive, onConfirm, onCancel, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-surface p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold">
          {title}
        </h2>
        <p className="mt-2 text-muted">{message}</p>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-5 flex gap-2">
          <button type="button" autoFocus onClick={onCancel} className="min-h-11 flex-1 rounded-xl border border-line font-semibold">
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`min-h-11 flex-1 rounded-xl font-semibold ${destructive ? "bg-danger text-white" : "bg-ink text-bg"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
