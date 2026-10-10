import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  Search,
  Train,
  ArrowLeftRight,
  ArrowUpDown,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { DatePicker, formatISODate } from '@/components/ui/DatePicker';
import { StationAutocomplete, POPULAR_STATIONS } from '@/components/ui/StationAutocomplete';

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Helper to read cached or passed search data
  const getInitialSearchData = () => {
    // 1. URL search params (e.g. ?from=BBS&to=ANVT&date=...)
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlDate = searchParams.get('date');
    const urlClass = searchParams.get('class');
    const urlTrain = searchParams.get('train');
    if (urlFrom || urlTo) {
      return {
        from: urlFrom || '',
        to: urlTo || '',
        date: urlDate || '',
        class: urlClass || 'SL',
        train: urlTrain || 'ALL',
      };
    }

    // 2. React Router navigation state (from SearchResultsPage "Back" or "Modify Search")
    if (location.state?.from || location.state?.to) {
      return {
        from: location.state.from || '',
        to: location.state.to || '',
        date: location.state.date || '',
        class: location.state.travelClass || location.state.class || 'SL',
        train: location.state.train || 'ALL',
      };
    }

    // 3. Persistent session storage
    try {
      const stored = sessionStorage.getItem('railpeek_last_search');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (_e) {
      // Storage access unavailable or blocked
    }

    return null;
  };

  const initial = getInitialSearchData();

  const [fromCode, setFromCode] = useState(initial?.from || '');
  const [fromLabel, setFromLabel] = useState(initial?.fromLabel || initial?.from || '');
  const [toCode, setToCode] = useState(initial?.to || '');
  const [toLabel, setToLabel] = useState(initial?.toLabel || initial?.to || '');
  const [fromError, setFromError] = useState('');
  const [toError, setToError] = useState('');

  // Default journey date is TODAY as requested
  const [journeyDate, setJourneyDate] = useState(() => {
    if (initial?.date) return initial.date;
    return formatISODate(new Date());
  });

  const [travelClass, setTravelClass] = useState(initial?.class || 'SL');
  const [selectedTrain, setSelectedTrain] = useState(initial?.train || 'ALL');
  const [customTrain, setCustomTrain] = useState(initial?.customTrain || '');

  // Synchronize if location.state changes
  useEffect(() => {
    if (location.state?.from) {
      setFromCode(location.state.from);
      setFromLabel(location.state.from);
    }
    if (location.state?.to) {
      setToCode(location.state.to);
      setToLabel(location.state.to);
    }
    if (location.state?.date) {
      setJourneyDate(location.state.date);
    }
    if (location.state?.travelClass || location.state?.class) {
      setTravelClass(location.state.travelClass || location.state.class);
    }
    if (location.state?.train) {
      setSelectedTrain(location.state.train);
    }
  }, [location.state]);

  const handleSwapStations = () => {
    const tempCode = fromCode;
    const tempLabel = fromLabel;
    setFromCode(toCode);
    setFromLabel(toLabel);
    setToCode(tempCode);
    setToLabel(tempLabel);
    setFromError('');
    setToError('');
    setSelectedTrain('ALL');
    setCustomTrain('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFromError('');
    setToError('');

    let finalFrom = fromCode;
    let finalTo = toCode;

    // Helper to resolve a station string into a station code
    const resolveCode = (code, label) => {
      if (code && code.trim().length >= 2) return code.trim().toUpperCase();
      if (!label || !label.trim()) return '';

      const trimmed = label.trim();
      if (trimmed.includes(' - ')) {
        return trimmed.split(' - ')[0].trim().toUpperCase();
      }

      const upper = trimmed.toUpperCase();
      const codeMatch = POPULAR_STATIONS.find((s) => s.code === upper);
      if (codeMatch) return codeMatch.code;

      const nameMatch = POPULAR_STATIONS.find(
        (s) =>
          s.name.toUpperCase().includes(upper) ||
          upper.includes(s.name.toUpperCase()) ||
          s.city.toUpperCase().includes(upper)
      );
      if (nameMatch) return nameMatch.code;

      if (/^[A-Za-z]{2,5}$/.test(trimmed)) {
        return trimmed.toUpperCase();
      }

      return '';
    };

    finalFrom = resolveCode(finalFrom, fromLabel);
    finalTo = resolveCode(finalTo, toLabel);

    if (!finalFrom) {
      setFromError('Please enter or select a valid origin station (e.g. BBS, JER, NDLS)');
      return;
    }
    if (!finalTo) {
      setToError('Please enter or select a valid destination station (e.g. DDU, NDLS, BBS)');
      return;
    }
    if (finalFrom === finalTo) {
      setToError('Origin and destination stations cannot be identical');
      return;
    }

    const finalTrain = selectedTrain === 'CUSTOM' ? customTrain.trim() : selectedTrain;

    // Cache the search so returning auto-fills seamlessly
    try {
      sessionStorage.setItem('railpeek_last_search', JSON.stringify({
        from: finalFrom,
        fromLabel: fromLabel || finalFrom,
        to: finalTo,
        toLabel: toLabel || finalTo,
        date: journeyDate,
        class: travelClass,
        train: finalTrain || 'ALL',
        customTrain: customTrain,
      }));
    } catch (_e) {
      // Storage access unavailable or blocked
    }

    const params = new URLSearchParams({
      from: finalFrom,
      to: finalTo,
      date: journeyDate,
      class: travelClass,
    });

    if (finalTrain && finalTrain !== 'ALL') {
      params.set('train', finalTrain);
    }

    navigate(`/find?${params.toString()}`);
  };

  return (
    <div className="bg-[#f8fafc] min-h-[calc(100vh-4rem)] text-slate-900 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Main Search Card (Crisp Borders, No Box Shadow) */}
        <div className="bg-white rounded-xl border border-slate-300 overflow-hidden">
          {/* Card Header Strip */}
          <div className="bg-[#1e3a8a] text-white px-6 py-4 flex items-center justify-between border-b border-blue-900">
            <div className="flex items-center gap-2.5">
              <Train className="w-5 h-5 text-[#f58220]" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight">
                Search Trains &amp; Seat Availability
              </h1>
            </div>
            <span className="text-xs text-blue-200 font-medium hidden sm:inline">
              Official IRCTC Parity
            </span>
          </div>

          <form onSubmit={handleSearch} className="p-6 sm:p-8 space-y-6">
            {/* Row 1: Origin & Destination with Dedicated Centered Swap Button */}
            <div className="flex flex-col md:flex-row items-stretch md:items-end gap-3 md:gap-4">
              {/* Origin Station */}
              <div className="flex-1 min-w-0">
                <StationAutocomplete
                  label="From Station"
                  value={fromLabel}
                  error={fromError}
                  onChange={(code, station, rawText) => {
                    setFromError('');
                    setFromCode(code);
                    setFromLabel(rawText || (station ? `${station.code} - ${station.name}` : code));
                    setSelectedTrain('ALL');
                    setCustomTrain('');
                  }}
                  placeholder="Origin station name or code (e.g. BBS, JER)..."
                  required
                />
              </div>

              {/* Dedicated Swap Button with generous breathing room */}
              <div className="flex justify-center shrink-0">
                <button
                  type="button"
                  onClick={handleSwapStations}
                  className="w-10 h-10 md:w-11 md:h-11 rounded-full border border-slate-300 bg-white hover:bg-blue-50 hover:border-[#1e3a8a] text-slate-600 hover:text-[#1e3a8a] flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/20 shadow-2xs"
                  title="Swap stations"
                  aria-label="Swap origin and destination stations"
                >
                  <ArrowUpDown className="w-4 h-4 md:hidden" />
                  <ArrowLeftRight className="w-4 h-4 hidden md:block" />
                </button>
              </div>

              {/* Destination Station */}
              <div className="flex-1 min-w-0">
                <StationAutocomplete
                  label="To Station"
                  value={toLabel}
                  error={toError}
                  onChange={(code, station, rawText) => {
                    setToError('');
                    setToCode(code);
                    setToLabel(rawText || (station ? `${station.code} - ${station.name}` : code));
                    setSelectedTrain('ALL');
                    setCustomTrain('');
                  }}
                  placeholder="Destination station name or code (e.g. DDU, NDLS)..."
                  required
                />
              </div>
            </div>

            {/* Row 2: Date, Travel Class, and Train (Perfect Top-Baseline Alignment) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 items-start">
              {/* Journey Date */}
              <div className="w-full">
                <DatePicker
                  label="Journey Date"
                  value={journeyDate}
                  onChange={(newDate) => setJourneyDate(newDate)}
                />
              </div>

              {/* Travel Class */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5 h-5">
                  <label className="block text-xs font-semibold text-slate-800 select-none whitespace-nowrap">
                    Travel Class
                  </label>
                </div>
                <select
                  value={travelClass}
                  onChange={(e) => setTravelClass(e.target.value)}
                  className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 transition-all"
                >
                  <option value="SL">Sleeper (SL)</option>
                  <option value="3A">AC 3 Tier (3A)</option>
                  <option value="2A">AC 2 Tier (2A)</option>
                  <option value="1A">AC First Class (1A)</option>
                  <option value="2S">Second Sitting (2S)</option>
                  <option value="CC">AC Chair Car (CC)</option>
                </select>
              </div>

              {/* Train Selection */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-1.5 h-5">
                  <label className="block text-xs font-semibold text-slate-800 select-none whitespace-nowrap">
                    Train (Optional)
                  </label>
                </div>
                <select
                  value={selectedTrain}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedTrain(val);
                    if (val !== 'CUSTOM') setCustomTrain('');
                  }}
                  className="w-full h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 transition-all"
                >
                  <option value="ALL">All Trains on Route</option>
                  {selectedTrain && selectedTrain !== 'ALL' && selectedTrain !== 'CUSTOM' && (
                    <option value={selectedTrain}>Train {selectedTrain}</option>
                  )}
                  <option value="CUSTOM">Specific Train Number...</option>
                </select>

                {selectedTrain === 'CUSTOM' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      maxLength={5}
                      value={customTrain}
                      onChange={(e) => setCustomTrain(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 5-digit number (e.g. 12819)"
                      className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs font-mono font-bold text-slate-900 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Search Action Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full h-12 rounded-lg bg-[#f58220] hover:bg-[#e05a10] text-white font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#f58220]/40 border border-orange-600/30"
              >
                <Search className="w-4 h-4 text-white" />
                <span>
                  {selectedTrain && selectedTrain !== 'ALL' && (selectedTrain !== 'CUSTOM' || customTrain.trim())
                    ? `Search Train ${selectedTrain === 'CUSTOM' ? customTrain.trim() : selectedTrain} Berths`
                    : 'Search Trains & Berths'}
                </span>
              </button>
            </div>

            {/* Information Footer */}
            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  First Chart Preparation: Finalized 4 hours before scheduled departure.
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Free &bull; No Login Required
              </span>
            </div>
          </form>
        </div>

        {/* Official IRCTC Reservation Chart Preparation Lifecycle & Timeline */}
        <div className="mt-8 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#1e3a8a]" />
              <span>How IRCTC Reservation Charts Work (Official Timeline)</span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
              Official Indian Railways System
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Stage 1 */}
            <div className="p-4 rounded-xl border border-slate-300 bg-white space-y-2 hover:border-[#1e3a8a] transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-[#1e3a8a]">
                  Step 1 &bull; 4h Before
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                First Chart Preparation
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                4 hours before departure from the originating station, IRCTC finalizes waitlists and generates the first chart showing all vacant berths.
              </p>
            </div>

            {/* Stage 2 */}
            <div className="p-4 rounded-xl border border-slate-300 bg-white space-y-2 hover:border-amber-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  Step 2 &bull; 4h to 30m
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                Current Booking Window
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Vacant berths after First Chart become bookable on IRCTC at current booking counters and online until 30 minutes before departure.
              </p>
            </div>

            {/* Stage 3 */}
            <div className="p-4 rounded-xl border border-slate-300 bg-white space-y-2 hover:border-emerald-500 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                  Step 3 &bull; 30m Before
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                Second &amp; Final Chart
              </h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                30 minutes before departure, IRCTC processes last-minute cancellations and hands over final charts to the Train TTE via Handheld Terminals (HHT).
              </p>
            </div>
          </div>
        </div>

        {/* Official IRCTC Berth Status Color Code Legend */}
        <div className="mt-8 p-4 rounded-xl border border-slate-300 bg-white text-xs">
          <div className="font-bold text-slate-800 mb-2.5 uppercase tracking-wider text-[11px]">
            Official IRCTC Berth Status Color Codes
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded border border-slate-300 bg-[#dbe5f1] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Full Journey Reserved</div>
                <div className="text-[11px] text-slate-500">Reserved for the complete route from origin to destination</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded border border-slate-300 bg-[#fed766] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Part Journey Reserved</div>
                <div className="text-[11px] text-slate-500">Reserved for a segment; vacant for remaining stops</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-4 h-4 rounded border border-slate-300 bg-[#86efac] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-slate-900">Full Journey Available</div>
                <div className="text-[11px] text-slate-500">Completely vacant for the entire journey</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
