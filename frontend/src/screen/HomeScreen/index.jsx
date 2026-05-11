import HomeHeader from "./HomeHeader";
import HeroCarousel from "./HeroCarousel";
import QuickInfo from "./QuickInfo";
import HomeCTA from "./HomeCTA";
import HomeServices from "./HomeServices";

function HomeScreen({
  shopSettings,
  shopAddressLine,
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
  gallery,
  galleryIndex,
  goToImage,
  setAdminTab,
  loadAdminBookings,
  servicesLoading,
  serviceCategories,
  offers,
  linkedShops,
  currentShopId,
  setCurrentShopId,
  shopSelectionRequired,
}) {
  return (
    <section className="screen">
      <HomeHeader
        shopSettings={shopSettings}
        isAdmin={isAdmin}
        session={session}
        avatarLabel={avatarLabel}
        showProfileMenu={showProfileMenu}
        setShowProfileMenu={setShowProfileMenu}
        setShowPrivacyModal={setShowPrivacyModal}
        setActivePage={setActivePage}
        deleteAccountLoading={deleteAccountLoading}
        openCredentialsModal={openCredentialsModal}
        logout={logout}
        deleteAccount={deleteAccount}
      />

      <HeroCarousel
        gallery={gallery}
        galleryIndex={galleryIndex}
        goToImage={goToImage}
        shopSettings={shopSettings}
      />

      <QuickInfo
        shopAddressLine={shopAddressLine}
        shopSettings={shopSettings}
      />
    
      
      {offers?.length > 0 && (
  <div className="offer-banner home-offer-banner">
    <span className="offer-banner-label">Offerta attiva</span>
    <strong>{offers[0].title}</strong>
    {offers[0].description && <p>{offers[0].description}</p>}
  </div>
)}
      <HomeCTA
        isAdmin={isAdmin}
        setAdminTab={setAdminTab}
        setActivePage={setActivePage}
        loadAdminBookings={loadAdminBookings}
      />

      <HomeServices
        servicesLoading={servicesLoading}
        serviceCategories={serviceCategories}
      />
    </section>
  );
}

export default HomeScreen;