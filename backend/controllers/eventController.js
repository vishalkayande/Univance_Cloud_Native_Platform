const Event = require('../models/eventModel');
const User = require('../models/userModel');

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer)
const createEvent = async (req, res) => {
  const { name, level, department, clubName, category, description, url, upiId, photo, date, time, registrationLimit, isGroupEvent, minTeamSize, maxTeamSize } = req.body;

  if (!name || !level || !description || !date || !time) {
    return res.status(400).json({ message: 'Please add all required fields' });
  }

  if (level === 'club' && !clubName) {
    return res.status(400).json({ message: 'Please add club name for club level event' });
  }

  if (isGroupEvent) {
    if (!minTeamSize || !maxTeamSize) {
      return res.status(400).json({ message: 'Please set team size limits for group event' });
    }
    if (parseInt(minTeamSize) > parseInt(maxTeamSize)) {
      return res.status(400).json({ message: 'Min team size cannot exceed max team size' });
    }
  }

  const event = await Event.create({
    organizer: req.user._id,
    college: req.user.collegeName,
    name,
    level,
    department: level === 'department' ? department : 'ALL',
    clubName: level === 'club' ? clubName : undefined,
    category,
    description,
    url,
    upiId,
    registrationLimit: parseInt(registrationLimit) || 0,
    photo,
    date,
    time,
    isGroupEvent: isGroupEvent || false,
    minTeamSize: isGroupEvent ? parseInt(minTeamSize) : undefined,
    maxTeamSize: isGroupEvent ? parseInt(maxTeamSize) : undefined,
  });

  if (event) {
    res.status(201).json(event);
  } else {
    res.status(400).json({ message: 'Invalid event data' });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  const { level, college } = req.query;
  let query = {};

  if (level) query.level = level;
  if (college) query.college = college;

  // Only show approved events to students; admins see all; organizers see their own all events
  if (!req.user) {
    query.status = 'approved';
  } else if (req.user.role === 'organizer') {
    query.organizer = req.user._id;
  } else if (req.user.role !== 'admin') {
    query.status = 'approved';
  }

  const events = await Event.find(query)
    .populate('organizer', 'name email organizerDetails')
    .populate('registrations.student', 'name studentDetails email')
    .populate('registrations.teamLeader', 'name studentDetails email')
    .populate('registrations.teamMembers.student', 'name studentDetails email');
  
  res.json(events);
};

// @desc    Enroll in an event
// @route   POST /api/events/:id/enroll
// @access  Private (Student)
const enrollEvent = async (req, res) => {
  const { mobileNo, email, teamName, teamLeader, teamMembers } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check deadline
  const deadline = new Date(`${event.date.toISOString().split('T')[0]}T${event.time}`);
  if (new Date() > deadline) {
    return res.status(400).json({ message: 'Event registrations expired' });
  }

  // Check if paused
  if (event.isPaused) {
    return res.status(400).json({ message: 'Registration paused by organizer' });
  }

  // Check capacity limit
  if (event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit) {
    return res.status(400).json({ message: 'Event registration limit reached' });
  }

  if (event.isGroupEvent) {
    // Group event validation
    if (!teamName || !teamLeader || !teamMembers || teamMembers.length === 0) {
      return res.status(400).json({ message: 'Please provide team name and members' });
    }

    if (teamMembers.length < event.minTeamSize || teamMembers.length > event.maxTeamSize) {
      return res.status(400).json({ message: `Team size must be between ${event.minTeamSize} and ${event.maxTeamSize}` });
    }

    // Check if any team member is already registered
    const allMemberIds = [teamLeader, ...teamMembers.map(m => m.student)];
    for (const memberId of allMemberIds) {
      const alreadyRegistered = event.registrations.some(reg => {
        if (reg.teamMembers) {
          return reg.teamLeader.toString() === memberId || 
                 reg.teamMembers.some(tm => tm.student && tm.student.toString() === memberId && !tm.isUnregistered);
        }
        return reg.student && reg.student.toString() === memberId;
      });

      if (alreadyRegistered) {
        return res.status(400).json({ message: 'One or more team members are already registered' });
      }
    }

    event.registrations.push({
      teamName,
      teamLeader,
      teamMembers,
      registeredAt: Date.now(),
    });
  } else {
    // Individual event validation
    const alreadyRegistered = event.registrations.find(
      (reg) => reg.student && reg.student.toString() === req.user._id.toString()
    );

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'Already registered' });
    }

    event.registrations.push({
      student: req.user._id,
      mobileNo,
      email: email || req.user.email,
    });
  }

  await event.save();
  res.status(201).json({ message: 'Successfully registered' });
};

