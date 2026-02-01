import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, MessageSquare, MapPin, Image as ImageIcon, Clock, Globe } from 'lucide-react';

// --- DATA TYPES ---
interface ForensicEvent {
    id: string;
    type: 'CALL' | 'SMS' | 'GPS' | 'PHOTO';
    time: string; // ISO String
    title: string;
    details: string;
    meta: any;
}

// --- MOCK DATA (Fallback) ---
const mockIndrajaalData: ForensicEvent[] = [
    { id: '1', type: 'CALL', time: '2025-02-01T10:30:00', title: 'Incoming Call', details: 'Duration: 5m 12s', meta: { contact: 'Unknown', network: 'Airtel' } },
    { id: '2', type: 'SMS', time: '2025-02-01T10:35:00', title: 'SMS Received', details: '"Hide the cash"', meta: { sender: 'Suspect', status: 'Read' } },
    { id: '3', type: 'GPS', time: '2025-02-01T10:40:00', title: 'Location Ping', details: 'Warehouse Sector 4', meta: { lat: 28.7041, lng: 77.1025, accuracy: '10m' } },
    { id: '4', type: 'PHOTO', time: '2025-02-01T10:42:00', title: 'Camera Capture', details: 'evidence.jpg', meta: { size: '2.4MB', resolution: '4032x3024' } },
    { id: '5', type: 'CALL', time: '2025-02-01T11:15:00', title: 'Outgoing Call', details: 'Duration: 0m 45s', meta: { contact: 'Accomplice', network: 'Jio' } },
    { id: '6', type: 'GPS', time: '2025-02-01T11:30:00', title: 'Location Ping', details: 'Highway NH-44', meta: { lat: 28.7200, lng: 77.1500, accuracy: '50m' } },
    { id: '7', type: 'SMS', time: '2025-02-01T12:00:00', title: 'SMS Sent', details: '"Done. Moving out."', meta: { recipient: 'Boss', status: 'Delivered' } },
    { id: '8', type: 'PHOTO', time: '2025-02-01T12:10:00', title: 'Screenshot', details: 'map_route.png', meta: { size: '1.1MB', resolution: '1080x1920' } },
];

const COLORS = {
    blue: '#00D9FF', // Communications
    green: '#00FF41', // Location
    gold: '#FFD700', // Selected/Important
    void: '#0A0A0F',
    darkGray: '#151520',
};

// --- DATA FETCHING ---
const fetchIndrajaalData = async (): Promise<ForensicEvent[]> => {
    try {
        const endpoints = ['sms', 'calls', 'locations', 'media'];
        const results = await Promise.all(
            endpoints.map(ep => fetch(`http://localhost:5000/api/data/${ep}`).then(r => r.json()).catch(() => []))
        );

        const [sms, calls, locs, media] = results;
        let events: ForensicEvent[] = [];

        // Map SMS
        sms.forEach((m: any, i: number) => {
            events.push({
                id: `sms-${i}`,
                type: 'SMS',
                time: new Date(m.date).toISOString(),
                title: m.type === '1' ? 'SMS Received' : 'SMS Sent',
                details: m.body,
                meta: { sender: m.address, type: m.type }
            });
        });

        // Map Calls
        calls.forEach((c: any, i: number) => {
            events.push({
                id: `call-${i}`,
                type: 'CALL',
                time: new Date(Number(c.date)).toISOString(), // c.date is ms
                title: `${c.type_label} Call`,
                details: `Duration: ${c.duration}s`,
                meta: { contact: c.number, name: c.name }
            });
        });

        // Map Locations
        locs.forEach((l: any, i: number) => {
            events.push({
                id: `loc-${i}`,
                type: 'GPS',
                time: l.time ? new Date(l.time).toISOString() : new Date().toISOString(),
                title: 'Location Ping',
                details: l.address,
                meta: { lat: l.lat, lng: l.lng }
            });
        });

        // Map Media
        media.forEach((m: any, i: number) => {
            events.push({
                id: `media-${i}`,
                type: 'PHOTO',
                time: new Date(m.mtime * 1000).toISOString(),
                title: m.name,
                details: m.path,
                meta: { size: m.size }
            });
        });

        // Sort by time
        events.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

        return events.length > 0 ? events : mockIndrajaalData;

    } catch (e) {
        console.warn("Failed to fetch from Indrajaal Backend, using mock data.", e);
        return mockIndrajaalData;
    }
};

