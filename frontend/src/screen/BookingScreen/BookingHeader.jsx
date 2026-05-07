function BookingHeader({
  setActivePage,
}) {
  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => setActivePage("home")}>
        ←
      </button>
      <div>
        <span className="eyebrow">Prenotazione</span>
        <h1>Scegli il servizio</h1>
      </div>
    </header>
  );
}

export default BookingHeader;