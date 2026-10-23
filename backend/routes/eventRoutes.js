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
  volunteerForEvent,
  optOutVolunteer,
  getEventVolunteers,
  updateVolunteerConfig,
  allocateVolunteerCertificates,
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
router.get('/:id/volunteers', protect, authorize('organizer', 'admin'), getEventVolunteers);
router.post('/:id/volunteer', protect, authorize('student'), volunteerForEvent);
router.post('/:id/volunteer-optout', protect, authorize('student'), optOutVolunteer);
router.put('/:id/volunteer-config', protect, authorize('organizer', 'admin'), updateVolunteerConfig);
router.put('/:id/volunteer-certificates', protect, authorize('organizer', 'admin'), allocateVolunteerCertificates);

module.exports = router;
