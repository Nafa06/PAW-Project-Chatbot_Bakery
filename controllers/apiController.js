const ProdukModel = require('../models/produkModel');
const config = require('../config');

exports.status = (req, res) => {
  res.json({
    status: 'ok',
    aplikasi: config.appName,
    uptimeDetik: Math.round(process.uptime()),
    waktuServer: new Date().toISOString(),
  });
};

exports.getAll = async (req, res) => {
  try {
    const data = await ProdukModel.getAll();
    res.json({ sukses: true, data });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: err.message });
  }
};

exports.createPesanan = async (req, res) => {
  try {
    const { pelanggan, kontak, rincian, deadline, estimasiManual } = req.body;

    if (!pelanggan || !kontak || !rincian || !deadline) {
      return res.status(400).json({ sukses: false, pesan: 'Semua kolom bertanda * wajib diisi!' });
    }

    const regexKontak = /^\+?[0-9]{8,15}$/;
    if (!regexKontak.test(kontak.trim())) {
      return res.status(400).json({ sukses: false, pesan: 'Nomor kontak WA tidak valid! Harus berupa angka (8-15 digit).' });
    }

    const regexNama = /^[a-zA-Z\s'.]{2,50}$/;
    if (!regexNama.test(pelanggan.trim())) {
      return res.status(400).json({ sukses: false, pesan: 'Nama pelanggan hanya boleh berisi huruf dan spasi!' });
    }

    const regexTanggal = /^(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}|\d{2}\s[A-Za-z]{3}\s\d{4})$/;
    if (!regexTanggal.test(deadline.trim())) {
      return res.status(400).json({ sukses: false, pesan: 'Format tanggal/deadline tidak valid!' });
    }

    let estimasi = parseInt(estimasiManual, 10);

    if (isNaN(estimasi) || estimasi === null || estimasi === undefined || estimasi === 0) {
      estimasi = 0;
      const rincianLower = (rincian || '').toLowerCase();

      if (rincianLower.includes('20cm')) estimasi += 200000;
      else if (rincianLower.includes('16cm')) estimasi += 150000;
      else if (rincianLower.includes('brownies')) estimasi += 60000;
      else estimasi += 100000;

      let deadlineDate;
      if (deadline.includes('/')) {
        const [day, month, year] = deadline.split('/');
        deadlineDate = new Date(`${year}-${month}-${day}`);
      } else {
        deadlineDate = new Date(deadline);
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const selisihWaktu = deadlineDate.getTime() - today.getTime();
      const selisihHari = Math.ceil(selisihWaktu / (1000 * 60 * 60 * 24));

      if (selisihHari <= 2) {
        estimasi += 50000;
      }

      const keywordsDesain = ['bunga', 'karakter', 'gradasi', 'tema', 'gambar', 'lukis', 'fondant', 'custom', 'detail', 'tulisan', 'tingkat', 'korea'];
      const keywordsTopping = ['buah', 'macaron', 'praline', 'keju', 'oreo', 'chocochip', 'coklat', 'topper', 'krim', 'almond', 'strawberry', 'cherry'];

      if (keywordsDesain.some(kata => rincianLower.includes(kata))) estimasi += 25000;
      if (keywordsTopping.some(kata => rincianLower.includes(kata))) estimasi += 15000;
    }

    estimasi = Math.max(0, Number(estimasi) || 0);

    const pesananBaru = await ProdukModel.createPesanan({
      pelanggan: pelanggan.trim(),
      kontak: kontak.trim(),
      rincian,
      deadline: deadline.trim(),
      estimasi
    });

    res.status(201).json({ sukses: true, data: pesananBaru });
  } catch (err) {
    console.error("Error SQL Insert:", err);
    res.status(500).json({ sukses: false, pesan: err.message });
  }
};

exports.updatePesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const { rincian, estimasi, status } = req.body;

    const parsedEstimasi = estimasi !== undefined && estimasi !== null ? parseInt(estimasi, 10) : undefined;
    const finalEstimasi = isNaN(parsedEstimasi) ? undefined : Math.max(0, parsedEstimasi);

    const updated = await ProdukModel.updatePesanan(id, {
      rincian,
      estimasi: finalEstimasi,
      status
    });

    if (!updated) return res.status(404).json({ sukses: false, pesan: 'Pesanan tidak ditemukan' });
    res.json({ sukses: true, data: updated });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: err.message });
  }
};

exports.deletePesanan = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ProdukModel.deletePesanan(id);
    if (!deleted) return res.status(404).json({ sukses: false, pesan: 'Pesanan tidak ditemukan' });
    res.json({ sukses: true, data: deleted });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: err.message });
  }
};

exports.clearAll = async (req, res) => {
  try {
    await ProdukModel.clearAllPesanan();
    res.json({ sukses: true, pesan: 'Semua data pesanan berhasil dibersihkan!' });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: err.message });
  }
};

exports.insertDummy = async (req, res) => {
  try {
    await ProdukModel.insertDummyPesanan();
    res.json({ sukses: true, pesan: 'Data dummy berhasil ditambahkan!' });
  } catch (err) {
    res.status(500).json({ sukses: false, pesan: err.message });
  }
};