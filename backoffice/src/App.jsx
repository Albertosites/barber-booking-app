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

  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [creatingShop, setCreatingShop] = useState(false);
  const [createdShop, setCreatedShop] = useState(null);

  const [shops, setShops] = useState([]);
  const [shopsLoading, setShopsLoading] = useState(false);

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

  async function handleCreateShop(e) {
    e.preventDefault();

    if (creatingShop) return;

    const cleanName = shopName.trim();
    const cleanSlug = createSlugFromName(shopSlug || shopName);

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
      registerUrl: `/register/${cleanSlug}`,
    });

    setShopName("");
    setShopSlug("");

    await loadShopsOverview();

    alert("Shop creato correttamente.");
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
          <h2>Crea nuovo shop</h2>
          <p>Crea un nuovo salone con operatori e servizi default già pronti.</p>

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

            <button type="submit" disabled={creatingShop}>
              {creatingShop ? "Creazione shop..." : "Crea shop"}
            </button>
          </form>

          {createdShop && (
            <div className="empty-state">
              <h2>Shop creato</h2>
              <p>
                <strong>{createdShop.name}</strong>
              </p>
              <p>
                ID shop: <code>{createdShop.id}</code>
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
              <p>Panoramica aggregata senza dati personali dei clienti.</p>
            </div>

            <button type="button" className="secondary" onClick={loadShopsOverview}>
              {shopsLoading ? "Aggiornamento..." : "Aggiorna"}
            </button>
          </div>

          {shopsLoading && <p>Caricamento shop...</p>}

          {!shopsLoading && shops.length === 0 && (
            <p>Nessuno shop trovato.</p>
          )}

          {!shopsLoading && shops.length > 0 && (
            <div className="shop-list">
              {shops.map((shop) => (
                <div className="shop-row" key={shop.shop_id}>
                  <div>
                    <strong>{shop.name}</strong>
                    <p>
                      <code>/register/{shop.slug}</code>
                    </p>
                    <p>
                      ID: <code>{shop.shop_id}</code>
                    </p>
                  </div>

                  <div>
                    <span>{shop.active ? "Attivo" : "In pausa"}</span>
                    <p>Pagamento: {shop.payment_status || shop.subscription_status}</p>
                  </div>

                  <div>
                    <strong>{shop.customer_count}</strong>
                    <p>clienti</p>
                  </div>

                  <div>
                    <strong>{shop.admin_count}</strong>
                    <p>admin</p>
                  </div>

                  <div>
                    <strong>{shop.booking_count}</strong>
                    <p>prenotazioni</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;