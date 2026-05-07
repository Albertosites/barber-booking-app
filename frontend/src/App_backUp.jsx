import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

const SHOP_ID = "0c0f8c8e-6b93-45a0-a97b-688394b769a3";

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

function formatCompactDate(dateString) {
  return formatItalianDate(dateString, {
    weekday: "short",
    day: "numeric",
    month: "short",
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

function isSlotBlockedByAvailability(slot, dateString, availabilityBlocks) {
  if (!dateString) return false;

  const selectedWeekday = getWeekdayFromDate(dateString);
  const slotMinutes = timeToMinutes(slot);

  return availabilityBlocks.some((block) => {
    if (!block.active) return false;

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

function formatAvailabilityBlockTitle(block) {
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

  const matchingBlocks = availabilityBlocks.filter((block) => {
    if (!block.active) return false;

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

function App() {
  const [activePage, setActivePage] = useState("home");
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [gallery, setGallery] = useState(fallbackGallery);
  const [openCategory, setOpenCategory] = useState("");

  const [serviceCategories, setServiceCategories] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState("agenda");
  const [adminContentTab, setAdminContentTab] = useState("services");
  const [adminAgendaFilter, setAdminAgendaFilter] = useState("all");
  const [adminServices, setAdminServices] = useState([]);
  const [adminImages, setAdminImages] = useState([]);
  const [adminBookings, setAdminBookings] = useState([]);
  const [availabilityBlocks, setAvailabilityBlocks] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState("");
  const [adminBookingToDelete, setAdminBookingToDelete] = useState(null);
  const [adminDeleteLoading, setAdminDeleteLoading] = useState(false);

  const [availabilityMode, setAvailabilityMode] = useState("date_full_day");
  const [availabilityDate, setAvailabilityDate] = useState("");
  const [availabilityWeekday, setAvailabilityWeekday] = useState("1");
  const [availabilityStartTime, setAvailabilityStartTime] = useState("");
  const [availabilityEndTime, setAvailabilityEndTime] = useState("");
  const [availabilityReason, setAvailabilityReason] = useState("");
  const [availabilitySaving, setAvailabilitySaving] = useState(false);
  const [availabilityDeletingId, setAvailabilityDeletingId] = useState("");

  const [showManualBookingForm, setShowManualBookingForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualService, setManualService] = useState("");
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
  const authSubmitLockRef = useRef(false);
  const bookingSubmitLockRef = useRef(false);
  const manualBookingSubmitLockRef = useRef(false);
  const availabilitySubmitLockRef = useRef(false);

  const [authMode, setAuthMode] = useState("login");
  const [authFullName, setAuthFullName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [bookings, setBookings] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const allServices = useMemo(() => {
    return serviceCategories.flatMap((group) => group.services);
  }, [serviceCategories]);

  const selectedService = allServices.find((item) => item.name === service);

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

  const adminBookingDays = useMemo(() => {
    return Object.keys(groupedAdminBookings).sort();
  }, [groupedAdminBookings]);

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

  const sortedAvailabilityBlocks = useMemo(() => {
    return [...availabilityBlocks].sort((a, b) => {
      if (a.recurring !== b.recurring) {
        return a.recurring ? 1 : -1;
      }

      const first = a.block_date || String(a.weekday || "");
      const second = b.block_date || String(b.weekday || "");

      return String(first).localeCompare(String(second));
    });
  }, [availabilityBlocks]);

  const availableSlots = useMemo(() => {
    return slots.filter(
      (slot) =>
        !bookings.some((b) => b.date === date && b.time === slot) &&
        !isSlotBlockedByAvailability(slot, date, availabilityBlocks)
    );
  }, [availabilityBlocks, bookings, date]);

  const bookingAvailabilityNotice = useMemo(() => {
    return getBookingAvailabilityNotice(date, availabilityBlocks, availableSlots);
  }, [availabilityBlocks, availableSlots, date]);

  const manualAvailableSlots = useMemo(() => {
    return slots.filter(
      (slot) =>
        !bookings.some((b) => b.date === manualDate && b.time === slot) &&
        !isSlotBlockedByAvailability(slot, manualDate, availabilityBlocks)
    );
  }, [availabilityBlocks, bookings, manualDate]);

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
    loadServices();
    loadHomeImages();
    loadBookings();
    loadAvailabilityBlocks();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadUserProfile(session.user.id);
      loadMyBookings(session.user.id);
      checkAdmin(session.user.id);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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

  function toggleCategory(category) {
    setOpenCategory((current) => (current === category ? "" : category));
  }

  function openCredentialsModal() {
    setNewEmail(session?.user?.email || "");
    setNewPassword("");
    setNewFullName(userProfile?.full_name || "");
    setNewPhone(userProfile?.phone || "");
    setShowCredentialsModal(true);
    setShowProfileMenu(false);
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
      .eq("shop_id", SHOP_ID)
      .maybeSingle();

    if (error) {
      console.error(error);
      return false;
    }

    return Boolean(data);
  }

  async function joinCurrentShop() {
    const { error } = await supabase.rpc("join_current_shop", {
      target_shop_id: SHOP_ID,
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
      .eq("shop_id", SHOP_ID)
      .maybeSingle();

    if (error) {
      console.error(error);
      setIsAdmin(false);
      return;
    }

    setIsAdmin(data?.role === "admin");
  }

  async function deleteOldBookings() {
    const { error } = await supabase.rpc("delete_old_bookings");

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare le prenotazioni vecchie.");
    }
  }

  async function loadAdminData() {
    setAdminLoading(true);

    await deleteOldBookings();

    await Promise.all([
      loadAdminServices(),
      loadAdminImages(),
      loadAdminBookings(),
      loadAvailabilityBlocks(),
    ]);

    setAdminLoading(false);
  }

  async function loadAdminServices() {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", SHOP_ID)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento dei servizi admin.");
      return;
    }

    setAdminServices(data || []);
  }

  async function loadAdminImages() {
    const { data, error } = await supabase
      .from("home_images")
      .select("*")
      .eq("shop_id", SHOP_ID)
      .order("sort_order", { ascending: true });

    if (error) {
      console.error(error);
      alert("Errore nel caricamento delle immagini admin.");
      return;
    }

    setAdminImages(data || []);
  }

  async function loadAdminBookings() {
    await deleteOldBookings();

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("shop_id", SHOP_ID)
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
      .eq("shop_id", SHOP_ID);

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare il servizio.");
      return;
    }

    await loadServices();
    await loadAdminServices();
    alert("Servizio aggiornato.");
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
      .eq("shop_id", SHOP_ID);

    if (error) {
      console.error(error);
      alert("Non è stato possibile salvare l’immagine.");
      return;
    }

    await loadHomeImages();
    await loadAdminImages();
    alert("Immagine aggiornata.");
  }

  async function uploadAdminHomeImage(item, file) {
    if (!file) return;

    setUploadingImageId(item.id);

    const extension = file.name.split(".").pop() || "jpg";
    const cleanExtension = extension.toLowerCase().replace(/[^a-z0-9]/g, "");
    const filePath = `${SHOP_ID}/home-${item.id}-${Date.now()}.${cleanExtension || "jpg"}`;

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
      .eq("shop_id", SHOP_ID);

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

  async function loadHomeImages() {
    const { data, error } = await supabase
      .from("home_images")
      .select("*")
      .eq("shop_id", SHOP_ID)
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
      .eq("shop_id", SHOP_ID)
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
      .eq("shop_id", SHOP_ID)
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
      shop_id: SHOP_ID,
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

  async function deleteAvailabilityBlock(block) {
    const confirmDelete = window.confirm("Vuoi rimuovere questa chiusura?");
    if (!confirmDelete) return;

    setAvailabilityDeletingId(block.id);

    const { error } = await supabase
      .from("availability_blocks")
      .delete()
      .eq("id", block.id)
      .eq("shop_id", SHOP_ID);

    setAvailabilityDeletingId("");

    if (error) {
      console.error(error);
      alert("Non è stato possibile eliminare la chiusura.");
      return;
    }

    await loadAvailabilityBlocks();
    alert("Chiusura rimossa.");
  }

  async function loadBookings() {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("shop_id", SHOP_ID)
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
      .eq("shop_id", SHOP_ID)
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

      await loadUserProfile(data.user.id);

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
    setIsAdmin(false);
    setUserProfile(null);
    setMyBookings([]);
    setAdminBookings([]);
    setAdminServices([]);
    setAdminImages([]);
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

    const alreadyBooked = bookings.some(
      (booking) => booking.date === date && booking.time === time
    );

    if (alreadyBooked) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Questo orario non è più disponibile. Scegline un altro.");
      await loadBookings();
      return;
    }

    const blockedByAvailability = isSlotBlockedByAvailability(time, date, availabilityBlocks);

    if (blockedByAvailability) {
      bookingSubmitLockRef.current = false;
      setLoading(false);
      alert("Questo orario non è disponibile perché il salone risulta chiuso.");
      await loadAvailabilityBlocks();
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
        shop_id: SHOP_ID,
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
    setDate("");
    setTime("");
    setOpenCategory("");

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

    if (!cleanName || !cleanPhone || !manualDate || !manualTime) {
      alert("Inserisci almeno nome, telefono, giorno e ora.");
      return;
    }

    manualBookingSubmitLockRef.current = true;
    setManualBookingLoading(true);

    const alreadyBooked = bookings.some(
      (booking) => booking.date === manualDate && booking.time === manualTime
    );

    if (alreadyBooked) {
      manualBookingSubmitLockRef.current = false;
      setManualBookingLoading(false);
      alert("Questo orario risulta già occupato. Aggiorna l’agenda o scegli un altro orario.");
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
        user_id: null,
        created_by: session.user.id,
        shop_id: SHOP_ID,
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
      user_id: null,
      created_by: session.user.id,
      shop_id: SHOP_ID,
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
      .eq("shop_id", SHOP_ID);

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
      .eq("shop_id", SHOP_ID);

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
        {activePage === "home" && (
          <section className="screen">
            <header className="app-header">
              <div>
                <span className="eyebrow">Barber studio</span>
                <h1>Barber Booking</h1>
                {isAdmin && <span className="eyebrow">Admin attivo</span>}
              </div>

              <div className="profile-wrapper">
                <button
                  className="avatar profile-button"
                  type="button"
                  onClick={() => setShowProfileMenu((current) => !current)}
                  aria-label="Apri profilo"
                >
                  {session?.user?.email?.charAt(0)?.toUpperCase() || "B"}
                </button>

                {showProfileMenu && (
                  <div className="profile-menu">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPrivacyModal(true);
                        setShowProfileMenu(false);
                      }}
                    >
                      Privacy
                    </button>

                    <button
                      type="button"
                      onClick={openCredentialsModal}
                    >
                      Cambia credenziali
                    </button>

                    <button
                      type="button"
                      onClick={logout}
                    >
                      Logout
                    </button>

                    <button
                      className="danger-item"
                      type="button"
                      disabled={deleteAccountLoading}
                      onClick={deleteAccount}
                    >
                      {deleteAccountLoading ? "Eliminazione..." : "Cancella account"}
                    </button>
                  </div>
                )}
              </div>
            </header>

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
                <span>{gallery[galleryIndex]?.title || "Barber studio"}</span>
                <h2>Il tuo stile, prenotato in pochi secondi.</h2>
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

            <section className="quick-info">
              <div>
                <span>Indirizzo</span>
                <strong>Via Roma 25, Palermo</strong>
              </div>
              <div>
                <span>Orari</span>
                <strong>Lun - Sab</strong>
              </div>
            </section>

            <button className="primary-cta" onClick={() => setActivePage("book")}>
              Prenota appuntamento
            </button>

            {isAdmin && (
              <button
                className="primary-cta"
                style={{ background: "#b88746", marginTop: "10px" }}
                onClick={() => {
                  setAdminTab("agenda");
                  setActivePage("admin");
                  loadAdminBookings();
                }}
              >
                Area Barbiere
              </button>
            )}

            <section className="services-preview">
              <div className="section-title">
                <h3>Servizi</h3>
                <span>Cura completa uomo</span>
              </div>

              <div className="home-service-grid">
                {servicesLoading ? (
                  <div className="home-service-card">
                    <span>Caricamento servizi</span>
                    <p>Stiamo recuperando i servizi aggiornati del salone.</p>
                  </div>
                ) : (
                  serviceCategories.map((group) => (
                    <div className="home-service-card" key={group.category}>
                      <span>{group.category}</span>
                      <p>{group.description}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        )}

        {activePage === "book" && (
          <section className="screen">
            <header className="page-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Prenotazione</span>
                <h1>Scegli il servizio</h1>
              </div>
            </header>

            {!session?.user && (
              <div className="lookup-card">
                <div>
                  <span>Accesso richiesto</span>
                  <strong>Accedi per prenotare e ritrovare i tuoi appuntamenti.</strong>
                </div>
                <button className="primary-cta" type="button" onClick={() => setActivePage("account")}>
                  Accedi o registrati
                </button>
              </div>
            )}

            {session?.user && userProfile?.full_name && userProfile?.phone && (
              <div className="profile-mini-card">
                <span>Prenoterai come</span>
                <strong>{userProfile.full_name}</strong>
                <p>{userProfile.phone}</p>
              </div>
            )}

            <form className="booking-form" onSubmit={handleSubmit}>
              {servicesLoading ? (
                <div className="empty-card compact">
                  <strong>Caricamento servizi</strong>
                  <p>Attendi qualche secondo.</p>
                </div>
              ) : (
                <>
                  <div className="folder-grid service-folder-grid">
                    {serviceCategories.map((group) => (
                      <Fragment key={group.category}>
                        <button
                          type="button"
                          className={openCategory === group.category ? "folder-card active" : "folder-card"}
                          onClick={() => toggleCategory(group.category)}
                        >
                          <div className="folder-icon">{group.icon}</div>
                          <strong>{group.category}</strong>
                          <p>{group.services.length} servizi</p>
                        </button>

                        <div
                          className={openCategory === group.category ? "category-panel open" : "category-panel"}
                        >
                          <div className="category-heading">
                            <h2>{group.category}</h2>
                            <p>{group.description}</p>
                          </div>

                          <div className="service-options">
                            {group.services.map((item) => (
                              <button
                                type="button"
                                key={item.id}
                                className={service === item.name ? "service-option selected" : "service-option"}
                                onClick={() => setService(item.name)}
                              >
                                <div className="service-main-row">
                                  <strong>{item.name}</strong>
                                  <span>€{item.price}</span>
                                </div>
                                <p>{item.description}</p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </Fragment>
                    ))}
                  </div>
                </>
              )}

              <label>Giorno</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setTime("");
                }}
                required
              />

              {bookingAvailabilityNotice && (
                <div className={`availability-notice ${bookingAvailabilityNotice.type}`}>
                  <div className="availability-notice-icon">
                    {bookingAvailabilityNotice.type === "closed" ? "!" : "i"}
                  </div>
                  <div>
                    <strong>{bookingAvailabilityNotice.title}</strong>
                    <p>{bookingAvailabilityNotice.text}</p>
                  </div>
                </div>
              )}

              <label>Ora</label>
              <select value={time} onChange={(e) => setTime(e.target.value)} required disabled={!date || loading}>
                <option value="">{date ? "Scegli un orario" : "Prima scegli il giorno"}</option>
                {availableSlots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>

              {(selectedService || date || time) && (
                <div className="booking-summary">
                  <span>Riepilogo appuntamento</span>
                  <div className="summary-row"><p>Servizio</p><strong>{selectedService ? selectedService.name : "Da scegliere"}</strong></div>
                  <div className="summary-row"><p>Prezzo</p><strong>{selectedService ? `€${selectedService.price}` : "-"}</strong></div>
                  <div className="summary-row"><p>Data</p><strong>{date ? formatLongDate(date) : "-"}</strong></div>
                  <div className="summary-row"><p>Ora</p><strong>{time || "-"}</strong></div>
                </div>
              )}

              <button className="primary-cta" type="submit" disabled={loading || !service || servicesLoading}>
                {loading ? "Attendi..." : "Conferma prenotazione"}
              </button>
            </form>
          </section>
        )}

        {activePage === "my-bookings" && (
          <section className="screen">
            <header className="page-header my-bookings-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Area personale</span>
                <h1>Le tue prenotazioni</h1>
              </div>
            </header>

            {!session?.user ? (
              <div className="lookup-card">
                <div>
                  <span>Accesso richiesto</span>
                  <strong>Accedi per vedere solo le tue prenotazioni.</strong>
                </div>
                <button className="primary-cta" type="button" onClick={() => setActivePage("account")}>
                  Accedi o registrati
                </button>
              </div>
            ) : (
              <div className="customer-bookings-list">
                {myBookings.length === 0 ? (
                  <div className="empty-card compact">
                    <strong>Nessuna prenotazione attiva</strong>
                    <p>Quando prenoterai un appuntamento, lo troverai qui.</p>
                  </div>
                ) : (
                  myBookings.map((booking) => (
                    <article className="modern-booking-card user-booking-card" key={booking.id}>
                      <div className="modern-booking-top">
                        <div className="modern-time-pill">
                          <span>Ore</span>
                          <strong>{booking.time}</strong>
                        </div>

                        <div className="modern-date-block">
                          <span>{formatDateHeader(booking.date)}</span>
                          <strong>{formatLongDate(booking.date)}</strong>
                        </div>
                      </div>

                      <div className="modern-booking-body">
                        <span>Appuntamento</span>
                        <h3>{booking.service}</h3>
                        <p>{booking.name}</p>
                      </div>

                      <button className="soft-cancel-btn" onClick={() => deleteBooking(booking.id)}>
                        Cancella prenotazione
                      </button>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        )}

        {activePage === "account" && (
          <section className="screen">
            <header className="page-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Account</span>
                <h1>Area cliente</h1>
              </div>
            </header>

            {session?.user ? (
              <div className="lookup-card">
                <div>
                  <span>Account attivo</span>
                  <strong>{session.user.email}</strong>
                  {userProfile?.full_name && <p>{userProfile.full_name}</p>}
                  {userProfile?.phone && <p>{userProfile.phone}</p>}
                  {isAdmin && <span>Profilo barbiere/admin</span>}
                </div>
                <button className="primary-cta" type="button" onClick={() => setActivePage("my-bookings")}>
                  Vedi le mie prenotazioni
                </button>
                <button className="cancel-btn" type="button" onClick={logout}>
                  Esci
                </button>
              </div>
            ) : (
              <form className="booking-form" onSubmit={handleAuth}>
                <div className="folder-grid">
                  <button
                    type="button"
                    className={authMode === "login" ? "folder-card active" : "folder-card"}
                    onClick={() => setAuthMode("login")}
                    disabled={authLoading}
                  >
                    <div className="folder-icon">↪</div>
                    <strong>Accedi</strong>
                    <p>Hai già un account</p>
                  </button>

                  <button
                    type="button"
                    className={authMode === "register" ? "folder-card active" : "folder-card"}
                    onClick={() => setAuthMode("register")}
                    disabled={authLoading}
                  >
                    <div className="folder-icon">＋</div>
                    <strong>Registrati</strong>
                    <p>Nuovo cliente</p>
                  </button>
                </div>

                {authMode === "register" && (
                  <>
                    <label>Nome e cognome</label>
                    <input
                      type="text"
                      placeholder="Es. Marco Rossi"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      disabled={authLoading}
                      required
                    />

                    <label>Telefono</label>
                    <input
                      type="tel"
                      placeholder="Es. 3331234567"
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      disabled={authLoading}
                      required
                    />
                  </>
                )}

                <label>Email</label>
                <input
                  type="email"
                  placeholder="nome@email.com"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  disabled={authLoading}
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  placeholder="Minimo 6 caratteri"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={authLoading}
                  required
                />
                {authMode === "login" && (
                  <button
                    className="forgot-password-btn"
                    type="button"
                    onClick={resetPassword}
                    disabled={authLoading}
                  >
                    Password dimenticata?
                  </button>
                )}
                <button className="primary-cta" type="submit" disabled={authLoading}>
                  {authLoading
                    ? "Attendi..."
                    : authMode === "login"
                    ? "Accedi"
                    : "Crea account"}
                </button>
              </form>
            )}
          </section>
        )}

        {activePage === "admin" && isAdmin && (
          <section className="screen">
            <header className="page-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Admin</span>
                <h1>Area Barbiere</h1>
              </div>
            </header>

            <div className="admin-intro-card admin-agenda-intro">
              <span>Pannello operativo</span>
              <strong>
                {adminTab === "agenda" && "Agenda appuntamenti"}
                {adminTab === "content" && "Gestione salone"}
                {adminTab === "availability" && "Disponibilità salone"}
              </strong>
              <p>
                {adminTab === "agenda" && "La vista principale del barbiere: controlla la giornata, chiama i clienti e gestisci le prenotazioni."}
                {adminTab === "content" && "Modifica servizi, prezzi, descrizioni e immagini della Home."}
                {adminTab === "availability" && "Chiudi giorni interi, blocca fasce orarie o imposta ricorrenze automatiche."}
              </p>
            </div>

            <div className="folder-grid admin-main-tabs">
              <button
                type="button"
                className={adminTab === "agenda" ? "folder-card active" : "folder-card"}
                onClick={() => {
                  setAdminTab("agenda");
                  loadAdminBookings();
                }}
              >
                <div className="folder-icon">📅</div>
                <strong>Agenda</strong>
                <p>Prenotazioni</p>
              </button>

              <button
                type="button"
                className={adminTab === "content" ? "folder-card active" : "folder-card"}
                onClick={() => setAdminTab("content")}
              >
                <div className="folder-icon">✂️</div>
                <strong>Gestione</strong>
                <p>Servizi e foto</p>
              </button>

              <button
                type="button"
                className={adminTab === "availability" ? "folder-card active" : "folder-card"}
                onClick={() => {
                  setAdminTab("availability");
                  loadAvailabilityBlocks();
                }}
              >
                <div className="folder-icon">🚫</div>
                <strong>Disponibilità</strong>
                <p>Chiusure</p>
              </button>
            </div>

            {adminLoading && (
              <div className="empty-card compact">
                <strong>Caricamento area barbiere</strong>
                <p>Stiamo recuperando i dati aggiornati.</p>
              </div>
            )}

            {!adminLoading && adminTab === "availability" && (
              <div className="admin-panel availability-panel">
                <div className="section-title">
                  <h3>Disponibilità</h3>
                  <span>{availabilityBlocks.length} blocchi attivi</span>
                </div>

                <div className="admin-help-card">
                  <strong>Chiusure e blocchi orari</strong>
                  <p>Puoi bloccare un giorno intero, una fascia oraria specifica o creare una ricorrenza settimanale. Gli slot bloccati spariranno dalla prenotazione cliente.</p>
                </div>

                <form className="manual-booking-form availability-form" onSubmit={createAvailabilityBlock}>
                  <div className="manual-booking-title">
                    <span>Nuova chiusura</span>
                    <strong>Blocca disponibilità</strong>
                    <p>Scegli il tipo di blocco da applicare al calendario del salone.</p>
                  </div>

                  <label>Tipo di blocco</label>
                  <select value={availabilityMode} onChange={(e) => setAvailabilityMode(e.target.value)} disabled={availabilitySaving}>
                    <option value="date_full_day">Giorno specifico - giornata intera</option>
                    <option value="date_range">Giorno specifico - fascia oraria</option>
                    <option value="recurring_full_day">Ricorrenza settimanale - giornata intera</option>
                    <option value="recurring_range">Ricorrenza settimanale - fascia oraria</option>
                  </select>

                  {availabilityMode.startsWith("date") && (
                    <>
                      <label>Giorno</label>
                      <input
                        type="date"
                        value={availabilityDate}
                        onChange={(e) => setAvailabilityDate(e.target.value)}
                        disabled={availabilitySaving}
                        required
                      />
                    </>
                  )}

                  {availabilityMode.startsWith("recurring") && (
                    <>
                      <label>Giorno della settimana</label>
                      <select value={availabilityWeekday} onChange={(e) => setAvailabilityWeekday(e.target.value)} disabled={availabilitySaving}>
                        {weekdays.map((day) => (
                          <option key={day.value} value={day.value}>
                            {day.label}
                          </option>
                        ))}
                      </select>
                    </>
                  )}

                  {availabilityMode.endsWith("range") && (
                    <div className="admin-form-grid">
                      <div>
                        <label>Dalle</label>
                        <select value={availabilityStartTime} onChange={(e) => setAvailabilityStartTime(e.target.value)} disabled={availabilitySaving} required>
                          <option value="">Inizio</option>
                          {slots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label>Alle</label>
                        <select value={availabilityEndTime} onChange={(e) => setAvailabilityEndTime(e.target.value)} disabled={availabilitySaving} required>
                          <option value="">Fine</option>
                          {slots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <label>Motivo visibile solo al barbiere</label>
                  <input
                    type="text"
                    placeholder="Es. ferie, pausa, evento, chiusura straordinaria..."
                    value={availabilityReason}
                    onChange={(e) => setAvailabilityReason(e.target.value)}
                    disabled={availabilitySaving}
                  />

                  <button className="primary-cta" type="submit" disabled={availabilitySaving}>
                    {availabilitySaving ? "Attendi..." : "Salva chiusura"}
                  </button>
                </form>

                <div className="section-title availability-list-title">
                  <h3>Chiusure attive</h3>
                  <span>{sortedAvailabilityBlocks.length}</span>
                </div>

                {sortedAvailabilityBlocks.length === 0 ? (
                  <div className="empty-card compact">
                    <strong>Nessuna chiusura attiva</strong>
                    <p>Quando bloccherai giorni o orari, li vedrai qui.</p>
                  </div>
                ) : (
                  <div className="availability-block-list">
                    {sortedAvailabilityBlocks.map((block) => (
                      <article className="modern-booking-card availability-block-card" key={block.id}>
                        <div className="modern-booking-top">
                          <div className="modern-time-pill">
                            <span>{block.recurring ? "Ogni" : "Tipo"}</span>
                            <strong>{block.recurring ? "↻" : "1x"}</strong>
                          </div>

                          <div className="modern-date-block">
                            <span>{block.recurring ? "Ricorrenza" : "Data"}</span>
                            <strong>{formatAvailabilityBlockTitle(block)}</strong>
                          </div>
                        </div>

                        <div className="modern-booking-body">
                          <span>Blocco</span>
                          <h3>{formatAvailabilityBlockTime(block)}</h3>
                          <p>{block.reason || "Nessun motivo inserito"}</p>
                        </div>

                        <button
                          className="admin-delete-booking-btn"
                          type="button"
                          disabled={availabilityDeletingId === block.id}
                          onClick={() => deleteAvailabilityBlock(block)}
                        >
                          {availabilityDeletingId === block.id ? "Rimozione..." : "Rimuovi chiusura"}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!adminLoading && adminTab === "content" && (
              <div className="admin-panel">
                <div className="admin-segmented">
                  <button type="button" className={adminContentTab === "services" ? "active" : ""} onClick={() => setAdminContentTab("services")}>
                    Servizi e prezzi
                  </button>
                  <button type="button" className={adminContentTab === "photos" ? "active" : ""} onClick={() => setAdminContentTab("photos")}>
                    Foto Home
                  </button>
                </div>

                {adminContentTab === "services" && (
                  <>
                    <div className="section-title">
                      <h3>Servizi e prezzi</h3>
                      <span>{adminServices.length} servizi</span>
                    </div>

                    <div className="admin-help-card">
                      <strong>Come leggere questa sezione</strong>
                      <p>Ogni scheda modifica un servizio. Puoi cambiare nome, prezzo, durata, categoria, descrizione e visibilità. Dopo ogni modifica premi “Salva servizio”.</p>
                    </div>

                    <div className="admin-service-groups">
                      {adminServiceCategories.map((categoryName) => (
                        <section className="admin-category-block" key={categoryName}>
                          <div className="admin-category-title">
                            <span>Categoria</span>
                            <strong>{categoryName}</strong>
                          </div>

                          {groupedAdminServices[categoryName].map((item) => (
                            <article className="admin-edit-card" key={item.id}>
                              <div className="admin-card-head">
                                <div className="admin-card-icon">{item.icon || "✂️"}</div>
                                <div>
                                  <span>{item.active ? "Attivo" : "Non attivo"}</span>
                                  <strong>{item.name || "Servizio senza nome"}</strong>
                                  <p>€{item.price} · {item.duration_minutes} minuti</p>
                                </div>
                              </div>

                              <div className="admin-form-grid">
                                <div>
                                  <label>Categoria</label>
                                  <input type="text" value={item.category || ""} onChange={(e) => updateAdminServiceField(item.id, "category", e.target.value)} />
                                </div>

                                <div>
                                  <label>Icona</label>
                                  <input type="text" value={item.icon || ""} onChange={(e) => updateAdminServiceField(item.id, "icon", e.target.value)} />
                                </div>

                                <div>
                                  <label>Nome servizio</label>
                                  <input type="text" value={item.name || ""} onChange={(e) => updateAdminServiceField(item.id, "name", e.target.value)} />
                                </div>

                                <div>
                                  <label>Prezzo €</label>
                                  <input type="number" value={item.price} onChange={(e) => updateAdminServiceField(item.id, "price", e.target.value)} />
                                </div>

                                <div>
                                  <label>Durata minuti</label>
                                  <input type="number" value={item.duration_minutes} onChange={(e) => updateAdminServiceField(item.id, "duration_minutes", e.target.value)} />
                                </div>

                                <div>
                                  <label>Ordine</label>
                                  <input type="number" value={item.sort_order} onChange={(e) => updateAdminServiceField(item.id, "sort_order", e.target.value)} />
                                </div>
                              </div>

                              <label>Descrizione servizio</label>
                              <input type="text" value={item.description || ""} onChange={(e) => updateAdminServiceField(item.id, "description", e.target.value)} />

                              <label>Descrizione categoria</label>
                              <input type="text" value={item.category_description || ""} onChange={(e) => updateAdminServiceField(item.id, "category_description", e.target.value)} />

                              <label className="admin-toggle-row">
                                <input type="checkbox" checked={item.active} onChange={(e) => updateAdminServiceField(item.id, "active", e.target.checked)} />
                                <span>{item.active ? "Visibile ai clienti" : "Nascosto ai clienti"}</span>
                              </label>

                              <button className="primary-cta" type="button" onClick={() => saveAdminService(item)}>
                                Salva servizio
                              </button>
                            </article>
                          ))}
                        </section>
                      ))}
                    </div>
                  </>
                )}

                {adminContentTab === "photos" && (
                  <>
                    <div className="section-title">
                      <h3>Foto Home</h3>
                      <span>{adminImages.length} immagini</span>
                    </div>

                    <div className="admin-help-card">
                      <strong>Carosello iniziale</strong>
                      <p>Scatta una foto al momento oppure caricala dalla galleria del telefono. L’immagine verrà salvata nello Storage e collegata alla Home.</p>
                    </div>

                    <div className="admin-photo-list">
                      {adminImages.map((item) => (
                        <article className="admin-edit-card" key={item.id}>
                          <div className="admin-photo-preview">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title || "Foto Home"} />
                            ) : (
                              <div>Nessuna immagine</div>
                            )}
                          </div>

                          <div className="admin-upload-actions">
                            <input
                              ref={(element) => {
                                cameraInputRefs.current[item.id] = element;
                              }}
                              type="file"
                              accept="image/*"
                              capture="environment"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                uploadAdminHomeImage(item, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />

                            <input
                              ref={(element) => {
                                galleryInputRefs.current[item.id] = element;
                              }}
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                uploadAdminHomeImage(item, e.target.files?.[0]);
                                e.target.value = "";
                              }}
                            />

                            <button className="secondary-cta" type="button" disabled={uploadingImageId === item.id} onClick={() => cameraInputRefs.current[item.id]?.click()}>
                              Scatta foto
                            </button>

                            <button className="secondary-cta" type="button" disabled={uploadingImageId === item.id} onClick={() => galleryInputRefs.current[item.id]?.click()}>
                              Carica da galleria
                            </button>
                          </div>

                          {uploadingImageId === item.id && (
                            <div className="upload-status">
                              Caricamento foto in corso...
                            </div>
                          )}

                          <div className="admin-form-grid">
                            <div>
                              <label>Titolo foto</label>
                              <input type="text" value={item.title || ""} onChange={(e) => updateAdminImageField(item.id, "title", e.target.value)} />
                            </div>

                            <div>
                              <label>Ordine</label>
                              <input type="number" value={item.sort_order} onChange={(e) => updateAdminImageField(item.id, "sort_order", e.target.value)} />
                            </div>
                          </div>

                          <label>URL immagine</label>
                          <input type="text" value={item.image_url || ""} onChange={(e) => updateAdminImageField(item.id, "image_url", e.target.value)} />

                          <label className="admin-toggle-row">
                            <input type="checkbox" checked={item.active} onChange={(e) => updateAdminImageField(item.id, "active", e.target.checked)} />
                            <span>{item.active ? "Immagine visibile in Home" : "Immagine nascosta"}</span>
                          </label>

                          <button className="primary-cta" type="button" onClick={() => saveAdminImage(item)}>
                            Salva immagine
                          </button>
                        </article>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {!adminLoading && adminTab === "agenda" && (
              <div className="admin-panel">
                <div className="section-title">
                  <h3>Agenda</h3>
                  <span>{filteredAdminBookings.length} prenotazioni</span>
                </div>

                <div className="admin-help-card agenda-help-card">
                  <strong>Vista appuntamenti</strong>
                  <p>Le prenotazioni vecchie vengono eliminate automaticamente. Qui restano solo quelle di oggi e dei prossimi giorni.</p>
                </div>

                <button
                  className="primary-cta manual-booking-toggle"
                  type="button"
                  onClick={() => setShowManualBookingForm((current) => !current)}
                  disabled={manualBookingLoading}
                >
                  {showManualBookingForm ? "Chiudi inserimento rapido" : "Aggiungi prenotazione a nome di cliente"}
                </button>

                {showManualBookingForm && (
                  <form className="manual-booking-form" onSubmit={createManualBooking}>
                    <div className="manual-booking-title">
                      <span>Telefonata / banco</span>
                      <strong>Blocca uno slot in agenda</strong>
                      <p>Inserisci una nota interna o il servizio richiesto dal cliente.</p>
                    </div>

                    <label>Nome cliente</label>
                    <input
                      type="text"
                      placeholder="Es. Marco Rossi"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      disabled={manualBookingLoading}
                      required
                    />

                    <label>Telefono</label>
                    <input
                      type="tel"
                      placeholder="Es. 3331234567"
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                      disabled={manualBookingLoading}
                      required
                    />

                    <label>Servizio o nota</label>

                    <input
                      type="text"
                      placeholder="Es. taglio, barba, sistemazione veloce..."
                      value={manualService}
                      onChange={(e) => setManualService(e.target.value)}
                      disabled={manualBookingLoading}
                    />

                    <div className="admin-form-grid">
                      <div>
                        <label>Giorno</label>
                        <input
                          type="date"
                          value={manualDate}
                          onChange={(e) => {
                            setManualDate(e.target.value);
                            setManualTime("");
                          }}
                          disabled={manualBookingLoading}
                          required
                        />
                      </div>

                      <div>
                        <label>Ora</label>
                        <select value={manualTime} onChange={(e) => setManualTime(e.target.value)} required disabled={!manualDate || manualBookingLoading}>
                          <option value="">{manualDate ? "Scegli" : "Prima giorno"}</option>
                          {manualAvailableSlots.map((slot) => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button className="primary-cta" type="submit" disabled={manualBookingLoading}>
                      {manualBookingLoading ? "Attendi..." : "Aggiungi in agenda"}
                    </button>
                  </form>
                )}

                <div className="admin-filter-row">
                  <button type="button" className={adminAgendaFilter === "all" ? "filter-pill active" : "filter-pill"} onClick={() => setAdminAgendaFilter("all")}>
                    Tutte
                  </button>

                  <button type="button" className={adminAgendaFilter === "today" ? "filter-pill active" : "filter-pill"} onClick={() => setAdminAgendaFilter("today")}>
                    Oggi
                  </button>

                  <button type="button" className={adminAgendaFilter === "upcoming" ? "filter-pill active" : "filter-pill"} onClick={() => setAdminAgendaFilter("upcoming")}>
                    Prossime
                  </button>
                </div>

                <button className="primary-cta refresh-agenda-btn" type="button" onClick={loadAdminBookings}>
                  Aggiorna agenda
                </button>

                {filteredAdminBookings.length === 0 ? (
                  <div className="empty-card compact">
                    <strong>Nessuna prenotazione</strong>
                    <p>Quando arriveranno appuntamenti, li vedrai qui.</p>
                  </div>
                ) : (
                  <div className="admin-agenda-groups">
                    {adminBookingDays.map((day) => (
                      <section className="admin-day-block modern-day-block" key={day}>
                        <div className="modern-day-header">
                          <div>
                            <span>{formatCompactDate(day)}</span>
                            <strong>{formatDateHeader(day)}</strong>
                          </div>
                          <p>{groupedAdminBookings[day].length} appuntamenti</p>
                        </div>

                        <div className="customer-bookings-list">
                          {groupedAdminBookings[day].map((booking) => (
                            <article className="modern-booking-card admin-booking-card" key={booking.id}>
                              <div className="modern-booking-top">
                                <div className="modern-time-pill">
                                  <span>Ore</span>
                                  <strong>{booking.time}</strong>
                                </div>

                                <div className="modern-date-block">
                                  <span>Cliente</span>
                                  <strong>{booking.name}</strong>
                                </div>
                              </div>

                              <div className="modern-booking-body">
                                <span>Servizio</span>
                                <h3>{booking.service || "Prenotazione telefonica"}</h3>
                                <a className="phone-link" href={`tel:${booking.phone}`}>
                                  {booking.phone}
                                </a>
                              </div>

                              <button className="admin-delete-booking-btn" type="button" onClick={() => setAdminBookingToDelete(booking)}>
                                Elimina prenotazione
                              </button>
                            </article>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {activePage === "info" && (
          <section className="screen">
            <header className="page-header">
              <button className="back-btn" onClick={() => setActivePage("home")}>
                ←
              </button>
              <div>
                <span className="eyebrow">Salone</span>
                <h1>Informazioni</h1>
              </div>
            </header>

            <div className="salon-hero-card">
              <div className="salon-mark">B</div>
              <div>
                <span>Barber studio</span>
                <h2>Barber Booking</h2>
                <p>Tagli, barba e trattamenti uomo in un ambiente curato, moderno e su appuntamento.</p>
              </div>
            </div>

            <div className="info-mosaic">
              <div className="mosaic-card wide">
                <span>📍</span>
                <div>
                  <strong>Via Roma 25</strong>
                  <p>Palermo</p>
                </div>
              </div>

              <div className="mosaic-card">
                <span>🕘</span>
                <strong>Lun - Sab</strong>
                <p>09:00 - 18:30</p>
              </div>

              <div className="mosaic-card">
                <span>✂️</span>
                <strong>4 aree</strong>
                <p>Taglio, barba, estetica, tecnico</p>
              </div>

              <div className="mosaic-card wide dark">
                <span>📞</span>
                <div>
                  <strong>333 123 4567</strong>
                  <p>Contatto diretto del salone</p>
                </div>
              </div>
            </div>

            <div className="info-service-strip">
              {serviceCategories.map((group) => (
                <div key={group.category}>
                  <span>{group.icon}</span>
                  <strong>{group.category}</strong>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {showJoinShopPopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <span className="popup-eyebrow">Account riconosciuto</span>
            <h3>Vuoi usare questo account anche per questo salone?</h3>
            <p>
              Hai già utilizzato un’app sviluppata da Powered by (nome temporaneo).
              Puoi usare le stesse credenziali anche qui.
            </p>
            <small>
              Le prenotazioni e i dati del salone resteranno separati. Questo salone potrà vedere solo gli appuntamenti effettuati qui.
            </small>

            <div className="popup-actions">
              <button className="primary-cta" type="button" disabled={joinShopLoading} onClick={confirmJoinShop}>
                {joinShopLoading ? "Collegamento..." : "Usa questo account"}
              </button>
              <button className="secondary-cta" type="button" disabled={joinShopLoading} onClick={cancelJoinShop}>
                Esci
              </button>
            </div>
          </div>
        </div>
      )}

      {adminBookingToDelete && (
        <div className="modal-overlay" onClick={() => setAdminBookingToDelete(null)}>
          <div className="modal-card confirm-delete-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="popup-eyebrow">Conferma eliminazione</span>
                <h2>Vuoi eliminare questa prenotazione?</h2>
              </div>

              <button className="close-modal" type="button" onClick={() => setAdminBookingToDelete(null)}>
                ×
              </button>
            </div>

            <div className="delete-booking-preview">
              <strong>{adminBookingToDelete.name}</strong>
              <p>{adminBookingToDelete.service || "Prenotazione telefonica"}</p>
              <span>{formatLongDate(adminBookingToDelete.date)} alle {adminBookingToDelete.time}</span>
            </div>

            <p className="delete-warning-text">
              Questa operazione non può essere annullata. La prenotazione verrà rimossa dall’agenda e l’orario tornerà disponibile.
            </p>

            <div className="confirm-delete-actions">
              <button className="secondary-cta" type="button" disabled={adminDeleteLoading} onClick={() => setAdminBookingToDelete(null)}>
                Annulla
              </button>

              <button className="danger-cta" type="button" disabled={adminDeleteLoading} onClick={confirmDeleteAdminBooking}>
                {adminDeleteLoading ? "Eliminazione..." : "Elimina prenotazione"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="modal-card privacy-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="popup-eyebrow">Powered by (nome temporaneo)</span>
                <h2>Privacy & Account</h2>
              </div>

              <button className="close-modal" type="button" onClick={() => setShowPrivacyModal(false)}>
                ×
              </button>
            </div>

            <div className="privacy-content">
              <section>
                <h3>Dati raccolti</h3>
                <p>
                  Durante l’utilizzo dell’app possono essere raccolti nome, email, numero di telefono,
                  prenotazioni effettuate e dati tecnici necessari al funzionamento dell’account e delle sessioni.
                </p>
              </section>

              <section>
                <h3>Finalità</h3>
                <p>
                  I dati vengono utilizzati per gestire prenotazioni, autenticazione, accesso all’area cliente,
                  comunicazioni operative legate agli appuntamenti e funzionamento tecnico dell’applicazione.
                </p>
              </section>

              <section>
                <h3>Accesso condiviso tra applicazioni</h3>
                <p>
                  L’account utilizzato per accedere può essere riconosciuto anche da altre applicazioni sviluppate
                  dalla stessa piattaforma Powered by (nome temporaneo). Questo rende più semplice usare le stesse
                  credenziali su più saloni aderenti.
                </p>
              </section>

              <section>
                <h3>Separazione dei dati tra saloni</h3>
                <p>
                  Anche se l’accesso account può essere condiviso, i dati operativi restano separati per ogni salone.
                  Prenotazioni, servizi, immagini e dati amministrativi di un salone non sono visibili agli altri saloni.
                </p>
              </section>

              <section>
                <h3>Logout</h3>
                <p>
                  Il logout disconnette semplicemente l’utente dall’app corrente. Non elimina account, prenotazioni
                  o dati associati.
                </p>
              </section>

              <section>
                <h3>Cancellazione account</h3>
                <p>
                  La cancellazione account elimina definitivamente profilo, prenotazioni, collegamenti ai saloni
                  e dati associati. La cancellazione viene applicata a tutte le applicazioni collegate alla piattaforma
                  Powered by (nome temporaneo) e non può essere annullata.
                </p>
              </section>

              <section>
                <h3>Sicurezza</h3>
                <p>
                  L’app utilizza sistemi di autenticazione, database e archiviazione cloud professionali. L’accesso
                  ai dati amministrativi è limitato agli account autorizzati del relativo salone.
                </p>
              </section>

              <section>
                <h3>Cookie e dati tecnici</h3>
                <p>
                  L’app può utilizzare dati tecnici necessari al funzionamento dell’autenticazione e delle sessioni.
                  I dati personali non vengono venduti a terze parti.
                </p>
              </section>

              <section>
                <h3>Contatti</h3>
                <p>
                  Per richieste relative ai dati personali, all’accesso, alla modifica o alla cancellazione account,
                  è possibile contattare il gestore della piattaforma.
                </p>
              </section>
            </div>
          </div>
        </div>
      )}

      {showCredentialsModal && (
        <div className="modal-overlay" onClick={() => setShowCredentialsModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <span className="popup-eyebrow">Account</span>
                <h2>Cambia credenziali</h2>
              </div>

              <button className="close-modal" type="button" onClick={() => setShowCredentialsModal(false)}>
                ×
              </button>
            </div>

            {!session?.user ? (
              <div className="empty-card compact">
                <strong>Accesso richiesto</strong>
                <p>Per modificare le credenziali devi prima accedere.</p>
              </div>
            ) : (
              <form className="credentials-form" onSubmit={updateCredentials}>
                <label>Nome e cognome</label>
                <input type="text" value={newFullName} onChange={(e) => setNewFullName(e.target.value)} />

                <label>Telefono</label>
                <input type="tel" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />

                <label>Nuova email</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />

                <label>Nuova password</label>
                <input type="password" placeholder="Lascia vuoto per non cambiarla" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />

                <button className="primary-cta" type="submit" disabled={credentialsLoading}>
                  {credentialsLoading ? "Aggiornamento..." : "Salva credenziali"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <nav className="bottom-nav four-items">
        <button
          className={activePage === "home" ? "active" : ""}
          onClick={() => {
            setShowProfileMenu(false);
            setActivePage("home");
          }}
        >
          <span>⌂</span> Home
        </button>

        <button
          className={activePage === "book" ? "active" : ""}
          onClick={() => {
            setShowProfileMenu(false);
            setActivePage("book");
          }}
        >
          <span>＋</span> Prenota
        </button>

        <button
          className={activePage === "my-bookings" ? "active" : ""}
          onClick={() => {
            setShowProfileMenu(false);
            setActivePage("my-bookings");
          }}
        >
          <span>◷</span> Prenotazioni
        </button>

        <button
          className={activePage === "info" ? "active" : ""}
          onClick={() => {
            setShowProfileMenu(false);
            setActivePage("info");
          }}
        >
          <span>i</span> Salone
        </button>
      </nav>
    </div>
  );
}

export default App;