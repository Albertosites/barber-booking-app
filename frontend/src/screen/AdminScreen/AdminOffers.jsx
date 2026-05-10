function AdminOffers({
  adminOffers,
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
          Qui potrai aggiungere offerte da mostrare nella Home e nella schermata di prenotazione.
        </p>
      </div>

      <div className="empty-card compact">
        <strong>Sezione offerte pronta</strong>
        <p>Nel prossimo step aggiungiamo il form per creare la prima offerta.</p>
      </div>
    </div>
  );
}

export default AdminOffers;