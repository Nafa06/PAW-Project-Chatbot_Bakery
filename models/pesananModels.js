const formatTanggalIndo = (dateObj) => {
  return dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta'
  });
};

const parseTanggalAmbil = (val) => {
  if (!val) return null;
  if (val instanceof Date) return val;
  const match = String(val).match(/(\d{4}-\d{2}-\d{2})/);
  return match ? new Date(`${match[1]}T00:00:00+07:00`) : null;
};

const getWeekRange = (dateObj) => {
  const d = new Date(dateObj);
  const day = d.getDay(); // 0 = Minggu, 1 = Senin
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

// Tambahkan method ini ke object export pesananModel kamu:
const cekKapasitasDanBentrok = async (tanggalTargetStr, maxPerMinggu = 10) => {
  const result = await pool.query('SELECT * FROM rekap_pesanan');
  const allOrders = result.rows || [];

  const nowWib = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const todayStart = new Date(nowWib.getFullYear(), nowWib.getMonth(), nowWib.getDate());

  const targetDate = parseTanggalAmbil(tanggalTargetStr) || todayStart;
  const targetStr = targetDate.toISOString().slice(0, 10);

  // 1. Hitung jumlah pesanan pada minggu yang sama dengan tanggal target
  const { monday, sunday } = getWeekRange(targetDate);
  const pesananMingguIni = allOrders.filter((row) => {
    const tgl = parseTanggalAmbil(row.tanggal_ambil);
    return tgl && tgl >= monday && tgl <= sunday;
  });

  const kuotaMingguanPenuh = pesananMingguIni.length >= maxPerMinggu;

  // 2. Cek bentrok di hari yang sama dengan waktu pengerjaan singkat (H-0 atau H-1)
  const pesananTanggalSama = allOrders.filter((row) => {
    const tgl = parseTanggalAmbil(row.tanggal_ambil);
    return tgl && tgl.toISOString().slice(0, 10) === targetStr;
  });

  const selisihHari = Math.floor((targetDate - todayStart) / (1000 * 60 * 60 * 24));
  const waktuSingkat = selisihHari <= 1; // Pemesanan untuk hari ini (H-0) atau besok (H-1)
  const bentrokDeadlineSingkat = pesananTanggalSama.length > 0 && waktuSingkat;

  // 3. Hitung estimasi tanggal terdekat yang bisa dipesan lagi
  let kandidat = new Date(kuotaMingguanPenuh ? sunday : targetDate);
  kandidat.setDate(kandidat.getDate() + 1);

  for (let i = 0; i < 30; i++) {
    const kStr = kandidat.toISOString().slice(0, 10);
    const { monday: kMon, sunday: kSun } = getWeekRange(kandidat);
    const countWeek = allOrders.filter((r) => {
      const t = parseTanggalAmbil(r.tanggal_ambil);
      return t && t >= kMon && t <= kSun;
    }).length;

    const countSameDay = allOrders.filter((r) => {
      const t = parseTanggalAmbil(r.tanggal_ambil);
      return t && t.toISOString().slice(0, 10) === kStr;
    }).length;

    if (countWeek < maxPerMinggu && countSameDay === 0) {
      break;
    }
    kandidat.setDate(kandidat.getDate() + 1);
  }

  return {
    jumlahPesananMingguIni: pesananMingguIni.length,
    maxPerMinggu,
    kuotaMingguanPenuh,
    bentrokDeadlineSingkat,
    jumlahPesananTanggalSama: pesananTanggalSama.length,
    selisihHari,
    estimasiBukaKembali: formatTanggalIndo(kandidat)
  };
};