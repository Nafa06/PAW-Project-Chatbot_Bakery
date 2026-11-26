
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const storeState = require('../../../config/storeState');

describe('storeState config', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set waktu ke 12:00 WIB (05:00 UTC) agar konsisten di dalam jam operasional 09:00-21:00 WIB
    vi.setSystemTime(new Date('2026-11-26T05:00:00.000Z'));

    storeState.setAdminToggle({
      isFullOrder: false,
      adminManualOffline: false,
      maxPesananPerMinggu: 10
    });
    storeState.releaseAdminTakeover('628123456789@c.us');
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('mengaktifkan dan menonaktifkan autoFullOrder secara otomatis oleh bot', () => {
    storeState.setBotAutoFullOrder(true, 'Senin, 30 November 2026');
    expect(storeState.getState().isFullOrder).toBe(true);
    expect(storeState.getState().sumberFullOrder).toBe('AUTO_WEEKLY_LIMIT');
    expect(storeState.getState().estimasiBukaOrder).toBe('Senin, 30 November 2026');

    storeState.setBotAutoFullOrder(false);
    expect(storeState.getState().isFullOrder).toBe(false);
    expect(storeState.getState().sumberFullOrder).toBe('OPEN');
  });

  it('kunci manual admin (ADMIN_LOCK) tidak bisa dibuka otomatis oleh bot', () => {
    storeState.setAdminToggle({ isFullOrder: true, forceManual: true });
    expect(storeState.getState().sumberFullOrder).toBe('ADMIN_LOCK');

    storeState.setBotAutoFullOrder(false);
    expect(storeState.getState().isFullOrder).toBe(true);
    expect(storeState.getState().sumberFullOrder).toBe('ADMIN_LOCK');
  });

  it('menjeda bot saat admin takeover selama jam operasional dan otomatis lanjut saat admin offline', () => {
    const sessionId = '628123456789@c.us';
    storeState.markAdminTakeover(sessionId);

    expect(storeState.isBotPausedForSession(sessionId)).toBe(true);

    // Simulasi admin offline manual -> bot kembali aktif membantu balas
    storeState.setAdminToggle({ adminManualOffline: true });
    expect(storeState.isBotPausedForSession(sessionId)).toBe(false);

    // Lepas takeover
    storeState.setAdminToggle({ adminManualOffline: false });
    storeState.releaseAdminTakeover(sessionId);
    expect(storeState.isBotPausedForSession(sessionId)).toBe(false);
  });
});