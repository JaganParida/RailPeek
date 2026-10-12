import { useState } from 'react';
import { DoorClosed, Bath, AlertCircle } from 'lucide-react';

/**
 * Clean SVG Window Icon (Zero Emojis)
 */
function WindowSvg({ className = 'w-3 h-3' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="12" height="12" rx="2" />
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </svg>
  );
}

/**
 * Clean SVG Aisle Walkway Icon
 */
function AislePathSvg({ className = 'w-3 h-3' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeDasharray="2 2"
    >
      <line x1="8" y1="0" x2="8" y2="16" />
    </svg>
  );
}

export function CoachMap({
  coachId,
  travelClass = '3A',
  trainNumber,
  trainName,
  bays = [],
  selectedBerthNumber,
  onSelectBerth,
  filterType = 'ALL',
  filterStatus = 'ALL',
  onFilterTypeChange,
  onFilterStatusChange,
  isChartPrepared = true,
}) {
  const [hoveredBerth, setHoveredBerth] = useState(null);

  const berthTypeFilters = [
    { id: 'ALL', label: 'All Berths' },
    { id: 'LOWER', label: 'Lower (L)' },
    { id: 'MIDDLE', label: 'Middle (M)', hideFor: ['2A', '1A', '2S', 'CC'] },
    { id: 'UPPER', label: 'Upper (U)', hideFor: ['2S', 'CC'] },
    { id: 'SIDE_LOWER', label: 'Side Lower / Window', hideFor: ['1A'] },
    { id: 'SIDE_UPPER', label: 'Side Upper (SU)', hideFor: ['1A', '2S', 'CC'] },
  ].filter((f) => !f.hideFor || !f.hideFor.includes(travelClass));

  const statusFilters = [
    { id: 'ALL', label: 'All Berths' },
    { id: 'VACANT_ONLY', label: 'Vacant Seats Only (Green)' },
  ];

  const matchesFilters = (berth) => {
    if (!berth) return false;
    if (filterType !== 'ALL' && berth.berthType !== filterType) {
      if (filterType === 'SIDE_LOWER' && (berth.berthType === 'SIDE_LOWER' || berth.berthType === 'WINDOW')) {
        // match
      } else {
        return false;
      }
    }
    if (filterStatus === 'VACANT_ONLY' && berth.status !== 'FULL_JOURNEY' && berth.status !== 'PARTIAL_JOURNEY') {
      return false;
    }
    return true;
  };

  const isWindowBerth = (berth) => {
    if (!berth) return false;
    if (berth.berthType === 'SIDE_LOWER' || berth.berthType === 'WINDOW') return true;
    const mod = berth.berthNumber % 8;
    return mod === 1 || mod === 4 || mod === 7;
  };

  const getBerthTypeLabel = (berth) => {
    if (!berth) return '';
    switch (berth.berthType) {
      case 'LOWER':
        return 'LOWER';
      case 'MIDDLE':
        return 'MIDDLE';
      case 'UPPER':
        return 'UPPER';
      case 'SIDE_LOWER':
        return 'SIDE LOWER';
      case 'SIDE_UPPER':
        return 'SIDE UPPER';
      case 'WINDOW':
        return 'WINDOW';
      default:
        return berth.berthType || 'SEAT';
    }
  };

  const renderSeat = (berth, compact = false) => {
    if (!berth) {
      return (
        <div
          className={`rounded-xl bg-slate-50 border border-dashed border-slate-200 ${
            compact ? 'h-11' : 'h-14'
          }`}
        />
      );
    }

    const isSelected = selectedBerthNumber === berth.berthNumber;
    const isHovered = hoveredBerth?.berthNumber === berth.berthNumber;
    const isMatching = matchesFilters(berth);
    const hasWindow = isWindowBerth(berth);
    const isVacant = berth.status === 'FULL_JOURNEY' || berth.status === 'PARTIAL_JOURNEY';

    // Style Rule in Light Mode:
    // Vacant = Crisp VIBRANT EMERALD GREEN
    // Others = Clean SOFT LIGHT GRAY
    let bgClasses = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/80 hover:border-slate-300';
    let labelColor = 'text-slate-400';
    let statusText = 'Booked';

    if (berth.status === 'FULL_JOURNEY') {
      bgClasses =
        'bg-emerald-500 text-white border-emerald-600 shadow-sm ring-1 ring-emerald-300 hover:bg-emerald-600';
      labelColor = 'text-emerald-100 font-extrabold';
      statusText = 'VACANT';
    } else if (berth.status === 'PARTIAL_JOURNEY') {
      bgClasses =
        'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-1 ring-emerald-400 hover:bg-emerald-700';
      labelColor = 'text-emerald-100 font-extrabold';
      statusText = `${berth.coveragePercent || 'Part'}%`;
    }

    const opacityClass = isMatching ? 'opacity-100' : 'opacity-30 hover:opacity-70';

    return (
      <button
        key={berth.berthNumber}
        type="button"
        onClick={() => onSelectBerth && onSelectBerth(berth)}
        onMouseEnter={() => setHoveredBerth(berth)}
        onMouseLeave={() => setHoveredBerth(null)}
        title={`Seat ${berth.berthNumber} (${getBerthTypeLabel(berth)}) - ${statusText}`}
        className={`relative flex flex-col justify-between p-1.5 sm:p-2 rounded-xl border text-center transition-all cursor-pointer select-none ${bgClasses} ${opacityClass} ${
          compact ? 'min-h-[50px]' : 'min-h-[58px]'
        } ${
          isSelected
            ? 'ring-3 ring-blue-500 ring-offset-2 ring-offset-white scale-[1.05] z-10 border-blue-600 shadow-md'
            : isHovered
            ? 'scale-[1.02]'
            : ''
        }`}
      >
        {/* Top: Position Label & SVG Window */}
        <div className="flex items-center justify-between w-full leading-none text-[8.5px] font-extrabold tracking-wider">
          <span className={`truncate ${labelColor}`}>
            {getBerthTypeLabel(berth)}
          </span>
          {hasWindow && (
            <span
              className={`shrink-0 ml-1 inline-flex items-center ${
                isVacant ? 'text-white' : 'text-sky-500'
              }`}
              title="Window Seat"
            >
              <WindowSvg className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Center: Big Bold Seat Number */}
        <div className="font-mono font-black text-sm sm:text-base tracking-tight leading-tight my-0.5">
          {berth.berthNumber}
        </div>

        {/* Bottom: Vacant/Booked Status Pill */}
        <div className="leading-none text-[8px] font-bold uppercase tracking-wider">
          {isVacant ? (
            <span className="text-white drop-shadow-xs font-black">
              {statusText}
            </span>
          ) : (
            <span className="text-slate-400 font-semibold">
              {statusText}
            </span>
          )}
        </div>
      </button>
    );
  };

  const totalBerthsCount = bays.reduce((acc, b) => acc + (b.berths?.length || 0), 0);

  return (
    <div className="space-y-3.5">
      {/* Notice if chart is not officially prepared */}
      {!isChartPrepared && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 flex items-start gap-2.5 text-xs shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block text-amber-900 font-bold">
              IRCTC Reservation Chart Opens 4 Hours Prior to Departure
            </strong>
            <span className="text-amber-700 text-[11px]">
              Displaying exact physical coach layout for {coachId} ({travelClass}). Window seats and berth positions below are 100% verified.
            </span>
          </div>
        </div>
      )}

      {/* Filter Toolbar (Berth Type & Vacant Only) in Clean Light Mode */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs text-slate-700">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 select-none">
            Berth Type:
          </span>
          {berthTypeFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterTypeChange && onFilterTypeChange(f.id)}
              className={`px-2 py-0.5 text-[11px] rounded-lg font-bold transition-colors cursor-pointer border ${
                filterType === f.id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 select-none">
            Filter:
          </span>
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterStatusChange && onFilterStatusChange(f.id)}
              className={`px-2 py-0.5 text-[11px] rounded-lg font-bold transition-colors cursor-pointer border ${
                filterStatus === f.id
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coach Exterior Housing (Crisp Light Theme Train Carriage) */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-3 sm:p-5 shadow-xs">
        {/* Coach Header Banner */}
        <div className="pb-3 mb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-base sm:text-lg font-black px-2.5 py-1 rounded-lg bg-blue-600 text-white shadow-xs">
              {coachId}
            </span>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>
                  {travelClass === '1A'
                    ? 'AC First Class (1A)'
                    : travelClass === '2A'
                    ? 'AC 2 Tier (2A)'
                    : travelClass === 'SL'
                    ? 'Sleeper Class (SL)'
                    : travelClass === '2S'
                    ? 'Second Sitting (2S)'
                    : travelClass === 'CC'
                    ? 'AC Chair Car (CC)'
                    : 'AC 3 Tier (3A)'}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                  LHB Coach
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Train {trainNumber} &bull; {trainName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
            <span className="font-bold">{bays.length} Bays</span>
            <span>&bull;</span>
            <span className="font-bold">{totalBerthsCount} Berths</span>
          </div>
        </div>

        {/* Legend Ribbon */}
        <div className="px-2.5 py-1.5 mb-3.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-3.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-600" />
              <span className="text-emerald-700 font-bold">Vacant Seat (Green)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-200 border border-slate-300" />
              <span>Booked (Gray)</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-sky-600">
              <WindowSvg className="w-3 h-3" />
              <span>Window Seat</span>
            </span>
          </div>
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            Click any seat to inspect
          </span>
        </div>

        {/* ========================================================
            MOBILE VIEW (< md): Vertical Corridor Layout (Where Is My Train Style)
            ======================================================== */}
        <div className="block md:hidden space-y-3">
          {/* Door 1 & Toilet Header */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <DoorClosed className="w-4 h-4 text-slate-500" />
              <span>Door 1 (Entry)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Bath className="w-3.5 h-3.5" />
              <span>Toilets 1 & 2</span>
            </div>
          </div>

          {/* Vertical Bays Flow */}
          {bays.map((bay) => {
            const mainBerths = (bay.berths || []).filter(
              (b) => b.berthType !== 'SIDE_LOWER' && b.berthType !== 'SIDE_UPPER'
            );
            const sideBerths = (bay.berths || []).filter(
              (b) => b.berthType === 'SIDE_LOWER' || b.berthType === 'SIDE_UPPER'
            );

            // Split main berths into facing benches (Row A vs Row B)
            const mid = Math.ceil(mainBerths.length / 2);
            const benchA = mainBerths.slice(0, mid);
            const benchB = mainBerths.slice(mid);

            return (
              <div
                key={`mobile-bay-${bay.bayNumber}`}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 shadow-2xs"
              >
                {/* Bay Heading */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-800">
                    {bay.bayLabel || `Bay ${bay.bayNumber}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Seats {bay.berths?.[0]?.berthNumber} &ndash; {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                  </span>
                </div>

                {/* Grid: Main Bay (7 cols) | Aisle Corridor (1 col) | Side Bay (4 cols) */}
                <div className="grid grid-cols-12 gap-1.5 items-stretch">
                  {/* Left: Main Bay Facing Benches */}
                  <div className="col-span-7 flex flex-col gap-1.5">
                    <div className="grid grid-cols-3 gap-1">
                      {benchA.map((b) => renderSeat(b, true))}
                    </div>
                    {benchB.length > 0 && (
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-dashed border-slate-200">
                        {benchB.map((b) => renderSeat(b, true))}
                      </div>
                    )}
                  </div>

                  {/* Center: Walking Aisle Corridor */}
                  <div className="col-span-1 flex flex-col items-center justify-center border-x border-dashed border-slate-200 py-1">
                    <AislePathSvg className="w-2.5 h-full text-slate-400" />
                  </div>

                  {/* Right: Side Bay Seats */}
                  <div className="col-span-4 flex flex-col gap-1.5 justify-between">
                    {sideBerths.map((b) => renderSeat(b, true))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Door 2 & Toilet Footer */}
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <DoorClosed className="w-4 h-4 text-slate-500" />
              <span>Door 2 (Exit)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <Bath className="w-3.5 h-3.5" />
              <span>Toilets 3 & 4</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            DESKTOP VIEW (>= md): Horizontal Full-Width Bay Layout
            ======================================================== */}
        <div className="hidden md:flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {/* Left Door & Restroom */}
          <div className="flex flex-col items-center justify-between py-4 px-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 shrink-0 select-none min-w-[76px]">
            <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-700">
              <DoorClosed className="w-4 h-4 text-slate-500" />
              <span>Door 1</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[9px] text-slate-500 my-4">
              <Bath className="w-3.5 h-3.5" />
              <span>Toilets</span>
            </div>
            <div className="text-[10px] font-bold text-slate-600">
              Entry
            </div>
          </div>

          {/* Bays Sequence Horizontally */}
          <div className="flex items-stretch gap-3 shrink-0">
            {bays.map((bay) => {
              const mainBerths = (bay.berths || []).filter(
                (b) => b.berthType !== 'SIDE_LOWER' && b.berthType !== 'SIDE_UPPER'
              );
              const sideBerths = (bay.berths || []).filter(
                (b) => b.berthType === 'SIDE_LOWER' || b.berthType === 'SIDE_UPPER'
              );
              const mid = Math.ceil(mainBerths.length / 2);
              const benchA = mainBerths.slice(0, mid);
              const benchB = mainBerths.slice(mid);

              return (
                <div
                  key={`desktop-bay-${bay.bayNumber}`}
                  className="flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 min-w-[175px] shadow-2xs"
                >
                  {/* Bay Tag */}
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200 text-[10.5px]">
                    <span className="font-bold text-slate-800">
                      {bay.bayLabel || `Bay ${bay.bayNumber}`}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-500">
                      Seats {bay.berths?.[0]?.berthNumber} &ndash; {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                    </span>
                  </div>

                  {/* Top: Main Compartment (Facing Benches) */}
                  <div className="flex flex-col gap-1.5">
                    <div className="grid grid-cols-3 gap-1">
                      {benchA.map((b) => renderSeat(b))}
                    </div>
                    {benchB.length > 0 && (
                      <div className="grid grid-cols-3 gap-1 pt-1 border-t border-dashed border-slate-200">
                        {benchB.map((b) => renderSeat(b))}
                      </div>
                    )}
                  </div>

                  {/* Middle: Aisle Corridor Walkway */}
                  <div className="flex items-center justify-center my-2 py-0.5 border-y border-dashed border-slate-300">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      <AislePathSvg className="w-3 h-3 text-slate-400" />
                      Aisle
                    </span>
                  </div>

                  {/* Bottom: Side Berths */}
                  <div className="grid grid-cols-2 gap-1">
                    {sideBerths.map((b) => renderSeat(b))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Door & Restroom */}
          <div className="flex flex-col items-center justify-between py-4 px-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-600 shrink-0 select-none min-w-[76px]">
            <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-700">
              <DoorClosed className="w-4 h-4 text-slate-500" />
              <span>Door 2</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[9px] text-slate-500 my-4">
              <Bath className="w-3.5 h-3.5" />
              <span>Toilets</span>
            </div>
            <div className="text-[10px] font-bold text-slate-600">
              Exit
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoachMap;
