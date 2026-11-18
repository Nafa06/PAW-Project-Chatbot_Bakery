const validateChatInput = (req, res, next) => {
  const { message } = req.body || {};

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Pesan tidak boleh kosong.'
    });
  }

  const trimmed = message.trim();

  if (trimmed.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Pesan tidak boleh hanya berisi spasi.'
    });
  }

  if (trimmed.length > 500) {
    return res.status(400).json({
      success: false,
      message: 'Pesan terlalu panjang (maksimal 500 karakter).'
    });
  }

  // Guardrail dasar terhadap pola prompt injection
  const blockedPatterns = [
    /ignore\s+(all\s+)?previous\s+instructions/i,
    /system\s+prompt/i,
    /jailbreak/i,
    /act\s+as\s+/i
  ];

  if (blockedPatterns.some((regex) => regex.test(trimmed))) {
    return res.status(400).json({
      success: false,
      message: 'Permintaan tidak valid. Silakan ajukan pertanyaan seputar pemesanan kue.'
    });
  }

  req.cleanMessage = trimmed;
  next();
};

module.exports = validateChatInput;