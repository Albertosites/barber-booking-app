export default function ConfirmModal({ open, message, onConfirm, onCancel, confirmLabel = "Conferma", cancelLabel = "Annulla", danger = false }) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 99999,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        padding: "0 0 env(safe-area-inset-bottom, 16px) 0",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#fff",
          borderRadius: "24px 24px 16px 16px",
          padding: "28px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          boxShadow: "0 -4px 40px rgba(0,0,0,0.18)",
        }}
      >
        <p style={{ margin: 0, color: "#111", fontSize: "1rem", lineHeight: 1.5, whiteSpace: "pre-line" }}>
          {message}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            onClick={onConfirm}
            style={{
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: danger ? "#D8264C" : "#111",
              color: "#fff",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {confirmLabel}
          </button>

          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "16px",
              borderRadius: "14px",
              border: "none",
              background: "#f2f2f2",
              color: "#111",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
