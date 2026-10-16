const mongoose = require('mongoose');
const Certificate = require('../models/certificateModel');
const User = require('../models/userModel');
const Event = require('../models/eventModel');

/**
 * Persist/Sync all certificates for an event into the dedicated Certificate collection.
 * This guarantees certificates remain permanent even if the event is deleted later.
 */
const syncEventCertificates = async (eventOrId) => {
  try {
    let event = eventOrId;
    if (typeof eventOrId === 'string' || eventOrId instanceof mongoose.Types.ObjectId) {
      event = await Event.findById(eventOrId)
        .populate('organizer', 'name email organizerDetails')
        .populate('registrations.student', 'name studentDetails email')
        .populate('registrations.teamLeader', 'name studentDetails email')
        .populate('registrations.teamMembers.student', 'name studentDetails email');
    }

    if (!event) return [];

    const certsConfig = event.certificates || {};
    const allocatePart = Boolean(certsConfig.participantCertificatesAllocated);
    const allocateWin = Boolean(certsConfig.winnerCertificatesAllocated);

    if (!allocatePart && !allocateWin) {
      return [];
    }

    const eventId = event._id;
    const eventName = event.name || 'Event';
    const eventCategory = event.category || 'Technical';
    const eventLevel = event.level || 'institute';
    const eventDate = event.date;
    const eventDateText = certsConfig.eventDateText || (event.date ? new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
    const issueDateText = certsConfig.issueDateText || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    const collegeName = certsConfig.collegeName || 'Deogiri Institute of Engineering and Management Studies';
    const trustName = certsConfig.trustName || 'Marathwada Shikshan Prasarak Mandal’s';
    const autonomousText = certsConfig.autonomousText || '(An Autonomous Institute)';
    const collegeAddress = certsConfig.collegeAddress || 'Deogiri Campus, Near Hotel VITS, Railway Station Road, Chhatrapati Sambhajinagar, Maharashtra, India - 431005';
    const leftSignatoryTitle = certsConfig.leftSignatoryTitle || 'Director, DIEMS, Chh. Sambhajinagar';
    const leftSignatoryName = certsConfig.leftSignatoryName || 'Dr. Ulhas Shiurkar';
    const leftSignatoryImage = certsConfig.leftSignatoryImage || '';
    const rightSignatoryTitle = certsConfig.rightSignatoryTitle || 'Head of Events Association';
    const rightSignatoryName = certsConfig.rightSignatoryName || '';
    const rightSignatoryImage = certsConfig.rightSignatoryImage || '';
    const theme = certsConfig.theme || 'theme-imperial-navy';
    const allocatedAt = certsConfig.allocatedAt || new Date();
    const customList = certsConfig.customCertificates || [];

    // Helper to find matching User doc in DB
    const resolveUser = async ({ id, name, rollNo, email }) => {
      if (id) {
        const u = await User.findById(id);
        if (u) return u;
      }
      if (email) {
        const u = await User.findOne({ email: email.trim().toLowerCase() });
        if (u) return u;
      }
      if (name) {
        const query = { name: new RegExp(`^${name.trim()}$`, 'i'), role: 'student' };
        if (rollNo) {
          query['studentDetails.rollNo'] = new RegExp(`^${rollNo.trim()}$`, 'i');
        }
        const u = await User.findOne(query);
        if (u) return u;
        // Fallback without rollNo
        const fallback = await User.findOne({ name: new RegExp(`^${name.trim()}$`, 'i'), role: 'student' });
        if (fallback) return fallback;
      }
      if (rollNo) {
        const u = await User.findOne({ 'studentDetails.rollNo': new RegExp(`^${rollNo.trim()}$`, 'i'), role: 'student' });
        if (u) return u;
      }
      return null;
    };

    const savedCertificates = [];

    // 1. Process Winner Certificates
    if (allocateWin && event.winners && event.winners.length > 0) {
      for (const w of event.winners) {
        const pos = w.position || 1;
        const posText = pos === 1 ? '1st Place (Champion)' : pos === 2 ? '2nd Place (1st Runner Up)' : pos === 3 ? '3rd Place (2nd Runner Up)' : `Rank #${pos}`;
        const teamName = w.teamName || (w.isTeamWinner ? w.name : '');

        if (w.teamMembers && w.teamMembers.length > 0) {
          for (const tm of w.teamMembers) {
            const userDoc = await resolveUser({
              name: tm.name,
              rollNo: tm.rollNo,
            });

            const sId = userDoc ? userDoc._id.toString() : (tm._id ? tm._id.toString() : tm.name.replace(/\s+/g, '_').toLowerCase());
            const certId = `${eventId}_win_${sId}`;

            const customWin = customList.find(c =>
              c.type === 'winner' && (
                (userDoc && c.studentId && c.studentId.toString() === userDoc._id.toString()) ||
                (tm.name && c.studentName && c.studentName.trim().toLowerCase() === tm.name.trim().toLowerCase()) ||
                (tm.rollNo && c.studentRollNo && c.studentRollNo.trim().toLowerCase() === tm.rollNo.trim().toLowerCase())
              )
            );

            const certData = {
              certificateId: certId,
              student: userDoc ? userDoc._id : undefined,
              studentName: tm.name || (userDoc ? userDoc.name : 'Participant'),
              studentRollNo: tm.rollNo || (userDoc?.studentDetails?.rollNo || ''),
              studentClass: tm.class || (userDoc?.studentDetails?.class || ''),
              studentBranch: tm.branch || (userDoc?.studentDetails?.branch || ''),
              studentEmail: userDoc?.email || '',
              eventId: eventId,
              eventName: eventName,
              eventCategory: eventCategory,
              eventLevel: eventLevel,
              eventDate: eventDate,
              eventDateText: eventDateText,
              issueDateText: issueDateText,
              certificateType: 'winner',
              typeLabel: 'Certificate of Merit',
              theme: theme,
              position: pos,
              positionText: posText,
              isGroupEvent: true,
              teamName: teamName || 'Team',
              collegeName: collegeName,
              trustName: trustName,
              autonomousText: autonomousText,
              collegeAddress: collegeAddress,
              leftSignatoryTitle: leftSignatoryTitle,
              leftSignatoryName: leftSignatoryName,
              leftSignatoryImage: leftSignatoryImage,
              rightSignatoryTitle: rightSignatoryTitle,
              rightSignatoryName: rightSignatoryName,
              rightSignatoryImage: rightSignatoryImage,
              customCertificateUrl: customWin?.certificateUrl || certsConfig.winnerDriveUrl || null,
              allocatedAt: allocatedAt,
              isEventDeleted: false,
            };

            const saved = await Certificate.findOneAndUpdate(
              { certificateId: certId },
              { $set: certData },
              { upsert: true, new: true }
            );
            savedCertificates.push(saved);
          }
        } else {
          // Individual winner
          const userDoc = await resolveUser({
            id: w.student,
            name: w.name,
            rollNo: w.rollNo,
          });

          const sId = userDoc ? userDoc._id.toString() : (w._id ? w._id.toString() : (w.name || 'winner').replace(/\s+/g, '_').toLowerCase());
          const certId = `${eventId}_win_${sId}`;

          const customWin = customList.find(c =>
            c.type === 'winner' && (
              (userDoc && c.studentId && c.studentId.toString() === userDoc._id.toString()) ||
              (w.name && c.studentName && c.studentName.trim().toLowerCase() === w.name.trim().toLowerCase()) ||
              (w.rollNo && c.studentRollNo && c.studentRollNo.trim().toLowerCase() === w.rollNo.trim().toLowerCase())
            )
          );

          const certData = {
            certificateId: certId,
            student: userDoc ? userDoc._id : undefined,
            studentName: w.name || (userDoc ? userDoc.name : 'Winner'),
            studentRollNo: w.rollNo || (userDoc?.studentDetails?.rollNo || ''),
            studentClass: w.class || (userDoc?.studentDetails?.class || ''),
            studentBranch: w.branch || (userDoc?.studentDetails?.branch || ''),
            studentEmail: userDoc?.email || '',
            eventId: eventId,
            eventName: eventName,
            eventCategory: eventCategory,
            eventLevel: eventLevel,
            eventDate: eventDate,
            eventDateText: eventDateText,
            issueDateText: issueDateText,
            certificateType: 'winner',
            typeLabel: 'Certificate of Merit',
            theme: theme,
            position: pos,
            positionText: posText,
            isGroupEvent: Boolean(event.isGroupEvent || w.isTeamWinner),
            teamName: teamName || undefined,
            collegeName: collegeName,
            trustName: trustName,
            autonomousText: autonomousText,
            collegeAddress: collegeAddress,
            leftSignatoryTitle: leftSignatoryTitle,
            leftSignatoryName: leftSignatoryName,
            leftSignatoryImage: leftSignatoryImage,
            rightSignatoryTitle: rightSignatoryTitle,
            rightSignatoryName: rightSignatoryName,
            rightSignatoryImage: rightSignatoryImage,
            customCertificateUrl: customWin?.certificateUrl || certsConfig.winnerDriveUrl || null,
            allocatedAt: allocatedAt,
            isEventDeleted: false,
          };

          const saved = await Certificate.findOneAndUpdate(
            { certificateId: certId },
            { $set: certData },
            { upsert: true, new: true }
          );
          savedCertificates.push(saved);
        }
      }
    }

    // 2. Process Participant Certificates
    if (allocatePart) {
      // Gather all participants across registrations AND winners
      const participantsMap = new Map(); // key -> { name, rollNo, class, branch, email, teamName, isGroup, userDoc }

      // A. From registrations
      for (const reg of (event.registrations || [])) {
        if (event.isGroupEvent) {
          const tName = reg.teamName || 'Team';
          if (reg.teamLeader) {
            const lUser = reg.teamLeader;
            const lId = lUser._id ? lUser._id.toString() : lUser.toString();
            participantsMap.set(lId, {
              userDoc: lUser.name ? lUser : await resolveUser({ id: lId }),
              name: lUser.name || '',
              rollNo: lUser.studentDetails?.rollNo || '',
              class: lUser.studentDetails?.class || '',
              branch: lUser.studentDetails?.branch || '',
              email: lUser.email || '',
              teamName: tName,
              isGroup: true,
            });
          }
          for (const tm of (reg.teamMembers || [])) {
            if (tm.isUnregistered) continue;
            const tmUser = tm.student ? (tm.student.name ? tm.student : await resolveUser({ id: tm.student })) : await resolveUser({ name: tm.name, rollNo: tm.rollNo });
            const key = tmUser ? tmUser._id.toString() : (tm.name || 'member').trim().toLowerCase();
            participantsMap.set(key, {
              userDoc: tmUser,
              name: tm.name || (tmUser ? tmUser.name : ''),
              rollNo: tm.rollNo || (tmUser?.studentDetails?.rollNo || ''),
              class: tm.class || (tmUser?.studentDetails?.class || ''),
              branch: tm.branch || (tmUser?.studentDetails?.branch || ''),
              email: tm.email || (tmUser?.email || ''),
              teamName: tName,
              isGroup: true,
            });
          }
        } else {
          // Individual
          const u = reg.student;
          if (u) {
            const uId = u._id ? u._id.toString() : u.toString();
            participantsMap.set(uId, {
              userDoc: u.name ? u : await resolveUser({ id: uId }),
              name: u.name || '',
              rollNo: u.studentDetails?.rollNo || '',
              class: u.studentDetails?.class || '',
              branch: u.studentDetails?.branch || '',
              email: u.email || '',
              isGroup: false,
            });
          }
        }
      }

      // B. Also include all winners as participants!
      if (event.winners && event.winners.length > 0) {
        for (const w of event.winners) {
          const tName = w.teamName || (w.isTeamWinner ? w.name : '');
          if (w.teamMembers && w.teamMembers.length > 0) {
            for (const tm of w.teamMembers) {
              const tmUser = await resolveUser({ name: tm.name, rollNo: tm.rollNo });
              const key = tmUser ? tmUser._id.toString() : (tm.name || '').trim().toLowerCase();
              if (!participantsMap.has(key)) {
                participantsMap.set(key, {
                  userDoc: tmUser,
                  name: tm.name || (tmUser ? tmUser.name : ''),
                  rollNo: tm.rollNo || (tmUser?.studentDetails?.rollNo || ''),
                  class: tm.class || (tmUser?.studentDetails?.class || ''),
                  branch: tm.branch || (tmUser?.studentDetails?.branch || ''),
                  email: tmUser?.email || '',
                  teamName: tName,
                  isGroup: true,
                });
              }
            }
          } else {
            const wUser = await resolveUser({ id: w.student, name: w.name, rollNo: w.rollNo });
            const key = wUser ? wUser._id.toString() : (w.name || '').trim().toLowerCase();
            if (!participantsMap.has(key)) {
              participantsMap.set(key, {
                userDoc: wUser,
                name: w.name || (wUser ? wUser.name : ''),
                rollNo: w.rollNo || (wUser?.studentDetails?.rollNo || ''),
                class: w.class || (wUser?.studentDetails?.class || ''),
                branch: w.branch || (wUser?.studentDetails?.branch || ''),
                email: wUser?.email || '',
                teamName: tName || undefined,
                isGroup: Boolean(event.isGroupEvent || w.isTeamWinner),
              });
            }
          }
        }
      }

      // Save participant certificates
      for (const [key, p] of participantsMap.entries()) {
        const userDoc = p.userDoc;
        const studentName = p.name || (userDoc ? userDoc.name : 'Participant');
        const sId = userDoc ? userDoc._id.toString() : key.replace(/\s+/g, '_');
        const certId = `${eventId}_part_${sId}`;

        const customPart = customList.find(c =>
          c.type === 'participant' && (
            (userDoc && c.studentId && c.studentId.toString() === userDoc._id.toString()) ||
            (studentName && c.studentName && c.studentName.trim().toLowerCase() === studentName.trim().toLowerCase()) ||
            (p.rollNo && c.studentRollNo && c.studentRollNo.trim().toLowerCase() === p.rollNo.trim().toLowerCase())
          )
        );

        const certData = {
          certificateId: certId,
          student: userDoc ? userDoc._id : undefined,
          studentName: studentName,
          studentRollNo: p.rollNo || (userDoc?.studentDetails?.rollNo || ''),
          studentClass: p.class || (userDoc?.studentDetails?.class || ''),
          studentBranch: p.branch || (userDoc?.studentDetails?.branch || ''),
          studentEmail: p.email || (userDoc?.email || ''),
          eventId: eventId,
          eventName: eventName,
          eventCategory: eventCategory,
          eventLevel: eventLevel,
          eventDate: eventDate,
          eventDateText: eventDateText,
          issueDateText: issueDateText,
          certificateType: 'participant',
          typeLabel: 'Certificate of Participation',
          theme: theme,
          isGroupEvent: p.isGroup,
          teamName: p.teamName || undefined,
          collegeName: collegeName,
          trustName: trustName,
          autonomousText: autonomousText,
          collegeAddress: collegeAddress,
          leftSignatoryTitle: leftSignatoryTitle,
          leftSignatoryName: leftSignatoryName,
          leftSignatoryImage: leftSignatoryImage,
          rightSignatoryTitle: rightSignatoryTitle,
          rightSignatoryName: rightSignatoryName,
          rightSignatoryImage: rightSignatoryImage,
          customCertificateUrl: customPart?.certificateUrl || certsConfig.participantDriveUrl || null,
          allocatedAt: allocatedAt,
          isEventDeleted: false,
        };

        const saved = await Certificate.findOneAndUpdate(
          { certificateId: certId },
          { $set: certData },
          { upsert: true, new: true }
        );
        savedCertificates.push(saved);
      }
    }

    return savedCertificates;
  } catch (err) {
    console.error('Error syncing certificates for event:', err);
    return [];
  }
};

/**
 * Marks event certificates as preserved when an event is deleted.
 * Certificates are NEVER removed from MongoDB.
 */
const preserveCertificatesOnEventDelete = async (eventDoc) => {
  try {
    if (!eventDoc) return;
    // 1. Ensure any allocated certificates are persisted right before deletion
    await syncEventCertificates(eventDoc);

    // 2. Mark isEventDeleted to true so we know the event is archived/deleted,
    // but the student's certificate remains 100% active and permanent.
    await Certificate.updateMany(
      { eventId: eventDoc._id },
      { $set: { isEventDeleted: true } }
    );
  } catch (err) {
    console.error('Error preserving certificates on event delete:', err);
  }
};

/**
 * Fetch all permanent certificates belonging to a student.
 */
const getStudentCertificates = async (user) => {
  try {
    const studentId = user._id;
    const studentName = user.name || '';
    const studentRollNo = user.studentDetails?.rollNo || '';

    const queryConditions = [
      { student: studentId },
    ];

    if (studentName && studentName.trim()) {
      queryConditions.push({
        studentName: new RegExp(`^${studentName.trim()}$`, 'i'),
      });
    }

    if (studentRollNo && studentRollNo.trim() && studentName && studentName.trim()) {
      queryConditions.push({
        studentRollNo: new RegExp(`^${studentRollNo.trim()}$`, 'i'),
        studentName: new RegExp(`^${studentName.trim()}$`, 'i'),
      });
    }

    const certificates = await Certificate.find({ $or: queryConditions }).sort({ createdAt: -1 });

    // Strict filter: Exclude any certificate explicitly assigned to a different student ID
    const filtered = certificates.filter(cert => {
      if (cert.student && cert.student.toString() !== studentId.toString()) {
        return false;
      }
      return true;
    });

    // Back-link student ID if it was unlinked
    for (const cert of filtered) {
      if (!cert.student) {
        cert.student = studentId;
        await cert.save().catch(() => {});
      }
    }

    return filtered;
  } catch (err) {
    console.error('Error fetching student certificates:', err);
    return [];
  }
};

module.exports = {
  syncEventCertificates,
  preserveCertificatesOnEventDelete,
  getStudentCertificates,
};
