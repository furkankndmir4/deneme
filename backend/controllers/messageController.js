const Message = require('../models/messageModel');
const { addPoints } = require('../utils/points');
const PointHistory = require('../models/pointHistoryModel');

// Kullanıcıya ait mesajları getir (gelen ve giden)
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Message.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate({
        path: 'sender',
        select: 'fullName email userType profile',
        populate: { path: 'profile', select: 'fullName' }
      })
      .populate({
        path: 'receiver',
        select: 'fullName email userType profile',
        populate: { path: 'profile', select: 'fullName' }
      });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Mesajlar alınamadı.' });
  }
};

// Mesaj gönder
exports.sendMessage = async (req, res) => {
  try {
    const { receiver, content } = req.body;
    const sender = req.user._id;
    const message = new Message({ sender, receiver, content });
    await message.save();

    // Günde max 10 puan olacak şekilde mesaj başına 1 puan ekle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessagePoints = await PointHistory.countDocuments({
      user: sender,
      type: 'message',
      date: { $gte: today }
    });
    if (todayMessagePoints < 10) {
      await addPoints(sender, 1, 'message', 'Mesaj gönderildi');
    }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Mesaj gönderilemedi.' });
  }
};

// Mesajı okundu olarak işaretle
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findByIdAndUpdate(
      id,
      { read: true },
      { 
        new: true,
        populate: [
          {
            path: 'sender',
            select: 'fullName email userType profile',
            populate: { path: 'profile', select: 'fullName' }
          },
          {
            path: 'receiver',
            select: 'fullName email userType profile',
            populate: { path: 'profile', select: 'fullName' }
          }
        ]
      }
    );
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Okundu olarak işaretlenemedi.' });
  }
}; 