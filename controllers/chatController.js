const geminiService = require('../services/geminiService');

const chatController = {
  async sendMessage(req, res) {
    try {
      const sessionId = req.body.sessionId || 'web-default';
      const result = await geminiService.generateChatReply(req.cleanMessage, { sessionId });

      return res.status(200).json({
        success: true,
        data: {
          reply: result.reply,
          orderCreated: result.orderCreated
        }
      });
    } catch (error) {
      console.error('[ChatController Error]:', error.message);

      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memproses permintaan ke AI. Silakan coba lagi.'
      });
    }
  },

  resetSession(req, res) {
    const sessionId = req.body?.sessionId || 'web-default';
    geminiService.resetChatSession(sessionId);

    return res.status(200).json({
      success: true,
      message: 'Sesi percakapan berhasil direset.'
    });
  }
};

module.exports = chatController;