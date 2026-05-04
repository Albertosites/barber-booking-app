import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

const serviceCategories = [
  {
    category: "Taglio uomo",
    icon: "✂️",
    description: "Tagli curati, moderni e rifiniti in base allo stile del cliente.",
    services: [
      { name: "Taglio", price: 15, description: "Taglio uomo completo, studiato sulla forma del viso e rifinito nei dettagli." },
      { name: "Taglio & Shampoo", price: 17, description: "Taglio uomo con lavaggio incluso, ideale per una finitura più pulita e ordinata." },
    ],
  },
  {
    category: "Barba",
    icon: "🪒",
    description: "Cura, definizione e valorizzazione della barba.",
    services: [
      { name: "Barba classica", price: 8, description: "Regolazione e definizione della barba con linee pulite e risultato naturale." },
      { name: "Colore barba", price: 10, description: "Trattamento colore per uniformare, intensificare o correggere il tono della barba." },
      { name: "Barba luxury", price: 30, description: "Esperienza completa per la barba con cura avanzata, rifinitura precisa e trattamento premium." },
    ],
  },
  {
    category: "Estetica uomo",
    icon: "✨",
    description: "Trattamenti per cura personale, viso e benessere maschile.",
    services: [
      { name: "Sopracciglia", price: 5, description: "Pulizia e definizione delle sopracciglia per uno sguardo più ordinato e curato." },
      { name: "Massaggio facciale", price: 10, description: "Trattamento rilassante per distendere il viso e migliorare la sensazione di freschezza." },
      { name: "Massaggio decontratturante", price: 50, description: "Massaggio mirato per sciogliere tensioni muscolari e favorire una sensazione di benessere profondo." },
    ],
  },
  {
    category: "Tecnico uomo",
    icon: "⚡",
    description: "Colore, forma, styling e trattamenti specifici.",
    services: [
      { name: "Colore capelli", price: 20, description: "Colorazione capelli uomo per copertura, tonalizzazione o cambio look controllato." },
      { name: "Permanente uomo", price: 30, description: "Trattamento tecnico per creare movimento, volume e struttura duratura sui capelli." },
      { name: "Shampoo e piega", price: 10, description: "Lavaggio e styling finale per un risultato ordinato, pulito e pronto all’uscita." },
      { name: "Trattamento alla keratina", price: 50, description: "Trattamento professionale per disciplinare, nutrire e rendere il capello più morbido e gestibile." },
    ],
  },
];

const allServices = serviceCategories.flatMap((group) => group.services);

const slots = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];

const gallery = [
  {
    title: "Tagli uomo",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Cura barba",
    image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Barber experience",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1200&q=80",
  },
];

