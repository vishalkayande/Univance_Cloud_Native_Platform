import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, ArrowLeft, CheckCircle2, ShieldAlert, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { API_URL } from '../apiConfig';

const ResetPassword = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!email) {
      setStatus({ type: 'info', message: 'Please enter your email and the 6-digit OTP you received.' });
    }
  }, [email]);

  const passwordRules = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase letter', valid: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', valid: /[a-z]/.test(password) },
    { label: 'Number (0-9)', valid: /[0-9]/.test(password) },
    { label: 'Special symbol', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  const isPasswordValid = passwordRules.every(r => r.valid);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      return setStatus({ type: 'error', message: 'Please enter a valid 6-digit OTP' });
    }

    if (password !== confirmPassword) {
      return setStatus({ type: 'error', message: 'Passwords do not match' });
    }

    if (!isPasswordValid) {
      return setStatus({ type: 'error', message: 'Password does not meet the complexity rules.' });
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      await axios.put(`${API_URL}/api/users/resetpassword`, { email, otp, password });
      setStatus({ 
        type: 'success', 
        message: 'Password reset successful! Redirecting you to sign in...' 
      });
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Failed to reset password. OTP may be invalid or expired.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen auth-mesh flex flex-col items-center justify-center p-4 sm:p-6 relative">
      <div className="w-full max-w-md relative z-10 my-8">
        <div className="bg-slate-900/90 backdrop-blur-2xl p-8 sm:p-10 rounded-[2rem] border border-slate-800/80 shadow-2xl shadow-black/60">
          <Link
            to="/forgot-password"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition group mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Back
          </Link>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Set New Password</h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Verify your identity using the 6-digit code sent to <span className="text-white font-semibold">{email || 'your email'}</span>
            </p>
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl mb-6 text-xs border flex items-start gap-2.5 ${
              status.type === 'success' ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' : 
              status.type === 'info' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
              'bg-red-500/10 text-red-300 border-red-500/30'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              )}
              <span>{status.message}</span>
            </div>
          )}

          {status.type !== 'success' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {!location.state?.email && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    College Email
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                    placeholder="name@college.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  6-Digit Verification Code (OTP)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-base font-mono tracking-widest text-center"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-10 pr-11 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                    {passwordRules.map((rule, idx) => (
                      <span key={idx} className={rule.valid ? 'text-teal-400 font-semibold' : 'text-slate-500'}>
                        {rule.valid ? '✓ ' : '• '}{rule.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 via-blue-500 to-[#00B5AD] hover:from-blue-500 hover:to-[#00c7be] text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating Password...' : 'Reset Password & Continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
