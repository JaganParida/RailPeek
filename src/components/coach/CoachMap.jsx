import { useState } from 'react';
import { DoorClosed, Bath } from 'lucide-react';

/**
 * Visual Indian Railways Coach Schematic Map
 * Rendered with exact IRCTC Reservation Chart color parity:
 * - Pale Grey-Blue (#dbe5f1): Occupied for full journey
 * - Golden Yellow (#fed766): Occupied for part journey
 * - Light Green (#86efac): Vacant for full journey
 * Pure light mode, high readability, zero dark mode clutter.
 */
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
}) {
  const [hoveredBerth, setHoveredBerth] = useState(null);

  const berthTypeFilters = [
    { id: 'ALL', label: 'All Berths' },
    { id: 'LOWER', label: 'Lower (L)' },
    { id: 'MIDDLE', label: 'Middle (M)', hideFor: ['2A', '1A'] },
    { id: 'UPPER', label: 'Upper (U)' },
    { id: 'SIDE_LOWER', label: 'Side Lower (SL)', hideFor: ['1A'] },
    { id: 'SIDE_UPPER', label: 'Side Upper (SU)', hideFor: ['1A'] },
  ].filter((f) => !f.hideFor || !f.hideFor.includes(travelClass));

  const statusFilters = [
    { id: 'ALL', label: 'All Statuses' },
    { id: 'FULL_JOURNEY', label: 'Full Journey Only' },
    { id: 'AVAILABLE', label: 'Any Vacant (Full + Part)' },
  ];

  const matchesFilters = (berth) => {
    if (!berth) return false;
    if (filterType !== 'ALL' && berth.berthType !== filterType) {
      return false;
    }
    if (filterStatus === 'FULL_JOURNEY' && berth.status !== 'FULL_JOURNEY') {
      return false;
    }
    if (filterStatus === 'AVAILABLE' && berth.status !== 'FULL_JOURNEY' && berth.status !== 'PARTIAL_JOURNEY') {
      return false;
    }
    return true;
  };

  const renderBerthTile = (berth) => {
    if (!berth) return null;

    const isSelected = selectedBerthNumber === berth.berthNumber;
    const isHovered = hoveredBerth?.berthNumber === berth.berthNumber;
    const isMatching = matchesFilters(berth);

    // Exact IRCTC color parity
    let bgClasses = 'bg-[#dbe5f1] text-[#1e293b] border-[#b0c4de] hover:border-slate-400';
    let statusLabel = 'Occupied for full journey';
    let statusDot = 'bg-[#64748b]';

    if (berth.status === 'FULL_JOURNEY') {
      bgClasses = 'bg-[#86efac] text-[#14532d] border-[#22c55e] hover:bg-[#4ade80]';
      statusLabel = 'Vacant for full journey';
      statusDot = 'bg-[#16a34a]';
    } else if (berth.status === 'PARTIAL_JOURNEY') {
      bgClasses = 'bg-[#fed766] text-[#713f12] border-[#f59e0b] hover:bg-[#fde047]';
      statusLabel = `Occupied for part journey (${berth.coveragePercent}% available)`;
      statusDot = 'bg-[#d97706]';
    }

    const shortType =
      berth.berthType === 'LOWER'
        ? 'L'
        : berth.berthType === 'MIDDLE'
        ? 'M'
        : berth.berthType === 'UPPER'
        ? 'U'
        : berth.berthType === 'SIDE_LOWER'
        ? 'SL'
        : berth.berthType === 'SIDE_UPPER'
        ? 'SU'
        : berth.berthType;

    const opacityClass = isMatching ? 'opacity-100' : 'opacity-30 hover:opacity-75';

    return (
      <button
        key={berth.berthNumber}
        type="button"
        onClick={() => onSelectBerth && onSelectBerth(berth)}
        onMouseEnter={() => setHoveredBerth(berth)}
        onMouseLeave={() => setHoveredBerth(null)}
        aria-label={`Berth ${berth.berthNumber}, ${berth.berthType}, ${statusLabel}`}
        className={`relative flex flex-col items-center justify-between p-1.5 rounded-lg border-2 text-center transition-all cursor-pointer select-none min-h-[58px] min-w-[54px] ${bgClasses} ${opacityClass} ${
          isSelected
            ? 'ring-2 ring-blue-700 ring-offset-2 scale-105 border-blue-700 z-10'
            : isHovered
            ? 'scale-102'
            : ''
        }`}
      >
        {/* Top: Short type and dot */}
        <div className="flex items-center justify-between w-full text-[10px] leading-none mb-0.5 font-bold">
          <span className="font-mono text-[9px] uppercase tracking-wider opacity-80">
            {shortType}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
        </div>

        {/* Center: Berth Number + Type (IRCTC style: e.g. "1 L", "7 SL") */}
        <div className="font-mono font-black text-xs sm:text-sm tracking-tight leading-tight">
          {berth.berthNumber} {shortType}
        </div>

        {/* Bottom: Status */}
        <div className="text-[9px] font-semibold leading-none mt-0.5 truncate max-w-full">
          {berth.status === 'FULL_JOURNEY' ? (
            <span className="text-[#14532d]">Vacant</span>
          ) : berth.status === 'PARTIAL_JOURNEY' ? (
            <span className="text-[#713f12]">{berth.coveragePercent}%</span>
          ) : (
            <span className="text-[#475569]">Occupied</span>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Interactive Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-300">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-700 mr-1 select-none">
            Berth Type:
          </span>
          {berthTypeFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterTypeChange && onFilterTypeChange(f.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer border ${
                filterType === f.id
                  ? 'bg-brand-600 border-brand-600 text-white font-bold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-700 mr-1 select-none">
            Availability:
          </span>
          {statusFilters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterStatusChange && onFilterStatusChange(f.id)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer border ${
                filterStatus === f.id
                  ? 'bg-brand-600 border-brand-600 text-white font-bold'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Coach Exterior Shell */}
      <div className="relative rounded-2xl border-2 border-slate-300 bg-slate-100/70 p-3 sm:p-5 overflow-hidden">
        {/* Coach Exterior Destination & Header Strip */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm sm:text-base font-black px-2.5 py-1 rounded bg-[#284a96] text-white">
              {coachId}
            </span>
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {travelClass === '1A'
                  ? 'AC First Class (1A)'
                  : travelClass === '2A'
                  ? 'AC 2 Tier (2A)'
                  : travelClass === 'SL'
                  ? 'Sleeper Class (SL)'
                  : 'AC 3 Tier (3A)'}
              </span>
              <span className="text-xs text-slate-600 ml-2">
                &bull; {trainNumber} {trainName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="font-mono font-bold">{bays.length} Bays</span>
            <span>&bull;</span>
            <span className="font-mono font-bold">{bays.reduce((acc, b) => acc + b.berths.length, 0)} Berths</span>
          </div>
        </div>

        {/* Coach Layout Body with Doors and Bays */}
        <div className="flex items-stretch gap-3 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin">
          {/* Left Door & Restroom */}
          <div className="flex flex-col items-center justify-between py-4 px-2.5 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 shrink-0 select-none min-w-[70px]">
            <div className="flex flex-col items-center gap-1 text-[10px] font-semibold">
              <DoorClosed className="w-4 h-4 text-slate-600" />
              <span>Door 1</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[9px] text-slate-400 my-4">
              <Bath className="w-3.5 h-3.5" />
              <span>Washrooms</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600">
              Entry
            </div>
          </div>

          {/* Bays Sequence */}
          <div className="flex items-stretch gap-3 shrink-0">
            {bays.map((bay) => (
              <div
                key={bay.bayNumber}
                className="flex flex-col justify-between p-2.5 rounded-xl border border-slate-300 bg-white min-w-[170px]"
              >
                {/* Bay Header */}
                <div className="text-center pb-1.5 mb-2 border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-700">
                    {bay.bayLabel}
                  </span>
                </div>

                {/* Main Compartment: Left & Right Rows */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="flex flex-col gap-1.5 flex-1">
                    {bay.mainLeft.map((b) => renderBerthTile(b))}
                  </div>

                  {bay.mainRight.length > 0 && (
                    <div className="flex flex-col gap-1.5 flex-1">
                      {bay.mainRight.map((b) => renderBerthTile(b))}
                    </div>
                  )}
                </div>

                {/* Corridor Walkway / Aisle */}
                {travelClass !== '1A' && (
                  <div className="my-1.5 py-1 px-2 rounded bg-slate-100 border border-dashed border-slate-300 text-center text-[9px] font-mono text-slate-500 select-none tracking-widest uppercase">
                    &bull; &bull; Aisle &bull; &bull;
                  </div>
                )}

                {/* Side Berths across corridor (SL, SU) */}
                {bay.side.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mt-1">
                    {bay.side.map((b) => (
                      <div key={b.berthNumber} className="flex-1">
                        {renderBerthTile(b)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Door & Restroom */}
          <div className="flex flex-col items-center justify-between py-4 px-2.5 rounded-xl border border-dashed border-slate-300 bg-white text-slate-500 shrink-0 select-none min-w-[70px]">
            <div className="flex flex-col items-center gap-1 text-[10px] font-semibold">
              <DoorClosed className="w-4 h-4 text-slate-600" />
              <span>Door 2</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-[9px] text-slate-400 my-4">
              <Bath className="w-3.5 h-3.5" />
              <span>Washrooms</span>
            </div>
            <div className="text-[10px] font-semibold text-slate-600">
              Exit
            </div>
          </div>
        </div>
      </div>

      {/* IRCTC Official Legend Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-300 text-xs text-slate-700">
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            NOTE: Click on berth to see details.
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-[#b0c4de] bg-[#dbe5f1]" />
              <span className="font-medium text-slate-800">Occupied for full journey</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-[#f59e0b] bg-[#fed766]" />
              <span className="font-medium text-slate-800">Occupied for part journey</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded border border-[#22c55e] bg-[#86efac]" />
              <span className="font-medium text-slate-800">Vacant for full journey</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-600 font-medium">
          <span className="font-bold">L:</span> Lower &bull; <span className="font-bold">M:</span> Middle &bull; <span className="font-bold">U:</span> Upper &bull; <span className="font-bold">SL:</span> Side Lower &bull; <span className="font-bold">SU:</span> Side Upper
        </div>
      </div>
    </div>
  );
}
