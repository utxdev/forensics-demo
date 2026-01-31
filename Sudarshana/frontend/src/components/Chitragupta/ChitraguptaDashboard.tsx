import React, { useState, useRef } from 'react';
import { FileText, Upload, CheckCircle, Lock, X } from 'lucide-react';
import ScrollReport from './ScrollReport';
import axios from 'axios';

const ChitraguptaDashboard: React.FC = () => {
    const [step, setStep] = useState<'upload' | 'generating' | 'done'>('upload');
    const [logs, setLogs] = useState<string[]>([]);
    const [reportUrl, setReportUrl] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = async () => {
        if (selectedFiles.length === 0) return;

        setStep('generating');
        const currentLogs = ["Initializing Chain of Custody..."];
        setLogs([...currentLogs]);

        try {
            const uploadedFilesData = [];

            for (const file of selectedFiles) {
                setLogs(prev => [...prev, `Uploading evidence: ${file.name}...`]);

                const formData = new FormData();
                formData.append('file', file);

                const uploadRes = await axios.post('http://localhost:8000/api/chitragupta/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                uploadedFilesData.push({
                    filename: uploadRes.data.filename,
                    size: uploadRes.data.size
                });

                setLogs(prev => [...prev, `Uploaded: ${file.name} [Verified]`]);
            }

            setLogs(prev => [...prev, "All evidence secured. Hashing artifacts...", "Building Merkle Tree Root...", "Signing Root Hash with Private Key..."]);

            // Actual API Call
            const res = await axios.post('http://localhost:8000/api/chitragupta/generate', {
                case_id: `CASE-${Math.floor(Math.random() * 10000)}`,
                files: uploadedFilesData
            });

            setReportUrl(res.data.report_url);
            setLogs(prev => [...prev, "Karma Seal Applied.", "Report Generated successfully."]);

            // Allow time to read logs
            setTimeout(() => {
                setStep('done');
            }, 3000);

        } catch (e) {
            console.error(e);
            setLogs(prev => [...prev, "CRITICAL ERROR: Operation Failed."]);
            setTimeout(() => setStep('upload'), 3000);
        }
    };

    return (
        <div className="h-full w-full p-8 flex flex-col items-center">
            <h1 className="text-4xl text-amber-500 mythic-font glow-text mb-8">CHITRAGUPTA <span className="text-sm font-sans text-amber-200/50 tracking-widest ml-4">FORENSIC SCRIBE</span></h1>

            {step === 'upload' && (
                <div className="cyber-panel p-12 max-w-2xl w-full flex flex-col gap-6 items-center border-amber-500/30">
                    <input
                        type="file"
                        multiple
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />

                    <div
                        className="w-full h-40 border-2 border-dashed border-amber-500/20 rounded-lg flex flex-col items-center justify-center text-amber-500/50 hover:bg-amber-500/5 transition-colors cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload size={48} className="mb-4" />
                        <p>Click to Select Evidence Files</p>
                    </div>

                    <div className="w-full space-y-2 max-h-60 overflow-y-auto">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="p-3 bg-black/40 rounded border border-white/10 flex justify-between items-center text-amber-100/80">
                                <span className="flex items-center gap-2 truncate max-w-[80%]">
                                    <FileText size={14} className="shrink-0" /> {file.name}
                                </span>
                                <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                        {selectedFiles.length === 0 && (
                            <p className="text-center text-white/20 italic">No evidence selected.</p>
                        )}
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={selectedFiles.length === 0}
                        className={`px-8 py-3 font-bold rounded shadow-[0_0_15px_rgba(217,119,6,0.5)] transition-all uppercase tracking-wider flex items-center gap-2 ${selectedFiles.length === 0
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed shadow-none'
                            : 'bg-amber-600 hover:bg-amber-500 text-black'
                            }`}
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
                    <p className="text-white/50 mb-8 font-mono break-all text-xs">Evidence sealed and report archived.</p>

                    {/* In a real app, this would be a download link */}
                    <a href={`http://localhost:8000${reportUrl}`} target="_blank" rel="noreferrer" className="block mb-4 px-6 py-2 bg-green-600/20 text-green-400 border border-green-500 rounded hover:bg-green-600/30 transition-colors">
                        Download Report PDF
                    </a>

                    <button onClick={() => {
                        setSelectedFiles([]);
                        setStep('upload');
                    }} className="text-amber-500 hover:underline">Start New Case</button>
                </div>
            )}
        </div>
    );
};

export default ChitraguptaDashboard;
