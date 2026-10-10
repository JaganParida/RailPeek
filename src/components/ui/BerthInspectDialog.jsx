import { ExternalLink } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { JourneySegmentBar } from './JourneySegmentBar';
import { AiExplanationCard } from '@/components/results/AiExplanationCard';

export function BerthInspectDialog({ isOpen, onClose, option, journeyDate }) {
  if (!option) return null;

  const {
    trainNumber,
    trainName,
    fromStation,
    toStation,
    allocatedBerths = [],
    availableBerths = [],
    coverageStatus,
    coveragePercent,
  } = option;

  const rawBerths = availableBerths?.length > 0 ? availableBerths : allocatedBerths;

  // 1. Direct Full Journey check
  const directBerth = rawBerths.find(
    (b) => b.status === 'FULL_JOURNEY' || (b.coveragePercent === 100 && b.availableFrom === fromStation && b.availableTo === toStation)
  );

  // 2. Continuous 2-leg connection check (leg 1 ends where leg 2 starts)
  const boardingBerths = rawBerths.filter((b) => b.availableFrom === fromStation);
  const destBerths = rawBerths.filter((b) => b.availableTo === toStation);

  let connectedLegs = null;
  if (!directBerth) {
    for (const b1 of boardingBerths) {
      const match = destBerths.find((b2) => b2.availableFrom === b1.availableTo);
      if (match) {
        connectedLegs = [b1, match];
        break;
      }
    }
  }

  const isFullJourney = Boolean(directBerth || connectedLegs || coverageStatus === 'FULL_JOURNEY');

  let effectiveAvailableFrom = fromStation;
  let effectiveAvailableTo = toStation;
  let effectiveCoveragePercent = 100;
  let effectiveAllocatedBerths = [];

  if (directBerth) {
    effectiveAvailableFrom = fromStation;
    effectiveAvailableTo = toStation;
    effectiveCoveragePercent = 100;
    effectiveAllocatedBerths = [directBerth];
  } else if (connectedLegs) {
    effectiveAvailableFrom = fromStation;
    effectiveAvailableTo = toStation;
    effectiveCoveragePercent = 100;
    effectiveAllocatedBerths = connectedLegs;
  } else if (isFullJourney) {
    effectiveAvailableFrom = fromStation;
    effectiveAvailableTo = toStation;
    effectiveCoveragePercent = 100;
    effectiveAllocatedBerths = rawBerths.slice(0, 1).map((b) => ({
      ...b,
      availableFrom: fromStation,
      availableTo: toStation,
      coveragePercent: 100,
    }));
  } else {
    const primaryBerth = boardingBerths[0] || rawBerths[0];
    effectiveAvailableFrom = primaryBerth?.availableFrom || fromStation;
    effectiveAvailableTo = primaryBerth?.availableTo || toStation;
    effectiveCoveragePercent = primaryBerth?.coveragePercent ?? (coveragePercent ?? 50);
    effectiveAllocatedBerths = primaryBerth ? [primaryBerth] : [];
  }

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${trainNumber} ${trainName}`}
      description={`${fromStation} → ${toStation} • ${journeyDate || 'Selected Date'}`}
      size="lg"
      footer={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
          <p className="text-xs text-slate-500 text-left">
            {option.bookingChannel === 'TTE_ONLY' || option.isDeparted
              ? 'Final chart prepared / departed. Vacant berths can only be allotted on-board by Train TTE.'
              : 'Official bookings are completed on the IRCTC portal.'}
          </p>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" onClick={onClose} className="flex-1 sm:flex-none cursor-pointer">
              Close
            </Button>
            {option.bookingChannel === 'TTE_ONLY' || option.isDeparted ? (
              <span className="flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 text-center">
                Allot via Train TTE
              </span>
            ) : (
              <a
                href="https://www.irctc.co.in/nget/train-search"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none"
              >
                <Button size="sm" icon={ExternalLink} className="w-full bg-[#1e3a8a] text-white hover:bg-[#172554] cursor-pointer">
                  Continue to IRCTC
                </Button>
              </a>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Route Segment Availability (Image 2 Parity) */}
        <div>
          <div className="text-xs font-semibold text-slate-700 mb-2 select-none">
            Route Segment Availability
          </div>
          <div className="p-4 rounded-lg border border-slate-300 bg-white">
            <JourneySegmentBar
              fromStation={fromStation}
              toStation={toStation}
              availableFrom={effectiveAvailableFrom}
              availableTo={effectiveAvailableTo}
              status={isFullJourney ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY'}
              coveragePercent={effectiveCoveragePercent}
            />
          </div>
        </div>

        {/* AI Journey Insights (Image 2 Parity) */}
        <AiExplanationCard
          option={{
            ...option,
            journeyDate,
            availableFrom: effectiveAvailableFrom,
            availableTo: effectiveAvailableTo,
            coveragePercent: effectiveCoveragePercent,
            coverageStatus: isFullJourney ? 'FULL_JOURNEY' : 'PARTIAL_JOURNEY',
            allocatedBerths: effectiveAllocatedBerths,
          }}
          defaultExpanded={true}
        />
      </div>
    </Dialog>
  );
}
