import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  AlertCircle,
  ChevronDown,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CoachMap } from '@/components/coach/CoachMap';
import { TrainBogieStrip } from '@/components/coach/TrainBogieStrip';
import { BerthDetailSheet } from '@/components/coach/BerthDetailSheet';
import { fetchBrowserTrainComposition, fetchBrowserCoachComposition } from '@/services/clientIrctc';
import { buildCoachLayoutFromBdd, getCoachClass } from '@/services/clientCoachLayout';

export function ChartPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // URL state synchronization - Inherited from first search page
  const initialTrain = searchParams.get('train') || '12815';
  const initialCoach = searchParams.get('coach') || '';
  const initialFrom = searchParams.get('from') || 'BBS';
  const initialTo = searchParams.get('to') || 'NDLS';
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const initialClass = searchParams.get('class') || 'SL';
  const initialBerth = searchParams.get('berth') ? Number(searchParams.get('berth')) : null;

  const [selectedTrain, setSelectedTrain] = useState(initialTrain);
  const [selectedCoach, setSelectedCoach] = useState(initialCoach);
  const [selectedClass, setSelectedClass] = useState(initialClass);
  const [selectedBerthNumber, setSelectedBerthNumber] = useState(initialBerth);
  const [customTrainInput, setCustomTrainInput] = useState('');

  const fromStation = initialFrom;
  const toStation = initialTo;
  const selectedDate = initialDate;


  // Sync to URL params when parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTrain) params.set('train', selectedTrain);
    if (selectedCoach) params.set('coach', selectedCoach);
    if (selectedDate) params.set('date', selectedDate);
    if (fromStation) params.set('from', fromStation);
    if (toStation) params.set('to', toStation);
    if (selectedClass) params.set('class', selectedClass);
    if (selectedBerthNumber) params.set('berth', String(selectedBerthNumber));

    setSearchParams(params, { replace: true });
  }, [selectedTrain, selectedCoach, selectedDate, fromStation, toStation, selectedClass, selectedBerthNumber, setSearchParams]);

  // Query 1: Discover Route Trains from Search Result
  const routeTrainsQuery = useQuery({
    queryKey: ['routeTrains', fromStation, toStation, selectedDate, selectedClass],
    queryFn: async () => {
      if (!fromStation || !toStation) return [];
      const res = await fetch(
        `/api/v1/journey/find-berths?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${encodeURIComponent(selectedDate)}&passengers=1&class=${encodeURIComponent(selectedClass)}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      const trainsList = [];
      if (Array.isArray(json.data?.crossTrainComparison) && json.data.crossTrainComparison.length > 0) {
        trainsList.push(...json.data.crossTrainComparison);
      } else {
        if (json.data?.bestMatch) trainsList.push(json.data.bestMatch);
        if (Array.isArray(json.data?.partialOptions)) trainsList.push(...json.data.partialOptions);
        if (Array.isArray(json.data?.alternatives)) trainsList.push(...json.data.alternatives);
      }
      return trainsList;
    },
    enabled: Boolean(fromStation && toStation),
    staleTime: 5 * 60 * 1000,
  });

  // Query 2: Fetch Train Coaches Summary & Composition
  const trainQuery = useQuery({
    queryKey: ['trainCoaches', selectedTrain, fromStation, toStation, selectedDate, selectedClass],
    queryFn: async () => {
      let serverData = null;
      try {
        const url = new URL(`/api/v1/coaches/${encodeURIComponent(selectedTrain)}`, window.location.origin);
        if (fromStation) url.searchParams.set('from', fromStation);
        if (toStation) url.searchParams.set('to', toStation);
        if (selectedDate) url.searchParams.set('date', selectedDate);
        if (selectedClass) url.searchParams.set('travelClass', selectedClass);

        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          serverData = json.data;
        }
      } catch (_e) {
        // Fallback to client browser query
      }

      // If backend is on Vercel or has no available coaches, query IRCTC directly via client browser
      if (!serverData || !serverData.availableCoaches || serverData.availableCoaches.length === 0 || serverData.isDemo) {
        try {
          const browserComp = await fetchBrowserTrainComposition(selectedTrain, selectedDate, fromStation);
          if (browserComp && browserComp.coaches?.length > 0) {
            const coachesList = browserComp.coaches.map((c) => c.coachName);
            return {
              trainNumber: selectedTrain,
              trainName: browserComp.trainName || serverData?.trainName || `Train ${selectedTrain}`,
              origin: browserComp.from || fromStation,
              destination: browserComp.to || toStation,
              availableCoaches: coachesList,
              defaultCoach: coachesList[0] || 'B1',
              chartOneDate: browserComp.chartOneDate,
              chartTwoDate: browserComp.chartTwoDate,
              isPrepared: browserComp.isPrepared,
              source: 'irctc_live_browser',
            };
          }
        } catch (_e) {
          // ignore
        }
      }

      if (serverData) return serverData;
      throw new Error(`Failed to load train details for ${selectedTrain}`);
    },
    staleTime: 10 * 60 * 1000,
  });

  const trainData = trainQuery.data;

  // Auto-select default coach
  useEffect(() => {
    if (trainData?.availableCoaches?.length > 0) {
      if (!selectedCoach || !trainData.availableCoaches.includes(selectedCoach)) {
        const classCoach = trainData.availableCoaches.find((c) => {
          if (selectedClass === 'SL') return c.startsWith('S');
          if (selectedClass === '3A') return c.startsWith('B');
          if (selectedClass === '2A') return c.startsWith('A');
          if (selectedClass === '1A') return c.startsWith('H');
          if (selectedClass === '2S' || selectedClass === 'CC') return c.startsWith('D') || c.startsWith('C');
          return false;
        });
        setSelectedCoach(classCoach || trainData.defaultCoach || trainData.availableCoaches[0]);
      }
    }
  }, [trainData, selectedCoach, selectedClass]);

  // Query 3: Fetch Coach Vacancy Details
  const activeCoach = selectedCoach || trainData?.defaultCoach || 'S1';
  const coachVacancyQuery = useQuery({
    queryKey: ['coachVacancy', selectedTrain, activeCoach, selectedDate, fromStation, toStation, selectedClass],
    queryFn: async () => {
      let serverData = null;
      try {
        const url = new URL(`/api/v1/coaches/${encodeURIComponent(selectedTrain)}/${encodeURIComponent(activeCoach)}`, window.location.origin);
        if (selectedDate) url.searchParams.set('date', selectedDate);
        if (fromStation) url.searchParams.set('from', fromStation);
        if (toStation) url.searchParams.set('to', toStation);
        if (selectedClass) url.searchParams.set('travelClass', selectedClass);

        const res = await fetch(url.toString());
        if (res.ok) {
          const json = await res.json();
          serverData = json.data;
        }
      } catch (_e) {
        // Fallback to client browser query
      }

      // If server returned live data with available berths, use it
      if (serverData && serverData.isLiveChart && serverData.summary?.availableTotal > 0) {
        return serverData;
      }

      // If server returned 0 berths or isChartPrepared is false or server is offline/blocked by Akamai:
      // Query IRCTC coach composition directly from passenger's browser!
      try {
        const bdd = await fetchBrowserCoachComposition({
          trainNo: selectedTrain,
          jDate: selectedDate,
          boardingStation: fromStation,
          coach: activeCoach,
          cls: selectedClass || getCoachClass(activeCoach),
        });

        if (bdd && bdd.length > 0) {
          const clientLayout = buildCoachLayoutFromBdd({
            bddList: bdd,
            trainNo: selectedTrain,
            coachName: activeCoach,
            cls: selectedClass || getCoachClass(activeCoach),
            journeyDate: selectedDate,
            fromStation,
            toStation,
            trainName: trainData?.trainName || '',
            availableCoaches: trainData?.availableCoaches || [],
          });
          return clientLayout;
        }
      } catch (_e) {
        // ignore
      }

      if (serverData) return serverData;
      throw new Error('Failed to load coach layout');
    },
    enabled: Boolean(selectedTrain && activeCoach),
    staleTime: 60 * 1000,
  });

  const coachData = coachVacancyQuery.data;

  const selectedBerth = useMemo(() => {
    if (!coachData?.berths || !selectedBerthNumber) return null;
    return coachData.berths.find((b) => b.berthNumber === selectedBerthNumber) || null;
  }, [coachData, selectedBerthNumber]);

  const handleTrainChange = (trainNum) => {
    if (!trainNum) return;
    setSelectedTrain(trainNum);
    setSelectedCoach('');
    setSelectedBerthNumber(null);
  };

  const handleBackToSearch = () => {
    navigate(`/find?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${encodeURIComponent(selectedDate)}&class=${encodeURIComponent(selectedClass)}`);
  };

  const availableTrainsOnRoute = routeTrainsQuery.data || [];

  return (
    <div className="py-3 sm:py-6 bg-slate-50 min-h-screen text-slate-800">
      <div className="max-w-6xl mx-auto px-2.5 sm:px-6 space-y-3.5">
        {/* Top Sticky Bar: Back to Search & Route Summary Badge */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Row 1 on Mobile / Left on Desktop: Back Button & Route & Date */}
          <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 w-full sm:w-auto">
            <div className="flex items-center gap-2 min-w-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBackToSearch}
                leftIcon={ArrowLeft}
                className="text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shrink-0 shadow-xs h-8 px-2.5"
              >
                Back
              </Button>
              <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-extrabold">{fromStation}</span>
                {trainData?.origin && fromStation && trainData.origin.toUpperCase() !== fromStation.toUpperCase() && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300" title={`Departs from ${trainData.originName || trainData.origin}`}>
                    Departs {trainData.origin}
                  </span>
                )}
                <span className="text-slate-400 font-bold">&rarr;</span>
                <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-extrabold">{toStation}</span>
                {trainData?.destination && toStation && trainData.destination.toUpperCase() !== toStation.toUpperCase() && (
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-300" title={`Terminates at ${trainData.destinationName || trainData.destination}`}>
                    Terminates {trainData.destination}
                  </span>
                )}
                <span className="text-slate-300 hidden sm:inline">&bull;</span>
                <span className="text-slate-500 text-xs hidden sm:inline font-mono">{selectedDate}</span>
              </div>
            </div>

            {/* Mobile date badge */}
            <span className="text-slate-600 text-[11px] font-mono sm:hidden shrink-0 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
              {selectedDate}
            </span>
          </div>

          {/* Row 2 on Mobile / Right on Desktop: Clean Train Switcher Dropdown */}
          <div className="w-full sm:w-auto sm:ml-auto">
            {availableTrainsOnRoute.length > 0 ? (
              <div className="relative w-full sm:w-auto">
                <select
                  value={selectedTrain}
                  onChange={(e) => handleTrainChange(e.target.value)}
                  className="w-full sm:w-auto appearance-none bg-slate-50 hover:bg-slate-100 sm:bg-white text-slate-900 text-xs font-bold px-3 py-2 pr-8 rounded-lg border border-slate-300 shadow-xs hover:border-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer truncate"
                >
                  {availableTrainsOnRoute.map((t) => (
                    <option key={t.trainNumber} value={t.trainNumber}>
                      {t.trainNumber} - {t.trainName} ({t.totalVacantCount || 0} Vacant)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                Train {selectedTrain}
              </span>
            )}
          </div>
        </div>

        {/* Minimal Control Bar: Class filter + 5-digit train search */}
        <div className="p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
          {/* Class Filter Selector: Clean single horizontal row, never wraps CC */}
          <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none py-0.5 shrink-0">
            <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mr-0.5 sm:mr-1 shrink-0 select-none">
              Class:
            </span>
            {['SL', '3A', '2A', '1A', '2S', 'CC'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-2 sm:px-2.5 py-1 text-xs rounded-lg font-bold transition-all border cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Quick 5-Digit Train Search Input (Clean full-width on mobile, right-aligned on desktop) */}
          <div className="flex items-center gap-1.5 sm:ml-auto w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <input
                type="text"
                maxLength={5}
                value={customTrainInput}
                onChange={(e) => setCustomTrainInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Train No. (e.g. 12882)"
                className="w-full sm:w-44 h-8 px-2.5 pr-8 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <Button
              type="button"
              size="sm"
              disabled={customTrainInput.length < 5}
              onClick={() => {
                if (customTrainInput.length === 5) {
                  handleTrainChange(customTrainInput);
                  setCustomTrainInput('');
                }
              }}
              className="h-8 px-3 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 shrink-0"
            >
              Load
            </Button>
          </div>
        </div>

        {/* Train Formation SVG Bogie Strip */}
        {trainData?.availableCoaches && (
          <TrainBogieStrip
            coaches={trainData.availableCoaches}
            coachesData={trainData.coachesData || []}
            activeCoach={activeCoach}
            onSelectCoach={(c) => {
              setSelectedCoach(c);
              setSelectedBerthNumber(null);
            }}
            activeClass={selectedClass}
          />
        )}

        {/* Loading / Error States */}
        {coachVacancyQuery.isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl bg-slate-200" />
            <Skeleton className="h-96 w-full rounded-2xl bg-slate-200" />
          </div>
        )}

        {coachVacancyQuery.isError && (
          <Card className="p-6 text-center text-rose-700 border border-rose-200 bg-rose-50/50">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-600" />
            <h4 className="text-base font-bold text-rose-900">Failed to Load Coach Layout</h4>
            <p className="text-xs text-rose-700 mt-1">
              {coachVacancyQuery.error.message || 'Please verify the train number and date.'}
            </p>
          </Card>
        )}

        {/* Chart Status Notification Banner */}
        {coachData && coachData.isChartPrepared === false && (
          <div className="p-3 sm:p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex items-start gap-2.5 sm:gap-3 shadow-2xs">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                Reservation Chart Not Prepared Yet
              </h4>
              <p className="text-[11px] sm:text-xs text-amber-700 mt-0.5 leading-relaxed">
                {coachData.message || `IRCTC reservation chart for Train ${selectedTrain} on ${selectedDate} has not been prepared yet. First chart is officially finalized ~4 hours before train departure.`}
              </p>
            </div>
          </div>
        )}

        {/* Live IRCTC Sync Badge */}
        {coachData && coachData.source === 'irctc_live_browser' && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-2xs">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Official IRCTC Live Verified</span>
            </span>
            <span className="text-[11px] font-mono font-bold text-emerald-700">
              {coachData.summary?.availableTotal || 0} Vacant Berths in {activeCoach}
            </span>
          </div>
        )}

        {/* Main Interactive Coach Map */}
        {coachData && (
          <CoachMap
            coachId={activeCoach}
            travelClass={coachData.travelClass || selectedClass}
            trainNumber={selectedTrain}
            trainName={coachData.trainName || trainData?.trainName || ''}
            bays={coachData.bays || []}
            berths={coachData.berths || []}
            selectedBerthNumber={selectedBerthNumber}
            onSelectBerth={(b) => setSelectedBerthNumber(b.berthNumber)}
          />
        )}

        {/* Berth Detail Inspector Card */}
        {selectedBerth && (
          <div className="pt-2">
            <BerthDetailSheet
              berth={selectedBerth}
              trainNumber={selectedTrain}
              trainName={coachData?.trainName || trainData?.trainName || ''}
              fromStation={fromStation}
              toStation={toStation}
              journeyDate={selectedDate}
              onClose={() => setSelectedBerthNumber(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default ChartPage;
