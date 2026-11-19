const fs = require('fs');
const path = require('path');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const geminiService = require('./geminiService');
const storeState = require('../config/storeState');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const botSentMessageIds = new Set();
const pendingBotReplies = [];
const chatQueues = new Map();

const IGNORED_MSG_TYPES = new Set([
  'e2e_notification',
  'notification',
  'notification_template',
  'protocol',
  'gp2',
  'call_log',
  'revoked',
  'reaction'
]);

const getBrowserExecutablePath = () => {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  return candidates.find((p) => p && fs.existsSync(p));
};

const formatNomorIndo = (raw) => {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (!digits) return null;
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  return digits;
};

const cleanupPendingReplies = () => {
  const now = Date.now();
  for (let i = pendingBotReplies.length - 1; i >= 0; i--) {
    if (pendingBotReplies[i].expiresAt <= now) {
      pendingBotReplies.splice(i, 1);
    }
  }
};

const isBotOwnMessage = (msg, body) => {
  const shortId = msg.id?.id || '';
  const serializedId = msg.id?._serialized || '';

  if ((shortId && botSentMessageIds.has(shortId)) || (serializedId && botSentMessageIds.has(serializedId))) {
    return true;
  }

  if (shortId.startsWith('3EB0')) {
    return true;
  }

  cleanupPendingReplies();
  const matched = pendingBotReplies.some((item) => item.text === body);
  if (matched) {
    if (shortId) {
      botSentMessageIds.add(shortId);
      setTimeout(() => botSentMessageIds.delete(shortId), 3 * 60 * 1000);
    }
    return true;
  }

  return false;
};

const sendBotReply = async (client, chatId, text) => {
  const cleanText = String(text || '').trim();
  if (!cleanText) return;

  pendingBotReplies.push({
    chatId,
    text: cleanText,
    expiresAt: Date.now() + 30 * 1000
  });

  try {
    const chat = await client.getChatById(chatId);
    await chat.sendStateTyping();
    await sleep(1200 + Math.floor(Math.random() * 1000));
    await chat.clearState();
  } catch (_) {
    // Abaikan jika typing state gagal
  }

  const sentMsg = await client.sendMessage(chatId, cleanText);
  const shortId = sentMsg?.id?.id;
  const serializedId = sentMsg?.id?._serialized;

  if (shortId) {
    botSentMessageIds.add(shortId);
    setTimeout(() => botSentMessageIds.delete(shortId), 3 * 60 * 1000);
  }
  if (serializedId) {
    botSentMessageIds.add(serializedId);
    setTimeout(() => botSentMessageIds.delete(serializedId), 3 * 60 * 1000);
  }
};

