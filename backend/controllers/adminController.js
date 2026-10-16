const User = require('../models/userModel');
const Event = require('../models/eventModel');
const { preserveCertificatesOnEventDelete } = require('../utils/certificateService');

// @desc    Get all data for admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getDashboardData = async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password');
  const organizers = await User.find({ role: 'organizer' }).select('-password');
  const events = await Event.find({}).populate('organizer', 'name collegeName organizerDetails email');
  
  // Group by college for hierarchical view
  const colleges = [...new Set(students.map(s => s.collegeName).concat(organizers.map(o => o.collegeName)))];
  
  const hierarchicalData = colleges.map(college => ({
    college,
    students: students.filter(s => s.collegeName === college),
    organizers: organizers.filter(o => o.collegeName === college),
    events: events.filter(e => e.college === college),
  }));

  res.json(hierarchicalData);
};

// @desc    Approve organizer
// @route   PUT /api/admin/approve-organizer/:id
// @access  Private (Admin)
const approveOrganizer = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user && user.role === 'organizer') {
    user.isApproved = true;
    await user.save();
    res.json({ message: 'Organizer approved' });
  } else {
    res.status(404).json({ message: 'Organizer not found' });
  }
};

// @desc    Approve student
// @route   PUT /api/admin/approve-student/:id
// @access  Private (Admin)
const approveStudent = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user && user.role === 'student') {
    user.isApproved = true;
    await user.save();
    res.json({ message: 'Student approved' });
  } else {
    res.status(404).json({ message: 'Student not found' });
  }
};

// @desc    Approve event
// @route   PUT /api/admin/approve-event/:id
// @access  Private (Admin)
const approveEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    event.isApproved = true;
    event.status = 'approved';
    await event.save();
    res.json({ message: 'Event approved' });
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

// @desc    Reject event
// @route   PUT /api/admin/reject-event/:id
// @access  Private (Admin)
const rejectEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    event.isApproved = false;
    event.status = 'rejected';
    await event.save();
    res.json({ message: 'Event rejected' });
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

// @desc    Delete user (student or organizer)
// @route   DELETE /api/admin/user/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    await user.deleteOne();
    res.json({ message: 'User removed' });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Delete event
// @route   DELETE /api/admin/event/:id
// @access  Private (Admin)
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Preserve all student certificates permanently before deleting event
    await preserveCertificatesOnEventDelete(event);
    await event.deleteOne();
    res.json({ message: 'Event removed' });
  } else {
    res.status(404).json({ message: 'Event not found' });
  }
};

// @desc    Block user (student or organizer)
// @route   PUT /api/admin/block-user/:id
// @access  Private (Admin)
const blockUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  if (user.role === 'admin') {
    return res.status(400).json({ message: 'Cannot block administrator account' });
  }

  user.isBlocked = true;
  user.blockReason = req.body.reason || 'Banned by college administration';
  await user.save();

  res.json({ 
    message: `${user.role === 'organizer' ? 'Organizer' : 'Student'} has been blocked and moved to the blocklist.`,
    user: {
      _id: user._id,
      name: user.name,
      role: user.role,
      isBlocked: user.isBlocked,
      blockReason: user.blockReason,
    }
  });
};

// @desc    Unblock user (student or organizer)
// @route   PUT /api/admin/unblock-user/:id
// @access  Private (Admin)
const unblockUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  user.isBlocked = false;
  user.isApproved = true; // Restores access so user can use the platform again with all data intact
  user.blockReason = '';
  await user.save();

  res.json({ 
    message: `${user.role === 'organizer' ? 'Organizer' : 'Student'} unblocked and restored to active directory.`,
    user: {
      _id: user._id,
      name: user.name,
      role: user.role,
      isBlocked: user.isBlocked,
    }
  });
};

module.exports = {
  getDashboardData,
  approveOrganizer,
  approveStudent,
  approveEvent,
  rejectEvent,
  deleteUser,
  deleteEvent,
  blockUser,
  unblockUser,
};
