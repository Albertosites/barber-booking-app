function HomeServices({
  servicesLoading,
  serviceCategories,
}) {
  return (
    <section className="services-preview">
      <div className="section-title">
        <h3>Servizi</h3>
        <span>Cura completa uomo</span>
      </div>

      <div className="home-service-grid">
        {servicesLoading ? (
          <div className="home-service-card">
            <span>Caricamento servizi</span>
            <p>Stiamo recuperando i servizi aggiornati del salone.</p>
          </div>
        ) : (
          serviceCategories.map((group) => (
            <div className="home-service-card" key={group.category}>
              <span>{group.category}</span>
              <p>{group.description}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default HomeServices;