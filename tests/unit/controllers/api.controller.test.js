import { describe, it, expect, vi, beforeEach } from 'vitest';
const ProdukModel = require('../../../models/produkModel');
const apiController = require('../../../controllers/apiController');
const { mockDatabaseData, validPesananPayload } = require('../../fixtures/bakeryData');

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };
}

describe('apiController', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('status mengembalikan informasi server ok', () => {
    const res = createRes();
    apiController.status({}, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ok' })
    );
  });

  it('getAll mengembalikan seluruh data katalog dan pesanan', async () => {
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);
    const res = createRes();

    await apiController.getAll({}, res);

    expect(res.json).toHaveBeenCalledWith({
      sukses: true,
      data: mockDatabaseData
    });
  });

  it('createPesanan menolak input jika field wajib kosong', async () => {
    const res = createRes();
    await apiController.createPesanan({ body: { pelanggan: 'Budi' } }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].sukses).toBe(false);
  });

  it('createPesanan menolak nomor WA yang tidak valid', async () => {
    const res = createRes();
    await apiController.createPesanan(
      { body: { ...validPesananPayload, kontak: 'abc123' } },
      res
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json.mock.calls[0][0].pesan).toContain('Nomor kontak WA tidak valid');
  });

  it('createPesanan menghitung estimasi otomatis (16cm 150rb + bunga 25rb + buah 15rb = 190rb)', async () => {
    const createSpy = vi.spyOn(ProdukModel, 'createPesanan').mockImplementation(async (payload) => ({
      id: 10,
      ...payload,
      status: 'Menunggu DP'
    }));
    const res = createRes();

    await apiController.createPesanan({ body: validPesananPayload }, res);

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pelanggan: 'Budi Santoso',
        estimasi: 190000
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json.mock.calls[0][0].sukses).toBe(true);
  });

  it('updatePesanan mengembalikan 404 jika ID tidak ditemukan dan 200 jika berhasil', async () => {
    vi.spyOn(ProdukModel, 'updatePesanan').mockResolvedValueOnce(null);
    const resNotFound = createRes();
    await apiController.updatePesanan({ params: { id: '999' }, body: { status: 'Selesai' } }, resNotFound);
    expect(resNotFound.status).toHaveBeenCalledWith(404);

    vi.spyOn(ProdukModel, 'updatePesanan').mockResolvedValueOnce({ id: 1, status: 'Selesai' });
    const resOk = createRes();
    await apiController.updatePesanan({ params: { id: '1' }, body: { status: 'Selesai' } }, resOk);
    expect(resOk.json).toHaveBeenCalledWith({
      sukses: true,
      data: { id: 1, status: 'Selesai' }
    });
  });

  it('deletePesanan, clearAll, dan insertDummy berjalan sesuai ekspektasi', async () => {
    vi.spyOn(ProdukModel, 'deletePesanan').mockResolvedValue({ id: 1 });
    vi.spyOn(ProdukModel, 'clearAllPesanan').mockResolvedValue(true);
    vi.spyOn(ProdukModel, 'insertDummyPesanan').mockResolvedValue(true);

    const resDel = createRes();
    await apiController.deletePesanan({ params: { id: '1' } }, resDel);
    expect(resDel.json.mock.calls[0][0].sukses).toBe(true);

    const resClear = createRes();
    await apiController.clearAll({}, resClear);
    expect(resClear.json.mock.calls[0][0].sukses).toBe(true);

    const resDummy = createRes();
    await apiController.insertDummy({}, resDummy);
    expect(resDummy.json.mock.calls[0][0].sukses).toBe(true);
  });
});