import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, FileText, Upload, Search, Users, CheckSquare, Square, Filter, ChevronRight, Hash } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { api } from '../../services/api.js';
import { haptic } from '../../utils/haptics.js';

interface CsvImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

const SAMPLE_CSV = `"Timestamp","Username","Name","Date of Birth","WhatsApp No","Gender","Would you like to receive Birthday Reminders"
"2026/05/27 1:36:48 am GMT+5:30","souviksinhababu1@gmail.com","Souvik Sinhababu","2002-09-18","8250204087","Male","I agree to receive my Birthday Updates"
"2026/05/27 1:46:17 am GMT+5:30","wizzroyal1@gmail.com","Sayan Guin","2004-03-12","8391875897","Male","I agree to receive my Birthday Reminders"
"2026/05/27 1:46:30 am GMT+5:30","supriyasatpati445@gmail.com","Supriya Satpati","2003-08-26","7478062233","Male","I agree to receive my Birthday Reminders"
"2026/05/27 1:47:38 am GMT+5:30","surbhiraj806@gmail.com","Surbhi","2005-01-23","8789148349","Female","I agree to receive my Birthday Reminders"`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose, onImported }) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [fileName, setFileName] = useState<string | null>(null);
  
  // Parsed rows
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  
  // Filters & Range
  const [searchQuery, setSearchQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female' | 'other'>('all');
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo] = useState('');
  
  const [conflictStrategy, setConflictStrategy] = useState<'update' | 'skip' | 'duplicate'>('update');
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Parse CSV via backend for 100% consistent parsing
  const parseCsvData = async (text: string, fName?: string) => {
    setCsvText(text);
    if (fName) setFileName(fName);
    setError(null);
    if (!text.trim()) {
      setParsedRows([]);
      setSelectedIndices(new Set());
      return;
    }

    setIsParsing(true);
    try {
      const res = await api.previewContactsCsv(text);
      if (res.rows && res.rows.length > 0) {
        setParsedRows(res.rows);
        // Select all valid rows by default
        const validIndices = new Set<number>();
        res.rows.forEach((r: any, idx: number) => {
          if (r.isValid) validIndices.add(idx);
        });
        setSelectedIndices(validIndices);
        setRangeFrom('1');
        setRangeTo(String(res.rows.length));
      } else {
        setParsedRows([]);
        setSelectedIndices(new Set());
      }
    } catch (err: any) {
      console.error('CSV parse preview error:', err);
      setError('Could not parse CSV. Please ensure columns include Name and Date of Birth.');
    } finally {
      setIsParsing(false);
    }
  };

  useEffect(() => {
    parseCsvData(SAMPLE_CSV);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCsvData(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCsvData(content, file.name);
    };
    reader.readAsText(file);
  };

  // Toggle individual row
  const toggleRow = (index: number) => {
    haptic.light();
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Select all or deselect all
  const toggleSelectAll = () => {
    haptic.medium();
    if (selectedIndices.size === parsedRows.filter(r => r.isValid).length) {
      setSelectedIndices(new Set());
    } else {
      const allValid = new Set<number>();
      parsedRows.forEach((r, idx) => {
        if (r.isValid) allValid.add(idx);
      });
      setSelectedIndices(allValid);
    }
  };

  // Select quick batch (e.g. First 25, 50, 100, All)
  const selectBatch = (count: number | 'all') => {
    haptic.light();
    const next = new Set<number>();
    const limit = count === 'all' ? parsedRows.length : Math.min(count, parsedRows.length);
    for (let i = 0; i < limit; i++) {
      if (parsedRows[i]?.isValid) next.add(i);
    }
    setSelectedIndices(next);
  };

  // Apply custom range (From row X to row Y)
  const handleApplyRange = () => {
    haptic.medium();
    const from = Math.max(1, parseInt(rangeFrom, 10) || 1) - 1;
    const to = Math.min(parsedRows.length, parseInt(rangeTo, 10) || parsedRows.length) - 1;

    if (from > to) {
      setError('Start row cannot be greater than end row.');
      return;
    }

    const next = new Set<number>();
    for (let i = from; i <= to; i++) {
      if (parsedRows[i]?.isValid) next.add(i);
    }
    setSelectedIndices(next);
    setError(null);
  };

  // Filtered rows for the preview list
  const filteredRowIndices = useMemo(() => {
    return parsedRows
      .map((row, idx) => ({ row, idx }))
      .filter(({ row }) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = row.name.toLowerCase().includes(q);
          const matchEmail = (row.email || '').toLowerCase().includes(q);
          const matchPhone = (row.phone || '').includes(q);
          if (!matchName && !matchEmail && !matchPhone) return false;
        }

        if (genderFilter !== 'all') {
          if (genderFilter === 'male' && row.gender !== 'male') return false;
          if (genderFilter === 'female' && row.gender !== 'female') return false;
          if (genderFilter === 'other' && (row.gender === 'male' || row.gender === 'female')) return false;
        }

        return true;
      });
  }, [parsedRows, searchQuery, genderFilter]);

  const handleImport = async () => {
    const selectedRowsList = parsedRows.filter((_, idx) => selectedIndices.has(idx) && parsedRows[idx].isValid);

    if (selectedRowsList.length === 0) {
      setError('Please select at least 1 valid contact row to import.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.importContacts({
        rows: selectedRowsList,
        conflictStrategy
      });
      setResult(res);
      onImported();
    } catch (err: any) {
      console.error('CSV import failed:', err);
      setError(err?.message || 'Failed to import contacts. Please verify CSV date format.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCount = selectedIndices.size;
  const validTotal = parsedRows.filter(r => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-void/90 backdrop-blur-2xl">
      <div className="relative w-full max-w-3xl bg-surface border border-white/[0.14] rounded-3xl p-5 sm:p-7 shadow-glass-card max-h-[92vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-3 hover:text-text-1 p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-display font-extrabold text-white">Smart CSV Birthday Import</h2>
            <p className="text-xs text-text-2 font-medium">Supports Google Forms spreadsheets, WhatsApp numbers, birthdays, and custom batch selection.</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
              <Check size={28} />
            </div>
            <h3 className="text-2xl font-display font-bold text-text-1">Import Completed!</h3>
            <div className="flex justify-center gap-4 text-xs font-mono">
              <span className="text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20 font-bold">
                +{result.imported} Added
              </span>
              <span className="text-blue-400 bg-blue-500/10 px-3.5 py-1.5 rounded-full border border-blue-500/20 font-bold">
                {result.updated} Updated
              </span>
              <span className="text-text-3 bg-white/[0.05] px-3.5 py-1.5 rounded-full font-bold">
                {result.skipped} Skipped
              </span>
            </div>
            <div className="pt-4">
              <VelvetButton variant="primary" size="md" onClick={onClose}>
                View in Contacts Radar
              </VelvetButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Input Mode Switcher */}
            <div className="flex items-center gap-2 border-b border-white/[0.1] pb-2">
              <button
                type="button"
                onClick={() => setActiveInputMode('upload')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeInputMode === 'upload'
                    ? 'bg-amber-400 text-void shadow-glow-sm'
                    : 'text-text-2 hover:text-white bg-white/[0.04]'
                }`}
              >
                📁 Upload CSV File
              </button>

              <button
                type="button"
                onClick={() => setActiveInputMode('paste')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeInputMode === 'paste'
                    ? 'bg-amber-400 text-void shadow-glow-sm'
                    : 'text-text-2 hover:text-white bg-white/[0.04]'
                }`}
              >
                ✍️ Paste / Edit CSV Text
              </button>
            </div>

            {/* File Upload Dropzone */}
            {activeInputMode === 'upload' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.15] hover:border-amber-400/80 rounded-2xl p-6 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer space-y-2.5"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-10 h-10 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 mx-auto">
                  <UploadCloud size={20} />
                </div>

                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">
                    {fileName ? `Selected: ${fileName}` : 'Click to Browse or Drag & Drop CSV Spreadsheet'}
                  </h4>
                  <p className="text-[11px] text-text-2 mt-0.5 font-mono">
                    Works directly with Google Forms, Excel, and CSV contacts exports
                  </p>
                </div>
              </div>
            )}

            {/* Paste Mode */}
            {activeInputMode === 'paste' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[10px] font-mono text-text-3 uppercase font-semibold">CSV SPREADSHEET CONTENT</label>
                  <button
                    type="button"
                    onClick={() => parseCsvData(SAMPLE_CSV)}
                    className="text-[11px] text-amber-400 hover:underline font-semibold cursor-pointer"
                  >
                    Load Sample Google Form Data
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={csvText}
                  onChange={(e) => parseCsvData(e.target.value)}
                  placeholder="Timestamp,Username,Name,Date of Birth,WhatsApp No,Gender..."
                  className="w-full bg-void/90 border border-white/[0.12] rounded-2xl p-3 text-xs text-text-1 font-mono outline-none focus:border-amber-400 resize-none"
                />
              </div>
            )}

            {/* ─── ADVANCED SELECTION & RANGE CONTROLS ─── */}
            {parsedRows.length > 0 && (
              <div className="space-y-3 pt-1 border-t border-white/[0.1]">
                {/* Batch & Range Selection Bar */}
                <div className="bg-surface-elevated/80 border border-white/[0.1] rounded-2xl p-3.5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                        <Users size={14} className="text-amber-400" />
                        <span>{parsedRows.length} Contacts Detected</span>
                      </span>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300">
                        {selectedCount} Selected to Import
                      </span>
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white transition-colors cursor-pointer"
                      >
                        {selectedCount === validTotal ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => selectBatch(20)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-text-2 hover:text-white transition-colors cursor-pointer"
                      >
                        First 20
                      </button>
                      <button
                        type="button"
                        onClick={() => selectBatch(50)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-text-2 hover:text-white transition-colors cursor-pointer"
                      >
                        First 50
                      </button>
                    </div>
                  </div>

                  {/* Range Selector: From row X to row Y */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06]">
                    <span className="text-[11px] font-mono text-text-3 font-semibold flex items-center gap-1">
                      <Hash size={12} />
                      <span>CUSTOM RANGE:</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-text-2">From row</span>
                      <input
                        type="number"
                        min="1"
                        max={parsedRows.length}
                        value={rangeFrom}
                        onChange={(e) => setRangeFrom(e.target.value)}
                        className="w-14 bg-void border border-white/[0.15] rounded-lg px-2 py-1 text-xs text-white text-center font-mono outline-none focus:border-amber-400"
                      />
                      <span className="text-[11px] text-text-2">to</span>
                      <input
                        type="number"
                        min="1"
                        max={parsedRows.length}
                        value={rangeTo}
                        onChange={(e) => setRangeTo(e.target.value)}
                        className="w-14 bg-void border border-white/[0.15] rounded-lg px-2 py-1 text-xs text-white text-center font-mono outline-none focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={handleApplyRange}
                        className="px-3 py-1 rounded-lg text-xs font-mono font-bold bg-amber-400 text-void hover:bg-amber-300 transition-colors cursor-pointer"
                      >
                        Select Range
                      </button>
                    </div>
                  </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="relative w-full sm:w-64">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-3" />
                    <input
                      type="text"
                      placeholder="Search detected names or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-void border border-white/[0.12] rounded-xl text-xs text-white outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    {(['all', 'male', 'female', 'other'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGenderFilter(g)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-mono capitalize transition-all cursor-pointer ${
                          genderFilter === g
                            ? 'bg-amber-400/20 border border-amber-400/50 text-amber-300 font-bold'
                            : 'bg-white/[0.03] text-text-3 hover:text-white border border-transparent'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Contact Selection Table */}
                <div className="bg-surface-elevated border border-white/[0.1] rounded-2xl overflow-hidden max-h-60 overflow-y-auto text-[11px]">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-surface-elevated border-b border-white/[0.1] text-text-3 font-mono z-10">
                      <tr>
                        <th className="p-2.5 pl-3 w-8">
                          <button
                            type="button"
                            onClick={toggleSelectAll}
                            className="flex items-center cursor-pointer text-amber-400"
                          >
                            {selectedCount === validTotal && validTotal > 0 ? (
                              <CheckSquare size={14} />
                            ) : (
                              <Square size={14} />
                            )}
                          </button>
                        </th>
                        <th className="p-2.5">#</th>
                        <th className="p-2.5">Name</th>
                        <th className="p-2.5">Birth Date</th>
                        <th className="p-2.5">Phone / WhatsApp</th>
                        <th className="p-2.5">Gender</th>
                        <th className="p-2.5 pr-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.04]">
                      {filteredRowIndices.map(({ row, idx }) => {
                        const isSelected = selectedIndices.has(idx);
                        return (
                          <tr
                            key={idx}
                            onClick={() => row.isValid && toggleRow(idx)}
                            className={`transition-colors cursor-pointer ${
                              !row.isValid
                                ? 'opacity-40 bg-rose-500/5'
                                : isSelected
                                ? 'bg-amber-400/[0.08] hover:bg-amber-400/[0.12]'
                                : 'hover:bg-white/[0.03]'
                            }`}
                          >
                            <td className="p-2.5 pl-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!row.isValid}
                                onChange={() => toggleRow(idx)}
                                className="rounded accent-amber-400 cursor-pointer"
                              />
                            </td>
                            <td className="p-2.5 font-mono text-text-3">{idx + 1}</td>
                            <td className="p-2.5 font-semibold text-white">
                              {row.name}
                              {row.email && (
                                <span className="block text-[10px] font-mono text-text-3 font-normal">
                                  {row.email}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono text-amber-300 font-bold">
                              {row.dob}
                            </td>
                            <td className="p-2.5 font-mono text-text-2">
                              {row.phone || '—'}
                            </td>
                            <td className="p-2.5 capitalize text-text-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                                  row.gender === 'female'
                                    ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                                    : row.gender === 'male'
                                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                                    : 'bg-white/[0.05] text-text-3'
                                }`}
                              >
                                {row.gender || 'unspecified'}
                              </span>
                            </td>
                            <td className="p-2.5 pr-3 font-mono">
                              {row.isValid ? (
                                <span className="text-emerald-400 text-[10px] font-bold">● Valid</span>
                              ) : (
                                <span className="text-rose-400 text-[10px] font-bold">✕ {row.validationError || 'Invalid'}</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Conflict Strategy & Submit Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-elevated/50 p-3.5 rounded-2xl border border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-2 font-medium">Duplicate Resolution:</span>
                <select
                  value={conflictStrategy}
                  onChange={(e) => setConflictStrategy(e.target.value as any)}
                  className="bg-void border border-white/[0.15] rounded-lg px-2.5 py-1 text-xs text-text-1 outline-none cursor-pointer"
                >
                  <option value="update">Update Existing Records</option>
                  <option value="skip">Skip / Ignore</option>
                  <option value="duplicate">Add as Duplicate</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2">
                <VelvetButton variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </VelvetButton>
                <VelvetButton
                  variant="primary"
                  size="md"
                  isLoading={isLoading || isParsing}
                  disabled={selectedCount === 0}
                  icon={<UploadCloud size={16} />}
                  onClick={handleImport}
                >
                  {selectedCount > 0
                    ? `Import ${selectedCount} Contacts`
                    : 'Select Contacts'}
                </VelvetButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
