import React, { useState } from 'react';
import { Upload, Shield, Eye, Lock, FileText, Activity } from 'lucide-react';

const DivyaDrishtiViewer: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [vtReport, setVtReport] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [vtLoading, setVtLoading] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const uploadedFile = event.target.files?.[0];
        if (!uploadedFile) return;

        setFile(uploadedFile);
        setLoading(true);
        setAnalysis(null);
        setVtReport(null);

        // Simulate Analysis for now since backend might not be fully linked for this specific file path
        // In a real scenario, we'd POST to /api/analyze
        setTimeout(() => {
            setAnalysis({
                file_id: "FILE_" + Math.random().toString(36).substr(2, 9),
                hashes: { sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" },
                steganography: { detected: false }
            });
            setLoading(false);
        }, 2000);
    };

    const checkVirusTotal = async () => {
        if (!analysis?.file_id) return;
        setVtLoading(true);
        // Simulate VT Check
        setTimeout(() => {
            setVtReport({
                scan_analysis: { malicious: 0, harmless: 72, undetected: 5 },
                mitre_attack: {},
                behaviours: []
            });
            setVtLoading(false);
        }, 2500);
    };

    return (
        <div className="min-h-screen bg-[#050A18] text-white font-sans overflow-hidden relative selection:bg-cyan-500/30">

            {/* Background Ambience matches Trinetra */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-[#050A18] to-[#050A18] pointer-events-none -z-10" />

            {/* Header */}
            <header className="relative z-10 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <Eye className="w-8 h-8 text-cyan-400 animate-pulse" />
                    <h1 className="text-2xl font-bold tracking-[0.2em] font-display">
                        DIVYA DRISHTI <span className="text-white/30 text-sm font-mono">// CLASSIFIED VIEWER</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs tracking-widest font-mono">
                        <Lock className="w-3 h-3" />
                        SECURE ENVIRONMENT
                    </div>
                </div>
            </header>

            <main className="relative z-10 p-6 flex gap-6 h-[calc(100vh-80px)]">

                {/* Left Panel: Evidence Viewer */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex-1 bg-white/5 border border-white/10 rounded-lg overflow-hidden relative group">
                        {!file ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 hover:text-cyan-400 transition-colors">
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
                                        <div className="relative border border-cyan-500/30 p-1">
                                            <img src={URL.createObjectURL(file)} className="max-h-[60vh] object-contain opacity-90" alt="Evidence" />
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-cyan-500/5 pointer-events-none"></div>
                                            {/* Scan Line Effect */}
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent h-[10px] w-full animate-[scan_3s_linear_infinite] pointer-events-none"></div>
                                        </div>
                                    ) : (
                                        <div className="text-center">
                                            <FileText className="w-20 h-20 text-cyan-400 mx-auto mb-4" />
                                            <p className="text-xl font-display">{file.name}</p>
                                            <p className="text-white/50 text-sm font-mono">{file.size} bytes</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Bar */}
                    {analysis && (
                        <div className="h-16 bg-white/5 border border-white/10 rounded-lg flex items-center px-6 justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-xs text-white/50 font-mono">FILE ID: <span className="text-cyan-400">{analysis.file_id.substring(0, 8)}...</span></div>
                            </div>
                            <button
                                onClick={checkVirusTotal}
                                disabled={vtLoading}
                                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-6 py-2 rounded font-bold tracking-wider transition-all disabled:opacity-50"
                            >
                                {vtLoading ? <Activity className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                {vtLoading ? "CONNECTING TO SANDBOX..." : "INITIATE SANDBOX ANALYSIS"}
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel: Intelligence Stream */}
                <div className="w-[400px] bg-white/5 border border-white/10 rounded-lg flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-white/10 bg-white/5">
                        <h2 className="font-bold flex items-center gap-2 text-sm text-cyan-400 tracking-widest">
                            <Activity className="w-4 h-4" />
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
                                <div className="text-cyan-400 mt-2">ANALYZING ARTIFACT STRUCTURE...</div>
                            </div>
                        )}

                        {analysis && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="p-3 bg-white/5 border-l-2 border-cyan-400 rounded-r">
                                    <h3 className="text-cyan-400 font-bold mb-1">METADATA EXTRACTED</h3>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-white/70">
                                        {file && <div>Size: {file.size}</div>}
                                        {file && <div>Type: {file.type || 'Unknown'}</div>}
                                        <div className="col-span-2 truncate" title={analysis.hashes?.sha256}>SHA256: {analysis.hashes?.sha256}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {vtReport && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                <div className="border-t border-white/10 pt-4"></div>
                                <h3 className="text-yellow-400 font-bold flex items-center gap-2">
                                    <Shield className="w-3 h-3" /> EXTERNAL SANDBOX REPORT
                                </h3>

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

export default DivyaDrishtiViewer;
