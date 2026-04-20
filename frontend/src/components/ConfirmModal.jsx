export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  danger = true,
  hideConfirm = false,
}) {
  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="modal-panel max-w-md p-6 md:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h2 id="confirm-modal-title" className="text-lg font-semibold text-white">
          {title}
        </h2>
        {message && <p className="mt-3 text-sm leading-relaxed text-slate-400">{message}</p>}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          {!hideConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white transition duration-200 disabled:opacity-50 ${
                danger
                  ? "bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-900/30 hover:from-red-500 hover:to-red-400"
                  : "btn-primary"
              }`}
            >
              {loading ? "Please wait…" : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
