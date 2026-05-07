function ConfirmDeleteBookingModal({
  adminBookingToDelete,
  adminDeleteLoading,
  setAdminBookingToDelete,
  confirmDeleteAdminBooking,
  formatLongDate,
}) {
  if (!adminBookingToDelete) return null;

  return (
    <div className="modal-overlay" onClick={() => setAdminBookingToDelete(null)}>
      <div className="modal-card confirm-delete-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <span className="popup-eyebrow">Conferma eliminazione</span>
            <h2>Vuoi eliminare questa prenotazione?</h2>
          </div>

          <button className="close-modal" type="button" onClick={() => setAdminBookingToDelete(null)}>
            ×
          </button>
        </div>

        <div className="delete-booking-preview">
          <strong>{adminBookingToDelete.name}</strong>
          <p>{adminBookingToDelete.service || "Prenotazione telefonica"}</p>
          <p>Operatore: {adminBookingToDelete.operator_name || "Non assegnato"}</p>
          <span>
            {formatLongDate(adminBookingToDelete.date)} alle {adminBookingToDelete.time}
          </span>
        </div>

        <p className="delete-warning-text">
          Questa operazione non può essere annullata. La prenotazione verrà rimossa dall’agenda e l’orario tornerà disponibile.
        </p>

        <div className="confirm-delete-actions">
          <button
            className="secondary-cta"
            type="button"
            disabled={adminDeleteLoading}
            onClick={() => setAdminBookingToDelete(null)}
          >
            Annulla
          </button>

          <button
            className="danger-cta"
            type="button"
            disabled={adminDeleteLoading}
            onClick={confirmDeleteAdminBooking}
          >
            {adminDeleteLoading ? "Eliminazione..." : "Elimina prenotazione"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDeleteBookingModal;