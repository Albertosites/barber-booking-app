function HomeCTA({
  isAdmin,
  setAdminTab,
  setActivePage,
  loadAdminBookings,
}) {
  return (
    <>
      <button
        className="primary-cta"
        onClick={() => setActivePage("book")}
      >
        Prenota appuntamento
      </button>

      {isAdmin && (
        <button
          className="primary-cta"
          style={{ background: "#b88746", marginTop: "10px" }}
          onClick={() => {
            setAdminTab("agenda");
            setActivePage("admin");
            loadAdminBookings();
          }}
        >
          Area Barbiere
        </button>
      )}
    </>
  );
}

export default HomeCTA;