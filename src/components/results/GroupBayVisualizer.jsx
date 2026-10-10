import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Standard 3A/SL bay structure: 8 berths per bay
 */
export function GroupBayVisualizer({ allocatedBerths = [], cohesion, bayList = [], coach }) {
  if (!allocatedBerths || allocatedBerths.length === 0) return null;

  // Map of berthNumber -> allocated passenger details
  const allocatedMap = new Map();
  for (const b of allocatedBerths) {
    allocatedMap.set(b.berthNumber, b);
  }

  // Display bays
  const uniqueBays = bayList.length > 0
    ? Array.from(new Set(bayList)).sort((a, b) => a - b)
    : Array.from(new Set(allocatedBerths.map((b) => b.bayNumber))).sort((a, b) => a - b);

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 bg-slate-50">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1e3a8a]" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Coach {coach || allocatedBerths[0]?.coach} Seating Layout
          </span>
        </div>

        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-white text-slate-700 border border-slate-300">
          {cohesion === 'SAME_BAY'
            ? 'Same Bay Allocated'
            : cohesion === 'ADJACENT_BAYS'
            ? 'Adjacent Bays Allocated'
            : cohesion === 'SAME_COACH'
            ? 'Same Coach Allocation'
            : 'Multi-Coach Split'}
        </span>
      </div>

      {/* Render Bays */}
      <div className="space-y-3">
        {uniqueBays.map((bayNum) => {
          const bayStart = (bayNum - 1) * 8;
          const leftRow = [bayStart + 1, bayStart + 2, bayStart + 3];
          const rightRow = [bayStart + 4, bayStart + 5, bayStart + 6];
          const sideRow = [bayStart + 7, bayStart + 8];

          const getBerthTypeLabel = (num) => {
            const rem = num % 8;
            if (rem === 1 || rem === 4) return 'LB';
            if (rem === 2 || rem === 5) return 'MB';
            if (rem === 3 || rem === 6) return 'UB';
            if (rem === 7) return 'SL';
            return 'SU';
          };

          return (
            <div
              key={bayNum}
              className="p-3 rounded-lg border border-slate-200 bg-white"
            >
              <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center justify-between">
                <span>Bay {bayNum}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Berths {bayStart + 1}–{bayStart + 8}
                </span>
              </div>

              {/* Bay Blueprint Grid */}
              <div className="grid grid-cols-12 gap-2 text-center text-xs">
                {/* Main Bay */}
                <div className="col-span-8 p-2 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider text-left">
                    Main Cabin
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Row A */}
                    <div className="space-y-1.5">
                      {leftRow.map((bNum) => {
                        const allocated = allocatedMap.get(bNum);
                        const isAllocated = !!allocated;
                        return (
                          <div
                            key={bNum}
                            className={cn(
                              'py-1.5 px-2 rounded-md font-mono text-xs flex items-center justify-between border transition-colors',
                              isAllocated
                                ? 'bg-emerald-600 text-white font-bold border-emerald-700'
                                : 'bg-white text-slate-500 border-slate-200'
                            )}
                          >
                            <span>#{bNum} {getBerthTypeLabel(bNum)}</span>
                            {isAllocated && (
                              <span className="text-[10px] bg-white text-emerald-800 px-1 rounded font-sans font-bold">
                                P{allocated.passengerNumber}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Row B */}
                    <div className="space-y-1.5">
                      {rightRow.map((bNum) => {
                        const allocated = allocatedMap.get(bNum);
                        const isAllocated = !!allocated;
                        return (
                          <div
                            key={bNum}
                            className={cn(
                              'py-1.5 px-2 rounded-md font-mono text-xs flex items-center justify-between border transition-colors',
                              isAllocated
                                ? 'bg-emerald-600 text-white font-bold border-emerald-700'
                                : 'bg-white text-slate-500 border-slate-200'
                            )}
                          >
                            <span>#{bNum} {getBerthTypeLabel(bNum)}</span>
                            {isAllocated && (
                              <span className="text-[10px] bg-white text-emerald-800 px-1 rounded font-sans font-bold">
                                P{allocated.passengerNumber}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Corridor Aisle */}
                <div className="col-span-1 flex items-center justify-center">
                  <div className="h-full border-r-2 border-dashed border-slate-200" />
                </div>

                {/* Side Berths */}
                <div className="col-span-3 p-2 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
                  <div className="text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider text-left">
                    Side
                  </div>
                  <div className="space-y-1.5">
                    {sideRow.map((bNum) => {
                      const allocated = allocatedMap.get(bNum);
                      const isAllocated = !!allocated;
                      return (
                        <div
                          key={bNum}
                          className={cn(
                            'py-1.5 px-2 rounded-md font-mono text-xs flex items-center justify-between border transition-colors',
                            isAllocated
                              ? 'bg-emerald-600 text-white font-bold border-emerald-700'
                              : 'bg-white text-slate-500 border-slate-200'
                          )}
                        >
                          <span>#{bNum} {getBerthTypeLabel(bNum)}</span>
                          {isAllocated && (
                            <span className="text-[10px] bg-white text-emerald-800 px-1 rounded font-sans font-bold">
                              P{allocated.passengerNumber}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
