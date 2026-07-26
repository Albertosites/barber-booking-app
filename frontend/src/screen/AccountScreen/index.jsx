import { LogIn, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function AccountScreen({
  setActivePage,
  session,
  userProfile,
  isAdmin,
  logout,
  handleAuth,
  authMode,
  setAuthMode,
  authLoading,
  authFullName,
  setAuthFullName,
  authPhone,
  setAuthPhone,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  resetPassword,
}) {
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);
  const wasLoadingRef = useRef(false);

  useEffect(() => {
    if (authLoading) {
      wasLoadingRef.current = true;
      return;
    }
    if (wasLoadingRef.current && !session) {
      wasLoadingRef.current = false;
      setCooldown(5);
      clearInterval(cooldownRef.current);
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      wasLoadingRef.current = false;
    }
  }, [authLoading, session]);

  useEffect(() => {
    return () => clearInterval(cooldownRef.current);
  }, []);

  return (
    <section className="screen">
      <header className="page-header">
        <button className="back-btn" onClick={() => setActivePage("home")}>
          ←
        </button>
        <div>
          <span className="eyebrow">Account</span>
          <h1>Area cliente</h1>
        </div>
      </header>

      {session?.user ? (
        <div className="lookup-card">
          <div>
            <span>Account attivo</span>
            <strong>{session.user.email}</strong>
            {userProfile?.full_name && <p>{userProfile.full_name}</p>}
            {userProfile?.phone && <p>{userProfile.phone}</p>}
            {isAdmin && <span>Profilo barbiere/admin</span>}
          </div>
          <button className="primary-cta" type="button" onClick={() => setActivePage("my-bookings")}>
            Vedi le mie prenotazioni
          </button>
          <button className="cancel-btn" type="button" onClick={logout}>
            Esci
          </button>
        </div>
      ) : (
        <form className="booking-form" onSubmit={handleAuth}>
          <div className="folder-grid">
            <button
              type="button"
              className={authMode === "login" ? "folder-card active" : "folder-card"}
              onClick={() => setAuthMode("login")}
              disabled={authLoading}
            >
              <LogIn size={26} strokeWidth={2.2} />
              <strong>Accedi</strong>
              <p>Hai già un account</p>
            </button>

            <button
              type="button"
              className={authMode === "register" ? "folder-card active" : "folder-card"}
              onClick={() => setAuthMode("register")}
              disabled={authLoading}
            >
              <UserPlus size={26} strokeWidth={2.2} />
              <strong>Registrati</strong>
              <p>Nuovo cliente</p>
            </button>
          </div>

          {authMode === "register" && (
            <>
              <label>Nome e cognome</label>
              <input
                type="text"
                placeholder="Es. Marco Rossi"
                value={authFullName}
                onChange={(e) => setAuthFullName(e.target.value)}
                disabled={authLoading}
                required
              />

              <label>Telefono</label>
              <input
                type="tel"
                placeholder="Es. 3331234567"
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                disabled={authLoading}
                required
              />
            </>
          )}

          <label>Email</label>
          <input
            type="email"
            placeholder="nome@email.com"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            disabled={authLoading}
            required
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Minimo 6 caratteri"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            disabled={authLoading}
            required
          />

          {authMode === "login" && (
            <button
              className="forgot-password-btn"
              type="button"
              onClick={resetPassword}
              disabled={authLoading}
            >
              Password dimenticata?
            </button>
          )}

          <button className="primary-cta" type="submit" disabled={authLoading || cooldown > 0}>
            {authLoading
              ? "Attendi..."
              : cooldown > 0
              ? `Riprova tra ${cooldown}s`
              : authMode === "login"
              ? "Accedi"
              : "Crea account"}
          </button>
        </form>
      )}
    </section>
  );
}

export default AccountScreen;