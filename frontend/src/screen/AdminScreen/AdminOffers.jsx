import { useState } from "react";

function AdminOffers({
  adminOffers,
  createAdminOffer,
  updateAdminOfferField,
  saveAdminOffer,
  deleteAdminOffer,
  offerSaving,
  offerDeletingId,
}) {
  const [editingOfferId, setEditingOfferId] = useState("");

  const hasOffer = adminOffers.length > 0;

  async function handleCreateOffer() {
    const created = await createAdminOffer();

    if (created) {
      setEditingOfferId("new");
    }
  }

  async function handleSaveOffer(item) {
    const saved = await saveAdminOffer({ ...item, active: true });

    if (saved) {
      setEditingOfferId("");
    }
  }

  return (
    <div className="admin-panel">
      <div className="section-title">
        <h3>Offerte</h3>
        <span>{adminOffers.length} offerte</span>
      </div>

      <div className="admin-help-card">
        <strong>Promozione visibile ai clienti</strong>
        <p>
          Puoi mostrare una sola offerta alla volta nella Home e nella schermata di prenotazione.
        </p>
      </div>

      {!hasOffer && (
        <button
          className="admin-ghost-card"
          type="button"
          onClick={handleCreateOffer}
          disabled={offerSaving}
        >
          <span>+</span>
          <strong>{offerSaving ? "Creazione..." : "Aggiungi offerta"}</strong>
        </button>
      )}

      <div className="admin-service-groups">
        {adminOffers.length === 0 ? (
          <div className="empty-card compact">
            <strong>Nessuna offerta configurata</strong>
            <p>Aggiungi una promozione per mostrarla ai clienti.</p>
          </div>
        ) : (
          adminOffers.map((item) => {
            const isEditing = editingOfferId === item.id || editingOfferId === "new";

            return (
              <article className="admin-offer-card" key={item.id}>
                {!isEditing ? (
                  <>
                    <div className="offer-banner admin-offer-preview">
                      <span className="offer-banner-label">Offerta attiva</span>
                      <strong>{item.title || "Nuova offerta"}</strong>
                      {item.description && <p>{item.description}</p>}
                    </div>

                    <button
                      className="primary-cta"
                      type="button"
                      onClick={() => setEditingOfferId(item.id)}
                    >
                      Modifica offerta
                    </button>

                    <button
                      className="admin-delete-booking-btn"
                      type="button"
                      disabled={offerDeletingId === item.id}
                      onClick={() => deleteAdminOffer(item)}
                    >
                      {offerDeletingId === item.id ? "Eliminazione..." : "Elimina offerta"}
                    </button>
                  </>
                ) : (
                  <div className="offer-banner admin-offer-form">
                    <span className="offer-banner-label">Modifica offerta</span>

                    <label>Titolo offerta</label>
                    <input
                      type="text"
                      value={item.title || ""}
                      onChange={(e) => updateAdminOfferField(item.id, "title", e.target.value)}
                      placeholder="Es. Mercoledì Taglio + Shampoo a 10€"
                    />

                    <label>Descrizione</label>
                    <input
                      type="text"
                      value={item.description || ""}
                      onChange={(e) => updateAdminOfferField(item.id, "description", e.target.value)}
                      placeholder="Es. Promo valida solo il mercoledì."
                    />

                    <button
                      className="primary-cta"
                      type="button"
                      disabled={offerSaving}
                      onClick={() => handleSaveOffer(item)}
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
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}

export default AdminOffers;