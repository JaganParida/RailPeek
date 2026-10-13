import { useState, useMemo } from 'react';
import { DoorClosed, Bath } from 'lucide-react';

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
  berths = [],
  selectedBerthNumber,
  onSelectBerth,
}) {
  const [hoveredBerth, setHoveredBerth] = useState(null);

  // Fast berth lookup map for real IRCTC live vacancy status
  const berthsMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(berths)) {
      for (const b of berths) {
        if (b && b.berthNumber !== undefined) {
          map.set(Number(b.berthNumber), b);
          map.set(String(b.berthNumber), b);
        }
      }
    }
    return map;
  }, [berths]);

  const isWindowBerth = (berth) => {
    if (!berth) return false;
    if (berth.berthType === 'SIDE_LOWER' || berth.berthType === 'WINDOW') return true;
    const mod = berth.berthNumber % 8;
    return mod === 1 || mod === 4 || mod === 7;
  };

  const getBerthCode = (berth) => {
    if (!berth) return '';
    switch (berth.berthType) {
      case 'LOWER':
        return 'LB';
      case 'MIDDLE':
        return 'MB';
      case 'UPPER':
        return 'UB';
      case 'SIDE_LOWER':
        return 'SL';
      case 'SIDE_UPPER':
        return 'SU';
      case 'WINDOW':
        return 'WS';
      case 'AISLE':
        return 'AS';
      case 'CABIN':
        return 'CB';
      case 'COUPE':
        return 'CP';
      default:
        return berth.berthType?.slice(0, 2) || 'ST';
    }
  };

  const getBerthTitle = (berth) => {
    if (!berth) return '';
    switch (berth.berthType) {
      case 'LOWER':
        return 'Lower Berth';
      case 'MIDDLE':
        return 'Middle Berth';
      case 'UPPER':
        return 'Upper Berth';
      case 'SIDE_LOWER':
        return 'Side Lower';
      case 'SIDE_UPPER':
        return 'Side Upper';
      case 'WINDOW':
        return 'Window Seat';
      case 'AISLE':
        return 'Aisle Seat';
      case 'CABIN':
        return 'Cabin Berth';
      case 'COUPE':
        return 'Coupe Berth';
      default:
        return berth.berthType || 'Seat';
    }
  };

  const isVacantBerth = (berth) => {
    if (!berth) return false;
    const num = Number(berth.berthNumber);
    const enriched = berthsMap.get(num) || berthsMap.get(String(berth.berthNumber)) || berth;
    if (enriched.isVacant === true || enriched.vacant === true || enriched.available === true) return true;
    if (typeof enriched.coveragePercent === 'number' && enriched.coveragePercent > 0) return true;
    const st = String(enriched.status || berth.status || '').toUpperCase().trim();
    return (
      st === 'FULL_JOURNEY' ||
      st === 'PARTIAL_JOURNEY' ||
      st === 'VACANT' ||
      st === 'AVAILABLE' ||
      st === 'AVAILABLE_FULL' ||
      st === 'AVAILABLE_PARTIAL' ||
      st === 'CNF'
    );
  };

  /**
   * Authentic Where Is My Train Seat Design (Commit 8941b6d)
   * - Leather pillow notch at top
   * - LB, MB, UB, SL, SU code + Window icon
   * - Prominent font-mono berth number
   * - VACANT (Vibrant Emerald Green) vs BOOKED (Soft Slate Grey)
   */
  const renderSeat = (rawBerth, compact = false, benchFacing = 'AUTO') => {
    if (!rawBerth) {
      return (
        <div
          className={`rounded-xl bg-slate-50 border border-dashed border-slate-200 ${
            compact ? 'h-14' : 'h-16'
          }`}
        />
      );
    }

    const num = Number(rawBerth.berthNumber);
    const berth = berthsMap.get(num) || berthsMap.get(String(rawBerth.berthNumber)) || rawBerth;

    const isSelected = selectedBerthNumber === berth.berthNumber;
    const isHovered = hoveredBerth?.berthNumber === berth.berthNumber;
    const hasWindow = isWindowBerth(berth);
    const isVacant = isVacantBerth(berth);
    const isPartial = berth.status === 'PARTIAL_JOURNEY' || (berth.coveragePercent > 0 && berth.coveragePercent < 100);
    const berthCode = getBerthCode(berth);
    const berthTitle = getBerthTitle(berth);

    // Style Rule (Exact 8941b6d commit):
    // Vacant = Authentic Vibrant Emerald Green Berth with Cushion Ridge
    // Booked = Classic Soft Gray Seat
    const bgClasses = isVacant
      ? 'bg-emerald-600 text-white border-2 border-emerald-500 shadow-xs hover:bg-emerald-500 active:scale-95'
      : 'bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200/90 active:scale-95';

    return (
      <button
        key={berth.berthNumber}
        type="button"
        onClick={() => onSelectBerth && onSelectBerth(berth)}
        onMouseEnter={() => setHoveredBerth(berth)}
        onMouseLeave={() => setHoveredBerth(null)}
        title={`Seat ${berth.berthNumber} (${berthTitle}) - ${
          isVacant
            ? isPartial
              ? `Vacant (${berth.coveragePercent || 0}% segment)`
              : 'Vacant (Available)'
            : 'Booked (Occupied)'
        }`}
        className={`relative flex flex-col justify-between p-1 sm:p-1.5 rounded-xl text-center transition-all cursor-pointer select-none ${bgClasses} ${
          compact ? 'min-h-[56px]' : 'min-h-[62px]'
        } ${
          isSelected
            ? 'ring-3 ring-blue-600 ring-offset-2 ring-offset-white scale-[1.04] z-10 border-blue-600 shadow-md'
            : isHovered
            ? 'scale-[1.02] shadow-xs'
            : ''
        }`}
      >
        {/* Cushion Headrest Bar (Authentic Railway Leather Berth Detail) */}
        <div
          className={`w-full h-1 rounded-full mb-0.5 transition-opacity ${
            isVacant ? 'bg-white/40' : 'bg-slate-300'
          }`}
        />

        {/* Top: Berth Code (LB, MB, UB, SL, SU) & Window Icon */}
        <div className="flex items-center justify-between w-full leading-none px-0.5">
          <span
            className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
              isVacant ? 'text-emerald-100' : 'text-slate-600'
            }`}
          >
            {berthCode}
          </span>
          {hasWindow && (
            <span
              className={`shrink-0 inline-flex items-center gap-0.5 ${
                isVacant ? 'text-emerald-100' : 'text-sky-600'
              }`}
              title="Window Seat"
            >
              <WindowSvg className="w-2.5 h-2.5" />
            </span>
          )}
        </div>

        {/* Center: Prominent Railway Berth Number */}
        <div
          className={`font-mono font-black text-sm sm:text-base tracking-tight leading-none my-0.5 ${
            isVacant ? 'text-white' : 'text-slate-900'
          }`}
        >
          {berth.berthNumber}
        </div>

        {/* Bottom: Vacant/Booked Status Pill */}
        <div className="leading-none text-[8px] sm:text-[8.5px] font-bold uppercase tracking-wider">
          {isVacant ? (
            <span className="text-emerald-50 bg-emerald-700/80 px-1 py-0.2 rounded font-black inline-block">
              {isPartial ? `${berth.coveragePercent || 'Part'}%` : 'VACANT'}
            </span>
          ) : (
            <span className="text-slate-400 font-semibold">
              BOOKED
            </span>
          )}
        </div>
      </button>
    );
  };

  const totalBerthsCount = bays.reduce((acc, b) => acc + (b.berths?.length || 0), 0);

  return (
    <div className="space-y-3.5">
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
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600 border border-emerald-700" />
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
                  <div className="col-span-4 flex flex-col gap-1.5">
                    {sideBerths[0] && renderSeat(sideBerths[0], true)}
                    {benchB.length > 0 && sideBerths.length > 1 && (
                      <div className="flex items-center justify-center pt-1 border-t border-dashed border-slate-200">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                          Side Bay
                        </span>
                      </div>
                    )}
                    {sideBerths[1] && renderSeat(sideBerths[1], true)}
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
            DESKTOP VIEW (>= md): Horizontal Amne-Samne Facing Bay Layout
            (Authentic 90-degree Rotated Carriage: Left Bench faces Right Bench)
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
                  className="flex flex-col justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 min-w-[210px] max-w-[230px] shadow-2xs"
                >
                  {/* Bay Tag */}
                  <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800">
                      {bay.bayLabel || `Bay ${bay.bayNumber}`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Seats {bay.berths?.[0]?.berthNumber} &ndash; {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                    </span>
                  </div>

                  {/* Window Strip at Top of Compartment */}
                  <div className="flex items-center justify-center pb-1.5 text-sky-600 text-[10px] font-bold gap-1">
                    <WindowSvg className="w-3 h-3" />
                    <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">Window</span>
                  </div>

                  {/* Top: Main Compartment - Amne-Samne Facing Benches (Left Bench faces Right Bench) */}
                  <div className="grid grid-cols-11 gap-1.5 items-stretch bg-white p-2 rounded-lg border border-slate-200">
                    {/* Left Bench (Facing Right) */}
                    <div className="col-span-5 flex flex-col gap-1.5">
                      {benchA.map((b) => renderSeat(b, true, 'LEFT'))}
                    </div>

                    {/* Table / Middle Leg Space Divider */}
                    <div className="col-span-1 flex flex-col items-center justify-center">
                      <div className="w-0.5 h-full bg-slate-200 border-l border-dashed border-slate-300" />
                    </div>

                    {/* Right Bench (Facing Left) */}
                    <div className="col-span-5 flex flex-col gap-1.5">
                      {benchB.map((b) => renderSeat(b, true, 'RIGHT'))}
                    </div>
                  </div>

                  {/* Middle: Walking Aisle Corridor */}
                  <div className="flex items-center justify-center my-2 py-0.5 border-y border-dashed border-slate-300">
                    <span className="text-[9px] font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                      <AislePathSvg className="w-3 h-3 text-slate-400" />
                      Aisle
                    </span>
                  </div>

                  {/* Bottom: Side Bay Berths */}
                  <div className="grid grid-cols-2 gap-1.5 bg-white p-2 rounded-lg border border-slate-200">
                    {sideBerths.map((b) => renderSeat(b, true, 'SIDE'))}
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
