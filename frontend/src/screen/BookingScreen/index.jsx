import BookingHeader from "./BookingHeader";
import BookingAvailabilityNotice from "./BookingAvailabilityNotice";
import BookingSummary from "./BookingSummary";

function BookingScreen({
  setActivePage,
  bookingAvailabilityNotice,
  selectedService,
  selectedOperator,
  date,
  time,
  formatLongDate,
}) {
  return (
    <section className="screen">
      <BookingHeader setActivePage={setActivePage} />

      <BookingAvailabilityNotice
        bookingAvailabilityNotice={bookingAvailabilityNotice}
      />

      <BookingSummary
        selectedService={selectedService}
        selectedOperator={selectedOperator}
        date={date}
        time={time}
        formatLongDate={formatLongDate}
      />
    </section>
  );
}

export default BookingScreen;