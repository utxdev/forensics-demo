import { useMemo } from 'react';
import { useTimeStore } from '../../store/timeStore';
// Note: We'll install d3 if not present or just use basic date math for a simple grid if lighter.
// Actually, `d3` was in the original request. We installed it in step 44 but failed? 
// Let's assume we need to install d3-scale d3-time etc if we want full power, 
// OR just write a simple CSS grid heatmap which is often cleaner for React.

const HeatmapView = () => {
    const events = useTimeStore(s => s.events);

    // Aggregate events by Date (YYYY-MM-DD)
    const densityMap = useMemo(() => {
        const map = new Map<string, number>();
        events.forEach(e => {
            const date = new Date(e.timestamp).toISOString().split('T')[0];
            map.set(date, (map.get(date) || 0) + 1);
        });
        return map;
    }, [events]);

    // Generate Calendar Grid (Last 365 Days)
    const calendarDays = useMemo(() => {
        const days = [];
        const today = new Date();
        for (let i = 364; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            days.push({
                date: dateStr,
                count: densityMap.get(dateStr) || 0,
                obj: d
            });
        }
        return days;
    }, [densityMap]);

    // Color Scale logic
    const getColor = (count: number) => {
        if (count === 0) return 'bg-white/5';
        if (count < 2) return 'bg-cosmic-gold/20';
        if (count < 5) return 'bg-cosmic-gold/40';
        if (count < 10) return 'bg-cosmic-gold/60';
        return 'bg-cosmic-gold shadow-[0_0_10px_#FFD700]';
    };

    return (
        <div className="w-full h-full bg-cosmic-dark/95 backdrop-blur pt-24 pb-20 px-10 overflow-y-auto">
            <div className="border border-cosmic-gold/20 rounded-xl p-8 bg-black/40 shadow-2xl">
                <h2 className="text-cosmic-gold text-sm font-bold uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4">
                    Temporal Density Analysis
                </h2>

                {/* Heatmap Grid */}
                <div className="flex flex-wrap gap-1 justify-center">
                    {calendarDays.map((day) => (
                        <div
                            key={day.date}
                            className={`w-3 h-3 rounded-sm ${getColor(day.count)} transition-all hover:scale-150 hover:z-10 relative group cursor-pointer`}
                        >
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black text-white text-[9px] p-2 rounded hidden group-hover:block z-20 border border-white/20 pointer-events-none text-center">
                                <div className="font-bold text-cosmic-gold">{day.date}</div>
                                {day.count} Artifacts
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 flex items-center justify-end gap-2 text-[10px] text-white/50 uppercase">
                    <span>Less</span>
                    <div className="w-2 h-2 bg-white/5 rounded-sm" />
                    <div className="w-2 h-2 bg-cosmic-gold/20 rounded-sm" />
                    <div className="w-2 h-2 bg-cosmic-gold/60 rounded-sm" />
                    <div className="w-2 h-2 bg-cosmic-gold rounded-sm" />
                    <span>More</span>
                </div>
            </div>
        </div>
    );
};

export default HeatmapView;
