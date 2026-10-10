import { Train, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SuggestedAlternativeBanner({ suggestedAlternative, currentTrainNumber, onSelectTrain }) {
  if (!suggestedAlternative) return null;

  return (
    <div className="p-4 sm:p-5 rounded-lg bg-emerald-50/80 border-2 border-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 border border-emerald-700">
          <ShieldCheck className="w-5 h-5 text-emerald-100" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-200 text-emerald-900 border border-emerald-300">
              Better Route Alternative Found
            </span>
            <span className="text-xs font-bold text-emerald-950 font-mono">
              Train {suggestedAlternative.trainNumber} &bull; {suggestedAlternative.trainName}
            </span>
          </div>

          <p className="text-xs text-emerald-900 leading-relaxed max-w-2xl">
            {currentTrainNumber ? (
              <span>
                Selected train <strong className="font-mono text-emerald-950">{currentTrainNumber}</strong> only has partial/segment seats.
              </span>
            ) : null}{' '}
            <strong>{suggestedAlternative.trainName} ({suggestedAlternative.trainNumber})</strong> runs on this exact route with{' '}
            <strong className="text-emerald-900 underline decoration-emerald-500">100% Full Journey vacant berths</strong> in{' '}
            {suggestedAlternative.travelClass || 'Sleeper'} class!
          </p>

          <div className="flex items-center gap-3 text-xs text-emerald-950 pt-0.5 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <Train className="w-3.5 h-3.5 text-emerald-700" />
              Departs: <strong className="font-mono">{suggestedAlternative.departureTime}</strong> &bull; Arrives: <strong className="font-mono">{suggestedAlternative.arrivalTime}</strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-white/80 px-2 py-0.5 rounded border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 100% End-to-End Vacancy
            </span>
          </div>
        </div>
      </div>

      <div className="shrink-0 self-end md:self-center">
        <Button
          size="sm"
          onClick={() => onSelectTrain && onSelectTrain(suggestedAlternative.trainNumber, suggestedAlternative.coach || 'S1')}
          icon={ArrowRight}
          className="bg-[#1e3a8a] hover:bg-[#172554] text-white font-bold text-xs px-4 py-2 cursor-pointer border border-[#1e3a8a]"
        >
          Switch to Train {suggestedAlternative.trainNumber}
        </Button>
      </div>
    </div>
  );
}
