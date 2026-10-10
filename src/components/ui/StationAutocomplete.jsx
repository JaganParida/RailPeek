import { useState, useEffect, useRef } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const POPULAR_STATIONS = [
  { code: 'BBS', name: 'Bhubaneswar', city: 'Bhubaneswar', state: 'Odisha' },
  { code: 'NDLS', name: 'New Delhi', city: 'New Delhi', state: 'Delhi' },
  { code: 'JER', name: 'Jaleswar', city: 'Jaleswar', state: 'Odisha' },
  { code: 'DDU', name: 'Pt. Deen Dayal Upadhyaya Jn', city: 'Mughalsarai', state: 'Uttar Pradesh' },
  { code: 'BLS', name: 'Baleshwar', city: 'Balasore', state: 'Odisha' },
  { code: 'TATA', name: 'Tatanagar Junction', city: 'Jamshedpur', state: 'Jharkhand' },
  { code: 'CTC', name: 'Cuttack Junction', city: 'Cuttack', state: 'Odisha' },
  { code: 'HWH', name: 'Howrah Junction', city: 'Kolkata', state: 'West Bengal' },
  { code: 'CNB', name: 'Kanpur Central', city: 'Kanpur', state: 'Uttar Pradesh' },
  { code: 'PRYJ', name: 'Prayagraj Junction', city: 'Prayagraj', state: 'Uttar Pradesh' },
  { code: 'GAYA', name: 'Gaya Junction', city: 'Gaya', state: 'Bihar' },
  { code: 'PURI', name: 'Puri', city: 'Puri', state: 'Odisha' },
  { code: 'KGP', name: 'Kharagpur Junction', city: 'Kharagpur', state: 'West Bengal' },
  { code: 'MMCT', name: 'Mumbai Central', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'CSMT', name: 'Mumbai CSMT', city: 'Mumbai', state: 'Maharashtra' },
  { code: 'PUNE', name: 'Pune Junction', city: 'Pune', state: 'Maharashtra' },
  { code: 'MAS', name: 'Chennai Central', city: 'Chennai', state: 'Tamil Nadu' },
  { code: 'SBC', name: 'KSR Bengaluru', city: 'Bengaluru', state: 'Karnataka' },
  { code: 'PNBE', name: 'Patna Junction', city: 'Patna', state: 'Bihar' },
  { code: 'LKO', name: 'Lucknow Charbagh', city: 'Lucknow', state: 'Uttar Pradesh' },
  { code: 'BSB', name: 'Varanasi Junction', city: 'Varanasi', state: 'Uttar Pradesh' },
  { code: 'ADI', name: 'Ahmedabad Junction', city: 'Ahmedabad', state: 'Gujarat' },
  { code: 'SC', name: 'Secunderabad Junction', city: 'Secunderabad', state: 'Telangana' },
  { code: 'BPL', name: 'Bhopal Junction', city: 'Bhopal', state: 'Madhya Pradesh' },
];

let clientStationsCache = null;
let clientStationsLoadingPromise = null;

export async function getClientStations() {
  if (clientStationsCache) return clientStationsCache;
  if (!clientStationsLoadingPromise) {
    clientStationsLoadingPromise = fetch('/stations.json')
      .then((res) => {
        if (!res.ok) throw new Error('stations.json not accessible');
        return res.json();
      })
      .then((data) => {
        clientStationsCache = data.map((item) => ({
          code: item.c,
          name: item.n,
          city: item.t,
          state: item.s,
          aliases: item.a || [],
          isMajor: Boolean(item.m),
        }));
        return clientStationsCache;
      })
      .catch(() => null);
  }
  return clientStationsLoadingPromise;
}

if (typeof window !== 'undefined') {
  getClientStations();
}

