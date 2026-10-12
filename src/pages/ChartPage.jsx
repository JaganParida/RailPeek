import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Search,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { CoachMap } from '@/components/coach/CoachMap';
import { TrainBogieStrip } from '@/components/coach/TrainBogieStrip';
import { BerthDetailSheet } from '@/components/coach/BerthDetailSheet';

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
    queryKey: ['routeTrains', fromStation, toStation, selectedDate],
    queryFn: async () => {
      if (!fromStation || !toStation) return [];
      const res = await fetch(
        `/api/v1/journey/find-berths?from=${encodeURIComponent(fromStation)}&to=${encodeURIComponent(toStation)}&date=${encodeURIComponent(selectedDate)}&passengers=1&class=${encodeURIComponent(selectedClass)}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return json.data?.trains || [];
    },
    enabled: Boolean(fromStation && toStation),
    staleTime: 5 * 60 * 1000,
  });

  // Query 2: Fetch Train Coaches Summary & Composition
  const trainQuery = useQuery({
    queryKey: ['trainCoaches', selectedTrain, fromStation, toStation, selectedDate],
    queryFn: async () => {
      const url = new URL(`/api/v1/coaches/${encodeURIComponent(selectedTrain)}`, window.location.origin);
      if (fromStation) url.searchParams.set('from', fromStation);
      if (toStation) url.searchParams.set('to', toStation);
      if (selectedDate) url.searchParams.set('date', selectedDate);

      const res = await fetch(url.toString());
      if (!res.ok) {
        throw new Error(`Failed to load train details for ${selectedTrain}`);
      }
      const json = await res.json();
      return json.data;
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
    queryKey: ['coachVacancy', selectedTrain, activeCoach, selectedDate, fromStation, toStation],
    queryFn: async () => {
      const url = new URL(`/api/v1/coaches/${encodeURIComponent(selectedTrain)}/${encodeURIComponent(activeCoach)}`, window.location.origin);
      if (selectedDate) url.searchParams.set('date', selectedDate);
      if (fromStation) url.searchParams.set('from', fromStation);
      if (toStation) url.searchParams.set('to', toStation);
      if (selectedClass) url.searchParams.set('travelClass', selectedClass);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || 'Failed to load coach layout');
      }
      const json = await res.json();
      return json.data;
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
        <div className="flex items-center justify-between gap-2.5 flex-wrap p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBackToSearch}
              leftIcon={ArrowLeft}
              className="text-xs font-bold bg-white text-slate-700 hover:bg-slate-100 border-slate-300 shrink-0 shadow-xs"
            >
              Back
            </Button>
            <div className="text-xs sm:text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
              <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{fromStation}</span>
              <span className="text-slate-400 font-bold">&rarr;</span>
              <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">{toStation}</span>
              <span className="text-slate-300 hidden sm:inline">&bull;</span>
              <span className="text-slate-600 text-xs hidden sm:inline font-mono">{selectedDate}</span>
            </div>
          </div>

          {/* Clean Train Switcher Dropdown (From Searched Route) */}
          <div className="flex items-center gap-2 ml-auto">
            {availableTrainsOnRoute.length > 0 ? (
              <div className="relative">
                <select
                  value={selectedTrain}
                  onChange={(e) => handleTrainChange(e.target.value)}
                  className="appearance-none bg-white text-slate-900 text-xs font-bold px-3 py-1.5 pr-7 rounded-lg border border-slate-300 shadow-xs hover:border-slate-400 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  {availableTrainsOnRoute.map((t) => (
                    <option key={t.trainNumber} value={t.trainNumber}>
                      {t.trainNumber} - {t.trainName} ({t.totalVacantCount || 0} Vacant)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                Train {selectedTrain}
              </span>
            )}
          </div>
        </div>

        {/* Minimal Control Bar: Class filter + 5-digit train search */}
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
          {/* Class Filter Selector */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1 select-none">
              Class:
            </span>
            {['SL', '3A', '2A', '1A', '2S', 'CC'].map((cls) => (
              <button
                key={cls}
                type="button"
                onClick={() => setSelectedClass(cls)}
                className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all border cursor-pointer ${
                  selectedClass === cls
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cls}
              </button>
            ))}
          </div>

          {/* Quick 5-Digit Train Search Input */}
          <div className="flex items-center gap-1.5 ml-auto">
            <div className="relative">
              <input
                type="text"
                maxLength={5}
                value={customTrainInput}
                onChange={(e) => setCustomTrainInput(e.target.value.replace(/\D/g, ''))}
                placeholder="Train No. (e.g. 12882)"
                className="w-40 sm:w-44 h-8 px-2.5 pr-8 rounded-lg border border-slate-300 bg-slate-50 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none"
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
              className="h-8 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
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

        {/* Main Interactive Coach Map */}
        {coachData && (
          <CoachMap
            coachId={activeCoach}
            travelClass={coachData.travelClass || selectedClass}
            trainNumber={selectedTrain}
            trainName={coachData.trainName || trainData?.trainName || ''}
            bays={coachData.bays || []}
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
