import React, { useState } from 'react';
import { Upload, Shield, Eye, Lock, FileText, Activity } from 'lucide-react';
import axios from 'axios';

function App() {
    const [file, setFile] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [vtReport, setVtReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [vtLoading, setVtLoading] = useState(false);
    const [showVt, setShowVt] = useState(false);

    const handleFileUpload = async (event) => {
        const uploadedFile = event.target.files[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setLoading(true);
        setAnalysis(null);
        setVtReport(null);
        setShowVt(false);

        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            // Using /api proxy configured in vite.config.js
            const response = await axios.post('/api/analyze', formData);
            setAnalysis(response.data);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Analysis failed. Ensure backend is running.");
        } finally {
            setLoading(false);
        }
    };

    const checkVirusTotal = async () => {
        if (!analysis?.file_id) return;
        setVtLoading(true);
        try {
            const response = await axios.post(`/api/sandbox/${analysis.file_id}`);
            setVtReport(response.data);
            setShowVt(true);
        } catch (error) {
            console.error("VT Sandbox failed:", error);
            alert("Sandbox request failed.");
        } finally {
            setVtLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cyber-black text-white overflow-hidden relative selection:bg-neon-cyan selection:text-black">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0.5)_1px,transparent_1px)] bg-[size:40px_40px] z-0 pointer-events-none"></div>

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-neon-cyan animate-pulse" />
                    <h1 className="text-2xl font-bold tracking-[0.2em] font-rajdhani">
                        DIVYA DRISHTI <span className="text-white/30 text-sm">// CLASSIFIED VIEWER</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs tracking-widest">
                        <Lock className="w-3 h-3" />
                        SECURE ENVIRONMENT
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-6 flex gap-6 h-[calc(100vh-80px)]">

                {/* Left Panel: Evidence Viewer */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 bg-cyber-panel border border-white/10 rounded-lg overflow-hidden relative group">
                        {!file ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 hover:text-neon-cyan transition-colors">
                                <Upload className="w-16 h-16 mb-4 opacity-50" />
                                <p className="tracking-widest font-mono text-sm">AWAITING EVIDENCE INPUT</p>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileUpload}
                                />
                            </div>
                        ) : (
                            <div className="w-full h-full flex flex-col relative">
                                {/* Secure Banner */}
                                <div className="bg-red-900/80 text-white text-center text-xs font-mono py-1 tracking-widest flex items-center justify-center gap-2">
                                    <Lock className="w-3 h-3" /> READ-ONLY // MODIFICATION DISABLED
                                </div>

                                <div className="flex-1 flex items-center justify-center p-4 bg-black/40">
                                    {file.type.startsWith('image/') ? (
                                        <div className="relative border border-neon-cyan/30 p-1">
                                            <img src={URL.createObjectURL(file)} className="max-h-[60vh] object-contain opacity-90" alt="Evidence" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neon-cyan/5 pointer-events-none"></div>
                                            {/* Scan Line Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-neon-cyan/20 to-transparent h-[10px] w-full animate-[scan_3s_linear_infinite] pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <FileText className="w-20 h-20 text-neon-cyan mx-auto mb-4" />
                                            <p className="text-xl font-rajdhani">{file.name}</p>
                                            <p className="text-white/50 text-sm font-mono">{file.size} bytes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    {analysis && (
                        <div className="h-16 bg-cyber-panel border border-white/10 rounded-lg flex items-center px-6 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-white/50 font-mono">FILE ID: <span className="text-neon-cyan">{analysis.file_id.substring(0, 8)}...</span></div>
                            </div>
                            <button
                                onClick={checkVirusTotal}
                                disabled={vtLoading}
                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-2 rounded font-rajdhani font-bold tracking-wider transition-all disabled:opacity-50"
                            >
                                {vtLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                {vtLoading ? "CONNECTING TO SANDBOX..." : "INITIATE SANDBOX ANALYSIS"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Intelligence Stream */}
                <div className="w-[400px] bg-cyber-panel border border-white/10 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                        <h2 className="font-rajdhani font-bold flex items-center gap-2">
                            <Activity className="w-4 h-4 text-neon-cyan" />
                            INTELLIGENCE STREAM
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-xs">
                        {!analysis && !loading && (
                            <div className="text-white/20 text-center mt-20">SYSTEM IDLE</div>
                        )}

                        {loading && (
                            <div className="space-y-2">
                                <div className="h-2 bg-white/10 rounded animate-pulse w-3/4"></div>
                                <div className="h-2 bg-white/10 rounded animate-pulse w-1/2"></div>
                                <div className="h-2 bg-white/10 rounded animate-pulse w-full"></div>
                                <div className="text-neon-cyan mt-2">ANALYZING ARTIFACT STRUCTURE...</div>
                            </div>
                        )}

                        {analysis && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-3 bg-white/5 border-l-2 border-neon-cyan rounded-r">
                                    <h3 className="text-neon-cyan font-bold mb-1">METADATA EXTRACTED</h3>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-white/70">
                                        <div>Size: {file.size}</div>
                                        <div>Type: {file.type || 'Unknown'}</div>
                                        <div className="col-span-2 truncate" title={analysis.hashes?.sha256}>SHA256: {analysis.hashes?.sha256}</div>
                                    </div>
                                </div>

                                {analysis.steganography?.detected && (
                                    <div className="p-3 bg-red-500/10 border-l-2 border-red-500 rounded-r">
                                        <h3 className="text-red-500 font-bold mb-1">ANOMALY DETECTED</h3>
                                        <p className="text-white/80">Potential payload hidden in file structure.</p>
                                        <p className="text-red-400 mt-1">{analysis.steganography.message}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {vtReport && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="border-t border-white/10 pt-4"></div>
                                <h3 className="text-neon-gold font-bold flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> EXTERNAL SANDBOX REPORT
                                </h3>

                                {vtReport.error ? (
                                    <div className="p-3 bg-red-500/10 border-l-2 border-red-500 rounded-r">
                                        <h3 className="text-red-500 font-bold mb-1">ANALYSIS FAILED</h3>
                                        <p className="text-white/80">{vtReport.error}</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* 1. Detection Summary */}
                                        <div className="p-3 bg-black/40 border border-white/10 rounded">
                                            <div className="mb-2">
                                                <span className="text-white/50">Detection:</span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className={`text-xl font-bold ${vtReport.scan_analysis?.malicious > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {vtReport.scan_analysis?.malicious || 0} / {vtReport.scan_analysis?.harmless + vtReport.scan_analysis?.malicious + vtReport.scan_analysis?.undetected || 'TOTAL'}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-wider text-white/50">VENDORS FLAGGED</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. MITRE ATT&CK Matrix */}
                                        {vtReport.mitre_attack && Object.keys(vtReport.mitre_attack).length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-neon-cyan font-bold text-xs tracking-widest border-b border-neon-cyan/20 pb-1">MITRE ATT&CK TACTICS</h3>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {Object.entries(vtReport.mitre_attack).slice(0, 5).map(([tactic, techniques], i) => (
                                                        <div key={i} className="bg-white/5 p-2 rounded border-l border-neon-gold/50">
                                                            <div className="text-[10px] text-neon-gold font-bold uppercase mb-1">{tactic.replace(/_/g, ' ')}</div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {techniques.slice(0, 3).map((tech, j) => (
                                                                    <span key={j} className="text-[9px] bg-black/50 px-1.5 py-0.5 rounded text-white/70 border border-white/5">
                                                                        {tech.id}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 3. Behavioral Network Analysis (Aggregated) */}
                                        {vtReport.behaviours?.some(b => b.attributes?.ip_traffic) && (
                                            <div className="space-y-2">
                                                <h3 className="text-neon-cyan font-bold text-xs tracking-widest border-b border-neon-cyan/20 pb-1">NETWORK TRAFFIC</h3>
                                                <div className="space-y-1">
                                                    {vtReport.behaviours
                                                        .flatMap(b => b.attributes?.ip_traffic || [])
                                                        .filter((v, i, a) => a.findIndex(t => t.destination_ip === v.destination_ip) === i) // Uniq IPs
                                                        .slice(0, 5)
                                                        .map((traffic, i) => (
                                                            <div key={i} className="flex items-center justify-between text-[10px] bg-white/5 px-2 py-1 rounded">
                                                                <span className="font-mono text-neon-cyan">{traffic.destination_ip}</span>
                                                                <span className="text-white/40">{traffic.transport_layer_protocol || 'TCP'} : {traffic.destination_port}</span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* 4. High Confidence Signatures */}
                                        {vtReport.behaviours?.some(b => b.attributes?.signature_matches) && (
                                            <div className="space-y-2">
                                                <h3 className="text-red-400 font-bold text-xs tracking-widest border-b border-red-500/20 pb-1">THREAT SIGNATURES</h3>
                                                <ul className="space-y-1">
                                                    {vtReport.behaviours
                                                        .flatMap(b => b.attributes?.signature_matches || [])
                                                        .slice(0, 5)
                                                        .map((sig, i) => (
                                                            <li key={i} className="text-[10px] text-red-300 flex items-start gap-2">
                                                                <span className="text-red-500 mt-0.5">⚠️</span>
                                                                {sig}
                                                            </li>
                                                        ))}
                                                </ul>
                                            </div>
                                        )}

                                        {vtReport.report_link && (
                                            <a
                                                href={vtReport.report_link}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block text-center py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan text-xs border border-neon-cyan/30 rounded transition-colors mt-4"
                                            >
                                                VIEW FULL INTELLIGENCE REPORT
                                            </a>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
        </div>
    )
}

export default App;
