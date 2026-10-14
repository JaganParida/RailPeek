import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Train,
  ArrowUpDown,
  LayoutGrid,
  Clock,
  ChevronDown,
  ChevronUp,
  Calendar,
  Info,
  Loader2,
  Search,
  Compass,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { TrainAccordionCard } from '@/components/results/TrainAccordionCard';
import { CrossTrainMatrix } from '@/components/results/CrossTrainMatrix';
import { AlternativeDateBanner } from '@/components/results/AlternativeDateBanner';
import { SuggestedAlternativeBanner } from '@/components/results/SuggestedAlternativeBanner';
import { BerthInspectDialog } from '@/components/ui/BerthInspectDialog';
import { getTrainOperationalStatus } from '@/utils/operationalClock';

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const date = searchParams.get('date') || '';
  const passengers = Number(searchParams.get('passengers')) || 1;
  const travelClass = searchParams.get('class') || 'SL';
  const preference = searchParams.get('preference') || 'ANY';
  const sameCoach = searchParams.get('sameCoach') !== 'false';
  const sameBay = searchParams.get('sameBay') === 'true';
  const trainParam = searchParams.get('train') || '';

  // Active Train for filtering (when user selects a specific train)
  const [activeTrain, setActiveTrain] = useState(trainParam);

  // In-page interactive filters and sorting
  const [selectedClass, setSelectedClass] = useState(travelClass);
  const [isClassChanging, setIsClassChanging] = useState(false);
  const [loadingClass, setLoadingClass] = useState(null);
  const [sortBy, setSortBy] = useState('BEST_MATCH');
  const [fullJourneyOnly, setFullJourneyOnly] = useState(false);
  const [showMatrix, setShowMatrix] = useState(false);
  const [inspectOption, setInspectOption] = useState(null);
  const [showDepartedList, setShowDepartedList] = useState(false);

  const nextDayDate = useMemo(() => {
    if (!date) return '';
    try {
      const d = new Date(date + 'T00:00:00');
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    } catch (_e) {
      return '';
    }
  }, [date]);

  useEffect(() => {
    if (trainParam) {
      setActiveTrain(trainParam);
    }
  }, [trainParam]);

  // Query 1: Find Berths on Route
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      'find-berths',
      from,
      to,
      date,
      activeTrain,
      passengers,
      selectedClass,
      preference,
      sameCoach,
      sameBay,
      sortBy,
    ],
    queryFn: async () => {
      const url = new URL('/api/v1/journey/find-berths', window.location.origin);
      url.searchParams.set('from', from);
      url.searchParams.set('to', to);
      url.searchParams.set('date', date);
      if (activeTrain) url.searchParams.set('train', activeTrain);
      url.searchParams.set('passengers', String(passengers));
      url.searchParams.set('class', selectedClass);
      url.searchParams.set('preference', preference);
      url.searchParams.set('sameCoach', String(sameCoach));
      url.searchParams.set('sameBay', String(sameBay));
      url.searchParams.set('sortBy', sortBy);
      url.searchParams.set('crossClass', 'true');
      url.searchParams.set('checkNextDay', 'true');

      const res = await fetch(url);
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `Failed to discover berths (${res.status})`);
      }
      return res.json();
    },
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const journeyData = data?.data;
  const _metaData = data?.meta;
  const bestMatch = journeyData?.bestMatch;
  const rawAlternatives = journeyData?.alternatives || [];
  const rawPartialOptions = journeyData?.partialOptions || [];
  const crossTrains = useMemo(() => journeyData?.crossTrainComparison || [], [journeyData?.crossTrainComparison]);
  const alternativeDate = journeyData?.alternativeDateOption;
  const suggestedAlternativeOnRoute = journeyData?.suggestedAlternativeOnRoute;
  const requestedTrainNotice = journeyData?.requestedTrainNotice;

  // DEDUPLICATION: Ensure each train is displayed EXACTLY ONCE on the results page
  const seenTrainNumbers = new Set();
  if (bestMatch?.trainNumber) {
    seenTrainNumbers.add(bestMatch.trainNumber);
  }

  let alternatives = rawAlternatives.filter((opt) => {
    if (!opt.trainNumber || seenTrainNumbers.has(opt.trainNumber)) return false;
    seenTrainNumbers.add(opt.trainNumber);
    return true;
  });

  let partialOptions = rawPartialOptions.filter((opt) => {
    if (!opt.trainNumber || seenTrainNumbers.has(opt.trainNumber)) return false;
    seenTrainNumbers.add(opt.trainNumber);
    return true;
  });

  let effectiveBestMatch = bestMatch;
  const _hasAnyResults = Boolean(effectiveBestMatch || alternatives.length > 0 || partialOptions.length > 0);

  // Helper to verify if train has 100% continuous direct berths
  const trainHasDirectBerths = (t) => {
    if (!t) return false;
    if (t.coverageStatus === 'FULL_JOURNEY') return true;
    const raw = t.availableBerths?.length > 0 ? t.availableBerths : (t.allocatedBerths || []);
    return raw.some((b) => b.status === 'FULL_JOURNEY' || b.coveragePercent === 100);
  };

  // UNIFIED TRAINS LIST FOR ACCORDION DISPLAY
  const allDisplayTrains = useMemo(() => {
    const list = [];
    const seen = new Set();

    // 1. Put effectiveBestMatch first if available
    if (effectiveBestMatch?.trainNumber) {
      list.push({
        ...effectiveBestMatch,
        isBestMatch: true,
        travelClass: effectiveBestMatch.travelClass || selectedClass,
        fromStation: effectiveBestMatch.fromStation || from,
        toStation: effectiveBestMatch.toStation || effectiveBestMatch.destination || to,
        destination: effectiveBestMatch.destination || effectiveBestMatch.toStation,
        availableBerths: effectiveBestMatch.availableBerths || [],
        totalVacantCount: effectiveBestMatch.availableBerths?.length || (effectiveBestMatch.allocatedBerths?.length || 0),
      });
      seen.add(effectiveBestMatch.trainNumber);
    }

    // 2. Add alternatives
    for (const alt of alternatives) {
      if (alt.trainNumber && !seen.has(alt.trainNumber)) {
        list.push({
          ...alt,
          travelClass: alt.travelClass || selectedClass,
          fromStation: alt.fromStation || from,
          toStation: alt.toStation || alt.destination || to,
          destination: alt.destination || alt.toStation,
          availableBerths: alt.availableBerths || [],
          totalVacantCount: alt.availableBerths?.length || (alt.allocatedBerths?.length || 0),
        });
        seen.add(alt.trainNumber);
      }
    }

    // 3. Add partialOptions
    for (const part of partialOptions) {
      if (part.trainNumber && !seen.has(part.trainNumber)) {
        list.push({
          ...part,
          travelClass: part.travelClass || selectedClass,
          fromStation: part.fromStation || from,
          toStation: part.toStation || part.destination || to,
          destination: part.destination || part.toStation,
          availableBerths: part.availableBerths || [],
          totalVacantCount: part.availableBerths?.length || (part.allocatedBerths?.length || 0),
        });
        seen.add(part.trainNumber);
      }
    }

    // 4. Add other operating trains from crossTrains
    for (const ct of crossTrains) {
      if (ct.trainNumber && !seen.has(ct.trainNumber)) {
        list.push({
          ...ct,
          travelClass: ct.travelClass || selectedClass,
          fromStation: ct.fromStation || from,
          toStation: ct.toStation || ct.destination || to,
          destination: ct.destination || ct.toStation,
          availableBerths: ct.availableBerths || [],
          totalVacantCount: ct.totalVacantCount || (ct.availableBerths?.length || 0),
        });
        seen.add(ct.trainNumber);
      }
    }

    if (sortBy === 'DEPARTURE') {
      list.sort((a, b) => (a.departureTime || '99:99').localeCompare(b.departureTime || '99:99'));
    } else if (sortBy === 'DURATION') {
      list.sort((a, b) => (a.durationMinutes || 9999) - (b.durationMinutes || 9999));
    } else if (sortBy === 'COVERAGE') {
      list.sort((a, b) => (b.totalVacantCount || 0) - (a.totalVacantCount || 0));
    }

    return list;
  }, [effectiveBestMatch, alternatives, partialOptions, crossTrains, selectedClass, from, to, sortBy]);

  const searchedTrainName = useMemo(() => {
    if (!activeTrain) return '';
    if (effectiveBestMatch?.trainNumber === activeTrain && effectiveBestMatch?.trainName) {
      return effectiveBestMatch.trainName;
    }
    const found = allDisplayTrains.find((t) => (t.trainNumber || t.number) === activeTrain);
    if (found?.trainName || found?.name) return found.trainName || found.name;
    if (requestedTrainNotice?.trainName) return requestedTrainNotice.trainName;
    return '';
  }, [activeTrain, effectiveBestMatch, allDisplayTrains, requestedTrainNotice]);

  const displayTrainsBeforeFilter = allDisplayTrains;

  // Check if ANY operating upcoming train on this route has direct continuous berths
  const hasAnyDirectTrains = useMemo(() => {
    return displayTrainsBeforeFilter.some((t) => {
      const op = getTrainOperationalStatus(date, t.departureTime, t);
      return !op.isDeparted && trainHasDirectBerths(t);
    });
  }, [displayTrainsBeforeFilter, date]);

  // Automatically reset fullJourneyOnly if route has no direct continuous trains
  useEffect(() => {
    if (!hasAnyDirectTrains && fullJourneyOnly) {
      setFullJourneyOnly(false);
    }
  }, [hasAnyDirectTrains, fullJourneyOnly]);

  // If fullJourneyOnly is enabled, filter to only trains with direct continuous berths
  const displayTrains = useMemo(() => {
    if (!fullJourneyOnly) return displayTrainsBeforeFilter;
    return displayTrainsBeforeFilter.filter((t) => trainHasDirectBerths(t));
  }, [displayTrainsBeforeFilter, fullJourneyOnly]);

  const upcomingTrains = useMemo(
    () => displayTrains.filter((t) => {
      const op = getTrainOperationalStatus(date, t.departureTime, t);
      return !op.isDeparted;
    }),
    [displayTrains, date]
  );

  const departedTrains = useMemo(
    () => displayTrains.filter((t) => {
      const op = getTrainOperationalStatus(date, t.departureTime, t);
      return op.isDeparted;
    }),
    [displayTrains, date]
  );

  // If no upcoming trains remain today, auto-show departed trains list so user sees train schedules
  useEffect(() => {
    if (upcomingTrains.length === 0 && departedTrains.length > 0) {
      setShowDepartedList(true);
    }
  }, [upcomingTrains.length, departedTrains.length]);

  const [expandedTrainNo, setExpandedTrainNo] = useState(trainParam || null);
  const [userHasManuallyToggled, setUserHasManuallyToggled] = useState(false);

  // Sync default open train: only on initial mount or train change before manual user toggle
  useEffect(() => {
    if (userHasManuallyToggled) return;

    if (activeTrain) {
      setExpandedTrainNo(activeTrain);
    } else if (upcomingTrains.length > 0 && expandedTrainNo === null) {
      const firstWithVacancies = upcomingTrains.find(
        (t) => (t.totalVacantCount > 0 || (t.availableBerths && t.availableBerths.length > 0))
      );
      if (firstWithVacancies) {
        setExpandedTrainNo(firstWithVacancies.trainNumber);
      }
    }
  }, [upcomingTrains, activeTrain, userHasManuallyToggled, expandedTrainNo]);

  const handleToggleTrain = (tNum) => {
    setUserHasManuallyToggled(true);
    setExpandedTrainNo((prev) => (prev === tNum ? null : tNum));
  };

  // Active train currently open/viewed that has vacant berths
  const activeViewingTrain = useMemo(() => {
    if (!expandedTrainNo) return null;
    const train =
      upcomingTrains.find((t) => t.trainNumber === expandedTrainNo) ||
      displayTrains.find((t) => t.trainNumber === expandedTrainNo) ||
      allDisplayTrains.find((t) => t.trainNumber === expandedTrainNo);
    if (train && (train.totalVacantCount > 0 || (train.availableBerths && train.availableBerths.length > 0))) {
      return train;
    }
    return null;
  }, [expandedTrainNo, upcomingTrains, displayTrains, allDisplayTrains]);

  const handleSwitchDate = (newDate) => {
    const params = new URLSearchParams(searchParams);
    params.set('date', newDate);
    setSearchParams(params);
  };

  const isTabLoading = isClassChanging || isFetching || isLoading;
  const activeDisplayClass = loadingClass || selectedClass;

  // Calculate aggregate vacancies per class across all upcoming operating route trains
  const routeClassVacancyTotals = useMemo(() => {
    const totals = { SL: 0, '3A': 0, '2A': 0, '1A': 0, '2S': 0, CC: 0, '3E': 0 };
    const upcomingCrossTrains = crossTrains.filter((t) => {
      const op = getTrainOperationalStatus(date, t.departureTime, t);
      return !op.isDeparted && !op.isTTEOnly;
    });
    for (const t of upcomingCrossTrains) {
      if (Array.isArray(t.classSummaries)) {
        for (const cs of t.classSummaries) {
          if (cs.travelClass && typeof cs.availableBerthsCount === 'number') {
            totals[cs.travelClass] = (totals[cs.travelClass] || 0) + cs.availableBerthsCount;
          }
        }
      }
    }
    for (const ut of upcomingTrains) {
      if (ut.travelClass && ut.totalVacantCount > 0) {
        totals[ut.travelClass] = Math.max(totals[ut.travelClass] || 0, ut.totalVacantCount);
      }
    }
    return totals;
  }, [crossTrains, upcomingTrains]);

  const routeAvailableInOtherClasses = useMemo(() => {
    return Object.entries(routeClassVacancyTotals)
      .filter(([cls, count]) => cls !== activeDisplayClass && count > 0)
      .map(([travelClass, totalSeats]) => ({ travelClass, totalSeats }))
      .sort((a, b) => b.totalSeats - a.totalSeats);
  }, [routeClassVacancyTotals, activeDisplayClass]);

  const totalUpcomingVacantInSelectedClass = useMemo(() => {
    return upcomingTrains.reduce((sum, t) => sum + (t.totalVacantCount || 0), 0);
  }, [upcomingTrains]);

  const totalAltRouteSeats = useMemo(() => {
    return routeAvailableInOtherClasses.reduce((sum, c) => sum + c.totalSeats, 0);
  }, [routeAvailableInOtherClasses]);

  const handleSelectClass = async (newCls) => {
    if (newCls === selectedClass) return;
    setIsClassChanging(true);
    setLoadingClass(newCls);
    setSelectedClass(newCls);
    const params = new URLSearchParams(searchParams);
    params.set('class', newCls);
    setSearchParams(params, { replace: true });

    try {
      await queryClient.refetchQueries({
        queryKey: ['find-berths'],
        exact: false,
      });
    } catch (_err) {
      // ignore
    } finally {
      setTimeout(() => {
        setIsClassChanging(false);
        setLoadingClass(null);
      }, 400);
    }
  };

  const handleSelectTrainClass = (tNum, cls) => {
    if (cls && cls !== selectedClass) {
      handleSelectClass(cls);
    }
    if (tNum) handleSelectTrain(tNum);
  };

  const handleSelectTrain = (tNum) => {
    setActiveTrain(tNum);
    setUserHasManuallyToggled(false);
    setExpandedTrainNo(tNum || null);
    const params = new URLSearchParams(searchParams);
    if (tNum) {
      params.set('train', tNum);
    } else {
      params.delete('train');
    }
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const _activeTrainName =
    crossTrains.find((t) => t.trainNumber === activeTrain)?.trainName ||
    bestMatch?.trainName ||
    'Express';

  // Return to search while preserving all search parameters for auto-fill
  const handleReturnToSearch = () => {
    // Only pass a train filter if the user explicitly searched for a specific train
    const intendedTrain = trainParam && trainParam !== 'ALL' ? trainParam : 'ALL';

    try {
      sessionStorage.setItem(
        'railpeek_last_search',
        JSON.stringify({
          from,
          fromLabel: from,
          to,
          toLabel: to,
          date,
          class: selectedClass,
          train: intendedTrain,
        })
      );
    } catch (_e) {
      // Storage access unavailable or blocked
    }

    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (date) params.set('date', date);
    if (selectedClass) params.set('class', selectedClass);
    if (intendedTrain !== 'ALL') params.set('train', intendedTrain);

    navigate(`/?${params.toString()}`, {
      state: {
        from,
        fromLabel: from,
        to,
        toLabel: to,
        date,
        travelClass: selectedClass,
        train: intendedTrain,
      },
    });
  };

  useEffect(() => {
    if (from && to) {
      const intendedTrain = trainParam && trainParam !== 'ALL' ? trainParam : 'ALL';
      try {
        sessionStorage.setItem(
          'railpeek_last_search',
          JSON.stringify({
            from,
            fromLabel: from,
            to,
            toLabel: to,
            date,
            class: selectedClass,
            train: intendedTrain,
          })
        );
      } catch (_e) {
        // Storage access unavailable or blocked
      }
    }
  }, [from, to, date, selectedClass, trainParam]);

  if (!from || !to) {
    return (
      <div className="py-12 bg-[#f8fafc] min-h-screen flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl border border-slate-300 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mx-auto">
            <Train className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-900">
            Please Select Origin and Destination
          </h2>
          <p className="text-xs text-slate-600">
            Enter departure and destination stations to check real-time reservation charts and vacant berths.
          </p>
          <Button onClick={handleReturnToSearch} className="bg-[#1e3a8a] text-white text-xs font-bold">
            Go to Search
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 sm:py-8 bg-[#f8fafc] min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Modern, World-Class Compact Journey Header */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 sm:p-4">
          {/* Row 1: Back + Route + Compact Modify Button */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={handleReturnToSearch}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all cursor-pointer shrink-0 border border-slate-200"
                aria-label="Back to search"
                title="Return to search"
              >
                <ArrowLeft className="w-4 h-4 text-slate-700" />
              </button>

              {/* Station Route Display */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none truncate">
                  {from}
                </span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#1e3a8a] shrink-0" />
                <span className="text-base sm:text-xl font-black text-slate-900 tracking-tight leading-none truncate">
                  {to}
                </span>
              </div>
            </div>

            {/* Right: Compact Modify Search Button */}
            <button
              type="button"
              onClick={handleReturnToSearch}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
            >
              <Search className="w-3 h-3 text-slate-500" />
              <span className="hidden xs:inline">Modify</span>
              <span className="xs:hidden">Edit</span>
            </button>
          </div>

          {/* Row 2: Subtitle Metadata Strip (Single Row, Zero Clutter) */}
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-600 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="font-semibold text-slate-800 flex items-center gap-1 whitespace-nowrap">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{date || '--'}</span>
              </span>

              <span className="text-slate-300">•</span>

              <span className="font-semibold text-slate-700 flex items-center gap-1.5 whitespace-nowrap">
                <Train className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{activeTrain ? `Train ${activeTrain}` : 'All Trains'}</span>
                {activeTrain && searchedTrainName && (
                  <span className="hidden sm:inline text-slate-500 font-normal truncate max-w-[180px]">
                    ({searchedTrainName})
                  </span>
                )}
              </span>
            </div>

            {/* Live Indicator */}
            <div className="inline-flex items-center gap-1.5 text-emerald-700 font-extrabold text-[10px] sm:text-[11px] shrink-0">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-600" />
              </span>
              <span>Live Verified</span>
            </div>
          </div>
        </div>

        {/* Single Non-Wrapping Interactive Coach Layout Redirect Banner (Only when a train with vacant berths is open/viewing) */}
        {activeViewingTrain && (
          <div className="p-2 sm:p-2.5 rounded-xl bg-white border border-emerald-300 shadow-xs flex items-center justify-between gap-1.5 sm:gap-2 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
                <Train className="w-4 h-4" />
              </div>
              <span className="font-mono text-xs sm:text-sm font-black text-slate-900 shrink-0">
                {activeViewingTrain.trainNumber}
              </span>
              <span className="text-xs font-bold text-slate-700 truncate hidden md:inline max-w-[160px]">
                {activeViewingTrain.trainName}
              </span>
              {(() => {
                const viewingOp = getTrainOperationalStatus(date, activeViewingTrain.departureTime, activeViewingTrain);
                if (viewingOp.isDeparted) {
                  return (
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      Departed
                    </span>
                  );
                }
                if (viewingOp.isTTEOnly) {
                  return (
                    <span className="text-[10px] sm:text-xs font-bold text-amber-800 bg-amber-50 border border-amber-300 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                      {activeViewingTrain.totalVacantCount} TTE Only
                    </span>
                  );
                }
                return (
                  <span className="text-[10px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap">
                    {activeViewingTrain.totalVacantCount} Vacant
                  </span>
                );
              })()}
            </div>

            <button
              type="button"
              onClick={() => {
                const rawBerths = activeViewingTrain.availableBerths || [];
                const targetCoach = rawBerths?.[0]?.coach || rawBerths?.[0]?.coachId || '';
                const coachParam = targetCoach ? `&coach=${encodeURIComponent(targetCoach)}` : '';
                const trainClass = activeViewingTrain.travelClass || selectedClass || '3A';
                const trainFrom = activeViewingTrain.fromStation || activeViewingTrain.origin || from;
                const trainTo = activeViewingTrain.toStation || activeViewingTrain.destination || to;
                const targetUrl = `/coach?train=${encodeURIComponent(activeViewingTrain.trainNumber)}${coachParam}&from=${encodeURIComponent(trainFrom)}&to=${encodeURIComponent(trainTo)}&date=${encodeURIComponent(date || '')}&class=${encodeURIComponent(trainClass)}`;
                navigate(targetUrl);
              }}
              className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 transition-all shadow-xs shrink-0 whitespace-nowrap cursor-pointer"
              title={`View Interactive Coach Bogie & Seat Layout for Train ${activeViewingTrain.trainNumber}`}
            >
              <Compass className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">View Coach Layout</span>
              <span className="sm:hidden">Coach Layout</span>
              <ChevronRight className="w-3.5 h-3.5 text-white shrink-0" />
            </button>
          </div>
        )}


        {/* Notice if user selected a train that does NOT run on this date */}
        {requestedTrainNotice && allDisplayTrains.length > 0 && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 sm:p-5 text-xs text-amber-950 flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 font-bold border border-amber-300">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-2.5 flex-1">
              <div>
                <strong className="block text-sm sm:text-base font-bold text-amber-950">
                  {requestedTrainNotice.title ||
                    (requestedTrainNotice.reason === 'NOT_ON_ROUTE'
                      ? `Train ${requestedTrainNotice.trainNumber} Does Not Operate on this Route`
                      : `Train ${requestedTrainNotice.trainNumber} Does Not Run on ${date}`)}
                </strong>
                <p className="text-xs sm:text-sm text-amber-900 leading-relaxed mt-1">
                  {requestedTrainNotice.message}
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                {alternativeDate && (
                  <Button
                    size="sm"
                    onClick={() => handleSwitchDate(alternativeDate.date)}
                    className="bg-[#1e3a8a] text-white hover:bg-[#172554] text-xs font-bold"
                  >
                    Switch to {alternativeDate.dayName || ''} ({alternativeDate.date})
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSelectTrain('')}
                  className="border border-amber-400 bg-white hover:bg-amber-100 text-amber-950 text-xs font-semibold"
                >
                  View All Operating Trains for Today
                </Button>
              </div>

              {requestedTrainNotice.reason === 'DAYS_OF_RUN_MISMATCH' && (
                <p className="text-[11px] text-amber-800 font-medium">
                  Indian Railways operates this train only on specific days of the week. Below are the running trains operating on this route today:
                </p>
              )}
            </div>
          </div>
        )}

        {/* Suggested Alternative Train on this Route (Only if NOT already showing requestedTrainNotice) */}
        {!requestedTrainNotice && suggestedAlternativeOnRoute && (
          <SuggestedAlternativeBanner
            suggestedAlternative={suggestedAlternativeOnRoute}
            currentTrainNumber={activeTrain}
            onSelectTrain={(tNum) => handleSelectTrain(tNum)}
          />
        )}

        {/* Alternative Date Banner if discovered */}
        {!requestedTrainNotice && alternativeDate && (
          <AlternativeDateBanner
            alternativeDate={alternativeDate}
            onSwitchDate={handleSwitchDate}
          />
        )}

        {/* Filter and Sort Toolbar (Only shown when operating trains exist on route) */}
        {!isError && (allDisplayTrains.length > 0 || isLoading) && (
          <div className="p-2 sm:p-3 rounded-xl bg-white border border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-3 text-xs overflow-hidden shadow-2xs">
            {/* Row 1 on Mobile: Class Selector (Full width, grid-cols-6 on mobile, no scrollbar, zero overflow) */}
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 max-w-full w-full md:w-auto">
              <span className="hidden sm:flex font-bold text-slate-700 items-center gap-1 select-none text-[11px] sm:text-xs shrink-0">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Class:</span>
              </span>
              <div className="grid grid-cols-6 sm:flex sm:items-center gap-1 p-0.5 sm:p-1 bg-slate-100 rounded-lg border border-slate-300 w-full sm:w-auto">
                {['SL', '3A', '2A', '1A', '2S', 'CC'].map((cls) => {
                  const isCurrent = activeDisplayClass === cls;
                  const isThisLoading = isTabLoading && isCurrent;
                  const count = routeClassVacancyTotals[cls] || 0;
                  return (
                    <button
                      key={cls}
                      type="button"
                      disabled={isTabLoading}
                      onClick={() => handleSelectClass(cls)}
                      className={`py-1 sm:py-1.5 px-0.5 sm:px-2.5 rounded-md font-bold text-xs transition-all flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 select-none ${
                        isCurrent
                          ? 'bg-[#1e3a8a] text-white border border-[#1e3a8a] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 border border-transparent hover:bg-slate-200/60'
                      } ${isTabLoading ? 'cursor-wait opacity-90' : 'cursor-pointer'}`}
                    >
                      {isThisLoading && (
                        <Loader2 className="w-3 h-3 animate-spin shrink-0 text-white" />
                      )}
                      <span className="text-[11px] sm:text-xs font-black leading-none">{cls}</span>
                      {count > 0 ? (
                        <span
                          className={`text-[8.5px] sm:text-[10px] px-1 sm:px-1.5 py-0.2 rounded-full font-extrabold leading-none tabular-nums ${
                            isCurrent
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {count}
                        </span>
                      ) : (
                        <span className="sm:hidden text-[8.5px] text-slate-400 font-bold leading-none">–</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2 on Mobile / Right Group on Desktop: Sort Dropdown + Compare Trains */}
            <div className="flex items-center justify-between gap-2 pt-1.5 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto shrink-0">
              {/* Sort Dropdown */}
              <div className="flex-1 sm:flex-initial flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 sm:py-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer w-full sm:w-auto"
                  aria-label="Sort options"
                >
                  <option value="BEST_MATCH">Best Match</option>
                  <option value="DEPARTURE">Earliest Dep</option>
                  <option value="DURATION">Shortest Dur</option>
                  <option value="COVERAGE">Max Vacant</option>
                </select>
              </div>

              {/* Matrix Comparison Modal Toggle */}
              {crossTrains.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowMatrix(!showMatrix)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 hover:border-slate-400 transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>{showMatrix ? 'Hide Matrix' : 'Compare Trains'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Cross-Train Schedule & Class Comparison Matrix */}
        {showMatrix && crossTrains.length > 0 && !isLoading && (
          <CrossTrainMatrix
            trains={crossTrains}
            onSelectTrainClass={handleSelectTrainClass}
          />
        )}

        {/* Initial Load Skeleton: Only displayed before any journey data is fetched */}
        {isLoading && !journeyData && (
          <div className="space-y-4">
            <div className="p-4 sm:p-5 rounded-xl border border-blue-200 bg-white flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e3a8a] shrink-0">
                  <Loader2 className="w-5 h-5 animate-spin text-[#1e3a8a]" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>Loading {activeDisplayClass} Class Vacancies</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-100 text-[#1e3a8a] font-mono uppercase font-bold">
                      {activeDisplayClass}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Querying IRCTC live chart and physical berth allocation for {from} ➔ {to}...
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 hidden sm:inline">
                Live Query
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="p-5 rounded-xl border border-slate-300 bg-white space-y-4 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-200" />
                      <div className="h-5 w-36 bg-slate-200 rounded" />
                      <div className="h-5 w-20 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3.5 w-52 bg-slate-100 rounded" />
                  </div>
                  <div className="h-10 w-36 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>

              <div className="p-5 rounded-xl border border-slate-300 bg-white space-y-4 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-slate-200" />
                      <div className="h-5 w-36 bg-slate-200 rounded" />
                      <div className="h-5 w-20 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3.5 w-52 bg-slate-100 rounded" />
                  </div>
                  <div className="h-10 w-36 bg-slate-200 rounded-lg" />
                </div>
                <div className="h-10 w-full bg-slate-100 rounded-lg" />
              </div>
            </div>
          </div>
        )}

        {/* Tab Change Micro-Sync Indicator (Keeps layout stable with zero screen jumping) */}
        {isTabLoading && journeyData && (
          <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-[#1e3a8a] flex items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-2 font-bold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1e3a8a] shrink-0" />
              <span>Updating live vacancies for {activeDisplayClass} Class...</span>
            </div>
            <span className="text-[10px] font-mono font-extrabold uppercase px-2 py-0.5 rounded bg-blue-100 text-[#1e3a8a] border border-blue-300">
              Live Sync
            </span>
          </div>
        )}

        {/* Error Alert State */}
        {isError && (
          <Alert
            type="error"
            title="Search Failed"
            message={error?.message || 'Unable to discover berths for this journey.'}
            action={
              <Button size="sm" onClick={() => refetch()}>
                Try Again
              </Button>
            }
          />
        )}

        {/* Unified Multi-Train Accordion Dropdown List (Smooth opacity transition without unmounting) */}
        {!isError && (displayTrains.length > 0 || (fullJourneyOnly && allDisplayTrains.length > 0)) && (
          <div className={`space-y-6 transition-opacity duration-300 ${isTabLoading ? 'opacity-65 pointer-events-none' : 'opacity-100'}`}>
            {/* Active / Upcoming Trains */}
            {upcomingTrains.length > 0 ? (
              <div className="space-y-3.5">
                {/* Intelligent Cross-Class Route Notice */}
                {!isLoading && totalUpcomingVacantInSelectedClass === 0 && routeAvailableInOtherClasses.length > 0 && (
                  <div className="p-3.5 sm:p-4 rounded-xl border border-emerald-300 bg-emerald-50/90 text-slate-800 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center shrink-0 text-emerald-700 font-bold">
                        ✓
                      </div>
                      <div>
                        <p className="font-bold text-emerald-950 text-xs sm:text-sm">
                          No vacant berths in {activeDisplayClass} class today — but {totalAltRouteSeats}+ seats available in other classes!
                        </p>
                        <p className="text-slate-600 text-[11px] sm:text-xs mt-0.5">
                          All {activeDisplayClass} coaches on this route are fully booked. Real seats are available in:
                          {routeAvailableInOtherClasses.map((c) => ` ${c.totalSeats} in ${c.travelClass}`).join(' • ')}.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {routeAvailableInOtherClasses.slice(0, 3).map((c) => (
                        <button
                          key={c.travelClass}
                          type="button"
                          onClick={() => handleSelectClass(c.travelClass)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <span>Switch to {c.travelClass}</span>
                          <span className="bg-emerald-700/80 px-1.5 py-0.2 rounded text-[10px] font-mono">
                            {c.totalSeats}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <span>Operating Trains on Route ({upcomingTrains.length})</span>
                    <span className="text-[11px] font-normal normal-case text-slate-500 hidden sm:inline">
                      • Click any train to view vacant seats (Dropdown Accordion)
                    </span>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {upcomingTrains.map((train) => {
                    const isOpen = expandedTrainNo === train.trainNumber;
                    return (
                      <TrainAccordionCard
                        key={train.trainNumber}
                        train={train}
                        isOpen={isOpen}
                        onToggle={() => handleToggleTrain(train.trainNumber)}
                        onInspect={(opt) => setInspectOption(opt)}
                        fromStation={from}
                        toStation={to}
                        selectedClass={selectedClass}
                        onSelectClass={(cls) => handleSelectClass(cls)}
                      />
                    );
                  })}
                </div>
              </div>
            ) : fullJourneyOnly ? (
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-[#1e3a8a] text-xs flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>No operating trains currently have 100% direct continuous berths on this date.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFullJourneyOnly(false)}
                  className="font-bold underline text-[#1e3a8a] hover:text-blue-900 cursor-pointer"
                >
                  Show Multi-Leg &amp; Segment Seats
                </button>
              </div>
            ) : (
              <div className="p-4 sm:p-5 rounded-xl border border-amber-300 bg-amber-50/80 text-amber-950 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200/80 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-950">
                      All Scheduled Daytime Trains for Today ({date}) Have Departed from {from}
                    </h4>
                    <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                      Indian Railways reservation chart bookings for today&apos;s daytime schedule are finalized and departed.
                      You can view departed train schedules below or check tomorrow&apos;s running trains.
                    </p>
                  </div>
                </div>
                {nextDayDate && (
                  <div className="pt-1 flex items-center gap-2.5 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleSwitchDate(nextDayDate)}
                      className="bg-[#1e3a8a] text-white hover:bg-[#172554] text-xs font-bold flex items-center gap-1.5 shadow-xs"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Search for Tomorrow ({nextDayDate})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Departed Trains - Grouped Separately in clean collapsible list */}
            {departedTrains.length > 0 && (
              <div className="pt-2 border-t border-slate-200/90 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowDepartedList(!showDepartedList)}
                  className="w-full flex items-center justify-between p-2.5 sm:p-3.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer border border-slate-200 select-none gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 whitespace-nowrap">
                      <span className="sm:hidden">Departed Today</span>
                      <span className="hidden sm:inline">Departed Trains Today</span>{' '}
                      <span className="text-slate-500 font-medium">({departedTrains.length})</span>
                    </span>
                    <span className="text-[11px] text-slate-500 hidden md:inline truncate">
                      • Already departed from {from} for today&apos;s schedule
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 shrink-0 whitespace-nowrap">
                    <span className="hidden sm:inline">
                      {showDepartedList ? 'Hide Departed' : 'View Departed Trains'}
                    </span>
                    <span className="sm:hidden text-[11px]">
                      {showDepartedList ? 'Hide' : 'View'}
                    </span>
                    {showDepartedList ? (
                      <ChevronUp className="w-4 h-4 shrink-0 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 shrink-0 text-slate-500" />
                    )}
                  </div>
                </button>

                {showDepartedList && (
                  <div className="space-y-3 opacity-80">
                    {departedTrains.map((train) => {
                      const isOpen = expandedTrainNo === train.trainNumber;
                      return (
                        <TrainAccordionCard
                          key={train.trainNumber}
                          train={train}
                          isOpen={isOpen}
                          onToggle={() => handleToggleTrain(train.trainNumber)}
                          onInspect={(opt) => setInspectOption(opt)}
                          fromStation={from}
                          toStation={to}
                          selectedClass={selectedClass}
                          onSelectClass={(cls) => handleSelectClass(cls)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State when no trains found on route (Single Clean Professional Container) */}
        {!isFetching && !isError && allDisplayTrains.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-300 p-8 text-center max-w-xl mx-auto space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 text-[#1e3a8a] flex items-center justify-center mx-auto">
              <Train className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                No Direct Trains Scheduled on this Route
              </h2>
              <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                {activeTrain ? (
                  <>
                    Train <span className="font-bold text-slate-900">{activeTrain}</span> does not operate between{' '}
                    <span className="font-semibold text-slate-800">{from}</span> and{' '}
                    <span className="font-semibold text-slate-800">{to}</span> on{' '}
                    <span className="font-semibold text-slate-800">{date}</span>, and no alternative direct trains were found on this route.
                  </>
                ) : (
                  <>
                    No trains were found operating between <span className="font-semibold text-slate-800">{from}</span> and{' '}
                    <span className="font-semibold text-slate-800">{to}</span> on{' '}
                    <span className="font-semibold text-slate-800">{date}</span>.
                  </>
                )}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-600 text-left space-y-1.5 max-w-md mx-auto">
              <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wide">
                Suggestions:
              </span>
              <p>&bull; Try selecting a different journey date or class (e.g. Sleeper or 3A).</p>
              {activeTrain && <p>&bull; Clear the specific train filter to search all running trains.</p>}
              <p>&bull; Try nearby major junctions (e.g. BBS, NDLS, TATA, BLS, HWH).</p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
              {activeTrain && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSelectTrain('')}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold"
                >
                  Clear Train Filter
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleReturnToSearch}
                className="text-xs font-semibold"
              >
                Modify Search
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  handleSelectTrain('');
                  handleSelectClass('SL');
                }}
                className="bg-[#f58220] hover:bg-[#e05a10] text-white text-xs font-bold"
              >
                Search Sleeper (SL) All Trains
              </Button>
            </div>
          </div>
        )}

        {/* Berth Detail Modal */}
        <BerthInspectDialog
          isOpen={!!inspectOption}
          onClose={() => setInspectOption(null)}
          option={inspectOption}
          journeyDate={date}
        />
      </div>
    </div>
  );
}
