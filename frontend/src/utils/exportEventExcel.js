/**
 * Utility to generate and download Excel-compatible CSV reports for UniVance events.
 * Specially designed for Inter-College and Dynamic Department events.
 */

const escapeCSV = (value) => {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

export const exportEventRegistrationsToExcel = (event, registrations) => {
  if (!registrations || registrations.length === 0) {
    alert('No student registrations found for this event yet.');
    return;
  }

  const isInterCollege = event.isInterCollege || event.level === 'intercollege';
  const eventScopeText = isInterCollege
    ? 'Inter-College (Multi-Institute Open Event)'
    : `Intra-College (${event.college || 'Campus Restricted'})`;

  const eligibleDeptsText = (event.departments && event.departments.length > 0)
    ? (event.departments.includes('ALL') ? 'All Departments (Open to all branches)' : event.departments.join(', '))
    : (event.department || 'ALL');

  const eventDateStr = event.date ? new Date(event.date).toLocaleDateString() : 'N/A';
  const eventTimeStr = event.time || 'N/A';
  const organizerCollegeStr = event.college || 'Host Institute';
  const organizerNameStr = event.organizer?.name || 'Authorized Organizer';
  const organizerEmailStr = event.organizer?.email || 'N/A';
  const exportTimestamp = new Date().toLocaleString();

  // 1. Build Metadata Header Banner
  const lines = [
    ['========================================================================================'],
    ['UNIVANCE CAMPUS EVENT REGISTRATION & ATTENDANCE ROSTER'],
    ['========================================================================================'],
    [`Event Name:`, event.name || 'Untitled Event'],
    [`Event Scope:`, eventScopeText],
    [`Host / Organizing Institute:`, organizerCollegeStr],
    [`Organized By:`, `${organizerNameStr} (${organizerEmailStr})`],
    [`Eligible Department(s):`, eligibleDeptsText],
    [`Event Date & Time:`, `${eventDateStr} at ${eventTimeStr}`],
    [`Event Level:`, (event.level || 'institute').toUpperCase()],
    [`Event Format:`, event.isGroupEvent ? `Team / Group Event (Size: ${event.minTeamSize}-${event.maxTeamSize})` : 'Individual Participation'],
    [`Total Registered Entries:`, registrations.length],
    [`Report Generated On:`, exportTimestamp],
    ['========================================================================================'],
    [''], // Empty row before tabular data
  ];

  let csvContent = lines
    .map(line => line.map(col => escapeCSV(col)).join(','))
    .join('\r\n') + '\r\n';

  // 2. Build Tabular Data
  if (event.isGroupEvent) {
    // Group / Team Events
    const headers = [
      'Sr No',
      'Team Name',
      'Member Role',
      'Student Name',
      'College / Institute',
      'Department / Branch',
      'Academic Year',
      'Class / Div',
      'Roll No / PRN',
      'Email Address',
      'Contact Mobile',
      'Member Status',
      'Team Status',
      'Registration Date',
      'Registration Time',
    ];

    csvContent += headers.map(h => escapeCSV(h)).join(',') + '\r\n';

    let srNo = 1;
    registrations.forEach((reg) => {
      const teamName = reg.teamName || 'Unnamed Team';
      const teamStatus = (reg.status || 'confirmed').toUpperCase();
      const regDateObj = reg.registeredAt ? new Date(reg.registeredAt) : null;
      const regDate = regDateObj ? regDateObj.toLocaleDateString() : 'N/A';
      const regTime = regDateObj ? regDateObj.toLocaleTimeString() : 'N/A';

      // 1. Leader Row
      const leaderName = reg.teamLeader?.name || 'N/A';
      const leaderCollege = reg.teamLeader?.collegeName || organizerCollegeStr;
      const leaderDept = reg.teamLeader?.studentDetails?.branch || 'N/A';
      const leaderYear = reg.teamLeader?.studentDetails?.year || 'N/A';
      const leaderClass = reg.teamLeader?.studentDetails?.class || 'N/A';
      const leaderRollNo = reg.teamLeader?.studentDetails?.rollNo || 'N/A';
      const leaderEmail = reg.teamLeader?.email || 'N/A';
      const leaderMobile = reg.teamLeader?.studentDetails?.mobileNo || reg.mobileNo || 'N/A';

      csvContent += [
        srNo,
        teamName,
        'Team Leader',
        leaderName,
        leaderCollege,
        leaderDept,
        leaderYear,
        leaderClass,
        leaderRollNo,
        leaderEmail,
        leaderMobile,
        'Accepted (Leader)',
        teamStatus,
        regDate,
        regTime,
      ].map(escapeCSV).join(',') + '\r\n';
      srNo++;

      // 2. Team Member Rows
      (reg.teamMembers || []).forEach((m) => {
        // Skip if this member is the leader (already rendered)
        if (m.student && reg.teamLeader && m.student._id && m.student._id.toString() === reg.teamLeader._id.toString()) {
          return;
        }

        const memName = m.name || m.student?.name || 'N/A';
        const memCollege = m.college || m.student?.collegeName || leaderCollege;
        const memDept = m.branch || m.student?.studentDetails?.branch || 'N/A';
        const memYear = m.student?.studentDetails?.year || leaderYear;
        const memClass = m.class || m.student?.studentDetails?.class || 'N/A';
        const memRollNo = m.rollNo || m.student?.studentDetails?.rollNo || 'N/A';
        const memEmail = m.email || m.student?.email || 'N/A';
        const memMobile = m.mobileNo || m.student?.studentDetails?.mobileNo || 'N/A';
        const memStatus = m.isUnregistered || m.status === 'left' 
          ? 'Left Team' 
          : (m.status || 'pending').toUpperCase();

        csvContent += [
          srNo,
          teamName,
          'Team Member',
          memName,
          memCollege,
          memDept,
          memYear,
          memClass,
          memRollNo,
          memEmail,
          memMobile,
          memStatus,
          teamStatus,
          regDate,
          regTime,
        ].map(escapeCSV).join(',') + '\r\n';
        srNo++;
      });
    });
  } else {
    // Individual Participation Events
    const headers = [
      'Sr No',
      'Student Name',
      'College / Institute',
      'Department / Branch',
      'Academic Year',
      'Class / Div',
      'Roll No / PRN',
      'Email Address',
      'Contact Mobile',
      'Registration Status',
      'Registration Date',
      'Registration Time',
    ];

    csvContent += headers.map(h => escapeCSV(h)).join(',') + '\r\n';

    registrations.forEach((reg, index) => {
      const studentName = reg.student?.name || 'N/A';
      const studentCollege = reg.student?.collegeName || organizerCollegeStr;
      const dept = reg.student?.studentDetails?.branch || 'N/A';
      const year = reg.student?.studentDetails?.year || 'N/A';
      const className = reg.student?.studentDetails?.class || 'N/A';
      const rollNo = reg.student?.studentDetails?.rollNo || 'N/A';
      const email = reg.email || reg.student?.email || 'N/A';
      const mobile = reg.mobileNo || reg.student?.studentDetails?.mobileNo || 'N/A';
      const regStatus = (reg.status || 'confirmed').toUpperCase();
      const regDateObj = reg.registeredAt ? new Date(reg.registeredAt) : null;
      const regDate = regDateObj ? regDateObj.toLocaleDateString() : 'N/A';
      const regTime = regDateObj ? regDateObj.toLocaleTimeString() : 'N/A';

      csvContent += [
        index + 1,
        studentName,
        studentCollege,
        dept,
        year,
        className,
        rollNo,
        email,
        mobile,
        regStatus,
        regDate,
        regTime,
      ].map(escapeCSV).join(',') + '\r\n';
    });
  }

  // Prepend UTF-8 BOM (\uFEFF) so Excel opens UTF-8 encoded text properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const sanitizedEventName = (event.name || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
  const scopeTag = isInterCollege ? 'InterCollege' : 'IntraCollege';
  const fileName = `${sanitizedEventName}_${scopeTag}_Registrations_${new Date().toISOString().slice(0, 10)}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportEventVolunteersToExcel = (event, volunteers) => {
  if (!volunteers || volunteers.length === 0) {
    alert('No volunteers registered for this event yet.');
    return;
  }

  const isInterCollege = event.isInterCollege || event.level === 'intercollege';
  const eventScopeText = isInterCollege
    ? 'Inter-College (Multi-Institute Open Event)'
    : `Intra-College (${event.college || 'Campus Restricted'})`;

  const eventDateStr = event.date ? new Date(event.date).toLocaleDateString() : 'N/A';
  const eventTimeStr = event.time || 'N/A';
  const organizerCollegeStr = event.college || 'Host Institute';
  const organizerNameStr = event.organizer?.name || 'Authorized Organizer';
  const organizerEmailStr = event.organizer?.email || 'N/A';
  const exportTimestamp = new Date().toLocaleString();

  // 1. Build Metadata Header Banner
  const lines = [
    ['========================================================================================'],
    ['UNIVANCE OFFICIAL EVENT VOLUNTEERS & SERVICE ROSTER'],
    ['========================================================================================'],
    [`Event Name:`, event.name || 'Untitled Event'],
    [`Event Scope:`, eventScopeText],
    [`Host / Organizing Institute:`, organizerCollegeStr],
    [`Organized By:`, `${organizerNameStr} (${organizerEmailStr})`],
    [`Event Date & Time:`, `${eventDateStr} at ${eventTimeStr}`],
    [`Volunteers Required:`, event.volunteersRequired || volunteers.length],
    [`Volunteers Enrolled:`, volunteers.length],
    [`Organizer Volunteer Message:`, event.volunteerMessage || 'None provided'],
    [`Report Generated On:`, exportTimestamp],
    ['========================================================================================'],
    [''], // Empty row before tabular data
  ];

  let csvContent = lines
    .map(line => line.map(col => escapeCSV(col)).join(','))
    .join('\r\n') + '\r\n';

  // 2. Tabular Headers
  const headers = [
    'Sr No',
    'Volunteer Name',
    'College / Institute',
    'Department / Branch',
    'Academic Year',
    'Class / Div',
    'Roll No / PRN',
    'Email Address',
    'Contact Mobile',
    'Registration Date',
    'Registration Time',
    'Certificate Awarded',
    'Certificate Issue Date',
  ];

  csvContent += headers.map(h => escapeCSV(h)).join(',') + '\r\n';

  // 3. Tabular Data Rows
  volunteers.forEach((v, index) => {
    const volName = v.name || v.student?.name || 'N/A';
    const volCollege = v.college || v.student?.collegeName || organizerCollegeStr;
    const volDept = v.department || v.student?.studentDetails?.branch || 'N/A';
    const volYear = v.year || v.student?.studentDetails?.year || 'N/A';
    const volClass = v.class || v.student?.studentDetails?.class || 'N/A';
    const volRollNo = v.rollNo || v.student?.studentDetails?.rollNo || 'N/A';
    const volEmail = v.email || v.student?.email || 'N/A';
    const volMobile = v.mobileNo || v.student?.studentDetails?.mobileNo || 'N/A';

    const regDateObj = v.registeredAt ? new Date(v.registeredAt) : null;
    const regDate = regDateObj ? regDateObj.toLocaleDateString() : 'N/A';
    const regTime = regDateObj ? regDateObj.toLocaleTimeString() : 'N/A';

    const certAwarded = v.certificateAllocated ? 'YES' : 'NO';
    const certDateObj = v.certificateAllocatedAt ? new Date(v.certificateAllocatedAt) : null;
    const certDate = certDateObj ? certDateObj.toLocaleDateString() : 'N/A';

    csvContent += [
      index + 1,
      volName,
      volCollege,
      volDept,
      volYear,
      volClass,
      volRollNo,
      volEmail,
      volMobile,
      regDate,
      regTime,
      certAwarded,
      certDate,
    ].map(escapeCSV).join(',') + '\r\n';
  });

  // Prepend UTF-8 BOM so Excel opens with proper encoding
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const sanitizedEventName = (event.name || 'Event').replace(/[^a-zA-Z0-9_-]/g, '_');
  const fileName = `${sanitizedEventName}_Volunteers_Roster_${new Date().toISOString().slice(0, 10)}.csv`;

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
