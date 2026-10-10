import { useState, useEffect } from 'react';
import { CheckCheck, RefreshCw, Clock, Database } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Format relative elapsed time from timestamp
 * @param {string|number|Date} dateInput
 * @returns {string}
 */
export function formatElapsedTime(dateInput) {
  if (!dateInput) return 'just now';
  const past = new Date(dateInput).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - past) / 1000));

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours}h ago`;
}

/**
 * User-facing Freshness Indicator
 * Accurately communicates data source and recency without masking stale or demo data.
 *
 * @param {Object} props
 * @param {"live"|"cache"|"demo"} [props.source="demo"]
 * @param {string|number|Date} [props.fetchedAt]
 * @param {boolean} [props.isRevalidating=false]
 * @param {boolean} [props.isStale=false]
 * @param {string} [props.className]
 */
export function FreshnessIndicator({
  source = 'demo',
  fetchedAt,
  isRevalidating = false,
  isStale = false,
  className,
}) {
  const [, setTick] = useState(0);

  // Re-render every 10 seconds to keep relative timestamp accurate
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(timer);
  }, []);

  const timeText = formatElapsedTime(fetchedAt);

  if (isRevalidating) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-brand-700 dark:text-brand-300 bg-brand-50/80 dark:bg-brand-950/40 px-2.5 py-1 rounded-md border border-brand-200 dark:border-brand-800 select-none',
          className
        )}
      >
        <RefreshCw className="w-3 h-3 animate-spin text-brand-600 dark:text-brand-400" />
        <span>Recent data &bull; Checking for updates...</span>
      </div>
    );
  }

  if (isStale) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800 select-none',
          className
        )}
      >
        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>Cached data &bull; Updated {timeText} (may be outdated)</span>
      </div>
    );
  }

  if (source === 'live') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-800 select-none font-medium',
          className
        )}
      >
        <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Official IRCTC Live Chart &bull; Verified</span>
      </div>
    );
  }

  if (source === 'cache') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 select-none',
          className
        )}
      >
        <Database className="w-3 h-3 text-slate-500" />
        <span>Fast cache &bull; Updated {timeText}</span>
      </div>
    );
  }

  // Advance Prediction / Standard Layout mode
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 text-xs text-blue-900 dark:text-blue-200 bg-blue-50/90 dark:bg-blue-950/40 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 select-none font-medium',
        className
      )}
    >
      <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
      <span>Advance Route Schedule &bull; Layout Matrix</span>
    </div>
  );
}
