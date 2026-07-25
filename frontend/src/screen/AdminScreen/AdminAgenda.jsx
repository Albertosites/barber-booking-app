import { useMemo, useState, useEffect, useRef } from "react";


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
  slots,
}) {
  const [selectedAgendaDay, setSelectedAgendaDay] = useState("");
  const [selectedAgendaWeekIndex, setSelectedAgendaWeekIndex] = useState(null);
  const [selectedSlotBooking, setSelectedSlotBooking] = useState(null);
const [expandedSlotBookingId, setExpandedSlotBookingId] = useState("");
const [showPartialSlotBookingForm, setShowPartialSlotBookingForm] =
  useState(false);
const [selectedFreeSlot, setSelectedFreeSlot] = useState(null);
const [slotPopupPosition, setSlotPopupPosition] = useState(null);

function prepareSlotPopupPosition(event) {
  const slotButton = event.currentTarget;

  const slotGrid = slotButton.closest(
    ".agenda-day-preview-list"
  );

  if (!slotGrid) {
    setSlotPopupPosition(null);
    return;
  }

  const buttonRect = slotButton.getBoundingClientRect();
  const gridRect = slotGrid.getBoundingClientRect();

  const margin = 8;

  const popupWidth = Math.min(
    260,
    gridRect.width - margin * 2
  );

  const preferredViewportLeft =
    buttonRect.left +
    buttonRect.width / 2 -
    popupWidth / 2;

  const minimumViewportLeft =
    gridRect.left + margin;

  const maximumViewportLeft =
    gridRect.right - popupWidth - margin;

  const safeViewportLeft = Math.max(
    minimumViewportLeft,
    Math.min(
      preferredViewportLeft,
      maximumViewportLeft
    )
  );

  const availableSpaceBelow =
  window.innerHeight - buttonRect.bottom;

const placement =
  availableSpaceBelow < 420 ? "above" : "below";

setSlotPopupPosition({
  left: safeViewportLeft - buttonRect.left,
  width: popupWidth,
  placement,
});
}

  const todayDate = useMemo(() => new Date(), []);
  const todayKey = getTodayString();

  const currentView = ["today", "week", "month"].includes(adminAgendaFilter)
    ? adminAgendaFilter
    : "today";

  const currentSlotRef = useRef(null);
  const agendaContentRef = useRef(null);

  const currentTimeSlot = useMemo(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const nowStr = `${hh}:${mm}`;
    return slots.reduce((closest, slot) => {
      if (slot <= nowStr) return slot;
      return closest;
    }, slots[0] || null);
  }, [slots]);

  useEffect(() => {
    if (currentView === "today" && !selectedAgendaDay && currentSlotRef.current) {
      setTimeout(() => {
        currentSlotRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  }, [currentView, selectedAgendaDay]);

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
    setSelectedSlotBooking(null);
    setSelectedFreeSlot(null);
    setAdminAgendaFilter(nextView);
    setTimeout(() => {
      agendaContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function renderBackButton(label, onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          alignSelf: "flex-start",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "10px 18px",
          background: "#f5f5f5",
          border: "1px solid #e0e0e0",
          borderRadius: "999px",
          cursor: "pointer",
          fontSize: "14px",
          fontWeight: 600,
          color: "#111",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        {label}
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

  function renderSlotGrid(dayBookings, dayKey) {
  return (
    <div
      className="agenda-day-preview-list"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(66px, 1fr))",
        gap: "6px",
        position: "relative",
        overflow: "visible",
      }}
    >
      {slots.map((slot) => {
        const slotBookings = dayBookings.filter((item) => item.time === slot);
const booking = slotBookings[0] || null;

const totalOperators = activeOperators.length;

const busyOperatorIds = new Set(
  slotBookings
    .map((item) => item.operator_id)
    .filter(Boolean)
);

const hasUnassignedBooking = slotBookings.some((item) => !item.operator_id);

const busyOperatorsCount = hasUnassignedBooking
  ? totalOperators
  : busyOperatorIds.size;

const isFullyFree = totalOperators > 0 && busyOperatorsCount === 0;
const isPartiallyBusy =
  totalOperators > 0 &&
  busyOperatorsCount > 0 &&
  busyOperatorsCount < totalOperators;
const isFullyBusy =
  totalOperators === 0 ||
  busyOperatorsCount >= totalOperators;

const availableOperatorsForSlot = activeOperators.filter(
  (operator) => !busyOperatorIds.has(operator.id)
);

const canAddBookingToPartialSlot =
  isPartiallyBusy && availableOperatorsForSlot.length > 0;        
        
const slotColor = isFullyBusy
  ? "#D8264C"
  : isPartiallyBusy
  ? "#f59e0b"
  : "#22c55e";

const slotBorder = isFullyBusy
  ? "1px solid rgba(216,38,76,0.38)"
  : isPartiallyBusy
  ? "1px solid rgba(245,158,11,0.45)"
  : "1px solid rgba(34,197,94,0.30)";

const slotBackground = isFullyBusy
  ? "rgba(216,38,76,0.10)"
  : isPartiallyBusy
  ? "rgba(245,158,11,0.13)"
  : "rgba(34,197,94,0.08)";

        
        
        const isSelectedBusySlot =
  selectedSlotBooking &&
  selectedSlotBooking.date === dayKey &&
  selectedSlotBooking.time === slot;

        const isSelectedFreeSlot =
          selectedFreeSlot &&
          selectedFreeSlot.date === dayKey &&
          selectedFreeSlot.time === slot;

        const isCurrentSlot = dayKey === todayKey && slot === currentTimeSlot;

        return (
          <div
            key={slot}
            ref={isCurrentSlot ? currentSlotRef : null}
            style={{
              position: "relative",
            }}
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                prepareSlotPopupPosition(event);
                setShowPartialSlotBookingForm(false);
                setManualName("");
setManualPhone("");
setManualService("");
setManualOperatorId("");


                if (slotBookings.length > 0) {
  setSelectedFreeSlot(null);
  setExpandedSlotBookingId("");
  setSelectedSlotBooking({
    date: dayKey,
    time: slot,
  });
  return;
}

                setSelectedSlotBooking(null);

const today = getTodayString();

if (dayKey < today) {
  setSelectedFreeSlot({
    date: dayKey,
    time: slot,
    isPast: true,
  });

  return;
}

setManualDate(dayKey);
setManualTime(slot);

setSelectedFreeSlot({
  date: dayKey,
  time: slot,
  isPast: false,
});
              }}
              style={{
                width: "100%",
                border: slotBorder,
                background: slotBackground,
                borderRadius: "10px",
                padding: "6px 5px",
                minHeight: "36px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  background: slotColor,
                  flexShrink: 0,
                }}
              />

              <strong
                style={{
                  color: "#111",
                  fontSize: "0.8rem",
                  lineHeight: 1,
                }}
              >
                {slot}
              </strong>
            </button>

            {isSelectedBusySlot && (
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  position: "absolute",
top:
  slotPopupPosition?.placement === "above"
    ? "auto"
    : "44px",
bottom:
  slotPopupPosition?.placement === "above"
    ? "44px"
    : "auto",
left: slotPopupPosition?.left ?? "50%",
right: "auto",
transform: slotPopupPosition ? "none" : "translateX(-50%)",
width: slotPopupPosition?.width ?? "260px",
maxWidth: "none",
                  borderRadius: "20px",
                  background: "#fff",
                  padding: "18px",
                  boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
                  zIndex: 9999,
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  animation: "agendaPopupIn 160ms ease-out",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <span style={{ color: "#666", fontSize: "0.78rem" }}>
                      Appuntamento
                    </span>

                    <h3 style={{ margin: 0, color: "#111" }}>
  {slot} · {slotBookings.length} prenotazioni
</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedSlotBooking(null)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      color: "#111",
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
  {slotBookings.map((item) => {
    const isExpanded = expandedSlotBookingId === item.id;

    return (
      <div
        key={item.id}
        style={{
          border: "1px solid rgba(0,0,0,0.08)",
          borderRadius: "14px",
          padding: "10px",
          background: "rgba(0,0,0,0.02)",
        }}
      >
        <button
          type="button"
          onClick={() =>
            setExpandedSlotBookingId(isExpanded ? "" : item.id)
          }
          style={{
            width: "100%",
            border: "none",
            background: "transparent",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <strong style={{ color: "#111", display: "block" }}>
            {item.operator_name || "Operatore non assegnato"}
          </strong>

          <span style={{ color: "#444", fontSize: "0.88rem" }}>
            {item.name} · {item.service || "Prenotazione"}
          </span>
        </button>

        {isExpanded && (
          <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <a
              href={`tel:${item.phone}`}
              style={{
                textDecoration: "none",
                background: "rgba(216,38,76,0.12)",
                color: "#D8264C",
                padding: "10px",
                borderRadius: "12px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {item.phone}
            </a>

            <button
              className="admin-delete-booking-btn"
              type="button"
              onClick={() => {
                setAdminBookingToDelete(item);
                setSelectedSlotBooking(null);
              }}
            >
              Elimina prenotazione
            </button>
          </div>
        )}
      </div>
    );
  })}
</div>

  {canAddBookingToPartialSlot && !showPartialSlotBookingForm && (
  <button
    className="primary-cta"
    type="button"
    onClick={() => {
      setManualDate(dayKey);
      setManualTime(slot);
      setManualOperatorId("");
      setShowPartialSlotBookingForm(true);
    }}
  
                  
  >
    Aggiungi prenotazione
  </button>
)}              

{canAddBookingToPartialSlot && showPartialSlotBookingForm && (
  <>
    <input
      type="text"
      placeholder="Nome cliente"
      value={manualName}
      onChange={(event) => setManualName(event.target.value)}
      disabled={manualBookingLoading}
      required
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    />

    <input
      type="tel"
      placeholder="Telefono"
      value={manualPhone}
      onChange={(event) => setManualPhone(event.target.value)}
      disabled={manualBookingLoading}
      required
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    />

    <input
      type="text"
      placeholder="Servizio o nota"
      value={manualService}
      onChange={(event) => setManualService(event.target.value)}
      disabled={manualBookingLoading}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    />

    <select
      value={manualOperatorId}
      onChange={(event) => setManualOperatorId(event.target.value)}
      disabled={
        manualBookingLoading ||
        availableOperatorsForSlot.length === 0
      }
      required
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    >
      <option value="">
        Scegli operatore disponibile
      </option>

      {availableOperatorsForSlot.map((operator) => (
        <option key={operator.id} value={operator.id}>
          {operator.name}
          {operator.role ? ` · ${operator.role}` : ""}
        </option>
      ))}
    </select>

    <button
      className="primary-cta"
      type="button"
      disabled={manualBookingLoading}
      onClick={(event) => {
        event.preventDefault();
        setManualDate(dayKey);
        setManualTime(slot);
        createManualBooking(event, dayKey, slot);
      }}
    >
      {manualBookingLoading
        ? "Attendi..."
        : "Salva prenotazione"}
    </button>

    <button
      className="filter-pill"
      type="button"
      onClick={() =>
        setShowPartialSlotBookingForm(false)
      }
      style={{
        justifyContent: "center",
        color: "#111",
      }}
    >
      Annulla
    </button>
  </>
)}
                
</div>
)}

            {isSelectedFreeSlot && (
  <div
    onClick={(event) => event.stopPropagation()}
    style={{
      position: "absolute",
top:
  slotPopupPosition?.placement === "above"
    ? "auto"
    : "44px",
bottom:
  slotPopupPosition?.placement === "above"
    ? "44px"
    : "auto",
left: slotPopupPosition?.left ?? "50%",
right: "auto",
transform: slotPopupPosition ? "none" : "translateX(-50%)",
width: slotPopupPosition?.width ?? "260px",
maxWidth: "none",
      borderRadius: "20px",
      background: "#fff",
      padding: "18px",
      boxShadow: "0 18px 45px rgba(0,0,0,0.25)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      animation: "agendaPopupIn 160ms ease-out",
    }}
  >


    <div style={{ display: "flex", justifyContent: "space-between", gap: "10px" }}>
      <div>
        <span style={{ color: "#666", fontSize: "0.78rem" }}>
          Nuova prenotazione
        </span>

        <h3 style={{ margin: 0, color: "#111" }}>
          {dayKey} · {slot}
        </h3>
      </div>

      <button
        type="button"
        onClick={() => setSelectedFreeSlot(null)}
        style={{
          border: "none",
          background: "transparent",
          fontSize: "1.2rem",
          cursor: "pointer",
          color: "#111",
        }}
      >
        ✕
      </button>
    </div>

{selectedFreeSlot?.isPast ? (
  <>
    <p
      style={{
        margin: 0,
        color: "#444",
        fontSize: "0.9rem",
        lineHeight: 1.45,
      }}
    >
      Non è possibile inserire una prenotazione in un giorno già passato.
    </p>

    <button
      className="filter-pill"
      type="button"
      onClick={() => setSelectedFreeSlot(null)}
      style={{
        justifyContent: "center",
        color: "#111",
      }}
    >
      Ho capito
    </button>
  </>
) : (
  <>

    <input
      type="text"
      placeholder="Nome cliente"
      value={manualName}
      onChange={(event) => setManualName(event.target.value)}
      disabled={manualBookingLoading}
      required
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    />

    <input
      type="tel"
      placeholder="Telefono"
      value={manualPhone}
      onChange={(event) => setManualPhone(event.target.value)}
      disabled={manualBookingLoading}
      required
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    />

    <input
      type="text"
      placeholder="Servizio o nota"
      value={manualService}
      onChange={(event) => setManualService(event.target.value)}
      disabled={manualBookingLoading}
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
    />

    <select
      value={manualOperatorId}
      onChange={(event) => setManualOperatorId(event.target.value)}
      disabled={manualBookingLoading || activeOperators.length === 0}
      required
      style={{
        width: "100%",
        padding: "12px",
        borderRadius: "14px",
        border: "1px solid rgba(0,0,0,0.12)",
      }}
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

    <button
      className="primary-cta"
      type="button"
      disabled={manualBookingLoading}
      onClick={(event) => {
        event.preventDefault();
        setManualDate(dayKey);
        setManualTime(slot);
        createManualBooking(event, dayKey, slot);
      }}
    >
      {manualBookingLoading ? "Attendi..." : "Salva prenotazione"}
    </button>
     </>
)}
  </div>
)}
          </div>
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
      <div
  className="admin-agenda-groups"
  style={{
    position: "relative",
    overflow: "visible",
  }}
>
        {backButton}

        {days.map((day) => {
          const dayKey = formatDateKey(day);

          const dayBookings = getBookingsForDay(
            visibleBookings,
            dayKey
          );

          return (
            <article
  className="admin-day-block modern-day-block agenda-day-preview"
  key={dayKey}
  style={{
    cursor: "default",
    position: "relative",
    overflow: "visible",
    zIndex:
  (selectedFreeSlot && selectedFreeSlot.date === dayKey) ||
  (selectedSlotBooking && selectedSlotBooking.date === dayKey)
    ? 9999
    : 1,
  }}
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

              {renderSlotGrid(dayBookings, dayKey)}
            </article>
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
        renderBackButton("Torna a questo mese", () => {
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
  border: "1px solid rgba(17,17,17,0.07)",
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,246,242,0.96) 100%)",
  borderRadius: "18px",
  padding: "10px 6px",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  minWidth: 0,
  boxShadow:
    "0 8px 20px rgba(17,17,17,0.045), inset 0 1px 0 rgba(255,255,255,0.9)",
  transition: "transform 160ms ease, box-shadow 160ms ease",
}}
              >
                <div
                  style={{
  borderRadius: "14px",
  background:
    "linear-gradient(180deg, rgba(197,145,66,0.24) 0%, rgba(197,145,66,0.12) 100%)",
  border: "1px solid rgba(197,145,66,0.42)",
  padding: "8px 4px",
  boxShadow:
    "0 5px 12px rgba(197,145,66,0.10), inset 0 1px 0 rgba(255,255,255,0.65)",
}}
                >
                  <strong
                    style={{
                      display: "block",
                      fontSize: "0.78rem",
                      color: "#111",
                    }}
                  >
                    Sett. {weekIndex + 1} ›
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
  background: "transparent",
  border: "1px solid transparent",
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
  opacity: hasBookings ? 1 : 0.55,
  color: hasBookings ? "#D8264C" : "#666",
  fontWeight: hasBookings ? 700 : 500,
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

  const freeSlotModal = selectedFreeSlot && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.18)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
      onClick={() => setSelectedFreeSlot(null)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "420px",
          borderRadius: "24px",
          background: "#fff",
          padding: "24px",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        <div>
          <span style={{ color: "#666", fontSize: "0.82rem" }}>
            Slot libero
          </span>

          <h3 style={{ margin: 0, color: "#111" }}>
            {selectedFreeSlot.date} · {selectedFreeSlot.time}
          </h3>
        </div>

        <p style={{ margin: 0, color: "#444" }}>
          Vuoi aggiungere una prenotazione manuale in questo orario?
        </p>

        <button
          className="primary-cta"
          type="button"
          onClick={() => {
            setManualDate(selectedFreeSlot.date);
            setManualTime(selectedFreeSlot.time);
            setShowManualBookingForm(true);
            setSelectedFreeSlot(null);
          }}
        >
          Aggiungi prenotazione
        </button>

        <button
          className="filter-pill"
          type="button"
          onClick={() => setSelectedFreeSlot(null)}
          style={{
            justifyContent: "center",
            color: "#111",
          }}
        >
          Chiudi
        </button>
      </div>
    </div>
  );

  return (
    <>
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


      <div ref={agendaContentRef} className="admin-filter-row">
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

      {currentView === "today" &&
  renderWeekOverview([todayDate])}

      {currentView === "week" &&
        renderWeekView()}

      {currentView === "month" &&
        renderMonthView()}

    </div>

    </>
  );
}