const app = require('./app');
const config = require('./config');
const { initWhatsApp } = require('./services/whatsappService');

app.listen(config.port, () => {
  console.log(`Server jalan di http://localhost:${config.port}`);
  initWhatsApp();
});