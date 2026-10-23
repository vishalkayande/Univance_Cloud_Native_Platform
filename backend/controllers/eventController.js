const jwt = require('jsonwebtoken');
const Event = require('../models/eventModel');
const User = require('../models/userModel');
const Certificate = require('../models/certificateModel');
const {
  syncEventCertificates,
  preserveCertificatesOnEventDelete,
  getStudentCertificates,
} = require('../utils/certificateService');

// Helper for college equivalence
const isSameCollege = (col1, col2) => {
  if (!col1 || !col2) return false;
  const c1 = col1.trim().toLowerCase();
  const c2 = col2.trim().toLowerCase();
  if (c1 === c2) return true;
  const isDIEMS1 = c1.includes('diems') || c1.includes('deogiri');
  const isDIEMS2 = c2.includes('diems') || c2.includes('deogiri');
  if (isDIEMS1 && isDIEMS2) return true;
  return false;
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer, Admin)
const createEvent = async (req, res) => {
  const { 
    name, 
    level, 
    department, 
    departments,
    clubName, 
    category, 
    description, 
    url, 
    upiId, 
    photo, 
    date, 
    time, 
    registrationLimit,
    volunteersRequired,
    volunteerMessage,
    isGroupEvent, 
    minTeamSize, 
    maxTeamSize,
    isInterCollege 
  } = req.body;

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

  const effectiveIsInterCollege = isInterCollege === true || isInterCollege === 'true' || level === 'intercollege';

  // Normalize departments
  let finalDepartments = ['ALL'];
  if (Array.isArray(departments) && departments.length > 0) {
    finalDepartments = departments.includes('ALL') ? ['ALL'] : departments.filter(Boolean);
  } else if (department && department !== 'ALL') {
    finalDepartments = [department];
  }

  const effectiveDepartment = finalDepartments.includes('ALL') ? 'ALL' : finalDepartments.join(', ');

  const event = await Event.create({
    organizer: req.user._id,
    college: req.user.collegeName || 'Deogiri Institute of Engineering and Management Studies (DIEMS)',
    name,
    level,
    isInterCollege: effectiveIsInterCollege,
    departments: finalDepartments,
    department: effectiveDepartment,
    clubName: level === 'club' ? clubName : undefined,
    category,
    description,
    url,
    upiId,
    registrationLimit: parseInt(registrationLimit) || 0,
    volunteersRequired: parseInt(volunteersRequired) || 0,
    volunteerMessage: volunteerMessage || '',
    photo,
    date,
    time,
    isGroupEvent: isGroupEvent || false,
    minTeamSize: isGroupEvent ? parseInt(minTeamSize) : undefined,
    maxTeamSize: isGroupEvent ? parseInt(maxTeamSize) : undefined,
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    isApproved: req.user.role === 'admin' ? true : false,
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

  // Extract user from token if present in header
  if (!req.user && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (err) {
      // Invalid/expired token ignored for public get
    }
  }

  let query = {};

  if (level) {
    if (level === 'intercollege') {
      query.$or = [{ level: 'intercollege' }, { isInterCollege: true }];
    } else {
      query.level = level;
    }
  }

  // Access control based on user role
  if (!req.user) {
    query.status = 'approved';
  } else if (req.user.role === 'organizer') {
    // Organizers see all events they created
    query.organizer = req.user._id;
  } else if (req.user.role !== 'admin') {
    // Students see approved events
    query.status = 'approved';
  }

  let events = await Event.find(query)
    .populate('organizer', 'name email collegeName organizerDetails role')
    .populate('registrations.student', 'name collegeName studentDetails email')
    .populate('registrations.teamLeader', 'name collegeName studentDetails email')
    .populate('registrations.teamMembers.student', 'name collegeName studentDetails email')
    .populate('volunteers.student', 'name collegeName studentDetails email')
    .sort({ createdAt: -1 });

  // For students: apply college isolation and department eligibility
  if (req.user && req.user.role === 'student') {
    const studentCollege = req.user.collegeName;
    const studentBranch = req.user.studentDetails?.branch?.trim()?.toUpperCase();

    events = events.filter((ev) => {
      const isInter = ev.isInterCollege === true || ev.level === 'intercollege';

      // 1. College Isolation:
      // If NOT intercollege, only students of that organizer's college can see it!
      if (!isInter && !isSameCollege(ev.college, studentCollege)) {
        return false;
      }

      // If user queried a specific intra-college level, ensure it belongs to student's college
      if (level && level !== 'intercollege' && !isSameCollege(ev.college, studentCollege)) {
        return false;
      }

      // 2. Department Filtering:
      // If event restricts departments, only students from those departments should see it!
      const allowedDepts = (Array.isArray(ev.departments) && ev.departments.length > 0)
        ? ev.departments
        : (ev.department ? ev.department.split(',').map(s => s.trim()) : ['ALL']);

      const isOpenToAll = allowedDepts.includes('ALL') || allowedDepts.some(d => d.toUpperCase() === 'ALL');

      if (!isOpenToAll && studentBranch) {
        const branchMatch = allowedDepts.some(
          d => d.toUpperCase() === studentBranch
        );
        if (!branchMatch) {
          return false;
        }
      }

      return true;
    });
  }

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

  // Scope & Eligibility Check:
  // 1. Institution Check:
  // Non-intercollege events are restricted to students of the event's institute.
  const isInter = event.isInterCollege === true || event.level === 'intercollege';
  if (!isInter) {
    if (event.college && req.user.collegeName && !isSameCollege(event.college, req.user.collegeName)) {
      return res.status(403).json({ message: `This event is restricted to students of ${event.college}` });
    }
  }

  // 2. Dynamic Department Level Check:
  const allowedDepts = (Array.isArray(event.departments) && event.departments.length > 0)
    ? event.departments
    : (event.department ? event.department.split(',').map(s => s.trim()) : ['ALL']);

  const isOpenToAll = allowedDepts.includes('ALL') || allowedDepts.some(d => d.toUpperCase() === 'ALL');

  if (!isOpenToAll) {
    const studentBranch = req.user.studentDetails?.branch?.trim()?.toUpperCase();
    if (!studentBranch || !allowedDepts.some(d => d.trim().toUpperCase() === studentBranch)) {
      return res.status(403).json({ 
        message: `This event is restricted to students of: ${allowedDepts.join(', ')} department(s) only.` 
      });
    }
  }

  // Volunteer Check: If registered as a volunteer, student cannot participate as a contestant/attendee
  const isVolunteer = (event.volunteers || []).some(
    v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : '') === req.user._id.toString()
  );
  if (isVolunteer) {
    return res.status(400).json({
      message: 'You are registered as a volunteer for this event and cannot participate as a contestant/attendee.'
    });
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

    // Dynamic department check for all team members
    if (!isOpenToAll) {
      for (const m of teamMembers) {
        if (m.branch && !allowedDepts.some(d => d.trim().toUpperCase() === m.branch.trim().toUpperCase())) {
          return res.status(400).json({
            message: `Team member ${m.name || 'selected'} belongs to ${m.branch || 'another'} department. All members must be from eligible department(s): ${allowedDepts.join(', ')}.`
          });
        }
      }
    }

    // Check if any team member is registered as a volunteer or already registered in this event
    const allMemberIds = [teamLeader, ...teamMembers.map(m => m.student).filter(Boolean)];
    for (const memberId of allMemberIds) {
      const memberIsVolunteer = (event.volunteers || []).some(
        v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : '') === memberId.toString()
      );
      if (memberIsVolunteer) {
        return res.status(400).json({
          message: 'One or more selected team members are registered as volunteers for this event and cannot participate in a team.'
        });
      }

      const alreadyRegistered = event.registrations.some(reg => {
        if (reg.teamMembers) {
          return reg.teamLeader.toString() === memberId.toString() || 
                 reg.teamMembers.some(tm => tm.student && tm.student.toString() === memberId.toString() && !tm.isUnregistered && tm.status !== 'rejected');
        }
        return reg.student && reg.student.toString() === memberId.toString();
      });

      if (alreadyRegistered) {
        return res.status(400).json({ message: 'One or more team members are already registered or invited in this event' });
      }
    }

    // Team members invitation status:
    // Leader is automatically accepted; invited members are pending until they accept.
    const formattedTeamMembers = teamMembers.map((m) => {
      const isLeader = m.student && m.student.toString() === teamLeader.toString();
      return {
        student: m.student,
        name: m.name,
        college: m.college || req.user.collegeName,
        rollNo: m.rollNo,
        class: m.class,
        branch: m.branch,
        email: m.email,
        mobileNo: m.mobileNo,
        status: isLeader ? 'accepted' : 'pending',
        respondedAt: isLeader ? new Date() : undefined,
      };
    });

    const hasPendingMembers = formattedTeamMembers.some(m => m.status === 'pending');

    event.registrations.push({
      teamName,
      teamLeader,
      teamMembers: formattedTeamMembers,
      status: hasPendingMembers ? 'pending' : 'confirmed',
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
      status: 'confirmed',
    });
  }

  await event.save();
  res.status(201).json({
    message: event.isGroupEvent 
      ? 'Team registration submitted! Invitations sent to team members. Registration is pending until all members accept.' 
      : 'Successfully registered'
  });
};

