function MyBookingsScreen({
  setActivePage,
  session,
  myBookings,
  deleteBooking,
  formatDateHeader,
  formatLongDate,
}) {
  return (
    <section className="screen">
      <header className="page-header my-bookings-header">
        <button className="back-btn" onClick={() => setActivePage("home")}>
          ←
        </button>
        <div>
          <span className="eyebrow">Area personale</span>
          <h1>Le tue prenotazioni</h1>
        </div>
      </header>

      {!session?.user ? (
        <div className="lookup-card">
          <div>
            <span>Accesso richiesto</span>
            <strong>Accedi per vedere solo le tue prenotazioni.</strong>
          </div>
          <button className="primary-cta" type="button" onClick={() => setActivePage("account")}>
            Accedi o registrati
          </button>
        </div>
      ) : (
        <div className="customer-bookings-list">
          {myBookings.length === 0 ? (
            <div className="empty-card compact">
              <strong>Nessuna prenotazione attiva</strong>
              <p>Quando prenoterai un appuntamento, lo troverai qui.</p>
            </div>
          ) : (
            myBookings.map((booking) => (
              <article className="modern-booking-card user-booking-card" key={booking.id}>
                <div className="modern-booking-top">
                  <div className="modern-time-pill">
                    <span>Ore</span>
                    <strong>{booking.time}</strong>
                  </div>

                  <div className="modern-date-block">
                    <span>{formatDateHeader(booking.date)}</span>
                    <strong>{formatLongDate(booking.date)}</strong>
                  </div>
                </div>

                <div className="modern-booking-body">
                  <span>Appuntamento</span>
                  <h3>{booking.service}</h3>
                  <p>{booking.name}</p>
                  {booking.operator_name && <p>Operatore: {booking.operator_name}</p>}
                </div>

                <button className="soft-cancel-btn" onClick={() => deleteBooking(booking.id)}>
                  Cancella prenotazione
                </button>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default MyBookingsScreen;