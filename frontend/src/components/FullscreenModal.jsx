import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

export default function FullscreenModal({
  open,
  onClose,
  title,
  children,
  closeDisabled = false,
  maxWidthClassName = "max-w-5xl",
}) {
  const resolvedTitle = useMemo(() => title ?? "", [title]);

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e) {
      if (e.key !== "Escape") return;
      if (closeDisabled) return;
      onClose?.();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, closeDisabled]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-20 pb-10 px-4 bg-black/70 backdrop-blur-lg"
      role="dialog"
      aria-modal="true"
      aria-label={resolvedTitle || "Dialog"}
      onMouseDown={(e) => {
        if (closeDisabled) return;
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={[
          "relative w-full",
          maxWidthClassName,
          "max-h-[85vh] overflow-hidden rounded-3xl border border-white/10",
          "bg-[rgba(10,22,46,0.9)] backdrop-blur-xl shadow-2xl",
          "animate-[uwModalIn_160ms_ease-out]",
        ].join(" ")}
      >
        {/* Glow Effects */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_10%,rgba(34,211,238,0.14),transparent_55%)]" />
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-sky-400/10 blur-3xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-100">
            {resolvedTitle}
          </h2>

          <button
            type="button"
            onClick={() => {
              if (closeDisabled) return;
              onClose?.();
            }}
            aria-label="Close"
            disabled={closeDisabled}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {/* Body */}
        <div className="relative max-h-[calc(85vh-64px)] overflow-y-auto px-6 py-5">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes uwModalIn {
          from { opacity: 0; transform: translateY(10px) scale(0.985); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    document.body
  );
}