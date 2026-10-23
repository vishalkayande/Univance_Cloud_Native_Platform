import React, { useRef, useState } from 'react';
import { X, Download, Printer, ExternalLink, Award, Trophy, CheckCircle, Sparkles, ShieldCheck, HeartHandshake } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { COLLEGE_LOGO, NAAC_LOGO } from '../assets/collegeLogos';
import { getThemeById } from '../assets/certificateThemes';

export default function CertificateModal({ certificate, onClose }) {
  const certificateRef = useRef(null);
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const theme = getThemeById(certificate.theme);
  const isWinner = certificate.certificateType === 'winner';
  const isVolunteer = certificate.certificateType === 'volunteer';
  const eventName = certificate.eventName || 'Campus Event';
  const studentName = certificate.studentName || 'Student Participant';
  const positionText = certificate.positionText || (isWinner ? 'Winner' : isVolunteer ? 'Official Volunteer' : 'Participant');
  const teamName = certificate.teamName;
  const isTeam = certificate.isGroupEvent && Boolean(teamName);

  const collegeName = certificate.collegeName || 'Deogiri Institute of Engineering and Management Studies';
  const trustName = certificate.trustName || 'Marathwada Shikshan Prasarak Mandal’s';
  const autonomousText = certificate.autonomousText || '(An Autonomous Institute)';
  const collegeAddress = certificate.collegeAddress || 'Deogiri Campus, Near Hotel VITS, Railway Station Road, Chhatrapati Sambhajinagar, Maharashtra, India - 431005';

  const leftSignatoryTitle = certificate.leftSignatoryTitle || 'Director, DIEMS, Chh. Sambhajinagar';
  const leftSignatoryName = certificate.leftSignatoryName || 'Dr. Ulhas Shiurkar';
  const leftSignatoryImage = certificate.leftSignatoryImage;

  const rightSignatoryTitle = certificate.rightSignatoryTitle || 'Head of Events Association';
  const rightSignatoryName = certificate.rightSignatoryName || 'Faculty Coordinator';
  const rightSignatoryImage = certificate.rightSignatoryImage;

  const eventDateText = certificate.eventDateText || 'Academic Year 2026';
  const issueDateText = certificate.issueDateText || new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const serialNo = certificate.certificateId || `DIEMS-${eventName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

  // Download as high-res PNG image
  const handleDownloadPNG = async () => {
    if (!certificateRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const safeEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `${safeName}_${safeEvent}_Certificate.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating PNG:', err);
      alert('Failed to download certificate image. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Download as PDF (A4 Landscape)
  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    try {
      setDownloading(true);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      const safeName = studentName.replace(/[^a-zA-Z0-9]/g, '_');
      const safeEvent = eventName.replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`${safeName}_${safeEvent}_Certificate.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to download certificate PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              isWinner 
                ? 'bg-amber-500/20 text-amber-400' 
                : isVolunteer
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-teal-500/20 text-teal-400'
            }`}>
              {isWinner ? <Trophy className="w-5 h-5" /> : isVolunteer ? <HeartHandshake className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span>{isWinner ? 'Certificate of Merit' : isVolunteer ? 'Certificate of Volunteering' : 'Certificate of Participation'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-medium">
                  {eventName}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Awarded to {studentName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Certificate Container (A4 Landscape ratio) */}
        <div className="p-4 sm:p-6 bg-slate-100 flex items-center justify-center overflow-x-auto">
          <div
            ref={certificateRef}
            className={`w-[980px] min-w-[980px] h-[690px] min-h-[690px] relative p-7 flex flex-col justify-between shadow-2xl select-none text-slate-900 rounded-lg ${theme.containerClass}`}
            style={{
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              fontFamily: theme.fontName || "'Playfair Display', Georgia, serif",
            }}
          >
            {/* Inner Borders */}
            <div className={`absolute inset-2 ${theme.innerBorder1} pointer-events-none rounded-sm`}></div>
            <div className={`absolute inset-3 ${theme.innerBorder2} pointer-events-none rounded-sm`}></div>

            {/* Corner Ornamental Accents */}
            <div className={`absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 ${theme.cornerAccent} pointer-events-none`} />
            <div className={`absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 ${theme.cornerAccent} pointer-events-none`} />
            <div className={`absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 ${theme.cornerAccent} pointer-events-none`} />
            <div className={`absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 ${theme.cornerAccent} pointer-events-none`} />

            {/* Central Watermark Emblem */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] overflow-hidden">
              <img src={COLLEGE_LOGO} alt="Watermark" className="w-[520px] object-contain grayscale" />
            </div>

            {/* Certificate Header */}
            <div className={`relative z-10 flex items-center justify-between pb-3 ${theme.headerDivider}`}>
              {/* College Logo */}
              <div className="w-24 h-24 flex items-center justify-center shrink-0">
                <img
                  src={COLLEGE_LOGO}
                  alt="College Emblem"
                  className="max-h-24 max-w-24 object-contain drop-shadow-md"
                />
              </div>

              {/* College Text Details */}
              <div className="flex-1 text-center px-4">
                <p className={`text-[12px] font-semibold uppercase tracking-[0.22em] font-sans ${theme.headerTrustColor}`}>
                  {trustName}
                </p>
                <h1
                  className={`text-[23px] font-black tracking-tight mt-0.5 leading-snug ${theme.headerTitleColor}`}
                  style={{ fontFamily: theme.fontHeading }}
                >
                  {collegeName}
                </h1>
                <p className={`text-[11px] font-bold tracking-wider italic font-serif ${theme.headerSubColor}`}>
                  {autonomousText}
                </p>
                <p className="text-[9.5px] text-slate-500 font-sans tracking-tight max-w-2xl mx-auto mt-0.5 leading-tight">
                  {collegeAddress}
                </p>
              </div>

              {/* NAAC Logo */}
              <div className="w-24 h-24 flex items-center justify-center shrink-0">
                <img
                  src={NAAC_LOGO}
                  alt="NAAC Accredited"
                  className="max-h-24 max-w-24 object-contain drop-shadow-md"
                />
              </div>
            </div>

            {/* Certificate Title Badge */}
            <div className="relative z-10 text-center my-2">
              <div className="inline-flex flex-col items-center">
                <div
                  className={`px-8 py-1.5 rounded-full uppercase tracking-[0.25em] text-sm font-bold shadow-md flex items-center gap-2 ${
                    isWinner 
                      ? theme.badgeWinner 
                      : isVolunteer
                        ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-700 border border-indigo-300 text-white'
                        : theme.badgeParticipant
                  }`}
                  style={{ fontFamily: theme.fontHeading }}
                >
                  {isWinner ? (
                    <Trophy className="w-4 h-4 text-amber-200" />
                  ) : isVolunteer ? (
                    <HeartHandshake className="w-4 h-4 text-indigo-200" />
                  ) : (
                    <Award className="w-4 h-4 text-cyan-200" />
                  )}
                  <span>{isWinner ? 'Certificate of Merit' : isVolunteer ? 'Certificate of Volunteering' : 'Certificate of Participation'}</span>
                </div>
                <div className={`w-32 h-0.5 ${isVolunteer ? 'bg-indigo-500' : theme.badgeUnderline} mt-1.5`} />
              </div>
            </div>

            {/* Certificate Body */}
            <div className="relative z-10 text-center space-y-2 px-8 flex-1 flex flex-col justify-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 font-sans font-semibold">
                This is proudly presented to
              </p>

              {/* Recipient Student Name */}
              <div className="py-1">
                <div className="inline-block relative">
                  <h2
                    className={`text-3xl font-black tracking-wide px-8 pb-1 ${theme.nameColor}`}
                    style={{ fontFamily: theme.fontName }}
                  >
                    {studentName}
                  </h2>
                  <div className={`h-0.5 bg-gradient-to-r ${theme.nameUnderline} w-full mt-0.5`} />
                </div>

                {/* Subtext with Roll / Class / Branch */}
                {(certificate.rollNo || certificate.branch || certificate.class) && (
                  <p className="text-xs font-sans text-slate-600 mt-1 font-medium tracking-wide">
                    {certificate.rollNo && <span>Roll No: <strong className="text-slate-800">{certificate.rollNo}</strong></span>}
                    {certificate.class && <span> &bull; Class: <strong className="text-slate-800">{certificate.class}</strong></span>}
                    {certificate.branch && <span> &bull; Dept: <strong className="text-slate-800">{certificate.branch}</strong></span>}
                  </p>
                )}
              </div>

              {/* Citation text */}
              <div className="max-w-3xl mx-auto text-sm text-slate-700 leading-relaxed font-serif">
                {isWinner ? (
                  <p>
                    for exceptional achievement and securing{' '}
                    <span className={`font-bold text-base ${theme.highlightWinner} underline-offset-4`}>
                      {positionText}
                    </span>{' '}
                    {isTeam && (
                      <span>
                        as a member of Team <strong className={`${theme.eventNameColor} font-bold`}>&quot;{teamName}&quot;</strong>{' '}
                      </span>
                    )}
                    in the flagship competition{' '}
                    <strong className={`${theme.eventNameColor} font-black text-[15px]`}>&quot;{eventName}&quot;</strong>
                    {certificate.eventCategory && <span> ({certificate.eventCategory})</span>} held on{' '}
                    <strong className="text-slate-900 font-bold">{eventDateText}</strong> organized at{' '}
                    <span>Deogiri Institute of Engineering and Management Studies, Chhatrapati Sambhajinagar.</span>
                  </p>
                ) : isVolunteer ? (
                  <p>
                    for exemplary leadership, outstanding dedication, and invaluable contribution as an{' '}
                    <strong className="font-bold text-base text-indigo-700 underline decoration-indigo-400 underline-offset-4">
                      Official Event Volunteer
                    </strong>{' '}
                    in ensuring the seamless execution and success of the campus event{' '}
                    <strong className={`${theme.eventNameColor} font-black text-[15px]`}>&quot;{eventName}&quot;</strong>
                    {certificate.eventCategory && <span> ({certificate.eventCategory})</span>} held on{' '}
                    <strong className="text-slate-900 font-bold">{eventDateText}</strong> at{' '}
                    <span>Deogiri Institute of Engineering and Management Studies, Chhatrapati Sambhajinagar.</span>
                  </p>
                ) : (
                  <p>
                    for active and enthusiastic participation{' '}
                    {isTeam && (
                      <span>
                        as a member of Team <strong className={`${theme.eventNameColor} font-bold`}>&quot;{teamName}&quot;</strong>{' '}
                      </span>
                    )}
                    in the campus event{' '}
                    <strong className={`${theme.eventNameColor} font-black text-[15px]`}>&quot;{eventName}&quot;</strong>
                    {certificate.eventCategory && <span> ({certificate.eventCategory})</span>} held on{' '}
                    <strong className="text-slate-900 font-bold">{eventDateText}</strong> at{' '}
                    <span>Deogiri Institute of Engineering and Management Studies, Chhatrapati Sambhajinagar.</span>
                  </p>
                )}
              </div>
            </div>

            {/* Bottom Signatures & Seal Section */}
            <div className={`relative z-10 pt-2 ${theme.footerDivider} flex items-end justify-between px-6`}>
              {/* Left Signature: Director */}
              <div className="w-64 text-center">
                <div className="h-14 flex items-end justify-center mb-1">
                  {leftSignatoryImage ? (
                    <img src={leftSignatoryImage} alt="Director Sign" className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <span
                      className="text-2xl text-slate-800 italic"
                      style={{ fontFamily: "'Great Vibes', cursive" }}
                    >
                      {leftSignatoryName || 'Ulhas Shiurkar'}
                    </span>
                  )}
                </div>
                <div className="w-48 h-0.5 bg-slate-800 mx-auto mb-1"></div>
                <p className="text-xs font-bold text-slate-900 font-sans tracking-tight">
                  {leftSignatoryName}
                </p>
                <p className="text-[10px] text-slate-600 font-sans font-medium">
                  {leftSignatoryTitle}
                </p>
              </div>

              {/* Center Seal & Certificate ID */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className={`w-16 h-16 rounded-full border-2 ${theme.sealBorder} ${theme.sealBg} shadow-inner flex flex-col items-center justify-center p-1 relative`}>
                  <ShieldCheck className={`w-5 h-5 ${theme.sealIconColor} mb-0.5`} />
                  <span className={`text-[7.5px] font-bold ${theme.sealTextPrimary} uppercase tracking-tighter`}>OFFICIAL</span>
                  <span className={`text-[6.5px] ${theme.sealTextSecondary} font-semibold uppercase`}>VERIFIED</span>
                </div>
                <div className="mt-1 text-[8.5px] text-slate-500 font-mono">
                  <span>ID: {serialNo}</span>
                  <span className="mx-1">&bull;</span>
                  <span>Issued: {issueDateText}</span>
                </div>
              </div>

              {/* Right Signature: Head of Events Association */}
              <div className="w-64 text-center">
                <div className="h-14 flex items-end justify-center mb-1">
                  {rightSignatoryImage ? (
                    <img src={rightSignatoryImage} alt="Head Sign" className="max-h-12 max-w-full object-contain" />
                  ) : (
                    <span
                      className="text-2xl text-slate-800 italic"
                      style={{ fontFamily: "'Great Vibes', cursive" }}
                    >
                      {rightSignatoryName || 'Event Coordinator'}
                    </span>
                  )}
                </div>
                <div className="w-48 h-0.5 bg-slate-800 mx-auto mb-1"></div>
                <p className="text-xs font-bold text-slate-900 font-sans tracking-tight">
                  {rightSignatoryName}
                </p>
                <p className="text-[10px] text-slate-600 font-sans font-medium">
                  {rightSignatoryTitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>High-resolution vector printable certificate verified by UniVance</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Custom Google Drive Link button if organizer provided personalized certificate */}
            {certificate.customCertificateUrl && (
              <a
                href={certificate.customCertificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-2 border border-purple-200 transition"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open in Drive / Personalized</span>
              </a>
            )}

            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              disabled={downloading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-2 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>{downloading ? 'Exporting...' : 'Download Image (PNG)'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#003B5C] to-[#00B5AD] hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-teal-500/20 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-white" />
              <span>{downloading ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
