import { useState } from 'react';
import { Check, Plus, X, Layers, AlertCircle } from 'lucide-react';
import { ENGINEERING_DEPARTMENTS } from '../constants/colleges';

const DepartmentMultiSelect = ({ 
  selectedDepartments = ['ALL'], 
  onChange,
  darkMode = false 
}) => {
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const isAllSelected = selectedDepartments.includes('ALL') || selectedDepartments.length === 0;

  const handleToggleAll = () => {
    if (isAllSelected) {
      // Switch from ALL to an empty or default single department
      onChange(['CSE']);
    } else {
      onChange(['ALL']);
    }
  };

  const handleToggleDept = (deptCode) => {
    if (isAllSelected) {
      onChange([deptCode]);
      return;
    }

    if (selectedDepartments.includes(deptCode)) {
      const next = selectedDepartments.filter((d) => d !== deptCode);
      if (next.length === 0) {
        onChange(['ALL']);
      } else {
        onChange(next);
      }
    } else {
      onChange([...selectedDepartments, deptCode]);
    }
  };

  const handleAddCustomDept = (e) => {
    e?.preventDefault();
    const trimmed = customInput.trim().toUpperCase();
    if (!trimmed) return;

    if (isAllSelected) {
      onChange([trimmed]);
    } else if (!selectedDepartments.includes(trimmed)) {
      onChange([...selectedDepartments, trimmed]);
    }
    setCustomInput('');
    setShowCustomInput(false);
  };

  const handleRemoveDept = (deptCode) => {
    const next = selectedDepartments.filter((d) => d !== deptCode);
    if (next.length === 0) {
      onChange(['ALL']);
    } else {
      onChange(next);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className={`block text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          Eligible Departments / Branches
        </label>
        
        {/* Toggle ALL button */}
        <button
          type="button"
          onClick={handleToggleAll}
          className={`text-xs font-bold px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
            isAllSelected
              ? 'bg-blue-600 text-white shadow-xs'
              : darkMode
              ? 'bg-slate-800 text-slate-300 hover:text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {isAllSelected && <Check className="w-3.5 h-3.5" />}
          <span>All Departments</span>
        </button>
      </div>

      {/* Selected department tags if not ALL */}
      {!isAllSelected && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border bg-slate-50/50 border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-teal-600" />
            Selected ({selectedDepartments.length}):
          </span>
          {selectedDepartments.map((dept) => (
            <span
              key={dept}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-teal-500/15 text-teal-700 border border-teal-500/30"
            >
              <span>{dept}</span>
              <button
                type="button"
                onClick={() => handleRemoveDept(dept)}
                className="hover:text-red-500 transition"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Department chips grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ENGINEERING_DEPARTMENTS.map((dept) => {
          const isSelected = !isAllSelected && selectedDepartments.includes(dept.code);
          return (
            <button
              key={dept.code}
              type="button"
              onClick={() => handleToggleDept(dept.code)}
              className={`p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between gap-1.5 ${
                isSelected
                  ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                  : isAllSelected
                  ? 'bg-slate-50/60 border-slate-200/80 text-slate-400 hover:border-slate-300'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="truncate">{dept.code}</span>
              {isSelected ? (
                <Check className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              ) : isAllSelected ? (
                <span className="text-[10px] text-slate-400 font-normal">All</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Custom Department toggle / input */}
      {!showCustomInput ? (
        <button
          type="button"
          onClick={() => setShowCustomInput(true)}
          className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1.5 transition pt-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Custom Department / Branch</span>
        </button>
      ) : (
        <div className="flex items-center gap-2 pt-1 animate-in fade-in duration-150">
          <input
            type="text"
            placeholder="e.g. CHEMICAL, BIOTECH"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomDept();
              }
            }}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-teal-500/50 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <button
            type="button"
            onClick={handleAddCustomDept}
            className="px-3 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setShowCustomInput(false);
              setCustomInput('');
            }}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Explanatory note */}
      <div className="text-[11px] text-slate-500 flex items-start gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <AlertCircle className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
        <span>
          {isAllSelected ? (
            <><strong>Open to All Branches:</strong> Any registered student is eligible to discover and join this event.</>
          ) : (
            <><strong>Dynamic Branch Restriction:</strong> Only students enrolled in <strong>{selectedDepartments.join(', ')}</strong> will see and be allowed to enroll in this event.</>
          )}
        </span>
      </div>
    </div>
  );
};

export default DepartmentMultiSelect;
