import React, { useState, useEffect } from 'react';
import { X, Award, Trophy, FolderPlus, Link as LinkIcon, Upload, Eye, CheckCircle2, AlertCircle, Save, Sparkles, Building2, UserCheck, Shield, Palette } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../apiConfig';
import { CERTIFICATE_THEMES } from '../assets/certificateThemes';

export default function CertificateManagementModal({
  event,
  user,
  onClose,
  onUpdated,
  onPreviewSample,
}) {
  const [activeTab, setActiveTab] = useState('themes'); // 'themes' | 'generator' | 'drive' | 'individual'
  const [loading, setLoading] = useState(false);
  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);

  const existingCerts = event.certificates || {};
  const hasWinners = event.winners && event.winners.length > 0;

  // Form State
  const [formData, setFormData] = useState({
    theme: existingCerts.theme || 'theme-imperial-navy',
    participantCertificatesAllocated: existingCerts.participantCertificatesAllocated !== undefined
      ? Boolean(existingCerts.participantCertificatesAllocated)
      : true,
    winnerCertificatesAllocated: existingCerts.winnerCertificatesAllocated !== undefined
      ? Boolean(existingCerts.winnerCertificatesAllocated)
      : Boolean(hasWinners),
    eventDateText: existingCerts.eventDateText || new Date(event.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    issueDateText: existingCerts.issueDateText || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
    collegeName: existingCerts.collegeName || 'Deogiri Institute of Engineering and Management Studies',
    trustName: existingCerts.trustName || 'Marathwada Shikshan Prasarak Mandal’s',
    autonomousText: existingCerts.autonomousText || '(An Autonomous Institute)',
    collegeAddress: existingCerts.collegeAddress || 'Deogiri Campus, Near Hotel VITS, Railway Station Road, Chhatrapati Sambhajinagar, Maharashtra, India - 431005',
    leftSignatoryTitle: existingCerts.leftSignatoryTitle || 'Director, DIEMS, Chh. Sambhajinagar',
    leftSignatoryName: existingCerts.leftSignatoryName || 'Dr. Ulhas Shiurkar',
    leftSignatoryImage: existingCerts.leftSignatoryImage || '',
    rightSignatoryTitle: existingCerts.rightSignatoryTitle || 'Head of Events Association',
    rightSignatoryName: existingCerts.rightSignatoryName || user.name || 'Faculty Coordinator',
    rightSignatoryImage: existingCerts.rightSignatoryImage || '',
    participantDriveUrl: existingCerts.participantDriveUrl || '',
    winnerDriveUrl: existingCerts.winnerDriveUrl || '',
    customCertificates: existingCerts.customCertificates || [],
  });

  // Fetch registrations for individual custom allocation
  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        setLoadingRegistrations(true);
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const res = await axios.get(`${API_URL}/api/events/${event._id}/registrations`, config);
        setRegistrations(res.data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
      } finally {
        setLoadingRegistrations(false);
      }
    };
    fetchRegistrations();
  }, [event._id, user.token]);

  const handleSignatureUpload = (e, side) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('File size exceeds 2MB limit. Please upload a smaller image.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (side === 'left') {
          setFormData(prev => ({ ...prev, leftSignatoryImage: reader.result }));
        } else {
          setFormData(prev => ({ ...prev, rightSignatoryImage: reader.result }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCustomLinkChange = (id, type, url, studentName, rollNo) => {
    setFormData(prev => {
      const list = [...(prev.customCertificates || [])];
      const existingIdx = list.findIndex(c => c.studentId === id && c.type === type);
      if (existingIdx !== -1) {
        if (!url || url.trim() === '') {
          list.splice(existingIdx, 1);
        } else {
          list[existingIdx].certificateUrl = url;
        }
      } else if (url && url.trim() !== '') {
        list.push({
          studentId: id,
          studentName,
          studentRollNo: rollNo,
          type,
          certificateUrl: url,
        });
      }
      return { ...prev, customCertificates: list };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.winnerCertificatesAllocated && !hasWinners) {
      alert('Cannot allocate winner certificates because no winners have been announced yet. Please announce winners first.');
      return;
    }

    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.put(`${API_URL}/api/events/${event._id}/certificates`, formData, config);
      alert('🎉 Certificate settings saved & allocated successfully! Eligible students will now receive their certificates.');
      onUpdated();
      onClose();
    } catch (err) {
      console.error('Error allocating certificates:', err);
      alert(err.response?.data?.message || 'Failed to save certificate allocation');
    } finally {
      setLoading(false);
    }
  };

  const triggerPreview = (type = 'winner') => {
    const sampleCert = {
      certificateId: `DIEMS-${event._id.slice(-4).toUpperCase()}-SAMPLE`,
      eventName: event.name,
      eventCategory: event.category || 'Technical',
      eventLevel: event.level,
      eventDateText: formData.eventDateText,
      issueDateText: formData.issueDateText,
      certificateType: type,
      position: type === 'winner' ? 1 : undefined,
      positionText: type === 'winner' ? '1st Place (Champion)' : type === 'volunteer' ? 'Official Volunteer' : 'Participant',
      studentName: 'Sample Student Name',
      rollNo: '24CSE042',
      class: 'TY CSE',
      branch: 'CSE',
      isGroupEvent: event.isGroupEvent,
      teamName: event.isGroupEvent ? 'Team Invictus' : undefined,
      collegeName: formData.collegeName,
      trustName: formData.trustName,
      autonomousText: formData.autonomousText,
      collegeAddress: formData.collegeAddress,
      leftSignatoryTitle: formData.leftSignatoryTitle,
      leftSignatoryName: formData.leftSignatoryName,
      leftSignatoryImage: formData.leftSignatoryImage,
      rightSignatoryTitle: formData.rightSignatoryTitle,
      rightSignatoryName: formData.rightSignatoryName,
      rightSignatoryImage: formData.rightSignatoryImage,
      theme: formData.theme || 'theme-imperial-navy',
      customCertificateUrl: type === 'winner' ? formData.winnerDriveUrl : formData.participantDriveUrl,
    };
    onPreviewSample(sampleCert);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-[#003B5C] via-slate-900 to-[#004e6b] text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Allocate & Manage Certificates</h2>
              <p className="text-xs text-slate-300 font-medium flex items-center gap-2 mt-0.5">
                <span>Event: <strong>{event.name}</strong></span>
                <span>&bull;</span>
                <span>{event.isGroupEvent ? 'Team Event' : 'Individual Event'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'themes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Palette className="w-4 h-4 text-amber-500" />
            <span>Select Theme (10 Designs)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('generator')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'generator'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Signatures & Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drive')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'drive'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4 text-purple-600" />
            <span>Drive / Personalized Certificates</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('individual')}
            className={`pb-3 px-3 text-xs font-bold transition flex items-center gap-2 border-b-2 shrink-0 ${
              activeTab === 'individual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4 text-teal-600" />
            <span>Student-Specific Links ({registrations.length})</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Quick Allocation Switches */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Participant Allocation Card */}
            <div 
              onClick={() => setFormData(prev => ({ ...prev, participantCertificatesAllocated: !prev.participantCertificatesAllocated }))}
              className={`p-4 rounded-2xl border-2 transition cursor-pointer select-none ${
                formData.participantCertificatesAllocated 
                  ? 'bg-teal-50/70 border-teal-500/40 text-teal-950 shadow-xs' 
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition ${formData.participantCertificatesAllocated ? 'bg-teal-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Participant Certificates</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Issue to every registered participant ({registrations.length} total)
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                  <input
                    type="checkbox"
                    checked={formData.participantCertificatesAllocated}
                    readOnly
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                </label>
              </div>
            </div>

            {/* Winner Allocation Card */}
            <div 
              onClick={() => {
                if (hasWinners) {
                  setFormData(prev => ({ ...prev, winnerCertificatesAllocated: !prev.winnerCertificatesAllocated }));
                }
              }}
              className={`p-4 rounded-2xl border-2 transition select-none ${
                !hasWinners 
                  ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                  : formData.winnerCertificatesAllocated 
                    ? 'bg-amber-50/70 border-amber-500/40 text-amber-950 shadow-xs cursor-pointer' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/70 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition ${formData.winnerCertificatesAllocated ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm">Winner Certificates</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {hasWinners
                        ? `Issue to podium winners (${event.winners.length} positions announced)`
                        : 'Requires winners to be announced first'}
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer pointer-events-none">
                  <input
                    type="checkbox"
                    disabled={!hasWinners}
                    checked={formData.winnerCertificatesAllocated}
                    readOnly
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600 disabled:opacity-50"></div>
                </label>
              </div>
            </div>
          </div>

          {/* TAB 0: Certificate Theme Templates Selection (10 Themes) */}
          {activeTab === 'themes' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 p-4 rounded-2xl border border-amber-200 flex items-start justify-between gap-3 text-xs text-amber-950">
                <div className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-black text-sm text-amber-900">Choose Certificate Theme & Template</h4>
                    <p className="text-amber-800 text-[11px] mt-0.5">
                      Select one of the 10 professional designs below. The selected theme will be automatically applied to <strong>all participant and winner certificates</strong> issued for this event.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => triggerPreview(formData.winnerCertificatesAllocated && hasWinners ? 'winner' : 'participant')}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-sm transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Active Theme</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {CERTIFICATE_THEMES.map((theme) => {
                  const isSelected = formData.theme === theme.id;
                  return (
                    <div
                      key={theme.id}
                      onClick={() => setFormData({ ...formData, theme: theme.id })}
                      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-md ring-2 ring-blue-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm text-slate-900">{theme.name}</h4>
                            <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {theme.tag}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{theme.subtitle}</p>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </div>

                      {/* Swatch & Preview Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Colors:</span>
                          {theme.swatch.map((color, cIdx) => (
                            <div
                              key={cIdx}
                              className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormData({ ...formData, theme: theme.id });
                            const sampleCert = {
                              certificateId: `DIEMS-${event._id.slice(-4).toUpperCase()}-SAMPLE`,
                              eventName: event.name,
                              eventCategory: event.category || 'Technical',
                              eventLevel: event.level,
                              eventDateText: formData.eventDateText,
                              issueDateText: formData.issueDateText,
                              certificateType: formData.winnerCertificatesAllocated && hasWinners ? 'winner' : 'participant',
                              position: 1,
                              positionText: '1st Place (Champion)',
                              studentName: 'Sample Recipient Name',
                              rollNo: '24CSE042',
                              class: 'TY CSE',
                              branch: 'CSE',
                              isGroupEvent: event.isGroupEvent,
                              teamName: event.isGroupEvent ? 'Team Invictus' : undefined,
                              collegeName: formData.collegeName,
                              trustName: formData.trustName,
                              autonomousText: formData.autonomousText,
                              collegeAddress: formData.collegeAddress,
                              leftSignatoryTitle: formData.leftSignatoryTitle,
                              leftSignatoryName: formData.leftSignatoryName,
                              leftSignatoryImage: formData.leftSignatoryImage,
                              rightSignatoryTitle: formData.rightSignatoryTitle,
                              rightSignatoryName: formData.rightSignatoryName,
                              rightSignatoryImage: formData.rightSignatoryImage,
                              theme: theme.id,
                            };
                            onPreviewSample(sampleCert);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-slate-600" />
                          <span>Preview Theme</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 1: Official Generator Settings */}
          {activeTab === 'generator' && (
            <div className="space-y-5">
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 flex items-start gap-3 text-xs text-blue-900">
                <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Auto-generates verified official certificates with MSPM DIEMS autonomous emblem, NAAC &apos;A&apos; grade accreditation, customized signatories, dates, and student credentials. In team events, <strong>every member receives an individual certificate with their own name</strong>!
                </p>
              </div>

              {/* Active Theme Summary Card */}
              {(() => {
                const currentTheme = CERTIFICATE_THEMES.find(t => t.id === formData.theme) || CERTIFICATE_THEMES[0];
                return (
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex items-center justify-between gap-3 text-xs shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {currentTheme.swatch.map((c, i) => (
                          <div key={i} className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">Active Design: {currentTheme.name}</span>
                        <span className="text-[10px] text-slate-400">{currentTheme.subtitle}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => triggerPreview(formData.winnerCertificatesAllocated && hasWinners ? 'winner' : 'participant')}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3 text-teal-400" />
                        <span>Preview Sample</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('themes')}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                      >
                        <Palette className="w-3 h-3" />
                        <span>Change Theme</span>
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Event Date (displayed on certificate)
                  </label>
                  <input
                    type="text"
                    value={formData.eventDateText}
                    onChange={(e) => setFormData({ ...formData, eventDateText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. 15th October 2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Certificate Issue Date
                  </label>
                  <input
                    type="text"
                    value={formData.issueDateText}
                    onChange={(e) => setFormData({ ...formData, issueDateText: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="e.g. October 2026"
                  />
                </div>
              </div>

              {/* Signatures Configuration */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-4">
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Official Signatures Configuration</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Left Signatory (Director) */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                    <span className="text-[11px] font-bold text-blue-900 uppercase">Left Side: Director / Authority</span>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">Signatory Name</label>
                      <input
                        type="text"
                        value={formData.leftSignatoryName}
                        onChange={(e) => setFormData({ ...formData, leftSignatoryName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Dr. Ulhas Shiurkar"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">Designation & Institution</label>
                      <input
                        type="text"
                        value={formData.leftSignatoryTitle}
                        onChange={(e) => setFormData({ ...formData, leftSignatoryTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Director, DIEMS, Chh. Sambhajinagar"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">Upload Signature Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSignatureUpload(e, 'left')}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      {formData.leftSignatoryImage && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Image signature attached
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, leftSignatoryImage: '' })}
                            className="text-red-500 hover:underline ml-1"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Signatory (Head of Association) */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                    <span className="text-[11px] font-bold text-blue-900 uppercase">Right Side: Head of Events / Coordinator</span>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">Signatory Name</label>
                      <input
                        type="text"
                        value={formData.rightSignatoryName}
                        onChange={(e) => setFormData({ ...formData, rightSignatoryName: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Prof. Event Coordinator"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">Designation & Role</label>
                      <input
                        type="text"
                        value={formData.rightSignatoryTitle}
                        onChange={(e) => setFormData({ ...formData, rightSignatoryTitle: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        placeholder="Head of Events Association"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-600 font-semibold mb-1">Upload Signature Image (Optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleSignatureUpload(e, 'right')}
                        className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                      />
                      {formData.rightSignatoryImage && (
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-600 font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> Image signature attached
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, rightSignatoryImage: '' })}
                            className="text-red-500 hover:underline ml-1"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Preview Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => triggerPreview('participant')}
                  className="px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs flex items-center gap-2 border border-teal-200 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Participant Certificate</span>
                </button>

                <button
                  type="button"
                  onClick={() => triggerPreview('winner')}
                  className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center gap-2 border border-amber-200 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview Winner Certificate</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Drive / Cloud Links */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/70 rounded-2xl border border-purple-200 text-xs text-purple-900 leading-relaxed">
                <p className="font-bold flex items-center gap-2 mb-1 text-purple-950">
                  <FolderPlus className="w-4 h-4 text-purple-600" />
                  Google Drive / Cloud Folder Allocation
                </p>
                If you have created customized certificates or batch exported PDFs to a Google Drive folder, paste the shared folder links below. Students will be able to access the drive option directly from their portal!
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-teal-600" />
                    <span>Participants Drive Folder Link</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={formData.participantDriveUrl}
                      onChange={(e) => setFormData({ ...formData, participantDriveUrl: e.target.value })}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-600" />
                    <span>Winners Drive Folder Link</span>
                  </label>
                  <div className="relative">
                    <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="url"
                      value={formData.winnerDriveUrl}
                      onChange={(e) => setFormData({ ...formData, winnerDriveUrl: e.target.value })}
                      placeholder="https://drive.google.com/drive/folders/..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Student-Specific Custom Certificate Links */}
          {activeTab === 'individual' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-600">
                You can optionally assign direct custom links/drive file links for individual students or teams.
              </div>

              {loadingRegistrations ? (
                <div className="py-10 text-center text-xs text-slate-400">Loading registrations roster...</div>
              ) : registrations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No participants registered for this event yet.</div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] sticky top-0">
                      <tr>
                        <th className="p-3">Student / Team</th>
                        <th className="p-3">Roll No</th>
                        <th className="p-3">Custom Certificate URL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {registrations.map((reg) => {
                        const targetId = reg.student?._id || reg.teamLeader?._id || reg._id;
                        const targetName = reg.teamName || reg.student?.name || reg.teamLeader?.name || 'Student';
                        const targetRoll = reg.student?.studentDetails?.rollNo || reg.teamLeader?.studentDetails?.rollNo || '';
                        const currentCustom = (formData.customCertificates || []).find(c => c.studentId === targetId);

                        return (
                          <tr key={reg._id} className="hover:bg-slate-50">
                            <td className="p-3 font-semibold text-slate-800">
                              {reg.teamName ? `👥 ${reg.teamName} (Team)` : targetName}
                            </td>
                            <td className="p-3 text-slate-500">{targetRoll || '-'}</td>
                            <td className="p-3">
                              <input
                                type="url"
                                value={currentCustom?.certificateUrl || ''}
                                onChange={(e) => handleCustomLinkChange(targetId, 'participant', e.target.value, targetName, targetRoll)}
                                placeholder="https://drive.google.com/file/..."
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#00B5AD] hover:from-blue-700 hover:to-[#00a39c] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-500/25 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Saving & Allocating...' : 'Save & Allocate Certificates'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
