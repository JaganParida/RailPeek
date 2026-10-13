import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, ShieldCheck, Train, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VacantBerthsGrid } from '@/components/results/VacantBerthsGrid';
import { fetchBrowserTrainComposition, fetchBrowserVacantBerths } from '@/services/clientIrctc';
import { mapIrctcVacantBerths } from '@/services/clientCoachLayout';

export function TrainAccordionCard({
  train,
  isOpen = false,
  onToggle,
  _onInspect,
  fromStation,
  toStation,
  selectedClass,
  onSelectClass,
}) {
  const [liveBrowserComp, setLiveBrowserComp] = useState(null);
  const [liveBrowserBerths, setLiveBrowserBerths] = useState([]);

  const trainNumber = train?.trainNumber;
  const isDeparted = Boolean(
    train?.isDeparted ||
    train?.chartStatus === 'DEPARTED' ||
    (train?.chartLabel && train.chartLabel.toLowerCase().includes('departed'))
  );
  const chartOneDate = train?.chartOneDate;
  const journeyDate = train?.journeyDate;

  useEffect(() => {
    let isMounted = true;
    if (train && !chartOneDate && !isDeparted && trainNumber && fromStation) {
      const jDate = journeyDate || new Date().toISOString().split('T')[0];
      fetchBrowserTrainComposition(trainNumber, jDate, fromStation)
        .then((comp) => {
          if (isMounted && comp && comp.success) {
            setLiveBrowserComp(comp);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [train, trainNumber, fromStation, chartOneDate, isDeparted, journeyDate]);

  if (!train) return null;

  const {
    trainName,
    departureTime = '--:--',
    arrivalTime = '--:--',
    durationFormatted,
    distanceKm,
    allocatedBerths = [],
    availableBerths = [],
    coverageStatus,
    _availableFrom,
    _availableTo,
    isChartPrepared,
    _chartLabel,
    _chartDescription,
    isBestMatch = false,
  } = train;

  const effectiveChartOneDate = train.chartOneDate || liveBrowserComp?.chartOneDate;
  const effectiveChartTwoDate = train.chartTwoDate || liveBrowserComp?.chartTwoDate;
  const effectiveAvlRemote = train.avlRemoteForBooking || liveBrowserComp?.avlRemoteForBooking;

  const isChartActuallyPrepared = Boolean(
    isChartPrepared ||
    train.chartTimings?.isFirstChartDone ||
    train.chartStatus === 'CHART_PREPARED' ||
    train.chartStatus === 'FINAL_CHART' ||
    effectiveChartOneDate
  );

  const isTTEOnly = Boolean(
    train.bookingChannel === 'TTE_ONLY' ||
    (train.chartTimings?.isSecondChartDone && !train.chartTimings?.canBookOnline && !isDeparted)
  );

  const currentClass = train.travelClass || selectedClass || '3A';

  // Live browser IRCTC vacant berths fetcher when server reports 0 berths
  useEffect(() => {
    let isMounted = true;
    const initialCount = (availableBerths?.length || 0) + (allocatedBerths?.length || 0);
    if ((isOpen || isChartActuallyPrepared) && initialCount === 0 && !isDeparted && trainNumber && fromStation) {
      const jDate = journeyDate || new Date().toISOString().split('T')[0];
      fetchBrowserVacantBerths({
        trainNo: trainNumber,
        jDate,
        boardingStation: fromStation,
        cls: currentClass,
      })
        .then((vbList) => {
          if (isMounted && Array.isArray(vbList) && vbList.length > 0) {
            const mapped = mapIrctcVacantBerths(vbList, fromStation, toStation);
            setLiveBrowserBerths(mapped);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, isChartActuallyPrepared, availableBerths, allocatedBerths, isDeparted, trainNumber, fromStation, toStation, journeyDate, currentClass]);

  const serverBerths = availableBerths?.length > 0 ? availableBerths : allocatedBerths;
  const rawBerths = serverBerths?.length > 0 ? serverBerths : liveBrowserBerths;
  const fullJourneyCount = rawBerths.filter(
    (b) => b.status === 'FULL_JOURNEY' || b.coveragePercent === 100
  ).length;

  const partialSegmentCount = rawBerths.filter(
    (b) => b.status === 'PARTIAL_JOURNEY' || (b.coveragePercent > 0 && b.coveragePercent < 100)
  ).length;

  const totalVacantCount = fullJourneyCount > 0 ? fullJourneyCount : partialSegmentCount;
  const hasVacancies = totalVacantCount > 0 && !isDeparted && !isTTEOnly;
  const _isFullJourney = coverageStatus === 'FULL_JOURNEY' || fullJourneyCount > 0;
  const trainClasses = train.classes || [];
  const trainOffersSearchedClass = trainClasses.length === 0 || !selectedClass || trainClasses.includes(selectedClass);

  const availableAltClasses = (train.classSummaries || [])
    .filter((c) => c.travelClass !== currentClass && c.availableBerthsCount > 0)
    .sort((a, b) => b.availableBerthsCount - a.availableBerthsCount);

  // Accurate origin & destination handling (e.g. NZM/ANVT vs NDLS)
  const trainOrigin = train.fromStation || train.origin || fromStation;
  const trainDest = train.toStation || train.destination || toStation;
  const isDifferentOrigin = Boolean(trainOrigin && fromStation && trainOrigin !== fromStation);
  const isDifferentDest = Boolean(trainDest && toStation && trainDest !== toStation);

  const isFinalChartDone = Boolean(
    train.chartTimings?.isSecondChartDone ||
    isDeparted ||
    train.chartStatus === 'FINAL_CHART'
  );

  const formatTimeOnly = (dtStr) => {
    if (!dtStr) return '';
    if (dtStr.includes(' ')) {
      return dtStr.split(' ')[1].slice(0, 5);
    }
    return dtStr.slice(0, 5);
  };

  let firstChartText = train.chartTimings?.firstChartDisplay || (
    effectiveChartOneDate
      ? `Prepared at ${formatTimeOnly(effectiveChartOneDate)}`
      : (isDeparted ? 'Prepared' : 'Scheduled')
  );

  let finalChartText = train.chartTimings?.finalChartDisplay || (
    isFinalChartDone && effectiveChartTwoDate
      ? `Finalized at ${formatTimeOnly(effectiveChartTwoDate)}`
      : (isDeparted ? 'Finalized' : '~30m before dep')
  );

  // If train has departed, charts must never say "Scheduled"
  if (isDeparted) {
    if (firstChartText.startsWith('Scheduled')) {
      firstChartText = firstChartText.replace('Scheduled', 'Prepared');
    }
    if (finalChartText.startsWith('Scheduled')) {
      finalChartText = finalChartText.replace('Scheduled', 'Finalized');
    }
  }

  return (
    <Card
      className={`overflow-hidden transition-all rounded-xl ${
        isBestMatch
          ? 'border-2 border-blue-600 bg-white ring-1 ring-blue-600/20'
          : isOpen && hasVacancies
          ? 'border-2 border-[#1e3a8a] bg-white'
          : 'border border-slate-300 bg-white hover:border-slate-400'
      }`}
    >
      {/* Accordion Header Bar */}
      <div
        onClick={hasVacancies ? onToggle : undefined}
        className={`p-3 sm:p-4 flex flex-col gap-2.5 select-none transition-colors ${
          hasVacancies ? 'cursor-pointer' : 'cursor-default'
        } ${
          isOpen && hasVacancies ? 'bg-slate-50/70' : 'bg-white hover:bg-slate-50/70'
        }`}
      >
        {/* Top Row: Train Identity + Badges Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 min-w-0">
          {/* Train Identity: Icon + Number + Name */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e3a8a] shrink-0">
              <Train className="w-4 h-4" />
            </div>
            <span className="font-mono text-base font-black text-[#1e3a8a] tracking-tight shrink-0">
              {trainNumber}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {trainName}
            </h3>
            {isDifferentOrigin && (
              <span
                className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 shrink-0 inline-flex items-center gap-1"
                title={`Departs from ${train.fromStationName || trainOrigin} (${trainOrigin}), not ${fromStation}`}
              >
                Board at {trainOrigin}
              </span>
            )}
          </div>

          {/* All 3 Badges Grouped in One Single Line on Mobile */}
          <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto flex-nowrap overflow-x-auto scrollbar-none py-0.5">
            {/* 1. Travel Class Badge */}
            <span
              className={`text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 whitespace-nowrap ${
                !trainOffersSearchedClass && selectedClass
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-100 text-slate-700 border border-slate-300'
              }`}
              title={!trainOffersSearchedClass ? `Train coaches: ${trainClasses.join(', ')}` : undefined}
            >
              {!trainOffersSearchedClass && trainClasses.length > 0 ? trainClasses.join('/') : currentClass}
            </span>

            {/* 2. Best Route Badge */}
            {isBestMatch && (
              <span className="text-[10px] sm:text-xs font-extrabold px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-100 text-blue-900 border border-blue-200 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                <ShieldCheck className="w-3 h-3 text-blue-700 shrink-0" />
                <span className="sm:inline hidden">Best Route</span>
                <span className="sm:hidden">Best</span>
              </span>
            )}

            {/* 3. Vacancy / Operational Status Badge */}
            {isDeparted ? (
              <span className="text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-slate-100 text-slate-600 border border-slate-300 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                <span>Departed</span>
              </span>
            ) : isTTEOnly ? (
              <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-amber-50 text-amber-900 border border-amber-300 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                <span className="sm:hidden">TTE Only</span>
                <span className="hidden sm:inline">Final Chart Done • TTE Only</span>
              </span>
            ) : hasVacancies ? (
              <span className="text-[10px] sm:text-xs font-bold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md border inline-flex items-center gap-1 sm:gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-400 shrink-0 whitespace-nowrap">
                <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600 shrink-0" />
                <span className="sm:inline hidden">
                  {fullJourneyCount > 0
                    ? `${fullJourneyCount} Direct ${fullJourneyCount === 1 ? 'Berth' : 'Berths'} Available`
                    : `${partialSegmentCount} Partial ${partialSegmentCount === 1 ? 'Berth' : 'Berths'}`}
                </span>
                <span className="sm:hidden">
                  {fullJourneyCount > 0 ? `${fullJourneyCount} Direct` : `${partialSegmentCount} Partial`}
                </span>
              </span>
            ) : availableAltClasses.length > 0 ? (
              <div className="flex items-center gap-1 sm:gap-1.5 flex-nowrap shrink-0 overflow-x-auto scrollbar-none">
                <span className="text-[10.5px] sm:text-xs font-semibold px-2 py-0.5 sm:py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 shrink-0 whitespace-nowrap">
                  {!trainOffersSearchedClass ? `No ${selectedClass}` : `0 in ${currentClass}`}
                </span>
                {availableAltClasses.slice(0, 2).map((alt) => (
                  <button
                    key={alt.travelClass}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClass?.(alt.travelClass);
                    }}
                    className="text-[10.5px] sm:text-xs font-bold px-2 py-0.5 sm:py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
                    title={`Click to switch to ${alt.travelClass}`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{alt.availableBerthsCount} in {alt.travelClass}</span>
                  </button>
                ))}
              </div>
            ) : isChartActuallyPrepared ? (
              <span className="text-[10.5px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300 shrink-0 whitespace-nowrap">
                Chart Prepared • 0 Vacant
              </span>
            ) : (
              <span className="text-[10.5px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-300 shrink-0 whitespace-nowrap">
                Chart Opens 4h Before Dep
              </span>
            )}
          </div>
        </div>

        {/* Middle Row: Schedule Visualizer + View Berths Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-0.5">
          {/* Visual Schedule Block */}
          <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="text-left min-w-[50px]">
              <div className="text-base font-extrabold text-slate-900 font-mono leading-tight">
                {departureTime}
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider truncate max-w-[85px]">
                  {trainOrigin}
                </span>
                {isDifferentOrigin && (
                  <span
                    className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300"
                    title={`Train departs from ${train.fromStationName || trainOrigin}, not ${fromStation}`}
                  >
                    Nearby
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center px-1">
              <span className="text-[10px] text-slate-500 font-semibold whitespace-nowrap">
                {durationFormatted || 'Route'}
              </span>
              <div className="w-12 h-0.5 bg-slate-300 relative my-0.5">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-slate-400 rotate-45" />
              </div>
              {distanceKm && (
                <span className="text-[9px] text-slate-400 font-medium">
                  {distanceKm} km
                </span>
              )}
            </div>

            <div className="text-right min-w-[50px]">
              <div className="text-base font-extrabold text-slate-900 font-mono leading-tight">
                {arrivalTime}
              </div>
              <div className="flex items-center justify-end gap-1">
                {isDifferentDest && (
                  <span
                    className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300"
                    title={`Train arrives at ${train.toStationName || trainDest}, not ${toStation}`}
                  >
                    Nearby
                  </span>
                )}
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider truncate max-w-[85px]">
                  {trainDest}
                </span>
              </div>
            </div>
          </div>

          {/* View Berths Toggle Button */}
          {hasVacancies ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              rightIcon={isOpen ? ChevronUp : ChevronDown}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`whitespace-nowrap font-bold text-xs h-9 px-3.5 rounded-lg shrink-0 ${
                isOpen
                  ? 'bg-[#1e3a8a] text-white border-[#1e3a8a] hover:bg-[#172554]'
                  : 'bg-blue-50 text-[#1e3a8a] border-blue-300 hover:bg-blue-100 hover:border-blue-400'
              }`}
            >
              {isOpen ? 'Hide Berths' : `View Berths (${totalVacantCount})`}
            </Button>
          ) : isTTEOnly && totalVacantCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              rightIcon={isOpen ? ChevronUp : ChevronDown}
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className={`whitespace-nowrap font-bold text-xs h-9 px-3.5 rounded-lg shrink-0 ${
                isOpen
                  ? 'bg-amber-800 text-white border-amber-800 hover:bg-amber-900'
                  : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 hover:border-amber-400'
              }`}
            >
              {isOpen ? 'Hide TTE Berths' : `TTE Berths (${totalVacantCount})`}
            </Button>
          ) : null}
        </div>

        {/* Tier 2: Dedicated Sleek Chart & Booking Status Bar */}
        <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-700 font-semibold">
              1st Chart: {firstChartText}
            </span>
            <span className="text-slate-300">•</span>
            <span className={isFinalChartDone ? (isDeparted ? 'text-slate-600 font-semibold' : 'text-emerald-700 font-extrabold') : 'text-slate-500 font-medium'}>
              Final Chart: {finalChartText}
            </span>
          </div>

          <div className="flex items-center gap-1.5 font-bold">
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
              isDeparted || train.bookingChannel === 'DEPARTED'
                ? 'text-slate-600'
                : isTTEOnly || train.bookingChannel === 'TTE_ONLY'
                ? 'text-amber-800'
                : train.bookingChannel === 'IRCTC_ADVANCE_BOOKING'
                ? 'text-blue-800'
                : 'text-emerald-700'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                isDeparted || train.bookingChannel === 'DEPARTED'
                  ? 'bg-slate-400'
                  : isTTEOnly || train.bookingChannel === 'TTE_ONLY'
                  ? 'bg-amber-500'
                  : train.bookingChannel === 'IRCTC_ADVANCE_BOOKING'
                  ? 'bg-blue-500'
                  : 'bg-emerald-500'
              }`} />
              <span>
                {isDeparted || train.bookingChannel === 'DEPARTED'
                  ? 'Train Departed • Booking Closed'
                  : isTTEOnly
                  ? 'TTE On-Board Allocation Only'
                  : train.bookingChannelLabel || 'Current Booking Open on IRCTC'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Accordion Expanded Content */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen && (hasVacancies || (isTTEOnly && totalVacantCount > 0))
            ? 'grid-rows-[1fr] opacity-100'
            : 'grid-rows-[0fr] opacity-0 pointer-events-none'
        }`}
      >
        <div className="overflow-hidden">
          <div className="p-2 sm:p-4 border-t border-slate-200 bg-white">
            {isTTEOnly && totalVacantCount > 0 && (
              <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>IRCTC Online Booking Closed:</strong> Final chart is finalized. These {totalVacantCount} vacant berths are available on-board directly from the Train Ticket Examiner (TTE).
                </span>
              </div>
            )}
            <VacantBerthsGrid
              berths={rawBerths}
              allocatedBerths={[]}
              fromStation={fromStation || trainOrigin}
              toStation={trainDest || toStation}
              trainNumber={trainNumber}
              totalDistanceKm={distanceKm || train.distanceKm || 0}
              bookingChannel={train.bookingChannel}
              isDeparted={isDeparted}
              chartTimings={train.chartTimings}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
