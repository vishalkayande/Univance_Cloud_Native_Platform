import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { LayoutGrid, Building2, Users, Search, MapPin, Calendar, Clock, ChevronRight, Info, CreditCard, Trophy, User, Plus } from 'lucide-react';
import { API_URL } from '../apiConfig';

const StudentDashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('institute');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [selectedEventForLeaderboard, setSelectedEventForLeaderboard] = useState(null);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedEventForTeam, setSelectedEventForTeam] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [teamFormData, setTeamFormData] = useState({
    teamName: '',
    teamMembers: [],
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [memberSearchQueries, setMemberSearchQueries] = useState([]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);

  useEffect(() => {
    // Only show modal if studentDetails are completely missing or branch is not set
    if (user && user.role === 'student' && (!user.studentDetails || !user.studentDetails.branch)) {
      setShowProfileModal(true);
    } else {
      setShowProfileModal(false);
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdownIndex(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/events?level=${activeTab}&college=${user.collegeName}`);
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.collegeName) {
      fetchEvents();
    }
  }, [activeTab, user]);

  const handleRegister = async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (event?.isGroupEvent) {
      // Open team registration modal
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        const res = await axios.get(`${API_URL}/api/users/classmates`, config);
        setClassmates(res.data);
        
        // Initialize team members array with max size
        const initialMembers = Array(event.maxTeamSize).fill(null);
        // Add current user as first member (team leader by default)
        initialMembers[0] = {
          student: user._id,
          name: user.name,
          rollNo: user.studentDetails?.rollNo || '',
          class: user.studentDetails?.class || '',
          branch: user.studentDetails?.branch || '',
          email: user.email,
          mobileNo: user.studentDetails?.mobileNo || '',
          role: 'leader'
        };
        
        setTeamFormData({
          teamName: '',
          teamMembers: initialMembers
        });

        // Initialize search queries for each member
        setMemberSearchQueries(Array(event.maxTeamSize).fill(''));
        
        setSelectedEventForTeam(event);
        setShowTeamModal(true);
      } catch (err) {
        console.error('Error fetching classmates:', err);
        alert('Failed to load classmates');
      }
    } else {
      // Individual event registration
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        const registrationData = {
          mobileNo: user.studentDetails?.mobileNo || '',
          email: user.email
        };
        
        await axios.post(`${API_URL}/api/events/${eventId}/enroll`, registrationData, config);
        alert('Successfully registered for the event!');
        fetchEvents(); // Refresh events to show "Registered" status
      } catch (err) {
        console.error('Registration Error:', err);
        alert(err.response?.data?.message || 'Failed to register for event');
      }
    }
  };

  const handleTeamRegister = async () => {
    if (!teamFormData.teamName.trim()) {
      alert('Please enter team name');
      return;
    }

    // Filter out null members and check min team size
    const validMembers = teamFormData.teamMembers.filter(m => m !== null);
    if (validMembers.length < (selectedEventForTeam?.minTeamSize || 2)) {
      alert(`Team must have at least ${selectedEventForTeam?.minTeamSize || 2} members`);
      return;
    }

    // Check if there's a team leader
    const hasLeader = validMembers.some(m => m.role === 'leader');
    if (!hasLeader) {
      alert('Please select a team leader');
      return;
    }

    setSubmitting(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const teamLeader = validMembers.find(m => m.role === 'leader');
      const teamMembers = validMembers.map(m => ({
        student: m.student,
        name: m.name,
        rollNo: m.rollNo,
        class: m.class,
        branch: m.branch,
        email: m.email,
        mobileNo: m.mobileNo
      }));
      
      const registrationData = {
        teamName: teamFormData.teamName,
        teamLeader: teamLeader.student,
        teamMembers
      };
      
      await axios.post(`${API_URL}/api/events/${selectedEventForTeam._id}/enroll`, registrationData, config);
      alert('Team registered successfully!');
      setShowTeamModal(false);
      fetchEvents();
    } catch (err) {
      console.error('Team Registration Error:', err);
      alert(err.response?.data?.message || 'Failed to register team');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectMember = (slotIndex, student) => {
    const newMembers = [...teamFormData.teamMembers];
    if (student) {
      newMembers[slotIndex] = {
        student: student._id,
        name: student.name,
        rollNo: student.studentDetails?.rollNo || '',
        class: student.studentDetails?.class || '',
        branch: student.studentDetails?.branch || '',
        email: student.email,
        mobileNo: student.studentDetails?.mobileNo || '',
        role: slotIndex === 0 ? 'leader' : 'member' // First member is leader by default
      };
    } else {
      newMembers[slotIndex] = null;
    }
    setTeamFormData({ ...teamFormData, teamMembers: newMembers });
  };

  const handleSetRole = (slotIndex, role) => {
    const newMembers = [...teamFormData.teamMembers];
    if (newMembers[slotIndex]) {
      if (role === 'leader') {
        // If setting to leader, unset all other leaders
        newMembers.forEach((m, idx) => {
          if (m && idx !== slotIndex) {
            m.role = 'member';
          }
        });
      }
      newMembers[slotIndex].role = role;
    }
    setTeamFormData({ ...teamFormData, teamMembers: newMembers });
  };

  // Get all selected student IDs
  const getSelectedStudentIds = () => {
    return teamFormData.teamMembers
      .filter(m => m !== null)
      .map(m => m.student);
  };

  // Filter classmates based on search query
  const getFilteredClassmates = (searchQuery) => {
    if (!searchQuery.trim()) return classmates;
    const query = searchQuery.toLowerCase();
    return classmates.filter(classmate => 
      classmate.name.toLowerCase().includes(query) ||
      classmate.studentDetails?.rollNo?.toLowerCase().includes(query)
    );
  };

  const handleUnenroll = async (eventId) => {
    if (!window.confirm('Are you want to unregister the event?')) {
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      await axios.post(`${API_URL}/api/events/${eventId}/unenroll`, {}, config);
      alert('Successfully unregistered from the event!');
      fetchEvents(); // Refresh events to show "Register" status again
    } catch (err) {
      console.error('Unenrollment Error:', err);
      alert(err.response?.data?.message || 'Failed to unregister from event');
    }
  };

  const isRegistered = (event) => {
    if (event.isGroupEvent) {
      return event.registrations?.some(reg => {
        if (reg.teamLeader) {
          // Check if user is team leader
          if (reg.teamLeader === user._id || reg.teamLeader?._id === user._id) {
            return true;
          }
          // Check if user is team member (and not unregistered)
          return reg.teamMembers?.some(tm => 
            (tm.student === user._id || tm.student?._id === user._id) && !tm.isUnregistered
          );
        }
        return false;
      });
    }
    // Individual event
    return event.registrations?.some(reg => reg.student === user._id || reg.student?._id === user._id);
  };

  const getTeamRegistration = (event) => {
    if (!event.isGroupEvent) return null;
    return event.registrations?.find(reg => {
      if (reg.teamLeader) {
        if (reg.teamLeader === user._id || reg.teamLeader?._id === user._id) {
          return true;
        }
        return reg.teamMembers?.some(tm => 
          tm.student === user._id || tm.student?._id === user._id
        );
      }
      return false;
    });
  };

  const isExpired = (event) => {
    const deadline = new Date(`${event.date.split('T')[0]}T${event.time}`);
    return new Date() > deadline;
  };

  const isEligible = (event) => {
    if (event.level === 'department') {
      return event.department === 'ALL' || event.department === user?.studentDetails?.branch;
    }
    return true; // Institute and Club levels are open to all students in the college
  };

  const tabs = [
    { id: 'institute', label: 'Institute Level', icon: Building2 },
    { id: 'department', label: 'Department Level', icon: LayoutGrid },
    { id: 'club', label: 'Club Level', icon: Users },
  ];

  const getEventPriority = (event) => {
    const expired = isExpired(event);
    const registered = isRegistered(event);
    const hasWinners = event.winners && event.winners.length > 0;

    if (!registered && !expired && !hasWinners) return 1; // Live & Not Registered
    if (registered && !expired && !hasWinners) return 2;  // Registered & Live
    if (hasWinners) return 3;                             // Completed (Leaderboard)
    if (expired && !hasWinners) return 4;                // Registrations Closed
    return 5;
  };

  const filteredEvents = events
    .filter(event => 
      event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      event.organizer?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => getEventPriority(a) - getEventPriority(b));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-10 flex flex-col md:flex-row items-center justify-center gap-6">
        <img src="/logo.png" alt="CollegeSphere Logo" className="h-24 w-auto drop-shadow-md" />
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Discover <span className="text-blue-600">Events</span>
          </h1>
          <p className="text-gray-500 text-lg font-medium">Find and register for upcoming events in your college.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-6 mb-8 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-8 py-4 rounded-xl font-black text-lg transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'text-[#003B5C] hover:bg-gray-50 hover:text-blue-600'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search events by name, organizer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          />
        </div>
      </div>

      {/* Event Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-2xl h-96 animate-pulse border border-gray-100"></div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <div
              key={event._id}
              className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
            >
              {/* Event Image */}
              <div className="h-52 overflow-hidden relative">
                <img
                  src={event.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                  alt={event.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                  <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {event.category || 'Event'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    event.isGroupEvent
                      ? 'bg-purple-500/90 backdrop-blur text-white'
                      : 'bg-green-500/90 backdrop-blur text-white'
                  }`}>
                    {event.isGroupEvent ? 'Team/Group' : 'Individual'}
                  </span>
                </div>
                {event.level === 'club' && event.clubName && (
                  <div className="absolute top-4 left-4 bg-purple-100/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-purple-600 uppercase tracking-wider">
                    {event.clubName}
                  </div>
                )}
              </div>

              {/* Event Content */}
              <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition">
                  {event.name}
                </h3>

                {/* Event Description */}
                <div className="mb-4 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                    <Info className="w-3 h-3" /> Description
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                    {event.description}
                  </p>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className={`flex items-center gap-2 text-sm ${isExpired(event) ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    <Calendar className={`w-4 h-4 ${isExpired(event) ? 'text-red-500' : 'text-blue-500'}`} />
                    <span className="font-medium">Registration Deadline:</span>
                    <span>{new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isExpired(event) ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                    <Clock className={`w-4 h-4 ${isExpired(event) ? 'text-red-500' : 'text-yellow-500'}`} />
                    <span>{event.time}</span>
                    {isExpired(event) && <span className="ml-1 text-[10px] uppercase tracking-tighter">(Expired)</span>}
                  </div>
                  <div className="flex items-center text-gray-500 gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-red-500" />
                    <span className="truncate">{event.college}</span>
                  </div>
                  {event.registrationLimit > 0 && (
                    <div className="flex items-center text-gray-500 gap-2 text-sm">
                      <Users className={`w-4 h-4 ${event.registrations.length >= event.registrationLimit ? 'text-red-500' : 'text-green-500'}`} />
                      <span className="font-medium">Capacity:</span>
                      <span className={event.registrations.length >= event.registrationLimit ? 'text-red-500 font-bold' : ''}>
                        {event.registrations.length} / {event.registrationLimit}
                      </span>
                    </div>
                  )}
                </div>

                {/* UPI Details - Only shown for registered students */}
                {isRegistered(event) && event.upiId && (
                  <div className="mb-6 bg-blue-50/50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
                      <CreditCard className="w-3 h-3" /> Payment Details
                    </div>
                    <p className="text-sm font-bold text-blue-700 select-all">UPI ID: {event.upiId}</p>
                    <p className="text-[10px] text-blue-400 mt-1 italic">Please complete payment to confirm your slot.</p>
                  </div>
                )}

                {/* Team Information - For group events */}
                {event.isGroupEvent && isRegistered(event) && (() => {
                  const teamReg = getTeamRegistration(event);
                  if (!teamReg) return null;
                  
                  let leaderName = 'Team Leader';
                  if (teamReg.teamLeader) {
                    if (typeof teamReg.teamLeader === 'object') {
                      leaderName = teamReg.teamLeader.name;
                    } else if (teamReg.teamLeader.name) {
                      leaderName = teamReg.teamLeader.name;
                    }
                  }
                  
                  const isTeamLeader = (typeof teamReg.teamLeader === 'object' && teamReg.teamLeader._id === user._id) || 
                                       (typeof teamReg.teamLeader === 'string' && teamReg.teamLeader === user._id);
                  
                  return (
                    <div className="mb-6 bg-purple-50/50 p-4 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">
                        <Users className="w-3 h-3" /> Team Details
                      </div>
                      <p className="text-sm font-bold text-purple-700 mb-2">Team: {teamReg.teamName}</p>
                      <p className="text-xs text-purple-500 mb-3">
                        Registered by: {isTeamLeader ? 'You (Team Leader)' : leaderName}
                      </p>
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Team Members:</p>
                        {teamReg.teamMembers?.map((member, idx) => (
                          <div key={idx} className={`flex items-center gap-2 text-sm ${member.isUnregistered ? 'text-red-500' : 'text-gray-700'}`}>
                            <User className="w-3 h-3" />
                            <span className={member.isUnregistered ? 'line-through' : ''}>
                              ({member.rollNo || 'No Roll'}) {member.name}
                            </span>
                            {member.isUnregistered && <span className="text-xs font-bold text-red-500">(unregistered)</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Organizer Contact Details */}
                <div className="mb-6 pt-4 border-t border-gray-50">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Organizer Contact</p>
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-gray-700">{event.organizer?.name} <span className="text-[10px] text-blue-400">({event.organizer?.organizerDetails?.department || 'Dept'})</span></p>
                    <p className="text-xs text-gray-500">{event.organizer?.organizerDetails?.contactEmail || event.organizer?.email}</p>
                    <p className="text-xs text-gray-500">{event.organizer?.organizerDetails?.mobileNo || 'Contact N/A'}</p>
                  </div>
                </div>

                {/* Unregister Button */}
                {isRegistered(event) && !isExpired(event) && (
                  <button
                    onClick={() => handleUnenroll(event._id)}
                    className="mb-3 w-full flex items-center justify-center gap-2 font-black py-3 rounded-xl transition-all duration-300 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-100"
                  >
                    Unregister
                  </button>
                )}

                <button
                  onClick={() => {
                    if (event.winners && event.winners.length > 0) {
                      setSelectedEventForLeaderboard(event);
                      setShowLeaderboardModal(true);
                    } else {
                      handleRegister(event._id);
                    }
                  }}
                  disabled={(!event.winners || event.winners.length === 0) && (!isEligible(event) || isRegistered(event) || isExpired(event) || event.isPaused || (event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit))}
                  className={`mt-auto w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl transition-all duration-300 group/btn ${
                    (event.winners && event.winners.length > 0)
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg shadow-purple-200 hover:scale-[1.02]'
                      : (!isEligible(event) || isRegistered(event) || isExpired(event) || event.isPaused || (event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit))
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed grayscale'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                  }`}
                >
                  {event.winners && event.winners.length > 0
                    ? <><Trophy className="w-5 h-5 animate-bounce" /> LeaderBoard</>
                    : isRegistered(event) 
                      ? 'Registered ✓' 
                      : (isExpired(event)
                          ? 'Registrations Closed'
                          : (event.isPaused
                              ? 'Registration Paused'
                              : (event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit
                                  ? 'Registrations Full'
                                  : (!isEligible(event)
                                      ? 'Only for ' + event.department
                                      : 'Register Now'))))}
                  <ChevronRight className={`w-4 h-4 group-hover/btn:translate-x-1 transition ${event.winners && event.winners.length > 0 ? 'text-white/70' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
          <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">No events found</h3>
          <p className="text-gray-500">Try switching categories or check back later.</p>
        </div>
      )}

      {/* Profile Completion Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
              <p className="text-gray-500 mt-2">We need a few more details before you can register for events.</p>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-xs font-bold border border-red-100">
                {formError}
              </div>
            )}

            <form className="space-y-4" onSubmit={async (e) => {
              e.preventDefault();
              setSubmitting(true);
              setFormError('');
              const formData = new FormData(e.target);
              const details = Object.fromEntries(formData.entries());
              console.log('Updating profile with details:', details);
              try {
                if (!user?.token) {
                  throw new Error('Authentication token is missing. Please login again.');
                }
                const config = {
                    headers: { Authorization: `Bearer ${user.token}` }
                  };
                  console.log('Request Config:', config);
                  const response = await axios.put(`${API_URL}/api/users/profile`, details, config);
                  console.log('Update Success:', response.data);
                updateUser(response.data);
                // setShowProfileModal is now reactive to user state
              } catch (err) {
                console.error('Update Profile Error Details:', err);
                setFormError(err.response?.data?.message || err.message || 'Failed to update profile. Please check your connection.');
              } finally {
                setSubmitting(false);
              }
            }}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Branch (Dept)</label>
                  <select 
                    name="branch" 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">Select Dept</option>
                    <option value="CSE">CSE</option>
                    <option value="AIML">AIML</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="E&TC">E&TC</option>
                    <option value="MBA">MBA</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Year</label>
                  <input name="year" required placeholder="e.g. 3rd" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Class & Roll No</label>
                <div className="grid grid-cols-2 gap-4">
                  <select 
                    name="class" 
                    required 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  >
                    <option value="">Select Class</option>
                    <option value="FY A">FY A</option>
                    <option value="FY B">FY B</option>
                    <option value="SY A">SY A</option>
                    <option value="SY B">SY B</option>
                    <option value="TY A">TY A</option>
                    <option value="TY B">TY B</option>
                    <option value="B.TECH A">B.TECH A</option>
                    <option value="B.TECH B">B.TECH B</option>
                    <option value="MBA Ist">MBA Ist</option>
                    <option value="MBA 2nd">MBA 2nd</option>
                  </select>
                  <input 
                    name="rollNo" 
                    required 
                    placeholder="Roll No (e.g., CS3135)" 
                    pattern="^[A-Z]{2}\d{4}$"
                    title="Roll number must be 2 alphabets followed by 4 digits (e.g., CS3135)"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Mobile Number</label>
                <input name="mobileNo" required placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
              </div>
              <button 
                type="submit" 
                disabled={submitting}
                className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition mt-4 ${
                  submitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                }`}
              >
                {submitting ? 'Updating Profile...' : 'Save & Continue'}
              </button>

              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-gray-400 hover:text-red-500 text-xs font-medium transition"
                >
                  Not you? Logout and switch account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Registration Modal */}
      {showTeamModal && selectedEventForTeam && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Register Your Team</h2>
                <p className="text-sm text-gray-500 font-medium">{selectedEventForTeam.name}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Team size: {selectedEventForTeam.minTeamSize} - {selectedEventForTeam.maxTeamSize} members
                </p>
              </div>
              <button 
                onClick={() => setShowTeamModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleTeamRegister(); }} className="space-y-6">
              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Team Name</label>
                <input
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={teamFormData.teamName}
                  onChange={(e) => setTeamFormData({ ...teamFormData, teamName: e.target.value })}
                  placeholder="Enter team name"
                />
              </div>

              {/* Team Members */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Team Members</label>
                <div className="space-y-4">
                  {teamFormData.teamMembers.map((member, index) => (
                    <div key={index} className="flex flex-col gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-600">Member {index + 1}</span>
                        {member && (
                          <select
                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium"
                            value={member.role}
                            onChange={(e) => handleSetRole(index, e.target.value)}
                          >
                            <option value="leader">Team Leader</option>
                            <option value="member">Member</option>
                          </select>
                        )}
                      </div>
                      
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {member ? (
                          <div className="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-xl">
                            <div>
                              <p className="font-medium text-gray-800">{member.name}</p>
                              <p className="text-xs text-gray-500">
                                ({member.rollNo || 'No Roll'} • {member.class || 'No Class'})
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectMember(index, null)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                            >
                              <Plus className="w-4 h-4 rotate-45" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <input
                                type="text"
                                placeholder="Search by name or roll no..."
                                value={memberSearchQueries[index] || ''}
                                onChange={(e) => {
                                  const newQueries = [...memberSearchQueries];
                                  newQueries[index] = e.target.value;
                                  setMemberSearchQueries(newQueries);
                                  setActiveDropdownIndex(index);
                                }}
                                onFocus={() => setActiveDropdownIndex(index)}
                                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                              />
                            </div>
                            
                            {activeDropdownIndex === index && (
                              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                {/* Current user option */}
                                {!getSelectedStudentIds().includes(user._id) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSelectMember(index, {
                                        _id: user._id,
                                        name: user.name,
                                        studentDetails: user.studentDetails,
                                        email: user.email
                                      });
                                      setActiveDropdownIndex(null);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 transition"
                                  >
                                    <p className="font-medium text-gray-800">{user.name} (You)</p>
                                    <p className="text-xs text-gray-500">
                                      ({user.studentDetails?.rollNo || 'Your Roll'}) • {user.studentDetails?.class || 'No Class'}
                                    </p>
                                  </button>
                                )}
                                {/* Classmates */}
                                {getFilteredClassmates(memberSearchQueries[index])
                                  .filter(classmate => !getSelectedStudentIds().includes(classmate._id))
                                  .map(classmate => (
                                    <button
                                      key={classmate._id}
                                      type="button"
                                      onClick={() => {
                                        handleSelectMember(index, classmate);
                                        setActiveDropdownIndex(null);
                                      }}
                                      className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition"
                                    >
                                      <p className="font-medium text-gray-800">{classmate.name}</p>
                                      <p className="text-xs text-gray-500">
                                        ({classmate.studentDetails?.rollNo || 'No Roll'}) • {classmate.studentDetails?.class || 'No Class'}
                                      </p>
                                    </button>
                                  ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-4 rounded-2xl font-black text-lg shadow-lg transition-all mt-4 ${
                  submitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
                }`}
              >
                {submitting ? 'Registering Team...' : 'Register Team'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Event Leaderboard</h2>
                <p className="text-sm text-gray-500 font-medium">{selectedEventForLeaderboard?.name}</p>
              </div>
              <button 
                onClick={() => setShowLeaderboardModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {[...(selectedEventForLeaderboard?.winners || [])].sort((a,b) => a.position - b.position).map((winner) => (
                <div key={winner.position} className="group relative flex items-center gap-5 p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-purple-200 hover:shadow-xl hover:shadow-purple-50 transition-all duration-300">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm ${
                    winner.position === 1 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white shadow-yellow-100' :
                    winner.position === 2 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-white shadow-slate-100' :
                    winner.position === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-100' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : winner.position}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-black text-xl text-gray-900 leading-tight group-hover:text-purple-600 transition">{winner.name}</h4>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                        winner.position === 1 ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' :
                        winner.position === 2 ? 'bg-slate-50 text-slate-500 border border-slate-100' :
                        winner.position === 3 ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                        'bg-purple-50 text-purple-600 border border-purple-100'
                      }`}>
                        {winner.position === 1 ? 'Champion' : winner.position === 2 ? 'Runner Up' : winner.position === 3 ? '2nd Runner Up' : `Position ${winner.position}`}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-2">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                        <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center">
                          <User className="w-3 h-3 text-gray-400" />
                        </div>
                        Roll: <span className="text-gray-700">{winner.rollNo || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                        <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center">
                          <LayoutGrid className="w-3 h-3 text-gray-400" />
                        </div>
                        Class: <span className="text-gray-700">{winner.class || 'N/A'}</span>
                      </div>
                      {(selectedEventForLeaderboard?.level === 'institute' || selectedEventForLeaderboard?.level === 'club') && (
                        <div className="col-span-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-tight">
                          <div className="w-5 h-5 rounded-md bg-gray-50 flex items-center justify-center">
                            <Building2 className="w-3 h-3 text-gray-400" />
                          </div>
                          Branch: <span className="text-gray-700">{winner.branch || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowLeaderboardModal(false)}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Close Leaderboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
