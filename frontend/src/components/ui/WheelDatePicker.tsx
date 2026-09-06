import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { Calendar } from 'lucide-react';

interface WheelDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  className?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const WheelDatePicker: React.FC<WheelDatePickerProps> = ({
  value,
  onChange,
  className
}) => {
  const parsed = useMemo(() => {
    const parts = (value || '2000-01-01').split('-');
    return {
      year: parseInt(parts[0], 10) || 2000,
      month: parseInt(parts[1], 10) || 1,
      day: parseInt(parts[2], 10) || 1,
    };
  }, [value]);

  const daysInMonth = useMemo(() => {
    return new Date(parsed.year, parsed.month, 0).getDate();
  }, [parsed.year, parsed.month]);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr = [];
    for (let y = currentYear; y >= currentYear - 100; y--) {
      arr.push(y);
    }
    return arr;
  }, []);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = parseInt(e.target.value, 10);
    const maxDays = new Date(year, parsed.month, 0).getDate();
    const day = Math.min(parsed.day, maxDays);
    onChange(`${year}-${String(parsed.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const month = parseInt(e.target.value, 10);
    const maxDays = new Date(parsed.year, month, 0).getDate();
    const day = Math.min(parsed.day, maxDays);
    onChange(`${parsed.year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const day = parseInt(e.target.value, 10);
    onChange(`${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  };

  return (
    <div className={clsx('bg-surface/90 backdrop-blur-xl border border-glass-border rounded-2xl p-4 shadow-glass-card', className)}>
      <div className="flex items-center gap-2 mb-3 text-xs font-mono font-bold text-gold uppercase tracking-wider">
        <Calendar size={14} className="text-gold" />
        <span>Date of Birth</span>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        {/* Month */}
        <div className="relative">
          <label className="text-[11px] text-text-2 font-mono font-semibold block mb-1">MONTH</label>
          <select
            value={parsed.month}
            onChange={handleMonthChange}
            aria-label="Select birth month"
            className="w-full bg-[#06060A] border border-white/20 hover:border-gold rounded-xl px-3 py-2.5 text-sm text-text-1 focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer text-center font-body font-semibold"
          >
            {MONTHS.map((m, idx) => (
              <option key={m} value={idx + 1} className="bg-[#0F0F18] text-white">
                {m}
              </option>
            ))}
          </select>
        </div>

        {/* Day */}
        <div className="relative">
          <label className="text-[11px] text-text-2 font-mono font-semibold block mb-1">DAY</label>
          <select
            value={parsed.day}
            onChange={handleDayChange}
            aria-label="Select birth day"
            className="w-full bg-[#06060A] border border-white/20 hover:border-gold rounded-xl px-3 py-2.5 text-sm text-text-1 focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer text-center font-body font-semibold"
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d} className="bg-[#0F0F18] text-white">
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Year */}
        <div className="relative">
          <label className="text-[11px] text-text-2 font-mono font-semibold block mb-1">YEAR</label>
          <select
            value={parsed.year}
            onChange={handleYearChange}
            aria-label="Select birth year"
            className="w-full bg-[#06060A] border border-white/20 hover:border-gold rounded-xl px-3 py-2.5 text-sm text-text-1 focus:border-gold focus:ring-1 focus:ring-gold outline-none cursor-pointer text-center font-mono font-semibold"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-[#0F0F18] text-white">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
