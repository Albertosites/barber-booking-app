function JoinShopPopup({
  joinShopLoading,
  confirmJoinShop,
  cancelJoinShop,
}) {
  return (
    <div className="popup-overlay">
      <div className="popup-card">
        <span className="popup-eyebrow">Account riconosciuto</span>
        <h3>Vuoi usare questo account anche per questo salone?</h3>
        <p>
          Hai già utilizzato un’app sviluppata da Powered by (nome temporaneo).
          Puoi usare le stesse credenziali anche qui.
        </p>
        <small>
          Le prenotazioni e i dati del salone resteranno separati. Questo salone potrà vedere solo gli appuntamenti effettuati qui.
        </small>

        <div className="popup-actions">
          <button className="primary-cta" type="button" disabled={joinShopLoading} onClick={confirmJoinShop}>
            {joinShopLoading ? "Collegamento..." : "Usa questo account"}
          </button>
          <button className="secondary-cta" type="button" disabled={joinShopLoading} onClick={cancelJoinShop}>
            Esci
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinShopPopup;