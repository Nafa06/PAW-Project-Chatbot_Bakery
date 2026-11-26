import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
const ProdukModel = require('../../../models/produkModel');
const storeState = require('../../../config/storeState');
const { ai } = require('../../../config/gemini');
const {
  generateChatReply,
  cekKapasitasDanBentrok,
  resetChatSession
} = require('../../../services/geminiService');
const { mockDatabaseData } = require('../../fixtures/bakeryData');

describe('geminiService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.useFakeTimers();
    // 26 Nov 2026, 12:00 WIB (dalam jam operasional)
    vi.setSystemTime(new Date('2026-11-26T05:00:00.000Z'));

    storeState.setAdminToggle({
      isFullOrder: false,
      adminManualOffline: false,
      maxPesananPerMinggu: 10
    });
    resetChatSession('unit-test-session');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('cekKapasitasDanBentrok mendeteksi jadwal bentrok jika ada pesanan di hari yang sama dengan waktu singkat', async () => {
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);

    // Di fixture ada pesanan tanggal 28/11/2026 (selisih 2 hari dari 26/11/2026)
    const hasil = await cekKapasitasDanBentrok('28/11/2026');

    expect(hasil.totalPesananAktif).toBe(1);
    expect(hasil.jumlahHariSama).toBe(1);
    expect(hasil.bentrokJadwalPadat).toBe(true);
  });

  it('generateChatReply mengembalikan balasan teks normal dari Gemini', async () => {
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);
    vi.spyOn(ai.models, 'generateContent').mockResolvedValue({
      text: 'Kue Tart 16cm harganya Rp 150.000 kak.',
      functionCalls: [],
      candidates: [
        { content: { role: 'model', parts: [{ text: 'Kue Tart 16cm harganya Rp 150.000 kak.' }] } }
      ]
    });

    const result = await generateChatReply('Harga tart 16cm berapa?', {
      sessionId: 'unit-test-session'
    });

    expect(result.reply).toContain('Rp 150.000');
    expect(result.orderCreated).toBe(false);
  });

  it('generateChatReply mengeksekusi function calling simpan_pesanan dan menyimpan ke database', async () => {
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);
    const createSpy = vi.spyOn(ProdukModel, 'createPesanan').mockResolvedValue({
      id: 99,
      status: 'Menunggu DP'
    });

    vi.spyOn(ai.models, 'generateContent').mockResolvedValue({
      functionCalls: [
        {
          name: 'simpan_pesanan',
          args: {
            pelanggan: 'Andi',
            kontak: '08123456789',
            rincian: 'Brownies Panggang',
            deadline: '10/12/2026',
            estimasi: 60000
          }
        }
      ],
      candidates: [
        { content: { role: 'model', parts: [{ functionCall: { name: 'simpan_pesanan' } }] } }
      ]
    });

    const result = await generateChatReply('Ya lanjut pesan sekarang', {
      sessionId: 'unit-test-session'
    });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        pelanggan: 'Andi',
        estimasi: 60000
      })
    );
    expect(result.orderCreated).toBe(true);
    expect(result.reply).toContain('#99');
  });

  it('generateChatReply mengeksekusi function calling cek_status_pesanan', async () => {
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);
    vi.spyOn(ProdukModel, 'findPesanan').mockResolvedValue(mockDatabaseData.rekapPesanan);

    vi.spyOn(ai.models, 'generateContent').mockResolvedValue({
      functionCalls: [
        {
          name: 'cek_status_pesanan',
          args: { id_pesanan: 1 }
        }
      ],
      candidates: [
        { content: { role: 'model', parts: [{ functionCall: { name: 'cek_status_pesanan' } }] } }
      ]
    });

    const result = await generateChatReply('Cek pesanan ID 1', {
      sessionId: 'unit-test-session'
    });

    expect(result.orderCreated).toBe(false);
    expect(result.reply).toContain('Salsa');
    expect(result.reply).toContain('Menunggu DP');
  });

  it('menambahkan catatan jam operasional otomatis saat admin offline', async () => {
    storeState.setAdminToggle({ adminManualOffline: true });
    vi.spyOn(ProdukModel, 'getAll').mockResolvedValue(mockDatabaseData);
    vi.spyOn(ai.models, 'generateContent').mockResolvedValue({
      text: 'Halo kak, silakan pilih menu kuenya.',
      functionCalls: [],
      candidates: []
    });

    const result = await generateChatReply('Halo', { sessionId: 'unit-test-session' });

    expect(result.reply).toContain('Info Jam Operasional');
  });
});