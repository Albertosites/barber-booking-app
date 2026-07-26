import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

const APP_BASE_URL = "https://barber-booking-app-rho.vercel.app";

function RegisterScreen() {
  const { slug } = useParams();

  const [loading, setLoading] = useState(true);
  const [shop, setShop] = useState(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusError, setStatusError] = useState("");

  // Stato per conferma utente già esistente
  const [pendingExistingUser, setPendingExistingUser] = useState(null);
  const [existingSession, setExistingSession] = useState(null);

  useEffect(() => {
    async function init() {
      setLoading(true);

      // Controlla se c'è già una sessione attiva
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        setExistingSession(sessionData.session);
      }

      const { data, error } = await supabase
        .from("shops")
        .select("id, name, slug, active")
        .eq("slug", slug)
        .eq("active", true)
        .maybeSingle();

      setLoading(false);

      if (error) {
        console.error(error);
        return;
      }

      setShop(data || null);
    }

    init();
  }, [slug]);

  function redirectToApp() {
    window.location.href = `${APP_BASE_URL}?shop=${encodeURIComponent(slug)}`;
  }

  async function saveProfile(userId, cleanEmail, cleanFullName, cleanPhone) {
    const { error } = await supabase
      .from("profiles")
      .upsert(
        { id: userId, email: cleanEmail, full_name: cleanFullName, phone: cleanPhone },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  async function joinShopBySlug() {
    const { error } = await supabase.rpc("join_shop_by_slug", {
      target_slug: slug,
    });

    if (error) {
      console.error(error);
      return false;
    }

    return true;
  }

  async function confirmAddShop() {
    if (!pendingExistingUser) return;

    const { session, cleanEmail, cleanFullName, cleanPhone } = pendingExistingUser;

    const profileSaved = await saveProfile(session.user.id, cleanEmail, cleanFullName, cleanPhone);

    if (!profileSaved) {
      setStatusError("Accesso effettuato, ma non è stato possibile aggiornare il profilo.");
      setPendingExistingUser(null);
      setSubmitting(false);
      return;
    }

    const joined = await joinShopBySlug();

    if (!joined) {
      setStatusError("Non è stato possibile collegare questo salone al tuo account.");
      setPendingExistingUser(null);
      setSubmitting(false);
      return;
    }

    setPendingExistingUser(null);
    setStatusMessage("Salone aggiunto correttamente. Reindirizzamento in corso...");
    setTimeout(redirectToApp, 1800);
    setSubmitting(false);
  }

  async function cancelAddShop() {
    await supabase.auth.signOut();
    setPendingExistingUser(null);
    setSubmitting(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!shop) {
      setStatusError("Salone non valido.");
      return;
    }

    if (!cleanFullName || !cleanEmail || !cleanPhone || !password) {
      setStatusError("Compila tutti i campi.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");
    setStatusError("");

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (!signInError && signInData.session?.user) {
      // Utente già esistente — mostra conferma inline
      setPendingExistingUser({
        session: signInData.session,
        cleanEmail,
        cleanFullName,
        cleanPhone,
      });
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: cleanFullName, phone: cleanPhone },
      },
    });

    if (signUpError) {
      console.error(signUpError);
      setSubmitting(false);
      setStatusError("Non è stato possibile creare l'account. Se hai già un account, controlla email e password.");
      return;
    }

    if (!signUpData.session?.user) {
      setSubmitting(false);
      setStatusMessage("Account creato. Controlla la tua email per confermare la registrazione, poi accedi dall'app.");
      return;
    }

    const profileSaved = await saveProfile(signUpData.session.user.id, cleanEmail, cleanFullName, cleanPhone);

    if (!profileSaved) {
      setSubmitting(false);
      setStatusError("Account creato, ma non è stato possibile salvare il profilo.");
      return;
    }

    const joined = await joinShopBySlug();

    if (!joined) {
      setSubmitting(false);
      setStatusError("Account creato, ma non è stato possibile collegarlo al salone.");
      return;
    }

    setStatusMessage("Registrazione completata. Reindirizzamento in corso...");
    setTimeout(redirectToApp, 1800);
    setSubmitting(false);
  }

  return (
    <main className="registration-page">
      <section className="registration-card">
        <p className="eyebrow">BarberBooking</p>

        {loading && (
          <>
            <h1>Caricamento salone</h1>
            <p>Stiamo preparando la registrazione.</p>
          </>
        )}

        {!loading && !shop && (
          <>
            <h1>Salone non trovato</h1>
            <p>Il link di registrazione non è valido oppure il salone non esiste.</p>
          </>
        )}

        {!loading && shop && existingSession && !pendingExistingUser && (
          <>
            <h1>{shop.name}</h1>
            <p>Sei già iscritto a BarberBooking con <strong>{existingSession.user.email}</strong>. Vuoi aggiungere il salone <strong>{shop.name}</strong> ai tuoi saloni?</p>
            <button className="registration-submit" onClick={async () => {
              setSubmitting(true);
              const joined = await joinShopBySlug();
              if (!joined) {
                setStatusError("Non è stato possibile collegare il salone al tuo account.");
                setSubmitting(false);
                return;
              }
              setStatusMessage("Salone aggiunto. Reindirizzamento in corso...");
              setTimeout(redirectToApp, 1800);
              setSubmitting(false);
            }} disabled={submitting}>
              {submitting ? "Operazione in corso..." : "Sì, aggiungi salone"}
            </button>
            <button
              className="registration-submit"
              style={{ marginTop: "10px", background: "#f5f5f5", color: "#111" }}
              onClick={async () => { await supabase.auth.signOut(); setExistingSession(null); }}
              disabled={submitting}
            >
              No, usa un altro account
            </button>
            {statusMessage && <p className="registration-status">{statusMessage}</p>}
            {statusError && <p className="registration-status" style={{ color: "#b91c1c" }}>{statusError}</p>}
          </>
        )}

        {!loading && shop && !existingSession && !pendingExistingUser && (
          <>
            <h1>{shop.name}</h1>
            <p>Crea il tuo account per entrare direttamente nell'app del tuo barbiere.</p>

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="registration-field">
                <label>Nome completo</label>
                <input type="text" placeholder="Mario Rossi" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={submitting} />
              </div>

              <div className="registration-field">
                <label>Email</label>
                <input type="email" placeholder="mario@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={submitting} />
              </div>

              <div className="registration-field">
                <label>Telefono</label>
                <input type="tel" placeholder="+39 333 1234567" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={submitting} />
              </div>

              <div className="registration-field">
                <label>Password</label>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={submitting} />
              </div>

              <button type="submit" className="registration-submit" disabled={submitting}>
                {submitting ? "Operazione in corso..." : "Crea account"}
              </button>

              {statusMessage && <p className="registration-status">{statusMessage}</p>}
              {statusError && <p className="registration-status" style={{ color: "#b91c1c" }}>{statusError}</p>}
            </form>
          </>
        )}

        {pendingExistingUser && (
          <>
            <h1>{shop?.name}</h1>
            <p>Sei già iscritto a uno o più barbieri con questa email. Vuoi aggiungere il salone <strong>{shop?.name}</strong> ai tuoi saloni?</p>
            <button className="registration-submit" onClick={confirmAddShop} disabled={submitting}>
              {submitting ? "Operazione in corso..." : "Sì, aggiungi salone"}
            </button>
            <button
              className="registration-submit"
              style={{ marginTop: "10px", background: "#f5f5f5", color: "#111" }}
              onClick={cancelAddShop}
              disabled={submitting}
            >
              No, annulla
            </button>
            {statusError && <p className="registration-status" style={{ color: "#b91c1c" }}>{statusError}</p>}
          </>
        )}
      </section>
    </main>
  );
}

export default RegisterScreen;
