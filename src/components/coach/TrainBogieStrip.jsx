import React, { useMemo } from 'react';

/**
 * Modern Indian Railways WAP-7 Electric Locomotive SVG
 * Aerodynamic dual cab, roof pantograph, front buffer & dual headlights.
 * ViewBox: 0 0 68 32 (Wheels at baseline cy=27)
 */
function Wap7LocoGraphic() {
  return (
    <svg
      className="w-[66px] h-[32px] drop-shadow-2xs select-none"
      viewBox="0 0 68 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Roof Pantograph */}
      <path d="M22 6L28 2H38L44 6" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M30 2L33 0.5H35L38 2" stroke="#64748b" strokeWidth="1" />
      <line x1="28" y1="4" x2="38" y2="4" stroke="#64748b" strokeWidth="1" />

      {/* Main Streamlined Locomotive Body */}
      <path
        d="M2 25V14C2 10 5 6 10 6H56C61 6 66 10 66 15L66 25C66 26 65 26.5 64 26.5H4C3 26.5 2 26 2 25Z"
        fill="#dc2626"
      />

      {/* Aerodynamic Front Cowling & Windshield Cab (Forward Facing Right) */}
      <path d="M48 8H58C62 8 64.5 11 65 14H48V8Z" fill="#1e293b" />
      {/* Front Windscreen Glass */}
      <rect x="50" y="9" width="6" height="4.5" rx="1" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="0.5" />
      <rect x="58" y="9.5" width="5.5" height="4" rx="1" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="0.5" />

      {/* Rear Cab Windscreen */}
      <rect x="5" y="9" width="5.5" height="4.5" rx="1" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="0.5" />

      {/* Indian Railways Cream/Yellow Speed Stripe */}
      <rect x="2" y="15" width="64" height="3" fill="#fef08a" />

      {/* Side Ventilation Louvres / Grilles */}
      <rect x="14" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />
      <rect x="19" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />
      <rect x="24" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />
      <rect x="29" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />
      <rect x="34" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />
      <rect x="39" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />
      <rect x="44" y="9" width="3" height="4" rx="0.5" fill="#991b1b" />

      {/* Front Headlight & Marker Lights */}
      <circle cx="64" cy="18" r="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.6" />
      <circle cx="64" cy="18" r="0.8" fill="#ffffff" />
      <circle cx="63" cy="22" r="1" fill="#ef4444" />

      {/* Front Buffer / Cowcatcher */}
      <path d="M64 24L68 26V28H63L64 24Z" fill="#334155" />

      {/* Underframe Chassis */}
      <rect x="4" y="24" width="60" height="3" fill="#1e293b" />

      {/* Modern High-Speed Bogie Wheels (cy=27, matching all coaches) */}
      <circle cx="12" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="12" cy="27" r="1.2" fill="#e2e8f0" />
      <circle cx="21" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="21" cy="27" r="1.2" fill="#e2e8f0" />
      <circle cx="47" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="47" cy="27" r="1.2" fill="#e2e8f0" />
      <circle cx="56" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="56" cy="27" r="1.2" fill="#e2e8f0" />
    </svg>
  );
}

/**
 * Passenger Coach Graphic (LHB Style)
 * ViewBox: 0 0 60 32 (Wheels at baseline cy=27)
 */
