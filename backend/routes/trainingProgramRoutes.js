const express = require('express');
const router = express.Router();
const { protect, coach } = require('../middleware/authMiddleware');
const { 
  getTrainingTemplates, 
  selectTrainingProgram,
  getCurrentProgram,
  createProgram,
  getCoachPrograms,
  getProgramById,
  updateProgram,
  deleteProgram
} = require('../controllers/trainingProgramController');

router.get('/current', protect, getCurrentProgram);
router.get('/templates', protect, getTrainingTemplates);
router.post('/select', protect, selectTrainingProgram);

router.post('/', protect, coach, createProgram);
router.get('/coach', protect, coach, getCoachPrograms);
router.put('/:id', protect, coach, updateProgram);
router.delete('/:id', protect, coach, deleteProgram);

router.get('/:id', protect, getProgramById);

module.exports = router;