function ShopSelectScreen({
  linkedShops,
  currentShopId,
  setCurrentShopId,
}) {
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
          const isActive = currentShopId === shop.id;

          return (
            <button
              key={shop.id}
              type="button"
              className={isActive ? "shop-select-card active" : "shop-select-card"}
              onClick={() => {
  localStorage.setItem("barberbooking_current_shop_id", shop.id);
  setCurrentShopId(shop.id);
}}
            >
              <div>
                <strong>{shop.name || "Barber Shop"}</strong>
                {shop.slug && <span>@{shop.slug}</span>}
              </div>

              <small>{isActive ? "Selezionato" : "Entra"}</small>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default ShopSelectScreen;