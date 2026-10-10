import { ExternalLink, CheckCircle2, AlertCircle, XCircle, ShieldCheck, Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { JourneySegmentBar } from '@/components/ui/JourneySegmentBar';
import { AiExplanationCard } from '@/components/results/AiExplanationCard';

/**
 * Detailed Inspector Panel for Selected Coach Berth
 */
export function BerthDetailSheet({
  berth,
  trainNumber,
  trainName,
  fromStation,
  toStation,
  journeyDate,
  onClose,
}) {
  if (!berth) {
    return (
      <Card className="p-6 text-center text-slate-500 border-dashed border-2 bg-white">
        <Compass className="w-10 h-10 mx-auto mb-2 text-slate-400" />
        <h4 className="text-sm font-semibold text-slate-800">
          No Berth Selected
        </h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
          Click any berth in the coach schematic above to inspect its segment coverage, occupancy intervals, and booking feasibility.
        </p>
      </Card>
    );
  }

  const isFullJourney = berth.status === 'FULL_JOURNEY';
  const isPartial = berth.status === 'PARTIAL_JOURNEY';

  return (
    <Card className="border-2 border-slate-300 bg-white rounded-xl">
      <CardHeader className="pb-3 border-b border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="font-mono text-xl font-bold text-slate-900">
                {berth.coach} &bull; Berth {berth.berthNumber}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  isFullJourney
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isPartial
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {isFullJourney
                  ? 'Full Journey Available'
                  : isPartial
                  ? `${berth.coveragePercent}% Route Available`
                  : 'Occupied'}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {berth.berthType} Berth &bull; Class {berth.class}
              {trainName ? ` &bull; ${trainName}` : ''}
              {journeyDate ? ` (${journeyDate})` : ''}
            </p>
          </div>

          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2.5 text-xs">
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* Journey Segment Track Visualizer */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
            <span>Route Coverage Track</span>
            <span className="font-mono text-slate-500">
              {fromStation} → {toStation}
            </span>
          </div>
          <div className="p-3.5 rounded-md border border-slate-200 bg-slate-50">
            <JourneySegmentBar
              fromStation={fromStation}
              toStation={toStation}
              availableFrom={berth.availableFrom}
              availableTo={berth.availableTo}
              status={berth.status}
              coveragePercent={berth.coveragePercent || 0}
            />
          </div>
        </div>

        {/* Diagnostic Suitability Box */}
        <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            {isFullJourney ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : isPartial ? (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-600" />
            )}
            <span>Berth Status Explanation</span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed">
            {berth.suitabilityReason || berth.explanation || 'Calculated from route vacancy data.'}
          </p>

          {/* Detailed Occupancy Spans */}
          {berth.occupiedSegments && berth.occupiedSegments.length > 0 && (
            <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
              <span className="font-semibold text-slate-700">
                Occupied Segment(s):{' '}
              </span>
              {berth.occupiedSegments.map((s, idx) => (
                <span key={idx} className="font-mono">
                  {s.from} → {s.to} ({s.stopCount || 1} stops){idx < berth.occupiedSegments.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}

          {berth.availableSegments && berth.availableSegments.length > 0 && (
            <div className="text-[11px] text-slate-600">
              <span className="font-semibold text-emerald-700">
                Vacant Segment(s):{' '}
              </span>
              {berth.availableSegments.map((s, idx) => (
                <span key={idx} className="font-mono">
                  {s.from} → {s.to} ({s.stopCount || 1} stops){idx < berth.availableSegments.length - 1 ? ', ' : ''}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Berth Insights */}
        <AiExplanationCard
          option={{
            trainNumber,
            trainName,
            fromStation,
            toStation,
            journeyDate,
            travelClass: berth.class,
            coverageStatus: berth.status,
            coveragePercent: berth.coveragePercent || (berth.status === 'FULL_JOURNEY' ? 100 : 0),
            allocatedBerths: [berth],
          }}
          defaultExpanded={false}
        />

        {/* IRCTC Official Booking Advice */}
        <div className="p-3.5 rounded-md bg-blue-50/70 border border-blue-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#1e3a8a]">
            <ShieldCheck className="w-4 h-4 text-[#1e3a8a]" />
            <span>How to Reserve on Official IRCTC</span>
          </div>

          <p className="text-[11px] text-blue-900 leading-relaxed">
            Indian Railways algorithms allocate berths dynamically based on quota. To maximize your chances for this berth:
          </p>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-800 bg-white p-2.5 rounded border border-blue-200">
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Train Number
              </span>
              <strong>{trainNumber}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Class
              </span>
              <strong>{berth.class}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Berth Preference
              </span>
              <strong>{berth.berthType}</strong>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-sans">
                Coach Preference
              </span>
              <strong>{berth.coach}</strong>
            </div>
          </div>

          <a
            href="https://www.irctc.co.in/nget/train-search"
            target="_blank"
            rel="noopener noreferrer"
            className="block pt-1"
          >
            <Button size="sm" icon={ExternalLink} className="w-full bg-[#1e3a8a] text-white hover:bg-[#172554]">
              Continue to Official IRCTC
            </Button>
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
