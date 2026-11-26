import { describe, it, expect, vi, beforeEach } from 'vitest';
const request = require('supertest');
const ProdukModel = require('../../models/produkModel');
const app = require('../../app');
const { mockDatabaseData, validPesananPayload } = require('../fixtures/bakeryData');

describe('Integration: REST API Produk & Pesanan (/api)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('GET /api/status mengembalikan status server ok', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/produk mengambil daftar katalog dan rekap pesanan', async () => {
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);

    const res = await request(app).get('/api/produk');

    expect(res.status).toBe(200);
    expect(res.body.sukses).toBe(true);
    expect(res.body.data.katalogDasar).toHaveLength(3);
  });

  it('POST /api/pesanan membuat pesanan baru (201) dan menolak data tidak valid (400)', async () => {
    vi.spyOn(ProdukModel, 'createPesanan').mockResolvedValue({
      id: 2,
      ...validPesananPayload,
      estimasi: 190000,
      status: 'Menunggu DP'
    });

    const badRes = await request(app).post('/api/pesanan').send({ pelanggan: '' });
    expect(badRes.status).toBe(400);

    const okRes = await request(app).post('/api/pesanan').send(validPesananPayload);
    expect(okRes.status).toBe(201);
    expect(okRes.body.sukses).toBe(true);
    expect(okRes.body.data.id).toBe(2);
  });

  it('PUT & DELETE /api/pesanan/:id memperbarui dan menghapus pesanan', async () => {
    vi.spyOn(ProdukModel, 'updatePesanan').mockResolvedValue({
      id: 1,
      status: 'Proses Dapur'
    });
    vi.spyOn(ProdukModel, 'deletePesanan').mockResolvedValue({ id: 1 });

    const putRes = await request(app)
      .put('/api/pesanan/1')
      .send({ status: 'Proses Dapur' });
    expect(putRes.status).toBe(200);
    expect(putRes.body.data.status).toBe('Proses Dapur');

    const delRes = await request(app).delete('/api/pesanan/1');
    expect(delRes.status).toBe(200);
    expect(delRes.body.sukses).toBe(true);
  });

  it('mengembalikan 404 JSON untuk endpoint /api yang tidak terdaftar', async () => {
    const res = await request(app).get('/api/endpoint-ngasal');
    expect(res.status).toBe(404);
    expect(res.body.sukses).toBe(false);
  });
});