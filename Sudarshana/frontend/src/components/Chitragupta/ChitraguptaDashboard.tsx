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
    const [result, setResult] = useState<any>(null);
    const [logs, setLogs] = useState<string[]>([]);

    const handleSeal = async () => {
        setStep('sealing');
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
            const res = await axios.post('http://localhost:8000/api/chitragupta/generate', metadata);
            setResult(res.data);

            // Allow animation to play
            setTimeout(() => {
                setStep('done');
            }, 6000);
        } catch (e) {
            console.error(e);
            setStep('form');
        }
    };

    return (
        <div className="h-full w-full p-8 flex flex-col items-center overflow-y-auto">
            <h1 className="text-4xl text-amber-500 mythic-font glow-text mb-8">
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
                        <ScrollReport lines={logs} onComplete={() => { }} />
                    </div>
                </>
            )}

            {step === 'done' && result && (
                <div className="cyber-panel p-12 max-w-2xl w-full text-center border-green-500/30 space-y-8">
                    <div className="relative inline-block">
                        <CheckCircle size={80} className="text-green-500 mx-auto animate-bounce" />
                        <div className="absolute inset-0 bg-green-500 blur-2xl opacity-20" />
                    </div>

                    <div>
                        <h2 className="text-3xl text-white mythic-font mb-2">INTEGRITY SEALED</h2>
                        <p className="text-white/50 font-mono text-sm uppercase tracking-widest">
                            Case {metadata.case_id} has been recorded in the Divine Ledger
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <a
                            href={result.report_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-lg hover:bg-amber-500/10 hover:border-amber-500 transition-all border-dashed"
                        >
                            <Download size={32} className="text-amber-500" />
                            <span className="text-xs uppercase tracking-tighter">Download PDF Report</span>
                        </a>
                        <div
                            className="flex flex-col items-center gap-3 p-6 bg-white/5 border border-white/10 rounded-lg opacity-80 cursor-default border-dashed"
                            title={`Saved to ${result.zip_path}`}
                        >
                            <FileArchive size={32} className="text-cyan-500" />
                            <span className="text-xs uppercase tracking-tighter">ZIP Package Ready</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setStep('form')}
                        className="text-amber-500/40 hover:text-amber-500 text-xs uppercase tracking-widest pt-8 transition-colors"
                    >
                        Archive New Case
                    </button>

                    <p className="text-[10px] text-white/20 font-mono mt-4 italic">
                        Legal Notice: ZIP package structured and saved to Investigation Desktop.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ChitraguptaDashboard;
