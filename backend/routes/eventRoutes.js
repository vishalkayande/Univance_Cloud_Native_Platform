const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  enrollEvent,
  getRegistrations,
  deleteEvent,
  togglePauseEvent,
  updateWinners,
  unenrollEvent,
  updateCertificates,
  getMyCertificates,
  getTeamInvitations,
  respondTeamInvitation,
  replaceTeamMember,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.route('/')
  .get(getEvents)
  .post(protect, authorize('organizer', 'admin'), createEvent);

router.get('/my-certificates', protect, authorize('student'), getMyCertificates);
router.get('/team-invitations', protect, authorize('student'), getTeamInvitations);

router.route('/:id')
  .delete(protect, authorize('organizer', 'admin'), deleteEvent);

router.put('/:id/pause', protect, authorize('organizer'), togglePauseEvent);
router.put('/:id/winners', protect, authorize('organizer'), updateWinners);
router.put('/:id/certificates', protect, authorize('organizer', 'admin'), updateCertificates);
router.post('/:id/enroll', protect, authorize('student'), enrollEvent);
router.post('/:id/unenroll', protect, authorize('student'), unenrollEvent);
router.put('/:id/team-invitation/respond', protect, authorize('student'), respondTeamInvitation);
router.put('/:id/replace-team-member', protect, authorize('student'), replaceTeamMember);
router.get('/:id/registrations', protect, authorize('organizer', 'admin'), getRegistrations);

module.exports = router;
