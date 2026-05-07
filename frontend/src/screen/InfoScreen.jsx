import {
  MapPin,
  Clock3,
  Phone,
  Scissors,
} from "lucide-react";

function InfoScreen({
  setActivePage,
  shopSettings,
}) {
  return (
    <section className="screen">
      <header className="page-header">
        <button className="back-btn" onClick={() => setActivePage("home")}>
          ←
        </button>
        <div>
          <span className="eyebrow">Salone</span>
          <h1>Informazioni</h1>
        </div>
      </header>

      <div className="salon-hero-card">
        <div className="salon-mark">{shopSettings.logo_letter || "B"}</div>
        <div>
          <span>{shopSettings.eyebrow}</span>
          <h2>{shopSettings.name}</h2>
          <p>{shopSettings.description}</p>
        </div>
      </div>

      <div className="info-mosaic">
        <div className="mosaic-card wide">
          <span><MapPin size={24} strokeWidth={2.2} /></span>
          <div>
            <strong>{shopSettings.address}</strong>
            <p>{shopSettings.city}</p>
          </div>
        </div>

        <div className="mosaic-card">
          <span><Clock3 size={24} strokeWidth={2.2} /></span>
          <strong>{shopSettings.opening_label}</strong>
          <p>{shopSettings.opening_hours}</p>
        </div>

        <div className="mosaic-card">
          <span><Scissors size={24} strokeWidth={2.2} /></span>
          <strong>Servizi</strong>
          <p>Listino aggiornato dal salone</p>
        </div>

        <div className="mosaic-card wide dark">
          <span><Phone size={24} strokeWidth={2.2} /></span>
          <div>
            <strong>{shopSettings.phone}</strong>
            <p>Contatto diretto del salone</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default InfoScreen;