import { useState } from "react";

export function useConfirm() {
  const [confirmState, setConfirmState] = useState({ open: false, message: "", resolve: null, danger: false });

  function showConfirm(message, danger = false) {
    return new Promise((resolve) => {
      setConfirmState({ open: true, message, resolve, danger });
    });
  }

  function handleConfirmChoice(result) {
    setConfirmState((prev) => {
      if (prev.resolve) prev.resolve(result);
      return { open: false, message: "", resolve: null, danger: false };
    });
  }

  return { confirmState, showConfirm, handleConfirmChoice };
}
