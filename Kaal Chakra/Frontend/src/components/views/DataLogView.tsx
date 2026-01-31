import React, { useState } from 'react';
import { useTimeStore } from '../../store/timeStore';
import type { MasterEvent } from '../../types';
import { Search, X } from 'lucide-react';

const DataLogView = () => {
    const events = useTimeStore((state) => state.events);
    const [selectedEvent, setSelectedEvent] = useState<MasterEvent | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEvents = events.filter(e =>
        e.contentPreview.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.eventType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full h-full flex flex-col bg-cosmic-dark text-cosmic-ivory p-4 overflow-hidden">
            {/* Search Bar */}
            <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl mb-4 border border-white/10">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-transparent border-none focus:outline-none flex-1 text-sm"
                />
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 text-xs font-bold text-cosmic-gold px-4 pb-2 border-b border-white/10 opacity-70">
                <div className="col-span-2">TIMESTAMP</div>
                <div className="col-span-1">TYPE</div>
                <div className="col-span-3">SOURCE</div>
                <div className="col-span-6">CONTENT</div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-cosmic-gold/20">
                {filteredEvents.map((event) => (
                    <div
                        key={event.id}
                        onClick={() => setSelectedEvent(event)}
                        className="grid grid-cols-12 gap-2 text-xs hover:bg-white/5 p-2 rounded cursor-pointer transition-colors border-l-2 border-transparent hover:border-cosmic-gold"
                    >
                        <div className="col-span-2 opacity-70 font-mono">
                            {new Date(event.timestamp).toLocaleString(undefined, {
                                month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                        </div>
                        <div className="col-span-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold
                ${event.eventType === 'log' ? 'bg-gray-800 text-gray-300' :
                                    event.eventType === 'call' ? 'bg-red-900/50 text-red-200' :
                                        event.eventType === 'sms' ? 'bg-green-900/50 text-green-200' :
                                            'bg-blue-900/50 text-blue-200'
                                }`}>
                                {event.eventType}
                            </span>
                        </div>
                        <div className="col-span-3 truncate opacity-60 font-mono text-[10px]">{event.sourceArtifact}</div>
                        <div className="col-span-6 truncate font-serif italic opacity-90">{event.contentPreview}</div>
                    </div>
                ))}
            </div>

            {/* Advanced View Drawer */}
            {selectedEvent && (
                <div className="absolute right-0 top-0 h-full w-96 bg-gray-900 border-l border-cosmic-gold/30 shadow-2xl p-6 overflow-y-auto transform transition-transform z-50">
                    <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                        <h2 className="text-xl text-cosmic-gold font-cinzel">Advanced View</h2>
                        <button onClick={() => setSelectedEvent(null)} className="hover:bg-white/10 p-1 rounded">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-500">Event ID</label>
                            <div className="font-mono text-xs">{selectedEvent.id}</div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-500">Timestamp</label>
                            <div className="font-mono">{new Date(selectedEvent.timestamp).toISOString()}</div>
                            <div className="text-xs opacity-50">Epoch: {selectedEvent.timestamp}</div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-500">Source</label>
                            <div className="font-mono break-all">{selectedEvent.sourceArtifact}</div>
                        </div>

                        <div>
                            <label className="text-xs uppercase tracking-widest text-gray-500">Content Preview</label>
                            <div className="p-2 bg-black/40 rounded text-sm font-serif italic">
                                {selectedEvent.contentPreview}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <label className="text-xs uppercase tracking-widest text-cosmic-gold mb-2 block">Raw Metadata</label>
                            <div className="space-y-2">
                                {Object.entries(selectedEvent.metadata || {}).map(([key, value]) => (
                                    <div key={key} className="text-xs group">
                                        <span className="text-gray-400 font-mono">{key}:</span>
                                        <span className="ml-2 text-white/80 font-mono break-all group-hover:text-white">
                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataLogView;
