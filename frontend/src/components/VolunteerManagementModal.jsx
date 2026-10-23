import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  HeartHandshake, 
  MessageSquare, 
  Award, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Check, 
  Users, 
  Eye, 
  Phone, 
  Mail, 
  Building2, 
  GraduationCap 
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { exportEventVolunteersToExcel } from '../utils/exportEventExcel';

export default function VolunteerManagementModal({
  event,
  user,
  onClose,
  onUpdated,
  onPreviewCertificate,
}) {
  const [volunteers, setVolunteers] = useState([]);
  const [volunteersRequired, setVolunteersRequired] = useState(event.volunteersRequired || 0);
  const [volunteerMessage, setVolunteerMessage] = useState(event.volunteerMessage || '');
  const [loading, setLoading] = useState(true);
  const [savingMessage, setSavingMessage] = useState(false);
  const [savingCertificates, setSavingCertificates] = useState(false);
  const [messageSuccess, setMessageSuccess] = useState(false);
  const [certSuccess, setCertSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // Fetch volunteers list from server
  const fetchVolunteers = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`${API_URL}/api/events/${event._id}/volunteers`, config);
      const data = res.data;
      setVolunteers(data.volunteers || []);
      setVolunteersRequired(data.volunteersRequired || event.volunteersRequired || 0);
      setVolunteerMessage(data.volunteerMessage || event.volunteerMessage || '');

      // Initialize selected students for certificates
      const preSelected = (data.volunteers || [])
        .filter(v => v.certificateAllocated)
        .map(v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : ''))
        .filter(Boolean);
      setSelectedStudentIds(preSelected);
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      // Fallback to event doc if endpoint fails
      const fallbackVols = event.volunteers || [];
      setVolunteers(fallbackVols);
      const preSelected = fallbackVols
        .filter(v => v.certificateAllocated)
        .map(v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : ''))
        .filter(Boolean);
      setSelectedStudentIds(preSelected);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteers();
  }, [event._id]);

  // Handle saving volunteer message
  const handleSaveMessage = async () => {
    try {
      setSavingMessage(true);
      setMessageSuccess(false);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(
        `${API_URL}/api/events/${event._id}/volunteer-config`,
        { volunteerMessage },
        config
      );
      setMessageSuccess(true);
      setTimeout(() => setMessageSuccess(false), 3500);
      onUpdated?.();
    } catch (err) {
      console.error('Error saving volunteer message:', err);
      alert(err.response?.data?.message || 'Failed to update volunteer message');
    } finally {
      setSavingMessage(false);
    }
  };

  // Toggle single volunteer selection for certificate
  const toggleSelectVolunteer = (studentId) => {
    if (!studentId) return;
    const strId = studentId.toString();
    setSelectedStudentIds(prev => 
      prev.includes(strId) ? prev.filter(id => id !== strId) : [...prev, strId]
    );
  };

  // Select / Deselect all
  const handleSelectAll = () => {
    const allIds = volunteers
      .map(v => (v.student?._id ? v.student._id.toString() : v.student ? v.student.toString() : ''))
      .filter(Boolean);
    setSelectedStudentIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
  };

  // Handle saving selective volunteer certificates
  const handleSaveCertificates = async () => {
    try {
      setSavingCertificates(true);
      setCertSuccess(false);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.put(
        `${API_URL}/api/events/${event._id}/volunteer-certificates`,
        { selectedStudentIds },
        config
      );
      setVolunteers(res.data.volunteers || volunteers);
      setCertSuccess(true);
      setTimeout(() => setCertSuccess(false), 4000);
      alert('🎉 Selective volunteer certificates awarded successfully! Selected students can now view and download their certificates.');
      onUpdated?.();
    } catch (err) {
      console.error('Error saving volunteer certificates:', err);
      alert(err.response?.data?.message || 'Failed to save volunteer certificates');
    } finally {
      setSavingCertificates(false);
    }
  };

  // Handle Excel download
  const handleExportExcel = () => {
    exportEventVolunteersToExcel(
      {
        ...event,
        volunteersRequired,
        volunteerMessage,
      },
      volunteers
    );
  };

  // Filtered volunteers for search
  const filteredVolunteers = useMemo(() => {
    if (!searchQuery.trim()) return volunteers;
    const q = searchQuery.toLowerCase();
    return volunteers.filter(v => {
      const name = (v.name || v.student?.name || '').toLowerCase();
      const roll = (v.rollNo || v.student?.studentDetails?.rollNo || '').toLowerCase();
      const dept = (v.department || v.student?.studentDetails?.branch || '').toLowerCase();
      const email = (v.email || v.student?.email || '').toLowerCase();
      return name.includes(q) || roll.includes(q) || dept.includes(q) || email.includes(q);
    });
  }, [volunteers, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-white tracking-tight">
                  Volunteer Operations Command
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-400/30">
                  {volunteers.length} / {volunteersRequired || '∞'} Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {event.name} • Manage volunteers, broadcast notices, and award selective certificates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
              title="Download separate Excel sheet of volunteers"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Volunteers Excel</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* Mobile Excel Export Button */}
          <div className="sm:hidden">
            <button
              type="button"
              onClick={handleExportExcel}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>Export Volunteers Excel Sheet</span>
            </button>
          </div>

          {/* Section 1: Volunteer Instructions / Broadcast Message */}
          <div className="bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-50 p-5 rounded-2xl border border-indigo-100/80 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-indigo-950 font-black text-sm">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Organizer Message & Instructions for Volunteers</span>
              </div>
              {messageSuccess && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full animate-in fade-in">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Message Saved & Live!
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mb-3">
              This message will be instantly visible to all students who register to volunteer for this event. 
              Include reporting time, meeting location, coordinator contact numbers, or WhatsApp group links. You can edit this anytime.
            </p>
            <textarea
              rows={3}
              value={volunteerMessage}
              onChange={(e) => setVolunteerMessage(e.target.value)}
              placeholder="e.g. Dear Volunteers, please assemble at Seminar Hall A at 8:30 AM on event day for orientation. Join our WhatsApp group: https://chat.whatsapp.com/... For queries contact 9876543210."
              className="w-full px-4 py-3 bg-white border border-indigo-200/80 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-2xs leading-relaxed"
            />
            <div className="mt-2.5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {volunteerMessage.length} characters
              </span>
              <button
                type="button"
                onClick={handleSaveMessage}
                disabled={savingMessage}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingMessage ? 'Saving...' : 'Save & Publish Message'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: Selective Volunteer Certificates & Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h4 className="font-black text-sm text-slate-900">
                    Selective Volunteer Certificate Allocation
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Check individual volunteers who performed their duties to award official volunteering certificates.
                </p>
              </div>

              {/* Selection Controls & Actions */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={volunteers.length === 0}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  disabled={volunteers.length === 0}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
                >
                  Clear All
                </button>
                {onPreviewCertificate && (
                  <button
                    type="button"
                    onClick={() => onPreviewCertificate('volunteer')}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition"
                    title="Preview how student will see their volunteer certificate"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview Template</span>
                  </button>
                )}
              </div>
            </div>

            {/* Search & Selected count bar */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter by name, roll no, or branch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200/60">
                  {selectedStudentIds.length} of {volunteers.length} selected for certificates
                </span>
                <button
                  type="button"
                  onClick={handleSaveCertificates}
                  disabled={savingCertificates || volunteers.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 transition disabled:opacity-50"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{savingCertificates ? 'Allocating...' : 'Save & Issue Certificates'}</span>
                </button>
              </div>
            </div>

            {/* Volunteers Table */}
            {loading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold animate-pulse">
                Loading volunteer records...
              </div>
            ) : filteredVolunteers.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">
                  {searchQuery ? 'No volunteers match your search filter' : 'No students have volunteered for this event yet.'}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Once students click &quot;Volunteer&quot; on their dashboard, their complete details will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="p-3 w-10 text-center">Award</th>
                      <th className="p-3">Volunteer Student</th>
                      <th className="p-3">Department & Class</th>
                      <th className="p-3">College</th>
                      <th className="p-3">Contact Details</th>
                      <th className="p-3">Volunteered At</th>
                      <th className="p-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredVolunteers.map((vol, idx) => {
                      const studentId = vol.student?._id 
                        ? vol.student._id.toString() 
                        : (vol.student ? vol.student.toString() : '');
                      const isSelected = selectedStudentIds.includes(studentId);
                      const volName = vol.name || vol.student?.name || 'Volunteer';
                      const volRollNo = vol.rollNo || vol.student?.studentDetails?.rollNo || 'N/A';
                      const volBranch = vol.department || vol.student?.studentDetails?.branch || 'N/A';
                      const volClass = vol.class || vol.student?.studentDetails?.class || '';
                      const volCollege = vol.college || vol.student?.collegeName || event.college;
                      const volEmail = vol.email || vol.student?.email || 'N/A';
                      const volMobile = vol.mobileNo || vol.student?.studentDetails?.mobileNo || 'N/A';
                      const regDate = vol.registeredAt ? new Date(vol.registeredAt).toLocaleDateString() : 'N/A';
                      const regTime = vol.registeredAt ? new Date(vol.registeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

                      return (
                        <tr 
                          key={vol._id || idx}
                          className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-indigo-50/30' : ''}`}
                        >
                          {/* Award Checkbox */}
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectVolunteer(studentId)}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </td>

                          {/* Student Details */}
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{volName}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              PRN / Roll: {volRollNo}
                            </div>
                          </td>

                          {/* Dept & Class */}
                          <td className="p-3">
                            <div className="font-semibold text-slate-800">{volBranch}</div>
                            {volClass && (
                              <div className="text-[10px] text-slate-400">{volClass}</div>
                            )}
                          </td>

                          {/* College */}
                          <td className="p-3 text-slate-600 truncate max-w-[150px]" title={volCollege}>
                            {volCollege}
                          </td>

                          {/* Contact Details */}
                          <td className="p-3">
                            <div className="flex items-center gap-1 text-[11px] text-slate-600">
                              <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[140px]">{volEmail}</span>
                            </div>
                            {volMobile && volMobile !== 'N/A' && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>{volMobile}</span>
                              </div>
                            )}
                          </td>

                          {/* Timestamp */}
                          <td className="p-3 text-slate-500">
                            <div>{regDate}</div>
                            <div className="text-[10px] text-slate-400">{regTime}</div>
                          </td>

                          {/* Status Badge */}
                          <td className="p-3 text-center">
                            {vol.certificateAllocated ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Award className="w-3 h-3" /> Awarded
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">
                                Enrolled
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Total registered volunteers: <strong className="text-slate-900">{volunteers.length}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