// @desc    Get classmates / eligible students for team selection
// @route   GET /api/users/classmates
// @access  Private (Student)
const getClassmates = async (req, res) => {
  try {
    const { eventId } = req.query;
    let query = {
      role: 'student',
      collegeName: req.user.collegeName,
      _id: { $ne: req.user._id }
    };

    if (eventId) {
      const targetEvent = await Event.findById(eventId);
      if (targetEvent) {
        const allowedDepts = (Array.isArray(targetEvent.departments) && targetEvent.departments.length > 0)
          ? targetEvent.departments
          : (targetEvent.department ? targetEvent.department.split(',').map(s => s.trim()) : ['ALL']);

        const isOpenToAll = allowedDepts.includes('ALL') || allowedDepts.some(d => d.toUpperCase() === 'ALL');

        if (!isOpenToAll) {
          query['studentDetails.branch'] = {
            $in: allowedDepts.map(d => new RegExp(`^${d.trim()}$`, 'i'))
          };
        }
      }
    } else if (req.user.studentDetails?.branch) {
      // Default fallback
      query['studentDetails.branch'] = req.user.studentDetails.branch;
      if (req.user.studentDetails.class) {
        query['studentDetails.class'] = req.user.studentDetails.class;
      }
    }

    const classmates = await User.find(query).select('name collegeName studentDetails email');
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
        // If user is team member, mark as left/unregistered and flag team registration as rejected
        const memberIndex = reg.teamMembers.findIndex(
          m => m.student && m.student.toString() === req.user._id.toString()
        );
        if (memberIndex !== -1) {
          reg.teamMembers[memberIndex].isUnregistered = true;
          reg.teamMembers[memberIndex].status = 'left';
          reg.teamMembers[memberIndex].respondedAt = new Date();
          // Team registration becomes rejected so leader can replace the vacated spot
          reg.status = 'rejected';
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
// @access  Private (Organizer/Admin/Student Owner)
const getRegistrations = async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('organizer', 'name email collegeName organizerDetails role')
    .populate('registrations.student', 'name collegeName studentDetails email')
    .populate('registrations.teamLeader', 'name collegeName studentDetails email')
    .populate('registrations.teamMembers.student', 'name collegeName studentDetails email');

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if authorized
  if (req.user.role !== 'admin' && event.organizer._id.toString() !== req.user._id.toString()) {
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

  // Preserve all student certificates permanently before deleting event
  await preserveCertificatesOnEventDelete(event);

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

  event.winners = winners
    .filter(w => (w.name && w.name.trim() !== '') || (w.teamName && w.teamName.trim() !== ''))
    .map(w => ({
      student: w.student,
      name: w.name || w.teamName,
      rollNo: w.rollNo,
      class: w.class,
      branch: w.branch,
      isTeamWinner: Boolean(w.isTeamWinner),
      teamName: w.teamName,
      teamMembers: w.teamMembers || [],
      position: w.position,
    }));

  await event.save();
  res.json(event);
};

// @desc    Allocate / update event certificates
// @route   PUT /api/events/:id/certificates
// @access  Private (Organizer/Admin)
const updateCertificates = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res.status(404).json({ message: 'Event not found' });
  }

  // Check if authorized
  if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const {
    participantCertificatesAllocated,
    winnerCertificatesAllocated,
    theme,
    eventDateText,
    issueDateText,
    collegeName,
    trustName,
    autonomousText,
    collegeAddress,
    leftSignatoryTitle,
    leftSignatoryName,
    leftSignatoryImage,
    rightSignatoryTitle,
    rightSignatoryName,
    rightSignatoryImage,
    participantDriveUrl,
    winnerDriveUrl,
    customCertificates,
  } = req.body;

  // If winner certificates are to be allocated, check if winners exist
  if (winnerCertificatesAllocated && (!event.winners || event.winners.length === 0)) {
    return res.status(400).json({ message: 'Cannot allocate winner certificates before announcing winners' });
  }

  const isAllocatingNow = Boolean(participantCertificatesAllocated || winnerCertificatesAllocated);

  event.certificates = {
    participantCertificatesAllocated: Boolean(participantCertificatesAllocated),
    winnerCertificatesAllocated: Boolean(winnerCertificatesAllocated),
    theme: theme || event.certificates?.theme || 'theme-imperial-navy',
    allocatedAt: isAllocatingNow ? (event.certificates?.allocatedAt || new Date()) : undefined,
    eventDateText: eventDateText || event.certificates?.eventDateText || new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    issueDateText: issueDateText || event.certificates?.issueDateText || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    collegeName: collegeName || 'Deogiri Institute of Engineering and Management Studies',
    trustName: trustName || 'Marathwada Shikshan Prasarak Mandal’s',
    autonomousText: autonomousText || '(An Autonomous Institute)',
    collegeAddress: collegeAddress || 'Deogiri Campus, Near Hotel VITS, Railway Station Road, Chhatrapati Sambhajinagar, Maharashtra, India - 431005',
    leftSignatoryTitle: leftSignatoryTitle || 'Director, DIEMS, Chh. Sambhajinagar',
    leftSignatoryName: leftSignatoryName || '',
    leftSignatoryImage: leftSignatoryImage !== undefined ? leftSignatoryImage : event.certificates?.leftSignatoryImage,
    rightSignatoryTitle: rightSignatoryTitle || 'Head of Events Association',
    rightSignatoryName: rightSignatoryName || '',
    rightSignatoryImage: rightSignatoryImage !== undefined ? rightSignatoryImage : event.certificates?.rightSignatoryImage,
    participantDriveUrl: participantDriveUrl !== undefined ? participantDriveUrl : event.certificates?.participantDriveUrl,
    winnerDriveUrl: winnerDriveUrl !== undefined ? winnerDriveUrl : event.certificates?.winnerDriveUrl,
    customCertificates: customCertificates !== undefined ? customCertificates : (event.certificates?.customCertificates || []),
  };

  await event.save();
  // Persist permanent student certificates
  await syncEventCertificates(event);
  res.json(event);
};

// @desc    Get pending team invitations for the logged-in student
// @route   GET /api/events/team-invitations
// @access  Private (Student)
const getTeamInvitations = async (req, res) => {
  try {
    const studentId = req.user._id.toString();

    // Find all events with team registrations
    const events = await Event.find({
      isGroupEvent: true,
      'registrations.teamMembers.student': req.user._id,
    })
      .populate('organizer', 'name email organizerDetails')
      .populate('registrations.teamLeader', 'name email studentDetails');

    const invitations = [];

    for (const event of events) {
      for (const reg of event.registrations) {
        if (!reg.teamMembers || !reg.teamLeader) continue;

        const myMemberSlot = reg.teamMembers.find(
          (m) => m.student && m.student.toString() === studentId && !m.isUnregistered
        );

        if (myMemberSlot && myMemberSlot.status === 'pending') {
          invitations.push({
            eventId: event._id,
            eventName: event.name,
            eventPhoto: event.photo,
            eventDate: event.date,
            eventTime: event.time,
            eventCategory: event.category,
            eventLevel: event.level,
            eventDepartment: event.department,
            eventCollege: event.college,
            teamName: reg.teamName,
            teamLeader: reg.teamLeader,
            teamMembers: reg.teamMembers,
            registrationId: reg._id,
            slotStatus: myMemberSlot.status,
            overallStatus: reg.status,
          });
        }
      }
    }

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    res.status(500).json({ message: 'Failed to fetch team invitations' });
  }
};

// @desc    Accept or reject team invitation
// @route   PUT /api/events/:id/team-invitation/respond
// @access  Private (Student)
const respondTeamInvitation = async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'reject'
    const studentId = req.user._id.toString();

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be accept or reject' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find the registration containing this student
    let foundRegistration = null;
    let foundMemberSlot = null;

    for (const reg of event.registrations) {
      if (reg.teamMembers) {
        const slot = reg.teamMembers.find(
          (m) => m.student && m.student.toString() === studentId && !m.isUnregistered
        );
        if (slot) {
          foundRegistration = reg;
          foundMemberSlot = slot;
          break;
        }
      }
    }

    if (!foundRegistration || !foundMemberSlot) {
      return res.status(404).json({ message: 'Team invitation not found' });
    }

    if (action === 'accept') {
      // Check if student is volunteering in this event
      const isVolunteer = (event.volunteers || []).some(
        v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : '') === studentId
      );
      if (isVolunteer) {
        return res.status(400).json({
          message: 'You are registered as a volunteer for this event and cannot accept a participation invitation.'
        });
      }

      foundMemberSlot.status = 'accepted';
      foundMemberSlot.respondedAt = new Date();

      // Check if all active team members have accepted
      const activeMembers = foundRegistration.teamMembers.filter(m => !m.isUnregistered);
      const allAccepted = activeMembers.every(m => m.status === 'accepted');

      if (allAccepted) {
        foundRegistration.status = 'confirmed';
      }
    } else {
      // Reject
      foundMemberSlot.status = 'rejected';
      foundMemberSlot.respondedAt = new Date();
      foundRegistration.status = 'rejected';
    }

    await event.save();

    res.json({
      message: action === 'accept' ? 'Team invitation accepted!' : 'Team invitation rejected',
      registrationStatus: foundRegistration.status,
      memberStatus: foundMemberSlot.status,
    });
  } catch (error) {
    console.error('Error responding to team invitation:', error);
    res.status(500).json({ message: 'Failed to respond to team invitation' });
  }
};

