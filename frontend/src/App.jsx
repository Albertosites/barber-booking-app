import ShopSelectScreen from "./screen/ShopSelectScreen";
import AdminOffers from "./screen/AdminScreen/AdminOffers";
import AdminContent from "./screen/AdminScreen/AdminContent";
import AdminAvailability from "./screen/AdminScreen/AdminAvailability";
import AdminAgenda from "./screen/AdminScreen/AdminAgenda";
import AdminScreen from "./screen/AdminScreen/index";
import AccountScreen from "./screen/AccountScreen/index";
import MyBookingsScreen from "./screen/MyBookingsScreen/index";
import BookingScreen from "./screen/BookingScreen/index";
import HomeScreen from "./screen/HomeScreen/index";
import InfoScreen from "./screen/InfoScreen";
import CredentialsModal from "./components/CredentialsModal";
import PrivacyModal from "./components/PrivacyModal";
import ConfirmDeleteBookingModal from "./components/ConfirmDeleteBookingModal";
import JoinShopPopup from "./components/JoinShopPopup";
import BottomNav from "./components/BottomNav";
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

const SHOP_ID = "0c0f8c8e-6b93-45a0-a97b-688394b769a3";

const OPENING_REASON_PREFIX = "__EXCEPTIONAL_OPENING__:";

const slots = [
  "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30",
  "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30",
];

const weekdays = [
  { value: 0, label: "Domenica" },
  { value: 1, label: "Lunedì" },
  { value: 2, label: "Martedì" },
  { value: 3, label: "Mercoledì" },
  { value: 4, label: "Giovedì" },
  { value: 5, label: "Venerdì" },
  { value: 6, label: "Sabato" },
];



const fallbackGallery = [
  {
    title: "Tagli uomo",
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1200&q=80",
  },
];

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function parseLocalDate(dateString) {
  if (!dateString || typeof dateString !== "string") return null;

  const parts = dateString.split("-").map(Number);

  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return null;
  }

  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatItalianDate(dateString, options = {}) {
  const parsedDate = parseLocalDate(dateString);

  if (!parsedDate) return dateString || "-";

  return new Intl.DateTimeFormat("it-IT", options).format(parsedDate);
}

