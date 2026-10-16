import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  GraduationCap, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  Phone, 
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import CollegeSearchSelect from '../components/CollegeSearchSelect';
import { DEFAULT_COLLEGE } from '../constants/colleges';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    collegeName: DEFAULT_COLLEGE,
    role: 'student',
    department: '',
    mobileNo: '',
    contactEmail: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [customDeptActive, setCustomDeptActive] = useState(false);
  const [customDeptValue, setCustomDeptValue] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Password rules validation
  const passwordRules = [
    { label: 'At least 8 characters', valid: formData.password.length >= 8 },
    { label: 'One uppercase letter', valid: /[A-Z]/.test(formData.password) },
    { label: 'One lowercase letter', valid: /[a-z]/.test(formData.password) },
    { label: 'One number (0-9)', valid: /[0-9]/.test(formData.password) },
    { label: 'One special symbol (!@#$...)', valid: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password) },
  ];

  const isPasswordValid = passwordRules.every(r => r.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isPasswordValid) {
      setError('Please fulfill all password security requirements below.');
      return;
    }

    if (formData.role === 'organizer' && !formData.department) {
      setError('Please select your department.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(formData);
      setSuccess(
        data.message || 
        `${formData.role === 'organizer' ? 'Organizer' : 'Student'} account created! Please wait for Administrator approval before signing in.`
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-mesh flex flex-col items-center justify-center p-4 sm:p-6 relative">
      {/* Top back button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          to="/"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 backdrop-blur-md text-xs font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </div>

      <div className="w-full max-w-xl relative z-10 my-10">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2.5rem] border border-slate-800/80 shadow-2xl shadow-black/60">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#003B5C] to-[#00B5AD] p-0.5 shadow-xl shadow-teal-500/20 mb-4">
              <div className="h-full w-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-8 h-8 text-[#00B5AD]" />
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Create UniVance Account
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Join your campus network to participate in or coordinate events
            </p>
          </div>

          {/* Success Box */}
          {success ? (
            <div className="bg-teal-500/10 border border-teal-500/30 p-6 rounded-2xl text-center">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Registration Submitted</h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">{success}</p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-blue-600 to-[#00B5AD] text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-500/20 hover:scale-105 transition"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-3.5 rounded-xl mb-6 text-xs flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Switcher */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    I am registering as:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'student' })}
                      className={`p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                        formData.role === 'student'
                          ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <User className={`w-4 h-4 ${formData.role === 'student' ? 'text-blue-400' : ''}`} />
                      <span>Student</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, role: 'organizer' })}
                      className={`p-3.5 rounded-2xl border text-sm font-bold flex items-center justify-center gap-2.5 transition-all ${
                        formData.role === 'organizer'
                          ? 'bg-teal-600/20 border-teal-500 text-white shadow-lg shadow-teal-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <Briefcase className={`w-4 h-4 ${formData.role === 'organizer' ? 'text-teal-400' : ''}`} />
                      <span>Event Organizer</span>
                    </button>
                  </div>
                </div>

                {/* Full Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input
                        type="text"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                        placeholder="e.g. Rahul Sharma"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      College Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                      <input
                        type="email"
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                        placeholder="rahul@college.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* College Selection (Searchable Chhatrapati Sambhajinagar Colleges + Other) */}
                <CollegeSearchSelect
                  value={formData.collegeName}
                  onChange={(val) => setFormData({ ...formData, collegeName: val })}
                  darkMode={true}
                  required={true}
                />

                {/* Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Requirements live indicator */}
                  {formData.password && (
                    <div className="mt-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                      {passwordRules.map((rule, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          {rule.valid ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                          )}
                          <span className={rule.valid ? 'text-teal-300 font-medium' : 'text-slate-400'}>
                            {rule.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Organizer Specific Fields */}
                {formData.role === 'organizer' && (
                  <div className="space-y-4 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
                      <Briefcase className="w-4 h-4" />
                      Organizer Credentials
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                          Department
                        </label>
                        <select
                          required
                          className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                          value={customDeptActive ? 'OTHER' : formData.department}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'OTHER') {
                              setCustomDeptActive(true);
                              setFormData({ ...formData, department: customDeptValue });
                            } else {
                              setCustomDeptActive(false);
                              setFormData({ ...formData, department: val });
                            }
                          }}
                        >
                          <option value="">Select Department</option>
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

                        {customDeptActive && (
                          <input
                            type="text"
                            required
                            placeholder="Enter Department Name"
                            className="mt-2 w-full px-4 py-2.5 bg-slate-950/90 border border-teal-500/60 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium"
                            value={customDeptValue}
                            onChange={(e) => {
                              setCustomDeptValue(e.target.value);
                              setFormData({ ...formData, department: e.target.value });
                            }}
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                          Mobile Number
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                          <input
                            type="text"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                            placeholder="+91 98765 43210"
                            value={formData.mobileNo}
                            onChange={(e) => setFormData({ ...formData, mobileNo: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                        Official Contact Email (Public for Students)
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                          type="email"
                          required
                          className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                          placeholder="events@college.edu"
                          value={formData.contactEmail}
                          onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-amber-400/90 bg-amber-400/10 p-3 rounded-xl border border-amber-400/20">
                      ℹ️ Organizer accounts require review and approval from your college administrator prior to active login.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 via-blue-500 to-[#00B5AD] hover:from-blue-500 hover:to-[#00c7be] text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed transform active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Footer link */}
          <p className="mt-8 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-teal-400 font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
