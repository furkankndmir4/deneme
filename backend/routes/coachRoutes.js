const express = require('express');
const router = express.Router();
const { 
  getCoachAthletes, 
  createTrainingProgram,
  getTrainingPrograms,
  listCoaches,
  getPendingAthleteRequests,
  acceptAthleteRequest,
  rejectAthleteRequest
} = require('../controllers/coachController');
const { protect, coach } = require('../middleware/authMiddleware');
const User = require('../models/userModel');
const CoachAthleteRelationship = require('../models/coachAthleteRelationshipModel');
const TrainingProgram = require('../models/trainingProgramModel');
const CoachRating = require('../models/coachRatingModel');

router.get('/athletes', protect, coach, getCoachAthletes);

router.post('/training-programs', protect, coach, createTrainingProgram);

router.get('/training-programs', protect, coach, getTrainingPrograms);

router.get('/', protect, async (req, res) => {
  try {
    const coaches = await User.find({ userType: 'coach' })
      .populate('profile')
      .lean();

    const coachesWithStats = await Promise.all(coaches.map(async (coach) => {
      const activeStudents = await CoachAthleteRelationship.countDocuments({
        coach: coach._id,
        status: 'accepted'
      });

      console.log(`Coach ${coach._id} active students:`, activeStudents);

      const allRelationships = await CoachAthleteRelationship.find({
        coach: coach._id
      });
      console.log(`Coach ${coach._id} all relationships:`, allRelationships);

      const programCount = await TrainingProgram.countDocuments({
        createdBy: coach._id
      });

      const ratings = await CoachRating.find({ coach: coach._id });
      const averageRating = ratings.length > 0
        ? ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length
        : 0;

      const membershipDuration = Math.floor(
        (Date.now() - new Date(coach.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365)
      );

      return {
        ...coach,
        stats: {
          activeStudents,
          programCount,
          averageRating,
          membershipDuration
        }
      };
    }));

    res.json(coachesWithStats);
  } catch (error) {
    console.error('Error in GET /api/coaches:', error);
    res.status(500).json({ message: error.message });
  }
});

router.get('/athlete-requests', protect, getPendingAthleteRequests);

router.post('/athlete-requests/:requestId/accept', protect, coach, acceptAthleteRequest);

router.post('/athlete-requests/:requestId/reject', protect, coach, rejectAthleteRequest);

router.post('/:coachId/rate', protect, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const athleteId = req.user._id;
    const coachId = req.params.coachId;

    const relationship = await CoachAthleteRelationship.findOne({
      coach: coachId,
      athlete: athleteId,
      status: 'accepted'
    });

    if (!relationship) {
      return res.status(400).json({ message: 'You can only rate coaches you are working with' });
    }

    const coachRating = await CoachRating.findOneAndUpdate(
      { coach: coachId, athlete: athleteId },
      { rating, comment },
      { upsert: true, new: true }
    );

    res.json(coachRating);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:coachId/ratings', protect, async (req, res) => {
  try {
    const ratings = await CoachRating.find({ coach: req.params.coachId })
      .populate({
        path: 'athlete',
        select: 'profile',
        populate: { path: 'profile', select: 'fullName photoUrl' }
      })
      .sort('-createdAt');

    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/athlete-relationships', protect, async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const relationships = await require('../models/coachAthleteRelationshipModel')
      .find({ coach: req.user._id, status })
      .populate({
        path: 'athlete',
        select: 'email profile',
        populate: { path: 'profile', select: 'fullName goalType' }
      })
    res.json(relationships);
  } catch (err) {
    res.status(500).json({ message: 'CoachAthleteRelationship istekleri alınamadı', error: err.message });
  }
});

module.exports = router;