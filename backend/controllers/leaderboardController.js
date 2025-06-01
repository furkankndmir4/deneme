const User = require('../models/userModel');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({})
      .sort({ points: -1 })
      .limit(20)
      .populate('profile', 'fullName photoUrl')
      .select('points userType profile');

    // Get current user's rank if authenticated
    let currentUserRank = null;
    if (req.user) {
      const usersWithHigherPoints = await User.countDocuments({
        points: { $gt: req.user.points }
      });
      currentUserRank = usersWithHigherPoints + 1;
    }

    res.json({
      leaderboard: users.map(user => ({
        id: user._id,
        name: user.profile?.fullName || 'İsimsiz Kullanıcı',
        points: user.points,
        userType: user.userType,
        photoUrl: user.profile?.photoUrl,
      })),
      currentUserRank
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Liderlik tablosu yüklenemedi' });
  }
};

module.exports = {
  getLeaderboard
}; 