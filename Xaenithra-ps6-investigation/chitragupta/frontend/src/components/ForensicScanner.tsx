import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
    Search,
    Download,
    FileText,
    Image,
    Video,
    Music,
    Archive,
    Database,
    Smartphone,
    CheckCircle,
    Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { ForensicFile } from '@/types/forensic';

interface ForensicScannerProps {
    onFilesSelected?: (files: ForensicFile[]) => void;
}

interface ScanResult {
    name: string;
    path: string;
    size: number;
    permissions?: string;
    sha256?: string;
}

export const ForensicScanner: React.FC<ForensicScannerProps> = ({ onFilesSelected }) => {
    const [scanPath, setScanPath] = useState('/sdcard');
    const [selectedTypes, setSelectedTypes] = useState<string[]>(['all']);
    const [maxDepth, setMaxDepth] = useState(5);
    const [calculateHashes, setCalculateHashes] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [scanMetadata, setScanMetadata] = useState<any>(null);
    const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

    const fileTypeOptions = [
        { id: 'all', label: 'All Files', icon: FileText },
        { id: 'images', label: 'Images', icon: Image },
        { id: 'videos', label: 'Videos', icon: Video },
        { id: 'audio', label: 'Audio', icon: Music },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'databases', label: 'Databases', icon: Database },
        { id: 'archives', label: 'Archives', icon: Archive },
        { id: 'apks', label: 'APK Files', icon: Smartphone },
    ];

    const toggleFileType = (typeId: string) => {
        if (typeId === 'all') {
            setSelectedTypes(['all']);
        } else {
            const newTypes = selectedTypes.filter(t => t !== 'all');
            if (newTypes.includes(typeId)) {
                const filtered = newTypes.filter(t => t !== typeId);
                setSelectedTypes(filtered.length === 0 ? ['all'] : filtered);
            } else {
                setSelectedTypes([...newTypes, typeId]);
            }
        }
    };

    const startScan = async () => {
        setIsScanning(true);
        setScanResults([]);
        setScanMetadata(null);
        setSelectedFiles(new Set());

        try {
            const response = await fetch('http://localhost:3001/api/forensic-scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startPath: scanPath,
                    fileTypes: selectedTypes,
                    maxDepth: maxDepth,
                    calculateHashes: calculateHashes
                })
            });

            const data = await response.json();

            if (data.success) {
                setScanResults(data.files || []);
                setScanMetadata(data);
                toast.success('Scan Complete', {
                    description: `Found ${data.total_files_found} files (${data.total_size_mb} MB)`
                });
            } else {
                toast.error('Scan Failed', {
                    description: data.error || 'Unknown error'
                });
            }
        } catch (error) {
            console.error('Scan error:', error);
            toast.error('Scan Failed', {
                description: error instanceof Error ? error.message : 'Network error'
            });
        } finally {
            setIsScanning(false);
        }
    };

    const toggleFileSelection = (filePath: string) => {
        const newSelected = new Set(selectedFiles);
        if (newSelected.has(filePath)) {
            newSelected.delete(filePath);
        } else {
            newSelected.add(filePath);
        }
        setSelectedFiles(newSelected);
    };

    const selectAll = () => {
        if (selectedFiles.size === scanResults.length) {
            setSelectedFiles(new Set());
        } else {
            setSelectedFiles(new Set(scanResults.map(f => f.path)));
        }
    };

    const extractSelected = async () => {
        if (selectedFiles.size === 0) {
            toast.error('No files selected');
            return;
        }

        toast.info(`Extracting ${selectedFiles.size} files...`);

        // TODO: Implement bulk extraction
        // This would call the pull endpoint for each selected file
        // For now, show a placeholder message
        toast.success('Extraction Started', {
            description: `Processing ${selectedFiles.size} files. This may take a while.`
        });
    };

    const exportResults = (format: 'json' | 'csv') => {
        if (!scanMetadata) {
            toast.error('No scan results to export');
            return;
        }

        const dataStr = format === 'json'
            ? JSON.stringify(scanMetadata, null, 2)
            : convertToCSV(scanResults);

        const blob = new Blob([dataStr], { type: format === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `forensic_scan_${new Date().getTime()}.${format}`;
        link.click();
        URL.revokeObjectURL(url);

        toast.success(`Exported to ${format.toUpperCase()}`);
    };

    const convertToCSV = (data: ScanResult[]): string => {
        const headers = ['Name', 'Path', 'Size (bytes)', 'Permissions', 'SHA-256'];
        const rows = data.map(f => [
            f.name,
            f.path,
            f.size.toString(),
            f.permissions || '',
            f.sha256 || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(cell => `"${cell}"`).join(','))
            .join('\n');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="space-y-6">
            {/* Configuration Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-500" />
                        Forensic Scanner Configuration
                    </CardTitle>
                    <CardDescription>
                        Comprehensive device file system analysis with hash verification
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Scan Path */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Scan Path</label>
                        <Input
                            value={scanPath}
                            onChange={(e) => setScanPath(e.target.value)}
                            placeholder="/sdcard"
                        />
                    </div>

                    {/* File Type Selection */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">File Types</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {fileTypeOptions.map((type) => {
                                const Icon = type.icon;
                                const isSelected = selectedTypes.includes(type.id);
                                return (
                                    <div
                                        key={type.id}
                                        onClick={() => toggleFileType(type.id)}
                                        className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                ? 'border-primary bg-primary/10'
                                                : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <Checkbox checked={isSelected} />
                                        <Icon className="w-4 h-4" />
                                        <span className="text-sm">{type.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Advanced Options */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Max Depth</label>
                            <Input
                                type="number"
                                value={maxDepth}
                                onChange={(e) => setMaxDepth(parseInt(e.target.value) || 5)}
                                min={1}
                                max={20}
                            />
                        </div>
                        <div className="flex items-end">
                            <div
                                onClick={() => setCalculateHashes(!calculateHashes)}
                                className="flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer w-full"
                            >
                                <Checkbox checked={calculateHashes} />
                                <span className="text-sm">Calculate SHA-256 Hashes</span>
                            </div>
                        </div>
                    </div>

                    {/* Scan Button */}
                    <Button
                        onClick={startScan}
                        disabled={isScanning}
                        className="w-full"
                        size="lg"
                    >
                        {isScanning ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Scanning Device...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Start Forensic Scan
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results Panel */}
            {scanMetadata && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                Scan Results
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => exportResults('json')}>
                                    Export JSON
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => exportResults('csv')}>
                                    Export CSV
                                </Button>
                            </div>
                        </CardTitle>
                        <CardDescription>
                            Found {scanMetadata.total_files_found} files • {scanMetadata.total_size_mb} MB •
                            Scanned in {scanMetadata.scan_duration_seconds}s
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Bulk Actions */}
                        <div className="flex gap-2 mb-4">
                            <Button variant="outline" size="sm" onClick={selectAll}>
                                {selectedFiles.size === scanResults.length ? 'Deselect All' : 'Select All'}
                            </Button>
                            <Button
                                variant="default"
                                size="sm"
                                onClick={extractSelected}
                                disabled={selectedFiles.size === 0}
                            >
                                <Download className="w-3 h-3 mr-1" />
                                Extract Selected ({selectedFiles.size})
                            </Button>
                        </div>

                        {/* Results Table */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="max-h-[400px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="p-2 text-left w-8"></th>
                                            <th className="p-2 text-left">File Name</th>
                                            <th className="p-2 text-left">Size</th>
                                            {calculateHashes && <th className="p-2 text-left">SHA-256</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scanResults.map((file, idx) => (
                                            <tr
                                                key={idx}
                                                className="border-t hover:bg-accent cursor-pointer"
                                                onClick={() => toggleFileSelection(file.path)}
                                            >
                                                <td className="p-2">
                                                    <Checkbox checked={selectedFiles.has(file.path)} />
                                                </td>
                                                <td className="p-2 font-mono text-xs truncate max-w-[300px]">
                                                    {file.name}
                                                </td>
                                                <td className="p-2">{formatFileSize(file.size)}</td>
                                                {calculateHashes && (
                                                    <td className="p-2 font-mono text-xs text-green-500">
                                                        {file.sha256 ? file.sha256.substring(0, 16) + '...' : 'N/A'}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
