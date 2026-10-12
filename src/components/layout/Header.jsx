import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrainFront,
  Train,
  Ticket,
  Compass,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

export function Header() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isSearchActive = location.pathname === '/' || location.pathname === '/find';
  const isPnrActive = location.pathname.startsWith('/pnr');
  const isCoachActive = location.pathname.startsWith('/coach') || location.pathname.startsWith('/chart');

  // Close drawer whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-[#1e3a8a] text-white border-b border-blue-950 select-none shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Application Title */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#f58220] flex items-center justify-center text-white transition-transform group-hover:scale-105 shrink-0 border border-orange-600/30 shadow-xs">
              <TrainFront className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight text-white leading-tight">
                  RailPeek
                </span>
                <span className="text-[11px] sm:text-xs text-blue-200 font-medium hidden xs:inline">
                  | Indian Railways
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-blue-200/90 font-normal truncate hidden sm:block">
                Real-Time Berth Vacancy &amp; Coach Layout Finder
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2.5 lg:gap-3 shrink-0">
            {/* Segmented Navigation Dock */}
            <div className="flex items-center p-1 rounded-xl bg-blue-950/60 border border-blue-800/70 backdrop-blur-xs shadow-inner">
              <Link
                to="/"
                className={`group px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all duration-150 ${
                  isSearchActive
                    ? 'bg-white text-[#1e3a8a] font-bold shadow-xs'
                    : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <Train
                  className={`w-3.5 h-3.5 transition-colors ${
                    isSearchActive ? 'text-[#f58220]' : 'text-blue-300 group-hover:text-orange-400'
                  }`}
                />
                <span>Search Trains</span>
              </Link>

              <Link
                to="/pnr"
                className={`group px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all duration-150 ${
                  isPnrActive
                    ? 'bg-white text-[#1e3a8a] font-bold shadow-xs'
                    : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <Ticket
                  className={`w-3.5 h-3.5 transition-colors ${
                    isPnrActive ? 'text-blue-600' : 'text-blue-300 group-hover:text-blue-200'
                  }`}
                />
                <span>PNR Status</span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded leading-none uppercase tracking-wide transition-colors ${
                    isPnrActive
                      ? 'bg-[#f58220] text-white shadow-2xs'
                      : 'bg-blue-800/80 text-blue-200 group-hover:bg-[#f58220] group-hover:text-white'
                  }`}
                >
                  Radar
                </span>
              </Link>

              <Link
                to="/coach"
                className={`group px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs transition-all duration-150 ${
                  isCoachActive
                    ? 'bg-white text-[#1e3a8a] font-bold shadow-xs'
                    : 'text-blue-100 hover:text-white hover:bg-white/10 font-medium'
                }`}
              >
                <Compass
                  className={`w-3.5 h-3.5 transition-colors ${
                    isCoachActive ? 'text-emerald-600' : 'text-emerald-300 group-hover:text-emerald-200'
                  }`}
                />
                <span>Coach Explorer</span>
              </Link>
            </div>

            {/* Live Gateway Indicator (Large Screens) */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 text-[11px] font-medium select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Radar</span>
            </div>

            <div className="h-5 w-px bg-blue-800/80 mx-0.5" />

            {/* External IRCTC Button */}
            <a
              href="https://www.irctc.co.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white bg-blue-900/50 hover:bg-blue-800/80 px-3 py-1.5 rounded-lg transition-all border border-blue-700/60 hover:border-blue-500 shadow-2xs active:scale-95 group"
              title="Open Official IRCTC Portal"
            >
              <span className="hidden xl:inline text-blue-200 font-normal">Official</span>
              <span>IRCTC</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-200 group-hover:text-white transition-colors" />
            </a>
          </nav>

          {/* Mobile Right Controls: Hamburger Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer border border-white/15 flex items-center justify-center focus:outline-none"
              aria-label={isMobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Small Screen Responsive Side Navbar / Drawer */}
      <div
        className={`fixed inset-0 z-50 md:hidden overflow-hidden transition-all duration-300 ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop Overlay with smooth fade & blur */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sliding Drawer Panel (Clean Professional Light Mode) */}
        <div
          className={`fixed inset-y-0 right-0 w-[310px] max-w-[85vw] bg-white text-slate-900 shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform border-l border-slate-200 ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f58220] flex items-center justify-center text-white shrink-0 shadow-xs">
                <TrainFront className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[#1e3a8a] block">
                  RailPeek
                </span>
                <span className="text-[10px] text-slate-500 block font-semibold">
                  Indian Railways Live Radar
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 shadow-2xs"
              aria-label="Close menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Menu Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1 pb-1">
              Menu &amp; Features
            </div>

            {/* 1. Search Trains & Berths */}
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                isSearchActive
                  ? 'bg-blue-50 text-[#1e3a8a] font-bold border-blue-300 shadow-xs ring-1 ring-blue-200'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isSearchActive
                      ? 'bg-[#1e3a8a] text-white shadow-xs'
                      : 'bg-orange-50 text-[#f58220] border border-orange-200/60'
                  }`}
                >
                  <Train className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className={`text-xs font-bold leading-tight ${isSearchActive ? 'text-[#1e3a8a]' : 'text-slate-900'}`}>
                    Search Trains &amp; Berths
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isSearchActive ? 'text-blue-700 font-semibold' : 'text-slate-500'}`}>
                    Vacant berths &amp; coach layout
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${isSearchActive ? 'text-[#1e3a8a]' : 'text-slate-400'}`} />
            </Link>

            {/* 2. PNR Status & Refund Radar */}
            <Link
              to="/pnr"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                isPnrActive
                  ? 'bg-blue-50 text-[#1e3a8a] font-bold border-blue-300 shadow-xs ring-1 ring-blue-200'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isPnrActive
                      ? 'bg-[#1e3a8a] text-white shadow-xs'
                      : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                  }`}
                >
                  <Ticket className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold leading-tight ${isPnrActive ? 'text-[#1e3a8a]' : 'text-slate-900'}`}>
                      PNR Status &amp; Radar
                    </span>
                    <span className="text-[9px] font-black bg-[#f58220] text-white px-1.5 py-0.2 rounded uppercase">
                      Radar
                    </span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isPnrActive ? 'text-blue-700 font-semibold' : 'text-slate-500'}`}>
                    Chances &amp; IRCTC refund timer
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${isPnrActive ? 'text-[#1e3a8a]' : 'text-slate-400'}`} />
            </Link>

            {/* 3. Coach Layout Explorer */}
            <Link
              to="/coach"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                isCoachActive
                  ? 'bg-blue-50 text-[#1e3a8a] font-bold border-blue-300 shadow-xs ring-1 ring-blue-200'
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isCoachActive
                      ? 'bg-[#1e3a8a] text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className={`text-xs font-bold leading-tight ${isCoachActive ? 'text-[#1e3a8a]' : 'text-slate-900'}`}>
                    Coach Layout Explorer
                  </div>
                  <div className={`text-[10px] mt-0.5 ${isCoachActive ? 'text-blue-700 font-semibold' : 'text-slate-500'}`}>
                    Interactive seat maps &amp; berths
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 ${isCoachActive ? 'text-[#1e3a8a]' : 'text-slate-400'}`} />
            </Link>

            {/* 4. Official IRCTC External Portal */}
            <div className="pt-2">
              <a
                href="https://www.irctc.co.in"
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 border border-slate-200/90 flex items-center justify-between transition-colors shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <ExternalLink className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold text-slate-900">Official IRCTC Portal</div>
                    <div className="text-[10px] text-slate-500">irctc.co.in ticket booking</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </a>
            </div>
          </div>

          {/* Drawer Footer Status */}
          <div className="p-4 border-t border-slate-200 bg-slate-50/90 space-y-2">
            <div className="inline-flex items-center gap-2 text-[11px] text-emerald-800 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>Live Railway Gateway Active</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              Official Indian Railways CRIS live data parity with scientific confirmation math.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
