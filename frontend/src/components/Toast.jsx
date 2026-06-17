import { useEffect, useRef } from "react";

function Toast({ open, message, type = "info", onClose }) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(onClose, 3500);
    return () => clearTimeout(timerRef.current);
  }, [open, message, onClose]);

  if (!open) return null;

  return (
    <div className={`toast toast-${type}`} role="alert" onClick={onClose}>
      <span className="toast-icon">
        {type === "success" ? "✓" : type === "error" ? "✕" : "i"}
      </span>
      <p>{message}</p>
    </div>
  );
}

export default Toast;
