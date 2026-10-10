import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  Train,
  AlertCircle,
  Search,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { StationAutocomplete } from '@/components/ui/StationAutocomplete';
import { Skeleton } from '@/components/ui/Skeleton';
import { FreshnessIndicator } from '@/components/ui/FreshnessIndicator';
import { CoachMap } from '@/components/coach/CoachMap';
import { BerthDetailSheet } from '@/components/coach/BerthDetailSheet';

const POPULAR_TRAINS = [
  { number: '12819', name: 'Odisha Sampark Kranti', route: 'BBS → NDLS', defaultCoach: 'S1' },
  { number: '18477', name: 'Kalinga Utkal Express', route: 'PURI → NDLS', defaultCoach: 'B3' },
  { number: '12801', name: 'Purushottam Express', route: 'PURI → NDLS', defaultCoach: 'B2' },
  { number: '20817', name: 'Tejas Rajdhani', route: 'BBS → NDLS', defaultCoach: 'B1' },
  { number: '12951', name: 'Mumbai Tejas Rajdhani', route: 'MMCT → NDLS', defaultCoach: 'B1' },
];

export function ChartPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state synchronization
  const initialTrain = searchParams.get('train') || '12819';
  const initialCoach = searchParams.get('coach') || 'S1';
  const initialFrom = searchParams.get('from') || 'TATA';
  const initialTo = searchParams.get('to') || 'NDLS';
  const initialDate = searchParams.get('date') || new Date().toISOString().slice(0, 10);
  const initialBerth = searchParams.get('berth') ? Number(searchParams.get('berth')) : null;

  const [selectedTrain, setSelectedTrain] = useState(initialTrain);
  const [selectedCoach, setSelectedCoach] = useState(initialCoach);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [fromStation, setFromStation] = useState(initialFrom);
  const [toStation, setToStation] = useState(initialTo);
  const [selectedBerthNumber, setSelectedBerthNumber] = useState(initialBerth);
  const [customTrainInput, setCustomTrainInput] = useState('');

  // Filters state
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Sync to URL params when parameters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedTrain) params.set('train', selectedTrain);
    if (selectedCoach) params.set('coach', selectedCoach);
    if (selectedDate) params.set('date', selectedDate);
    if (fromStation) params.set('from', fromStation);
    if (toStation) params.set('to', toStation);
    if (selectedBerthNumber) params.set('berth', String(selectedBerthNumber));

    setSearchParams(params, { replace: true });
  }, [selectedTrain, selectedCoach, selectedDate, fromStation, toStation, selectedBerthNumber, setSearchParams]);

  // Query 1: Fetch Train Coach Summary (Available coaches list)
  const trainQuery = useQuery({
    queryKey: ['trainCoaches', selectedTrain],
    queryFn: async () => {
      const res = await fetch(`/api/v1/coaches/${selectedTrain}`);
      if (!res.ok) throw new Error('Failed to load train details');
      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60 * 60,
  });

  // Query 2: Fetch Coach Vacancy Details
  const coachVacancyQuery = useQuery({
    queryKey: ['coachVacancy', selectedTrain, selectedCoach, selectedDate, fromStation, toStation],
    queryFn: async () => {
      const url = new URL(`/api/v1/coaches/${selectedTrain}/${selectedCoach}`, window.location.origin);
      if (selectedDate) url.searchParams.set('date', selectedDate);
      if (fromStation) url.searchParams.set('from', fromStation);
      if (toStation) url.searchParams.set('to', toStation);

      const res = await fetch(url.toString());
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to load coach layout');
      }
      const json = await res.json();
      return json.data;
    },
    staleTime: 1000 * 60,
  });

  const coachData = coachVacancyQuery.data;
  const trainData = trainQuery.data;

  const selectedBerth = coachData?.berths?.find((b) => b.berthNumber === selectedBerthNumber) || null;

  const handleTrainChange = (trainNum, defaultCoach = 'S1') => {
    setSelectedTrain(trainNum);
    setSelectedCoach(defaultCoach);
    setSelectedBerthNumber(null);
  };

  return (
    <div className="py-6 sm:py-10 bg-slate-50 min-h-screen text-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Compass className="w-6 h-6 text-brand-600" />
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Reservation Chart &amp; Vacancy Explorer
              </h1>
            </div>
            <p className="text-sm text-slate-600">
              Interactive physical coach maps with exact route segment vacancy diagnostics.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <FreshnessIndicator source="demo" isDemo={true} />
          </div>
        </div>

        {/* Train & Journey Selector Card */}
        <Card className="p-4 sm:p-5 border border-slate-300 bg-white">
          <div className="space-y-4">
            {/* Quick Train Selection Chips */}
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-2 select-none">
                Select Train / Train Chunein:
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_TRAINS.map((t) => (
                  <button
                    key={t.number}
                    type="button"
                    onClick={() => handleTrainChange(t.number, t.defaultCoach)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                      selectedTrain === t.number
                        ? 'bg-[#284a96] border-[#284a96] text-white font-bold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Train className="w-3.5 h-3.5" />
                    <span className="font-bold">{t.number}</span>
                    <span>{t.name}</span>
                    <span className="text-[10px] opacity-75 hidden md:inline font-mono">
                      ({t.route})
                    </span>
                  </button>
                ))}
              </div>

              {/* Enter custom 5-digit train */}
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200">
                <span className="text-xs font-medium text-slate-600">
                  Other Train Number:
                </span>
                <input
                  type="text"
                  maxLength={5}
                  value={customTrainInput}
                  onChange={(e) => setCustomTrainInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 12819"
                  className="w-28 h-8 px-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold text-slate-900 focus:border-brand-500 focus:outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={customTrainInput.length < 5}
                  onClick={() => {
                    if (customTrainInput.length === 5) {
                      handleTrainChange(customTrainInput, 'S1');
                    }
                  }}
                  leftIcon={Search}
                  className="h-8 text-xs"
                >
                  Load
                </Button>
              </div>
            </div>

            {/* Journey Segment & Date Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Journey Date
                </label>
                <DatePicker
                  value={selectedDate}
                  onChange={(d) => setSelectedDate(d)}
                  className="w-full text-xs"
                />
              </div>

              <div>
                <StationAutocomplete
                  label="Boarding Station"
                  value={fromStation}
                  onChange={(code) => setFromStation(code)}
                  placeholder="e.g. TATA"
                  required
                />
              </div>

              <div>
                <StationAutocomplete
                  label="Deboarding Station"
                  value={toStation}
                  onChange={(code) => setToStation(code)}
                  placeholder="e.g. NDLS"
                  required
                />
              </div>
            </div>
          </div>
        </Card>

        {/* IRCTC Style Top Blue Banner */}
        <div className="bg-[#284a96] text-white px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold flex flex-wrap items-center justify-between gap-3 border border-blue-900">
          <div className="flex items-center gap-4 flex-wrap">
            <span>Train No: <span className="font-mono">{selectedTrain}</span></span>
            <span>Journey Date: <span>{selectedDate}</span></span>
            <span>Boarding Station: <span>{fromStation}</span></span>
            <span>Charting Station: <span>{coachData?.chartingStation || coachData?.remoteStation || fromStation}</span></span>
          </div>
          <div className="text-[11px] opacity-90 font-mono">
            {coachData?.secondChartTime
              ? `Second Chart Status: ${coachData.secondChartTime}`
              : coachData?.firstChartTime
              ? `First Chart Status: ${coachData.firstChartTime}`
              : 'First Chart Status Finalized'}
          </div>
        </div>

        {/* IRCTC Full Vacant Berth Status Table */}
        <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-white max-w-2xl mx-auto">
          <div className="bg-[#284a96] text-white font-bold text-xs sm:text-sm text-center py-2 px-3">
            {coachData?.secondChartTime
              ? `Second Chart Current Vacant Berth Status at ${coachData.secondChartTime}`
              : coachData?.firstChartTime
              ? `First Chart Full Vacant Berth Status* at ${coachData.firstChartTime}`
              : 'First Chart Full Vacant Berth Status*'}
          </div>
          <div className="grid grid-cols-5 text-center divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 text-[10px] sm:text-[11px] font-bold text-slate-800 py-1.5">
            <div>FIRST AC (1A)</div>
            <div>SECOND AC (2A)</div>
            <div>THIRD AC (3A)</div>
            <div>AC 3 ECONOMY (3E)</div>
            <div>SLEEPER CLASS (SL)</div>
          </div>
          <div className="grid grid-cols-5 text-center divide-x divide-slate-200 text-xs font-semibold text-blue-700 py-2">
            <div>{coachData?.summary?.byType?.['1A']?.fullJourney ?? 0} (Berth Details)</div>
            <div>{coachData?.summary?.byType?.['2A']?.fullJourney ?? 0} (Berth Details)</div>
            <div>{coachData?.summary?.byType?.['3A']?.fullJourney ?? 0} (Berth Details)</div>
            <div>{coachData?.summary?.byType?.['3E']?.fullJourney ?? 0} (Berth Details)</div>
            <div>{coachData?.summary?.byType?.['SL']?.fullJourney ?? 0} (Berth Details)</div>
          </div>
        </div>

        {coachData?.avlRemoteForBooking && (
          <div className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-2.5 max-w-2xl mx-auto font-medium">
            * TTE on train can book ticket till <strong>{coachData.avlRemoteForBooking}</strong>. Online booking is available from <strong>{coachData.avlRemoteForBooking}</strong> onwards.
          </div>
        )}

        {/* IRCTC Train Composition Coach Strip */}
        {trainData?.availableCoaches && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-bold select-none uppercase tracking-wider text-[#284a96]">
                Train Composition &amp; Coach Selection:
              </span>
              <span className="font-mono text-[11px] font-bold text-slate-700">
                Active Train: {selectedTrain} ({trainData.trainName})
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
              {/* Engine Block */}
              <div className="flex flex-col items-center shrink-0">
                <div className="bg-[#f4511e] text-white font-black text-xs px-3 py-2 rounded-lg flex items-center justify-center min-w-[54px] min-h-[36px]">
                  ENGINE
                </div>
                <span className="text-[10px] text-transparent mt-1 select-none">ENG</span>
                <span className="text-[10px] text-transparent select-none">0</span>
              </div>

              {/* Coach Sequence */}
              {trainData.availableCoaches.map((coach) => {
                const isActive = selectedCoach === coach;
                const coachClass = coach.startsWith('H')
                  ? '1A'
                  : coach.startsWith('A')
                  ? '2A'
                  : coach.startsWith('S')
                  ? 'SL'
                  : '3A';

                return (
                  <div key={coach} className="flex flex-col items-center shrink-0 min-w-[50px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCoach(coach);
                        setSelectedBerthNumber(null);
                      }}
                      className={`w-full py-1.5 px-2 rounded-lg font-mono text-sm font-black transition-all cursor-pointer border ${
                        isActive
                          ? 'bg-white text-slate-900 border-2 border-slate-700 ring-2 ring-blue-600 ring-offset-1'
                          : 'bg-[#284a96] text-white border-[#1d356d] hover:bg-[#1e3a8a]'
                      }`}
                    >
                      {coach}
                    </button>
                    <span className="text-[10px] font-bold text-slate-600 mt-1 uppercase">
                      {coachClass}
                    </span>
                    <span className="text-[10px] font-mono font-semibold text-slate-500">
                      {isActive ? coachData?.summary?.fullJourneyCount || 0 : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Loading / Error States */}
        {coachVacancyQuery.isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
        )}

        {coachVacancyQuery.isError && (
          <Card className="p-6 text-center text-rose-600 border border-rose-200 bg-white">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
            <h4 className="text-base font-bold">Failed to Load Coach Vacancy</h4>
            <p className="text-xs text-slate-600 mt-1">
              {coachVacancyQuery.error.message || 'Please verify the station codes and date.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => coachVacancyQuery.refetch()}
              className="mt-4"
            >
              Retry Inspection
            </Button>
          </Card>
        )}

        {/* Coach Data Loaded */}
        {coachData && (
          <div className="space-y-6">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <Card className="p-3.5 sm:p-4 bg-emerald-50/60 border border-emerald-300">
                <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
                  Full Journey Vacancies
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
                    {coachData.summary.fullJourneyCount}
                  </span>
                  <span className="text-xs text-emerald-600">
                    / {coachData.totalBerths} berths
                  </span>
                </div>
              </Card>

              <Card className="p-3.5 sm:p-4 bg-amber-50/60 border border-amber-300">
                <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
                  Partial Vacancies
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-amber-700 font-mono">
                    {coachData.summary.partialCount}
                  </span>
                  <span className="text-xs text-amber-600">
                    segment hops
                  </span>
                </div>
              </Card>

              <Card className="p-3.5 sm:p-4 bg-blue-50/60 border border-blue-300">
                <span className="text-[11px] font-semibold text-blue-800 uppercase tracking-wider block">
                  Lower Berths Free
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-blue-700 font-mono">
                    {coachData.summary.byType.LOWER?.fullJourney || 0}
                  </span>
                  <span className="text-xs text-blue-600">
                    full route
                  </span>
                </div>
              </Card>

              <Card className="p-3.5 sm:p-4 bg-white border border-slate-300">
                <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">
                  Coach Vacancy Rate
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl sm:text-3xl font-black text-slate-800 font-mono">
                    {coachData.summary.vacancyRate}%
                  </span>
                  <span className="text-xs text-slate-500">
                    available
                  </span>
                </div>
              </Card>
            </div>

            {/* Split View: Coach Map & Selected Berth Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left 2 Cols: Interactive Coach Map with Exact IRCTC colors */}
              <div className="lg:col-span-2 space-y-4">
                <CoachMap
                  coachId={coachData.coachId}
                  travelClass={coachData.travelClass}
                  trainNumber={coachData.trainNumber}
                  trainName={coachData.trainName}
                  fromStation={coachData.fromStation}
                  toStation={coachData.toStation}
                  bays={coachData.bays}
                  berths={coachData.berths}
                  selectedBerthNumber={selectedBerthNumber}
                  onSelectBerth={(b) => setSelectedBerthNumber(b.berthNumber)}
                  filterType={filterType}
                  filterStatus={filterStatus}
                  onFilterTypeChange={(t) => setFilterType(t)}
                  onFilterStatusChange={(s) => setFilterStatus(s)}
                />
              </div>

              {/* Right Col: Selected Berth Inspector Panel */}
              <div className="lg:col-span-1 lg:sticky lg:top-20 space-y-4">
                <BerthDetailSheet
                  berth={selectedBerth}
                  trainNumber={coachData.trainNumber}
                  trainName={coachData.trainName}
                  fromStation={coachData.fromStation}
                  toStation={coachData.toStation}
                  journeyDate={coachData.journeyDate}
                  onClose={() => setSelectedBerthNumber(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
