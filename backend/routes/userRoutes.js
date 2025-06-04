const express = require('express');
const {
  loginUser,
  registerUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserProfileById,
  uploadProfilePhoto,
  deleteAccount,
  forgotPassword,
  resetPassword,
  searchUsers,
  updatePrivacySettings,
  updatePhysicalData,
  getPhysicalDataHistory,
  adminResetPassword
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);
router.post('/admin-reset-password', adminResetPassword);

router.post('/logout', protect, logoutUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.delete('/profile', protect, deleteUser);
router.get('/profile/:userId', protect, getUserProfileById);
router.post('/profile/photo', protect, uploadMiddleware.single('photo'), uploadProfilePhoto);
router.delete('/account', protect, deleteAccount);
router.get('/search', protect, searchUsers);
router.put('/privacy-settings', protect, updatePrivacySettings);

router.put('/physical-data', protect, updatePhysicalData);
router.get('/physical-data/history', protect, getPhysicalDataHistory);

module.exports = router;