// @desc    Replace a rejected team member (leader fills the remaining spot)
// @route   PUT /api/events/:id/replace-team-member
// @access  Private (Student - Leader)
const replaceTeamMember = async (req, res) => {
  try {
    const { rejectedMemberIndex, rejectedStudentId, newStudent } = req.body;
    const leaderId = req.user._id.toString();

    if (!newStudent || !newStudent.student) {
      return res.status(400).json({ message: 'Please provide new student details' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find registration where caller is the team leader
    const reg = event.registrations.find(
      (r) => r.teamLeader && r.teamLeader.toString() === leaderId
    );

    if (!reg) {
      return res.status(403).json({ message: 'You are not the team leader for this event' });
    }

    // If event is department level, verify new student belongs to the department
    if (event.level === 'department' && event.department && event.department !== 'ALL') {
      const eventDept = event.department.trim().toUpperCase();
      if (newStudent.branch && newStudent.branch.trim().toUpperCase() !== eventDept) {
        return res.status(400).json({
          message: `The replacement member must be from the ${event.department} department.`
        });
      }
    }

    // Check if new student is a volunteer in this event
    const newStudentIdStr = newStudent.student.toString();
    const newStudentIsVolunteer = (event.volunteers || []).some(
      v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : '') === newStudentIdStr
    );
    if (newStudentIsVolunteer) {
      return res.status(400).json({
        message: 'The selected student is registered as a volunteer for this event and cannot join a team.'
      });
    }

    // Check if new student is already registered in this event
    const alreadyRegistered = event.registrations.some((r) => {
      if (r.teamMembers) {
        return (
          (r.teamLeader && r.teamLeader.toString() === newStudentIdStr) ||
          r.teamMembers.some((tm) => tm.student && tm.student.toString() === newStudentIdStr && !tm.isUnregistered && tm.status !== 'rejected' && tm.status !== 'left')
        );
      }
      return r.student && r.student.toString() === newStudentIdStr;
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: 'The selected student is already registered or invited in this event' });
    }

    // Find the slot to replace
    let targetSlotIndex = -1;
    if (rejectedMemberIndex !== undefined && rejectedMemberIndex >= 0 && rejectedMemberIndex < reg.teamMembers.length) {
      targetSlotIndex = rejectedMemberIndex;
    } else if (rejectedStudentId) {
      targetSlotIndex = reg.teamMembers.findIndex(
        (m) => m.student && m.student.toString() === rejectedStudentId.toString()
      );
    } else {
      targetSlotIndex = reg.teamMembers.findIndex((m) => m.status === 'rejected' || m.status === 'left' || m.isUnregistered);
    }

    if (targetSlotIndex === -1) {
      return res.status(400).json({ message: 'No slot found to replace' });
    }

    // Update slot with new student
    reg.teamMembers[targetSlotIndex] = {
      student: newStudent.student,
      name: newStudent.name,
      rollNo: newStudent.rollNo || '',
      class: newStudent.class || '',
      branch: newStudent.branch || '',
      email: newStudent.email || '',
      mobileNo: newStudent.mobileNo || '',
      status: 'pending',
      isUnregistered: false,
    };

    // Reset overall team status to pending while new invitation is out
    reg.status = 'pending';

    await event.save();

    res.json({
      message: 'Invitation sent to replacement team member. Status is pending.',
      registration: reg,
    });
  } catch (error) {
    console.error('Error replacing team member:', error);
    res.status(500).json({ message: 'Failed to replace team member' });
  }
};

// @desc    Get certificates allocated for current logged-in student
// @route   GET /api/events/my-certificates
// @access  Private (Student)
const getMyCertificates = async (req, res) => {
  try {
    // 1. Sync any active events that have certificates allocated
    const eventsWithCerts = await Event.find({
      $or: [
        { 'certificates.participantCertificatesAllocated': true },
        { 'certificates.winnerCertificatesAllocated': true },
        { 'certificates.volunteerCertificatesAllocated': true },
        { 'volunteers.certificateAllocated': true },
      ],
    });
    for (const ev of eventsWithCerts) {
      await syncEventCertificates(ev);
    }

    // 2. Retrieve all student's certificates from the permanent Certificate collection
    const myCertificates = await getStudentCertificates(req.user);

    res.json(myCertificates);
  } catch (error) {
    console.error('Error fetching certificates:', error);
    res.status(500).json({ message: 'Failed to fetch certificates' });
  }
};

// @desc    Register as a volunteer for an event
// @route   POST /api/events/:id/volunteer
// @access  Private (Student)
const volunteerForEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check deadline
    const deadline = new Date(`${event.date.toISOString().split('T')[0]}T${event.time}`);
    if (new Date() > deadline) {
      return res.status(400).json({ message: 'Event registration deadline has passed' });
    }

    // Check if paused
    if (event.isPaused) {
      return res.status(400).json({ message: 'Event registration is paused by organizer' });
    }

    // Check if event accepts volunteers
    const volunteersRequired = event.volunteersRequired || 0;
    if (volunteersRequired <= 0) {
      return res.status(400).json({ message: 'This event does not require volunteers' });
    }

    // Check capacity
    const currentVolunteers = event.volunteers || [];
    if (currentVolunteers.length >= volunteersRequired) {
      return res.status(400).json({ message: 'Volunteer positions are full for this event' });
    }

    // Check if user is already volunteering
    const alreadyVolunteer = currentVolunteers.some(
      v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : '') === req.user._id.toString()
    );
    if (alreadyVolunteer) {
      return res.status(400).json({ message: 'You are already registered as a volunteer for this event' });
    }

    // Check if user is already registered as a participant
    const isParticipant = (event.registrations || []).some(reg => {
      if (reg.teamMembers) {
        return (reg.teamLeader && reg.teamLeader.toString() === req.user._id.toString()) ||
               reg.teamMembers.some(tm => tm.student && tm.student.toString() === req.user._id.toString() && !tm.isUnregistered && tm.status !== 'rejected' && tm.status !== 'left');
      }
      return reg.student && reg.student.toString() === req.user._id.toString();
    });

    if (isParticipant) {
      return res.status(400).json({
        message: 'You are currently enrolled as a participant in this event. Please cancel your event registration first if you wish to volunteer instead.'
      });
    }

    // Scope check: Intra-college events restricted to host college
    const isInter = event.isInterCollege === true || event.level === 'intercollege';
    if (!isInter) {
      if (event.college && req.user.collegeName && !isSameCollege(event.college, req.user.collegeName)) {
        return res.status(403).json({ message: `Volunteering is restricted to students of ${event.college}` });
      }
    }

    // Add volunteer
    const volunteerEntry = {
      student: req.user._id,
      name: req.user.name,
      college: req.user.collegeName || event.college,
      department: req.user.studentDetails?.branch || '',
      class: req.user.studentDetails?.class || '',
      rollNo: req.user.studentDetails?.rollNo || '',
      year: req.user.studentDetails?.year || '',
      email: req.user.email,
      mobileNo: req.body.mobileNo || req.user.studentDetails?.mobileNo || '',
      registeredAt: new Date(),
      certificateAllocated: false,
    };

    event.volunteers.push(volunteerEntry);
    await event.save();

    res.status(201).json({
      message: 'Successfully registered as an event volunteer!',
      volunteerMessage: event.volunteerMessage || '',
      volunteersCount: event.volunteers.length,
      volunteersRequired: event.volunteersRequired,
    });
  } catch (error) {
    console.error('Error volunteering for event:', error);
    res.status(500).json({ message: 'Failed to register as volunteer' });
  }
};

