import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileSpreadsheet, Check, AlertCircle, FileText, Upload } from 'lucide-react';
import { VelvetButton } from '../ui/VelvetButton.js';
import { api } from '../../services/api.js';
import Papa from 'papaparse';

interface CsvImportModalProps {
  onClose: () => void;
  onImported: () => void;
}

const SAMPLE_CSV = `name,dob,gender,relationship,nickname,note,department
Priya Sharma,14/03/1998,female,Sister,Pree,Loves chocolate,Engineering
Karan Malhotra,22/07/1995,male,Best Friend,Rockstar,Coffee addict,Design
Anya Verma,05/11/2019,child,Niece,Little Star,Dinosaurs,Family
David Chen,18/09/1982,male,Colleague,Dave,Jazz lover,Marketing`;

export const CsvImportModal: React.FC<CsvImportModalProps> = ({ onClose, onImported }) => {
  const [activeInputMode, setActiveInputMode] = useState<'upload' | 'paste'>('upload');
  const [csvText, setCsvText] = useState(SAMPLE_CSV);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<any[]>([]);
  const [conflictStrategy, setConflictStrategy] = useState<'update' | 'skip' | 'duplicate'>('update');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ imported: number; updated: number; skipped: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const parseAndSetCsv = (text: string, fName?: string) => {
    setCsvText(text);
    if (fName) setFileName(fName);
    setError(null);

    try {
      const parsed = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase()
      });

      if (parsed.data && parsed.data.length > 0) {
        setPreviewRows(parsed.data.slice(0, 5));
      } else {
        setPreviewRows([]);
      }
    } catch (e: any) {
      setError('Could not parse CSV file. Please check formatting.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseAndSetCsv(content, file.name);
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
      parseAndSetCsv(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setError('Please provide CSV data to import.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.importContacts({
        csvContent: csvText,
        conflictStrategy
      });
      setResult(res);
      onImported();
    } catch (err: any) {
      console.error('CSV import failed:', err);
      setError(err?.message || 'Failed to import contacts. Please verify CSV date format (YYYY-MM-DD or DD/MM/YYYY).');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-void/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-surface border border-white/[0.15] rounded-[28px] p-6 sm:p-7 shadow-glass-card max-h-[90vh] overflow-y-auto space-y-4">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-3 hover:text-text-1 p-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center text-accent">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white">Bulk CSV Birthday Import</h2>
            <p className="text-xs text-text-2 font-medium">Auto-detects names, birth dates, genders and relationships from spreadsheet files.</p>
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
                View in Contacts
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
                    ? 'bg-accent text-void shadow-glow-sm'
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
                    ? 'bg-accent text-void shadow-glow-sm'
                    : 'text-text-2 hover:text-white bg-white/[0.04]'
                }`}
              >
                ✍️ Paste CSV Text
              </button>
            </div>

            {/* File Upload Dropzone */}
            {activeInputMode === 'upload' && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/[0.2] hover:border-accent/80 rounded-2xl p-8 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent mx-auto">
                  <UploadCloud size={24} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">
                    {fileName ? `Selected: ${fileName}` : 'Click to Browse or Drag & Drop CSV File'}
                  </h4>
                  <p className="text-xs text-text-2 mt-1">
                    Supports .csv, .txt with columns like Name, DOB, Gender, Relationship
                  </p>
                </div>
              </div>
            )}

            {/* Paste Mode */}
            {activeInputMode === 'paste' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-text-3 uppercase font-semibold">CSV SPREADSHEET TEXT</label>
                  <button
                    type="button"
                    onClick={() => parseAndSetCsv(SAMPLE_CSV)}
                    className="text-[11px] text-accent hover:underline font-semibold cursor-pointer"
                  >
                    Load Sample Template
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={csvText}
                  onChange={(e) => parseAndSetCsv(e.target.value)}
                  placeholder="name,dob,gender,relationship..."
                  className="w-full bg-surface-elevated/80 border border-white/[0.12] rounded-2xl p-3.5 text-xs text-text-1 font-mono outline-none focus:border-accent resize-none"
                />
              </div>
            )}

            {/* Live Preview Table */}
            {previewRows.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono text-accent font-bold uppercase block">
                  DETECTED PREVIEW (First {previewRows.length} rows)
                </span>
                <div className="bg-surface-elevated border border-white/[0.1] rounded-xl overflow-x-auto text-[11px]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/[0.1] text-text-3 font-mono">
                        <th className="p-2 pl-3">Name</th>
                        <th className="p-2">DOB</th>
                        <th className="p-2">Relationship</th>
                        <th className="p-2 pr-3">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="border-b border-white/[0.04] text-white">
                          <td className="p-2 pl-3 font-semibold">{row.name || row.fullname || row.full_name || '—'}</td>
                          <td className="p-2 font-mono text-accent">{row.dob || row.birthday || '—'}</td>
                          <td className="p-2 text-text-2">{row.relationship || row.relation || 'Friend'}</td>
                          <td className="p-2 pr-3 capitalize text-text-2">{row.gender || row.sex || 'unspecified'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Conflict Strategy */}
            <div className="flex items-center justify-between bg-surface-elevated/50 p-3.5 rounded-xl border border-white/[0.08]">
              <span className="text-xs text-text-2 font-medium">If Contact Name & Date Already Exists:</span>
              <select
                value={conflictStrategy}
                onChange={(e) => setConflictStrategy(e.target.value as any)}
                className="bg-void border border-white/[0.15] rounded-lg px-3 py-1.5 text-xs text-text-1 outline-none cursor-pointer"
              >
                <option value="update">Update Existing</option>
                <option value="skip">Skip / Ignore</option>
                <option value="duplicate">Add as Duplicate</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <VelvetButton variant="ghost" size="sm" onClick={onClose}>
                Cancel
              </VelvetButton>
              <VelvetButton
                variant="primary"
                size="md"
                isLoading={isLoading}
                icon={<UploadCloud size={16} />}
                onClick={handleImport}
              >
                Import Contacts Now
              </VelvetButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
