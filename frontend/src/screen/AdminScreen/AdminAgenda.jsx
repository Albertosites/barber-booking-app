import { useMemo, useState } from "react";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getStartOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);

  return copy;
}

function getWeekDays(date) {
  const start = getStartOfWeek(date);

  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    return current;
  });
}

function getMonthWeeks(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const start = getStartOfWeek(firstDay);
  const weeks = [];
  const cursor = new Date(start);

  while (cursor <= lastDay || cursor.getDay() !== 1) {
    const week = [];

    for (let index = 0; index < 7; index += 1) {
      const day = new Date(cursor);
      week.push(day);
      cursor.setDate(cursor.getDate() + 1);
    }

    weeks.push(week);

    if (cursor > lastDay && cursor.getDay() === 1) {
      break;
    }
  }

  return weeks;
}

function getBookingsForDay(bookings, dayKey) {
  return bookings
    .filter((booking) => booking.date === dayKey)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}

function formatCompactDay(date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "numeric",
  }).format(date);
}

function formatFullDay(date) {
  return new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

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
  formatDateHeader,
  setAdminBookingToDelete,
}) {
  const [selectedAgendaDay, setSelectedAgendaDay] = useState("");

  const todayDate = useMemo(() => new Date(), []);
  const todayKey = getTodayString();

  const currentView = ["today", "week", "month"].includes(adminAgendaFilter)
    ? adminAgendaFilter
    : "today";

  const visibleBookings = useMemo(() => {
    return filteredAdminBookings || [];
  }, [filteredAdminBookings]);

  const todayBookings = useMemo(() => {
    return getBookingsForDay(visibleBookings, todayKey);
  }, [todayKey, visibleBookings]);

  const weekDays = useMemo(() => {
    return getWeekDays(todayDate);
  }, [todayDate]);

  const monthWeeks = useMemo(() => {
    return getMonthWeeks(todayDate);
  }, [todayDate]);

  const selectedDayBookings = useMemo(() => {
    return getBookingsForDay(visibleBookings, selectedAgendaDay);
  }, [selectedAgendaDay, visibleBookings]);

  function changeAgendaView(nextView) {
    setSelectedAgendaDay("");
    setAdminAgendaFilter(nextView);
  }

  function renderBookingCards(bookings) {
    if (bookings.length === 0) {
      return (
        <div className="empty-card compact">
          <strong>Nessuna prenotazione</strong>
          <p>Quando arriveranno appuntamenti, li vedrai qui.</p>
        </div>
      );
    }

    return (
      <div className="customer-bookings-list">
        {bookings.map((booking) => (
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

            <button
              className="admin-delete-booking-btn"
              type="button"
              onClick={() => setAdminBookingToDelete(booking)}
            >
              Elimina prenotazione
            </button>
          </article>
        ))}
      </div>
    );
  }

  function renderDayZoom() {
    const parsedDate = parseLocalDate(selectedAgendaDay);

    return (
      <section className="admin-day-block modern-day-block">
        <div className="modern-day-header">
          <div>
            <span>{selectedAgendaDay}</span>
            <strong>
              {parsedDate ? formatFullDay(parsedDate) : formatDateHeader(selectedAgendaDay)}
            </strong>
          </div>

          <p>{selectedDayBookings.length} appuntamenti</p>
        </div>

        <button
          className="secondary-cta"
          type="button"
          onClick={() => setSelectedAgendaDay("")}
        >
          Torna alla panoramica
        </button>

        {renderBookingCards(selectedDayBookings)}
      </section>
    );
  }

  function renderWeekView() {
    if (selectedAgendaDay) {
      return renderDayZoom();
    }

    return (
      <div className="admin-agenda-groups">
        {weekDays.map((day) => {
          const dayKey = formatDateKey(day);
          const dayBookings = getBookingsForDay(visibleBookings, dayKey);

          return (
            <button
              className="admin-day-block modern-day-block agenda-day-preview"
              type="button"
              key={dayKey}
              onClick={() => setSelectedAgendaDay(dayKey)}
            >
              <div className="modern-day-header">
                <div>
                  <span>{dayKey}</span>
                  <strong>{formatFullDay(day)}</strong>
                </div>

                <p>{dayBookings.length} appuntamenti</p>
              </div>

              {dayBookings.length > 0 ? (
                <div className="agenda-day-preview-list">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <p key={booking.id}>
                      <strong>{booking.time}</strong> · {booking.name}
                    </p>
                  ))}

                  {dayBookings.length > 3 && (
                    <p>+ {dayBookings.length - 3} altri appuntamenti</p>
                  )}
                </div>
              ) : (
                <p className="agenda-empty-preview">Nessuna prenotazione.</p>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  function renderMonthView() {
    if (selectedAgendaDay) {
      return renderDayZoom();
    }

    return (
      <div className="admin-agenda-groups">
        {monthWeeks.map((week, weekIndex) => (
          <section className="admin-day-block modern-day-block" key={`week-${weekIndex}`}>
            <div className="modern-day-header">
              <div>
                <span>Settimana {weekIndex + 1}</span>
                <strong>
                  {formatCompactDay(week[0])} → {formatCompactDay(week[6])}
                </strong>
              </div>
            </div>

            <div className="agenda-week-grid">
              {week.map((day) => {
                const dayKey = formatDateKey(day);
                const dayBookings = getBookingsForDay(visibleBookings, dayKey);
                const isCurrentMonth = day.getMonth() === todayDate.getMonth();

                return (
                  <button
                    className={
                      isCurrentMonth
                        ? "filter-pill agenda-month-day"
                        : "filter-pill agenda-month-day muted"
                    }
                    type="button"
                    key={dayKey}
                    onClick={() => setSelectedAgendaDay(dayKey)}
                  >
                    <span>{formatCompactDay(day)}</span>
                    <strong>{dayBookings.length}</strong>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <div className="section-title">
        <h3>Agenda</h3>
        <span>{visibleBookings.length} prenotazioni</span>
      </div>

      <div className="admin-help-card agenda-help-card">
        <strong>Vista appuntamenti</strong>
        <p>
          Le prenotazioni vecchie vengono eliminate automaticamente.
          Puoi controllare oggi, la settimana o il mese e aprire il singolo giorno.
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
            disabled={manualBookingLoading || activeOperators.length === 0}
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
            {manualBookingLoading ? "Attendi..." : "Aggiungi in agenda"}
          </button>
        </form>
      )}

      <div className="admin-filter-row">
        <button
          type="button"
          className={currentView === "today" ? "filter-pill active" : "filter-pill"}
          onClick={() => changeAgendaView("today")}
        >
          Oggi
        </button>

        <button
          type="button"
          className={currentView === "week" ? "filter-pill active" : "filter-pill"}
          onClick={() => changeAgendaView("week")}
        >
          Questa settimana
        </button>

        <button
          type="button"
          className={currentView === "month" ? "filter-pill active" : "filter-pill"}
          onClick={() => changeAgendaView("month")}
        >
          Questo mese
        </button>
      </div>

      <button
        className="primary-cta refresh-agenda-btn"
        type="button"
        onClick={loadAdminBookings}
      >
        Aggiorna agenda
      </button>

      {currentView === "today" && (
        <section className="admin-day-block modern-day-block">
          <div className="modern-day-header">
            <div>
              <span>{todayKey}</span>
              <strong>Oggi</strong>
            </div>

            <p>{todayBookings.length} appuntamenti</p>
          </div>

          {renderBookingCards(todayBookings)}
        </section>
      )}

      {currentView === "week" && renderWeekView()}

      {currentView === "month" && renderMonthView()}
    </div>
  );
}