function CoachBogieGraphic({ state = 'VACANT' }) {
  // state: 'ACTIVE' | 'VACANT' | 'BOOKED' | 'UNRESERVED'
  let bodyFill = '#059669'; // Emerald-600
  let bodyStroke = '#047857';
  let roofFill = '#047857';
  let windowFill = '#d1fae5';
  let windowStroke = '#a7f3d0';

  if (state === 'ACTIVE') {
    bodyFill = '#2563eb'; // Blue-600
    bodyStroke = '#1d4ed8';
    roofFill = '#1e40af';
    windowFill = '#dbeafe';
    windowStroke = '#bfdbfe';
  } else if (state === 'BOOKED') {
    bodyFill = '#e2e8f0'; // Slate-200
    bodyStroke = '#cbd5e1';
    roofFill = '#94a3b8';
    windowFill = '#f8fafc';
    windowStroke = '#e2e8f0';
  } else if (state === 'UNRESERVED') {
    bodyFill = '#f1f5f9';
    bodyStroke = '#cbd5e1';
    roofFill = '#94a3b8';
    windowFill = '#ffffff';
    windowStroke = '#e2e8f0';
  }

  return (
    <svg
      className="w-[58px] h-[32px] drop-shadow-2xs select-none"
      viewBox="0 0 60 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Coach Carriage Body */}
      <rect
        x="1"
        y="5"
        width="58"
        height="20"
        rx="3"
        fill={bodyFill}
        stroke={bodyStroke}
        strokeWidth="1.2"
      />

      {/* Aerodynamic Curved Roof */}
      <rect x="2" y="5" width="56" height="3" rx="1" fill={roofFill} />

      {/* End Passenger Entry Doors */}
      <rect
        x="3"
        y="8.5"
        width="4"
        height="14"
        rx="0.5"
        fill={roofFill}
        opacity="0.35"
      />
      <rect
        x="53"
        y="8.5"
        width="4"
        height="14"
        rx="0.5"
        fill={roofFill}
        opacity="0.35"
      />

      {/* Row of Authentic Passenger Windows */}
      <rect x="10" y="9.5" width="6" height="6.5" rx="1" fill={windowFill} stroke={windowStroke} strokeWidth="0.6" />
      <rect x="18" y="9.5" width="6" height="6.5" rx="1" fill={windowFill} stroke={windowStroke} strokeWidth="0.6" />
      <rect x="26" y="9.5" width="6" height="6.5" rx="1" fill={windowFill} stroke={windowStroke} strokeWidth="0.6" />
      <rect x="34" y="9.5" width="6" height="6.5" rx="1" fill={windowFill} stroke={windowStroke} strokeWidth="0.6" />
      <rect x="42" y="9.5" width="6" height="6.5" rx="1" fill={windowFill} stroke={windowStroke} strokeWidth="0.6" />

      {/* Bottom Underframe Chassis */}
      <rect x="3" y="23.5" width="54" height="2" fill="#334155" />

      {/* Bogie Wheels (Exact cy=27 baseline) */}
      <circle cx="13" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="13" cy="27" r="1.2" fill="#cbd5e1" />
      <circle cx="47" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="47" cy="27" r="1.2" fill="#cbd5e1" />
    </svg>
  );
}

/**
 * Pantry Car Coach (PC) Graphic
 * ViewBox: 0 0 60 32 (Wheels at baseline cy=27)
 */
function PantryBogieGraphic() {
  return (
    <svg
      className="w-[58px] h-[32px] drop-shadow-2xs select-none"
      viewBox="0 0 60 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="5" width="58" height="20" rx="3" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      <rect x="2" y="5" width="56" height="3" rx="1" fill="#94a3b8" />
      {/* Service Windows */}
      <rect x="9" y="10" width="7" height="6" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
      <rect x="19" y="10" width="7" height="6" rx="1" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="0.5" />
      {/* Kitchen Ventilation Grille */}
      <rect x="30" y="9" width="12" height="8" rx="0.5" fill="#cbd5e1" />
      <line x1="32" y1="11" x2="40" y2="11" stroke="#64748b" strokeWidth="0.8" />
      <line x1="32" y1="13" x2="40" y2="13" stroke="#64748b" strokeWidth="0.8" />
      <line x1="32" y1="15" x2="40" y2="15" stroke="#64748b" strokeWidth="0.8" />
      {/* Service Door */}
      <rect x="46" y="9" width="9" height="13" rx="0.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.6" />
      {/* Bogie Wheels */}
      <rect x="3" y="23.5" width="54" height="2" fill="#334155" />
      <circle cx="13" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="13" cy="27" r="1.2" fill="#cbd5e1" />
      <circle cx="47" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="47" cy="27" r="1.2" fill="#cbd5e1" />
    </svg>
  );
}

/**
 * Luggage / Generator Car / Guard Van (EOG / SLR) Graphic
 * ViewBox: 0 0 60 32 (Wheels at baseline cy=27)
 */
