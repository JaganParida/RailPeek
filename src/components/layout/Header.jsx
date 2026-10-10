import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  TrainFront,
  Train,
  Ticket,
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
          <nav className="hidden md:flex items-center gap-2 text-xs font-semibold shrink-0">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                isSearchActive
                  ? 'bg-white text-[#1e3a8a] font-bold shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Train className="w-3.5 h-3.5 text-[#f58220]" />
              <span>Search Trains</span>
            </Link>

            <Link
              to="/pnr"
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                isPnrActive
                  ? 'bg-white text-[#1e3a8a] font-bold shadow-xs'
                  : 'text-blue-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-blue-400" />
              <span>PNR Status</span>
              <span className="text-[9px] font-black bg-[#f58220] text-white px-1.5 py-0.2 rounded uppercase">
                Radar
              </span>
            </Link>

            <div className="h-4 w-px bg-blue-800 mx-1" />

            <a
              href="https://www.irctc.co.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors border border-white/15"
            >
              <span className="hidden lg:inline">Official</span> IRCTC
              <ExternalLink className="w-3 h-3 text-blue-200" />
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

        {/* Sliding Drawer Panel */}
        <div
          className={`fixed inset-y-0 right-0 w-[300px] max-w-[85vw] bg-slate-900 text-white shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#f58220] flex items-center justify-center text-white shrink-0 shadow-xs">
                <TrainFront className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white block">
                  RailPeek
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Indian Railways System
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-slate-700/60"
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
                  ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md shadow-blue-900/40'
                  : 'bg-slate-800/60 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isSearchActive ? 'bg-white/20' : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <Train className="w-4 h-4 text-[#f58220]" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-tight">Search Trains &amp; Berths</div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      isSearchActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    Vacant berths &amp; coach layout
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70 shrink-0" />
            </Link>

            {/* 2. PNR Status & Refund Radar */}
            <Link
              to="/pnr"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full p-3 rounded-xl flex items-center justify-between transition-all border ${
                isPnrActive
                  ? 'bg-blue-600 text-white font-bold border-blue-500 shadow-md shadow-blue-900/40'
                  : 'bg-slate-800/60 text-slate-200 border-slate-800 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isPnrActive ? 'bg-white/20' : 'bg-slate-800 border border-slate-700'
                  }`}
                >
                  <Ticket className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold leading-tight">PNR Status &amp; Radar</span>
                    <span className="text-[9px] font-black bg-[#f58220] text-white px-1.5 py-0.2 rounded uppercase">
                      Radar
                    </span>
                  </div>
                  <div
                    className={`text-[10px] mt-0.5 ${
                      isPnrActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    Chances &amp; IRCTC refund timer
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70 shrink-0" />
            </Link>

            {/* 3. Official IRCTC External Portal */}
            <div className="pt-2">
              <a
                href="https://www.irctc.co.in"
                target="_blank"
                rel="noreferrer"
                className="w-full p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-4 h-4 text-blue-300" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold">Official IRCTC Portal</div>
                    <div className="text-[10px] text-slate-400">irctc.co.in ticket booking</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-40 shrink-0" />
              </a>
            </div>
          </div>

          {/* Drawer Footer Status */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/60 space-y-2">
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span>Live Railway Gateway Active</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Official Indian Railways CRIS live data parity with scientific confirmation math.
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
export default Header;
