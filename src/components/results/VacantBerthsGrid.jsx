// eslint-disable-next-line no-unused-vars
import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Route,
  LayoutGrid,
  AlertTriangle,
  RefreshCw,
  Info,
} from 'lucide-react';
import { computeConnectedItinerary } from '@/lib/routeChainer';

const SEATS_PAGE_SIZE = 8;

// Desirability rank order:
// 1. Side Lower (SL) -> 2. Side Upper (SU) -> 3. Lower (LB) -> 4. Upper (UB) -> 5. Middle (MB)
const BERTH_TYPE_CONFIG = {
  SIDE_LOWER: {
    label: 'Side Lower',
    short: 'SL',
    rank: 1,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  SL: {
    label: 'Side Lower',
    short: 'SL',
    rank: 1,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  SIDE_UPPER: {
    label: 'Side Upper',
    short: 'SU',
    rank: 2,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  SU: {
    label: 'Side Upper',
    short: 'SU',
    rank: 2,
    badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  LOWER: {
    label: 'Lower',
    short: 'LB',
    rank: 3,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  LB: {
    label: 'Lower',
    short: 'LB',
    rank: 3,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  UPPER: {
    label: 'Upper',
    short: 'UB',
    rank: 4,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  UB: {
    label: 'Upper',
    short: 'UB',
    rank: 4,
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  MIDDLE: {
    label: 'Middle',
    short: 'MB',
    rank: 5,
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  MB: {
    label: 'Middle',
    short: 'MB',
    rank: 5,
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
  },
  WINDOW: {
    label: 'Window Seat',
    short: 'WS',
    rank: 1,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  WS: {
    label: 'Window Seat',
    short: 'WS',
    rank: 1,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  AISLE: {
    label: 'Aisle Seat',
    short: 'AS',
    rank: 2,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  AS: {
    label: 'Aisle Seat',
    short: 'AS',
    rank: 2,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  MS: {
    label: 'Middle Seat',
    short: 'MS',
    rank: 3,
    badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

export function resolveBerthMeta(seat) {
  if (!seat) {
    return {
      label: 'Berth',
      short: 'BERTH',
      rank: 99,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    };
  }
  const rawType = (seat.berthType || seat.berthCode || '').toUpperCase();
  const cfg = BERTH_TYPE_CONFIG[rawType];
  if (cfg) return cfg;
  return {
    label: seat.berthType || 'Berth',
    short: seat.berthCode || seat.berthType || 'BERTH',
    rank: 99,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  };
}

const DEFAULT_VISIBLE_PER_ROW = 5; // Default 1 row of best picks per segment

export function VacantBerthsGrid({
  berths = [],
  allocatedBerths = [],
  fromStation = '',
  toStation = '',
  totalDistanceKm = 0,
  _trainNumber = '',
  _bookingChannel = 'IRCTC_ADVANCE_BOOKING',
  _isDeparted = false,
  _chartTimings = null,
  className = '',
}) {
  // Track which segment cards are expanded to view all seats beyond 1 row
  const [expandedSegments, setExpandedSegments] = useState({});

  // Combine and deduplicate available berths
  const rawList = berths && berths.length > 0 ? berths : allocatedBerths;

  // Deduplicate and sort strictly in station route progression (train travel direction)
  const sortedBerths = useMemo(() => {
    if (!Array.isArray(rawList)) return [];

    const map = new Map();
    for (const b of rawList) {
      const key = `${b.coach || 'B'}-${b.berthNumber}-${b.availableFrom || ''}-${b.availableTo || ''}`;
      if (!map.has(key)) map.set(key, b);
    }
    const unique = Array.from(map.values());

    return unique.sort((a, b) => {
      // 1. Full journey coverage first
      const aFull = a.status === 'FULL_JOURNEY' || a.coveragePercent === 100 ? 1 : 0;
      const bFull = b.status === 'FULL_JOURNEY' || b.coveragePercent === 100 ? 1 : 0;
      if (aFull !== bFull) return bFull - aFull;

      // 2. Train route sequence: Earlier boarding stop comes first (fromStopIndex)
      const aStart = typeof a.fromStopIndex === 'number' ? a.fromStopIndex : 99;
      const bStart = typeof b.fromStopIndex === 'number' ? b.fromStopIndex : 99;
      if (aStart !== bStart) return aStart - bStart;

      // 3. Longer segment first (toStopIndex or distance descending)
      const aEnd = typeof a.toStopIndex === 'number' ? a.toStopIndex : 0;
      const bEnd = typeof b.toStopIndex === 'number' ? b.toStopIndex : 0;
      if (aEnd !== bEnd) return bEnd - aEnd;

      const aDist = Number(a.segmentDistanceKm) || 0;
      const bDist = Number(b.segmentDistanceKm) || 0;
      if (aDist !== bDist) return bDist - aDist;

      // 4. Berth type comfort: SL > SU > LB > UB > MB
      const aType = (a.berthType || a.berthCode || '').toUpperCase();
      const bType = (b.berthType || b.berthCode || '').toUpperCase();
      const aRank = BERTH_TYPE_CONFIG[aType]?.rank ?? 99;
      const bRank = BERTH_TYPE_CONFIG[bType]?.rank ?? 99;
      if (aRank !== bRank) return aRank - bRank;

      // 5. Coach order and Berth number
      const coachCmp = (a.coach || '').localeCompare(b.coach || '');
      if (coachCmp !== 0) return coachCmp;

      return (Number(a.berthNumber) || 0) - (Number(b.berthNumber) || 0);
    });
  }, [rawList]);

  // Group berths by route segment in train travel progression
  const segmentGroups = useMemo(() => {
    const groupsMap = new Map();

    for (const b of sortedBerths) {
      const from = b.availableFrom || fromStation || 'Origin';
      const to = b.availableTo || toStation || 'Destination';
      const key = `${from}➔${to}`;

      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
          key,
          from,
          to,
          fromName: b.fromStationName || from,
          toName: b.toStationName || to,
          distanceKm: b.segmentDistanceKm || 0,
          fromStopIndex: typeof b.fromStopIndex === 'number' ? b.fromStopIndex : 99,
          toStopIndex: typeof b.toStopIndex === 'number' ? b.toStopIndex : 0,
          isBoardingSegment: from === fromStation,
          isDestinationSegment: to === toStation,
          berths: [],
        });
      }
      groupsMap.get(key).berths.push(b);
    }

    // Sort groups in train travel direction:
    // Segments starting at user's boarding station first, then chronological route order
    return Array.from(groupsMap.values()).sort((a, b) => {
      if (a.isBoardingSegment !== b.isBoardingSegment) {
        return a.isBoardingSegment ? -1 : 1;
      }
      if (a.fromStopIndex !== b.fromStopIndex) {
        return a.fromStopIndex - b.fromStopIndex;
      }
      return (b.distanceKm || 0) - (a.distanceKm || 0);
    });
  }, [sortedBerths, fromStation, toStation]);

  // DSA-Powered Connected Itinerary Planner
  // Discovers optimal multi-leg seat progression with comfort prioritization & transit gap bridging
  const connectedItinerary = useMemo(() => {
    return computeConnectedItinerary({
      segmentGroups,
      fromStation,
      toStation,
      totalTripDistanceKm: totalDistanceKm,
    });
  }, [segmentGroups, fromStation, toStation, totalDistanceKm]);

  // View mode switcher: default to 'CONNECTED' if itinerary exists, else 'ALL_STATIONS'
  const [userViewMode, setUserViewMode] = useState(null);
  const activeView = userViewMode || (connectedItinerary ? 'CONNECTED' : 'ALL_STATIONS');

  // Safe leg, gap and total seat counts for bulletproof rendering
  const seatLegsCount =
    connectedItinerary?.legsCount ||
    connectedItinerary?.legs?.length ||
    connectedItinerary?.items?.filter((it) => it.type === 'SEAT').length ||
    1;

  const gapCount =
    connectedItinerary?.gapCount ||
    connectedItinerary?.items?.filter((it) => it.type === 'GAP').length ||
    0;

  const totalSeatsAcrossJourney = useMemo(() => {
    if (!connectedItinerary?.items) return 0;
    return connectedItinerary.items
      .filter((it) => it.type === 'SEAT')
      .reduce((sum, it) => sum + (it.berths?.length || (it.seat ? 1 : 0)), 0);
  }, [connectedItinerary]);

  // Group journey stages for the left-aligned vertical route timeline
  const journeyStages = useMemo(() => {
    if (!connectedItinerary) return [];
    const items = connectedItinerary.items || [];
    const stages = [];
    let currentStep = 1;

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.type === 'SEAT') {
        const prev = i > 0 ? items[i - 1] : null;
        const isFirst = stages.length === 0;

        let nodeType = 'START';
        let nodeLabel = 'Boarding';
        let hasSwitchNotice = false;

        if (!isFirst) {
          if (prev && prev.type === 'GAP') {
            nodeType = 'GAP_RESUME';
            nodeLabel = 'Seat Resumes';
          } else {
            nodeType = 'SWITCH';
            nodeLabel = 'Switch';
            hasSwitchNotice = true;
          }
        }

        stages.push({
          id: `seat-${i}-${it.from}-${it.to}`,
          type: 'SEAT',
          stepNumber: currentStep++,
          stationCode: it.from,
          stationLabel: nodeLabel,
          nodeType,
          hasSwitchNotice,
          isGapTrack: false,
          item: it,
        });
      } else if (it.type === 'GAP') {
        stages.push({
          id: `gap-${i}-${it.from}-${it.to}`,
          type: 'GAP',
          stationCode: it.from,
          stationLabel: 'No Seat',
          nodeType: 'GAP_START',
          isGapTrack: true,
          item: it,
        });
      }
    }

    const lastItem = items[items.length - 1];
    const destCode = lastItem ? (lastItem.to || toStation) : toStation;
    stages.push({
      id: `dest-final-${destCode}`,
      type: 'DESTINATION',
      stationCode: destCode,
      stationLabel: 'Destination',
      nodeType: 'END',
      isGapTrack: false,
      item: null,
    });

    return stages;
  }, [connectedItinerary, toStation]);

  // Track user-selected seat per segment card (Interactive seat selection)
  const [selectedSeats, setSelectedSeats] = useState({});

  // Track pagination page per segment card (Defaults to 8 seats per page)
  const [seatPages, setSeatPages] = useState({});

  const handleSelectSeat = (segKey, seat) => {
    setSelectedSeats((prev) => {
      const current = prev[segKey];
      if (current && current.coach === seat.coach && current.berthNumber === seat.berthNumber) {
        return { ...prev, [segKey]: null };
      }
      return { ...prev, [segKey]: seat };
    });
  };

  // Toggle expand/collapse of a segment card in all stations view
  const handleToggleSegment = (segKey) => {
    setExpandedSegments((prev) => ({
      ...prev,
      [segKey]: !prev[segKey],
    }));
  };

  if (sortedBerths.length === 0) {
    return (
      <div className={`p-4 rounded-xl border border-slate-200 bg-slate-50 text-center ${className}`}>
        <p className="text-xs text-slate-500 font-medium">
          No vacant berths available in this coach/class.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* Top Interactive View Selector Tabs */}
      <div className="flex items-center justify-between gap-2 pb-1">
        {/* View Switcher Tabs (Strictly Single Row on Desktop & Mobile, Zero Overlap) */}
        <div className="grid grid-cols-2 sm:inline-flex sm:flex-row items-center gap-1 sm:gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-full sm:w-auto">
          {connectedItinerary && (
            <button
              type="button"
              onClick={() => setUserViewMode('CONNECTED')}
              className={`min-w-0 px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none whitespace-nowrap overflow-hidden ${
                activeView === 'CONNECTED'
                  ? 'bg-white text-[#1e3a8a] border border-slate-300 shadow-none'
                  : 'text-slate-600 hover:text-slate-900 border border-transparent'
              }`}
            >
              <Route className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Suggested Route</span>
              <span className="sm:hidden truncate">Suggested</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold uppercase shrink-0 ${
                  connectedItinerary.isDirect
                    ? 'bg-emerald-100 text-emerald-800'
                    : connectedItinerary.hasGaps
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {connectedItinerary.isDirect
                  ? 'Direct'
                  : connectedItinerary.hasGaps
                  ? `${seatLegsCount} Steps + Advice`
                  : `${seatLegsCount} Steps`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setUserViewMode('ALL_STATIONS')}
            className={`min-w-0 px-2 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer select-none whitespace-nowrap overflow-hidden ${
              activeView === 'ALL_STATIONS'
                ? 'bg-white text-[#1e3a8a] border border-slate-300 shadow-none'
                : 'text-slate-600 hover:text-slate-900 border border-transparent'
            }`}
          >
            <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500 shrink-0" />
            <span className="hidden sm:inline">All Stations</span>
            <span className="sm:hidden truncate">All Berths</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] bg-slate-200 text-slate-700 font-extrabold shrink-0">
              {sortedBerths.length}
            </span>
          </button>
        </div>
      </div>

      {/* VIEW 1: SUGGESTED CONNECTED ROUTE FLOW */}
      {activeView === 'CONNECTED' && connectedItinerary && (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">

          {/* Top Summary Strip: Clean neutral light mode, Total Seats, Coverage & Switches */}
          <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-6 h-6 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                <Route className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                {connectedItinerary.isDirect
                  ? 'Direct Journey'
                  : 'Connected Journey'}
              </span>
              <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                {totalSeatsAcrossJourney} {totalSeatsAcrossJourney === 1 ? 'seat available' : 'total seats available'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
              {connectedItinerary.totalCoveredKm > 0 && (
                <span className="px-2 py-0.5 rounded-md font-semibold bg-white text-slate-700 border border-slate-200">
                  {connectedItinerary.totalCoveredKm} km confirmed
                  {connectedItinerary.coveragePercent > 0 && ` (${connectedItinerary.coveragePercent}%)`}
                </span>
              )}
              {connectedItinerary.totalSwitches > 0 && (
                <span className="px-2 py-0.5 rounded-md font-semibold bg-white text-slate-700 border border-slate-200">
                  {connectedItinerary.totalSwitches} seat {connectedItinerary.totalSwitches === 1 ? 'switch' : 'switches'}
                </span>
              )}
              {connectedItinerary.hasGaps && (
                <span className="px-2 py-0.5 rounded-md font-semibold bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>{gapCount} unreserved gap{gapCount > 1 ? 's' : ''}</span>
                  <span className="sr-only">Transit Stretch</span>
                </span>
              )}
            </div>
          </div>

          {/* Vertical Journey Route Timeline with Left Station Locator Nodes */}
          <div className="p-4 sm:p-5 bg-white">
            <div className="space-y-0">
              {journeyStages.map((stage, idx) => {
                const segKey = stage.item ? `seat-${idx}-${stage.item.from}-${stage.item.to}` : '';
                const seatList = stage.item
                  ? (stage.item.berths && stage.item.berths.length > 0)
                    ? stage.item.berths
                    : (stage.item.seat ? [stage.item.seat] : [])
                  : [];
                const chosenSeat = selectedSeats[segKey] || seatList[0];
                const currentPage = seatPages[segKey] || 1;
                const totalPages = Math.ceil(seatList.length / SEATS_PAGE_SIZE) || 1;
                const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

                return (
                  <div key={stage.id} className="flex items-stretch gap-3 sm:gap-4 group">
                    {/* Left Vertical Route Locator Column */}
                    <div className="w-12 sm:w-16 shrink-0 flex flex-col items-center">
                      {/* Station Node Circle matching the exact ribbon styling */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shrink-0 transition-all ${
                          stage.nodeType === 'START'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : stage.nodeType === 'END'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : stage.nodeType === 'GAP_START' || stage.nodeType === 'GAP_RESUME'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 shadow-2xs'
                        }`}
                      >
                        {stage.nodeType === 'START' ? (
                          <MapPin className="w-3 h-3 text-white" />
                        ) : stage.nodeType === 'END' ? (
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        ) : stage.nodeType === 'GAP_START' || stage.nodeType === 'GAP_RESUME' ? (
                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                        ) : (
                          <RefreshCw className="w-3 h-3 text-slate-600" />
                        )}
                      </div>

                      {/* Station Code */}
                      <span className="text-[11px] font-mono font-bold text-slate-900 mt-1 leading-none text-center">
                        {stage.stationCode}
                      </span>

                      {/* Station Sub-label */}
                      <span className="text-[9px] font-semibold text-slate-500 mt-0.5 leading-tight text-center capitalize">
                        {stage.stationLabel}
                      </span>

                      {/* Continuous connecting track line down to next node */}
                      {idx < journeyStages.length - 1 && (
                        <div
                          className={`w-0.5 flex-1 my-1.5 min-h-[36px] ${
                            stage.isGapTrack
                              ? 'border-l-2 border-dashed border-amber-400'
                              : 'bg-slate-200'
                          }`}
                        />
                      )}
                    </div>

                    {/* Right Content Column */}
                    <div className="flex-1 min-w-0 pb-5">
                      {stage.type === 'SEAT' && (
                        <div className="space-y-2.5">
                          {/* Switch Notice if seat changes on same train */}
                          {stage.hasSwitchNotice && (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                              <RefreshCw className="w-3 h-3 text-blue-600 shrink-0" />
                              <span>Switch seat at <strong>{stage.stationCode}</strong> · Same train</span>
                            </div>
                          )}

                          {/* Section Header: Route, Distance & Available Seats */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-900 font-mono">
                                <span>{stage.item.from}</span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                <span>{stage.item.to}</span>
                              </div>
                              {stage.item.distanceKm > 0 && (
                                <span className="text-[11px] text-slate-400 font-medium">
                                  ({stage.item.distanceKm} km)
                                </span>
                              )}
                            </div>

                            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                              {`${seatList.length} ${seatList.length === 1 ? 'seat' : 'seats'}`}
                            </span>
                          </div>

                          {/* Contained Seat Chips with 8-item pagination & in-box scroll */}
                          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 sm:p-3 space-y-2">
                            <div className="max-h-[160px] overflow-y-auto scrollbar-thin pr-0.5">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2">
                                {seatList.map((b, bIdx) => {
                                  const pageOfThisSeat = Math.floor(bIdx / SEATS_PAGE_SIZE) + 1;
                                  const isVisibleOnCurrentPage = pageOfThisSeat === safeCurrentPage;
                                  const meta = resolveBerthMeta(b);
                                  const isSelected = chosenSeat?.coach === b.coach && chosenSeat?.berthNumber === b.berthNumber;

                                  return (
                                    <button
                                      type="button"
                                      key={`${b.coach}-${b.berthNumber}-${bIdx}`}
                                      onClick={() => handleSelectSeat(segKey, b)}
                                      title={`Seat ${b.coach}-${b.berthNumber} (${meta.label})`}
                                      style={{ display: isVisibleOnCurrentPage ? undefined : 'none' }}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-between border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400 hover:bg-slate-50'
                                      }`}
                                    >
                                      <span>{`${b.coach}-${b.berthNumber}`}</span>
                                      <span
                                        className={`text-[9px] font-sans font-bold px-1.5 py-0.2 rounded border ${
                                          isSelected
                                            ? 'bg-slate-800 text-slate-200 border-slate-700'
                                            : meta.badgeClass
                                        }`}
                                      >
                                        {meta.short}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* In-Container Pagination Controls if > 8 seats */}
                            {seatList.length > SEATS_PAGE_SIZE && (
                              <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Showing <strong className="text-slate-800">{(safeCurrentPage - 1) * SEATS_PAGE_SIZE + 1}–{Math.min(safeCurrentPage * SEATS_PAGE_SIZE, seatList.length)}</strong> of <strong className="text-slate-800">{seatList.length}</strong> seats
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    disabled={safeCurrentPage === 1}
                                    onClick={() => setSeatPages((prev) => ({ ...prev, [segKey]: safeCurrentPage - 1 }))}
                                    className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-300 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                  >
                                    Prev
                                  </button>
                                  <span className="text-[11px] font-mono text-slate-600 px-1 font-semibold">
                                    {safeCurrentPage} / {totalPages}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={safeCurrentPage >= totalPages}
                                    onClick={() => setSeatPages((prev) => ({ ...prev, [segKey]: safeCurrentPage + 1 }))}
                                    className="px-2 py-0.5 rounded text-[11px] font-bold border border-slate-300 bg-white text-slate-700 hover:text-slate-950 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                  >
                                    Next
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {stage.type === 'GAP' && (
                        <div className="space-y-2">
                          {/* Gap Header */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                                No Reserved Seat: {stage.item.from} ➔ {stage.item.to}
                              </span>
                              {stage.item.distanceKm > 0 && (
                                <span className="text-[11px] text-slate-500 font-medium">
                                  ({stage.item.distanceKm} km)
                                </span>
                              )}
                              <span className="sr-only">Transit Stretch</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                              Unreserved Stretch
                            </span>
                          </div>

                          {/* Open Advice Section - Not trapped inside an artificial container */}
                          <div className="text-xs text-slate-700 leading-relaxed flex items-start gap-2.5 py-1">
                            <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Info className="w-3.5 h-3.5" />
                            </div>
                            <p className="font-medium text-slate-700 leading-relaxed flex-1">
                              {stage.item.tip}
                            </p>
                          </div>

                          {/* Reassurance Note */}
                          <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 pt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>Reserved seat resumes from <strong className="text-slate-900">{stage.item.to}</strong></span>
                          </div>
                        </div>
                      )}

                      {stage.type === 'DESTINATION' && (
                        <div className="pt-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
                              {stage.stationCode}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Journey Complete
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                            Arrival at final destination station.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: ALL BERTHS GROUPED BY STATION */}
      {activeView === 'ALL_STATIONS' && (
        <div className="space-y-2.5">
          {segmentGroups.map((grp) => {
            const isExpanded = Boolean(expandedSegments[grp.key]);
            const hasOverflow = grp.berths.length > DEFAULT_VISIBLE_PER_ROW;
            const visibleBerths = isExpanded || !hasOverflow
              ? grp.berths
              : grp.berths.slice(0, DEFAULT_VISIBLE_PER_ROW);

            return (
              <div
                key={grp.key}
                className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                  grp.isBoardingSegment
                    ? 'bg-blue-50/20 border-2 border-blue-400'
                    : 'bg-white border border-slate-300 hover:border-slate-400'
                }`}
              >
                {/* Segment Header */}
                <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-1.5 sm:gap-2 pb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                    <div className="flex items-center gap-1.5 font-extrabold text-xs sm:text-sm text-slate-900 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>{grp.from}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[170px] sm:max-w-none">
                        {grp.toName !== grp.to ? `${grp.toName} (${grp.to})` : grp.to}
                      </span>
                    </div>

                    {grp.isBoardingSegment && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-400 inline-flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Boarding</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] self-start xs:self-auto shrink-0">
                    {grp.distanceKm > 0 && (
                      <span className="text-slate-500 font-medium">
                        {grp.distanceKm} km
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md font-bold bg-slate-100 text-slate-700 border border-slate-300 text-[10px]">
                      {grp.berths.length} {grp.berths.length === 1 ? 'seat' : 'seats'}
                    </span>
                  </div>
                </div>

                {/* Seats Grid with Clean Scrollable Container when Expanded */}
                <div className="pt-2.5">
                  <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2 ${isExpanded ? 'max-h-[180px] overflow-y-auto pr-1 scrollbar-thin' : ''}`}>
                    {visibleBerths.map((b, bIdx) => {
                      const typeKey = (b.berthType || b.berthCode || '').toUpperCase();
                      const cfg = BERTH_TYPE_CONFIG[typeKey] || {
                        label: b.berthType || 'Berth',
                        short: b.berthCode || 'B',
                        badgeClass: 'bg-slate-50 text-slate-700 border-slate-300',
                      };

                      return (
                        <div
                          key={`${b.coach}-${b.berthNumber}-${bIdx}`}
                          className="px-2 py-1.5 rounded-lg border border-slate-300 bg-white hover:border-slate-400 transition-colors flex items-center justify-between gap-1 min-w-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs font-bold text-slate-900 leading-tight">
                              {b.coach}-{b.berthNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                              {cfg.label}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${cfg.badgeClass}`}>
                              {cfg.short}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More / Show Less Toggle inline */}
                  {hasOverflow && (
                    <button
                      type="button"
                      onClick={() => handleToggleSegment(grp.key)}
                      className="mt-2 py-1 px-2.5 rounded text-[11px] font-bold text-[#1e3a8a] hover:bg-blue-50 transition-colors cursor-pointer flex items-center gap-1 border border-blue-300"
                    >
                      <span>
                        {isExpanded
                          ? 'Show Top 5 Only'
                          : `+ View all ${grp.berths.length} seats (${grp.berths.length - DEFAULT_VISIBLE_PER_ROW} more)`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
