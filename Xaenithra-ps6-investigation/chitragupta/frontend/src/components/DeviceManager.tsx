import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, RefreshCw, Folder, File, Download, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface DeviceManagerProps {
    onFilePulled: (file: any) => void;
}

interface ADBFile {
    name: string;
    path: string;
    isDir: boolean;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({ onFilePulled }) => {
    const [isConnected, setIsConnected] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [currentPath, setCurrentPath] = useState('/sdcard');
    const [files, setFiles] = useState<ADBFile[]>([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [pullingFile, setPullingFile] = useState<string | null>(null);

    const checkConnection = async (silent = false) => {
        setIsChecking(true);
        try {
            const res = await fetch('http://localhost:3000/api/device/status');
            const data = await res.json();
            setIsConnected(data.connected);
            if (data.connected && !silent) {
                toast.success("Device Connected", { description: "Android Debug Bridge active" });
                listFiles('/sdcard');
            } else if (!data.connected && !silent) {
                toast.error("No Device Found", { description: "Please connect via USB and enable Debugging" });
            }
        } catch (err) {
            console.error(err);
            if (!silent) toast.error("Connection Error", { description: "Is backend running?" });
        } finally {
            setIsChecking(false);
        }
    };

    const listFiles = async (path: string) => {
        setIsLoadingFiles(true);
        setCurrentPath(path);
        try {
            const res = await fetch(`http://localhost:3000/api/device/files?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.files) {
                // Sort: Directories first, then files
                const sorted = data.files.sort((a: ADBFile, b: ADBFile) => {
                    if (a.isDir === b.isDir) return a.name.localeCompare(b.name);
                    return a.isDir ? -1 : 1;
                });
                setFiles(sorted);
            } else {
                setFiles([]);
            }
        } catch (err) {
            toast.error("Failed to list files");
        } finally {
            setIsLoadingFiles(false);
        }
    };

    const pullFile = async (file: ADBFile) => {
        if (file.isDir) {
            listFiles(file.path);
            return;
        }

        setPullingFile(file.path);
        try {
            const res = await fetch('http://localhost:3000/api/device/pull', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filePath: file.path })
            });
            const data = await res.json();

            if (data.file) {
                toast.success("File Pulled Successfully", { description: `${file.name} secured.` });
                onFilePulled(data.file);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            toast.error("Pull Failed", { description: "Could not retrieve file from device." });
        } finally {
            setPullingFile(null);
        }
    };

    const goUp = () => {
        const parent = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/';
        listFiles(parent);
    };

    // Initial check
    useEffect(() => {
        checkConnection(true);
    }, []);

    return (
        <div className="space-y-4">
            {/* Status Card */}
            <div className={`p-4 rounded-lg border flex items-center justify-between ${isConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                <div className="flex items-center gap-3">
                    <Smartphone className={`w-6 h-6 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
                    <div>
                        <h3 className="font-medium text-sm text-foreground">
                            {isConnected ? 'Android Device Connected' : 'No Device Detected'}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {isConnected ? 'Ready for extraction' : 'Connect via USB & Enable Debugging'}
                        </p>
                    </div>
                </div>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkConnection(false)}
                    disabled={isChecking}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                    Check
                </Button>
            </div>

            {isConnected && (
                <Card className="bg-card border-border overflow-hidden">
                    <div className="p-3 bg-muted/30 border-b border-border flex items-center gap-2">
                        <Button size="icon" variant="ghost" onClick={goUp} disabled={currentPath === '/' || currentPath === '/sdcard'}>
                            <Folder className="w-4 h-4" />
                        </Button>
                        <span className="text-xs font-mono text-muted-foreground truncate flex-1">
                            {currentPath}
                        </span>
                        <Button size="icon" variant="ghost" onClick={() => listFiles(currentPath)} disabled={isLoadingFiles}>
                            <RefreshCw className={`w-3 h-3 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    <CardContent className="p-0 h-[300px] overflow-y-auto custom-scrollbar">
                        {files.length === 0 && !isLoadingFiles ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <p className="text-sm">Empty Directory</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {files.map((file) => (
                                    <motion.div
                                        key={file.path}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center justify-between p-3 hover:bg-muted/50 transition-colors cursor-pointer group"
                                        onClick={() => file.isDir && pullFile(file)}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {file.isDir ? (
                                                <Folder className="w-4 h-4 text-blue-400 shrink-0" />
                                            ) : (
                                                <File className="w-4 h-4 text-gray-400 shrink-0" />
                                            )}
                                            <span className="text-sm truncate text-foreground">{file.name}</span>
                                        </div>

                                        {!file.isDir && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    pullFile(file);
                                                }}
                                                disabled={pullingFile === file.path}
                                            >
                                                {pullingFile === file.path ? (
                                                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                                                ) : (
                                                    <Download className="w-4 h-4 text-primary" />
                                                )}
                                            </Button>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
