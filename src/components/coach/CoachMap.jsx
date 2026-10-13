import React from 'react';
import { DoorClosed, Bath } from 'lucide-react';

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

/**
 * Authentic "Where Is My Train" Blueprint Seat Card
 * - TOP orientation: Seat Number on top, Position label on bottom, rounded top corners
 * - BOTTOM orientation: Position label on top, Seat Number on bottom, rounded bottom corners
 * - Strictly light mode: Vacant is rich Emerald Green; Booked is clean neutral Slate Gray
 * - Compact, professional height without unnecessary gaps
 */
function BlueprintSeat({
  berth,
  orientation = 'TOP',
  positionLabel = '',
  isVacant = false,
  isSelected = false,
  onClick,
}) {
  if (!berth) {
    return (
      <div className="w-full h-[42px] sm:h-[46px] rounded-md border border-dashed border-slate-200 bg-slate-50/50" />
    );
  }

  const isBottom = orientation === 'BOTTOM';
  const isLeft = orientation === 'LEFT';
  const isRight = orientation === 'RIGHT';

  // Authentic curvature: Backrest side is rounded-xl, front facing side is rounded-xs
  const roundedClass = isLeft
    ? 'rounded-l-xl rounded-r-xs'
    : isRight
    ? 'rounded-r-xl rounded-l-xs'
    : isBottom
    ? 'rounded-t-xs rounded-b-xl'
    : 'rounded-t-xl rounded-b-xs';

  // Color theme: Vacant = Vibrant Emerald Green; Booked = Slate Gray
  const colorClass = isVacant
    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-2xs'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 shadow-2xs';

  const selectedClass = isSelected
    ? 'ring-3 ring-blue-600 ring-offset-1 ring-offset-white scale-[1.03] z-10 border-blue-600 shadow-md'
    : 'active:scale-95';

  const labelColorClass = isVacant ? 'text-emerald-100' : 'text-slate-500';

  const seatTitle = isVacant
    ? berth.status === 'PARTIAL_JOURNEY' && berth.availableFrom && berth.availableTo
      ? `Seat ${berth.berthNumber} (${positionLabel}) - Vacant (${berth.availableFrom} ➔ ${berth.availableTo}, ${berth.coveragePercent || 0}%)`
      : `Seat ${berth.berthNumber} (${positionLabel}) - Vacant (Available)`
    : `Seat ${berth.berthNumber} (${positionLabel}) - Booked (Occupied)`;

  // Desktop Left Bench: Seat Number on Left (backrest), Label on Right (table / facing right)
  if (isLeft) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={seatTitle}
        className={`relative w-full h-[42px] sm:h-[46px] flex flex-row items-center justify-between px-2.5 py-1 transition-all duration-150 select-none cursor-pointer border ${roundedClass} ${colorClass} ${selectedClass}`}
      >
        <span className="font-mono font-black text-sm sm:text-base leading-none tracking-tight">
          {berth.berthNumber}
        </span>
        <span
          className={`text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-tight leading-none ${labelColorClass}`}
        >
          {positionLabel}
        </span>
      </button>
    );
  }

  // Desktop Right Bench: Label on Left (table / facing left), Seat Number on Right (backrest)
  if (isRight) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={seatTitle}
        className={`relative w-full h-[42px] sm:h-[46px] flex flex-row items-center justify-between px-2.5 py-1 transition-all duration-150 select-none cursor-pointer border ${roundedClass} ${colorClass} ${selectedClass}`}
      >
        <span
          className={`text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-tight leading-none ${labelColorClass}`}
        >
          {positionLabel}
        </span>
        <span className="font-mono font-black text-sm sm:text-base leading-none tracking-tight">
          {berth.berthNumber}
        </span>
      </button>
    );
  }

  // Mobile Vertical Views (TOP / BOTTOM)
  return (
    <button
      type="button"
      onClick={onClick}
      title={seatTitle}
      className={`relative w-full h-[46px] sm:h-[50px] max-w-[76px] mx-auto flex flex-col items-center justify-between py-1 px-0.5 transition-all duration-150 select-none cursor-pointer border ${roundedClass} ${colorClass} ${selectedClass}`}
    >
      {isBottom ? (
        <>
          <span
            className={`text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-tight leading-none mt-0.5 ${labelColorClass}`}
          >
            {positionLabel}
          </span>
          <span className="font-mono font-black text-sm sm:text-base leading-tight tracking-tight mb-0.5">
            {berth.berthNumber}
          </span>
        </>
      ) : (
        <>
          <span className="font-mono font-black text-sm sm:text-base leading-tight tracking-tight mt-0.5">
            {berth.berthNumber}
          </span>
          <span
            className={`text-[8px] sm:text-[8.5px] font-extrabold uppercase tracking-tight leading-none mb-0.5 ${labelColorClass}`}
          >
            {positionLabel}
          </span>
        </>
      )}
    </button>
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
  const berthsMap = React.useMemo(() => {
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

  const isVacantBerth = (berth) => {
    if (!berth) return false;
    const num = Number(berth.berthNumber);
    const enriched = berthsMap.get(num) || berthsMap.get(String(berth.berthNumber)) || berth;
    if (enriched.isVacant === true || enriched.vacant === true || enriched.available === true) return true;
    if (typeof enriched.coveragePercent === 'number' && enriched.coveragePercent > 0) return true;
    const st = String(enriched.status || berth.status || '').toUpperCase().trim();
    if (
      st === 'FULL_JOURNEY' ||
      st === 'PARTIAL_JOURNEY' ||
      st === 'VACANT' ||
      st === 'AVAILABLE' ||
      st === 'AVAILABLE_FULL' ||
      st === 'AVAILABLE_PARTIAL' ||
      st === 'CNF'
    ) {
      return true;
    }
    return false;
  };

  const getPositionLabel = (berth, idx, isSide, rowLength = 3, isRightSide = false) => {
    if (!berth) return '';
    if (isSide || berth.berthType === 'SIDE_LOWER' || berth.berthType === 'SIDE_UPPER') {
      if (berth.berthType === 'SIDE_LOWER') return 'SIDE LOWER';
      if (berth.berthType === 'SIDE_UPPER') return 'SIDE UPPER';
      return 'SIDE';
    }
    if (berth.berthType === 'LOWER') return 'WINDOW';
    if (berth.berthType === 'MIDDLE') return 'MIDDLE';
    if (berth.berthType === 'UPPER') return 'AISLE';
    if (berth.berthType === 'WINDOW') return 'WINDOW';
    if (berth.berthType === 'AISLE') return 'AISLE';

    if (isRightSide) {
      if (idx === 0) return 'AISLE';
      if (idx === 1) return 'MIDDLE';
      return 'WINDOW';
    }

    if (rowLength === 2) {
      return idx === 0 ? 'WINDOW' : 'AISLE';
    }
    if (rowLength === 1) {
      return 'WINDOW';
    }
    if (idx === 0) return 'WINDOW';
    if (idx === 1) return 'MIDDLE';
    return 'AISLE';
  };

  const totalBerthsCount = bays.reduce((acc, b) => acc + (b.berths?.length || 0), 0);

  // Helper to determine whether coach uses 2S / Chair Car layout (3+3) vs Sleeper (3+2)
  const isChairCarLayout =
    travelClass === '2S' ||
    travelClass === 'CC' ||
    (coachId && (coachId.startsWith('D') || coachId.startsWith('C')));

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
        <div className="px-3 py-2 mb-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2.5 text-xs font-semibold text-slate-700">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-emerald-600 border border-emerald-700 shadow-2xs" />
              <span className="text-emerald-800 font-bold">Vacant (Available)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 shadow-2xs" />
              <span className="text-slate-600">Booked (Occupied)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded border-2 border-blue-600 ring-2 ring-blue-500/30 bg-white" />
              <span className="text-blue-700">Selected</span>
            </span>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline font-normal">
            Blueprint Layout &bull; Click any seat to inspect
          </span>
        </div>

        {/* ========================================================
            MOBILE VIEW (< md): Vertical Corridor Blueprint
            ======================================================== */}
        <div className="block md:hidden space-y-3.5">
          {/* Door 1 & Toilet Header */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
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
            const allBerths = bay.berths || [];

            if (isChairCarLayout) {
              // 2S / Chair Car Layout: 3 on left + 3 on right
              const leftBerths = allBerths.filter(
                (b) =>
                  b.position?.includes('LEFT') ||
                  (b.berthNumber % 6 >= 1 && b.berthNumber % 6 <= 3)
              );
              const rightBerths = allBerths.filter(
                (b) =>
                  b.position?.includes('RIGHT') ||
                  b.berthNumber % 6 === 4 ||
                  b.berthNumber % 6 === 5 ||
                  b.berthNumber % 6 === 0
              );

              const midLeft = Math.ceil(leftBerths.length / 2);
              const midRight = Math.ceil(rightBerths.length / 2);
              const leftTop = leftBerths.slice(0, midLeft);
              const leftBottom = leftBerths.slice(midLeft);
              const rightTop = rightBerths.slice(0, midRight);
              const rightBottom = rightBerths.slice(midRight);

              return (
                <div
                  key={`mobile-bay-${bay.bayNumber}`}
                  className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 shadow-2xs"
                >
                  {/* Bay Heading */}
                  <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-800">
                      {bay.bayLabel || `Bay ${bay.bayNumber}`}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      Seats {bay.berths?.[0]?.berthNumber} &ndash;{' '}
                      {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                    </span>
                  </div>

                  {/* 3 + 3 Chair Car Layout with Central Walking Aisle */}
                  <div className="grid grid-cols-12 gap-1 items-stretch">
                    {/* Left 3-Seat Bench Column (Clean tight facing benches) */}
                    <div className="col-span-5 flex flex-col items-center gap-1.5 sm:gap-2">
                      {/* Left Top Bench with U-Bracket Rail */}
                      <div className="relative pt-1.5 px-0.5 pb-0 w-full">
                        <div className="absolute top-0 left-0 right-0 h-4 border-t-2 border-x-2 border-slate-300 rounded-t-lg pointer-events-none" />
                        <div className="grid grid-cols-3 gap-1 relative z-1">
                          {leftTop.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="TOP"
                              positionLabel={getPositionLabel(b, idx, false, 3, false)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Left Bottom Bench with Inverted U-Bracket Rail */}
                      <div className="relative pb-1.5 px-0.5 pt-0 w-full">
                        <div className="grid grid-cols-3 gap-1 relative z-1">
                          {leftBottom.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="BOTTOM"
                              positionLabel={getPositionLabel(b, idx, false, 3, false)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-4 border-b-2 border-x-2 border-slate-300 rounded-b-lg pointer-events-none" />
                      </div>
                    </div>

                    {/* Central Walking Aisle */}
                    <div className="col-span-2 flex flex-col items-center justify-between border-x-2 border-dashed border-slate-300 py-1.5 bg-slate-100/40 select-none">
                      <AislePathSvg className="w-2.5 h-3 text-slate-300" />
                      <div className="flex flex-col items-center justify-center gap-0.5 my-auto">
                        <span className="text-[7.5px] font-black text-slate-400 leading-none">A</span>
                        <span className="text-[7.5px] font-black text-slate-400 leading-none">I</span>
                        <span className="text-[7.5px] font-black text-slate-400 leading-none">S</span>
                        <span className="text-[7.5px] font-black text-slate-400 leading-none">L</span>
                        <span className="text-[7.5px] font-black text-slate-400 leading-none">E</span>
                      </div>
                      <AislePathSvg className="w-2.5 h-3 text-slate-300" />
                    </div>

                    {/* Right 3-Seat Bench Column (Clean tight facing benches) */}
                    <div className="col-span-5 flex flex-col items-center gap-1.5 sm:gap-2">
                      {/* Right Top Bench with U-Bracket Rail */}
                      <div className="relative pt-1.5 px-0.5 pb-0 w-full">
                        <div className="absolute top-0 left-0 right-0 h-4 border-t-2 border-x-2 border-slate-300 rounded-t-lg pointer-events-none" />
                        <div className="grid grid-cols-3 gap-1 relative z-1">
                          {rightTop.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="TOP"
                              positionLabel={getPositionLabel(b, idx, false, 3, true)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Right Bottom Bench with Inverted U-Bracket Rail */}
                      <div className="relative pb-1.5 px-0.5 pt-0 w-full">
                        <div className="grid grid-cols-3 gap-1 relative z-1">
                          {rightBottom.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="BOTTOM"
                              positionLabel={getPositionLabel(b, idx, false, 3, true)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-4 border-b-2 border-x-2 border-slate-300 rounded-b-lg pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Sleeper / 3A / 2A Layout: 3 (or 2) on left + 2 longitudinal on right
            const mainBerths = allBerths.filter(
              (b) => b.berthType !== 'SIDE_LOWER' && b.berthType !== 'SIDE_UPPER'
            );
            const sideBerths =
              bay.side && bay.side.length > 0
                ? bay.side
                : allBerths.filter(
                    (b) => b.berthType === 'SIDE_LOWER' || b.berthType === 'SIDE_UPPER'
                  );

            const benchA =
              bay.mainLeft && bay.mainLeft.length > 0
                ? bay.mainLeft
                : mainBerths.slice(0, Math.ceil(mainBerths.length / 2));
            const benchB =
              bay.mainRight && bay.mainRight.length > 0
                ? bay.mainRight
                : mainBerths.slice(Math.ceil(mainBerths.length / 2));

            const benchColsClass =
              benchA.length === 2
                ? 'grid grid-cols-2 gap-1 sm:gap-1.5'
                : benchA.length === 1
                ? 'grid grid-cols-1 gap-1 sm:gap-1.5'
                : 'grid grid-cols-3 gap-1 sm:gap-1.5';

            return (
              <div
                key={`mobile-bay-${bay.bayNumber}`}
                className="p-2 sm:p-2.5 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 shadow-2xs"
              >
                {/* Bay Heading */}
                <div className="flex items-center justify-between pb-1 border-b border-slate-200 text-[11px]">
                  <span className="font-bold text-slate-800">
                    {bay.bayLabel || `Bay ${bay.bayNumber}`}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Seats {bay.berths?.[0]?.berthNumber} &ndash;{' '}
                    {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                  </span>
                </div>

                {/* Grid: Main Bay (7 cols) | Walking Aisle (1 col) | Side Bay (4 cols) */}
                <div className="grid grid-cols-12 gap-1.5 items-stretch">
                  {/* Left: Main Bay Facing Benches (Clean tight facing benches) */}
                  <div className="col-span-7 flex flex-col items-center gap-1.5 sm:gap-2">
                    {/* Bench A (Top - Facing Forward) with U-Bracket Rail */}
                    <div className="relative pt-1.5 px-0.5 pb-0 w-full">
                      <div className="absolute top-0 left-0 right-0 h-4 border-t-2 border-x-2 border-slate-300 rounded-t-lg pointer-events-none" />
                      <div className={`${benchColsClass} relative z-1`}>
                        {benchA.map((b, idx) => (
                          <BlueprintSeat
                            key={b.berthNumber}
                            berth={b}
                            orientation="TOP"
                            positionLabel={getPositionLabel(b, idx, false, benchA.length, false)}
                            isVacant={isVacantBerth(b)}
                            isSelected={selectedBerthNumber === b.berthNumber}
                            onClick={() => onSelectBerth && onSelectBerth(b)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Bench B (Bottom - Facing Backward) with Inverted U-Bracket Rail */}
                    {benchB.length > 0 && (
                      <div className="relative pb-1.5 px-0.5 pt-0 w-full">
                        <div className={`${benchColsClass} relative z-1`}>
                          {benchB.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="BOTTOM"
                              positionLabel={getPositionLabel(b, idx, false, benchB.length, false)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-4 border-b-2 border-x-2 border-slate-300 rounded-b-lg pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Center: Walking Aisle Corridor */}
                  <div className="col-span-1 flex flex-col items-center justify-between border-x-2 border-dashed border-slate-300 py-1.5 bg-slate-100/40 select-none">
                    <AislePathSvg className="w-2.5 h-3 text-slate-300" />
                    <div className="flex flex-col items-center justify-center gap-0.5 my-auto">
                      <span className="text-[7.5px] font-black text-slate-400 leading-none">A</span>
                      <span className="text-[7.5px] font-black text-slate-400 leading-none">I</span>
                      <span className="text-[7.5px] font-black text-slate-400 leading-none">S</span>
                      <span className="text-[7.5px] font-black text-slate-400 leading-none">L</span>
                      <span className="text-[7.5px] font-black text-slate-400 leading-none">E</span>
                    </div>
                    <AislePathSvg className="w-2.5 h-3 text-slate-300" />
                  </div>

                  {/* Right: Side Bay Longitudinal Seats (Clean tight facing berths) */}
                  <div className="col-span-4 flex flex-col items-center gap-1.5 sm:gap-2">
                    {/* Side Lower (Top) with Top U-Bracket Rail */}
                    <div className="relative pt-1.5 px-0.5 pb-0 w-full">
                      <div className="absolute top-0 left-0 right-0 h-4 border-t-2 border-x-2 border-slate-300 rounded-t-lg pointer-events-none" />
                      <div className="relative z-1">
                        <BlueprintSeat
                          berth={sideBerths[0]}
                          orientation="TOP"
                          positionLabel="SIDE LOWER"
                          isVacant={isVacantBerth(sideBerths[0])}
                          isSelected={selectedBerthNumber === sideBerths[0]?.berthNumber}
                          onClick={() =>
                            sideBerths[0] && onSelectBerth && onSelectBerth(sideBerths[0])
                          }
                        />
                      </div>
                    </div>

                    {/* Side Upper (Bottom) with Bottom Inverted U-Bracket Rail */}
                    <div className="relative pb-1.5 px-0.5 pt-0 w-full">
                      <div className="relative z-1">
                        <BlueprintSeat
                          berth={sideBerths[1]}
                          orientation="BOTTOM"
                          positionLabel="SIDE UPPER"
                          isVacant={isVacantBerth(sideBerths[1])}
                          isSelected={selectedBerthNumber === sideBerths[1]?.berthNumber}
                          onClick={() =>
                            sideBerths[1] && onSelectBerth && onSelectBerth(sideBerths[1])
                          }
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-4 border-b-2 border-x-2 border-slate-300 rounded-b-lg pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Door 2 & Toilet Footer */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
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
        <div className="hidden md:flex items-stretch gap-3 overflow-x-auto pb-3 scrollbar-thin">
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
              const allBerths = bay.berths || [];

              if (isChairCarLayout) {
                const leftBerths = allBerths.filter(
                  (b) =>
                    b.position?.includes('LEFT') ||
                    (b.berthNumber % 6 >= 1 && b.berthNumber % 6 <= 3)
                );
                const rightBerths = allBerths.filter(
                  (b) =>
                    b.position?.includes('RIGHT') ||
                    b.berthNumber % 6 === 4 ||
                    b.berthNumber % 6 === 5 ||
                    b.berthNumber % 6 === 0
                );

                const midLeft = Math.ceil(leftBerths.length / 2);
                const midRight = Math.ceil(rightBerths.length / 2);
                const leftBenchA = leftBerths.slice(0, midLeft);
                const leftBenchB = leftBerths.slice(midLeft);
                const rightBenchA = rightBerths.slice(0, midRight);
                const rightBenchB = rightBerths.slice(midRight);

                return (
                  <div
                    key={`desktop-bay-${bay.bayNumber}`}
                    className="flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 min-w-[230px] sm:min-w-[240px] shadow-2xs"
                  >
                    {/* Bay Heading */}
                    <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200 text-[10.5px]">
                      <span className="font-bold text-slate-800">
                        {bay.bayLabel || `Bay ${bay.bayNumber}`}
                      </span>
                      <span className="text-[9.5px] font-mono text-slate-500">
                        Seats {bay.berths?.[0]?.berthNumber} &ndash;{' '}
                        {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                      </span>
                    </div>

                    {/* Top 3-Seat Facing Benches (Above Aisle: Left faces Right) */}
                    <div className="flex items-center justify-between gap-2 w-full px-0.5">
                      {/* Left Bench */}
                      <div className="relative pl-2 pr-0.5 py-0.5 shrink-0 flex-1">
                        <div className="absolute top-0 bottom-0 left-0 w-3 border-l-2 border-y-2 border-slate-300 rounded-l-xl pointer-events-none" />
                        <div className="flex flex-col gap-1.5 relative z-1">
                          {leftBenchA.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="LEFT"
                              positionLabel={getPositionLabel(b, idx, false, 3, false)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Legroom Table */}
                      <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                        <div className="w-1.5 h-20 bg-slate-300 rounded-full shadow-2xs" title="Snack Table" />
                      </div>

                      {/* Right Bench */}
                      <div className="relative pr-2 pl-0.5 py-0.5 shrink-0 flex-1">
                        <div className="flex flex-col gap-1.5 relative z-1">
                          {leftBenchB.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="RIGHT"
                              positionLabel={getPositionLabel(b, idx, false, 3, false)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                        <div className="absolute top-0 bottom-0 right-0 w-3 border-r-2 border-y-2 border-slate-300 rounded-r-xl pointer-events-none" />
                      </div>
                    </div>

                    {/* Horizontal Aisle Walkway */}
                    <div className="flex items-center justify-center my-2 py-0.5 border-y-2 border-dashed border-slate-300 bg-slate-100/50">
                      <span className="text-[8.5px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                        <AislePathSvg className="w-3 h-3 text-slate-400" />
                        AISLE WALKWAY
                        <AislePathSvg className="w-3 h-3 text-slate-400" />
                      </span>
                    </div>

                    {/* Bottom 3-Seat Facing Benches (Below Aisle: Left faces Right) */}
                    <div className="flex items-center justify-between gap-2 w-full px-0.5">
                      {/* Left Bench */}
                      <div className="relative pl-2 pr-0.5 py-0.5 shrink-0 flex-1">
                        <div className="absolute top-0 bottom-0 left-0 w-3 border-l-2 border-y-2 border-slate-300 rounded-l-xl pointer-events-none" />
                        <div className="flex flex-col gap-1.5 relative z-1">
                          {rightBenchA.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="LEFT"
                              positionLabel={getPositionLabel(b, idx, false, 3, true)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Legroom Table */}
                      <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                        <div className="w-1.5 h-20 bg-slate-300 rounded-full shadow-2xs" title="Snack Table" />
                      </div>

                      {/* Right Bench */}
                      <div className="relative pr-2 pl-0.5 py-0.5 shrink-0 flex-1">
                        <div className="flex flex-col gap-1.5 relative z-1">
                          {rightBenchB.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="RIGHT"
                              positionLabel={getPositionLabel(b, idx, false, 3, true)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                        <div className="absolute top-0 bottom-0 right-0 w-3 border-r-2 border-y-2 border-slate-300 rounded-r-xl pointer-events-none" />
                      </div>
                    </div>
                  </div>
                );
              }

              // Sleeper / 3A / 2A Layout
              const mainBerths = allBerths.filter(
                (b) => b.berthType !== 'SIDE_LOWER' && b.berthType !== 'SIDE_UPPER'
              );
              const sideBerths =
                bay.side && bay.side.length > 0
                  ? bay.side
                  : allBerths.filter(
                      (b) => b.berthType === 'SIDE_LOWER' || b.berthType === 'SIDE_UPPER'
                    );

              const benchA =
                bay.mainLeft && bay.mainLeft.length > 0
                  ? bay.mainLeft
                  : mainBerths.slice(0, Math.ceil(mainBerths.length / 2));
              const benchB =
                bay.mainRight && bay.mainRight.length > 0
                  ? bay.mainRight
                  : mainBerths.slice(Math.ceil(mainBerths.length / 2));

              return (
                <div
                  key={`desktop-bay-${bay.bayNumber}`}
                  className="flex flex-col justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 min-w-[230px] sm:min-w-[240px] shadow-2xs"
                >
                  {/* Bay Tag */}
                  <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-200 text-[10.5px]">
                    <span className="font-bold text-slate-800">
                      {bay.bayLabel || `Bay ${bay.bayNumber}`}
                    </span>
                    <span className="text-[9.5px] font-mono text-slate-500">
                      Seats {bay.berths?.[0]?.berthNumber} &ndash;{' '}
                      {bay.berths?.[bay.berths.length - 1]?.berthNumber}
                    </span>
                  </div>

                  {/* Top: Main Compartment (Facing Benches: Left Bench A facing Right Bench B) */}
                  <div className="flex items-center justify-between gap-2 w-full px-0.5">
                    {/* Left Bench (Bench A) - Vertically Stacked: WINDOW (top) -> MIDDLE -> AISLE (walkway) */}
                    <div className="relative pl-2 pr-0.5 py-0.5 shrink-0 flex-1">
                      {/* Left U-Bracket Rail */}
                      <div className="absolute top-0 bottom-0 left-0 w-3 border-l-2 border-y-2 border-slate-300 rounded-l-xl pointer-events-none" />
                      <div className="flex flex-col gap-1.5 relative z-1">
                        {benchA.map((b, idx) => (
                          <BlueprintSeat
                            key={b.berthNumber}
                            berth={b}
                            orientation="LEFT"
                            positionLabel={getPositionLabel(b, idx, false, benchA.length, false)}
                            isVacant={isVacantBerth(b)}
                            isSelected={selectedBerthNumber === b.berthNumber}
                            onClick={() => onSelectBerth && onSelectBerth(b)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Center Legroom & Vertical Snack Table */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                      <div className="w-1.5 h-20 bg-slate-300 rounded-full shadow-2xs" title="Snack Table" />
                    </div>

                    {/* Right Bench (Bench B) - Vertically Stacked: WINDOW (top) -> MIDDLE -> AISLE (walkway) */}
                    {benchB.length > 0 && (
                      <div className="relative pr-2 pl-0.5 py-0.5 shrink-0 flex-1">
                        <div className="flex flex-col gap-1.5 relative z-1">
                          {benchB.map((b, idx) => (
                            <BlueprintSeat
                              key={b.berthNumber}
                              berth={b}
                              orientation="RIGHT"
                              positionLabel={getPositionLabel(b, idx, false, benchB.length, false)}
                              isVacant={isVacantBerth(b)}
                              isSelected={selectedBerthNumber === b.berthNumber}
                              onClick={() => onSelectBerth && onSelectBerth(b)}
                            />
                          ))}
                        </div>
                        {/* Right Inverted U-Bracket Rail */}
                        <div className="absolute top-0 bottom-0 right-0 w-3 border-r-2 border-y-2 border-slate-300 rounded-r-xl pointer-events-none" />
                      </div>
                    )}
                  </div>

                  {/* Middle: Horizontal Aisle Corridor Walkway */}
                  <div className="flex items-center justify-center my-2 py-0.5 border-y-2 border-dashed border-slate-300 bg-slate-100/50">
                    <span className="text-[8.5px] font-black text-slate-400 tracking-widest uppercase flex items-center gap-1.5">
                      <AislePathSvg className="w-3 h-3 text-slate-400" />
                      AISLE WALKWAY
                      <AislePathSvg className="w-3 h-3 text-slate-400" />
                    </span>
                  </div>

                  {/* Bottom: Side Berths (Side Lower on left facing Right, Side Upper on right facing Left) */}
                  <div className="flex items-center justify-between gap-2 w-full px-0.5">
                    {/* Side Lower (Left) */}
                    <div className="relative pl-2 pr-0.5 py-0.5 shrink-0 flex-1">
                      <div className="absolute top-0 bottom-0 left-0 w-3 border-l-2 border-y-2 border-slate-300 rounded-l-xl pointer-events-none" />
                      <div className="relative z-1">
                        <BlueprintSeat
                          berth={sideBerths[0]}
                          orientation="LEFT"
                          positionLabel="SIDE LOWER"
                          isVacant={isVacantBerth(sideBerths[0])}
                          isSelected={selectedBerthNumber === sideBerths[0]?.berthNumber}
                          onClick={() =>
                            sideBerths[0] && onSelectBerth && onSelectBerth(sideBerths[0])
                          }
                        />
                      </div>
                    </div>

                    {/* Legroom Table */}
                    <div className="flex flex-col items-center justify-center shrink-0 px-0.5">
                      <div className="w-1.5 h-6 bg-slate-300 rounded-full shadow-2xs" />
                    </div>

                    {/* Side Upper (Right) */}
                    <div className="relative pr-2 pl-0.5 py-0.5 shrink-0 flex-1">
                      <div className="relative z-1">
                        <BlueprintSeat
                          berth={sideBerths[1]}
                          orientation="RIGHT"
                          positionLabel="SIDE UPPER"
                          isVacant={isVacantBerth(sideBerths[1])}
                          isSelected={selectedBerthNumber === sideBerths[1]?.berthNumber}
                          onClick={() =>
                            sideBerths[1] && onSelectBerth && onSelectBerth(sideBerths[1])
                          }
                        />
                      </div>
                      <div className="absolute top-0 bottom-0 right-0 w-3 border-r-2 border-y-2 border-slate-300 rounded-r-xl pointer-events-none" />
                    </div>
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
