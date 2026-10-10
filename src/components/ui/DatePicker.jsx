import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Format a date object as YYYY-MM-DD in local time
 * @param {Date} date
 * @returns {string}
 */
export function formatISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Format date for friendly human reading (e.g. "Mon, 12 Oct 2026")
 * @param {string} dateStr
 * @returns {string}
 */
export function formatFriendlyDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function DatePicker({
  value,
  onChange,
  label,
  minDate,
  maxDaysAdvance = 120,
  error,
  helperText,
  className,
}) {
  const today = new Date();
  const min = minDate || formatISODate(today);

  const maxDateObj = new Date();
  maxDateObj.setDate(maxDateObj.getDate() + maxDaysAdvance);
  const max = formatISODate(maxDateObj);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);

  const presets = [
    { label: 'Today', date: formatISODate(today) },
    { label: 'Tomorrow', date: formatISODate(tomorrow) },
    { label: '+2 Days', date: formatISODate(dayAfter) },
  ];

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-semibold text-slate-800 select-none whitespace-nowrap mb-1.5 h-5 flex items-center">
          {label}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <CalendarIcon className="w-4 h-4" />
        </div>
        <input
          type="date"
          value={value}
          min={min}
          max={max}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full h-11 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 transition-all',
            error && 'border-rose-500 focus:border-rose-500'
          )}
        />
      </div>

      {/* Quick Presets Cleanly Positioned Below Input Without Any Line Breaks */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.date)}
            className={cn(
              'text-[11px] font-semibold px-2.5 py-1 rounded transition-all select-none cursor-pointer border whitespace-nowrap',
              value === preset.date
                ? 'bg-blue-50 text-[#1e3a8a] border-[#1e3a8a] font-bold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-1.5 text-xs text-rose-600 font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      )}
    </div>
  );
}