const initWhatsApp = () => {
  let botStartTime = Math.floor(Date.now() / 1000);
  const executablePath = getBrowserExecutablePath();

  if (executablePath) {
    console.log(`[WhatsApp] Menggunakan browser lokal: ${executablePath}`);
  } else {
    console.warn('[WhatsApp] Chrome/Edge tidak ditemukan di path default Windows.');
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: 'bakerybot-admin' }),
    puppeteer: {
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    }
  });

  client.on('qr', (qr) => {
    console.log('\n[WhatsApp] Scan QR Code ini dari WA di HP kamu (Perangkat Tertaut):');
    qrcode.generate(qr, { small: true });
  });

  client.on('loading_screen', (percent, message) => {
    console.log(`[WhatsApp] Loading ${percent}% - ${message}`);
  });

  client.on('authenticated', () => {
    console.log('[WhatsApp] Autentikasi berhasil, menyinkronkan chat...');
  });

  client.on('ready', () => {
    botStartTime = Math.floor(Date.now() / 1000);
    console.log('[WhatsApp] Bot WA terhubung & siap melayani!');
    console.log('[WhatsApp] Perintah Admin di chat pelanggan: "/bot" (aktifkan bot lagi), "/stop" (takeover manual)');
  });

  client.on('auth_failure', (msg) => {
    console.error('[WhatsApp] Autentikasi gagal:', msg);
  });

  client.on('disconnected', (reason) => {
    console.warn('[WhatsApp] Koneksi terputus:', reason);
  });

  client.on('message_create', async (msg) => {
    try {
      // Abaikan pesan lama hasil sinkronisasi awal (toleransi selisih jam 15 detik)
      if (msg.timestamp && msg.timestamp < botStartTime - 15) {
        return;
      }

      if (IGNORED_MSG_TYPES.has(msg.type)) {
        return;
      }

      const chatId = msg.fromMe ? msg.to : msg.from;
      if (!chatId) return;

      // Abaikan grup, status/story, dan channel/newsletter
      if (
        chatId.endsWith('@g.us') ||
        chatId === 'status@broadcast' ||
        chatId.endsWith('@newsletter')
      ) {
        return;
      }

      const body = String(msg.body || '').trim();
      if (!body) return;

      // ========================================================
      // 1. JIKA PESAN KELUAR (fromMe)
      // ========================================================
      if (msg.fromMe) {
        if (isBotOwnMessage(msg, body)) {
          return;
        }

        // Fitur tes mandiri lewat "Message Yourself" pakai awalan /test
        if (msg.from === msg.to) {
          if (body.toLowerCase().startsWith('/test ')) {
            const testMsg = body.slice(6).trim();
            const nomorSendiri = formatNomorIndo(chatId.split('@')[0]);
            const result = await geminiService.generateChatReply(testMsg, {
              sessionId: 'wa-self-test',
              defaultKontak: nomorSendiri
            });
            if (result?.reply) {
              await sendBotReply(client, chatId, result.reply);
            }
          }
          return;
        }

        if (body.toLowerCase() === '/bot') {
          storeState.releaseAdminTakeover(chatId);
          console.log(`[WA Takeover] Bot diaktifkan kembali untuk ${chatId}`);
          await sendBotReply(client, chatId, '🤖 _BakeryBot kembali aktif menangani percakapan ini._');
          return;
        }

        if (body.toLowerCase() === '/stop') {
          storeState.markAdminTakeover(chatId);
          console.log(`[WA Takeover] Bot dinonaktifkan manual oleh admin untuk ${chatId}`);
          return;
        }

        // Ketikan manual murni dari HP Admin
        storeState.markAdminTakeover(chatId);
        console.log(
          `[WA Takeover] Admin membalas manual ke ${chatId} (device=${msg.deviceType}, teks="${body.slice(0, 25)}") -> Bot pause otomatis.`
        );
        return;
      }

      // ========================================================
      // 2. JIKA PESAN MASUK DARI PELANGGAN (!msg.fromMe)
      // ========================================================
      if (storeState.isBotPausedForSession(chatId)) {
        console.log(`[WA Skip] Pesan dari ${chatId} dilewati (sedang di-takeover Admin).`);
        return;
      }

      const prevTask = chatQueues.get(chatId) || Promise.resolve();
      const nextTask = prevTask.then(async () => {
        try {
          if (storeState.isBotPausedForSession(chatId)) return;

          let nomorPelanggan = formatNomorIndo(chatId.split('@')[0]);
          try {
            const contact = await msg.getContact();
            if (contact?.number) {
              nomorPelanggan = formatNomorIndo(contact.number);
            }
          } catch (_) {
            // Fallback ke ID pengirim jika getContact gagal
          }

          console.log(`[WA Masuk] ${nomorPelanggan}: ${body}`);

          const result = await geminiService.generateChatReply(body, {
            sessionId: chatId,
            defaultKontak: nomorPelanggan
          });

          if (result?.reply && !storeState.isBotPausedForSession(chatId)) {
            await sendBotReply(client, chatId, result.reply);
          }
        } catch (err) {
          console.error(`[WA Error] Gagal memproses pesan ${chatId}:`, err.message);
        }
      });

      chatQueues.set(chatId, nextTask);
    } catch (error) {
      console.error('[WA Listener Error]:', error.message);
    }
  });

  client.initialize();
  return client;
};

module.exports = {
  initWhatsApp
};