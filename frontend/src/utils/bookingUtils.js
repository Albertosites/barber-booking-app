import { timeToMinutes, getWeekdayFromDate } from "./dateUtils";

export const OPENING_REASON_PREFIX = "__EXCEPTIONAL_OPENING__:";

export function isExceptionalOpeningBlock(block) {
  return String(block.reason || "").startsWith(OPENING_REASON_PREFIX);
}

export function getCleanAvailabilityReason(block) {
  const reason = String(block.reason || "");
  if (reason.startsWith(OPENING_REASON_PREFIX)) return reason.replace(OPENING_REASON_PREFIX, "").trim();
  return reason;
}

export function getExceptionalOpeningsForDate(dateString, availabilityBlocks) {
  if (!dateString) return [];
  return availabilityBlocks.filter((block) => {
    if (!block.active) return false;
    if (!isExceptionalOpeningBlock(block)) return false;
    return !block.recurring && block.block_date === dateString;
  });
}

export function isSlotInsideExceptionalOpening(slot, dateString, availabilityBlocks) {
  const slotMinutes = timeToMinutes(slot);
  const exceptionalOpenings = getExceptionalOpeningsForDate(dateString, availabilityBlocks);
  if (exceptionalOpenings.length === 0) return false;
  return exceptionalOpenings.some((block) => {
    const startMinutes = timeToMinutes(block.start_time);
    const endMinutes = timeToMinutes(block.end_time);
    if (startMinutes === null || endMinutes === null || slotMinutes === null) return false;
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

export function hasExceptionalOpeningForDate(dateString, availabilityBlocks) {
  return getExceptionalOpeningsForDate(dateString, availabilityBlocks).length > 0;
}

export function isSlotBlockedByAvailability(slot, dateString, availabilityBlocks) {
  if (!dateString) return false;
  const selectedWeekday = getWeekdayFromDate(dateString);
  const slotMinutes = timeToMinutes(slot);
  const exceptionalOpenings = getExceptionalOpeningsForDate(dateString, availabilityBlocks);

  if (exceptionalOpenings.length > 0) {
    return !isSlotInsideExceptionalOpening(slot, dateString, availabilityBlocks);
  }

  return availabilityBlocks.some((block) => {
    if (!block.active) return false;
    if (isExceptionalOpeningBlock(block)) return false;
    const appliesToDate =
      (!block.recurring && block.block_date === dateString) ||
      (block.recurring && Number(block.weekday) === selectedWeekday);
    if (!appliesToDate) return false;
    if (block.full_day) return true;
    const startMinutes = timeToMinutes(block.start_time);
    const endMinutes = timeToMinutes(block.end_time);
    if (startMinutes === null || endMinutes === null || slotMinutes === null) return false;
    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

export function isOperatorBookedAtSlot(bookings, dateString, slot, operatorId) {
  if (!dateString || !slot || !operatorId) return false;
  return bookings.some((booking) => {
    if (booking.date !== dateString || booking.time !== slot) return false;
    if (!booking.operator_id) return true;
    return booking.operator_id === operatorId;
  });
}

export function hasAtLeastOneOperatorAvailableAtSlot(bookings, dateString, slot, activeOperators) {
  if (!dateString || !slot) return false;
  if (activeOperators.length === 0) return false;
  return activeOperators.some((operator) => !isOperatorBookedAtSlot(bookings, dateString, slot, operator.id));
}

export function getWeekdayLabel(weekday) {
  const weekdays = [
    { value: 0, label: "Domenica" }, { value: 1, label: "Lunedì" },
    { value: 2, label: "Martedì" }, { value: 3, label: "Mercoledì" },
    { value: 4, label: "Giovedì" }, { value: 5, label: "Venerdì" },
    { value: 6, label: "Sabato" },
  ];
  const found = weekdays.find((item) => item.value === Number(weekday));
  return found?.label || "Giorno";
}

export function formatAvailabilityBlockTitle(block) {
  if (isExceptionalOpeningBlock(block)) return block.block_date;
  if (block.recurring) return `Ogni ${getWeekdayLabel(block.weekday)}`;
  return block.block_date;
}

export function formatAvailabilityBlockTime(block) {
  if (block.full_day) return "Giornata intera";
  return `${String(block.start_time || "").slice(0, 5)} → ${String(block.end_time || "").slice(0, 5)}`;
}

export function getBookingAvailabilityNotice(dateString, availabilityBlocks, availableSlots, allSlots) {
  if (!dateString) return null;
  const selectedWeekday = getWeekdayFromDate(dateString);
  const exceptionalOpenings = getExceptionalOpeningsForDate(dateString, availabilityBlocks);

  if (exceptionalOpenings.length > 0) {
    return {
      type: "limited",
      title: "Apertura eccezionale attiva per questa data.",
      text: "Il salone normalmente potrebbe risultare chiuso, ma per questo giorno sono disponibili solo gli orari aperti manualmente dal barbiere.",
    };
  }

  const matchingBlocks = availabilityBlocks.filter((block) => {
    if (!block.active) return false;
    if (isExceptionalOpeningBlock(block)) return false;
    return (
      (!block.recurring && block.block_date === dateString) ||
      (block.recurring && Number(block.weekday) === selectedWeekday)
    );
  });

  const recurringFullDay = matchingBlocks.find((block) => block.recurring && block.full_day);
  if (recurringFullDay) {
    return {
      type: "closed",
      title: `Il salone è chiuso tutti i ${getWeekdayLabel(selectedWeekday).toLowerCase()}.`,
      text: "Scegli un altro giorno disponibile per completare la prenotazione.",
    };
  }

  const dateFullDay = matchingBlocks.find((block) => !block.recurring && block.full_day);
  if (dateFullDay) {
    return {
      type: "closed",
      title: "Il salone è chiuso per tutta la giornata selezionata.",
      text: "Scegli un'altra data per vedere gli orari disponibili.",
    };
  }

  if (matchingBlocks.some((block) => !block.full_day)) {
    return {
      type: "limited",
      title: "In questo giorno alcune fasce orarie non sono disponibili.",
      text: "Gli orari mostrati sotto sono già filtrati in base alle disponibilità del salone.",
    };
  }

  if (availableSlots.length === 0) {
    const slotsAfterAvailability = (allSlots || []).filter(
      (slot) => !isSlotBlockedByAvailability(slot, dateString, availabilityBlocks)
    );
    if (slotsAfterAvailability.length > 0) {
      return {
        type: "closed",
        title: "Tutti gli orari di questa giornata sono già prenotati.",
        text: "Prova a scegliere un altro giorno o un altro operatore.",
      };
    }
    return {
      type: "closed",
      title: "Non ci sono orari disponibili per questa data.",
      text: "Prova a selezionare un altro giorno.",
    };
  }

  return null;
}