export function searchStationsInMemory(stations, query, limit = 15) {
  if (!stations || !query || query.trim().length < 2) return [];
  const q = query.trim().toUpperCase();

  const scored = [];
  for (let i = 0; i < stations.length; i++) {
    const s = stations[i];
    const code = s.code.toUpperCase();
    const name = s.name.toUpperCase();
    const city = (s.city || '').toUpperCase();
    const aliases = (s.aliases || []).map((a) => a.toUpperCase());
    const isMajor = s.isMajor;

    let score = 0;
    if (code === q) {
      score = isMajor ? 1500 : 1000;
    } else if (isMajor && name.startsWith(q)) {
      score = 1200;
    } else if (isMajor && aliases.some((a) => a === q)) {
      score = 1100;
    } else if (code.startsWith(q)) {
      score = 800 - (code.length - q.length) * 10 + (isMajor ? 50 : 0);
    } else if (name === q) {
      score = 700 + (isMajor ? 50 : 0);
    } else if (name.startsWith(q)) {
      score = 600 + (isMajor ? 50 : 0);
    } else if (aliases.some((a) => a === q)) {
      score = 550 + (isMajor ? 50 : 0);
    } else if (city.startsWith(q)) {
      score = 500 + (isMajor ? 50 : 0);
    } else if (name.split(/\s+/).some((w) => w.startsWith(q))) {
      score = 400 + (isMajor ? 50 : 0);
    } else if (aliases.some((a) => a.startsWith(q))) {
      score = 350 + (isMajor ? 50 : 0);
    } else if (code.includes(q)) {
      score = 200 + (isMajor ? 20 : 0);
    } else if (name.includes(q)) {
      score = 150 + (isMajor ? 20 : 0);
    } else if (city.includes(q)) {
      score = 100 + (isMajor ? 20 : 0);
    } else if (aliases.some((a) => a.includes(q))) {
      score = 80 + (isMajor ? 20 : 0);
    }

    if (score > 0) {
      score -= Math.min(name.length, 50) * 0.1;
      scored.push({ s, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((item) => item.s);
}

export function StationAutocomplete({
  label,
  value,
  onChange,
  placeholder = 'Search station name or code (e.g. BBS, JER, NDLS)...',
  error,
  className,
  required = false,
}) {
  const [query, setQuery] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState(POPULAR_STATIONS);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Sync external value changes
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Clean up timer and controller on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchStations = async (searchTerm) => {
    const term = searchTerm.trim();
    if (term.length < 2) {
      setResults(POPULAR_STATIONS);
      setIsLoading(false);
      return;
    }

    // 1. Instant in-memory search across all 10,600+ stations if cache loaded
    const stations = clientStationsCache || (await getClientStations());
    if (stations && stations.length > 0) {
      const matches = searchStationsInMemory(stations, term, 15);
      if (matches.length > 0) {
        setResults(matches);
        const upper = term.toUpperCase();
        const codeMatch = matches.find((s) => s.code === upper);
        if (codeMatch && onChange) {
          onChange(codeMatch.code, codeMatch, searchTerm);
        }
        setIsLoading(false);
        return;
      }
    }

    // 2. Fetch from backend API
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      const res = await fetch(`/api/v1/stations/search?q=${encodeURIComponent(term)}&limit=15`, {
        signal: abortControllerRef.current.signal,
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setResults(json.data);
          const upper = term.toUpperCase();
          const codeMatch = json.data.find((s) => s.code === upper);
          if (codeMatch && onChange) {
            onChange(codeMatch.code, codeMatch, searchTerm);
          }
          return;
        }
      }
      const upper = term.toUpperCase();
      const filtered = POPULAR_STATIONS.filter(
        (s) =>
          s.code.includes(upper) ||
          s.name.toUpperCase().includes(upper) ||
          s.city.toUpperCase().includes(upper)
      );
      setResults(filtered);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const upper = term.toUpperCase();
      setResults(
        POPULAR_STATIONS.filter(
          (s) => s.code.includes(upper) || s.name.toUpperCase().includes(upper)
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (station) => {
    const formatted = `${station.code} - ${station.name}`;
    setQuery(formatted);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onChange) {
      onChange(station.code, station, formatted);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    setSelectedIndex(-1);

    if (!val.trim()) {
      setResults(POPULAR_STATIONS);
      if (onChange) onChange('', null, '');
      return;
    }

    const upper = val.trim().toUpperCase();
    const stationsList = clientStationsCache || POPULAR_STATIONS;
    const directCodeMatch = stationsList.find((s) => s.code === upper);
    if (directCodeMatch) {
      if (onChange) onChange(directCodeMatch.code, directCodeMatch, val);
    } else {
      if (onChange) onChange('', null, val);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (clientStationsCache) {
      searchStations(val);
    } else {
      debounceTimerRef.current = setTimeout(() => {
        searchStations(val);
      }, 100);
    }
  };

  const handleBlur = () => {
    if (query.trim() && results.length > 0) {
      const upper = query.trim().toUpperCase();
      const directMatch =
        results.find((s) => s.code === upper || s.name.toUpperCase() === upper) ||
        (results.length === 1 ? results[0] : null);

      if (directMatch && !query.includes(' - ')) {
        const formatted = `${directMatch.code} - ${directMatch.name}`;
        setQuery(formatted);
        if (onChange) {
          onChange(directMatch.code, directMatch, formatted);
        }
      }
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setIsOpen(true);
      return;
    }

    if (!isOpen) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      } else if (results.length > 0) {
        e.preventDefault();
        handleSelect(results[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults(POPULAR_STATIONS);
    setIsOpen(true);
    setSelectedIndex(-1);
    if (onChange) {
      onChange('', null, '');
    }
  };

  const handleFocus = () => {
    if (query.trim().length >= 2) {
      searchStations(query.trim());
    } else {
      setResults(POPULAR_STATIONS);
    }
    setIsOpen(true);
  };

  return (
    <div className={cn('w-full relative', className)} ref={containerRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-800 mb-1.5 select-none">
          {label} {required && <span className="text-rose-600">*</span>}
        </label>
      )}

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#214488]" />
          ) : (
            <MapPin className="w-4 h-4 text-[#214488]" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          className={cn(
            'w-full h-11 rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#1e3a8a] focus:outline-none focus:ring-2 focus:ring-[#1e3a8a]/15 transition-all',
            error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/15'
          )}
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />

        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none cursor-pointer"
            aria-label="Clear station"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}

      {/* Dropdown Results */}
      {isOpen && (
        <ul className="absolute z-50 left-0 right-0 mt-1 max-h-64 overflow-auto rounded-lg border-2 border-slate-400 bg-white py-1 text-sm">
          <div className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none border-b border-slate-100">
            {query.trim().length >= 2 ? 'Matching Stations' : 'Popular Stations'}
          </div>

          {results.length === 0 ? (
            <div className="px-3.5 py-3 text-xs text-slate-500 text-center select-none">
              No station found matching &ldquo;<span className="font-semibold text-slate-700">{query}</span>&rdquo;
            </div>
          ) : (
            results.map((station, idx) => (
              <li
                key={`${station.code}-${idx}`}
                onClick={() => handleSelect(station)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={cn(
                  'px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-colors border-b border-slate-50 last:border-b-0',
                  selectedIndex === idx
                    ? 'bg-blue-50 text-[#1e3a8a]'
                    : 'hover:bg-slate-50 text-slate-800'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-[#1e3a8a] border border-slate-300">
                    {station.code}
                  </span>
                  <span className="font-semibold text-slate-900">{station.name}</span>
                </div>
                <span className="text-xs text-slate-500 font-normal">
                  {station.city ? `${station.city}, ` : ''}{station.state || 'India'}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
