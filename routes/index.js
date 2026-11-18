const express = require('express');
const webRoutes = require('./web');
const apiRoutes = require('./api');

const router = express.Router();

router.use('/api', apiRoutes);
router.use('/', webRoutes);

const chatRoutes = require('./chatRoutes');
router.use('/api/chat', chatRoutes);

module.exports = router;
