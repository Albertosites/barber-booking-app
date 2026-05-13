import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import "./App.css";

async function checkPlatformAdminStatus() {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) {
    console.error(error);
    return false;
  }
  return Boolean(data);
}

function createSlugFromName(value) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(false);

  const [showCreateShop, setShowCreateShop] = useState(false);
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [shopCity, setShopCity] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [creatingShop, setCreatingShop] = useState(false);
  const [createdShop, setCreatedShop] = useState(null);

  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [expandedShopId, setExpandedShopId] = useState("");
  const [editShops, setEditShops] = useState({});
  const [savingShopId, setSavingShopId] = useState("");
  const [adminEmails, setAdminEmails] = useState({});
  const [addingAdminFor, setAddingAdminFor] = useState(null);
  const [updatingShopId, setUpdatingShopId] = useState("");

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function runCheck() {
      if (!session?.user) {
        if (!active) return;
        setIsPlatformAdmin(false);
        return;
      }

      setCheckingAdmin(true);
      const result = await checkPlatformAdminStatus();

      if (!active) return;

      setIsPlatformAdmin(result);
      setCheckingAdmin(false);

      if (result) {
        await loadShopsOverview();
      }
    }

    runCheck();

    return () => {
      active = false;
    };
  }, [session]);

  function handleShopNameChange(value) {
    setShopName(value);

    if (!shopSlug.trim()) {
      setShopSlug(createSlugFromName(value));
    }
  }

  function openShopDetails(shop) {
    const isAlreadyOpen = expandedShopId === shop.shop_id;

    if (isAlreadyOpen) {
      setExpandedShopId("");
      return;
    }

    setExpandedShopId(shop.shop_id);

    setEditShops((prev) => ({
      ...prev,
      [shop.shop_id]: {
        name: shop.name || "",
        slug: shop.slug || "",
        city: shop.city || "",
        address: shop.address || "",
        payment_status: shop.payment_status || shop.subscription_status || "active",
      },
    }));
  }

  function updateEditShopField(shopId, field, value) {
    setEditShops((prev) => ({
      ...prev,
      [shopId]: {
        ...(prev[shopId] || {}),
        [field]: field === "slug" ? createSlugFromName(value) : value,
      },
    }));
  }

  async function loadShopsOverview() {
    setShopsLoading(true);

    const { data, error } = await supabase.rpc("get_platform_shops_overview");

    setShopsLoading(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile caricare la lista shop.");
      return;
    }

    setShops(data || []);
  }

  async function saveShopDetails(shop) {
    const draft = editShops[shop.shop_id];

    if (!draft) return;

    const cleanName = String(draft.name || "").trim();
    const cleanSlug = createSlugFromName(draft.slug || cleanName);

    if (!cleanName) {
      alert("Il nome dello shop non può essere vuoto.");
      return;
    }

    if (!cleanSlug) {
      alert("Lo slug non è valido.");
      return;
    }

    setSavingShopId(shop.shop_id);

    const { error } = await supabase.rpc("update_platform_shop_details", {
      p_shop_id: shop.shop_id,
      p_name: cleanName,
      p_slug: cleanSlug,
      p_city: String(draft.city || "").trim(),
      p_address: String(draft.address || "").trim(),
      p_payment_status: draft.payment_status || "active",
    });

    setSavingShopId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare le modifiche dello shop.");
      return;
    }

    await loadShopsOverview();

    alert("Shop aggiornato.");
  }

  async function handleAddAdmin(shopId) {
    const emailValue = (adminEmails[shopId] || "").trim();

    if (!emailValue) {
      alert("Inserisci una email.");
      return;
    }

    setAddingAdminFor(shopId);

    const { error } = await supabase.rpc("add_shop_admin_by_email", {
      p_shop_id: shopId,
      p_email: emailValue,
    });

    setAddingAdminFor(null);

    if (error) {
      console.error(error);
      alert("Non è stato possibile aggiungere l'admin.");
      return;
    }

    setAdminEmails((prev) => ({
      ...prev,
      [shopId]: "",
    }));

    await loadShopsOverview();

    alert("Admin aggiunto correttamente.");
  }

  async function handleCreateShop(e) {
    e.preventDefault();

    if (creatingShop) return;

    const cleanName = shopName.trim();
    const cleanSlug = createSlugFromName(shopSlug || shopName);
    const cleanCity = shopCity.trim();
    const cleanAddress = shopAddress.trim();

    if (!cleanName) {
      alert("Inserisci il nome del salone.");
      return;
    }

    if (!cleanSlug) {
      alert("Lo slug non è valido.");
      return;
    }

    setCreatingShop(true);

    const { data, error } = await supabase.rpc("create_shop_with_defaults", {
      p_name: cleanName,
      p_slug: cleanSlug,
      p_city: cleanCity,
      p_address: cleanAddress,
    });

    setCreatingShop(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile creare lo shop. Controlla che lo slug non esista già.");
      return;
    }

    setCreatedShop({
      id: data,
      name: cleanName,
      slug: cleanSlug,
      city: cleanCity,
      address: cleanAddress,
      registerUrl: `/register/${cleanSlug}`,
    });

    setShopName("");
    setShopSlug("");
    setShopCity("");
    setShopAddress("");
    setShowCreateShop(false);

    await loadShopsOverview();

    alert("Shop creato correttamente.");
  }

  async function toggleShopActive(shop) {
    if (updatingShopId) return;

    const nextActive = !shop.active;
    let pausedReason = null;

    if (!nextActive) {
      pausedReason = window.prompt(
        `Motivo pausa per "${shop.name}"`,
        "Pagamento non ricevuto"
      );

      if (pausedReason === null) return;
    }

    const confirmed = window.confirm(
      nextActive
        ? `Vuoi riattivare lo shop "${shop.name}"?`
        : `Vuoi mettere in pausa lo shop "${shop.name}"?`
    );

    if (!confirmed) return;

    setUpdatingShopId(shop.shop_id);

    const { error } = await supabase.rpc("set_shop_active_status", {
      p_shop_id: shop.shop_id,
      p_active: nextActive,
      p_paused_reason: pausedReason,
    });

    setUpdatingShopId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile aggiornare lo stato dello shop.");
      return;
    }

    await loadShopsOverview();

    alert(nextActive ? "Shop riattivato." : "Shop messo in pausa.");
  }

  async function handleLogin(e) {
    e.preventDefault();

    if (authLoading) return;

    setAuthLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setAuthLoading(false);

    if (error) {
      console.error(error);
      alert("Accesso non riuscito.");
      return;
    }

    setEmail("");
    setPassword("");
  }

  async function logout() {
    await supabase.auth.signOut();
    setSession(null);
    setIsPlatformAdmin(false);
    setShops([]);
  }

  if (loadingSession) {
    return (
      <main className="backoffice-page">
        <section className="backoffice-card">
          <p>Caricamento backoffice...</p>
        </section>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="backoffice-page">
        <section className="backoffice-card">
          <span className="eyebrow">Barber Booking SaaS</span>
          <h1>Backoffice privato</h1>
          <p>Accedi con il tuo account autorizzato per gestire gli shop.</p>

          <form className="backoffice-form" onSubmit={handleLogin}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button type="submit" disabled={authLoading}>
              {authLoading ? "Accesso in corso..." : "Entra nel backoffice"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (checkingAdmin) {
    return (
      <main className="backoffice-page">
        <section className="backoffice-card">
          <p>Verifica autorizzazioni...</p>
        </section>
      </main>
    );
  }

  if (!isPlatformAdmin) {
    return (
      <main className="backoffice-page">
        <section className="backoffice-card">
          <span className="eyebrow">Accesso negato</span>
          <h1>Non sei autorizzato</h1>
          <p>Questo backoffice è riservato agli amministratori della piattaforma.</p>
          <button type="button" onClick={logout}>
            Esci
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="backoffice-page">
      <section className="backoffice-card wide">
        <div className="topbar">
          <div>
            <span className="eyebrow">Barber Booking SaaS</span>
            <h1>Backoffice piattaforma</h1>
            <p>Gestione privata shop, onboarding e stato pagamenti.</p>
          </div>

          <button type="button" className="secondary" onClick={logout}>
            Logout
          </button>
        </div>

        <div className="empty-state">
          <div className="topbar">
            <div>
              <h2>Creazione shop</h2>
              <p>Crea un nuovo salone solo quando serve.</p>
            </div>

            <button
              type="button"
              className="secondary"
              onClick={() => setShowCreateShop((prev) => !prev)}
            >
              {showCreateShop ? "Chiudi" : "Crea shop"}
            </button>
          </div>

          {showCreateShop && (
            <form className="backoffice-form" onSubmit={handleCreateShop}>
              <label>
                Nome salone / barbiere
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  placeholder="Esempio: Barber Mario Rossi"
                  required
                />
              </label>

              <label>
                Slug URL
                <input
                  type="text"
                  value={shopSlug}
                  onChange={(e) => setShopSlug(createSlugFromName(e.target.value))}
                  placeholder="barber-mario-rossi"
                  required
                />
              </label>

              <label>
                Città
                <input
                  type="text"
                  value={shopCity}
                  onChange={(e) => setShopCity(e.target.value)}
                  placeholder="Esempio: Palermo"
                />
              </label>

              <label>
                Indirizzo
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="Esempio: Via Roma 25"
                />
              </label>

              <button type="submit" disabled={creatingShop}>
                {creatingShop ? "Creazione shop..." : "Crea shop"}
              </button>
            </form>
          )}

          {createdShop && (
            <div className="empty-state">
              <h2>Ultimo shop creato</h2>
              <p>
                <strong>{createdShop.name}</strong>
              </p>
              <p>
                URL registrazione: <code>{createdShop.registerUrl}</code>
              </p>
            </div>
          )}
        </div>

        <div className="empty-state">
          <div className="topbar">
            <div>
              <h2>Shop creati</h2>
              <p>Card compatte. Apri i dettagli per modificare dati e gestione.</p>
            </div>

            <button type="button" className="secondary" onClick={loadShopsOverview}>
              {shopsLoading ? "Aggiornamento..." : "Aggiorna"}
            </button>
          </div>

          {shopsLoading && <p>Caricamento shop...</p>}

          {!shopsLoading && shops.length === 0 && <p>Nessuno shop trovato.</p>}

          {!shopsLoading && shops.length > 0 && (
            <div className="shop-list">
              {shops.map((shop) => {
                const isOpen = expandedShopId === shop.shop_id;
                const draft = editShops[shop.shop_id] || {};

                return (
                  <div className="shop-row compact" key={shop.shop_id}>
                    <div className="shop-main">
                      <strong>{shop.name}</strong>
                      <p>
                        {[shop.city, shop.address].filter(Boolean).join(" • ") || "Sede non inserita"}
                      </p>
                    </div>

                    <div className="shop-status">
                      <span className={shop.active ? "status-pill active" : "status-pill paused"}>
                        {shop.active ? "Attivo" : "In pausa"}
                      </span>
                      <p>{shop.payment_status || shop.subscription_status}</p>
                    </div>

                    <div className="metrics-grid">
                      <div className="metric-card">
                        <strong>{shop.customer_count}</strong>
                        <p>clienti</p>
                      </div>

                      <div className="metric-card">
                        <strong>{shop.admin_count}</strong>
                        <p>admin</p>
                      </div>

                      <div className="metric-card">
                        <strong>{shop.booking_count}</strong>
                        <p>prenotazioni</p>
                      </div>
                    </div>

                    <div className="shop-actions">
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => openShopDetails(shop)}
                      >
                        {isOpen ? "Chiudi" : "Apri"}
                      </button>
                    </div>

                    {isOpen && (
                      <div className="shop-details-panel">
                        <div className="details-grid">
                          <label>
                            Nome
                            <input
                              type="text"
                              value={draft.name || ""}
                              onChange={(e) =>
                                updateEditShopField(shop.shop_id, "name", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            Slug
                            <input
                              type="text"
                              value={draft.slug || ""}
                              onChange={(e) =>
                                updateEditShopField(shop.shop_id, "slug", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            Città
                            <input
                              type="text"
                              value={draft.city || ""}
                              onChange={(e) =>
                                updateEditShopField(shop.shop_id, "city", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            Indirizzo
                            <input
                              type="text"
                              value={draft.address || ""}
                              onChange={(e) =>
                                updateEditShopField(shop.shop_id, "address", e.target.value)
                              }
                            />
                          </label>

                          <label>
                            Stato pagamento
                            <select
                              value={draft.payment_status || "active"}
                              onChange={(e) =>
                                updateEditShopField(shop.shop_id, "payment_status", e.target.value)
                              }
                            >
                              <option value="trial">Trial</option>
                              <option value="active">Active</option>
                              <option value="unpaid">Unpaid</option>
                              <option value="grace_period">Grace period</option>
                              <option value="paused">Paused</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </label>
                        </div>

                        <div className="details-actions">
                          <button
                            type="button"
                            onClick={() => saveShopDetails(shop)}
                            disabled={savingShopId === shop.shop_id}
                          >
                            {savingShopId === shop.shop_id ? "Salvataggio..." : "Salva modifiche"}
                          </button>

                          <button
                            type="button"
                            className="secondary"
                            onClick={() => toggleShopActive(shop)}
                            disabled={updatingShopId === shop.shop_id}
                          >
                            {updatingShopId === shop.shop_id
                              ? "Aggiornamento..."
                              : shop.active
                                ? "Metti in pausa"
                                : "Riattiva"}
                          </button>
                        </div>

                        <div className="shop-admin-form">
                          <input
                            type="email"
                            placeholder="Email nuovo admin"
                            value={adminEmails[shop.shop_id] || ""}
                            onChange={(e) =>
                              setAdminEmails((prev) => ({
                                ...prev,
                                [shop.shop_id]: e.target.value,
                              }))
                            }
                          />

                          <button
                            type="button"
                            onClick={() => handleAddAdmin(shop.shop_id)}
                            disabled={addingAdminFor === shop.shop_id}
                          >
                            {addingAdminFor === shop.shop_id ? "Aggiunta..." : "Aggiungi admin"}
                          </button>
                        </div>

                        <p>
                          URL registrazione: <code>/register/{shop.slug}</code>
                        </p>
                        <p>
                          ID shop: <code>{shop.shop_id}</code>
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;