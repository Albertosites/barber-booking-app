function BookingAvailabilityNotice({
  bookingAvailabilityNotice,
}) {
  if (!bookingAvailabilityNotice) return null;

  return (
    <div className={`availability-notice ${bookingAvailabilityNotice.type}`}>
      <div className="availability-notice-icon">
        {bookingAvailabilityNotice.type === "closed" ? "!" : "i"}
      </div>
      <div>
        <strong>{bookingAvailabilityNotice.title}</strong>
        <p>{bookingAvailabilityNotice.text}</p>
      </div>
    </div>
  );
}

export default BookingAvailabilityNotice;