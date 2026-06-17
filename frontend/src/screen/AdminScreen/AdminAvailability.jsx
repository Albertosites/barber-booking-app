import { useState, useMemo } from "react";

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const HALF_HOUR_TIMES = Array.from(
  { length: 48 },
  (_, index) => {
    const totalMinutes = index * 30;
    const hours = String(
      Math.floor(totalMinutes / 60)
    ).padStart(2, "0");
    const minutes = String(
      totalMinutes % 60
    ).padStart(2, "0");

    return `${hours}:${minutes}`;
  }
);
export default function AdminAvailability({
  closureBlocks,
  exceptionalOpeningBlocks,
  filteredAdminBookings,
  shopOpeningTime,
  shopClosingTime,
  shopSlotMinutes,
  saveShopOpeningSettings,
  availabilityTab,
  setAvailabilityTab,
  createAvailabilityBlock,
  availabilityMode,
  setAvailabilityMode,
  availabilitySaving,
  availabilityDate,
  setAvailabilityDate,
  availabilityWeekday,
  setAvailabilityWeekday,
  weekdays,
  slots,
  availabilityStartTime,
  setAvailabilityStartTime,
  availabilityEndTime,
  setAvailabilityEndTime,
  availabilityReason,
  setAvailabilityReason,
  sortedAvailabilityBlocks,
  formatAvailabilityBlockTitle,
  formatAvailabilityBlockTime,
  getCleanAvailabilityReason,
  availabilityDeletingId,
  deleteAvailabilityBlock,
  createExceptionalOpening,
  openingDate,
  setOpeningDate,
  openingSaving,
  hasExceptionalOpeningForDate,
  availabilityBlocks,
  openingStartTime,
  setOpeningStartTime,
  openingEndTime,
  setOpeningEndTime,
  openingReason,
  setOpeningReason,
  sortedExceptionalOpeningBlocks,
  showConfirm,
  showToast,
  availabilityDateTo,
  setAvailabilityDateTo,
}) {
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [showOpeningForm, setShowOpeningForm] = useState(false);

  const groupedClosureBlocks = useMemo(() => {
    const recurring = sortedAvailabilityBlocks.filter((b) => b.recurring || !b.full_day || !b.block_date);
    const nonRecurring = [...sortedAvailabilityBlocks.filter((b) => !b.recurring && b.full_day && b.block_date)]
      .sort((a, b) => a.block_date.localeCompare(b.block_date));

    const groups = [];
    let i = 0;
    while (i < nonRecurring.length) {
      const group = [nonRecurring[i]];
      let j = i + 1;
      while (j < nonRecurring.length) {
        const prev = group[group.length - 1];
        const curr = nonRecurring[j];
        const prevDate = new Date(prev.block_date + "T00:00:00");
        prevDate.setDate(prevDate.getDate() + 1);
        const nextDateStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}-${String(prevDate.getDate()).padStart(2, "0")}`;
        if (nextDateStr === curr.block_date && (prev.reason || null) === (curr.reason || null)) {
          group.push(curr);
          j++;
        } else {
          break;
        }
      }
      groups.push({ blocks: group, dateFrom: group[0].block_date, dateTo: group[group.length - 1].block_date, reason: group[0].reason, id: group[0].id });
      i = j;
    }

    return [...groups, ...recurring.map((b) => ({ blocks: [b], dateFrom: b.block_date, dateTo: b.block_date, reason: b.reason, id: b.id, single: b }))];
  }, [sortedAvailabilityBlocks]);
  const [localOpeningTime, setLocalOpeningTime] = useState(String(shopOpeningTime || "").slice(0, 5));
  const [localClosingTime, setLocalClosingTime] = useState(String(shopClosingTime || "").slice(0, 5));
  const [localSlotMinutes, setLocalSlotMinutes] = useState(String(shopSlotMinutes || 30));
  const [savingShopHours, setSavingShopHours] = useState(false);  
  
  return (
    <div className="admin-panel availability-panel">
      <div className="section-title">
        <h3>Disponibilità</h3>
        <span>
          {closureBlocks.length} chiusure · {exceptionalOpeningBlocks.length} aperture
        </span>
      </div>

      <div className="admin-help-card">
  <strong>Orari standard del salone</strong>
  <p>
    Slot generati automaticamente da {String(shopOpeningTime || "").slice(0, 5)} a{" "}
    {String(shopClosingTime || "").slice(0, 5)}, ogni {shopSlotMinutes || 30} minuti.
  </p>

  <div className="admin-form-grid">
    <div>
  <label>Apertura</label>

  <select
    value={localOpeningTime}
    onChange={(e) => setLocalOpeningTime(e.target.value)}
  >
    {HALF_HOUR_TIMES.map((time) => (
      <option key={time} value={time}>
        {time}
      </option>
    ))}
  </select>
</div>

    <div>
  <label>Chiusura</label>

  <select
    value={localClosingTime}
    onChange={(e) => setLocalClosingTime(e.target.value)}
  >
    {HALF_HOUR_TIMES.map((time) => (
      <option key={time} value={time}>
        {time}
      </option>
    ))}
  </select>
</div>

    <div>
      <label>Durata slot</label>
      <input
  type="number"
  min="5"
  step="5"
  value={localSlotMinutes}
  onChange={(e) => setLocalSlotMinutes(e.target.value)}
/>
    </div>
  </div>
<button
  className="primary-cta"
  type="button"
  disabled={savingShopHours}
  onClick={async () => {
  const bookingsOutsideNewHours = (
  filteredAdminBookings || []
).filter((booking) => {
  const bookingTime = String(booking.time || "").slice(0, 5);

  if (!bookingTime) return false;

  return (
    bookingTime < localOpeningTime ||
    bookingTime > localClosingTime
  );
});

const affectedBookingsPreview = bookingsOutsideNewHours
  .slice(0, 6)
  .map((booking) => {
    const bookingDate = booking.date || "Data non disponibile";
    const bookingTime =
      String(booking.time || "").slice(0, 5) ||
      "Ora non disponibile";
    const bookingName =
      booking.name || "Cliente senza nome";

    return `• ${bookingDate} alle ${bookingTime} — ${bookingName}`;
  })
  .join("\n");

const additionalBookingsCount =
  bookingsOutsideNewHours.length - 6;

const warningMessage =
  bookingsOutsideNewHours.length > 0
    ? `Attenzione: ${bookingsOutsideNewHours.length} prenotazione${
        bookingsOutsideNewHours.length === 1 ? "e risulterebbe" : "i risulterebbero"
      } fuori dal nuovo orario ${localOpeningTime}-${localClosingTime} e non sarebbe più visibile nella griglia dell’Agenda.\n\n${affectedBookingsPreview}${
        additionalBookingsCount > 0
          ? `\n• Altre ${additionalBookingsCount} prenotazioni`
          : ""
      }\n\nLe prenotazioni non verranno cancellate. Vuoi continuare comunque?`
    : `Stai per impostare l’orario del salone dalle ${localOpeningTime} alle ${localClosingTime}. Nessuna prenotazione attuale risulta fuori dal nuovo intervallo. Vuoi continuare?`;

if (localClosingTime <= localOpeningTime) {
  showToast("L'orario di chiusura deve essere successivo all'orario di apertura.");
  return;
}

const confirmed = await showConfirm(warningMessage);

if (!confirmed) {
  setLocalOpeningTime(
    String(shopOpeningTime || "").slice(0, 5)
  );

  setLocalClosingTime(
    String(shopClosingTime || "").slice(0, 5)
  );

  setLocalSlotMinutes(
    String(shopSlotMinutes || 30)
  );

  return;
}

setSavingShopHours(true);
    const saved = await saveShopOpeningSettings({
      opening_time: localOpeningTime,
      closing_time: localClosingTime,
      slot_minutes: Number(localSlotMinutes || 30),
    });

    setSavingShopHours(false);

    if (saved) {
      showToast("Orari del salone aggiornati.");
    }
  }}
>
  {savingShopHours ? "Salvataggio..." : "Salva orari salone"}
</button>
</div>  

      <div className="admin-help-card">
        <strong>Chiusure e aperture eccezionali</strong>
        <p>
          Le chiusure bloccano giorni o fasce orarie. Le aperture eccezionali riaprono una data specifica anche se esiste una chiusura ricorrente, per esempio un lunedì normalmente chiuso.
        </p>
      </div>

      <div className="admin-segmented">
        <button type="button" className={availabilityTab === "closures" ? "active" : ""} onClick={() => setAvailabilityTab("closures")}>
          Chiusure
        </button>
        <button type="button" className={availabilityTab === "openings" ? "active" : ""} onClick={() => setAvailabilityTab("openings")}>
          Aperture eccezionali
        </button>
      </div>

      {availabilityTab === "closures" && (
        <>
          <button
           className="secondary-cta"
            type="button"
           onClick={() => setShowClosureForm((current) => !current)}
         >
           {showClosureForm ? "Chiudi form chiusura" : "+ Nuova chiusura"}
             </button>

           {showClosureForm && (
              <form className="manual-booking-form availability-form" onSubmit={createAvailabilityBlock}>
            <div className="manual-booking-title">
              <span>Chiusura salone</span>
              <strong>Blocca disponibilità</strong>
              <p>Usa questa sezione per chiudere un giorno intero, una fascia oraria o una ricorrenza settimanale.</p>
            </div>

            <label>Tipo di blocco</label>
            <select value={availabilityMode} onChange={(e) => setAvailabilityMode(e.target.value)} disabled={availabilitySaving}>
              <option value="date_full_day">Giorno specifico - giornata intera</option>
              <option value="date_range">Giorno specifico - fascia oraria</option>
              <option value="multi_day">Periodo (più giorni consecutivi)</option>
              <option value="recurring_full_day">Ricorrenza settimanale - giornata intera</option>
              <option value="recurring_range">Ricorrenza settimanale - fascia oraria</option>
            </select>

            {availabilityMode === "multi_day" && (
              <>
                <label>Dal giorno</label>
                <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} disabled={availabilitySaving} required min={getTodayString()} />
                <label>Al giorno</label>
                <input type="date" value={availabilityDateTo} onChange={(e) => setAvailabilityDateTo(e.target.value)} disabled={availabilitySaving} required min={availabilityDate || getTodayString()} />
              </>
            )}

            {availabilityMode.startsWith("date") && availabilityMode !== "multi_day" && (
              <>
                <label>Giorno</label>
                <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} disabled={availabilitySaving} required min={getTodayString()} />
              </>
            )}

            {availabilityMode.startsWith("recurring") && (
              <>
                <label>Giorno della settimana</label>
                <select value={availabilityWeekday} onChange={(e) => setAvailabilityWeekday(e.target.value)} disabled={availabilitySaving}>
                  {weekdays.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </>
            )}

            {availabilityMode.endsWith("range") && (
              <div className="admin-form-grid">
                <div>
                  <label>Dalle</label>
                  <select value={availabilityStartTime} onChange={(e) => setAvailabilityStartTime(e.target.value)} disabled={availabilitySaving} required>
                    <option value="">Inizio</option>
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Alle</label>
                  <select value={availabilityEndTime} onChange={(e) => setAvailabilityEndTime(e.target.value)} disabled={availabilitySaving} required>
                    <option value="">Fine</option>
                    {slots.map((slot) => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <label>Motivo visibile solo al barbiere</label>
            <input
              type="text"
              placeholder="Es. ferie, pausa, evento, chiusura straordinaria..."
              value={availabilityReason}
              onChange={(e) => setAvailabilityReason(e.target.value)}
              disabled={availabilitySaving}
            />

            <button className="primary-cta" type="submit" disabled={availabilitySaving}>
              {availabilitySaving ? "Attendi..." : "Salva chiusura"}
            </button>
          </form> )}

          <div className="section-title availability-list-title">
            <h3>Chiusure attive</h3>
            <span>{sortedAvailabilityBlocks.length}</span>
          </div>

          {sortedAvailabilityBlocks.length === 0 ? (
            <div className="empty-card compact">
              <strong>Nessuna chiusura attiva</strong>
              <p>Quando bloccherai giorni o orari, li vedrai qui.</p>
            </div>
          ) : (
            <div className="availability-block-list">
              {groupedClosureBlocks.map((group) => {
                const block = group.single || group.blocks[0];
                const isGroup = group.blocks.length > 1;
                const isDeletingGroup = group.blocks.some((b) => availabilityDeletingId === b.id);

                const formatDate = (dateStr) => {
                  if (!dateStr) return "";
                  const [y, m, d] = dateStr.split("-");
                  return `${d}/${m}/${y}`;
                };

                const title = isGroup
                  ? `${formatDate(group.dateFrom)} → ${formatDate(group.dateTo)}`
                  : block.recurring
                    ? formatAvailabilityBlockTitle(block)
                    : formatAvailabilityBlockTitle(block);

                return (
                  <article className="modern-booking-card availability-block-card" key={group.id}>
                    <div className="modern-booking-top">
                      <div className="modern-time-pill">
                        <span>{block.recurring ? "Ogni" : isGroup ? "Periodo" : "Tipo"}</span>
                        <strong>{block.recurring ? "↻" : isGroup ? `${group.blocks.length}gg` : "1x"}</strong>
                      </div>

                      <div className="modern-date-block">
                        <span>{block.recurring ? "Ricorrenza" : isGroup ? "Dal → Al" : "Data"}</span>
                        <strong>{title}</strong>
                      </div>
                    </div>

                    <div className="modern-booking-body">
                      <span>Blocco</span>
                      <h3>{isGroup ? "Giornata intera" : formatAvailabilityBlockTime(block)}</h3>
                      <p>{(group.reason || block.reason) ? (group.reason || block.reason) : "Nessun motivo inserito"}</p>
                    </div>

                    <button
                      className="admin-delete-booking-btn"
                      type="button"
                      disabled={isDeletingGroup}
                      onClick={() => deleteAvailabilityBlock(group)}
                    >
                      {isDeletingGroup ? "Rimozione..." : "Rimuovi chiusura"}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {availabilityTab === "openings" && (
        <>
          <button
  className="secondary-cta"
  type="button"
  onClick={() => setShowOpeningForm((current) => !current)}
>
  {showOpeningForm ? "Chiudi form apertura" : "+ Nuova apertura"}
</button>

{showOpeningForm && (
  <form className="manual-booking-form availability-form" onSubmit={createExceptionalOpening}>
            <div className="manual-booking-title">
              <span>Apertura eccezionale</span>
              <strong>Apri una data normalmente chiusa</strong>
              <p>Perfetto per aprire un lunedì, una domenica o una giornata che risulta chiusa da una ricorrenza. In quella data saranno prenotabili solo gli orari indicati qui.</p>
            </div>

            <label>Giorno da aprire</label>
            <input type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} disabled={openingSaving} required min={getTodayString()} />

            {openingDate && hasExceptionalOpeningForDate(openingDate, availabilityBlocks) && (
              <div className="availability-notice limited">
                <div className="availability-notice-icon">i</div>
                <div>
                  <strong>Esiste già almeno un’apertura eccezionale per questa data.</strong>
                  <p>Puoi aggiungere un’altra fascia oraria, per esempio mattina e pomeriggio separati.</p>
                </div>
              </div>
            )}

            <div className="admin-form-grid">
              <div>
                <label>Dalle</label>
                <select value={openingStartTime} onChange={(e) => setOpeningStartTime(e.target.value)} disabled={openingSaving} required>
                  <option value="">Apertura</option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label>Alle</label>
                <select value={openingEndTime} onChange={(e) => setOpeningEndTime(e.target.value)} disabled={openingSaving} required>
                  <option value="">Chiusura</option>
                  {slots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            <label>Nota interna</label>
            <input
              type="text"
              placeholder="Es. apertura speciale, recupero appuntamenti, evento..."
              value={openingReason}
              onChange={(e) => setOpeningReason(e.target.value)}
              disabled={openingSaving}
            />

            <button className="primary-cta" type="submit" disabled={openingSaving}>
              {openingSaving ? "Attendi..." : "Salva apertura eccezionale"}
            </button>
          </form>
)}
          <div className="section-title availability-list-title">
            <h3>Aperture eccezionali</h3>
            <span>{sortedExceptionalOpeningBlocks.length}</span>
          </div>

          {sortedExceptionalOpeningBlocks.length === 0 ? (
            <div className="empty-card compact">
              <strong>Nessuna apertura eccezionale</strong>
              <p>Quando aprirai una data normalmente chiusa, la vedrai qui.</p>
            </div>
          ) : (
            <div className="availability-block-list">
              {sortedExceptionalOpeningBlocks.map((block) => (
                <article className="modern-booking-card availability-block-card" key={block.id}>
                  <div className="modern-booking-top">
                    <div className="modern-time-pill">
                      <span>Open</span>
                      <strong>✓</strong>
                    </div>

                    <div className="modern-date-block">
                      <span>Apertura extra</span>
                      <strong>{formatAvailabilityBlockTitle(block)}</strong>
                    </div>
                  </div>

                  <div className="modern-booking-body">
                    <span>Fascia prenotabile</span>
                    <h3>{formatAvailabilityBlockTime(block)}</h3>
                    <p>{getCleanAvailabilityReason(block) || "Apertura eccezionale"}</p>
                  </div>

                  <button
                    className="admin-delete-booking-btn"
                    type="button"
                    disabled={availabilityDeletingId === block.id}
                    onClick={() => deleteAvailabilityBlock(block)}
                  >
                    {availabilityDeletingId === block.id ? "Rimozione..." : "Rimuovi apertura"}
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
