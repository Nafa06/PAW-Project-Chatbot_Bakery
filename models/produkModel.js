const db = require('../config/db');

const ProdukModel = {
  async getAll() {
    const katalog = await db.query('SELECT * FROM katalog_dasar ORDER BY id ASC');
    const biaya = await db.query('SELECT * FROM biaya_tambahan ORDER BY id ASC');
    const rekap = await db.query('SELECT * FROM rekap_pesanan ORDER BY id DESC');

    return {
      katalogDasar: katalog.rows.map(r => ({ ...r, hargaDasar: r.harga_dasar, waktuNormal: r.waktu_normal })),
      biayaTambahan: biaya.rows.map(r => ({ ...r, range: r.range_harga, ket: r.keterangan })),
      rekapPesanan: rekap.rows
    };
  },

  async createPesanan(data) {
    const { pelanggan, kontak, rincian, deadline, estimasi } = data;
    const query = `
      INSERT INTO rekap_pesanan (pelanggan, kontak, rincian, deadline, estimasi)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const res = await db.query(query, [pelanggan, kontak, rincian, deadline, estimasi]);
    return res.rows[0];
  },

  async updatePesanan(id, data) {
    const { rincian, estimasi, status } = data;
    const query = `
      UPDATE rekap_pesanan 
      SET rincian = COALESCE($1, rincian),
          estimasi = COALESCE($2, estimasi),
          status = COALESCE($3, status)
      WHERE id = $4 
      RETURNING *
    `;
    const res = await db.query(query, [rincian, estimasi, status, id]);
    return res.rows[0];
  },

  async deletePesanan(id) {
    const query = 'DELETE FROM rekap_pesanan WHERE id = $1 RETURNING *';
    const res = await db.query(query, [id]);
    return res.rows[0];
  },

  async clearAllPesanan() {
    const query = 'TRUNCATE TABLE rekap_pesanan RESTART IDENTITY';
    await db.query(query);
    return true;
  },

  async insertDummyPesanan() {
    const query = `
      INSERT INTO rekap_pesanan (pelanggan, kontak, rincian, deadline, estimasi, status) VALUES
      ('Salsa', '08453763578', 'Kue Tart 16cm Tema Bunga', '15/11/2026', 170000, 'Menunggu DP'),
      ('Bima', '08125689879', 'Brownies Extra Coklat (Rush)', '10/11/2026', 110000, 'Selesai'),
      ('Rina', '08974532278', 'Kue Tart 20cm Karakter Korea', '20/11/2026', 225000, 'Proses Dapur')
    `;
    await db.query(query);
    return true;
  }
};

module.exports = ProdukModel;