function SlrBogieGraphic({ isRearGuard = false }) {
  return (
    <svg
      className="w-[58px] h-[32px] drop-shadow-2xs select-none"
      viewBox="0 0 60 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="1" y="5" width="58" height="20" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.2" />
      <rect x="2" y="5" width="56" height="3" rx="1" fill="#94a3b8" />
      {/* Passenger/Crew Window */}
      <rect x="6" y="9.5" width="7" height="6.5" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
      {/* Heavy Luggage Shutter */}
      <rect x="17" y="9" width="18" height="13" rx="0.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
      <line x1="18" y1="12" x2="34" y2="12" stroke="#94a3b8" strokeWidth="0.6" />
      <line x1="18" y1="15" x2="34" y2="15" stroke="#94a3b8" strokeWidth="0.6" />
      <line x1="18" y1="18" x2="34" y2="18" stroke="#94a3b8" strokeWidth="0.6" />
      {/* Generator / Guard Compartment */}
      <rect x="39" y="9.5" width="8" height="6.5" rx="1" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.6" />
      {isRearGuard && (
        <>
          {/* Red Guard Flasher / Tail Lamp */}
          <circle cx="56" cy="15" r="2.2" fill="#ef4444" stroke="#991b1b" strokeWidth="0.5" />
          <circle cx="56" cy="15" r="0.9" fill="#ffffff" />
        </>
      )}
      {/* Bogie Wheels */}
      <rect x="3" y="23.5" width="54" height="2" fill="#334155" />
      <circle cx="13" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="13" cy="27" r="1.2" fill="#cbd5e1" />
      <circle cx="47" cy="27" r="3.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
      <circle cx="47" cy="27" r="1.2" fill="#cbd5e1" />
    </svg>
  );
}

/**
 * Realistic Indian Railways Full Train Formation Rake (Where Is My Train Style)
 * - 100% horizontally aligned along a single laser-straight baseline (zero vertical wobble)
 * - Full rake formation: LOCO ➔ EOG ➔ GEN ➔ Passenger Coaches ➔ PC ➔ GEN ➔ SLR
 * - Crisp Light Mode design, no track lines, modern WAP-7 locomotive & LHB coaches
 */
