import { describe, it, expect, vi, beforeEach } from 'vitest';
const db = require('../../../config/db');
const ProdukModel = require('../../../models/produkModel');

describe('ProdukModel', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('getAll memetakan kolom database ke format camelCase aplikasi', async () => {
    vi.spyOn(db, 'query')
      .mockResolvedValueOnce({
        rows: [{ id: 1, jenis: 'Kue Tart (16cm)', harga_dasar: 150000, waktu_normal: '3 Hari' }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, parameter: 'Rush Order', keterangan: 'Kilat', range_harga: '+ Rp 50.000' }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, pelanggan: 'Salsa', status: 'Menunggu DP' }]
      });

    const result = await ProdukModel.getAll();

    expect(result.katalogDasar[0].hargaDasar).toBe(150000);
    expect(result.katalogDasar[0].waktuNormal).toBe('3 Hari');
    expect(result.biayaTambahan[0].ket).toBe('Kilat');
    expect(result.biayaTambahan[0].range).toBe('+ Rp 50.000');
    expect(result.rekapPesanan).toHaveLength(1);
  });

  it('createPesanan menyimpan pesanan baru dan mengembalikan baris hasil insert', async () => {
    const payload = {
      pelanggan: 'Budi',
      kontak: '08123456789',
      rincian: 'Brownies Panggang',
      deadline: '10/12/2026',
      estimasi: 60000
    };
    vi.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: 5, ...payload }] });

    const created = await ProdukModel.createPesanan(payload);
    expect(created.id).toBe(5);
    expect(created.pelanggan).toBe('Budi');
  });

  it('findPesanan mencari berdasarkan ID, kontak, pelanggan, atau mengembalikan array kosong', async () => {
    const querySpy = vi.spyOn(db, 'query');

    // Cari by ID
    querySpy.mockResolvedValueOnce({ rows: [{ id: 1, pelanggan: 'Salsa' }] });
    const byId = await ProdukModel.findPesanan({ id: '#1' });
    expect(byId[0].pelanggan).toBe('Salsa');

    // Cari by kontak
    querySpy.mockResolvedValueOnce({ rows: [{ id: 2, kontak: '08123456789' }] });
    const byKontak = await ProdukModel.findPesanan({ kontak: '628123456789' });
    expect(byKontak[0].id).toBe(2);

    // Cari by nama pelanggan
    querySpy.mockResolvedValueOnce({ rows: [{ id: 3, pelanggan: 'Rina' }] });
    const byNama = await ProdukModel.findPesanan({ pelanggan: 'Rina' });
    expect(byNama[0].id).toBe(3);

    // Input kosong -> []
    const empty = await ProdukModel.findPesanan({});
    expect(empty).toEqual([]);
  });

  it('updatePesanan, deletePesanan, clearAllPesanan, dan insertDummyPesanan berjalan normal', async () => {
    vi.spyOn(db, 'query')
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'Selesai' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});

    const updated = await ProdukModel.updatePesanan(1, { status: 'Selesai' });
    expect(updated.status).toBe('Selesai');

    const deleted = await ProdukModel.deletePesanan(1);
    expect(deleted.id).toBe(1);

    expect(await ProdukModel.clearAllPesanan()).toBe(true);
    expect(await ProdukModel.insertDummyPesanan()).toBe(true);
  });
});