import { useTimeStore } from '../../store/timeStore';
import { Phone, MessageSquare, MapPin, Camera, Smartphone, Globe, Lock } from 'lucide-react';
import type { MasterEvent } from '../../types';

const EventCard = ({ event }: { event: MasterEvent }) => {
    const icon = () => {
        switch (event.eventType) {
            case 'call': return <Phone size={14} className="text-red-400" />;
            case 'sms': return <MessageSquare size={14} className="text-green-400" />;
            case 'photo': return <Camera size={14} className="text-blue-400" />;
            case 'location': return <MapPin size={14} className="text-yellow-400" />;
            case 'whatsapp': return <Lock size={14} className="text-emerald-400" />;
            case 'browser': return <Globe size={14} className="text-orange-400" />;
            case 'app': return <Smartphone size={14} className="text-purple-400" />;
            default: return <div className="w-4 h-4 bg-gray-500 rounded-full" />;
        }
    };

    return (
        <div className="glass-card p-4 flex flex-col gap-2 group hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white group-hover:bg-vedic-gold/20 group-hover:text-vedic-gold group-hover:border-vedic-gold/50 transition-colors">
                        {icon()}
                    </div>
                    <div>
                        <div className="text-[10px] text-gray-400 font-mono uppercase tracking-widest leading-none mb-1">
                            {event.eventType}
                        </div>
                        <div className="text-xs font-bold text-white group-hover:text-vedic-gold transition-colors font-orbitron">
                            {event.sourceArtifact}
                        </div>
                    </div>
                </div>
                <div className="text-[9px] font-mono text-neon-cyan/60 bg-neon-cyan/5 px-2 py-1 rounded border border-neon-cyan/10">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <div className="mt-2 text-xs text-gray-300 font-inter leading-relaxed line-clamp-3">
                {event.contentPreview}
            </div>

            <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-gray-500 font-mono">
                <span>ID: {event.id.substring(0, 8)}</span>
                <span>{new Date(event.timestamp).toLocaleDateString()}</span>
            </div>
        </div>
    );
};

const LinearView = () => {
    const events = useTimeStore(s => s.events);

    return (
        <div className="w-full h-full pt-20 pb-10 px-6 md:px-12 overflow-y-auto scrollbar-thin scrollbar-thumb-vedic-gold/20 scrollbar-track-transparent">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold font-orbitron text-white text-glow-cyan uppercase tracking-widest">
                        Data Log <span className="text-vedic-gold">({events.length})</span>
                    </h2>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-[10px] uppercase tracking-wider font-bold bg-white/5 hover:bg-vedic-gold hover:text-black border border-white/10 rounded transition-all">
                            Export Log
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {events.map((event) => (
                        <EventCard key={event.id} event={event} />
                    ))}
                    {events.length === 0 && (
                        <div className="col-span-full h-64 flex items-center justify-center text-white/20 font-orbitron">
                            NO ARTIFACTS FOUND
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LinearView;
