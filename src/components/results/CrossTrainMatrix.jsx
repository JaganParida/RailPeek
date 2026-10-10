import { Train, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export function CrossTrainMatrix({ trains = [], onSelectTrainClass }) {
  if (!trains || trains.length === 0) return null;

  return (
    <Card className="overflow-hidden border border-slate-300 bg-white">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Train className="w-4 h-4 text-[#284a96]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Route Train Comparison Matrix
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 font-semibold">
          {trains.length} Direct {trains.length === 1 ? 'Train' : 'Trains'}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {trains.map((train) => (
          <div
            key={train.trainNumber}
            className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
          >
            {/* Train details & timings */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#284a96]">
                  {train.trainNumber}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {train.trainName}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-medium text-slate-700">
                  {train.departureTime} &rarr; {train.arrivalTime}
                </span>
                <span>&bull;</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{train.durationFormatted}</span>
                </span>
                <span>&bull;</span>
                <span>{train.distanceKm} km</span>
              </div>
            </div>

            {/* Class comparison badges */}
            <div className="flex flex-wrap items-center gap-2">
              {(train.classSummaries || []).map((summary) => {
                const isFull = summary.status === 'FULL_JOURNEY';
                const isPartial = summary.status === 'PARTIAL_JOURNEY';

                return (
                  <button
                    key={summary.travelClass}
                    type="button"
                    onClick={() =>
                      onSelectTrainClass &&
                      onSelectTrainClass(train.trainNumber, summary.travelClass)
                    }
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                      isFull
                        ? 'bg-[#86efac] text-[#14532d] border-[#22c55e] hover:bg-[#4ade80]'
                        : isPartial
                        ? 'bg-[#fed766] text-[#713f12] border-[#f59e0b] hover:bg-[#fde047]'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    <span>{summary.travelClass}</span>
                    <span className="text-[10px] opacity-90">
                      {isFull
                        ? '100% Available'
                        : isPartial
                        ? `${summary.coveragePercent}% Available`
                        : 'Unavailable'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
