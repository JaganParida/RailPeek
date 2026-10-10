import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Journey Coverage Visualizer
 * Professional progress bar showing route coverage within user's origin & destination.
 */
export function JourneySegmentBar({
  origin,
  destination,
  fromStation,
  toStation,
  availableFrom,
  availableTo,
  coveragePercent = 100,
  status = 'FULL_JOURNEY',
  className,
}) {
  const originCode = origin || fromStation || 'Origin';
  const destCode = destination || toStation || 'Destination';

  const isFull = coveragePercent >= 100 || (status === 'FULL_JOURNEY' && (coveragePercent === undefined || coveragePercent === null || coveragePercent >= 100));
  const isPartial = !isFull && (status === 'PARTIAL_JOURNEY' || (coveragePercent > 0 && coveragePercent < 100));
  const isUnavailable = !isFull && !isPartial;

  const fromLabel = availableFrom || originCode;
  const toLabel = availableTo || destCode;

  // Determine alignment within passenger's journey
  const startsAtOrigin = fromLabel === originCode;
  const endsAtDest = toLabel === destCode;

  let marginLeftPercent = 0;
  if (startsAtOrigin) {
    marginLeftPercent = 0;
  } else if (endsAtDest) {
    marginLeftPercent = Math.max(0, 100 - coveragePercent);
  } else {
    marginLeftPercent = Math.max(0, Math.round((100 - coveragePercent) / 2));
  }

  return (
    <div className={cn('w-full space-y-2 select-none', className)}>
      {/* Station Header & Coverage Tag */}
      <div className="flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold text-slate-900 font-mono text-sm">{originCode}</span>
          <span className="text-slate-400">&rarr;</span>
          <span className="font-bold text-slate-900 font-mono text-sm">{destCode}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold">
          {isFull && (
            <span className="inline-flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Full Journey (100% Confirmed)</span>
            </span>
          )}
          {isPartial && (
            <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Available: {fromLabel} &rarr; {toLabel} ({coveragePercent}%)</span>
            </span>
          )}
          {isUnavailable && (
            <span className="inline-flex items-center gap-1 text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Unavailable</span>
            </span>
          )}
        </div>
      </div>

      {/* Clean CSS-based Segment Track */}
      <div className="relative pt-1 pb-1">
        <div className="relative w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
          {isFull ? (
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          ) : isPartial ? (
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.max(10, coveragePercent))}%`,
                marginLeft: `${marginLeftPercent}%`,
              }}
            />
          ) : (
            <div className="h-full bg-slate-300 w-full" />
          )}
        </div>

        {/* Start and End Station Dots & Clear Segment Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 mt-1.5 flex-wrap gap-1">
          <span className="font-semibold text-slate-800">
            {originCode} (Boarding)
          </span>

          {isPartial && (
            <span className="font-bold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded text-[10px] border border-amber-300">
              {startsAtOrigin && !endsAtDest
                ? `Vacant until ${toLabel} (${coveragePercent}%)`
                : !startsAtOrigin && endsAtDest
                ? `Opens at ${fromLabel} (${coveragePercent}%)`
                : `Vacant between ${fromLabel} & ${toLabel}`}
            </span>
          )}

          <span className="font-semibold text-slate-800">
            {destCode} (Deboarding)
          </span>
        </div>
      </div>
    </div>
  );
}
