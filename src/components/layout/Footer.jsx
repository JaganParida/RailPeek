import { Link } from 'react-router-dom';
import { TrainFront, Shield, ExternalLink, Ticket, Compass } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Brand info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-[#214488] flex items-center justify-center text-white">
                <TrainFront className="w-4 h-4" />
              </div>
              <span className="font-black text-base text-[#214488]">RailPeek</span>
            </div>
            <p className="text-xs text-slate-600 max-w-sm leading-relaxed">
              Indian Railways Journey-Aware Berth &amp; Vacancy Discovery platform.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>Independent utility &bull; 100% Free &bull; No Login Required</span>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li>
                <Link
                  to="/"
                  className="hover:text-[#214488] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <TrainFront className="w-3.5 h-3.5 text-slate-400" />
                  Search Trains &amp; Seats
                </Link>
              </li>
              <li>
                <Link
                  to="/pnr"
                  className="hover:text-[#214488] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Ticket className="w-3.5 h-3.5 text-slate-400" />
                  PNR Status &amp; Prediction
                </Link>
              </li>
              <li>
                <Link
                  to="/coach"
                  className="hover:text-[#214488] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  Coach Layout &amp; Vacancy
                </Link>
              </li>
            </ul>
          </div>

          {/* Official IRCTC Link */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Official IRCTC Booking
            </h4>
            <p className="text-xs text-slate-500 mb-2 leading-relaxed">
              Ticket booking must always be confirmed on the official IRCTC portal.
            </p>
            <a
              href="https://www.irctc.co.in"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#214488] hover:underline"
            >
              IRCTC Official Portal
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} RailPeek. Designed for accuracy &amp; speed.</p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-600">System Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
