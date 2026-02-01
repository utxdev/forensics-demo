import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Database, Smartphone, Download, Activity, Terminal,
    MessageSquare, MapPin, Image, Grid, Phone, RefreshCw, Loader2, Play
} from 'lucide-react';
import { motion } from 'framer-motion';

// Types
interface SMS { address: string; date: string; body: string; type: string; type_label?: string; }
interface Media { name: string; path: string; size: string; mtime?: number; }
interface Location { lat: number; lng: number; time: string; address: string; }
interface AppInfo { name: string; package: string; version: string; installDate: string; }
interface CallLog { number: string; date: string; duration: string; type: string; type_label: string; name?: string; }

import config from '../config';

const API_BASE = `${config.INDRJAAL_API}/api`;

const IndrajaalExtraction = () => {
    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [logs, setLogs] = useState<string[]>([]);
    const [device, setDevice] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [extracting, setExtracting] = useState<string | null>(null);
    const [liveMode, setLiveMode] = useState(false);

    // Data Store
    const [data, setData] = useState<{
        sms: SMS[];
        locations: Location[];
        media: Media[];
        apps: AppInfo[];
        calls: CallLog[];
    }>({ sms: [], locations: [], media: [], apps: [], calls: [] });

    // Helpers
    const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    // Initial Load
    useEffect(() => {
        fetchDevices();
        fetchAllData();
    }, []);

    // Live Poll
    useEffect(() => {
        let interval: any;
        if (liveMode) {
            interval = setInterval(() => fetchAllData(), 5000);
        }
        return () => clearInterval(interval);
    }, [liveMode]);

    // API Calls
    const fetchDevices = async () => {
        try {
            const res = await axios.get(`${API_BASE}/devices`);
            if (res.data.length > 0) {
                setDevice(res.data[0]);
                await axios.post(`${API_BASE}/connect/${res.data[0].serial}`);
                addLog(`Auto-Connected: ${res.data[0].serial}`);
            }
        } catch (e: any) {
            console.error("Device Check Failed", e);
        }
    };

    const fetchAllData = async () => {
        const endpoints = ['sms', 'locations', 'media', 'apps', 'calls'];
        const newData: any = { ...data };

        for (const ep of endpoints) {
            try {
                const res = await axios.get(`${API_BASE}/data/${ep}`);
                // Handle various response structures
                if (Array.isArray(res.data)) newData[ep] = res.data;
                else if (res.data.data) newData[ep] = res.data.data;
                else if (res.data.media) newData[ep] = res.data.media;
            } catch (e) {
                // Silent fail for polling
            }
        }
        setData(newData);
    };

    const extractArtifact = async (type: string, label: string) => {
        if (!device) {
            addLog("ERROR: Connect Device First.");
            // Try to connect once
            await fetchDevices();
            if (!device) return;
        }
        setExtracting(type);
        addLog(`[STARTED] Extracting ${label}... Check Phone!`);

        try {
            const res = await axios.post(`${API_BASE}/extract/${type}`);
            if (res.data.success) {
                const count = Array.isArray(res.data.data) ? res.data.data.length : (res.data.data?.length || 0);
                addLog(`[SUCCESS] Extracted ${count} ${label} items.`);
                fetchAllData(); // Refresh UI
            } else {
                addLog(`[FAILED] ${res.data.error || 'Unknown Error'}`);
            }
        } catch (e: any) {
            addLog(`Error extracting ${label}: ${e.response?.data?.error || e.message}`);
        }
        setExtracting(null);
    };

    // UI Components
    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${activeTab === id
                ? 'bg-[#FFD700]/20 text-[#FFD700] border border-[#FFD700]/50'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
        >
            <Icon size={16} />
            <span className="font-mono text-sm tracking-wide">{label}</span>
        </button>
    );

    return (
        <div className="h-screen bg-[#050508] text-white font-mono flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 border-b border-gray-800 bg-[#0A0A0E] flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <Database className="text-[#FFD700]" />
                    <h1 className="text-xl font-bold tracking-widest text-white">INDRAJAAL <span className="text-[#FF9933] text-sm">EXTRACTION</span></h1>
                </div>

                <div className="flex items-center gap-4">
                    {device && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-[#00FF41]/10 rounded border border-[#00FF41]/30">
                            <Smartphone size={14} className="text-[#00FF41]" />
                            <span className="text-xs text-[#00FF41]">{device.model}</span>
                        </div>
                    )}
                    <button
                        onClick={() => setLiveMode(!liveMode)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs border transition-all ${liveMode
                            ? 'bg-red-500/10 text-red-500 border-red-500 animate-pulse'
                            : 'bg-white/5 text-gray-400 border-transparent hover:border-white/10'
                            }`}
                    >
                        <RefreshCw size={12} className={liveMode ? "animate-spin" : ""} />
                        {liveMode ? 'LIVE SYNC' : 'OFFLINE'}
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-800 bg-[#0A0A0E]/50 px-6 py-2 flex gap-2 overflow-x-auto shrink-0">
                <TabButton id="dashboard" label="CONTROLS" icon={Terminal} />
                <TabButton id="sms" label="SMS" icon={MessageSquare} />
                <TabButton id="calls" label="CALLS" icon={Phone} />
                <TabButton id="apps" label="APPS" icon={Grid} />
                <TabButton id="location" label="LOCATIONS" icon={MapPin} />
                <TabButton id="media" label="MEDIA" icon={Image} />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden flex">
                <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-grid-pattern bg-[size:20px_20px]">

                    {/* DASHBOARD / CONTROLS */}
                    {activeTab === 'dashboard' && (
                        <div className="flex gap-6 h-full">
                            {/* Controls */}
                            <div className="w-1/3 space-y-4">
                                <div className="p-4 bg-[#101015] border border-gray-800 rounded-xl">
                                    <h3 className="text-gray-400 text-xs uppercase mb-4">Extraction Targets</h3>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'sms', label: 'Extract SMS Database', icon: MessageSquare },
                                            { id: 'calls', label: 'Extract Call Logs', icon: Phone },
                                            { id: 'location', label: 'Extract GPS Hitstory', icon: MapPin },
                                            { id: 'apps', label: 'Audit Installed Apps', icon: Grid },
                                            { id: 'media', label: 'Scan Media Files', icon: Image },
                                        ].map((item) => (
                                            <button
                                                key={item.id}
                                                onClick={() => extractArtifact(item.id, item.label)}
                                                disabled={!!extracting}
                                                className="w-full text-left px-4 py-3 bg-[#151520] border border-gray-800 hover:border-[#FFD700] hover:bg-[#FFD700]/5 rounded flex justify-between items-center group transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={16} className="text-gray-500 group-hover:text-[#FFD700]" />
                                                    <span className="text-sm text-gray-300 group-hover:text-white">{item.label}</span>
                                                </div>
                                                {extracting === item.id ? <Loader2 className="animate-spin text-[#FFD700]" size={16} /> : <Download size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Logs */}
                            <div className="flex-1 bg-[#050508] border border-gray-800 rounded-xl flex flex-col overflow-hidden">
                                <div className="p-3 bg-[#101015] border-b border-gray-800 flex justify-between items-center">
                                    <span className="text-xs text-gray-500 uppercase">System Logs</span>
                                </div>
                                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1">
                                    {logs.map((log, i) => (
                                        <div key={i} className="text-[#00FF41]">
                                            <span className="opacity-50 mr-2">&gt;</span>{log}
                                        </div>
                                    ))}
                                    {logs.length === 0 && <div className="text-gray-700 italic">Ready for operation...</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SMS VIEW */}
                    {activeTab === 'sms' && (
                        <div className="bg-[#101015] border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 flex justify-between">
                                <h3 className="text-[#FFD700] text-sm font-bold">SMS MESSAGES ({data.sms.length})</h3>
                                <button onClick={() => extractArtifact('sms', 'SMS')} className="text-xs text-[#FFD700] hover:underline">REFRESH</button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-white/5 text-gray-400">
                                        <tr>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Address</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Message Body</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {data.sms.map((msg, i) => (
                                            <tr key={i} className="hover:bg-white/5">
                                                <td className="p-3">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${msg.type === "1" ? "bg-green-900/50 text-green-400" : "bg-blue-900/50 text-blue-400"}`}>
                                                        {msg.type_label || (msg.type === "1" ? "INBOX" : "SENT")}
                                                    </span>
                                                </td>
                                                <td className="p-3 font-bold text-gray-300">{msg.address}</td>
                                                <td className="p-3 text-gray-500 whitespace-nowrap">{msg.date}</td>
                                                <td className="p-3 text-gray-400 max-w-md truncate" title={msg.body}>{msg.body}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* CALL LOGS VIEW */}
                    {activeTab === 'calls' && (
                        <div className="bg-[#101015] border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 flex justify-between">
                                <h3 className="text-[#FFD700] text-sm font-bold">CALL LOGS ({data.calls.length})</h3>
                                <button onClick={() => extractArtifact('calls', 'Calls')} className="text-xs text-[#FFD700] hover:underline">REFRESH</button>
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="p-3">Type</th>
                                        <th className="p-3">Number</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Date</th>
                                        <th className="p-3">Duration</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {data.calls.map((call, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="p-3">
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${call.type_label === 'Missed' ? 'bg-red-900/50 text-red-500' :
                                                    call.type_label === 'Incoming' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'
                                                    }`}>
                                                    {call.type_label || call.type}
                                                </span>
                                            </td>
                                            <td className="p-3 font-bold text-gray-300">{call.number}</td>
                                            <td className="p-3 text-gray-400">{call.name}</td>
                                            <td className="p-3 text-gray-500">{new Date(Number(call.date) || call.date).toLocaleString()}</td>
                                            <td className="p-3 text-gray-500">{call.duration}s</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* APPS VIEW */}
                    {activeTab === 'apps' && (
                        <div className="bg-[#101015] border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 flex justify-between">
                                <h3 className="text-[#FFD700] text-sm font-bold">INSTALLED APPS ({data.apps.length})</h3>
                                <button onClick={() => extractArtifact('apps', 'Apps')} className="text-xs text-[#FFD700] hover:underline">REFRESH</button>
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="p-3">App Name</th>
                                        <th className="p-3">Package ID</th>
                                        <th className="p-3">Version</th>
                                        <th className="p-3">Installed On</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {data.apps.map((app, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="p-3 font-bold text-white">{app.name}</td>
                                            <td className="p-3 text-gray-400 font-mono">{app.package}</td>
                                            <td className="p-3 text-gray-500">{app.version}</td>
                                            <td className="p-3 text-gray-500">{app.installDate}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* LOCATIONS VIEW */}
                    {activeTab === 'location' && (
                        <div className="bg-[#101015] border border-gray-800 rounded-xl overflow-hidden">
                            <div className="p-4 border-b border-gray-800 flex justify-between">
                                <h3 className="text-[#FFD700] text-sm font-bold">LOCATION HISTORY ({data.locations.length})</h3>
                                <button onClick={() => extractArtifact('location', 'Location')} className="text-xs text-[#FFD700] hover:underline">REFRESH</button>
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/5 text-gray-400">
                                    <tr>
                                        <th className="p-3">Timestamp</th>
                                        <th className="p-3">Coordinates (Lat, Lng)</th>
                                        <th className="p-3">Address Hint</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {data.locations.map((loc, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="p-3 text-gray-400">{loc.time}</td>
                                            <td className="p-3 font-mono text-[#00FF41]">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</td>
                                            <td className="p-3 text-gray-500">{loc.address}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* MEDIA VIEW */}
                    {activeTab === 'media' && (
                        <div>
                            <div className="flex justify-end mb-4">
                                <button onClick={() => extractArtifact('media', 'Media')} className="text-xs bg-[#FFD700]/10 text-[#FFD700] px-3 py-1 rounded border border-[#FFD700]/30 hover:bg-[#FFD700]/20">SCAN MEDIA</button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {data.media.map((item, i) => {
                                    const isVideo = item.name.toLowerCase().endsWith('.mp4');
                                    const pathSegment = (item as any).path || item.name;
                                    const url = `${API_BASE}/media_content/${pathSegment}`;

                                    return (
                                        <div key={i} className="group relative aspect-square bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-[#FFD700] transition-all">
                                            {isVideo ? (
                                                <video src={url} className="w-full h-full object-cover" controls playsInline />
                                            ) : (
                                                <img src={url} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                                            )}

                                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-2 backdrop-blur-sm">
                                                <p className="text-[10px] text-white truncate" title={item.name}>{item.name}</p>
                                                <p className="text-[9px] text-gray-500">{item.size}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default IndrajaalExtraction;
