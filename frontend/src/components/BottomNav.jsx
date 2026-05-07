import {
  Home,
  CalendarPlus,
  CalendarCheck,
  Info,
} from "lucide-react";

function BottomNav({
  activePage,
  setActivePage,
  setShowProfileMenu,
}) {
  return (
    <nav className="bottom-nav four-items">
      <button
        className={activePage === "home" ? "active" : ""}
        onClick={() => {
          setShowProfileMenu(false);
          setActivePage("home");
        }}
      >
        <Home size={18} strokeWidth={2.4} />
        Home
      </button>

      <button
        className={activePage === "book" ? "active" : ""}
        onClick={() => {
          setShowProfileMenu(false);
          setActivePage("book");
        }}
      >
        <CalendarPlus size={18} strokeWidth={2.4} />
        Prenota
      </button>

      <button
        className={activePage === "my-bookings" ? "active" : ""}
        onClick={() => {
          setShowProfileMenu(false);
          setActivePage("my-bookings");
        }}
      >
        <CalendarCheck size={18} strokeWidth={2.4} />
        Prenotazioni
      </button>

      <button
        className={activePage === "info" ? "active" : ""}
        onClick={() => {
          setShowProfileMenu(false);
          setActivePage("info");
        }}
      >
        <Info size={18} strokeWidth={2.4} />
        Salone
      </button>
    </nav>
  );
}

export default BottomNav;