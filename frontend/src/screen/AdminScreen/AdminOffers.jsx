function AdminOffers({
  adminOffers,
  createAdminOffer,
  updateAdminOfferField,
  saveAdminOffer,
  deleteAdminOffer,
  offerSaving,
  offerDeletingId,
}) {
  return (
    <div className="admin-panel">
      <div className="section-title">
        <h3>Offerte</h3>
        <span>{adminOffers.length} offerte</span>
      </div>

      <div className="admin-help-card">
        <strong>Promozioni visibili ai clienti</strong>
        <p>
          Qui puoi creare offerte da mostrare nella Home e nella schermata di prenotazione.
        </p>
      </div>

      <button
        className="admin-ghost-card"
        type="button"
        onClick={createAdminOffer}
        disabled={offerSaving}
      >
        <span>+</span>
        <strong>{offerSaving ? "Creazione..." : "Aggiungi offerta"}</strong>
      </button>

      <div className="admin-service-groups">
        {adminOffers.length === 0 ? (
          <div className="empty-card compact">
            <strong>Nessuna offerta configurata</strong>
            <p>Aggiungi una promozione per mostrarla ai clienti.</p>
          </div>
        ) : (
          adminOffers.map((item) => (
            <article className="admin-edit-card" key={item.id}>
              <div className="admin-form-grid">
                <div>
                  <label>Titolo offerta</label>
                  <input
                    type="text"
                    value={item.title || ""}
                    onChange={(e) => updateAdminOfferField(item.id, "title", e.target.value)}
                    placeholder="Es. Mercoledì Taglio + Shampoo a 10€"
                  />
                </div>
              </div>

              <label>Descrizione</label>
              <input
                type="text"
                value={item.description || ""}
                onChange={(e) => updateAdminOfferField(item.id, "description", e.target.value)}
                placeholder="Es. Promo valida solo il mercoledì."
              />

               <label className="admin-toggle-row">
  <input
    type="checkbox"
    checked={Boolean(item.active)}
    onChange={(e) => {
      const nextActive = e.target.checked;
      updateAdminOfferField(item.id, "active", nextActive);
      saveAdminOffer({ ...item, active: nextActive });
    }}
  />
  <span>{item.active ? "Offerta visibile ai clienti" : "Offerta nascosta"}</span>
</label>

              <button
                className="primary-cta"
                type="button"
                disabled={offerSaving}
                onClick={() => saveAdminOffer(item)}
              >
                {offerSaving ? "Salvataggio..." : "Salva offerta"}
              </button>

              <button
                className="admin-delete-booking-btn"
                type="button"
                disabled={offerDeletingId === item.id}
                onClick={() => deleteAdminOffer(item)}
              >
                {offerDeletingId === item.id ? "Eliminazione..." : "Elimina offerta"}
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

export default AdminOffers;