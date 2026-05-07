function BookingSummary({
  selectedService,
  selectedOperator,
  date,
  time,
  formatLongDate,
}) {
  if (!selectedService && !selectedOperator && !date && !time) return null;

  return (
    <div className="booking-summary">
      <span>Riepilogo appuntamento</span>
      <div className="summary-row">
        <p>Servizio</p>
        <strong>{selectedService ? selectedService.name : "Da scegliere"}</strong>
      </div>
      <div className="summary-row">
        <p>Operatore</p>
        <strong>{selectedOperator ? selectedOperator.name : "Da scegliere"}</strong>
      </div>
      <div className="summary-row">
        <p>Prezzo</p>
        <strong>{selectedService ? `€${selectedService.price}` : "-"}</strong>
      </div>
      <div className="summary-row">
        <p>Data</p>
        <strong>{date ? formatLongDate(date) : "-"}</strong>
      </div>
      <div className="summary-row">
        <p>Ora</p>
        <strong>{time || "-"}</strong>
      </div>
    </div>
  );
}

export default BookingSummary;