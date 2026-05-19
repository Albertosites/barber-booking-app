import { useMemo, useState } from "react";

const AGENDA_SLOTS = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];

function formatLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayString() {
  return formatLocalDateKey(new Date());
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
  return formatLocalDateKey(date);
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

function getMonthColumns(date) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const lastDay = new Date(year, month + 1, 0).getDate();

  const days = Array.from({ length: lastDay }, (_, index) => {
    return new Date(year, month, index + 1);
  });

  const columns = [];

  for (let index = 0; index < days.length; index += 7) {
    columns.push(days.slice(index, index + 7));
  }

  return columns;
}

function getBookingsForDay(bookings, dayKey) {
  return bookings
    .filter((booking) => booking.date === dayKey)
    .sort((a, b) => String(a.time || "").localeCompare(String(b.time || "")));
}

function getBookingsForWeek(bookings, weekDays) {
  const weekKeys = weekDays.map((day) => formatDateKey(day));

  return bookings
    .filter((booking) => weekKeys.includes(booking.date))
    .sort((a, b) => {
      const dateCompare = String(a.date || "").localeCompare(String(b.date || ""));
      if (dateCompare !== 0) return dateCompare;

      return String(a.time || "").localeCompare(String(b.time || ""));
    });
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
  const [selectedAgendaWeekIndex, setSelectedAgendaWeekIndex] = useState(null);

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

  const monthColumns = useMemo(() => {
    return getMonthColumns(todayDate);
  }, [todayDate]);

  const selectedDayBookings = useMemo(() => {
    return getBookingsForDay(visibleBookings, selectedAgendaDay);
  }, [selectedAgendaDay, visibleBookings]);

  function changeAgendaView(nextView) {
    setSelectedAgendaDay("");
    setSelectedAgendaWeekIndex(null);
    setAdminAgendaFilter(nextView);
  }

  function renderBackButton(label, onClick) {
    return (
      <button
        className="filter-pill active"
        type="button"
        onClick={onClick}
        style={{
          alignSelf: "flex-start",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 16px",
          color: "#111",
        }}
      >
        <span
          style={{
            fontSize: "18px",
            lineHeight: 1,
            color: "#111",
          }}
        >
          ←
        </span>

        <span style={{ color: "#111" }}>
          {label}
        </span>
      </button>
    );
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
          <article
            className="modern-booking-card admin-booking-card"
            key={booking.id}
          >
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

              <h3>
                {booking.service || "Prenotazione telefonica"}
              </h3>

              <p>
                Operatore: {booking.operator_name || "Non assegnato"}
              </p>

              <a
                className="phone-link"
                href={`tel:${booking.phone}`}
              >
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

  function renderSlotGrid(dayBookings) {
    const busyTimes = new Set(
      dayBookings.map((booking) => booking.time)
    );

    return (
      <div
        className="agenda-day-preview-list"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(74px, 1fr))",
          gap: "7px 10px",
        }}
      >
        {AGENDA_SLOTS.map((slot) => {
          const isBusy = busyTimes.has(slot);

          return (
            <p
              key={slot}
              style={{
                margin: 0,
                color: "#111",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "inline-block",
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  background: isBusy ? "#D8264C" : "#22c55e",
                  marginRight: "8px",
                }}
              />

              <strong style={{ color: "#111" }}>
                {slot}
              </strong>
            </p>
          );
        })}
      </div>
    );
  }

  function renderDayZoom() {
    const parsedDate = parseLocalDate(selectedAgendaDay);

    return (
      <section className="admin-day-block modern-day-block">
        {renderBackButton(
          "Torna alla settimana",
          () => setSelectedAgendaDay("")
        )}

        <div className="modern-day-header">
          <div>
            <span>{selectedAgendaDay}</span>

            <strong>
              {parsedDate
                ? formatFullDay(parsedDate)
                : formatDateHeader(selectedAgendaDay)}
            </strong>
          </div>

          <p>
            {selectedDayBookings.length} appuntamenti
          </p>
        </div>

        {renderBookingCards(selectedDayBookings)}
      </section>
    );
  }

  function renderWeekOverview(days, backButton = null) {
    if (selectedAgendaDay) {
      return renderDayZoom();
    }

    return (
      <div className="admin-agenda-groups">
        {backButton}

        {days.map((day) => {
          const dayKey = formatDateKey(day);

          const dayBookings = getBookingsForDay(
            visibleBookings,
            dayKey
          );

          return (
            <button
              className="admin-day-block modern-day-block agenda-day-preview"
              type="button"
              key={dayKey}
              onClick={() => setSelectedAgendaDay(dayKey)}
            >
              <div className="modern-day-header">
                <div>
                  <span style={{ color: "#111" }}>
                    {dayKey}
                  </span>

                  <strong style={{ color: "#111" }}>
                    {formatFullDay(day)}
                  </strong>
                </div>

                <p style={{ color: "#111" }}>
                  {dayBookings.length} appuntamenti
                </p>
              </div>

              {renderSlotGrid(dayBookings)}
            </button>
          );
        })}
      </div>
    );
  }

  function renderWeekView() {
    return renderWeekOverview(weekDays);
  }

  function renderMonthView() {
    if (selectedAgendaDay) {
      return renderDayZoom();
    }

    if (
      selectedAgendaWeekIndex !== null &&
      monthColumns[selectedAgendaWeekIndex]
    ) {
      const selectedWeek =
        monthColumns[selectedAgendaWeekIndex];

      return renderWeekOverview(
        selectedWeek,
        renderBackButton("Torna al mese", () => {
          setSelectedAgendaDay("");
          setSelectedAgendaWeekIndex(null);
        })
      );
    }

    const monthName = new Intl.DateTimeFormat("it-IT", {
      month: "long",
      year: "numeric",
    }).format(todayDate);

    const monthBookings = monthColumns
      .flat()
      .reduce((total, day) => {
        const dayKey = formatDateKey(day);

        return (
          total +
          getBookingsForDay(
            visibleBookings,
            dayKey
          ).length
        );
      }, 0);

    return (
      <section className="admin-day-block modern-day-block">
        <div className="modern-day-header">
          <div>
            <span style={{ color: "#111" }}>
              Mese
            </span>

            <strong style={{ color: "#111" }}>
              {monthName}
            </strong>
          </div>

          <p style={{ color: "#111" }}>
            {monthBookings} app.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: "8px",
            alignItems: "stretch",
          }}
        >
          {monthColumns.slice(0, 5).map((week, weekIndex) => {
            const weekBookings = getBookingsForWeek(
              visibleBookings,
              week
            );

            const firstDay = week[0]?.getDate();

            const lastDay =
              week[week.length - 1]?.getDate();

            return (
              <button
                className="agenda-day-preview"
                type="button"
                key={`month-column-${weekIndex}`}
                onClick={() =>
                  setSelectedAgendaWeekIndex(weekIndex)
                }
                style={{
                  border: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.035)",
                  borderRadius: "18px",
                  padding: "10px 6px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    borderRadius: "14px",
                    background: "rgba(216,38,76,0.12)",
                    border: "1px solid rgba(216,38,76,0.35)",
                    padding: "8px 4px",
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      color: "#111",
                    }}
                  >
                    Sett. {weekIndex + 1}
                  </strong>

                  <span
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      opacity: 0.6,
                      color: "#111",
                    }}
                  >
                    {firstDay}-{lastDay}
                  </span>

                  <span
                    style={{
                      display: "block",
                      fontSize: "0.68rem",
                      opacity: 0.6,
                      color: "#111",
                    }}
                  >
                    {weekBookings.length} app.
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "5px",
                  }}
                >
                  {week.map((day) => {
                    const dayKey = formatDateKey(day);

                    const dayBookings =
                      getBookingsForDay(
                        visibleBookings,
                        dayKey
                      );

                    const hasBookings =
                      dayBookings.length > 0;

                    return (
                      <div
                        key={dayKey}
                        style={{
                          borderRadius: "10px",
                          padding: "6px 3px",
                          background: hasBookings
                            ? "rgba(216,38,76,0.14)"
                            : "rgba(255,255,255,0.04)",
                          border: hasBookings
                            ? "1px solid rgba(216,38,76,0.45)"
                            : "1px solid rgba(255,255,255,0.07)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "2px",
                        }}
                      >
                        <strong
                          style={{
                            fontSize: "0.74rem",
                            lineHeight: 1,
                            color: "#111",
                          }}
                        >
                          {day.getDate()}
                        </strong>

                        <span
                          style={{
                            fontSize: "0.62rem",
                            opacity: 0.6,
                            color: "#111",
                          }}
                        >
                          {dayBookings.length} app.
                        </span>
                      </div>
                    );
                  })}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <div className="admin-panel">
      <div className="section-title">
        <h3>Agenda</h3>

        <span>
          {visibleBookings.length} prenotazioni
        </span>
      </div>

      <div className="admin-help-card agenda-help-card">
        <strong>Vista appuntamenti</strong>

        <p>
          Le prenotazioni vecchie vengono eliminate automaticamente.
          Puoi controllare oggi, la settimana o il mese
          e aprire il singolo giorno.
        </p>
      </div>

      <button
        className="primary-cta manual-booking-toggle"
        type="button"
        onClick={() =>
          setShowManualBookingForm((current) => !current)
        }
        disabled={manualBookingLoading}
      >
        {showManualBookingForm
          ? "Chiudi inserimento rapido"
          : "Aggiungi prenotazione a nome di cliente"}
      </button>

      {showManualBookingForm && (
        <form
          className="manual-booking-form"
          onSubmit={createManualBooking}
        >
          <div className="manual-booking-title">
            <span>Telefonata / banco</span>

            <strong>
              Blocca uno slot in agenda
            </strong>

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
              manualBookingLoading ||
              activeOperators.length === 0
            }
            required
          >
            <option value="">
              {activeOperators.length > 0
                ? "Scegli operatore"
                : "Nessun operatore disponibile"}
            </option>

            {activeOperators.map((operator) => (
              <option
                key={operator.id}
                value={operator.id}
              >
                {operator.name}
                {operator.role
                  ? ` · ${operator.role}`
                  : ""}
              </option>
            ))}
          </select>

          <div className="admin-form-grid">
            <div>
              <label>Giorno</label>

              <input
                type="date"
                value={manualDate}
                min={todayKey}
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
                disabled={
                  !manualDate || manualBookingLoading
                }
              >
                <option value="">
                  {manualDate ? "Scegli" : "Prima giorno"}
                </option>

                {manualAvailableSlots.map((slot) => (
                  <option
                    key={slot}
                    value={slot}
                  >
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
        <button
          type="button"
          className={
            currentView === "today"
              ? "filter-pill active"
              : "filter-pill"
          }
          onClick={() => changeAgendaView("today")}
        >
          Oggi
        </button>

        <button
          type="button"
          className={
            currentView === "week"
              ? "filter-pill active"
              : "filter-pill"
          }
          onClick={() => changeAgendaView("week")}
        >
          Questa settimana
        </button>

        <button
          type="button"
          className={
            currentView === "month"
              ? "filter-pill active"
              : "filter-pill"
          }
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

            <p>
              {todayBookings.length} appuntamenti
            </p>
          </div>

          {renderBookingCards(todayBookings)}
        </section>
      )}

      {currentView === "week" &&
        renderWeekView()}

      {currentView === "month" &&
        renderMonthView()}
    </div>
  );
}