// --- ICONS ---
const getIcon = (type: string, color: string) => {
    const props = { size: 18, color: color };
    switch (type) {
        case 'CALL': return <Phone {...props} />;
        case 'SMS': return <MessageSquare {...props} />;
        case 'GPS': return <MapPin {...props} />;
        case 'PHOTO': return <ImageIcon {...props} />;
        default: return <Clock {...props} />;
    }
};

const getColor = (type: string) => {
    switch (type) {
        case 'CALL':
        case 'SMS': return COLORS.blue;
        case 'GPS': return COLORS.green;
        case 'PHOTO': return COLORS.gold;
        default: return COLORS.blue;
    }
};

// --- CHAKRA DIAL COMPONENT ---
const ChakraDial = ({ events, selectedId, onSelect }: { events: ForensicEvent[], selectedId: string | null, onSelect: (id: string) => void }) => {
    const [rotation, setRotation] = useState(0);

    // Calculate angle for each event (simple distribution 0-360)
    const angleInfo = events.map((ev, i) => {
        const angle = (i / events.length) * 360;
        return { ...ev, angle };
    });

    // Rotate wheel to center the selected event
    useEffect(() => {
        if (selectedId) {
            const target = angleInfo.find(e => e.id === selectedId);
            if (target) {
                setRotation(-target.angle);
            }
        }
    }, [selectedId, angleInfo]);

    return (
        <div className="relative w-[500px] h-[500px] flex items-center justify-center overflow-visible select-none">

            {/* Outer Glow Ring */}
            <div className="absolute inset-0 rounded-full border border-[#00D9FF]/20 shadow-[0_0_50px_rgba(0,217,255,0.1)] animate-spin-slow"
                style={{ animationDuration: '60s' }} />

            {/* Decorative Dashed Ring */}
            <div className="absolute w-[450px] h-[450px] rounded-full border border-dashed border-[#00FF41]/30 animate-reverse-spin"
                style={{ animationDuration: '40s' }} />

            {/* The Rotating Chakra */}
            <motion.div
                className="absolute w-full h-full"
                animate={{ rotate: rotation }}
                transition={{ type: "spring", stiffness: 60, damping: 20 }}
            >
                {angleInfo.map((ev) => {
                    const isSelected = ev.id === selectedId;
                    const color = isSelected ? COLORS.gold : getColor(ev.type);

                    return (
                        <motion.div
                            key={ev.id}
                            className="absolute top-1/2 left-1/2 w-8 h-8 -ml-4 -mt-4 flex items-center justify-center rounded-full cursor-pointer transition-all duration-300"
                            style={{
                                transform: `rotate(${ev.angle}deg) translate(220px) rotate(-${ev.angle}deg)`, // Keep icons upright
                                backgroundColor: isSelected ? 'rgba(255, 215, 0, 0.2)' : 'rgba(10, 10, 15, 0.8)',
                                border: `1px solid ${color}`,
                                boxShadow: isSelected ? `0 0 15px ${color}` : `0 0 5px ${color}`,
                            }}
                            onClick={() => onSelect(ev.id)}
                            whileHover={{ scale: 1.2 }}
                        >
                            {getIcon(ev.type, color)}
                        </motion.div>
                    );
                })}
            </motion.div>

            {/* Centerpiece */}
            <div className="absolute w-32 h-32 rounded-full bg-[#0A0A0F] border border-[#00D9FF]/50 flex items-center justify-center z-10 shadow-[0_0_30px_rgba(0,217,255,0.2)]">
                <div className="text-center">
                    <h2 className="text-[#00D9FF] font-bold text-lg tracking-widest font-mono">KAAL</h2>
                    <div className="w-16 h-[1px] bg-[#00FF41] mx-auto my-1"></div>
                    <h2 className="text-[#00FF41] font-bold text-sm tracking-widest font-mono">CHAKRA</h2>
                </div>
            </div>

        </div>
    );
};

