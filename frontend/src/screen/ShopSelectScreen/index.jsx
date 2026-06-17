import { supabase } from "../../supabaseClient";
import { X } from "lucide-react";
function ShopSelectScreen({
  linkedShops,
  currentShopId,
  setCurrentShopId,
  setShopChoiceCompleted,
  showConfirm,
  showToast,
}) {
async function handleLeaveShop(shop) {
  if (shop.role === "admin") {
    showToast("Sei admin di questo salone. Non puoi rimuoverlo dal tuo account.");
    return;
  }

  const firstConfirm = await showConfirm(
    `Vuoi davvero rimuovere "${shop.name}" dal tuo account?`
  );

  if (!firstConfirm) return;

  const secondConfirm = await showConfirm(
    "Perderai l'accesso alle prenotazioni e ai dati di questo salone.",
    true
  );

  if (!secondConfirm) return;

  const { error } = await supabase.rpc("leave_shop", {
    p_shop_id: shop.id,
  });

  if (error) {
    console.error(error);
    showToast("Non è stato possibile rimuovere il salone.");
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
            <div
  key={shop.id}
  role="button"
  tabIndex={isShopActive ? 0 : -1}
  aria-disabled={!isShopActive}
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
  onKeyDown={(event) => {
    if (!isShopActive) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setCurrentShopId(shop.id);
      setShopChoiceCompleted(true);
    }
  }}
>
  <div className="shop-card-left">
    <button
      type="button"
      className="shop-remove-icon"
      onClick={(event) => {
        event.stopPropagation();
        handleLeaveShop(shop);
      }}
    >
      <X size={14} strokeWidth={2.5} />
    </button>

    <div className="shop-card-info">
      <strong>{shop.name || "Barber Shop"}</strong>

      <span>
        {[shop.city, shop.address]
          .filter(Boolean)
          .join(" • ")}
      </span>

      {!isShopActive && (
        <span className="shop-paused-badge">
          Salone temporaneamente sospeso
        </span>
      )}
    </div>
  </div>

  <small>
    {!isShopActive
      ? "Non disponibile"
      : isSelected
        ? "Selezionato"
        : "Entra"}
  </small>
</div>
          );
        })}
      </div>
    </section>
  );
}

export default ShopSelectScreen;
