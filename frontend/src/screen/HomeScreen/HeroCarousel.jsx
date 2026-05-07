function HeroCarousel({
  gallery,
  galleryIndex,
  goToImage,
  shopSettings,
}) {
  return (
    <div className="hero-card">
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