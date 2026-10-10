import { Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function AlternativeDateBanner({ alternativeDate, onSwitchDate }) {
  if (!alternativeDate) return null;

  return (
    <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-start sm:items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-blue-100 text-[#1e3a8a] flex items-center justify-center shrink-0">
          <Calendar className="w-4 h-4" />
        </div>
        <div>
          <span className="font-bold text-blue-900">
            Alternative Date Available:
          </span>{' '}
          <span className="text-blue-800">{alternativeDate.message}</span>
        </div>
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={() => onSwitchDate && onSwitchDate(alternativeDate.date)}
        icon={ArrowRight}
        className="shrink-0 self-end sm:self-auto bg-[#1e3a8a] text-white hover:bg-[#172554]"
      >
        View {alternativeDate.date}
      </Button>
    </div>
  );
}
