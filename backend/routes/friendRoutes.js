const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getFriends, addFriend, removeFriend, sendFriendRequest, getFriendRequests, acceptFriendRequest, rejectFriendRequest } = require('../controllers/friendController');

const router = express.Router();

router.get('/', protect, getFriends);

router.post('/', protect, addFriend);

router.delete('/:friendId', protect, removeFriend);

router.post('/request/:userId', protect, sendFriendRequest);

router.get('/requests', protect, getFriendRequests);

router.post('/accept/:requestId', protect, acceptFriendRequest);

router.delete('/reject/:requestId', protect, rejectFriendRequest);

module.exports = router;