// @desc    Opt-out from volunteering for an event (allowed until 24 hours before deadline)
// @route   POST /api/events/:id/volunteer-optout
// @access  Private (Student)
const optOutVolunteer = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const volunteerIndex = (event.volunteers || []).findIndex(
      v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : '') === req.user._id.toString()
    );

    if (volunteerIndex === -1) {
      return res.status(400).json({ message: 'You are not registered as a volunteer for this event' });
    }

    // 24-hour deadline rule:
    // Opting out works till 24 hours left of event registration deadline
    const deadline = new Date(`${event.date.toISOString().split('T')[0]}T${event.time}`);
    const now = new Date();
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursRemaining < 24) {
      return res.status(400).json({
        message: 'Opting out from volunteering is only allowed up to 24 hours prior to the event registration deadline. Less than 24 hours remain.'
      });
    }

    // Remove from volunteers
    event.volunteers.splice(volunteerIndex, 1);

    // Delete any issued volunteer certificate if one was created
    await Certificate.deleteOne({
      eventId: event._id,
      certificateType: 'volunteer',
      student: req.user._id,
    });

    await event.save();

    res.json({
      message: 'Successfully opted out of volunteering. You can now participate in the event or volunteer again if slots are available.'
    });
  } catch (error) {
    console.error('Error opting out of volunteering:', error);
    res.status(500).json({ message: 'Failed to opt-out of volunteering' });
  }
};

