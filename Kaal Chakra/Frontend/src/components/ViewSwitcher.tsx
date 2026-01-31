import { useTimeStore } from '../store/timeStore';
import { Circle, List, Map as MapIcon, Activity } from 'lucide-react';
import type { ViewMode } from '../types';
import clsx from 'clsx';

const ViewSwitcher = () => {
    const viewMode = useTimeStore(s => s.viewMode);
    const setViewMode = useTimeStore(s => s.setViewMode);

    const views: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
        { id: 'circular', icon: <Circle size={18} />, label: 'COSMIC WHEEL' },
        { id: 'linear', icon: <List size={18} />, label: 'LINEAR TIMELINE' },
        { id: 'map', icon: <MapIcon size={18} />, label: 'GEO SPATIAL' },
        { id: 'heatmap', icon: <Activity size={18} />, label: 'HEAT MAP' },
        { id: 'datalog', icon: <List size={18} />, label: 'DATA LOGS' },
    ];

    return (
        <div className="absolute top-20 left-6 z-50 flex flex-col gap-4">
            <div className="glass-panel p-2 flex flex-col gap-2 w-14 hover:w-48 transition-all duration-300 group overflow-hidden">
                {views.map((v) => (
                    <button
                        key={v.id}
                        onClick={() => setViewMode(v.id)}
                        className={clsx(
                            "flex items-center gap-4 p-2 rounded transition-all duration-200 relative whitespace-nowrap",
                            viewMode === v.id
                                ? "bg-vedic-gold text-black shadow-gold-glow"
                                : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                        title={v.label}
                    >
                        <div className="min-w-[20px] flex items-center justify-center">
                            {v.icon}
                        </div>
                        <span className={clsx(
                            "text-xs font-orbitron tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                            viewMode === v.id ? "font-bold" : "font-normal"
                        )}>
                            {v.label}
                        </span>

                        {/* Active Indicator Line */}
                        {viewMode === v.id && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white rounded-r-full" />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default ViewSwitcher;
