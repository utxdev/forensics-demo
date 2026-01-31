import React, { useState, useEffect } from 'react';
import ChakraRadar from './ChakraRadar';
import { Activity, Shield, Wifi, Smartphone } from 'lucide-react';

const SudarshanaDashboard: React.FC = () => {
    const [status, setStatus] = useState<any>({ threat_score: 0, recent_packets: [], device_connected: false });
    const [socket, setSocket] = useState<WebSocket | null>(null);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/sudarshana');
        ws.onopen = () => console.log('Connected to Sudarshana Net');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setStatus(data);
        };
        setSocket(ws);
        return () => ws.close();
    }, []);

    const threatLevel = status.threat_score > 50 ? 'high' : status.threat_score > 10 ? 'medium' : 'low';

    return (
        <div className="h-full w-full p-8 grid grid-cols-12 gap-6">
            {/* Header */}
            <div className="col-span-12 flex justify-between items-center border-b border-white/10 pb-4 mb-4">
                <h1 className="text-4xl text-yellow-400 mythic-font glow-text">SUDARSHANA <span className="text-sm font-sans text-cyan-400 tracking-widest ml-4">THREAT DEFENSE MATRIX</span></h1>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-cyan-300">
                        <Activity size={18} />
                        <span>System Active</span>
                    </div>
                    <div className={`flex items-center gap-2 ${status.device_connected ? 'text-green-400' : 'text-red-400'}`}>
                        <Smartphone size={18} />
                        <span>{status.device_connected ? 'Device Linked' : 'No Device'}</span>
                    </div>
                </div>
            </div>

            {/* Main Radar Area */}
            <div className="col-span-12 lg:col-span-5 flex flex-col items-center justify-center cyber-panel min-h-[500px] relative overflow-hidden">
                <ChakraRadar threatLevel={threatLevel} isScanning={true} />
                <div className="absolute bottom-4 left-4 text-xs text-white/50 font-mono">
                    <p>ROTATION_SPEED: {threatLevel === 'high' ? 'MAX' : 'NORM'}</p>
                    <p>TARGET_LOCK: {status.threat_score > 0 ? 'ENGAGED' : 'IDLE'}</p>
                </div>
            </div>

            {/* Live Feed & Stats */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-blue-900/20 p-4 border border-blue-500/30 rounded">
                        <h3 className="text-cyan-400 text-sm mb-1">THREAT SCORE</h3>
                        <p className="text-3xl font-bold text-white">{status.threat_score}</p>
                    </div>
                    <div className="bg-blue-900/20 p-4 border border-blue-500/30 rounded">
                        <h3 className="text-cyan-400 text-sm mb-1">PACKETS SCANNED</h3>
                        <p className="text-3xl font-bold text-white">{(status.recent_packets?.length || 0) * 123 + 450}</p> {/* Demo filler math */}
                    </div>
                    <div className="bg-blue-900/20 p-4 border border-blue-500/30 rounded">
                        <h3 className="text-cyan-400 text-sm mb-1">ACTIVE NODES</h3>
                        <p className="text-3xl font-bold text-white">4</p>
                    </div>
                </div>

                {/* Packet Log */}
                <div className="flex-1 cyber-panel p-4 overflow-hidden flex flex-col">
                    <h3 className="text-yellow-500 mb-4 flex items-center gap-2"><Wifi size={16} /> LIVE TRAFFIC INTERCEPT</h3>
                    <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2">
                        {status.recent_packets?.map((pkt: any, i: number) => (
                            <div key={i} className={`p-2 border-l-2 ${pkt.threat ? 'border-red-500 bg-red-900/20' : 'border-cyan-500 bg-cyan-900/10'}`}>
                                <div className="flex justify-between text-white/70">
                                    <span>{pkt.src} &rarr; {pkt.dst}</span>
                                    <span>{pkt.protocol}</span>
                                </div>
                                <div className="text-white/40 mt-1 truncate">{pkt.info || `Len: ${pkt.length}`}</div>
                            </div>
                        ))}
                        {/* Fallback empty state */}
                        {!status.recent_packets?.length && <div className="text-center text-white/30 mt-10">Waiting for intercept...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SudarshanaDashboard;
