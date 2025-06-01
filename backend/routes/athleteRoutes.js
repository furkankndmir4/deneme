const express = require('express');
const router = express.Router();
const { 
  savePhysicalData, 
  getPhysicalData,
  getTrainingProgram,
  checkTodaysRecord,
  getPhysicalDataHistory,
  selectCoach,
  getActiveProgram,
  dailyLogin,
  getStreak,
  completeGoal
} = require('../controllers/athleteController');
const { selectTrainingProgram } = require('../controllers/trainingProgramController');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const CoachAthleteRelationship = require('../models/coachAthleteRelationshipModel');

router.route('/physical-data')
  .post(protect, savePhysicalData)
  .get(protect, getPhysicalData);
router.get('/training-program', protect, getTrainingProgram);
router.get('/physical-data/today-check', protect, checkTodaysRecord);
router.get('/physical-data/history', protect, getPhysicalDataHistory);
router.post('/training-program/select', protect, selectTrainingProgram);
router.post('/select-coach', protect, async (req, res) => {
  try {
    const { coachId, message } = req.body;
    const athleteId = req.user._id;

    console.log('Selecting coach:', { coachId, athleteId, message });

    const existingCoach = await User.findById(athleteId).select('coach');
    if (existingCoach.coach) {
      return res.status(400).json({ 
        message: 'You already have a coach. Please end your current relationship before requesting a new coach.' 
      });
    }

    const existingRequest = await CoachAthleteRelationship.findOne({
      $or: [
        { coach: coachId, athlete: athleteId, status: { $in: ['pending', 'accepted'] } },
        { coach: existingCoach.coach, athlete: athleteId, status: 'accepted' }
      ]
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending or active request with this coach.' 
      });
    }

    const relationship = await CoachAthleteRelationship.create({
      coach: coachId,
      athlete: athleteId,
      initialMessage: message,
      status: 'pending'
    });

    console.log('Created new relationship:', relationship);

    res.status(201).json(relationship);
  } catch (error) {
    console.error('Error selecting coach:', error);
    res.status(500).json({ message: error.message });
  }
});

router.post('/end-coach-relationship', protect, async (req, res) => {
  try {
    const athleteId = req.user._id;
    
    const relationship = await CoachAthleteRelationship.findOneAndUpdate(
      { athlete: athleteId, status: 'accepted' },
      { status: 'rejected' },
      { new: true }
    );

    if (!relationship) {
      return res.status(404).json({ message: 'No active coach relationship found' });
    }

    await User.findByIdAndUpdate(athleteId, { coach: null });

    res.json({ message: 'Coach relationship ended successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/active-program', protect, getActiveProgram);
router.post('/daily-login', protect, dailyLogin);
router.get('/streak', protect, getStreak);
router.post('/goals/:goalId/complete', protect, completeGoal);

router.get('/my-coach-requests', protect, async (req, res) => {
  try {
    const CoachAthleteRequest = require('../models/coachAthleteRequestModel');
    const CoachAthleteRelationship = require('../models/coachAthleteRelationshipModel');
    const requests = await CoachAthleteRequest.find({ athlete: req.user._id });
    const relationships = await CoachAthleteRelationship.find({
      athlete: req.user._id,
      status: { $in: ['pending', 'accepted'] }
    });
    res.json([...requests, ...relationships]);
  } catch (err) {
    res.status(500).json({ message: 'İstekler alınamadı', error: err.message });
  }
});

module.exports = router;