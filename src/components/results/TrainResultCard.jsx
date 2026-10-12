import { useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Train, Compass } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VacantBerthsGrid } from '@/components/results/VacantBerthsGrid';

export function TrainResultCard({ option, onInspect, onSelectTrain }) {
  const navigate = useNavigate();
  if (!option) return null;

  const {
    trainNumber,
    trainName,
    fromStation,
    toStation,
    departureTime,
    arrivalTime,
    allocatedBerths = [],
    availableBerths = [],
    coverageStatus,
    coveragePercent,
    availableFrom,
    availableTo,
  } = option;

  const isFullJourney = coverageStatus === 'FULL_JOURNEY';

  return (
    <Card className="p-5 sm:p-6 space-y-4 border border-slate-300 bg-white hover:border-[#1e3a8a] transition-colors rounded-xl">
      {/* Top Header: Status, Train Number, Timings */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                isFullJourney
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {isFullJourney
                ? 'Full Journey Available (100%)'
                : `Available: ${availableFrom || fromStation} ➔ ${availableTo || toStation} (${coveragePercent}% of route)`}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Class: {option.travelClass || '3A'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e3a8a]">
              <Train className="w-4 h-4" />
            </div>
            <span className="font-mono text-base font-bold text-[#1e3a8a]">
              {trainNumber}
            </span>
            <h4 className="text-base font-bold text-slate-900">{trainName}</h4>
          </div>
        </div>

        <div className="flex items-center gap-4 text-right bg-slate-50 px-3.5 py-2 rounded-md border border-slate-200">
          <div>
            <div className="text-sm font-bold text-slate-900">
              {departureTime}
            </div>
            <div className="text-xs text-slate-500 font-medium">{fromStation}</div>
          </div>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <div className="text-sm font-bold text-slate-900">
              {arrivalTime}
            </div>
            <div className="text-xs text-slate-500 font-medium">{toStation}</div>
          </div>
        </div>
      </div>


      {/* Vacant Berths Mini-Cards Section with Priority Ordering & Pagination */}
      <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70">
        <VacantBerthsGrid
          berths={availableBerths}
          allocatedBerths={allocatedBerths}
          onSelectBerth={onInspect ? () => onInspect(option) : undefined}
        />
      </div>

      {/* Card Actions Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200">
        <div className="text-xs text-slate-500">
          Showing verified vacant seats ordered by traveler preference.
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigate(`/coach?train=${encodeURIComponent(trainNumber)}&from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${encodeURIComponent(option.journeyDate || '')}&class=${encodeURIComponent(option.travelClass || '3A')}`);
            }}
            className="text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
            leftIcon={Compass}
          >
            View Coach Layout
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onInspect(option)}
            className="text-xs"
          >
            Details
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (onSelectTrain) {
                onSelectTrain(trainNumber);
              } else {
                navigate(`/find?train=${trainNumber}&from=${fromStation}&to=${toStation}`);
              }
            }}
            className="bg-[#1e3a8a] hover:bg-[#172554] text-white font-semibold text-xs transition-colors cursor-pointer"
            rightIcon={ChevronRight}
          >
            View Vacant Berths
          </Button>
        </div>
      </div>
    </Card>
  );
}
