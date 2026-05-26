import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Users, Download, Trash2, ExternalLink, Calendar as CalendarIcon, Clock, Tag, Pause, Play, Trophy, LayoutGrid } from 'lucide-react';
import { API_URL } from '../apiConfig';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [activeTab, setActiveTab] = useState(null); // null = welcome state

  useEffect(() => {
    if (location.state?.reset) {
      setActiveTab(null);
      // Clear location state
      navigate('/', { replace: true, state: {} });
    }
  }, [location, navigate]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: 'institute',
    category: '',
    description: '',
    url: '',
    upiId: '',
    photo: '',
    date: '',
    time: '',
    department: 'ALL',
    registrationLimit: 0,
    clubName: '',
    isGroupEvent: false,
    minTeamSize: 2,
    maxTeamSize: 4,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [selectedEventForWinners, setSelectedEventForWinners] = useState(null);
  const [winnerEntries, setWinnerEntries] = useState([
    { name: '', position: 1 },
    { name: '', position: 2 },
    { name: '', position: 3 },
    { name: '', position: 4 },
    { name: '', position: 5 },
  ]);
  const [isSeeWinnersMode, setIsSeeWinnersMode] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const isExpired = (event) => {
    const deadline = new Date(`${event.date.split('T')[0]}T${event.time}`);
    return new Date() > deadline;
  };

  const handleAnnounceWinners = async (event) => {
    setSelectedEventForWinners(event);
    setIsSeeWinnersMode(false);
    setLoadingRegistrations(true);
    
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const res = await axios.get(`${API_URL}/api/events/${event._id}/registrations`, config);
      const sortedStudents = res.data
        .map(reg => ({
          name: reg.student?.name || 'Unknown',
          studentId: reg.student?._id,
          rollNo: reg.student?.studentDetails?.rollNo,
          class: reg.student?.studentDetails?.class,
          branch: reg.student?.studentDetails?.branch
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setRegisteredStudents(sortedStudents);
      
      const existingWinners = event.winners || [];
      const entries = [1, 2, 3, 4, 5].map(pos => {
        const winner = existingWinners.find(w => w.position === pos);
        return { 
          name: winner ? winner.name : '', 
          position: pos,
          rollNo: winner ? winner.rollNo : '',
          class: winner ? winner.class : '',
          branch: winner ? winner.branch : ''
        };
      });
      setWinnerEntries(entries);
      setShowWinnersModal(true);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      alert('Failed to load registered students');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleSeeWinners = (event) => {
    setSelectedEventForWinners(event);
    setIsSeeWinnersMode(true);
    setShowWinnersModal(true);
  };

  const submitWinners = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };

      // Enrich winners with data from registeredStudents state
      const enrichedWinners = winnerEntries.map(entry => {
        if (!entry.name || entry.name.trim() === '') return entry;
        
        const student = registeredStudents.find(s => s.name === entry.name);

        if (student) {
          return {
            ...entry,
            rollNo: student.rollNo || entry.rollNo,
            class: student.class || entry.class,
            branch: student.branch || entry.branch
          };
        }
        return entry;
      });

      await axios.put(`${API_URL}/api/events/${selectedEventForWinners._id}/winners`, { winners: enrichedWinners }, config);
      setShowWinnersModal(false);
      fetchAllEvents();
      alert('Winners updated successfully!');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update winners');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File size too large. Please select an image under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/events?college=${user.collegeName}`);
      // Filter events to only show those organized by current user
      const myEvents = res.data.filter(event => 
        event.organizer === user._id || event.organizer?._id === user._id
      );
      setEvents(myEvents);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAllEvents();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      await axios.post(`${API_URL}/api/events`, formData, config);
      setShowModal(false);
      fetchAllEvents(); // Refresh events list
      setFormData({ // Reset form data
        name: '',
        level: 'institute',
        category: '',
        description: '',
        url: '',
        upiId: '',
        photo: '',
        date: '',
        time: '',
        department: 'ALL',
        registrationLimit: 0,
        clubName: '',
        isGroupEvent: false,
        minTeamSize: 2,
        maxTeamSize: 4,
      });
      setImagePreview(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create event');
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        await axios.delete(`${API_URL}/api/events/${eventId}`, config);
        fetchAllEvents(); // Refresh after delete
      } catch (err) {
        console.error('Delete Error:', err);
        alert(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  const handleTogglePause = async (eventId) => {
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      await axios.put(`${API_URL}/api/events/${eventId}/pause`, {}, config);
      fetchAllEvents(); // Refresh list
    } catch (err) {
      console.error('Toggle Pause Error:', err);
      alert(err.response?.data?.message || 'Failed to update event status');
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

      // Download file
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
      alert(err.response?.data?.message || 'Failed to download registrations');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Navigation Tabs */}
      <div className="flex justify-center gap-6 mb-12 bg-white p-2.5 rounded-2xl shadow-sm border border-gray-100 w-fit mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex items-center gap-2 px-10 py-4 rounded-xl font-black text-lg transition-all ${
            activeTab === 'dashboard' 
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
              : 'text-[#003B5C] hover:bg-gray-50 hover:text-blue-600'
          }`}
        >
          <LayoutGrid className="w-6 h-6" />
          Dashboard
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
            Select a module from above to manage events or access the organizer console.
          </p>
        </div>
      )}

      {activeTab === 'dashboard' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
            <div className="flex items-center gap-6">
              <img src="/logo.png" alt="CollegeSphere Logo" className="h-24 w-auto drop-shadow-md" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Organizer Dashboard</h1>
                <p className="text-gray-500 mt-1 font-medium">Manage your events and registrations for {user.collegeName}</p>
              </div>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-black text-lg shadow-lg shadow-blue-200 transition"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </button>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-blue-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Total Events</p>
              <h2 className="text-3xl font-bold text-gray-900">{events.length}</h2>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-green-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Active Events</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {events.filter(e => !isExpired(e)).length}
              </h2>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 text-red-600">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <p className="text-gray-500 text-sm font-medium">Expired Events</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {events.filter(e => isExpired(e)).length}
              </h2>
            </div>
          </div>

          {/* Event List */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h2 className="text-xl font-bold text-gray-900">Events</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Event Name</th>
                    <th className="px-6 py-4">Organizer</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4">Level & Category</th>
                    <th className="px-6 py-4">Registrations</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((event) => (
                    <tr 
                      key={event._id} 
                      className={`hover:bg-gray-50 transition group ${
                        event.status === 'pending' || event.status === 'rejected' ? 'opacity-70' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-gray-900">
                              {event.name}
                            </div>
                            {event.status === 'pending' && (
                              <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-yellow-100 text-yellow-600">
                                Waiting for Approval
                              </span>
                            )}
                            {event.status === 'rejected' && (
                              <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-red-100 text-red-600">
                                Rejected
                              </span>
                            )}
                            {event.status === 'approved' && (
                              <span className="text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded bg-green-100 text-green-600">
                                Approved
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 truncate max-w-[200px]">{event.description}</div>
                        </div>
                        {isExpired(event) && (
                          <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => handleAnnounceWinners(event)}
                              className="text-[10px] font-black uppercase tracking-tighter text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded transition"
                            >
                              Announce Winners
                            </button>
                            {event.winners && event.winners.length > 0 && (
                              <button 
                                onClick={() => handleSeeWinners(event)}
                                className="text-[10px] font-black uppercase tracking-tighter text-purple-500 hover:text-purple-700 bg-purple-50 px-2 py-0.5 rounded transition"
                              >
                                See Winners
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-700">{event.organizer?.name}</div>
                        <div className="text-[10px] text-gray-400">{event.organizer?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`flex items-center gap-2 text-sm ${isExpired(event) ? 'text-red-500 font-black animate-pulse' : 'text-gray-600 font-medium'}`}>
                          <CalendarIcon className={`w-4 h-4 ${isExpired(event) ? 'text-red-500' : 'text-blue-500'}`} />
                          {new Date(event.date).toLocaleDateString('en-GB')}
                        </div>
                        <div className={`flex items-center gap-2 text-sm mt-1 ${isExpired(event) ? 'text-red-500 font-black' : 'text-gray-600 font-medium'}`}>
                          <Clock className={`w-4 h-4 ${isExpired(event) ? 'text-red-500' : 'text-yellow-500'}`} />
                          {event.time}
                          {isExpired(event) && <span className="ml-1 text-[10px] bg-red-100 px-1.5 py-0.5 rounded text-red-600 uppercase tracking-tighter">Expired</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                            {event.level}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                            event.isGroupEvent
                              ? 'bg-purple-50 text-purple-600'
                              : 'bg-green-50 text-green-600'
                          }`}>
                            {event.isGroupEvent ? 'Team/Group' : 'Individual'}
                          </span>
                        </div>
                        <div className="ml-1 flex flex-col gap-0.5">
                          {event.level === 'department' && (
                            <div className="text-[10px] font-black text-blue-400 tracking-tighter uppercase">
                              {event.department}
                            </div>
                          )}
                          {event.level === 'club' && event.clubName && (
                            <div className="text-[10px] font-black text-purple-500 tracking-tighter uppercase">
                              {event.clubName}
                            </div>
                          )}
                          {event.category && (
                            <div className="text-[9px] font-medium text-gray-400 tracking-tight italic">
                              {event.category}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className={`flex items-center gap-2 font-black ${
                            event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit 
                              ? 'text-red-600' 
                              : 'text-gray-700'
                          }`}>
                            <Users className={`w-4 h-4 ${
                              event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit 
                                ? 'text-red-500' 
                                : 'text-gray-400'
                            }`} />
                            <span className="text-sm">
                              {event.registrations.length} / {event.registrationLimit > 0 ? event.registrationLimit : '∞'}
                            </span>
                          </div>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                event.registrationLimit > 0 && (event.registrations.length / event.registrationLimit) >= 1 ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ 
                                width: event.registrationLimit > 0 
                                  ? `${Math.min((event.registrations.length / event.registrationLimit) * 100, 100)}%` 
                                  : '0%' 
                              }}
                            ></div>
                          </div>
                          {event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit && (
                            <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">Full Capacity</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {event.organizer?._id === user?._id && (
                            <div className="flex items-center gap-1">
                              {!isExpired(event) && (
                                <button 
                                  onClick={() => handleTogglePause(event._id)}
                                  className={`p-2 rounded-lg transition ${
                                    event.isPaused 
                                      ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                      : 'text-amber-600 bg-amber-50 hover:bg-amber-100'
                                  }`}
                                  title={event.isPaused ? "Resume Registrations" : "Pause Registrations"}
                                >
                                  {event.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                                </button>
                              )}
                              <button 
                                onClick={() => handleDownloadCSV(event._id, event.name, event.isGroupEvent)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                                title="Download Registrations CSV"
                              >
                                <Download className="w-5 h-5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(event._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" 
                                title="Delete Event"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Create New Event</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Event Name</label>
                <input
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Level</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value, department: e.target.value === 'department' ? formData.department : 'ALL' })}
                >
                  <option value="institute">Institute Level</option>
                  <option value="department">Department Level</option>
                  <option value="club">Club Level</option>
                </select>
              </div>

              {formData.level === 'department' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Target Department</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="CSE">CSE</option>
                    <option value="AIML">AIML</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="E&TC">E&TC</option>
                    <option value="MBA">MBA</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
              )}

              {formData.level === 'club' && (
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Club Name</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.clubName}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                    placeholder="Enter club name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Category</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Technical">Technical (Coding, RoboRace, etc)</option>
                  <option value="Cultural">Cultural (Dance, Music, Drama)</option>
                  <option value="Sports">Sports (Cricket, Football, Chess)</option>
                  <option value="Workshop">Workshop / Seminar</option>
                  <option value="Exhibition">Project Exhibition</option>
                  <option value="Gaming">E-Sports / Gaming</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Event Type</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isGroupEvent: false })}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${
                      !formData.isGroupEvent
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isGroupEvent: true })}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${
                      formData.isGroupEvent
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Team/Group
                  </button>
                </div>
              </div>

              {formData.isGroupEvent && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Min Team Size</label>
                    <input
                      type="number"
                      min="1"
                      max={formData.maxTeamSize}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={formData.minTeamSize}
                      onChange={(e) => setFormData({ ...formData, minTeamSize: parseInt(e.target.value) || 2 })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Max Team Size</label>
                    <input
                      type="number"
                      min={formData.minTeamSize}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={formData.maxTeamSize}
                      onChange={(e) => setFormData({ ...formData, maxTeamSize: parseInt(e.target.value) || 4 })}
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Registration Limit (0 for no limit)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.registrationLimit}
                  onChange={(e) => setFormData({ ...formData, registrationLimit: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Date</label>
                <input
                  type="date"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Time</label>
                <input
                  type="time"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                <textarea
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">UPI ID (for payments)</label>
                <input
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Event Image</label>
                <div className="flex flex-col md:flex-row items-center gap-4 p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl transition hover:border-blue-400">
                  {imagePreview ? (
                    <div className="relative w-full md:w-32 h-32 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, photo: '' });
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg hover:bg-red-600 transition"
                      >
                        <Plus className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-full md:w-32 h-32 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                      <Tag className="w-8 h-8" />
                    </div>
                  )}
                  <div className="flex-1 text-center md:text-left">
                    <p className="text-sm font-bold text-gray-700 mb-1">Upload directly from device</p>
                    <p className="text-xs text-gray-400 mb-3">JPG, PNG or GIF. Max 5MB.</p>
                    <label className="inline-block cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition">
                      Select File
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <button type="submit" className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition mt-4">
                Launch Event
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Winners Modal */}
      {showWinnersModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {isSeeWinnersMode ? 'Event Winners' : 'Announce Winners'}
                </h2>
                <p className="text-sm text-gray-500 font-medium">{selectedEventForWinners?.name}</p>
              </div>
              <button 
                onClick={() => setShowWinnersModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <Plus className="w-6 h-6 rotate-45" />
              </button>
            </div>

            {isSeeWinnersMode ? (
              <div className="space-y-4">
                {selectedEventForWinners?.winners && selectedEventForWinners.winners.length > 0 ? (
                  [...selectedEventForWinners.winners].sort((a,b) => a.position - b.position).map((winner) => (
                    <div key={winner.position} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                        {winner.position}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900">{winner.name}</div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Roll: <span className="text-gray-600">{winner.rollNo || 'N/A'}</span></span>
                          <span className="text-[9px] font-bold text-gray-400 uppercase">Class: <span className="text-gray-600">{winner.class || 'N/A'}</span></span>
                          {winner.branch && <span className="text-[9px] font-bold text-gray-400 uppercase">Branch: <span className="text-gray-600">{winner.branch}</span></span>}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <Trophy className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No winners announced yet.</p>
                  </div>
                )}
                <button
                  onClick={() => setIsSeeWinnersMode(false)}
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all mt-6"
                >
                  Edit Winners
                </button>
              </div>
            ) : loadingRegistrations ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading registered students...</p>
              </div>
            ) : (
              <form onSubmit={submitWinners} className="space-y-4">
                {winnerEntries.map((entry, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pos</label>
                      <select
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold"
                        value={entry.position}
                        onChange={(e) => {
                          const newEntries = [...winnerEntries];
                          newEntries[index].position = parseInt(e.target.value);
                          setWinnerEntries(newEntries);
                        }}
                      >
                        {[1, 2, 3, 4, 5].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Student Name</label>
                      <select
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-medium"
                        value={entry.name}
                        onChange={(e) => {
                          const newEntries = [...winnerEntries];
                          newEntries[index].name = e.target.value;
                          setWinnerEntries(newEntries);
                        }}
                      >
                        <option value="">Select Student</option>
                        {registeredStudents.map((student, sIndex) => (
                          <option key={sIndex} value={student.name}>
                            {student.name} ({student.rollNo || 'No Roll'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all mt-6"
                >
                  Save Results
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
