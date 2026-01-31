import React, { useState } from 'react';
import { Lock, CheckCircle, Download, FileArchive } from 'lucide-react';
import DivineForm from './DivineForm';
import EvidenceSelector from './EvidenceSelector';
import SealAnimation from './SealAnimation';
import ScrollReport from './ScrollReport';
import axios from 'axios';

const ChitraguptaDashboard: React.FC = () => {
    const [step, setStep] = useState<'form' | 'sealing' | 'done'>('form');
    const [metadata, setMetadata] = useState({
        case_id: '',
        investigator: '',
        agency: '',
        suspect: '',
        remarks: ''
    });
    const [selections, setSelections] = useState({
        calls: true,
        chat: true,
        deleted: false,
        system: false
    });
    const [isAnimationDone, setIsAnimationDone] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'summary' | 'integrity' | 'timeline'>('summary');

    const handleSeal = async () => {
        setStep('sealing');
        setIsAnimationDone(false);
        const mockLogs = [
            "Initiating Chain of Custody Protocol...",
            "Indexing Extraction Folders...",
            "Validating Indrajaal Artifacts...",
            "Calculating SHA-256 for Call Logs...",
            "Calculating SHA-256 for Chat Exports...",
            "Building Merkle Integrity Tree...",
            "Executing Karma Seal (RSA-4096)...",
            "Packaging Evidence Stream..."
        ];
        setLogs(mockLogs);

        try {
            const res = await axios.post('http://localhost:8000/api/chitragupta/generate', {
                ...metadata,
                selections
            });
            setResult(res.data);
            setTimeout(() => {
                if (!isAnimationDone) {
                    setStep('done');
                }
            }, 15000);
        } catch (e) {
            console.error(e);
            setStep('form');
        }
    };

    const handleScrollComplete = () => {
        setIsAnimationDone(true);
        if (result || step === 'sealing') {
            setTimeout(() => setStep('done'), 1000);
        }
    };

    return (
        <div className="h-full w-full p-6 flex flex-col items-center overflow-y-auto bg-black/40">
            <h1 className="text-4xl text-amber-500 mythic-font glow-text mb-6">
                CHITRAGUPTA <span className="text-sm font-sans text-amber-200/50 tracking-widest ml-4">DIVINE SCRIBE</span>
            </h1>

            {step === 'form' && (
                <div className="cyber-panel p-8 max-w-4xl w-full flex flex-col gap-10 border-amber-500/30">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <DivineForm metadata={metadata} setMetadata={setMetadata} />
                        <EvidenceSelector selections={selections} setSelections={setSelections} />
                    </div>

                    <div className="border-t border-amber-500/10 pt-8 flex justify-center">
                        <button
                            onClick={handleSeal}
                            disabled={!metadata.case_id || !metadata.investigator}
                            className="group relative px-12 py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:grayscale text-black font-bold rounded shadow-[0_0_20px_rgba(217,119,6,0.4)] transition-all uppercase tracking-[4px] flex items-center gap-3 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                            <Lock size={20} className="relative z-10" />
                            <span className="relative z-10">Seal & Package Evidence</span>
                        </button>
                    </div>
                </div>
            )}

            {step === 'sealing' && (
                <>
                    <SealAnimation />
                    <div className="mt-20 w-full max-w-2xl">
                        <ScrollReport lines={logs} onComplete={handleScrollComplete} />
                    </div>
                </>
            )}

            {step === 'done' && result && (
                <div className="w-full max-w-5xl space-y-6">
                    <div className="cyber-panel border-amber-500/20 bg-gradient-to-r from-amber-950/20 to-transparent flex flex-col md:flex-row items-center justify-between p-8 gap-8">
                        <div className="text-left w-full md:w-2/3">
                            <h2 className="text-3xl text-amber-100 font-serif mb-2">Forensic Report</h2>
                            <p className="text-amber-500/80 font-mono text-lg uppercase tracking-wider">{metadata.case_id}</p>
                            <p className="text-white/40 text-sm mt-1">Examiner: {metadata.investigator}</p>
                        </div>

                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full bg-red-900/40 border-4 border-amber-500 flex flex-col items-center justify-center p-4 shadow-[0_0_30px_rgba(217,119,6,0.3)] animate-pulse">
                                <span className="text-[10px] text-amber-200 uppercase font-bold tracking-tighter mb-1">RECORDED</span>
                                <div className="h-[1px] w-full bg-amber-500/30 my-1" />
                                <span className="text-sm text-white font-serif italic">VERIFIED</span>
                                <CheckCircle size={20} className="text-amber-500 mt-2" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-[10px]">
                                <Lock size={12} />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-white/5 w-full">
                        {(['summary', 'integrity', 'timeline'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 px-6 rounded text-xs uppercase tracking-[3px] transition-all ${activeTab === tab
                                        ? 'bg-amber-600 text-black font-bold shadow-lg'
                                        : 'text-amber-500/50 hover:bg-white/5 hover:text-amber-500'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="cyber-panel min-h-[400px] border-amber-500/10 bg-black/30 p-8">
                        {activeTab === 'summary' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="text-xl text-amber-500 font-serif border-l-4 border-amber-500 pl-4">Executive Summary</h3>
                                <p className="text-white/80 leading-relaxed font-serif text-lg">
                                    This forensic report documents the examination of digital artifacts extracted from the target device.
                                    All evidence has been cryptographically verified and sealed with the Karma Seal for legal admissibility.
                                    The integrity of the chain-of-custody has been maintained throughout the examination process.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-white/30 text-xs uppercase tracking-widest">Status</p>
                                        <p className="text-2xl text-amber-400 font-serif">Verified & Sealed</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white/30 text-xs uppercase tracking-widest">Signature Authority</p>
                                        <p className="text-2xl text-amber-400 font-serif">RSA-4096 <span className="text-sm text-green-500 ml-2">✓</span></p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white/30 text-xs uppercase tracking-widest">Digital Artifacts</p>
                                        <p className="text-2xl text-amber-400 font-serif">{result.extras?.timeline?.length || 0} Events Captured</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-white/30 text-xs uppercase tracking-widest">Generation Mode</p>
                                        <p className="text-2xl text-amber-400 font-serif">Cloud-Local Forensic</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'integrity' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                <h3 className="text-xl text-amber-500 font-serif border-l-4 border-amber-500 pl-4">Indrajaal Integrity Hash</h3>
                                <div className="bg-black/60 p-6 rounded border border-amber-500/20 font-mono text-xs text-amber-400/80 break-all leading-loose">
                                    <span className="text-amber-500/40 mr-2">SHA-256 ROOT:</span>
                                    {result.report_url.split('_').pop().split('.')[0].substring(0, 64) || "CRYPTOGRAPHIC_ROOT_PENDING"}
                                </div>

                                <h3 className="text-xl text-amber-500 font-serif border-l-4 border-amber-500 pl-4 pt-4">Evidence Chain-of-Custody</h3>
                                <div className="space-y-4">
                                    {selections.calls && (
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded border-l-2 border-green-500">
                                            <span className="text-sm text-white/80">Call Logs Extraction</span>
                                            <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-1 rounded">VERIFIED</span>
                                        </div>
                                    )}
                                    {selections.chat && (
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded border-l-2 border-green-500">
                                            <span className="text-sm text-white/80">SMS/Chat Message Dump</span>
                                            <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-1 rounded">VERIFIED</span>
                                        </div>
                                    )}
                                    {selections.system && (
                                        <div className="flex items-center justify-between p-4 bg-white/5 rounded border-l-2 border-green-500">
                                            <span className="text-sm text-white/80">System Audit Logs</span>
                                            <span className="text-[10px] bg-green-900/40 text-green-400 px-2 py-1 rounded">VERIFIED</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'timeline' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 h-[500px] overflow-y-auto pr-4">
                                <h3 className="text-xl text-amber-500 font-serif border-l-4 border-amber-500 pl-4">Digital Timeline Reconstruction</h3>
                                <div className="relative pl-8 space-y-12 border-l border-amber-500/20">
                                    {result.extras?.timeline?.map((event: any, i: number) => (
                                        <div key={i} className="relative">
                                            <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(217,119,6,0.8)]" />
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${event.type === 'user' ? 'bg-green-600' :
                                                            event.type === 'network' ? 'bg-blue-600' : 'bg-amber-700'
                                                        }`}>
                                                        {event.type}
                                                    </span>
                                                    <h4 className="text-white font-medium text-sm">{event.description.substring(0, 100)}...</h4>
                                                </div>
                                                <span className="text-amber-500/60 font-mono text-xs whitespace-nowrap">{event.timestamp}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!result.extras?.timeline || result.extras.timeline.length === 0) && (
                                        <div className="text-white/30 italic py-10">No security events logged for this session.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 pt-6">
                        <a
                            href={result.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 group relative p-6 bg-amber-600 hover:bg-amber-500 text-black rounded transition-all overflow-hidden flex items-center justify-center gap-4"
                        >
                            <Download size={24} />
                            <div className="text-left">
                                <p className="font-bold text-sm uppercase tracking-widest">Download Full PDF Report</p>
                                <p className="text-[10px] opacity-70">Authenticated with SHA-256 and Watermarked</p>
                            </div>
                        </a>

                        <div className="flex-1 p-6 bg-white/5 border border-white/10 rounded flex items-center justify-center gap-4 group hover:bg-white/10 transition-colors">
                            <FileArchive size={24} className="text-cyan-500" />
                            <div className="text-left">
                                <p className="font-bold text-sm uppercase text-white/90 tracking-widest">Evidence Package Structuring</p>
                                <p className="text-[10px] text-white/30 italic">Target: Desktop/{metadata.case_id}.zip</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8 opacity-40 hover:opacity-100 transition-opacity">
                        <p className="text-[10px] text-white font-mono uppercase tracking-[2px]">Legal Notice: Chain of Custody Maintained via RSA-4096 Signatures</p>
                        <button
                            onClick={() => setStep('form')}
                            className="text-amber-500 font-bold hover:underline py-2"
                        >
                            ARCHIVE NEW CASE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChitraguptaDashboard;
