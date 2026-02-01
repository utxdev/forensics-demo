import React from 'react';
import { Phone, MessageCircle, Database, FileSearch } from 'lucide-react';

interface EvidenceSelectorProps {
    selections: any;
    setSelections: (data: any) => void;
}

const EvidenceSelector: React.FC<EvidenceSelectorProps> = ({ selections, setSelections }) => {
    const toggle = (key: string) => {
        setSelections({ ...selections, [key]: !selections[key] });
    };

    const categories = [
        { id: 'calls', label: 'Call Logs', icon: <Phone size={14} />, default: true },
        { id: 'chat', label: 'WhatsApp/Chat Logs', icon: <MessageCircle size={14} />, default: true },
        { id: 'deleted', label: 'Deleted Messages', icon: <FileSearch size={14} />, default: false },
        { id: 'system', label: 'System Logs', icon: <Database size={14} />, default: false },
    ];

    return (
        <div className="w-full space-y-4">
            <h3 className="text-amber-500 text-sm font-sans tracking-widest uppercase border-b border-amber-500/20 pb-2">
                SELECT EVIDENCE TO SEAL
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => (
                    <div
                        key={cat.id}
                        onClick={() => toggle(cat.id)}
                        className={`p-3 rounded border cursor-pointer transition-all flex items-center gap-3 ${selections[cat.id]
                            ? 'bg-amber-600/20 border-amber-500 text-white shadow-[0_0_10px_rgba(217,119,6,0.2)]'
                            : 'bg-black/40 border-white/5 text-white/40 grayscale hover:grayscale-0'
                            }`}
                    >
                        <div className={`p-2 rounded-full ${selections[cat.id] ? 'bg-amber-500 text-black' : 'bg-white/5'}`}>
                            {cat.icon}
                        </div>
                        <span className="text-sm font-semibold">{cat.label}</span>
                        {selections[cat.id] && <div className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default EvidenceSelector;
