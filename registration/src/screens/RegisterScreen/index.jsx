import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";
const APP_REDIRECT_URL = "https://barber-booking-app-git-main-albertix2009-9798s-projects.vercel.app/";


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

  useEffect(() => {
    async function loadShop() {
      setLoading(true);

      const { data, error } = await supabase
        .from("shops")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      setLoading(false);

      if (error) {
        console.error(error);
        return;
      }

      setShop(data || null);
    }

    loadShop();
  }, [slug]);

  async function saveProfile(userId, cleanEmail, cleanFullName, cleanPhone) {
    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: cleanEmail,
          full_name: cleanFullName,
          phone: cleanPhone,
        },
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

  async function handleSubmit(e) {
    e.preventDefault();

    if (submitting) return;

    const cleanFullName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    if (!shop) {
      alert("Salone non valido.");
      return;
    }

    if (!cleanFullName || !cleanEmail || !cleanPhone || !password) {
      alert("Compila tutti i campi.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (!signInError && signInData.session?.user) {
      const confirmAdd = window.confirm(
        `Ti abbiamo riconosciuto.\n\nSei già iscritto a BarberBooking con questa email.\n\nVuoi aggiungere anche il salone "${shop.name}" alla tua app?`
      );

      if (!confirmAdd) {
        await supabase.auth.signOut();
        setSubmitting(false);
        return;
      }

      const profileSaved = await saveProfile(
        signInData.session.user.id,
        cleanEmail,
        cleanFullName,
        cleanPhone
      );

      if (!profileSaved) {
        setSubmitting(false);
        alert("Accesso effettuato, ma non è stato possibile aggiornare il profilo.");
        return;
      }

      const joined = await joinShopBySlug();

      if (!joined) {
        setSubmitting(false);
        alert("Non è stato possibile collegare questo salone al tuo account.");
        return;
      }

      setStatusMessage(
  `Salone aggiunto correttamente. Reindirizzamento all’app in corso...`
);

setTimeout(() => {
  window.location.href = APP_REDIRECT_URL;
}, 1800);

setSubmitting(false);
return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          phone: cleanPhone,
        },
      },
    });

    if (signUpError) {
      console.error(signUpError);
      setSubmitting(false);
      alert("Non è stato possibile creare l’account. Se hai già un account, controlla email e password.");
      return;
    }

    if (!signUpData.session?.user) {
      setSubmitting(false);
      setStatusMessage(
        "Account creato. Controlla la tua email per confermare la registrazione, poi accedi dall’app."
      );
      return;
    }

    const profileSaved = await saveProfile(
      signUpData.session.user.id,
      cleanEmail,
      cleanFullName,
      cleanPhone
    );

    if (!profileSaved) {
      setSubmitting(false);
      alert("Account creato, ma non è stato possibile salvare il profilo.");
      return;
    }

    const joined = await joinShopBySlug();

    if (!joined) {
      setSubmitting(false);
      alert("Account creato, ma non è stato possibile collegarlo al salone.");
      return;
    }

    setStatusMessage(
  "Registrazione completata. Reindirizzamento all’app in corso..."
);

setTimeout(() => {
  window.location.href = APP_REDIRECT_URL;
}, 1800);

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
            <p>
              Il link di registrazione non è valido oppure il salone non esiste.
            </p>
          </>
        )}

        {!loading && shop && (
          <>
            <h1>{shop.name}</h1>

            <p>
              Crea il tuo account per entrare direttamente
              nell’app del tuo barbiere.
            </p>

            <form className="registration-form" onSubmit={handleSubmit}>
              <div className="registration-field">
                <label>Nome completo</label>

                <input
                  type="text"
                  placeholder="Mario Rossi"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="registration-field">
                <label>Email</label>

                <input
                  type="email"
                  placeholder="mario@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="registration-field">
                <label>Telefono</label>

                <input
                  type="tel"
                  placeholder="+39 333 1234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="registration-field">
                <label>Password</label>

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={submitting}
                />
              </div>

              <button
                type="submit"
                className="registration-submit"
                disabled={submitting}
              >
                {submitting ? "Operazione in corso..." : "Crea account"}
              </button>

              {statusMessage && (
                <p className="registration-status">{statusMessage}</p>
              )}
            </form>
          </>
        )}
      </section>
    </main>
  );
}

export default RegisterScreen;