function App() {
  const [activePage, setActivePage] = useState("home");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [openCategory, setOpenCategory] = useState("");

  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bookings, setBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const selectedService = allServices.find((item) => item.name === service);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadMyBookings(session.user.id);
    }
  }, [session]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % gallery.length);
    }, 4200);

    return () => clearInterval(timer);
  }, []);

  const availableSlots = useMemo(() => {
    return slots.filter(
      (slot) => !bookings.some((b) => b.date === date && b.time === slot)
    );
  }, [bookings, date]);

  function goToImage(index) {
    setGalleryIndex(index);
  }

  function toggleCategory(category) {
    setOpenCategory((current) => (current === category ? "" : category));
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      alert("Errore nel caricamento degli orari");
      console.error(error);
      return;
    }

    setBookings(data || []);
  }

  async function loadMyBookings(userId) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      alert("Errore nel caricamento delle tue prenotazioni");
      console.error(error);
      return;
    }

    setMyBookings(data || []);
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthLoading(true);

    if (authMode === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });

      setAuthLoading(false);

      if (error) {
        alert("Accesso non riuscito. Controlla email e password.");
        console.error(error);
        return;
      }

      setAuthEmail("");
      setAuthPassword("");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    setAuthLoading(false);

    if (error) {
      alert("Registrazione non riuscita. Controlla i dati inseriti.");
      console.error(error);
      return;
    }

    alert("Registrazione completata. Ora puoi accedere.");
    setAuthMode("login");
    setAuthPassword("");
  }

  async function logout() {
    await supabase.auth.signOut();
    setMyBookings([]);
    setActivePage("home");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!session?.user) {
      alert("Per prenotare devi prima accedere o creare un account.");
      setActivePage("account");
      return;
    }

    const alreadyBooked = bookings.some(
      (booking) => booking.date === date && booking.time === time
    );

    if (alreadyBooked) {
      alert("Questo orario non è più disponibile. Scegline un altro.");
      await loadBookings();
      return;
    }

    setLoading(true);

    const serviceLabel = selectedService
      ? `${selectedService.name} - €${selectedService.price}`
      : service;

    const { error } = await supabase.from("bookings").insert([
      {
        service: serviceLabel,
        date,
        time,
        name,
        phone,
        user_id: session.user.id,
      },
    ]);

    setLoading(false);

    if (error) {
      alert("Non è stato possibile confermare la prenotazione.");
      console.error(error);
      return;
    }

    setService("");
    setDate("");
    setTime("");
    setName("");
    setPhone("");
    setOpenCategory("");

    await loadBookings();
    await loadMyBookings(session.user.id);

    alert("Prenotazione confermata!");
    setActivePage("my-bookings");
  }

  async function deleteBooking(id) {
    const confirmDelete = window.confirm("Vuoi cancellare questa prenotazione?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id);

    if (error) {
      alert("Non è stato possibile cancellare la prenotazione.");
      console.error(error);
      return;
    }

    await loadBookings();
    await loadMyBookings(session.user.id);
    alert("Prenotazione cancellata.");
  }

  return (
    <div className="app">
      <main className="phone-shell">
        {activePage === "home" && (
          <section className="screen">
            <header className="app-header">
              <div>
                <span className="eyebrow">Barber studio</span>
                <h1>Barber Booking</h1>
              </div>
              <div className="avatar">B</div>
            </header>

            <div className="hero-card">
              <div
                className="gallery-track"
                style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
              >
                {gallery.map((item) => (
                  <div className="gallery-slide" key={item.title}>
                    <img src={item.image} alt={item.title} />
                  </div>
                ))}
              </div>

              <div className="hero-gradient"></div>

              <div className="hero-content">
                <span>{gallery[galleryIndex].title}</span>
                <h2>Il tuo stile, prenotato in pochi secondi.</h2>
              </div>

              <div className="gallery-dots">
                {gallery.map((item, index) => (
                  <button
                    key={item.title}
                    className={galleryIndex === index ? "dot active" : "dot"}
                    onClick={() => goToImage(index)}
                    aria-label={`Mostra foto ${index + 1}`}
                  ></button>
                ))}
              </div>
            </div>

            <section className="quick-info">
              <div>
                <span>Indirizzo</span>
                <strong>Via Roma 25, Palermo</strong>
              </div>
              <div>
                <span>Orari</span>
                <strong>Lun - Sab</strong>
              </div>
            </section>

            <button className="primary-cta" onClick={() => setActivePage("book")}>
              Prenota appuntamento
            </button>

            <section className="services-preview">
              <div className="section-title">
                <h3>Servizi</h3>
                <span>Cura completa uomo</span>
              </div>

              <div className="home-service-grid">
                {serviceCategories.map((group) => (
                  <div className="home-service-card" key={group.category}>
                    <span>{group.category}</span>
                    <p>{group.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </section>
        )}

        {activePage === "book" && (
          <section className="screen">
            <header className="page-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Prenotazione</span>
                <h1>Scegli il servizio</h1>
              </div>
            </header>

            {!session?.user && (
              <div className="lookup-card">
                <div>
                  <span>Accesso richiesto</span>
                  <strong>Accedi per prenotare e ritrovare i tuoi appuntamenti.</strong>
                </div>
                <button className="primary-cta" type="button" onClick={() => setActivePage("account")}>
                  Accedi o registrati
                </button>
              </div>
            )}

            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="folder-grid">
                {serviceCategories.map((group) => (
                  <button
                    type="button"
                    key={group.category}
                    className={openCategory === group.category ? "folder-card active" : "folder-card"}
                    onClick={() => toggleCategory(group.category)}
                  >
                    <div className="folder-icon">{group.icon}</div>
                    <strong>{group.category}</strong>
                    <p>{group.services.length} servizi</p>
                  </button>
                ))}
              </div>

              {serviceCategories.map((group) => (
                <div
                  key={group.category}
                  className={openCategory === group.category ? "category-panel open" : "category-panel"}
                >
                  <div className="category-heading">
                    <h2>{group.category}</h2>
                    <p>{group.description}</p>
                  </div>

                  <div className="service-options">
                    {group.services.map((item) => (
                      <button
                        type="button"
                        key={item.name}
                        className={service === item.name ? "service-option selected" : "service-option"}
                        onClick={() => setService(item.name)}
                      >
                        <div className="service-main-row">
                          <strong>{item.name}</strong>
                          <span>€{item.price}</span>
                        </div>
                        <p>{item.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <label>Giorno</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
                required
              />

              <label>Ora</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} required disabled={!date}>
                <option value="">{date ? "Scegli un orario" : "Prima scegli il giorno"}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>

              <label>Nome</label>
              <input
                type="text"
                placeholder="Es. Marco Rossi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <label>Telefono</label>
              <input
                type="tel"
                placeholder="Es. 3331234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              {(selectedService || date || time) && (
                <div className="booking-summary">
                  <span>Riepilogo appuntamento</span>
                  <div className="summary-row"><p>Servizio</p><strong>{selectedService ? selectedService.name : "Da scegliere"}</strong></div>
                  <div className="summary-row"><p>Prezzo</p><strong>{selectedService ? `€${selectedService.price}` : "-"}</strong></div>
                  <div className="summary-row"><p>Data</p><strong>{date || "-"}</strong></div>
                  <div className="summary-row"><p>Ora</p><strong>{time || "-"}</strong></div>
                </div>
              )}

              <button className="primary-cta" type="submit" disabled={loading || !service}>
                {loading ? "Conferma in corso..." : "Conferma prenotazione"}
              </button>
            </form>
          </section>
        )}

        {activePage === "my-bookings" && (
          <section className="screen">
            <header className="page-header my-bookings-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Area personale</span>
                <h1>Le tue prenotazioni</h1>
              </div>
            </header>

            {!session?.user ? (
              <div className="lookup-card">
                <div>
                  <span>Accesso richiesto</span>
                  <strong>Accedi per vedere solo le tue prenotazioni.</strong>
                </div>
                <button className="primary-cta" type="button" onClick={() => setActivePage("account")}>
                  Accedi o registrati
                </button>
              </div>
            ) : (
              <div className="customer-bookings-list">
                {myBookings.length === 0 ? (
                  <div className="empty-card compact">
                    <strong>Nessuna prenotazione attiva</strong>
                    <p>Quando prenoterai un appuntamento, lo troverai qui.</p>
                  </div>
                ) : (
                  myBookings.map((booking) => (
                    <article className="customer-booking" key={booking.id}>
                      <div className="booking-time-block">
                        <strong>{booking.time}</strong>
                        <span>{booking.date}</span>
                      </div>

                      <div className="customer-booking-info">
                        <span>Appuntamento</span>
                        <h3>{booking.service}</h3>
                        <p>{booking.name}</p>
                      </div>

                      <button className="cancel-btn" onClick={() => deleteBooking(booking.id)}>
                        Cancella
                      </button>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        )}

        {activePage === "account" && (
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
                  >
                    <div className="folder-icon">↪</div>
                    <strong>Accedi</strong>
                    <p>Hai già un account</p>
                  </button>

                  <button
                    type="button"
                    className={authMode === "register" ? "folder-card active" : "folder-card"}
                    onClick={() => setAuthMode("register")}
                  >
                    <div className="folder-icon">＋</div>
                    <strong>Registrati</strong>
                    <p>Nuovo cliente</p>
                  </button>
                </div>

                <label>Email</label>
                <input
                  type="email"
                  placeholder="nome@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                />

                <button className="primary-cta" type="submit" disabled={authLoading}>
                  {authLoading
                    ? "Attendi..."
                    : authMode === "login"
                    ? "Accedi"
                    : "Crea account"}
                </button>
              </form>
            )}
          </section>
        )}

        {activePage === "info" && (
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
              <div className="salon-mark">B</div>
              <div>
                <span>Barber studio</span>
                <h2>Barber Booking</h2>
                <p>Tagli, barba e trattamenti uomo in un ambiente curato, moderno e su appuntamento.</p>
              </div>
            </div>

            <div className="info-mosaic">
              <div className="mosaic-card wide">
                <span>📍</span>
                <div>
                  <strong>Via Roma 25</strong>
                  <p>Palermo</p>
                </div>
              </div>

              <div className="mosaic-card">
                <span>🕘</span>
                <strong>Lun - Sab</strong>
                <p>09:00 - 18:30</p>
              </div>

              <div className="mosaic-card">
                <span>✂️</span>
                <strong>4 aree</strong>
                <p>Taglio, barba, estetica, tecnico</p>
              </div>

              <div className="mosaic-card wide dark">
                <span>📞</span>
                <div>
                  <strong>333 123 4567</strong>
                  <p>Contatto diretto del salone</p>
                </div>
              </div>
            </div>

            <div className="info-service-strip">
              {serviceCategories.map((group) => (
                <div key={group.category}>
                  <span>{group.icon}</span>
                  <strong>{group.category}</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav four-items">
        <button className={activePage === "home" ? "active" : ""} onClick={() => setActivePage("home")}>
          <span>⌂</span> Home
        </button>
        <button className={activePage === "book" ? "active" : ""} onClick={() => setActivePage("book")}>
          <span>＋</span> Prenota
        </button>
        <button className={activePage === "my-bookings" ? "active" : ""} onClick={() => setActivePage("my-bookings")}>
          <span>◷</span> Prenotazioni
        </button>
        <button className={activePage === "info" ? "active" : ""} onClick={() => setActivePage("info")}>
          <span>i</span> Salone
        </button>
      </nav>
    </div>
  );
}

export default App;