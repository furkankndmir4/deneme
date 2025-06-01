const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');
const Profile = require('../models/profileModel');
const Friend = require('../models/friendModel');
const { addPoints } = require('../utils/points');
const { checkAndAwardBadges } = require('../utils/achievementUtils');

const sendFriendRequest = async (req, res) => {
  try {
      const requesterId = req.user._id;
      const recipientId = req.params.userId;
      
      // Kendine istek gönderme kontrolü
      if (requesterId.toString() === recipientId) {
          return res.status(400).json({ message: 'Kendinize arkadaşlık isteği gönderemezsiniz' });
      }
      
      // Kullanıcı var mı kontrolü
      const recipient = await User.findById(recipientId);
      if (!recipient) {
          return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      }
      
      // Önceden istek var mı kontrolü
      const existingRequest = await Friend.findOne({
          $or: [
              { requester: requesterId, recipient: recipientId },
              { requester: recipientId, recipient: requesterId }
          ]
      });
      
      if (existingRequest) {
          if (existingRequest.status === 'accepted') {
              return res.status(400).json({ message: 'Bu kullanıcı zaten arkadaşınız' });
          }
          
          if (existingRequest.status === 'pending') {
              if (existingRequest.requester.toString() === requesterId.toString()) {
                  return res.status(400).json({ message: 'Bu kullanıcıya zaten arkadaşlık isteği gönderdiniz' });
              } else {
                  return res.status(400).json({ message: 'Bu kullanıcı size zaten arkadaşlık isteği göndermiş' });
              }
          }
      }
      
      // Yeni arkadaşlık isteği oluştur
      const newFriendRequest = new Friend({
          requester: requesterId,
          recipient: recipientId,
          status: 'pending'
      });
      
      await newFriendRequest.save();
      
      res.status(201).json({ message: 'Arkadaşlık isteği gönderildi' });
  } catch (error) {
      console.error('Friend request error:', error);
      res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Bekleyen arkadaşlık isteklerini getirme
// @route   GET /api/friends/requests
// @access  Private
const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id;
    const friendRequests = await Friend.find({
      recipient: userId,
      status: 'pending'
    });
    
    // İstek gönderenlerin profillerini getir
    const requestsWithProfiles = await Promise.all(
      friendRequests.map(async (request) => {
        const requesterProfile = await Profile.findOne({ user: request.requester });
        const requesterUser = await User.findById(request.requester).select('email');
        
        return {
          _id: request._id,
          from: {
            _id: request.requester,
            email: requesterUser.email,
            fullName: requesterProfile ? requesterProfile.fullName : 'İsimsiz Kullanıcı',
            photoUrl: requesterProfile ? requesterProfile.photoUrl : null
          },
          createdAt: request.createdAt
        };
      })
    );
    
    res.json(requestsWithProfiles);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Arkadaşlık isteğini kabul etme
// @route   POST /api/friends/accept/:requestId
// @access  Private
const acceptFriendRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user._id;
    
    // İstek var mı kontrol et
    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Arkadaşlık isteği bulunamadı' });
    }
    
    // İsteği kabul et
    friendRequest.status = 'accepted';
    await friendRequest.save();

    // Puan ekle (arkadaşlık kabul eden kullanıcıya)
    await addPoints(userId, 5, 'friend', 'Yeni arkadaş eklendi');
    
    // Arkadaş listesini güncelle (kabul edilen iki kullanıcı için de)
    const user = await User.findById(userId);
    const otherUserId = friendRequest.requester;
    const otherUser = await User.findById(otherUserId);
    if (user && otherUser) {
      user.friends = user.friends || [];
      otherUser.friends = otherUser.friends || [];
      if (!user.friends.includes(otherUserId.toString())) user.friends.push(otherUserId);
      if (!otherUser.friends.includes(userId.toString())) otherUser.friends.push(userId);
      await user.save();
      await otherUser.save();
      // Rozet progress güncelle (her iki kullanıcı için)
      await checkAndAwardBadges(userId, { friends: user.friends.length });
      await checkAndAwardBadges(otherUserId, { friends: otherUser.friends.length });
    }
    res.json({ message: 'Arkadaşlık isteği kabul edildi' });
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Arkadaşlık isteğini reddetme
// @route   DELETE /api/friends/reject/:requestId
// @access  Private
const rejectFriendRequest = async (req, res) => {
  try {
    const requestId = req.params.requestId;
    const userId = req.user._id;
    
    // İstek var mı kontrol et
    const friendRequest = await Friend.findOne({
      _id: requestId,
      recipient: userId,
      status: 'pending'
    });
    
    if (!friendRequest) {
      return res.status(404).json({ message: 'Arkadaşlık isteği bulunamadı' });
    }
    
    // İsteği sil
    await Friend.findByIdAndDelete(requestId);
    
    res.json({ message: 'Arkadaşlık isteği reddedildi' });
  } catch (error) {
    console.error('Reject friend request error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
};

// @desc    Get user's friends
// @route   GET /api/friends
// @access  Private
const getFriends = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Hem requester hem recipient olarak accepted olan ilişkileri bul
  const friendships = await Friend.find({
    $or: [
      { requester: userId, status: 'accepted' },
      { recipient: userId, status: 'accepted' }
    ]
  });

  // Karşı tarafın userId'sini bul
  const friendIds = friendships.map(f =>
    f.requester.toString() === userId.toString() ? f.recipient : f.requester
  );

  // Arkadaşların profil bilgilerini getir
  const friends = await User.find({ _id: { $in: friendIds } })
    .select('_id email')
    .populate({
      path: 'profile',
      select: 'fullName photoUrl goalType activityLevel'
    });

  res.json(friends);
});

// @desc    Add a friend
// @route   POST /api/friends
// @access  Private
const addFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.body;
  
  if (!friendId) {
    res.status(400);
    throw new Error('Friend ID is required');
  }

  const user = await User.findById(req.user._id);
  const friend = await User.findById(friendId);

  if (!user || !friend) {
    res.status(404);
    throw new Error('User or friend not found');
  }

  if (Array.isArray(user.friends) && user.friends.includes(friendId)) {
    res.status(400);
    throw new Error('Already friends');
  }

  user.friends = user.friends || [];
  friend.friends = friend.friends || [];

  user.friends.push(friendId);
  friend.friends.push(req.user._id);

  await Promise.all([user.save(), friend.save()]);

  // Rozet progress güncelle (her iki kullanıcı için)
  await checkAndAwardBadges(user._id, { friends: user.friends.length });
  await checkAndAwardBadges(friend._id, { friends: friend.friends.length });

  res.json({ message: 'Friend added successfully' });
});

