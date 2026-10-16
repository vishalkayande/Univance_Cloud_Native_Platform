import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Users, 
  Download, 
  Trash2, 
  Calendar as CalendarIcon, 
  Clock, 
  Tag, 
  Pause, 
  Play, 
  Trophy, 
  LayoutGrid, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Phone, 
  Mail, 
  Sparkles,
  Search,
  Eye,
  FileSpreadsheet,
  Check,
  Zap,
  ShieldCheck,
  ShieldAlert,
  Award,
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import CertificateManagementModal from '../components/CertificateManagementModal';
import CertificateModal from '../components/CertificateModal';
import DepartmentMultiSelect from '../components/DepartmentMultiSelect';
import { exportEventRegistrationsToExcel } from '../utils/exportEventExcel';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: 'institute',
    isInterCollege: false,
    category: 'Technical',
    description: '',
    url: '',
    upiId: '',
    photo: '',
    date: '',
    time: '',
    department: 'ALL',
    departments: ['ALL'],
    registrationLimit: 0,
    clubName: '',
    isGroupEvent: false,
    minTeamSize: 2,
    maxTeamSize: 4,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createError, setCreateError] = useState('');

  // Winners Modal state
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [selectedEventForWinners, setSelectedEventForWinners] = useState(null);
  const [winnerEntries, setWinnerEntries] = useState([
    { position: 1, name: '', rollNo: '', class: '', branch: '', isTeamWinner: false, teamName: '', teamLeaderName: '', teamMembers: [], selectedId: '' },
    { position: 2, name: '', rollNo: '', class: '', branch: '', isTeamWinner: false, teamName: '', teamLeaderName: '', teamMembers: [], selectedId: '' },
    { position: 3, name: '', rollNo: '', class: '', branch: '', isTeamWinner: false, teamName: '', teamLeaderName: '', teamMembers: [], selectedId: '' },
    { position: 4, name: '', rollNo: '', class: '', branch: '', isTeamWinner: false, teamName: '', teamLeaderName: '', teamMembers: [], selectedId: '' },
    { position: 5, name: '', rollNo: '', class: '', branch: '', isTeamWinner: false, teamName: '', teamLeaderName: '', teamMembers: [], selectedId: '' },
  ]);
  const [isSeeWinnersMode, setIsSeeWinnersMode] = useState(false);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [registeredTeams, setRegisteredTeams] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [savingWinners, setSavingWinners] = useState(false);

  // Certificate Modal state
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedEventForCertificates, setSelectedEventForCertificates] = useState(null);
  const [previewCertificate, setPreviewCertificate] = useState(null);
  const [expandedDescriptionEventId, setExpandedDescriptionEventId] = useState(null);

  const isExpired = (event) => {
    const deadline = new Date(`${event.date.split('T')[0]}T${event.time}`);
    return new Date() > deadline;
  };

  const fetchAllEvents = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/events?college=${user.collegeName}`);
      const myEvents = res.data.filter(event => 
        event.organizer === user._id || event.organizer?._id === user._id
      );
      setEvents(myEvents);
    } catch (err) {
      console.error('Error fetching organizer events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.collegeName) {
      fetchAllEvents();
    }
  }, [user]);

  const handleAnnounceWinners = async (event) => {
    setSelectedEventForWinners(event);
    setIsSeeWinnersMode(false);
    setLoadingRegistrations(true);
    
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events/${event._id}/registrations`, config);
      
      if (event.isGroupEvent) {
        // Map registered teams (only active members)
        const teams = res.data.map(reg => ({
          id: reg._id,
          teamName: reg.teamName || 'Untitled Team',
          teamLeader: reg.teamLeader?.name || 'Leader',
          teamLeaderRollNo: reg.teamLeader?.studentDetails?.rollNo || '',
          status: reg.status,
          teamMembers: (reg.teamMembers || [])
            .filter(m => !m.isUnregistered && m.status !== 'left' && m.status !== 'rejected')
            .map(m => ({
              name: m.name,
              rollNo: m.rollNo || '',
              class: m.class || '',
              branch: m.branch || '',
            }))
        }));
        setRegisteredTeams(teams);

        const existingWinners = event.winners || [];
        const entries = [1, 2, 3, 4, 5].map(pos => {
          const w = existingWinners.find(winner => winner.position === pos);
          const matchedTeam = w ? teams.find(t => t.teamName === (w.teamName || w.name)) : null;
          return {
            position: pos,
            isTeamWinner: true,
            teamName: w ? (w.teamName || w.name) : '',
            name: w ? (w.teamName || w.name) : '',
            teamLeaderName: matchedTeam ? matchedTeam.teamLeader : '',
            teamMembers: w ? (w.teamMembers || []) : [],
            selectedId: matchedTeam ? matchedTeam.id : '',
          };
        });
        setWinnerEntries(entries);
      } else {
        // Individual event
        const students = res.data.map(reg => ({
          id: reg.student?._id || reg._id,
          name: reg.student?.name || 'Unknown',
          rollNo: reg.student?.studentDetails?.rollNo || '',
          class: reg.student?.studentDetails?.class || '',
          branch: reg.student?.studentDetails?.branch || '',
          email: reg.email || reg.student?.email || ''
        })).sort((a, b) => a.name.localeCompare(b.name));
        setRegisteredStudents(students);

        const existingWinners = event.winners || [];
        const entries = [1, 2, 3, 4, 5].map(pos => {
          const w = existingWinners.find(winner => winner.position === pos);
          const matchedStudent = w ? students.find(s => s.name === w.name || (w.student && s.id === w.student)) : null;
          return {
            position: pos,
            isTeamWinner: false,
            name: w ? w.name : '',
            rollNo: w ? w.rollNo : '',
            class: w ? w.class : '',
            branch: w ? w.branch : '',
            selectedId: matchedStudent ? matchedStudent.id : '',
          };
        });
        setWinnerEntries(entries);
      }

      setShowWinnersModal(true);
    } catch (err) {
      console.error('Error fetching registrations:', err);
      alert('Failed to load registered participants');
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleSeeWinners = (event) => {
    setSelectedEventForWinners(event);
    setIsSeeWinnersMode(true);
    const existingWinners = event.winners || [];
    const entries = [1, 2, 3, 4, 5].map(pos => {
      const winner = existingWinners.find(w => w.position === pos);
      return { 
        position: pos,
        isTeamWinner: Boolean(winner?.isTeamWinner || event.isGroupEvent),
        teamName: winner?.teamName || '',
        name: winner ? winner.name : '', 
        rollNo: winner ? winner.rollNo : '',
        class: winner ? winner.class : '',
        branch: winner ? winner.branch : '',
        teamMembers: winner ? (winner.teamMembers || []) : []
      };
    });
    setWinnerEntries(entries);
    setShowWinnersModal(true);
  };

  // Helper: check if student or team is selected in another position
  const isSelectedInOtherPosition = (id, currentPos) => {
    if (!id) return false;
    return winnerEntries.some(w => w.position !== currentPos && w.selectedId === id);
  };

  const getPositionOfSelected = (id) => {
    const found = winnerEntries.find(w => w.selectedId === id);
    return found ? found.position : null;
  };

  const handleSelectWinnerOption = (idx, selectedId) => {
    const pos = idx + 1;
    const newEntries = [...winnerEntries];

    if (!selectedId) {
      newEntries[idx] = {
        position: pos,
        isTeamWinner: Boolean(selectedEventForWinners?.isGroupEvent),
        name: '',
        rollNo: '',
        class: '',
        branch: '',
        teamName: '',
        teamLeaderName: '',
        teamMembers: [],
        selectedId: ''
      };
      setWinnerEntries(newEntries);
      return;
    }

    if (selectedEventForWinners?.isGroupEvent) {
      const team = registeredTeams.find(t => t.id === selectedId);
      if (team) {
        newEntries[idx] = {
          position: pos,
          isTeamWinner: true,
          teamName: team.teamName,
          name: team.teamName,
          teamLeaderName: team.teamLeader,
          teamMembers: team.teamMembers,
          selectedId: team.id
        };
      }
    } else {
      const student = registeredStudents.find(s => s.id === selectedId);
      if (student) {
        newEntries[idx] = {
          position: pos,
          isTeamWinner: false,
          name: student.name,
          rollNo: student.rollNo,
          class: student.class,
          branch: student.branch,
          student: student.id,
          selectedId: student.id
        };
      }
    }

    setWinnerEntries(newEntries);
  };

  const submitWinners = async (e) => {
    e.preventDefault();
    setSavingWinners(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const validWinners = winnerEntries.filter(w => (w.name && w.name.trim() !== '') || (w.teamName && w.teamName.trim() !== ''));

      await axios.put(`${API_URL}/api/events/${selectedEventForWinners._id}/winners`, { winners: validWinners }, config);
      setShowWinnersModal(false);
      fetchAllEvents();
      alert('🎉 Winners updated successfully! The event leaderboard is now live for all students.');
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update winners');
    } finally {
      setSavingWinners(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreatingEvent(true);
    setCreateError('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post(`${API_URL}/api/events`, formData, config);
      setShowModal(false);
      fetchAllEvents();
      setFormData({
        name: '',
        level: 'institute',
        category: 'Technical',
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
      alert('Event created successfully! Submitted for Administrator review.');
    } catch (err) {
      console.error(err);
      setCreateError(err.response?.data?.message || 'Failed to create event.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This cannot be undone.')) {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        await axios.delete(`${API_URL}/api/events/${eventId}`, config);
        fetchAllEvents();
      } catch (err) {
        console.error('Delete Error:', err);
        alert(err.response?.data?.message || 'Failed to delete event');
      }
    }
  };

  const handleTogglePause = async (eventId) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/events/${eventId}/pause`, {}, config);
      fetchAllEvents();
    } catch (err) {
      console.error('Toggle Pause Error:', err);
      alert(err.response?.data?.message || 'Failed to update event status');
    }
  };

  const handleDownloadCSV = async (eventOrId, eventName, isGroupEvent) => {
    try {
      let targetEvent = typeof eventOrId === 'object' ? eventOrId : events.find(e => e._id === eventOrId);
      const eventId = typeof eventOrId === 'object' ? eventOrId._id : eventOrId;

      if (!targetEvent) {
        targetEvent = {
          _id: eventId,
          name: eventName,
          isGroupEvent: isGroupEvent,
          college: user.collegeName,
        };
      }

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events/${eventId}/registrations`, config);
      const registrations = res.data;

      if (!registrations || registrations.length === 0) {
        alert('No registrations found for this event yet.');
        return;
      }

      exportEventRegistrationsToExcel(targetEvent, registrations);
    } catch (err) {
      console.error('Download Error:', err);
      alert('Failed to download event registrations.');
    }
  };

  const stats = useMemo(() => {
    const total = events.length;
    const active = events.filter(e => !isExpired(e)).length;
    const expired = events.filter(e => isExpired(e)).length;
    const totalRegs = events.reduce((acc, curr) => acc + (curr.registrations?.length || 0), 0);
    return { total, active, expired, totalRegs };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (statusFilter === 'ACTIVE') return matchesSearch && !isExpired(e);
      if (statusFilter === 'EXPIRED') return matchesSearch && isExpired(e);
      if (statusFilter === 'PENDING') return matchesSearch && e.status === 'pending';
      return matchesSearch;
    });
  }, [events, searchQuery, statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>{user?.collegeName} • Organizer Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Organizer Command Center
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Manage your academic events, track enrolled participants, and publish podium results.
          </p>
        </div>

        <button
          onClick={() => {
            setCreateError('');
            setShowModal(true);
          }}
          className="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-[#00B5AD] hover:from-blue-500 hover:to-[#00c7be] text-white font-bold rounded-2xl shadow-lg shadow-teal-500/20 transition flex items-center justify-center gap-2 text-sm shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-5 h-5" />
          <span>Create New Event</span>
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Events</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">{stats.active}</p>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Past / Expired</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-700">{stats.expired}</p>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Registrations</p>
            <p className="text-2xl sm:text-3xl font-black text-purple-600">{stats.totalRegs}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search your events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'ACTIVE', 'EXPIRED', 'PENDING'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Events Table / Card List */}
      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">Loading your events...</div>
        ) : filteredEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Event Details</th>
                  <th className="px-6 py-4">Category & Scope</th>
                  <th className="px-6 py-4">Schedule Deadline</th>
                  <th className="px-6 py-4">Registrations</th>
                  <th className="px-6 py-4">Approval Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEvents.map((event) => {
                  const expired = isExpired(event);
                  const hasWinners = event.winners && event.winners.length > 0;

                  return (
                    <tr key={event._id} className="hover:bg-slate-50/70 transition">
                      {/* Name & Photo */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={event.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                            alt={event.name}
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{event.name}</span>
                              {(event.certificates?.participantCertificatesAllocated || event.certificates?.winnerCertificatesAllocated) && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200" title="Certificates allocated and active">
                                  <Award className="w-2.5 h-2.5 text-teal-600" />
                                  Certs Live
                                </span>
                              )}
                            </p>
                            <div className="mt-0.5">
                              {expandedDescriptionEventId === event._id ? (
                                <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-1 max-w-md shadow-xs animate-in fade-in">
                                  <p className="whitespace-pre-wrap leading-relaxed">{event.description}</p>
                                  <button
                                    type="button"
                                    onClick={() => setExpandedDescriptionEventId(null)}
                                    className="text-[10px] text-teal-600 font-bold hover:underline mt-1 block"
                                  >
                                    ▲ Show Less
                                  </button>
                                </div>
                              ) : (
                                <div className="text-[11px] text-slate-400 max-w-sm">
                                  {event.description?.length > 70 ? (
                                    <p>
                                      <span className="line-clamp-1">{event.description}</span>
                                      <button
                                        type="button"
                                        onClick={() => setExpandedDescriptionEventId(event._id)}
                                        className="text-[10px] text-teal-600 font-bold hover:underline inline-block mt-0.5"
                                      >
                                        ▼ Read Full Description
                                      </button>
                                    </p>
                                  ) : (
                                    <p>{event.description}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Scope & Level */}
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {event.isInterCollege || event.level === 'intercollege' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold uppercase text-[10px] bg-purple-50 text-purple-700 border border-purple-200">
                                🌐 Inter-College
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold uppercase text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                                🏛️ Intra-College
                              </span>
                            )}
                            <span className="inline-block px-2 py-0.5 rounded-md font-bold uppercase text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
                              {event.level}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 font-medium">
                            {event.isGroupEvent ? `Group (${event.minTeamSize}-${event.maxTeamSize})` : 'Individual'}
                            {event.category && ` • ${event.category}`}
                          </div>

                          <div className="text-[10px] font-bold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded border border-teal-200/60 inline-block">
                            Depts: {Array.isArray(event.departments) && event.departments.length > 0 && !event.departments.includes('ALL')
                              ? event.departments.join(', ')
                              : (event.department || 'ALL')}
                          </div>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <p className={`font-semibold ${expired ? 'text-red-600' : 'text-slate-800'}`}>
                            {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className="text-[11px] text-slate-400">{event.time}</p>
                        </div>
                      </td>

                      {/* Registrations */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="font-black text-sm text-slate-900">
                            {event.registrations.length}
                          </span>
                          {event.registrationLimit > 0 ? (
                            <span className="text-slate-400 text-[11px]"> / {event.registrationLimit} max</span>
                          ) : (
                            <span className="text-slate-400 text-[11px]"> enrolled</span>
                          )}
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td className="px-6 py-4">
                        {event.status === 'pending' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <Clock className="w-3 h-3" /> Under Review
                          </span>
                        ) : event.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <ShieldAlert className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3" /> Approved
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Pause / Resume */}
                          <button
                            onClick={() => handleTogglePause(event._id)}
                            className={`p-2 rounded-xl transition ${
                              event.isPaused
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                            title={event.isPaused ? 'Resume Registrations' : 'Pause Registrations'}
                          >
                            {event.isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                          </button>

                          {/* Allocate / Manage Certificates */}
                          <button
                            onClick={() => {
                              setSelectedEventForCertificates(event);
                              setShowCertificateModal(true);
                            }}
                            className={`p-2 rounded-xl transition ${
                              (event.certificates?.participantCertificatesAllocated || event.certificates?.winnerCertificatesAllocated)
                                ? 'bg-teal-100 text-teal-800 hover:bg-teal-200 ring-1 ring-teal-500/40'
                                : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
                            }`}
                            title="Allocate Certificates (Participants & Winners)"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>

                          {/* Announce Winners */}
                          {hasWinners ? (
                            <button
                              onClick={() => handleSeeWinners(event)}
                              className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition"
                              title="View Announced Winners"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAnnounceWinners(event)}
                              className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
                              title="Announce Event Winners"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Download CSV */}
                          <button
                            onClick={() => handleDownloadCSV(event._id, event.name, event.isGroupEvent)}
                            className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            title="Download Registered Students CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(event._id)}
                            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center p-6">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-slate-800 text-base mb-1">No Events Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              You haven't posted any events matching your filter yet. Create your first event now!
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition"
            >
              Create An Event
            </button>
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create New Campus Event</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Will be submitted for administrator approval</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Event Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. National Hackathon 2026"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Inter-College Event Toggle Card */}
              <div className="p-4 rounded-2xl border transition-all bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-teal-500/10 border-purple-500/30">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isInterCollege || formData.level === 'intercollege'}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        isInterCollege: checked,
                        level: checked ? 'intercollege' : (formData.level === 'intercollege' ? 'institute' : formData.level),
                      });
                    }}
                    className="mt-1 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-purple-900">
                        🌐 Inter-College Event (Multi-Campus)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                        Chhatrapati Sambhajinagar
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      When enabled, this event is visible to students across <strong>all engineering colleges</strong> (DIEMS, GECA, JNEC, MIT, etc.). When disabled, it is restricted to students of <strong>{user?.collegeName}</strong> only.
                    </p>
                  </div>
                </label>
              </div>

              {/* Level and Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Event Level
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.level}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({ 
                        ...formData, 
                        level: val,
                        isInterCollege: val === 'intercollege' ? true : formData.isInterCollege
                      });
                    }}
                  >
                    <option value="institute">Institute Level (Campus Wide)</option>
                    <option value="intercollege">Inter-College (All Sambhajinagar Colleges)</option>
                    <option value="department">Department Level</option>
                    <option value="club">Club / Society Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Category
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Technical">Technical / Coding</option>
                    <option value="Cultural">Cultural / Performing Arts</option>
                    <option value="Sports">Sports & Athletics</option>
                    <option value="Workshop">Workshop / Seminar</option>
                    <option value="Gaming">E-Sports / Gaming</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Departments Selection */}
              <DepartmentMultiSelect
                selectedDepartments={formData.departments}
                onChange={(depts) => {
                  setFormData({
                    ...formData,
                    departments: depts,
                    department: depts.includes('ALL') ? 'ALL' : depts.join(', '),
                  });
                }}
              />

              {/* Club Name if club level */}
              {formData.level === 'club' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Club / Committee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics Club, IEEE Chapter"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.clubName}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  />
                </div>
              )}

              {formData.level === 'club' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Club / Committee Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robotics Club, IEEE Chapter"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.clubName}
                    onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Detailed Description & Guidelines
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {formData.description ? `${formData.description.length} characters` : 'All details visible to students'}
                  </span>
                </div>
                <textarea
                  required
                  rows={7}
                  placeholder="Outline the full event description, rules, eligibility, prizes, timeline, and guidelines..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 min-h-[160px] resize-y leading-relaxed"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Tip: Line breaks and formatting will be preserved and visible to participating students.
                </p>
              </div>

              {/* Date, Time, Registration Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Registration Deadline
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Deadline Time
                  </label>
                  <input
                    type="time"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Capacity Limit (0 = None)
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={formData.registrationLimit}
                    onChange={(e) => setFormData({ ...formData, registrationLimit: e.target.value })}
                  />
                </div>
              </div>

              {/* UPI Payment ID */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  UPI ID for Fees (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. univance@oksbi (leave empty for free events)"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                />
              </div>

              {/* Group Event Configuration */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">Group / Team Event Format</span>
                    <p className="text-[11px] text-slate-500">Enable this if students must register in teams</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isGroupEvent}
                    onChange={(e) => setFormData({ ...formData, isGroupEvent: e.target.checked })}
                    className="w-5 h-5 text-teal-600 rounded-lg focus:ring-teal-500"
                  />
                </div>

                {formData.isGroupEvent && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Min Team Members
                      </label>
                      <input
                        type="number"
                        min="1"
                        required={formData.isGroupEvent}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        value={formData.minTeamSize}
                        onChange={(e) => setFormData({ ...formData, minTeamSize: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Max Team Members
                      </label>
                      <input
                        type="number"
                        min="1"
                        required={formData.isGroupEvent}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold"
                        value={formData.maxTeamSize}
                        onChange={(e) => setFormData({ ...formData, maxTeamSize: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Event Cover Poster
                </label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-xs"
                    />
                  )}
                  <label className="flex-1 border-2 border-dashed border-slate-200 hover:border-teal-500 p-4 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition text-center bg-slate-50">
                    <Upload className="w-5 h-5 text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">Click to upload poster image</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/3 py-3.5 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingEvent}
                  className="w-2/3 py-3.5 bg-gradient-to-r from-blue-600 to-[#00B5AD] text-white font-bold rounded-xl text-xs shadow-md shadow-teal-500/20 hover:scale-[1.01] transition disabled:opacity-50"
                >
                  {creatingEvent ? 'Publishing Event...' : 'Submit Event for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Announce / View Winners Modal */}
      {showWinnersModal && selectedEventForWinners && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" />
                  {isSeeWinnersMode ? 'Event Winners' : 'Announce Winners'}
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedEventForWinners.name}</p>
              </div>
              <button
                onClick={() => setShowWinnersModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingRegistrations ? (
              <div className="py-12 text-center text-slate-400">Loading registered participants...</div>
            ) : (
              <form onSubmit={submitWinners} className="space-y-4">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      {isSeeWinnersMode 
                        ? 'Official Event Leaderboard' 
                        : selectedEventForWinners?.isGroupEvent 
                          ? 'Select Winning Teams (Team Name & Members)' 
                          : 'Select Winning Students from Registered Participants'}
                    </p>
                    <p className="text-[11px] text-amber-700/90 mt-0.5">
                      {isSeeWinnersMode
                        ? 'Current standings and podium rankings for this event.'
                        : 'Choose participants for each position. Once selected in a position, a participant or team cannot be re-selected for another position.'}
                    </p>
                  </div>
                </div>

                {!isSeeWinnersMode && selectedEventForWinners?.isGroupEvent && registeredTeams.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No registered teams found for this event. Teams must register before winners can be selected.
                  </div>
                )}

                {!isSeeWinnersMode && !selectedEventForWinners?.isGroupEvent && registeredStudents.length === 0 && (
                  <div className="py-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No registered students found for this event yet.
                  </div>
                )}

                {winnerEntries.map((entry, idx) => {
                  const isGroup = selectedEventForWinners?.isGroupEvent;

                  return (
                    <div key={entry.position} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                            entry.position === 1 ? 'bg-amber-100 text-amber-800' :
                            entry.position === 2 ? 'bg-slate-200 text-slate-800' :
                            entry.position === 3 ? 'bg-amber-200/50 text-amber-900' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {entry.position}
                          </span>
                          {entry.position === 1 ? '🥇 1st Place (Winner)' : entry.position === 2 ? '🥈 2nd Place' : entry.position === 3 ? '🥉 3rd Place' : `Rank ${entry.position}`}
                        </span>

                        {!isSeeWinnersMode && (entry.selectedId || entry.name) && (
                          <button
                            type="button"
                            onClick={() => handleSelectWinnerOption(idx, '')}
                            className="text-[11px] text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Clear
                          </button>
                        )}
                      </div>

                      {isSeeWinnersMode ? (
                        <div className="text-xs bg-white p-3 rounded-xl border border-slate-200/80">
                          {isGroup || entry.isTeamWinner ? (
                            entry.teamName || entry.name ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm">👥 {entry.teamName || entry.name}</span>
                                  <span className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold">Team</span>
                                </div>
                                {entry.teamLeaderName && (
                                  <p className="text-[11px] text-slate-600">Leader: <span className="font-medium text-slate-800">{entry.teamLeaderName}</span></p>
                                )}
                                {entry.teamMembers && entry.teamMembers.length > 0 && (
                                  <div className="pt-1">
                                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Members:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {entry.teamMembers.map((m, mIdx) => (
                                        <span key={mIdx} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium">
                                          {m.name || m} {m.rollNo ? `(${m.rollNo})` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic">No team announced for this position</p>
                            )
                          ) : (
                            entry.name ? (
                              <div>
                                <p className="font-bold text-slate-900 text-sm">👤 {entry.name}</p>
                                {(entry.rollNo || entry.class || entry.branch) && (
                                  <p className="text-[11px] text-slate-500 mt-0.5">
                                    {entry.rollNo && `Roll: ${entry.rollNo}`}
                                    {entry.class && ` • Class: ${entry.class}`}
                                    {entry.branch && ` • Branch: ${entry.branch}`}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <p className="text-slate-400 italic">No winner announced for this position</p>
                            )
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {isGroup ? (
                            <div>
                              <select
                                value={entry.selectedId || ''}
                                onChange={(e) => handleSelectWinnerOption(idx, e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                              >
                                <option value="">-- Select Registered Team for Position #{entry.position} --</option>
                                {registeredTeams.map(team => {
                                  const isTaken = isSelectedInOtherPosition(team.id, entry.position);
                                  const takenPos = isTaken ? getPositionOfSelected(team.id) : null;
                                  return (
                                    <option key={team.id} value={team.id} disabled={isTaken}>
                                      {team.teamName} (Leader: {team.teamLeader}) {isTaken ? ` — [Already selected for Rank #${takenPos}]` : ''}
                                    </option>
                                  );
                                })}
                              </select>

                              {entry.selectedId && (
                                <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs">
                                  <div className="font-bold text-amber-900 flex items-center justify-between">
                                    <span>Team: {entry.teamName}</span>
                                    <span className="text-[10px] text-amber-700 font-semibold">Leader: {entry.teamLeaderName}</span>
                                  </div>
                                  {entry.teamMembers && entry.teamMembers.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {entry.teamMembers.map((m, mIdx) => (
                                        <span key={mIdx} className="px-2 py-0.5 bg-white/90 border border-amber-200 rounded text-[10px] text-amber-800">
                                          {m.name || m} {m.rollNo ? `(${m.rollNo})` : ''}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <select
                                value={entry.selectedId || ''}
                                onChange={(e) => handleSelectWinnerOption(idx, e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                              >
                                <option value="">-- Select Registered Student for Position #{entry.position} --</option>
                                {registeredStudents.map(student => {
                                  const isTaken = isSelectedInOtherPosition(student.id, entry.position);
                                  const takenPos = isTaken ? getPositionOfSelected(student.id) : null;
                                  return (
                                    <option key={student.id} value={student.id} disabled={isTaken}>
                                      {student.name} {student.rollNo ? `(${student.rollNo})` : ''} {student.branch ? `- ${student.branch}` : ''} {isTaken ? ` — [Already selected for Rank #${takenPos}]` : ''}
                                    </option>
                                  );
                                })}
                              </select>

                              {entry.selectedId && (
                                <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs flex items-center justify-between">
                                  <span className="font-bold text-amber-900">{entry.name}</span>
                                  <span className="text-[11px] text-amber-700 font-medium">
                                    {entry.rollNo && `Roll: ${entry.rollNo}`} {entry.branch && `• ${entry.branch}`} {entry.class && `• ${entry.class}`}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {!isSeeWinnersMode && (
                  <button
                    type="submit"
                    disabled={savingWinners}
                    className="w-full mt-4 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl text-xs shadow-md shadow-amber-500/20 transition disabled:opacity-50"
                  >
                    {savingWinners ? 'Saving Leaderboard...' : 'Publish Podium Winners'}
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Certificate Management Modal */}
      {showCertificateModal && selectedEventForCertificates && (
        <CertificateManagementModal
          event={selectedEventForCertificates}
          user={user}
          onClose={() => {
            setShowCertificateModal(false);
            setSelectedEventForCertificates(null);
          }}
          onUpdated={fetchAllEvents}
          onPreviewSample={(sampleCert) => setPreviewCertificate(sampleCert)}
        />
      )}

      {/* Certificate Preview Modal */}
      {previewCertificate && (
        <CertificateModal
          certificate={previewCertificate}
          onClose={() => setPreviewCertificate(null)}
        />
      )}
    </div>
  );
};

export default OrganizerDashboard;
