import { describe, it, expect, vi, beforeEach } from 'vitest';
const geminiService = require('../../../services/geminiService');
const storeState = require('../../../config/storeState');
const {
  handleChat,
  resetChat,
  getStoreState,
  updateStoreState
} = require('../../../controllers/chatController');

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };
}

describe('chatController', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('handleChat mengembalikan pausedByTakeover jika sesi sedang ditangani admin', async () => {
    vi.spyOn(storeState, 'isBotPausedForSession').mockReturnValue(true);
    const res = createRes();

    await handleChat({ cleanMessage: 'Halo', body: { sessionId: 'sesi-1' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ pausedByTakeover: true })
      })
    );
  });

  it('handleChat meneruskan pesan ke geminiService dan mengembalikan balasan', async () => {
    vi.spyOn(storeState, 'isBotPausedForSession').mockReturnValue(false);
    vi.spyOn(geminiService, 'generateChatReply').mockResolvedValue({
      reply: 'Halo! Ada yang bisa dibantu?',
      orderCreated: false
    });
    const res = createRes();

    await handleChat({ cleanMessage: 'Menu apa aja?', body: { sessionId: 'sesi-2' } }, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        pausedByTakeover: false,
        reply: 'Halo! Ada yang bisa dibantu?',
        orderCreated: false
      }
    });
  });

  it('handleChat mengembalikan 500 jika geminiService mengalami error', async () => {
    vi.spyOn(storeState, 'isBotPausedForSession').mockReturnValue(false);
    vi.spyOn(geminiService, 'generateChatReply').mockRejectedValue(new Error('API down'));
    const res = createRes();

    await handleChat({ cleanMessage: 'Halo', body: {} }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].success).toBe(false);
  });

  it('resetChat mereset sesi chat dan melepas takeover admin', () => {
    const resetSpy = vi.spyOn(geminiService, 'resetChatSession').mockImplementation(() => {});
    const releaseSpy = vi.spyOn(storeState, 'releaseAdminTakeover').mockImplementation(() => {});
    const res = createRes();

    resetChat({ body: { sessionId: 'sesi-2' } }, res);

    expect(resetSpy).toHaveBeenCalledWith('sesi-2');
    expect(releaseSpy).toHaveBeenCalledWith('sesi-2');
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('getStoreState dan updateStoreState mengembalikan state toko terbaru', async () => {
    vi.spyOn(geminiService, 'cekKapasitasDanBentrok').mockResolvedValue({});
    const resGet = createRes();
    await getStoreState({}, resGet);
    expect(resGet.status).toHaveBeenCalledWith(200);

    const resPost = createRes();
    await updateStoreState({ body: { maxPesananPerMinggu: 12 } }, resPost);
    expect(resPost.status).toHaveBeenCalledWith(200);
    expect(resPost.json.mock.calls[0][0].data.maxPesananPerMinggu).toBe(12);
  });
});