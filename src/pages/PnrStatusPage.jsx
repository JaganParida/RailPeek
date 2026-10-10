import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Ticket,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Train,
  Sparkles,
  Info,
  IndianRupee,
  RotateCw,
  Zap,
  Trash2,
  BookmarkCheck,
  X,
  ChevronRight,
  Share2,
  Copy,
  Check,
  MessageCircle,
  MapPin,
  Calendar,
  Download,
  FileImage,
} from 'lucide-react';
import {
  generateTicketCanvas,
  generateTicketImageBlob,
  downloadTicketImage,
} from '../utils/generateTicketImage';

const LOCAL_STORAGE_KEY = 'railpeek_saved_pnrs';

function normalizeDateForUrl(dateStr) {
  if (!dateStr) return '';
  const parts = String(dateStr).trim().split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) return dateStr; // YYYY-MM-DD
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`; // DD-MM-YYYY -> YYYY-MM-DD
  }
  return dateStr;
}

export function PnrStatusPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPnr = searchParams.get('pnr') || '';

  const [pnrInput, setPnrInput] = useState(initialPnr);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [refreshNotice, setRefreshNotice] = useState('');
  const [error, setError] = useState('');
  const [pnrData, setPnrData] = useState(null);
  const [savedPnrs, setSavedPnrs] = useState([]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);
  const [showBoardingInfo, setShowBoardingInfo] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [ticketPreviewUrl, setTicketPreviewUrl] = useState('');

  // Load user's private saved PNRs from local browser storage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setSavedPnrs(JSON.parse(stored));
      }
    } catch (_e) {
      // LocalStorage access unavailable
    }
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Lock body scroll when saved tickets drawer is open
  useEffect(() => {
    if (isSavedDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isSavedDrawerOpen]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSavedDrawerOpen(false);
        setIsShareModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Generate ticket preview whenever share modal opens
  useEffect(() => {
    if (isShareModalOpen && pnrData) {
      try {
        const canvas = generateTicketCanvas(pnrData);
        if (canvas) {
          setTicketPreviewUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        setTicketPreviewUrl('');
      }
    } else {
      setTicketPreviewUrl('');
    }
  }, [isShareModalOpen, pnrData]);

  // Saves queried PNR strictly into user's own private browser storage
  const savePnrLocally = (data) => {
    if (!data || !data.pnrNumber) return;
    try {
      const primaryStatus = data.passengers?.[0]?.currentStatus || 'WL';
      const existing = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      const filtered = existing.filter((item) => item.pnrNumber !== data.pnrNumber);
      const newItem = {
        pnrNumber: data.pnrNumber,
        trainNumber: data.trainNumber,
        trainName: data.trainName,
        fromStation: data.fromStation,
        toStation: data.toStation,
        fromStationName: data.fromStationName || data.fromStation,
        toStationName: data.toStationName || data.toStation,
        journeyDate: data.journeyDate,
        travelClass: data.travelClass,
        currentStatus: primaryStatus,
        savedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...filtered].slice(0, 8); // Keep last 8 tickets
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setSavedPnrs(updated);
    } catch (_e) {
      // LocalStorage access unavailable
    }
  };

  const deleteSavedPnr = (pnrToDelete) => {
    try {
      const updated = savedPnrs.filter((item) => item.pnrNumber !== pnrToDelete);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setSavedPnrs(updated);
    } catch (_e) {
      // LocalStorage access unavailable
    }
  };

  const clearAllSavedPnrs = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setSavedPnrs([]);
    } catch (_e) {
      // LocalStorage access unavailable
    }
  };

  const formatDisplayTime = (timeStr) => {
    if (!timeStr || timeStr === '--' || timeStr === '--:--') return '--';
    const clean = String(timeStr).trim();
    if (/am|pm/i.test(clean)) return clean;
    const match = clean.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return clean;
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const padH = String(hours).padStart(2, '0');
    return `${padH}:${minutes} ${ampm}`;
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr || dateStr === '--') return '--';
    const dmyMatch = String(dateStr).match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dmyMatch) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = parseInt(dmyMatch[1], 10);
      const month = months[parseInt(dmyMatch[2], 10) - 1] || dmyMatch[2];
      const year = dmyMatch[3];
      return `${day} ${month} ${year}`;
    }
    const ymdMatch = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (ymdMatch) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = parseInt(ymdMatch[3], 10);
      const month = months[parseInt(ymdMatch[2], 10) - 1] || ymdMatch[2];
      const year = ymdMatch[1];
      return `${day} ${month} ${year}`;
    }
    return dateStr;
  };

  const getBerthTypeLabel = (code) => {
    if (!code || code === '--') return '--';
    const c = String(code).toUpperCase().trim();
    const map = {
      WS: 'Window Seat',
      L: 'Lower Berth',
      LB: 'Lower Berth',
      LOWER: 'Lower Berth',
      M: 'Middle Berth',
      MB: 'Middle Berth',
      MIDDLE: 'Middle Berth',
      U: 'Upper Berth',
      UB: 'Upper Berth',
      UPPER: 'Upper Berth',
      SL: 'Side Lower',
      SUB: 'Side Lower',
      'SIDE LOWER': 'Side Lower',
      SU: 'Side Upper',
      'SIDE UPPER': 'Side Upper',
      SM: 'Side Middle',
      'SIDE MIDDLE': 'Side Middle',
      CB: 'Cabin',
      CP: 'Coupe',
      AS: 'Aisle Seat',
      MS: 'Middle Seat',
    };
    return map[c] || code;
  };

  const getCleanStatusLabel = (currentStatus) => {
    if (!currentStatus) return 'Unknown';
    const s = String(currentStatus).toUpperCase().trim();
    if (s.startsWith('CNF') || s.startsWith('CONFIRM')) {
      return 'Confirmed';
    }
    return currentStatus;
  };

  const formatShareSummary = (pnr) => {
    if (!pnr) return '';
    const paxDetails = (pnr.passengers || [])
      .map((p) => {
        const isCnf = p.currentStatus.startsWith('CNF') || p.currentStatus.startsWith('CONFIRM');
        const statusLabel = isCnf ? 'Confirmed' : p.currentStatus;
        const seatInfo = isCnf
          ? `Coach ${p.coach || '--'}, Berth ${p.berthNumber || '--'} (${getBerthTypeLabel(p.berthType)})`
          : '';
        return `  • Passenger ${p.passengerNumber}: ${statusLabel}${seatInfo ? ` · ${seatInfo}` : ''}`;
      })
      .join('\n');

    const boardingLine =
      pnr.boardingStation && pnr.boardingStation !== pnr.fromStation
        ? `\n*Official Boarding Point:* ${pnr.boardingStation} (${pnr.boardingStationName}) — Dep: ${formatDisplayTime(pnr.departureTime)}${pnr.platform && pnr.platform !== '--' ? ` (Platform ${pnr.platform})` : ''}`
        : '';

    const refundLine = pnr.refund
      ? `\n*IRCTC REFUND RADAR:*` +
        `\n  • Cancel Now: ₹${pnr.refund.refundAmount} (Deduction: ₹${pnr.refund.deductionAmount})` +
        (pnr.refund.nextSlabRefundAmount !== undefined
          ? `\n  • Next Cutoff: ${pnr.refund.cutoffDateTime || '--'} (Refund: ₹${pnr.refund.nextSlabRefundAmount})`
          : '')
      : '';

    return (
      `*RAILPEEK · LIVE PNR STATUS*\n` +
      `────────────────────────────\n` +
      `*PNR:* ${pnr.pnrNumber}\n` +
      `*Train:* ${pnr.trainNumber} - ${pnr.trainName}\n` +
      `*Route:* ${pnr.fromStation} (${pnr.fromStationName || pnr.fromStation}) -> ${pnr.toStation} (${pnr.toStationName || pnr.toStation})` +
      `${boardingLine}\n` +
      `*Journey Date:* ${formatDisplayDate(pnr.journeyDate)} · Dep: ${formatDisplayTime(pnr.departureTime)}${pnr.platform && pnr.platform !== '--' ? ` (Platform ${pnr.platform})` : ''}\n` +
      `*Class:* ${pnr.travelClass} · *Quota:* ${pnr.quota}\n` +
      `*Chart Status:* ${pnr.chartPrepared ? 'Chart Prepared' : 'Chart Not Prepared'}\n` +
      `\n*PASSENGERS:*\n${paxDetails}\n` +
      `${refundLine}\n` +
      `\n*Track Live on RailPeek:*\n` +
      `${window.location.origin}/pnr?pnr=${pnr.pnrNumber}\n` +
      `────────────────────────────`
    );
  };

  const handleShareWhatsApp = () => {
    if (!pnrData) return;
    const text = formatShareSummary(pnrData);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopySummary = async () => {
    if (!pnrData) return;
    const text = formatShareSummary(pnrData);
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2500);
    }
  };

  const handleShareTicketImage = async () => {
    if (!pnrData) return;
    setIsGeneratingImage(true);
    try {
      const blob = await generateTicketImageBlob(pnrData);
      if (!blob) {
        downloadTicketImage(pnrData);
        setIsGeneratingImage(false);
        return;
      }
      const file = new File([blob], `RailPeek-PNR-${pnrData.pnrNumber}.png`, { type: 'image/png' });

      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `PNR ${pnrData.pnrNumber} - ${pnrData.trainName}`,
          text: formatShareSummary(pnrData),
        });
      } else {
        downloadTicketImage(pnrData);
        handleShareWhatsApp();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        downloadTicketImage(pnrData);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadTicketImage = () => {
    if (!pnrData) return;
    downloadTicketImage(pnrData);
  };

  const fetchPnr = async (numberToFetch, isForce = false) => {
    const clean = (numberToFetch || '').trim();
    if (!clean) {
      setError('Please enter a 10-digit PNR number');
      return;
    }
    if (!/^\d{10}$/.test(clean)) {
      setError('PNR must be exactly 10 numeric digits');
      return;
    }

    setError('');
    if (isForce) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const url = `/api/v1/pnr/${clean}${isForce ? '?force=true' : ''}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json.success) {
        const localCopy = savedPnrs.find((p) => p.pnrNumber === clean);
        if (localCopy) {
          setPnrData(localCopy);
          setRefreshNotice(json?.error?.message || 'Indian Railways server is currently busy. Showing your previously recorded status.');
          setError('');
        } else {
          setError(json?.error?.message || 'Failed to fetch PNR status. Please verify the number.');
          if (!isForce) setPnrData(null);
        }
      } else {
        setPnrData(json.data);
        setSearchParams({ pnr: clean });
        savePnrLocally(json.data);

        // Update cooldown and notices from cache metadata
        if (json.data?.cache?.cooldownRemaining) {
          setCooldown(json.data.cache.cooldownRemaining);
        }
        if (json.data?.cache?.cooldownNotice) {
          setRefreshNotice(json.data.cache.cooldownNotice);
        } else {
          setRefreshNotice('');
        }
      }
    } catch (_err) {
      const localCopy = savedPnrs.find((p) => p.pnrNumber === clean);
      if (localCopy) {
        setPnrData(localCopy);
        setRefreshNotice('Network connection timed out. Showing your previously recorded status.');
        setError('');
      } else {
        setError('Network error while checking PNR. Please check your connection.');
        if (!isForce) setPnrData(null);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (initialPnr && /^\d{10}$/.test(initialPnr)) {
      fetchPnr(initialPnr);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPnr]);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchPnr(pnrInput, false);
  };

  const handleRefresh = () => {
    if (loading || isRefreshing || cooldown > 0 || !pnrData?.pnrNumber) return;
    fetchPnr(pnrData.pnrNumber, true);
  };

  return (
    <div className="bg-[#f8fafc] min-h-[calc(100vh-4rem)] text-slate-900 pb-14 w-full overflow-x-hidden">
      {/* Top Banner (Preserving the rich blue background) */}
      <div className="bg-[#1e3a8a] text-white border-b border-blue-900 pt-5 pb-8 sm:pt-6 sm:pb-10 px-3.5 sm:px-6 w-full">
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2 w-full">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white/10 text-blue-200 text-[11px] sm:text-xs font-semibold shrink-0">
              <Ticket className="w-3.5 h-3.5 text-[#f58220]" />
              <span>IRCTC PNR Radar</span>
            </div>

            {/* Saved Tickets Sidebar Trigger Button */}
            {savedPnrs.length > 0 && (
              <button
                type="button"
                onClick={() => setIsSavedDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 text-white text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-xs shrink-0"
              >
                <BookmarkCheck className="w-3.5 h-3.5 text-[#f58220]" />
                <span>Saved Tickets</span>
                <span className="bg-[#f58220] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                  {savedPnrs.length}
                </span>
              </button>
            )}
          </div>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Live PNR Status &amp; Refund Radar
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Real-time IRCTC synchronization, transparent confirmation probability, and official cancellation countdown.
            </p>
          </div>

          {/* Elevated Professional Search Bar */}
          <div className="pt-1">
            <form onSubmit={handleSubmit} className="relative">
              <div className="bg-white rounded-xl p-1.5 sm:p-2 shadow-md border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-full">
                <div className="relative flex-1 min-w-0 flex items-center">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 ml-0.5">
                    <Ticket className="w-4 h-4 text-slate-500" />
                  </div>
                  <input
                    id="pnr-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit PNR number..."
                    value={pnrInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPnrInput(val);
                      setError('');
                    }}
                    className="w-full min-w-0 pl-2.5 pr-8 py-2.5 sm:py-3 bg-transparent font-mono text-base font-bold text-slate-900 tracking-wider placeholder:tracking-normal placeholder:font-normal placeholder:text-slate-400 focus:outline-none"
                  />
                  {pnrInput && (
                    <button
                      type="button"
                      onClick={() => setPnrInput('')}
                      className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                      aria-label="Clear input"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-lg bg-gradient-to-r from-[#f58220] to-[#e0751a] hover:from-[#ea7212] hover:to-[#cb6412] text-white font-bold text-sm sm:text-base transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm active:scale-98 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span>{loading ? 'Checking IRCTC...' : 'Check Status'}</span>
                </button>
              </div>

              {error && (
                <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-100 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-300" />
                  <span>{error}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-3.5 space-y-4">
        {pnrData ? (
          <div className="space-y-4">
            {/* 1. Train & Boarding Pass Details Card (Professional Corners) */}
            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
              {/* Card Header Strip (Clean, Sophisticated Executive Styling) */}
              <div className="px-3.5 sm:px-5 py-3 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center shrink-0">
                    <Train className="w-4 h-4 text-[#f58220]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      <span className="font-mono text-sm sm:text-base font-black text-white tracking-wide shrink-0">
                        {pnrData.trainNumber}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                        {pnrData.trainName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      Class: <strong className="text-slate-200">{pnrData.travelClass}</strong> · Quota: <strong className="text-slate-200">{pnrData.quota}</strong>
                    </div>
                  </div>
                </div>

                {/* Header Action Toolbar (Clean Unified Styling without clashing neon blocks) */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  {pnrData.isLive ? (
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[11px] font-semibold shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live Synced</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-mono">PNR: {pnrData.pnrNumber}</span>
                  )}

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={loading || isRefreshing || cooldown > 0}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 active:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 min-w-[95px] sm:min-w-[125px]"
                      title="Refresh status from Indian Railways"
                    >
                      <RotateCw className={`w-3.5 h-3.5 text-slate-300 shrink-0 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="font-mono tabular-nums whitespace-nowrap text-center text-[11px] sm:text-xs">
                        {cooldown > 0 ? `Wait ${cooldown}s` : isRefreshing ? 'Updating...' : 'Refresh'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsShareModalOpen(true)}
                      className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700/90 active:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                      title="Share ticket status via WhatsApp or copy message"
                    >
                      <Share2 className="w-3.5 h-3.5 text-slate-300" />
                      <span className="text-[11px] sm:text-xs">Share</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Boarding Pass Station Route Layout */}
              <div className="p-3.5 sm:p-5 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  {/* Origin Station */}
                  <div className="min-w-0 flex-1">
                    <div className="text-xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {pnrData.fromStation}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-slate-700 mt-0.5 line-clamp-2 leading-tight">
                      {pnrData.fromStationName || pnrData.fromStation}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1">
                      {pnrData.isDifferentBoarding ? 'Booked Origin' : `Dep: ${formatDisplayTime(pnrData.departureTime)}`}
                    </div>
                    {!pnrData.isDifferentBoarding && pnrData.platform && pnrData.platform !== '--' && (
                      <div className="text-[10px] sm:text-[11px] font-bold text-blue-700 mt-0.5">
                        Plat {pnrData.platform}
                      </div>
                    )}
                  </div>

                  {/* Center Arrow & Date */}
                  <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-4 text-center">
                    <div className="text-[10px] sm:text-xs font-bold text-slate-700 whitespace-nowrap bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {formatDisplayDate(pnrData.journeyDate)}
                    </div>
                    <div className="w-12 sm:w-24 flex items-center gap-0.5 sm:gap-1 text-slate-300 my-1 sm:my-1.5">
                      <div className="h-px bg-slate-300 flex-1" />
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="h-px bg-slate-300 flex-1" />
                    </div>
                    <span className="text-[8px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Direct Train
                    </span>
                  </div>

                  {/* Destination Station */}
                  <div className="min-w-0 flex-1 text-right">
                    <div className="text-xl sm:text-3xl font-black font-mono text-slate-900 tracking-tight">
                      {pnrData.toStation}
                    </div>
                    <div className="text-[11px] sm:text-xs font-bold text-slate-700 mt-0.5 line-clamp-2 leading-tight">
                      {pnrData.toStationName || pnrData.toStation}
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-600 font-medium mt-1">
                      Arr: <strong className="text-slate-900">{formatDisplayTime(pnrData.arrivalTime)}</strong>
                    </div>
                  </div>
                </div>

                {/* Official Boarding Point Banner (Executive, Clean, Interactive) */}
                {pnrData.isDifferentBoarding && (
                  <div className="mt-3.5 rounded-xl border border-slate-200/90 bg-slate-50/90 p-3 sm:p-3.5 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                          <MapPin className="w-3.5 h-3.5 text-[#f58220]" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Official Boarding Point
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowBoardingInfo(!showBoardingInfo)}
                              className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                              title="Why is boarding station different from origin?"
                              aria-label="Toggle boarding info"
                            >
                              <Info className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-extrabold text-slate-900 text-sm truncate block mt-0.5">
                            {pnrData.boardingStation} — {pnrData.boardingStationName}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center border-t sm:border-t-0 border-slate-200/70 pt-2 sm:pt-0 text-xs">
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                          Boarding Departure
                        </span>
                        <span className="font-black text-slate-900 font-mono text-xs sm:text-sm mt-0.5">
                          {formatDisplayTime(pnrData.departureTime)}
                          {pnrData.platform && pnrData.platform !== '--' && (
                            <span className="font-semibold text-slate-500 text-[11px] ml-1.5">
                              (Platform {pnrData.platform})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>

                    {showBoardingInfo && (
                      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg">
                        Your ticket was originally booked from <strong>{pnrData.fromStation} ({pnrData.fromStationName})</strong>, but your designated boarding station is reserved from <strong>{pnrData.boardingStation} ({pnrData.boardingStationName})</strong>. Your confirmed seat will be kept reserved for you from {pnrData.boardingStationName}.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Status & Sync Footer Strip */}
              <div className="px-4 sm:px-5 py-2 bg-slate-50 flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-200">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {pnrData.chartPrepared ? 'Chart prepared' : 'Chart not prepared yet'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  {pnrData.cache?.isCached ? (
                    <>
                      <Zap className="w-3 h-3 text-blue-600" />
                      <span>Verified cache ({pnrData.cache.ageSeconds}s ago)</span>
                    </>
                  ) : (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Live Synced</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{pnrData.cache?.lastUpdated ? new Date(pnrData.cache.lastUpdated).toLocaleTimeString() : 'Just now'}</span>
                </div>
              </div>

              {refreshNotice && (
                <div className="px-4 sm:px-5 py-2 bg-amber-50 text-amber-900 text-xs flex items-center gap-2 border-b border-amber-200">
                  <Info className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                  <span>{refreshNotice}</span>
                </div>
              )}

              {/* 2. Passenger Details Section (Clean, Non-Repetitive Senior Designer Redesign) */}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2 pb-0.5">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Passengers</span>
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full">
                      {pnrData.passengers?.length || 1}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600">
                    Fare: <strong className="text-slate-900 font-mono">₹{pnrData.totalFare}</strong>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {pnrData.passengers.map((p) => {
                    const isCnf = p.currentStatus.startsWith('CNF') || p.currentStatus.startsWith('CONFIRM');
                    const isRac = p.currentStatus.startsWith('RAC');
                    const cleanStatus = getCleanStatusLabel(p.currentStatus);
                    const berthLabel = getBerthTypeLabel(p.berthType);
                    const isUpgraded = !p.bookingStatus.startsWith('CNF') && isCnf;

                    return (
                      <div
                        key={p.passengerNumber}
                        className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 shadow-2xs hover:border-slate-300 transition-all space-y-3"
                      >
                        {/* Row 1: Passenger Header & Status Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {p.passengerNumber}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                                Passenger {p.passengerNumber}
                              </span>
                              {isUpgraded ? (
                                <span className="text-[10px] text-emerald-700 font-semibold block">
                                  Upgraded from {p.bookingStatus}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-medium block">
                                  {isCnf ? 'Direct Confirmed Booking' : `Booked: ${p.bookingStatus}`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1 border shrink-0 ${
                              isCnf
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isRac
                                ? 'bg-blue-50 text-blue-800 border-blue-300'
                                : 'bg-amber-50 text-amber-900 border-amber-300'
                            }`}
                          >
                            {isCnf && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                            <span>{cleanStatus}</span>
                          </span>
                        </div>

                        {/* Row 2: Fluid Seat Information (Never Truncated or Squeezed) */}
                        {isCnf ? (
                          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                  Coach
                                </span>
                                <span className="font-mono text-base sm:text-lg font-black text-slate-900 block leading-tight">
                                  {p.coach || '--'}
                                </span>
                              </div>
                              <div className="w-px h-6 sm:h-7 bg-slate-200" />
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                  Berth / Seat
                                </span>
                                <span className="font-mono text-base sm:text-lg font-black text-slate-900 block leading-tight">
                                  {p.berthNumber || '--'}
                                </span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                                Berth Type
                              </span>
                              <span className="text-xs sm:text-sm font-bold text-slate-800 block leading-tight">
                                {berthLabel}
                              </span>
                            </div>
                          </div>
                        ) : isRac ? (
                          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Coach</span>
                              <span className="font-mono font-bold text-slate-800 block mt-0.5">{p.coach && p.coach !== '--' ? p.coach : 'Pending Chart'}</span>
                            </div>
                            <div className="text-center">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">RAC Status</span>
                              <span className="font-mono font-bold text-blue-900 block mt-0.5">{p.currentStatus}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Boarding Rights</span>
                              <span className="text-emerald-700 font-bold block mt-0.5">Confirmed Seat</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-amber-50/50 border border-amber-100 text-xs">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Booking Status</span>
                              <span className="font-mono font-bold text-slate-700 block mt-0.5">{p.bookingStatus}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Waitlist</span>
                              <span className="font-mono font-bold text-amber-950 block mt-0.5">{p.currentStatus}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3. Confirmation Predictor Card (WL & RAC) */}
            {pnrData.prediction && pnrData.prediction.tier !== 'CONFIRMED' && (
              <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                      Confirmation Probability Predictor
                    </h2>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                      (Clearance velocity model)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg sm:text-xl font-black font-mono ${
                        pnrData.prediction.tier === 'HIGH'
                          ? 'text-emerald-700'
                          : pnrData.prediction.tier === 'MEDIUM'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {pnrData.prediction.probability}%
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        pnrData.prediction.tier === 'HIGH'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : pnrData.prediction.tier === 'MEDIUM'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
                          : 'bg-rose-50 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {pnrData.prediction.tierLabel}
                    </span>
                  </div>
                </div>

                {/* Probability Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      pnrData.prediction.tier === 'HIGH'
                        ? 'bg-emerald-600'
                        : pnrData.prediction.tier === 'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${pnrData.prediction.probability}%` }}
                  />
                </div>

                {/* Mathematical Reasoning */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Clearance Factors:</span>
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1 pl-5 list-disc">
                    {pnrData.prediction.reasons.map((r, i) => (
                      <li key={i} className="leading-relaxed">{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="text-xs font-medium text-slate-700 flex items-center gap-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-200">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>{pnrData.prediction.advice}</span>
                </div>
              </div>
            )}

            {/* 4. Official IRCTC Cancellation & Refund Radar */}
            {pnrData.refund && (
              <div className="bg-white rounded-xl border border-slate-300 p-4 sm:p-5 shadow-xs space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="w-4 h-4 text-emerald-600 shrink-0" />
                    <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                      Cancellation &amp; Refund Radar
                    </h2>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                      (Official IRCTC Rules)
                    </span>
                  </div>

                  <span className="text-xs font-semibold text-slate-600">
                    Total Fare: <strong className="text-slate-900 font-mono">₹{pnrData.totalFare}</strong>
                  </span>
                </div>

                {/* 2 Clear Non-Confusing Refund Windows */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Refund if Cancelled Now */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                          Refund If Cancelled Now
                        </span>
                        <span className="text-[9px] bg-emerald-200 text-emerald-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
                          Active Window
                        </span>
                      </div>
                      <div className="font-mono text-2xl sm:text-3xl font-black text-emerald-950 mt-1">
                        ₹{pnrData.refund.refundAmount}
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-emerald-200/60 text-xs text-emerald-800 space-y-0.5">
                      <div className="font-semibold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>Valid Until: {pnrData.refund.cutoffDateTime}</span>
                      </div>
                      <div className="text-[11px] text-emerald-700">
                        Deduction: ₹{pnrData.refund.deductionAmount} (flat clerkage · Total Fare ₹{pnrData.totalFare})
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Refund if Cancelled in Next Window */}
                  {pnrData.refund.nextSlabRefundAmount !== undefined && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
                            {pnrData.refund.nextSlabTitle || 'Next Penalty Window'}
                          </span>
                          <span className="text-[9px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded uppercase">
                            Drops to ₹{pnrData.refund.nextSlabRefundAmount}
                          </span>
                        </div>
                        <div className="font-mono text-2xl sm:text-3xl font-black text-amber-950 mt-1">
                          ₹{pnrData.refund.nextSlabRefundAmount}
                        </div>
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-amber-200/60 text-xs text-amber-900 space-y-0.5">
                        <div className="font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>Window: {pnrData.refund.nextWindowRange || `${pnrData.refund.cutoffDateTime} → Departure`}</span>
                        </div>
                        <div className="text-[11px] text-amber-800 font-medium">
                          {pnrData.refund.nextSlabSubtext || `In ${pnrData.refund.timeRemainingInSlab || 'upcoming window'}, refund drops (Zero refund after ${pnrData.refund.finalZeroRefundDateTime || 'Chart Prep'})`}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Active IRCTC Rule Explanation & Official Breakdown (Mobile-Optimized & Non-Redundant) */}
                <div className="p-3 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Info className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {pnrData.refund.slabTitle}
                      </span>
                    </div>

                    {pnrData.refund.ruleTimeline && (
                      <button
                        type="button"
                        onClick={() => setIsTimelineOpen(!isTimelineOpen)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer self-start sm:self-auto shrink-0 whitespace-nowrap"
                      >
                        <span>{isTimelineOpen ? 'Hide Full Schedule' : 'View Full Schedule'}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isTimelineOpen ? 'rotate-90' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Direct, clean message */}
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {pnrData.refund.nextSlabDropMessage || pnrData.refund.alertMessage}
                  </p>

                  {/* Explanatory note if clerkage floor applies */}
                  {pnrData.refund.minClerkageNote && (
                    <div className="p-2.5 rounded-lg bg-blue-50/80 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2 leading-relaxed">
                      <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                      <div>{pnrData.refund.minClerkageNote}</div>
                    </div>
                  )}

                  {/* Complete Official IRCTC Cancellation Schedule (Dual Mobile Card + Desktop Table) */}
                  {isTimelineOpen && pnrData.refund.ruleTimeline && (
                    <div className="pt-3 border-t border-slate-200 space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>OFFICIAL IRCTC CANCELLATION SLABS ({pnrData.travelClass} CLASS)</span>
                        <span className="text-slate-400 font-medium hidden sm:inline">Total Fare: ₹{pnrData.totalFare}</span>
                      </div>

                      {/* Mobile View: Vertical Step Cards (Zero squishing, zero horizontal scroll) */}
                      <div className="md:hidden space-y-2">
                        {pnrData.refund.ruleTimeline.map((item, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border transition-all ${
                              item.isCurrent
                                ? 'bg-emerald-50/90 border-emerald-300 shadow-2xs'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-xs font-bold ${item.isCurrent ? 'text-emerald-950' : 'text-slate-900'}`}>
                                    {item.period}
                                  </span>
                                  {item.isCurrent && (
                                    <span className="text-[9px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded uppercase">
                                      Active Now
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] font-mono text-slate-600 mt-1">
                                  {item.timeRange || item.deadline}
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Refund</span>
                                <span className="font-mono font-black text-sm text-slate-900">
                                  ₹{item.refundAmount}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                              <span className="text-slate-500 font-medium">Deduction Rule:</span>
                              <span className="font-semibold text-slate-800">{item.rule}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Desktop View: Spacious Fixed-Width Table */}
                      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100/90 text-slate-700 font-bold text-[11px]">
                            <tr>
                              <th className="py-2.5 px-3 border-b border-slate-200 w-[24%]">Cancellation Window</th>
                              <th className="py-2.5 px-3 border-b border-slate-200 w-[32%]">Applicable Time Window</th>
                              <th className="py-2.5 px-3 border-b border-slate-200 w-[28%]">Official Deduction Rule</th>
                              <th className="py-2.5 px-3 border-b border-slate-200 text-right w-[16%]">You Get Back</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            {pnrData.refund.ruleTimeline.map((item, idx) => (
                              <tr
                                key={idx}
                                className={item.isCurrent ? 'bg-emerald-50/80 font-bold text-emerald-950' : 'text-slate-600 hover:bg-slate-50/50'}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    {item.isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />}
                                    <span>{item.period}</span>
                                    {item.isCurrent && (
                                      <span className="text-[9px] bg-emerald-200 text-emerald-900 font-black px-1.5 py-0.5 rounded uppercase">
                                        Active Now
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">{item.timeRange || item.deadline}</td>
                                <td className="py-2.5 px-3 text-slate-700">{item.rule}</td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900 text-sm">₹{item.refundAmount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 5. Backup / Vacant Berths Action Card (Passing Exact PNR Date) */}
            {pnrData.rescuePlan && (
              <div className="bg-gradient-to-r from-blue-50/70 to-indigo-50/40 rounded-xl border border-blue-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Alternative Seat Assurance</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {pnrData.rescuePlan.summary}
                  </p>
                </div>

                <Link
                  to={`/find?from=${pnrData.fromStation}&to=${pnrData.toStation}&train=${pnrData.trainNumber}&class=${pnrData.travelClass}&date=${normalizeDateForUrl(pnrData.journeyDate)}`}
                  className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <span>View Vacant Berths</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Empty Initial State: Helper Tips & Quick Access */
          <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 text-center space-y-3.5 shadow-2xs">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1e3a8a] flex items-center justify-center mx-auto">
              <Ticket className="w-5 h-5 text-[#f58220]" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Check Your Indian Railways Ticket
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter any 10-digit PNR number above to see real-time chart status, coach &amp; berth allocation, confirmation chances, and official cancellation refunds.
              </p>
            </div>

            {savedPnrs.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsSavedDrawerOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  <BookmarkCheck className="w-4 h-4 text-[#f58220]" />
                  <span>Open My Saved Tickets ({savedPnrs.length})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dedicated Saved Tickets Sidebar / Drawer (Slide-Over Panel) */}
      <div
        className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ${
          isSavedDrawerOpen
            ? 'opacity-100 pointer-events-auto visible'
            : 'opacity-0 pointer-events-none invisible'
        }`}
        aria-hidden={!isSavedDrawerOpen}
      >
        {/* Backdrop Overlay with smooth blur */}
        <div
          className={`fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
            isSavedDrawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setIsSavedDrawerOpen(false)}
        />

        {/* Sliding Panel */}
        <div
          className={`fixed inset-y-0 right-0 w-[320px] max-w-[85vw] bg-white text-slate-900 shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out transform ${
            isSavedDrawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#f58220] flex items-center justify-center text-white shrink-0">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-slate-900 block">
                  My Saved Tickets
                </span>
                <span className="text-[10px] text-slate-500 block font-medium">
                  Private to this device only
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSavedDrawerOpen(false)}
              className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close saved tickets drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Tickets List */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
            {savedPnrs.length === 0 ? (
              <div className="text-center py-12 space-y-2">
                <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  No saved tickets yet.
                </p>
                <p className="text-[11px] text-slate-400">
                  Search any 10-digit PNR and it will automatically be saved privately here.
                </p>
              </div>
            ) : (
              savedPnrs.map((item) => (
                <div
                  key={item.pnrNumber}
                  className="p-3 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all shadow-2xs group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      onClick={() => {
                        setPnrInput(item.pnrNumber);
                        setIsSavedDrawerOpen(false);
                        fetchPnr(item.pnrNumber);
                      }}
                      className="cursor-pointer flex-1 min-w-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-slate-900">
                          {item.pnrNumber}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                            item.currentStatus.startsWith('CNF')
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : item.currentStatus.startsWith('RAC')
                              ? 'bg-blue-50 text-blue-800 border-blue-200'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}
                        >
                          {getCleanStatusLabel(item.currentStatus)}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-800 truncate mt-1">
                        {item.trainNumber} {item.trainName}
                      </div>

                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {item.fromStation} ➔ {item.toStation} · Class: {item.travelClass}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Date: {formatDisplayDate(item.journeyDate)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSavedPnr(item.pnrNumber);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                      title="Delete ticket"
                      aria-label={`Delete ${item.pnrNumber}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setPnrInput(item.pnrNumber);
                        setIsSavedDrawerOpen(false);
                        fetchPnr(item.pnrNumber);
                      }}
                      className="text-[11px] font-bold text-[#1e3a8a] hover:text-[#f58220] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Check Live Status</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3.5 border-t border-slate-200 bg-slate-50 space-y-2.5">
            {savedPnrs.length > 0 && (
              <button
                type="button"
                onClick={clearAllSavedPnrs}
                className="w-full py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-600 hover:text-rose-600 font-bold text-xs transition-colors cursor-pointer"
              >
                Clear All Saved Tickets
              </button>
            )}

            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Data is stored only in this browser and never shared with other users.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Live PNR & Boarding Pass Modal */}
      {isShareModalOpen && pnrData && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all p-4 sm:p-5 space-y-4 max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 id="share-modal-title" className="font-extrabold text-base text-slate-900 leading-tight">
                    Share PNR Boarding Pass
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Official IRCTC live status, seat allocation & refund radar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close share modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto space-y-3.5 pr-0.5 flex-1">
              {/* Boarding Pass Live Image Preview Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-700 font-bold px-0.5">
                  <span className="flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-slate-500" />
                    Boarding Pass Card Preview
                  </span>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80">
                    High-Res PNG
                  </span>
                </div>

                {ticketPreviewUrl ? (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs bg-slate-950 flex justify-center p-2.5">
                    <img
                      src={ticketPreviewUrl}
                      alt={`RailPeek Boarding Pass for PNR ${pnrData.pnrNumber}`}
                      className="max-h-56 sm:max-h-64 object-contain rounded-lg w-auto shadow-md"
                    />
                  </div>
                ) : (
                  <div className="h-44 rounded-xl bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400">
                    Generating Official Boarding Pass...
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-0.5">
                {/* 1. Share Boarding Pass Image Button */}
                <button
                  type="button"
                  onClick={handleShareTicketImage}
                  disabled={isGeneratingImage}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-75"
                >
                  <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{isGeneratingImage ? 'Preparing Pass Image...' : 'Share Boarding Pass Image'}</span>
                </button>

                {/* 2. Download Ticket Image PNG Button */}
                <button
                  type="button"
                  onClick={handleDownloadTicketImage}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-slate-600 shrink-0" />
                  <span>Download Boarding Pass (PNG)</span>
                </button>

                {/* 3. Share WhatsApp Text */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>Share Text Summary on WhatsApp</span>
                </button>

                {/* 4. Copy Clean Formatted Text */}
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {hasCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="text-emerald-700 font-bold">Copied Clean Text Summary!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Copy Formatted Text Summary</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer Note */}
            <p className="text-[11px] text-center text-slate-400 font-medium shrink-0 pt-1 border-t border-slate-100">
              Verified Indian Railways format · Clean typography & zero emojis
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
export default PnrStatusPage;
