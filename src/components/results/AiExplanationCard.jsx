import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Cpu, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * Travel Insights Card
 * Powered by Google Gemini with automatic deterministic fallback.
 */
export function AiExplanationCard({ option, defaultExpanded = false, className = '' }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const trainNumber = option?.trainNumber;
  const trainName = option?.trainName;
  const fromStation = option?.fromStation;
  const toStation = option?.toStation;
  const journeyDate = option?.journeyDate;
  const travelClass = option?.travelClass || '3A';
  const coverageStatus = option?.coverageStatus || 'FULL_JOURNEY';
  const coveragePercent = option?.coveragePercent ?? 100;
  const allocatedBerths = option?.allocatedBerths || [];
  const cohesion = option?.cohesion;
  const departureTime = option?.departureTime;
  const arrivalTime = option?.arrivalTime;

  const berthsKey = (allocatedBerths || [])
    .map((b) => `${b.coach || ''}:${b.berthNumber || ''}`)
    .sort()
    .join(',');

  const query = useQuery({
    queryKey: [
      'explainJourney',
      trainNumber,
      fromStation,
      toStation,
      journeyDate,
      travelClass,
      berthsKey,
    ],
    queryFn: async () => {
      const effectiveBerths =
        allocatedBerths && allocatedBerths.length > 0
          ? allocatedBerths
          : (option?.availableBerths || []).slice(0, 1).map((b) => ({
              berthNumber: Number(b.berthNumber) || 1,
              berthType: b.berthType || b.berthCode,
              coach: b.coach,
              availableFrom: b.availableFrom || option?.availableFrom,
              availableTo: b.availableTo || option?.availableTo,
              coveragePercent: b.coveragePercent || coveragePercent,
            }));

      const res = await fetch('/api/v1/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainNumber,
          trainName,
          fromStation,
          toStation,
          journeyDate,
          travelClass,
          coverageStatus,
          coveragePercent,
          availableFrom: option?.availableFrom,
          availableTo: option?.availableTo,
          allocatedBerths: effectiveBerths,
          cohesion,
          departureTime,
          arrivalTime,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate journey explanation');
      }

      const json = await res.json();
      return json.data;
    },
    enabled: Boolean(trainNumber && fromStation && toStation),
    staleTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  if (!option || !trainNumber) return null;

  const data = query.data;
  const isAi = data?.source === 'gemini';

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50/70 transition-all ${className}`}
    >
      {/* Header Bar */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3.5 text-left cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
              isAi ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">
              Journey &amp; Berth Insights
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              ({isAi ? 'Gemini Travel Analysis' : 'Automated Evaluation'})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[11px] text-slate-500 font-medium">
            {isExpanded ? 'Hide' : 'Details'}
          </span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 pt-0 border-t border-slate-200 mt-1">
          {(query.isLoading || query.isFetching) ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          ) : query.isError ? (
            <p className="text-xs text-slate-600 py-1">
              {option.explanation ||
                `Berth availability confirmed for ${fromStation} to ${toStation} on train ${trainNumber}.`}
            </p>
          ) : (
            <div className="space-y-3 pt-2 text-xs">
              {/* Summary Text */}
              <p className="text-slate-800 leading-relaxed font-normal">
                {data?.summary ||
                  data?.explanation ||
                  option?.explanation ||
                  `Berth availability confirmed for ${fromStation} to ${toStation} on train ${trainNumber}.`}
              </p>

              {/* Highlights */}
              {Array.isArray(data?.highlights || data?.keyTakeaways) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {(data?.highlights || data?.keyTakeaways || []).map((h, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 p-2 rounded bg-white border border-slate-200 text-slate-700"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] font-medium">{h}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Practical Travel Tip */}
              {(data?.tip || (Array.isArray(data?.keyTakeaways) && data.keyTakeaways[data.keyTakeaways.length - 1])) && (
                <div className="p-2.5 rounded bg-blue-50/70 border border-blue-200 text-blue-900 text-[11px] font-medium">
                  <strong>Travel Tip:</strong>{' '}
                  {data?.tip || data?.keyTakeaways?.[data.keyTakeaways.length - 1]}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