// --- LINEAR STREAM COMPONENT ---
const LinearStream = ({ events, selectedId, onSelect }: { events: ForensicEvent[], selectedId: string | null, onSelect: (id: string) => void }) => {
    return (
        <div className="h-full w-80 bg-[#101015] border-r border-[#00D9FF]/20 flex flex-col backdrop-blur-md">
            <div className="p-4 border-b border-[#00D9FF]/20 bg-gradient-to-r from-[#101015] to-[#00D9FF]/10">
                <h3 className="text-[#00D9FF] font-mono font-bold flex items-center gap-2">
                    <Clock size={16} /> TIMELINE STREAM
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2 custom-scrollbar">
                {events.map((ev) => {
                    const isSelected = ev.id === selectedId;
                    return (
                        <div
                            key={ev.id}
                            onClick={() => onSelect(ev.id)}
                            className={`relative p-3 rounded-md border cursor-pointer transition-all duration-200 group
                 ${isSelected
                                    ? 'bg-[#00D9FF]/10 border-[#00D9FF]'
                                    : 'bg-[#151520] border-[#333] hover:border-[#00D9FF]/50'
                                }`}
                        >
                            {/* Connecting Line */}
                            <div className="absolute left-4 top-full h-2 w-[1px] bg-[#333] group-last:hidden"></div>

                            <div className="flex items-start gap-3">
                                <div className="mt-1">{getIcon(ev.type, isSelected ? COLORS.gold : getColor(ev.type))}</div>
                                <div>
                                    <div className="text-xs text-gray-400 font-mono mb-0.5">{new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    <div className={`text-sm font-semibold ${isSelected ? 'text-[#00D9FF]' : 'text-gray-200'}`}>{ev.title}</div>
                                    <div className="text-xs text-gray-500 truncate max-w-[180px]">{ev.details}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {events.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">No events found.</div>
                )}
            </div>
        </div>
    );
};

// --- DRISHTI DETAILS COMPONENT ---
const DrishtiDetails = ({ event }: { event: ForensicEvent | null }) => {
    if (!event) return (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 font-mono">
            <Globe size={48} className="mb-4 opacity-20 animate-pulse" />
            <div>SELECT AN EVENT TO ANALYZE</div>
        </div>
    );

    return (
        <AnimatePresence mode='wait'>
            <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="p-6 h-full font-mono"
            >
                <div className="flex items-center justify-between mb-6 border-b border-[#00FF41]/30 pb-4">
                    <div>
                        <h2 className="text-2xl text-[#00D9FF] font-bold">{event.title}</h2>
                        <span className="text-[#00FF41] text-sm">{new Date(event.time).toLocaleString()}</span>
                    </div>
                    <div className="p-3 rounded-full border border-[#00FF41]/30 bg-[#00FF41]/10">
                        {getIcon(event.type, COLORS.green)}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-[#151520] rounded border border-gray-800">
                        <div className="text-xs text-gray-500 mb-1">TYPE</div>
                        <div className="text-[#00D9FF]">{event.type}</div>
                    </div>
                    <div className="p-4 bg-[#151520] rounded border border-gray-800">
                        <div className="text-xs text-gray-500 mb-1">CONTENT</div>
                        <div className="text-white break-words">{event.details}</div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-[#FFD700] text-sm mb-3 border-l-2 border-[#FFD700] pl-2">METADATA</h3>
                    <div className="bg-[#101012] p-4 rounded border border-[#333] font-mono text-sm space-y-2">
                        {Object.entries(event.meta).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-gray-500 uppercase">{key}:</span>
                                <span className="text-gray-300">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* VISUAL PREVIEW AREA based on Type */}
                <div className="h-64 rounded-lg border border-[#00D9FF]/20 bg-[#050508] relative overflow-hidden flex items-center justify-center group">
                    {/* Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,217,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,217,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    {event.type === 'GPS' && (
                        <div className="text-center z-10">
                            <MapPin size={48} className="text-[#00FF41] mx-auto mb-2 animate-bounce" />
                            <div className="text-[#00FF41] text-xs tracking-widest">SATELLITE POSITION LOCKED</div>
                            <div className="text-white text-lg mt-2 font-bold">{event.meta.lat}, {event.meta.lng}</div>
                        </div>
                    )}

                    {event.type === 'PHOTO' && (
                        <div className="text-center z-10 w-full h-full p-4 flex flex-col items-center justify-center">
                            <div className="w-full h-full bg-gray-900 border border-gray-700 flex items-center justify-center relative">
                                {/* In a real app, we would serve string paths via backend */}
                                {event.details.startsWith('mock') ?
                                    <ImageIcon size={48} className="text-gray-600" /> :
                                    <img src={`http://localhost:5000/api/media_content/${event.details}`} alt="evidence" className="max-h-full max-w-full object-contain" />
                                }
                                <div className="absolute bottom-2 right-2 text-[10px] text-gray-500">{event.meta.size}</div>
                            </div>
                        </div>
                    )}

                    {(event.type === 'CALL' || event.type === 'SMS') && (
                        <div className="w-full max-w-sm">
                            <div className="flex items-center gap-3 p-3 border-b border-gray-800">
                                <div className="w-8 h-8 rounded-full bg-gray-700"></div>
                                <div>
                                    <div className="text-sm text-white">{event.meta.contact || event.meta.sender || event.meta.recipient || event.id}</div>
                                    <div className="text-xs text-gray-500">Known Associate</div>
                                </div>
                            </div>
                            <div className="p-4 relative">
                                {event.type === 'SMS' && (
                                    <div className="bg-[#00D9FF]/10 text-[#00D9FF] p-3 rounded-br-xl rounded-tr-xl rounded-bl-xl max-w-[80%]">
                                        {event.details}
                                    </div>
                                )}
                                {event.type === 'CALL' && (
                                    <div className="text-center py-4">
                                        <div className="text-2xl text-white font-thin">00:00</div>
                                        <div className="text-xs text-gray-500 mt-1">Audio Recording Unavailable</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </motion.div>
        </AnimatePresence>
    );
};

// --- MAIN KAAL CHAKRA LAYOUT ---
export const KaalChakraTimeline = () => {
    const [events, setEvents] = useState<ForensicEvent[]>([]);
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchIndrajaalData().then(data => {
            setEvents(data);
            if (data.length > 0) setSelectedEventId(data[0].id);
            setLoading(false);
        });
    }, []);

    const selectedEvent = events.find(e => e.id === selectedEventId) || null;

    return (
        <div className="flex h-screen w-full bg-[#0A0A0F] text-white overflow-hidden relative selection:bg-[#00D9FF] selection:text-black">

            {/* Background Ambient Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-[#00D9FF] opacity-[0.03] blur-[150px] rounded-full"></div>
                <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] bg-[#00FF41] opacity-[0.03] blur-[150px] rounded-full"></div>
            </div>

            {/* LEFT: Linear Stream */}
            <div className="z-10 relative shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
                <LinearStream
                    events={events}
                    selectedId={selectedEventId}
                    onSelect={setSelectedEventId}
                />
            </div>

            {/* CENTER: Chakra Visualization */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-0">

                {/* Title Header */}
                <div className="absolute top-8 left-0 w-full flex justify-center z-20">
                    <div className="uppercase tracking-[0.3em] text-xs text-gray-500">Project Trinetra <span className="text-[#00D9FF] mx-2">//</span> KAAL CHAKRA Module</div>
                </div>

                {loading ? (
                    <div className="animate-pulse text-[#00D9FF] font-mono">INITIALIZING COSMIC CONNECTION...</div>
                ) : (
                    <ChakraDial
                        events={events}
                        selectedId={selectedEventId}
                        onSelect={setSelectedEventId}
                    />
                )}
            </div>

            {/* RIGHT: Drishti Details */}
            <div className="w-96 bg-[#101015]/80 border-l border-[#00D9FF]/20 backdrop-blur-xl z-10 shadow-[-5px_0_30px_rgba(0,0,0,0.5)]">
                <div className="p-4 border-b border-[#00D9FF]/20 flex justify-between items-center">
                    <h3 className="text-[#00D9FF] font-mono font-bold flex items-center gap-2">
                        <Globe size={16} /> DRISHTI VIEW
                    </h3>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse"></div>
                        <div className="w-2 h-2 rounded-full bg-[#00FF41]"></div>
                        <div className="w-2 h-2 rounded-full bg-[#FFD700]"></div>
                    </div>
                </div>
                <div className="h-[calc(100%-60px)] overflow-y-auto custom-scrollbar">
                    <DrishtiDetails event={selectedEvent} />
                </div>
            </div>

        </div>
    );
};

export default KaalChakraTimeline;
