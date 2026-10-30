const dataBakery = {
  katalogDasar: [
    { id: 1, jenis: 'Kue Tart (16cm)', hargaDasar: 150000, waktuNormal: '3 Hari' },
    { id: 2, jenis: 'Kue Tart (20cm)', hargaDasar: 200000, waktuNormal: '3 Hari' },
    { id: 3, jenis: 'Brownies Panggang', hargaDasar: 60000, waktuNormal: '2 Hari' }
  ],
  biayaTambahan: [
    { id: 1, parameter: 'Desain / Detailing', range: 'Rp 20.000 - Rp 100.000', ket: 'Tergantung kerumitan bentuk & warna' },
    { id: 2, parameter: 'Rush Order (< 24 Jam)', range: '+ Rp 50.000', ket: 'Biaya prioritas pesanan kilat' },
    { id: 3, parameter: 'Custom Topping', range: 'Rp 15.000 - Rp 40.000', ket: 'Macaron, coklat praline, buah segar' }
  ],
  rekapPesanan: [
    { id: 1, pelanggan: 'Kak Nisa', kontak: 'WA: +62 812-xxxx', rincian: 'Kue Tart 20cm, Tema Bunga, Teks: "HBD Salsa"', deadline: '02 Nov 2026', estimasi: 270000, status: 'Menunggu DP' },
    { id: 2, pelanggan: 'Mas Bima', kontak: 'WA: +62 856-xxxx', rincian: 'Brownies, Extra Coklat (Rush Order)', deadline: '31 Okt 2026', estimasi: 125000, status: 'Proses Dapur' }
  ]
};

const ProdukModel = {
  getAll() {
    return dataBakery;
  }
};

module.exports = ProdukModel;