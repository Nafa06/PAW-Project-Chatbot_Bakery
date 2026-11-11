const express = require('express');
const apiController = require('../controllers/apiController');

const router = express.Router();

router.get('/status', apiController.status);
router.get('/produk', apiController.getAll);

router.post('/pesanan/dummy', apiController.insertDummy);
router.delete('/pesanan/clear', apiController.clearAll);

router.post('/pesanan', apiController.createPesanan);
router.put('/pesanan/:id', apiController.updatePesanan);
router.delete('/pesanan/:id', apiController.deletePesanan);

module.exports = router;