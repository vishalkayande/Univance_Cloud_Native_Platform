import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Building2, Users, Calendar, ShieldAlert, Trash2, CheckCircle, XCircle, ShieldCheck, LayoutGrid, Download, Trophy, User, Plus, History, Mail, Phone, CalendarDays, Clock, Search } from 'lucide-react';
import { API_URL } from '../apiConfig';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(null); // null = welcome state with big logo

  useEffect(() => {
    if (location.state?.reset) {
      setActiveTab(null);
      // Clear location state
      navigate('/', { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [orgFilter, setOrgFilter] = useState(null);
  const [studentFilter, setStudentFilter] = useState(null);
  const [studentClassFilter, setStudentClassFilter] = useState(null);
  const [eventFilter, setEventFilter] = useState(null);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);
  const [showClassStudentsModal, setShowClassStudentsModal] = useState(false);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
  const [selectedBranchForStudents, setSelectedBranchForStudents] = useState(null);
  const [classStudentSearchQuery, setClassStudentSearchQuery] = useState('');
  const [selectedEventForLeaderboard, setSelectedEventForLeaderboard] = useState(null);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const handleViewParticipants = async (event) => {
    setSelectedEventForParticipants(event);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const res = await axios.get(`${API_URL}/api/events/${event._id}/registrations`, config);
      setParticipants(res.data);
    } catch (err) {
      console.error('Error fetching participants:', err);
      alert('Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const isExpired = (event) => {
    const deadline = new Date(`${event.date.split('T')[0]}T${event.time}`);
    return new Date() > deadline;
  };

  const fetchAdminData = async () => {
    try {
      const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        const res = await axios.get(`${API_URL}/api/admin/dashboard`, config);
        setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const res = await axios.get(`${API_URL}/api/events`, config);
      setAllEvents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin') fetchAdminData();
    if (activeTab === 'events') fetchAllEvents();
  }, [user, activeTab]);

  const handleApprove = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/approve-organizer/${id}`, {}, config);
      fetchAdminData();
    } catch (err) {
      alert('Failed to approve organizer');
    }
  };

  const handleApproveEvent = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/approve-event/${id}`, {}, config);
      fetchAdminData();
    } catch (err) {
      alert('Failed to approve event');
    }
  };

  const handleRejectEvent = async (id) => {
    if (!window.confirm('Are you sure you want to reject this event?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/reject-event/${id}`, {}, config);
      fetchAdminData();
    } catch (err) {
      alert('Failed to reject event');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/api/admin/user/${id}`, config);
      fetchAdminData();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/api/admin/event/${id}`, config);
      if (activeTab === 'admin') fetchAdminData();
      if (activeTab === 'events') fetchAllEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleDownloadCSV = async (eventId, eventName, isGroupEvent) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const res = await axios.get(`${API_URL}/api/events/${eventId}/registrations`, config);
      const registrations = res.data;

      if (registrations.length === 0) {
        alert('No registrations found for this event');
        return;
      }

      let csvContent = '';
      
      if (isGroupEvent) {
        // CSV for group events
        csvContent = "Team Name,Team Leader,Team Leader Email,Team Leader Mobile,Team Leader Roll No,Team Members,Registration Date,Registration Time\n";
        
        registrations.forEach(reg => {
          const teamName = reg.teamName || 'N/A';
          const leaderName = reg.teamLeader?.name || 'N/A';
          const leaderEmail = reg.teamLeader?.email || 'N/A';
          const leaderMobile = reg.teamLeader?.studentDetails?.mobileNo || 'N/A';
          const leaderRollNo = reg.teamLeader?.studentDetails?.rollNo || 'N/A';
          
          // Build team members string
          const membersStr = (reg.teamMembers || [])
            .map(m => `${m.name} (${m.rollNo || 'No Roll'})${m.isUnregistered ? ' [Unregistered]' : ''}`)
            .join('; ');
          
          const regDateObj = reg.registeredAt ? new Date(reg.registeredAt) : null;
          const regDate = regDateObj ? regDateObj.toLocaleDateString() : 'N/A';
          const regTime = regDateObj ? regDateObj.toLocaleTimeString() : 'N/A';
          
          const row = [
            `"${teamName.replace(/"/g, '""')}"`,
            `"${leaderName.replace(/"/g, '""')}"`,
            `"${leaderEmail.replace(/"/g, '""')}"`,
            `"${leaderMobile.replace(/"/g, '""')}"`,
            `"${leaderRollNo.replace(/"/g, '""')}"`,
            `"${membersStr.replace(/"/g, '""')}"`,
            `"${regDate}"`,
            `"${regTime}"`
          ].join(",");
          csvContent += row + "\n";
        });
      } else {
        // CSV for individual events (existing format)
        csvContent = "Student Name,Email,Mobile No,Department,Year,Class,Roll No,Registration Date,Registration Time\n";
        registrations.forEach(reg => {
          const name = reg.student?.name || 'N/A';
          const email = reg.email || reg.student?.email || 'N/A';
          const mobile = reg.mobileNo || 'N/A';
          const dept = reg.student?.studentDetails?.branch || 'N/A';
          const year = reg.student?.studentDetails?.year || 'N/A';
          const className = reg.student?.studentDetails?.class || 'N/A';
          const rollNo = reg.student?.studentDetails?.rollNo || 'N/A';
          
          // Handle Registration Date and Time
          const regDateObj = reg.registeredAt ? new Date(reg.registeredAt) : null;
          const regDate = regDateObj ? regDateObj.toLocaleDateString() : 'N/A';
          const regTime = regDateObj ? regDateObj.toLocaleTimeString() : 'N/A';
          
          const row = [
            `"${name.replace(/"/g, '""')}"`,
            `"${email.replace(/"/g, '""')}"`,
            `"${mobile.replace(/"/g, '""')}"`,
            `"${dept.replace(/"/g, '""')}"`,
            `"${year.replace(/"/g, '""')}"`,
            `"${className.replace(/"/g, '""')}"`,
            `"${rollNo.replace(/"/g, '""')}"`,
            `"${regDate}"`,
            `"${regTime}"`
          ].join(",");
          csvContent += row + "\n";
        });
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${eventName.replace(/\s+/g, '_')}_registrations.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download Error:', err);
      alert('Failed to download registrations');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-6 mb-12 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-10 py-4 rounded-xl font-black text-lg transition-all ${
            activeTab === 'events' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'text-[#003B5C] hover:bg-gray-50 hover:text-blue-600'
          }`}
        >
          <Calendar className="w-6 h-6" />
          Events
        </button>
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex items-center gap-2 px-10 py-4 rounded-xl font-black text-lg transition-all ${
            activeTab === 'admin' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'text-[#003B5C] hover:bg-gray-50 hover:text-blue-600'
          }`}
        >
          <ShieldCheck className="w-6 h-6" />
          Admin
        </button>
      </div>

      {/* Conditional Content */}
      {!activeTab && (
        <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-700">
          <img src="/logo.png" alt="CollegeSphere Logo" className="w-96 h-auto mb-8 drop-shadow-2xl hover:scale-105 transition-transform duration-500" />
          <h1 className="text-6xl font-black text-gray-900 tracking-tighter mb-4">
            Welcome to <span className="text-[#003B5C]">College</span><span className="text-[#00B5AD]">Sphere</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl text-center leading-relaxed font-medium">
            Your centralized command center for academic excellence. 
            Select a module from above to manage events or access the admin console.
          </p>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-10 flex items-center gap-6">
            <img src="/logo.png" alt="CollegeSphere Logo" className="h-16 w-auto drop-shadow-sm" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">All Campus Events</h1>
              <p className="text-gray-500 mt-1">Full visibility of every event scheduled across the platform.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col">
                <div className="h-40 overflow-hidden relative">
                  <img 
                    src={event.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'} 
                    alt={event.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex flex-col gap-1 items-end">
                    <span className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-blue-600 uppercase">
                      {event.level}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                      event.isGroupEvent
                        ? 'bg-purple-500/90 backdrop-blur text-white'
                        : 'bg-green-500/90 backdrop-blur text-white'
                    }`}>
                      {event.isGroupEvent ? 'Team/Group' : 'Individual'}
                    </span>
                  </div>
                  {!event.isApproved && (
                    <span className="absolute top-4 left-4 bg-yellow-500/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase">
                      Pending Approval
                    </span>
                  )}
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-1">{event.name}</h3>
                    <div className="flex items-center gap-1">
                      {event.winners && event.winners.length > 0 && (
                        <button 
                          onClick={() => {
                            setSelectedEventForLeaderboard(event);
                            setShowLeaderboardModal(true);
                          }}
                          className="p-2 text-gray-400 hover:text-purple-600 transition"
                          title="See Leaderboard"
                        >
                          <Trophy className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                          onClick={() => handleDownloadCSV(event._id, event.name, event.isGroupEvent)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition"
                          title="Download Registrations CSV"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleViewParticipants(event)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition"
                          title="View Participants"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(event._id)}
                        className="p-2 text-gray-400 hover:text-red-500 transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-3 mb-6 pt-4 border-t border-gray-50">
                    {/* Event Dates */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                          <History className="w-3 h-3" /> Created
                        </p>
                        <p className="text-xs font-bold text-gray-600">
                          {new Date(event.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                          new Date() > new Date(`${event.date.split('T')[0]}T${event.time}`) ? 'text-red-400' : 'text-green-500'
                        }`}>
                          <CalendarDays className="w-3 h-3" /> 
                          {new Date() > new Date(`${event.date.split('T')[0]}T${event.time}`) ? 'Closed On' : 'Closing On'}
                        </p>
                        <p className={`text-xs font-bold ${
                          new Date() > new Date(`${event.date.split('T')[0]}T${event.time}`) ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    {/* Organizer Info */}
                    <div className="bg-gray-50 p-3 rounded-2xl space-y-2">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                        <User className="w-3 h-3" /> Organizer
                      </p>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-gray-800 flex items-center gap-2">
                          {event.organizer?.name}
                          <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full uppercase">
                            {event.level}
                          </span>
                        </p>
                        <div className="flex flex-col gap-0.5">
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {event.organizer?.email}
                          </p>
                          {event.organizer?.organizerDetails?.mobileNo && (
                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {event.organizer?.organizerDetails?.mobileNo}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mt-auto">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-gray-400">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" /> {event.college}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-10 flex items-center gap-6">
            <img src="/logo.png" alt="CollegeSphere Logo" className="h-16 w-auto drop-shadow-sm" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Command Center</h1>
              <p className="text-gray-500 mt-1 font-medium italic">Global management of organizers and students.</p>
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              {[1, 2].map(n => (
                <div key={n} className="bg-white h-64 rounded-3xl animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : data.length > 0 ? (
            <div className="space-y-12">
              {data.map((college) => {
                const orgBranches = [...new Set(college.organizers.map(o => o.organizerDetails?.department).filter(Boolean))];
                const studentBranches = [...new Set(college.students.map(s => s.studentDetails?.branch).filter(Boolean))];
                const studentClasses = [...new Set(college.students.map(s => s.studentDetails?.class).filter(Boolean))];
                const eventStatuses = ['PENDING', 'LIVE', 'COMPLETED'];
                const pendingEvents = college.events.filter(e => !e.isApproved);

                return (
                  <div key={college.college} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                    {/* College Header */}
                    <div className="bg-blue-600 px-8 py-6 flex items-center justify-center text-white relative">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                          <Building2 className="w-8 h-8" />
                        </div>
                        <div className="text-center">
                          <h2 className="text-2xl font-bold">{college.college}</h2>
                          <p className="text-blue-100 text-sm">{college.students.length} Students • {college.organizers.length} Organizers</p>
                        </div>
                      </div>
                      <div className="absolute right-8 bg-white/10 px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/10 hidden md:flex items-center gap-2">
                        {college.events.length} Active Events
                        {pendingEvents.length > 0 && (
                          <span className="bg-red-500 px-2 py-0.5 rounded-full text-xs font-black">
                          {pendingEvents.length} Pending
                        </span>
                        )}
                      </div>
                    </div>

                    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Organizers List */}
                      <div className="space-y-4">
                        <div className="flex flex-col gap-4 mb-4">
                          <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg uppercase tracking-tight">
                            <ShieldAlert className="w-5 h-5 text-yellow-500" />
                            Organizers
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {orgBranches.map(branch => {
                              const hasPending = college.organizers.some(org => 
                                org.organizerDetails?.department === branch && !org.isApproved
                              );
                              return (
                                <button
                                  key={branch}
                                  type=""
                                  onClick={() => setOrgFilter(orgFilter === branch ? null : branch)}
                                  className={`relative px-8 py-4 rounded-xl font-black uppercase text-sm transition-all bg-gray-50 text-gray-400 hover:bg-gray-100 hover:scale-105`}
                                >
                                  {branch}
                                  {hasPending && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {orgFilter && college.organizers
                            .filter(org => org.organizerDetails?.department === orgFilter)
                            .map(org => (
                            <div key={org._id} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-yellow-200 transition">
                                <div>
                                  <p className="font-bold text-gray-800 text-sm">{org.name}</p>
                                  <p className="text-gray-400 text-xs">{org.email}</p>
                                  <p className="text-blue-500 text-[10px] font-bold mt-1 uppercase tracking-wider">
                                    {org.organizerDetails?.department || 'Organizer'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!org.isApproved && (
                                    <button 
                                      onClick={() => handleApprove(org._id)}
                                      className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition"
                                      title="Approve Organizer"
                                    >
                                      <CheckCircle className="w-5 h-5" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleDeleteUser(org._id)}
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                                    title="Delete Organizer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          }
                        </div>
                      </div>

                      {/* Students List */}
                      <div className="space-y-4 border-x border-gray-50 px-4">
                        <div className="flex flex-col gap-4 mb-4">
                          <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg uppercase tracking-tight">
                            <Users className="w-5 h-5 text-blue-500" />
                            Students
                          </h3>
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                              {studentBranches.map(branch => (
                                <button
                                  key={branch}
                                  type=""
                                  onClick={() => {
                                    setStudentFilter(studentFilter === branch ? null : branch);
                                    setStudentClassFilter(null);
                                  }}
                                  className={`px-8 py-4 rounded-xl font-black uppercase text-sm transition-all bg-gray-50 text-gray-400 hover:bg-gray-100 hover:scale-105`}
                                >
                                  {branch}
                                </button>
                              ))}
                            </div>
                            {studentFilter && (
                              <div className="flex flex-wrap gap-2">
                                {studentClasses.filter(cls => 
                                  college.students.some(s => 
                                    s.studentDetails?.branch === studentFilter && s.studentDetails?.class === cls)
                                ).map(cls => (
                                  <button
                                    key={cls}
                                    type=""
                                    onClick={() => {
                                      setSelectedBranchForStudents(studentFilter);
                                      setSelectedClassForStudents(cls);
                                      setClassStudentSearchQuery('');
                                      setShowClassStudentsModal(true);
                                    }}
                                    className={`px-6 py-3 rounded-xl font-black uppercase text-xs transition-all bg-blue-50 text-blue-400 hover:bg-blue-100 hover:scale-105`}
                                  >
                                    {cls}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* Events List */}
                      <div className="space-y-4">
                        <div className="flex flex-col gap-4 mb-4">
                          <h3 className="font-black text-gray-900 flex items-center gap-2 text-lg uppercase tracking-tight">
                            <Calendar className="w-5 h-5 text-red-500" />
                            Events
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {eventStatuses.map(status => (
                              <button
                                key={status}
                                type=""
                                onClick={() => setEventFilter(eventFilter === status ? null : status)}
                                className={`relative px-8 py-4 rounded-xl font-black uppercase text-sm transition-all bg-gray-50 text-gray-400 hover:bg-gray-100 hover:scale-105`}
                              >
                                {status}
                                {status === 'PENDING' && pendingEvents.length > 0 && (
                                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 border border-white"></span>
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                          {eventFilter && (
                            (eventFilter === 'PENDING' 
                              ? pendingEvents
                              : college.events.filter(e => {
                                  const expired = isExpired(e);
                                  return eventFilter === 'COMPLETED' ? expired : !expired && e.isApproved;
                                })
                            ).map(event => (
                            <div key={event._id} className="bg-gray-50 p-4 rounded-2xl flex items-center justify-between border border-transparent hover:border-red-200 transition">
                                <div className="flex-1">
                                  <p className="font-bold text-gray-800 text-sm">{event.name}</p>
                                  {!event.isApproved && (
                                    <div className="mt-2 space-y-1">
                                      <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wider">
                                        Organizer: {event.organizer?.name}
                                      </p>
                                      <p className="text-[10px] text-gray-500">
                                        Dept: {event.organizer?.organizerDetails?.department} • 
                                        Mo: {event.organizer?.organizerDetails?.mobileNo}
                                      </p>
                                    </div>
                                  )}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {!event.isApproved && (
                                      <p className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-yellow-100 text-yellow-600">
                                        Pending Approval
                                      </p>
                                    )}
                                    <p className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${isExpired(event) ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-500'}`}>
                                      {isExpired(event) ? 'Completed' : 'Live'}
                                    </p>
                                    <p className="text-gray-400 text-[10px] uppercase px-2 py-0.5 bg-gray-100 rounded">{event.level}</p>
                                    <p className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                      event.isGroupEvent
                                        ? 'bg-purple-100 text-purple-600'
                                        : 'bg-green-100 text-green-600'
                                    }`}>
                                      {event.isGroupEvent ? 'Team/Group' : 'Individual'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!event.isApproved && event.status !== 'rejected' && (
                                    <>
                                      <button 
                                        onClick={() => handleApproveEvent(event._id)}
                                        className="p-1.5 text-green-600 hover:bg-green-100 rounded-lg transition"
                                        title="Approve Event"
                                      >
                                        <CheckCircle className="w-5 h-5" />
                                      </button>
                                      <button 
                                        onClick={() => handleRejectEvent(event._id)}
                                        className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition"
                                        title="Reject Event"
                                      >
                                        <XCircle className="w-5 h-5" />
                                      </button>
                                    </>
                                  )}
                                  {event.winners && event.winners.length > 0 && (
                                    <button
                                      onClick={() => {
                                        setSelectedEventForLeaderboard(event);
                                        setShowLeaderboardModal(true);
                                      }}
                                      className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                                      title="See Leaderboard"
                                    >
                                      <Trophy className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleViewParticipants(event)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="View Participants"
                                  >
                                    <Users className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteEvent(event._id)}
                                    className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                                    title="Delete Event"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
              <p className="text-gray-500">No data available yet.</p>
            </div>
          )}
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetailsModal && selectedStudentForDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Student Details</h2>
                <p className="text-sm text-gray-500 font-medium">{selectedStudentForDetails.name}</p>
              </div>
              <button 
                onClick={() => setShowStudentDetailsModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl">
                <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl">
                  {selectedStudentForDetails.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-xl text-gray-900">{selectedStudentForDetails.name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudentForDetails.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Roll No</p>
                  <p className="font-bold text-gray-800">{selectedStudentForDetails.studentDetails?.rollNo || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Class</p>
                  <p className="font-bold text-gray-800">{selectedStudentForDetails.studentDetails?.class || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Branch</p>
                  <p className="font-bold text-gray-800">{selectedStudentForDetails.studentDetails?.branch || 'N/A'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Year</p>
                  <p className="font-bold text-gray-800">{selectedStudentForDetails.studentDetails?.year || 'N/A'}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Mobile Number</p>
                <p className="font-bold text-gray-800">{selectedStudentForDetails.studentDetails?.mobileNo || 'N/A'}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">College</p>
                <p className="font-bold text-gray-800">{selectedStudentForDetails.collegeName}</p>
              </div>
            </div>

            <button
              onClick={() => setShowStudentDetailsModal(false)}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Close
            </button>
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

      {/* Participants Modal */}
      {showParticipantsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Event Participants</h2>
                <p className="text-sm text-gray-500 font-medium">{selectedEventForParticipants?.name}</p>
              </div>
              <button 
                onClick={() => setShowParticipantsModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {loadingParticipants ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  <p className="text-gray-500 mt-4 font-medium">Loading participants...</p>
                </div>
              ) : participants.length > 0 ? (
                selectedEventForParticipants?.isGroupEvent ? (
                  // Team/Group Event Display
                  <div className="space-y-4">
                    {participants.map((reg) => (
                      <div key={reg._id} className="bg-purple-50 border border-purple-100 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-black text-purple-800">Team: {reg.teamName}</h3>
                            <p className="text-xs text-purple-500 mt-1">
                              Registered on: {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Team Leader</p>
                            <p className="font-bold text-purple-700">
                              {typeof reg.teamLeader === 'object' ? reg.teamLeader.name : 'Team Leader'}
                            </p>
                            {typeof reg.teamLeader === 'object' && reg.teamLeader.studentDetails && (
                              <p className="text-xs text-purple-500">
                                ({reg.teamLeader.studentDetails.rollNo || 'No Roll'})
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="border-t border-purple-100 pt-4">
                          <p className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">Team Members:</p>
                          <div className="grid grid-cols-2 gap-3">
                            {(reg.teamMembers || []).map((member, idx) => (
                              <div key={idx} className={`p-3 bg-white rounded-xl border border-purple-100`}>
                                <p className="font-bold text-purple-800">{member.name}</p>
                                <p className="text-xs text-purple-500">
                                  Roll: {member.rollNo || 'N/A'} • Class: {member.class || 'N/A'}
                                </p>
                                {member.isUnregistered && (
                                  <p className="text-xs text-red-500 font-bold mt-1">Unregistered</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Individual Event Display
                  <div className="space-y-3">
                    {participants.map((reg, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-gray-800">{reg.student?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">
                          {reg.student?.studentDetails?.branch || 'N/A'} • {reg.student?.studentDetails?.class || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Roll: {reg.student?.studentDetails?.rollNo || 'N/A'}</p>
                        <p className="text-xs text-gray-500">
                          {reg.registeredAt ? new Date(reg.registeredAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  ))}
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <p className="text-gray-500">No participants registered yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class Students Modal */}
      {showClassStudentsModal && selectedBranchForStudents && selectedClassForStudents && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-3xl shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">
                  Class: {selectedClassForStudents}
                </h2>
                <p className="text-sm text-gray-500 font-medium">
                  Branch: {selectedBranchForStudents}
                </p>
              </div>
              <button 
                onClick={() => setShowClassStudentsModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {/* Search Box */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students by name, roll no, or mobile..."
                  value={classStudentSearchQuery}
                  onChange={(e) => setClassStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                />
              </div>
            </div>

            {/* Students List */}
            <div className="space-y-3">
              {data
                .flatMap(college => college.students)
                .filter(student => 
                  student.studentDetails?.branch === selectedBranchForStudents &&
                  student.studentDetails?.class === selectedClassForStudents
                )
                .filter(student => {
                  if (!classStudentSearchQuery.trim()) return true;
                  const query = classStudentSearchQuery.toLowerCase();
                  return (
                    student.name.toLowerCase().includes(query) ||
                    student.studentDetails?.rollNo?.toLowerCase().includes(query) ||
                    student.studentDetails?.mobileNo?.includes(query)
                  );
                })
                .map(student => (
                  <div 
                    key={student._id} 
                    className="bg-gray-50 p-5 rounded-2xl flex items-center justify-between border border-transparent hover:border-blue-200 transition cursor-pointer"
                    onClick={() => {
                      setSelectedStudentForDetails(student);
                      setShowStudentDetailsModal(true);
                    }}
                  >
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-base">{student.name}</p>
                      <p className="text-gray-500 text-sm">{student.email}</p>
                      <div className="flex flex-wrap gap-3 mt-2">
                        <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">
                          Roll: {student.studentDetails?.rollNo || 'N/A'}
                        </p>
                        <p className="text-purple-600 text-xs font-bold uppercase tracking-wider">
                          Mobile: {student.studentDetails?.mobileNo || 'N/A'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteUser(student._id);
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setShowClassStudentsModal(false)}
              className="w-full mt-8 py-4 bg-gray-900 text-white rounded-2xl font-black text-lg hover:bg-black transition-all shadow-lg shadow-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
