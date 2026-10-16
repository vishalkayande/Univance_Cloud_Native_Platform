import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Copy, Check, KeyRound } from 'lucide-react';
import { API_URL } from '../apiConfig';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [developmentOTP, setDevelopmentOTP] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCopyOTP = () => {
    navigator.clipboard.writeText(developmentOTP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const res = await axios.post(`${API_URL}/api/users/forgotpassword`, { email });
      setStatus({ 
        type: 'success', 
        message: 'A 6-digit OTP has been sent to your email.' 
      });
      
      if (res.data.developmentOTP) {
        setDevelopmentOTP(res.data.developmentOTP);
      }

      // Delay redirect to reset password page so user can read or note down OTP
      setTimeout(() => {
        navigate('/reset-password', { state: { email } });
      }, 3500);
    } catch (err) {
      setStatus({ 
        type: 'error', 
        message: err.response?.data?.message || 'Something went wrong. Please verify your email and try again.' 
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
            to="/login"
            className="inline-flex items-center text-xs text-slate-400 hover:text-white transition group mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5 group-hover:-translate-x-1 transition-transform" />
            Back to Sign In
          </Link>

          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <KeyRound className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Forgot Password?</h1>
            <p className="text-slate-400 text-xs mt-1 leading-relaxed">
              Enter your registered college email and we will send you a 6-digit verification code.
            </p>
          </div>

          {status.message && (
            <div className={`p-4 rounded-xl mb-6 text-xs border flex items-start gap-2.5 ${
              status.type === 'success' 
                ? 'bg-teal-500/10 text-teal-300 border-teal-500/30' 
                : 'bg-red-500/10 text-red-300 border-red-500/30'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p>{status.message}</p>
                {status.type === 'success' && (
                  <p className="text-[11px] text-teal-400/80 mt-1">Redirecting to code entry in a few seconds...</p>
                )}
              </div>
            </div>
          )}

          {status.type === 'success' && developmentOTP && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl mb-6 text-center">
              <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                Development Mode OTP (Brevo Bypass)
              </p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-2xl font-mono font-black text-white tracking-widest bg-slate-950 px-4 py-1.5 rounded-lg border border-slate-800">
                  {developmentOTP}
                </span>
                <button
                  type="button"
                  onClick={handleCopyOTP}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                  title="Copy OTP"
                >
                  {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                College Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="email"
                  required
                  disabled={loading || status.type === 'success'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm font-medium disabled:opacity-50"
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || status.type === 'success'}
              className="w-full bg-gradient-to-r from-blue-600 via-blue-500 to-[#00B5AD] hover:from-blue-500 hover:to-[#00c7be] text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <span>Send 6-Digit OTP</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
