const mockDatabaseData = {
  katalogDasar: [
    { id: 1, jenis: 'Kue Tart (16cm)', hargaDasar: 150000, waktuNormal: '3 Hari' },
    { id: 2, jenis: 'Kue Tart (20cm)', hargaDasar: 200000, waktuNormal: '3 Hari' },
    { id: 3, jenis: 'Brownies Panggang', hargaDasar: 60000, waktuNormal: '2 Hari' }
  ],
  biayaTambahan: [
    { id: 1, parameter: 'Rush Order (< 2 Hari)', ket: 'Pengerjaan kilat', range: '+ Rp 50.000' },
    { id: 2, parameter: 'Desain Custom', ket: 'Bunga/karakter/tema', range: '+ Rp 25.000' }
  ],
  rekapPesanan: [
    {
      id: 1,
      pelanggan: 'Salsa',
      kontak: '08453763578',
      rincian: 'Kue Tart 16cm Tema Bunga',
      deadline: '28/11/2026',
      estimasi: 175000,
      status: 'Menunggu DP'
    }
  ]
};

const validPesananPayload = {
  pelanggan: 'Budi Santoso',
  kontak: '081234567890',
  rincian: 'Kue Tart 16cm tema bunga dengan topping buah',
  deadline: '25/12/2030'
};

module.exports = {
  mockDatabaseData,
  validPesananPayload
};