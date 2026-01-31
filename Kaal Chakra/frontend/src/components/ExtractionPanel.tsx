import { useState } from 'react';
import { MapPin, Phone, MessageSquare, Loader2, Database, Map } from 'lucide-react';

const ExtractionPanel = () => {
    const [loading, setLoading] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

    const handleExtraction = async (type: 'all' | 'location' | 'backup' | 'maps') => {
        setLoading(type);
        setStatus('');

        try {
            let endpoint = 'http://localhost:5000/api/extract';

            if (type === 'location') {
                endpoint = 'http://localhost:5000/api/extract/location';
            } else if (type === 'backup') {
                endpoint = 'http://localhost:5000/api/extract/backup';
            } else if (type === 'maps') {
                endpoint = 'http://localhost:5000/api/extract/maps';
            }

            const response = await fetch(endpoint, { method: 'POST' });
            const data = await response.json();

            if (data.status === 'success') {
                setStatus(`✓ ${data.message}${data.events_found ? ` (${data.events_found} locations found)` : ''}`);

                // Reload the page to fetch new data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                setStatus(`✗ ${data.message}`);
            }
        } catch (error) {
            setStatus(`✗ Extraction failed: ${error}`);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-md border border-purple-500/30 rounded-lg p-4 min-w-[280px]">
            <h3 className="text-white font-bold mb-3 text-sm">Data Extraction</h3>

            <div className="space-y-2">
                <button
                    onClick={() => handleExtraction('maps')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-all shadow-lg"
                >
                    {loading === 'maps' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Map className="w-4 h-4" />
                    )}
                    Google Maps Location ⭐
                </button>

                <button
                    onClick={() => handleExtraction('backup')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-all"
                >
                    {loading === 'backup' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Database className="w-4 h-4" />
                    )}
                    Backup & Extract
                </button>

                <button
                    onClick={() => handleExtraction('location')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-all"
                >
                    {loading === 'location' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <MapPin className="w-4 h-4" />
                    )}
                    Extract Location Only
                </button>

                <button
                    onClick={() => handleExtraction('all')}
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-md text-sm font-medium transition-all"
                >
                    {loading === 'all' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Phone className="w-3 h-3" />
                            <MessageSquare className="w-3 h-3" />
                        </>
                    )}
                    Extract Calls & SMS
                </button>
            </div>

            {status && (
                <div className={`mt-3 text-xs p-2 rounded ${status.startsWith('✓')
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                    {status}
                </div>
            )}

            <div className="mt-3 text-xs text-gray-400 border-t border-gray-700 pt-2">
                <p className="font-bold text-yellow-400 mb-1">⭐ Google Maps (Best!):</p>
                <p>• Exact GPS coordinates</p>
                <p>• Destination history</p>
                <p>• Fast & reliable</p>
            </div>
        </div>
    );
};

export default ExtractionPanel;
