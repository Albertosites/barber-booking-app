import {
  Scissors,
  Sparkles,
  Shield,
  Crown,
  Brush,
  UserCircle2,
} from "lucide-react";
import { useState } from "react";

function BookingForm({
  bookingAvailabilityNotice,
  serviceCategories,
  servicesLoading,
  service,
  setService,
  operatorId,
  setOperatorId,
  activeOperators,
  date,
  setDate,
  time,
  setTime,
  availableSlots,
  loading,
  handleSubmit,
}) {
  const [openCategory, setOpenCategory] = useState("");

  return (
    <form className="booking-form" onSubmit={handleSubmit}>
      <div className="section-title">
    
      </div>

      {servicesLoading ? (
        <div className="empty-card compact">
          <strong>Caricamento servizi</strong>
          <p>Stiamo recuperando i servizi aggiornati del salone.</p>
        </div>
      ) : (
        <div className="booking-service-groups">
          {serviceCategories.map((group) => {
            const isOpen = openCategory === group.category;
            const hasSelectedService = group.services.some((item) => item.name === service);

            const getCategoryIcon = (category) => {
  const value = String(category || "").toLowerCase();

  if (value.includes("taglio")) {
    return <Scissors size={22} strokeWidth={2.2} />;
  }

  if (value.includes("barba")) {
    return <Shield size={22} strokeWidth={2.2} />;
  }

  if (value.includes("premium")) {
    return <Crown size={22} strokeWidth={2.2} />;
  }

  if (value.includes("colore")) {
    return <Brush size={22} strokeWidth={2.2} />;
  }

  if (value.includes("skin") || value.includes("face")) {
    return <Sparkles size={22} strokeWidth={2.2} />;
  }

  return <UserCircle2 size={22} strokeWidth={2.2} />;
};
              return (
              <section
                className={
                  isOpen || hasSelectedService
                    ? "booking-service-group open"
                    : "booking-service-group"
                }
                key={group.category}
              >
                <button
                  type="button"
                  className="booking-service-group-title"
                  onClick={() => setOpenCategory(isOpen ? "" : group.category)}
                  disabled={loading}
                >
                  <span>{getCategoryIcon(group.category)}</span>

                  <div>
                    <strong>{group.category}</strong>
                    <p>{group.services.length} servizi</p>
                  </div>

                  <b>{isOpen ? "−" : "+"}</b>
                </button>

                {isOpen && (
                  <div className="service-options">
                    {group.services.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={service === item.name ? "service-option active" : "service-option"}
                        onClick={() => setService(item.name)}
                        disabled={loading}
                      >
                        <div>
                          <strong>{item.name}</strong>
                          {item.description && <p>{item.description}</p>}
                        </div>
                        <span>€{item.price}</span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <input type="hidden" value={service} required />

      <div className="section-title operator-section-title">
  <h3>Scegli operatore</h3>
</div>

{activeOperators.length === 0 ? (
  <div className="empty-card compact">
    <strong>Nessun operatore disponibile</strong>
    <p>Al momento non ci sono operatori attivi per questo salone.</p>
  </div>
) : (
  <div className="operator-choice-row">
    {activeOperators.map((operator) => (
      <button
        key={operator.id}
        type="button"
        className={operatorId === operator.id ? "operator-choice active" : "operator-choice"}
        onClick={() => {
          setOperatorId(operator.id);
          setTime("");
        }}
        disabled={loading}
      >
        <span className="operator-avatar">
  {operator.image_url ? (
    <img
      src={operator.image_url}
      alt={operator.name || "Operatore"}
      className="operator-avatar-image"
    />
  ) : (
    String(operator.name || "O").charAt(0).toUpperCase()
  )}
</span>
        <strong>{operator.name}</strong>
        {operator.role && <p>{operator.role}</p>}
      </button>
    ))}
  </div>
)}

<input type="hidden" value={operatorId} required />
<label>Giorno</label>
<input
  type="date"
  value={date}
  min={new Date().toISOString().slice(0, 10)}
    onChange={(e) => {
    setDate(e.target.value);
    setTime("");
  }}
  required
  disabled={loading}
/>
{bookingAvailabilityNotice && (
  <div className={`availability-notice ${bookingAvailabilityNotice.type}`}>
    <div className="availability-notice-icon">
      {bookingAvailabilityNotice.type === "closed" ? "!" : "i"}
    </div>
    <div>
      <strong>{bookingAvailabilityNotice.title}</strong>
      <p>{bookingAvailabilityNotice.text}</p>
    </div>
  </div>
)}
<label>Ora</label>
<select
  value={time}
  onChange={(e) => setTime(e.target.value)}
  required
  disabled={!date || loading}
>
  <option value="">
    {date ? "Scegli un orario" : "Prima scegli il giorno"}
  </option>

  {availableSlots.map((slot) => (
    <option key={slot} value={slot}>
      {slot}
    </option>
  ))}
</select>
      <button className="primary-cta" type="submit" disabled={loading}>
        {loading ? "Attendi..." : "Conferma prenotazione"}
      </button>
    </form>
  );
}

export default BookingForm;