// @desc    Get all volunteers for an event (for organizer and admin)
// @route   GET /api/events/:id/volunteers
// @access  Private (Organizer, Admin)
const getEventVolunteers = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email collegeName organizerDetails')
      .populate('volunteers.student', 'name collegeName studentDetails email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && event.organizer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      volunteers: event.volunteers || [],
      volunteersRequired: event.volunteersRequired || 0,
      volunteerMessage: event.volunteerMessage || '',
      eventName: event.name,
      eventDate: event.date,
      eventTime: event.time,
      college: event.college,
    });
  } catch (error) {
    console.error('Error fetching event volunteers:', error);
    res.status(500).json({ message: 'Failed to fetch volunteers' });
  }
};

// @desc    Update volunteer message and/or required volunteer count
// @route   PUT /api/events/:id/volunteer-config
// @access  Private (Organizer, Admin)
const updateVolunteerConfig = async (req, res) => {
  try {
    const { volunteerMessage, volunteersRequired } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (volunteerMessage !== undefined) {
      event.volunteerMessage = volunteerMessage;
    }

    if (volunteersRequired !== undefined) {
      event.volunteersRequired = Math.max(0, parseInt(volunteersRequired) || 0);
    }

    await event.save();

    res.json({
      message: 'Volunteer configuration updated successfully',
      volunteerMessage: event.volunteerMessage,
      volunteersRequired: event.volunteersRequired,
    });
  } catch (error) {
    console.error('Error updating volunteer config:', error);
    res.status(500).json({ message: 'Failed to update volunteer config' });
  }
};

