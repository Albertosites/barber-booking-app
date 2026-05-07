function QuickInfo({
  shopAddressLine,
  shopSettings,
}) {
  return (
    <section className="quick-info">
      <div>
        <span>Indirizzo</span>
        <strong>{shopAddressLine || "-"}</strong>
      </div>
      <div>
        <span>Orari</span>
        <strong>{shopSettings.opening_label}</strong>
      </div>
    </section>
  );
}

export default QuickInfo;