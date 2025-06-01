const express = require('express');
const router = express.Router();
const { getUserAchievements, saveUserAchievements, getAchievementsProgress } = require('../controllers/achievementController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserAchievements);
router.post('/', protect, saveUserAchievements);
router.get('/progress', protect, getAchievementsProgress);

module.exports = router; 