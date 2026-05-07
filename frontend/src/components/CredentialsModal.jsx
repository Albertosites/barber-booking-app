function CredentialsModal({
  session,
  newFullName,
  setNewFullName,
  newPhone,
  setNewPhone,
  newEmail,
  setNewEmail,
  newPassword,
  setNewPassword,
  credentialsLoading,
  updateCredentials,
  setShowCredentialsModal,
}) {
  return (
    <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-row">
          <div>
            <span className="popup-eyebrow">Account</span>
            <h2>Cambia credenziali</h2>
          </div>

          <button className="close-modal" type="button" onClick={() => setShowCredentialsModal(false)}>
            ×
          </button>
        </div>

        {!session?.user ? (
          <div className="empty-card compact">
            <strong>Accesso richiesto</strong>
            <p>Per modificare le credenziali devi prima accedere.</p>
          </div>
        ) : (
          <form className="credentials-form" onSubmit={updateCredentials}>
            <label>Nome e cognome</label>
            <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />

            <label>Telefono</label>
            <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />

            <label>Nuova email</label>
            <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />

            <label>Nuova password</label>
            <input
              type="password"
              placeholder="Lascia vuoto per non cambiarla"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button className="primary-cta" type="submit" disabled={credentialsLoading}>
              {credentialsLoading ? "Aggiornamento..." : "Salva credenziali"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default CredentialsModal;