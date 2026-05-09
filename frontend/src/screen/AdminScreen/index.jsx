import AdminContent from "./AdminContent";
import AdminAgenda from "./AdminAgenda";
import { CalendarDays, Scissors, Ban } from "lucide-react";

function AdminScreen({
  setActivePage,
  adminTab,
  setAdminTab,
  loadAdminBookings,
  loadAvailabilityBlocks,
  children,
}) {
  return (
    <section className="screen">
      <header className="page-header">
        <button className="back-btn" onClick={() => setActivePage("home")}>
          ←
        </button>
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Area Barbiere</h1>
        </div>
      </header>

      <div className="admin-intro-card admin-agenda-intro">
        <span>Pannello operativo</span>
        <strong>
          {adminTab === "agenda" && "Agenda appuntamenti"}
          {adminTab === "content" && "Gestione salone"}
          {adminTab === "availability" && "Disponibilità salone"}
        </strong>
        <p>
          {adminTab === "agenda" &&
            "La vista principale del barbiere: controlla la giornata, chiama i clienti e gestisci le prenotazioni."}
          {adminTab === "content" &&
            "Modifica servizi, prezzi, descrizioni e immagini della Home."}
          {adminTab === "availability" &&
            "Chiudi giorni interi, blocca fasce orarie o apri eccezionalmente giornate normalmente chiuse."}
        </p>
      </div>

      <div className="folder-grid admin-main-tabs">
        <button
          type="button"
          className={adminTab === "agenda" ? "folder-card active" : "folder-card"}
          onClick={() => {
            setAdminTab("agenda");
            loadAdminBookings();
          }}
        >
          <CalendarDays size={28} strokeWidth={2.2} />
          <strong>Agenda</strong>
          <p>Prenotazioni</p>
        </button>

        <button
          type="button"
          className={adminTab === "content" ? "folder-card active" : "folder-card"}
          onClick={() => setAdminTab("content")}
        >
          <Scissors size={28} strokeWidth={2.2} />
          <strong>Gestione</strong>
          <p>Servizi e foto</p>
        </button>

        <button
          type="button"
          className={adminTab === "availability" ? "folder-card active" : "folder-card"}
          onClick={() => {
            setAdminTab("availability");
            loadAvailabilityBlocks();
          }}
        >
          <Ban size={28} strokeWidth={2.2} />
          <strong>Disponibilità</strong>
          <p>Chiusure e aperture</p>
        </button>
      </div>

      {children}
    </section>
  );
}

export default AdminScreen;