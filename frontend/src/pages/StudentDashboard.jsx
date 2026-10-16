import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutGrid, 
  Building2, 
  Users, 
  Search, 
  MapPin, 
  Calendar, 
  Clock, 
  ChevronRight, 
  Info, 
  CreditCard, 
  Trophy, 
  User, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Crown, 
  Trash2, 
  X,
  Share2,
  Bookmark,
  Check,
  ShieldCheck,
  ShieldAlert,
  Phone,
  Mail,
  Zap,
  Filter,
  Award,
  ExternalLink,
  Download,
  Globe,
  Layers,
} from 'lucide-react';
import { API_URL } from '../apiConfig';
import CertificateModal from '../components/CertificateModal';
import CertificateNotificationPopup from '../components/CertificateNotificationPopup';

const StudentDashboard = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('institute');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  
  // Certificates state
  const [myCertificates, setMyCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [selectedCertificateForView, setSelectedCertificateForView] = useState(null);
  const [notificationCertificate, setNotificationCertificate] = useState(null);
  const [certificateSearchQuery, setCertificateSearchQuery] = useState('');
  const [certificateTypeFilter, setCertificateTypeFilter] = useState('ALL'); // 'ALL' | 'winner' | 'participant'

  // Modals state
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

  // Requirement 1: Expandable full event description tracking
  const [expandedDescriptionMap, setExpandedDescriptionMap] = useState({});

  // Requirement 3: Profile customization state for 'OTHER'
  const [profileBranchSelect, setProfileBranchSelect] = useState(user?.studentDetails?.branch || '');
  const [profileCustomBranch, setProfileCustomBranch] = useState('');
  const [profileClassSelect, setProfileClassSelect] = useState(user?.studentDetails?.class || '');
  const [profileCustomClass, setProfileCustomClass] = useState('');

  // Requirement 6: Team Invitations and Slot Replacement state
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [respondingInvitationId, setRespondingInvitationId] = useState(null);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [replaceTargetEvent, setReplaceTargetEvent] = useState(null);
  const [replaceTargetReg, setReplaceTargetReg] = useState(null);
  const [replaceClassmates, setReplaceClassmates] = useState([]);
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('');
  const [selectedReplacementStudent, setSelectedReplacementStudent] = useState(null);
  const [replacingMember, setReplacingMember] = useState(false);
  const [isUserBlocked, setIsUserBlocked] = useState(user?.isBlocked || false);

  // Check if student profile is incomplete
  useEffect(() => {
    if (user && user.role === 'student' && (!user.studentDetails || !user.studentDetails.branch)) {
      setShowProfileModal(true);
    } else {
      setShowProfileModal(false);
    }
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdownIndex(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const fetchMyCertificates = async () => {
    try {
      setLoadingCertificates(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events/my-certificates`, config);
      setMyCertificates(res.data || []);

      if (res.data && res.data.length > 0) {
        const dismissedKey = `dismissed_certs_${user._id}`;
        const dismissedIds = JSON.parse(sessionStorage.getItem(dismissedKey) || '[]');
        const unnotified = res.data.find(c => !dismissedIds.includes(c.certificateId));
        if (unnotified) {
          setNotificationCertificate(unnotified);
        }
      }
    } catch (err) {
      console.error('Error fetching student certificates:', err);
      if (err.response?.status === 403 && (err.response?.data?.isBlocked || err.response?.data?.message?.includes('banned'))) {
        setIsUserBlocked(true);
      }
    } finally {
      setLoadingCertificates(false);
    }
  };

  const handleDismissNotification = () => {
    if (notificationCertificate) {
      const dismissedKey = `dismissed_certs_${user._id}`;
      const dismissedIds = JSON.parse(sessionStorage.getItem(dismissedKey) || '[]');
      sessionStorage.setItem(
        dismissedKey,
        JSON.stringify([...dismissedIds, notificationCertificate.certificateId])
      );
    }
    setNotificationCertificate(null);
  };

  // Student Event Creation state
  const fetchEvents = async () => {
    if (activeTab === 'certificates') return;
    try {
      setLoading(true);
      const config = user?.token ? { headers: { Authorization: `Bearer ${user.token}` } } : {};

      let url = `${API_URL}/api/events`;
      if (activeTab === 'intercollege') {
        url += `?level=intercollege`;
      } else {
        url += `?level=${activeTab}&college=${encodeURIComponent(user.collegeName)}`;
      }

      const res = await axios.get(url, config);
      setEvents(res.data);
    } catch (err) {
      console.error('Error fetching events:', err);
      if (err.response?.status === 403 && (err.response?.data?.isBlocked || err.response?.data?.message?.includes('banned'))) {
        setIsUserBlocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.collegeName && user?.token) {
      fetchMyCertificates();
      fetchTeamInvitations();
    }
  }, [user]);

  useEffect(() => {
    if (user?.collegeName && activeTab !== 'certificates') {
      fetchEvents();
      fetchTeamInvitations();
    }
  }, [activeTab, user]);

  const fetchTeamInvitations = async () => {
    try {
      setLoadingInvitations(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events/team-invitations`, config);
      setPendingInvitations(res.data || []);
    } catch (err) {
      console.error('Error fetching team invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleRespondInvitation = async (eventId, action) => {
    try {
      setRespondingInvitationId(eventId);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(
        `${API_URL}/api/events/${eventId}/team-invitation/respond`,
        { action },
        config
      );
      alert(res.data?.message || `Invitation ${action}ed successfully.`);
      fetchTeamInvitations();
      fetchEvents();
    } catch (err) {
      console.error('Error responding to invitation:', err);
      alert(err.response?.data?.message || 'Failed to respond to team invitation.');
    } finally {
      setRespondingInvitationId(null);
    }
  };

  const handleOpenReplaceModal = async (event, teamReg) => {
    try {
      setReplaceTargetEvent(event);
      setReplaceTargetReg(teamReg);
      setSelectedReplacementStudent(null);
      setReplaceSearchQuery('');
      setShowReplaceModal(true);

      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/users/classmates?eventId=${event._id}`, config);
      setReplaceClassmates(res.data || []);
    } catch (err) {
      console.error('Error fetching classmates for replacement:', err);
      alert('Failed to load eligible candidates for slot replacement.');
    }
  };

  const handleConfirmReplaceMember = async () => {
    if (!selectedReplacementStudent) {
      alert('Please select a student to fill the remaining spot.');
      return;
    }
    try {
      setReplacingMember(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const payload = {
        newStudent: {
          student: selectedReplacementStudent._id,
          name: selectedReplacementStudent.name,
          rollNo: selectedReplacementStudent.studentDetails?.rollNo || '',
          class: selectedReplacementStudent.studentDetails?.class || '',
          branch: selectedReplacementStudent.studentDetails?.branch || '',
          email: selectedReplacementStudent.email,
          mobileNo: selectedReplacementStudent.studentDetails?.mobileNo || '',
        }
      };

      const res = await axios.put(
        `${API_URL}/api/events/${replaceTargetEvent._id}/replace-team-member`,
        payload,
        config
      );
      alert(res.data?.message || 'Invitation sent to the new team member!');
      setShowReplaceModal(false);
      setReplaceTargetEvent(null);
      setReplaceTargetReg(null);
      setSelectedReplacementStudent(null);
      fetchEvents();
    } catch (err) {
      console.error('Error replacing team member:', err);
      alert(err.response?.data?.message || 'Failed to replace team member.');
    } finally {
      setReplacingMember(false);
    }
  };

  const handleRegister = async (eventId) => {
    const event = events.find(e => e._id === eventId);
    if (!event) return;

    if (event.isGroupEvent) {
      // Group Event Registration
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        const res = await axios.get(`${API_URL}/api/users/classmates?eventId=${event._id}`, config);
        setClassmates(res.data);
        
        // Initialize members array with maxTeamSize slots
        const initialMembers = Array(event.maxTeamSize).fill(null);
        // Current user is leader by default in slot 0
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

        setMemberSearchQueries(Array(event.maxTeamSize).fill(''));
        setSelectedEventForTeam(event);
        setShowTeamModal(true);
      } catch (err) {
        console.error('Error fetching classmates:', err);
        alert(err.response?.data?.message || 'Failed to load classmates. Please ensure your branch and class profile details are filled.');
      }
    } else {
      // Individual Registration
      try {
        const config = {
          headers: { Authorization: `Bearer ${user.token}` }
        };
        const registrationData = {
          mobileNo: user.studentDetails?.mobileNo || '',
          email: user.email
        };
        
        await axios.post(`${API_URL}/api/events/${eventId}/enroll`, registrationData, config);
        alert('🎉 Congratulations! You have successfully registered for the event.');
        fetchEvents();
      } catch (err) {
        console.error('Registration Error:', err);
        alert(err.response?.data?.message || 'Failed to register for event');
      }
    }
  };

  const handleTeamRegister = async () => {
    if (!teamFormData.teamName.trim()) {
      alert('Please enter a team name');
      return;
    }

    const validMembers = teamFormData.teamMembers.filter(m => m !== null);
    const minSize = selectedEventForTeam?.minTeamSize || 2;
    if (validMembers.length < minSize) {
      alert(`Team must have at least ${minSize} members`);
      return;
    }

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
      alert('🎉 Team registered successfully!');
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
        role: slotIndex === 0 ? 'leader' : 'member'
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

  const getSelectedStudentIds = () => {
    return teamFormData.teamMembers
      .filter(m => m !== null)
      .map(m => m.student);
  };

  const getFilteredClassmates = (searchQuery) => {
    if (!searchQuery.trim()) return classmates;
    const query = searchQuery.toLowerCase();
    return classmates.filter(classmate => 
      classmate.name.toLowerCase().includes(query) ||
      classmate.studentDetails?.rollNo?.toLowerCase().includes(query)
    );
  };

  const handleUnenroll = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel your registration for this event?')) {
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      await axios.post(`${API_URL}/api/events/${eventId}/unenroll`, {}, config);
      alert('Successfully cancelled your registration.');
      fetchEvents();
      fetchTeamInvitations();
    } catch (err) {
      console.error('Unenrollment Error:', err);
      alert(err.response?.data?.message || 'Failed to unregister from event');
    }
  };

  const isRegistered = (event) => {
    if (event.isGroupEvent) {
      return event.registrations?.some(reg => {
        if (reg.teamLeader) {
          if (reg.teamLeader === user._id || reg.teamLeader?._id === user._id) {
            return true;
          }
          return reg.teamMembers?.some(tm => 
            (tm.student === user._id || tm.student?._id === user._id) && 
            !tm.isUnregistered && 
            tm.status !== 'left'
          );
        }
        return false;
      });
    }
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
          (tm.student === user._id || tm.student?._id === user._id) &&
          !tm.isUnregistered &&
          tm.status !== 'left'
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
    // 1. Inter-College / College Check
    const isInter = event.isInterCollege || event.level === 'intercollege';
    if (!isInter) {
      const myCollege = (user?.collegeName || '').trim().toLowerCase();
      const eventCollege = (event.college || '').trim().toLowerCase();
      const isDIEMS1 = myCollege.includes('diems') || myCollege.includes('deogiri');
      const isDIEMS2 = eventCollege.includes('diems') || eventCollege.includes('deogiri');
      const sameCollege = myCollege === eventCollege || (isDIEMS1 && isDIEMS2);
      if (!sameCollege) return false;
    }

    // 2. Dynamic Department Check
    const allowedDepts = (Array.isArray(event.departments) && event.departments.length > 0)
      ? event.departments
      : (event.department ? event.department.split(',').map(s => s.trim()) : ['ALL']);

    const isAll = allowedDepts.includes('ALL') || allowedDepts.some(d => d.toUpperCase() === 'ALL');
    if (!isAll) {
      const userBranch = (user?.studentDetails?.branch || '').trim().toUpperCase();
      if (!userBranch) return false;
      return allowedDepts.some(d => d.trim().toUpperCase() === userBranch);
    }

    return true;
  };

  const getEventPriority = (event) => {
    const expired = isExpired(event);
    const registered = isRegistered(event);
    const hasWinners = event.winners && event.winners.length > 0;

    if (!registered && !expired && !hasWinners) return 1; // Live & Not Registered
    if (registered && !expired && !hasWinners) return 2;  // Registered & Live
    if (hasWinners) return 3;                             // Completed (Leaderboard)
    if (expired && !hasWinners) return 4;                // Closed
    return 5;
  };

  const availableCategories = useMemo(() => {
    const cats = new Set();
    events.forEach(e => {
      if (e.category) cats.add(e.category);
    });
    return ['ALL', ...Array.from(cats)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events
      .filter(event => {
        const matchesSearch = 
          event.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          event.organizer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (event.clubName && event.clubName.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = categoryFilter === 'ALL' || event.category === categoryFilter;

        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => getEventPriority(a) - getEventPriority(b));
  }, [events, searchQuery, categoryFilter]);

  const filteredCertificates = useMemo(() => {
    return myCertificates.filter(cert => {
      const matchesSearch = 
        cert.eventName.toLowerCase().includes(certificateSearchQuery.toLowerCase()) ||
        (cert.teamName && cert.teamName.toLowerCase().includes(certificateSearchQuery.toLowerCase()));
      const matchesType = certificateTypeFilter === 'ALL' || cert.certificateType === certificateTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [myCertificates, certificateSearchQuery, certificateTypeFilter]);

  const tabs = [
    { id: 'intercollege', label: 'Inter-College', icon: Globe, desc: 'Multi-campus open competitions' },
    { id: 'institute', label: 'Institute Level', icon: Building2, desc: 'Campus-wide flagships' },
    { id: 'department', label: 'Department Level', icon: LayoutGrid, desc: 'Branch-specific contests' },
    { id: 'club', label: 'Club Level', icon: Users, desc: 'Societies & student clubs' },
    { id: 'certificates', label: `My Certificates (${myCertificates.length})`, icon: Award, desc: 'Verified institutional credentials' },
  ];

  const registeredCount = useMemo(() => {
    return events.filter(e => isRegistered(e)).length;
  }, [events]);

  if (user?.isBlocked || isUserBlocked) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-8 sm:p-10 text-center border-2 border-red-200 shadow-2xl shadow-red-500/10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-5 border border-red-200 shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <span className="inline-block px-3.5 py-1 rounded-full bg-red-100 text-red-800 text-xs font-black uppercase tracking-wider mb-3">
            Account Restricted
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
            You Have Been Banned by College Admin
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6">
            Your UniVance student account has been restricted by your college administration. Please contact your college administration, academic office, or department head for assistance and account review.
          </p>

          <div className="bg-slate-50 rounded-2xl p-4 text-xs text-left mb-6 border border-slate-200 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Student Name:</span>
              <span className="font-bold text-slate-800">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">College:</span>
              <span className="font-bold text-slate-800">{user?.collegeName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Department:</span>
              <span className="font-bold text-teal-700">{user?.studentDetails?.branch || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Roll Number:</span>
              <span className="font-bold text-slate-800">{user?.studentDetails?.rollNo || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Email:</span>
              <span className="font-medium text-slate-600 truncate max-w-[180px]">{user?.email}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Refresh Status
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-md shadow-red-500/20"
            >
              Logout & Exit
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-300">
      {/* Student Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#003B5C] via-slate-900 to-[#004e6b] rounded-3xl p-6 sm:p-10 mb-10 text-white shadow-xl shadow-slate-900/10 border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-teal-300 border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-teal-300" />
              <span>{user?.collegeName} Student Portal</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-teal-300">{user?.name}</span> 👋
            </h1>
            
            <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
              Discover competitions, technical hackathons, cultural festivals, and sports leagues across campuses.
            </p>

            {/* Student Profile Quick Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
              <span className="px-3 py-1 bg-white/10 rounded-lg font-bold border border-white/10">
                Dept: <span className="text-teal-300">{user?.studentDetails?.branch || 'Not Set'}</span>
              </span>
              <span className="px-3 py-1 bg-white/10 rounded-lg font-bold border border-white/10">
                Class: <span className="text-teal-300">{user?.studentDetails?.class || 'Not Set'}</span>
              </span>
              <span className="px-3 py-1 bg-white/10 rounded-lg font-bold border border-white/10">
                Roll: <span className="text-teal-300">{user?.studentDetails?.rollNo || 'Not Set'}</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards & Create Event CTA */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-3 shrink-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 text-center">
                <span className="text-2xl sm:text-3xl font-black text-white">{events.length}</span>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Events</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 text-center">
                <span className="text-2xl sm:text-3xl font-black text-teal-300">{registeredCount}</span>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">Enrolled</p>
              </div>
              <div 
                onClick={() => setActiveTab('certificates')}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/10 text-center cursor-pointer transition group"
                title="Click to view all your earned certificates"
              >
                <span className="text-2xl sm:text-3xl font-black text-amber-300 group-hover:scale-110 inline-block transition">{myCertificates.length}</span>
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-wider mt-0.5 flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-amber-300" /> Certificates
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Background glow circle */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Requirement 6: Pending Team Invitations Notification Section */}
      {pendingInvitations.length > 0 && (
        <div className="mb-10 bg-gradient-to-r from-purple-900/90 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-7 border-2 border-purple-500/40 shadow-2xl shadow-purple-950/30 text-white animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-400/30 text-purple-300 shadow-inner">
                <Users className="w-5 h-5 text-purple-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  Team Registration Requests
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-xs font-bold border border-purple-400/30">
                    {pendingInvitations.length} Pending
                  </span>
                </h3>
                <p className="text-xs text-purple-200/80">
                  You have been invited to participate in campus events. Confirm or decline your spot below.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.eventId}
                className="bg-white/5 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-purple-400/20 hover:border-purple-400/40 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/30">
                        {inv.eventCategory || 'Competition'}
                      </span>
                      <h4 className="font-black text-white text-base mt-1.5">{inv.eventName}</h4>
                    </div>
                    <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-2.5 py-1 rounded-lg">
                      {new Date(inv.eventDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  <div className="bg-purple-950/40 p-3 rounded-xl border border-purple-500/15 mb-4 text-xs space-y-1">
                    <p className="text-purple-200">
                      Team: <strong className="text-white font-bold">{inv.teamName}</strong>
                    </p>
                    <p className="text-purple-300/80 text-[11px]">
                      Leader / Creator: <span className="text-purple-100 font-semibold">{inv.teamLeaderName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleRespondInvitation(inv.eventId, 'accept')}
                    disabled={respondingInvitationId === inv.eventId}
                    className="flex-1 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{respondingInvitationId === inv.eventId ? 'Processing...' : 'Accept & Join'}</span>
                  </button>
                  <button
                    onClick={() => handleRespondInvitation(inv.eventId, 'reject')}
                    disabled={respondingInvitationId === inv.eventId}
                    className="flex-1 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-200 hover:text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-red-500/30 transition disabled:opacity-50"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs - Level Selector */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 bg-slate-100/80 p-2 rounded-2xl max-w-2xl mx-auto border border-slate-200/80">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full sm:w-auto flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-600 shadow-md shadow-slate-200/50 border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Branch: Certificates Vault vs Events Browser */}
      {activeTab === 'certificates' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Certificates Toolbar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setCertificateTypeFilter('ALL')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  certificateTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Certificates ({myCertificates.length})
              </button>
              <button
                onClick={() => setCertificateTypeFilter('winner')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  certificateTypeFilter === 'winner'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>Winner ({myCertificates.filter(c => c.certificateType === 'winner').length})</span>
              </button>
              <button
                onClick={() => setCertificateTypeFilter('participant')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  certificateTypeFilter === 'participant'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Participant ({myCertificates.filter(c => c.certificateType === 'participant').length})</span>
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search certificates by event or team..."
                value={certificateSearchQuery}
                onChange={(e) => setCertificateSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {certificateSearchQuery && (
                <button
                  onClick={() => setCertificateSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Certificates Grid */}
          {loadingCertificates ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(n => (
                <div key={n} className="bg-white rounded-3xl h-64 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : filteredCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCertificates.map((cert) => {
                const isWinner = cert.certificateType === 'winner';
                return (
                  <div
                    key={cert.certificateId}
                    className={`bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border-2 flex flex-col justify-between ${
                      isWinner ? 'border-amber-300 hover:border-amber-400' : 'border-teal-200 hover:border-teal-300'
                    }`}
                  >
                    {/* Header Banner */}
                    <div className={`p-5 text-white ${
                      isWinner
                        ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800'
                        : 'bg-gradient-to-br from-[#003B5C] via-slate-900 to-[#004e6b]'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold tracking-widest uppercase bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-white">
                            {cert.eventCategory || 'Technical Event'}
                          </span>
                          {cert.isEventDeleted && (
                            <span className="text-[9px] font-bold tracking-wider bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full text-white/90 border border-white/20">
                              Permanent Vault
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-white/95">
                          {isWinner ? <Trophy className="w-4 h-4 text-amber-200" /> : <Award className="w-4 h-4 text-teal-200" />}
                          <span>{isWinner ? cert.positionText : 'Participant'}</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-black tracking-tight line-clamp-1">{cert.eventName}</h3>
                      <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                        Deogiri Institute of Engg & Mgmt Studies
                      </p>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 flex-1 space-y-3">
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Recipient Name</p>
                        <p className="font-black text-slate-900 text-sm">{cert.studentName}</p>
                        {cert.teamName && (
                          <p className="text-[11px] text-purple-700 font-bold bg-purple-50 inline-block px-2 py-0.5 rounded">
                            Team: {cert.teamName}
                          </p>
                        )}
                        {(cert.rollNo || cert.branch) && (
                          <p className="text-[11px] text-slate-500 font-medium">
                            {cert.rollNo && `Roll: ${cert.rollNo}`} {cert.branch && `• Dept: ${cert.branch}`} {cert.class && `• Class: ${cert.class}`}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-slate-600">
                        <div>
                          <span className="text-slate-400 block text-[10px]">EVENT DATE</span>
                          <strong className="text-slate-700 font-semibold">{cert.eventDateText}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">ISSUED DATE</span>
                          <strong className="text-slate-700 font-semibold">{cert.issueDateText}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                      <button
                        onClick={() => setSelectedCertificateForView(cert)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition ${
                          isWinner
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white'
                            : 'bg-gradient-to-r from-[#003B5C] to-[#00B5AD] hover:opacity-95 text-white'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>View & Download Certificate</span>
                      </button>

                      {cert.customCertificateUrl && (
                        <a
                          href={cert.customCertificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-purple-200 transition"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open in Drive / Personalized</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-slate-900 text-base mb-1">No Certificates Found</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                {certificateSearchQuery
                  ? 'No certificates match your search query.'
                  : 'You do not have any certificates allocated yet. Participate in campus events to earn official verified credentials!'}
              </p>
              <button
                onClick={() => {
                  setCertificateSearchQuery('');
                  setActiveTab('institute');
                }}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition"
              >
                Explore Campus Events
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Search and Category Filter Toolbar */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by event title, organizer, or club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-sm font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips */}
        {availableCategories.length > 2 && (
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-3xl mx-auto">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filter:
            </span>
            {availableCategories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white rounded-3xl h-96 animate-pulse border border-slate-200" />
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => {
            const registered = isRegistered(event);
            const expired = isExpired(event);
            const eligible = isEligible(event);
            const hasWinners = event.winners && event.winners.length > 0;
            const isFull = event.registrationLimit > 0 && event.registrations.length >= event.registrationLimit;
            const eventCerts = myCertificates.filter(c => String(c.eventId) === String(event._id));

            return (
              <div
                key={event._id}
                className="group bg-white rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col relative"
              >
                {/* Event Photo Cover */}
                <div className="h-52 overflow-hidden relative bg-slate-900">
                  <img
                    src={event.photo || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80'}
                    alt={event.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90"
                  />

                  {/* Top-right Badges */}
                  <div className="absolute top-3.5 right-3.5 flex flex-col gap-1.5 items-end">
                    {event.category && (
                      <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 shadow-xs">
                        {event.category}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-xs ${
                      event.isGroupEvent
                        ? 'bg-purple-600/90 text-white backdrop-blur-md'
                        : 'bg-teal-600/90 text-white backdrop-blur-md'
                    }`}>
                      {event.isGroupEvent ? `Team (${event.minTeamSize}-${event.maxTeamSize})` : 'Individual'}
                    </span>
                  </div>

                  {/* Top-left Badges */}
                  <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 items-start">
                    {(event.isInterCollege || event.level === 'intercollege') ? (
                      <div className="bg-purple-950/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-purple-200 uppercase tracking-wider border border-purple-400/40 shadow-lg">
                        🌐 Inter-College
                      </div>
                    ) : (
                      <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-wider border border-slate-700">
                        🏛️ Intra-College
                      </div>
                    )}
                    {event.level === 'club' && event.clubName && (
                      <div className="bg-purple-950/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-purple-300 uppercase tracking-wider border border-purple-500/20">
                        {event.clubName}
                      </div>
                    )}
                    {event.departments && !event.departments.includes('ALL') && event.departments.length > 0 ? (
                      <div className="bg-teal-950/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-teal-300 uppercase tracking-wider border border-teal-500/30">
                        Depts: {event.departments.join(', ')}
                      </div>
                    ) : event.level === 'department' ? (
                      <div className="bg-blue-950/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-blue-300 uppercase tracking-wider border border-blue-500/20">
                        Dept: {event.department}
                      </div>
                    ) : null}
                  </div>

                  {/* Live / Status Banner at bottom of image */}
                  <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs">
                    {hasWinners ? (
                      <span className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold flex items-center gap-1 shadow-xs">
                        <Trophy className="w-3.5 h-3.5" /> Results Out
                      </span>
                    ) : registered ? (
                      <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-bold flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled
                      </span>
                    ) : expired ? (
                      <span className="px-3 py-1 rounded-lg bg-red-600/90 text-white font-bold shadow-xs">
                        Registration Closed
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-blue-600/90 text-white font-bold flex items-center gap-1 shadow-xs">
                        <Zap className="w-3 h-3" /> Live Event
                      </span>
                    )}

                    {eventCerts.length > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold flex items-center gap-1 shadow-xs text-[10px]">
                        <Award className="w-3 h-3" /> Cert Ready
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6 flex-1 flex flex-col">
                  {/* Title */}
                  <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition tracking-tight">
                    {event.name}
                  </h3>

                  {/* Description Box with full expand/collapse (Requirement 1) */}
                  <div className="mb-4">
                    <p className={`text-xs text-slate-600 leading-relaxed whitespace-pre-line ${
                      expandedDescriptionMap[event._id] ? '' : 'line-clamp-2'
                    }`}>
                      {event.description}
                    </p>
                    {event.description && event.description.length > 90 && (
                      <button
                        type="button"
                        onClick={() => setExpandedDescriptionMap(prev => ({
                          ...prev,
                          [event._id]: !prev[event._id]
                        }))}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline mt-1 inline-flex items-center gap-1"
                      >
                        {expandedDescriptionMap[event._id] ? 'Show Less' : 'Read Full Description'}
                      </button>
                    )}
                  </div>

                  {/* Event Details Grid */}
                  <div className="space-y-2.5 mb-5 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Calendar className={`w-4 h-4 shrink-0 ${expired ? 'text-red-500' : 'text-blue-500'}`} />
                      <span className="font-semibold">Deadline:</span>
                      <span className={expired ? 'text-red-600 font-bold' : ''}>
                        {new Date(event.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Clock className={`w-4 h-4 shrink-0 ${expired ? 'text-red-500' : 'text-amber-500'}`} />
                      <span className="font-semibold">Time:</span>
                      <span>{event.time}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Building2 className="w-4 h-4 shrink-0 text-indigo-500" />
                      <span className="font-semibold">Host College:</span>
                      <span className="truncate font-bold text-slate-900">{event.college}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Layers className="w-4 h-4 shrink-0 text-teal-600" />
                      <span className="font-semibold">Eligible Depts:</span>
                      <span className="truncate font-semibold text-teal-700">
                        {event.departments && !event.departments.includes('ALL') && event.departments.length > 0
                          ? event.departments.join(', ')
                          : (event.department || 'All Departments')}
                      </span>
                    </div>

                    {/* Registration Capacity Progress Bar */}
                    {event.registrationLimit > 0 && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <div className="flex justify-between items-center text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Capacity</span>
                          <span className={isFull ? 'text-red-600 font-bold' : 'text-slate-700'}>
                            {event.registrations.length} / {event.registrationLimit} {event.isGroupEvent ? 'teams' : 'slots'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${
                              isFull ? 'bg-red-500' : 'bg-blue-600'
                            }`}
                            style={{ 
                              width: `${Math.min(100, (event.registrations.length / event.registrationLimit) * 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Payment Details (UPI) - If Enrolled */}
                  {registered && event.upiId && (
                    <div className="mb-4 bg-blue-50/80 p-3.5 rounded-2xl border border-blue-200/80 text-xs animate-in fade-in">
                      <div className="flex items-center justify-between font-bold text-blue-900 mb-1">
                        <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-blue-600">
                          <CreditCard className="w-3.5 h-3.5" /> Payment Required
                        </span>
                        <span className="font-mono text-blue-700 font-bold">{event.upiId}</span>
                      </div>
                      <p className="text-[11px] text-blue-600">
                        Please pay registration fees via UPI to confirm entry.
                      </p>
                    </div>
                  )}

                  {/* Requirement 6: Team Registration Summary & Invitation Statuses */}
                  {event.isGroupEvent && registered && (() => {
                    const teamReg = getTeamRegistration(event);
                    if (!teamReg) return null;
                    const isLeader = teamReg.teamLeader === user._id || teamReg.teamLeader?._id === user._id;
                    const hasRejectedMember = teamReg.teamMembers?.some(m => m.status === 'rejected');
                    const hasLeftMember = teamReg.teamMembers?.some(m => m.status === 'left' || m.isUnregistered);
                    const hasVacatedMember = hasRejectedMember || hasLeftMember;
                    const hasPendingMember = teamReg.teamMembers?.some(m => m.status === 'pending');
                    const isFullyConfirmed = teamReg.status === 'confirmed' && !hasVacatedMember;

                    return (
                      <div className="mb-4 bg-purple-50/90 p-4 rounded-2xl border border-purple-200 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-black text-purple-900">Team: {teamReg.teamName}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isFullyConfirmed
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : hasVacatedMember
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                          }`}>
                            {isFullyConfirmed ? 'Confirmed' : hasLeftMember ? 'Member Left / Incomplete' : hasRejectedMember ? 'Request Rejected' : 'Pending Approvals'}
                          </span>
                        </div>

                        {/* Vacated / Rejected Alert for Leader */}
                        {hasVacatedMember && isLeader && (
                          <div className="mb-2.5 p-2.5 bg-red-100/90 border border-red-300 rounded-xl text-red-900 text-[11px]">
                            <p className="font-bold flex items-center gap-1 mb-1">
                              <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                              {hasLeftMember 
                                ? 'A teammate cancelled their registration and left the team!'
                                : 'A teammate declined the invitation.'}
                            </p>
                            <p className="text-red-700 mb-2">
                              Your team registration is incomplete. Existing accepted members stay intact—only fill the open spot.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleOpenReplaceModal(event, teamReg)}
                              className="w-full py-1.5 px-3 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold rounded-lg text-xs transition shadow-xs flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Fill Remaining Spot (Replace Member)</span>
                            </button>
                          </div>
                        )}

                        {/* Informational Alert for non-leader teammates */}
                        {hasVacatedMember && !isLeader && (
                          <div className="mb-2.5 p-2 bg-amber-100 border border-amber-200 rounded-xl text-amber-900 text-[11px] flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>A teammate left or declined. The team leader needs to invite a replacement to re-confirm.</span>
                          </div>
                        )}

                        <div className="space-y-1.5 pt-1">
                          {teamReg.teamMembers?.map((m, idx) => {
                            const isMe = (m.student === user._id || m.student?._id === user._id);
                            const isLeft = m.status === 'left' || m.isUnregistered;
                            const isRejected = m.status === 'rejected';

                            return (
                              <div key={idx} className={`flex items-center justify-between text-[11px] px-2.5 py-1.5 rounded-lg border ${
                                isLeft || isRejected 
                                  ? 'bg-red-50/80 border-red-200' 
                                  : 'bg-white/70 border-purple-100'
                              }`}>
                                <div className="truncate mr-2">
                                  <span className={`font-medium ${isLeft || isRejected ? 'line-through text-red-500' : 'text-slate-800'}`}>
                                    {m.name || 'Member'}
                                  </span>
                                  {m.rollNo && <span className="text-slate-400 text-[10px] ml-1">({m.rollNo})</span>}
                                  {isMe && <span className="font-bold text-purple-700 text-[10px] ml-1">(You)</span>}
                                </div>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                  m.status === 'accepted'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : isLeft
                                      ? 'bg-red-200 text-red-800 font-extrabold'
                                      : isRejected
                                        ? 'bg-red-100 text-red-700 font-extrabold'
                                        : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {m.status === 'accepted' ? 'Accepted' : isLeft ? 'Left Team' : isRejected ? 'Rejected' : 'Pending'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Organizer Contact Summary */}
                  <div className="pt-3 border-t border-slate-100 mb-4 flex items-center justify-between text-xs text-slate-500">
                    <div className="truncate">
                      <span className="font-bold text-slate-700">{event.organizer?.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {event.organizer?.organizerDetails?.contactEmail || event.organizer?.email}
                      </span>
                    </div>
                    {event.organizer?.organizerDetails?.mobileNo && (
                      <a
                        href={`tel:${event.organizer.organizerDetails.mobileNo}`}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                        title="Call Organizer"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  {/* Unregister Option */}
                  {registered && !expired && (
                    <button
                      onClick={() => handleUnenroll(event._id)}
                      className="mb-2.5 w-full py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition border border-red-200"
                    >
                      Cancel Registration
                    </button>
                  )}

                  {/* Primary Action Button */}
                  <button
                    onClick={() => {
                      if (hasWinners) {
                        setSelectedEventForLeaderboard(event);
                        setShowLeaderboardModal(true);
                      } else {
                        handleRegister(event._id);
                      }
                    }}
                    disabled={!hasWinners && (!eligible || registered || expired || event.isPaused || isFull)}
                    className={`mt-auto w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                      hasWinners
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25'
                        : registered
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-default'
                          : (!eligible || expired || event.isPaused || isFull)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : 'bg-gradient-to-r from-blue-600 to-[#00B5AD] hover:from-blue-500 hover:to-[#00c7be] text-white shadow-lg shadow-blue-500/20 hover:scale-[1.01]'
                    }`}
                  >
                    {hasWinners ? (
                      <>
                        <Trophy className="w-4 h-4" />
                        <span>View Leaderboard</span>
                      </>
                    ) : registered ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Enrolled in Event</span>
                      </>
                    ) : expired ? (
                      <span>Registration Closed</span>
                    ) : event.isPaused ? (
                      <span>Registration Paused</span>
                    ) : isFull ? (
                      <span>Event Capacity Full</span>
                    ) : !eligible ? (
                      <span>Restricted to {event.department}</span>
                    ) : (
                      <>
                        <span>{event.isGroupEvent ? 'Form Team & Register' : 'Register Now'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  {/* Certificates available for this event */}
                  {eventCerts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      {eventCerts.map((cert) => (
                        <button
                          key={cert.certificateId}
                          onClick={() => setSelectedCertificateForView(cert)}
                          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-between transition border ${
                            cert.certificateType === 'winner'
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-teal-50 hover:bg-teal-100 text-teal-900 border-teal-300'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 truncate mr-2">
                            {cert.certificateType === 'winner' ? (
                              <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <Award className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            )}
                            <span className="truncate">
                              {cert.certificateType === 'winner' ? `Winner (${cert.positionText})` : 'Participant'} Certificate
                            </span>
                          </div>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold shadow-2xs shrink-0">
                            View 🎓
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">No Events Found</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto leading-relaxed">
            There are no events listed under this category right now. Check back soon or browse other levels.
          </p>
        </div>
      )}
    </>
  )}



      {/* Profile Completion Gate Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <User className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete Student Profile</h2>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                To participate in events and join classmate teams, please specify your branch, class division, and roll number.
              </p>
            </div>

            {formError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold border border-red-200">
                {formError}
              </div>
            )}

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setSubmitting(true);
                setFormError('');
                const formData = new FormData(e.target);
                const details = Object.fromEntries(formData.entries());
                try {
                  const config = { headers: { Authorization: `Bearer ${user.token}` } };
                  const response = await axios.put(`${API_URL}/api/users/profile`, details, config);
                  updateUser(response.data);
                  setShowProfileModal(false);
                } catch (err) {
                  setFormError(err.response?.data?.message || 'Failed to save student profile.');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Branch (Dept)
                  </label>
                  <select
                    required
                    value={profileBranchSelect}
                    onChange={(e) => setProfileBranchSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Dept</option>
                    <option value="CSE">CSE</option>
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="EC">EC</option>
                    <option value="MECH">MECH</option>
                    <option value="CIVIL">CIVIL</option>
                    <option value="E&TC">E&TC</option>
                    <option value="MBA">MBA</option>
                    <option value="OTHER">OTHER (Enter Manually)</option>
                  </select>

                  {profileBranchSelect === 'OTHER' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter Department Name"
                      value={profileCustomBranch}
                      onChange={(e) => setProfileCustomBranch(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-white border border-teal-500 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                    />
                  )}
                  {/* Hidden field that feeds the form submission */}
                  <input
                    type="hidden"
                    name="branch"
                    value={profileBranchSelect === 'OTHER' ? profileCustomBranch : profileBranchSelect}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Academic Year
                  </label>
                  <input
                    name="year"
                    required
                    placeholder="e.g. 3rd"
                    defaultValue={user?.studentDetails?.year || ''}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Class Division
                  </label>
                  <select
                    required
                    value={profileClassSelect}
                    onChange={(e) => setProfileClassSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    <option value="OTHER">OTHER (Enter Manually)</option>
                  </select>

                  {profileClassSelect === 'OTHER' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter Class / Div"
                      value={profileCustomClass}
                      onChange={(e) => setProfileCustomClass(e.target.value)}
                      className="mt-2 w-full px-3 py-2 bg-white border border-teal-500 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 uppercase"
                    />
                  )}
                  {/* Hidden field that feeds the form submission */}
                  <input
                    type="hidden"
                    name="class"
                    value={profileClassSelect === 'OTHER' ? profileCustomClass : profileClassSelect}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Roll Number
                  </label>
                  <input
                    name="rollNo"
                    required
                    placeholder="e.g. CS3135"
                    pattern="^[A-Za-z0-9-]{2,15}$"
                    title="2 to 15 alphanumeric characters (e.g., CS3135 or AIDS01)"
                    defaultValue={user?.studentDetails?.rollNo || ''}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Mobile Number
                </label>
                <input
                  name="mobileNo"
                  required
                  placeholder="+91 98765 43210"
                  defaultValue={user?.studentDetails?.mobileNo || ''}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-[#00B5AD] text-white font-bold rounded-xl text-xs shadow-md shadow-blue-500/20 hover:scale-[1.01] transition disabled:opacity-50"
              >
                {submitting ? 'Saving Profile...' : 'Save & Continue'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                  className="text-xs text-slate-400 hover:text-red-500 transition"
                >
                  Logout & switch account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Registration Modal */}
      {showTeamModal && selectedEventForTeam && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Register Team</h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedEventForTeam.name}</p>
                <span className="inline-block mt-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                  Required: {selectedEventForTeam.minTeamSize} to {selectedEventForTeam.maxTeamSize} Members
                </span>
              </div>
              <button
                onClick={() => setShowTeamModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleTeamRegister(); }} className="space-y-6">
              {/* Team Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Team Name
                </label>
                <input
                  required
                  placeholder="e.g. Code Warriors"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={teamFormData.teamName}
                  onChange={(e) => setTeamFormData({ ...teamFormData, teamName: e.target.value })}
                />
              </div>

              {/* Members Slots */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Team Members Selection
                </label>
                
                <div className="space-y-3">
                  {teamFormData.teamMembers.map((member, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                          {member?.role === 'leader' ? <Crown className="w-3.5 h-3.5 text-amber-500" /> : <User className="w-3.5 h-3.5 text-slate-400" />}
                          Slot {index + 1} {index < selectedEventForTeam.minTeamSize && <span className="text-red-500">*</span>}
                        </span>

                        {member && (
                          <div className="flex items-center gap-2">
                            <select
                              value={member.role}
                              onChange={(e) => handleSetRole(index, e.target.value)}
                              className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none"
                            >
                              <option value="leader">Team Leader</option>
                              <option value="member">Member</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleSelectMember(index, null)}
                              className="p-1 rounded-lg text-red-500 hover:bg-red-50 transition"
                              title="Clear slot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Member Slot Picker */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {member ? (
                          <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl">
                            <div>
                              <p className="text-xs font-bold text-slate-900">{member.name}</p>
                              <p className="text-[10px] text-slate-500">
                                Roll: {member.rollNo || 'N/A'} • Class: {member.class || 'N/A'}
                              </p>
                            </div>
                            {member.role === 'leader' && (
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                Leader
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                              <input
                                type="text"
                                placeholder="Search classmate by name or roll number..."
                                value={memberSearchQueries[index] || ''}
                                onChange={(e) => {
                                  const newQueries = [...memberSearchQueries];
                                  newQueries[index] = e.target.value;
                                  setMemberSearchQueries(newQueries);
                                  setActiveDropdownIndex(index);
                                }}
                                onFocus={() => setActiveDropdownIndex(index)}
                                className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                              />
                            </div>

                            {activeDropdownIndex === index && (
                              <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
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
                                    className="w-full px-3.5 py-2 text-left hover:bg-slate-50 border-b border-slate-100 text-xs"
                                  >
                                    <span className="font-bold text-slate-800">{user.name} (You)</span>
                                    <span className="text-slate-400 block text-[10px]">
                                      Roll: {user.studentDetails?.rollNo || 'N/A'}
                                    </span>
                                  </button>
                                )}

                                {getFilteredClassmates(memberSearchQueries[index] || '')
                                  .filter(c => !getSelectedStudentIds().includes(c._id))
                                  .map(classmate => (
                                    <button
                                      key={classmate._id}
                                      type="button"
                                      onClick={() => {
                                        handleSelectMember(index, classmate);
                                        setActiveDropdownIndex(null);
                                      }}
                                      className="w-full px-3.5 py-2 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 text-xs"
                                    >
                                      <span className="font-bold text-slate-800">{classmate.name}</span>
                                      <span className="text-slate-400 block text-[10px]">
                                        Roll: {classmate.studentDetails?.rollNo || 'N/A'} • Class: {classmate.studentDetails?.class || 'N/A'}
                                      </span>
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
                className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-purple-500/25 transition disabled:opacity-50 text-sm"
              >
                {submitting ? 'Registering Team...' : 'Confirm Team Registration'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Requirement 6: Fill Remaining Spot (Replace Member Modal) */}
      {showReplaceModal && replaceTargetEvent && replaceTargetReg && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[115] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" /> Fill Remaining Team Spot
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {replaceTargetEvent.name} • Team {replaceTargetReg.teamName}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowReplaceModal(false);
                  setReplaceTargetEvent(null);
                  setReplaceTargetReg(null);
                  setSelectedReplacementStudent(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Explanation Note */}
            <div className="mb-5 bg-purple-50 p-3.5 rounded-2xl border border-purple-200 text-xs text-purple-800 leading-relaxed">
              <strong>Keep Accepted Members Intact:</strong> You only need to choose an eligible classmate to replace the declined spot. Existing accepted members stay on your team.
            </div>

            {/* Existing Accepted Members Preview */}
            <div className="mb-5 space-y-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Current Confirmed / Accepted Members
              </label>
              {replaceTargetReg.teamMembers
                ?.filter(m => m.status !== 'rejected' && m.status !== 'left' && !m.isUnregistered)
                .map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-800">
                      {m.name} {m.rollNo ? `(${m.rollNo})` : ''}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded uppercase">
                      {m.status || 'Accepted'}
                    </span>
                  </div>
                ))}
            </div>

            {/* Spot to Fill */}
            <div className="space-y-3 mb-6">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Replacement Student for Open Spot
              </label>

              {/* Classmate Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search by name, roll no, or branch..."
                  value={replaceSearchQuery}
                  onChange={(e) => setReplaceSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Replacement Candidate List */}
              <div className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white custom-scrollbar">
                {replaceClassmates
                  .filter(c => {
                    // Exclude already active team members (allow replaced/left students if applicable, but exclude current active ones)
                    const alreadyInTeam = replaceTargetReg.teamMembers?.some(
                      tm => tm.status !== 'rejected' && tm.status !== 'left' && !tm.isUnregistered && (tm.student === c._id || tm.student?._id === c._id)
                    );
                    if (alreadyInTeam) return false;
                    if (!replaceSearchQuery.trim()) return true;
                    const q = replaceSearchQuery.toLowerCase();
                    return (
                      c.name.toLowerCase().includes(q) ||
                      c.studentDetails?.rollNo?.toLowerCase().includes(q) ||
                      c.studentDetails?.branch?.toLowerCase().includes(q)
                    );
                  })
                  .map(candidate => {
                    const isSelected = selectedReplacementStudent?._id === candidate._id;
                    return (
                      <button
                        key={candidate._id}
                        type="button"
                        onClick={() => setSelectedReplacementStudent(candidate)}
                        className={`w-full p-2.5 text-left text-xs transition flex items-center justify-between ${
                          isSelected ? 'bg-purple-50 text-purple-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">{candidate.name}</p>
                          <p className="text-[10px] text-slate-400">
                            Roll: {candidate.studentDetails?.rollNo || 'N/A'} • Dept: {candidate.studentDetails?.branch || 'N/A'} • Class: {candidate.studentDetails?.class || 'N/A'}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                      </button>
                    );
                  })}
              </div>

              {selectedReplacementStudent && (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between">
                  <span>Selected: <strong>{selectedReplacementStudent.name}</strong></span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 px-2 py-0.5 rounded">Ready to invite</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowReplaceModal(false);
                  setReplaceTargetEvent(null);
                  setReplaceTargetReg(null);
                  setSelectedReplacementStudent(null);
                }}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedReplacementStudent || replacingMember}
                onClick={handleConfirmReplaceMember}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-bold rounded-xl text-xs transition disabled:opacity-50 shadow-md shadow-purple-500/20"
              >
                {replacingMember ? 'Sending Invite...' : 'Send Invitation & Update Team'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Podium Modal */}
      {showLeaderboardModal && selectedEventForLeaderboard && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 w-full max-w-lg shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-amber-500" /> Event Leaderboard
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">{selectedEventForLeaderboard.name}</p>
              </div>
              <button
                onClick={() => setShowLeaderboardModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Podium / Winners List */}
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
              {[...(selectedEventForLeaderboard.winners || [])]
                .sort((a, b) => a.position - b.position)
                .map((winner) => {
                  const isGold = winner.position === 1;
                  const isSilver = winner.position === 2;
                  const isBronze = winner.position === 3;

                  return (
                    <div
                      key={winner.position}
                      className={`p-4 rounded-2xl border flex items-center gap-4 transition ${
                        isGold 
                          ? 'bg-amber-500/10 border-amber-300' 
                          : isSilver 
                            ? 'bg-slate-100 border-slate-300' 
                            : isBronze 
                              ? 'bg-orange-500/10 border-orange-300' 
                              : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      {/* Position Medal */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-xs ${
                        isGold
                          ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white'
                          : isSilver
                            ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white'
                            : isBronze
                              ? 'bg-gradient-to-br from-orange-400 to-amber-600 text-white'
                              : 'bg-slate-200 text-slate-700'
                      }`}>
                        {isGold ? '🥇' : isSilver ? '🥈' : isBronze ? '🥉' : `#${winner.position}`}
                      </div>

                      {/* Winner details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-black text-slate-900 text-sm truncate">
                            {winner.isTeamWinner || winner.teamName || selectedEventForLeaderboard.isGroupEvent 
                              ? `👥 ${winner.teamName || winner.name}` 
                              : `👤 ${winner.name}`}
                          </h4>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0 ${
                            isGold ? 'bg-amber-100 text-amber-800' :
                            isSilver ? 'bg-slate-200 text-slate-800' :
                            isBronze ? 'bg-orange-100 text-orange-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {isGold ? 'Champion' : isSilver ? 'Runner Up' : isBronze ? '3rd Place' : `Rank ${winner.position}`}
                          </span>
                        </div>

                        {winner.isTeamWinner || winner.teamName || selectedEventForLeaderboard.isGroupEvent ? (
                          <div className="mt-1 space-y-1">
                            {winner.teamLeaderName && (
                              <p className="text-[11px] text-slate-600">
                                Team Leader: <strong className="text-slate-800">{winner.teamLeaderName}</strong>
                              </p>
                            )}
                            {winner.teamMembers && winner.teamMembers.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {winner.teamMembers.map((m, mIdx) => (
                                  <span key={mIdx} className="px-2 py-0.5 bg-white/90 border border-slate-200/80 rounded text-[10px] text-slate-700 font-medium">
                                    {m.name || m} {m.rollNo ? `(${m.rollNo})` : ''}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[11px] text-slate-500">
                            {winner.rollNo && <span>Roll: <strong className="text-slate-700">{winner.rollNo}</strong></span>}
                            {winner.class && <span>Class: <strong className="text-slate-700">{winner.class}</strong></span>}
                            {winner.branch && <span>Dept: <strong className="text-slate-700">{winner.branch}</strong></span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            <button
              onClick={() => setShowLeaderboardModal(false)}
              className="w-full mt-6 py-3.5 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Certificate Viewer Modal */}
      {selectedCertificateForView && (
        <CertificateModal
          certificate={selectedCertificateForView}
          onClose={() => setSelectedCertificateForView(null)}
        />
      )}

      {/* Certificate Notification Popup */}
      {notificationCertificate && (
        <CertificateNotificationPopup
          latestCertificate={notificationCertificate}
          onViewCertificate={(cert) => setSelectedCertificateForView(cert)}
          onViewAllCertificates={() => setActiveTab('certificates')}
          onDismiss={handleDismissNotification}
        />
      )}
    </div>
  );
};

export default StudentDashboard;
