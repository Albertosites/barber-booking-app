import { useState } from "react";
export default function AdminAvailability({
  closureBlocks,
  exceptionalOpeningBlocks,
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
}) {
  const [showClosureForm, setShowClosureForm] = useState(false);
  const [showOpeningForm, setShowOpeningForm] = useState(false);
    return (
    <div className="admin-panel availability-panel">
      <div className="section-title">
        <h3>Disponibilità</h3>
        <span>
          {closureBlocks.length} chiusure · {exceptionalOpeningBlocks.length} aperture
        </span>
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
              <option value="recurring_full_day">Ricorrenza settimanale - giornata intera</option>
              <option value="recurring_range">Ricorrenza settimanale - fascia oraria</option>
            </select>

            {availabilityMode.startsWith("date") && (
              <>
                <label>Giorno</label>
                <input type="date" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} disabled={availabilitySaving} required />
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
              {sortedAvailabilityBlocks.map((block) => (
                <article className="modern-booking-card availability-block-card" key={block.id}>
                  <div className="modern-booking-top">
                    <div className="modern-time-pill">
                      <span>{block.recurring ? "Ogni" : "Tipo"}</span>
                      <strong>{block.recurring ? "↻" : "1x"}</strong>
                    </div>

                    <div className="modern-date-block">
                      <span>{block.recurring ? "Ricorrenza" : "Data"}</span>
                      <strong>{formatAvailabilityBlockTitle(block)}</strong>
                    </div>
                  </div>

                  <div className="modern-booking-body">
                    <span>Blocco</span>
                    <h3>{formatAvailabilityBlockTime(block)}</h3>
                    <p>{getCleanAvailabilityReason(block) || "Nessun motivo inserito"}</p>
                  </div>

                  <button
                    className="admin-delete-booking-btn"
                    type="button"
                    disabled={availabilityDeletingId === block.id}
                    onClick={() => deleteAvailabilityBlock(block)}
                  >
                    {availabilityDeletingId === block.id ? "Rimozione..." : "Rimuovi chiusura"}
                  </button>
                </article>
              ))}
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
            <input type="date" value={openingDate} onChange={(e) => setOpeningDate(e.target.value)} disabled={openingSaving} required />

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