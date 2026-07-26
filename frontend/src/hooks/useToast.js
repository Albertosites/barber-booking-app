import { useState } from "react";

export function useToast() {
  const [toastState, setToastState] = useState({ open: false, message: "", type: "info" });

  function showToast(message, type) {
    if (!type) {
      const lower = String(message).toLowerCase();
      if (
        lower.includes("non è stato possibile") || lower.includes("errore nel") ||
        lower.startsWith("errore") || lower.includes("impossibile") ||
        lower.includes("non riuscit") || lower.includes("accesso non riuscito") ||
        lower.includes("eliminat") || lower.includes("rimoss") || lower.includes("cancellat")
      ) {
        type = "error";
      } else if (
        lower.includes("aggiunto") || lower.includes("creato") || lower.includes("aggiornato") ||
        lower.includes("aggiornata") || lower.includes("aggiornati") || lower.includes("confermata") ||
        lower.includes("salvata") || lower.includes("caricata") || lower.includes("completat") ||
        lower.includes("inviato") || lower.includes("collegato") || lower.includes("correttamente") ||
        lower.includes("operatore aggiunto") || lower.includes("foto") || lower.includes("prenotazione confermata")
      ) {
        type = "success";
      } else {
        type = "info";
      }
    }
    setToastState({ open: true, message, type });
  }

  function closeToast() {
    setToastState((s) => ({ ...s, open: false }));
  }

  return { toastState, showToast, closeToast };
}