// @desc    Get classmates for team selection
// @route   GET /api/users/classmates
// @access  Private (Student)
const getClassmates = async (req, res) => {
  try {
    if (!req.user.studentDetails || !req.user.studentDetails.branch || !req.user.studentDetails.class) {
      return res.status(400).json({ message: 'Please complete your profile first' });
    }

    const classmates = await User.find({
      role: 'student',
      collegeName: req.user.collegeName,
      'studentDetails.branch': req.user.studentDetails.branch,
      'studentDetails.class': req.user.studentDetails.class,
      _id: { $ne: req.user._id }
    }).select('name studentDetails email');

    res.json(classmates);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch classmates' });
  }
};

// @desc    Unenroll from an event
// @route   POST /api/events/:id/unenroll
// @access  Private (Student)
const unenrollEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check deadline
  const deadline = new Date(`${event.date.toISOString().split('T')[0]}T${event.time}`);
  if (new Date() > deadline) {
    return res.status(400).json({ message: 'Cannot unregister from expired event' });
  }

  if (event.isGroupEvent) {
    // Find team registration where user is part of
    let found = false;
    for (let reg of event.registrations) {
      if (reg.teamLeader && reg.teamLeader.toString() === req.user._id.toString()) {
        // If user is team leader, remove entire team
        const index = event.registrations.indexOf(reg);
        event.registrations.splice(index, 1);
        found = true;
        break;
      } else if (reg.teamMembers) {
        // If user is team member, mark as unregistered
        const memberIndex = reg.teamMembers.findIndex(
          m => m.student && m.student.toString() === req.user._id.toString()
        );
        if (memberIndex !== -1) {
          reg.teamMembers[memberIndex].isUnregistered = true;
          found = true;
          break;
        }
      }
    }

    if (!found) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }
  } else {
    // Individual event
    const registrationIndex = event.registrations.findIndex(
      (reg) => reg.student && reg.student.toString() === req.user._id.toString()
    );

    if (registrationIndex === -1) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    event.registrations.splice(registrationIndex, 1);
  }

  await event.save();
  res.json({ message: 'Successfully unregistered' });
};

// @desc    Get event registrations (CSV export logic would go here)
// @route   GET /api/events/:id/registrations
// @access  Private (Organizer/Admin)
const getRegistrations = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('registrations.student', 'name studentDetails email')
    .populate('registrations.teamLeader', 'name studentDetails email')
    .populate('registrations.teamMembers.student', 'name studentDetails email');

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if authorized
  if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  res.json(event.registrations);
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer/Admin)
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if authorized (only owner or admin can delete)
  if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  await event.deleteOne();
  res.json({ message: 'Event removed' });
};

// @desc    Toggle pause event
// @route   PUT /api/events/:id/pause
// @access  Private (Organizer)
const togglePauseEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if authorized
  if (event.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  event.isPaused = !event.isPaused;
  await event.save();

  res.json(event);
};

// @desc    Update event winners
// @route   PUT /api/events/:id/winners
// @access  Private (Organizer)
const updateWinners = async (req, res) => {
  const { winners } = req.body;
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if authorized
  if (event.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  event.winners = winners.filter(w => w.name && w.name.trim() !== '');
  await event.save();

  res.json(event);
};

module.exports = {
  createEvent,
  getEvents,
  enrollEvent,
  getRegistrations,
  deleteEvent,
  togglePauseEvent,
  updateWinners,
  unenrollEvent,
  getClassmates,
};