// @desc    Remove a friend
// @route   DELETE /api/friends/:friendId
// @access  Private
const removeFriend = asyncHandler(async (req, res) => {
  const { friendId } = req.params;
  const userId = req.user._id;

  const user = await User.findById(userId);
  const friend = await User.findById(friendId);

  if (!user || !friend) {
    return res.status(404).json({ message: 'Kullanıcı veya arkadaş bulunamadı' });
  }

  const friendship = await Friend.findOne({
    $or: [
      { requester: userId, recipient: friendId, status: 'accepted' },
      { requester: friendId, recipient: userId, status: 'accepted' }
    ]
  });

  if (!friendship) {
    return res.status(400).json({ message: 'Arkadaşlık ilişkisi bulunamadı' });
  }

  await Friend.findByIdAndDelete(friendship._id);

  user.friends = user.friends?.filter(id => id.toString() !== friendId) || [];
  friend.friends = friend.friends?.filter(id => id.toString() !== userId.toString()) || [];

  await Promise.all([user.save(), friend.save()]);

  await checkAndAwardBadges(userId, { friends: user.friends.length });
  await checkAndAwardBadges(friendId, { friends: friend.friends.length });

  return res.json({ message: 'Arkadaşlık başarıyla kaldırıldı' });
});

module.exports = {
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriends,
  addFriend,
  removeFriend
};