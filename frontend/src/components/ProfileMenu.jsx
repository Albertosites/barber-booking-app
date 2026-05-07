function ProfileMenu({
  session,
  deleteAccountLoading,
  setActivePage,
  setShowProfileMenu,
  setShowPrivacyModal,
  openCredentialsModal,
  logout,
  deleteAccount,
}) {
  return (
    <div className="profile-menu">
      {!session?.user && (
        <button
          type="button"
          onClick={() => {
            setActivePage("account");
            setShowProfileMenu(false);
          }}
        >
          Accedi o registrati
        </button>
      )}

      <button
        type="button"
        onClick={() => {
          setShowPrivacyModal(true);
          setShowProfileMenu(false);
        }}
      >
        Privacy
      </button>

      {session?.user && (
        <>
          <button type="button" onClick={openCredentialsModal}>
            Cambia credenziali
          </button>

          <button type="button" onClick={logout}>
            Logout
          </button>

          <button
            className="danger-item"
            type="button"
            disabled={deleteAccountLoading}
            onClick={deleteAccount}
          >
            {deleteAccountLoading ? "Eliminazione..." : "Cancella account"}
          </button>
        </>
      )}
    </div>
  );
}

export default ProfileMenu;