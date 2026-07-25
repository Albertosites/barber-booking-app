import { CalendarDays, Scissors, Ban, BadgePercent, UserCircle2 } from "lucide-react";
import { useRef, useState } from "react";
import ProfileMenu from "../../components/ProfileMenu";

function AdminScreen({
  setActivePage,
  adminTab,
  setAdminTab,
  loadAdminBookings,
  loadAvailabilityBlocks,
  session,
  deleteAccountLoading,
  openCredentialsModal,
  logout,
  deleteAccount,
  setShowPrivacyModal,
  children,
}) {
  const contentRef = useRef(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  function switchTab(tab, extra) {
    setAdminTab(tab);
    if (extra) extra();
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  return (
    <section className="screen">
      <header className="page-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Area Barbiere</h1>
        </div>
        <div className="profile-wrapper" style={{ marginLeft: "auto" }}>
          <button className="avatar profile-button" type="button" onClick={() => setShowProfileMenu((c) => !c)} aria-label="Apri profilo">
            <UserCircle2 size={26} strokeWidth={1.8} />
          </button>
          {showProfileMenu && (
            <ProfileMenu
              session={session}
              deleteAccountLoading={deleteAccountLoading}
              setActivePage={setActivePage}
              setShowProfileMenu={setShowProfileMenu}
              setShowPrivacyModal={setShowPrivacyModal}
              openCredentialsModal={openCredentialsModal}
              logout={logout}
              deleteAccount={deleteAccount}
            />
          )}
        </div>
      </header>

      <div className="admin-intro-card admin-agenda-intro">
        <span>Pannello operativo</span>
        <strong>
          {adminTab === "agenda" && "Agenda appuntamenti"}
          {adminTab === "content" && "Gestione salone"}
          {adminTab === "availability" && "Disponibilità salone"}
          {adminTab === "offers" && "Offerte salone"}
        </strong>
        <p>
          {adminTab === "agenda" &&
            "La vista principale del barbiere: controlla la giornata, chiama i clienti e gestisci le prenotazioni."}
          {adminTab === "content" &&
            "Modifica servizi, prezzi, descrizioni e immagini della Home."}
          {adminTab === "availability" &&
            "Chiudi giorni interi, blocca fasce orarie o apri eccezionalmente giornate normalmente chiuse."}
          {adminTab === "offers" &&
            "Crea e gestisci offerte visibili ai clienti nella Home e nella schermata di prenotazione."}
        </p>
      </div>

      <div className="folder-grid admin-main-tabs">
        <button
          type="button"
          className={adminTab === "agenda" ? "folder-card active" : "folder-card"}
          onClick={() => switchTab("agenda", loadAdminBookings)}
        >
          <CalendarDays size={28} strokeWidth={2.2} />
          <strong>Agenda</strong>
          <p>Prenotazioni</p>
        </button>

        <button
          type="button"
          className={adminTab === "content" ? "folder-card active" : "folder-card"}
          onClick={() => switchTab("content")}
        >
          <Scissors size={28} strokeWidth={2.2} />
          <strong>Gestione</strong>
          <p>Servizi e foto</p>
        </button>

        <button
          type="button"
          className={adminTab === "availability" ? "folder-card active" : "folder-card"}
          onClick={() => switchTab("availability", loadAvailabilityBlocks)}
        >
          <Ban size={28} strokeWidth={2.2} />
          <strong>Disponibilità</strong>
          <p>Chiusure e aperture</p>
        </button>

        <button
          type="button"
          className={adminTab === "offers" ? "folder-card active" : "folder-card"}
          onClick={() => switchTab("offers")}
        >
          <BadgePercent size={28} strokeWidth={2.2} />
          <strong>Offerte</strong>
          <p>Promo clienti</p>
        </button>
      </div>

      <div ref={contentRef}>
        {children}
      </div>
    </section>
  );
}

export default AdminScreen;