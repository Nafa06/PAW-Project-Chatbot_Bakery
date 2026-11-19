const geminiService = require('../services/geminiService');
const storeState = require('../config/storeState');

const handleChat = async (req, res) => {
  try {
    const message = req.cleanMessage;
    const sessionId = req.body.sessionId || 'web-default';

    if (storeState.isBotPausedForSession(sessionId)) {
      return res.status(200).json({
        success: true,
        data: {
          pausedByTakeover: true,
          reply: 'Percakapan sedang ditangani langsung oleh Admin.',
          orderCreated: false
        }
      });
    }

    const result = await geminiService.generateChatReply(message, { sessionId });

    return res.status(200).json({
      success: true,
      data: {
        pausedByTakeover: false,
        reply: result.reply,
        orderCreated: Boolean(result.orderCreated)
      }
    });
  } catch (error) {
    console.error('[ChatController Error]:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi gangguan pada layanan asisten AI. Silakan coba lagi.'
    });
  }
};

const resetChat = (req, res) => {
  const sessionId = req.body?.sessionId || 'web-default';
  geminiService.resetChatSession(sessionId);
  storeState.releaseAdminTakeover(sessionId);

  return res.status(200).json({
    success: true,
    message: 'Sesi percakapan berhasil direset.'
  });
};

const getStoreState = async (req, res) => {
  try {
    await geminiService.cekKapasitasDanBentrok(null);
    return res.status(200).json({
      success: true,
      data: storeState.getState()
    });
  } catch (error) {
    console.error('[StoreState Error]:', error.message);
    return res.status(200).json({
      success: true,
      data: storeState.getState()
    });
  }
};

const updateStoreState = async (req, res) => {
  try {
    storeState.setAdminToggle(req.body || {});
    await geminiService.cekKapasitasDanBentrok(null);

    return res.status(200).json({
      success: true,
      data: storeState.getState()
    });
  } catch (error) {
    console.error('[UpdateStoreState Error]:', error.message);
    return res.status(200).json({
      success: true,
      data: storeState.getState()
    });
  }
};

module.exports = {
  handleChat,
  resetChat,
  getStoreState,
  updateStoreState
};