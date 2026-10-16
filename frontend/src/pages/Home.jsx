import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Trophy, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Compass, 
  Building2, 
  Zap,
  GraduationCap
} from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500 selection:text-white flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#003B5C] to-[#00B5AD] p-0.5 shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-[#00B5AD]" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight">
                <span className="text-white">Uni</span>
                <span className="text-[#00B5AD]">Vance</span>
              </span>
              <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase -mt-1">
                Campus Events Hub
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#roles" className="hover:text-white transition">Who It's For</a>
            <a href="#workflow" className="hover:text-white transition">How It Works</a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-semibold text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-xl transition border border-slate-800"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-[#00B5AD] hover:from-blue-500 hover:to-[#00c7be] rounded-xl shadow-lg shadow-blue-500/25 transition transform hover:scale-[1.02] flex items-center gap-1.5"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 hero-mesh border-b border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-8 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Next-Generation College Event Ecosystem</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
              Empowering Campus Events,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-teal-300 to-emerald-400">
                Collaboration & Leadership
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed font-normal mb-10 max-w-2xl mx-auto">
              From department tech-fests to institute cultural summits, UniVance unites students, organizers, and faculty administrators in one unified, real-time platform.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/signup"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-500 to-[#00B5AD] text-white text-base font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:shadow-teal-500/30 transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Join Your College <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-base font-bold rounded-2xl border border-slate-700/80 backdrop-blur-md transition flex items-center justify-center gap-2"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Quick Proof Pills */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-2xl font-black text-white">3-Tier</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Institute • Dept • Club</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-2xl font-black text-emerald-400">100%</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Verified Participants</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-2xl font-black text-sky-400">Live</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Podium & Winners</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-2xl font-black text-purple-400">Instant</p>
                <p className="text-xs text-slate-400 font-medium mt-0.5">CSV Roster Export</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Personas Section */}
      <section id="roles" className="py-24 bg-slate-900/60 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-400 mb-2">Designed for Everyone</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Tailored Portals for Every Campus Stakeholder
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Student Card */}
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-8 rounded-3xl border border-slate-700/60 hover:border-blue-500/60 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Students</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Discover curated events, form teams seamlessly with verified batchmates, register instantly, and track event rankings.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>One-click enrollment & cancellation</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Intelligent team builder with roll numbers</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Live leaderboards and winners podium</span>
                </li>
              </ul>
            </div>

            {/* Organizer Card */}
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-8 rounded-3xl border border-slate-700/60 hover:border-teal-500/60 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For Event Organizers</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Publish events with rich details, manage limits, pause registrations when filled, announce winners, and export roster CSVs.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Custom team limits & individual formats</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Real-time registration tracking</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Instant CSV export with full student details</span>
                </li>
              </ul>
            </div>

            {/* Admin Card */}
            <div className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 p-8 rounded-3xl border border-slate-700/60 hover:border-purple-500/60 transition-all duration-300 group hover:-translate-y-1">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">For College Admins</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Centralized command center to approve organizer applications, moderate campus events, and view student directory hierarchies.
              </p>
              <ul className="space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>1-click organizer & event approval</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Campus-wide student directory lookup</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>Moderation tools & safety controls</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section id="features" className="py-24 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">Modern Architecture</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white">
              Built for Speed, Reliability and College Scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl w-fit mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Multi-Tier Hierarchy</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter by Institute-wide spectacles, department-specific challenges, or student club initiatives.
              </p>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="p-3 bg-teal-500/10 text-teal-400 rounded-xl w-fit mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Smart Sorting & Deadlines</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live events surface first, followed by registered activities, upcoming deadlines, and completed archives.
              </p>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl w-fit mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">Podium & Honors</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Announce champions, runners-up, and special recognitions with roll number verification.
              </p>
            </div>

            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-4">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white mb-2">College-Scoped Security</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Data isolation ensures students only interact with legitimate peers and verified faculty within their institution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Ready to upgrade your campus event experience?
          </h2>
          <p className="text-slate-300 text-base max-w-xl mx-auto mb-8">
            Create your account today or sign in to discover what is happening across your campus.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/signup"
              className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-[#00B5AD] text-white font-bold rounded-xl shadow-lg shadow-teal-500/20 hover:scale-105 transition"
            >
              Get Started Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 bg-slate-900 text-slate-200 border border-slate-700 font-bold rounded-xl hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-slate-950 border-t border-slate-900 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">UniVance</span>
            <span>• Academic Event Management Platform</span>
          </div>
          <p>© {new Date().getFullYear()} UniVance. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
