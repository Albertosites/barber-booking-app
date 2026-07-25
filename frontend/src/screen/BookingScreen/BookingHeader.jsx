function BookingHeader({
  setActivePage,
}) {
  return (
    <header className="page-header">
      <button className="back-btn" onClick={() => setActivePage("home")}>
        ←
      </button>
      <div>
        <span className="eyebrow">Salone</span>
        <h1>Prenotazione</h1>
      </div>
    </header>
  );
}

export default BookingHeader;