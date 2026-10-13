import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ChevronRight, Train, Compass } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { AiExplanationCard } from '@/components/results/AiExplanationCard';
import { VacantBerthsGrid } from '@/components/results/VacantBerthsGrid';

export function BestMatchCard({ option, onInspect, onSelectTrain }) {
  const navigate = useNavigate();
  if (!option) return null;

  const {
    trainNumber,
    trainName,
    fromStation,
    toStation,
    departureTime,
    arrivalTime,
    distanceKm,
    allocatedBerths = [],
    availableBerths = [],
    coverageStatus,
    coveragePercent,
    availableFrom,
    availableTo,
  } = option;

  const isFullJourney = coverageStatus === 'FULL_JOURNEY';
  const trainOrigin = option.fromStation || option.origin || option.from || fromStation;
  const trainDest = option.toStation || option.destination || option.to || toStation;
  const searchedFrom = option.from || fromStation;
  const searchedTo = option.to || toStation;
  const isDifferentOrigin = searchedFrom && trainOrigin && trainOrigin.toUpperCase() !== searchedFrom.toUpperCase();
  const isDifferentDest = searchedTo && trainDest && trainDest.toUpperCase() !== searchedTo.toUpperCase();

  return (
    <Card className="overflow-hidden border-2 border-blue-600 bg-white rounded-xl">
      {/* Top Banner Tag */}
      <div className="bg-[#1e3a8a] text-white px-4 py-2.5 flex items-center justify-between text-xs font-semibold select-none">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Recommended Train &bull; Highest Route Coverage</span>
        </div>
        <div className="text-[11px] text-blue-200 hidden sm:block font-normal">
          {isFullJourney ? '100% Journey Available' : `Available: ${availableFrom || trainOrigin} ➔ ${availableTo || trainDest} (${coveragePercent}%)`}
        </div>
      </div>

      <div className="p-5 sm:p-6 space-y-5">
        {/* Header: Train Number, Name, Class & Timings */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="w-8 h-8 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e3a8a]">
                <Train className="w-4 h-4" />
              </div>
              <span className="font-mono text-lg font-bold text-[#1e3a8a]">
                {trainNumber}
              </span>
              <h3 className="text-base font-bold text-slate-900">{trainName}</h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Class: {option.travelClass || '3A'}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  isFullJourney
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {isFullJourney ? 'Full Journey Available' : `Available: ${availableFrom || trainOrigin} ➔ ${availableTo || trainDest} (${coveragePercent}%)`}
              </span>
              {isDifferentOrigin && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 shrink-0 inline-flex items-center gap-1"
                  title={`Departs from ${option.fromStationName || trainOrigin} (${trainOrigin}), not ${searchedFrom}`}
                >
                  Board at {trainOrigin}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {trainOrigin} to {trainDest} &bull; {distanceKm ? `${distanceKm} km direct route` : 'Direct Route'}
            </p>
          </div>

          <div className="flex items-center gap-4 text-right bg-slate-50 px-4 py-2 rounded-md border border-slate-200">
            <div>
              <div className="text-base font-bold text-slate-900">
                {departureTime}
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-slate-600 font-semibold">{trainOrigin}</span>
                {isDifferentOrigin && (
                  <span
                    className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300"
                    title={`Train departs from ${option.fromStationName || trainOrigin}, not ${searchedFrom}`}
                  >
                    Nearby
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <div className="text-base font-bold text-slate-900">
                {arrivalTime}
              </div>
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-slate-600 font-semibold">{trainDest}</span>
                {isDifferentDest && (
                  <span
                    className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300"
                    title={`Train terminates at ${option.toStationName || trainDest}, not ${searchedTo}`}
                  >
                    Nearby
                  </span>
                )}
              </div>
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

        {/* AI Journey Insights */}
        <AiExplanationCard option={option} defaultExpanded={false} />

        {/* Card Footer CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="text-xs text-slate-500">
            {option.cohesion === 'SAME_BAY'
              ? 'All passengers placed in same bay'
              : option.cohesion === 'SAME_COACH'
              ? 'Same coach allocation guaranteed'
              : 'Direct route seat allocation'}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigate(`/coach?train=${encodeURIComponent(trainNumber)}&from=${encodeURIComponent(trainOrigin)}&to=${encodeURIComponent(trainDest)}&date=${encodeURIComponent(option.journeyDate || '')}&class=${encodeURIComponent(option.travelClass || '3A')}`);
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
              Inspect Details
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
              Filter to Train {trainNumber}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
