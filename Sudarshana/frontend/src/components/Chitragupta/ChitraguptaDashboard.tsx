import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, Lock } from 'lucide-react';
import ScrollReport from './ScrollReport';
import axios from 'axios';

const ChitraguptaDashboard: React.FC = () => {
    const [step, setStep] = useState<'upload' | 'generating' | 'done'>('upload');
    const [logs, setLogs] = useState<string[]>([]);
    const [reportUrl, setReportUrl] = useState('');

    const handleGenerate = async () => {
        setStep('generating');

        // Mock Logs for animation
        const mockLogs = [
            "Initializing Chain of Custody...",
            "Hashing artifact: log_dump_2024.txt [SHA-256 Verified]",
            "Hashing artifact: unknown.apk [SHA-256 Verified]",
            "Building Merkle Tree Root...",
            "Generating RSA-4096 Keypair...",
            "Signing Root Hash with Private Key...",
            "Karma Seal Applied."
        ];

        setLogs(mockLogs);

        try {
            // Actual API Call (mocked files)
            const res = await axios.post('http://localhost:8000/api/chitragupta/generate', {
                case_id: `CASE-${Math.floor(Math.random() * 10000)}`,
                files: [{ filename: 'log_dump_2024.txt', size: 1024 }, { filename: 'unknown.apk', size: 5000000 }]
            });

            setReportUrl(res.data.report_url);

            // Wait for animation
            setTimeout(() => {
                setStep('done');
            }, (mockLogs.length * 500) + 3000);

        } catch (e) {
            console.error(e);
            setStep('upload'); // Reset on error
        }
    };

    return (
        <div className="h-full w-full p-8 flex flex-col items-center">
            <h1 className="text-4xl text-amber-500 mythic-font glow-text mb-8">CHITRAGUPTA <span className="text-sm font-sans text-amber-200/50 tracking-widest ml-4">FORENSIC SCRIBE</span></h1>

            {step === 'upload' && (
                <div className="cyber-panel p-12 max-w-2xl w-full flex flex-col gap-6 items-center border-amber-500/30">
                    <div className="w-full h-40 border-2 border-dashed border-amber-500/20 rounded-lg flex flex-col items-center justify-center text-amber-500/50 hover:bg-amber-500/5 transition-colors cursor-pointer" onClick={handleGenerate}>
                        <Upload size={48} className="mb-4" />
                        <p>Drag & Drop Evidence Files or Click to Scan</p>
                    </div>

                    <div className="w-full space-y-2">
                        <div className="p-3 bg-black/40 rounded border border-white/10 flex justify-between items-center text-amber-100/80">
                            <span className="flex items-center gap-2"><FileText size={14} /> log_dump_2024.txt</span>
                            <span className="text-xs text-green-400">Ready</span>
                        </div>
                        <div className="p-3 bg-black/40 rounded border border-white/10 flex justify-between items-center text-amber-100/80">
                            <span className="flex items-center gap-2"><FileText size={14} /> unknown.apk</span>
                            <span className="text-xs text-green-400">Ready</span>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        className="px-8 py-3 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded shadow-[0_0_15px_rgba(217,119,6,0.5)] transition-all uppercase tracking-wider flex items-center gap-2"
                    >
                        <Lock size={16} /> Seal & Generate Report
                    </button>
                </div>
            )}

            {step === 'generating' && (
                <ScrollReport lines={logs} onComplete={() => setStep('done')} />
            )}

            {step === 'done' && (
                <div className="cyber-panel p-12 max-w-xl text-center border-green-500/30">
                    <CheckCircle size={64} className="text-green-500 mx-auto mb-6 hover:scale-110 transition-transform" />
                    <h2 className="text-2xl text-white mb-2">Report Generated Successfully</h2>
                    <p className="text-white/50 mb-8 font-mono break-all text-xs">PDF saved to server storage.</p>
                    <button onClick={() => setStep('upload')} className="text-amber-500 hover:underline">Start New Case</button>
                </div>
            )}
        </div>
    );
};

export default ChitraguptaDashboard;
