import BookingHeader from "./BookingHeader";
import BookingAvailabilityNotice from "./BookingAvailabilityNotice";
import BookingSummary from "./BookingSummary";
import BookingForm from "./BookingForm";

function BookingScreen({
  setActivePage,
  serviceCategories,
  servicesLoading,
  service,
  setService,
  selectedService,
  operatorId,
  setOperatorId,
  operators,
  activeOperators,
  selectedOperator,
  date,
  setDate,
  time,
  setTime,
  availableSlots,
  bookingAvailabilityNotice,
  loading,
  handleSubmit,
  formatLongDate,
}) {
  return (
    <section className="screen">
      <BookingHeader setActivePage={setActivePage} />

      <BookingAvailabilityNotice
        bookingAvailabilityNotice={bookingAvailabilityNotice}
      />

      <BookingForm
        bookingAvailabilityNotice={bookingAvailabilityNotice}
        serviceCategories={serviceCategories}
        servicesLoading={servicesLoading}
        service={service}
        setService={setService}
        operatorId={operatorId}
        setOperatorId={setOperatorId}
        operators={operators}
        activeOperators={activeOperators}
        selectedOperator={selectedOperator}
        date={date}
        setDate={setDate}
        time={time}
        setTime={setTime}
        availableSlots={availableSlots}
        loading={loading}
        handleSubmit={handleSubmit}
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