const state = {
  manualFullOrder: false,   // Dikunci Admin (bot tidak bisa menonaktifkan)
  autoFullOrder: false,     // Diaktifkan otomatis bot jika kuota mingguan/antrean penuh
  maxPesananPerMinggu: 10,  // Batas maksimal pesanan per minggu
  estimasiBukaOrder: '',    // Estimasi tanggal bisa pesan lagi
  jamBuka: 9,               // 09:00 WIB
  jamTutup: 21,             // 21:00 WIB
  adminManualOffline: false // Simulasi luar jam operasional / admin offline manual
};

const activeTakeovers = new Map();
const TAKEOVER_TIMEOUT_MS = 30 * 60 * 1000;

const getWibNow = () => {
  const wibStr = new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  return new Date(wibStr);
};

const isOutsideOperatingHours = () => {
  const hour = getWibNow().getHours();
  return hour < state.jamBuka || hour >= state.jamTutup;
};

const isAdminOffline = () => {
  return isOutsideOperatingHours() || state.adminManualOffline;
};

const getState = () => {
  const realOutsideHours = isOutsideOperatingHours();
  const adminOffline = isAdminOffline();
  const isFullOrder = state.manualFullOrder || state.autoFullOrder;

  let sumberFullOrder = 'OPEN';
  if (state.manualFullOrder) sumberFullOrder = 'ADMIN_LOCK';
  else if (state.autoFullOrder) sumberFullOrder = 'AUTO_WEEKLY_LIMIT';

  return {
    isFullOrder,
    manualFullOrder: state.manualFullOrder,
    autoFullOrder: state.autoFullOrder,
    sumberFullOrder,
    maxPesananPerMinggu: state.maxPesananPerMinggu,
    estimasiBukaOrder: state.estimasiBukaOrder,
    isRealOutsideHours: realOutsideHours,
    isOutsideHours: adminOffline,
    isAdminOffline: adminOffline,
    adminManualOffline: state.adminManualOffline,
    jamOperasionalText: '09:00 - 21:00 WIB'
  };
};

// Dipanggil Admin dari Dashboard Web
const setAdminToggle = ({
  isFullOrder,
  forceManual,
  adminManualOffline,
  maxPesananPerMinggu,
  estimasiBukaOrder
}) => {
  const wasFull = state.manualFullOrder || state.autoFullOrder;

  if (typeof isFullOrder === 'boolean') {
    if (isFullOrder) {
      // Kunci manual hanya jika sebelumnya memang OPEN, atau admin memaksa lock manual
      if (!wasFull || forceManual === true) {
        state.manualFullOrder = true;
      }
    } else {
      state.manualFullOrder = false;
      state.autoFullOrder = false;
      state.estimasiBukaOrder = '';
    }
  }

  if (typeof adminManualOffline === 'boolean') {
    state.adminManualOffline = adminManualOffline;
  }

  if (maxPesananPerMinggu !== undefined && Number(maxPesananPerMinggu) > 0) {
    state.maxPesananPerMinggu = parseInt(maxPesananPerMinggu, 10);
  }

  if (estimasiBukaOrder !== undefined) {
    state.estimasiBukaOrder = String(estimasiBukaOrder || '').trim();
  }

  return getState();
};

// Dipanggil Bot/Sistem berdasarkan hitungan kuota
const setBotAutoFullOrder = (shouldBeFull, estimasiTanggal = '') => {
  if (state.manualFullOrder && !shouldBeFull) {
    return getState();
  }

  state.autoFullOrder = Boolean(shouldBeFull);
  if (shouldBeFull && estimasiTanggal && !state.estimasiBukaOrder) {
    state.estimasiBukaOrder = estimasiTanggal;
  } else if (!shouldBeFull && !state.manualFullOrder) {
    state.estimasiBukaOrder = '';
  }

  return getState();
};

// --- Manajemen Takeover Admin (Siap untuk WA & Web) ---
const markAdminTakeover = (sessionId) => {
  if (!sessionId) return;
  activeTakeovers.set(sessionId, Date.now());
};

const releaseAdminTakeover = (sessionId) => {
  if (!sessionId) return;
  activeTakeovers.delete(sessionId);
};

const isBotPausedForSession = (sessionId) => {
  if (!sessionId || !activeTakeovers.has(sessionId)) return false;

  if (isAdminOffline()) {
    return false;
  }

  const lastReply = activeTakeovers.get(sessionId);
  if (Date.now() - lastReply > TAKEOVER_TIMEOUT_MS) {
    activeTakeovers.delete(sessionId);
    return false;
  }

  return true;
};

module.exports = {
  getWibNow,
  getState,
  setAdminToggle,
  setBotAutoFullOrder,
  markAdminTakeover,
  releaseAdminTakeover,
  isBotPausedForSession
};