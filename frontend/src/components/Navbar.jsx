import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, 
  User, 
  Calendar, 
  ShieldCheck, 
  Trophy, 
  Settings, 
  Edit3, 
  GraduationCap, 
  ChevronDown, 
  Building2, 
  Phone, 
  Mail, 
  Hash, 
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../apiConfig';

const Navbar = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    setFormSuccess('');
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      const response = await axios.put(`${API_URL}/api/users/profile`, formData, config);
      updateUser(response.data);
      setFormSuccess('Profile updated successfully!');
      setTimeout(() => {
        setShowProfileModal(false);
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      console.error('Update Profile Error:', err);
      setFormError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const openProfileModal = () => {
    if (user.role === 'student') {
      setFormData({
        branch: user.studentDetails?.branch || '',
        year: user.studentDetails?.year || '',
        class: user.studentDetails?.class || '',
        rollNo: user.studentDetails?.rollNo || '',
        mobileNo: user.studentDetails?.mobileNo || '',
      });
    } else if (user.role === 'organizer') {
      setFormData({
        department: user.organizerDetails?.department || '',
        mobileNo: user.organizerDetails?.mobileNo || '',
        contactEmail: user.organizerDetails?.contactEmail || '',
      });
    }
    setShowDropdown(false);
    setFormError('');
    setFormSuccess('');
    setShowProfileModal(true);
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'organizer':
        return 'bg-teal-50 text-teal-700 border-teal-200/80';
      case 'student':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" state={{ reset: true }} className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#003B5C] to-[#00B5AD] p-0.5 shadow-md shadow-teal-500/15 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#00B5AD]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight leading-none">
                <span className="text-[#003B5C]">Uni</span>
                <span className="text-[#00B5AD]">Vance</span>
              </span>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase mt-1">
                {user?.collegeName ? `${user.collegeName} Portal` : 'Event Portal'}
              </span>
            </div>
          </Link>

          {/* Quick Context / Navigation Pills */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Events Hub</span>
            </Link>

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                className="px-4 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition flex items-center gap-2 border border-purple-200/60"
              >
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Admin Console</span>
              </Link>
            )}
          </div>

          {/* User Account Controls */}
          <div className="flex items-center gap-3 relative">
            {/* User Pill Button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 pl-2.5 pr-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all text-left group"
            >
              {/* Avatar circle */}
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#003B5C] to-[#00B5AD] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div className="hidden sm:flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition truncate max-w-[120px]">
                  {user?.name}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 capitalize">
                  {user?.role}
                </span>
              </div>

              <span className={`hidden sm:inline-block text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(user?.role)}`}>
                {user?.role}
              </span>

              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowDropdown(false)} 
                />
                <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Account Summary */}
                  <div className="p-3 border-b border-slate-100 mb-1">
                    <p className="font-bold text-sm text-slate-900 truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {user?.collegeName}
                      </span>
                      {user?.studentDetails?.branch && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-600">
                          {user.studentDetails.branch}
                        </span>
                      )}
                      {user?.organizerDetails?.department && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-600">
                          {user.organizerDetails.department}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {user?.role !== 'admin' && (
                    <button
                      onClick={openProfileModal}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                    >
                      <Edit3 className="w-4 h-4 text-slate-500" />
                      <span>Update Profile Info</span>
                    </button>
                  )}

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-6 sm:p-8 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Update Profile</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{user?.name} ({user?.collegeName})</p>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error & Success Alerts */}
            {formError && (
              <div className="bg-red-50 border border-red-200/70 text-red-600 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="bg-teal-50 border border-teal-200/70 text-teal-700 p-3 rounded-xl mb-4 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Form */}
            <form className="space-y-4" onSubmit={handleUpdateProfile}>
              {user?.role === 'student' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Branch (Dept)
                      </label>
                      <select 
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                        value={formData.branch}
                        onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Year
                      </label>
                      <input 
                        required
                        placeholder="e.g. 3rd" 
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Class Division
                      </label>
                      <select 
                        required
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
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
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                        Roll Number
                      </label>
                      <input 
                        required
                        placeholder="e.g. CS3135" 
                        pattern="^[A-Z]{2}\d{4}$"
                        title="Roll number must be 2 alphabets followed by 4 digits (e.g., CS3135)"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800 uppercase"
                        value={formData.rollNo}
                        onChange={(e) => setFormData({ ...formData, rollNo: e.target.value.toUpperCase() })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Contact Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input 
                        required
                        placeholder="+91 98765 43210" 
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                        value={formData.mobileNo}
                        onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              {user?.role === 'organizer' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Department
                    </label>
                    <select 
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
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

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input 
                        required
                        placeholder="+91 98765 43210" 
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                        value={formData.mobileNo}
                        onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                      Public Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
                      <input 
                        type="email"
                        required
                        placeholder="events@college.edu" 
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition text-xs font-semibold text-slate-800"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-2 flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="w-1/3 py-3 border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="w-2/3 py-3 bg-gradient-to-r from-blue-600 to-[#00B5AD] text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 hover:scale-[1.02] transition disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
