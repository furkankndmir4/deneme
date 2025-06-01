const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, messageController.getMessages);
router.post('/', protect, messageController.sendMessage);
router.put('/:id/read', protect, messageController.markAsRead);

module.exports = router; 