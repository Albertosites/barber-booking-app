import { UserRound } from "lucide-react";
import ProfileMenu from "../../components/ProfileMenu";

function HomeHeader({
  shopSettings,
  isAdmin,
  session,
  avatarLabel,
  showProfileMenu,
  setShowProfileMenu,
  setShowPrivacyModal,
  setActivePage,
  deleteAccountLoading,
  openCredentialsModal,
  logout,
  deleteAccount,
}) {
  return (
    <header className="app-header">
      <div>
        <span className="eyebrow">{shopSettings.eyebrow}</span>
        <h1>{shopSettings.name}</h1>
        {isAdmin && <span className="eyebrow">Admin attivo</span>}
      </div>

      <div className="profile-wrapper">
        <button
          className="avatar profile-button"
          type="button"
          onClick={() => setShowProfileMenu((current) => !current)}
          aria-label="Apri profilo"
        >
          {session?.user ? avatarLabel : <UserRound size={22} strokeWidth={2.4} />}
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
  );
}

export default HomeHeader;