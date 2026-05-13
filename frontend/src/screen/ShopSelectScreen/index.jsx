import { supabase } from "../../supabaseClient";
import { X } from "lucide-react";
function ShopSelectScreen({
  linkedShops,
  currentShopId,
  setCurrentShopId,
  setShopChoiceCompleted,
}) {
async function handleLeaveShop(shop) {
  const firstConfirm = window.confirm(
    `Vuoi davvero rimuovere "${shop.name}" dal tuo account?`
  );

  if (!firstConfirm) return;

  const secondConfirm = window.confirm(
    "Perderai l'accesso alle prenotazioni e ai dati di questo salone."
  );

  if (!secondConfirm) return;

  const { error } = await supabase.rpc("leave_shop", {
    p_shop_id: shop.id,
  });

  if (error) {
    console.error(error);
    alert("Non è stato possibile rimuovere il salone.");
    return;
  }

  window.location.reload();
}
  
  return (
    <section className="screen shop-select-screen">
      <div className="shop-select-hero">
        <span>BarberBooking</span>
        <h1>Scegli il salone</h1>
        <p>
          Hai più saloni collegati al tuo account. Seleziona quello in cui vuoi entrare.
        </p>
      </div>

      <div className="shop-select-list">
        {linkedShops.map((shop) => {
          const isSelected = currentShopId === shop.id;
          const isShopActive = shop.active !== false;

          return (
            <button
              key={shop.id}
              type="button"
              disabled={!isShopActive}
              className={[
                "shop-select-card",
                isSelected ? "active" : "",
                !isShopActive ? "disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (!isShopActive) return;

                setCurrentShopId(shop.id);
                setShopChoiceCompleted(true);
              }}
            >
              <>
  <div className="shop-card-left">
    <button
      type="button"
      className="shop-remove-icon"
      onClick={(e) => {
        e.stopPropagation();
        handleLeaveShop(shop);
      }}
    >
      <X size={14} strokeWidth={2.5} />
    </button>

    <div className="shop-card-info">
      <strong>{shop.name || "Barber Shop"}</strong>

      {shop.slug && <span>@{shop.slug}</span>}

      {!isShopActive && (
        <span className="shop-paused-badge">
          Salone temporaneamente sospeso
        </span>
      )}
    </div>
  </div>
</>

              <small>
                {!isShopActive
                  ? "Non disponibile"
                  : isSelected
                    ? "Selezionato"
                    : "Entra"}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ShopSelectScreen;