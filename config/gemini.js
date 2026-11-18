const { GoogleGenAI } = require('@google/genai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('PERINGATAN: GEMINI_API_KEY belum diatur di file .env!');
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const GEMINI_MODEL = 'gemini-3.5-flash-lite';

module.exports = {
  ai,
  GEMINI_MODEL
};