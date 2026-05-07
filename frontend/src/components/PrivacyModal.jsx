function PrivacyModal({
  setShowPrivacyModal,
}) {
  return (
    <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
      <div className="modal-card privacy-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <span className="popup-eyebrow">Powered by (nome temporaneo)</span>
            <h2>Privacy & Account</h2>
          </div>

          <button className="close-modal" type="button" onClick={() => setShowPrivacyModal(false)}>
            ×
          </button>
        </div>

        <div className="privacy-content">
          <section>
            <h3>Dati raccolti</h3>
            <p>
              Durante l’utilizzo dell’app possono essere raccolti nome, email, numero di telefono,
              prenotazioni effettuate e dati tecnici necessari al funzionamento dell’account e delle sessioni.
            </p>
          </section>

          <section>
            <h3>Finalità</h3>
            <p>
              I dati vengono utilizzati per gestire prenotazioni, autenticazione, accesso all’area cliente,
              comunicazioni operative legate agli appuntamenti e funzionamento tecnico dell’applicazione.
            </p>
          </section>

          <section>
            <h3>Accesso condiviso tra applicazioni</h3>
            <p>
              L’account utilizzato per accedere può essere riconosciuto anche da altre applicazioni sviluppate
              dalla stessa piattaforma Powered by (nome temporaneo). Questo rende più semplice usare le stesse
              credenziali su più saloni aderenti.
            </p>
          </section>

          <section>
            <h3>Separazione dei dati tra saloni</h3>
            <p>
              Anche se l’accesso account può essere condiviso, i dati operativi restano separati per ogni salone.
              Prenotazioni, servizi, immagini e dati amministrativi di un salone non sono visibili agli altri saloni.
            </p>
          </section>

          <section>
            <h3>Logout</h3>
            <p>
              Il logout disconnette semplicemente l’utente dall’app corrente. Non elimina account, prenotazioni
              o dati associati.
            </p>
          </section>

          <section>
            <h3>Cancellazione account</h3>
            <p>
              La cancellazione account elimina definitivamente profilo, prenotazioni, collegamenti ai saloni
              e dati associati. La cancellazione viene applicata a tutte le applicazioni collegate alla piattaforma
              Powered by (nome temporaneo) e non può essere annullata.
            </p>
          </section>

          <section>
            <h3>Sicurezza</h3>
            <p>
              L’app utilizza sistemi di autenticazione, database e archiviazione cloud professionali. L’accesso
              ai dati amministrativi è limitato agli account autorizzati del relativo salone.
            </p>
          </section>

          <section>
            <h3>Cookie e dati tecnici</h3>
            <p>
              L’app può utilizzare dati tecnici necessari al funzionamento dell’autenticazione e delle sessioni.
              I dati personali non vengono venduti a terze parti.
            </p>
          </section>

          <section>
            <h3>Contatti</h3>
            <p>
              Per richieste relative ai dati personali, all’accesso, alla modifica o alla cancellazione account,
              è possibile contattare il gestore della piattaforma.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivacyModal;