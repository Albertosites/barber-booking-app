export function timeStringToMinutes(timeString) {
  const cleanTime = String(timeString || "").slice(0, 5);
  const [hours, minutes] = cleanTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function minutesToTimeString(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function generateSlots(openingTime, closingTime, slotMinutes = 30) {
  const startMinutes = timeStringToMinutes(openingTime || "09:00");
  const endMinutes = timeStringToMinutes(closingTime || "18:30");
  const step = Number(slotMinutes || 30);

  if (startMinutes === null || endMinutes === null || step <= 0) {
    return ["09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
            "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30",
            "17:00","17:30","18:00","18:30"];
  }

  const generatedSlots = [];
  for (let current = startMinutes; current < endMinutes; current += step) {
    generatedSlots.push(minutesToTimeString(current));
  }
  return generatedSlots;
}

export function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;
  const parts = dateString.split("-").map(Number);
  if (parts.length !== 3 || parts.some((p) => Number.isNaN(p))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export function formatItalianDate(dateString, options = {}) {
  const parsedDate = parseLocalDate(dateString);
  if (!parsedDate) return dateString || "-";
  return new Intl.DateTimeFormat("it-IT", options).format(parsedDate);
}

export function formatDateHeader(dateString) {
  const todayString = getTodayString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = tomorrowDate.toISOString().slice(0, 10);
  if (dateString === todayString) return "Oggi";
  if (dateString === tomorrowString) return "Domani";
  return formatItalianDate(dateString, { weekday: "long", day: "numeric", month: "long" });
}

export function formatLongDate(dateString) {
  return formatItalianDate(dateString, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function getWeekdayFromDate(dateString) {
  const parsedDate = parseLocalDate(dateString);
  if (!parsedDate) return null;
  return parsedDate.getDay();
}

export function timeToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return null;
  const cleanTime = timeString.slice(0, 5);
  const [hours, minutes] = cleanTime.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function isPhoneValid(phone) {
  return /^[+\d\s\-().]{6,20}$/.test(phone.trim());
}

export function isEmailProbablyValid(email) {
  const cleanEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) return false;
  const wrongEndings = [".con",".cim",".vom",".comm",".itn",".nett",".orrg"];
  return !wrongEndings.some((ending) => cleanEmail.endsWith(ending));
}
