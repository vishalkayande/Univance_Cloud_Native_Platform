import React from 'react';
import { X, Award, Trophy, Sparkles, Download, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CertificateNotificationPopup({
  latestCertificate,
  onViewCertificate,
  onViewAllCertificates,
  onDismiss,
}) {
  if (!latestCertificate) return null;

  const isWinner = latestCertificate.certificateType === 'winner';

  return (
    <div className="fixed inset-0 z-[115] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">
        {/* Top banner */}
        <div className={`p-6 text-white text-center relative overflow-hidden ${
          isWinner
            ? 'bg-gradient-to-br from-amber-600 via-amber-700 to-orange-800'
            : 'bg-gradient-to-br from-[#003B5C] via-blue-900 to-[#00B5AD]'
        }`}>
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white flex items-center justify-center mx-auto mb-3 shadow-lg">
            {isWinner ? <Trophy className="w-8 h-8 text-amber-200 animate-bounce" /> : <Award className="w-8 h-8 text-teal-200" />}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase text-white/90 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Official Certificates Released</span>
          </div>

          <h3 className="text-xl font-black tracking-tight">
            {isWinner ? 'Congratulations Winner!' : 'Certificate of Participation Ready!'}
          </h3>

          <p className="text-xs text-white/80 mt-1 max-w-xs mx-auto">
            Your verified institutional certificate for <strong className="text-white underline">{latestCertificate.eventName}</strong> has been officially published.
          </p>
        </div>

        {/* Body Details */}
        <div className="p-5 space-y-3.5">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Event</span>
              <strong className="text-slate-800 font-bold">{latestCertificate.eventName}</strong>
            </div>

            <div className="flex justify-between items-center text-slate-500">
              <span>Recipient</span>
              <strong className="text-slate-800 font-bold">{latestCertificate.studentName}</strong>
            </div>

            {latestCertificate.teamName && (
              <div className="flex justify-between items-center text-slate-500">
                <span>Team</span>
                <span className="font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                  {latestCertificate.teamName}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center text-slate-500">
              <span>Status</span>
              <span className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                isWinner ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
              }`}>
                {isWinner ? latestCertificate.positionText : 'Participant'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Authenticated with DIEMS Autonomous & NAAC &apos;A&apos; Grade Seal</span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                onViewCertificate(latestCertificate);
                onDismiss();
              }}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#003B5C] to-[#00B5AD] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition"
            >
              <Download className="w-4 h-4" />
              <span>View & Download My Certificate</span>
            </button>

            {onViewAllCertificates && (
              <button
                onClick={() => {
                  onViewAllCertificates();
                  onDismiss();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <span>View All My Certificates</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
