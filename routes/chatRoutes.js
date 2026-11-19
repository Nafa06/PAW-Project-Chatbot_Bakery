const express = require('express');
const router = express.Router();
const validateChatInput = require('../middlewares/validateChatInput');
const chatController = require('../controllers/chatController');

router.post('/', validateChatInput, chatController.handleChat);
router.post('/reset', chatController.resetChat);
router.get('/store-state', chatController.getStoreState);
router.post('/store-state', chatController.updateStoreState);

module.exports = router;