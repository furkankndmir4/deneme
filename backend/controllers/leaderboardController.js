const User = require('../models/userModel');

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    // Fetch all users sorted by points (descending) and then by _id (ascending for deterministic tie-breaking)
    const allUsers = await User.find({})
      .sort({ points: -1, _id: 1 }) // Add _id for deterministic sorting
      .populate('profile', 'fullName photoUrl')
      .select('points userType profile');

    // Get current user's rank if authenticated
    let currentUserRank = null;
    if (req.user) {
      // Find the index of the current user in the sorted list
      const currentUserIndex = allUsers.findIndex(user => user._id.toString() === req.user._id.toString());
      if (currentUserIndex !== -1) {
        currentUserRank = currentUserIndex + 1;
      }
    }

    // Prepare the leaderboard for the top 20
    const leaderboard = allUsers.slice(0, 20).map(user => ({
      id: user._id,
      name: user.profile?.fullName || 'İsimsiz Kullanıcı',
      points: user.points,
      userType: user.userType,
      photoUrl: user.profile?.photoUrl,
    }));

    res.json({
      leaderboard,
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