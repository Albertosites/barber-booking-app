import { useRef } from "react";

function HeroCarousel({
  gallery,
  galleryIndex,
  goToImage,
  shopSettings,
}) {
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  }

  function handleTouchMove(e) {
    touchEndX.current = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      const nextIndex = galleryIndex >= gallery.length - 1 ? 0 : galleryIndex + 1;
      goToImage(nextIndex);
    }

    if (distance < -minSwipeDistance) {
      const previousIndex = galleryIndex <= 0 ? gallery.length - 1 : galleryIndex - 1;
      goToImage(previousIndex);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  }

  return (
    <div
      className="hero-card"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="gallery-track"
        style={{ transform: `translateX(-${galleryIndex * 100}%)` }}
      >
        {gallery.map((item, index) => (
          <div className="gallery-slide" key={`${item.title}-${index}`}>
            <img src={item.image} alt={item.title} />
          </div>
        ))}
      </div>

      <div className="hero-gradient"></div>

      <div className="hero-content">
        <span>{gallery[galleryIndex]?.title || shopSettings.hero_badge}</span>
        <h2>{shopSettings.hero_title}</h2>
      </div>

      <div className="gallery-dots">
        {gallery.map((item, index) => (
          <button
            key={`${item.title}-${index}`}
            className={galleryIndex === index ? "dot active" : "dot"}
            onClick={() => goToImage(index)}
            aria-label={`Mostra foto ${index + 1}`}
          ></button>
        ))}
      </div>
    </div>
  );
}

export default HeroCarousel;