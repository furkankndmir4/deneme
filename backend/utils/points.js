const User = require('../models/userModel');
const PointHistory = require('../models/pointHistoryModel');
const { checkAndAwardBadges } = require('./achievementUtils');

async function addPoints(userId, amount, type, reason = "") {
  if (!userId || !amount || !type) return;
  await User.findByIdAndUpdate(userId, { $inc: { points: amount } });
  await PointHistory.create({ user: userId, amount, type, reason, date: new Date() });

  const user = await User.findById(userId);
  await checkAndAwardBadges(userId, {
    points: user.points + amount,
  });
}

module.exports = { addPoints }; 