export function TrainBogieStrip({
  coaches = [],
  coachesData = [],
  activeCoach,
  onSelectCoach,
  activeClass = 'SL',
}) {
  // Assemble the complete authentic rake formation (Where Is My Train style)
  const fullRake = useMemo(() => {
    const slCoaches = coaches.filter((c) => c.startsWith('S'));
    const ac3Coaches = coaches.filter((c) => c.startsWith('B') || c.startsWith('M'));
    const ac2Coaches = coaches.filter((c) => c.startsWith('A'));
    const ac1Coaches = coaches.filter((c) => c.startsWith('H'));
    const ccCoaches = coaches.filter((c) => c.startsWith('C') || c.startsWith('E'));
    const twoSCoaches = coaches.filter((c) => c.startsWith('D'));
    const remaining = coaches.filter(
      (c) =>
        !c.startsWith('S') &&
        !c.startsWith('B') &&
        !c.startsWith('M') &&
        !c.startsWith('A') &&
        !c.startsWith('H') &&
        !c.startsWith('C') &&
        !c.startsWith('E') &&
        !c.startsWith('D')
    );

    const rake = [];

    // 1. Locomotive (WAP-7 High-Speed Electric Engine)
    rake.push({ id: 'LOCO', type: 'LOCO', label: 'LOCO', subLabel: 'Engine', isClickable: false });

    // 2. Front End-on-Generation Power Car (EOG)
    rake.push({ id: 'EOG_F', type: 'EOG', label: 'EOG', subLabel: 'Power', isClickable: false });

    // 3. Front General Unreserved Bogie
    rake.push({ id: 'GEN_1', type: 'GEN', label: 'GEN', subLabel: 'Unres', isClickable: false });

    // 4. Sleeper Coaches Sequence (S1, S2, S3...)
    slCoaches.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: 'SL' });
    });

    // 5. Pantry Car (PC) for long distance trains
    if (slCoaches.length > 0 && (ac3Coaches.length > 0 || ac2Coaches.length > 0)) {
      rake.push({ id: 'PC', type: 'PANTRY', label: 'PC', subLabel: 'Pantry', isClickable: false });
    }

    // 6. AC 3 Tier & AC 3 Economy Coaches (B1, B2..., M1)
    ac3Coaches.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: c.startsWith('M') ? '3E' : '3A' });
    });

    // 7. AC 2 Tier Coaches (A1, A2...)
    ac2Coaches.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: '2A' });
    });

    // 8. AC 1st Class Coaches (H1...)
    ac1Coaches.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: '1A' });
    });

    // 9. Chair Car & 2S Sitting (if present)
    ccCoaches.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: 'CC' });
    });
    twoSCoaches.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: '2S' });
    });
    remaining.forEach((c) => {
      rake.push({ id: c, type: 'COACH', coachName: c, classCode: 'GEN' });
    });

    // 10. Rear General Unreserved Bogie
    rake.push({ id: 'GEN_R', type: 'GEN', label: 'GEN', subLabel: 'Unres', isClickable: false });

    // 11. Rear Guard Van & Brake Car (SLR)
    rake.push({ id: 'SLR_R', type: 'SLR', label: 'SLR', subLabel: 'Guard', isClickable: false });

    return rake;
  }, [coaches]);

  const containerRef = React.useRef(null);
  const activeBogieRef = React.useRef(null);

  // Auto-center active bogie in view screen
  React.useEffect(() => {
    const centerActiveBogie = () => {
      if (activeBogieRef.current && containerRef.current) {
        const container = containerRef.current;
        const bogie = activeBogieRef.current;
        const bogieLeft = bogie.offsetLeft;
        const bogieWidth = bogie.offsetWidth;
        const containerWidth = container.offsetWidth;
        const targetScrollLeft = bogieLeft - containerWidth / 2 + bogieWidth / 2;

        container.scrollTo({
          left: Math.max(0, targetScrollLeft),
          behavior: 'smooth',
        });
      }
    };

    centerActiveBogie();
    const timer = setTimeout(centerActiveBogie, 80);
    return () => clearTimeout(timer);
  }, [activeCoach]);

  return (
    <div className="w-full space-y-2 select-none">
      <div className="flex items-center justify-between text-xs px-1 text-slate-700 font-medium">
        <span className="font-bold text-slate-900 flex items-center gap-1.5">
          <span>Train Formation:</span>
          <span className="text-[11px] font-normal text-slate-500">
            ({fullRake.length} Bogies)
          </span>
        </span>
        <span className="text-[11px] text-slate-600 flex items-center gap-2">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-emerald-500 border border-emerald-600" />
            <span className="font-semibold text-emerald-800">Vacant Seats</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-blue-600 border border-blue-700" />
            <span className="font-semibold text-blue-800">Active Coach</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-2.5 h-2.5 rounded-xs bg-slate-200 border border-slate-300" />
            <span>Booked</span>
          </span>
        </span>
      </div>

      {/* Clean Train Rake Container - Laser Straight Alignment, Zero Track Lines */}
      <div
        ref={containerRef}
        className="relative p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-x-auto scrollbar-thin scroll-smooth"
      >
        <div className="flex items-center min-w-max">
          {fullRake.map((bogie, idx) => {
            const isLast = idx === fullRake.length - 1;

            if (bogie.type === 'COACH') {
              const coach = bogie.coachName;
              const isActive = activeCoach === coach;
              const meta = (coachesData || []).find(
                (c) => c.coachName === coach || c.coachId === coach
              );
              const vacantCount =
                meta?.vacantBerths !== undefined
                  ? meta.vacantBerths
                  : isActive
                  ? 1
                  : 0;
              const hasVacancies =
                vacantCount > 0 || (isActive && bogie.classCode === activeClass);

              let coachState = 'BOOKED';
              if (isActive) coachState = 'ACTIVE';
              else if (hasVacancies) coachState = 'VACANT';

              return (
                <React.Fragment key={bogie.id}>
                  {/* Fixed-Size Coach Column (Guarantees 100% Horizontal Alignment) */}
                  <div
                    ref={isActive ? activeBogieRef : null}
                    className="flex flex-col items-center shrink-0 w-[62px]"
                  >
                    {/* 1. Coach Graphic Slot (Fixed h-[34px] flex items-center) */}
                    <div className="h-[34px] flex items-center justify-center">
                      <button
                        type="button"
                        disabled={!hasVacancies}
                        onClick={() => hasVacancies && onSelectCoach(coach)}
                        title={
                          hasVacancies
                            ? `Select ${coach} (${vacantCount} vacant seats)`
                            : `${coach} has 0 vacant berths`
                        }
                        className={`transition-transform focus:outline-none ${
                          hasVacancies
                            ? 'cursor-pointer hover:scale-105'
                            : 'cursor-not-allowed opacity-60'
                        }`}
                      >
                        <CoachBogieGraphic state={coachState} />
                      </button>
                    </div>

                    {/* 2. Coach Name Label (Fixed h-[16px] flex items-center) */}
                    <div className="h-[16px] flex items-center justify-center mt-1">
                      <span
                        className={`font-mono text-[11px] font-black leading-none ${
                          isActive
                            ? 'text-blue-600'
                            : hasVacancies
                            ? 'text-emerald-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {coach}
                      </span>
                    </div>

                    {/* 3. Seat Count Badge (Fixed h-[18px] flex items-center) */}
                    <div className="h-[18px] flex items-center justify-center mt-0.5">
                      <span
                        className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded leading-none ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : hasVacancies
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-slate-100 text-slate-400 border border-slate-200'
                        }`}
                      >
                        {hasVacancies
                          ? vacantCount > 0
                            ? `${vacantCount} seats`
                            : bogie.classCode
                          : bogie.classCode || 'Full'}
                      </span>
                    </div>
                  </div>

                  {/* Connecting Coupler between coaches at exact vertical center */}
                  {!isLast && (
                    <div className="flex items-center shrink-0 w-2.5 h-[34px] justify-center -mx-0.5">
                      <div className="w-full h-[3px] bg-slate-400 rounded-full" />
                    </div>
                  )}
                </React.Fragment>
              );
            }

            return (
              <React.Fragment key={bogie.id}>
                {/* Fixed-Size Special Bogie Column (Identical slot heights) */}
                <div
                  className={`flex flex-col items-center shrink-0 select-none ${
                    bogie.type === 'LOCO' ? 'w-[70px]' : 'w-[62px]'
                  }`}
                  title={`${bogie.label} - ${bogie.subLabel}`}
                >
                  {/* 1. Graphic Slot (Fixed h-[34px] flex items-center) */}
                  <div className="h-[34px] flex items-center justify-center">
                    {bogie.type === 'LOCO' && <Wap7LocoGraphic />}
                    {bogie.type === 'EOG' && <SlrBogieGraphic isRearGuard={false} />}
                    {bogie.type === 'GEN' && <CoachBogieGraphic state="UNRESERVED" />}
                    {bogie.type === 'PANTRY' && <PantryBogieGraphic />}
                    {bogie.type === 'SLR' && <SlrBogieGraphic isRearGuard={true} />}
                  </div>

                  {/* 2. Bogie Name Label (Fixed h-[16px] flex items-center) */}
                  <div className="h-[16px] flex items-center justify-center mt-1">
                    <span
                      className={`font-mono text-[11px] font-black leading-none uppercase ${
                        bogie.type === 'LOCO' ? 'text-red-700' : 'text-slate-500'
                      }`}
                    >
                      {bogie.label}
                    </span>
                  </div>

                  {/* 3. Sub-Label Badge (Fixed h-[18px] flex items-center) */}
                  <div className="h-[18px] flex items-center justify-center mt-0.5">
                    <span
                      className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-none ${
                        bogie.type === 'LOCO'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {bogie.subLabel}
                    </span>
                  </div>
                </div>

                {/* Connecting Coupler between carriages at exact vertical center */}
                {!isLast && (
                  <div className="flex items-center shrink-0 w-2.5 h-[34px] justify-center -mx-0.5">
                    <div className="w-full h-[3px] bg-slate-400 rounded-full" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TrainBogieStrip;