function formatDateHeader(dateString) {
  const todayString = getTodayString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowString = tomorrowDate.toISOString().slice(0, 10);

  if (dateString === todayString) return "Oggi";
  if (dateString === tomorrowString) return "Domani";

  return formatItalianDate(dateString, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatLongDate(dateString) {
  return formatItalianDate(dateString, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isEmailProbablyValid(email) {
  const cleanEmail = email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return false;
  }

  const wrongEndings = [
    ".con",
    ".cim",
    ".vom",
    ".comm",
    ".itn",
    ".nett",
    ".orrg",
  ];

  return !wrongEndings.some((ending) => cleanEmail.endsWith(ending));
}

function getWeekdayFromDate(dateString) {
  const parsedDate = parseLocalDate(dateString);

  if (!parsedDate) return null;

  return parsedDate.getDay();
}

function getWeekdayLabel(weekday) {
  const found = weekdays.find((item) => item.value === Number(weekday));

  return found?.label || "Giorno";
}

function timeToMinutes(timeString) {
  if (!timeString || typeof timeString !== "string") return null;

  const cleanTime = timeString.slice(0, 5);
  const [hours, minutes] = cleanTime.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;

  return hours * 60 + minutes;
}

function isExceptionalOpeningBlock(block) {
  return String(block.reason || "").startsWith(OPENING_REASON_PREFIX);
}

function getCleanAvailabilityReason(block) {
  const reason = String(block.reason || "");

  if (reason.startsWith(OPENING_REASON_PREFIX)) {
    return reason.replace(OPENING_REASON_PREFIX, "").trim();
  }

  return reason;
}

function getExceptionalOpeningsForDate(dateString, availabilityBlocks) {
  if (!dateString) return [];

  return availabilityBlocks.filter((block) => {
    if (!block.active) return false;
    if (!isExceptionalOpeningBlock(block)) return false;

    return !block.recurring && block.block_date === dateString;
  });
}

function isSlotInsideExceptionalOpening(slot, dateString, availabilityBlocks) {
  const slotMinutes = timeToMinutes(slot);
  const exceptionalOpenings = getExceptionalOpeningsForDate(dateString, availabilityBlocks);

  if (exceptionalOpenings.length === 0) return false;

  return exceptionalOpenings.some((block) => {
    const startMinutes = timeToMinutes(block.start_time);
    const endMinutes = timeToMinutes(block.end_time);

    if (startMinutes === null || endMinutes === null || slotMinutes === null) {
      return false;
    }

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

function hasExceptionalOpeningForDate(dateString, availabilityBlocks) {
  return getExceptionalOpeningsForDate(dateString, availabilityBlocks).length > 0;
}

function isSlotBlockedByAvailability(slot, dateString, availabilityBlocks) {
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

    if (startMinutes === null || endMinutes === null || slotMinutes === null) {
      return false;
    }

    return slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

function isOperatorBookedAtSlot(bookings, dateString, slot, operatorId) {
  if (!dateString || !slot || !operatorId) return false;

  return bookings.some((booking) => {
    if (booking.date !== dateString || booking.time !== slot) return false;

    if (!booking.operator_id) return true;

    return booking.operator_id === operatorId;
  });
}

function hasAtLeastOneOperatorAvailableAtSlot(bookings, dateString, slot, activeOperators) {
  if (!dateString || !slot) return false;
  if (activeOperators.length === 0) return false;

  return activeOperators.some((operator) => {
    return !isOperatorBookedAtSlot(bookings, dateString, slot, operator.id);
  });
}

function formatAvailabilityBlockTitle(block) {
  if (isExceptionalOpeningBlock(block)) {
    return formatLongDate(block.block_date);
  }

  if (block.recurring) {
    return `Ogni ${getWeekdayLabel(block.weekday)}`;
  }

  return formatLongDate(block.block_date);
}

function formatAvailabilityBlockTime(block) {
  if (block.full_day) return "Giornata intera";

  return `${String(block.start_time || "").slice(0, 5)} → ${String(block.end_time || "").slice(0, 5)}`;
}

function getBookingAvailabilityNotice(dateString, availabilityBlocks, availableSlots) {
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

  const recurringFullDay = matchingBlocks.find(
    (block) => block.recurring && block.full_day
  );

  if (recurringFullDay) {
    return {
      type: "closed",
      title: `Il salone è chiuso tutti i ${getWeekdayLabel(selectedWeekday).toLowerCase()}.`,
      text: "Scegli un altro giorno disponibile per completare la prenotazione.",
    };
  }

  const dateFullDay = matchingBlocks.find(
    (block) => !block.recurring && block.full_day
  );

  if (dateFullDay) {
    return {
      type: "closed",
      title: "Il salone è chiuso per tutta la giornata selezionata.",
      text: "Scegli un’altra data per vedere gli orari disponibili.",
    };
  }

  const hasRangeBlocks = matchingBlocks.some((block) => !block.full_day);

  if (hasRangeBlocks) {
    return {
      type: "limited",
      title: "In questo giorno alcune fasce orarie non sono disponibili.",
      text: "Gli orari mostrati sotto sono già filtrati in base alle disponibilità del salone.",
    };
  }

  if (availableSlots.length === 0) {
    return {
      type: "closed",
      title: "Non ci sono orari disponibili per questa data.",
      text: "Prova a selezionare un altro giorno.",
    };
  }

  return null;
}

const defaultShopSettings = {
  logo_letter: "B",
  eyebrow: "Barber studio",
  name: "Barber Booking",
  description: "Tagli, barba e trattamenti uomo in un ambiente curato, moderno e su appuntamento.",
  address: "Via Roma 25",
  hero_badge: "Barber studio",
  hero_title: "Il tuo stile, prenotato in pochi secondi.",
  city: "Palermo",
  opening_label: "Mar - Sab",
  opening_hours: "09:00 - 18:30",
  phone: "333 123 4567",
};

function App() {
  const [shopSettings, setShopSettings] = useState(defaultShopSettings);
  const [activePage, setActivePage] = useState("home");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [gallery, setGallery] = useState(fallbackGallery);
  const [currentShopId, setCurrentShopId] = useState("");
  const [shopGateReady, setShopGateReady] = useState(false);
  const [shopChoiceCompleted, setShopChoiceCompleted] = useState(false);
  const [linkedShops, setLinkedShops] = useState([]);
  const activeShopId = currentShopId || SHOP_ID;
  const canEnterShop =
  Boolean(session) &&
  shopGateReady &&
  Boolean(currentShopId) &&
  (linkedShops.length <= 1 || shopChoiceCompleted);

  const [serviceCategories, setServiceCategories] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState("agenda");
  const [adminContentTab, setAdminContentTab] = useState("services");
  const [availabilityTab, setAvailabilityTab] = useState("closures");
  const [adminAgendaFilter, setAdminAgendaFilter] = useState("all");
  const [adminServices, setAdminServices] = useState([]);
  const [adminImages, setAdminImages] = useState([]);
  const [offers, setOffers] = useState([]);
  const [adminOffers, setAdminOffers] = useState([]);
  const [offerSaving, setOfferSaving] = useState(false);
  const [offerDeletingId, setOfferDeletingId] = useState("");
  const [adminOperators, setAdminOperators] = useState([]);
  const [operators, setOperators] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState("");
  const [adminBookingToDelete, setAdminBookingToDelete] = useState(null);
  const [adminDeleteLoading, setAdminDeleteLoading] = useState(false);
  const [operatorSavingId, setOperatorSavingId] = useState("");
  const [operatorDeletingId, setOperatorDeletingId] = useState("");
  const [newOperatorName, setNewOperatorName] = useState("");
  const [newOperatorRole, setNewOperatorRole] = useState("");
  const [newOperatorSortOrder, setNewOperatorSortOrder] = useState("0");
  const [operatorCreating, setOperatorCreating] = useState(false);
  const [availabilityMode, setAvailabilityMode] = useState("date_full_day");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availabilityWeekday, setAvailabilityWeekday] = useState("1");
  const [availabilityStartTime, setAvailabilityStartTime] = useState("");
  const [availabilityEndTime, setAvailabilityEndTime] = useState("");
  const [availabilityReason, setAvailabilityReason] = useState("");
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityDeletingId, setAvailabilityDeletingId] = useState("");

  const [openingDate, setOpeningDate] = useState("");
  const [openingStartTime, setOpeningStartTime] = useState("");
  const [openingEndTime, setOpeningEndTime] = useState("");
  const [openingReason, setOpeningReason] = useState("");
  const [openingSaving, setOpeningSaving] = useState(false);

  const [showManualBookingForm, setShowManualBookingForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualService, setManualService] = useState("");
  const [manualOperatorId, setManualOperatorId] = useState("");
  const [manualDate, setManualDate] = useState("");
  const [manualTime, setManualTime] = useState("");
  const [manualBookingLoading, setManualBookingLoading] = useState(false);

  const [showJoinShopPopup, setShowJoinShopPopup] = useState(false);
  const [joinShopLoading, setJoinShopLoading] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);

  const cameraInputRefs = useRef({});
  const galleryInputRefs = useRef({});
  const operatorImageInputRefs = useRef({});
  const authSubmitLockRef = useRef(false);
  const bookingSubmitLockRef = useRef(false);
  const manualBookingSubmitLockRef = useRef(false);
  const availabilitySubmitLockRef = useRef(false);
  const openingSubmitLockRef = useRef(false);

  const [authMode, setAuthMode] = useState("login");
  const [authFullName, setAuthFullName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [service, setService] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const allServices = useMemo(() => {
    return serviceCategories.flatMap((group) => group.services);
  }, [serviceCategories]);

  const selectedService = allServices.find((item) => item.name === service);

  const selectedOperator = operators.find((item) => item.id === operatorId);

  const selectedManualOperator = operators.find((item) => item.id === manualOperatorId);

  const activeOperators = useMemo(() => {
    return operators.filter((operator) => operator.active !== false);
  }, [operators]);

  const shopAddressLine = [shopSettings.address, shopSettings.city].filter(Boolean).join(", ");

  const today = useMemo(() => {
    return getTodayString();
  }, []);

  const filteredAdminBookings = useMemo(() => {
    if (adminAgendaFilter === "today") {
      return adminBookings.filter((booking) => booking.date === today);
    }

    if (adminAgendaFilter === "upcoming") {
      return adminBookings.filter((booking) => booking.date >= today);
    }

    return adminBookings;
  }, [adminAgendaFilter, adminBookings, today]);

  const groupedAdminBookings = useMemo(() => {
    const groups = {};

    filteredAdminBookings.forEach((booking) => {
      const key = booking.date || "Senza data";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(booking);
    });

    return groups;
  }, [filteredAdminBookings]);

  const groupedAdminServices = useMemo(() => {
    const groups = {};

    adminServices.forEach((item) => {
      const key = item.category || "Senza categoria";

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
    });

    return groups;
  }, [adminServices]);

  const adminServiceCategories = useMemo(() => {
    return Object.keys(groupedAdminServices).sort();
  }, [groupedAdminServices]);

  const closureBlocks = useMemo(() => {
    return availabilityBlocks.filter((block) => !isExceptionalOpeningBlock(block));
  }, [availabilityBlocks]);

  const exceptionalOpeningBlocks = useMemo(() => {
    return availabilityBlocks.filter((block) => isExceptionalOpeningBlock(block));
  }, [availabilityBlocks]);

  const sortedAvailabilityBlocks = useMemo(() => {
    return [...closureBlocks].sort((a, b) => {
      if (a.recurring !== b.recurring) {
        return a.recurring ? 1 : -1;
      }

      const first = a.block_date || String(a.weekday || "");
      const second = b.block_date || String(b.weekday || "");

      return String(first).localeCompare(String(second));
    });
  }, [closureBlocks]);

  const sortedExceptionalOpeningBlocks = useMemo(() => {
    return [...exceptionalOpeningBlocks].sort((a, b) => {
      const first = a.block_date || "";
      const second = b.block_date || "";

      if (first !== second) {
        return String(first).localeCompare(String(second));
      }

      return String(a.start_time || "").localeCompare(String(b.start_time || ""));
    });
  }, [exceptionalOpeningBlocks]);

  const availableSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (isSlotBlockedByAvailability(slot, date, availabilityBlocks)) {
        return false;
      }

      if (operatorId) {
        return !isOperatorBookedAtSlot(bookings, date, slot, operatorId);
      }

      return hasAtLeastOneOperatorAvailableAtSlot(bookings, date, slot, activeOperators);
    });
  }, [activeOperators, availabilityBlocks, bookings, date, operatorId]);

  const bookingAvailabilityNotice = useMemo(() => {
    return getBookingAvailabilityNotice(date, availabilityBlocks, availableSlots);
  }, [availabilityBlocks, availableSlots, date]);

  const manualAvailableSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (isSlotBlockedByAvailability(slot, manualDate, availabilityBlocks)) {
        return false;
      }

      if (manualOperatorId) {
        return !isOperatorBookedAtSlot(bookings, manualDate, slot, manualOperatorId);
      }

      return hasAtLeastOneOperatorAvailableAtSlot(bookings, manualDate, slot, activeOperators);
    });
  }, [activeOperators, availabilityBlocks, bookings, manualDate, manualOperatorId]);

  const avatarLabel = useMemo(() => {
    if (!session?.user) return null;

    const cleanName = userProfile?.full_name?.trim();

    if (cleanName) {
      return cleanName.charAt(0).toUpperCase();
    }

    return session.user.email?.charAt(0)?.toUpperCase() || "U";
  }, [session, userProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

 

    const { data: listener } = supabase.auth.onAuthStateChange((event, currentSession) => {
      setSession(currentSession);

      if (event === "PASSWORD_RECOVERY") {
        setShowCredentialsModal(true);
        setNewEmail(currentSession?.user?.email || "");
        setNewPassword("");
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  
  
  useEffect(() => {
  loadShopSettings();
  loadServices();
  loadHomeImages();
  loadBookings();
  loadAvailabilityBlocks();
  loadOperators();
  loadOffers();

  if (session?.user) {
    loadMyBookings(session.user.id);
    checkAdmin(session.user.id);

    if (isAdmin) {
      loadAdminData();
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [currentShopId]);

  useEffect(() => {
    if (session?.user) {
      loadUserProfile(session.user.id);
      loadMyBookings(session.user.id);
      checkAdmin(session.user.id);
      loadLinkedShops(session.user.id);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, activeShopId]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeShopId]);

  useEffect(() => {
    const timer = setInterval(() => {
      setGalleryIndex((prev) => (prev + 1) % gallery.length);
    }, 4200);

    return () => clearInterval(timer);
  }, [gallery.length]);

  useEffect(() => {
    if (!showProfileMenu) return;

    function handleClickOutside(event) {
      if (!event.target.closest(".profile-wrapper")) {
        setShowProfileMenu(false);
      }
    }

    function handleScroll() {
      setShowProfileMenu(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showProfileMenu]);

  function goToImage(index) {
    setGalleryIndex(index);
  }

  function openCredentialsModal() {
    setNewEmail(session?.user?.email || "");
    setNewPassword("");
    setNewFullName(userProfile?.full_name || "");
    setNewPhone(userProfile?.phone || "");
    setShowCredentialsModal(true);
    setShowProfileMenu(false);
  }

  async function loadShopSettings() {
    setShopSettings(defaultShopSettings);
  }

  function closeAllModals() {
    setShowPrivacyModal(false);
    setShowCredentialsModal(false);
  }

  async function loadUserProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setUserProfile(null);
      return null;
    }

    if (data?.full_name && data?.phone) {
      setUserProfile(data);
      return data;
    }

    const authName = session?.user?.user_metadata?.full_name?.trim() || "";
    const authPhone = session?.user?.user_metadata?.phone?.trim() || "";
    const authEmail = session?.user?.email || "";

    if (authName && authPhone && authEmail) {
      const saved = await saveUserProfile(userId, authEmail, authName, authPhone);

      if (saved) {
        const recoveredProfile = {
          full_name: authName,
          phone: authPhone,
        };

        setUserProfile(recoveredProfile);
        return recoveredProfile;
      }
    }

    setUserProfile(data || null);
    return data || null;
  }

  async function saveUserProfile(userId, email, fullName, phoneNumber) {
    const cleanName = fullName.trim();
    const cleanPhone = phoneNumber.trim();

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email,
          full_name: cleanName,
          phone: cleanPhone,
        },
        { onConflict: "id" }
      );

    if (error) {
      console.error(error);
      alert("Account creato, ma non è stato possibile salvare nome e telefono.");
      return false;
    }

    setUserProfile({
      full_name: cleanName,
      phone: cleanPhone,
    });

    return true;
  }

  async function isCurrentShopMember(userId) {
    const { data, error } = await supabase
      .from("shop_members")
      .select("id")
      .eq("user_id", userId)
      .eq("shop_id", activeShopId)
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return Boolean(data);
  }

  async function joinCurrentShop() {
    const { error } = await supabase.rpc("join_current_shop", {
      target_shop_id: activeShopId,
    });

    if (error) {
      console.error(error);
      alert("Non è stato possibile collegare questo account al salone.");
      return false;
    }

    return true;
  }

  async function confirmJoinShop() {
    if (joinShopLoading) return;

    setJoinShopLoading(true);

    const joined = await joinCurrentShop();

    if (!joined) {
      setJoinShopLoading(false);
      return;
    }

    setShowJoinShopPopup(false);

    const { data } = await supabase.auth.getSession();

    if (data.session?.user) {
      await loadUserProfile(data.session.user.id);
      await loadMyBookings(data.session.user.id);
      await checkAdmin(data.session.user.id);
      await loadLinkedShops(data.session.user.id);
    }

    setJoinShopLoading(false);
    alert("Account collegato correttamente a questo salone.");
  }

  async function cancelJoinShop() {
    if (joinShopLoading) return;

    setShowJoinShopPopup(false);
    await logout();
  }

  async function checkAdmin(userId) {
    const { data, error } = await supabase
      .from("shop_members")
      .select("role")
      .eq("user_id", userId)
      .eq("shop_id", activeShopId)
      .maybeSingle();

    if (error) {
      console.error(error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(data?.role === "admin");
  }

 async function loadLinkedShops(userId) {
  const { data, error } = await supabase
    .from("shop_members")
    .select(`
      role,
      shop_id,
      shops (
        id,
        name,
        slug,
        active
      )
    `)
    .eq("user_id", userId);

  if (error) {
    console.error(error);
    return [];
  }

  const validShops = (data || [])
    .map((item) => ({
      role: item.role,
      ...(item.shops || {}),
    }))
    .filter((shop) => shop.id && shop.active !== false);

  setLinkedShops(validShops);
  console.log("LINKED SHOPS DEBUG:", validShops);

  if (validShops.length === 0) {
  setCurrentShopId("");
  setShopChoiceCompleted(false);
  setShopGateReady(true);
  return validShops;
}

if (validShops.length === 1) {
  setCurrentShopId(validShops[0].id);
  setShopChoiceCompleted(true);
  setShopGateReady(true);
  return validShops;
}

const currentStillValid = validShops.some((shop) => shop.id === currentShopId);

if (!shopChoiceCompleted || !currentStillValid) {
  setCurrentShopId("");
  setShopChoiceCompleted(false);
}

setShopGateReady(true);
return validShops;
}

  async function deleteOldBookings() {
    const { error } = await supabase.rpc("delete_old_bookings");

    if (error) {
      console.warn("Pulizia prenotazioni vecchie non eseguita:", error);
    }
  }

  async function loadAdminData() {
    setAdminLoading(true);

    await deleteOldBookings();

    await Promise.all([
      loadAdminServices(),
      loadAdminImages(),
      loadAdminOperators(),
      loadAdminBookings(),
      loadAvailabilityBlocks(),
      loadAdminOffers(),
    ]);

    setAdminLoading(false);
  }

  async function loadAdminServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", activeShopId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento dei servizi admin.");
      return;
    }

    setAdminServices(data || []);
  }

  async function loadOffers() {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("shop_id", activeShopId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setOffers(data || []);
  }

  async function loadAdminOffers() {
    const { data, error } = await supabase
      .from("offers")
      .select("*")
      .eq("shop_id", activeShopId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento delle offerte.");
      return;
    }

    setAdminOffers(data || []);
  }

  async function createAdminOffer() {
    setOfferSaving(true);

    const { error } = await supabase
      .from("offers")
      .insert([
        {
          shop_id: activeShopId,
          title: "Nuova offerta",
          description: "",
          active: true,
        },
      ]);

    setOfferSaving(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile creare l’offerta.");
      return false;
    }

    await loadOffers();
    await loadAdminOffers();

    return true;
  }

  function updateAdminOfferField(id, field, value) {
    setAdminOffers((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  async function saveAdminOffer(item) {
    const cleanTitle = String(item.title || "").trim();

    if (!cleanTitle) {
      alert("Il titolo dell’offerta non può essere vuoto.");
      return false;
    }

    setOfferSaving(true);

    const { error } = await supabase
      .from("offers")
      .update({
        title: cleanTitle,
        description: item.description || "",
        active: Boolean(item.active),
      })
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    setOfferSaving(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare l’offerta.");
      return false;
    }

    await loadOffers();
    await loadAdminOffers();

    alert("Offerta aggiornata.");
    return true;
  }

  async function deleteAdminOffer(item) {
    const confirmed = window.confirm(
      `ATTENZIONE: stai per eliminare definitivamente l’offerta "${item.title || "senza titolo"}".\n\nQuesta operazione non può essere annullata.\n\nVuoi davvero continuare?`
    );

    if (!confirmed) return false;

    setOfferDeletingId(item.id);

    const { error } = await supabase
      .from("offers")
      .delete()
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    setOfferDeletingId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare l’offerta.");
      return false;
    }

    await loadOffers();
    await loadAdminOffers();

    alert("Offerta eliminata.");
    return true;
  }

  async function loadAdminImages() {
    const { data, error } = await supabase
      .from("home_images")
      .select("*")
      .eq("shop_id", activeShopId)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento delle immagini admin.");
      return;
    }

    setAdminImages(data || []);
  }

  async function loadOperators() {
    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("shop_id", activeShopId)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento degli operatori.");
      return;
    }

    setOperators(data || []);
  }

  async function loadAdminOperators() {
    const { data, error } = await supabase
      .from("operators")
      .select("*")
      .eq("shop_id", activeShopId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento degli operatori admin.");
      return;
    }

    setAdminOperators(data || []);
  }

  async function loadAdminBookings() {
    await deleteOldBookings();

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("shop_id", activeShopId)
      .gte("date", getTodayString())
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento agenda barbiere.");
      return;
    }

    setAdminBookings(data || []);
    setBookings(data || []);
  }

  function updateAdminServiceField(id, field, value) {
    setAdminServices((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function updateAdminImageField(id, field, value) {
    setAdminImages((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  function updateAdminOperatorField(id, field, value) {
    setAdminOperators((current) =>
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  }

  async function createAdminService(payload) {
    const cleanCategory = String(payload.category || "").trim();
    const cleanName = String(payload.name || "").trim();

    if (!cleanCategory || !cleanName) {
      alert("Inserisci almeno categoria e nome servizio.");
      return false;
    }

    const { error } = await supabase
      .from("services")
      .insert([
        {
          shop_id: activeShopId,
          category: cleanCategory,
          category_description: payload.category_description || "",
          icon: payload.icon || "✂️",
          name: cleanName,
          description: payload.description || "",
          price: Number(payload.price || 0),
          duration_minutes: 30,
          active: true,
          sort_order: Number(payload.sort_order || 0),
        },
      ]);

    if (error) {
      console.error(error);
      alert("Non è stato possibile creare il servizio.");
      return false;
    }

    await loadServices();
    await loadAdminServices();

    alert("Servizio creato.");
    return true;
  }

  async function deleteAdminServiceCategory(categoryName) {
    const cleanCategory = String(categoryName || "").trim();

    if (!cleanCategory) {
      alert("Categoria non valida.");
      return false;
    }

    const confirmed = window.confirm(
      `ATTENZIONE: stai per eliminare definitivamente la categoria "${cleanCategory}" e tutti i servizi contenuti al suo interno.\n\nQuesta operazione non può essere annullata.\n\nVuoi davvero continuare?`
    );

    if (!confirmed) return false;

    const { data, error } = await supabase
      .from("services")
      .delete()
      .eq("shop_id", activeShopId)
      .eq("category", cleanCategory)
      .select();

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare la categoria.");
      return false;
    }

    if (!data || data.length === 0) {
      alert("Nessun servizio eliminato. Probabile policy DELETE su Supabase o nome categoria non corrispondente.");
      await loadAdminServices();
      return false;
    }

    await loadServices();
    await loadAdminServices();

    alert("Categoria eliminata.");
    return true;
  }

  async function saveAdminService(item) {
    const { error } = await supabase
      .from("services")
      .update({
        category: item.category,
        category_description: item.category_description,
        icon: item.icon,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        duration_minutes: Number(item.duration_minutes),
        active: Boolean(item.active),
        sort_order: Number(item.sort_order),
      })
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare il servizio.");
      return;
    }

    await loadServices();
    await loadAdminServices();
    alert("Servizio aggiornato.");
  }

  async function deleteAdminService(item) {
    const serviceName = String(item?.name || "questo servizio").trim();

    const confirmed = window.confirm(
      `ATTENZIONE: stai per eliminare definitivamente il servizio "${serviceName}".\n\nQuesta operazione non può essere annullata.\n\nVuoi davvero continuare?`
    );

    if (!confirmed) return false;

    const { data, error } = await supabase
      .from("services")
      .delete()
      .eq("id", item.id)
      .eq("shop_id", activeShopId)
      .select();

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare il servizio.");
      return false;
    }

    if (!data || data.length === 0) {
      alert("Nessun servizio eliminato. Verifica policy Supabase DELETE.");
      await loadAdminServices();
      return false;
    }

    await loadServices();
    await loadAdminServices();

    alert("Servizio eliminato.");
    return true;
  }

  async function saveAdminImage(item) {
    const { error } = await supabase
      .from("home_images")
      .update({
        title: item.title,
        image_url: item.image_url,
        active: Boolean(item.active),
        sort_order: Number(item.sort_order),
      })
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare l’immagine.");
      return;
    }

    await loadHomeImages();
    await loadAdminImages();
    alert("Immagine aggiornata.");
  }

  async function createAdminHomeImage() {
    if (adminImages.length >= 10) {
      alert("Puoi caricare massimo 10 immagini Home.");
      return null;
    }

    const nextSortOrder =
      adminImages.length > 0
        ? Math.min(...adminImages.map((item) => Number(item.sort_order) || 0)) - 1
        : 1;

    const { data, error } = await supabase
      .from("home_images")
      .insert([
        {
          shop_id: activeShopId,
          title: "Nuova foto",
          image_url: "",
          active: true,
          sort_order: nextSortOrder,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Non è stato possibile creare la nuova immagine.");
      return null;
    }

    await loadHomeImages();
    await loadAdminImages();

    return data;
  }

  async function deleteAdminHomeImage(item) {
    const confirmed = window.confirm(
      "Vuoi eliminare definitivamente questa immagine?"
    );

    if (!confirmed) return;

    const { data, error } = await supabase
      .from("home_images")
      .delete()
      .eq("id", item.id)
      .eq("shop_id", activeShopId)
      .select();

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare l’immagine.");
      return;
    }

    if (!data || data.length === 0) {
      alert("Nessuna immagine eliminata. Probabile policy Supabase DELETE o ID non corrispondente.");
      await loadAdminImages();
      return;
    }

    await loadHomeImages();
    await loadAdminImages();

    alert("Immagine eliminata.");
  }

  async function createAdminOperator(e) {
    e.preventDefault();

    if (operatorCreating) return;

    const cleanName = newOperatorName.trim();
    const cleanRole = newOperatorRole.trim();

    if (!cleanName) {
      alert("Inserisci il nome dell’operatore.");
      return;
    }

    setOperatorCreating(true);

    const { error } = await supabase
      .from("operators")
      .insert([
        {
          shop_id: activeShopId,
          name: cleanName,
          role: cleanRole || null,
          active: true,
          sort_order: Number(newOperatorSortOrder || 0),
        },
      ]);

    setOperatorCreating(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile creare l’operatore.");
      return;
    }

    setNewOperatorName("");
    setNewOperatorRole("");
    setNewOperatorSortOrder("0");

    await loadOperators();
    await loadAdminOperators();

    alert("Operatore aggiunto.");
  }

  async function saveAdminOperator(item) {
    const cleanName = String(item.name || "").trim();

    if (!cleanName) {
      alert("Il nome dell’operatore non può essere vuoto.");
      return;
    }

    setOperatorSavingId(item.id);

    const { error } = await supabase
      .from("operators")
      .update({
        name: cleanName,
        role: item.role || null,
        image_url: item.image_url || null,
        active: Boolean(item.active),
        sort_order: Number(item.sort_order || 0),
      })
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    setOperatorSavingId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare l’operatore.");
      return;
    }

    await loadOperators();
    await loadAdminOperators();
    await loadBookings();
    await loadAdminBookings();

    alert("Operatore aggiornato.");
  }

  async function deleteAdminOperator(item) {
    const confirmDelete = window.confirm(
      "Vuoi eliminare questo operatore? Se ha prenotazioni già associate, è meglio disattivarlo invece di eliminarlo."
    );

    if (!confirmDelete) return;

    setOperatorDeletingId(item.id);

    const { error } = await supabase
      .from("operators")
      .delete()
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    setOperatorDeletingId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare l’operatore. Se ha prenotazioni associate, disattivalo invece di eliminarlo.");
      return;
    }

    await loadOperators();
    await loadAdminOperators();

    alert("Operatore eliminato.");
  }

  async function uploadAdminHomeImage(item, file) {
    if (!file) return;

    setUploadingImageId(item.id);

    const extension = file.name.split(".").pop() || "jpg";
    const cleanExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `${activeShopId}/home-${item.id}-${Date.now()}.${cleanExtension || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("home-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      alert("Non è stato possibile caricare la foto.");
      setUploadingImageId("");
      return;
    }

    const { data } = supabase.storage
      .from("home-images")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("home_images")
      .update({
        image_url: publicUrl,
      })
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    if (updateError) {
      console.error(updateError);
      alert("Foto caricata, ma non è stato possibile collegarla alla Home.");
      setUploadingImageId("");
      return;
    }

    await loadHomeImages();
    await loadAdminImages();

    setUploadingImageId("");
    alert("Foto caricata correttamente.");
  }

  async function uploadAdminOperatorImage(item, file) {
    if (!file) return;

    setOperatorSavingId(item.id);

    const extension = file.name.split(".").pop() || "jpg";
    const cleanExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `${activeShopId}/operators/operator-${item.id}-${Date.now()}.${cleanExtension || "jpg"}`;

    const { error: uploadError } = await supabase.storage
      .from("home-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error(uploadError);
      alert("Non è stato possibile caricare la foto dell’operatore.");
      setOperatorSavingId("");
      return;
    }

    const { data } = supabase.storage
      .from("home-images")
      .getPublicUrl(filePath);

    const publicUrl = data.publicUrl;

    const { error: updateError } = await supabase
      .from("operators")
      .update({
        image_url: publicUrl,
      })
      .eq("id", item.id)
      .eq("shop_id", activeShopId);

    if (updateError) {
      console.error(updateError);
      alert("Foto caricata, ma non è stato possibile collegarla all’operatore.");
      setOperatorSavingId("");
      return;
    }

    await loadOperators();
    await loadAdminOperators();
    await loadBookings();
    await loadAdminBookings();

    setOperatorSavingId("");
    alert("Foto operatore aggiornata.");
  }

  async function loadHomeImages() {
    const { data, error } = await supabase
      .from("home_images")
      .select("*")
      .eq("shop_id", activeShopId)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      setGallery(fallbackGallery);
      return;
    }

    const images = (data || [])
      .filter((item) => item.image_url)
      .map((item) => ({
        title: item.title || "Barber studio",
        image: item.image_url,
      }));

    setGallery(images.length > 0 ? images : fallbackGallery);
    setGalleryIndex(0);
  }

  async function loadServices() {
    setServicesLoading(true);

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", activeShopId)
      .eq("active", true)
      .order("sort_order", { ascending: true });

    setServicesLoading(false);

    if (error) {
      alert("Errore nel caricamento dei servizi");
      console.error(error);
      return;
    }

    const groupedServices = [];

    (data || []).forEach((item) => {
      let group = groupedServices.find((existing) => existing.category === item.category);

      if (!group) {
        group = {
          category: item.category,
          icon: item.icon || "✂️",
          description: item.category_description || "",
          services: [],
        };

        groupedServices.push(group);
      }

      group.services.push({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        description: item.description || "",
        duration_minutes: item.duration_minutes,
        image_url: item.image_url,
        sort_order: item.sort_order,
      });
    });

    setServiceCategories(groupedServices);
  }

  async function loadAvailabilityBlocks() {
    const { data, error } = await supabase
      .from("availability_blocks")
      .select("*")
      .eq("shop_id", activeShopId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento delle disponibilità del salone.");
      return;
    }

    setAvailabilityBlocks(data || []);
  }

  async function createAvailabilityBlock(e) {
    e.preventDefault();

    if (availabilitySubmitLockRef.current || availabilitySaving) return;

    if (!session?.user || !isAdmin) {
      alert("Solo un admin può modificare le disponibilità.");
      return;
    }

    const isRecurring = availabilityMode.startsWith("recurring");
    const isFullDay = availabilityMode.endsWith("full_day");
    const cleanReason = availabilityReason.trim();

    if (!isRecurring && !availabilityDate) {
      alert("Scegli il giorno da bloccare.");
      return;
    }

    if (!isFullDay && (!availabilityStartTime || !availabilityEndTime)) {
      alert("Scegli orario di inizio e fine.");
      return;
    }

    if (!isFullDay && timeToMinutes(availabilityStartTime) >= timeToMinutes(availabilityEndTime)) {
      alert("L’orario di fine deve essere successivo all’orario di inizio.");
      return;
    }

    availabilitySubmitLockRef.current = true;
    setAvailabilitySaving(true);

    const payload = {
      shop_id: activeShopId,
      block_date: isRecurring ? null : availabilityDate,
      weekday: isRecurring ? Number(availabilityWeekday) : null,
      start_time: isFullDay ? null : availabilityStartTime,
      end_time: isFullDay ? null : availabilityEndTime,
      full_day: isFullDay,
      recurring: isRecurring,
      active: true,
      reason: cleanReason || null,
      created_by: session.user.id,
    };

    const { error } = await supabase
      .from("availability_blocks")
      .insert([payload]);

    if (error) {
      availabilitySubmitLockRef.current = false;
      setAvailabilitySaving(false);
      console.error(error);
      alert("Non è stato possibile salvare la chiusura.");
      return;
    }

    setAvailabilityDate("");
    setAvailabilityStartTime("");
    setAvailabilityEndTime("");
    setAvailabilityReason("");

    await loadAvailabilityBlocks();
    await loadBookings();

    if (isAdmin) {
      await loadAdminBookings();
    }

    availabilitySubmitLockRef.current = false;
    setAvailabilitySaving(false);
    alert("Disponibilità aggiornata.");
  }

  async function createExceptionalOpening(e) {
    e.preventDefault();

    if (openingSubmitLockRef.current || openingSaving) return;

    if (!session?.user || !isAdmin) {
      alert("Solo un admin può creare aperture eccezionali.");
      return;
    }

    const cleanReason = openingReason.trim();

    if (!openingDate) {
      alert("Scegli il giorno da aprire eccezionalmente.");
      return;
    }

    if (!openingStartTime || !openingEndTime) {
      alert("Scegli orario di apertura e chiusura.");
      return;
    }

    if (timeToMinutes(openingStartTime) >= timeToMinutes(openingEndTime)) {
      alert("L’orario di fine deve essere successivo all’orario di inizio.");
      return;
    }

    openingSubmitLockRef.current = true;
    setOpeningSaving(true);

    const payload = {
      shop_id: activeShopId,
      block_date: openingDate,
      weekday: null,
      start_time: openingStartTime,
      end_time: openingEndTime,
      full_day: false,
      recurring: false,
      active: true,
      reason: `${OPENING_REASON_PREFIX}${cleanReason || "Apertura eccezionale"}`,
      created_by: session.user.id,
    };

    const { error } = await supabase
      .from("availability_blocks")
      .insert([payload]);

    if (error) {
      openingSubmitLockRef.current = false;
      setOpeningSaving(false);
      console.error(error);
      alert("Non è stato possibile salvare l’apertura eccezionale.");
      return;
    }

    setOpeningDate("");
    setOpeningStartTime("");
    setOpeningEndTime("");
    setOpeningReason("");

    await loadAvailabilityBlocks();
    await loadBookings();

    if (isAdmin) {
      await loadAdminBookings();
    }

    openingSubmitLockRef.current = false;
    setOpeningSaving(false);
    alert("Apertura eccezionale salvata.");
  }

  async function deleteAvailabilityBlock(block) {
    const confirmDelete = window.confirm(
      isExceptionalOpeningBlock(block)
        ? "Vuoi rimuovere questa apertura eccezionale?"
        : "Vuoi rimuovere questa chiusura?"
    );

    if (!confirmDelete) return;

    setAvailabilityDeletingId(block.id);

    const { error } = await supabase
      .from("availability_blocks")
      .delete()
      .eq("id", block.id)
      .eq("shop_id", activeShopId);

    setAvailabilityDeletingId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare questa disponibilità.");
      return;
    }

    await loadAvailabilityBlocks();
    alert(isExceptionalOpeningBlock(block) ? "Apertura eccezionale rimossa." : "Chiusura rimossa.");
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("shop_id", activeShopId)
      .gte("date", getTodayString())
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      alert("Errore nel caricamento degli orari");
      console.error(error);
      return;
    }

    setBookings(data || []);
  }

  async function loadMyBookings(userId) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .eq("shop_id", activeShopId)
      .gte("date", getTodayString())
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (error) {
      alert("Errore nel caricamento delle tue prenotazioni");
      console.error(error);
      return;
    }

    setMyBookings(data || []);
  }

  async function resetPassword() {
    const cleanEmail = authEmail.trim();

    if (!cleanEmail) {
      alert("Inserisci prima la tua email nel campo Email.");
      return;
    }

    if (!isEmailProbablyValid(cleanEmail)) {
      alert("Controlla l’indirizzo email. Potrebbe esserci un errore nel dominio.");
      return;
    }

    const redirectUrl =
      window.location.hostname === "localhost"
        ? window.location.origin
        : "https://mellifluous-crepe-6f358d.netlify.app";

    setAuthLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: redirectUrl,
    });

    setAuthLoading(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile inviare l’email di recupero password.");
      return;
    }

    alert("Ti abbiamo inviato un’email per reimpostare la password.");
  }

  async function handleAuth(e) {
    e.preventDefault();

    if (authSubmitLockRef.current || authLoading) return;

    authSubmitLockRef.current = true;
    setAuthLoading(true);

    const cleanEmail = authEmail.trim();
    const cleanName = authFullName.trim();
    const cleanPhone = authPhone.trim();

    if (!isEmailProbablyValid(cleanEmail)) {
      authSubmitLockRef.current = false;
      setAuthLoading(false);
      alert("Controlla l’indirizzo email. Potrebbe esserci un errore nel dominio.");
      return;
    }

    if (authMode === "login") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: authPassword,
      });

      if (error) {
        authSubmitLockRef.current = false;
        setAuthLoading(false);
        alert("Accesso non riuscito. Controlla email e password.");
        console.error(error);
        return;
      }

      const member = await isCurrentShopMember(data.user.id);

      setAuthEmail("");
setAuthPassword("");

localStorage.removeItem("barberbooking_current_shop_id");
setCurrentShopId("");

await loadUserProfile(data.user.id);
await loadLinkedShops(data.user.id);

      

      authSubmitLockRef.current = false;
      setAuthLoading(false);

      if (!member) {
        setShowJoinShopPopup(true);
      }

      return;
    }

    if (!cleanName || !cleanPhone) {
      authSubmitLockRef.current = false;
      setAuthLoading(false);
      alert("Inserisci nome e telefono per completare la registrazione.");
      return;
    }

    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: authPassword,
    });

    if (!loginError) {
      const member = await isCurrentShopMember(loginData.user.id);

      await saveUserProfile(loginData.user.id, cleanEmail, cleanName, cleanPhone);

      setAuthFullName("");
      setAuthPhone("");
      setAuthEmail("");
      setAuthPassword("");

      authSubmitLockRef.current = false;
      setAuthLoading(false);

      if (!member) {
        setShowJoinShopPopup(true);
        return;
      }

      alert("Account già riconosciuto. Accesso effettuato.");
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: cleanEmail,
      password: authPassword,
      options: {
        data: {
          full_name: cleanName,
          phone: cleanPhone,
        },
      },
    });

    if (signUpError) {
      authSubmitLockRef.current = false;
      setAuthLoading(false);
      console.error(signUpError);
      alert("Non è stato possibile completare l’accesso. Se hai già un account, usa la scheda Accedi.");
      return;
    }

    setAuthFullName("");
    setAuthPhone("");
    setAuthEmail("");
    setAuthPassword("");

    if (signUpData.session?.user) {
      await saveUserProfile(signUpData.session.user.id, cleanEmail, cleanName, cleanPhone);
      await joinCurrentShop();
      await loadMyBookings(signUpData.session.user.id);
      await checkAdmin(signUpData.session.user.id);
      await loadLinkedShops(signUpData.session.user.id);

      authSubmitLockRef.current = false;
      setAuthLoading(false);
      alert("Registrazione completata.");
      return;
    }

    authSubmitLockRef.current = false;
    setAuthLoading(false);
    alert("Registrazione completata. Controlla la tua email se è richiesta la conferma.");
    setAuthMode("login");
  }

  async function updateCredentials(e) {
    e.preventDefault();

    if (!session?.user) {
      alert("Devi essere connesso per modificare le credenziali.");
      return;
    }

    const cleanFullName = newFullName.trim();
    const cleanPhone = newPhone.trim();

    if (!cleanFullName || !cleanPhone) {
      alert("Inserisci nome e telefono.");
      return;
    }

    if (!isEmailProbablyValid(newEmail.trim() || session.user.email)) {
      alert("Controlla l’indirizzo email. Potrebbe esserci un errore nel dominio.");
      return;
    }

    const payload = {};

    if (newEmail.trim() && newEmail.trim() !== session.user.email) {
      payload.email = newEmail.trim();
    }

    if (newPassword.trim()) {
      payload.password = newPassword.trim();
    }

    setCredentialsLoading(true);

    if (payload.email || payload.password) {
      const { error } = await supabase.auth.updateUser(payload);

      if (error) {
        setCredentialsLoading(false);
        console.error(error);
        alert("Non è stato possibile aggiornare le credenziali.");
        return;
      }
    }

    const savedProfile = await saveUserProfile(
      session.user.id,
      newEmail.trim() || session.user.email,
      cleanFullName,
      cleanPhone
    );

    setCredentialsLoading(false);

    if (!savedProfile) return;

    alert("Profilo e credenziali aggiornati correttamente. Se hai cambiato email, potrebbe essere richiesta una conferma.");
    setShowCredentialsModal(false);
    setNewPassword("");
  }

  async function deleteAccount() {
    if (!session?.user) {
      alert("Devi essere connesso per cancellare l’account.");
      return;
    }

    const firstConfirm = window.confirm(
      "Questa operazione eliminerà definitivamente il tuo account e i dati associati da tutte le applicazioni collegate alla piattaforma. Se vuoi solo uscire dall’app, usa Logout. Vuoi continuare?"
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      "Conferma finale: la cancellazione non può essere annullata. Verranno eliminati account, prenotazioni e collegamenti ai saloni."
    );

    if (!secondConfirm) return;

    setDeleteAccountLoading(true);

    const { error } = await supabase.rpc("delete_current_user_account");

    setDeleteAccountLoading(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare l’account.");
      return;
    }

    alert("Account eliminato correttamente.");
    window.location.reload();
  }

  async function logout() {
    await supabase.auth.signOut();
    localStorage.removeItem("barberbooking_current_shop_id");
    setCurrentShopId("");
    setLinkedShops([]);
    setIsAdmin(false);
    setUserProfile(null);
    setMyBookings([]);
    setAdminBookings([]);
    setAdminServices([]);
    setAdminImages([]);
    setAdminOperators([]);
    setAdminTab("agenda");
    setShowJoinShopPopup(false);
    setShowProfileMenu(false);
    closeAllModals();
    setActivePage("home");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (bookingSubmitLockRef.current || loading) return;

    bookingSubmitLockRef.current = true;
    setLoading(true);

    if (!session?.user) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Per prenotare devi prima accedere o creare un account.");
      setActivePage("account");
      return;
    }

    const member = await isCurrentShopMember(session.user.id);

    if (!member) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      setShowJoinShopPopup(true);
      return;
    }

    const profile = userProfile || await loadUserProfile(session.user.id);
    const profileName = profile?.full_name?.trim();
    const profilePhone = profile?.phone?.trim();

    if (!profileName || !profilePhone) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Per prenotare mancano nome o telefono nel tuo profilo. Apri il menu in alto a destra, entra in Cambia credenziali e completa nome e telefono.");
      setActivePage("home");
      return;
    }

    if (!selectedOperator) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Scegli l’operatore con cui vuoi prenotare.");
      return;
    }

    if (!date || !time || !availableSlots.includes(time)) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Questo giorno o orario non è disponibile. Scegli un altro slot.");
      await loadAvailabilityBlocks();
      await loadBookings();
      return;
    }

    const alreadyBooked = isOperatorBookedAtSlot(bookings, date, time, selectedOperator.id);

    if (alreadyBooked) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Questo operatore non è più disponibile in questo orario. Scegli un altro orario o un altro operatore.");
      await loadBookings();
      return;
    }

    const { data: freshAvailabilityBlocks, error: freshAvailabilityError } = await supabase
      .from("availability_blocks")
      .select("*")
      .eq("shop_id", activeShopId)
      .eq("active", true);

    if (freshAvailabilityError) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      console.error(freshAvailabilityError);
      alert("Non è stato possibile verificare le disponibilità aggiornate del salone.");
      return;
    }

    const currentAvailabilityBlocks = freshAvailabilityBlocks || availabilityBlocks;

    const blockedByAvailability = isSlotBlockedByAvailability(
      time,
      date,
      currentAvailabilityBlocks
    );

    const currentAvailableSlots = slots.filter((slot) => {
      if (isSlotBlockedByAvailability(slot, date, currentAvailabilityBlocks)) {
        return false;
      }

      if (selectedOperator) {
        return !isOperatorBookedAtSlot(bookings, date, slot, selectedOperator.id);
      }

      return false;
    });

    if (blockedByAvailability || !currentAvailableSlots.includes(time)) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      setTime("");
      await loadAvailabilityBlocks();
      await loadBookings();
      alert("Questo giorno o orario non è disponibile perché il salone risulta chiuso o lo slot non è prenotabile.");
      return;
    }

    const serviceLabel = selectedService
      ? `${selectedService.name} - €${selectedService.price}`
      : service;

    const { error } = await supabase.from("bookings").insert([
      {
        service: serviceLabel,
        date,
        time,
        name: profileName,
        phone: profilePhone,
        user_id: session.user.id,
        operator_id: selectedOperator.id,
        operator_name: selectedOperator.name,
        shop_id: activeShopId,
      },
    ]);

    if (error) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Non è stato possibile confermare la prenotazione.");
      console.error(error);
      return;
    }

    setService("");
    setOperatorId("");
    setDate("");
    setTime("");

    await loadBookings();
    await loadMyBookings(session.user.id);

    if (isAdmin) {
      await loadAdminBookings();
    }

    bookingSubmitLockRef.current = false;
    setLoading(false);
    alert("Prenotazione confermata!");
    setActivePage("my-bookings");
  }

  async function createManualBooking(e) {
    e.preventDefault();

    if (manualBookingSubmitLockRef.current || manualBookingLoading) return;

    const cleanName = manualName.trim();
    const cleanPhone = manualPhone.trim();
    const cleanService = manualService.trim() || "Prenotazione telefonica";

    if (!cleanName || !cleanPhone || !manualDate || !manualTime || !selectedManualOperator) {
      alert("Inserisci almeno nome, telefono, operatore, giorno e ora.");
      return;
    }

    manualBookingSubmitLockRef.current = true;
    setManualBookingLoading(true);

    const alreadyBooked = isOperatorBookedAtSlot(bookings, manualDate, manualTime, selectedManualOperator.id);

    if (alreadyBooked) {
      manualBookingSubmitLockRef.current = false;
      setManualBookingLoading(false);
      alert("Questo operatore risulta già occupato in questo orario. Aggiorna l’agenda o scegli un altro orario.");
      await loadBookings();
      await loadAdminBookings();
      return;
    }

    const blockedByAvailability = isSlotBlockedByAvailability(manualTime, manualDate, availabilityBlocks);

    if (blockedByAvailability) {
      manualBookingSubmitLockRef.current = false;
      setManualBookingLoading(false);
      alert("Questo orario risulta bloccato nelle disponibilità del salone.");
      await loadAvailabilityBlocks();
      return;
    }

    const { error } = await supabase.from("bookings").insert([
      {
        service: cleanService,
        date: manualDate,
        time: manualTime,
        name: cleanName,
        phone: cleanPhone,
        operator_id: selectedManualOperator.id,
        operator_name: selectedManualOperator.name,
        user_id: null,
        created_by: session.user.id,
        shop_id: activeShopId,
      },
    ]);

    if (error) {
      manualBookingSubmitLockRef.current = false;
      setManualBookingLoading(false);
      console.error(error);
      alert("Non è stato possibile aggiungere la prenotazione manuale.");
      return;
    }

    const optimisticBooking = {
      id: `manual-${Date.now()}`,
      service: cleanService,
      date: manualDate,
      time: manualTime,
      name: cleanName,
      phone: cleanPhone,
      operator_id: selectedManualOperator.id,
      operator_name: selectedManualOperator.name,
      user_id: null,
      created_by: session.user.id,
      shop_id: activeShopId,
    };

    setBookings((current) => [...current, optimisticBooking]);

    setAdminBookings((current) =>
      [...current, optimisticBooking].sort((a, b) => {
        if (a.date !== b.date) {
          return a.date.localeCompare(b.date);
        }

        return a.time.localeCompare(b.time);
      })
    );

    setManualName("");
    setManualPhone("");
    setManualService("");
    setManualOperatorId("");
    setManualDate("");
    setManualTime("");
    setShowManualBookingForm(false);

    await loadBookings();
    await loadAdminBookings();

    manualBookingSubmitLockRef.current = false;
    setManualBookingLoading(false);
    alert("Prenotazione aggiunta in agenda.");
  }

  async function deleteBooking(id) {
    const confirmDelete = window.confirm("Vuoi cancellare questa prenotazione?");
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id)
      .eq("user_id", session.user.id)
      .eq("shop_id", activeShopId);

    if (error) {
      alert("Non è stato possibile cancellare la prenotazione.");
      console.error(error);
      return;
    }

    await loadBookings();
    await loadMyBookings(session.user.id);

    if (isAdmin) {
      await loadAdminBookings();
    }

    alert("Prenotazione cancellata.");
  }

  async function confirmDeleteAdminBooking() {
    if (!adminBookingToDelete) return;

    setAdminDeleteLoading(true);

    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", adminBookingToDelete.id)
      .eq("shop_id", activeShopId);

    setAdminDeleteLoading(false);

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare la prenotazione.");
      return;
    }

    setAdminBookingToDelete(null);

    await loadBookings();
    await loadAdminBookings();

    if (session?.user) {
      await loadMyBookings(session.user.id);
    }

    alert("Prenotazione eliminata.");
  }

  return (
    <div className="app">
      <main className="phone-shell">
       
        {session && !shopGateReady && (
  <section className="screen shop-select-screen">
    <div className="shop-select-hero">
      <span>BarberBooking</span>
      <h1>Caricamento saloni</h1>
      <p>Stiamo preparando la tua esperienza.</p>
    </div>
  </section>
)}

 {session && shopGateReady && linkedShops.length > 1 && !shopChoiceCompleted && ( 
  <ShopSelectScreen
    linkedShops={linkedShops}
    currentShopId={currentShopId}
    setCurrentShopId={setCurrentShopId}
    setShopChoiceCompleted={setShopChoiceCompleted}
  />
)}
        
        {!session && (
  <AccountScreen
    setActivePage={setActivePage}
    session={session}
    userProfile={userProfile}
    isAdmin={isAdmin}
    logout={logout}
    handleAuth={handleAuth}
    authMode={authMode}
    setAuthMode={setAuthMode}
    authLoading={authLoading}
    authFullName={authFullName}
    setAuthFullName={setAuthFullName}
    authPhone={authPhone}
    setAuthPhone={setAuthPhone}
    authEmail={authEmail}
    setAuthEmail={setAuthEmail}
    authPassword={authPassword}
    setAuthPassword={setAuthPassword}
    resetPassword={resetPassword}
  />
)}
  {canEnterShop && activePage === "home" && (
  linkedShops.length > 1 && !currentShopId ? (
    <ShopSelectScreen
      linkedShops={linkedShops}
      currentShopId={currentShopId}
      setCurrentShopId={setCurrentShopId}
    />
  ) : (
    <HomeScreen
      shopSettings={shopSettings}
      shopAddressLine={shopAddressLine}
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
      gallery={gallery}
      galleryIndex={galleryIndex}
      goToImage={goToImage}
      setAdminTab={setAdminTab}
      loadAdminBookings={loadAdminBookings}
      servicesLoading={servicesLoading}
      serviceCategories={serviceCategories}
      offers={offers}
    />
  )
)}

           {canEnterShop && activePage === "book" && (
        <BookingScreen
            setActivePage={setActivePage}
            serviceCategories={serviceCategories}
            servicesLoading={servicesLoading}
            service={service}
            setService={setService}
            selectedService={selectedService}
            operatorId={operatorId}
            setOperatorId={setOperatorId}
            operators={operators}
            activeOperators={activeOperators}
            selectedOperator={selectedOperator}
            date={date}
            setDate={setDate}
            time={time}
            formatLongDate={formatLongDate}
            setTime={setTime}
            availableSlots={availableSlots}
            bookingAvailabilityNotice={bookingAvailabilityNotice}
            loading={loading}
            handleSubmit={handleSubmit}
            offers={offers}
          />
        )}

        {canEnterShop && activePage === "my-bookings" && (
          <MyBookingsScreen
            setActivePage={setActivePage}
            session={session}
            myBookings={myBookings}
            deleteBooking={deleteBooking}
            formatDateHeader={formatDateHeader}
            formatLongDate={formatLongDate}
          />
        )}

        {canEnterShop && activePage === "account" && (
          <AccountScreen
            setActivePage={setActivePage}
            session={session}
            userProfile={userProfile}
            isAdmin={isAdmin}
            logout={logout}
            handleAuth={handleAuth}
            authMode={authMode}
            setAuthMode={setAuthMode}
            authLoading={authLoading}
            authFullName={authFullName}
            setAuthFullName={setAuthFullName}
            authPhone={authPhone}
            setAuthPhone={setAuthPhone}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            resetPassword={resetPassword}
          />
        )}

        {canEnterShop && activePage === "admin" && isAdmin && (
          <AdminScreen
            setActivePage={setActivePage}
            adminTab={adminTab}
            setAdminTab={setAdminTab}
            loadAdminBookings={loadAdminBookings}
            loadAvailabilityBlocks={loadAvailabilityBlocks}
          >
            {adminLoading && (
              <div className="empty-card compact">
                <strong>Caricamento area barbiere</strong>
                <p>Stiamo recuperando i dati aggiornati.</p>
              </div>
            )}

            {!adminLoading && adminTab === "availability" && (
              <AdminAvailability
                closureBlocks={closureBlocks}
                exceptionalOpeningBlocks={exceptionalOpeningBlocks}
                availabilityTab={availabilityTab}
                setAvailabilityTab={setAvailabilityTab}
                createAvailabilityBlock={createAvailabilityBlock}
                availabilityMode={availabilityMode}
                setAvailabilityMode={setAvailabilityMode}
                availabilitySaving={availabilitySaving}
                availabilityDate={availabilityDate}
                setAvailabilityDate={setAvailabilityDate}
                availabilityWeekday={availabilityWeekday}
                setAvailabilityWeekday={setAvailabilityWeekday}
                weekdays={weekdays}
                slots={slots}
                availabilityStartTime={availabilityStartTime}
                setAvailabilityStartTime={setAvailabilityStartTime}
                availabilityEndTime={availabilityEndTime}
                setAvailabilityEndTime={setAvailabilityEndTime}
                availabilityReason={availabilityReason}
                setAvailabilityReason={setAvailabilityReason}
                sortedAvailabilityBlocks={sortedAvailabilityBlocks}
                formatAvailabilityBlockTitle={formatAvailabilityBlockTitle}
                formatAvailabilityBlockTime={formatAvailabilityBlockTime}
                getCleanAvailabilityReason={getCleanAvailabilityReason}
                availabilityDeletingId={availabilityDeletingId}
                deleteAvailabilityBlock={deleteAvailabilityBlock}
                createExceptionalOpening={createExceptionalOpening}
                openingDate={openingDate}
                setOpeningDate={setOpeningDate}
                openingSaving={openingSaving}
                hasExceptionalOpeningForDate={hasExceptionalOpeningForDate}
                availabilityBlocks={availabilityBlocks}
                openingStartTime={openingStartTime}
                setOpeningStartTime={setOpeningStartTime}
                openingEndTime={openingEndTime}
                setOpeningEndTime={setOpeningEndTime}
                openingReason={openingReason}
                setOpeningReason={setOpeningReason}
                sortedExceptionalOpeningBlocks={sortedExceptionalOpeningBlocks}
              />
            )}

            {!adminLoading && adminTab === "content" && (
              <AdminContent
                createAdminService={createAdminService}
                deleteAdminServiceCategory={deleteAdminServiceCategory}
                adminContentTab={adminContentTab}
                setAdminContentTab={setAdminContentTab}
                loadAdminOperators={loadAdminOperators}
                adminServices={adminServices}
                adminServiceCategories={adminServiceCategories}
                groupedAdminServices={groupedAdminServices}
                updateAdminServiceField={updateAdminServiceField}
                saveAdminService={saveAdminService}
                deleteAdminService={deleteAdminService}
                adminImages={adminImages}
                cameraInputRefs={cameraInputRefs}
                galleryInputRefs={galleryInputRefs}
                uploadAdminHomeImage={uploadAdminHomeImage}
                uploadingImageId={uploadingImageId}
                updateAdminImageField={updateAdminImageField}
                saveAdminImage={saveAdminImage}
                createAdminHomeImage={createAdminHomeImage}
                deleteAdminHomeImage={deleteAdminHomeImage}
                adminOperators={adminOperators}
                operatorImageInputRefs={operatorImageInputRefs}
                uploadAdminOperatorImage={uploadAdminOperatorImage}
                createAdminOperator={createAdminOperator}
                newOperatorName={newOperatorName}
                setNewOperatorName={setNewOperatorName}
                newOperatorRole={newOperatorRole}
                setNewOperatorRole={setNewOperatorRole}
                newOperatorSortOrder={newOperatorSortOrder}
                setNewOperatorSortOrder={setNewOperatorSortOrder}
                operatorCreating={operatorCreating}
                updateAdminOperatorField={updateAdminOperatorField}
                operatorSavingId={operatorSavingId}
                saveAdminOperator={saveAdminOperator}
                operatorDeletingId={operatorDeletingId}
                deleteAdminOperator={deleteAdminOperator}
              />
            )}

            {!adminLoading && adminTab === "offers" && (
              <AdminOffers
                adminOffers={adminOffers}
                createAdminOffer={createAdminOffer}
                updateAdminOfferField={updateAdminOfferField}
                saveAdminOffer={saveAdminOffer}
                deleteAdminOffer={deleteAdminOffer}
                offerSaving={offerSaving}
                offerDeletingId={offerDeletingId}
              />
            )}

            {!adminLoading && adminTab === "agenda" && (
              <AdminAgenda
                adminAgendaFilter={adminAgendaFilter}
                setAdminAgendaFilter={setAdminAgendaFilter}
                loadAdminBookings={loadAdminBookings}
                groupedAdminBookings={groupedAdminBookings}
                formatDateHeader={formatDateHeader}
                setAdminBookingToDelete={setAdminBookingToDelete}
                filteredAdminBookings={filteredAdminBookings}
                showManualBookingForm={showManualBookingForm}
                setShowManualBookingForm={setShowManualBookingForm}
                manualBookingLoading={manualBookingLoading}
                createManualBooking={createManualBooking}
                manualName={manualName}
                setManualName={setManualName}
                manualPhone={manualPhone}
                setManualPhone={setManualPhone}
                manualService={manualService}
                setManualService={setManualService}
                manualOperatorId={manualOperatorId}
                setManualOperatorId={setManualOperatorId}
                activeOperators={activeOperators}
                manualDate={manualDate}
                setManualDate={setManualDate}
                manualTime={manualTime}
                setManualTime={setManualTime}
                manualAvailableSlots={manualAvailableSlots}
              />
            )}
          </AdminScreen>
        )}

        {canEnterShop && activePage === "info" && (
          <InfoScreen
            setActivePage={setActivePage}
            shopSettings={shopSettings}
          />
        )}
      </main>

      {showJoinShopPopup && (
        <JoinShopPopup
          joinShopLoading={joinShopLoading}
          confirmJoinShop={confirmJoinShop}
          cancelJoinShop={cancelJoinShop}
        />
      )}

      <ConfirmDeleteBookingModal
        adminBookingToDelete={adminBookingToDelete}
        adminDeleteLoading={adminDeleteLoading}
        setAdminBookingToDelete={setAdminBookingToDelete}
        confirmDeleteAdminBooking={confirmDeleteAdminBooking}
        formatLongDate={formatLongDate}
      />

      {showPrivacyModal && (
        <PrivacyModal
          setShowPrivacyModal={setShowPrivacyModal}
        />
      )}

      {showCredentialsModal && (
        <CredentialsModal
          session={session}
          newFullName={newFullName}
          setNewFullName={setNewFullName}
          newPhone={newPhone}
          setNewPhone={setNewPhone}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          newPassword={newPassword}
          setNewPassword={setNewPassword}
          credentialsLoading={credentialsLoading}
          updateCredentials={updateCredentials}
          setShowCredentialsModal={setShowCredentialsModal}
        />
      )}

      {canEnterShop && (
  <BottomNav
    activePage={activePage}
    setActivePage={setActivePage}
    setShowProfileMenu={setShowProfileMenu}
  />
)}
    </div>
  );
}

export default App;