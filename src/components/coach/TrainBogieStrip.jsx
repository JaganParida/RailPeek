/**
 * Realistic Indian Railways Train & Bogie Formation Strip
 * Pure SVG illustrations (Zero Emojis) - Clean Light Mode.
 * - Clickable colored coaches for available berths.
 * - Muted gray disabled coaches for 0 vacant berths.
 */
export function TrainBogieStrip({
  coaches = [],
  coachesData = [],
  activeCoach,
  onSelectCoach,
  activeClass = 'SL',
}) {
  return (
    <div className="w-full space-y-1.5 select-none">
      <div className="flex items-center justify-between text-xs px-1 text-slate-600 font-medium">
        <span className="font-bold text-slate-800">Train Composition:</span>
        <span className="text-[11px] text-slate-500">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1 align-middle" />
          Green = Vacant Berths &bull; Gray = 0 Seats
        </span>
      </div>

      {/* Scrollable Train Track Container in Crisp Light Mode */}
      <div className="relative p-2.5 rounded-xl bg-white border border-slate-200 shadow-xs overflow-x-auto scrollbar-thin">
        {/* Railway Track Rails */}
        <div className="absolute left-2 right-2 bottom-3.5 h-[2px] bg-slate-300 pointer-events-none" />
        <div className="absolute left-2 right-2 bottom-2 h-[2px] bg-slate-300 pointer-events-none" />

        <div className="flex items-end gap-1 min-w-max pb-3">
          {/* Locomotive Engine SVG */}
          <div className="flex flex-col items-center shrink-0">
            <svg
              className="w-16 h-10 text-orange-600 drop-shadow-xs"
              viewBox="0 0 70 42"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Engine Body */}
              <path
                d="M4 32H66V14C66 11 63 9 58 9H34V16H18C12 16 8 20 6 26L4 32Z"
                fill="currentColor"
              />
              {/* Cab Window */}
              <rect x="42" y="12" width="10" height="7" rx="1.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
              <rect x="24" y="18" width="6" height="5" rx="1" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
              {/* Smokestack */}
              <rect x="12" y="8" width="5" height="8" rx="1" fill="#c2410c" />
              {/* Cowcatcher / Bumper */}
              <path d="M2 32L6 28V34H0L2 32Z" fill="#64748b" />
              {/* Headlight */}
              <circle cx="4" cy="27" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
              {/* Wheels */}
              <circle cx="16" cy="34" r="4.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="28" cy="34" r="4.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="46" cy="34" r="4.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
              <circle cx="58" cy="34" r="4.5" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-orange-700 mt-1 uppercase">
              LOCO
            </span>
          </div>

          {/* Coupler */}
          <div className="w-2 h-1 bg-slate-400 self-center mb-4 shrink-0" />

          {/* Passenger Coaches Sequence */}
          {coaches.map((coach) => {
            const isActive = activeCoach === coach;

            // Class detection
            const coachClass = coach.startsWith('H')
              ? '1A'
              : coach.startsWith('A')
              ? '2A'
              : coach.startsWith('B')
              ? '3A'
              : coach.startsWith('S')
              ? 'SL'
              : coach.startsWith('D') || coach.startsWith('C')
              ? '2S'
              : 'GEN';

            // Lookup vacancy from live data
            const meta = (coachesData || []).find((c) => c.coachName === coach || c.coachId === coach);
            const vacantCount = meta?.vacantBerths !== undefined ? meta.vacantBerths : (isActive ? 1 : 0);

            // Rule: If coach has vacant seats, colored and clickable.
            // If 0 vacant seats, gray and cannot be clicked.
            const hasVacancies = vacantCount > 0 || (isActive && coachClass === activeClass);

            return (
              <div key={coach} className="flex items-center shrink-0">
                <button
                  type="button"
                  disabled={!hasVacancies}
                  onClick={() => hasVacancies && onSelectCoach(coach)}
                  title={
                    hasVacancies
                      ? `Select ${coach} (${vacantCount} vacant berths)`
                      : `${coach} (${coachClass}) has 0 vacant berths`
                  }
                  className={`flex flex-col items-center p-1 rounded-lg transition-all ${
                    hasVacancies
                      ? 'cursor-pointer hover:scale-105 focus:outline-none'
                      : 'cursor-not-allowed opacity-45'
                  }`}
                >
                  {/* SVG Bogie Graphic */}
                  <svg
                    className={`w-14 h-9 transition-colors ${
                      isActive
                        ? 'drop-shadow-sm'
                        : hasVacancies
                        ? 'drop-shadow-xs'
                        : ''
                    }`}
                    viewBox="0 0 60 36"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* Coach Body */}
                    <rect
                      x="2"
                      y="4"
                      width="56"
                      height="24"
                      rx="3"
                      fill={isActive ? '#2563eb' : hasVacancies ? '#10b981' : '#f1f5f9'}
                      stroke={isActive ? '#1d4ed8' : hasVacancies ? '#059669' : '#cbd5e1'}
                      strokeWidth="1.5"
                    />
                    {/* Roof Strip */}
                    <rect
                      x="4"
                      y="5"
                      width="52"
                      height="3"
                      rx="1"
                      fill={isActive ? '#1e40af' : hasVacancies ? '#047857' : '#94a3b8'}
                    />
                    {/* Windows */}
                    <rect
                      x="7"
                      y="11"
                      width="6"
                      height="6"
                      rx="1"
                      fill={isActive ? '#bfdbfe' : hasVacancies ? '#d1fae5' : '#cbd5e1'}
                    />
                    <rect
                      x="17"
                      y="11"
                      width="6"
                      height="6"
                      rx="1"
                      fill={isActive ? '#bfdbfe' : hasVacancies ? '#d1fae5' : '#cbd5e1'}
                    />
                    <rect
                      x="27"
                      y="11"
                      width="6"
                      height="6"
                      rx="1"
                      fill={isActive ? '#bfdbfe' : hasVacancies ? '#d1fae5' : '#cbd5e1'}
                    />
                    <rect
                      x="37"
                      y="11"
                      width="6"
                      height="6"
                      rx="1"
                      fill={isActive ? '#bfdbfe' : hasVacancies ? '#d1fae5' : '#cbd5e1'}
                    />
                    <rect
                      x="47"
                      y="11"
                      width="6"
                      height="6"
                      rx="1"
                      fill={isActive ? '#bfdbfe' : hasVacancies ? '#d1fae5' : '#cbd5e1'}
                    />
                    {/* Wheels */}
                    <circle cx="14" cy="30" r="3.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                    <circle cx="46" cy="30" r="3.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                  </svg>

                  {/* Coach Identifier & Vacant Badge */}
                  <span
                    className={`font-mono text-[11px] font-black mt-0.5 leading-none ${
                      isActive
                        ? 'text-blue-600'
                        : hasVacancies
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {coach}
                  </span>

                  <span
                    className={`text-[8.5px] font-bold px-1 py-0.2 rounded mt-0.5 leading-none ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : hasVacancies
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {hasVacancies ? (vacantCount > 0 ? `${vacantCount} seats` : `${coachClass}`) : '0'}
                  </span>
                </button>

                {/* Coupler between coaches */}
                <div className="w-1.5 h-0.5 bg-slate-400 self-center mb-4 shrink-0" />
              </div>
            );
          })}

          {/* Guard Van / SLR at rear */}
          <div className="flex flex-col items-center shrink-0">
            <svg
              className="w-14 h-9 text-slate-400"
              viewBox="0 0 60 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="4" width="56" height="24" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
              <rect x="8" y="11" width="8" height="6" rx="1" fill="#cbd5e1" />
              <rect x="22" y="9" width="16" height="12" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="14" cy="30" r="3.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="46" cy="30" r="3.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
            </svg>
            <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5 uppercase">
              GUARD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrainBogieStrip;
