import { useState, useEffect } from 'react';
import {
    MessageSquare, MapPin, Image, Grid,
    Shield, Terminal, Wifi, Loader2, RefreshCw, Phone
} from 'lucide-react';

// Types
interface SMS { address: string; date: string; body: string; type: string; }
interface Media { name: string; path: string; size: string; }
interface Location { lat: number; lng: number; time: string; address: string; }
interface Location { lat: number; lng: number; time: string; address: string; }
interface AppInfo { name: string; package: string; version: string; installDate: string; }
interface CallLog { number: string; date: string; duration: string; type: string; type_label: string; name?: string; }

const API_BASE = 'http://localhost:5000/api';

function App() {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [loading, setLoading] = useState(false);
    const [liveMode, setLiveMode] = useState(false);
    const [device, setDevice] = useState<any>(null);

    const [data, setData] = useState<{
        sms: SMS[];
        locations: Location[];
        media: Media[];
        apps: AppInfo[];
        calls: CallLog[];
    }>({ sms: [], locations: [], media: [], apps: [], calls: [] });

    // Load initial status
    useEffect(() => {
        fetchDevices();
        fetchAllData();
    }, []);

    // Live Mode POLLING
    useEffect(() => {
        let interval: any;
        if (liveMode) {
            interval = setInterval(() => {
                fetchAllData();
            }, 5000); // Fetch every 5 seconds
        }
        return () => clearInterval(interval);
    }, [liveMode]);

    const fetchDevices = async () => {
        try {
            const res = await fetch(`${API_BASE}/devices`);
            const devices = await res.json();
            if (devices.length > 0) {
                setDevice(devices[0]); // Auto select first
                // In a real app we would call /connect
                await fetch(`${API_BASE}/connect/${devices[0].serial}`, { method: 'POST' });
            }
        } catch (e) {
            console.error("API Error", e);
        }
    };

    const fetchAllData = async () => {
        // Load existing extracted data if available
        const endpoints = ['sms', 'locations', 'media', 'apps', 'calls'];
        const newData: any = { ...data };

        for (const ep of endpoints) {
            try {
                const res = await fetch(`${API_BASE}/data/${ep}`);
                const json = await res.json();
                // Handle different structures
                if (Array.isArray(json)) newData[ep] = json;
                else if (json.data) newData[ep] = json.data;
                else if (json.media) newData[ep] = json.media;
            } catch (e) {
                console.log(`No data for ${ep}`);
            }
        }
        setData(newData);
    };

    const triggerExtraction = async (target: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/extract/${target}`, { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                // Reload data
                await fetchAllData();
            } else {
                alert("Extraction Failed: " + result.error);
            }
        } catch (e) {
            alert("Extraction Error: " + e);
        } finally {
            setLoading(false);
        }
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-3 w-full p-3 rounded-lg mb-2 transition-all ${activeTab === id
                ? 'bg-cyber-primary/10 text-cyber-primary border-l-2 border-cyber-primary'
                : 'text-cyber-dim hover:bg-white/5 hover:text-cyber-text'
                }`}
        >
            <Icon size={18} />
            <span className="font-mono text-sm">{label}</span>
        </button>
    );

    return (
        <div className="flex h-screen bg-cyber-black text-cyber-text overflow-hidden selection:bg-cyber-secondary selection:text-white">
            {/* Sidebar */}
            <div className="w-64 bg-cyber-panel border-r border-white/5 p-4 flex flex-col">
                <div className="flex items-center space-x-2 mb-8 px-2">
                    <Shield className="text-cyber-primary" size={24} />
                    <h1 className="text-xl font-bold tracking-wider">INDERJAAL <span className="text-xs text-cyber-secondary">OS</span></h1>
                </div>

                <nav className="flex-1">
                    <TabButton id="dashboard" label="DASHBOARD" icon={Terminal} />
                    <div className="my-4 border-t border-white/5"></div>
                    <TabButton id="sms" label="MESSAGES" icon={MessageSquare} />
                    <TabButton id="calls" label="CALL LOGS" icon={Phone} />
                    <TabButton id="apps" label="APP DATA" icon={Grid} />

                    <TabButton id="location" label="LOCATION" icon={MapPin} />
                    <TabButton id="media" label="MEDIA" icon={Image} />
                </nav>

                <div className="mt-auto p-4 bg-black/20 rounded border border-white/5">
                    <div className="flex items-center justify-between text-xs text-cyber-dim mb-2">
                        <span>DEVICE STATUS</span>
                        <span className={device ? "text-emerald-500" : "text-red-500"}>{device ? "CONNECTED" : "OFFLINE"}</span>
                    </div>
                    {device && (
                        <div className="flex items-center space-x-2 text-sm">
                            <Wifi size={14} className="text-cyber-primary" />
                            <span className="truncate">{device.model || device.serial}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 overflow-auto bg-grid-pattern bg-[size:30px_30px]">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 backdrop-blur-sm bg-cyber-black/80 sticky top-0 z-10">
                    <h2 className="text-lg font-mono text-cyber-primary uppercase tracking-widest flex items-center gap-2">
             // {activeTab}
                        {loading && <Loader2 className="animate-spin text-cyber-accent" size={16} />}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setLiveMode(!liveMode)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all ${liveMode
                                ? 'bg-red-500/10 text-red-500 border-red-500 animate-pulse'
                                : 'bg-white/5 text-cyber-dim border-transparent hover:border-white/10'
                                }`}
                        >
                            <RefreshCw size={12} className={liveMode ? "animate-spin" : ""} />
                            {liveMode ? 'LIVE MODE' : 'OFFLINE'}
                        </button>
                        <button onClick={() => fetchAllData()} className="p-2 hover:bg-white/5 rounded-full text-cyber-dim hover:text-white">
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </header>

                <div className="p-8">
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <StatCard title="MESSAGES" value={data.sms?.length || 0} icon={MessageSquare} color="text-cyber-secondary" />
                            <StatCard title="APP DATA" value={data.apps?.length || 0} icon={Grid} color="text-pink-500" />
                            <StatCard title="LOCATIONS" value={data.locations?.length || 0} icon={MapPin} color="text-emerald-400" />
                            <StatCard title="MEDIA FILES" value={data.media?.length || 0} icon={Image} color="text-cyber-accent" />

                            <div className="col-span-2 lg:col-span-4 cyber-card">
                                <h3 className="text-sm font-mono text-cyber-dim mb-4">QUICK ACTIONS</h3>
                                <div className="flex gap-4">
                                    <ActionButton label="EXTRACT MEDIA" onClick={() => triggerExtraction('media')} icon={Image} />
                                    <ActionButton label="EXTRACT SMS" onClick={() => triggerExtraction('sms')} icon={MessageSquare} />
                                    <ActionButton label="EXTRACT APPS" onClick={() => triggerExtraction('apps')} icon={Grid} />
                                </div>
                            </div>
                        </div>
                    )}



                    {activeTab === 'sms' && (
                        <div className="bg-cyber-panel border border-white/5 rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-sm font-mono text-cyber-dim">SMS MESSAGES</h3>
                                <button onClick={() => triggerExtraction('sms')} className="text-xs text-cyber-primary hover:underline">EXTRACT NEW</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-cyber-dim font-mono text-xs">
                                    <tr>
                                        <th className="p-3">DATE</th>
                                        <th className="p-3">SENDER/RECEIVER</th>
                                        <th className="p-3">MESSAGE</th>
                                        <th className="p-3">TYPE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.sms?.map((msg: SMS, i: number) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono text-xs opacity-70 whitespace-nowrap">{msg.date}</td>
                                            <td className="p-3 font-semibold text-cyber-secondary">{msg.address}</td>
                                            <td className="p-3 opacity-90">{msg.body}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${msg.type === "1" ? "bg-emerald-500/20 text-emerald-500" : "bg-blue-500/20 text-blue-500"}`}>
                                                    {msg.type === "1" ? "INBOX" : "SENT"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!data.sms || data.sms.length === 0) && <div className="p-8 text-center text-cyber-dim italic">No messages found.</div>}
                        </div>
                    )}

                    {activeTab === 'calls' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <h3 className="text-sm font-mono text-cyber-dim">CALL HISTORY</h3>
                                <button onClick={() => triggerExtraction('calls')} className="text-xs text-cyber-primary hover:underline">EXTRACT HISTORY</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-cyber-dim font-mono text-xs">
                                    <tr>
                                        <th className="p-3">DATE/TIME</th>
                                        <th className="p-3">NUMBER</th>
                                        <th className="p-3">CONTACT NAME</th>
                                        <th className="p-3">DURATION (s)</th>
                                        <th className="p-3">TYPE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.calls?.map((log: CallLog, i: number) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono text-xs opacity-70 whitespace-nowrap">{
                                                // If timestamp is ms, convert. If string, leave.
                                                new Date(Number(log.date) || log.date).toLocaleString()
                                            }</td>
                                            <td className="p-3 font-semibold text-cyber-secondary">{log.number}</td>
                                            <td className="p-3 opacity-90">{log.name || "-"}</td>
                                            <td className="p-3 font-mono opacity-70">{log.duration}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${log.type_label === 'Missed' ? 'bg-red-500/20 text-red-500' :
                                                    log.type_label === 'Incoming' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'
                                                    }`}>
                                                    {log.type_label || log.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!data.calls || data.calls.length === 0) && <div className="p-8 text-center text-cyber-dim italic">No call logs found.</div>}
                        </div>
                    )}

                    {activeTab === 'apps' && (
                        <div className="bg-cyber-panel border border-white/5 rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-sm font-mono text-cyber-dim">INSTALLED APPLICATIONS</h3>
                                <button onClick={() => triggerExtraction('apps')} className="text-xs text-cyber-primary hover:underline">REFRESH LIST</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-cyber-dim font-mono text-xs">
                                    <tr>
                                        <th className="p-3">APP NAME</th>
                                        <th className="p-3">PACKAGE NAME</th>
                                        <th className="p-3">VERSION</th>
                                        <th className="p-3">INSTALL DATE</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.apps?.map((app: AppInfo, i: number) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-semibold text-pink-500">{app.name}</td>
                                            <td className="p-3 font-mono text-xs opacity-70">{app.package}</td>
                                            <td className="p-3 text-xs">{app.version}</td>
                                            <td className="p-3 text-xs opacity-50">{app.installDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!data.apps || data.apps.length === 0) && <div className="p-8 text-center text-cyber-dim italic">No apps data found. Connect device to extract.</div>}
                        </div>
                    )}

                    {activeTab === 'location' && (
                        <div className="bg-cyber-panel border border-white/5 rounded-lg overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="text-sm font-mono text-cyber-dim">LOCATION HISTORY</h3>
                                <button onClick={() => triggerExtraction('location')} className="text-xs text-cyber-primary hover:underline">EXTRACT HISTORY</button>
                            </div>
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white/5 text-cyber-dim font-mono text-xs">
                                    <tr>
                                        <th className="p-3">TIME</th>
                                        <th className="p-3">COORDINATES</th>
                                        <th className="p-3">ADDRESS/LABEL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {data.locations?.map((loc: Location, i: number) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-3 font-mono text-xs opacity-70 whitespace-nowrap">{loc.time}</td>
                                            <td className="p-3 font-mono text-emerald-400">{loc.lat.toFixed(6)}, {loc.lng.toFixed(6)}</td>
                                            <td className="p-3 opacity-90">{loc.address}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {(!data.locations || data.locations.length === 0) && <div className="p-8 text-center text-cyber-dim italic">No location data found.</div>}
                        </div>
                    )}
                    {activeTab === 'media' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={() => triggerExtraction('media')} className="text-xs bg-cyber-primary/10 text-cyber-primary px-3 py-1 rounded border border-cyber-primary/30 hover:bg-cyber-primary/20">SCAN DEVICE MEDIA</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {data.media?.map((item: Media, idx: number) => {
                                    const isVideo = item.name.toLowerCase().endsWith('.mp4') || item.name.toLowerCase().endsWith('.mov');
                                    // Make sure item.path is defined; backend now sends it. Fallback to name if not.
                                    const pathSegment = (item as any).path || item.name;
                                    const fileUrl = `${API_BASE}/media_content/${pathSegment}`;

                                    return (
                                        <div key={idx} className="group relative aspect-square bg-cyber-dark rounded-lg overflow-hidden border border-white/5 hover:border-cyber-primary transition-all">
                                            {isVideo ? (
                                                <video
                                                    src={fileUrl}
                                                    className="w-full h-full object-cover"
                                                    controls
                                                    preload="metadata"
                                                />
                                            ) : (
                                                <img
                                                    src={fileUrl}
                                                    alt={item.name}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e: any) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.children[2].style.display = 'flex'; }}
                                                />
                                            )}

                                            {!isVideo && (
                                                <div className="absolute inset-0 flex items-center justify-center text-cyber-dim group-hover:text-cyber-primary hidden bg-cyber-dark z-0">
                                                    <Image size={32} />
                                                </div>
                                            )}

                                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 backdrop-blur-sm z-10 pointer-events-none">
                                                <p className="text-xs truncate text-white">{item.name}</p>
                                                <p className="text-[10px] text-cyber-dim">{item.size}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="cyber-card flex items-center justify-between group hover:border-cyber-primary/50 transition-all">
        <div>
            <h3 className="text-xs font-mono text-cyber-dim mb-1">{title}</h3>
            <p className="text-3xl font-bold text-white group-hover:scale-105 transition-transform">{value}</p>
        </div>
        <div className={`p-3 rounded-full bg-white/5 ${color} group-hover:bg-white/10`}>
            <Icon size={24} />
        </div>
    </div>
);

const ActionButton = ({ label, onClick, icon: Icon }: any) => (
    <button onClick={onClick} className="flex items-center space-x-2 bg-cyber-dark border border-white/10 px-4 py-3 rounded hover:border-cyber-primary hover:text-cyber-primary transition-all">
        <Icon size={16} />
        <span className="font-mono text-xs">{label}</span>
    </button>
);

export default App;
