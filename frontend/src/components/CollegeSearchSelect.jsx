import { useState, useRef, useEffect } from 'react';
import { Building2, Search, Check, ChevronDown, PlusCircle } from 'lucide-react';
import { SAMBHAJINAGAR_COLLEGES, DEFAULT_COLLEGE } from '../constants/colleges';

const CollegeSearchSelect = ({ 
  value, 
  onChange, 
  darkMode = true, 
  required = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOtherSelected, setIsOtherSelected] = useState(() => {
    if (!value) return false;
    return !SAMBHAJINAGAR_COLLEGES.includes(value);
  });
  const [manualCollegeName, setManualCollegeName] = useState(() => {
    if (!value) return '';
    return SAMBHAJINAGAR_COLLEGES.includes(value) ? '' : value;
  });

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opening
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const filteredColleges = SAMBHAJINAGAR_COLLEGES.filter((col) =>
    col.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCollege = (col) => {
    if (col === 'OTHER') {
      setIsOtherSelected(true);
      setIsOpen(false);
      onChange(manualCollegeName);
    } else {
      setIsOtherSelected(false);
      setManualCollegeName('');
      onChange(col);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleManualChange = (e) => {
    const text = e.target.value;
    setManualCollegeName(text);
    onChange(text);
  };

  const baseInputStyle = darkMode
    ? "bg-slate-950/70 border-slate-700/80 text-white placeholder-slate-500"
    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400";

  const dropdownBg = darkMode
    ? "bg-slate-900 border-slate-700/80 shadow-2xl shadow-black/80"
    : "bg-white border-slate-200 shadow-xl shadow-slate-200/50";

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
        College / Institute <span className="text-teal-400 font-normal lowercase">(Chhatrapati Sambhajinagar)</span>
      </label>

      {/* Select trigger button */}
      <div className="relative">
        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full text-left pl-10 pr-10 py-3 rounded-xl border text-sm font-medium transition flex items-center justify-between ${baseInputStyle} ${
            isOpen ? 'ring-2 ring-blue-500 border-transparent' : 'hover:border-slate-500'
          }`}
        >
          <span className="truncate">
            {isOtherSelected 
              ? (manualCollegeName ? `Other: ${manualCollegeName}` : 'Other (Manual Entry)')
              : (value || DEFAULT_COLLEGE)}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-blue-400' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 left-0 right-0 mt-1 rounded-2xl border p-2 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 ${dropdownBg}`}>
          {/* Search Box inside dropdown */}
          <div className="relative mb-2 px-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search engineering college..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-100 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          {/* List of colleges */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
            {filteredColleges.map((college, idx) => {
              const isSelected = !isOtherSelected && value === college;
              const isDefaultDIEMS = college.includes('DIEMS');

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectCollege(college)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 transition ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 font-bold border border-blue-500/30'
                      : darkMode
                      ? 'hover:bg-slate-800 text-slate-200'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold leading-tight">{college}</span>
                    {isDefaultDIEMS && (
                      <span className="text-[10px] text-teal-400 font-bold mt-0.5">
                        ⭐ Default / Host Institute
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0" />}
                </button>
              );
            })}

            {filteredColleges.length === 0 && (
              <div className="py-3 text-center text-slate-400 text-xs">
                No matching college found in Sambhajinagar list.
              </div>
            )}

            {/* Other (Enter Manually) Option */}
            <div className="pt-1 mt-1 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSelectCollege('OTHER')}
                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between gap-2 font-bold transition ${
                  isOtherSelected
                    ? 'bg-teal-600/20 text-teal-300 border border-teal-500/30'
                    : darkMode
                    ? 'hover:bg-slate-800 text-teal-400'
                    : 'hover:bg-slate-100 text-teal-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  <span>Other College (Enter Manually)</span>
                </div>
                {isOtherSelected && <Check className="w-4 h-4 text-teal-400 shrink-0" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual College Name Input if "Other" is chosen */}
      {isOtherSelected && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 pt-1">
          <label className={`block text-[11px] font-bold uppercase tracking-wider mb-1 ${darkMode ? 'text-teal-400' : 'text-teal-700'}`}>
            Enter Your College Name Manually:
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-400 w-4 h-4" />
            <input
              type="text"
              required={required}
              placeholder="e.g. Government Polytechnic / Other University"
              value={manualCollegeName}
              onChange={handleManualChange}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                darkMode
                  ? 'bg-slate-950/90 border-teal-500/60 text-white placeholder-slate-500'
                  : 'bg-white border-teal-400 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            * This college name will be recorded on your profile and certificates.
          </p>
        </div>
      )}
    </div>
  );
};

export default CollegeSearchSelect;
