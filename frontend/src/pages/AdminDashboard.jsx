import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  Users, 
  Calendar, 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  LayoutGrid, 
  Download, 
  Trophy, 
  User, 
  Plus, 
  History, 
  Mail, 
  Phone, 
  CalendarDays, 
  Clock, 
  Search, 
  X,
  Filter,
  Eye,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  ChevronRight,
  GraduationCap,
  Award,
  Ban,
  UserCheck,
  UserX,
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import CertificateManagementModal from '../components/CertificateManagementModal';
import CertificateModal from '../components/CertificateModal';
import { exportEventRegistrationsToExcel } from '../utils/exportEventExcel';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('admin'); // 'admin' | 'events' | 'approvals' | 'blocklist'

  // Per-college filter state
  const [orgFilterByCollege, setOrgFilterByCollege] = useState({});
  const [studentDeptByCollege, setStudentDeptByCollege] = useState({});
  const [studentClassByCollege, setStudentClassByCollege] = useState({});
  const [eventCatByCollege, setEventCatByCollege] = useState({});

  // Blocklist state
  const [blocklistType, setBlocklistType] = useState('students'); // 'students' | 'organizers'
  const [blocklistStudentDept, setBlocklistStudentDept] = useState(null);
  const [blocklistStudentClass, setBlocklistStudentClass] = useState(null);
  const [blocklistOrgDept, setBlocklistOrgDept] = useState(null);
  const [blocklistSearch, setBlocklistSearch] = useState('');

  // Modals state
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [showStudentDetailsModal, setShowStudentDetailsModal] = useState(false);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState(null);
  const [showClassStudentsModal, setShowClassStudentsModal] = useState(false);
  const [selectedCollegeForStudents, setSelectedCollegeForStudents] = useState(null);
  const [selectedClassForStudents, setSelectedClassForStudents] = useState(null);
  const [selectedBranchForStudents, setSelectedBranchForStudents] = useState(null);
  const [classStudentSearchQuery, setClassStudentSearchQuery] = useState('');

  // Organizers Modal state
  const [showBranchOrgsModal, setShowBranchOrgsModal] = useState(false);
  const [selectedCollegeForOrgs, setSelectedCollegeForOrgs] = useState(null);
  const [selectedBranchForOrgs, setSelectedBranchForOrgs] = useState(null);
  const [orgSearchQuery, setOrgSearchQuery] = useState('');

  // College Events Modal state
  const [showCollegeEventsModal, setShowCollegeEventsModal] = useState(false);
  const [selectedCollegeForEvents, setSelectedCollegeForEvents] = useState(null);
  const [selectedCategoryForEvents, setSelectedCategoryForEvents] = useState(null);
  const [collegeEventSearchQuery, setCollegeEventSearchQuery] = useState('');
  const [selectedEventForLeaderboard, setSelectedEventForLeaderboard] = useState(null);
  const [selectedEventForParticipants, setSelectedEventForParticipants] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Certificate Modal state
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedEventForCertificates, setSelectedEventForCertificates] = useState(null);
  const [previewCertificate, setPreviewCertificate] = useState(null);

  const isExpired = (event) => {
    const deadline = new Date(`${event.date.split('T')[0]}T${event.time}`);
    return new Date() > deadline;
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/admin/dashboard`, config);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEvents = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events`, config);
      setAllEvents(res.data);
    } catch (err) {
      console.error('Error fetching all events:', err);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdminData();
      fetchAllEvents();
    }
  }, [user]);

  const handleApproveOrganizer = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/approve-organizer/${id}`, {}, config);
      fetchAdminData();
      alert('Organizer account approved!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve organizer');
    }
  };

  const handleApproveStudent = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/approve-student/${id}`, {}, config);
      fetchAdminData();
      alert('Student account approved! The student can now log in.');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve student');
    }
  };

  const handleApproveEvent = async (id) => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/approve-event/${id}`, {}, config);
      fetchAdminData();
      fetchAllEvents();
      alert('Event approved and made live for students!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve event');
    }
  };

  const handleRejectEvent = async (id) => {
    if (!window.confirm('Are you sure you want to reject this event?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/reject-event/${id}`, {}, config);
      fetchAdminData();
      fetchAllEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject event');
    }
  };

  const handleBlockUser = async (id, userName, role = 'user') => {
    const reason = window.prompt(`Enter reason for blocking ${userName}:`, 'Violation of campus guidelines');
    if (reason === null) return; // User clicked Cancel
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/block-user/${id}`, { reason }, config);
      fetchAdminData();
      alert(`${userName} has been blocked and moved to the Blocklist.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to block user');
    }
  };

  const handleUnblockUser = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to unblock ${userName}? Their account will be restored with all records intact.`)) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/admin/unblock-user/${id}`, {}, config);
      fetchAdminData();
      alert(`${userName} has been unblocked successfully!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to unblock user');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? All their associated records will be removed.')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/api/admin/user/${id}`, config);
      fetchAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event? This cannot be undone.')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`${API_URL}/api/admin/event/${id}`, config);
      fetchAdminData();
      fetchAllEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleViewParticipants = async (event) => {
    setSelectedEventForParticipants(event);
    setShowParticipantsModal(true);
    setLoadingParticipants(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events/${event._id}/registrations`, config);
      setParticipants(res.data);
    } catch (err) {
      console.error('Error fetching participants:', err);
      alert('Failed to load participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDownloadCSV = async (eventOrId, eventName, isGroupEvent) => {
    try {
      let targetEvent = typeof eventOrId === 'object' ? eventOrId : allEvents.find(e => e._id === eventOrId);
      const eventId = typeof eventOrId === 'object' ? eventOrId._id : eventOrId;

      if (!targetEvent) {
        targetEvent = {
          _id: eventId,
          name: eventName,
          isGroupEvent: isGroupEvent,
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
      alert('Failed to download registrations');
    }
  };

  // Pending items counts (excluding blocked users)
  const pendingOrganizers = useMemo(() => {
    let list = [];
    data.forEach(c => {
      list.push(...(c.organizers || []).filter(o => !o.isApproved && !o.isBlocked));
    });
    return list;
  }, [data]);

  const pendingStudents = useMemo(() => {
    let list = [];
    data.forEach(c => {
      list.push(...(c.students || []).filter(s => !s.isApproved && !s.isBlocked));
    });
    return list;
  }, [data]);

  const pendingEvents = useMemo(() => {
    return allEvents.filter(e => e.status === 'pending' || !e.isApproved);
  }, [allEvents]);

  // Blocked users lists
  const blockedOrganizers = useMemo(() => {
    let list = [];
    data.forEach(c => {
      list.push(...(c.organizers || []).filter(o => o.isBlocked));
    });
    return list;
  }, [data]);

  const blockedStudents = useMemo(() => {
    let list = [];
    data.forEach(c => {
      list.push(...(c.students || []).filter(s => s.isBlocked));
    });
    return list;
  }, [data]);

  const totalBlockedCount = blockedOrganizers.length + blockedStudents.length;

  const totalCollegesCount = data.length;
  const totalStudentsCount = data.reduce((acc, c) => acc + (c.students || []).filter(s => !s.isBlocked).length, 0);
  const totalOrganizersCount = data.reduce((acc, c) => acc + (c.organizers || []).filter(o => !o.isBlocked).length, 0);
  const totalPendingCount = pendingOrganizers.length + pendingStudents.length + pendingEvents.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200/80 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Administrator Global Command</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Campus Oversight & Moderation
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Review student registrations, organizer accounts, authorize events, inspect rosters, and moderate campus activities.
          </p>
        </div>

        {/* Pending Banner Alert if any pending items */}
        {totalPendingCount > 0 && (
          <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-black text-amber-900">
                Action Required: {totalPendingCount} Pending Approvals
              </p>
              <p className="text-[11px] text-amber-700">
                {pendingStudents.length} student(s) • {pendingOrganizers.length} organizer(s) • {pendingEvents.length} event(s)
              </p>
            </div>
            <button
              onClick={() => setActiveTab('approvals')}
              className="ml-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition"
            >
              Review Queue
            </button>
          </div>
        )}
      </div>

      {/* KPI Global Stat Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Colleges</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalCollegesCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalStudentsCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Organizers</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{totalOrganizersCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Events</p>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{allEvents.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 mb-10 bg-slate-100/80 p-2 rounded-2xl max-w-3xl mx-auto border border-slate-200/80">
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'admin'
              ? 'bg-white text-purple-700 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Campus Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'events'
              ? 'bg-white text-blue-600 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Campus Events</span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all relative ${
            activeTab === 'approvals'
              ? 'bg-white text-amber-700 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Review Queue</span>
          {totalPendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[9px] ml-1">
              {totalPendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('blocklist')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all relative ${
            activeTab === 'blocklist'
              ? 'bg-white text-red-700 shadow-md border border-slate-200/60'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span>Blocklist</span>
          {totalBlockedCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white font-black text-[9px] ml-1">
              {totalBlockedCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Campus Directory */}
      {activeTab === 'admin' && (
        <div className="space-y-12">
          {loading ? (
            <div className="text-center py-16 text-slate-400">Loading campus directory...</div>
          ) : data.length > 0 ? (
            data.map((college) => {
              const activeOrgs = (college.organizers || []).filter(o => !o.isBlocked);
              const activeStudents = (college.students || []).filter(s => !s.isBlocked);
              const collegeEvents = college.events || [];
              const pendingCollegeEvents = collegeEvents.filter(e => !e.isApproved);

              // 1. Organizers branches & filters
              const orgBranches = [...new Set(activeOrgs.map(o => o.organizerDetails?.department || 'General'))].filter(Boolean);
              const currentOrgBranch = orgFilterByCollege[college.college] || null;
              const displayedOrgs = activeOrgs.filter(org => currentOrgBranch ? (org.organizerDetails?.department || 'General') === currentOrgBranch : true);

              // 2. Students branches & class filters
              const studentBranches = [...new Set(activeStudents.map(s => s.studentDetails?.branch || 'General'))].filter(Boolean);
              const currentStudentDept = studentDeptByCollege[college.college] || null;
              const deptStudents = currentStudentDept 
                ? activeStudents.filter(s => (s.studentDetails?.branch || 'General') === currentStudentDept) 
                : activeStudents;

              const studentClasses = [...new Set(deptStudents.map(s => s.studentDetails?.class || 'N/A'))].filter(Boolean);
              const currentStudentClass = studentClassByCollege[college.college] || null;
              const displayedStudents = deptStudents.filter(s => currentStudentClass ? (s.studentDetails?.class || 'N/A') === currentStudentClass : true);

              // 3. Events categories & filters
              const eventCategories = [...new Set(collegeEvents.map(e => e.category || 'General'))].filter(Boolean);
              const currentEventCat = eventCatByCollege[college.college] || null;
              const displayedEvents = collegeEvents.filter(e => currentEventCat ? (e.category || 'General') === currentEventCat : true);

              return (
                <div key={college.college} className="bg-white rounded-[2.5rem] shadow-xs border border-slate-200 overflow-hidden">
                  {/* College Top Header */}
                  <div className="bg-gradient-to-r from-[#003B5C] to-slate-900 px-8 py-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                        <Building2 className="w-8 h-8 text-teal-300" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">{college.college}</h2>
                        <p className="text-xs text-slate-300 font-medium">
                          {activeStudents.length} Students • {activeOrgs.length} Organizers • {collegeEvents.length} Events
                        </p>
                      </div>
                    </div>

                    {pendingCollegeEvents.length > 0 && (
                      <span className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs">
                        {pendingCollegeEvents.length} Event(s) Awaiting Approval
                      </span>
                    )}
                  </div>

                  {/* 3 Columns: Organizers, Students, Events Distribution Panels */}
                  <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Organizers Column */}
                    <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-purple-600" />
                            Organizers ({activeOrgs.length})
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {orgBranches.length} Branch{orgBranches.length === 1 ? '' : 'es'}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium mt-3 mb-2">
                          Select a branch to view and manage organizer accounts:
                        </p>

                        {/* Branch Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSelectedCollegeForOrgs(college.college);
                              setSelectedBranchForOrgs(null);
                              setOrgSearchQuery('');
                              setShowBranchOrgsModal(true);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1.5 shadow-xs"
                          >
                            <span>All ({activeOrgs.length.toString().padStart(2, '0')})</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                          </button>
                          {orgBranches.map(b => {
                            const count = activeOrgs.filter(o => (o.organizerDetails?.department || 'General') === b).length;
                            return (
                              <button
                                key={b}
                                onClick={() => {
                                  setSelectedCollegeForOrgs(college.college);
                                  setSelectedBranchForOrgs(b);
                                  setOrgSearchQuery('');
                                  setShowBranchOrgsModal(true);
                                }}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-300 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
                              >
                                <span>{b} ({count.toString().padStart(2, '0')})</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Click any branch to open directory</span>
                        <Users className="w-4 h-4 text-purple-400" />
                      </div>
                    </div>

                    {/* Students Directory Column */}
                    <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Students Directory ({activeStudents.length})
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {studentBranches.length} Dept{studentBranches.length === 1 ? '' : 's'}
                          </span>
                        </div>

                        {/* 1. Branch / Department Buttons */}
                        <div className="mt-3">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Departments:</p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => {
                                setStudentDeptByCollege({ ...studentDeptByCollege, [college.college]: null });
                                setStudentClassByCollege({ ...studentClassByCollege, [college.college]: null });
                              }}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                currentStudentDept === null ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                              }`}
                            >
                              All ({activeStudents.length.toString().padStart(2, '0')})
                            </button>
                            {studentBranches.map(branch => {
                              const count = activeStudents.filter(s => (s.studentDetails?.branch || 'General') === branch).length;
                              return (
                                <button
                                  key={branch}
                                  onClick={() => {
                                    setStudentDeptByCollege({
                                      ...studentDeptByCollege,
                                      [college.college]: currentStudentDept === branch ? null : branch
                                    });
                                    setStudentClassByCollege({
                                      ...studentClassByCollege,
                                      [college.college]: null
                                    });
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                    currentStudentDept === branch ? 'bg-blue-600 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                  }`}
                                >
                                  {branch} ({count.toString().padStart(2, '0')})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 2. Class Division Buttons (Click to open modal roster) */}
                        <div className="mt-4 pt-3 border-t border-slate-200">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                            Class Divisions (Tap to access list):
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedCollegeForStudents(college.college);
                                setSelectedBranchForStudents(currentStudentDept);
                                setSelectedClassForStudents(null);
                                setClassStudentSearchQuery('');
                                setShowClassStudentsModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-black transition flex items-center gap-1 shadow-xs"
                            >
                              <span>All Classes ({deptStudents.length.toString().padStart(2, '0')})</span>
                              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                            </button>
                            {studentClasses.map(cls => {
                              const count = deptStudents.filter(s => (s.studentDetails?.class || 'N/A') === cls).length;
                              return (
                                <button
                                  key={cls}
                                  onClick={() => {
                                    setSelectedCollegeForStudents(college.college);
                                    setSelectedBranchForStudents(currentStudentDept);
                                    setSelectedClassForStudents(cls);
                                    setClassStudentSearchQuery('');
                                    setShowClassStudentsModal(true);
                                  }}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition flex items-center gap-1 shadow-xs"
                                >
                                  <span>{cls} ({count.toString().padStart(2, '0')})</span>
                                  <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Click any class to view roster</span>
                        <GraduationCap className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>

                    {/* Events Column */}
                    <div className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200/80 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-teal-600" />
                            Campus Events ({collegeEvents.length})
                          </h3>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                            {eventCategories.length} Categories
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 font-medium mt-3 mb-2">
                          Select a category to inspect events & rosters:
                        </p>

                        {/* Category Filter Buttons */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button
                            onClick={() => {
                              setSelectedCollegeForEvents(college.college);
                              setSelectedCategoryForEvents(null);
                              setCollegeEventSearchQuery('');
                              setShowCollegeEventsModal(true);
                            }}
                            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition flex items-center gap-1.5 shadow-xs"
                          >
                            <span>All ({collegeEvents.length.toString().padStart(2, '0')})</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-70" />
                          </button>
                          {eventCategories.map(cat => {
                            const count = collegeEvents.filter(e => (e.category || 'General') === cat).length;
                            return (
                              <button
                                key={cat}
                                onClick={() => {
                                  setSelectedCollegeForEvents(college.college);
                                  setSelectedCategoryForEvents(cat);
                                  setCollegeEventSearchQuery('');
                                  setShowCollegeEventsModal(true);
                                }}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 transition flex items-center gap-1.5 shadow-xs"
                              >
                                <span>{cat} ({count.toString().padStart(2, '0')})</span>
                                <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Click any category to inspect</span>
                        <Calendar className="w-4 h-4 text-teal-400" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 text-slate-400">No campus records found.</div>
          )}
        </div>
      )}

      {/* Tab 2: All Campus Events Catalog */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allEvents.map((event) => (
              <div key={event._id} className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-xs flex flex-col">
                <div className="h-44 overflow-hidden relative bg-slate-900">
                  <img
                    src={event.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                    alt={event.name}
                    className="w-full h-full object-cover opacity-90"
                  />
                  <div className="absolute top-3.5 right-3.5 flex flex-col gap-1 items-end">
                    {event.isInterCollege || event.level === 'intercollege' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-600 text-white shadow-xs">
                        🌐 Inter-College
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-950/80 text-white backdrop-blur-md">
                        {event.level}
                      </span>
                    )}
                    {!event.isApproved && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500 text-white">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-black text-slate-900 text-lg leading-tight">{event.name}</h3>
                    <div className="flex items-center gap-1">
                      {event.winners && event.winners.length > 0 && (
                        <button
                          onClick={() => {
                            setSelectedEventForLeaderboard(event);
                            setShowLeaderboardModal(true);
                          }}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Leaderboard"
                        >
                          <Trophy className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedEventForCertificates(event);
                          setShowCertificateModal(true);
                        }}
                        className={`p-1.5 rounded-lg transition ${
                          (event.certificates?.participantCertificatesAllocated || event.certificates?.winnerCertificatesAllocated)
                            ? 'text-teal-700 bg-teal-50 hover:bg-teal-100 ring-1 ring-teal-500/30'
                            : 'text-slate-500 hover:bg-slate-100'
                        }`}
                        title="Allocate & Manage Certificates"
                      >
                        <Award className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadCSV(event)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Download Excel"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleViewParticipants(event)}
                        className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition"
                        title="View Participants"
                      >
                        <Users className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event._id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                        title="Delete Event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 mb-4">{event.description}</p>

                  <div className="mt-auto space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex items-center justify-between">
                      <span>Organizer: <strong className="text-slate-700">{event.organizer?.name}</strong></span>
                      <span className="font-bold text-slate-700">{event.registrations?.length || 0} Registered</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>College: {event.college}</span>
                      <span>Deadline: {new Date(event.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Approvals Review Queue */}
      {activeTab === 'approvals' && (
        <div className="space-y-8 max-w-4xl mx-auto">
          {/* Student Account Requests Box */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Student Account Requests ({pendingStudents.length})
            </h3>

            {pendingStudents.length > 0 ? (
              <div className="space-y-3">
                {pendingStudents.map(student => (
                  <div key={student._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                          {student.studentDetails?.branch || 'Student'}
                        </span>
                      </div>
                      <p className="text-slate-400">{student.email}</p>
                      <p className="text-[11px] text-blue-700 font-semibold mt-1">
                        College: {student.collegeName} • Roll: {student.studentDetails?.rollNo || 'N/A'} • Class: {student.studentDetails?.class || 'N/A'} • Mo: {student.studentDetails?.mobileNo || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveStudent(student._id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleBlockUser(student._id, student.name, 'student')}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                        title="Block Student Registration (Moves to Blocklist)"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Block</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(student._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Decline & Delete Student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No pending student registration requests.</p>
            )}
          </div>

          {/* Organizers Review Box */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-purple-600" />
              Organizer Account Requests ({pendingOrganizers.length})
            </h3>

            {pendingOrganizers.length > 0 ? (
              <div className="space-y-3">
                {pendingOrganizers.map(org => (
                  <div key={org._id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{org.name}</p>
                      <p className="text-slate-400">{org.email}</p>
                      <p className="text-[11px] text-purple-700 font-semibold mt-1">
                        College: {org.collegeName} • Dept: {org.organizerDetails?.department || 'N/A'} • Mo: {org.organizerDetails?.mobileNo || 'N/A'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveOrganizer(org._id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleBlockUser(org._id, org.name, 'organizer')}
                        className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                        title="Block Organizer Request (Moves to Blocklist)"
                      >
                        <Ban className="w-4 h-4" />
                        <span>Block</span>
                      </button>
                      <button
                        onClick={() => handleDeleteUser(org._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Decline & Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No pending organizer account requests.</p>
            )}
          </div>

          {/* Events Review Box */}
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 border border-slate-200 shadow-xs">
            <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-600" />
              Event Moderation Requests ({pendingEvents.length})
            </h3>

            {pendingEvents.length > 0 ? (
              <div className="space-y-4">
                {pendingEvents.map(event => (
                  <div key={event._id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                        {event.level} Event
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{event.name}</h4>
                      <p className="text-slate-500 line-clamp-1 mt-0.5">{event.description}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Submitted by: {event.organizer?.name} ({event.organizer?.email}) • College: {event.college}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveEvent(event._id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve & Publish</span>
                      </button>
                      <button
                        onClick={() => handleRejectEvent(event._id)}
                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-bold rounded-xl text-xs transition flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No pending events awaiting moderation.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Blocklist & Sanctions */}
      {activeTab === 'blocklist' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {/* Top Banner Card */}
          <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 rounded-[2.5rem] p-8 text-white shadow-xl border border-red-900/40 relative overflow-hidden">
            <div className="absolute right-0 top-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider mb-3">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Campus Sanctions & Account Restrictions</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight text-white">Campus Blocklist</h2>
                <p className="text-sm text-slate-300 mt-2 max-w-2xl font-medium leading-relaxed">
                  Restricted students and organizers are barred from signing in, joining events, or appearing in active directories and pending approval queues. Unblocking an account immediately restores full access with all historical records, certificates, and registrations intact.
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Blocked Students</p>
                  <p className="text-2xl font-black text-red-400 mt-0.5">{blockedStudents.length}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/10 text-center">
                  <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Blocked Organizers</p>
                  <p className="text-2xl font-black text-amber-400 mt-0.5">{blockedOrganizers.length}</p>
                </div>
              </div>
            </div>

            {/* Toggle Between Students and Organizers */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-white/10 p-1.5 rounded-2xl backdrop-blur-md">
                <button
                  onClick={() => {
                    setBlocklistType('students');
                    setBlocklistStudentDept(null);
                    setBlocklistStudentClass(null);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                    blocklistType === 'students'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <UserX className="w-4 h-4" />
                  <span>Blocked Students ({blockedStudents.length.toString().padStart(2, '0')})</span>
                </button>
                <button
                  onClick={() => {
                    setBlocklistType('organizers');
                    setBlocklistOrgDept(null);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition ${
                    blocklistType === 'organizers'
                      ? 'bg-amber-600 text-white shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Blocked Organizers ({blockedOrganizers.length.toString().padStart(2, '0')})</span>
                </button>
              </div>

              {/* Search in Blocklist */}
              <div className="relative min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={blocklistSearch}
                  onChange={(e) => setBlocklistSearch(e.target.value)}
                  placeholder={`Search blocked ${blocklistType}...`}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                />
                {blocklistSearch && (
                  <button
                    onClick={() => setBlocklistSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Sub-view: Blocked Students */}
          {blocklistType === 'students' && (() => {
            const blockedStudentDepts = [...new Set(blockedStudents.map(s => s.studentDetails?.branch || 'General'))].filter(Boolean);
            const deptStudents = blocklistStudentDept
              ? blockedStudents.filter(s => (s.studentDetails?.branch || 'General') === blocklistStudentDept)
              : blockedStudents;
            const blockedStudentClasses = [...new Set(deptStudents.map(s => s.studentDetails?.class || 'N/A'))].filter(Boolean);
            
            const q = blocklistSearch.trim().toLowerCase();
            const displayedBlockedStudents = deptStudents.filter(s => {
              const matchesClass = blocklistStudentClass ? (s.studentDetails?.class || 'N/A') === blocklistStudentClass : true;
              const matchesSearch = !q || 
                (s.name?.toLowerCase().includes(q) || 
                 s.email?.toLowerCase().includes(q) || 
                 (s.collegeName || s.college || '').toLowerCase().includes(q) || 
                 (s.studentDetails?.rollNo || '').toLowerCase().includes(q));
              return matchesClass && matchesSearch;
            });

            return (
              <div className="space-y-6">
                {/* Department Buttons with (XX) Count */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
                  <div>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-red-500" />
                      Filter by Department:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setBlocklistStudentDept(null);
                          setBlocklistStudentClass(null);
                        }}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                          blocklistStudentDept === null
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Departments ({blockedStudents.length.toString().padStart(2, '0')})
                      </button>
                      {blockedStudentDepts.map(dept => {
                        const count = blockedStudents.filter(s => (s.studentDetails?.branch || 'General') === dept).length;
                        return (
                          <button
                            key={dept}
                            onClick={() => {
                              setBlocklistStudentDept(blocklistStudentDept === dept ? null : dept);
                              setBlocklistStudentClass(null);
                            }}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                              blocklistStudentDept === dept
                                ? 'bg-red-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {dept} ({count.toString().padStart(2, '0')})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Level 2: Class Buttons with (XX) Count */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Filter by Class / Division:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => setBlocklistStudentClass(null)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                          blocklistStudentClass === null
                            ? 'bg-slate-800 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        All Classes ({deptStudents.length.toString().padStart(2, '0')})
                      </button>
                      {blockedStudentClasses.map(cls => {
                        const count = deptStudents.filter(s => (s.studentDetails?.class || 'N/A') === cls).length;
                        return (
                          <button
                            key={cls}
                            onClick={() => setBlocklistStudentClass(blocklistStudentClass === cls ? null : cls)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition ${
                              blocklistStudentClass === cls
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {cls} ({count.toString().padStart(2, '0')})
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Blocked Students Cards Grid */}
                {displayedBlockedStudents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedBlockedStudents.map(student => (
                      <div
                        key={student._id}
                        className="bg-white rounded-3xl p-6 border-2 border-red-100 hover:border-red-300 transition shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center font-black text-base shrink-0 border border-red-200">
                                {student.name?.charAt(0) || 'S'}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{student.name}</h4>
                                <p className="text-xs text-slate-400">{student.email}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider shrink-0 border border-red-200">
                              <Ban className="w-3 h-3 text-red-600" />
                              Banned
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100 mb-4">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-semibold">College:</span>
                              <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">
                                {student.collegeName || student.college || 'N/A'}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200/60">
                              <div>
                                <span className="text-slate-400">Department:</span>
                                <p className="font-bold text-slate-800">{student.studentDetails?.branch || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Class:</span>
                                <p className="font-bold text-slate-800">{student.studentDetails?.class || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400">Roll No:</span>
                                <p className="font-bold text-slate-800">{student.studentDetails?.rollNo || 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-slate-400">Mobile:</span>
                                <p className="font-bold text-slate-800">{student.studentDetails?.mobileNo || 'N/A'}</p>
                              </div>
                            </div>

                            {student.blockReason && (
                              <div className="pt-2 border-t border-red-100">
                                <span className="text-[10px] uppercase font-bold text-red-600 tracking-wider">Sanction Reason:</span>
                                <p className="text-xs text-red-800 font-medium italic mt-0.5">{student.blockReason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleUnblockUser(student._id, student.name)}
                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Unblock Student</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(student._id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
                            title="Delete Student Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
                    <UserCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                    <h3 className="font-black text-slate-800 text-base">No Blocked Students</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      There are currently no students under active ban or sanction matching the selected filters.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Sub-view: Blocked Organizers */}
          {blocklistType === 'organizers' && (() => {
            const blockedOrgBranches = [...new Set(blockedOrganizers.map(o => o.organizerDetails?.department || 'General'))].filter(Boolean);
            const q = blocklistSearch.trim().toLowerCase();
            const displayedBlockedOrgs = blockedOrganizers.filter(o => {
              const matchesBranch = blocklistOrgDept ? (o.organizerDetails?.department || 'General') === blocklistOrgDept : true;
              const matchesSearch = !q || 
                (o.name?.toLowerCase().includes(q) || 
                 o.email?.toLowerCase().includes(q) || 
                 (o.collegeName || o.college || '').toLowerCase().includes(q));
              return matchesBranch && matchesSearch;
            });

            return (
              <div className="space-y-6">
                {/* Branch Buttons with (XX) Count */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                    Filter by Branch:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setBlocklistOrgDept(null)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        blocklistOrgDept === null
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Branches ({blockedOrganizers.length.toString().padStart(2, '0')})
                    </button>
                    {blockedOrgBranches.map(branch => {
                      const count = blockedOrganizers.filter(o => (o.organizerDetails?.department || 'General') === branch).length;
                      return (
                        <button
                          key={branch}
                          onClick={() => setBlocklistOrgDept(blocklistOrgDept === branch ? null : branch)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                            blocklistOrgDept === branch
                              ? 'bg-amber-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {branch} ({count.toString().padStart(2, '0')})
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Blocked Organizers Cards Grid */}
                {displayedBlockedOrgs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedBlockedOrgs.map(org => (
                      <div
                        key={org._id}
                        className="bg-white rounded-3xl p-6 border-2 border-amber-100 hover:border-amber-300 transition shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base shrink-0 border border-amber-200">
                                {org.name?.charAt(0) || 'O'}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 text-sm">{org.name}</h4>
                                <p className="text-xs text-slate-400">{org.email}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-100 text-red-800 text-[10px] font-black uppercase tracking-wider shrink-0 border border-red-200">
                              <Ban className="w-3 h-3 text-red-600" />
                              Banned
                            </span>
                          </div>

                          <div className="p-3 bg-slate-50 rounded-2xl space-y-2 text-xs border border-slate-100 mb-4">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-semibold">College:</span>
                              <span className="font-bold text-slate-800 text-right truncate max-w-[180px]">
                                {org.collegeName || org.college || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60">
                              <span className="text-slate-400">Department:</span>
                              <span className="font-bold text-slate-800">{org.organizerDetails?.department || 'General'}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Mobile:</span>
                              <span className="font-bold text-slate-800">{org.organizerDetails?.mobileNo || 'N/A'}</span>
                            </div>

                            {org.blockReason && (
                              <div className="pt-2 border-t border-amber-100">
                                <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Sanction Reason:</span>
                                <p className="text-xs text-amber-900 font-medium italic mt-0.5">{org.blockReason}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleUnblockUser(org._id, org.name)}
                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-xs"
                          >
                            <UserCheck className="w-4 h-4" />
                            <span>Unblock Organizer</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(org._id)}
                            className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition border border-red-200"
                            title="Delete Organizer Permanently"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
                    <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
                    <h3 className="font-black text-slate-800 text-base">No Blocked Organizers</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      There are currently no organizers under active ban or sanction matching the selected filters.
                    </p>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetailsModal && selectedStudentForDetails && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Student Profile</h3>
              <button
                onClick={() => setShowStudentDetailsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg">
                  {selectedStudentForDetails.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{selectedStudentForDetails.name}</p>
                  <p className="text-slate-500">{selectedStudentForDetails.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Roll No</span>
                  <p className="font-bold text-slate-800">{selectedStudentForDetails.studentDetails?.rollNo || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Class</span>
                  <p className="font-bold text-slate-800">{selectedStudentForDetails.studentDetails?.class || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Branch</span>
                  <p className="font-bold text-slate-800">{selectedStudentForDetails.studentDetails?.branch || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Year</span>
                  <p className="font-bold text-slate-800">{selectedStudentForDetails.studentDetails?.year || 'N/A'}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Mobile</span>
                <p className="font-bold text-slate-800">{selectedStudentForDetails.studentDetails?.mobileNo || 'N/A'}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase font-bold">College</span>
                <p className="font-bold text-slate-800">{selectedStudentForDetails.collegeName}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Account Status</span>
                  <p className="font-bold text-slate-800">
                    {selectedStudentForDetails.isApproved ? (
                      <span className="text-emerald-600 font-bold">✅ Approved & Active</span>
                    ) : (
                      <span className="text-amber-600 font-bold">⏳ Pending Admin Approval</span>
                    )}
                  </p>
                </div>
                {!selectedStudentForDetails.isApproved && (
                  <button
                    onClick={() => {
                      handleApproveStudent(selectedStudentForDetails._id);
                      setShowStudentDetailsModal(false);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button
                onClick={() => {
                  handleDeleteUser(selectedStudentForDetails._id);
                  setShowStudentDetailsModal(false);
                }}
                className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Delete Student
              </button>
              <button
                onClick={() => setShowStudentDetailsModal(false)}
                className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Class / Department Students Roster Modal */}
      {showClassStudentsModal && (() => {
        const collegeData = data.find(c => c.college === selectedCollegeForStudents) || data[0];
        const allActiveStudents = (collegeData?.students || []).filter(s => !s.isBlocked);
        const availableDepts = [...new Set(allActiveStudents.map(s => s.studentDetails?.branch || 'General'))].filter(Boolean);
        const deptFiltered = selectedBranchForStudents 
          ? allActiveStudents.filter(s => (s.studentDetails?.branch || 'General') === selectedBranchForStudents)
          : allActiveStudents;
        const availableClasses = [...new Set(deptFiltered.map(s => s.studentDetails?.class || 'N/A'))].filter(Boolean);
        
        const q = classStudentSearchQuery.trim().toLowerCase();
        const finalStudents = deptFiltered.filter(s => {
          const matchClass = selectedClassForStudents ? (s.studentDetails?.class || 'N/A') === selectedClassForStudents : true;
          const matchSearch = !q || 
            (s.name?.toLowerCase().includes(q) || 
             s.email?.toLowerCase().includes(q) || 
             (s.studentDetails?.rollNo || '').toLowerCase().includes(q) || 
             (s.studentDetails?.mobileNo || '').toLowerCase().includes(q));
          return matchClass && matchSearch;
        });

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">Student Directory & Rosters</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold">
                      {finalStudents.length} Student{finalStudents.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {selectedCollegeForStudents} {selectedBranchForStudents ? `• Dept: ${selectedBranchForStudents}` : '• All Depts'} {selectedClassForStudents ? `• Class: ${selectedClassForStudents}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setShowClassStudentsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Department & Class Filter Pills */}
              <div className="py-3 border-b border-slate-100 space-y-2 shrink-0">
                {/* Dept pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Dept:</span>
                  <button
                    onClick={() => {
                      setSelectedBranchForStudents(null);
                      setSelectedClassForStudents(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                      selectedBranchForStudents === null ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({allActiveStudents.length.toString().padStart(2, '0')})
                  </button>
                  {availableDepts.map(dept => {
                    const count = allActiveStudents.filter(s => (s.studentDetails?.branch || 'General') === dept).length;
                    return (
                      <button
                        key={dept}
                        onClick={() => {
                          setSelectedBranchForStudents(dept);
                          setSelectedClassForStudents(null);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          selectedBranchForStudents === dept ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {dept} ({count.toString().padStart(2, '0')})
                      </button>
                    );
                  })}
                </div>

                {/* Class pills */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Class:</span>
                  <button
                    onClick={() => setSelectedClassForStudents(null)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                      selectedClassForStudents === null ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All ({deptFiltered.length.toString().padStart(2, '0')})
                  </button>
                  {availableClasses.map(cls => {
                    const count = deptFiltered.filter(s => (s.studentDetails?.class || 'N/A') === cls).length;
                    return (
                      <button
                        key={cls}
                        onClick={() => setSelectedClassForStudents(cls)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                          selectedClassForStudents === cls ? 'bg-slate-900 text-white shadow-xs' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                      >
                        {cls} ({count.toString().padStart(2, '0')})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search filter */}
              <div className="relative my-3 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search students by name, roll no, email, or mobile..."
                  value={classStudentSearchQuery}
                  onChange={(e) => setClassStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Students List */}
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {finalStudents.length > 0 ? (
                  finalStudents.map(s => (
                    <div
                      key={s._id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between text-xs gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {s.name?.charAt(0) || 'S'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 truncate">{s.name}</p>
                            {!s.isApproved && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Pending</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            Roll: <span className="font-semibold text-slate-700">{s.studentDetails?.rollNo || 'N/A'}</span> • {s.studentDetails?.branch || 'General'} {s.studentDetails?.class ? `• ${s.studentDetails.class}` : ''} • {s.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] font-mono text-slate-600 bg-white px-2 py-1 rounded-lg border border-slate-200">
                          {s.studentDetails?.mobileNo || 'No Phone'}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedStudentForDetails(s);
                            setShowStudentDetailsModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!s.isApproved && (
                          <button
                            onClick={() => handleApproveStudent(s._id)}
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                            title="Approve Student"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBlockUser(s._id, s.name, 'student')}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                          title="Block Student (Moves to Blocklist)"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(s._id)}
                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No students found matching current filters or search query.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 mt-2 shrink-0">
                <button
                  onClick={() => setShowClassStudentsModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
                >
                  Close Roster
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Branch Organizers Modal */}
      {showBranchOrgsModal && (() => {
        const collegeData = data.find(c => c.college === selectedCollegeForOrgs) || data[0];
        const allActiveOrgs = (collegeData?.organizers || []).filter(o => !o.isBlocked);
        const availableBranches = [...new Set(allActiveOrgs.map(o => o.organizerDetails?.department || 'General'))].filter(Boolean);
        
        const q = orgSearchQuery.trim().toLowerCase();
        const finalOrgs = allActiveOrgs.filter(o => {
          const matchBranch = selectedBranchForOrgs ? (o.organizerDetails?.department || 'General') === selectedBranchForOrgs : true;
          const matchSearch = !q || 
            (o.name?.toLowerCase().includes(q) || 
             o.email?.toLowerCase().includes(q) || 
             (o.organizerDetails?.department || '').toLowerCase().includes(q));
          return matchBranch && matchSearch;
        });

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">Campus Organizers</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold">
                      {finalOrgs.length} Organizer{finalOrgs.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {selectedCollegeForOrgs} {selectedBranchForOrgs ? `• Branch: ${selectedBranchForOrgs}` : '• All Branches'}
                  </p>
                </div>
                <button
                  onClick={() => setShowBranchOrgsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Branch Filter Pills */}
              <div className="py-3 border-b border-slate-100 flex flex-wrap items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Branch:</span>
                <button
                  onClick={() => setSelectedBranchForOrgs(null)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                    selectedBranchForOrgs === null ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({allActiveOrgs.length.toString().padStart(2, '0')})
                </button>
                {availableBranches.map(b => {
                  const count = allActiveOrgs.filter(o => (o.organizerDetails?.department || 'General') === b).length;
                  return (
                    <button
                      key={b}
                      onClick={() => setSelectedBranchForOrgs(b)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                        selectedBranchForOrgs === b ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {b} ({count.toString().padStart(2, '0')})
                    </button>
                  );
                })}
              </div>

              {/* Search filter */}
              <div className="relative my-3 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search organizers by name, email, or department..."
                  value={orgSearchQuery}
                  onChange={(e) => setOrgSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Organizers List */}
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {finalOrgs.length > 0 ? (
                  finalOrgs.map(org => (
                    <div
                      key={org._id}
                      className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 flex items-center justify-between text-xs gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {org.name?.charAt(0) || 'O'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 truncate">{org.name}</p>
                            <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">
                              {org.organizerDetails?.department || 'Organizer'}
                            </span>
                            {!org.isApproved && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">Pending</span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {org.email} {org.organizerDetails?.mobileNo ? `• Mo: ${org.organizerDetails.mobileNo}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!org.isApproved && (
                          <button
                            onClick={() => handleApproveOrganizer(org._id)}
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                            title="Approve Organizer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleBlockUser(org._id, org.name, 'organizer')}
                          className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                          title="Block Organizer (Moves to Blocklist)"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(org._id)}
                          className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                          title="Delete Organizer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No organizers found matching current branch or search query.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 mt-2 shrink-0">
                <button
                  onClick={() => setShowBranchOrgsModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
                >
                  Close Organizers Directory
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* College Events Modal */}
      {showCollegeEventsModal && (() => {
        const collegeEventsList = allEvents.filter(e => e.college === selectedCollegeForEvents);
        const availableCategories = [...new Set(collegeEventsList.map(e => e.category || 'General'))].filter(Boolean);
        
        const q = collegeEventSearchQuery.trim().toLowerCase();
        const finalEvents = collegeEventsList.filter(e => {
          const matchCategory = selectedCategoryForEvents ? (e.category || 'General') === selectedCategoryForEvents : true;
          const matchSearch = !q || 
            (e.name?.toLowerCase().includes(q) || 
             (e.description || '').toLowerCase().includes(q) || 
             (e.category || '').toLowerCase().includes(q));
          return matchCategory && matchSearch;
        });

        return (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">Campus Events & Activities</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[11px] font-bold">
                      {finalEvents.length} Event{finalEvents.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {selectedCollegeForEvents} {selectedCategoryForEvents ? `• Category: ${selectedCategoryForEvents}` : '• All Categories'}
                  </p>
                </div>
                <button
                  onClick={() => setShowCollegeEventsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="py-3 border-b border-slate-100 flex flex-wrap items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Category:</span>
                <button
                  onClick={() => setSelectedCategoryForEvents(null)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                    selectedCategoryForEvents === null ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({collegeEventsList.length.toString().padStart(2, '0')})
                </button>
                {availableCategories.map(cat => {
                  const count = collegeEventsList.filter(e => (e.category || 'General') === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryForEvents(cat)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold transition ${
                        selectedCategoryForEvents === cat ? 'bg-teal-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat} ({count.toString().padStart(2, '0')})
                    </button>
                  );
                })}
              </div>

              {/* Search filter */}
              <div className="relative my-3 shrink-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search events by title or description..."
                  value={collegeEventSearchQuery}
                  onChange={(e) => setCollegeEventSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Events List */}
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 custom-scrollbar">
                {finalEvents.length > 0 ? (
                  finalEvents.map(event => (
                    <div
                      key={event._id}
                      className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 text-xs transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{event.name}</h4>
                            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 text-[10px] font-bold">
                              {event.category || 'General'}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                              {event.level || 'College'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{event.description}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleViewParticipants(event)}
                            className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 text-blue-700 transition"
                            title="View Participants"
                          >
                            <Users className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => exportEventRegistrationsToExcel(event)}
                            className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                            title="Export Registrations to Excel"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEventForLeaderboard(event);
                              setShowLeaderboardModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-700 transition"
                            title="Manage Leaderboard / Winners"
                          >
                            <Trophy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedEventForCertificates(event);
                              setShowCertificateModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-700 transition"
                            title="Manage Certificates"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                          {!event.isApproved && (
                            <>
                              <button
                                onClick={() => handleApproveEvent(event._id)}
                                className="p-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                                title="Approve Event"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRejectEvent(event._id)}
                                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                                title="Reject Event"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => handleDeleteEvent(event._id)}
                            className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>Date: {new Date(event.date).toLocaleDateString()} {event.time ? `• ${event.time}` : ''}</span>
                        <span className="font-bold text-slate-700">{event.registrations?.length || 0} enrolled participants</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No events found in this category or search query.
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-4 border-t border-slate-100 mt-2 shrink-0">
                <button
                  onClick={() => setShowCollegeEventsModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs transition"
                >
                  Close Events Directory
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Participants Modal */}
      {showParticipantsModal && selectedEventForParticipants && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-3xl shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Enrolled Participants</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedEventForParticipants.name}</p>
              </div>
              <button
                onClick={() => setShowParticipantsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {loadingParticipants ? (
              <div className="py-12 text-center text-slate-400">Loading participant rosters...</div>
            ) : participants.length > 0 ? (
              <div className="space-y-4">
                {participants.map((reg, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                    {reg.teamName ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-purple-900 text-sm">Team: {reg.teamName}</span>
                          <span className="text-slate-400 text-[11px]">
                            Leader: {reg.teamLeader?.name} ({reg.teamLeader?.studentDetails?.rollNo || 'N/A'})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                          {reg.teamMembers?.map((m, i) => (
                            <div key={i} className="p-2 bg-white rounded-lg border border-slate-200">
                              <p className="font-bold text-slate-800">{m.name}</p>
                              <p className="text-[10px] text-slate-400">Roll: {m.rollNo || 'N/A'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{reg.student?.name || 'N/A'}</p>
                          <p className="text-[11px] text-slate-400">{reg.student?.email} • {reg.mobileNo}</p>
                        </div>
                        <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          Roll: {reg.student?.studentDetails?.rollNo || 'N/A'}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-12 text-center text-slate-400">No participants registered for this event yet.</p>
            )}

            <button
              onClick={() => setShowParticipantsModal(false)}
              className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      {showLeaderboardModal && selectedEventForLeaderboard && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Event Leaderboard
              </h3>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {[...(selectedEventForLeaderboard.winners || [])]
                .sort((a, b) => a.position - b.position)
                .map((winner) => (
                  <div key={winner.position} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs">
                    <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm shrink-0 mt-0.5">
                      {winner.position === 1 ? '🥇' : winner.position === 2 ? '🥈' : winner.position === 3 ? '🥉' : `#${winner.position}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      {winner.isTeamWinner || winner.teamName || selectedEventForLeaderboard.isGroupEvent ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-sm truncate">👥 {winner.teamName || winner.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Team</span>
                          </div>
                          {winner.teamLeaderName && (
                            <p className="text-[11px] text-slate-600">Leader: <span className="font-semibold text-slate-800">{winner.teamLeaderName}</span></p>
                          )}
                          {winner.teamMembers && winner.teamMembers.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {winner.teamMembers.map((m, mIdx) => (
                                <span key={mIdx} className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] text-slate-700">
                                  {m.name || m} {m.rollNo ? `(${m.rollNo})` : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="font-bold text-slate-900 text-sm">👤 {winner.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {winner.rollNo && `Roll: ${winner.rollNo}`} {winner.class && `• Class: ${winner.class}`} {winner.branch && `• Dept: ${winner.branch}`}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setShowLeaderboardModal(false)}
              className="w-full mt-6 py-3 bg-slate-900 text-white font-bold rounded-xl text-xs transition"
            >
              Close
            </button>
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
          onUpdated={fetchAdminData}
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

export default AdminDashboard;
