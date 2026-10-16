const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  approveOrganizer,
  approveStudent,
  approveEvent,
  rejectEvent,
  deleteUser,
  deleteEvent,
  blockUser,
  unblockUser,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.get('/dashboard', getDashboardData);
router.put('/approve-organizer/:id', approveOrganizer);
router.put('/approve-student/:id', approveStudent);
router.put('/approve-event/:id', approveEvent);
router.put('/reject-event/:id', rejectEvent);
router.put('/block-user/:id', blockUser);
router.put('/unblock-user/:id', unblockUser);
router.delete('/user/:id', deleteUser);
router.delete('/event/:id', deleteEvent);

module.exports = router;
