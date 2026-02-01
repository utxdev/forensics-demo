import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Database, FileText, CheckCircle, Shield, Download, Lock, ChevronRight, Activity } from 'lucide-react';
import { toast } from 'sonner';

// Types
import { ForensicFile } from '@/types/forensic';

interface PipelineWizardProps {
    onFilePulled: (file: ForensicFile) => void;
}

export const PipelineWizard: React.FC<PipelineWizardProps> = ({ onFilePulled }) => {
    const [stage, setStage] = useState<1 | 2 | 3>(1);
    const [deviceDetails, setDeviceDetails] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fileList, setFileList] = useState<{ name: string, path: string, isDir: boolean }[]>([]);
    const [currentPath, setCurrentPath] = useState('/sdcard');
    const [logs, setLogs] = useState<string[]>([]);

    // --- Stage 1: Handshake ---
    const performHandshake = async () => {
        setIsLoading(true);
        addLog("Initiating USB Handshake...");
        try {
            const res = await fetch('http://localhost:3001/api/data-pipeline/handshake');
            const data = await res.json();

            if (data.model && data.model !== 'Unknown') {
                setDeviceDetails(data);
                addLog(`RSA Key Exchange Successful.`);
                addLog(`Device Authorized: ${data.model} (${data.serial})`);
                addLog(`Secure Tunnel Established via ADB.`);
                toast.success("Stage 1 Complete", { description: "Physical Connection Secured" });

                // Auto-fetch files for Stage 2
                fetchFiles('/sdcard');
            } else {
                addLog("Handshake Failed. Is USB Debugging enabled?");
                toast.error("Device Not Found");
            }
        } catch (err) {
            addLog("Error connecting to backend pipe.");
        } finally {
            setIsLoading(false);
        }
    };

    // --- Stage 2: Extraction ---
    const fetchFiles = async (path: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/device/files?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.files) {
                setFileList(data.files); // Show ALL items (folders and files)
                setCurrentPath(path);
            }
        } catch (e) { }
    };

    const navigateToFolder = (folderPath: string) => {
        fetchFiles(folderPath);
    };

    const pullFile = async (filePath: string) => {
        setIsLoading(true);
        addLog(`INDRAJAAL: Pulling ${filePath}...`);
        try {
            const res = await fetch('http://localhost:3001/api/data-pipeline/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath })
            });
            const data = await res.json();

            if (data.file) {
                addLog(`Transfer Complete.`);
                addLog(`IMMEDIATE HASH (SHA-256): ${data.file.currentHash.substring(0, 20)}...`);
                addLog(`Evidence secured in sandbox.`);
                onFilePulled(data.file);
                toast.success("Stage 2 Complete", { description: "Evidence Extracted & Hashed" });
                setStage(3);
            }
        } catch (err) {
            addLog("Extraction Failed.");
        } finally {
            setIsLoading(false);
        }
    };

    // Helper
    const addLog = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    return (
        <div className="max-w-4xl mx-auto space-y-6">

            {/* Progress Stepper */}
            <div className="flex justify-between mb-8 relative">
                <div className="absolute top-1/2 left-0 w-full h-1 bg-border -z-10" />
                {[
                    { id: 1, label: "Physical Connection", icon: Smartphone },
                    { id: 2, label: "Indrajaal Extraction", icon: Database },
                    { id: 3, label: "Chitragupta Report", icon: FileText }
                ].map((s) => (
                    <div key={s.id} className={`flex flex-col items-center gap-2 bg-background p-2 ${stage >= s.id ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${stage >= s.id ? 'border-primary bg-primary/10' : 'border-muted bg-muted'}`}>
                            <s.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* Stage 1: Handshake UI */}
            {stage === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-yellow-500" />
                            Stage 1: The Handshake
                        </CardTitle>
                        <CardDescription>Establish a trusted physical link with the suspect device via USB.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/20">
                            {!deviceDetails ? (
                                <div className="text-center space-y-4">
                                    <Smartphone className="w-16 h-16 mx-auto text-muted-foreground animate-pulse" />
                                    <p>Connect Device & Enable USB Debugging</p>
                                    <Button onClick={performHandshake} disabled={isLoading}>
                                        {isLoading ? "Negotiating RSA Keys..." : "Initiate Handshake Protocol"}
                                    </Button>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
                                    <h3 className="text-xl font-bold text-green-500">Secure Tunnel Established</h3>
                                    <div className="grid grid-cols-2 gap-4 text-left bg-card p-4 rounded border">
                                        <div><span className="text-xs text-muted-foreground">Model:</span> <p>{deviceDetails.model}</p></div>
                                        <div><span className="text-xs text-muted-foreground">Serial:</span> <p>{deviceDetails.serial}</p></div>
                                        <div><span className="text-xs text-muted-foreground">Protocol:</span> <p>ADB Secure Bridge</p></div>
                                        <div><span className="text-xs text-muted-foreground">Status:</span> <p className="text-green-400">Authorized</p></div>
                                    </div>
                                    <Button onClick={() => setStage(2)}>Proceed to Extraction</Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stage 2: Extraction UI */}
            {stage === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Stage 2: Indrajaal Extraction
                        </CardTitle>
                        <CardDescription>Pull databases through the secure tunnel. Hashes are calculated immediately on arrival.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="border rounded-md p-4 h-[300px] overflow-y-auto">
                                <h4 className="font-semibold mb-2 text-sm text-muted-foreground">Remote File System ({currentPath})</h4>
                                {fileList.length === 0 ? <p className="text-sm italic">Loading files or empty...</p> : (
                                    <ul className="space-y-2">
                                        {fileList.map((f, i) => (
                                            <li key={i} className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer group">
                                                <div className="flex items-center gap-2" onClick={() => f.isDir ? navigateToFolder(f.path) : null}>
                                                    {f.isDir ? (
                                                        <>
                                                            <Database className="w-4 h-4 text-blue-400" />
                                                            <span className="text-sm truncate max-w-[150px]">{f.name}</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="w-4 h-4 text-gray-400" />
                                                            <span className="text-sm truncate max-w-[150px]">{f.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                                {!f.isDir && (
                                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => pullFile(f.path)}>
                                                        <Download className="w-3 h-3" />
                                                    </Button>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="bg-black/90 text-green-400 font-mono text-xs p-4 rounded h-[300px] overflow-y-auto">
                                <div className="sticky top-0 bg-black/90 pb-2 border-b border-green-900 mb-2">System Logs</div>
                                {logs.map((log, i) => (
                                    <div key={i} className="mb-1">{log}</div>
                                ))}
                                {isLoading && <div className="animate-pulse">_</div>}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stage 3: Reporting UI - Simple placeholder, as verifying the file switches focus to main report gen */}
            {stage === 3 && (
                <Card className="text-center p-12">
                    <Shield className="w-20 h-20 mx-auto text-purple-500 mb-6" />
                    <h2 className="text-2xl font-bold mb-2">Stage 3: Evidence Secured</h2>
                    <p className="text-muted-foreground mb-6">
                        The file has been successfully hashed and added to the Chain of Custody.
                        Required metadata for Chitragupta (Device ID, Time, Hash) has been logged.
                    </p>
                    <Button variant="outline" onClick={() => { setStage(1); setDeviceDetails(null); setLogs([]); }}>
                        Start New Extraction
                    </Button>
                </Card>
            )}

        </div>
    );
};