// @desc    Selectively allocate volunteering certificates to chosen students
// @route   PUT /api/events/:id/volunteer-certificates
// @access  Private (Organizer, Admin)
const allocateVolunteerCertificates = async (req, res) => {
  try {
    const { selectedStudentIds } = req.body; // Array of student user IDs
    const event = await Event.findById(req.params.id)
      .populate('volunteers.student', 'name email studentDetails collegeName');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (req.user.role !== 'admin' && event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const selectedSet = new Set((selectedStudentIds || []).map(id => id.toString()));

    for (const vol of (event.volunteers || [])) {
      const volStudentId = vol.student?._id ? vol.student._id.toString() : (vol.student ? vol.student.toString() : '');
      const isSelected = selectedSet.has(volStudentId) || (vol._id && selectedSet.has(vol._id.toString()));

      vol.certificateAllocated = isSelected;
      if (isSelected && !vol.certificateAllocatedAt) {
        vol.certificateAllocatedAt = new Date();
      }
    }

    event.certificates = event.certificates || {};
    event.certificates.volunteerCertificatesAllocated = (event.volunteers || []).some(v => v.certificateAllocated);

    await event.save();

    // Persist to Certificate collection
    await syncEventCertificates(event);

    res.json({
      message: 'Volunteer certificates updated successfully',
      volunteers: event.volunteers,
    });
  } catch (error) {
    console.error('Error allocating volunteer certificates:', error);
    res.status(500).json({ message: 'Failed to allocate volunteer certificates' });
  }
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
};
