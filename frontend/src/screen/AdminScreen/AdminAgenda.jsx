export default function AdminAgenda({
  filteredAdminBookings,
  showManualBookingForm,
  setShowManualBookingForm,
  manualBookingLoading,
  createManualBooking,
  manualName,
  setManualName,
  manualPhone,
  setManualPhone,
  manualService,
  setManualService,
  manualOperatorId,
  setManualOperatorId,
  activeOperators,
  manualDate,
  setManualDate,
  manualTime,
  setManualTime,
  manualAvailableSlots,
  adminAgendaFilter,
  setAdminAgendaFilter,
  loadAdminBookings,
  groupedAdminBookings,
  formatDateHeader,
  setAdminBookingToDelete,
}) {
  return (
    <div className="admin-panel">
      <div className="section-title">
        <h3>Agenda</h3>
        <span>{filteredAdminBookings.length} prenotazioni</span>
      </div>

      <div className="admin-help-card agenda-help-card">
        <strong>Vista appuntamenti</strong>
        <p>
          Le prenotazioni vecchie vengono eliminate automaticamente.
          Qui restano solo quelle di oggi e dei prossimi giorni.
        </p>
      </div>

      <button
        className="primary-cta manual-booking-toggle"
        type="button"
        onClick={() => setShowManualBookingForm((current) => !current)}
        disabled={manualBookingLoading}
      >
        {showManualBookingForm
          ? "Chiudi inserimento rapido"
          : "Aggiungi prenotazione a nome di cliente"}
      </button>

      {showManualBookingForm && (
        <form className="manual-booking-form" onSubmit={createManualBooking}>
          <div className="manual-booking-title">
            <span>Telefonata / banco</span>
            <strong>Blocca uno slot in agenda</strong>
            <p>
              Inserisci una nota interna o il servizio richiesto dal cliente.
            </p>
          </div>

          <label>Nome cliente</label>
          <input
            type="text"
            placeholder="Es. Marco Rossi"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            disabled={manualBookingLoading}
            required
          />

          <label>Telefono</label>
          <input
            type="tel"
            placeholder="Es. 3331234567"
            value={manualPhone}
            onChange={(e) => setManualPhone(e.target.value)}
            disabled={manualBookingLoading}
            required
          />

          <label>Servizio o nota</label>

          <input
            type="text"
            placeholder="Es. taglio, barba, sistemazione veloce..."
            value={manualService}
            onChange={(e) => setManualService(e.target.value)}
            disabled={manualBookingLoading}
          />

          <label>Operatore</label>

          <select
            value={manualOperatorId}
            onChange={(e) => {
              setManualOperatorId(e.target.value);
              setManualTime("");
            }}
            disabled={
              manualBookingLoading || activeOperators.length === 0
            }
            required
          >
            <option value="">
              {activeOperators.length > 0
                ? "Scegli operatore"
                : "Nessun operatore disponibile"}
            </option>

            {activeOperators.map((operator) => (
              <option key={operator.id} value={operator.id}>
                {operator.name}
                {operator.role ? ` · ${operator.role}` : ""}
              </option>
            ))}
          </select>

          <div className="admin-form-grid">
            <div>
              <label>Giorno</label>

              <input
  type="date"
  value={manualDate}
  min={new Date().toISOString().slice(0, 10)}
  onChange={(e) => {
    setManualDate(e.target.value);
    setManualTime("");
  }}
  disabled={manualBookingLoading}
  required
/>
            </div>

            <div>
              <label>Ora</label>

              <select
                value={manualTime}
                onChange={(e) => setManualTime(e.target.value)}
                required
                disabled={!manualDate || manualBookingLoading}
              >
                <option value="">
                  {manualDate ? "Scegli" : "Prima giorno"}
                </option>

                {manualAvailableSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            className="primary-cta"
            type="submit"
            disabled={manualBookingLoading}
          >
            {manualBookingLoading
              ? "Attendi..."
              : "Aggiungi in agenda"}
          </button>
        </form>
      )}
    <div className="admin-filter-row">
  <button type="button" className={adminAgendaFilter === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setAdminAgendaFilter("all")}>
    Tutte
  </button>

  <button type="button" className={adminAgendaFilter === "today" ? "filter-pill active" : "filter-pill"} onClick={() => setAdminAgendaFilter("today")}>
    Oggi
  </button>

  <button type="button" className={adminAgendaFilter === "upcoming" ? "filter-pill active" : "filter-pill"} onClick={() => setAdminAgendaFilter("upcoming")}>
    Prossime
  </button>
</div>

<button className="primary-cta refresh-agenda-btn" type="button" onClick={loadAdminBookings}>
  Aggiorna agenda
</button>

{filteredAdminBookings.length === 0 ? (
  <div className="empty-card compact">
    <strong>Nessuna prenotazione</strong>
    <p>Quando arriveranno appuntamenti, li vedrai qui.</p>
  </div>
) : (
  <div className="admin-agenda-groups">
    {Object.keys(groupedAdminBookings).sort().map((day) => (
      <section className="admin-day-block modern-day-block" key={day}>
        <div className="modern-day-header">
          <div>
            <span>{day}</span>
            <strong>{formatDateHeader(day)}</strong>
          </div>
          <p>{groupedAdminBookings[day].length} appuntamenti</p>
        </div>

        <div className="customer-bookings-list">
          {groupedAdminBookings[day].map((booking) => (
            <article className="modern-booking-card admin-booking-card" key={booking.id}>
              <div className="modern-booking-top">
                <div className="modern-time-pill">
                  <span>Ore</span>
                  <strong>{booking.time}</strong>
                </div>

                <div className="modern-date-block">
                  <span>Cliente</span>
                  <strong>{booking.name}</strong>
                </div>
              </div>

              <div className="modern-booking-body">
                <span>Servizio</span>
                <h3>{booking.service || "Prenotazione telefonica"}</h3>
                <p>Operatore: {booking.operator_name || "Non assegnato"}</p>
                <a className="phone-link" href={`tel:${booking.phone}`}>
                  {booking.phone}
                </a>
              </div>

              <button className="admin-delete-booking-btn" type="button" onClick={() => setAdminBookingToDelete(booking)}>
                Elimina prenotazione
              </button>
            </article>
          ))}
        </div>
      </section>
    ))}
  </div>
)}
      </div>
  );
}