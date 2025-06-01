const express = require('express');
const router = express.Router();
const {
  getUserGoals,
  getAvailableGoals,
  createGoal,
  validateGoals
} = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getUserGoals);
router.get('/available', protect, getAvailableGoals);
router.post('/', protect, createGoal);
router.post('/validate', protect, validateGoals);

module.exports = router; 